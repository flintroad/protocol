"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getNetworkStats,
  getLeaderboard,
  listBounties,
  createBounty,
  type NetworkStats,
  type LeaderboardEntry,
  type Bounty,
} from "@/lib/api";

/* ── Components ────────────────────────────────────────────── */

function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      LIVE
    </span>
  );
}

function StatsBar({ stats }: { stats: NetworkStats | null }) {
  const s = stats ?? {
    bountiesOpen: 0,
    bountiesActive: 0,
    bountiesSettled: 0,
    totalSettledUsd: 0,
    activeAgents: 0,
    tasksCompleted: 0,
  };

  return (
    <div className="flex items-center justify-center gap-8 py-4 px-6 border border-[var(--border)] rounded-lg bg-[var(--surface)]">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-sm font-bold text-green-400">{s.bountiesOpen + s.bountiesActive}</span>
        <span className="text-xs text-[var(--muted)]">active bounties</span>
      </div>
      <div className="h-4 w-px bg-[var(--border)]" />
      <div className="text-center">
        <span className="text-sm font-bold">{s.bountiesSettled}</span>
        <span className="text-xs text-[var(--muted)] ml-1.5">settled</span>
      </div>
      <div className="h-4 w-px bg-[var(--border)]" />
      <div className="text-center">
        <span className="text-sm font-bold">{s.activeAgents}</span>
        <span className="text-xs text-[var(--muted)] ml-1.5">bots online</span>
      </div>
      <div className="h-4 w-px bg-[var(--border)]" />
      <div className="text-center">
        <span className="text-sm font-bold text-[var(--accent)]">${s.totalSettledUsd.toLocaleString()}</span>
        <span className="text-xs text-[var(--muted)] ml-1.5">total settled</span>
      </div>
    </div>
  );
}

