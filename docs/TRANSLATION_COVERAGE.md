# CampusOps — Translation Coverage Inventory

This document tracks translation coverage across the entire CampusOps frontend application for English (`en`), Tamil (`ta`), and Hindi (`hi`).

---

## 1. Coverage Summary
- **Default Application Language:** English (`en`)
- **Supported Regional Languages:** Tamil (`ta` — `தமிழ்`), Hindi (`hi` — `हिन्दी`)
- **Persistence:** LocalStorage key `campusops_language_preference`
- **Dynamic HTML Root Sync:** `<html lang="en|ta|hi">`
- **Form State Safety:** Language switching re-renders UI presentation without resetting user-entered form inputs or active drafts.

---

## 2. Namespace & Key Inventory

### A. Application Brand & Telemetry (`appName`, `tagline`, `topbar`)
| Translation Key | English | Tamil (தமிழ்) | Hindi (हिन्दी) | Status |
| :--- | :--- | :--- | :--- | :--- |
| `appName` | CAMPUSOPS | கேம்பஸ்ஆப்ஸ் (CampusOps) | कैम्पसऑप्स (CampusOps) | Verified |
| `tagline` | Intelligent Campus Operations Platform | புத்திசாலி வளாக செயல்பாட்டு தளம் | स्मार्ट कैंपस संचालन प्लेटफॉर्म | Verified |
| `topbar.operationalSector` | Operational Sector | செயல்பாட்டு துறை | संचालन क्षेत्र | Verified |
| `topbar.searchPlaceholder` | Search tickets, rooms, assets... | சம்பவங்கள், அறைகள், பணி ஆணைகளைத் தேடுங்கள்... | घटनाएं, संपत्ति, कमरे, कार्य आदेश खोजें... | Verified |
| `topbar.activeRoleLabel` | Active Role | தற்போதைய பங்கு | सक्रिय भूमिका | Verified |
| `topbar.switchRole` | Switch Role | பங்கு மாற்றம் | भूमिका बदलें | Verified |

---

### B. Shared Navigation (`nav`)
| Translation Key | English | Tamil (தமிழ்) | Hindi (हिन्दी) | Status |
| :--- | :--- | :--- | :--- | :--- |
| `nav.dashboard` | Dashboard | முகப்பு பலகை | डैशबोर्ड | Verified |
| `nav.reportIssue` | Report Issue | புகார் அளிக்கவும் | शिकायत दर्ज करें | Verified |
| `nav.myReports` | My Reports | எனது புகார்கள் | मेरी शिकायतें | Verified |
| `nav.alerts` | Notifications | அறிவிப்புகள் | अधिसूचनाएं | Verified |
| `nav.help` | Help & Support | உதவி & ஆதரவு | सहायता एवं समर्थन | Verified |
| `nav.timetable` | My Timetable | எனது அட்டவணை | मेरी समय सारिणी | Verified |
| `nav.roomRequests` | Room Requests | அறை கோரிக்கைகள் | कक्ष अनुरोध | Verified |
| `nav.workOrders` | Work Orders | பணி ஆணைகள் | कार्य आदेश | Verified |
| `nav.parts` | Parts Requests | உதிரிபாக கோரிக்கைகள் | पुर्जे अनुरोध | Verified |
| `nav.schedule` | Schedule & Leave | ஷிப்ட் & விடுப்பு | समय सारिणी और छुट्टी | Verified |
| `nav.diagnostics` | Diagnostics | கண்டறிதல் கருவிகள் | नैदानिक उपकरण | Verified |
| `nav.deptIssues` | Department Issues | துறை சிக்கல்கள் | विभाग समस्याएं | Verified |
| `nav.rooms` | Rooms & Timetable | அறைகள் & அட்டவணை | कक्ष और समय सारिणी | Verified |
| `nav.relocations` | Relocation Approvals | இடமாற்ற அனுமதிகள் | स्थानांतरण स्वीकृति | Verified |
| `nav.incidentTriage` | Incident Triage | சம்பவ பரிசீலனை | समस्या वर्गीकरण | Verified |
| `nav.roster` | Technician Roster | தொழில்நுட்ப வல்லுநர் பட்டியல் | तकनीशियन रोस्टर | Verified |
| `nav.purchaseRequests` | Purchase Requests | கொள்முதல் கோரிக்கைகள் | खरीद अनुरोध | Verified |
| `nav.inventory` | Inventory Ledger | சரக்கு இருப்பு பட்டி | इन्वेंट्री बहीखाता | Verified |
| `nav.stockReceipts` | Stock Receipts | பொருட்கள் வரவு | स्टॉक रसीदें | Verified |
| `nav.policyRules` | Policy Rules | கொள்கை விதிகள் | नीति नियम | Verified |
| `nav.systemOverview` | System Overview | கணினி கண்ணோட்டம் | सिस्टम अवलोकन | Verified |
| `nav.usersRoles` | Users & Roles | பயனர்கள் & பங்குகள் | उपयोगकर्ता और भूमिकाएं | Verified |
| `nav.campusData` | Campus Data & QR | வளாகத் தரவு & QR | परिसर डेटा & QR | Verified |
| `nav.integrations` | Integrations | வெளிப்புற இணைப்புகள் | एकीकरण | Verified |
| `nav.auditSecurity` | Audit & Security | தணிக்கை & பாதுகாப்பு | लेखापरीक्षा एवं सुरक्षा | Verified |
| `nav.logout` | Sign Out | வெளியேறு | लॉग आउट | Verified |

