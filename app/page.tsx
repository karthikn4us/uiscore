"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AnalysisResult, AppState } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";

const LOADING_MESSAGES = [
  "Capturing screenshot...",
  "Analyzing typography choices...",
  "Checking color harmony...",
  "Measuring spacing rhythm...",
  "Evaluating layout structure...",
  "Calculating your score...",
];

function getScoreColor(score: number, max: number = 100): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#eab308";
  if (pct >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Great";
  if (score >= 70) return "Good";
  if (score >= 60) return "Decent";
  if (score >= 50) return "Needs Work";
  if (score >= 40) return "Below Average";
  return "Poor";
}

// --- Score Ring Component ---
function ScoreRing({
  score,
  animated,
}: {
  score: number;
  animated: boolean;
}) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-52 h-52">
        {/* Background ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="10"
        />
        {/* Score ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          className="score-ring-circle"
          transform="rotate(-90 100 100)"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-6xl font-bold tracking-tight" style={{ color }}>
          {animated ? score : 0}
        </div>
        <div className="text-sm text-zinc-400 mt-1">
          {animated ? getScoreLabel(score) : ""}
        </div>
      </div>
    </div>
  );
}

// --- Category Bar Component ---
function CategoryBar({
  name,
  score,
  feedback,
  animated,
  delay,
}: {
  name: string;
  score: number;
  feedback: string[];
  animated: boolean;
  delay: number;
}) {
  const meta = CATEGORY_META[name];
  const pct = (score / 20) * 100;
  const color = getScoreColor(score, 20);

  return (
    <div
      className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg opacity-60">{meta.icon}</span>
          <span className="font-medium text-zinc-200">{meta.label}</span>
        </div>
        <span className="font-mono font-bold text-lg" style={{ color }}>
          {score}
          <span className="text-zinc-500 text-sm font-normal">/20</span>
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: animated ? `${pct}%` : "0%",
            backgroundColor: color,
            transitionDelay: `${delay}ms`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
      {/* Feedback */}
      <div className="space-y-1.5">
        {feedback.map((item, i) => (
          <p key={i} className="text-sm text-zinc-400 leading-relaxed">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

// --- Share Card (hidden, rendered to image for LinkedIn) ---
function ShareCard({
  results,
  siteUrl,
  cardRef,
}: {
  results: AnalysisResult;
  siteUrl: string;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const color = getScoreColor(results.overall);
  const hostname = siteUrl.replace(/https?:\/\//, "").split("/")[0];
  const cats = Object.entries(results.categories);

  return (
    <div
      ref={cardRef}
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: 1200,
        height: 630,
        background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: "#fafafa",
        display: "flex",
        flexDirection: "column",
        padding: "48px 56px",
        overflow: "hidden",
      }}
    >
      {/* Decorative gradient orb */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #a855f7, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            UI
          </div>
          <span style={{ fontWeight: 600, fontSize: 22 }}>UIScore</span>
        </div>
        <span style={{ color: "#71717a", fontSize: 16, fontFamily: "monospace" }}>{hostname}</span>
      </div>

      {/* Main content */}
      <div style={{ display: "flex", flex: 1, gap: 56 }}>
        {/* Score ring area */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 220 }}>
          <svg viewBox="0 0 200 200" width="180" height="180">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#27272a" strokeWidth="10" />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 80}
              strokeDashoffset={2 * Math.PI * 80 - (results.overall / 100) * 2 * Math.PI * 80}
              transform="rotate(-90 100 100)"
            />
            <text x="100" y="92" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="56" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
              {results.overall}
            </text>
            <text x="100" y="128" textAnchor="middle" fill="#a1a1aa" fontSize="16" fontFamily="Inter, system-ui, sans-serif">
              {getScoreLabel(results.overall)}
            </text>
          </svg>
        </div>

        {/* Category bars */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          {cats.map(([name, data]) => {
            const meta = CATEGORY_META[name];
            const barColor = getScoreColor(data.score, 20);
            const pct = (data.score / 20) * 100;
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ width: 110, fontSize: 15, color: "#d4d4d8", fontWeight: 500 }}>
                  {meta.icon} {meta.label}
                </span>
                <div style={{ flex: 1, height: 10, backgroundColor: "#27272a", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: barColor, borderRadius: 5 }} />
                </div>
                <span style={{ width: 55, textAlign: "right", fontFamily: "monospace", fontWeight: 600, fontSize: 15, color: barColor }}>
                  {data.score}/20
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary + CTA */}
      <div style={{ borderTop: "1px solid #27272a", marginTop: 32, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ color: "#a1a1aa", fontSize: 14, maxWidth: 700, lineHeight: 1.5, margin: 0 }}>
          {results.summary}
        </p>
        <span style={{ color: "#a855f7", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
          uiscore.vercel.app
        </span>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [animated, setAnimated] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const scoreCardRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Cycle loading messages
  useEffect(() => {
    if (state !== "loading") return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[idx]);
    }, 2500);
    return () => clearInterval(interval);
  }, [state]);

  // Trigger score animation after results render
  useEffect(() => {
    if (state === "results") {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
    setAnimated(false);
  }, [state]);

  const analyze = useCallback(async () => {
    if (!url.trim()) return;
    setState("loading");
    setLoadingMsg(LOADING_MESSAGES[0]);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResults(data);
      setState("results");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setState("error");
    }
  }, [url]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") analyze();
  };

  const reset = () => {
    setState("idle");
    setResults(null);
    setUrl("");
    setError("");
  };

  const generateScorecardImage = async (): Promise<string | null> => {
    if (!shareCardRef.current) return null;
    const { toPng } = await import("html-to-image");
    try {
      return await toPng(shareCardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        width: 1200,
        height: 630,
      });
    } catch (err) {
      console.error("Failed to generate image:", err);
      return null;
    }
  };

  const downloadScorecard = async () => {
    const dataUrl = await generateScorecardImage();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `uiscore-${url.replace(/https?:\/\//, "").split("/")[0]}.png`;
    link.href = dataUrl;
    link.click();
  };

  const shareOnLinkedIn = async () => {
    if (!results) return;
    setShareStatus("Generating scorecard...");

    // Generate and download the image first
    const dataUrl = await generateScorecardImage();
    if (dataUrl) {
      const link = document.createElement("a");
      link.download = `uiscore-${url.replace(/https?:\/\//, "").split("/")[0]}.png`;
      link.href = dataUrl;
      link.click();
    }

    // Open LinkedIn compose
    const hostname = url.replace(/https?:\/\//, "").split("/")[0];
    const text = `I just scored ${hostname}'s design using UIScore and it got ${results.overall}/100!\n\n${results.summary}\n\nScore your own website's design: https://uiscore.vercel.app`;
    window.open(
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`,
      "_blank"
    );

    setShareStatus("Scorecard downloaded! Attach it to your LinkedIn post.");
    setTimeout(() => setShareStatus(""), 5000);
  };

  return (
    <main className="min-h-screen bg-grid bg-glow">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <button onClick={reset} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            UI
          </div>
          <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
            UIScore
          </span>
        </button>
        {state === "results" && (
          <button
            onClick={reset}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Score another
          </button>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {/* ============ IDLE STATE ============ */}
        {state === "idle" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="mb-8 animate-fade-in">
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4">
                Score Your{" "}
                <span className="gradient-text">UI</span>
              </h1>
              <p className="text-lg text-zinc-400 max-w-md mx-auto">
                Instant AI-powered design feedback. Paste a URL and get scored
                on typography, color, spacing, layout, and polish.
              </p>
            </div>

            {/* URL Input */}
            <div className="w-full max-w-xl glow-border rounded-2xl animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center bg-zinc-900 rounded-2xl">
                <div className="pl-5 text-zinc-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter any website URL..."
                  className="flex-1 bg-transparent px-4 py-4 text-white placeholder:text-zinc-500 focus:outline-none text-lg"
                  autoFocus
                />
                <button
                  onClick={analyze}
                  disabled={!url.trim()}
                  className="mr-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Score
                </button>
              </div>
            </div>

            {/* How it works */}
            <div
              className="flex gap-8 mt-16 text-sm text-zinc-500 animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              {[
                { step: "1", text: "Paste any URL" },
                { step: "2", text: "AI analyzes the design" },
                { step: "3", text: "Get your score & feedback" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                    {item.step}
                  </span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ LOADING STATE ============ */}
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            {/* Animated spinner */}
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full border-2 border-zinc-800" />
              <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
            </div>
            <p className="text-lg text-zinc-300 transition-all duration-300">
              {loadingMsg}
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              Analyzing{" "}
              <span className="text-zinc-400 font-mono">
                {url.replace(/https?:\/\//, "").split("/")[0]}
              </span>
            </p>
            {/* Progress dots */}
            <div className="flex gap-1.5 mt-6">
              {LOADING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    i <= LOADING_MESSAGES.indexOf(loadingMsg)
                      ? "bg-purple-500"
                      : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ============ ERROR STATE ============ */}
        {state === "error" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
              <span className="text-3xl">!</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Analysis Failed</h2>
            <p className="text-zinc-400 mb-6 max-w-md">{error}</p>
            <button
              onClick={reset}
              className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ============ RESULTS STATE ============ */}
        {state === "results" && results && (
          <div>
            {/* Hidden share card for image generation */}
            <ShareCard results={results} siteUrl={url} cardRef={shareCardRef} />

            {/* Score header */}
            <div className="text-center mt-8 mb-12 animate-fade-in">
              <p className="text-sm text-zinc-500 font-mono mb-6">
                {url.replace(/https?:\/\//, "").split("/")[0]}
              </p>
              <ScoreRing score={results.overall} animated={animated} />
              <p className="text-zinc-400 mt-6 max-w-lg mx-auto text-lg">
                {results.summary}
              </p>
            </div>

            {/* Strengths and improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "forwards", opacity: 0 }}>
                <div className="text-sm text-green-400 font-medium mb-1">
                  Top Strength
                </div>
                <p className="text-zinc-300">{results.topStrength}</p>
              </div>
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 animate-slide-up" style={{ animationDelay: "300ms", animationFillMode: "forwards", opacity: 0 }}>
                <div className="text-sm text-orange-400 font-medium mb-1">
                  Top Improvement
                </div>
                <p className="text-zinc-300">{results.topImprovement}</p>
              </div>
            </div>

            {/* Category breakdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {Object.entries(results.categories).map(
                ([name, data], idx) => (
                  <CategoryBar
                    key={name}
                    name={name}
                    score={data.score}
                    feedback={data.feedback}
                    animated={animated}
                    delay={400 + idx * 100}
                  />
                )
              )}
            </div>

            {/* Share section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-zinc-800/50">
              <button
                onClick={downloadScorecard}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download Scorecard
              </button>
              <button
                onClick={shareOnLinkedIn}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-medium text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Share on LinkedIn
              </button>
            </div>
            {shareStatus && (
              <p className="text-center text-sm text-purple-400 mt-4 animate-fade-in">
                {shareStatus}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-zinc-600">
        Built by{" "}
        <a
          href="https://linkedin.com/in/karthikn"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Karthik
        </a>{" "}
        - Powered by Claude AI
      </footer>
    </main>
  );
}
