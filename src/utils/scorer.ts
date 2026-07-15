import { SearchResult } from '../types';

export function normalizeStr(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

function titleScore(searchTitle: string, resultTitle: string): number {
  const s = normalizeStr(searchTitle);
  const r = normalizeStr(resultTitle);
  if (s === r) return 50;
  if (r.includes(s) || s.includes(r)) return 30;
  const common = [...s].filter(c => r.includes(c)).length;
  if (common > s.length * 0.6) return 10;
  return 0;
}

function artistScore(searchArtist: string, resultArtist: string): number {
  const s = normalizeStr(searchArtist);
  const r = normalizeStr(resultArtist);
  if (s === r) return 30;
  if (r.includes(s) || s.includes(r)) return 15;
  const sParts = s.split(/[\/,;&\s]+/).filter(Boolean);
  const rParts = r.split(/[\/,;&\s]+/).filter(Boolean);
  if (sParts.some(p => rParts.includes(p))) return 15;
  return 0;
}

function durationScore(searchDur: number, resultDur: number): number {
  const diff = Math.abs(searchDur - resultDur);
  if (diff <= 1000) return 20;
  if (diff <= 3000) return 15;
  if (diff <= 10000) return 10;
  if (diff <= 30000) return 5;
  return 0;
}

export function computeScore(
  searchTitle: string,
  searchArtist: string,
  searchDuration: number,
  resultTitle: string,
  resultArtist: string,
  resultDuration: number,
): number {
  return (
    titleScore(searchTitle, resultTitle) +
    artistScore(searchArtist, resultArtist) +
    durationScore(searchDuration, resultDuration)
  );
}

export function pickBest(results: SearchResult[], threshold = 30): SearchResult | null {
  if (results.length === 0) return null;
  const sorted = [...results].sort((a, b) => b.score - a.score);
  return sorted[0].score >= threshold ? sorted[0] : null;
}
