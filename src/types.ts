export enum Source {
  QM = 'qm',
  KG = 'kg',
  NE = 'ne',
  LRCLIB = 'lrclib',
}

export const SOURCE_LABELS: Record<Source, string> = {
  [Source.QM]: 'QQ音乐',
  [Source.KG]: '酷狗音乐',
  [Source.NE]: '网易云音乐',
  [Source.LRCLIB]: 'Lrclib',
};

export interface SongInfo {
  title: string;
  artist: string;
  album?: string;
  duration: number; // ms
  song_id?: string;
  mid?: string;
  hash?: string;
}

export interface SearchResult {
  source: Source;
  source_label: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  score: number;
  song_id: string;
  mid: string;
  hash: string;
}

export interface LyricsWord {
  start: number | null; // ms
  end: number | null;
  text: string;
}

export interface LyricsLine {
  start: number | null; // ms
  end: number | null;
  words: LyricsWord[];
}

export type LyricsData = LyricsLine[];

export interface MultiLyrics {
  orig: LyricsData;
  ts?: LyricsData;   // translation
  roma?: LyricsData; // romanization
}

export interface FetchedLyrics {
  lyrics_type: 'verbatim' | 'line';
  lyric: string;
  tlyric?: string;
  rlyric?: string;
  lxlyric?: string;
  line_count: number;
  source: Source;
}

export interface ScrapeRequest {
  title: string;
  artist: string;
  duration: number;
}

export interface ScrapeResult {
  success: boolean;
  source?: Source;
  source_label?: string;
  score?: number;
  lyric?: string;
  tlyric?: string;
  rlyric?: string;
  lxlyric?: string;
  message?: string;
}

export interface AttachRequest {
  song_id: number;
  lyric: string;
  tlyric?: string;
  rlyric?: string;
  lxlyric?: string;
}

export interface LyricPayload {
  lyric: string;
  tlyric?: string;
  rlyric?: string;
  lxlyric?: string;
}

export interface FetchRequest extends SongInfo {
  source: Source;
}
