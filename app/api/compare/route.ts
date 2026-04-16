import { NextRequest, NextResponse } from "next/server";
import { analyzeUrl } from "@/lib/analyze";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { url1, url2 } = await request.json();

    if (!url1 || !url2) {
      return NextResponse.json(
        { error: "Two URLs are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    let parsedUrl1: URL;
    let parsedUrl2: URL;
    try {
      parsedUrl1 = new URL(url1.startsWith("http") ? url1 : `https://${url1}`);
      parsedUrl2 = new URL(url2.startsWith("http") ? url2 : `https://${url2}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Run both analyses in parallel
    const [site1, site2] = await Promise.all([
      analyzeUrl(parsedUrl1.toString()),
      analyzeUrl(parsedUrl2.toString()),
    ]);

    return NextResponse.json({ site1, site2 });
  } catch (error) {
    console.error("Compare error:", error);
    const message =
      error instanceof Error ? error.message : "Comparison failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
