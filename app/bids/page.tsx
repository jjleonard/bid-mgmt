import { bidStatusOptions, bidStatusValues, getBidStatusLabel } from "@/lib/bids";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import ClientSort from "@/app/bids/ClientSort";
import StatusFilter from "@/app/bids/StatusFilter";
import SearchFilter from "@/app/bids/SearchFilter";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type PageProps = {
  searchParams?:
    | {
        status?: string | string[];
        sort?: string | string[];
        dir?: string | string[];
        q?: string | string[];
      }
    | Promise<{
        status?: string | string[];
        sort?: string | string[];
        dir?: string | string[];
        q?: string | string[];
      }>;
};

type BidRow = {
  id: string;
  clientName: string;
  bidName: string;
  status: string;
  folderUrl: string;
};

export default async function BidsPage({ searchParams }: PageProps) {
  await requireAdminUser();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const rawStatus = resolvedSearchParams?.status;
  const statusFilter = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const rawQuery = resolvedSearchParams?.q;
  const searchQuery = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim();
  const rawSort = resolvedSearchParams?.sort;
  const rawDir = resolvedSearchParams?.dir;
  const sortKey = Array.isArray(rawSort) ? rawSort[0] : rawSort;
  const sortDirection = Array.isArray(rawDir) ? rawDir[0] : rawDir;
  const selectedStatus = bidStatusValues.includes(
    statusFilter as (typeof bidStatusValues)[number]
  )
    ? (statusFilter as (typeof bidStatusValues)[number])
    : "all";

  const isClientSort = sortKey === "client";
  const clientSortDirection = sortDirection === "asc" ? "asc" : "desc";

  const bids = (await prisma.bid.findMany({
    where:
      selectedStatus === "all" && !searchQuery
        ? undefined
        : {
            ...(selectedStatus === "all"
              ? {}
              : {
                  status: selectedStatus,
                }),
            ...(searchQuery
              ? {
                  clientName: {
                    contains: searchQuery,
                  },
                }
              : {}),
          },
    orderBy: isClientSort
      ? [{ clientName: clientSortDirection }, { createdAt: "desc" }]
      : { createdAt: "desc" },
  })) as BidRow[];


  return (
    <div className="min-h-full bg-sand-50 text-ink-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">
              Bids
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">All bids</h1>
            <p className="text-base text-ink-600">
              Track proposals and keep the latest status in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/bids/new"
              className="inline-flex h-11 items-center justify-center rounded-full border border-ink-900 px-5 text-sm font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-sand-50"
            >
              New bid
            </a>
          </div>
        </header>

        <section className="rounded-2xl border border-sand-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <SearchFilter initialValue={searchQuery ?? ""} />
            <StatusFilter
              options={bidStatusOptions}
              selected={selectedStatus}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-sand-200 bg-white/80 shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-sand-200 px-6 py-4">
            <span className="col-span-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
              <ClientSort active={isClientSort} direction={clientSortDirection} />
            </span>
            <span className="col-span-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
              Bid
            </span>
            <span className="col-span-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
              Status
            </span>
            <span className="col-span-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
              Folder
            </span>
          </div>
          <div className="divide-y divide-sand-200">
            {bids.length === 0 ? (
              <div className="px-6 py-10 text-sm text-ink-600">
                {searchQuery
                  ? `No bids match "${searchQuery}".`
                  : "No bids yet. Add the first one to get started."}
              </div>
            ) : (
              bids.map((bid, index) => (
                <div
                  key={bid.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 text-sm text-ink-700 ${
                    index % 2 === 0 ? "bg-sand-50/60" : "bg-transparent"
                  }`}
                >
                  <span className="col-span-3 font-medium text-ink-900">
                    {bid.clientName}
                  </span>
                  <span className="col-span-4">
                    <a
                      href={`/bids/${bid.id}`}
                      className="font-medium text-ink-900 underline-offset-4 hover:underline"
                    >
                      {bid.bidName}
                    </a>
                  </span>
                  <span className="col-span-2 capitalize">
                    {getBidStatusLabel(bid.status as (typeof bidStatusValues)[number])}
                  </span>
                  <span className="col-span-3 truncate">
                    <a
                      href={bid.folderUrl}
                      className="text-ink-700 underline-offset-4 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      SharePoint folder
                    </a>
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
