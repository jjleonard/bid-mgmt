# Architecture

## Overview
- A Next.js App Router project with server components and server actions.
- SQLite for local persistence, accessed via Prisma with a driver adapter.
- Minimal UI built with Tailwind v4 and custom neutral palette.
- Light/dark theming via CSS tokens and a small client toggle.

## Key Principles
- Server components fetch data directly, keeping queries close to the route.
- Server actions handle form submissions without client-side API glue.
- Query string filters map to deterministic server reads for predictable UX.
- Prisma adapter is required for the client engine in Prisma 7 with SQLite.
- Database connection is centralized to avoid duplicate clients in dev.
- Styling uses a small, neutral token set for visual consistency.
- Theme preference is stored in localStorage and applied at boot to avoid flashes.
- Audit events store bid snapshots so history remains readable after deletions.

## Current State Snapshot
- Bid list supports status filtering, client-name sorting, and deep links to details.
- Bid list supports client-name search via `q` query param.
- UI includes a per-page theme toggle and subtle zebra striping for scanability.
- CSV admin import validates and inserts valid rows, skipping invalid entries.
- Admin page supports CSV exports for bids and audit trail data.
- Admin page includes a reset flow that deletes bids and audit history with a confirmation phrase.
- Statuses include pending, in progress, bid, no bid, submitted, won, lost, dropped, abandoned.
  - Added pipeline.

## Key Paths
- Data model: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- Prisma client: `lib/prisma.ts` (uses `@prisma/adapter-better-sqlite3`)
- Bid status helpers: `lib/bids.ts`
- Routes:
  - `app/page.tsx` (landing)
  - `app/bids/page.tsx` (list + filter)
  - `app/bids/new/page.tsx` (new bid form)
  - `app/bids/[id]/page.tsx` (bid details)
  - `app/bids/admin/page.tsx` (CSV import)
- Theme toggle: `app/ThemeToggle.tsx`

## Data Model
- `Bid`
  - `id` (cuid)
  - `clientName`
  - `bidName`
  - `status` (enum)
  - `opportunityType` (enum)
  - `currentStage` (enum, optional)
  - `nextStageDate`
  - `psqReceivedAt`, `psqClarificationDeadlineAt`, `psqSubmissionDeadlineAt`, `psqSubmissionTime`
  - `ittReceivedAt`, `ittClarificationDeadlineAt`, `ittSubmissionDeadlineAt`, `ittSubmissionTime`
  - `tcvGbp`, `initialTermMonths`, `extensionTermMonths`, `tcvTermBasis`
  - `annualValueGbp`
  - `portalUrl`
  - `folderUrl`
  - `createdAt`, `updatedAt`

## Data Flow
- `/bids/new` posts via a server action.
- The server action validates inputs and creates a `Bid` record.
- On success, the user is redirected to `/bids`.
- `/bids` fetches the latest bids on the server and supports filtering by status via query string.
- `/bids` also supports client search via `q`, with filters reset on search submit.
- Theme is set via `data-theme` tokens and can be toggled on any page header.
- Deleting a bid logs a `delete` audit event and preserves snapshots of bid identity.
- `/bids/[id]` fetches a single bid by id.
- `/bids/admin` uploads a CSV, validates rows, inserts valid bids, and reports counts.
- `/bids/admin/export` downloads all bids as CSV.
- `/bids/admin/export-audit` downloads audit events and changes as CSV.

## Local Development
1. Ensure `.env` contains `DATABASE_URL="file:./dev.db"`.
2. Run `npm run dev`.
3. Use `npx prisma migrate dev --name init` if you need to recreate the database.
4. Restart the dev server after Prisma schema changes so the generated client reloads.
