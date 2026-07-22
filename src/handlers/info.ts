import { HTTPRequest, HTTPResponse, jsonResponse } from '@songloft/plugin-sdk';
import { PLUGIN_VERSION } from '../version';

export function createInfoHandler() {
  return async (_req: HTTPRequest): Promise<HTTPResponse> => {
    return jsonResponse({
      name: '逐字歌词',
      version: PLUGIN_VERSION,
      description: '从多个平台自动刮削歌词并关联入库',
      author: 'songloft',
      license: 'Apache-2.0',
      homepage: 'https://github.com/songloft-org/songloft-plugin-karaoke-lyric',
      minHostVersion: '2.0.0',
    });
  };
}
