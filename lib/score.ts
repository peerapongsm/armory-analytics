import type { WebStats } from "./types";

export const SCORE_WEIGHTS = { reach: 0.5, engagement: 0.3, retention: 0.2 };
export const GRADUATE = { minScore: 60, minVisitors: 200, minDownloads: 300 };

// log-scaled 0..1 normalizer; `full` = value that maps to ~1.0
const logNorm = (v: number, full: number) =>
  v <= 0 ? 0 : Math.min(1, Math.log10(1 + v) / Math.log10(1 + full));

export function webScore(s: WebStats): number {
  const reach = logNorm(s.visitors, 5000);
  const engagement =
    0.6 * Math.min(1, s.avgVisitSeconds / 120) + 0.4 * (1 - clamp01(s.bounceRate));
  const retention = clamp01(s.returningRatio);
  const raw =
    SCORE_WEIGHTS.reach * reach +
    SCORE_WEIGHTS.engagement * engagement +
    SCORE_WEIGHTS.retention * retention;
  return Math.round(raw * 100);
}

export function desktopScore(downloads: number): number {
  return Math.round(logNorm(downloads, 10000) * 100);
}

export function shouldGraduate(m: {
  kind: "web" | "desktop";
  web: WebStats | null;
  downloads: number | null;
  score: number;
}): boolean {
  if (m.score < GRADUATE.minScore) return false;
  if (m.kind === "web") return (m.web?.visitors ?? 0) >= GRADUATE.minVisitors;
  return (m.downloads ?? 0) >= GRADUATE.minDownloads;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
