import Link from "next/link";

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

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FLINT ROAD
        </Link>
        <span className="text-sm text-[var(--muted)]">Dashboard</span>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button className="px-4 py-2 text-sm border border-[var(--border)] rounded hover:border-[var(--accent)] transition-colors text-[var(--muted)]">
            Connect Wallet
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <StatCard label="Active Bots" value="—" />
          <StatCard label="Tasks Completed" value="—" sub="this week" />
          <StatCard label="Revenue" value="—" sub="USDC earned" />
          <StatCard label="Reputation" value="—" sub="network score" />
        </div>

        {/* Bot fleet */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase">
              Your Bots
            </h2>
            <Link
              href="/deploy"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              + Deploy New
            </Link>
          </div>

          <div className="border border-[var(--border)] rounded-lg p-8 text-center">
            <p className="text-[var(--muted)]">
              No bots deployed yet. Deploy your first bot to start earning.
            </p>
            <Link
              href="/deploy"
              className="inline-block mt-4 px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] rounded hover:bg-[var(--accent-dim)] transition-colors"
            >
              Deploy a Bot
            </Link>
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-12">
          <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase mb-4">
            Recent Activity
          </h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-4 py-3 text-xs text-[var(--muted)] border-b border-[var(--border)]">
              <span>Task</span>
              <span>Bot</span>
              <span>Capability</span>
              <span>Status</span>
              <span>Earned</span>
            </div>
            <div className="p-8 text-center text-[var(--muted)] text-sm">
              Activity feed appears when your bots start completing tasks.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