---

### C. Multimodal Complaint Intake (`complaintForm`)
| Translation Key | English | Tamil (தமிழ்) | Hindi (हिन्दी) | Status |
| :--- | :--- | :--- | :--- | :--- |
| `complaintForm.title` | Report a Campus Issue | வளாகப் பிரச்சனை குறித்து புகார் அளிக்கவும் | परिसर की समस्या दर्ज करें | Verified |
| `complaintForm.step1Language`| Language / மொழி / भाषा | மொழி / Language / भाषा | भाषा चुनें / Language / மொழி | Verified |
| `complaintForm.step2Location`| Location & Equipment | இடம் & உபகரணம் | स्थान एवं उपकरण | Verified |
| `complaintForm.step3Description`| Describe the Issue | சிக்கலை விளக்குங்கள் | समस्या का विवरण दें | Verified |
| `complaintForm.step4Evidence`| Attach Photo Evidence | புகைப்பட ஆதாரம் இணைக்கவும் | फोटो साक्ष्य संलग्न करें | Verified |
| `complaintForm.step5Triage`| Smart AI Triage Analysis | ஸ்மார்ட் AI பகுப்பாய்வு | स्मार्ट एआई विश्लेषण | Verified |
| `complaintForm.scanQrBtn` | Scan Equipment QR | உபகரணம் QR ஸ்கேன் செய் | उपकरण क्यूआर स्कैन करें | Verified |
| `complaintForm.startDictation`| Start Voice Dictation | குரல் வழி பதிவு (மைக்) | बोलकर लिखें (वॉइस इनपुट) | Verified |
| `complaintForm.cameraCapture`| Open Camera | கேமரா திறக்கவும் | कैमरा खोलें | Verified |
| `complaintForm.submitBtn` | Submit Incident Report | புகாரைச் சமர்ப்பிக்கவும் | शिकायत दर्ज करें | Verified |

---

### D. 7 Role Dashboards (`dashboards.*`)
| Role Dashboard | Key Sub-elements | EN Support | TA Support | HI Support | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student** | Title, Subtitle, Metric Cards, Recent Complaints, Action Buttons | 100% | 100% | 100% | Verified |
| **Faculty** | Disruption Banner, Digital Passes, Timetable Alert, Session Metrics | 100% | 100% | 100% | Verified |
| **Technician** | Active Orders, Spares Blocking, SLA Window, Completion Counter | 100% | 100% | 100% | Verified |
| **Dept Manager** | Relocations Needed, Authorized Relocations, Urgent Exam Pass | 100% | 100% | 100% | Verified |
| **Facilities Admin** | Triage Queue, Roster Availability, Dispatch Buttons, SLA Risk | 100% | 100% | 100% | Verified |
| **Procurement** | Dual-Sign Approval (4.2), Stock Inwarding, Inventory Status | 100% | 100% | 100% | Verified |
| **System Admin** | System Health, SQLite Integrity, Active Sessions, DB Records | 100% | 100% | 100% | Verified |

---

### E. Common Buttons & Status Labels (`common.*`, `status.*`)
- **Buttons:** Submit, Cancel, Confirm, Save, Edit, Delete, Close, Back, Retake, Open Camera, Capture, Browse, Export, Refresh, View Details, Authorize.
- **Statuses:** NEW, OPEN, TRIAGED, DISPATCHED, IN_PROGRESS, PENDING_PARTS, COMPLETED, RESOLVED, CLOSED, APPROVED, REJECTED, BLOCKED.
- **Priorities:** CRITICAL, HIGH, MEDIUM, LOW.
