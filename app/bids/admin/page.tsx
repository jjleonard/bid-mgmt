import { redirect } from "next/navigation";

import { bidStatusValues } from "@/lib/bids";
import { parseCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import ThemeToggle from "@/app/ThemeToggle";

type PageProps = {
  searchParams?:
    | { inserted?: string | string[]; skipped?: string | string[]; error?: string | string[] }
    | Promise<{ inserted?: string | string[]; skipped?: string | string[]; error?: string | string[] }>;
};

const requiredHeaders = ["clientName", "bidName", "status", "folderUrl"];

const statusAliases: Record<string, (typeof bidStatusValues)[number]> = {
  pending: "pending",
  "in progress": "in_progress",
  in_progress: "in_progress",
  "in-progress": "in_progress",
  bid: "bid",
  "no bid": "no_bid",
  no_bid: "no_bid",
  "no-bid": "no_bid",
  submitted: "submitted",
  won: "won",
  lost: "lost",
  dropped: "dropped",
  abandoned: "abandoned",
};

function normalizeStatus(value: string) {
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  return statusAliases[key];
}

async function importCsv(formData: FormData) {
  "use server";

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/bids/admin?error=" + encodeURIComponent("Please upload a CSV file."));
  }

  const text = Buffer.from(await file.arrayBuffer()).toString("utf-8");
  const { headers, rows } = parseCsv(text);

  const headerMap = new Map(
    headers.map((header, index) => [header.trim(), index])
  );

  const missingHeaders = requiredHeaders.filter((header) => !headerMap.has(header));

  if (missingHeaders.length > 0) {
    redirect(
      "/bids/admin?error=" +
        encodeURIComponent(`Missing headers: ${missingHeaders.join(", ")}`)
    );
  }

  const validRows: {
    clientName: string;
    bidName: string;
    status: (typeof bidStatusValues)[number];
    folderUrl: string;
  }[] = [];
  let skipped = 0;

  for (const row of rows) {
    const clientName = row[headerMap.get("clientName") ?? -1]?.trim() ?? "";
    const bidName = row[headerMap.get("bidName") ?? -1]?.trim() ?? "";
    const statusRaw = row[headerMap.get("status") ?? -1]?.trim() ?? "";
    const folderUrl = row[headerMap.get("folderUrl") ?? -1]?.trim() ?? "";

    if (!clientName || !bidName || !statusRaw || !folderUrl) {
      skipped += 1;
      continue;
    }

    const normalizedStatus = normalizeStatus(statusRaw);

    if (!normalizedStatus || !bidStatusValues.includes(normalizedStatus)) {
      skipped += 1;
      continue;
    }

    try {
      new URL(folderUrl);
    } catch {
      skipped += 1;
      continue;
    }

    validRows.push({
      clientName,
      bidName,
      status: normalizedStatus,
      folderUrl,
    });
  }

  const result = validRows.length
    ? await prisma.bid.createMany({
        data: validRows,
      })
    : { count: 0 };

  redirect(`/bids/admin?inserted=${result.count}&skipped=${skipped}`);
}

export default async function BidsAdminPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const insertedParam = resolvedSearchParams?.inserted;
  const skippedParam = resolvedSearchParams?.skipped;
  const errorParam = resolvedSearchParams?.error;

  const inserted = Number(Array.isArray(insertedParam) ? insertedParam[0] : insertedParam);
  const skipped = Number(Array.isArray(skippedParam) ? skippedParam[0] : skippedParam);
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const showSummary = Number.isFinite(inserted) || Number.isFinite(skipped);

  return (
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">
              Bids
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Admin import</h1>
            <p className="text-base text-ink-600">
              Upload a CSV to populate the bid list. Existing records are left
              unchanged.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
          <form action={importCsv} className="flex flex-col gap-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-ink-700" htmlFor="file">
                CSV file
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv,text/csv"
                className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm"
                required
              />
            </div>

            <div className="rounded-xl border border-sand-100 bg-sand-50 px-4 py-3 text-sm text-ink-600">
              <p className="font-medium text-ink-700">Expected headers</p>
              <code className="mt-2 block text-xs text-ink-600">
                clientName,bidName,status,folderUrl
              </code>
              <p className="mt-3 text-xs text-ink-500">
                Status values: pending, in progress, bid, no bid, submitted,
                won, lost, dropped, abandoned
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
            >
              Import bids
            </button>
          </form>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-white/80 px-6 py-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        {showSummary ? (
          <div className="rounded-2xl border border-sand-200 bg-white/80 px-6 py-4 text-sm text-ink-700 shadow-sm">
            Imported {Number.isFinite(inserted) ? inserted : 0} bid(s). Skipped {Number.isFinite(skipped) ? skipped : 0} row(s).
          </div>
        ) : null}

        <div className="flex items-center gap-4">
          <a
            href="/bids"
            className="text-sm font-medium text-ink-500 transition hover:text-ink-700"
          >
            Back to bids
          </a>
          <a
            href="/bids/new"
            className="text-sm font-medium text-ink-500 transition hover:text-ink-700"
          >
            Add a bid manually
          </a>
        </div>
      </main>
    </div>
  );
}
