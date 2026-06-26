import { test, expect, vi } from "vitest";
import { getDownloads } from "../lib/github";

test("getDownloads sums asset download_count across releases", async () => {
  const fetchFn = vi.fn(async () =>
    new Response(JSON.stringify([
      { assets: [{ download_count: 10 }, { download_count: 5 }] },
      { assets: [{ download_count: 7 }] },
    ]), { status: 200 })
  ) as unknown as typeof fetch;
  expect(await getDownloads("o", "n", { fetchFn })).toBe(22);
});
