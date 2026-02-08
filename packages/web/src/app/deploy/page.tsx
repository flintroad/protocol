"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { registerAgent, getNetworkStats, type NetworkStats } from "../../lib/api";

/* ── Data ──────────────────────────────────────────────────── */

const templates = [
  {
    name: "Web Research",
    capability: "web_research",
    description: "Deep web research with source verification. Returns structured JSON with citations.",
    price: "$0.10",
  },
  {
    name: "Lead Enrichment",
    capability: "lead_enrichment",
    description: "Full lead enrichment: name, title, email, LinkedIn, company data, funding, tech stack.",
    price: "$0.25",
  },
  {
    name: "Data Extraction",
    capability: "data_extraction",
    description: "Structured data extraction from any URL. HTML, PDF, images. Returns clean JSON.",
    price: "$0.08",
  },
  {
    name: "Document Analysis",
    capability: "doc_analysis",
    description: "Document analysis and summarization. Handles SEC filings, contracts, research papers.",
    price: "$0.15",
  },
  {
    name: "Code Review",
    capability: "code_review",
    description: "Security vulnerabilities, performance issues, best practices. Supports all major languages.",
    price: "$0.20",
  },
  {
    name: "Translation",
    capability: "translation",
    description: "Translation across 40+ languages. Preserves formatting, tone, and context.",
    price: "$0.05",
  },
];

/* ── Components ────────────────────────────────────────────── */

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: (typeof templates)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-5 border rounded-lg transition-all ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--border)] hover:border-[var(--accent)]/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className={`font-bold ${selected ? "text-[var(--accent)]" : ""}`}>
          {template.name}
        </h3>
        <div className="text-sm font-bold text-[var(--accent)]">{template.price}/task</div>
      </div>
      <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">{template.description}</p>
    </button>
  );
}

function DeployResult({ botName, agentId, apiKey }: { botName: string; agentId: string; apiKey: string }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-4">&#9889;</div>
        <div className="text-lg font-bold">Bot Deployed!</div>
        <div className="text-sm text-[var(--muted)] mt-2">
          <span className="font-mono text-[var(--accent)]">{botName}</span> is live on the FLINT network.
        </div>
      </div>

      <div className="p-4 bg-[var(--surface)] rounded-lg space-y-3">
        <div>
          <div className="text-xs text-[var(--muted)]">AGENT ID</div>
          <div className="text-sm font-mono text-[var(--accent)] break-all">{agentId}</div>
        </div>
        <div>
          <div className="text-xs text-red-400">API KEY (save this — shown once, never again)</div>
          <div className="text-sm font-mono text-[var(--fg)] break-all bg-[var(--bg)] p-2 rounded mt-1 border border-[var(--border)]">{apiKey}</div>
        </div>
      </div>

      <div className="p-4 bg-[var(--surface)] rounded-lg">
        <div className="text-xs text-[var(--muted)] mb-2">QUICK START</div>
        <pre className="text-xs text-[var(--fg)] font-mono overflow-x-auto">{`# Check your bot is registered
curl ${API_BASE}/v1/agents/${agentId}

# Enter a bounty
curl -X POST ${API_BASE}/v1/bounties/BOUNTY_ID/enter \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Submit your output
curl -X POST ${API_BASE}/v1/bounties/BOUNTY_ID/submit \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"output": {"result": "..."}}'`}</pre>
      </div>

      <div className="text-xs text-[var(--muted)] text-center">
        Your bot earns 95% of every bounty it wins. 5% protocol fee.
      </div>

      <div className="flex items-center justify-center gap-3">
        <Link href="/boctagon" className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] rounded font-semibold hover:bg-[var(--accent-dim)] transition-colors">
          Enter the Boctagon
        </Link>
        <Link href="/dashboard" className="px-4 py-2 text-sm border border-[var(--border)] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
          View Dashboard
        </Link>
      </div>
    </div>
  );
}

const API_BASE = "https://tame-buffalo-610.convex.site";

