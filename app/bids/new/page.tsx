import { redirect } from "next/navigation";

import { bidStatusOptions, bidStatusValues } from "@/lib/bids";
import { prisma } from "@/lib/prisma";
import ThemeToggle from "@/app/ThemeToggle";

const pageTitle = "New bid";

async function createBid(formData: FormData) {
  "use server";

  const clientName = String(formData.get("clientName") ?? "").trim();
  const bidName = String(formData.get("bidName") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const folderUrl = String(formData.get("folderUrl") ?? "").trim();

  if (!clientName || !bidName || !folderUrl) {
    throw new Error("All fields are required.");
  }

  if (!bidStatusValues.includes(status as (typeof bidStatusValues)[number])) {
    throw new Error("Invalid status.");
  }

  try {
    new URL(folderUrl);
  } catch {
    throw new Error("Folder URL must be a valid URL.");
  }

  await prisma.bid.create({
    data: {
      clientName,
      bidName,
      status: status as (typeof bidStatusValues)[number],
      folderUrl,
    },
  });

  redirect("/bids");
}

export default function NewBidPage() {
  return (
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">
              Bids
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{pageTitle}</h1>
            <p className="text-base text-ink-600">
              Capture the basics of a proposal so you can track momentum over
              time.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <form
          action={createBid}
          className="flex flex-col gap-6 rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm"
        >
          <div className="grid gap-2">
            <label className="text-sm font-medium text-ink-700" htmlFor="clientName">
              Client name
            </label>
            <input
              id="clientName"
              name="clientName"
              required
              placeholder="Acme Industries"
              className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-ink-700" htmlFor="bidName">
              Bid name
            </label>
            <input
              id="bidName"
              name="bidName"
              required
              placeholder="2026 Facilities RFP"
              className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-ink-700" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              required
              defaultValue="pending"
              className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
            >
              {bidStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-ink-700" htmlFor="folderUrl">
              SharePoint folder URL
            </label>
            <input
              id="folderUrl"
              name="folderUrl"
              type="url"
              required
              placeholder="https://company.sharepoint.com/sites/bids/..."
              className="h-11 rounded-lg border border-sand-200 bg-white px-3 text-base text-ink-900 shadow-sm outline-none transition focus:border-ink-400"
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <a
              href="/bids"
              className="text-sm font-medium text-ink-500 transition hover:text-ink-700"
            >
              Back to bids
            </a>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
            >
              Save bid
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
