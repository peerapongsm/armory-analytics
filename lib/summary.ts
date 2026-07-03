import type { ArmoryProject, AnalyticsTarget, ProjectMetrics, WebStats } from "./types";
import { toTarget } from "./projects";
import { webScore, desktopScore, shouldGraduate } from "./score";

// Bounded-concurrency map. Firing every project's Umami queries at once
// (~80 requests) exhausts the Umami host's pooled DB connections -> 5xx.
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

export async function buildSummary(deps: {
  loadProjects: () => Promise<ArmoryProject[]>;
  getWebStats: (t: AnalyticsTarget) => Promise<WebStats>;
  getDownloads: (owner: string, name: string) => Promise<number>;
}): Promise<ProjectMetrics[]> {
  const projects = await deps.loadProjects();
  const targets = projects.map(toTarget).filter((t): t is AnalyticsTarget => t !== null);
  return mapLimit(targets, 6, async (t): Promise<ProjectMetrics> => {
      try {
        if (t.kind === "web") {
          const web = await deps.getWebStats(t);
          const score = webScore(web);
          return { id: t.id, name: t.name, kind: "web", web, downloads: null, score, graduate: shouldGraduate({ kind: "web", web, downloads: null, score }) };
        }
        const downloads = await deps.getDownloads(t.repoOwner!, t.repoName!);
        const score = desktopScore(downloads);
        return { id: t.id, name: t.name, kind: "desktop", web: null, downloads, score, graduate: shouldGraduate({ kind: "desktop", web: null, downloads, score }) };
      } catch {
        // Degrade to a zero-score row so one failing source doesn't 500 the whole dashboard.
        if (t.kind === "web") {
          return { id: t.id, name: t.name, kind: "web", web: { visitors: 0, pageviews: 0, bounceRate: 1, avgVisitSeconds: 0, returningRatio: 0 }, downloads: null, score: 0, graduate: false };
        }
        return { id: t.id, name: t.name, kind: "desktop", web: null, downloads: 0, score: 0, graduate: false };
      }
  });
}
