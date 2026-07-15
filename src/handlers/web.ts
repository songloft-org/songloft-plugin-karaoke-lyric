import { HTTPResponse } from '@songloft/plugin-sdk';

let cachedHtml: string | null = null;

export function createWebHandler() {
  return async (): Promise<HTTPResponse> => {
    if (!cachedHtml) {
      try {
        cachedHtml = await songloft.fs.readFile('index.html') as string;
      } catch {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'text/plain' },
          body: 'Web UI not found',
        };
      }
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: cachedHtml,
    };
  };
}
