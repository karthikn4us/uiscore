import Link from "next/link";
import type { Metadata } from "next";
import { kv } from "@vercel/kv";

export const metadata: Metadata = {
  title: "Leaderboard - UIScore",
  description: "See how the world's websites score on design quality.",
};

export const revalidate = 30;

interface ScoreEntry {
  hostname: string;
  overall: number;
  summary: string;
  scoredAt: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Great";
  if (score >= 70) return "Good";
  if (score >= 60) return "Decent";
  if (score >= 50) return "Needs Work";
  return "Poor";
}

async function getScores(): Promise<(ScoreEntry & { rank: number })[]> {
  try {
    const hostnames = await kv.zrange("leaderboard", 0, 49, { rev: true });
    if (!hostnames || hostnames.length === 0) return [];

    const pipeline = kv.pipeline();
    for (const hostname of hostnames) {
      pipeline.get(`score:${hostname}`);
    }
    const details = await pipeline.exec();

    return details
      .filter(Boolean)
      .map((d, i) => ({ ...(d as ScoreEntry), rank: i + 1 }));
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const scores = await getScores();

  return (
    <main className="min-h-screen bg-grid bg-glow">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            UI
          </div>
          <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
            UIScore
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/60"
        >
          Score a site
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="text-center mt-8 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Leaderboard
          </h1>
          <p className="text-zinc-500">
            {scores.length} website{scores.length !== 1 ? "s" : ""} scored so
            far
          </p>
        </div>

        {scores.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 mb-4">No websites scored yet.</p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 transition-colors"
            >
              Be the first
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map((entry) => {
              const color = getScoreColor(entry.overall);
              return (
                <div
                  key={entry.hostname}
                  className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-5 py-4 hover:border-zinc-700/60 transition-colors"
                >
                  <span className="w-8 text-center text-sm font-mono text-zinc-500">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">
                        {entry.rank === 1 ? "\u{1F947}" : entry.rank === 2 ? "\u{1F948}" : "\u{1F949}"}
                      </span>
                    ) : (
                      `#${entry.rank}`
                    )}
                  </span>

                  <div className="shrink-0">
                    <svg viewBox="0 0 40 40" className="w-10 h-10">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#27272a" strokeWidth="3" />
                      <circle
                        cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 - (entry.overall / 100) * 2 * Math.PI * 16}
                        transform="rotate(-90 20 20)"
                      />
                      <text x="20" y="20" textAnchor="middle" dominantBaseline="central"
                        fill={color} fontSize="11" fontWeight="700" fontFamily="system-ui">
                        {entry.overall}
                      </text>
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-200 truncate">{entry.hostname}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}15` }}>
                        {getScoreLabel(entry.overall)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 truncate mt-0.5">{entry.summary}</p>
                  </div>

                  <span className="hidden sm:block text-2xl font-bold font-mono shrink-0" style={{ color }}>
                    {entry.overall}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {scores.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/" className="inline-flex px-5 py-2.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 transition-all duration-200 hover:scale-[1.02]">
              Score your website
            </Link>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-zinc-600">
        Built by{" "}
        <a href="https://www.linkedin.com/in/karthiknaralasetty/" target="_blank" rel="noopener noreferrer"
          className="text-zinc-400 hover:text-white transition-colors">
          Karthik Naralasetty
        </a>
      </footer>
    </main>
  );
}
