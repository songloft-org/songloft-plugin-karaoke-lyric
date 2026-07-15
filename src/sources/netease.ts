import { Source, SongInfo, MultiLyrics } from '../types';
import { BaseSource } from './base';
import { yrc2data } from '../parsers/yrc';
import { lrc2data } from '../parsers/lrc';
import { eapiParamsEncrypt, eapiResponseDecrypt } from '../crypto/eapi';
import { bytesFromHex } from '../utils/zlib';
import { fetchWithRetry } from '../utils/fetch';

const DEVICE_IDS = [
  'AA9955F5FE37BA7EAF48F8EF0C9966B28293CC8D6415CCD93549',
  'C4BE5BA8E337E26A1ECA938DAF7DDC6D99AA353D9E2E69F5DE2A',
  '2A6626990ED0B095ADBF14D63D91C6F8AE4CF352FF9BD1FE724E',
  '184117F946D9CF013300B74BAAFF42C04B74CE59EDA3A7B31C8E',
  '7051B0BEB96D5DC0DA8C17A034008DE086A21AB833EA41D321FF',
  '90D08AFA4FD3368D3ADD9C7BEB9D40B38066E55B4B2E9C123A26',
  '562D59EA36DB06BACE1D74A3735A7EC9753DED5BA380C2630439',
  '313CD3C6D39148E94A6CD885B40E7C489AC9504078A7513928CE',
  '75A3F0910D5A5A70B0E8BB9A084FBC672CBE8383CEDFC3C84AD2',
  '1AA1EEF80388FDD6FDB1696B84E8AE793DA9CAF444BF2277751F',
  '8DD5CA9A732199E7A3ADC4B5A3F43F00175273F8D18769CED397',
  'A998DD126BFDE300C1C6D2339BA9BA7936E5E31D38FE53E738C8',
  'F3E759572453849BB7705F232EBC44F6D40958F20DA9E33A27C7',
  '23667E54F134DA78658E73673931BCC5B1B66D64EB531633FB5E',
  '689C97934EB38AD53A7055A7E069BB8FA03064E05444E1F4416D',
];

const DEVICEID_XOR_KEY = '3go8&$8*3*3h0k(2)2';

const MOTHERBOARD_MODELS = [
  'MS-iCraft B760M WIFI',
  'ASUS ROG STRIX Z790',
  'MSI MAG B550 TOMAHAWK',
  'ASRock X670E Taichi',
];

const STORAGE_KEY = 'ne_auth_cache';

function randHex(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += ((Math.random() * 16) | 0).toString(16);
  }
  return s;
}

function randUppercase(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < len; i++) {
    s += chars[(Math.random() * chars.length) | 0];
  }
  return s;
}

function randItem<T>(arr: T[]): T {
  return arr[(Math.random() * arr.length) | 0];
}

function getAnonymousUsername(deviceId: string): string {
  let xored = '';
  for (let i = 0; i < deviceId.length; i++) {
    xored += String.fromCharCode(
      deviceId.charCodeAt(i) ^ DEVICEID_XOR_KEY.charCodeAt(i % DEVICEID_XOR_KEY.length),
    );
  }
  const md5Hex = __go_crypto_md5(xored);
  const md5Bytes = bytesFromHex(md5Hex);
  const base64Md5 = btoa(String.fromCharCode(...md5Bytes));
  const combined = `${deviceId} ${base64Md5}`;
  return btoa(combined);
}

function makeParamsHeader(cookies: Record<string, string>): string {
  return JSON.stringify({
    clientSign: cookies.clientSign || '',
    os: cookies.os || '',
    appver: cookies.appver || '',
    deviceId: cookies.deviceId || '',
    requestId: 0,
    osver: cookies.osver || '',
  });
}

export class NetEaseSource implements BaseSource {
  source = Source.NE;
  private cookies: Record<string, string> = {};
  private userId: string = '';
  private inited = false;

  private async loadCache(): Promise<boolean> {
    try {
      const raw = await songloft.storage.get(STORAGE_KEY);
      if (!raw) return false;
      const cached = JSON.parse(raw as string);
      if (cached && cached.expire > Math.floor(Date.now() / 1000)) {
        this.cookies = cached.cookies || {};
        this.userId = cached.userId || '';
        this.inited = true;
        return true;
      }
    } catch (_) {}
    return false;
  }

  private async saveCache(): Promise<void> {
    try {
      await songloft.storage.set(STORAGE_KEY, JSON.stringify({
        cookies: this.cookies,
        userId: this.userId,
        expire: Math.floor(Date.now() / 1000) + 864000,
      }));
    } catch (_) {}
  }

  private async ensureAuth(): Promise<void> {
    if (this.inited) return;

    if (await this.loadCache()) return;

    try {
      const macParts: string[] = [];
      for (let i = 0; i < 6; i++) {
        macParts.push(((Math.random() * 255) | 0).toString(16).padStart(2, '0').toUpperCase());
      }
      const mac = macParts.join(':');
      const randomStr = randUppercase(8);
      const hashPart = randHex(64);
      const clientSign = `${mac}@@@${randomStr}@@@@@@${hashPart}`;

      const deviceId = randItem(DEVICE_IDS);
      const osver = `Microsoft-Windows-10--build-${200 + ((Math.random() * 100) | 0)}00-64bit`;
      const appver = '3.1.3.203419';
      const mode = randItem(MOTHERBOARD_MODELS);

      const preCookies: Record<string, string> = {
        os: 'pc',
        deviceId,
        osver,
        clientSign,
        channel: 'netease',
        mode,
        appver,
      };

      const authParams: Record<string, any> = {
        username: getAnonymousUsername(deviceId),
        e_r: true,
        header: makeParamsHeader(preCookies),
      };

      const encrypted = eapiParamsEncrypt('/eapi/register/anonimous', authParams);

      const resp = await fetchWithRetry(
        'https://interface.music.163.com/eapi/register/anonimous',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164 NeteaseMusicDesktop/3.1.3.203419',
            'Referer': 'https://music.163.com/',
          },
          body: `params=${encrypted}`,
        },
        15000,
      );

