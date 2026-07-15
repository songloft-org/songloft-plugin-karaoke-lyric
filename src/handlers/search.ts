import { HTTPRequest, HTTPResponse, jsonResponse, parseQuery } from '@songloft/plugin-sdk';
import { SourceEngine } from '../sources/engine';
import { SOURCE_LABELS } from '../types';

export function createSearchHandler(engine: SourceEngine) {
  return async (req: HTTPRequest): Promise<HTTPResponse> => {
    const query = parseQuery(req.query);
    const title = query.title || '';
    const artist = query.artist || '';
    const duration = parseInt(query.duration || '0', 10);

    if (!title) {
      return jsonResponse({ error: 'title is required' }, 400);
    }

    const results = await engine.searchAll(title, artist, duration);
    const labeled = results.map(r => ({
      ...r,
      source_label: SOURCE_LABELS[r.source] || r.source,
    }));

    return jsonResponse({ results: labeled, keyword: `${title} ${artist}`.trim() });
  };
}
