import { unstable_cache } from "next/cache";
import { buildSummary } from "./summary";
import { loadProjects } from "./projects";
import { getWebStats, getToken } from "./umami";
import { getDownloads } from "./github";
import type { ProjectMetrics } from "./types";

// Shared cached summary — imported directly by both the API route and the page
// (the page must NOT self-fetch its own /api route over HTTP).
export const getSummary = unstable_cache(
  async (): Promise<ProjectMetrics[]> => {
    const token = await getToken();
    const data = await buildSummary({
      loadProjects: () => loadProjects(process.env.ARMORY_PROJECTS_URL!),
      getWebStats: (t) => getWebStats(t, 30, { token }),
      getDownloads,
    });
    const audience = (p: ProjectMetrics) => p.web?.visitors ?? p.downloads ?? 0;
    data.sort((a, b) => audience(b) - audience(a));
    return data;
  },
  // Bump the version segment when the computation changes — Vercel's data
  // cache persists across deployments, so a stale entry outlives the deploy.
  ["summary-v7"],
  // 24h: stats are 30-day aggregates, hourly freshness just burst-loads the
  // Umami host (each rebuild = ~60-100 stats calls).
  { revalidate: 86400 }
);
