import type { AnalyticsTarget, WebStats } from "./types";

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

export async function getWebStats(
  target: AnalyticsTarget,
  rangeDays: number,
  deps: { fetchFn?: typeof fetch; token?: string } = {}
): Promise<WebStats> {
  const fetchFn = deps.fetchFn ?? fetch;
  const token = deps.token ?? (await getToken({ fetchFn }));
  const endAt = Date.now();
  const startAt = endAt - rangeDays * 86400_000;
  const qs = new URLSearchParams({ startAt: String(startAt), endAt: String(endAt) });
  // Segmentation today is by exact path within ONE shared Umami website.
  // `hostname` is stored on the target for future multi-host disambiguation
  // but is not sent here — Umami's basic stats `url` param is exact-path only.
  // All current projects live on a single host (peerapongsm.github.io).
  if (target.pathPrefix) qs.set("url", target.pathPrefix);
  const res = await fetchFn(`${BASE()}/api/websites/${WEBSITE()}/stats?${qs}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`umami stats ${res.status}`);
  const d = (await res.json()) as {
    pageviews: { value: number }; visitors: { value: number };
    bounces: { value: number }; totaltime: { value: number };
  };
  const visitors = d.visitors.value || 0;
  return {
    visitors,
    pageviews: d.pageviews.value || 0,
    bounceRate: visitors ? d.bounces.value / visitors : 1,
    avgVisitSeconds: visitors ? d.totaltime.value / visitors : 0,
    returningRatio: 0, // filled in Task 7 if a sessions endpoint is added; 0 is a safe floor
  };
}
