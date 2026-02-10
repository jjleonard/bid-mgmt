import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { bidStatusValues } from "@/lib/bids";
import ThemeToggle from "@/app/ThemeToggle";
import BidDetailsEditor from "@/app/bids/[id]/BidDetailsEditor";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function BidDetailsPage({ params }: PageProps) {
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
    folderUrl: "SharePoint folder URL",
  };

  if (!bid) {
    notFound();
  }

  async function updateBid(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    const clientName = String(formData.get("clientName") ?? "").trim();
    const bidName = String(formData.get("bidName") ?? "").trim();
    const status = String(formData.get("status") ?? "");
    const folderUrl = String(formData.get("folderUrl") ?? "").trim();

    if (!id || !clientName || !bidName || !folderUrl) {
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

    const currentBid = await prisma.bid.findUnique({
      where: { id },
    });

    if (!currentBid) {
      notFound();
    }

    const changes: { field: string; fromValue: string; toValue: string }[] = [];

    if (currentBid.clientName !== clientName) {
      changes.push({
        field: "clientName",
        fromValue: currentBid.clientName,
        toValue: clientName,
      });
    }

    if (currentBid.bidName !== bidName) {
      changes.push({
        field: "bidName",
        fromValue: currentBid.bidName,
        toValue: bidName,
      });
    }

    if (currentBid.status !== status) {
      changes.push({
        field: "status",
        fromValue: currentBid.status,
        toValue: status,
      });
    }

    if (currentBid.folderUrl !== folderUrl) {
      changes.push({
        field: "folderUrl",
        fromValue: currentBid.folderUrl,
        toValue: folderUrl,
      });
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
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">
              Bid details
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{bid.bidName}</h1>
            <p className="text-base text-ink-600">
              {bid.clientName} · {bid.status.replace("_", " ")}
            </p>
          </div>
          <ThemeToggle />
        </header>

        <BidDetailsEditor
          bid={{
            id: bid.id,
            clientName: bid.clientName,
            bidName: bid.bidName,
            status: bid.status,
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
