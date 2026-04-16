"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import type { AnalysisResult, AppState, AppMode, CompareResult } from "@/lib/types";
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

function hostname(url: string): string {
  return url.replace(/https?:\/\//, "").split("/")[0];
}

// --- Screenshot Frame ---
function ScreenshotFrame({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/60">
      {/* Browser chrome bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-50 border-b border-neutral-100">
        <div className="w-2 h-2 rounded-full bg-neutral-200" />
        <div className="w-2 h-2 rounded-full bg-neutral-200" />
        <div className="w-2 h-2 rounded-full bg-neutral-200" />
        <div className="flex-1 mx-2 h-4 bg-neutral-100 rounded text-[10px] text-neutral-400 flex items-center px-2 font-mono truncate">
          {alt}
        </div>
      </div>
      {!loaded && (
        <div className="w-full aspect-[16/10] bg-neutral-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full aspect-[16/10] object-cover object-top transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

// --- Score Ring ---
function ScoreRing({ score, animated, size = "lg" }: { score: number; animated: boolean; size?: "lg" | "sm" }) {
  const radius = size === "lg" ? 80 : 54;
  const viewBox = size === "lg" ? 200 : 130;
  const center = viewBox / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className={size === "lg" ? "w-44 h-44" : "w-28 h-28"}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f5f5f5" strokeWidth={size === "lg" ? 5 : 4} />
        <circle
          cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={size === "lg" ? 5 : 4}
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          className="score-ring-circle" transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`font-semibold tracking-tight ${size === "lg" ? "text-6xl" : "text-3xl"}`} style={{ color }}>
          {animated ? score : 0}
        </div>
        <div className={`text-neutral-400 mt-0.5 ${size === "lg" ? "text-xs" : "text-[10px]"}`}>
          {animated ? getScoreLabel(score) : ""}
        </div>
      </div>
    </div>
  );
}

// --- Single Site Breakdown ---
function CategoryBreakdown({ results, animated, delayBase = 350 }: { results: AnalysisResult; animated: boolean; delayBase?: number }) {
  return (
    <div className="bg-neutral-50 rounded-2xl">
      {Object.entries(results.categories).map(([name, data], idx) => {
        const meta = CATEGORY_META[name];
        const pct = (data.score / 20) * 100;
        const color = getScoreColor(data.score, 20);
        return (
          <div key={name} className={`px-6 py-5 ${idx > 0 ? "border-t border-neutral-100" : ""}`}>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-[100px] shrink-0">
                <span className="text-xs opacity-30">{meta.icon}</span>
                <span className="text-sm font-medium text-neutral-700">{meta.label}</span>
              </div>
              <div className="flex-1 h-1 bg-neutral-200/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: animated ? `${pct}%` : "0%", backgroundColor: color, transitionDelay: `${delayBase + idx * 80}ms` }} />
              </div>
              <span className="font-mono text-sm font-semibold w-[50px] text-right" style={{ color }}>
                {data.score}<span className="text-neutral-300 font-normal">/20</span>
              </span>
            </div>
            <div className="pl-[116px] space-y-1">
              {data.feedback.map((item, i) => (
                <p key={i} className="text-xs text-neutral-400 leading-relaxed">{item}</p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Compare Category Row ---
function CompareCategoryRow({ name, score1, score2, animated, delay }: {
  name: string; score1: number; score2: number; animated: boolean; delay: number;
}) {
  const meta = CATEGORY_META[name];
  const pct1 = (score1 / 20) * 100;
  const pct2 = (score2 / 20) * 100;
  const color1 = getScoreColor(score1, 20);
  const color2 = getScoreColor(score2, 20);
  const winner = score1 > score2 ? 1 : score2 > score1 ? 2 : 0;

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Site 1 score */}
      <span className={`font-mono text-sm w-8 text-right ${winner === 1 ? "font-semibold" : "text-neutral-400"}`} style={winner === 1 ? { color: color1 } : {}}>
        {score1}
      </span>
      {/* Site 1 bar (right-aligned, grows left) */}
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden flex justify-end">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: animated ? `${pct1}%` : "0%", backgroundColor: color1, transitionDelay: `${delay}ms` }} />
      </div>
      {/* Label */}
      <span className="text-xs text-neutral-500 font-medium w-20 text-center shrink-0">{meta.label}</span>
      {/* Site 2 bar (left-aligned, grows right) */}
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: animated ? `${pct2}%` : "0%", backgroundColor: color2, transitionDelay: `${delay}ms` }} />
      </div>
      {/* Site 2 score */}
      <span className={`font-mono text-sm w-8 ${winner === 2 ? "font-semibold" : "text-neutral-400"}`} style={winner === 2 ? { color: color2 } : {}}>
        {score2}
      </span>
    </div>
  );
}

