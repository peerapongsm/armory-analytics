export async function getDownloads(
  owner: string,
  name: string,
  deps: { fetchFn?: typeof fetch } = {}
): Promise<number> {
  const fetchFn = deps.fetchFn ?? fetch;
  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetchFn(`https://api.github.com/repos/${owner}/${name}/releases?per_page=100`, { headers });
  if (!res.ok) throw new Error(`gh releases ${res.status}`);
  const releases = (await res.json()) as { assets: { download_count: number }[] }[];
  return releases.reduce((sum, r) => sum + r.assets.reduce((s, a) => s + (a.download_count || 0), 0), 0);
}
