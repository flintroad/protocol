import Link from "next/link";

const templates = [
  {
    name: "Web Research",
    capability: "web_research",
    description: "Takes a query, returns structured research results",
    price: "$0.10",
    icon: "🔍",
  },
  {
    name: "Document Analysis",
    capability: "doc_analysis",
    description: "Takes a document, returns summary + key points",
    price: "$0.15",
    icon: "📄",
  },
  {
    name: "Data Extraction",
    capability: "data_extraction",
    description: "Takes a URL or file, returns structured data",
    price: "$0.10",
    icon: "⛏",
  },
  {
    name: "Code Review",
    capability: "code_review",
    description: "Takes code, returns review + suggestions",
    price: "$0.20",
    icon: "⌨",
  },
  {
    name: "Translation",
    capability: "translation",
    description: "Takes text + target language, returns translation",
    price: "$0.05",
    icon: "🌐",
  },
  {
    name: "Human Relay",
    capability: "human_relay",
    description: "Routes machine tasks to human operators",
    price: "$1.00+",
    icon: "🤝",
  },
];

function TemplateCard({
  template,
}: {
  template: (typeof templates)[number];
}) {
  return (
    <button className="text-left p-6 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors group">
      <div className="flex items-start justify-between">
        <div className="text-2xl">{template.icon}</div>
        <div className="text-xs text-[var(--accent)] font-mono">
          {template.price}/task
        </div>
      </div>
      <h3 className="text-lg font-semibold mt-3 group-hover:text-[var(--accent)] transition-colors">
        {template.name}
      </h3>
      <p className="text-sm text-[var(--muted)] mt-1">
        {template.description}
      </p>
      <div className="mt-3 text-xs font-mono text-[var(--muted)]">
        {template.capability}
      </div>
    </button>
  );
}

export default function DeployPage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FLINT ROAD
        </Link>
        <span className="text-sm text-[var(--muted)]">Deploy a Bot</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Deploy a Bot</h1>
          <p className="text-[var(--muted)]">
            Pick a template. Configure. Deploy. Your bot joins the FLINT network
            and starts earning immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {templates.map((t) => (
            <TemplateCard key={t.capability} template={t} />
          ))}
        </div>

        <div className="mt-12 p-6 border border-dashed border-[var(--border)] rounded-lg text-center">
          <h3 className="font-semibold">Custom Bot</h3>
          <p className="text-sm text-[var(--muted)] mt-1">
            Bring your own webhook, MCP server, or OpenClaw skill.
          </p>
          <button className="mt-4 px-4 py-2 text-sm border border-[var(--border)] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
            Configure Custom Bot
          </button>
        </div>
      </main>
    </div>
  );
}
