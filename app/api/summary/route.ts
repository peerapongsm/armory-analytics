import { NextResponse } from "next/server";
import { getSummary } from "../../../lib/getSummary";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const data = await getSummary();
  return NextResponse.json(
    { generatedAt: Date.now(), asOf: new Date().toISOString(), projects: data },
    {
      headers: {
        // Public stats consumed cross-origin by nithat.peerapongsm.dev (the #52 retrospective).
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
