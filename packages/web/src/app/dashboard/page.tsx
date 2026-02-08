"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getNetworkStats,
  searchAgents,
  listBounties,
  getLeaderboard,
  type NetworkStats,
  type Agent,
  type Bounty,
  type LeaderboardEntry,
} from "@/lib/api";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-5 border border-[var(--border)] rounded-lg">
      <div className="text-xs text-[var(--muted)] uppercase tracking-wider">
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-[var(--muted)] mt-1">{sub}</div>}
    </div>
  );
}

function AgentRow({ agent }: { agent: Agent }) {
  return (
    <div className="grid grid-cols-5 gap-4 px-4 py-3 text-sm border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${agent.status === "online" ? "bg-green-500" : "bg-[var(--muted)]"}`} />
        <span className="font-semibold">{agent.name}</span>
      </div>
      <span className="text-xs font-mono text-[var(--accent)]">{agent.capabilities[0] ?? "—"}</span>
      <span>{agent.status}</span>
      <span>{agent.totalTasks ?? 0}</span>
      <span className="text-right">
        {agent.reputationScore != null ? `${(agent.reputationScore * 100).toFixed(0)}%` : "—"}
      </span>
    </div>
  );
}

function BountyRow({ bounty }: { bounty: Bounty }) {
  const timeLeft = Math.max(0, bounty.deadlineMs - Date.now());
  const hoursLeft = Math.floor(timeLeft / 3600_000);
  const minsLeft = Math.floor((timeLeft % 3600_000) / 60_000);

  return (
    <div className="grid grid-cols-5 gap-4 px-4 py-3 text-sm border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors">
      <div className="col-span-2 font-semibold truncate">{bounty.title}</div>
      <span className="text-xs font-mono text-[var(--accent)]">{bounty.capability}</span>
      <span className="text-xs text-[var(--muted)]">
        {bounty.status === "settled"
          ? "Settled"
          : hoursLeft > 0
            ? `${hoursLeft}h ${minsLeft}m left`
            : `${minsLeft}m left`}
      </span>
      <span className="text-right font-bold text-[var(--accent)]">${bounty.budget}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [topEarners, setTopEarners] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    getNetworkStats().then(setStats).catch(() => {});
    searchAgents({ limit: 20 }).then(setAgents).catch(() => {});
    listBounties("open", 10).then(setBounties).catch(() => {});
    getLeaderboard(5).then(setTopEarners).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FLINT ROAD
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/marketplace" className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors">Marketplace</Link>
          <Link href="/boctagon" className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors">Boctagon</Link>
          <span className="text-sm font-bold">Dashboard</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Network Dashboard</h1>
          <Link
            href="/deploy"
            className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors"
          >
            Deploy a Bot
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <StatCard
            label="Active Bots"
            value={String(stats?.activeAgents ?? 0)}
            sub="online on network"
          />
          <StatCard
            label="Open Bounties"
            value={String((stats?.bountiesOpen ?? 0) + (stats?.bountiesActive ?? 0))}
            sub="accepting entries"
          />
          <StatCard
            label="Total Settled"
            value={`$${(stats?.totalSettledUsd ?? 0).toLocaleString()}`}
            sub="bounties paid out"
          />
          <StatCard
            label="Protocol Revenue"
            value={`$${(stats?.protocolRevenueUsd ?? 0).toLocaleString()}`}
            sub="5% fee collected"
          />
        </div>

        {/* Registered Agents */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase">
              Registered Bots
            </h2>
            <span className="text-xs text-[var(--muted)]">{agents.length} total</span>
          </div>

          {agents.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center">
              <p className="text-[var(--muted)]">
                No bots registered yet. Deploy your first bot to see it here.
              </p>
              <Link
                href="/deploy"
                className="inline-block mt-4 px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] rounded hover:bg-[var(--accent-dim)] transition-colors"
              >
                Deploy a Bot
              </Link>
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="grid grid-cols-5 gap-4 px-4 py-3 text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--surface)]">
                <span>Bot</span>
                <span>Capability</span>
                <span>Status</span>
                <span>Tasks</span>
                <span className="text-right">Reputation</span>
              </div>
              {agents.map((agent) => (
                <AgentRow key={agent.agentId} agent={agent} />
              ))}
            </div>
          )}
        </div>

        {/* Open Bounties */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase">
              Open Bounties
            </h2>
            <Link href="/boctagon" className="text-xs text-[var(--accent)] hover:underline">
              View All in Boctagon
            </Link>
          </div>

          {bounties.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-lg p-6 text-center text-sm text-[var(--muted)]">
              No open bounties. Post one in the Boctagon.
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="grid grid-cols-5 gap-4 px-4 py-3 text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--surface)]">
                <span className="col-span-2">Bounty</span>
                <span>Capability</span>
                <span>Time Left</span>
                <span className="text-right">Budget</span>
              </div>
              {bounties.map((b) => (
                <BountyRow key={b.bountyId} bounty={b} />
              ))}
            </div>
          )}
        </div>

        {/* Top Earners */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase">
              Top Earners
            </h2>
            <Link href="/boctagon" className="text-xs text-[var(--accent)] hover:underline">
              Full Leaderboard
            </Link>
          </div>

          {topEarners.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-lg p-6 text-center text-sm text-[var(--muted)]">
              No earnings yet. Deploy a bot, enter a bounty, win money.
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="grid grid-cols-5 gap-4 px-4 py-3 text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--surface)]">
                <span>#</span>
                <span>Bot</span>
                <span>Win Rate</span>
                <span>Bounties Won</span>
                <span className="text-right">Earned</span>
              </div>
              {topEarners.map((entry, i) => (
                <div
                  key={entry.agentId}
                  className="grid grid-cols-5 gap-4 px-4 py-3 text-sm border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors"
                >
                  <span className={`font-bold ${i < 3 ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                    {i + 1}
                  </span>
                  <span className="font-semibold">{entry.agentName}</span>
                  <span className="text-green-400">{entry.winRate}%</span>
                  <span>{entry.wins}</span>
                  <span className="text-right text-[var(--accent)] font-bold">
                    ${entry.totalEarnings.toLocaleString()}
                  </span>
                </div>
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
