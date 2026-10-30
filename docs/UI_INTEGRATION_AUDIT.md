# CampusOps — Stitch UI Integration Audit & Architectural Blueprint

**Project:** CampusOps — Intelligent Campus Operations Platform  
**Team:** LOWKEY CODERS | Problem Statement 2 | Overclock'26 Hackathon  
**Audit Date:** October 30, 2026  
**Status:** Baseline Audited & Integration Plan Prepared (Awaiting User Approval)  

---

## 1. Executive Summary

The purpose of this audit is to systematically map nine Google Stitch designs into the working, fully-tested CampusOps full-stack application without breaking any existing backend API contracts, database integrity, role-based security rules, or workflow business logic.

The backend is 100% operational:
- **Database:** SQLite (`prisma/dev.db`) seeded with 1,042 records across 34 tables with zero foreign-key errors.
- **REST APIs:** Express + TypeScript engine running on `http://localhost:4000/` with HMAC-SHA256 cookie sessions and Zod validation.
- **Test Suite:** 63 / 63 tests passing across 9 suites in Vitest.
- **Active Dev Server:** Daemon server running on port 4000 (Backend) and port 5173 (Frontend).

The mission is strictly **presentation integration**: replacing the minimal placeholder UI with the High-Contrast Kinetic Editorial design system while binding every button, table, metric, and form directly to live backend endpoints.

---

## 2. Existing Frontend Inventory & Route Map

### Application Structure (`client/src/`)
- **React Version:** React 18.3.1 with Vite 6.1.1, TypeScript 5.7.3, Tailwind CSS 3.4.17, Lucide Icons 0.475.0, React Router DOM 6.29.0.
- **Current Presentation:** Minimal functional UI with centralized `Navbar.tsx` (brand identity, 7-role switcher, notification tray, logout) and `App.tsx` conditionally rendering role portals based on `activeRole`.

### Current Frontend Routes / Views
| Role Code | Workbook Role Name | Current Component | Primary Functional Capabilities |
|---|---|---|---|
| *Public / Guest* | — | `LoginPage.tsx` | Credentials login, 1-click quick-fill buttons for all 7 demo accounts, error feedback |
| `STUDENT` | Student | `StudentView.tsx` | Complaint form, cascading building/room selectors, QR code lookup (`AST-EL-B-204`), offline AI triage preview, scenario pre-fill buttons, personal complaints history |
| `FACULTY` | Faculty | `FacultyView.tsx` | Classroom schedule/timetable, emergency outage advisories, room relocation alerts, rapid room issue reporting |
| `TECHNICIAN` | Technician | `TechnicianView.tsx` | Assigned work orders queue, START / BLOCK / RESUME / COMPLETE lifecycle transition dialogs, spare parts reservation, PR creation modal |
| `PROCUREMENT_MANAGER` | Procurement Manager | `ProcurementView.tsx` | Pending purchase requests queue, independent approval/rejection (anti-self-approval enforced), physical goods receipt modal with auto work order resumption, live inventory ledger |
| `FACILITIES_ADMIN` | Facilities Administrator | `FacilitiesAdminView.tsx` | Incident triage queue, technician assignment modal with leave verification (excludes Selvam, recommends Manoj), outage tracking |
| `DEPARTMENT_MANAGER` | Department Manager | `DepartmentManagerView.tsx` | Department incident overview, emergency exam relocation modal recommending `RM-B-206` with 1-click authorization and faculty notification |
| `SYSTEM_ADMIN` | System Administrator | `SystemAdminView.tsx` | Executive operational KPI cards, local-first engine health diagnostics (SQLite file size, table counts), immutable audit log viewer |

---

## 3. Existing Backend API Dependencies

All existing endpoints must remain untouched and directly wired into the Stitch interfaces:

### Authentication & Sessions (`/api/auth`)
- `POST /api/auth/login` — Verifies credentials, checks account status, returns session cookie and user profile.
- `POST /api/auth/logout` — Destroys session and clears cookie.
- `GET /api/auth/me` — Returns current authenticated user and active role.
- `POST /api/auth/active-role` — Switches active role if authorized in `user_roles`.
- `GET /api/auth/demo-users` — Returns demo user accounts for testing.

### Campus Directory & Assets (`/api/directory`)
- `GET /api/directory/departments` — List departments.
- `GET /api/directory/buildings` — List campus buildings.
- `GET /api/directory/rooms?buildingId=` — Cascading room lookup.
- `GET /api/directory/assets?roomId=` — Room equipment list.
- `GET /api/directory/assets/lookup?qr=` — QR asset scanning & verification.

### Complaint Intake & Triage (`/api/intake`)
- `POST /api/intake/preview` — Real-time offline AI triage preview without persisting.
- `POST /api/intake` & `POST /api/intake/submit` — Submits complaint, runs triage, creates or links incident, logs audit & outbox.
- `GET /api/intake/my-complaints` — Historical complaints reported by the logged-in user.