// --- Share Card (hidden, for LinkedIn image export) ---
function ShareCard({
  results, siteUrl, cardRef,
}: {
  results: AnalysisResult; siteUrl: string; cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const color = getScoreColor(results.overall);
  const host = hostname(siteUrl);
  const cats = Object.entries(results.categories);

  return (
    <div ref={cardRef} style={{
      position: "absolute", left: "-9999px", top: 0, width: 1200, height: 630,
      background: "linear-gradient(135deg, #0d0d0d 0%, #171717 50%, #0d0d0d 100%)",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      color: "#fafafa", display: "flex", flexDirection: "column", padding: "48px 56px", overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", color: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>UI</div>
          <span style={{ fontWeight: 600, fontSize: 22 }}>UIScore</span>
        </div>
        <span style={{ color: "#737373", fontSize: 16, fontFamily: "monospace" }}>{host}</span>
      </div>
      <div style={{ display: "flex", flex: 1, gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 220 }}>
          <svg viewBox="0 0 200 200" width="180" height="180">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#262626" strokeWidth="5" />
            <circle cx="100" cy="100" r="80" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 80} strokeDashoffset={2 * Math.PI * 80 - (results.overall / 100) * 2 * Math.PI * 80}
              transform="rotate(-90 100 100)" />
            <text x="100" y="92" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="56" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">{results.overall}</text>
            <text x="100" y="128" textAnchor="middle" fill="#a3a3a3" fontSize="16" fontFamily="Inter, system-ui, sans-serif">{getScoreLabel(results.overall)}</text>
          </svg>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          {cats.map(([name, data]) => {
            const meta = CATEGORY_META[name];
            const barColor = getScoreColor(data.score, 20);
            const barPct = (data.score / 20) * 100;
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ width: 110, fontSize: 15, color: "#d4d4d4", fontWeight: 500 }}>{meta.icon} {meta.label}</span>
                <div style={{ flex: 1, height: 8, backgroundColor: "#262626", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barPct}%`, backgroundColor: barColor, borderRadius: 4 }} />
                </div>
                <span style={{ width: 55, textAlign: "right", fontFamily: "monospace", fontWeight: 600, fontSize: 15, color: barColor }}>{data.score}/20</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ borderTop: "1px solid #262626", marginTop: 32, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ color: "#a3a3a3", fontSize: 14, maxWidth: 700, lineHeight: 1.5, margin: 0 }}>{results.summary}</p>
        <span style={{ color: "#ffffff", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>uiscore.vercel.app</span>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function Home() {
  const [mode, setMode] = useState<AppMode>("score");
  const [state, setState] = useState<AppState>("idle");
  const [url, setUrl] = useState("");
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [compareResults, setCompareResults] = useState<CompareResult | null>(null);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [animated, setAnimated] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== "loading") return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[idx]);
    }, 2500);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === "results") {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
    setAnimated(false);
    setShowPrompt(false);
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
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResults(data);
      setState("results");
      track("analysis_completed", { url: hostname(url.trim()), score: data.overall });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, [url]);

  const compare = useCallback(async () => {
    if (!url1.trim() || !url2.trim()) return;
    setState("loading");
    setLoadingMsg(LOADING_MESSAGES[0]);
    setError("");
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url1: url1.trim(), url2: url2.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comparison failed");
      setCompareResults(data);
      setState("results");
      track("comparison_completed", { url1: hostname(url1.trim()), url2: hostname(url2.trim()) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, [url1, url2]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (mode === "score") analyze();
      else compare();
    }
  };

  const reset = () => {
    setState("idle");
    setResults(null);
    setCompareResults(null);
    setUrl("");
    setUrl1("");
    setUrl2("");
    setError("");
  };

  const generateScorecardImage = async (): Promise<string | null> => {
    if (!shareCardRef.current) return null;
    const { toPng } = await import("html-to-image");
    try {
      return await Promise.race([
        toPng(shareCardRef.current, { quality: 0.95, pixelRatio: 2, width: 1200, height: 630 }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
      ]);
    } catch (err) {
      console.error("Failed to generate image:", err);
      return null;
    }
  };

  const downloadScorecard = async () => {
    track("scorecard_downloaded");
    const dataUrl = await generateScorecardImage();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `uiscore-${hostname(url)}.png`;
    link.href = dataUrl;
    link.click();
  };

  const shareOnLinkedIn = async () => {
    if (!results) return;
    const host = hostname(url);
    const text = `I just scored ${host}'s design using UIScore and it got ${results.overall}/100!\n\n${results.summary}\n\nScore your own website's design: https://uiscore.vercel.app`;
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, "_blank");
    setShareStatus("Downloading scorecard...");
    try {
      const dataUrl = await generateScorecardImage();
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `uiscore-${host}.png`;
        link.href = dataUrl;
        link.click();
        setShareStatus("Scorecard downloaded! Attach it to your LinkedIn post.");
      } else {
        setShareStatus("");
      }
    } catch {
      setShareStatus("");
    }
    setTimeout(() => setShareStatus(""), 5000);
  };

  const shareCompareOnLinkedIn = () => {
    if (!compareResults) return;
    const h1 = hostname(url1);
    const h2 = hostname(url2);
    const winner = compareResults.site1.overall >= compareResults.site2.overall ? h1 : h2;
    const text = `I compared ${h1} (${compareResults.site1.overall}/100) vs ${h2} (${compareResults.site2.overall}/100) on UIScore.\n\nWinner: ${winner}\n\nCompare any two websites: https://uiscore.vercel.app`;
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, "_blank");
  };

  const generatePrompt = (): string => {
    if (!results) return "";
    const host = hostname(url);
    const lines = [`Improve the UI/UX of ${host} based on this design audit (scored ${results.overall}/100).`, ""];
    lines.push(`Summary: ${results.summary}`, "");
    lines.push("Fix the following issues by priority:", "");
    const sorted = Object.entries(results.categories).sort(([, a], [, b]) => a.score - b.score);
    for (const [name, data] of sorted) {
      const meta = CATEGORY_META[name];
      lines.push(`## ${meta.label} (${data.score}/20)`);
      for (const fb of data.feedback) lines.push(`- ${fb}`);
      lines.push("");
    }
    lines.push("For each fix, edit the relevant CSS/HTML files directly. Focus on the highest-impact changes first. Do not refactor unrelated code.");
    return lines.join("\n");
  };

  const copyPrompt = async () => {
    track("prompt_copied");
    await navigator.clipboard.writeText(generatePrompt());
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const isCompareMode = mode === "compare";

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <button onClick={reset} className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-[10px]">UI</div>
          <span className="font-semibold text-neutral-900">UIScore</span>
        </button>
        <div className="flex items-center gap-2">
          <Link href="/leaderboard" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors px-3 py-1.5 rounded-full hover:bg-neutral-100">Leaderboard</Link>
          {state === "results" && (
            <button onClick={reset} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors px-3 py-1.5 rounded-full hover:bg-neutral-100">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
              New
            </button>
          )}
        </div>
      </header>

      <div className={`mx-auto px-6 pb-20 ${isCompareMode && state === "results" ? "max-w-5xl" : "max-w-3xl"}`}>
        {/* ============ IDLE ============ */}
        {state === "idle" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 text-neutral-900 opacity-0 animate-slide-up" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
                {isCompareMode ? "Compare two sites." : "Score your UI."}
              </h1>
              <p className="text-base sm:text-lg text-neutral-400 max-w-md mx-auto leading-relaxed opacity-0 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
                {isCompareMode ? "See which design wins, category by category." : "AI-powered design feedback in seconds."}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-0.5 mb-6 opacity-0 animate-slide-up" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
              <button onClick={() => setMode("score")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!isCompareMode ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                Score
              </button>
              <button onClick={() => setMode("compare")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${isCompareMode ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                Compare
              </button>
            </div>

            {/* Single URL input */}
            {!isCompareMode && (
              <div className="w-full max-w-xl opacity-0 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-3xl transition-all focus-within:border-neutral-400 focus-within:bg-white">
                  <div className="pl-5 text-neutral-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                  </div>
                  <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Enter any website URL..." className="flex-1 min-w-0 bg-transparent px-3 py-4 text-neutral-900 placeholder:text-neutral-400 focus:outline-none text-base" autoFocus />
                  <button onClick={analyze} disabled={!url.trim()}
                    className="mr-2 shrink-0 px-5 py-2 rounded-full bg-neutral-900 text-white font-medium text-sm transition-all duration-200 hover:bg-neutral-700 active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed">
                    Score
                  </button>
                </div>
              </div>
            )}

            {/* Compare inputs */}
            {isCompareMode && (
              <div className="w-full max-w-2xl opacity-0 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <div className="flex-1 flex items-center bg-neutral-50 border border-neutral-200 rounded-2xl transition-all focus-within:border-neutral-400 focus-within:bg-white">
                    <input type="text" value={url1} onChange={(e) => setUrl1(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder="First URL..." className="flex-1 min-w-0 bg-transparent px-4 py-3.5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none text-sm" autoFocus />
                  </div>
                  <div className="flex items-center justify-center text-neutral-300 text-sm font-medium shrink-0 sm:px-1">vs</div>
                  <div className="flex-1 flex items-center bg-neutral-50 border border-neutral-200 rounded-2xl transition-all focus-within:border-neutral-400 focus-within:bg-white">
                    <input type="text" value={url2} onChange={(e) => setUrl2(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder="Second URL..." className="flex-1 min-w-0 bg-transparent px-4 py-3.5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none text-sm" />
                  </div>
                </div>
                <div className="text-center mt-4">
                  <button onClick={compare} disabled={!url1.trim() || !url2.trim()}
                    className="px-6 py-2.5 rounded-full bg-neutral-900 text-white font-medium text-sm transition-all duration-200 hover:bg-neutral-700 active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed">
                    Compare
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ LOADING ============ */}
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="relative mb-8">
              <div className="w-16 h-16 rounded-full border-2 border-neutral-100" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-neutral-900 animate-spin" />
            </div>
            <p className="text-base text-neutral-700">{loadingMsg}</p>
            <p className="text-sm text-neutral-400 mt-2">
              {isCompareMode ? (
                <><span className="font-mono">{hostname(url1)}</span> vs <span className="font-mono">{hostname(url2)}</span></>
              ) : (
                <span className="font-mono">{hostname(url)}</span>
              )}
            </p>
            <div className="flex gap-1.5 mt-6">
              {LOADING_MESSAGES.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i <= LOADING_MESSAGES.indexOf(loadingMsg) ? "bg-neutral-900" : "bg-neutral-200"}`} />
              ))}
            </div>
          </div>
        )}

        {/* ============ ERROR ============ */}
        {state === "error" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            </div>
            <h2 className="text-base font-medium text-neutral-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm">{error}</p>
            <button onClick={reset} className="px-5 py-2 rounded-full bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-700 transition-colors">Try again</button>
          </div>
        )}

        {/* ============ SCORE RESULTS ============ */}
        {state === "results" && !isCompareMode && results && (
          <div>
            <ShareCard results={results} siteUrl={url} cardRef={shareCardRef} />

            {/* Screenshot */}
            {results.screenshotUrl && (
              <div className="mt-6 mb-8 max-w-2xl mx-auto opacity-0 animate-slide-up" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
                <ScreenshotFrame src={results.screenshotUrl} alt={hostname(url)} />
              </div>
            )}

            {/* Score hero */}
            <div className="text-center mb-10 animate-fade-in">
              <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-300 font-mono mb-5">{hostname(url)}</p>
              <ScoreRing score={results.overall} animated={animated} />
              <p className="text-neutral-500 mt-5 max-w-md mx-auto text-[15px] leading-relaxed">{results.summary}</p>
            </div>

            {/* Quick takeaways */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 mb-10 opacity-0 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
              <div>
                <p className="text-[11px] tracking-wide uppercase text-neutral-300 mb-1.5">Top strength</p>
                <p className="text-sm text-neutral-600 leading-relaxed">{results.topStrength}</p>
              </div>
              <div>
                <p className="text-[11px] tracking-wide uppercase text-neutral-300 mb-1.5">Top improvement</p>
                <p className="text-sm text-neutral-600 leading-relaxed">{results.topImprovement}</p>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
              <CategoryBreakdown results={results} animated={animated} />
            </div>

            {/* Design System */}
            {results.designSystem && (
              <div className="mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
                <p className="text-[11px] tracking-wide uppercase text-neutral-300 mb-4">Design System</p>
                <div className="bg-neutral-50 rounded-2xl p-6">
                  {/* Colors */}
                  {results.designSystem.colors.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs font-medium text-neutral-500 mb-3">Colors</p>
                      <div className="flex flex-wrap gap-4">
                        {results.designSystem.colors.map((c, i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5">
                            <div
                              className="w-10 h-10 rounded-full border border-neutral-200/60 shadow-sm"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-[10px] font-mono text-neutral-500">{c.hex}</span>
                            <span className="text-[10px] text-neutral-400 max-w-[80px] text-center leading-tight">{c.usage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fonts */}
                  {results.designSystem.fonts.length > 0 && (
                    <div className={results.designSystem.observations.length > 0 ? "mb-6" : ""}>
                      <p className="text-xs font-medium text-neutral-500 mb-3">Typography</p>
                      <div className="flex flex-wrap gap-x-8 gap-y-2">
                        {results.designSystem.fonts.map((f, i) => (
                          <div key={i} className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-neutral-800">{f.family}</span>
                            <span className="text-xs text-neutral-400">{f.usage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observations */}
                  {results.designSystem.observations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-neutral-500 mb-2">Notes</p>
                      <div className="space-y-1">
                        {results.designSystem.observations.map((obs, i) => (
                          <p key={i} className="text-xs text-neutral-400 leading-relaxed">{obs}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Claude Code prompt */}
            <div className="opacity-0 animate-slide-up" style={{ animationDelay: "650ms", animationFillMode: "forwards" }}>
              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-neutral-400">Fix these issues automatically</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowPrompt(!showPrompt)} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-2 py-1">
                    {showPrompt ? "Hide" : "View prompt"}
                  </button>
                  <button onClick={copyPrompt} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-700 transition-colors">
                    {promptCopied ? (
                      <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Copied</>
                    ) : "Copy prompt"}
                  </button>
                </div>
              </div>
              {showPrompt && (
                <pre className="text-xs text-neutral-500 bg-neutral-50 rounded-2xl p-5 mb-4 overflow-x-auto max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono animate-fade-in">
                  {generatePrompt()}
                </pre>
              )}
            </div>

            {/* Share */}
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-neutral-100 opacity-0 animate-slide-up" style={{ animationDelay: "750ms", animationFillMode: "forwards" }}>
              <button onClick={downloadScorecard} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Download
              </button>
              <button onClick={shareOnLinkedIn} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                Share on LinkedIn
              </button>
              {shareStatus && <p className="text-xs text-neutral-500 ml-2 animate-fade-in">{shareStatus}</p>}
            </div>
          </div>
        )}

        {/* ============ COMPARE RESULTS ============ */}
        {state === "results" && isCompareMode && compareResults && (
          <div className="animate-fade-in">
            {/* Screenshots side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 mb-10">
              {compareResults.site1.screenshotUrl && (
                <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
                  <ScreenshotFrame src={compareResults.site1.screenshotUrl} alt={hostname(url1)} />
                </div>
              )}
              {compareResults.site2.screenshotUrl && (
                <div className="opacity-0 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
                  <ScreenshotFrame src={compareResults.site2.screenshotUrl} alt={hostname(url2)} />
                </div>
              )}
            </div>

            {/* Score rings side by side */}
            <div className="grid grid-cols-2 gap-4 text-center mb-10 opacity-0 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-300 font-mono mb-3">{hostname(url1)}</p>
                <ScoreRing score={compareResults.site1.overall} animated={animated} size="sm" />
                <p className="text-neutral-500 mt-3 text-xs leading-relaxed max-w-xs mx-auto">{compareResults.site1.summary}</p>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-300 font-mono mb-3">{hostname(url2)}</p>
                <ScoreRing score={compareResults.site2.overall} animated={animated} size="sm" />
                <p className="text-neutral-500 mt-3 text-xs leading-relaxed max-w-xs mx-auto">{compareResults.site2.summary}</p>
              </div>
            </div>

            {/* Category comparison */}
            <div className="bg-neutral-50 rounded-2xl px-6 py-4 mb-10 opacity-0 animate-slide-up" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
              <div className="flex items-center justify-between text-[11px] tracking-wide uppercase text-neutral-300 mb-2 px-11">
                <span>{hostname(url1)}</span>
                <span>{hostname(url2)}</span>
              </div>
              {Object.keys(compareResults.site1.categories).map((name, idx) => (
                <CompareCategoryRow
                  key={name}
                  name={name}
                  score1={compareResults.site1.categories[name as keyof typeof compareResults.site1.categories].score}
                  score2={compareResults.site2.categories[name as keyof typeof compareResults.site2.categories].score}
                  animated={animated}
                  delay={400 + idx * 80}
                />
              ))}
            </div>

            {/* Winner callout */}
            <div className="text-center mb-10 opacity-0 animate-slide-up" style={{ animationDelay: "550ms", animationFillMode: "forwards" }}>
              {compareResults.site1.overall !== compareResults.site2.overall ? (
                <p className="text-sm text-neutral-500">
                  <span className="font-medium text-neutral-800">
                    {compareResults.site1.overall > compareResults.site2.overall ? hostname(url1) : hostname(url2)}
                  </span>
                  {" "}wins by{" "}
                  <span className="font-mono font-medium text-neutral-800">
                    {Math.abs(compareResults.site1.overall - compareResults.site2.overall)}
                  </span>
                  {" "}points
                </p>
              ) : (
                <p className="text-sm text-neutral-500">It&apos;s a tie at <span className="font-mono font-medium text-neutral-800">{compareResults.site1.overall}</span></p>
              )}
            </div>

            {/* Share */}
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-neutral-100 opacity-0 animate-slide-up" style={{ animationDelay: "650ms", animationFillMode: "forwards" }}>
              <button onClick={shareCompareOnLinkedIn} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                Share on LinkedIn
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-neutral-300">
        Built by{" "}
        <a href="https://www.linkedin.com/in/karthiknaralasetty/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-600 transition-colors">
          Karthik Naralasetty
        </a>
      </footer>
    </main>
  );
}
