import { LyricPayload } from '../types';

let hostUrlCache: string | null = null;
let tokenCache: string | null = null;

async function refreshAuth(): Promise<void> {
  const [url, tkn] = await Promise.all([
    songloft.plugin.getHostUrl(),
    songloft.plugin.getToken(),
  ]);
  hostUrlCache = url;
  tokenCache = tkn;
}

export async function getHostUrl(): Promise<string> {
  if (!hostUrlCache) await refreshAuth();
  return hostUrlCache!;
}

export async function getToken(): Promise<string> {
  if (!tokenCache) await refreshAuth();
  return tokenCache!;
}

export async function attachLyricsToSong(
  songId: number,
  payload: LyricPayload,
): Promise<boolean> {
  try {
    const hostUrl = await getHostUrl();
    const token = await getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const body: Record<string, string> = {
      lyric_source: payload.lyric_source || 'scraped',
      lyric: payload.lyric || '',
    };
    if (payload.tlyric) body.tlyric = payload.tlyric;
    if (payload.rlyric) body.rlyric = payload.rlyric;
    if (payload.lxlyric) body.lxlyric = payload.lxlyric;
    const resp = await fetch(`${hostUrl}/api/v1/songs/${songId}/lyrics`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return resp.status === 200;
  } catch (e) {
    console.error(`attachLyrics failed: ${e}`);
    return false;
  }
}

export function parseBody(req: { body: Uint8Array | null }): any {
  if (!req.body) return {};
  try {
    const str = typeof req.body === 'string'
      ? req.body
      : String.fromCharCode.apply(null, Array.from(req.body as Uint8Array));
    return JSON.parse(str);
  } catch {
    return {};
  }
}