      if (resp.status !== 200) {
        console.warn(`[NE] auth status ${resp.status}`);
        this.inited = true;
        return;
      }

      const data = await this.parseResponse(resp);
      if (!data) {
        console.warn('[NE] auth returned empty response');
        this.inited = true;
        return;
      }

      const headerCookies = this.extractCookies(resp);

      const wnMcid = `${randUppercase(6).toLowerCase()}.${Date.now() - ((Math.random() * 10000) | 0)}.01.0`;

      this.cookies = {
        WEVNSM: '1.0.0',
        os: preCookies.os,
        deviceId: preCookies.deviceId,
        osver: preCookies.osver,
        clientSign: preCookies.clientSign,
        channel: 'netease',
        mode: preCookies.mode,
        appver: preCookies.appver,
        ...headerCookies,
        WNMCID: wnMcid,
      };

      const cleanCookies: Record<string, string> = {};
      for (const [k, v] of Object.entries(this.cookies)) {
        if (v) cleanCookies[k] = v;
      }
      this.cookies = cleanCookies;
      this.userId = data?.userId || '';

      await this.saveCache();
      this.inited = true;
    } catch (e: any) {
      console.warn(`[NE] auth failed: ${e.message || e}`);
      this.inited = true;
    }
  }

  private extractCookies(resp: Response): Record<string, string> {
    const result: Record<string, string> = {};
    try {
      const rawHeaders = (resp.headers as any);
      if (typeof rawHeaders.forEach === 'function') {
        rawHeaders.forEach((v: string, k: string) => {
          if (k.toLowerCase() === 'set-cookie') {
            const parts = v.split(';')[0].split('=');
            if (parts.length >= 2) result[parts[0]] = parts.slice(1).join('=');
          }
        });
      } else {
        const setCookie = resp.headers.get('set-cookie');
        if (setCookie) {
          const parts = setCookie.split(';')[0].split('=');
          if (parts.length >= 2) result[parts[0]] = parts.slice(1).join('=');
        }
      }
    } catch (_) {}
    return result;
  }

  private cookieString(): string {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  private async request(path: string, params: Record<string, any>): Promise<Response> {
    params.e_r = true;
    params.header = makeParamsHeader(this.cookies);

    const encrypted = eapiParamsEncrypt(path, params);
    const url = `https://interface.music.163.com${path}`;

    return fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164 NeteaseMusicDesktop/3.1.3.203419',
          'mconfig-info': '{"IuRPVVmc3WWul9fT":{"version":733184,"appver":"3.1.3.203419"}}',
          'origin': 'orpheus://orpheus',
          'Referer': 'https://music.163.com/',
          'Cookie': this.cookieString(),
        },
        body: `params=${encrypted}`,
      },
      15000,
    );
  }

  private async parseResponse(resp: Response): Promise<any> {
    const raw = await resp.text();
    if (raw) {
      try { return JSON.parse(raw); } catch { /* not plain JSON */ }
      try { return JSON.parse(eapiResponseDecrypt(raw)); } catch { /* not hex text */ }
    }
    const buf = await resp.arrayBuffer();
    if (buf && buf.byteLength > 0) {
      const bytes = new Uint8Array(buf);
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      return JSON.parse(eapiResponseDecrypt(hex));
    }
    return null;
  }

  async search(keyword: string, _page?: number): Promise<SongInfo[]> {
    try {
      await this.ensureAuth();

      const params: Record<string, any> = {
        keyword,
        scene: 'NORMAL',
        needCorrect: 'true',
        limit: 20,
        offset: 0,
      };
      const resp = await this.request('/eapi/search/song/list/page', params);
      if (resp.status !== 200) {
        console.warn(`[NE] search status ${resp.status}`);
        return [];
      }

      const data = await this.parseResponse(resp);
      const resources = data?.data?.resources || [];
      if (resources.length === 0) console.warn('[NE] search returned empty');

      return resources.map((r: any) => {
        const s = r?.baseInfo?.simpleSongData || {};
        return {
          title: s.name || '',
          artist: (s.ar || []).map((a: any) => a.name || '').join('/'),
          album: s.al?.name || '',
          duration: s.dt || 0,
          song_id: String(s.id || ''),
          mid: '',
          hash: '',
        };
      });
    } catch (e: any) {
      console.warn('[NE] search error:', e.message || e);
      return [];
    }
  }

  async getLyrics(info: SongInfo): Promise<MultiLyrics> {
    try {
      await this.ensureAuth();

      const params: Record<string, any> = {
        id: parseInt(info.song_id || '0', 10),
        lv: '-1',
        tv: '-1',
        rv: '-1',
        yv: '-1',
      };
      const resp = await this.request('/eapi/song/lyric/v1', params);
      if (resp.status !== 200) return { orig: [] };

      const data = await this.parseResponse(resp);
      if (!data) return { orig: [] };

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
    } catch (e: any) {
      console.warn('[NE] getLyrics error:', e.message || e);
      return { orig: [] };
    }
  }
}
