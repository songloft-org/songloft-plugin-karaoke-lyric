import { Source, SongInfo, MultiLyrics } from '../types';
import { BaseSource } from './base';
import { yrc2data } from '../parsers/yrc';
import { lrc2data } from '../parsers/lrc';
import { eapiParamsEncrypt, eapiResponseDecrypt } from '../crypto/eapi';

export class NetEaseSource implements BaseSource {
  source = Source.NE;
  private cookie = '';

  private async ensureAuth(): Promise<void> {
    if (this.cookie) return;
    try {
      const resp = await fetch(
        'https://interface.music.163.com/eapi/register/anonimous',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          body: `params=${encodeURIComponent(eapiParamsEncrypt('/eapi/register/anonimous', {}) as any)}`,
        },
      );
      const cookies = resp.headers.get('set-cookie') || '';
      this.cookie = cookies;
    } catch (e) {
      console.warn(`NetEase auth failed: ${e}`);
    }
  }

  async search(keyword: string, _page?: number): Promise<SongInfo[]> {
    await this.ensureAuth();
    const params = { s: keyword, type: 1, offset: 0, limit: 10 };
    const encrypted = eapiParamsEncrypt('/eapi/cloudsearch/pc', params);
    const url = 'https://interface.music.163.com/eapi/cloudsearch/pc';
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        Cookie: this.cookie,
      },
      body: `params=${encodeURIComponent(encrypted as any)}`,
    });
    if (resp.status !== 200) return [];
    const raw = await resp.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      try {
        const decrypted = eapiResponseDecrypt(raw);
        data = JSON.parse(decrypted);
      } catch {
        return [];
      }
    }
    const songs = data?.result?.songs || [];
    return songs.map((item: any) => ({
      title: item.name || '',
      artist: (item.artists || []).map((a: any) => a.name || '').join('/'),
      album: item.album?.name || '',
      duration: item.duration || 0,
      song_id: String(item.id || ''),
      mid: '',
      hash: '',
    }));
  }

  async getLyrics(info: SongInfo): Promise<MultiLyrics> {
    await this.ensureAuth();
    const params = { id: parseInt(info.song_id || '0', 10), lv: -1, tv: -1, rv: -1, yv: -1 };
    const encrypted = eapiParamsEncrypt('/eapi/song/lyric/v1', params);
    const url = 'https://interface.music.163.com/eapi/song/lyric/v1';
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        Cookie: this.cookie,
      },
      body: `params=${encodeURIComponent(encrypted as any)}`,
    });
    if (resp.status !== 200) return { orig: [] };
    const raw = await resp.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      try {
        const decrypted = eapiResponseDecrypt(raw);
        data = JSON.parse(decrypted);
      } catch {
        return { orig: [] };
      }
    }

    const multi: MultiLyrics = { orig: [] };

    if (data?.yrc?.lyric) {
      multi.orig = yrc2data(data.yrc.lyric);
    } else if (data?.lrc?.lyric) {
      multi.orig = lrc2data(data.lrc.lyric).data;
    }

    if (data?.tlyric?.lyric) {
      multi.ts = lrc2data(data.tlyric.lyric).data;
    }

    if (data?.romalrc?.lyric) {
      multi.roma = lrc2data(data.romalrc.lyric).data;
    }

    return multi;
  }
}
