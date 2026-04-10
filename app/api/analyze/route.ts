import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANALYSIS_PROMPT = `Analyze this website screenshot as a senior UI/UX designer. Score each category from 0 to 20 and provide exactly 2 specific, actionable feedback items per category.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "overall": <sum of all 5 category scores, 0-100>,
  "categories": {
    "typography": { "score": <0-20>, "feedback": ["<specific observation>", "<specific observation>"] },
    "color": { "score": <0-20>, "feedback": ["<specific observation>", "<specific observation>"] },
    "spacing": { "score": <0-20>, "feedback": ["<specific observation>", "<specific observation>"] },
    "layout": { "score": <0-20>, "feedback": ["<specific observation>", "<specific observation>"] },
    "polish": { "score": <0-20>, "feedback": ["<specific observation>", "<specific observation>"] }
  },
  "summary": "<one sentence overall impression>",
  "topStrength": "<the single best design aspect>",
  "topImprovement": "<the single most impactful thing to fix>"
}

Scoring guide:
- Typography (0-20): Font choices/pairing, heading hierarchy, text readability, size consistency and scale
- Color (0-20): Palette harmony, text-to-background contrast, accent color usage, overall mood/tone
- Spacing (0-20): Padding/margin rhythm, whitespace usage, element grouping/proximity, content density
- Layout (0-20): Visual hierarchy, alignment and grid usage, information flow, content organization
- Polish (0-20): Attention to detail, cross-element consistency, use of modern patterns, professional finish

Be honest, specific, and reference actual elements visible in the screenshot. Avoid generic feedback.`;

async function getScreenshot(url: string): Promise<string> {
  // Use Microlink API for screenshots
  const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&screenshot.width=1280&screenshot.height=800&screenshot.type=png`;

  const response = await fetch(apiUrl, { signal: AbortSignal.timeout(20000) });

  if (!response.ok) {
    throw new Error("Failed to capture screenshot");
  }

  const data = await response.json();
  const screenshotUrl = data?.data?.screenshot?.url;

  if (!screenshotUrl) {
    throw new Error("No screenshot returned");
  }

  // Fetch the actual image
  const imgResponse = await fetch(screenshotUrl);
  const buffer = await imgResponse.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Get screenshot
    const screenshotBase64 = await getScreenshot(parsedUrl.toString());

    // Analyze with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: screenshotBase64,
              },
            },
            {
              type: "text",
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract JSON from response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON - handle potential markdown wrapping
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const analysis = JSON.parse(jsonStr);

    // Validate and clamp scores
    const categories = ["typography", "color", "spacing", "layout", "polish"];
    let total = 0;
    for (const cat of categories) {
      if (analysis.categories[cat]) {
        analysis.categories[cat].score = Math.min(
          20,
          Math.max(0, Math.round(analysis.categories[cat].score))
        );
        total += analysis.categories[cat].score;
      }
    }
    analysis.overall = total;

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
