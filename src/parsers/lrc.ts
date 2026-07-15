import { LyricsData, LyricsWord } from '../types';

const TAG_RE = /^\[(\w+):([^\]]*)\]$/;
const LINE_RE = /^\[(\d+):(\d+)\.(\d+)\](.*)$/;

export function lrc2data(lrc: string): { tags: Record<string, string>; data: LyricsData } {
  const tags: Record<string, string> = {};
  const data: LyricsData = [];
  const lines = lrc.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tagMatch = TAG_RE.exec(trimmed);
    if (tagMatch) {
      tags[tagMatch[1]] = tagMatch[2];
      continue;
    }
    const lineMatch = LINE_RE.exec(trimmed);
    if (lineMatch) {
      const min = parseInt(lineMatch[1], 10);
      const sec = parseInt(lineMatch[2], 10);
      const csStr = lineMatch[3].padEnd(3, '0').slice(0, 3);
      const cs = parseInt(csStr, 10);
      const startMs = min * 60000 + sec * 1000 + cs;
      const text = lineMatch[4].trim();
      if (!text) continue;
      data.push({
        start: startMs,
        end: null,
        words: [{ start: startMs, end: null, text }],
      });
    }
  }
  return { tags, data };
}
