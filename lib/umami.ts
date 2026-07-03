import type { AnalyticsTarget, WebStats } from "./types";
import { LEGACY_PAGES_HOST } from "./projects";

const BASE = () => process.env.UMAMI_API_URL!;
const WEBSITE = () => process.env.UMAMI_WEBSITE_ID!;

export async function getToken(deps: { fetchFn?: typeof fetch } = {}): Promise<string> {
  const fetchFn = deps.fetchFn ?? fetch;
  const res = await fetchFn(`${BASE()}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: process.env.UMAMI_USERNAME, password: process.env.UMAMI_PASSWORD }),
  });
  if (!res.ok) throw new Error(`umami login ${res.status}`);
  return ((await res.json()) as { token: string }).token;
}

// One Umami stats query slice. Current Umami returns flat numbers
// ({ pageviews: 1919, ... }) and filters via `hostname`/`path` (prefix match);
// the old `url` param and { value } wrappers are gone.
interface Segment {
  hostname: string;
  path?: string;
}

interface RawStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

async function fetchSegment(
  seg: Segment,
  startAt: number,
  endAt: number,
  token: string,
  fetchFn: typeof fetch
): Promise<RawStats> {
  const qs = new URLSearchParams({ startAt: String(startAt), endAt: String(endAt), hostname: seg.hostname });
  if (seg.path) qs.set("path", seg.path);
  const res = await fetchFn(`${BASE()}/api/websites/${WEBSITE()}/stats?${qs}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`umami stats ${res.status}`);
  const d = (await res.json()) as Partial<RawStats>;
  return {
    pageviews: d.pageviews || 0,
    visitors: d.visitors || 0,
    visits: d.visits || 0,
    bounces: d.bounces || 0,
    totaltime: d.totaltime || 0,
  };
}

export async function getWebStats(
  target: AnalyticsTarget,
  rangeDays: number,
  deps: { fetchFn?: typeof fetch; token?: string } = {}
): Promise<WebStats> {
  const fetchFn = deps.fetchFn ?? fetch;
  const token = deps.token ?? (await getToken({ fetchFn }));
  const endAt = Date.now();
  const startAt = endAt - rangeDays * 86400_000;
  // A project's traffic = its own hostnames (current subdomain + legacy Vercel
  // hosts) plus its /<repo>/ slice of the shared legacy GitHub Pages host.
  const segments: Segment[] = target.hostnames.map((h) => ({ hostname: h }));
  if (target.legacyPath) segments.push({ hostname: LEGACY_PAGES_HOST, path: target.legacyPath });
  const raws = await Promise.all(segments.map((s) => fetchSegment(s, startAt, endAt, token, fetchFn)));
  // Summing visitors across hosts can double-count someone who visited both
  // the old and new URL — acceptable for a promotion signal.
  const sum = raws.reduce(
    (a, r) => ({
      pageviews: a.pageviews + r.pageviews,
      visitors: a.visitors + r.visitors,
      visits: a.visits + r.visits,
      bounces: a.bounces + r.bounces,
      totaltime: a.totaltime + r.totaltime,
    }),
    { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 }
  );
  return {
    visitors: sum.visitors,
    pageviews: sum.pageviews,
    bounceRate: sum.visits ? sum.bounces / sum.visits : 1,
    avgVisitSeconds: sum.visits ? sum.totaltime / sum.visits : 0,
    returningRatio: 0, // no sessions endpoint wired up; 0 is a safe floor
  };
}
