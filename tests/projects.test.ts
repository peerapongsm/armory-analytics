import { test, expect } from "vitest";
import { toTarget, parseRepo, loadProjects } from "../lib/projects";

test("parseRepo extracts owner/name", () => {
  expect(parseRepo("https://github.com/peerapongsm/armory")).toEqual({ owner: "peerapongsm", name: "armory" });
  expect(parseRepo("")).toBeNull();
});

test("web project -> web target with hostname+path", () => {
  const t = toTarget({ id: 1, name: "Armory", slug: "armory", track: "live", status: "done",
    url: "https://peerapongsm.github.io/armory/", repo: "https://github.com/peerapongsm/armory", download: "" });
  expect(t).toMatchObject({ id: 1, kind: "web", hostname: "peerapongsm.github.io", pathPrefix: "/armory/" });
});

test("desktop project -> desktop target with repo owner/name", () => {
  const t = toTarget({ id: 13, name: "Farmer", slug: "farmer", track: "desktop", status: "done",
    url: "", repo: "https://github.com/peerapongsm/farmer-companion", download: "https://github.com/peerapongsm/farmer-companion/releases" });
  expect(t).toMatchObject({ id: 13, kind: "desktop", repoOwner: "peerapongsm", repoName: "farmer-companion" });
});

test("planned project with no url/repo -> null (unmeasurable)", () => {
  const t = toTarget({ id: 2, name: "x", slug: "x", track: "live", status: "planned",
    url: "", repo: "", download: "" });
  expect(t).toBeNull();
});

test("loadProjects fetches and parses array", async () => {
  const fake = async () => new Response(JSON.stringify([{ id: 1, name: "A", slug: "a", track: "live", status: "done", url: "https://h.test/a/", repo: "", download: "" }]), { status: 200 });
  const ps = await loadProjects("https://x/projects.json", fake as unknown as typeof fetch);
  expect(ps).toHaveLength(1);
  expect(ps[0].id).toBe(1);
});
