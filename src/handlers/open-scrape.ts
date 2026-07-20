import { HTTPRequest, HTTPResponse, jsonResponse } from '@songloft/plugin-sdk';
import { SourceEngine } from '../sources/engine';
import { parseBody } from '../utils/host_api';
import { SOURCE_LABELS } from '../types';

export function createOpenScrapeHandler(engine: SourceEngine) {
  return async (req: HTTPRequest): Promise<HTTPResponse> => {
    const body = parseBody(req);
    const title = body.title || '';
    const artist = body.artist || '';
    const duration = parseInt(body.duration || '0', 10);

    if (!title) {
      return jsonResponse({ error: 'title is required' }, 400);
    }

    const result = await engine.scrapeBest(title, artist, duration);

    if (!result) {
      return jsonResponse({
        success: false,
        message: '未找到匹配的歌词',
      });
    }

    return jsonResponse({
      success: true,
      source: result.result.source,
      source_label: SOURCE_LABELS[result.result.source] || result.result.source,
      score: result.result.score,
      match_title: result.result.title,
      match_artist: result.result.artist,
      match_duration: result.result.duration,
      lyrics_type: result.lyrics.lyrics_type,
      line_count: result.lyrics.line_count,
      lyric: result.lyrics.lyric,
      tlyric: result.lyrics.tlyric,
      rlyric: result.lyrics.rlyric,
      lxlyric: result.lyrics.lxlyric,
    });
  };
}
