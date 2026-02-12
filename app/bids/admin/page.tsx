import { redirect } from "next/navigation";

import {
  bidStageValues,
  bidStatusValues,
  computeAnnualValueGbp,
  opportunityTypeValues,
  tcvTermBasisValues,
} from "@/lib/bids";
import { parseCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";

type PageProps = {
  searchParams?:
    | {
        inserted?: string | string[];
        skipped?: string | string[];
        error?: string | string[];
        deleted?: string | string[];
        auditDeleted?: string | string[];
        resetError?: string | string[];
      }
    | Promise<{
        inserted?: string | string[];
        skipped?: string | string[];
        error?: string | string[];
        deleted?: string | string[];
        auditDeleted?: string | string[];
        resetError?: string | string[];
      }>;
};

const importHeaders = [
  "id",
  "clientName",
  "bidName",
  "status",
  "opportunityType",
  "currentStage",
  "nextStageDate",
  "psqReceivedAt",
  "psqClarificationDeadlineAt",
  "psqSubmissionDeadlineAt",
  "psqSubmissionTime",
  "ittReceivedAt",
  "ittClarificationDeadlineAt",
  "ittSubmissionDeadlineAt",
  "ittSubmissionTime",
  "tcvGbp",
  "initialTermMonths",
  "extensionTermMonths",
  "tcvTermBasis",
  "annualValueGbp",
  "portalUrl",
  "folderUrl",
  "createdAt",
  "updatedAt",
];

const statusAliases: Record<string, (typeof bidStatusValues)[number]> = {
  pending: "pending",
  pipeline: "pipeline",
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

function parseOptionalDate(value: string) {
  const raw = value.trim();

  if (!raw) {
    return null;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseOptionalTime(value: string) {
  const raw = value.trim();

  if (!raw) {
    return null;
  }

  const match = raw.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return raw;
}

function parseOptionalInt(value: string) {
  const raw = value.trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

async function importCsv(formData: FormData) {
  "use server";

  await requireAdminUser();

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/bids/admin?error=" + encodeURIComponent("Please upload a CSV file."));
  }

  const text = Buffer.from(await file.arrayBuffer()).toString("utf-8");
  const { headers, rows } = parseCsv(text);

  const headerMap = new Map(
    headers.map((header, index) => [header.trim(), index])
  );

  const missingHeaders = importHeaders.filter((header) => !headerMap.has(header));

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
    opportunityType: (typeof opportunityTypeValues)[number];
    currentStage: (typeof bidStageValues)[number] | null;
    nextStageDate: Date | null;
    psqReceivedAt: Date | null;
    psqClarificationDeadlineAt: Date | null;
    psqSubmissionDeadlineAt: Date | null;
    psqSubmissionTime: string | null;
    ittReceivedAt: Date | null;
    ittClarificationDeadlineAt: Date | null;
    ittSubmissionDeadlineAt: Date | null;
    ittSubmissionTime: string | null;
    tcvGbp: number | null;
    initialTermMonths: number | null;
    extensionTermMonths: number | null;
    tcvTermBasis: (typeof tcvTermBasisValues)[number] | null;
    annualValueGbp: number | null;
    portalUrl: string | null;
    folderUrl: string;
  }[] = [];
  let skipped = 0;

  for (const row of rows) {
    const clientName = row[headerMap.get("clientName") ?? -1]?.trim() ?? "";
    const bidName = row[headerMap.get("bidName") ?? -1]?.trim() ?? "";
    const statusRaw = row[headerMap.get("status") ?? -1]?.trim() ?? "";
    const opportunityTypeRaw = row[headerMap.get("opportunityType") ?? -1]?.trim() ?? "";
    const currentStageRaw = row[headerMap.get("currentStage") ?? -1]?.trim() ?? "";
    const nextStageDateRaw = row[headerMap.get("nextStageDate") ?? -1]?.trim() ?? "";
    const psqReceivedAtRaw = row[headerMap.get("psqReceivedAt") ?? -1]?.trim() ?? "";
    const psqClarificationDeadlineAtRaw =
      row[headerMap.get("psqClarificationDeadlineAt") ?? -1]?.trim() ?? "";
    const psqSubmissionDeadlineAtRaw =
      row[headerMap.get("psqSubmissionDeadlineAt") ?? -1]?.trim() ?? "";
    const psqSubmissionTimeRaw = row[headerMap.get("psqSubmissionTime") ?? -1]?.trim() ?? "";
    const ittReceivedAtRaw = row[headerMap.get("ittReceivedAt") ?? -1]?.trim() ?? "";
    const ittClarificationDeadlineAtRaw =
      row[headerMap.get("ittClarificationDeadlineAt") ?? -1]?.trim() ?? "";
    const ittSubmissionDeadlineAtRaw =
      row[headerMap.get("ittSubmissionDeadlineAt") ?? -1]?.trim() ?? "";
    const ittSubmissionTimeRaw = row[headerMap.get("ittSubmissionTime") ?? -1]?.trim() ?? "";
    const tcvGbpRaw = row[headerMap.get("tcvGbp") ?? -1]?.trim() ?? "";
    const initialTermMonthsRaw = row[headerMap.get("initialTermMonths") ?? -1]?.trim() ?? "";
    const extensionTermMonthsRaw =
      row[headerMap.get("extensionTermMonths") ?? -1]?.trim() ?? "";
    const tcvTermBasisRaw = row[headerMap.get("tcvTermBasis") ?? -1]?.trim() ?? "";
    const annualValueGbpRaw = row[headerMap.get("annualValueGbp") ?? -1]?.trim() ?? "";
    const portalUrlRaw = row[headerMap.get("portalUrl") ?? -1]?.trim() ?? "";
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

    const opportunityType = opportunityTypeRaw
      ? (opportunityTypeRaw as (typeof opportunityTypeValues)[number])
      : "single_tender";

    if (!opportunityTypeValues.includes(opportunityType)) {
      skipped += 1;
      continue;
    }

    const tcvTermBasis = tcvTermBasisRaw
      ? (tcvTermBasisRaw as (typeof tcvTermBasisValues)[number])
      : null;

    if (tcvTermBasis && !tcvTermBasisValues.includes(tcvTermBasis)) {
      skipped += 1;
      continue;
    }

    try {
      new URL(folderUrl);
    } catch {
      skipped += 1;
      continue;
    }

    if (portalUrlRaw) {
      try {
        new URL(portalUrlRaw);
      } catch {
        skipped += 1;
        continue;
      }
    }

    const tcvGbp = parseOptionalInt(tcvGbpRaw);
    const initialTermMonths = parseOptionalInt(initialTermMonthsRaw);
    const extensionTermMonths = parseOptionalInt(extensionTermMonthsRaw);
    const annualValueGbpParsed = parseOptionalInt(annualValueGbpRaw);

    let annualValueGbp: number | null = null;

    if (
      tcvGbp !== null &&
      initialTermMonths !== null &&
      tcvTermBasis
    ) {
      const computed = computeAnnualValueGbp(
        tcvGbp,
        initialTermMonths,
        extensionTermMonths ?? 0,
        tcvTermBasis
      );

      if (Number.isFinite(computed)) {
        annualValueGbp = computed as number;
      }
    }

    if (annualValueGbpParsed !== null) {
      annualValueGbp = annualValueGbpParsed;
    }

    const isTwoStage = opportunityType === "two_stage_psq_itt";
    const currentStage = isTwoStage
      ? (bidStageValues.includes(currentStageRaw as (typeof bidStageValues)[number])
          ? (currentStageRaw as (typeof bidStageValues)[number])
          : null)
      : null;

    if (isTwoStage && !currentStage) {
      skipped += 1;
      continue;
    }

    validRows.push({
      clientName,
      bidName,
      status: normalizedStatus,
      opportunityType,
      currentStage,
      nextStageDate: isTwoStage ? parseOptionalDate(nextStageDateRaw) : null,
      psqReceivedAt: isTwoStage ? parseOptionalDate(psqReceivedAtRaw) : null,
      psqClarificationDeadlineAt: isTwoStage ? parseOptionalDate(psqClarificationDeadlineAtRaw) : null,
      psqSubmissionDeadlineAt: isTwoStage ? parseOptionalDate(psqSubmissionDeadlineAtRaw) : null,
      psqSubmissionTime: isTwoStage ? parseOptionalTime(psqSubmissionTimeRaw) : null,
      ittReceivedAt: parseOptionalDate(ittReceivedAtRaw),
      ittClarificationDeadlineAt: parseOptionalDate(ittClarificationDeadlineAtRaw),
      ittSubmissionDeadlineAt: parseOptionalDate(ittSubmissionDeadlineAtRaw),
      ittSubmissionTime: parseOptionalTime(ittSubmissionTimeRaw),
      tcvGbp,
      initialTermMonths,
      extensionTermMonths,
      tcvTermBasis,
      annualValueGbp,
      portalUrl: portalUrlRaw || null,
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

async function deleteAllBids(formData: FormData) {
  "use server";

  await requireAdminUser();

  const phrase = String(formData.get("confirm") ?? "").trim();

  if (phrase !== "DELETE ALL BIDS") {
    redirect(
      "/bids/admin?resetError=" +
        encodeURIComponent("Confirmation phrase did not match. No data was deleted.")
    );
  }

  const auditResult = await prisma.auditEvent.deleteMany();
  const bidResult = await prisma.bid.deleteMany();

  redirect(`/bids/admin?deleted=${bidResult.count}&auditDeleted=${auditResult.count}`);
}

export default async function BidsAdminPage({ searchParams }: PageProps) {
  await requireAdminUser();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const insertedParam = resolvedSearchParams?.inserted;
  const skippedParam = resolvedSearchParams?.skipped;
  const errorParam = resolvedSearchParams?.error;
  const deletedParam = resolvedSearchParams?.deleted;
  const auditDeletedParam = resolvedSearchParams?.auditDeleted;
  const resetErrorParam = resolvedSearchParams?.resetError;

  const inserted = Number(Array.isArray(insertedParam) ? insertedParam[0] : insertedParam);
  const skipped = Number(Array.isArray(skippedParam) ? skippedParam[0] : skippedParam);
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const deleted = Number(Array.isArray(deletedParam) ? deletedParam[0] : deletedParam);
  const auditDeleted = Number(
    Array.isArray(auditDeletedParam) ? auditDeletedParam[0] : auditDeletedParam
  );
  const resetError = Array.isArray(resetErrorParam) ? resetErrorParam[0] : resetErrorParam;
  const showSummary = Number.isFinite(inserted) || Number.isFinite(skipped);
  const showResetSummary = Number.isFinite(deleted) || Number.isFinite(auditDeleted);

  return (
    <div className="min-h-full bg-sand-50 text-ink-900">
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
                {importHeaders.join(",")}
              </code>
              <p className="mt-3 text-xs text-ink-500">
                Status values: pending, pipeline, in progress, bid, no bid,
                submitted, won, lost, dropped, abandoned
              </p>
              <p className="mt-2 text-xs text-ink-500">
                Opportunity types: single_tender, combined_psq_itt, two_stage_psq_itt
              </p>
              <p className="mt-2 text-xs text-ink-500">
                TCV term basis: initial_only, initial_plus_extension
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

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Export bids</h2>
              <p className="mt-1 text-sm text-ink-600">
                Download a CSV containing all current bids.
              </p>
            </div>
            <div className="rounded-xl border border-sand-100 bg-sand-50 px-4 py-3 text-xs text-ink-600">
              Fields: id, clientName, bidName, status, opportunityType, currentStage,
              nextStageDate, psqReceivedAt, psqClarificationDeadlineAt,
              psqSubmissionDeadlineAt, psqSubmissionTime, ittReceivedAt,
              ittClarificationDeadlineAt, ittSubmissionDeadlineAt, ittSubmissionTime,
              tcvGbp, initialTermMonths, extensionTermMonths, tcvTermBasis,
              annualValueGbp, folderUrl, createdAt, updatedAt
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/bids/admin/export"
                className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-sand-50 transition hover:bg-ink-700"
              >
                Export bids
              </a>
              <a
                href="/bids/admin/export-audit"
                className="inline-flex h-11 items-center justify-center rounded-full border border-ink-200 bg-white px-6 text-sm font-semibold text-ink-700 transition hover:border-ink-300"
              >
                Export audit trail
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-red-200 bg-white/80 p-8 shadow-sm">
          <form action={deleteAllBids} className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Reset all bid data</h2>
              <p className="mt-1 text-sm text-ink-600">
                This deletes every bid and all audit history. Export your data before
                continuing.
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              Type <span className="font-semibold">DELETE ALL BIDS</span> to confirm.
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-ink-700" htmlFor="confirm">
                Confirmation phrase
              </label>
              <input
                id="confirm"
                name="confirm"
                type="text"
                placeholder="DELETE ALL BIDS"
                className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Delete all bids
            </button>
          </form>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-white/80 px-6 py-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        {resetError ? (
          <div className="rounded-2xl border border-red-200 bg-white/80 px-6 py-4 text-sm text-red-700 shadow-sm">
            {resetError}
          </div>
        ) : null}

        {showSummary ? (
          <div className="rounded-2xl border border-sand-200 bg-white/80 px-6 py-4 text-sm text-ink-700 shadow-sm">
            Imported {Number.isFinite(inserted) ? inserted : 0} bid(s). Skipped {Number.isFinite(skipped) ? skipped : 0} row(s).
          </div>
        ) : null}

        {showResetSummary ? (
          <div className="rounded-2xl border border-sand-200 bg-white/80 px-6 py-4 text-sm text-ink-700 shadow-sm">
            Deleted {Number.isFinite(deleted) ? deleted : 0} bid(s) and {Number.isFinite(auditDeleted) ? auditDeleted : 0} audit event(s).
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
