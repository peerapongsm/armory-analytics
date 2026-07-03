import { test, expect, vi } from "vitest";
import { getWebStats } from "../lib/umami";

function mockFetch(handler: (url: string) => unknown) {
  return vi.fn(async (input: RequestInfo | URL) => {
    return new Response(JSON.stringify(handler(String(input))), { status: 200 });
  }) as unknown as typeof fetch;
}

test("getWebStats maps flat Umami stats into WebStats", async () => {
  const fetchFn = mockFetch(() => ({ pageviews: 120, visitors: 80, visits: 100, bounces: 25, totaltime: 5000 }));
  const target = { id: 1, name: "A", kind: "web" as const, hostnames: ["a.test"], legacyPath: null, repoOwner: null, repoName: null };
  const s = await getWebStats(target, 30, { fetchFn, token: "t" });
  expect(s.visitors).toBe(80);
  expect(s.pageviews).toBe(120);
  expect(s.bounceRate).toBeCloseTo(25 / 100, 5);       // bounces / visits
  expect(s.avgVisitSeconds).toBeCloseTo(5000 / 100, 5); // totaltime / visits
});

test("getWebStats filters by hostname, not the removed url param", async () => {
  const seen: string[] = [];
  const fetchFn = mockFetch((url) => {
    seen.push(url);
    return { pageviews: 1, visitors: 1, visits: 1, bounces: 0, totaltime: 10 };
  });
  const target = { id: 1, name: "A", kind: "web" as const, hostnames: ["a.test"], legacyPath: null, repoOwner: null, repoName: null };
  await getWebStats(target, 30, { fetchFn, token: "t" });
  expect(seen).toHaveLength(1);
  expect(seen[0]).toContain("hostname=a.test");
  expect(seen[0]).not.toContain("url=");
});

test("getWebStats sums current hostnames plus the legacy Pages path slice", async () => {
  const seen: string[] = [];
  const fetchFn = mockFetch((url) => {
    seen.push(url);
    if (url.includes("hostname=a.test")) return { pageviews: 10, visitors: 5, visits: 6, bounces: 2, totaltime: 60 };
    if (url.includes("hostname=a.vercel.app")) return { pageviews: 4, visitors: 2, visits: 2, bounces: 1, totaltime: 20 };
    return { pageviews: 6, visitors: 3, visits: 4, bounces: 1, totaltime: 40 }; // legacy github.io slice
  });
  const target = {
    id: 1, name: "A", kind: "web" as const,
    hostnames: ["a.test", "a.vercel.app"], legacyPath: "/a/",
    repoOwner: null, repoName: null,
  };
  const s = await getWebStats(target, 30, { fetchFn, token: "t" });
  expect(seen).toHaveLength(3);
  const legacy = seen.find((u) => u.includes("peerapongsm.github.io"));
  expect(legacy).toContain(`path=${encodeURIComponent("/a/")}`);
  expect(s.pageviews).toBe(20);
  expect(s.visitors).toBe(10);
  expect(s.bounceRate).toBeCloseTo(4 / 12, 5);
  expect(s.avgVisitSeconds).toBeCloseTo(120 / 12, 5);
});

test("getWebStats with no measurable segments returns zeros", async () => {
  const fetchFn = mockFetch(() => ({}));
  const target = { id: 1, name: "A", kind: "web" as const, hostnames: [], legacyPath: null, repoOwner: null, repoName: null };
  const s = await getWebStats(target, 30, { fetchFn, token: "t" });
  expect(s.visitors).toBe(0);
  expect(s.pageviews).toBe(0);
  expect(s.bounceRate).toBe(1);
});
