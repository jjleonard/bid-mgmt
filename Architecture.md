# Architecture

## Overview
- A Next.js App Router project with server components and server actions.
- SQLite for local persistence, accessed via Prisma with a driver adapter.
- Minimal UI built with Tailwind v4 and custom neutral palette.
- Light/dark theming via CSS tokens and a shared navbar toggle.
- Email/password authentication backed by session cookies.

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
- UI includes a shared navbar with user display, nav links, and a theme toggle.
- CSV admin import validates and inserts valid rows, skipping invalid entries.
- Admin page supports CSV exports for bids and audit trail data.
- Admin page includes a reset flow that deletes bids and audit history with a confirmation phrase.
- Admin user creation lives at `/admin` with optional bootstrap token.
- Login/logout available at `/login` and via the navbar.
- Password reset emails are sent via SMTP with a generic confirmation message.
- Password reset requests are rate limited by email and IP.
- Rate limit thresholds are configurable via environment variables.
- Admin-only access enforced for `/admin` and `/bids` routes with server-side guards.
- Statuses include pending, in progress, bid, no bid, submitted, won, lost, dropped, abandoned.
  - Added pipeline.

## Key Paths
- Data model: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- Prisma client: `lib/prisma.ts` (uses `@prisma/adapter-better-sqlite3`)
- Bid status helpers: `lib/bids.ts`
- Auth helpers: `lib/auth.ts`
- Route guards: `app/admin/layout.tsx`, `app/bids/layout.tsx`
- Password reset helpers: `lib/password-reset.ts`
- Email helper: `lib/email.ts`
- Routes:
  - `app/page.tsx` (landing)
  - `app/bids/page.tsx` (list + filter)
  - `app/bids/new/page.tsx` (new bid form)
  - `app/bids/[id]/page.tsx` (bid details)
  - `app/bids/admin/page.tsx` (CSV import)
  - `app/admin/page.tsx` (user creation)
  - `app/login/page.tsx` (login)
  - `app/forgot-password/page.tsx` (request reset)
  - `app/reset-password/page.tsx` (set new password)
- Shared nav: `app/NavBar.tsx`
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
- `User`
  - `id` (cuid)
  - `firstName`, `surname`
  - `email` (unique)
  - `role` (enum)
  - `passwordHash`
  - `createdAt`, `updatedAt`
- `Session`
  - `id` (cuid)
  - `userId`
  - `token` (unique)
  - `expiresAt`
- `PasswordResetToken`
  - `id` (cuid)
  - `userId`
  - `tokenHash` (unique)
  - `expiresAt`
  - `usedAt`
- `PasswordResetRequest`
  - `id` (cuid)
  - `email`
  - `ipAddress`
  - `createdAt`

## Data Flow
- `/bids/new` posts via a server action.
- The server action validates inputs and creates a `Bid` record.
- On success, the user is redirected to `/bids`.
- `/bids` fetches the latest bids on the server and supports filtering by status via query string.
- `/bids` also supports client search via `q`, with filters reset on search submit.
- Theme is set via `data-theme` tokens and can be toggled from the navbar.
- Deleting a bid logs a `delete` audit event and preserves snapshots of bid identity.
- `/bids/[id]` fetches a single bid by id.
- `/bids/admin` uploads a CSV, validates rows, inserts valid bids, and reports counts.
- `/bids/admin/export` downloads all bids as CSV.
- `/bids/admin/export-audit` downloads audit events and changes as CSV.
- `/admin` creates users (with optional `ADMIN_BOOTSTRAP_TOKEN` check).
- `/login` verifies credentials, creates a session, and writes a cookie.
- `/forgot-password` accepts an email and always shows a generic confirmation.
- `/reset-password` validates the token, updates the password, and clears sessions.
- Password reset requests are tracked for rate limiting.
- `/admin` and `/bids` pages require an admin session; exports enforce checks in route handlers.

## Local Development
1. Ensure `.env` contains `DATABASE_URL="file:./dev.db"`.
2. (Optional) Set `ADMIN_BOOTSTRAP_TOKEN` to require a token for user creation.
3. Run `npm run dev`.
4. Use `npx prisma migrate dev --name init` if you need to recreate the database.
5. Restart the dev server after Prisma schema changes so the generated client reloads.
