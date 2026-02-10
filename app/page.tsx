import ThemeToggle from "@/app/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-20">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">
              Bid Manager
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Keep proposals organized and current.
            </h1>
            <p className="max-w-2xl text-base text-ink-600">
              Start by adding new bids or reviewing the list of existing
              proposals.
            </p>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/bids/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
          >
            Create new bid
          </a>
          <a
            href="/bids"
            className="inline-flex h-11 items-center justify-center rounded-full border border-sand-200 px-6 text-sm font-semibold text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
          >
            View all bids
          </a>
        </div>
      </main>
    </div>
  );
}
