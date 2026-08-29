import { Source, SearchResult, SongInfo, MultiLyrics, FetchedLyrics, LyricsTypePreference } from '../types';
import { BaseSource } from './base';
import { QQSource } from './qq';
import { KuGouSource } from './kugou';
import { NetEaseSource } from './netease';
import { LrclibSource } from './lrclib';
import { computeScore, pickBest, titleScore } from '../utils/scorer';
import { lyricsDataToLrc } from '../utils/lrc_builder';

/** 将请求中的 lyrics_type 规约为合法偏好值，非法或缺省返回 undefined（自动）。 */
export function normalizeLyricsType(v: unknown): LyricsTypePreference | undefined {
  return v === 'line' || v === 'verbatim' ? v : undefined;
}

export class SourceEngine {
  private sources: BaseSource[] = [];

  init(): void {
    this.sources = [
      new QQSource(),
      new KuGouSource(),
      new NetEaseSource(),
      new LrclibSource(),
    ];
  }

  getSource(source: Source): BaseSource | undefined {
    return this.sources.find(s => s.source === source);
  }

  async searchAll(
    title: string,
    artist: string,
    duration: number,
    source?: Source,
  ): Promise<SearchResult[]> {
    const keyword = `${title} ${artist}`.trim();
    const allResults: SearchResult[] = [];
    const errors: string[] = [];

    const targets = source ? [this.getSource(source)].filter(Boolean) as BaseSource[] : this.sources;

    await Promise.all(
      targets.map(async (src) => {
        try {
          const results = await src.search(keyword);
          for (const r of results) {
            const score = computeScore(title, artist, duration, r.title, r.artist, r.duration);
            allResults.push({
              source: src.source,
              source_label: src.source,
              title: r.title,
              artist: r.artist,
              album: r.album || '',
              duration: r.duration,
              score,
              song_id: r.song_id || '',
              mid: r.mid || '',
              hash: r.hash || '',
            });
          }
        } catch (e: any) {
          errors.push(`[${src.source}] ${e.message || e}`);
        }
      }),
    );

    if (errors.length > 0) {
      console.warn(`Search errors: ${errors.join('; ')}`);
    }

    allResults.sort((a, b) => b.score - a.score);
    return allResults;
  }

  async fetchLyrics(
    source: Source,
    info: SongInfo,
    lyricsType?: LyricsTypePreference,
  ): Promise<FetchedLyrics | null> {
    const src = this.sources.find(s => s.source === source);
    if (!src) return null;
    try {
      const multi = await src.getLyrics(info);
      const { lyric, tlyric, rlyric, lxlyric } = lyricsDataToLrc(multi);
      // 'line' 偏好：丢弃逐字时间轴，仅保留逐行歌词
      const finalLx = lyricsType === 'line' ? '' : lxlyric;
      return {
        lyrics_type: finalLx.length > 0 ? 'verbatim' : 'line',
        lyric,
        tlyric,
        rlyric,
        lxlyric: finalLx,
        line_count: multi.orig.length,
        source,
      };
    } catch (e: any) {
      console.error(`fetchLyrics ${source} failed: ${e.message || e}`);
      return null;
    }
  }

  async scrapeBest(
    title: string,
    artist: string,
    duration: number,
    source?: Source,
    lyricsType?: LyricsTypePreference,
    strict?: boolean,
  ): Promise<{ result: SearchResult; lyrics: FetchedLyrics } | null> {
    const results = await this.searchAll(title, artist, duration, source);
    let candidates = results;
    // 'verbatim' 偏好：优先选用能提供逐字歌词的源（小秋/小枸）
    if (lyricsType === 'verbatim') {
      const wordCapable = results.filter(
        r => r.source === Source.QM || r.source === Source.KG,
      );
      if (wordCapable.length > 0) candidates = wordCapable;
    }
    // 严格模式（主程序自动补全路径）：必须标题真实匹配，否则宁缺毋滥——
    // 普通阈值 30 仅靠歌手同名即可过线，会把错误歌词静默写入库中
    if (strict) {
      candidates = candidates.filter(r => titleScore(title, r.title) >= 30);
      const best = pickBest(candidates, 50);
      if (!best) return null;
      return this.fetchBestLyrics(best, lyricsType);
    }
    const best = pickBest(candidates);
    if (!best) return null;
    return this.fetchBestLyrics(best, lyricsType);
  }

  private async fetchBestLyrics(
    best: SearchResult,
    lyricsType?: LyricsTypePreference,
  ): Promise<{ result: SearchResult; lyrics: FetchedLyrics } | null> {
    const lyrics = await this.fetchLyrics(
      best.source,
      {
        title: best.title,
        artist: best.artist,
        album: best.album,
        duration: best.duration,
        song_id: best.song_id,
        mid: best.mid,
        hash: best.hash,
      },
      lyricsType,
    );
    if (!lyrics) return null;
    return { result: best, lyrics };
  }
}
