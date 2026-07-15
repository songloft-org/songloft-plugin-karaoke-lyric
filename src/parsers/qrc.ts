import { LyricsData, LyricsLine, LyricsWord } from '../types';
import { lrc2data } from './lrc';

const QRC_LINE_RE = /^\[(\d+),(\d+)\](.*)$/;
const QRC_WORD_RE = /([^(]+)\((\d+),(\d+)\)/g;

const XML_LYRIC_RE = /LyricContent="([^"]*)"/;

export function qrc2data(qrcContent: string): { tags: Record<string, string>; data: LyricsData } {
  const tags: Record<string, string> = {};
  const data: LyricsData = [];
  const lines = qrcContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tagMatch = /^\[(\w+):([^\]]*)\]$/.exec(trimmed);
    if (tagMatch) {
      tags[tagMatch[1]] = tagMatch[2];
      continue;
    }
    const m = QRC_LINE_RE.exec(trimmed);
    if (!m) continue;
    const startMs = parseInt(m[1], 10);
    const endMs = startMs + parseInt(m[2], 10);
    const content = m[3];
    const words: LyricsWord[] = [];
    const wordRe = new RegExp(QRC_WORD_RE.source, 'g');
    let wordMatch: RegExpExecArray | null;
    while ((wordMatch = wordRe.exec(content)) !== null) {
      words.push({
        start: parseInt(wordMatch[2], 10),
        end: parseInt(wordMatch[2], 10) + parseInt(wordMatch[3], 10),
        text: wordMatch[1],
      });
    }
    if (words.length === 0) {
      if (content.trim()) {
        words.push({ start: startMs, end: endMs, text: content.trim() });
      } else {
        continue;
      }
    }
    data.push({ start: startMs, end: endMs, words });
  }
  return { tags, data };
}

export function qrcStrParse(lyric: string): { tags: Record<string, string>; data: LyricsData } {
  if (lyric.includes('<Lyric')) {
    const xmlMatch = XML_LYRIC_RE.exec(lyric);
    if (xmlMatch) {
      const decoded = xmlMatch[1].replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
      return qrc2data(decoded);
    }
  }
  return lrc2data(lyric);
}
