import { test, expect } from "vitest";
import { buildSummary } from "../lib/summary";

test("buildSummary scores web + desktop and flags graduation", async () => {
  const out = await buildSummary({
    loadProjects: async () => [
      { id: 1, name: "Web", slug: "w", track: "live", status: "done", url: "https://h.test/w/", repo: "", download: "" },
      { id: 2, name: "Desk", slug: "d", track: "desktop", status: "done", url: "", repo: "https://github.com/o/d", download: "x" },
      { id: 3, name: "Planned", slug: "p", track: "live", status: "planned", url: "", repo: "", download: "" },
    ],
    getWebStats: async () => ({ visitors: 1000, pageviews: 3000, avgVisitSeconds: 90, bounceRate: 0.3, returningRatio: 0.4 }),
    getDownloads: async () => 50,
  });
  expect(out.map((m) => m.id)).toEqual([1, 2]); // planned dropped
  const web = out.find((m) => m.id === 1)!;
  expect(web.score).toBeGreaterThan(0);
  expect(web.graduate).toBe(true);
  const desk = out.find((m) => m.id === 2)!;
  expect(desk.kind).toBe("desktop");
  expect(desk.graduate).toBe(false); // 50 downloads < threshold
});
