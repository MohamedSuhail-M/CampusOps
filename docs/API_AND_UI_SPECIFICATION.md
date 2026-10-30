# CampusOps — Minimal UI Mockups & REST API Specification

**Project:** CampusOps — Intelligent Campus Operations Platform  
**Team:** LOWKEY CODERS | Problem Statement 2 | Overclock'26 Hackathon  
**Visual Theme:** CampusOps Minimalist Industrial Dark Mode  
- **Obsidian Background:** `#0A0A0A`
- **Charcoal Surface / Card Panels:** `#161616` / `#222222`
- **Cream Typography:** `#F2EFE9`
- **Hyper Lime Accents & Badges:** `#C5F135`
- **Subdued Slate Borders:** `#2A2A2A`
- **Critical / Danger Coral:** `#FF5555`

---

## 1. REST API Endpoint Architecture

All endpoints use consistent response envelopes:
- Success: `{ "success": true, "data": { ... }, "meta"?: { ... } }`
- Error: `{ "success": false, "error": { "code": "STRING_CODE", "message": "Human readable explanation", "details"?: [ ... ] } }`

### Module A — Campus Directory & Assets
- `GET /api/directory/departments` — List all departments with manager details
- `GET /api/directory/buildings` — List campus buildings
- `GET /api/directory/rooms?buildingId=:id` — List rooms by building with capacity and type
- `GET /api/directory/assets?roomId=:id` — List assets in a room
- `GET /api/directory/assets/lookup?qr=:tag` — Immediate lookup by QR code / asset tag (e.g. `AST-001`)

### Module B & C — Complaint Intake & AI-Assisted Triage
- `POST /api/intake` — Submit complaint (body: `{ channel, originalText, buildingId?, roomId?, assetTag? }`)
- `POST /api/intake/triage-preview` — Real-time AI / offline deterministic triage preview (extracts category, priority, affected room/asset, similar incidents)
- `GET /api/intake/my-complaints` — Retrieve authenticated user's submitted complaints
- `GET /api/intake/:id` — Detail view of an intake message and linked incident

