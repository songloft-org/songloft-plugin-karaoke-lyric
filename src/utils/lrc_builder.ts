import { LyricsData, MultiLyrics } from '../types';

export function msToLrcTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function buildLrcBlock(data: LyricsData, tags?: Record<string, string>): string {
  const lines: string[] = [];
  if (tags) {
    if (tags.ti) lines.push(`[ti:${tags.ti}]`);
    if (tags.ar) lines.push(`[ar:${tags.ar}]`);
    if (tags.al) lines.push(`[al:${tags.al}]`);
    if (tags.by) lines.push(`[by:${tags.by}]`);
    if (tags.offset) lines.push(`[offset:${tags.offset}]`);
  }
  for (const line of data) {
    if (line.start === null || line.words.length === 0) continue;
    if (line.words.length === 1) {
      lines.push(`[${msToLrcTime(line.start)}]${line.words[0].text}`);
    } else {
      const timeStr = msToLrcTime(line.start);
      const wordParts: string[] = [];
      for (const w of line.words) {
        if (w.start !== null && w.start !== line.start) {
          wordParts.push(`[[${msToLrcTime(w.start)}]]${w.text}`);
        } else {
          wordParts.push(w.text);
        }
      }
      lines.push(`[${timeStr}]${wordParts.join('')}`);
    }
  }
  return lines.join('\n');
}

export function lyricsDataToLrc(
  multi: MultiLyrics,
  tags?: Record<string, string>,
): { lyric: string; tlyric: string; rlyric: string; lxlyric: string } {
  const lyric = buildLrcBlock(multi.orig, tags);
  const tlyric = multi.ts ? buildLrcBlock(multi.ts) : '';
  const rlyric = multi.roma ? buildLrcBlock(multi.roma) : '';
  const lxParts: string[] = [];
  for (const line of multi.orig) {
    if (line.start === null || line.words.length <= 1) continue;
    const wordParts: string[] = [];
    for (let i = 0; i < line.words.length; i++) {
      const w = line.words[i];
      if (w.start !== null) {
        wordParts.push(`[[${msToLrcTime(w.start)}]]${w.text}`);
      } else {
        wordParts.push(w.text);
      }
    }
    if (wordParts.length > 0) {
      lxParts.push(`[${msToLrcTime(line.start)}]${wordParts.join('')}`);
    }
  }
  const lxlyric = lxParts.join('\n');
  return { lyric, tlyric, rlyric, lxlyric };
}
