import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  bidStageValues,
  bidStatusValues,
  computeAnnualValueGbp,
  getBidStatusLabel,
  opportunityTypeValues,
  tcvTermBasisValues,
} from "@/lib/bids";
import { requireAdminUser } from "@/lib/auth";
import BidDetailsEditor from "@/app/bids/[id]/BidDetailsEditor";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function BidDetailsPage({ params }: PageProps) {
  await requireAdminUser();
  const resolvedParams = await Promise.resolve(params);
  const bid = await prisma.bid.findUnique({
    where: { id: resolvedParams.id },
  });

  type AuditChangeRow = {
    id: string;
    field: string;
    fromValue: string;
    toValue: string;
  };

  type AuditEventRow = {
    id: string;
    action: string;
    actor: string;
    createdAt: Date;
    changes: AuditChangeRow[];
  };

  const auditEvents = await (
    prisma as unknown as {
      auditEvent: {
        findMany: (args: object) => Promise<AuditEventRow[]>;
      };
    }
  ).auditEvent.findMany({
    where: { bidId: resolvedParams.id },
    include: { changes: true },
    orderBy: { createdAt: "desc" },
  });


  const auditFieldLabels: Record<string, string> = {
    clientName: "Client name",
    bidName: "Bid name",
    status: "Status",
    opportunityType: "Opportunity type",
    currentStage: "Current stage",
    nextStageDate: "Next stage date",
    psqReceivedAt: "PSQ received",
    psqClarificationDeadlineAt: "PSQ clarification deadline",
    psqSubmissionDeadlineAt: "PSQ submission deadline",
    psqSubmissionTime: "PSQ submission time",
    ittReceivedAt: "ITT received",
    ittClarificationDeadlineAt: "ITT clarification deadline",
    ittSubmissionDeadlineAt: "ITT submission deadline",
    ittSubmissionTime: "ITT submission time",
    tcvGbp: "Total contract value",
    initialTermMonths: "Initial term (months)",
    extensionTermMonths: "Extension term (months)",
    tcvTermBasis: "TCV term basis",
    annualValueGbp: "Annual value",
    portalUrl: "Portal link",
    folderUrl: "SharePoint folder URL",
  };

  if (!bid) {
    notFound();
  }

  const statusLabel = getBidStatusLabel(bid.status);

  async function updateBid(formData: FormData) {
    "use server";

    await requireAdminUser();

    const id = String(formData.get("id") ?? "");
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

    if (!id || !clientName || !bidName || !folderUrl) {
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

    const currentBid = await prisma.bid.findUnique({
      where: { id },
    });

    if (!currentBid) {
      notFound();
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

    const changes: { field: string; fromValue: string; toValue: string }[] = [];

    const pushChange = (field: string, fromValue: string, toValue: string) => {
      if (fromValue !== toValue) {
        changes.push({ field, fromValue, toValue });
      }
    };

    if (currentBid.clientName !== clientName) {
      pushChange("clientName", currentBid.clientName, clientName);
    }

    if (currentBid.bidName !== bidName) {
      pushChange("bidName", currentBid.bidName, bidName);
    }

    if (currentBid.status !== status) {
      pushChange("status", currentBid.status, status);
    }

    if (currentBid.portalUrl !== portalUrl) {
      pushChange("portalUrl", currentBid.portalUrl ?? "", portalUrl);
    }

    if (currentBid.opportunityType !== opportunityType) {
      pushChange("opportunityType", currentBid.opportunityType, opportunityType);
    }

    pushChange(
      "currentStage",
      currentBid.currentStage ?? "",
      opportunityType === "two_stage_psq_itt" ? currentStage : ""
    );

    pushChange(
      "nextStageDate",
      formatDateInput(currentBid.nextStageDate),
      opportunityType === "two_stage_psq_itt" ? formatDateInput(nextStageDate) : ""
    );

    pushChange("psqReceivedAt", formatDateInput(currentBid.psqReceivedAt), formatDateInput(psqReceivedAt));
    pushChange(
      "psqClarificationDeadlineAt",
      formatDateInput(currentBid.psqClarificationDeadlineAt),
      formatDateInput(psqClarificationDeadlineAt)
    );
    pushChange(
      "psqSubmissionDeadlineAt",
      formatDateInput(currentBid.psqSubmissionDeadlineAt),
      formatDateInput(psqSubmissionDeadlineAt)
    );
    pushChange("psqSubmissionTime", currentBid.psqSubmissionTime ?? "", psqSubmissionTime ?? "");

    pushChange("ittReceivedAt", formatDateInput(currentBid.ittReceivedAt), formatDateInput(ittReceivedAt));
    pushChange(
      "ittClarificationDeadlineAt",
      formatDateInput(currentBid.ittClarificationDeadlineAt),
      formatDateInput(ittClarificationDeadlineAt)
    );
    pushChange(
      "ittSubmissionDeadlineAt",
      formatDateInput(currentBid.ittSubmissionDeadlineAt),
      formatDateInput(ittSubmissionDeadlineAt)
    );
    pushChange("ittSubmissionTime", currentBid.ittSubmissionTime ?? "", ittSubmissionTime ?? "");

    pushChange("tcvGbp", String(currentBid.tcvGbp ?? ""), String(tcvGbp));
    pushChange(
      "initialTermMonths",
      String(currentBid.initialTermMonths ?? ""),
      String(initialTermMonths)
    );
    pushChange(
      "extensionTermMonths",
      String(currentBid.extensionTermMonths ?? ""),
      extensionTermMonths === null ? "" : String(extensionTermMonths)
    );
    pushChange("tcvTermBasis", currentBid.tcvTermBasis ?? "", tcvTermBasis);
    pushChange(
      "annualValueGbp",
      String(currentBid.annualValueGbp ?? ""),
      String(annualValueGbp)
    );

    if (currentBid.folderUrl !== folderUrl) {
      pushChange("folderUrl", currentBid.folderUrl, folderUrl);
    }

    if (changes.length === 0) {
      redirect(`/bids/${id}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.bid.update({
        where: { id },
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

      const auditClient = tx as unknown as {
        auditEvent: { create: (args: object) => Promise<{ id: string }> };
        auditChange: { createMany: (args: object) => Promise<unknown> };
      };

      const auditEvent = await auditClient.auditEvent.create({
        data: {
          bidId: id,
          bidIdSnapshot: id,
          bidLabel: `${clientName} · ${bidName}`,
        },
      });

      await auditClient.auditChange.createMany({
        data: changes.map((change) => ({
          eventId: auditEvent.id,
          field: change.field,
          fromValue: change.fromValue,
          toValue: change.toValue,
        })),
      });
    });

    redirect(`/bids/${id}`);
  }

  async function deleteBid(formData: FormData) {
    "use server";

    await requireAdminUser();

    const id = String(formData.get("id") ?? "");

    if (!id) {
      throw new Error("Missing bid id.");
    }

    const currentBid = await prisma.bid.findUnique({
      where: { id },
    });

    if (!currentBid) {
      notFound();
    }

    const changes = [
      {
        field: "clientName",
        fromValue: currentBid.clientName,
        toValue: "[deleted]",
      },
      {
        field: "bidName",
        fromValue: currentBid.bidName,
        toValue: "[deleted]",
      },
      {
        field: "status",
        fromValue: currentBid.status,
        toValue: "[deleted]",
      },
      {
        field: "folderUrl",
        fromValue: currentBid.folderUrl,
        toValue: "[deleted]",
      },
      {
        field: "portalUrl",
        fromValue: currentBid.portalUrl ?? "",
        toValue: "[deleted]",
      },
    ];

    await prisma.$transaction(async (tx) => {
      const auditClient = tx as unknown as {
        auditEvent: { create: (args: object) => Promise<{ id: string }> };
        auditChange: { createMany: (args: object) => Promise<unknown> };
      };

      const auditEvent = await auditClient.auditEvent.create({
        data: {
          bidId: id,
          bidIdSnapshot: id,
          bidLabel: `${currentBid.clientName} · ${currentBid.bidName}`,
          action: "delete",
        },
      });

      await auditClient.auditChange.createMany({
        data: changes.map((change) => ({
          eventId: auditEvent.id,
          field: change.field,
          fromValue: change.fromValue,
          toValue: change.toValue,
        })),
      });

      await tx.bid.delete({
        where: { id },
      });
    });

    redirect("/bids");
  }

  return (
    <div className="min-h-full bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">
              Bid details
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{bid.bidName}</h1>
            <p className="text-base text-ink-600">
              {bid.clientName} · {statusLabel}
            </p>
          </div>
        </header>

        <BidDetailsEditor
          bid={{
            id: bid.id,
            clientName: bid.clientName,
          bidName: bid.bidName,
          status: bid.status,
          opportunityType: bid.opportunityType,
          currentStage: bid.currentStage,
          nextStageDate: formatDateInput(bid.nextStageDate),
          psqReceivedAt: formatDateInput(bid.psqReceivedAt),
          psqClarificationDeadlineAt: formatDateInput(bid.psqClarificationDeadlineAt),
          psqSubmissionDeadlineAt: formatDateInput(bid.psqSubmissionDeadlineAt),
          psqSubmissionTime: bid.psqSubmissionTime,
          ittReceivedAt: formatDateInput(bid.ittReceivedAt),
          ittClarificationDeadlineAt: formatDateInput(bid.ittClarificationDeadlineAt),
          ittSubmissionDeadlineAt: formatDateInput(bid.ittSubmissionDeadlineAt),
          ittSubmissionTime: bid.ittSubmissionTime,
          tcvGbp: bid.tcvGbp,
          initialTermMonths: bid.initialTermMonths,
          extensionTermMonths: bid.extensionTermMonths,
          tcvTermBasis: bid.tcvTermBasis,
          annualValueGbp: bid.annualValueGbp,
          portalUrl: bid.portalUrl,
          folderUrl: bid.folderUrl,
        }}
        onSave={updateBid}
        onDelete={deleteBid}
        />

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
              Audit trail
            </p>
          </div>
          {auditEvents.length === 0 ? (
            <p className="mt-6 text-sm text-ink-600">
              No changes recorded yet.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {auditEvents.map((event) => (
                <div key={event.id} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-500">
                    <span>{event.action}</span>
                    <span>·</span>
                    <span>{event.actor}</span>
                    <span>·</span>
                    <span>{event.createdAt.toISOString().replace("T", " ").slice(0, 16)}</span>
                  </div>
                  <div className="space-y-1 text-sm text-ink-700">
                    {event.changes.map((change) => (
                      <p key={change.id}>
                        <span className="font-medium text-ink-900">
                          {auditFieldLabels[change.field] ?? change.field}
                        </span>
                        {": "}
                        <span className="text-ink-600">{change.fromValue}</span>
                        {" → "}
                        <span>{change.toValue}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
            Add another bid
          </a>
        </div>
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

function formatDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}
