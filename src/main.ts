import type { HTTPRequest, HTTPResponse } from '@songloft/plugin-sdk';
import { jsonResponse } from '@songloft/plugin-sdk';
import { SourceEngine } from './sources/engine';
import { createRouter } from './router';

const CONFIG_KEY = 'lyric_provider_config';
const engine = new SourceEngine();
let router: ReturnType<typeof createRouter> | null = null;
let providerRegistered = false;

async function loadProviderConfig(): Promise<boolean> {
  try {
    const val = await songloft.storage.get(CONFIG_KEY);
    return val === true;
  } catch {
    return false;
  }
}

async function setProviderConfig(enabled: boolean): Promise<void> {
  await songloft.storage.set(CONFIG_KEY, enabled);
  if (enabled && !providerRegistered) {
    songloft.lyrics.registerProvider();
    providerRegistered = true;
    console.log('[Karaoke Lyric] 已注册为歌词提供者');
  } else if (!enabled && providerRegistered) {
    songloft.lyrics.unregisterProvider();
    providerRegistered = false;
    console.log('[Karaoke Lyric] 已取消注册歌词提供者');
  }
}

function parseBody(req: HTTPRequest): any {
  if (!req.body) return {};
  const str = typeof req.body === 'string'
    ? req.body
    : String.fromCharCode.apply(null, Array.from(req.body as Uint8Array));
  return JSON.parse(str);
}

async function onInit(): Promise<void> {
  engine.init();
  router = createRouter(engine);
  const enabled = await loadProviderConfig();
  if (enabled) {
    songloft.lyrics.registerProvider();
    providerRegistered = true;
    console.log('[Karaoke Lyric] 已注册为歌词提供者');
  }
  console.log('[Karaoke Lyric] 歌词刮削插件已启动');
}

async function onDeinit(): Promise<void> {
  if (providerRegistered) {
    songloft.lyrics.unregisterProvider();
    providerRegistered = false;
  }
  router = null;
  console.log('[Karaoke Lyric] 歌词刮削插件已卸载');
}

async function onHTTPRequest(req: HTTPRequest): Promise<HTTPResponse> {
  const path = (req.path || '').replace(/\/+$/, '') || '/';
  if (path === '/provider-config') {
    if (req.method === 'GET') {
      return jsonResponse({ enabled: await loadProviderConfig() });
    }
    if (req.method === 'PUT') {
      const body = parseBody(req);
      await setProviderConfig(!!body.enabled);
      return jsonResponse({ enabled: !!body.enabled });
    }
    return jsonResponse({ error: 'method not allowed' }, 405);
  }

  if (!router) {
    return { statusCode: 503, body: 'Plugin not initialized' };
  }
  return await router.handle(req);
}

globalThis.onInit = onInit;
globalThis.onDeinit = onDeinit;
globalThis.onHTTPRequest = onHTTPRequest;
