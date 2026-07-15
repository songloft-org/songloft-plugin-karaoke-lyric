import { Source, SongInfo, MultiLyrics, LyricsLine, LyricsWord } from '../types';
import { BaseSource } from './base';

export class LrclibSource implements BaseSource {
  source = Source.LRCLIB;

  async search(keyword: string, _page?: number): Promise<SongInfo[]> {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(keyword)}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'SongloftLyricPlugin/1.0' },
    });
    if (resp.status !== 200) return [];
    const data = await resp.json();
    return (data || []).map((item: any) => ({
      title: item.trackName || '',
      artist: item.artistName || '',
      album: item.albumName || '',
      duration: (item.duration || 0) * 1000,
      song_id: String(item.id || ''),
      mid: '',
      hash: '',
    }));
  }

  async getLyrics(info: SongInfo): Promise<MultiLyrics> {
    const params = new URLSearchParams({
      track_name: info.title,
      artist_name: info.artist,
      album_name: info.album || '',
      duration: String(Math.floor(info.duration / 1000)),
    });
    const url = `https://lrclib.net/api/get?${params.toString()}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'SongloftLyricPlugin/1.0' },
    });
    if (resp.status !== 200) return { orig: [] };
    const data = await resp.json();
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
  }
}
