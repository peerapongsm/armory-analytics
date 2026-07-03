import { NextResponse } from "next/server";
import { getSummary } from "../../../lib/getSummary";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const data = await getSummary();
  return NextResponse.json({ generatedAt: Date.now(), projects: data });
}
