# CampusOps — Intelligent Campus Operations Platform

**Team:** LOWKEY CODERS  
**Problem Statement 2:** Intelligent Campus Operations  
**Hackathon:** Overclock'26  
**Implementation:** Production-Grade Local-First Full-Stack Monorepo  

---

## 🚀 Live Local Endpoints

| Service | Localhost URL | Description |
|---|---|---|
| **Frontend Application** | [http://localhost:5173/](http://localhost:5173/) | Minimal Functional React + Vite UI with 7 Role Portals |
| **Backend REST API** | [http://localhost:4000/](http://localhost:4000/) | Express + TypeScript REST API Engine |
| **API Health Check** | [http://localhost:4000/api/health](http://localhost:4000/api/health) | Live SQLite Health & Engine Diagnostics |

---

## 🔑 Demo Credentials (All 7 Roles)

Every demo user is pre-seeded in the database with secure bcrypt password hashing (cost factor 12).  
**Default Demo Password:** `password123`

The login screen also provides **1-Click Quick-Fill buttons** for instant evaluation without typing!

| Role Experience | User ID | Login ID | Full Name | Department / Specialization | Primary Capabilities |
|---|---|---|---|---|---|
| **Student** | `USR001` | `campus001` | Ananya Sharma | Computer Science & Engineering | Submit complaints, QR asset lookup, view personal complaint history |
| **Faculty** | `USR017` | `campus017` | Dr. Kavitha Menon | Computer Science & Engineering | View timetable, emergency outage advisories, relocation alerts |
| **Technician** | `USR031` | `campus031` | Manoj Kumar | Electrical Maintenance (Level 4) | Assigned work orders, START / BLOCK / RESUME / COMPLETE lifecycle, parts reservation |
| **Procurement Manager** | `USR030` | `campus030` | Mr. Dinesh I | Central Campus Procurement | Pending PR queue, independent approvals, physical goods receipts |
| **Facilities Administrator**| `USR028` | `campus028` | Dr. Priya R | Campus Estate & Facilities | Incident triage, technician dispatch with leave verification, outage tracking |
| **Department Manager** | `USR024` | `campus024` | Dr. Suresh Balan | Computer Science & Engineering | Emergency exam relocations, 1-click room authorizations, faculty notification |
| **System Administrator** | `USR029` | `campus029` | Rajesh K | Information Technology Services | Executive KPIs card, SQLite DB health, immutable audit trail viewer |

---

## 🛠️ Technology Stack & Architecture

- **Architecture:** Local-first Monorepo (`client/` and `server/`)
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js, TypeScript, Zod Input Validation
- **Database:** SQLite with Prisma ORM (`prisma/dev.db`), migrated with 34 relational tables
- **Authoritative Dataset:** Seeded directly from `CampusOps_Complete_Fictional_Database_Dataset.xlsx` (1,042 records imported across 34 tables with 0 referential errors)
- **Authentication & Security:** HMAC-SHA256 signed HTTP-only cookie sessions, bcryptjs (cost factor 12), backend-enforced RBAC across all 7 roles
- **Testing:** Vitest, Supertest, SQLite in-memory integration testing (63/63 tests passing)

---

## 📦 Quick Start & Development

### 1. One-Click Development Startup
Both the Express API server and Vite client development server run concurrently:
```bash
npm run dev
```
- Frontend starts at: `http://localhost:5173/`
- Backend API starts at: `http://localhost:4000/`

### 2. Run Complete Backend Test Suite
Executes 63 automated unit, integration, and scenario tests across 9 test suites:
```bash
npm run test --workspace=server
```

### 3. Verify Database Referential Integrity
Verifies SQLite foreign key constraints across all 34 tables:
```bash
node server/scripts/fk_check.js
```

### 4. Build Client Production Bundle
```bash
npm run build --workspace=client
```

---

## 🧪 Interactive Scenario Walkthroughs

### ⚡ Scenario 1: Electrical Failure Before Semester Examination (Room B-204)

> **Context:** Classroom `RM-B-204` suffers severe electrical sparking and smoke right before the `CSAI Semester Examination` (`BKG-EXAM`, 55 students). The room must be evacuated and the exam relocated immediately to an alternative seminar hall.

1. **Step 1 — Complaint & AI Triage (Student Portal):**
   - Log in as **Student** (`campus001` / `password123`) or click **Student Quick Fill**.
   - Click the blue **"Pre-Fill Scenario 1 (Electrical Sparking)"** button.
   - Click **"Verify QR Code AST-EL-B-204"** — verifies Asset `EL-B-204-01` in Room `RM-B-204`.
   - Submit Complaint. The offline AI triage immediately classifies it as **CRITICAL** priority and **ELECTRICAL** category.
2. **Step 2 — Timetable Conflict Detection & Relocation (Department Manager):**
   - Switch role to **Department Manager** (`campus024`) using the top navbar quick switcher.
   - Click **"Authorize Relocation"** for `BKG-EXAM`.
   - The recommendation engine analyzes capacity (>=55 students), equipment, and timetable availability.
   - `RM-B-206` is ranked **#1** (Score 265: same building +50, same floor +60, seminar auditorium +50, capacity buffer +30).
   - Click **"Confirm Relocation to RM-B-206"**. Faculty Dr. Kavitha Menon (`campus017`) receives immediate notification.
3. **Step 3 — Technician Eligibility & Leave Exclusion (Facilities Admin):**
   - Switch role to **Facilities Admin** (`campus028`).
   - Find the Critical Electrical incident in the Incident Triage Queue and click **"Assign Technician"**.
   - Notice technician **Selvam P (`USR032`)** is marked with an orange badge: *"Excluded: On approved leave (LEV001)"*.
   - System recommends **Manoj Kumar (`USR031`)** who is Level 4 Electrical and on duty.
   - Click **"Assign to Manoj Kumar"**.
4. **Step 4 — Socket Replacement & Resolution (Technician):**
   - Switch role to **Technician** (`campus031`).
   - Click **"START"** on the assigned Electrical work order.
   - Reserve 1 replacement 16A socket (`ITM001`).
   - Click **"COMPLETE"** and enter resolution notes. The incident is marked `RESOLVED` and permanent maintenance history is logged.

---

### 🌐 Scenario 2: Shared Wi-Fi Outage & Spare Parts Shortage Resumption

> **Context:** The central Wi-Fi access point in `RM-C-201` burns out during a student lab practical. The technician finds 0 spare transceivers in stock and initiates an emergency Purchase Request. Anti-Self-Approval is enforced. Upon physical receipt, the blocked work order is automatically resumed.

1. **Step 1 — Network Complaint (Student Portal):**
   - Log in as **Student** (`campus001`).
   - Click **"Pre-Fill Scenario 2 (Wi-Fi Failure)"**.
   - Submit Complaint. Triage assigns **HIGH** priority and **NETWORK** category.
2. **Step 2 — Technician Assignment (Facilities Admin):**
   - Switch to **Facilities Admin** (`campus028`).
   - Assign Networking Technician **Anandha Kumar (`USR033`)**.
3. **Step 3 — Parts Shortage & Work Order Blocking (Technician):**
   - Switch to **Technician** (`campus033`).
   - Click **"START"** on the Wi-Fi work order (`IN_PROGRESS`).
   - Click **"Request Purchase Order (Parts Shortage)"**.
   - Request 2 units of `ITM002` (Wi-Fi Network Transceiver).
   - Submit PR. The work order is automatically transitioned to **`BLOCKED`** with reason: *"Awaiting spare parts from Purchase Request"*.
4. **Step 4 — Anti-Self-Approval Rule Enforcement:**
   - As the technician (`campus033`), try approving the PR. The backend strictly rejects with **HTTP 403 Forbidden (`SELF_APPROVAL_FORBIDDEN`)**.
5. **Step 5 — Independent Procurement Approval (Procurement Manager):**
   - Switch to **Procurement Manager** (`campus030` - Mr. Dinesh I).
   - In the Pending Approvals tab, click **"Approve"**.
   - *Backend Invariant:* Status changes to `APPROVED`, but physical stock remains unchanged at 2.
6. **Step 6 — Physical Stock Receipt & Automatic Resumption:**
   - In the Procurement portal, click **"Record Physical Receipt"**.
   - Enter `quantity: 2`, `condition: ACCEPTED`.
   - The ledger increments physical stock on hand to 4.
   - The system **automatically unblocks and resumes** the work order back to **`IN_PROGRESS`**, creates a `StockReservation`, and alerts the technician.
7. **Step 7 — Work Order Completion (Technician):**
   - Switch to **Technician** (`campus033`). The work order is active and ready to be marked **`COMPLETED`**.

---

## 🔒 Verification & Compliance Highlights

- **Anti-Self-Approval Invariant:** Tested and backend-enforced. A user who requests a purchase order cannot approve it.
- **Transactional Stock Ledger:** Stock reservations and physical stock receipts use ACID SQLite transactions preventing negative stock balances or double-reservations.
- **Staff Leave Integration:** Technicians on approved leave are filtered out of dispatch recommendations.
- **Zero Cloud Dependencies:** 100% functional locally with zero external API calls or mock endpoints.
