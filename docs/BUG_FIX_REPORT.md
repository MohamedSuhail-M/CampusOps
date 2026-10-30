# CampusOps — Targeted Bug Fixes Report
## Full-Page Language Switching • Live Camera Viewfinder • Speech Recognition Pipeline

**Repository:** `CAMPUS OPS`  
**Date:** October 30, 2026  
**Status:** COMPLETED & VERIFIED  
**Baseline Git Checkpoint:** `backup-before-bugfix` (commit `daba54f`)  
**Backend & Database State:** Unmodified (100% preserved SQLite, Express, Prisma, Auth & Workflows)

---

## 1. Executive Summary

This report documents the root-cause diagnosis, implementation, and regression verification for three specific targeted issues in the CampusOps application:

1. **Issue 1 — Full-Page Global Language Switching:**
   - *Problem:* Changing the language selector in the top bar previously only translated the complaint submission form, leaving navigation sidebars, role dashboards, cards, tables, and buttons in hardcoded English.
   - *Solution:* Built a robust internationalization architecture with dot-path key traversal `t(key, fallback)`, locale-aware date and number formatters (`t.formatDate`, `t.formatNumber`), expanded dictionaries for English (`en`), Tamil (`ta` — தமிழ்), and Hindi (`hi` — हिन्दी), and connected all 7 role dashboards and common layouts. Language preference persists across page reloads via `localStorage` without wiping ongoing user inputs.

2. **Issue 2 — Live In-Browser Camera Viewfinder & Frame Capture:**
   - *Problem:* The camera action on desktop browsers used a simple `<input type="file" capture="environment">`, which opened the OS file explorer dialog rather than rendering a live viewfinder feed on the webpage.
   - *Solution:* Implemented `LiveCameraModal.tsx` leveraging the WebRTC `navigator.mediaDevices.getUserMedia` API. Features include camera device switching (front/rear/webcam), real-time `<video>` viewfinder with a recording indicator, snapshot capture onto an offscreen `<canvas>` yielding a high-quality JPEG blob, instant freeze preview, "Retake" and "Attach Photo" controls, explicit error handling (`NotAllowedError`, `NotFoundError`), and deterministic hardware track shutdown on modal unmount.

3. **Issue 3 — Microphone Dictation & Speech Recognition Pipeline:**
   - *Problem:* Clicking the microphone indicator showed an active state, but spoken audio was not transcribed into the complaint text due to a stale React state closure over `currentText` and a broken accumulator loop starting at `event.resultIndex` in the Web Speech API callback.
   - *Solution:* Completely re-engineered `VoiceDictation.tsx` using a frozen `baseTextRef` updated only during idle states, a continuous session accumulator iterating all results (`0` to `event.results.length`), a live real-time interim transcript preview strip (`liveInterim`), and a live Web Audio API volume level meter (`AudioContext` + `AnalyserNode`) providing visual proof that speech is being received. Mapped speech recognition locale tags (`en-IN`/`en-US`, `ta-IN`, `hi-IN`).

---

## 2. Issue 1: Full-Page Global Language Switching

### Root Cause Analysis
- `LanguageContext.tsx` previously exposed an object literal `t` containing only `complaintForm` and basic `nav` properties.
- Components in the application either did not consume `useTranslation()`, or had hardcoded English text strings in dashboard headers, metric cards, action buttons, table columns, and status badges.
- Dynamic key access across nested role dashboard objects was not supported.

### Implementation Details
- **`client/src/i18n/LanguageContext.tsx`:**
  - Designed `t` as a hybrid function-object: it can be invoked as `t('dashboards.student.title', 'Student Command Portal')` with recursive dot-path resolution and fallback, and can also be accessed via property paths like `t.nav.dashboard`.
  - Added locale-aware formatters:
    - `t.formatDate(date, options)`: Formats dates according to `en-IN`, `ta-IN`, or `hi-IN`.
    - `t.formatNumber(num)`: Formats numbers using the selected locale.
  - Persisted selection in `localStorage.setItem('campusops_lang', lang)`.
