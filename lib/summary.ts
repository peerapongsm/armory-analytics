import type { ArmoryProject, AnalyticsTarget, ProjectMetrics, WebStats } from "./types";
import { toTarget } from "./projects";
import { webScore, desktopScore, shouldGraduate } from "./score";

export async function buildSummary(deps: {
  loadProjects: () => Promise<ArmoryProject[]>;
  getWebStats: (t: AnalyticsTarget) => Promise<WebStats>;
  getDownloads: (owner: string, name: string) => Promise<number>;
}): Promise<ProjectMetrics[]> {
  const projects = await deps.loadProjects();
  const targets = projects.map(toTarget).filter((t): t is AnalyticsTarget => t !== null);
  return Promise.all(
    targets.map(async (t): Promise<ProjectMetrics> => {
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
    })
  );
}
