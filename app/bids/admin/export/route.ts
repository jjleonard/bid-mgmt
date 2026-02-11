import { prisma } from "@/lib/prisma";

const headers = [
  "id",
  "clientName",
  "bidName",
  "status",
  "folderUrl",
  "createdAt",
  "updatedAt",
];

function csvEscape(value: string) {
  if (value.includes("\"") || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/\"/g, "\"\"")}"`;
  }

  return value;
}

export async function GET() {
  const bids = await prisma.bid.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = bids.map((bid) => [
    bid.id,
    bid.clientName,
    bid.bidName,
    bid.status,
    bid.folderUrl,
    bid.createdAt.toISOString(),
    bid.updatedAt.toISOString(),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => csvEscape(String(cell))).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"bids-export.csv\"",
    },
  });
}
