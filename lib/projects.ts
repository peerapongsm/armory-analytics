import type { ArmoryProject, AnalyticsTarget } from "./types";

export function parseRepo(repoUrl: string): { owner: string; name: string } | null {
  const m = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(repoUrl || "");
  return m ? { owner: m[1], name: m[2] } : null;
}

export function toTarget(p: ArmoryProject): AnalyticsTarget | null {
  if (p.track === "desktop") {
    const r = parseRepo(p.repo);
    if (!r) return null;
    return { id: p.id, name: p.name, kind: "desktop", hostname: null, pathPrefix: null, repoOwner: r.owner, repoName: r.name };
  }
  if (!p.url) return null; // live/demo but not shipped yet
  const u = new URL(p.url);
  return { id: p.id, name: p.name, kind: "web", hostname: u.hostname, pathPrefix: u.pathname || "/", repoOwner: null, repoName: null };
}

export async function loadProjects(url: string, fetchFn: typeof fetch = fetch): Promise<ArmoryProject[]> {
  const res = await fetchFn(url, { cache: "no-store" } as RequestInit);
  if (!res.ok) throw new Error(`projects.json ${res.status}`);
  return (await res.json()) as ArmoryProject[];
}