### Incidents (`/api/incidents`)
- `GET /api/incidents` — Lists incidents with status, priority, building, room, and category filters.
- `GET /api/incidents/:id` — Full incident dossier (reports, work orders, impacts, timeline).
- `PATCH /api/incidents/:id/priority` — Priority escalation.

### Work Orders & Technician Matching (`/api/work-orders`)
- `GET /api/work-orders` — Work orders filtered by status or `assignedTo`.
- `POST /api/work-orders` — Creates new work order for an incident.
- `GET /api/work-orders/:id/eligible-technicians` — Technician eligibility engine evaluating skills, shift schedules, and approved leave exclusion.
- `POST /api/work-orders/:id/assign` — Assigns technician to work order.
- `POST /api/work-orders/:id/transition` — Enforces lifecycle transitions (`START`, `BLOCK`, `RESUME`, `COMPLETE`).

### Rooms & Coordination (`/api/rooms`)
- `GET /api/rooms/bookings` — Room bookings list.
- `GET /api/rooms/conflicts?roomId=&targetDate=` — Detects timetable schedule conflicts.
- `GET /api/rooms/alternatives?bookingId=` — Scores candidate rooms by capacity, equipment, floor, and building proximity.
- `POST /api/rooms/relocate` — Authorizes relocation and dispatches in-app faculty notification.
- `GET /api/rooms/outages` — Lists active room outages.

### Inventory & Procurement (`/api/inventory` & `/api/procurement`)
- `GET /api/inventory` — Live inventory ledger with computed availability and low-stock flags.
- `GET /api/inventory/:id` — Item availability, active reservations, and movement history.
- `POST /api/inventory/reserve` — Transactionally reserves stock for a work order.
- `POST /api/inventory/reservations/:id/consume` — Decrements on-hand stock and records movement.
- `GET /api/procurement/requests` — Purchase requests queue.
- `POST /api/procurement/requests` — Creates purchase request (blocks work order).
- `POST /api/procurement/requests/:id/decide` — Independent approval/rejection (anti-self-approval rule enforced).
- `POST /api/procurement/receipts` — Physical goods receipt; increments stock and automatically resumes blocked work orders.

### SLA, Notifications & Administration (`/api/sla` & `/api/admin`)
- `GET /api/sla/metrics` — Response and resolution breach percentages.
- `GET /api/sla/user/all` — Personal in-app notification center.
- `PATCH /api/sla/user/:id/read` & `PATCH /api/sla/user/read-all` — Read receipt updates.
- `GET /api/admin/overview` — Operational executive metrics.
- `GET /api/admin/audit-logs` — Immutable audit trail with before/after state diffs.
- `GET /api/admin/system-health` — SQLite file size, active connection, and table row counts.

---

## 4. Stitch Screen Inventory & Mapping

| Design Folder Name | Target Role / Route | Stitch Source Files | Key Presentation Elements |
|---|---|---|---|
| `campusops_avant_garde_architectural_broadsheet_variant_crisp_clarity` | **Public Landing Page** (`/` or `/landing`) | `code.html`, `screen.png` | Architectural broadsheet, monumental typography, kinetic crosshair grid, operational telemetry, feature breakdown, CTA to Sign In |
| `campusops_dispatch_console_login_page` | **Authentication Gateway** (`/login`) | `code.html`, `screen.png` | 50/50 split layout: dark telemetry image panel left, warm cream brutalist panel right, 7-role selector, credentials form, 1-click demo accounts, error feedback |
| `campusops_student_dashboard_simplified` | **Student Portal** (`STUDENT`) | `code.html`, `screen.png` | Left navigation sidebar, command topbar, warm cream hero banner, 3 bento metric cards, recent reports table, campus notices bulletin feed, quick report CTA |
| `campusops_faculty_dashboard_simplified` | **Faculty Portal** (`FACULTY`) | `code.html`, `screen.png` | Sticky topbar with telemetry, faculty identity sidebar, warm cream hero container, timetable booking schedule, emergency outage advisories, relocation warnings |
| `campusops_technician_dashboard_simplified` | **Technician Portal** (`TECHNICIAN`) | `code.html`, `screen.png` | Field operations sidebar, shift status, sync engine indicator, 3 KPI cards, assigned work order queue, lifecycle transition controls (START/BLOCK/RESUME/COMPLETE), parts drawer |
| `campusops_procurement_manager_dashboard_simplified` | **Procurement Portal** (`PROCUREMENT_MANAGER`) | `code.html`, `screen.png` | Procurement sidebar, budget pacing card, stock shortage alert bento, pending purchase requests queue, independent approval actions, stock receipt dialog |
| `campusops_system_administrator_dashboard_simplified` | **System Admin Portal** (`SYSTEM_ADMIN`) | `code.html`, `screen.png` | Executive operations topbar, system health gauges (99.98% nominal), database node diagnostics, immutable audit stream, security rule violations |
| `campusops_facilities_administrator_dashboard_simplified` | **Facilities Admin Portal** (`FACILITIES_ADMIN`) | `code.html`, `screen.png` | Triage queue table, priority incident matrix, technician readiness bento (on-site vs standby buffer), dispatch modal with leave verification |
| `campusops_department_manager_dashboard_simplified` | **Department Manager Portal** (`DEPARTMENT_MANAGER`) | `code.html`, `screen.png` | Department incident overview, exam disruption alerts, emergency room relocation bento (`RM-B-206`), 1-click relocation authorization |

