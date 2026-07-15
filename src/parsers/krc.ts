import { LyricsData, LyricsLine, LyricsWord, MultiLyrics } from '../types';

const TAG_RE = /^\[(\w+):([^\]]*)\]$/;
const KRC_LINE_RE = /^\[(\d+),(\d+)\](.*)$/;
const KRC_WORD_RE = /<(\d+),(\d+),\d+>([^<]*)/g;

export function krc2mdata(krc: string): { tags: Record<string, string>; multi: MultiLyrics } {
  const tags: Record<string, string> = {};
  const orig: LyricsData = [];
  const lines = krc.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tagMatch = TAG_RE.exec(trimmed);
    if (tagMatch) {
      tags[tagMatch[1]] = tagMatch[2];
      continue;
    }
    const m = KRC_LINE_RE.exec(trimmed);
    if (!m) continue;
    const startMs = parseInt(m[1], 10);
    const endMs = startMs + parseInt(m[2], 10);
    const content = m[3];
    const words: LyricsWord[] = [];
    const wordRe = new RegExp(KRC_WORD_RE.source, 'g');
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
      orig.push({ start: startMs, end: endMs, words });
    }
  }
  return { tags, multi: { orig } };
}
