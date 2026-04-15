"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
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

// --- Score Ring ---
function ScoreRing({ score, animated }: { score: number; animated: boolean }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-44 h-44">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#f5f5f5" strokeWidth="5" />
        <circle
          cx="100" cy="100" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          className="score-ring-circle" transform="rotate(-90 100 100)"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-6xl font-semibold tracking-tight" style={{ color }}>
          {animated ? score : 0}
        </div>
        <div className="text-xs text-neutral-400 mt-0.5 tracking-wide">
          {animated ? getScoreLabel(score) : ""}
        </div>
      </div>
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
  const hostname = siteUrl.replace(/https?:\/\//, "").split("/")[0];
  const cats = Object.entries(results.categories);

  return (
    <div
      ref={cardRef}
      style={{
        position: "absolute", left: "-9999px", top: 0, width: 1200, height: 630,
        background: "linear-gradient(135deg, #0d0d0d 0%, #171717 50%, #0d0d0d 100%)",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: "#fafafa", display: "flex", flexDirection: "column",
        padding: "48px 56px", overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "#fff", color: "#0d0d0d",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16,
          }}>UI</div>
          <span style={{ fontWeight: 600, fontSize: 22 }}>UIScore</span>
        </div>
        <span style={{ color: "#737373", fontSize: 16, fontFamily: "monospace" }}>{hostname}</span>
      </div>
      <div style={{ display: "flex", flex: 1, gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 220 }}>
          <svg viewBox="0 0 200 200" width="180" height="180">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#262626" strokeWidth="5" />
            <circle cx="100" cy="100" r="80" fill="none" stroke={color} strokeWidth="5"
              strokeLinecap="round" strokeDasharray={2 * Math.PI * 80}
              strokeDashoffset={2 * Math.PI * 80 - (results.overall / 100) * 2 * Math.PI * 80}
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
  const [state, setState] = useState<AppState>("idle");
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [animated, setAnimated] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const scoreCardRef = useRef<HTMLDivElement>(null);
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
      track("analysis_completed", {
        url: url.trim().replace(/https?:\/\//, "").split("/")[0],
        score: data.overall,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
      return await toPng(shareCardRef.current, { quality: 0.95, pixelRatio: 2, width: 1200, height: 630 });
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
    link.download = `uiscore-${url.replace(/https?:\/\//, "").split("/")[0]}.png`;
    link.href = dataUrl;
    link.click();
  };

  const shareOnLinkedIn = async () => {
    if (!results) return;
    setShareStatus("Generating scorecard...");
    const hostname = url.replace(/https?:\/\//, "").split("/")[0];
    const text = `I just scored ${hostname}'s design using UIScore and it got ${results.overall}/100!\n\n${results.summary}\n\nScore your own website's design: https://uiscore.vercel.app`;
    const dataUrl = await generateScorecardImage();
    if (dataUrl && navigator.share) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `uiscore-${hostname}.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ text, files: [file] });
          setShareStatus("");
          return;
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") { setShareStatus(""); return; }
      }
    }
    if (dataUrl) {
      const link = document.createElement("a");
      link.download = `uiscore-${hostname}.png`;
      link.href = dataUrl;
      link.click();
    }
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, "_blank");
    setShareStatus("Scorecard downloaded! Attach it to your LinkedIn post.");
    setTimeout(() => setShareStatus(""), 5000);
  };

  const generatePrompt = (): string => {
    if (!results) return "";
    const hostname = url.replace(/https?:\/\//, "").split("/")[0];
    const lines = [`Improve the UI/UX of ${hostname} based on this design audit (scored ${results.overall}/100).`, ""];
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

      <div className="max-w-3xl mx-auto px-6 pb-20">
        {/* ============ IDLE ============ */}
        {state === "idle" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 text-neutral-900 opacity-0 animate-slide-up" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
                Score your UI.
              </h1>
              <p className="text-base sm:text-lg text-neutral-400 max-w-md mx-auto leading-relaxed opacity-0 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
                AI-powered design feedback in seconds.
              </p>
            </div>
            <div className="w-full max-w-xl opacity-0 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
              <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-3xl transition-all focus-within:border-neutral-400 focus-within:bg-white">
                <div className="pl-5 text-neutral-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                </div>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Enter any website URL..." className="flex-1 min-w-0 bg-transparent px-3 py-4 text-neutral-900 placeholder:text-neutral-400 focus:outline-none text-base" autoFocus />
                <button onClick={analyze} disabled={!url.trim()}
                  className="mr-2 shrink-0 px-5 py-2 rounded-full bg-neutral-900 text-white font-medium text-sm transition-all duration-200 hover:bg-neutral-700 active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-neutral-900">
                  Score
                </button>
              </div>
            </div>
            <div className="flex items-center gap-8 mt-12 opacity-0 animate-slide-up" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
              {["Paste a URL", "AI analyzes", "Get your score"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && <div className="w-6 h-px bg-neutral-200 -ml-4 mr-0" />}
                  <span className="text-sm text-neutral-400">{label}</span>
                </div>
              ))}
            </div>
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
            <p className="text-sm text-neutral-400 mt-2"><span className="font-mono">{url.replace(/https?:\/\//, "").split("/")[0]}</span></p>
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
            <h2 className="text-base font-medium text-neutral-900 mb-2">Couldn&apos;t analyze that URL</h2>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm">{error}</p>
            <button onClick={reset} className="px-5 py-2 rounded-full bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-700 transition-colors">Try again</button>
          </div>
        )}

        {/* ============ RESULTS ============ */}
        {state === "results" && results && (
          <div>
            <ShareCard results={results} siteUrl={url} cardRef={shareCardRef} />

            {/* 1. Score hero */}
            <div className="text-center mt-6 mb-10 animate-fade-in">
              <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-300 font-mono mb-5">
                {url.replace(/https?:\/\//, "").split("/")[0]}
              </p>
              <ScoreRing score={results.overall} animated={animated} />
              <p className="text-neutral-500 mt-5 max-w-md mx-auto text-[15px] leading-relaxed">
                {results.summary}
              </p>
            </div>

            {/* 2. Quick takeaways */}
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

            {/* 3. Unified breakdown */}
            <div className="bg-neutral-50 rounded-2xl mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
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
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: animated ? `${pct}%` : "0%",
                            backgroundColor: color,
                            transitionDelay: `${350 + idx * 80}ms`,
                          }}
                        />
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

            {/* 4. Claude Code prompt (collapsed) */}
            <div className="opacity-0 animate-slide-up" style={{ animationDelay: "550ms", animationFillMode: "forwards" }}>
              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-neutral-400">Fix these issues automatically</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-2 py-1"
                  >
                    {showPrompt ? "Hide" : "View prompt"}
                  </button>
                  <button
                    onClick={copyPrompt}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-700 transition-colors"
                  >
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

            {/* 5. Share */}
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-neutral-100 opacity-0 animate-slide-up" style={{ animationDelay: "650ms", animationFillMode: "forwards" }}>
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
