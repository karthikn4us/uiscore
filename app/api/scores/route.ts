import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const revalidate = 30; // cache for 30 seconds

export async function GET() {
  try {
    // Get all hostnames sorted by score (highest first)
    const hostnames = await kv.zrange("leaderboard", 0, 49, { rev: true });

    if (!hostnames || hostnames.length === 0) {
      return NextResponse.json({ scores: [] });
    }

    // Fetch details for each hostname
    const pipeline = kv.pipeline();
    for (const hostname of hostnames) {
      pipeline.get(`score:${hostname}`);
    }
    const details = await pipeline.exec();

    const scores = details
      .filter(Boolean)
      .map((d, i) => ({ ...(d as Record<string, unknown>), rank: i + 1 }));

    return NextResponse.json({ scores });
  } catch {
    return NextResponse.json({ scores: [], error: "Could not load scores" });
  }
}
