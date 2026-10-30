# CampusOps — Future Computer Vision UI Integration Architecture

**Document Version:** 1.0.0  
**Target:** Future Photo-Based Defect Triage & Asset Recognition Module  
**Status:** Reserved Extension Point (Non-Breaking Architecture Specification)  

---

## 1. Vision & Overview

In upcoming phases, CampusOps will introduce photo-based defect intake for students, faculty, and field staff. Users will be able to capture or upload images of damaged campus assets (e.g. sparking electrical panels, leaking pipes, broken furniture, failing access points), and an offline or cloud Computer Vision (CV) model will assist in triage:
1. Detecting asset type and serial markings from photographs.
2. Estimating damage category (e.g., `ELECTRICAL`, `PLUMBING`, `HVAC`, `NETWORK`).
3. Suggesting priority based on visible severity (e.g. flame, smoke, water pooling).

---

## 2. Guardrails & Current Constraint

> [!IMPORTANT]
> **Zero Current Backend Changes:**  
> In accordance with Hackathon constraints, Computer Vision is NOT implemented in the current production release. Existing complaint APIs (`POST /api/intake` and `POST /api/intake/submit`) remain purely text- and QR-driven. No external CV API calls or breaking schema mutations are introduced.

---

## 3. Frontend Extensibility Contract

The complaint intake UI in `StudentView.tsx` and `FacultyView.tsx` is structured to accept an optional future `<AttachmentZone />` component without altering existing intake forms:

```tsx
// Future Extensibility Pattern (Reserved):
interface IntakeFormPayload {
  message: string;
  buildingId?: string;
  roomId?: string;
  assetId?: string;
  // Future CV Extension Fields:
  imageFile?: File | null;
  cvTelemetry?: {
    detectedAssetClass?: string;
    confidenceScore?: number;
    boundingCoordinates?: [number, number, number, number];
  };
}
```

### Component Extension Slot
Within the complaint submission drawer/modal:
- An image attachment slot is reserved below the QR lookup button.
- When an image is attached, a client-side preview will display the photo within a High-Contrast Kinetic Editorial card (`border-2 border-[#0A0A0A] bg-[#F2EFE9]`).
- The offline fallback text triage (`runOfflineTriage`) remains the authoritative deterministic engine until verified CV microservices are enabled.

---

## 4. Backend Compatibility Roadmap

When CV is scheduled for activation:
1. File upload handling will use standard multipart form parsing (e.g. `multer`) writing to local isolated storage `data/attachments/`.
2. A new dedicated endpoint `POST /api/intake/analyze-image` will process the image buffer and return predicted category and priority candidates to the frontend.
3. The existing `IntakeMessage` model already includes `externalMessageId` and extensible metadata fields, ensuring zero destructive database migrations.