---

## 5. Design System Tokens (`DESIGN.md` Reference)

The design system follows the **High-Contrast Kinetic Editorial** design movement:

### Strict Color Hierarchy
- **Canvas / Void:** Pitch Black `#0A0A0A` (65%) and Obsidian `#131313`
- **Structural Planes & Editorial Cards:** Warm Cream `#F2EFE9` (25%)
- **Energy Vectors & Primary Actions:** Hyper Lime `#C5F135` (10%)
- **Recessed Containers & Borders:** Structural Charcoal `#141414`, `#1C1C1C`, `#201F1F`, `#2A2A2A`
- **Primary Typography:** Off-White Cream `#F2EFE9` on dark; Pitch Black `#0A0A0A` on cream
- **Secondary Typography & Muted Text:** Pale Olive `#C4C9AE` and Olive-Muted `#8E937B`
- **Outlines:** `#444934` (dark muted) and `#0A0A0A` (bold brutalist 2px outlines on cream)

### Typography Tokens
- **Monumental Headings:** `Oswald` (uppercase, bold tracking, tight 1:1 line height)
- **Body & Controls:** `Inter` (readable sentence case, relaxed line height)
- **Technical Codes & Telemetry:** `JetBrains Mono` / monospace uppercase

---

## 6. Shared Reusable React Component Architecture

To prevent code duplication across the seven roles, common patterns are extracted into reusable components in `client/src/components/common/`:

1. `CampusOpsLogo.tsx`: Unified brand mark (`CO` badge + `CAMPUSOPS` wordmark + role pill + `OPERATIONS ENGINE`).
2. `AppSidebar.tsx`: Configurable navigation sidebar with dynamic user profile card, role-specific nav items, unread counters, and operational node status.
3. `AppTopbar.tsx`: Sticky telemetry header with live status dot, search input (⌘K), in-app notification bell with badge, and active user profile pill.
4. `HeroBanner.tsx`: Warm cream neo-brutalist hero frame with uppercase Oswald headline, subtitle, and primary action button.
5. `MetricCard.tsx`: Bento metric card supporting solid cream or lime surfaces, large Oswald number, status pill, and progress bar.
6. `StatusBadge.tsx`: Reusable status pill with strict color mapping (`ACTIVE`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
7. `ActionModal.tsx`: Accessible dialog wrapper in High-Contrast Kinetic Editorial style for operational actions (e.g., Relocation, Technician Assignment, Lifecycle Transition, Stock Receipt).

---

## 7. Integration Risks & Mitigation Strategy

| Risk | Description | Mitigation Strategy |
|---|---|---|
| **1. Mock Data Leakage** | Stitch templates include hardcoded placeholder names (e.g. *Alex Chen*, *Dr. Vance*, *Marcus Vance*) and sample rows. | Replace every placeholder string with live values from `useAuth().user` and data fetched from existing backend endpoints. |
| **2. Loss of Interactive Modals** | Stitch files are static HTML/CSS and lack full operational forms (e.g. QR scanner verification, relocation confirmation, stock receipt submission). | Preserve all existing interactive dialogs and forms from the working baseline, styling their containers to match the Stitch neo-brutalist aesthetic. |
| **3. Breaking Test Scenarios** | Altering route paths or button behaviors could disrupt end-to-end hackathon scenarios (Scenario 1 & 2). | Retain exact form submission payloads, route targets, and backend invariants. Validate continuously with `npm run test --workspace=server`. |
| **4. Font FOUC / Missing Fonts** | Oswald and JetBrains Mono are not yet imported in `index.html`. | Add Google Fonts preconnect and stylesheets for Oswald, Inter, and JetBrains Mono in `client/index.html`. |
| **5. Mobile Responsiveness** | Large fixed 72px sidebars in Stitch can cause horizontal overflow on mobile screens (<768px). | Implement responsive sidebar drawer toggle for mobile viewports, matching the 4-column mobile specifications in `DESIGN.md`. |

---

## 8. Proposed Implementation Sequence (Checkpoints 01 – 22)

1. **Phase 1: Baseline Audit & Planning (CP 01 – 05)** — Current step.
2. **Phase 2: Foundation & Shared Components (CP 06 – 08)** — Backup baseline, configure Tailwind fonts and colors, build shared layout components.
3. **Phase 3: Public & Auth Experience (CP 09 – 11)** — Integrate Landing page and Dispatch Console Login page.
4. **Phase 4: Operational Dashboards (CP 12 – 18)** — Incrementally integrate Student, Faculty, Technician, Procurement, Admin, Facilities, and Department Manager portals.
5. **Phase 5: Verification & Handoff (CP 19 – 22)** — Full regression testing, responsive checks, scenario verification, and documentation.
