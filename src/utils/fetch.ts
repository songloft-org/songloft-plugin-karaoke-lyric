// 对宿主注入的全局 fetch（真异步，Go 侧 goroutine 跑 HTTP）做一层封装：
// - 超时：宿主 fetch 无 AbortController，改用 Go 侧认得的 X-Fetch-Timeout-Ms 头
//   （runtime.go 里裁剪到 100–30000ms）让超时真正落到底层请求。
// - 重试：网络抖动时按 retries 次重试后抛出最后一次错误。
// - readRespBody：宿主对文本响应给 body 字符串、对二进制响应只给 bodyHex，
//   这里统一还原为字符串。注意：请求侧不要手动设 Accept-Encoding，交给 Go
//   Transport 自建 gzip 并透明解压（宿主没有 gzip 解压桥接）。

type FetchInit = Parameters<typeof fetch>[1];

function withTimeoutHeader(init: FetchInit, timeoutMs: number): FetchInit {
  const headers: Record<string, string> = {
    ...((init && (init.headers as Record<string, string>)) || {}),
    'X-Fetch-Timeout-Ms': String(timeoutMs),
  };
  return { ...(init || {}), headers };
}

export async function fetchWithRetry(
  url: string,
  init?: FetchInit,
  timeoutMs = 15000,
  retries = 2,
): Promise<Response> {
  const finalInit = withTimeoutHeader(init, timeoutMs);
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, finalInit);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function readRespBody(resp: Response): Promise<string> {
  // 文本响应：宿主直接给 body 字符串。
  const text = await resp.text();
  if (text) return text;
  // 二进制响应：宿主只给 bodyHex，text() 返回空串——从 arrayBuffer 还原为 UTF-8。
  const buf = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);
  if (bytes.length === 0) return '';
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return __go_buffer_to_string(hex, 'utf-8');
}
