import { Source, SearchResult, SongInfo, MultiLyrics, FetchedLyrics } from '../types';
import { BaseSource } from './base';
import { QQSource } from './qq';
import { KuGouSource } from './kugou';
import { NetEaseSource } from './netease';
import { LrclibSource } from './lrclib';
import { computeScore, pickBest } from '../utils/scorer';
import { lyricsDataToLrc } from '../utils/lrc_builder';

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

  async fetchLyrics(source: Source, info: SongInfo): Promise<FetchedLyrics | null> {
    const src = this.sources.find(s => s.source === source);
    if (!src) return null;
    try {
      const multi = await src.getLyrics(info);
      const { lyric, tlyric, rlyric, lxlyric } = lyricsDataToLrc(multi);
      const hasWord = lxlyric.length > 0;
      return {
        lyrics_type: hasWord ? 'verbatim' : 'line',
        lyric,
        tlyric,
        rlyric,
        lxlyric,
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
  ): Promise<{ result: SearchResult; lyrics: FetchedLyrics } | null> {
    const results = await this.searchAll(title, artist, duration, source);
    const best = pickBest(results);
    if (!best) return null;
    const lyrics = await this.fetchLyrics(best.source, {
      title: best.title,
      artist: best.artist,
      album: best.album,
      duration: best.duration,
      song_id: best.song_id,
      mid: best.mid,
      hash: best.hash,
    });
    if (!lyrics) return null;
    return { result: best, lyrics };
  }
}
