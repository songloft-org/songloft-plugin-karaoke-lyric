import { Source, SongInfo, MultiLyrics } from '../types';
import { BaseSource } from './base';
import { krc2mdata } from '../parsers/krc';
import { krcDecrypt } from '../crypto/xor';
import { zlibInflate, hexFromBytes, utf8FromHex } from '../utils/zlib';
import { fetchWithRetry, readRespBody } from '../utils/fetch';

const SECRET = 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA';

function md5(str: string): string {
  return __go_crypto_md5(str);
}

function buildSignature(params: Record<string, any>, data?: string): string {
  const sorted = Object.keys(params).sort();
  const segments = sorted.map(k => {
    const v = params[k];
    if (typeof v === 'object') {
      return `${k}=${JSON.stringify(v)}`;
    }
    return `${k}=${v}`;
  });
  return md5(SECRET + segments.join('') + (data || '') + SECRET);
}

export class KuGouSource implements BaseSource {
  source = Source.KG;
  private dfid: string | null = null;

  private async init(): Promise<void> {
    if (this.dfid !== null) return;
    try {
      const mid = md5(String(Date.now()));
      const params: Record<string, any> = { appid: '1014', platid: '4', mid };
      const sortedVals = Object.values(params)
        .filter(v => v !== '')
        .sort() as string[];
      params.signature = md5(`1014${sortedVals.join('')}1014`);

      const queryStr = Object.keys(params)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');
      const bodyStr = btoa(JSON.stringify({ uuid: '' }));

      const resp = await fetchWithRetry(
        `https://userservice.kugou.com/risk/v1/r_register_dev?${queryStr}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: bodyStr,
        },
        15000,
      );
      if (resp.status === 200) {
        const raw = await readRespBody(resp);
        if (raw) {
          const json = JSON.parse(raw);
          this.dfid = json?.data?.dfid || null;
          if (!this.dfid) console.warn('[KG] register_dev returned no dfid');
        }
      }
    } catch (e: any) {
      console.warn('[KG] init failed:', e.message || e);
    }
    if (!this.dfid) this.dfid = '-';
  }

  private buildHeaders(module: string, mid: string): Record<string, string> {
    return {
      'User-Agent': `Android14-1070-11070-201-0-${module}-wifi`,
      'Connection': 'Keep-Alive',
      'KG-Rec': '1',
      'KG-RC': '1',
      'KG-CLIENTTIMEMS': String(Date.now()),
      'mid': mid,
    };
  }

  private async signedGet(url: string, params: Record<string, any>, module: string, extraHeaders?: Record<string, string>): Promise<Response> {
    const mid = md5(String(Date.now()));

    if (module === 'Lyric') {
      params = { appid: '3116', clientver: '11070', ...params };
    } else {
      params = {
        userid: '0', appid: '3116', token: '',
        clienttime: Math.floor(Date.now() / 1000),
        iscorrection: '1', uuid: '-', mid,
        dfid: this.dfid || '-',
        clientver: '11070', platform: 'AndroidFilter',
        ...params,
      };
    }

    params.signature = buildSignature(params);

    const queryStr = Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
      .join('&');

    const headers = { ...this.buildHeaders(module, mid), ...(extraHeaders || {}) };

    return fetchWithRetry(`${url}?${queryStr}`, { method: 'GET', headers }, 15000);
  }

  async search(keyword: string, _page?: number): Promise<SongInfo[]> {
    try {
      await this.init();

      const params: Record<string, any> = {
        sorttype: '0', keyword, pagesize: 20, page: 1,
      };

      const resp = await this.signedGet(
        'http://complexsearch.kugou.com/v2/search/song',
        params,
        'SearchSong',
        { 'x-router': 'complexsearch.kugou.com' },
      );

      if (resp.status !== 200) {
        console.warn(`[KG] complexsearch status ${resp.status}, trying old API`);
        return this.oldSearch(keyword);
      }

      const complexRaw = await readRespBody(resp);
      if (!complexRaw) { console.warn('[KG] complexsearch empty response, trying old API'); return this.oldSearch(keyword); }
      const data = JSON.parse(complexRaw);
      if (data.error_code && data.error_code !== 0 && data.error_code !== 200) {
        console.warn(`[KG] complexsearch error ${data.error_code}, trying old API`);
        return this.oldSearch(keyword);
      }

      const songs = data?.data?.lists || [];
      if (songs.length === 0) console.warn('[KG] search returned empty');

      return songs.map((item: any) => ({
        title: item.SongName || '',
        artist: (item.Singers || []).map((s: any) => s.name || '').join('/'),
        album: item.AlbumName || '',
        duration: (item.Duration || 0) * 1000,
        song_id: String(item.ID || item.SongID || ''),
        mid: '',
        hash: String(item.FileHash || ''),
      }));
    } catch (e: any) {
      console.warn('[KG] search error:', e.message || e);
      return [];
    }
  }

  private async oldSearch(keyword: string): Promise<SongInfo[]> {
    try {
      const domain = 'mobiles.kugou.com';
      const params = new URLSearchParams({
        showtype: '14', highlight: '', pagesize: '30', tag_aggr: '1',
        plat: '0', sver: '5', keyword, correct: '1', api_ver: '1',
        version: '9108', page: '1',
      });
      const resp = await fetchWithRetry(
        `http://${domain}/api/v3/search/song?${params.toString()}`,
        { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } },
        10000,
      );
      if (resp.status !== 200) return [];
      const raw = await readRespBody(resp);
      if (!raw) return [];
      const data = JSON.parse(raw);
      const songs = data?.data?.info || [];
      return songs.map((item: any) => ({
        title: item.songname || '',
        artist: item.singername || '',
        album: item.album_name || '',
        duration: (item.duration || 0) * 1000,
        song_id: String(item.album_audio_id || ''),
        mid: '',
        hash: String(item.hash || ''),
      }));
    } catch (e: any) {
      console.warn('[KG] oldSearch error:', e.message || e);
      return [];
    }
  }

  async getLyrics(info: SongInfo): Promise<MultiLyrics> {
    try {
      await this.init();

      const keyword = `${info.artist} - ${info.title}`;
      const searchParams: Record<string, any> = {
        album_audio_id: info.song_id || '0',
        duration: Math.floor(info.duration / 1000),
        hash: info.hash || '',
        keyword,
        lrctxt: '1',
        man: 'no',
      };

      const searchResp = await this.signedGet(
        'https://lyrics.kugou.com/v1/search',
        searchParams,
        'Lyric',
      );

      if (searchResp.status !== 200) return { orig: [] };
      const searchRaw = await readRespBody(searchResp);
      if (!searchRaw) return { orig: [] };
      const searchData = JSON.parse(searchRaw);
      const candidates = searchData?.candidates || [];
      if (candidates.length === 0) return { orig: [] };

      const candidate = candidates[0];
      const dlParams: Record<string, any> = {
        accesskey: candidate.accesskey,
        charset: 'utf8',
        client: 'mobi',
        fmt: 'krc',
        id: candidate.id,
        ver: '1',
      };

      const dlResp = await this.signedGet(
        'http://lyrics.kugou.com/download',
        dlParams,
        'Lyric',
      );

      if (dlResp.status !== 200) return { orig: [] };
      const dlRaw = await readRespBody(dlResp);
      if (!dlRaw) return { orig: [] };
      const dlData = JSON.parse(dlRaw);
      if (!dlData.content) return { orig: [] };

      const binaryStr = atob(dlData.content);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const xored = krcDecrypt(bytes.slice(4));
      const hexData = hexFromBytes(xored);
      // __go_zlib_inflate 返回 hex，需转 UTF-8 才是可解析的 KRC 文本。
      const decompressed = utf8FromHex(zlibInflate(hexData));

      const { multi } = krc2mdata(decompressed);
      return multi;
    } catch (e: any) {
      console.warn('[KG] getLyrics error:', e.message || e);
      return { orig: [] };
    }
  }
}
