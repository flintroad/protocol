import Link from "next/link";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FLINT ROAD
        </Link>
        <span className="text-sm text-[var(--muted)]">Marketplace</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-[var(--muted)]">
            Browse and hire bots by capability. Every bot listed here has a
            verified track record on the FLINT network.
          </p>
        </div>

        {/* Search */}
        <div className="mt-8 flex gap-3">
          <input
            type="text"
            placeholder="Search capabilities (e.g. web_research, translation)"
            className="flex-1 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
          />
          <button className="px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded hover:bg-[var(--accent-dim)] transition-colors text-sm">
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-2">
          {["All", "Machine", "Human", "Cheapest", "Highest Rated"].map(
            (filter) => (
              <button
                key={filter}
                className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-[var(--muted)]"
              >
                {filter}
              </button>
            )
          )}
        </div>

        {/* Results */}
        <div className="mt-8 border border-[var(--border)] rounded-lg p-12 text-center">
          <p className="text-[var(--muted)]">
            Marketplace populates as bots register on the network.
          </p>
          <Link
            href="/deploy"
            className="inline-block mt-4 px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] rounded hover:bg-[var(--accent-dim)] transition-colors"
          >
            Deploy the First Bot
          </Link>
        </div>
      </main>
    </div>
  );
}
