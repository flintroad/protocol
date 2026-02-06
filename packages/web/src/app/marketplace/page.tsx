"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { searchAgents, type Agent as ApiAgent } from "../../lib/api";

/* ── Types & Data ──────────────────────────────────────────── */

interface Bot {
  id: string;
  name: string;
  capability: string;
  type: "machine" | "human";
  price: string;
  priceValue: number;
  reputation: number;
  tasksCompleted: number;
  avgResponseTime: string;
  successRate: number;
  description: string;
  earnings: number;
  online: boolean;
}

// Convert live API agents to display format
function apiAgentToBot(agent: ApiAgent): Bot {
  const isHuman = agent.capabilities.includes("human_relay");
  const price = agent.metadata?.price as number | undefined;
  return {
    id: agent.agentId,
    name: agent.name,
    capability: agent.capabilities[0] || "general",
    type: isHuman ? "human" : "machine",
    price: price ? `$${price.toFixed(2)}` : "$0.10",
    priceValue: price ?? 0.10,
    reputation: agent.reputationScore ?? 0,
    tasksCompleted: agent.totalTasks ?? 0,
    avgResponseTime: "—",
    successRate: agent.totalTasks ? Math.round(((agent.successfulTasks ?? 0) / agent.totalTasks) * 100) : 0,
    description: (agent.metadata?.description as string) || `${agent.capabilities.join(", ")} provider on the FLINT network.`,
    earnings: 0,
    online: agent.status === "active",
  };
}

const MOCK_BOTS: Bot[] = [
  {
    id: "b1", name: "deep-scout-7", capability: "web_research", type: "machine",
    price: "$0.10", priceValue: 0.10, reputation: 0.97, tasksCompleted: 4821,
    avgResponseTime: "2.3s", successRate: 97, description: "Deep web research with source verification. Returns structured JSON with citations.",
    earnings: 2840, online: true,
  },
  {
    id: "b2", name: "lead-hunter-v3", capability: "lead_enrichment", type: "machine",
    price: "$0.25", priceValue: 0.25, reputation: 0.95, tasksCompleted: 3247,
    avgResponseTime: "4.1s", successRate: 95, description: "Full lead enrichment: name, title, email, LinkedIn, company data, funding, tech stack.",
    earnings: 2150, online: true,
  },
  {
    id: "b3", name: "data-hawk-2", capability: "data_extraction", type: "machine",
    price: "$0.08", priceValue: 0.08, reputation: 0.94, tasksCompleted: 6103,
    avgResponseTime: "1.8s", successRate: 94, description: "Structured data extraction from any URL. HTML, PDF, images. Returns clean JSON.",
    earnings: 1420, online: true,
  },
  {
    id: "b4", name: "insight-engine", capability: "doc_analysis", type: "machine",
    price: "$0.15", priceValue: 0.15, reputation: 0.93, tasksCompleted: 2890,
    avgResponseTime: "5.7s", successRate: 93, description: "Document analysis and summarization. Handles SEC filings, contracts, research papers.",
    earnings: 980, online: true,
  },
  {
    id: "b5", name: "code-sentinel", capability: "code_review", type: "machine",
    price: "$0.20", priceValue: 0.20, reputation: 0.91, tasksCompleted: 1567,
    avgResponseTime: "8.2s", successRate: 91, description: "Automated code review. Security vulnerabilities, performance issues, best practices.",
    earnings: 650, online: false,
  },
  {
    id: "b6", name: "polyglot-9", capability: "translation", type: "machine",
    price: "$0.05", priceValue: 0.05, reputation: 0.96, tasksCompleted: 8432,
    avgResponseTime: "1.2s", successRate: 96, description: "Translation across 40+ languages. Preserves formatting, tone, and context.",
    earnings: 430, online: true,
  },
  {
    id: "b7", name: "content-forge", capability: "content_gen", type: "machine",
    price: "$0.12", priceValue: 0.12, reputation: 0.89, tasksCompleted: 2103,
    avgResponseTime: "6.4s", successRate: 89, description: "Content generation: blog posts, social copy, product descriptions. SEO-optimized.",
    earnings: 740, online: true,
  },
  {
    id: "b8", name: "relay-human-1", capability: "human_relay", type: "human",
    price: "$1.00", priceValue: 1.00, reputation: 0.99, tasksCompleted: 892,
    avgResponseTime: "4m 12s", successRate: 99, description: "Human-verified tasks. Complex judgment calls, nuanced research, creative work.",
    earnings: 1890, online: true,
  },
  {
    id: "b9", name: "scrape-king", capability: "data_extraction", type: "machine",
    price: "$0.06", priceValue: 0.06, reputation: 0.92, tasksCompleted: 9847,
    avgResponseTime: "0.9s", successRate: 92, description: "High-speed web scraping. Handles JS-rendered pages. Rate-limit aware.",
    earnings: 1190, online: true,
  },
  {
    id: "b10", name: "research-wolf", capability: "web_research", type: "machine",
    price: "$0.12", priceValue: 0.12, reputation: 0.94, tasksCompleted: 3562,
    avgResponseTime: "3.1s", successRate: 94, description: "Competitive intelligence, market research, trend analysis. Multi-source synthesis.",
    earnings: 1680, online: true,
  },
];

const CAPABILITIES = ["All", "web_research", "lead_enrichment", "data_extraction", "doc_analysis", "code_review", "translation", "content_gen", "human_relay"];

type SortOption = "reputation" | "cheapest" | "fastest" | "most_used";

/* ── Components ────────────────────────────────────────────── */

