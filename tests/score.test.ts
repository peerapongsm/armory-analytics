import { test, expect } from "vitest";
import { webScore, desktopScore, shouldGraduate } from "../lib/score";

test("webScore is 0 for no traffic", () => {
  expect(webScore({ visitors: 0, pageviews: 0, avgVisitSeconds: 0, bounceRate: 1, returningRatio: 0 })).toBe(0);
});

test("webScore rises with reach, engagement, retention", () => {
  const low = webScore({ visitors: 10, pageviews: 12, avgVisitSeconds: 5, bounceRate: 0.9, returningRatio: 0.05 });
  const high = webScore({ visitors: 5000, pageviews: 12000, avgVisitSeconds: 120, bounceRate: 0.2, returningRatio: 0.5 });
  expect(high).toBeGreaterThan(low);
  expect(high).toBeLessThanOrEqual(100);
  expect(low).toBeGreaterThanOrEqual(0);
});

test("desktopScore grows with downloads and caps at 100", () => {
  expect(desktopScore(0)).toBe(0);
  expect(desktopScore(100000)).toBeLessThanOrEqual(100);
  expect(desktopScore(500)).toBeGreaterThan(desktopScore(50));
});

test("shouldGraduate needs both score and real audience", () => {
  const strongWeb = { visitors: 1000, pageviews: 3000, avgVisitSeconds: 90, bounceRate: 0.3, returningRatio: 0.4 };
  expect(shouldGraduate({ kind: "web", web: strongWeb, downloads: null, score: 80 })).toBe(true);
  // high score but tiny audience -> no
  const tinyWeb = { visitors: 5, pageviews: 6, avgVisitSeconds: 200, bounceRate: 0.1, returningRatio: 0.9 };
  expect(shouldGraduate({ kind: "web", web: tinyWeb, downloads: null, score: 95 })).toBe(false);
});
