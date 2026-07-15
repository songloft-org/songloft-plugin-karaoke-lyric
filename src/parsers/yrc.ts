import { LyricsData, LyricsLine, LyricsWord } from '../types';

const YRC_LINE_RE = /^\[(\d+),(\d+)\](.*)$/;
const YRC_WORD_RE = /\((\d+),(\d+),\d+\)([^(]*)/g;

export function yrc2data(yrc: string): LyricsData {
  const data: LyricsData = [];
  const lines = yrc.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = YRC_LINE_RE.exec(trimmed);
    if (!m) continue;
    const startMs = parseInt(m[1], 10);
    const endMs = startMs + parseInt(m[2], 10);
    const content = m[3];
    const words: LyricsWord[] = [];
    const wordRe = new RegExp(YRC_WORD_RE.source, 'g');
    let wm: RegExpExecArray | null;
    while ((wm = wordRe.exec(content)) !== null) {
      words.push({
        start: parseInt(wm[1], 10),
        end: parseInt(wm[1], 10) + parseInt(wm[2], 10),
        text: wm[3],
      });
    }
    if (words.length === 0 && content.trim()) {
      words.push({ start: startMs, end: endMs, text: content.trim() });
    }
    if (words.length > 0) {
      data.push({ start: startMs, end: endMs, words });
    }
  }
  return data;
}
