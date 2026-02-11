import { redirect } from "next/navigation";

import {
  bidStageValues,
  bidStatusValues,
  computeAnnualValueGbp,
  opportunityTypeValues,
  tcvTermBasisValues,
} from "@/lib/bids";
import { prisma } from "@/lib/prisma";
import ThemeToggle from "@/app/ThemeToggle";
import BidForm from "@/app/bids/new/BidForm";

const pageTitle = "New bid";

async function createBid(formData: FormData) {
  "use server";

  const clientName = String(formData.get("clientName") ?? "").trim();
  const bidName = String(formData.get("bidName") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const folderUrl = String(formData.get("folderUrl") ?? "").trim();
  const portalUrl = String(formData.get("portalUrl") ?? "").trim();
  const opportunityType = String(formData.get("opportunityType") ?? "");
  const currentStage = String(formData.get("currentStage") ?? "");
  const nextStageDate = parseOptionalDate(formData.get("nextStageDate"));
  const psqReceivedAt = parseOptionalDate(formData.get("psqReceivedAt"));
  const psqClarificationDeadlineAt = parseOptionalDate(
    formData.get("psqClarificationDeadlineAt")
  );
  const psqSubmissionDeadlineAt = parseOptionalDate(
    formData.get("psqSubmissionDeadlineAt")
  );
  const psqSubmissionTime = parseOptionalTime(formData.get("psqSubmissionTime"));
  const ittReceivedAt = parseOptionalDate(formData.get("ittReceivedAt"));
  const ittClarificationDeadlineAt = parseOptionalDate(
    formData.get("ittClarificationDeadlineAt")
  );
  const ittSubmissionDeadlineAt = parseOptionalDate(
    formData.get("ittSubmissionDeadlineAt")
  );
  const ittSubmissionTime = parseOptionalTime(formData.get("ittSubmissionTime"));
  const tcvGbp = parseRequiredInt(formData.get("tcvGbp"), "Total contract value");
  const initialTermMonths = parseRequiredInt(
    formData.get("initialTermMonths"),
    "Initial term"
  );
  const extensionTermMonths = parseOptionalInt(formData.get("extensionTermMonths"));
  const tcvTermBasis = String(formData.get("tcvTermBasis") ?? "");

  if (!clientName || !bidName || !folderUrl) {
    throw new Error("All fields are required.");
  }

  if (!bidStatusValues.includes(status as (typeof bidStatusValues)[number])) {
    throw new Error("Invalid status.");
  }

  if (
    !opportunityTypeValues.includes(
      opportunityType as (typeof opportunityTypeValues)[number]
    )
  ) {
    throw new Error("Invalid opportunity type.");
  }

  if (
    opportunityType === "two_stage_psq_itt" &&
    !bidStageValues.includes(currentStage as (typeof bidStageValues)[number])
  ) {
    throw new Error("Current stage is required for two stage bids.");
  }

  if (!tcvTermBasisValues.includes(tcvTermBasis as (typeof tcvTermBasisValues)[number])) {
    throw new Error("Invalid TCV term basis.");
  }

  try {
    new URL(folderUrl);
  } catch {
    throw new Error("Folder URL must be a valid URL.");
  }

  if (portalUrl) {
    try {
      new URL(portalUrl);
    } catch {
      throw new Error("Portal URL must be a valid URL.");
    }
  }

  if (tcvGbp <= 0) {
    throw new Error("Total contract value must be greater than zero.");
  }

  if (initialTermMonths <= 0) {
    throw new Error("Initial term must be at least one month.");
  }

  if (extensionTermMonths !== null && extensionTermMonths < 0) {
    throw new Error("Extension term must be zero or greater.");
  }

  const annualValueGbp = computeAnnualValueGbp(
    tcvGbp,
    initialTermMonths,
    extensionTermMonths ?? 0,
    tcvTermBasis as (typeof tcvTermBasisValues)[number]
  );

  if (!Number.isFinite(annualValueGbp)) {
    throw new Error("Unable to calculate annual value.");
  }

  await prisma.bid.create({
    data: {
      clientName,
      bidName,
      status: status as (typeof bidStatusValues)[number],
      opportunityType: opportunityType as (typeof opportunityTypeValues)[number],
      currentStage:
        opportunityType === "two_stage_psq_itt"
          ? (currentStage as (typeof bidStageValues)[number])
          : null,
      nextStageDate: opportunityType === "two_stage_psq_itt" ? nextStageDate : null,
      psqReceivedAt: opportunityType === "two_stage_psq_itt" ? psqReceivedAt : null,
      psqClarificationDeadlineAt:
        opportunityType === "two_stage_psq_itt" ? psqClarificationDeadlineAt : null,
      psqSubmissionDeadlineAt:
        opportunityType === "two_stage_psq_itt" ? psqSubmissionDeadlineAt : null,
      psqSubmissionTime:
        opportunityType === "two_stage_psq_itt" ? psqSubmissionTime : null,
      ittReceivedAt,
      ittClarificationDeadlineAt,
      ittSubmissionDeadlineAt,
      ittSubmissionTime,
      tcvGbp,
      initialTermMonths,
      extensionTermMonths,
      tcvTermBasis: tcvTermBasis as (typeof tcvTermBasisValues)[number],
      annualValueGbp,
      portalUrl: portalUrl || null,
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

        <BidForm action={createBid} />
      </main>
    </div>
  );
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const date = new Date(`${raw}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date provided.");
  }

  return date;
}

function parseOptionalTime(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const match = raw.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    throw new Error("Submission time must be HH:MM.");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error("Submission time must be a valid 24-hour time.");
  }

  return raw;
}

function parseRequiredInt(value: FormDataEntryValue | null, label: string) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    throw new Error(`${label} is required.`);
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number.`);
  }

  return parsed;
}

function parseOptionalInt(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error("Extension term must be a whole number.");
  }

  return parsed;
}
