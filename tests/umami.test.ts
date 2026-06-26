import { test, expect, vi } from "vitest";
import { getWebStats } from "../lib/umami";

function mockFetch(map: Record<string, unknown>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(map).find((k) => url.includes(k));
    return new Response(JSON.stringify(key ? map[key] : {}), { status: 200 });
  }) as unknown as typeof fetch;
}

test("getWebStats maps Umami stats into WebStats", async () => {
  const fetchFn = mockFetch({
    "/api/websites/": {
      pageviews: { value: 120 }, visitors: { value: 80 },
      bounces: { value: 24 }, totaltime: { value: 4800 },
    },
  });
  const target = { id: 1, name: "A", kind: "web" as const, hostname: "h.test", pathPrefix: "/a/", repoOwner: null, repoName: null };
  const s = await getWebStats(target, 30, { fetchFn, token: "t" });
  expect(s.visitors).toBe(80);
  expect(s.pageviews).toBe(120);
  expect(s.bounceRate).toBeCloseTo(24 / 80, 5);     // bounces / visitors
  expect(s.avgVisitSeconds).toBeCloseTo(4800 / 80, 5); // totaltime / visitors
});
