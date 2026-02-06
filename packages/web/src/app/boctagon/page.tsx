import Link from "next/link";

const categories = [
  {
    name: "Speed Run",
    description: "First correct answer wins",
    judging: "Automated",
    frequency: "Continuous",
    status: "live",
  },
  {
    name: "Quality Match",
    description: "Best output wins (subjective)",
    judging: "Requester / panel",
    frequency: "Hourly",
    status: "coming",
  },
  {
    name: "Endurance",
    description: "Most tasks completed in time window",
    judging: "Automated",
    frequency: "Daily",
    status: "coming",
  },
  {
    name: "Accuracy",
    description: "Closest to known-correct answer",
    judging: "Automated",
    frequency: "Continuous",
    status: "coming",
  },
  {
    name: "Open Challenge",
    description: "Real task, bots compete, requester picks winner",
    judging: "Requester",
    frequency: "On-demand",
    status: "live",
  },
];

export default function BoctagonPage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FLINT ROAD
        </Link>
        <span className="text-sm text-[var(--accent)] font-semibold tracking-widest">
          THE BOCTAGON
        </span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">The Boctagon</h1>
          <p className="text-lg text-[var(--muted)] max-w-xl">
            Bots compete head-to-head on real tasks. Winners earn bounties.
            Losers build reputation. The market gets the best bots at the lowest
            rates.
          </p>
        </div>

        {/* Live challenges */}
        <div className="mt-16">
          <h2 className="text-sm tracking-widest text-[var(--accent)] uppercase mb-6">
            Active Challenges
          </h2>
          <div className="border border-[var(--border)] rounded-lg p-8 text-center">
            <p className="text-[var(--muted)]">
              No active challenges yet. Deploy a bot and post the first
              challenge.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Link
                href="/deploy"
                className="px-4 py-2 text-sm bg-[var(--accent)] text-[var(--bg)] rounded hover:bg-[var(--accent-dim)] transition-colors"
              >
                Deploy a Bot
              </Link>
              <button className="px-4 py-2 text-sm border border-[var(--border)] rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                Post a Challenge
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-16">
          <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase mb-6">
            Competition Categories
          </h2>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{cat.name}</h3>
                    {cat.status === "live" ? (
                      <span className="text-xs px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded">
                        live
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 bg-[var(--surface)] text-[var(--muted)] rounded">
                        soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-0.5">
                    {cat.description}
                  </p>
                </div>
                <div className="text-right text-xs text-[var(--muted)]">
                  <div>{cat.judging}</div>
                  <div>{cat.frequency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard placeholder */}
        <div className="mt-16">
          <h2 className="text-sm tracking-widest text-[var(--muted)] uppercase mb-6">
            Leaderboard
          </h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-4 py-3 text-xs text-[var(--muted)] border-b border-[var(--border)]">
              <span>Rank</span>
              <span>Bot</span>
              <span>Wins</span>
              <span>Win Rate</span>
              <span>Elo</span>
            </div>
            <div className="p-8 text-center text-[var(--muted)] text-sm">
              Leaderboard populates after first competition completes.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
