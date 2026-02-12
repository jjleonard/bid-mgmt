# Progress Log

## 2026-02-10
- Added Prisma + SQLite setup with `Bid` model and `BidStatus` enum.
- Created Prisma config and client helper.
- Switched Prisma runtime to the better-sqlite3 driver adapter for Node.
- Added bid details page and linked bid names from the list.
- Added CSV import admin page for batch bid creation.
- Added bid statuses for in progress and abandoned.
- Improved CSV status normalization and validation.
- Added client-side status filter and client-name sorting on the bids list.
- Implemented `/bids/new` form with server action to save bids.
- Implemented `/bids` list page with status filtering.
- Updated global styling to a neutral, minimal palette.
- Added architecture documentation.
- Added a light/dark theme toggle with stored preference and a boot-time theme script.
- Added dark mode palette tokens and data-theme based styling.
- Refined bid list headers to small-caps styling and added zebra striping for rows.
- Slowed the background color transition and removed heading transitions.
- Added a client-name search filter on the bids list.
- Added edit and delete flows on bid detail pages with inline confirmation.
- Added audit trail snapshots to preserve context after deletions.
- Added CSV export for bids and audit trail data from the admin page.
- Added admin reset flow with explicit confirmation to delete bids and audit history.
- Added a Pipeline bid status and normalized title-case status labels in the UI.

## 2026-02-11
- Expanded bids with opportunity type, stage tracking, and two-stage date fields.
- Added contract value inputs with stored annual value calculation.
- Added portal link field alongside SharePoint folder link.
- Updated bid detail layout with clearer section dividers and ordering.
- Expanded CSV export/import schema to include new bid fields.
- Added Prisma migrations for new bid detail fields and portal link.

## 2026-02-12
- Added `User` and `Session` models with role support in Prisma.
- Added `/admin` user creation page with bootstrap token support.
- Added `/login` page with email/password authentication.
- Added session cookie handling and login/logout actions.
- Introduced a shared navbar with user display and navigation.
- Moved the theme toggle into the navbar and removed per-page toggles.
- Updated the landing page copy to a generic app entry point.
- Added password reset token model and reset email flow scaffolding.
- Added `/forgot-password` and `/reset-password` pages.
- Added admin-triggered password reset email action.
- Added rate limiting for password reset requests by email and IP.
- Added password confirmation field on reset form.
- Added rate-limit feedback messaging and exposed rate limit env vars.
- Added admin-only access guards for /admin and /bids routes with server-side checks.
- Added branding settings with logo upload, footer details, and support email.
- Added default footer branding and sticky footer layout.

## Next Steps
- Add lightweight validation errors on the form UI.
- Add edit/delete flows for full CRUD.
- Add password reset or admin password rotation.
