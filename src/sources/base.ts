import { Source, SongInfo, MultiLyrics } from '../types';

export interface BaseSource {
  source: Source;
  search(keyword: string, page?: number): Promise<SongInfo[]>;
  getLyrics(info: SongInfo): Promise<MultiLyrics>;
}
