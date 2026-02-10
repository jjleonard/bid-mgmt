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

## Next Steps
- Add lightweight validation errors on the form UI.
- Add edit/delete flows for full CRUD.
- Introduce authentication and access rules.
