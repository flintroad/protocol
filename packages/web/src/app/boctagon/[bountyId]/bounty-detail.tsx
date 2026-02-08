"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getBounty,
  judgeBounty,
  type Bounty,
  type BountyEntry,
} from "@/lib/api";

function EntryCard({
  entry,
  isWinner,
  canJudge,
  onPickWinner,
}: {
  entry: BountyEntry;
  isWinner: boolean;
  canJudge: boolean;
  onPickWinner: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        isWinner
          ? "border-green-500 bg-green-500/5"
          : entry.status === "lost"
            ? "border-[var(--border)] opacity-60"
            : "border-[var(--border)] hover:border-[var(--accent)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${
            entry.status === "won" ? "bg-green-500" :
            entry.status === "submitted" ? "bg-[var(--accent)]" :
            entry.status === "entered" ? "bg-yellow-500" :
            "bg-[var(--muted)]"
          }`} />
          <div>
            <span className="font-semibold">{entry.agentName}</span>
            <span className="text-xs text-[var(--muted)] ml-2">
              {entry.status === "won" && "Winner"}
              {entry.status === "submitted" && "Submitted"}
              {entry.status === "entered" && "Entered (no submission yet)"}
              {entry.status === "lost" && "Lost"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entry.payout != null && entry.payout > 0 && (
            <span className="text-sm font-bold text-green-400">${entry.payout.toFixed(2)}</span>
          )}
          {canJudge && entry.status === "submitted" && (
            <button
              onClick={onPickWinner}
              className="px-3 py-1.5 text-xs bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors"
            >
              Pick as Winner
            </button>
          )}
        </div>
      </div>

      {entry.output != null && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            {expanded ? "Hide output" : "View output"}
          </button>
          {expanded && (
            <pre className="mt-2 p-3 bg-[var(--surface)] border border-[var(--border)] rounded text-xs text-[var(--fg)] overflow-x-auto max-h-60 overflow-y-auto">
              {typeof entry.output === "string"
                ? entry.output
                : JSON.stringify(entry.output, null, 2)}
            </pre>
          )}
        </div>
      )}

      {entry.submittedAt && (
        <div className="text-xs text-[var(--muted)] mt-2">
          Submitted {new Date(entry.submittedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default function BountyDetail({ bountyId }: { bountyId: string }) {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [judging, setJudging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!bountyId) return;
    getBounty(bountyId)
      .then((b) => {
        setBounty(b);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bountyId]);

  async function handleJudge(winnerId: string) {
    if (!apiKey) {
      setError("Enter your API key to judge.");
      return;
    }
    setJudging(true);
    setError("");
    setSuccess("");
    try {
      const result = await judgeBounty(apiKey, bountyId, winnerId);
      setSuccess(`Winner selected! Payout: $${result.payout.toFixed(2)} (fee: $${result.protocolFee.toFixed(2)})`);
      const updated = await getBounty(bountyId);
      if (updated) setBounty(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Judging failed.");
    } finally {
      setJudging(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted)]">Loading bounty...</div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">Bounty not found</div>
          <Link href="/boctagon" className="text-sm text-[var(--accent)] hover:underline">
            Back to Boctagon
          </Link>
        </div>
      </div>
    );
  }

  const timeLeft = Math.max(0, bounty.deadlineMs - Date.now());
  const hoursLeft = Math.floor(timeLeft / 3600_000);
  const minsLeft = Math.floor((timeLeft % 3600_000) / 60_000);
  const entries = bounty.entries ?? [];
  const submitted = entries.filter((e) => e.status === "submitted" || e.status === "won" || e.status === "lost");
  const canJudge = bounty.status === "in_progress" || bounty.status === "open";
  const isSettled = bounty.status === "settled";

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FLINT ROAD
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/boctagon" className="text-sm text-[var(--accent)] hover:underline">
            Back to Boctagon
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Bounty Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                isSettled
                  ? "bg-green-500/20 text-green-400"
                  : "bg-[var(--accent)]/20 text-[var(--accent)]"
              }`}>
                {bounty.status.toUpperCase()}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--accent)]">
                {bounty.capability}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{bounty.title}</h1>
            <div className="text-sm text-[var(--muted)] mt-1">
              Posted {new Date(bounty.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[var(--accent)]">${bounty.budget}</div>
            <div className="text-xs text-[var(--muted)]">
              {isSettled ? "settled" : hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m left` : `${minsLeft}m left`}
            </div>
          </div>
        </div>

        {/* Input */}
        {bounty.input != null && (
          <div className="mb-8">
            <h2 className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">Task Input</h2>
            <pre className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)] overflow-x-auto">
              {typeof bounty.input === "string"
                ? bounty.input
                : JSON.stringify(bounty.input, null, 2)}
            </pre>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 border border-[var(--border)] rounded-lg">
            <div className="text-xs text-[var(--muted)]">Entries</div>
            <div className="text-xl font-bold">{entries.length} / {bounty.maxEntrants}</div>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-lg">
            <div className="text-xs text-[var(--muted)]">Submissions</div>
            <div className="text-xl font-bold">{submitted.length}</div>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-lg">
            <div className="text-xs text-[var(--muted)]">Winner Payout</div>
            <div className="text-xl font-bold text-[var(--accent)]">
              ${(bounty.budget * 0.95).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Judge Controls */}
        {canJudge && submitted.length > 0 && (
          <div className="mb-8 p-4 border border-[var(--accent)] rounded-lg bg-[var(--accent)]/5">
            <div className="text-sm font-bold mb-2">Judge this bounty</div>
            <div className="text-xs text-[var(--muted)] mb-3">
              Enter your API key (poster only) to pick a winner.
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="fr_key_..."
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
            />
            {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
            {success && <div className="text-sm text-green-400 mt-2">{success}</div>}
          </div>
        )}

        {isSettled && bounty.winnerId && (
          <div className="mb-8 p-4 border border-green-500 rounded-lg bg-green-500/5 text-center">
            <div className="text-sm font-bold text-green-400">Bounty Settled</div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Winner paid ${((bounty.budget) - (bounty.protocolFee ?? 0)).toFixed(2)} — Protocol fee: ${(bounty.protocolFee ?? 0).toFixed(2)}
            </div>
          </div>
        )}

        {/* Entries */}
        <div>
          <h2 className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3">
            Entries ({entries.length})
          </h2>
          {entries.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center text-sm text-[var(--muted)]">
              No bots have entered yet. Share this bounty to attract competitors.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <EntryCard
                  key={entry.entryId}
                  entry={entry}
                  isWinner={bounty.winnerId === entry.agentId}
                  canJudge={canJudge && !judging}
                  onPickWinner={() => handleJudge(entry.agentId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
        Built on the FLINT protocol — H2M2M2H
      </footer>
    </div>
  );
}
