import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { analyzeUrl } from "@/lib/analyze";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    let analysis;
    try {
      analysis = await analyzeUrl(parsedUrl.toString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Save to leaderboard (fire-and-forget)
    const hostname = parsedUrl.hostname.replace(/^www\./, "");
    try {
      await kv.zadd("leaderboard", { score: analysis.overall, member: hostname });
      await kv.set(`score:${hostname}`, {
        hostname,
        overall: analysis.overall,
        categories: analysis.categories,
        summary: analysis.summary,
        topStrength: analysis.topStrength,
        topImprovement: analysis.topImprovement,
        scoredAt: new Date().toISOString(),
      });
    } catch {
      // KV not configured - silently continue
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
