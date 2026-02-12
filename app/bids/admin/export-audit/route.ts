import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const headers = [
  "bidLabel",
  "action",
  "actor",
  "eventCreatedAt",
  "field",
  "fromValue",
  "toValue",
];

function csvEscape(value: string) {
  if (value.includes("\"") || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/\"/g, "\"\"")}"`;
  }

  return value;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return new Response("Unauthorized", { status: 302, headers: { Location: "/login" } });
  }

  const events = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    include: { changes: true },
  });

  const rows: string[][] = [];

  for (const event of events) {
    if (event.changes.length === 0) {
      rows.push([
        event.bidLabel ?? "",
        event.action,
        event.actor,
        event.createdAt.toISOString(),
        "",
        "",
        "",
      ]);
      continue;
    }

    for (const change of event.changes) {
      rows.push([
        event.bidLabel ?? "",
        event.action,
        event.actor,
        event.createdAt.toISOString(),
        change.field,
        change.fromValue,
        change.toValue,
      ]);
    }
  }

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => csvEscape(String(cell))).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"bids-audit-export.csv\"",
    },
  });
}
