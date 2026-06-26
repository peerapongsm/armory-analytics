import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { buildSummary } from "../../../lib/summary";
import { loadProjects } from "../../../lib/projects";
import { getWebStats, getToken } from "../../../lib/umami";
import { getDownloads } from "../../../lib/github";

export const runtime = "nodejs";

const cachedSummary = unstable_cache(
  async () => {
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

export async function GET() {
  const data = await cachedSummary();
  return NextResponse.json({ generatedAt: Date.now(), projects: data });
}
