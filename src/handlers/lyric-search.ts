import { HTTPRequest, HTTPResponse, jsonResponse, parseQuery } from '@songloft/plugin-sdk';
import { SourceEngine } from '../sources/engine';

export function createLyricSearchHandler(engine: SourceEngine) {
  return async (req: HTTPRequest): Promise<HTTPResponse> => {
    const q = parseQuery(req.query);
    const title = q.title?.trim();
    const artist = q.artist?.trim() || '';
    const album = q.album?.trim() || '';
    const durationSec = parseFloat(q.duration || '0');
    const fingerprint = q.fingerprint || '';
    const isrc = q.isrc || '';

    if (!title) {
      return jsonResponse({ error: 'title is required' }, 400);
    }

    if (fingerprint || isrc) {
      songloft.log.info(`[lyric-search] fingerprint=${fingerprint} isrc=${isrc} 暂未用于匹配`);
    }

    const durationMs = Math.round(durationSec * 1000);
    const result = await engine.scrapeBest(title, artist, durationMs);

    if (!result) {
      return jsonResponse(null, 404);
    }

    return jsonResponse({
      lyric: result.lyrics.lyric,
      tlyric: result.lyrics.tlyric,
      rlyric: result.lyrics.rlyric,
      lxlyric: result.lyrics.lxlyric,
    });
  };
}
