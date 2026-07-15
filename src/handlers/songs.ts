import { HTTPRequest, HTTPResponse, jsonResponse, parseQuery } from '@songloft/plugin-sdk';

export function createSongsHandler() {
  return async (req: HTTPRequest): Promise<HTTPResponse> => {
    const query = parseQuery(req.query);
    const limit = parseInt(query.limit || '20', 10);
    const offset = parseInt(query.offset || '0', 10);

    try {
      const songs = await songloft.songs.list({ limit, offset });
      return jsonResponse({ songs: songs || [] });
    } catch (e: any) {
      return jsonResponse({ error: e.message || 'unknown error' }, 500);
    }
  };
}
