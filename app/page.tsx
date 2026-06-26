import { getSummary } from "../lib/getSummary";

export const dynamic = "force-dynamic";

export default async function Page() {
  const projects = await getSummary();
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Armory Analytics</h1>
      <p style={{ color: "#888" }}>365 things in a year — ranked by promotion score.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr><th align="left">#</th><th align="left">Project</th><th>Kind</th><th>Audience</th><th>Score</th><th>Graduate?</th></tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td align="center">{p.kind}</td>
              <td align="center">{p.kind === "web" ? `${p.web?.visitors ?? 0} vis` : `${p.downloads ?? 0} dl`}</td>
              <td align="center"><b>{p.score}</b></td>
              <td align="center">{p.graduate ? "✅" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