- **`client/src/i18n/translations.ts`:**
  - Built out comprehensive translation matrices for `en`, `ta` (தமிழ்), and `hi` (हिन्दी) across:
    - `topbar`: telemetry status, active role label, search placeholder.
    - `nav`: all 7 roles' primary navigation items.
    - `common`: save, cancel, back, loading, active, search, refresh, filter.
    - `status`: OPEN, IN_PROGRESS, RESOLVED, BLOCKED, CLOSED, ASSIGNED, ESCALATED.
    - `dashboards`: dedicated blocks for `student`, `faculty`, `technician`, `deptManager`, `facilities`, `procurement`, and `sysadmin`.
- **Components & Pages Updated:**
  - `client/src/layouts/RoleLayout.tsx`
  - `client/src/components/common/AppTopbar.tsx`
  - `client/src/components/common/AppSidebar.tsx`
  - `client/src/pages/student/StudentHomePage.tsx`
  - `client/src/pages/faculty/FacultyHomePage.tsx`
  - `client/src/pages/technician/TechnicianWorkOrdersPage.tsx`
  - `client/src/pages/dept_manager/DeptManagerHomePage.tsx`
  - `client/src/pages/facilities/FacilitiesTriagePage.tsx`
  - `client/src/pages/procurement/ProcurementRequestsPage.tsx`
  - `client/src/pages/sysadmin/SysAdminOverviewPage.tsx`
  - `client/src/pages/UnauthorizedPage.tsx`

---

## 3. Issue 2: Live In-Browser Camera Viewfinder & Photo Capture

### Root Cause Analysis
- The photo evidence upload component previously relied solely on an HTML `<input type="file" accept="image/*" capture="environment">`.
- While mobile operating systems intercept `capture="environment"` to trigger the native camera application, standard desktop browsers (Chrome, Edge, Firefox on Windows/macOS) treat this as a standard file picker and open the file explorer dialog.
- No HTML5 `<video>` viewfinder element or WebRTC `navigator.mediaDevices.getUserMedia` pipeline was implemented.

### Implementation Details
- **Created `client/src/components/multimodal/LiveCameraModal.tsx`:**
  - **Permission & Device Enumeration:** Requests video stream via `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })`. Enumerates connected video input devices so users with multiple cameras or webcams can switch lenses dynamically.
  - **Live Video Viewfinder:** Renders the stream in a dedicated `<video ref={videoRef} autoPlay playsInline muted>` element with a pulsing "LIVE FEED" viewfinder badge.
  - **Frame Capture Pipeline:** On clicking "Capture Frame", an offscreen `<canvas>` matches the video's intrinsic dimensions (`videoWidth` x `videoHeight`), draws the current video frame using `drawImage()`, and extracts a JPEG blob via `toBlob(..., 'image/jpeg', 0.9)`.
  - **Preview & Retake:** Displays the frozen captured image with options to "Retake" (restarting the video feed) or "Attach Photo" (delivering the `File` object to the parent form).
  - **Hardware Stream Termination:** Implements deterministic cleanup in `useEffect` and modal close handlers:
    ```typescript
    stream.getTracks().forEach((track) => track.stop());
    ```
    This turns off the physical camera LED immediately upon closing the modal or taking a photo.
  - **Error Handling:** Gracefully displays user-friendly error banners for `NotAllowedError` ("Camera access was denied"), `NotFoundError` ("No camera hardware detected"), and `NotReadableError` ("Camera is currently in use by another application").
- **Integrated into `client/src/components/multimodal/PhotoEvidenceUpload.tsx`:**
  - Added "Take Live Photo" button opening `LiveCameraModal`.
  - Captured photos flow directly into the existing upload queue and are persisted to disk via the backend API `POST /api/intake/evidence`.

---

## 4. Issue 3: Microphone & Speech Recognition Transcription Pipeline