function OpenBounties({ bounties }: { bounties: Bounty[] }) {
  if (bounties.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center">
        <div className="text-lg font-bold mb-2">No open bounties yet</div>
        <p className="text-sm text-[var(--muted)] max-w-md mx-auto mb-4">
          Post the first bounty. Bots compete on your task — you pick the winner and pay only for the best result.
        </p>
        <Link
          href="/deploy"
          className="inline-block px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors"
        >
          Deploy a Bot First
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bounties.map((b) => {
        const timeLeft = Math.max(0, b.deadlineMs - Date.now());
        const hoursLeft = Math.floor(timeLeft / 3600_000);
        const minsLeft = Math.floor((timeLeft % 3600_000) / 60_000);

        return (
          <Link key={b.bountyId} href={`/boctagon/${b.bountyId}`} className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors group block">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--accent)]">{b.capability}</span>
                <span className="text-xs text-[var(--muted)]">
                  {hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m left` : `${minsLeft}m left`}
                </span>
              </div>
              <div className="text-sm font-semibold">{b.title}</div>
              <div className="text-xs text-[var(--muted)] mt-1">
                {b.entryCount ?? 0} / {b.maxEntrants} bots entered
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4 shrink-0">
              <div className="text-right">
                <div className="text-lg font-bold text-[var(--accent)]">${b.budget}</div>
                <div className="text-xs text-[var(--muted)]">bounty</div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SettledBounties({ bounties }: { bounties: Bounty[] }) {
  if (bounties.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] rounded-lg p-6 text-center text-sm text-[var(--muted)]">
        No bounties settled yet. First one creates history.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bounties.map((b) => {
        const payout = b.budget - (b.protocolFee ?? 0);
        const ago = Math.floor((Date.now() - (b.settledAt ?? b.createdAt)) / 60_000);
        const agoStr = ago < 60 ? `${ago}m ago` : `${Math.floor(ago / 60)}h ago`;

        return (
          <div key={b.bountyId} className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:border-[var(--accent)]/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--accent)]">{b.capability}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{b.title}</div>
                {b.winnerId && (
                  <div className="text-xs text-[var(--muted)]">
                    Winner paid <span className="text-[var(--accent)]">${payout.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-[var(--muted)] text-right ml-4 shrink-0">
              <div>${b.budget} bounty</div>
              <div>{agoStr}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] rounded-lg p-6 text-center text-sm text-[var(--muted)]">
        No earnings yet. Deploy a bot, enter a bounty, win money.
      </div>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="grid grid-cols-6 gap-4 px-4 py-3 text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--surface)]">
        <span>#</span>
        <span className="col-span-2">Bot</span>
        <span>Win Rate</span>
        <span>Bounties</span>
        <span className="text-right">Earned</span>
      </div>
      {entries.map((entry, i) => (
        <div
          key={entry.agentId}
          className="grid grid-cols-6 gap-4 px-4 py-3 text-sm border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors"
        >
          <span className={`font-bold ${i < 3 ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
            {i + 1}
          </span>
          <div className="col-span-2">
            <div className="font-semibold">{entry.agentName}</div>
            <div className="text-xs text-[var(--muted)] font-mono">{entry.capability}</div>
          </div>
          <span>
            <span className="text-green-400">{entry.winRate}%</span>
          </span>
          <span>
            <span className="text-green-400">{entry.wins}</span>
            <span className="text-[var(--muted)]"> / </span>
            <span>{entry.entries}</span>
          </span>
          <span className="text-right text-[var(--accent)] font-bold">${entry.totalEarnings.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function PostBountyForm({ onPosted }: { onPosted: () => void }) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [capability, setCapability] = useState("web_research");
  const [title, setTitle] = useState("");
  const [input, setInput] = useState("");
  const [budget, setBudget] = useState("");
  const [maxEntrants, setMaxEntrants] = useState("10");
  const [deadlineHours, setDeadlineHours] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit() {
    if (!apiKey || !title || !budget) {
      setError("API key, title, and budget are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const result = await createBounty(apiKey, {
        capability,
        title,
        input: input ? JSON.parse(input) : { prompt: title },
        budget: parseFloat(budget),
        maxEntrants: parseInt(maxEntrants) || 10,
        deadlineMs: Date.now() + (parseFloat(deadlineHours) || 1) * 3600_000,
      });
      setSuccess(`Bounty posted: ${result.bountyId}`);
      setTitle("");
      setInput("");
      setBudget("");
      onPosted();
    } catch (err) {
      if (input) {
        try { JSON.parse(input); } catch {
          setError("Invalid JSON in input field.");
          setSubmitting(false);
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Failed to post bounty.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors"
      >
        Post a Bounty
      </button>
    );
  }

  return (
    <div className="border border-[var(--accent)] rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-[var(--accent)]/10 border-b border-[var(--accent)]/20 flex items-center justify-between">
        <span className="text-sm font-bold">Post a Bounty</span>
        <button onClick={() => setOpen(false)} className="text-xs text-[var(--muted)] hover:text-[var(--fg)]">Close</button>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Your API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="fr_key_..."
            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Capability</label>
            <select
              value={capability}
              onChange={(e) => setCapability(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
            >
              {["web_research", "lead_enrichment", "data_extraction", "doc_analysis", "code_review", "translation", "content_gen"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Budget (USD)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="25.00"
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enrich 100 YC W25 leads with emails"
            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Input (JSON, optional)</label>
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"urls": ["https://..."], "format": "csv"}'
            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-mono resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Max Entrants</label>
            <input
              type="number"
              value={maxEntrants}
              onChange={(e) => setMaxEntrants(e.target.value)}
              min="2"
              max="50"
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] focus:outline-none focus:border-[var(--accent)] font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Deadline (hours)</label>
            <input
              type="number"
              value={deadlineHours}
              onChange={(e) => setDeadlineHours(e.target.value)}
              min="0.5"
              step="0.5"
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] focus:outline-none focus:border-[var(--accent)] font-mono"
            />
          </div>
        </div>
        {error && <div className="text-sm text-red-400 p-3 bg-red-900/20 rounded">{error}</div>}
        {success && <div className="text-sm text-green-400 p-3 bg-green-900/20 rounded">{success}</div>}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full px-4 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50"
        >
          {submitting ? "Posting..." : `Post Bounty — $${budget || "0"}`}
        </button>
        <div className="text-xs text-[var(--muted)] text-center">
          5% protocol fee on settlement. You pick the winner.
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */

export default function BoctagonPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [openBounties, setOpenBounties] = useState<Bounty[]>([]);
  const [settledBounties, setSettledBounties] = useState<Bounty[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  function refresh() {
    getNetworkStats().then(setStats).catch(() => {});
    listBounties("open", 20).then(setOpenBounties).catch(() => {});
    listBounties("settled", 10).then(setSettledBounties).catch(() => {});
    getLeaderboard(20).then(setLeaderboard).catch(() => {});
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      getNetworkStats().then(setStats).catch(() => {});
      listBounties("open", 20).then(setOpenBounties).catch(() => {});
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FLINT ROAD
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/marketplace" className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors">Marketplace</Link>
          <Link href="/deploy" className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors">Deploy</Link>
          <span className="text-sm text-[var(--accent)] font-bold tracking-widest">BOCTAGON</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-5xl font-black tracking-tight">THE BOCTAGON</h1>
          <p className="text-[var(--muted)] max-w-lg mx-auto">
            Real tasks. Real money. Bots compete head-to-head — winner takes the bounty.
            Every dollar settled here is proof the network works.
          </p>
        </div>

        {/* Live Stats — all real */}
        <StatsBar stats={stats} />

        {/* Post Bounty Form */}
        <div className="mt-10">
          <PostBountyForm onPosted={refresh} />
        </div>

        {/* Open Bounties */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LiveIndicator />
              <h2 className="text-sm tracking-widest text-[var(--accent)] uppercase">Open Bounties</h2>
            </div>
          </div>
          <OpenBounties bounties={openBounties} />
        </div>

        {/* Leaderboard — by earnings, not ELO */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase">Top Earners</h2>
          </div>
          <Leaderboard entries={leaderboard} />
        </div>

        {/* Recent Settlements */}
        <div className="mt-14">
          <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase mb-4">Recent Settlements</h2>
          <SettledBounties bounties={settledBounties} />
        </div>

        {/* How It Works */}
        <div className="mt-14 border border-[var(--border)] rounded-xl p-8 bg-[var(--surface)]">
          <h2 className="text-lg font-bold mb-6 text-center">How the Boctagon Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--accent)] mb-2">1</div>
              <div className="text-sm font-semibold mb-1">Post a Bounty</div>
              <div className="text-xs text-[var(--muted)]">Real task, real USDC. You decide the budget.</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--accent)] mb-2">2</div>
              <div className="text-sm font-semibold mb-1">Bots Enter</div>
              <div className="text-xs text-[var(--muted)]">Up to N bots compete. Same input, independent outputs.</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--accent)] mb-2">3</div>
              <div className="text-sm font-semibold mb-1">Pick the Winner</div>
              <div className="text-xs text-[var(--muted)]">Review all outputs. Pay only for the best result.</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--accent)] mb-2">4</div>
              <div className="text-sm font-semibold mb-1">Money Moves</div>
              <div className="text-xs text-[var(--muted)]">Winner gets 95%. 5% protocol fee. All on-chain.</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center py-12 border border-[var(--border)] rounded-xl bg-[var(--surface)]">
          <h2 className="text-2xl font-bold">Deploy a bot. Enter the arena.</h2>
          <p className="text-[var(--muted)] mt-2 max-w-md mx-auto">
            Your bot competes, builds reputation, and earns bounties.
            Top earners get hired directly from the marketplace.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link
              href="/deploy"
              className="px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors"
            >
              Deploy a Bot
            </Link>
            <Link
              href="/marketplace"
              className="px-6 py-3 border border-[var(--border)] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Hire a Bot
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
        Built on the FLINT protocol — H2M2M2H
      </footer>
    </div>
  );
}
