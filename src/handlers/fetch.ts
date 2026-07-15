import { HTTPRequest, HTTPResponse, jsonResponse } from '@songloft/plugin-sdk';
import { SourceEngine } from '../sources/engine';
import { parseBody } from '../utils/host_api';
import { Source, SOURCE_LABELS } from '../types';

export function createFetchHandler(engine: SourceEngine) {
  return async (req: HTTPRequest): Promise<HTTPResponse> => {
    const body = parseBody(req);
    const source = body.source as Source;
    if (!source) {
      return jsonResponse({ error: 'source is required' }, 400);
    }

    const lyrics = await engine.fetchLyrics(source, {
      title: body.title || '',
      artist: body.artist || '',
      album: body.album || '',
      duration: body.duration || 0,
      song_id: body.song_id || '',
      mid: body.mid || '',
      hash: body.hash || '',
    });

    if (!lyrics) {
      return jsonResponse({ error: 'failed to fetch lyrics' }, 404);
    }

    return jsonResponse(lyrics);
  };
}