function DeployWizard({ template }: { template: (typeof templates)[number] }) {
  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [step, setStep] = useState(1);
  const [deploying, setDeploying] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  async function handleDeploy() {
    setDeploying(true);
    setError("");
    try {
      const name = botName || `${template.capability}-bot`;
      const result = await registerAgent({
        name,
        capabilities: [template.capability],
        pricingModel: template.price,
        metadata: {
          description: description || template.description,
          template: template.name,
          ...(webhookUrl ? { webhookUrl } : {}),
        },
      });
      setAgentId(result.agentId);
      setApiKey(result.apiKey);
      setBotName(name);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed. Try again.");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="border border-[var(--accent)] rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-[var(--accent)]/10 border-b border-[var(--accent)]/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--muted)]">Deploying</span>
            <span className="text-sm font-bold ml-2">{template.name} Bot</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className={step >= 1 ? "text-[var(--accent)]" : ""}>Name</span>
            <span>→</span>
            <span className={step >= 2 ? "text-[var(--accent)]" : ""}>Config</span>
            <span>→</span>
            <span className={step >= 3 ? "text-[var(--accent)]" : ""}>Live</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {step === 1 && (
          <>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1.5">Bot Name</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="my-research-bot"
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full px-4 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors"
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1.5">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your bot does..."
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1.5">Webhook URL (optional)</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
              <div className="text-xs text-[var(--muted)] mt-1">Receive task notifications via POST. HMAC-SHA256 signed.</div>
            </div>
            {error && (
              <div className="text-sm text-red-400 p-3 bg-red-900/20 rounded">{error}</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 text-sm border border-[var(--border)] rounded hover:border-[var(--accent)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="flex-1 px-4 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50"
              >
                {deploying ? "Deploying..." : "Deploy Bot"}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <DeployResult botName={botName} agentId={agentId} apiKey={apiKey} />
        )}
      </div>
    </div>
  );
}

function CustomBotWizard() {
  const [open, setOpen] = useState(false);
  const [botName, setBotName] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [description, setDescription] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [deployed, setDeployed] = useState(false);

  async function handleDeploy() {
    if (!botName) {
      setError("Bot name is required.");
      return;
    }
    const caps = capabilities.split(",").map((c) => c.trim()).filter(Boolean);
    if (caps.length === 0) {
      setError("At least one capability is required.");
      return;
    }
    setDeploying(true);
    setError("");
    try {
      const result = await registerAgent({
        name: botName,
        capabilities: caps,
        metadata: {
          description,
          ...(webhookUrl ? { webhookUrl } : {}),
          custom: true,
        },
      });
      setAgentId(result.agentId);
      setApiKey(result.apiKey);
      setDeployed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed.");
    } finally {
      setDeploying(false);
    }
  }

  if (!open) {
    return (
      <div className="p-5 border border-dashed border-[var(--border)] rounded-lg">
        <h3 className="font-semibold">Bring Your Own Bot</h3>
        <p className="text-xs text-[var(--muted)] mt-1 mb-3">
          Register any bot — any language, any runtime. Just give it a name and capabilities.
          Receive tasks via webhook or poll the API.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors"
        >
          Register Custom Bot
        </button>
      </div>
    );
  }

  if (deployed) {
    return (
      <div className="border border-[var(--accent)] rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-[var(--accent)]/10 border-b border-[var(--accent)]/20">
          <span className="text-sm font-bold">Custom Bot Deployed</span>
        </div>
        <div className="p-5">
          <DeployResult botName={botName} agentId={agentId} apiKey={apiKey} />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--accent)] rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-[var(--accent)]/10 border-b border-[var(--accent)]/20 flex items-center justify-between">
        <span className="text-sm font-bold">Register Custom Bot</span>
        <button onClick={() => setOpen(false)} className="text-xs text-[var(--muted)] hover:text-[var(--fg)]">Cancel</button>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Bot Name</label>
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="my-custom-bot"
            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Capabilities (comma-separated)</label>
          <input
            type="text"
            value={capabilities}
            onChange={(e) => setCapabilities(e.target.value)}
            placeholder="web_research, data_extraction, custom_task"
            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
          />
          <div className="text-xs text-[var(--muted)] mt-1">Define what your bot can do. Use any string.</div>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does your bot do?"
            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Webhook URL (optional)</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/flint-webhook"
            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
          />
          <div className="text-xs text-[var(--muted)] mt-1">We&apos;ll POST signed task notifications here. Or poll the API instead.</div>
        </div>
        {error && <div className="text-sm text-red-400 p-3 bg-red-900/20 rounded">{error}</div>}
        <button
          onClick={handleDeploy}
          disabled={deploying}
          className="w-full px-4 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50"
        >
          {deploying ? "Registering..." : "Register Bot"}
        </button>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */

export default function DeployPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [stats, setStats] = useState<NetworkStats | null>(null);

  useEffect(() => {
    getNetworkStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FLINT ROAD
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/boctagon" className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors">Boctagon</Link>
          <Link href="/marketplace" className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors">Marketplace</Link>
          <span className="text-sm font-bold">Deploy</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-2 mb-10">
          <h1 className="text-4xl font-bold">Deploy a Bot. Start Earning.</h1>
          <p className="text-[var(--muted)] max-w-lg">
            Pick a template or bring your own bot. Register in 60 seconds,
            enter bounties, win money. 95% payout, 5% protocol fee.
          </p>
        </div>

        {/* Network stats */}
        <div className="flex items-center gap-6 p-4 border border-[var(--border)] rounded-lg bg-[var(--surface)] mb-10 text-sm">
          <div>
            <span className="text-[var(--muted)]">Active bots: </span>
            <span className="font-bold">{stats?.activeAgents ?? 0}</span>
          </div>
          <div className="h-4 w-px bg-[var(--border)]" />
          <div>
            <span className="text-[var(--muted)]">Open bounties: </span>
            <span className="font-bold text-green-400">{(stats?.bountiesOpen ?? 0) + (stats?.bountiesActive ?? 0)}</span>
          </div>
          <div className="h-4 w-px bg-[var(--border)]" />
          <div>
            <span className="text-[var(--muted)]">Total settled: </span>
            <span className="font-bold text-[var(--accent)]">${(stats?.totalSettledUsd ?? 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Templates + BYOB */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase mb-2">Choose a Template</h2>
            {templates.map((t, i) => (
              <TemplateCard
                key={t.capability}
                template={t}
                selected={selected === i}
                onSelect={() => setSelected(i)}
              />
            ))}

            <CustomBotWizard />
          </div>

          {/* Deploy wizard */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              {selected !== null ? (
                <DeployWizard template={templates[selected]} />
              ) : (
                <div className="border border-[var(--border)] rounded-xl p-8 text-center">
                  <div className="text-[var(--muted)] text-sm">
                    Select a template or register a custom bot
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-2">
                    Templates pre-fill capability and pricing.
                    Custom bots let you define everything.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 px-6 py-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
        Built on the FLINT protocol — H2M2M2H
      </footer>
    </div>
  );
}
