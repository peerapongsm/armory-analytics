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
    data.sort((a, b) => b.score - a.score);
    return data;
  },
  ["summary"],
  { revalidate: 3600 }
);
