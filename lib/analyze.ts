import type { AnalysisResult } from "./types";

export const ANALYSIS_PROMPT = `Analyze this website screenshot as a senior UI/UX designer. Score each category from 0 to 20 and provide exactly 2 specific, actionable feedback items per category. Also extract the visible design system tokens and generate CSS fixes.

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
  "topImprovement": "<the single most impactful thing to fix>",
  "designSystem": {
    "colors": [
      { "hex": "<hex color code>", "usage": "<where/how this color is used>" }
    ],
    "fonts": [
      { "family": "<font family name>", "usage": "<where this font is used>" }
    ],
    "observations": ["<design system observation>", "<design system observation>"]
  },
  "cssFixes": [
    { "description": "<what this CSS change fixes>", "css": "<valid CSS rule with !important>" }
  ]
}

Scoring guide:
- Typography (0-20): Font choices/pairing, heading hierarchy, text readability, size consistency and scale
- Color (0-20): Palette harmony, text-to-background contrast, accent color usage, overall mood/tone
- Spacing (0-20): Padding/margin rhythm, whitespace usage, element grouping/proximity, content density
- Layout (0-20): Visual hierarchy, alignment and grid usage, information flow, content organization
- Polish (0-20): Attention to detail, cross-element consistency, use of modern patterns, professional finish

Design system extraction guide:
- Colors: Extract 4-6 dominant colors visible in the screenshot. Include background, text, primary accent, secondary accent, and any other notable colors. Provide exact hex codes.
- Fonts: Identify 1-3 font families visible (heading font, body font, monospace if present). Best-guess the font family name.
- Observations: Provide 2-3 observations about the design system's consistency (e.g. spacing scale, number of font sizes, color palette cohesion, component patterns).

CSS fixes guide (CRITICAL - follow EVERY rule below. Violations will break the site):
- Generate 3-5 CSS fixes that address spacing, typography, and layout issues ONLY.
- Each fix MUST be a valid, self-contained CSS rule that can be injected as a <style> tag.
- ALWAYS use !important on every property to override existing styles.
- ABSOLUTELY NEVER change: color, background-color, background, border-color, fill, stroke, box-shadow, text-shadow, outline-color, or ANY color-related property. You MUST preserve the site's existing color scheme exactly as-is.
- ABSOLUTELY NEVER add colored backgrounds, colored borders, or colored text to any element.
- ONLY modify these safe properties: font-size, font-weight, line-height, letter-spacing, padding, margin, gap, border-radius, max-width, width, text-align.
- Target broad selectors: body, h1, h2, h3, h4, h5, h6, p, a, nav, main, section, footer, header, button.
- Do NOT use @media queries, @keyframes, JavaScript, or attribute selectors.
- The goal is SUBTLE refinement, not a redesign. The "after" should look like the same site but slightly more polished.
- Example good fix: "h1 { font-size: 3.2rem !important; line-height: 1.15 !important; letter-spacing: -0.02em !important; }"
- Example good fix: "section { padding: 4rem 2rem !important; }"
- Example BAD fix (NEVER do this): "button { background-color: green !important; }"
- Example BAD fix (NEVER do this): "nav { background: #f0f0f0 !important; }"

Be honest, specific, and reference actual elements visible in the screenshot. Avoid generic feedback.`;

export interface ScreenshotResult {
  base64: string;
  url: string;
}

export async function getScreenshot(url: string): Promise<ScreenshotResult> {
  const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&screenshot.width=1280&screenshot.height=800&screenshot.type=png&waitForTimeout=5000&waitUntil=networkidle0`;

  const response = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });

  if (!response.ok) {
    throw new Error(`Microlink returned ${response.status}`);
  }

  const data = await response.json();
  const screenshotUrl = data?.data?.screenshot?.url;

  if (!screenshotUrl) {
    throw new Error("No screenshot URL in response");
  }

  const imgResponse = await fetch(screenshotUrl);
  const buffer = await imgResponse.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return { base64, url: screenshotUrl };
}

export async function analyzeWithClaude(screenshotBase64: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
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
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find(
    (b: { type: string }) => b.type === "text"
  );
  return textBlock?.text || "";
}

export function parseAndClampAnalysis(responseText: string): AnalysisResult {
  let jsonStr = responseText.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const analysis = JSON.parse(jsonStr);

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

  return analysis as AnalysisResult;
}

/** Full pipeline: screenshot -> Claude -> parsed result */
export async function analyzeUrl(url: string): Promise<AnalysisResult & { screenshotUrl: string }> {
  const screenshot = await getScreenshot(url);
  const responseText = await analyzeWithClaude(screenshot.base64);
  const analysis = parseAndClampAnalysis(responseText);
  return { ...analysis, screenshotUrl: screenshot.url };
}
