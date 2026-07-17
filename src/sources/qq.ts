import { Source, SongInfo, MultiLyrics } from '../types';
import { BaseSource } from './base';
import { qrc2data } from '../parsers/qrc';
import { qrcDecryptHex } from '../crypto/qrc_des';
import { zlibInflate, hexFromBytes, utf8FromHex } from '../utils/zlib';
import { fetchWithRetry, readRespBody } from '../utils/fetch';

// QRC 加密 hex → QQ 私有 3DES 解密 → zlib 解压得到明文歌词（逐字 QRC 或回退逐行）。
// 注意：__go_zlib_inflate 返回的是 hex，需再转 UTF-8 才是可解析的歌词文本。
function qrcDecrypt(encryptedHex: string): string {
  const desDecrypted = qrcDecryptHex(encryptedHex);
  const hexData = hexFromBytes(desDecrypted);
  return utf8FromHex(zlibInflate(hexData));
}

const DOMAIN = 'u.y.qq.com';

export class QQSource implements BaseSource {
  source = Source.QM;
  private comm: any = {
    ct: 11,
    cv: '1003006',
    v: '1003006',
    os_ver: '15',
    phonetype: '24122RKC7C',
    rom: 'Redmi/miro/miro:15/AE3A.240806.005/OS2.0.105.0.VOMCNXM:user/release-keys',
    tmeAppID: 'qqmusiclight',
    nettype: 'NETWORK_WIFI',
    udid: '0',
  };
  private inited = false;

  private async init(): Promise<void> {
    if (this.inited) return;
    try {
      const data = await this.request('GetSession', 'music.getSession.session', {
        caller: 0,
        uid: '0',
        vkey: 0,
      });
      this.comm = {
        ...this.comm,
        uid: data.session.uid,
        sid: data.session.sid,
        userip: data.session.userip,
      };
      this.inited = true;
    } catch (e) {
      console.warn('[QQ] GetSession failed, proceeding without session:', e);
      this.inited = true;
    }
  }

  private async request(method: string, module: string, param: Record<string, any>): Promise<any> {
    const body = JSON.stringify({
      comm: this.comm,
      request: { method, module, param },
    });

    const resp = await fetchWithRetry(
      `https://${DOMAIN}/cgi-bin/musicu.fcg`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'okhttp/3.14.9',
        },
        body,
      },
      15000,
    );

    if (resp.status !== 200) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const raw = await readRespBody(resp);
    if (!raw) throw new Error('empty response');
    const json = JSON.parse(raw);
    if (json.code !== 0 || json.request?.code !== 0) {
      throw new Error(`API error: code=${json.code} reqCode=${json.request?.code}`);
    }
    return json.request.data;
  }

  private buildSearchId(): string {
    const a = (Math.random() * 20 + 1) | 0;
    const b = (Math.random() * 4194304) | 0;
    const c = Date.now() % 86400000;
    return String(a * 18014398509481984 + b * 4294967296 + c);
  }

  async search(keyword: string, _page?: number): Promise<SongInfo[]> {
    try {
      await this.init();

      const body = JSON.stringify({
        comm: this.comm,
        request: {
          method: 'DoSearchForQQMusicLite',
          module: 'music.search.SearchCgiService',
          param: {
            search_id: this.buildSearchId(),
            remoteplace: 'search.android.keyboard',
            query: keyword,
            search_type: 0,
            num_per_page: 10,
            page_num: 0,
            highlight: 0,
            nqc_flag: 0,
            page_id: 1,
            grp: 1,
          },
        },
      });

      const resp = await fetchWithRetry(
        `https://${DOMAIN}/cgi-bin/musicu.fcg`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'okhttp/3.14.9',
          },
          body,
        },
        15000,
      );

      if (resp.status !== 200) return [];
      const raw = await readRespBody(resp);
      if (!raw) { console.warn('[QQ] search empty response body'); return []; }
      const data = JSON.parse(raw);
      const bodyData = data?.request?.data?.body || data?.req?.data?.body;
      const songs = bodyData?.item_song || [];
      if (songs.length === 0) console.warn('[QQ] search returned empty, body keys:', Object.keys(bodyData || {}));

      return songs.map((item: any) => ({
        title: item.title || item.song_name || item.name || '',
        artist: (item.singer || []).map((s: any) => s.name || '').join('/'),
        album: item.album?.name || item.albumName || '',
        duration: (item.interval || 0) * 1000,
        song_id: String(item.id || item.mid || ''),
        mid: String(item.mid || ''),
        hash: '',
      }));
    } catch (e: any) {
      console.warn('[QQ] search error:', e.message || e);
      return [];
    }
  }

  async getLyrics(info: SongInfo): Promise<MultiLyrics> {
    try {
      const songId = parseInt(info.song_id || '0', 10);
      if (!songId) return { orig: [] };

      const albumName = btoa(unescape(encodeURIComponent(info.album || '')));
      const singerName = btoa(unescape(encodeURIComponent(info.artist)));
      const songName = btoa(unescape(encodeURIComponent(info.title)));

      const body = JSON.stringify({
        comm: this.comm,
        request: {
          method: 'GetPlayLyricInfo',
          module: 'music.musichallSong.PlayLyricInfo',
          param: {
            albumName,
            crypt: 1,
            ct: 19,
            cv: 2111,
            interval: Math.floor(info.duration / 1000),
            lrc_t: 0,
            qrc: 1,
            qrc_t: 0,
            roma: 1,
            roma_t: 0,
            singerName,
            songID: songId,
            songName,
            trans: 1,
            trans_t: 0,
            type: 0,
          },
        },
      });

      const resp = await fetchWithRetry(
        `https://${DOMAIN}/cgi-bin/musicu.fcg`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'okhttp/3.14.9',
          },
          body,
        },
        15000,
      );

      if (resp.status !== 200) return { orig: [] };
      const raw = await readRespBody(resp);
      if (!raw) { console.warn('[QQ] getLyrics empty response'); return { orig: [] }; }
      const data = JSON.parse(raw);
      const lyricData = data?.request?.data;
      if (!lyricData) return { orig: [] };

      const multi: MultiLyrics = { orig: [] };

      const processLyric = (lyricHex: string, targetKey: 'orig' | 'ts' | 'roma') => {
        if (!lyricHex || lyricHex === '0') return;
        try {
          const decrypted = qrcDecrypt(lyricHex);
          const parsed = qrc2data(decrypted);
          if (targetKey === 'orig') {
            multi.orig = parsed.data;
          } else if (targetKey === 'ts') {
            multi.ts = parsed.data;
          } else if (targetKey === 'roma') {
            multi.roma = parsed.data;
          }
        } catch (e) {
          console.warn(`[QQ] ${targetKey} decrypt failed:`, e);
        }
      };

      processLyric(lyricData.lyric, 'orig');
      processLyric(lyricData.trans, 'ts');
      processLyric(lyricData.roma, 'roma');

      return multi;
    } catch (e: any) {
      console.warn('[QQ] getLyrics error:', e.message || e);
      return { orig: [] };
    }
  }
}
