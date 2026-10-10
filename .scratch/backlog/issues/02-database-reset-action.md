# Database Reset Action (Revert MongoDB to MariaDB)

Status: needs-triage
Category: enhancement

## Problem Statement

Per ADR-0001, database migration is a one-way runtime transition from MariaDB to MongoDB. While the Admin "Seed Database" action populates MariaDB even in MongoDB mode, there is currently no runtime action to switch the active database strategy back to MariaDB or purge MongoDB collections. Evaluators who want to run the demonstration again currently need to manually restart backend containers or reload the environment.

## Proposed Solution

1. **Backend Endpoint**:
   - `POST /api/admin/reset` to switch the active `DatabaseStrategy` back to `MariaDBStrategy`.
   - Optionally support a parameter or behavior to drop MongoDB collections so MongoDB is clean for another migration run.
2. **Strategy Switching**:
   - Introduce `switch_to_maria()` in `app/db/__init__.py` complementary to the existing `switch_to_mongo()`.
3. **Frontend UI**:
   - In `AdminPage` ([`admin-page.ts`](file:///c:/Users/Jakob/Documents/git_projects/carebase-angular/frontend/carebase-frontend/src/app/admin-page/admin-page.ts)), add a "Reset to MariaDB" action card with a confirmation dialog.
   - When executed, invoke `POST /api/admin/reset` and refresh the header database status badge.

## Acceptance Criteria

- Admin can trigger a database reset from the Admin portal.
- Active strategy switches from `MongoDB` back to `MariaDB` in real time without restarting the Flask server.
- The header status indicator updates immediately from "MongoDB" to "MariaDB".
- Subsequent reads and writes target MariaDB.

## Comments
