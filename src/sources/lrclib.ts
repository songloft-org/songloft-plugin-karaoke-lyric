import { Source, SongInfo, MultiLyrics, LyricsLine, LyricsWord } from '../types';
import { BaseSource } from './base';
import { fetchWithRetry, readRespBody } from '../utils/fetch';

export class LrclibSource implements BaseSource {
  source = Source.LRCLIB;

  async search(keyword: string, _page?: number): Promise<SongInfo[]> {
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(keyword)}`;
      const resp = await fetchWithRetry(url, {
        headers: { 'User-Agent': 'SongloftLyricPlugin/1.0' },
      });
      if (resp.status !== 200) return [];
      const raw = await readRespBody(resp);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return (data || []).map((item: any) => ({
        title: item.trackName || '',
        artist: item.artistName || '',
        album: item.albumName || '',
        duration: (item.duration || 0) * 1000,
        song_id: String(item.id || ''),
        mid: '',
        hash: '',
      }));
    } catch (e: any) {
      console.warn('[Lrclib] search error:', e.message || e);
      return [];
    }
  }

  async getLyrics(info: SongInfo): Promise<MultiLyrics> {
    try {
      const params = new URLSearchParams({
        track_name: info.title,
        artist_name: info.artist,
        album_name: info.album || '',
        duration: String(Math.floor(info.duration / 1000)),
      });
      const url = `https://lrclib.net/api/get?${params.toString()}`;
      const resp = await fetchWithRetry(url, {
        headers: { 'User-Agent': 'SongloftLyricPlugin/1.0' },
      });
      if (resp.status !== 200) return { orig: [] };
      const raw = await readRespBody(resp);
      if (!raw) return { orig: [] };
      const data = JSON.parse(raw);
      const orig: LyricsLine[] = [];
      if (data.syncedLyrics) {
        const lines = data.syncedLyrics.split('\n');
        for (const line of lines) {
          const m = /^\[(\d+):(\d+)\.(\d+)\](.*)$/.exec(line.trim());
          if (!m) continue;
          const min = parseInt(m[1], 10);
          const sec = parseInt(m[2], 10);
          const cs = parseInt(m[3].padEnd(3, '0').slice(0, 3), 10);
          const startMs = min * 60000 + sec * 1000 + cs;
          const text = m[4].trim();
          if (text) {
            orig.push({ start: startMs, end: null, words: [{ start: startMs, end: null, text }] });
          }
        }
      } else if (data.plainLyrics) {
        const lines = data.plainLyrics.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            orig.push({ start: null, end: null, words: [{ start: null, end: null, text: line.trim() }] });
          }
        }
      }
      return { orig };
    } catch (e: any) {
      console.warn('[Lrclib] getLyrics error:', e.message || e);
      return { orig: [] };
    }
  }
}