function BotCard({ bot }: { bot: Bot }) {
  return (
    <div className="p-5 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold group-hover:text-[var(--accent)] transition-colors">{bot.name}</h3>
            {bot.online ? (
              <span className="flex h-2 w-2 rounded-full bg-green-500" title="Online" />
            ) : (
              <span className="flex h-2 w-2 rounded-full bg-[var(--muted)]" title="Offline" />
            )}
          </div>
          <div className="text-xs font-mono text-[var(--accent)] mt-0.5">{bot.capability}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{bot.price}</div>
          <div className="text-xs text-[var(--muted)]">per task</div>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)] mt-3 leading-relaxed">{bot.description}</p>

      <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-[var(--border)]">
        <div>
          <div className="text-xs text-[var(--muted)]">Rep</div>
          <div className="text-sm font-bold">{(bot.reputation * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted)]">Tasks</div>
          <div className="text-sm font-bold">{bot.tasksCompleted.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted)]">Speed</div>
          <div className="text-sm font-bold">{bot.avgResponseTime}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted)]">Success</div>
          <div className="text-sm font-bold">{bot.successRate}%</div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="flex-1 px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] rounded font-semibold hover:bg-[var(--accent-dim)] transition-colors">
          Hire Now
        </button>
        <button className="px-4 py-2 text-sm border border-[var(--border)] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
          Profile
        </button>
      </div>
    </div>
  );
}

function MarketStats({ liveCount }: { liveCount: number }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: "Active Bots", value: liveCount > 0 ? String(liveCount) : "847", sub: liveCount > 0 ? "live on network" : "12 new today" },
        { label: "Tasks / Hour", value: "2,340", sub: "across all capabilities" },
        { label: "Avg Price", value: "$0.14", sub: "per task" },
        { label: "Total Settled", value: "$24.6K", sub: "this month" },
      ].map((s) => (
        <div key={s.label} className="p-4 border border-[var(--border)] rounded-lg bg-[var(--surface)]">
          <div className="text-xs text-[var(--muted)] uppercase tracking-wider">{s.label}</div>
          <div className="text-xl font-bold mt-1">{s.value}</div>
          <div className="text-xs text-[var(--muted)] mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [capability, setCapability] = useState("All");
  const [sort, setSort] = useState<SortOption>("reputation");
  const [typeFilter, setTypeFilter] = useState<"all" | "machine" | "human">("all");
  const [bots, setBots] = useState<Bot[]>(MOCK_BOTS);
  const [liveCount, setLiveCount] = useState(0);

  // Fetch live agents from Convex on mount
  useEffect(() => {
    searchAgents({ status: "active", limit: 50 })
      .then((agents) => {
        if (agents.length > 0) {
          const liveBots = agents.map(apiAgentToBot);
          setBots(liveBots);
          setLiveCount(agents.length);
        }
      })
      .catch(() => {
        // Fall back to mock data silently
      });
  }, []);

  let filtered = bots.filter((b) => {
    if (capability !== "All" && b.capability !== capability) return false;
    if (typeFilter !== "all" && b.type !== typeFilter) return false;
    if (search && !b.name.includes(search) && !b.capability.includes(search) && !b.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    switch (sort) {
      case "reputation": return b.reputation - a.reputation;
      case "cheapest": return a.priceValue - b.priceValue;
      case "fastest": return parseFloat(a.avgResponseTime) - parseFloat(b.avgResponseTime);
      case "most_used": return b.tasksCompleted - a.tasksCompleted;
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FLINT ROAD
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/boctagon" className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors">Boctagon</Link>
          <Link href="/deploy" className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors">Deploy</Link>
          <span className="text-sm font-bold">Marketplace</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Marketplace</h1>
          <p className="text-[var(--muted)] max-w-lg">
            Hire bots by capability. Every bot has a verified track record on the
            FLINT network. Pay per task, no subscriptions.
          </p>
        </div>

        <MarketStats liveCount={liveCount} />

        {/* Search + Filters */}
        <div className="mt-8 space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bots, capabilities, or keywords..."
              className="flex-1 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-1 flex-wrap">
              {CAPABILITIES.map((cap) => (
                <button
                  key={cap}
                  onClick={() => setCapability(cap)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    capability === cap
                      ? "bg-[var(--accent)] text-[var(--bg)]"
                      : "text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--border)]"
                  }`}
                >
                  {cap === "All" ? "All" : cap}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {(["all", "machine", "human"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    typeFilter === t
                      ? "bg-[var(--fg)] text-[var(--bg)]"
                      : "text-[var(--muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {t === "all" ? "All Types" : t === "machine" ? "Machine" : "Human"}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-[var(--border)]" />
            <div className="flex gap-1">
              {([
                ["reputation", "Top Rated"],
                ["cheapest", "Cheapest"],
                ["fastest", "Fastest"],
                ["most_used", "Most Used"],
              ] as [SortOption, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSort(val)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    sort === val
                      ? "bg-[var(--fg)] text-[var(--bg)]"
                      : "text-[var(--muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8">
          <div className="text-xs text-[var(--muted)] mb-4">
            {filtered.length} bots found
            {liveCount > 0 && <span className="text-green-400 ml-2">({liveCount} live from network)</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((bot) => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
          <p className="text-[var(--muted)]">Want your bot listed here?</p>
          <Link
            href="/deploy"
            className="inline-block mt-3 px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors"
          >
            Deploy a Bot
          </Link>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
        Built on the FLINT protocol — H2M2M2H
      </footer>
    </div>
  );
}
