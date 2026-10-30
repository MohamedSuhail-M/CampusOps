# CampusOps — Demonstration Data Setup & Inventory Consistency Guide

This guide documents the repeatable development seed configuration, data models, and inventory consistency rules for the Intelligent Campus Operations Platform.

---

## 1. Repeatable Seeding Command

The project includes an idempotent, non-destructive Excel workbook importer covering all 35 operational sheets:

```bash
# Run database seed from repository root
npm run db:seed

# Or execute directly within the server workspace
npm run db:seed --workspace=server
```

### Safety & Idempotency Rules
* **Never runs destructive drops**: Records are upserted or verified using stable primary keys (`id`), preventing duplicate rows.
* **Separation of environments**: Seed commands populate `prisma/dev.db` for local and demo test environments only; production instances must use transactional migrations.
* **Foreign-Key Integrity**: Relationships across buildings, rooms, users, technician skills, inventory items, and purchase requests are validated sequentially during import.

---

## 2. Seed Data Inventory

The demonstration environment includes realistic campus operations records:
* **Users & Roles (38 users)**: Across 7 active roles (`STUDENT`, `FACULTY`, `TECHNICIAN`, `DEPARTMENT_MANAGER`, `FACILITIES_ADMIN`, `PROCUREMENT_MANAGER`, `SYSTEM_ADMIN`).
* **Buildings & Rooms**: 4 campus blocks (Building A, B, C, D) and fully mapped rooms (e.g. `B-204`, `B-206`, `C-201`, `C-102`).
* **Hardware Assets (242 assets)**: Projectors, electrical panels, split ACs, and wireless access points with simulated QR codes.
* **Central Inventory (10 SKU items)**:
  - `INV-NET-01`: 10G SFP+ Optical Transceiver (Stock: 0 — Depleted, triggers Procurement Shortage Workflow)
  - `INV-ELE-02`: 16A Modular Socket (Stock: 4)
  - `INV-AV-01`: HDMI 4K Extender Cable (Stock: 1)
  - `INV-HVAC-01`: R-410A Refrigerant Canister (Stock: 8)
  - `INV-PLUMB-01`: 1-Inch PVC Ball Valve (Stock: 12)
* **Purchase Requests**: Multiple pending and approved purchase requests representing dual-sign approval workflows.
* **Stock Movements (72 transactions)**: Cryptographically timestamped ledger records for deliveries, reservations, and technician consumptions.
* **Audit Trail (532 events)**: Complete timeline of user logins, role elevations, incident state transitions, room relocations, and stock adjustments.

---

## 3. Strict Inventory Consistency Rules

CampusOps enforces 5 critical inventory consistency rules on the backend:

1. **Separation of PR Approval from Physical Stock**:
   Approving a Purchase Request (`POST /api/procurement/requests/:id/decide`) transitions the status to `APPROVED`, but **never** increases `quantityOnHand`. Stock only changes upon physical delivery.

2. **Transactional Stock Receipts**:
   Physical dock receipts (`POST /api/procurement/receipts`) run inside an atomic Prisma `$transaction`. In a single safe transaction, the system:
   - Increments physical `quantityOnHand`.
   - Records an immutable `StockMovement` entry (`+quantityReceived`).
   - Creates a persistent `StockReceipt` record.
   - Unblocks any work orders blocked waiting for this part.

3. **Anti-Self-Approval Rule**:
   A technician or manager who created a purchase request is strictly prohibited by backend authorization from approving their own request. Approval requires an independent Procurement Manager or Facilities Administrator.

4. **Zero Negative Inventory**:
   Work order stock reservations cannot exceed `quantityOnHand - activeReservations`. If insufficient stock exists, the work order automatically transitions to `BLOCKED`.

5. **Idempotency Protection**:
   Duplicate receipt submissions with identical tracking identifiers are rejected to prevent double-crediting stock.
