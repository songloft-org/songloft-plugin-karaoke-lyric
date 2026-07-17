import { HTTPRequest, HTTPResponse, jsonResponse, parseQuery } from '@songloft/plugin-sdk';
import type { Song } from '@songloft/plugin-sdk';

function textIncludes(val: unknown, keyword: string): boolean {
  if (typeof val !== 'string') return false;
  return val.toLocaleLowerCase().includes(keyword);
}

export function createSongsHandler() {
  return async (req: HTTPRequest): Promise<HTTPResponse> => {
    const query = parseQuery(req.query);
    const limit = parseInt(query.limit || '20', 10);
    const offset = parseInt(query.offset || '0', 10);
    const keyword = (query.keyword || '').trim().toLocaleLowerCase();
    const noLyrics = query.no_lyrics === '1';

    try {
      const all = await songloft.songs.list({ limit: 100000 }) || [];

      let filtered: Song[] = all.filter(s => s.type !== 'radio');

      if (keyword) {
        filtered = filtered.filter(s =>
          textIncludes(s.title, keyword) ||
          textIncludes(s.artist, keyword)
        );
      }

      if (noLyrics) {
        filtered = filtered.filter(s =>
          !s.lyric_url && !(s as any).lyric
        );
      }

      const total = filtered.length;
      const songs = filtered.slice(offset, offset + limit);

      return jsonResponse({ songs, total });
    } catch (e: any) {
      return jsonResponse({ error: e.message || 'unknown error' }, 500);
    }
  };
}
