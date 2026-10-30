# CampusOps — 30 Development Checkpoints Master Progress Tracker

**Project:** CampusOps — Intelligent Campus Operations Platform  
**Team:** LOWKEY CODERS | Problem Statement 2 | Overclock'26 Hackathon  
**Target:** Local-First SQLite + Express + React Vite Monorepo  
**Current Status:** 30 / 30 Checkpoints Passed (All Checkpoints Verified & 100% Tests Passing)  

---

## Progress Overview

| Checkpoint | Description | Status | User Approval |
|---|---|---|---|
| **01** | Inspect repository and workbook | **PASSED** | Not required |
| **02** | Document workbook tables, relationships and data-quality issues | **PASSED** | Not required |
| **03** | Present architecture and schema decisions for my approval | **PASSED** | **APPROVED by User** |
| **04** | Initialise monorepo and development tooling | **PASSED** | Not required |
| **05** | Configure Express, React and frontend/backend connectivity | **PASSED** | Not required |
| **06** | Create complete Prisma schema | **PASSED** | Not required |
| **07** | Run migrations and validate database integrity | **PASSED** | Not required |
| **08** | Build Excel importer and validation reports | **PASSED** | Not required |
| **09** | Import the dataset and verify record counts and relationships | **PASSED** | Not required |
| **10** | Implement bcrypt password hashing and secure sessions | **PASSED** | Not required |
| **11** | Implement login, logout and active-role selection | **PASSED** | Not required |
| **12** | Implement backend RBAC and test unauthorised access | **PASSED** | Not required |
| **13** | Build campus directory and asset lookup APIs | **PASSED** | Not required |
| **14** | Build complaint submission and incident persistence | **PASSED** | **APPROVED by User** |
| **15** | Implement AI-assisted triage with offline fallback | **PASSED** | Not required |
| **16** | Implement duplicate/related incident detection | **PASSED** | Not required |
| **17** | Implement incident lifecycle and event history | **PASSED** | Not required |
| **18** | Implement technician skills, shifts, leave and eligibility checks | **PASSED** | **APPROVED by User** |
| **19** | Implement work-order assignment and status transitions | **PASSED** | Not required |
| **20** | Implement room booking conflicts and alternative recommendations | **PASSED** | Not required |
| **21** | Implement authorised room relocation workflow | **PASSED** | **APPROVED by User** |
| **22** | Implement inventory ledger and transactional reservations | **PASSED** | Not required |
| **23** | Implement purchase requests and independent approvals | **PASSED** | **APPROVED by User** |
| **24** | Implement stock receipt and blocked-work resumption | **PASSED** | Not required |
| **25** | Implement SLA monitoring, notifications and audit logging | **PASSED** | Not required |
| **26** | Build minimal role-specific UI connected to real APIs | **PASSED** | **APPROVED by User** |
| **27** | Test the electrical-failure examination scenario | **PASSED** | **APPROVED by User** |
| **28** | Test the Wi-Fi outage and procurement scenario | **PASSED** | **APPROVED by User** |
| **29** | Run security, integration, regression and data-integrity tests | **PASSED** | Not required |
| **30** | Prepare demo accounts, documentation and final handoff | **PASSED** | Not required |

---

## Detailed Checkpoint Logs

### CHECKPOINT 01 — Inspect repository and workbook
- **Status:** **PASSED**
- **What was implemented:**
  - Inspected existing directory structure.
  - Located the authoritative source workbook: `CampusOps_Complete_Fictional_Database_Dataset.xlsx` (85,738 bytes).
  - Copied workbook to local workspace `data/source/CampusOps_Complete_Fictional_Database_Dataset.xlsx`.
  - Read `START_HERE` sheet containing operational constraints, demonstration scenarios, and domain guidance.
  - Verified Node.js (v24.21.0), npm (11.19.0), and Python 3.14.4 availability.
- **Files Created / Modified:**
  - `data/source/CampusOps_Complete_Fictional_Database_Dataset.xlsx`
  - Scratch inspection scripts in artifact directory.
- **Tests Executed:**
  - File existence and checksum test.
  - Python openpyxl workbook loader test.
- **Test Results:** 35 sheets detected (1 guidance + 34 data tables). All sheets parsed cleanly.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 02 — Document workbook tables, relationships and data-quality issues
- **Status:** **PASSED**
- **What was implemented:**
  - Analyzed all 34 tables for exact column headers, types, row counts, null counts, and candidate keys.
  - Tested foreign-key referential integrity across all 47 relational links.
  - Reconciled inventory movements against `quantity_on_hand` (100% exact match across all 10 items).
  - Verified uniqueness of candidate keys (e.g. `asset_tag`, `sku`, `user.login_id`, `user.email`, `room.code`, `building.code`).
  - Identified 4 composite primary key tables (`user_roles`, `technician_skills`, `room_requirements`, `incident_reports`).
  - Identified data-quality finding: `user_roles.assigned_by` has `'SYSTEM_SEED'` in row 30.
  - Identified circular dependency between `departments.manager_id` and `users.department_id`.
  - Identified polymorphic references in `incident_impacts` and `stock_movements`.
  - Authored comprehensive report in `docs/DATABASE_ANALYSIS.md`.
  - Authored future-readiness architecture document in `docs/FUTURE_COMPUTER_VISION.md`.
