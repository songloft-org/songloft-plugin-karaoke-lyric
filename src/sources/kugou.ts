import { Source, SongInfo, MultiLyrics } from '../types';
import { BaseSource } from './base';
import { krc2mdata } from '../parsers/krc';
import { krcDecrypt } from '../crypto/xor';
import { zlibInflate, hexFromBytes } from '../utils/zlib';

export class KuGouSource implements BaseSource {
  source = Source.KG;

  async search(keyword: string, _page?: number): Promise<SongInfo[]> {
    const url = `https://complexsearch.kugou.com/v2/search/song?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=10&platform=Web&tag=1`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'x-router': 'complexsearch.kugou.com',
      },
    });
    if (resp.status !== 200) return [];
    const data = await resp.json();
    const songs = data?.data?.lists || [];
    return songs.map((item: any) => ({
      title: item.SongName || '',
      artist: item.SingerName || '',
      album: item.AlbumName || '',
      duration: (item.Duration || 0) * 1000,
      song_id: String(item.ID || item.SongID || ''),
      mid: '',
      hash: String(item.FileHash || ''),
    }));
  }

  async getLyrics(info: SongInfo): Promise<MultiLyrics> {
    const searchUrl = `https://lyrics.kugou.com/v1/search?album_audio_id=&duration=${Math.floor(info.duration / 1000)}&hash=${info.hash}&keyword=${encodeURIComponent(info.artist + ' - ' + info.title)}`;
    const searchResp = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (searchResp.status !== 200) return { orig: [] };
    const searchData = await searchResp.json();
    const candidates = searchData?.data || [];
    if (candidates.length === 0) return { orig: [] };

    const candidate = candidates[0];
    const downloadUrl = `http://lyrics.kugou.com/download?ver=1&client=pc&id=${candidate.id}&accesskey=${candidate.accesskey}&fmt=krc&charset=utf8`;
    const dlResp = await fetch(downloadUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (dlResp.status !== 200) return { orig: [] };
    const dlData = await dlResp.json();
    if (!dlData.content) return { orig: [] };

    const binaryStr = atob(dlData.content);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const xored = krcDecrypt(bytes);
    const hexData = hexFromBytes(xored);
    const decompressed = zlibInflate(hexData);

    const { multi } = krc2mdata(decompressed);
    return multi;
  }
}
