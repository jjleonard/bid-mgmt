
export default function Home() {
  return (
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-20">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">App</p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Welcome to your workspace.
            </h1>
            <p className="max-w-2xl text-base text-ink-600">
              Use the link below to access the bids experience and continue
              tracking proposals.
            </p>
          </div>
        </header>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/bids"
            className="inline-flex h-11 items-center justify-center rounded-full border border-sand-200 px-6 text-sm font-semibold text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
          >
            Go to bids
          </a>
        </div>
      </main>
    </div>
  );
}
