export type Track = "live" | "desktop" | "demo";
export type Status = "done" | "building" | "planned";

export interface ArmoryProject {
  id: number;
  name: string;
  slug: string;
  track: Track;
  status: Status;
  url: string;
  repo: string;
  download: string;
}

// A project resolved into something analytics can measure.
export interface AnalyticsTarget {
  id: number;
  name: string;
  kind: "web" | "desktop";
  hostname: string | null;   // web only
  pathPrefix: string | null; // web only, e.g. "/armory/"
  repoOwner: string | null;  // desktop only, for releases
  repoName: string | null;   // desktop only
}

export interface WebStats {
  visitors: number;
  pageviews: number;
  avgVisitSeconds: number;
  bounceRate: number;        // 0..1
  returningRatio: number;    // 0..1
}

export interface ProjectMetrics {
  id: number;
  name: string;
  kind: "web" | "desktop";
  web: WebStats | null;
  downloads: number | null;  // desktop only
  score: number;             // 0..100
  graduate: boolean;
}
