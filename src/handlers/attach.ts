import { HTTPRequest, HTTPResponse, jsonResponse } from '@songloft/plugin-sdk';
import { parseBody, attachLyricsToSong } from '../utils/host_api';
import { LyricPayload } from '../types';

export function createAttachHandler() {
  return async (req: HTTPRequest): Promise<HTTPResponse> => {
    const body = parseBody(req);
    const songId = parseInt(body.song_id, 10);
    if (!songId || isNaN(songId)) {
      return jsonResponse({ error: 'song_id is required' }, 400);
    }

    const payload: LyricPayload = {
      lyric: body.lyric || '',
    };
    if (body.tlyric) payload.tlyric = body.tlyric;
    if (body.rlyric) payload.rlyric = body.rlyric;
    if (body.lxlyric) payload.lxlyric = body.lxlyric;

    const success = await attachLyricsToSong(songId, payload);
    if (!success) {
      return jsonResponse({ error: 'failed to attach lyrics' }, 500);
    }

    return jsonResponse({ success: true, message: '歌词已关联' });
  };
}