- **Files Created / Modified:**
  - [DATABASE_ANALYSIS.md](file:///c:/Users/acer/Downloads/CAMPUS%20OPS/docs/DATABASE_ANALYSIS.md)
  - [FUTURE_COMPUTER_VISION.md](file:///c:/Users/acer/Downloads/CAMPUS%20OPS/docs/FUTURE_COMPUTER_VISION.md)
  - [PROGRESS_CHECKLIST.md](file:///c:/Users/acer/Downloads/CAMPUS%20OPS/docs/PROGRESS_CHECKLIST.md)
- **Tests Executed:**
  - Scripted referential integrity verification across all 34 tables (`scratch/verify_fks.py`).
  - Inventory balance and reservation math verification (`scratch/check_inventory.py`).
  - JSON field parsing validation (`scratch/dump_schema.py`).
  - Composite key uniqueness validation across all association tables.
- **Test Results:**
  - 46 of 47 foreign key relationships are strictly valid; 1 special value `'SYSTEM_SEED'` cleanly handled.
  - All JSON payloads in `audit_logs`, `outbox_events`, `idempotency_keys` are syntactically valid JSON.
  - All 10 inventory items match ledger movement sum.
- **Issues Discovered:**
  1. `SYSTEM_SEED` attribution requires nullable/unconstrained `assigned_by` string.
  2. Circular dependency between `departments` and `users` requires two-pass insert.
- **User Approval Required:** Yes, for proposed schema and architecture decisions in Checkpoint 03.

---

### CHECKPOINT 03 — Present architecture and schema decisions for my approval
- **Status:** **PASSED**
- **What was implemented:**
  - Prepared architectural blueprint, monorepo layout, and proposed Prisma schema.
  - Formulated schema and auth decisions for user sign-off.
  - User explicitly approved the proposed architecture, circular dependency resolution, and custom demo password `password123`.
- **Files Created / Modified:**
  - `docs/DATABASE_ANALYSIS.md`
  - `docs/API_AND_UI_SPECIFICATION.md`
  - `docs/PROGRESS_CHECKLIST.md`
- **Tests Executed:** Interactive architectural sign-off.
- **Test Results:** Approved.
- **Issues Discovered:** None.
- **User Approval Required:** Completed.

---

### CHECKPOINT 04 — Initialise monorepo and development tooling
- **Status:** **PASSED**
- **What was implemented:**
  - Monorepo configured with npm workspaces: `server` and `client`.
  - Configured root `.gitignore`, `.env.example`, `.env` (with `DEMO_PASSWORD="password123"`).
  - Configured `server/package.json`, `tsconfig.json`, `vitest.config.ts`.
  - Configured `client/package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`.
  - Full dependency installation across all workspaces.
- **Files Created / Modified:**
  - `package.json`
  - `.gitignore`
  - `.env`
  - `.env.example`
  - `server/package.json`
  - `server/tsconfig.json`
  - `server/vitest.config.ts`
  - `client/package.json`
  - `client/tsconfig.json`
  - `client/vite.config.ts`
  - `client/tailwind.config.js`
  - `client/postcss.config.js`
- **Tests Executed:**
  - `npx prisma --version` CLI engine verification.
  - Dependency resolution and compilation tests.
- **Test Results:** Prisma 6.19.3, Node v24.21.0, TypeScript 5.9.3, all engines verified on Windows x64.
- **Issues Discovered:** 0-byte orphan files in parent Downloads folder detected and quarantined.
- **User Approval Required:** No.

---

### CHECKPOINT 05 — Configure Express, React and frontend/backend connectivity
- **Status:** **PASSED**
- **What was implemented:**
  - Express server implemented with CORS, JSON body parser, cookie-parser, and `/api/health` endpoint.
  - Supertest + Vitest automated integration test suite configured.
  - React + Vite client configured with proxy forwarding `/api` to Express on `http://localhost:4000`.
  - React `App.tsx` live connectivity card reflecting real backend status.
  - Background daemon dev server launched running both client and server concurrently.
- **Files Created / Modified:**
  - `server/src/index.ts`
  - `server/src/tests/health.test.ts`
  - `client/index.html`
  - `client/src/index.css`
  - `client/src/main.tsx`
  - `client/src/App.tsx`
- **Tests Executed:**
  - `npm run test --workspace=server` (Vitest integration test).
  - `npm run build --workspace=client` (Vite + TypeScript production build).
  - Live HTTP requests: `Invoke-RestMethod http://localhost:4000/api/health` and `http://localhost:5173/`.
- **Test Results:**
  - Server Vitest test passed in 74ms (`1 passed`).
  - Client production build succeeded in 2.08s.
  - Live `/api/health` responded HTTP 200 with `{ success: true, message: "CampusOps Core API is online" }`.
  - Live frontend responded HTTP 200 on port 5173.
- **Issues Discovered:** None.
- **User Approval Required:** No.

### CHECKPOINT 06 — Create complete Prisma schema
- **Status:** **PASSED**
- **What was implemented:**
  - Authored complete 34-model `prisma/schema.prisma` mapping all sheets in workbook.
  - Configured composite primary keys for `user_roles`, `technician_skills`, `room_requirements`, `incident_reports`.
  - Configured unique constraints on `roles.code`, `buildings.code`, `rooms.code`, `assets.asset_tag`, `users.login_id`, `users.email`, `incidents.reference`, `inventory_items.sku`, `sla_policies.priority`, `outbox_events.event_key`.
  - Configured circular relation resolution between `Department.manager` and `User.department`.
  - Successfully generated `@prisma/client` v6.19.3.
- **Files Created / Modified:**
  - `prisma/schema.prisma`
- **Tests Executed:**
  - `npx prisma validate --schema=prisma/schema.prisma`
  - `npx prisma generate --schema=prisma/schema.prisma`
- **Test Results:** Validation succeeded. Prisma client generated in 396ms.
- **Issues Discovered:** None.
- **User Approval Required:** Schema approved in Checkpoint 03.

---

### CHECKPOINT 07 — Run migrations and validate database integrity
- **Status:** **PASSED**
- **What was implemented:**
  - Applied initial database migration (`20261030093632_init_34_tables`).
  - Created SQLite database `prisma/dev.db`.
  - Validated SQLite table schema and referential foreign keys with `PRAGMA foreign_key_check`.
- **Files Created / Modified:**
  - `prisma/migrations/20261030093632_init_34_tables/migration.sql`
  - `prisma/dev.db`
- **Tests Executed:**
  - `npx prisma migrate dev`
  - Python SQLite table inspection (`scratch/check_sqlite_tables.py`).
- **Test Results:** All 34 tables created with exact column counts and 0 foreign key violations.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 08 — Build Excel importer and validation reports
- **Status:** **PASSED**
- **What was implemented:**
  - Built repeatable, idempotent `prisma/seed/seed.ts` script.
  - Implemented Level 0 to Level 7 acyclic DAG import sequence.
  - Implemented two-pass insertion for `departments` and `users` to resolve circular dependency.
  - Integrated `bcryptjs` hashing with salt rounds 12 for configurable demo password `password123`.
  - Implemented JSON audit report generator storing detailed results in `data/import-reports/`.
- **Files Created / Modified:**
  - `prisma/seed/seed.ts`
- **Tests Executed:**
  - Dry-run validation of `xlsx` workbook parsing.
- **Test Results:** Parser successfully loaded 35 sheets.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 09 — Import the dataset and verify record counts and relationships
- **Status:** **PASSED**
- **What was implemented:**
  - Executed full database seed (`npx tsx prisma/seed/seed.ts`).
  - Imported 1,042 records across all 34 tables with 0 discards and 0 rejected rows.
  - Verified demo password authentication (`campus001` with `password123`).
  - Re-verified SQLite `PRAGMA foreign_key_check`.
  - Saved audit report in `data/import-reports/import_report_1793353189043.json`.
- **Files Created / Modified:**
  - `prisma/dev.db`
  - `data/import-reports/import_report_1793353189043.json`
- **Tests Executed:**
  - Complete import execution test.
  - Bcrypt password verification test (`bcrypt.compare`).
  - SQLite foreign key integrity check.
- **Test Results:** 1,042 / 1,042 rows inserted (CLEAN). Authentication verified. Zero foreign key violations.
- **Issues Discovered:** None.
- **User Approval Required:** No.

### CHECKPOINT 10 — Implement bcrypt password hashing and secure sessions
- **Status:** **PASSED**
- **What was implemented:**
  - Integrated `bcryptjs` password verification (cost factor: 12) validating against the custom demo password `password123`.
  - Implemented cryptographic HMAC-SHA256 signed session tokens stored in secure, HTTP-only cookies (`campusops_session`).
  - Added session expiration and constant-time signature verification preventing timing attacks.
- **Files Created / Modified:**
  - `server/src/prisma.ts`
  - `server/src/modules/auth/auth.utils.ts`
  - `server/src/middleware/auth.middleware.ts`
- **Tests Executed:**
  - Automated integration tests in `server/src/tests/auth_rbac.test.ts`.
- **Test Results:** 7/7 automated tests passed.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 11 — Implement login, logout and active-role selection
- **Status:** **PASSED**
- **What was implemented:**
  - Created `/api/auth/login` endpoint with Zod validation, credential check, account status check, and requested-role verification.
  - Created `/api/auth/logout` endpoint that reliably purges the HTTP-only cookie.
  - Created `/api/auth/me` endpoint returning the user profile, authorized roles, and current active role context.
  - Created `/api/auth/active-role` allowing authenticated role switching only among authorized roles.
  - Created `/api/auth/demo-users` providing instant test identities for all 7 roles.
- **Files Created / Modified:**
  - `server/src/modules/auth/auth.routes.ts`
  - `server/src/index.ts`
- **Tests Executed:**
  - `supertest` login, logout, me, and active-role transition tests.
- **Test Results:** Verified successful login, cookie assignment, and session clearing.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 12 — Implement backend RBAC and test unauthorised access
- **Status:** **PASSED**
- **What was implemented:**
  - Implemented `requireRole(allowedRoles: string[])` middleware enforcing backend authorization.
  - Verifies that both the requested `activeRole` and user's database role records match the required permissions.
  - Rejects unauthorized actions with HTTP 403 Forbidden and explicit role mismatch explanation.
- **Files Created / Modified:**
  - `server/src/middleware/auth.middleware.ts`
  - `server/src/index.ts`
  - `server/src/tests/auth_rbac.test.ts`
- **Tests Executed:**
  - Negative RBAC test: Student accessing admin-only endpoint (`GET /api/test/admin-only`) -> HTTP 403 Forbidden.
  - Negative login test: Student requesting `SYSTEM_ADMIN` role -> HTTP 403 Forbidden.
  - Positive RBAC test: Student accessing student endpoint -> HTTP 200 OK.
  - Positive RBAC test: System Admin accessing admin endpoint -> HTTP 200 OK.
- **Test Results:** 100% RBAC permission enforcement verified in automated test suite.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 13 — Build campus directory and asset lookup APIs
- **Status:** **PASSED**
- **What was implemented:**
  - Implemented `/api/directory/departments`, `/api/directory/buildings`, `/api/directory/rooms`.
  - Implemented `/api/directory/assets` with filtering by building, room, and status.
  - Implemented `/api/directory/assets/lookup?qr=...` resolving QR codes to full asset details, room, and active incidents.
  - Implemented `/api/directory/users` with role-based filtering.
- **Files Created / Modified:**
  - `server/src/modules/directory/directory.routes.ts`
  - `server/src/tests/directory.test.ts`
- **Tests Executed:**
  - 8 automated tests in `directory.test.ts`.
- **Test Results:** 8/8 tests passed (departments, buildings, rooms, assets, QR tag lookup, negative checks).
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 14 — Build complaint submission and incident persistence
- **Status:** **PASSED**
- **What was implemented:**
  - Created `/api/intake/submit` route with Zod validation.
  - Implemented persistent `IntakeMessage` creation with deduplication hash.
  - Implemented auto-creation or linking of `Incident` records with `IncidentReport` tracking.
  - Implemented `/api/intake/my-complaints` for student/faculty complaint history.
- **Files Created / Modified:**
  - `server/src/modules/intake/intake.routes.ts`
  - `server/src/tests/intake_incidents.test.ts`
- **Tests Executed:**
  - Automated integration tests for intake submission and lookup.
- **Test Results:** 8/8 tests passed in `intake_incidents.test.ts`.
- **Issues Discovered:** None.
- **User Approval Required:** Form and triage model approved in Milestone D.

---

### CHECKPOINT 15 — Implement AI-assisted triage with offline fallback
- **Status:** **PASSED**
- **What was implemented:**
  - Built `triage.service.ts` with offline deterministic natural-language heuristic triage.
  - Extracts category (`ELECTRICAL`, `PLUMBING`, `HVAC`, `NETWORK`, `CIVIL`, `IT_EQUIPMENT`), priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), location cues, and safety flags.
  - Provides SLA deadline estimations matching `sla_policies`.
  - Fallback is 100% deterministic and offline-first; suggestions never bypass backend validation.
- **Files Created / Modified:**
  - `server/src/services/triage.service.ts`
- **Tests Executed:**
  - Heuristic triage categorization and priority verification tests in `intake_incidents.test.ts`.
- **Test Results:** 100% offline accuracy for electrical, network, plumbing scenarios.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 16 — Implement duplicate/related incident detection
- **Status:** **PASSED**
- **What was implemented:**
  - Built `incident_correlation.service.ts` detecting potential duplicates across same asset, same room within 24 hours, or high text similarity.
  - Prevents incident proliferation by linking multiple intake reports to an existing incident (`incident_reports`, `incident_links`).
  - Preserves original reporter complaints and records without silent discarding.
- **Files Created / Modified:**
  - `server/src/services/incident_correlation.service.ts`
- **Tests Executed:**
  - Same-room and same-asset duplicate correlation assertions in `intake_incidents.test.ts`.
- **Test Results:** Existing incident detected, linked, and status preserved.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 17 — Implement incident lifecycle and event history
- **Status:** **PASSED**
- **What was implemented:**
  - Implemented `/api/incidents` listing with search, category, status, priority, and date range filters.
  - Implemented `/api/incidents/:id` dossier endpoint with full relations (reports, links, work orders, room outages).
  - Implemented `/api/incidents/:id/status` state machine enforcing valid transitions (`REPORTED` -> `TRIAGED` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`).
- **Files Created / Modified:**
  - `server/src/modules/incidents/incidents.routes.ts`
- **Tests Executed:**
  - Lifecycle state machine tests and status filtering in `intake_incidents.test.ts`.
- **Test Results:** Verified valid status progression and invalid transition rejection (HTTP 400).
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 18 — Implement technician skills, shifts, leave and eligibility checks
- **Status:** **PASSED**
- **What was implemented:**
  - Built `technician_matcher.service.ts` finding technicians matching required skill level.
  - Verifies shift availability for target incident date/time.
  - Excludes technicians with approved leave (`staff_leave` with status `APPROVED`).
  - Scenario 1 Rule: Technician `USR032` (Selvam) on leave `LEV001` excluded; `USR031` (Manoj) matched and recommended.
- **Files Created / Modified:**
  - `server/src/services/technician_matcher.service.ts`
  - `server/src/tests/work_orders_rooms.test.ts`
- **Tests Executed:**
  - Scenario 1 leave exclusion test in `work_orders_rooms.test.ts`.
- **Test Results:** Selvam excluded due to approved leave; Manoj recommended (PASSED).
- **Issues Discovered:** None.
- **User Approval Required:** Verified.

---

### CHECKPOINT 19 — Implement work-order assignment and status transitions
- **Status:** **PASSED**
- **What was implemented:**
  - Implemented `/api/work-orders` creation and listing.
  - Implemented `/api/work-orders/:id/assign` enforcing technician eligibility checks.
  - Implemented `/api/work-orders/:id/transition` state machine: `START` -> `BLOCK` -> `RESUME` -> `COMPLETE`.
  - Enforced recording of `MaintenanceHistory` on completion and clearing of room outages.
- **Files Created / Modified:**
  - `server/src/modules/work_orders/work_orders.routes.ts`
  - `server/src/tests/work_orders_rooms.test.ts`
- **Tests Executed:**
  - Full lifecycle execution test in `work_orders_rooms.test.ts`.
- **Test Results:** 8/8 tests passed.
- **Issues Discovered:** Resolved test query ordering for maintenance history.
- **User Approval Required:** No.

---

### CHECKPOINT 20 — Implement room booking conflicts and alternative recommendations
- **Status:** **PASSED**
- **What was implemented:**
  - Built `room_coordinator.service.ts` detecting timetable conflicts when a room outage is declared.
  - Implemented `/api/rooms/conflicts` querying impacted room bookings (detects CSAI Semester Examination `BKG-EXAM`).
  - Implemented `/api/rooms/alternatives` finding available classrooms matching or exceeding capacity (80 seats) and required equipment (`PROJECTOR`, `ACCESSIBLE`).
  - Recommends `RM-B-206` as the optimal relocation candidate.
- **Files Created / Modified:**
  - `server/src/services/room_coordinator.service.ts`
  - `server/src/modules/rooms/rooms.routes.ts`
- **Tests Executed:**
  - Impacted exam detection and alternative room recommendation tests in `work_orders_rooms.test.ts`.
- **Test Results:** Alternative room `RM-B-206` correctly identified and ranked.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 21 — Implement authorised room relocation workflow
- **Status:** **PASSED**
- **What was implemented:**
  - Implemented `/api/rooms/relocate` endpoint.
  - RBAC verification: Only `DEPARTMENT_MANAGER` or `FACILITIES_ADMIN` can authorize relocations (Students/Technicians rejected with 403).
  - Updates `RoomBooking` record to new room (`RM-B-206`).
  - Dispatches faculty notification alert to `USR017` (Dr. Kavitha Menon).
  - Writes audit log record tracking actor, previous room, new room, and justification.
- **Files Created / Modified:**
  - `server/src/modules/rooms/rooms.routes.ts`
  - `server/src/tests/work_orders_rooms.test.ts`
- **Tests Executed:**
  - RBAC authorization check and relocation execution test in `work_orders_rooms.test.ts`.
- **Test Results:** Relocation succeeded, booking updated, notification created, audit log stored.
- **Issues Discovered:** None.
- **User Approval Required:** Verified.

---

### CHECKPOINT 22 — Implement inventory ledger and transactional reservations
- **Status:** **PASSED**
- **What was implemented:**
  - Built `inventory.service.ts` computing real-time `availableQuantity = quantityOnHand - sum(active reservations)` and `isLowStock = quantityOnHand <= reorderLevel`.
  - Implemented `/api/inventory` and `/api/inventory/:id` ledger endpoints.
  - Implemented `/api/inventory/reserve` with database transaction preventing over-reservation and negative stock.
  - Implemented `/api/inventory/reservations/:id/consume` decrementing physical stock and creating a negative `StockMovement`.
  - Implemented `/api/inventory/reservations/:id/release` restoring reserved availability.
  - Implemented `/api/inventory/movements` audit ledger.
- **Files Created / Modified:**
  - `server/src/services/inventory.service.ts`
  - `server/src/modules/inventory/inventory.routes.ts`
  - `server/src/tests/inventory_procurement.test.ts`
- **Tests Executed:**
  - Automated integration tests for ledger calculation, over-reservation rejection, reservation, and consumption.
- **Test Results:** 8/8 tests passed in `inventory_procurement.test.ts`.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 23 — Implement purchase requests and independent approvals
- **Status:** **PASSED**
- **What was implemented:**
  - Implemented `/api/procurement/requests` creation with item lines, estimated total computation, and audit logging.
  - Automatically transitions associated work orders to `BLOCKED` with explicit blocked reason.
  - Implemented `/api/procurement/requests/:id/decide` enforcing **Separation of Requester and Approver** (Anti-Self-Approval Rule: requesters rejected with HTTP 403).
  - RBAC check: Only `PROCUREMENT_MANAGER` (`campus030`), `FACILITIES_ADMIN`, or `SYSTEM_ADMIN` can decide.
  - Critical Backend Invariant: Purchase approval updates status to `APPROVED` but does NOT increment physical stock on hand.
- **Files Created / Modified:**
  - `server/src/modules/procurement/procurement.routes.ts`
  - `server/src/tests/inventory_procurement.test.ts`
- **Tests Executed:**
  - Purchase request creation, self-approval rejection (403), and independent manager approval tests.
- **Test Results:** Verified zero self-approval and stock unchanged on approval.
- **Issues Discovered:** None.
- **User Approval Required:** Verified.

---

### CHECKPOINT 24 — Implement stock receipt and blocked-work resumption
- **Status:** **PASSED**
- **What was implemented:**
  - Implemented `/api/procurement/receipts` recording physical delivery of goods (`condition: 'ACCEPTED'`).
  - Increments physical `quantityOnHand` in database transaction.
  - Records positive `StockMovement` ledger entry (`PURCHASE_RECEIPT`).
  - Automatically marks Purchase Request as `RECEIVED`.
  - **Scenario 2 Resumption Flow:** When parts arrive for a `BLOCKED` work order, the system automatically creates a `StockReservation`, clears `blockedReason`, transitions work order to `IN_PROGRESS`, records `WorkOrderEvent` (`RESUMED`), and dispatches notification to the assigned technician.
- **Files Created / Modified:**
  - `server/src/modules/procurement/procurement.routes.ts`
  - `server/src/tests/inventory_procurement.test.ts`
- **Tests Executed:**
  - Physical stock receipt, ledger increment, and automatic blocked work resumption tests.
- **Test Results:** Stock incremented, PR marked RECEIVED, blocked work order unblocked and resumed (PASSED).
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 25 — Implement SLA monitoring, notifications and audit logging
- **Status:** **PASSED**
- **What was implemented:**
  - Built `sla.service.ts` evaluating incident response and resolution deadlines against `sla_policies`.
  - Computes `isResponseBreached`, `isResolutionBreached`, `isAtRisk` (<25% time remaining), and overall campus `complianceRatePercent`.
  - Implemented `/api/sla/metrics` and `/api/sla/policies`.
  - Implemented `/api/sla/user/all` listing personal in-app notifications with unread badge count.
  - Implemented `/api/sla/user/:id/read` and `/api/sla/user/read-all`.
  - Implemented `/api/sla/outbox` and `/api/sla/outbox/process` for simulated outbound dispatches.
  - Implemented `/api/admin/overview` operational metrics, `/api/admin/audit-logs` query engine, and `/api/admin/system-health` diagnostics.
- **Files Created / Modified:**
  - `server/src/services/sla.service.ts`
  - `server/src/modules/sla_notifications/sla_notifications.routes.ts`
  - `server/src/modules/admin/admin.routes.ts`
  - `server/src/index.ts`
  - `server/src/tests/sla_audit.test.ts`
- **Tests Executed:**
  - 10 automated tests in `sla_audit.test.ts`.
- **Test Results:** 10/10 tests passed (SLA metrics, read/unread status, outbox simulation, RBAC protection, health check).
- **Issues Discovered:** None.
- **User Approval Required:** No.

### CHECKPOINT 26 — Build minimal role-specific UI connected to real APIs
- **Status:** **PASSED**
- **What was implemented:**
  - Built responsive dark-theme minimal UI using Tailwind CSS, React 18, and Vite.
  - Implemented `AuthContext.tsx` with reactive authentication state, active role switcher, and session restoration.
  - Implemented `Navbar.tsx` featuring brand identity, 7-persona 1-click quick switcher, in-app notification dropdown, and logout.
  - Implemented `LoginPage.tsx` with credentials form and 1-click quick-fill buttons for all 7 demo accounts.
  - Built 7 role-specific testing views:
    1. `StudentView.tsx`: Complaint submission form with cascading building/room selectors, QR asset lookup, live AI triage preview, and 1-click Scenario 1 & 2 prefill buttons.
    2. `FacultyView.tsx`: Classroom timetable, emergency outage advisories, relocation alerts, and fast issue reporting.
    3. `TechnicianView.tsx`: Assigned work orders, START / BLOCK / RESUME / COMPLETE lifecycle transition modal, parts reservation, and Purchase Request creation dialog.
    4. `ProcurementView.tsx`: Pending purchase requests queue, independent approval/rejection buttons with anti-self-approval enforcement, physical stock receipt modal with automatic blocked work resumption, and live inventory ledger.
    5. `FacilitiesAdminView.tsx`: Incident triage queue, technician assignment modal with leave indicator (excluding Selvam, recommending Manoj), and outage tracking.
    6. `DepartmentManagerView.tsx`: Department overview, emergency exam relocation modal recommending `RM-B-206` with 1-click authorization and faculty notification.
    7. `SystemAdminView.tsx`: Executive operational KPI cards, local-first engine health diagnostics (SQLite file size, table counts), and immutable audit log viewer.
  - Production build compiled cleanly with zero TypeScript errors (`dist/assets/index-DGN_Lvjl.js` 231.59 kB).
- **Files Created / Modified:**
  - `client/src/context/AuthContext.tsx`
  - `client/src/components/Navbar.tsx`
  - `client/src/pages/LoginPage.tsx`
  - `client/src/pages/StudentView.tsx`
  - `client/src/pages/FacultyView.tsx`
  - `client/src/pages/TechnicianView.tsx`
  - `client/src/pages/ProcurementView.tsx`
  - `client/src/pages/FacilitiesAdminView.tsx`
  - `client/src/pages/DepartmentManagerView.tsx`
  - `client/src/pages/SystemAdminView.tsx`
  - `client/src/App.tsx`
- **Tests Executed:**
  - `npm run build --workspace=client` (Vite production bundle compilation).
- **Test Results:** 1,599 modules transformed, 0 TypeScript errors, bundle size 231.59 kB.
- **Issues Discovered:** Cleaned up unused local icons and declarations.
- **User Approval Required:** Verified.

---

### CHECKPOINT 27 — Test the electrical-failure examination scenario
- **Status:** **PASSED**
- **What was implemented:**
  - Executed end-to-end integration test suite `scenario_1_exam_outage.test.ts` verifying all 6 workflow steps:
    1. Student reports electrical hazard in `RM-B-204` with QR lookup (`AST-EL-B-204`), verified `CRITICAL` priority and `ELECTRICAL` category triage.
    2. System detects exam timetable conflict in disrupted room `RM-B-204` (`BKG-EXAM` CSAI Semester Examination).
    3. Recommends alternative examination halls matching capacity (80 seats, `SEMINAR`), ranking `RM-B-206` as the #1 candidate with score 265 (+50 same building, +60 same floor, +50 seminar type, +30 exam buffer).
    4. Department Manager (`campus024`) authorizes relocation to `RM-B-206`; faculty Dr. Kavitha Menon (`campus017`) receives immediate notification.
    5. Facilities Admin (`campus028`) attempts assigning Selvam (`USR032`), correctly rejected with HTTP 400 (`TECHNICIAN_NOT_ELIGIBLE` due to approved leave `LEV001`); Manoj (`USR031`) assigned successfully.
    6. Technician (`campus031`) starts work (`IN_PROGRESS`), reserves replacement 16A socket (`ITM001`), consumes reservation, and completes repair (`COMPLETED`), resolving incident and recording maintenance history.
- **Files Created / Modified:**
  - `server/src/tests/scenario_1_exam_outage.test.ts`
  - `server/src/services/room_coordinator.service.ts`
- **Tests Executed:**
  - 6/6 tests in `scenario_1_exam_outage.test.ts`.
- **Test Results:** 6/6 tests passed (100% pass rate).
- **Issues Discovered:** None.
- **User Approval Required:** Verified.

---

### CHECKPOINT 28 — Test the Wi-Fi outage and procurement scenario
- **Status:** **PASSED**
- **What was implemented:**
  - Executed end-to-end integration test suite `scenario_2_procurement_shortage.test.ts` verifying all 7 workflow steps:
    1. Student reports shared Wi-Fi outage in `RM-C-201` (`AST-NW-C-201`), triage detects `NETWORK` category and `HIGH` priority.
    2. Facilities Admin (`campus028`) assigns networking technician Anandha Kumar (`USR033`).
    3. Technician starts work, identifies burned out transceiver, and submits Purchase Request for 2 Wi-Fi transceivers (`ITM002`); work order automatically transitioned to `BLOCKED` with reason.
    4. Anti-Self-Approval Rule strictly prevents technician from approving own request (HTTP 403 `SELF_APPROVAL_FORBIDDEN`).
    5. Independent Procurement Manager (`campus030` - Mr Dinesh I) approves request; physical stock on hand remains unchanged at 2.
    6. Physical stock received (`quantityReceived: 2`), ledger incremented to 4, stock movement logged, part automatically reserved, work order unblocked and resumed (`IN_PROGRESS`).
    7. Technician completes repair, incident resolved, maintenance history recorded.
- **Files Created / Modified:**
  - `server/src/tests/scenario_2_procurement_shortage.test.ts`
  - `server/src/services/triage.service.ts`
  - `server/src/services/inventory.service.ts`
- **Tests Executed:**
  - 7/7 tests in `scenario_2_procurement_shortage.test.ts`.
- **Test Results:** 7/7 tests passed (100% pass rate).
- **Issues Discovered:** None.
- **User Approval Required:** Verified.

---

### CHECKPOINT 29 — Run security, integration, regression and data-integrity tests
- **Status:** **PASSED**
- **What was implemented:**
  - Executed complete backend regression test suite across all 9 test suites:
    - `health.test.ts` (1 test)
    - `directory.test.ts` (8 tests)
    - `auth_rbac.test.ts` (7 tests)
    - `intake_incidents.test.ts` (8 tests)
    - `work_orders_rooms.test.ts` (8 tests)
    - `inventory_procurement.test.ts` (8 tests)
    - `sla_audit.test.ts` (10 tests)
    - `scenario_1_exam_outage.test.ts` (6 tests)
    - `scenario_2_procurement_shortage.test.ts` (7 tests)
  - Executed Prisma schema validation: `npx prisma validate --schema=prisma/schema.prisma` -> Valid schema.
  - Executed database referential integrity check: `PRAGMA foreign_key_check;` -> 0 violations.
  - Executed client production build: `npm run build --workspace=client` -> Clean build in 5.66s.
- **Files Created / Modified:**
  - `server/scripts/fk_check.js`
- **Tests Executed:**
  - 63 automated tests across 9 test suites.
  - `npx prisma validate`
  - `node server/scripts/fk_check.js`
  - `npm run build --workspace=client`
- **Test Results:** 63/63 tests passed (0 failures). Schema valid. 0 foreign key violations. Client build clean.
- **Issues Discovered:** None.
- **User Approval Required:** No.

---

### CHECKPOINT 30 — Prepare demo accounts, documentation and final handoff
- **Status:** **PASSED**
- **What was implemented:**
  - Verified and documented all 7 demo accounts with roles, names, and credentials.
  - Configured demo password `password123` across all seeded users with bcrypt hashing (cost factor 12).
  - Prepared step-by-step verification instructions for Scenario 1 and Scenario 2.
  - Updated `README.md` and `docs/PROGRESS_CHECKLIST.md` with complete architecture guide and operational runbook.
  - Verified local dev server operating continuously on `http://localhost:5173` (Frontend) and `http://localhost:4000` (Backend).
- **Files Created / Modified:**
  - `README.md`
  - `docs/PROGRESS_CHECKLIST.md`
- **Tests Executed:**
  - Live server verification and login endpoint checks across all 7 personas.
- **Test Results:** All 7 accounts authenticated successfully; all backend routes operational.
- **Issues Discovered:** None.
- **User Approval Required:** Final review.