### Root Cause Analysis
1. **Stale Closure Bug:** The `recognition.onresult` callback closed over `currentText` from the component's initial render. Every time a new transcript segment was recognized, the callback wrote against the stale snapshot of `currentText`, either reverting manual edits or producing garbled text.
2. **Result Accumulation Loop Bug:** The code previously iterated results starting from `event.resultIndex` and called `onTranscript(currentText + interim)`. Because `SpeechRecognition` in `continuous: true` mode can emit cumulative results across chunks, indexing from `resultIndex` caused previous finalized words to be dropped on subsequent events.
3. **Missing Visual Feedback:** There was no volume indicator or real-time audio visualization, leaving users uncertain whether their microphone was receiving audio or whether the speech engine was processing.
4. **Language Tag Misalignment:** Recognition language was not explicitly tied to regional Indian speech recognition models (`ta-IN`, `hi-IN`, `en-IN`).

### Implementation Details
- **Re-engineered `client/src/components/multimodal/VoiceDictation.tsx`:**
  - **`baseTextRef` Synchronization:** Maintains a `baseTextRef` that synchronizes with `currentText` whenever recognition is *not* actively listening. When the user speaks, newly recognized speech is appended to `baseTextRef.current`, ensuring existing and manually typed text is never lost or overwritten.
  - **Continuous Result Accumulator:**
    ```typescript
    let sessionFinal = '';
    let sessionInterim = '';
    for (let i = 0; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) {
        sessionFinal += res[0].transcript + ' ';
      } else {
        sessionInterim += res[0].transcript;
      }
    }
    ```
    This seamlessly separates finalized phrases from ongoing interim phrases.
  - **Real-Time Interim Preview:** Renders an animated live speech preview box (`liveInterim`) in the UI showing words as they are being spoken before they commit to the textarea.
  - **Web Audio API Volume Level Meter:**
    - Initializes an `AudioContext` connected to `navigator.mediaDevices.getUserMedia({ audio: true })`.
    - Routes audio into an `AnalyserNode` with `fftSize: 256`.
    - Animates 5 dynamic frequency bars in real-time, providing immediate visual feedback of ambient audio levels.
    - Closes `AudioContext` and stops audio tracks cleanly on session end.
  - **Locale Code Mapping:**
    - English: `en-IN` (fallback to `en-US`)
    - Tamil: `ta-IN`
    - Hindi: `hi-IN`
  - **Comprehensive Error Handling:** Captures `not-allowed`, `no-speech`, `audio-capture`, and `network` events with descriptive user guidance.

---

## 5. Verification & Regression Test Results

### A. Automated Backend Test Suite
All 63 existing backend test cases across 9 test suites were executed with `npm test --workspace=server`:
- `src/tests/auth_rbac.test.ts` (7/7 passed)
- `src/tests/scenario_1_exam_outage.test.ts` (6/6 passed)
- `src/tests/scenario_2_procurement_shortage.test.ts` (7/7 passed)
- `src/tests/inventory_procurement.test.ts` (8/8 passed)
- `src/tests/work_orders_rooms.test.ts` (8/8 passed)
- `src/tests/sla_audit.test.ts` (10/10 passed)
- `src/tests/intake_incidents.test.ts` (8/8 passed)
- `src/tests/directory.test.ts` (8/8 passed)
- `src/tests/health.test.ts` (1/1 passed)
**Total: 63 passed, 0 failed (100% pass rate).**

### B. Frontend Production Build
Executed `npm run build --workspace=client` (`tsc && vite build`):
- `tsc` completed with exit code 0 (zero TypeScript errors).
- Vite bundled 110 modules cleanly into `dist/`.

### C. Live Server & Tunnel Endpoints
- **Local Application:** `http://localhost:5173`
- **Express Backend:** `http://localhost:4000`
- **Active Public Tunnel:** `https://29bbaf8d1a065a.lhr.life`

---

## 6. Browser Requirements & Permissions Notice
1. **Camera (Issue 2):** Requires `getUserMedia` permission. Modern browsers require HTTPS (or `localhost`) to grant camera access. The public tunnel provides valid TLS (`https://`), satisfying browser security restrictions.
2. **Microphone (Issue 3):** Requires `getUserMedia` audio permission for the volume meter and browser Web Speech API support (Google Chrome, Edge, and Chromium-based browsers provide native Web Speech support for `en-IN`, `ta-IN`, and `hi-IN`).
