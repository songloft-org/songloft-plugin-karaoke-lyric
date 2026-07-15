import type { HTTPRequest, HTTPResponse } from '@songloft/plugin-sdk';
import { SourceEngine } from './sources/engine';
import { createRouter } from './router';

const engine = new SourceEngine();
let router: ReturnType<typeof createRouter> | null = null;

async function onInit(): Promise<void> {
  engine.init();
  router = createRouter(engine);
  console.log('[Karaoke Lyric] 歌词刮削插件已启动');
}

async function onDeinit(): Promise<void> {
  router = null;
  console.log('[Karaoke Lyric] 歌词刮削插件已卸载');
}

async function onHTTPRequest(req: HTTPRequest): Promise<HTTPResponse> {
  if (!router) {
    return { statusCode: 503, body: 'Plugin not initialized' };
  }
  return await router.handle(req);
}

globalThis.onInit = onInit;
globalThis.onDeinit = onDeinit;
globalThis.onHTTPRequest = onHTTPRequest;
