import type { ArmoryProject, AnalyticsTarget } from "./types";

// All projects lived under this shared GitHub Pages host before the 2026-07
// move to per-project subdomains; old links still receive real traffic.
export const LEGACY_PAGES_HOST = "peerapongsm.github.io";

// Old Vercel hostnames that still receive traffic, keyed by armory slug.
const LEGACY_VERCEL_HOSTS: Record<string, string[]> = {
  "cbt-thought-record": [
    "yai-aree.vercel.app",
    "cbt-thought-record.vercel.app",
    "cbt-thought-record-peerapongsms-projects.vercel.app",
  ],
  "scam-call-trainer": ["scam-call-trainer.vercel.app"],
  promptfiled: ["prompt-filed.vercel.app"],
  "armory-analytics": ["armory-analytics-peerapongsms-projects.vercel.app"],
  // The Armory served the apex domain until 2026-10-14 (then moved to armory.peerapongsm.dev).
  armory: ["peerapongsm.dev"],
};

export function parseRepo(repoUrl: string): { owner: string; name: string } | null {
  const m = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(repoUrl || "");
  return m ? { owner: m[1], name: m[2] } : null;
}

export function toTarget(p: ArmoryProject): AnalyticsTarget | null {
  if (p.track === "desktop") {
    const r = parseRepo(p.repo);
    if (!r) return null;
    return { id: p.id, name: p.name, kind: "desktop", hostnames: [], legacyPath: null, repoOwner: r.owner, repoName: r.name };
  }
  if (!p.url) return null; // live/demo but not shipped yet
  const u = new URL(p.url);
  const hostnames = new Set<string>();
  let legacyPath: string | null = null;
  if (u.hostname === LEGACY_PAGES_HOST) {
    // Not migrated yet — count only its path slice of the shared host.
    legacyPath = u.pathname || "/";
  } else {
    hostnames.add(u.hostname);
    // Migrated projects no longer count their old /<repo>/ slice of the shared
    // Pages host: the extra ~48 stats calls per summary rebuild cost more than
    // the residual old-link traffic is worth (~119 pv/30d across the whole host,
    // measured 2026-07-31).
  }
  for (const h of LEGACY_VERCEL_HOSTS[p.slug] ?? []) hostnames.add(h);
  return { id: p.id, name: p.name, kind: "web", hostnames: [...hostnames], legacyPath, repoOwner: null, repoName: null };
}

export async function loadProjects(url: string, fetchFn: typeof fetch = fetch): Promise<ArmoryProject[]> {
  const res = await fetchFn(url, { cache: "no-store" } as RequestInit);
  if (!res.ok) throw new Error(`projects.json ${res.status}`);
  return (await res.json()) as ArmoryProject[];
}
