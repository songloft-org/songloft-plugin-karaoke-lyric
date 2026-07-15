import { Source, SongInfo, MultiLyrics } from '../types';
import { BaseSource } from './base';
import { qrc2data } from '../parsers/qrc';
import { tripledesDecrypt } from '../crypto/tripledes';
import { qmc1Decrypt } from '../crypto/qmc1';
import { zlibInflate, hexFromBytes } from '../utils/zlib';

const TRIPLE_DES_KEY = (() => {
  const str = '!@#)(*$%123ZXC!@!@#)(NHL';
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return buf;
})();

function qrcDecrypt(encryptedBase64: string, qrcType: number): string {
  const binaryStr = atob(encryptedBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  let data: Uint8Array = bytes;
  if (qrcType === 0) {
    data = qmc1Decrypt(data);
    data = data.slice(11);
  }

  const desDecrypted = tripledesDecrypt(data, TRIPLE_DES_KEY) as Uint8Array<ArrayBuffer>;
  const hexData = hexFromBytes(desDecrypted);
  return zlibInflate(hexData);
}

export class QQSource implements BaseSource {
  source = Source.QM;

  async search(keyword: string, _page?: number): Promise<SongInfo[]> {
    const url = 'https://u.y.qq.com/cgi-bin/musicu.fcg';
    const body = {
      comm: { ct: 11, cv: 2008001, uid: 0 },
      req: {
        method: 'DoSearchForQQMusicLite',
        module: 'music.search.SearchCgiService',
        param: { query: keyword, search_type: 0, page_num: 0, page_size: 10 },
      },
    };
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'QQ音乐/8.0' },
      body: JSON.stringify(body),
    });
    if (resp.status !== 200) return [];
    const data = await resp.json();
    const songList = data?.req?.data?.body?.song?.list || [];
    return songList.map((item: any) => ({
      title: item.title || '',
      artist: (item.singer || []).map((s: any) => s.name || '').join('/'),
      album: item.album?.name || item.albumName || '',
      duration: (item.interval || 0) * 1000,
      song_id: String(item.mid || item.id || ''),
      mid: String(item.mid || ''),
      hash: '',
    }));
  }

  async getLyrics(info: SongInfo): Promise<MultiLyrics> {
    const albumB64 = btoa(unescape(encodeURIComponent(info.album || '')));
    const singerB64 = btoa(unescape(encodeURIComponent(info.artist)));
    const songB64 = btoa(unescape(encodeURIComponent(info.title)));

    const url = 'https://u.y.qq.com/cgi-bin/musicu.fcg';
    const body = {
      comm: { ct: 11, cv: 2008001, uid: 0 },
      req: {
        method: 'GetPlayLyricInfo',
        module: 'music.musichallSong.PlayLyricInfo',
        param: {
          albumName: albumB64,
          singerName: singerB64,
          songName: songB64,
          songMid: info.mid || info.song_id,
          duration: Math.floor(info.duration / 1000),
          type: 0,
          qrc: 1,
          qrcType: 1,
        },
      },
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'QQ音乐/8.0' },
      body: JSON.stringify(body),
    });
    if (resp.status !== 200) return { orig: [] };
    const data = await resp.json();
    const lyricData = data?.req?.data;
    if (!lyricData) return { orig: [] };

    const multi: MultiLyrics = { orig: [] };

    if (lyricData.lyric) {
      try {
        const decrypted = qrcDecrypt(lyricData.lyric, 1);
        const parsed = qrc2data(decrypted);
        multi.orig = parsed.data;
      } catch (e) {
        console.warn('[QQ] lyric decrypt failed:', e);
      }
    }

    if (lyricData.trans) {
      try {
        const decrypted = qrcDecrypt(lyricData.trans, 1);
        const parsed = qrc2data(decrypted);
        multi.ts = parsed.data;
      } catch (e) {
        console.warn('[QQ] trans decrypt failed:', e);
      }
    }

    if (lyricData.roma) {
      try {
        const decrypted = qrcDecrypt(lyricData.roma, 1);
        const parsed = qrc2data(decrypted);
        multi.roma = parsed.data;
      } catch (e) {
        console.warn('[QQ] roma decrypt failed:', e);
      }
    }

    return multi;
  }
}
