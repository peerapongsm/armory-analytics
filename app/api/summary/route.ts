import { NextResponse } from "next/server";
import { buildSummary } from "../../../lib/summary";
import { loadProjects } from "../../../lib/projects";
import { getWebStats, getToken } from "../../../lib/umami";
import { getDownloads } from "../../../lib/github";

export const runtime = "nodejs";
export const revalidate = 3600; // cache 1h
export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getToken();
  const data = await buildSummary({
    loadProjects: () => loadProjects(process.env.ARMORY_PROJECTS_URL!),
    getWebStats: (t) => getWebStats(t, 30, { token }),
    getDownloads: (o, n) => getDownloads(o, n),
  });
  data.sort((a, b) => b.score - a.score);
  return NextResponse.json({ generatedAt: Date.now(), projects: data });
}