### Module D — Incident Management
- `GET /api/incidents?status=:status&priority=:priority` — Filterable incidents queue
- `GET /api/incidents/:id` — Full incident dossier (reports, work orders, impacts, links, SLA status)
- `PATCH /api/incidents/:id/status` — State transition (`NEW` -> `TRIAGED` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`)
- `POST /api/incidents/:id/link` — Link duplicate or related incidents with confidence score

### Module E — Technician & Work Orders
- `GET /api/work-orders?assignedTo=:userId&status=:status` — List work orders
- `GET /api/work-orders/:id` — Work order detail with required skills, parts reservations, event timeline
- `GET /api/technicians/eligible?workOrderId=:id` — Match eligible technicians checking:
  1. Skill match (`technician_skills`)
  2. Active shift today (`staff_shifts`)
  3. No overlapping approved leave (`staff_leave` where status = `APPROVED`)
  4. Current active workload
- `POST /api/work-orders/:id/assign` — Assign work order to qualified technician
- `POST /api/work-orders/:id/transition` — Validated state transition:
  - `START`: `ASSIGNED` -> `IN_PROGRESS`
  - `BLOCK`: `IN_PROGRESS` -> `BLOCKED` (requires `blockedReason`, e.g. awaiting spare parts)
  - `RESUME`: `BLOCKED` -> `IN_PROGRESS` (validates stock availability)
  - `COMPLETE`: `IN_PROGRESS` -> `COMPLETED` (records maintenance history)

### Module F — Room & Timetable Coordination
- `GET /api/rooms/bookings?date=YYYY-MM-DD&roomId=:id` — Query room bookings
- `GET /api/rooms/conflicts?incidentId=:id` — Detect affected upcoming bookings (e.g. `BKG-EXAM`)
- `GET /api/rooms/alternatives?bookingId=:id` — Recommend candidate rooms matching capacity, equipment, and zero timetable conflict
- `POST /api/rooms/relocate` — Authorised relocation confirmation (records before/after in audit logs and updates booking)

### Module G & H — Inventory & Procurement
- `GET /api/inventory` — List inventory with `quantity_on_hand`, `reserved`, `available`, `reorder_level`
- `POST /api/inventory/reserve` — Transactionally hold stock for work order (`ACTIVE` reservation)
- `POST /api/procurement/requests` — Create purchase request (validates separation of roles)
- `GET /api/procurement/requests` — Pending purchase requests queue
- `POST /api/procurement/requests/:id/decide` — Independent approval or rejection:
  - **Enforces:** `approver_id != requester_id`
  - **Enforces:** Approval changes status to `APPROVED`, does NOT increase physical stock
- `POST /api/procurement/receipts` — Physical stock receipt:
  - Increments `quantity_on_hand`
  - Records `stock_movement` with `reason = 'PURCHASE_RECEIPT'`
  - Unblocks waiting work orders if parts are satisfied

### Module I & J — SLA, Audit & Auth
- `POST /api/auth/login` — Authenticate credentials, set secure HTTP-only cookie
- `POST /api/auth/logout` — Clear session
- `GET /api/auth/me` — Return session user and authorized roles list
- `POST /api/auth/active-role` — Switch active role context
- `GET /api/notifications` — In-app notifications
- `PATCH /api/notifications/:id/read` — Mark notification read
- `GET /api/admin/audit-logs` — Immutable audit trail with actor, action, before/after JSON
- `GET /api/admin/health` — System health and database integrity verification

---

## 2. Minimal Functional UI Mockups (Role-Specific)

### Screen 1: Common Login & Active Role Selector
```
+---------------------------------------------------------------------------------+
|  CAMPUSOPS                                                [ Local System v1.0 ] |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                      [  CAMPUS OPERATIONS PLATFORM  ]                           |
|                         Lowkey Coders | Overclock'26                            |
|                                                                                 |
|       +-----------------------------------------------------------------+       |
|       | Login ID:     [ campus001                             ]         |       |
|       | Password:     [ •••••••••••••                         ]         |       |
|       |                                                                 |       |
|       | Active Role Context:                                            |       |
|       | ( ) Student       ( ) Faculty             ( ) Technician        |       |
|       | ( ) Facilities    ( ) Procurement Manager ( ) Dept Manager      |       |
|       | ( ) System Admin                                                |       |
|       |                                                                 |       |
|       |                      [ SIGN IN TO CAMPUSOPS ]                   |       |
|       |                                                                 |       |
|       | Quick Demo Switcher:                                            |       |
|       | [Aarav (Student)] [Dr. Kavitha (Faculty)] [Manoj (Electrician)] |       |
|       | [Dinesh (Procurement)] [Joseph (Facilities)] [Aisha (Sys Admin)]|       |
|       +-----------------------------------------------------------------+       |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

### Screen 2: Student Dashboard & Complaint Intake
```
+---------------------------------------------------------------------------------+
| [CAMPUSOPS] | Student View: Aarav Raman (CSAI)               [🔔 1] [Logout]   |
+-------------------+-------------------------------------------------------------+
| • Dashboard       | SUBMIT CAMPUS ISSUE                                         |
| • My Complaints   | +---------------------------------------------------------+ |
| • Room Status     | | Issue Location: [ Building B          v ] [ Room 204  v ]| |
|                   | | Asset / QR Tag (Optional): [ AST-001 (Power Socket)   v ]| |
|                   | | Channel: [ Web Form v ]                                 | |
|                   | | Description:                                            | |
|                   | | [ Electrical socket near desk 3 is sparking and dead. ] | |
|                   | | [ AI Triage Preview:                                  ] | |
|                   | | [ Category: ELECTRICAL | Priority: HIGH                ] | |
|                   | | [ Suggestion: Immediate technician dispatch required. ] | |
|                   | |                                                         | |
|                   | |                   [ SUBMIT COMPLAINT ]                  | |
|                   | +---------------------------------------------------------+ |
|                   |                                                             |
|                   | RECENT COMPLAINTS                                           |
|                   | Reference  | Room    | Category   | Status     | Updated    |
|                   | INC001     | B-204   | ELECTRICAL | RESOLVED   | 10:08 AM   |
|                   | INC002     | C-201   | NETWORK    | IN_PROG    | 11:15 AM   |
+-------------------+-------------------------------------------------------------+
```

### Screen 3: Faculty Dashboard & Timetable Coordination
```
+---------------------------------------------------------------------------------+
| [CAMPUSOPS] | Faculty View: Dr. Kavitha Menon               [🔔 2] [Logout]    |
+-------------------+-------------------------------------------------------------+
| • My Timetable    | CLASSROOM DISRUPTION ALERT                                  |
| • Report Issue    | ⚠️ Outage in Room RM-B-204 impacts:                         |
| • Relocations     | Booking: BKG-EXAM (CSAI Semester Exam | 10:00 - 12:00)          |
|                   | Status: RELOCATION RECOMMENDED TO RM-B-206 (Capacity: 45)   |
|                   | Action: Awaiting Department Manager Confirmation            |
|                   |                                                             |
|                   | TODAY'S SCHEDULE (Nov 3, 2026)                              |
|                   | Time          | Room      | Purpose            | Status     |
|                   | 09:00 - 10:30 | RM-B-201  | CS301 Lecture      | Normal     |
|                   | 10:00 - 12:00 | RM-B-204  | CSAI Semester Exam | Relocated  |
|                   | 14:00 - 16:00 | RM-A-102  | Lab Session        | Normal     |
+-------------------+-------------------------------------------------------------+
```

### Screen 4: Technician View & Work Order Execution
```
+---------------------------------------------------------------------------------+
| [CAMPUSOPS] | Technician: Manoj Electrician (SK01 Level 4)   [🔔 0] [Logout]    |
+-------------------+-------------------------------------------------------------+
| • Work Orders (2) | WORK ORDER: WO001 — Faulty 16A Power Socket                |
| • Spare Parts     | Incident Ref: INC001 | Location: Building B / Room RM-B-204 |
| • Shift Calendar  | Required Skill: Electrical (SK01) | Due: Nov 3, 10:15 AM    |
|                   | Current Status: [ IN_PROGRESS ]                             |
|                   |                                                             |
|                   | Reserved Spare Part:                                        |
|                   | • ITM001: 16A Power Socket [ 1 unit reserved - Ready ]     |
|                   |                                                             |
|                   | Actions:                                                    |
|                   | [ BLOCK (Wait for Parts) ]   [ COMPLETE WORK ORDER ]        |
|                   |                                                             |
|                   | Event History:                                              |
|                   | • 09:28 - Assigned to Manoj (Selvam excluded - on leave)    |
|                   | • 09:34 - Inspection started by Manoj                       |
+-------------------+-------------------------------------------------------------+
```

### Screen 5: Procurement Manager View (Independent Approval & Receiving)
```
+---------------------------------------------------------------------------------+
| [CAMPUSOPS] | Procurement Manager: Dinesh I                 [🔔 1] [Logout]    |
+-------------------+-------------------------------------------------------------+
| • Purchase Req (4)| PENDING PURCHASE REQUEST APPROVAL                           |
| • Stock Receiving | Request ID: PR001 | Requester: Rahul (Technician USR033)    |
| • Inventory Items | Linked Work Order: WO002 (Building C Wi-Fi Outage)          |
|                   | Estimated Total: $2,400.00                                  |
|                   | Reason: Network transceiver required to restore Wi-Fi       |
|                   | Items: ITM002 (Wi-Fi Network Transceiver) x 1 unit          |
|                   |                                                             |
|                   | Validation:                                                 |
|                   | [✓] Requester is distinct from Approver (Independent Check) |
|                   | [✓] Approved parts will NOT increment stock until received  |
|                   |                                                             |
|                   | [ APPROVE REQUEST ]              [ REJECT REQUEST ]         |
+-------------------+-------------------------------------------------------------+
```

### Screen 6: Facilities Admin Dashboard & Incident Triage
```
+---------------------------------------------------------------------------------+
| [CAMPUSOPS] | Facilities Admin: Joseph Thomas               [🔔 3] [Logout]    |
+-------------------+-------------------------------------------------------------+
| • Incident Queue  | ACTIVE INCIDENTS QUEUE                                      |
| • Dispatch Tech   | Ref     | Title               | Priority | Status  | Action |
| • Room Outages    | INC001  | Sparking socket     | CRITICAL | NEW     | [Assign|
| • SLA Monitor     | INC002  | Wi-Fi dead in C-201 | HIGH     | TRIAGED | [Assign|
|                   |                                                             |
|                   | DISPATCH TECHNICIAN FOR INC001 (Electrical)                 |
|                   | Candidate Technicians:                                      |
|                   | 1. Selvam (SK01 Level 5) -> [ EXCLUDED: Approved Leave ]    |
|                   | 2. Manoj  (SK01 Level 4) -> [ AVAILABLE: Shift Active ]     |
|                   |                                                             |
|                   | [ ASSIGN MANOJ (USR031) ]                                   |
+-------------------+-------------------------------------------------------------+
```

### Screen 7: Department Manager Relocation Confirmation
```
+---------------------------------------------------------------------------------+
| [CAMPUSOPS] | Department Manager: Dr. Suresh Balan          [🔔 1] [Logout]    |
+-------------------+-------------------------------------------------------------+
| • Dept Incidents  | AUTHORISE ROOM RELOCATION                                   |
| • Exam Bookings   | Incident: INC001 (Electrical Outage in RM-B-204)            |
| • Relocation Req  | Disrupted Event: BKG-EXAM (CSAI Semester Exam, 40 Students) |
|                   | Current Room: RM-B-204 [ OUTAGE ACTIVE ]                    |
|                   |                                                             |
|                   | Recommended Alternatives:                                   |
|                   | (*) RM-B-206: Capacity 45, Projector YES, Accessible YES    |
|                   | ( ) RM-B-208: Capacity 35 [ INSUFFICIENT CAPACITY ]         |
|                   | ( ) RM-A-101: Capacity 50 [ TIMETABLE CONFLICT ]            |
|                   |                                                             |
|                   | [ CONFIRM RELOCATION TO RM-B-206 ]                          |
|                   | (Generates Faculty notification & updates audit trail)      |
+-------------------+-------------------------------------------------------------+
```

### Screen 8: System Administrator (Audit Logs & Data Health)
```
+---------------------------------------------------------------------------------+
| [CAMPUSOPS] | System Admin: Aisha Rahman                     [🔔 0] [Logout]    |
+-------------------+-------------------------------------------------------------+
| • Master Data     | IMMUTABLE AUDIT TRAIL                                       |
| • Users & Roles   | ID     | Actor   | Action      | Entity      | Timestamp   |
| • Audit Logs      | AUD001 | USR001  | CREATE      | INCIDENT    | Nov 3 09:23 |
| • Idempotency     | AUD002 | USR028  | ASSIGN      | WORK_ORDER  | Nov 3 09:28 |
| • System Health   | AUD003 | USR024  | RELOCATE    | ROOM_BOOK   | Nov 3 09:38 |
|                   | AUD004 | USR033  | CREATE_PR   | PURCH_REQ   | Nov 4 10:45 |
|                   | AUD005 | USR030  | APPROVE_PR  | PURCH_REQ   | Nov 5 09:15 |
|                   | AUD006 | USR028  | RECEIVE     | STOCK_REC   | Nov 6 10:30 |
+-------------------+-------------------------------------------------------------+
```

---
*Specification approved and ready for Checkpoint 04 monorepo initialization.*
