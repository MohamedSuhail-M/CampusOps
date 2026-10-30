import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onSignIn?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<1 | 2>(1);
  const [activeStep, setActiveStep] = useState<number>(1);

  const handleSignIn = () => {
    if (onSignIn) onSignIn();
    else navigate('/login');
  };

  const scenarioData = {
    1: {
      title: 'B-204 Electrical Failure',
      steps: [
        {
          step: 1,
          moment: 'MOMENT 01',
          rule: 'System Policy 4.2',
          title: 'On-leave technician rejected',
          desc: 'Technician Selvam P (USR032) flagged on leave (LEV001); system enforces roster rule and auto-reassigns to Manoj Kumar (USR031).',
          inspectorTitle: 'Technician Roster Conflict',
          logs: [
            '> checking candidate: Selvam P (ID #USR032)',
            '> REJECT: active approved leave flag (LEV001) in HR table',
            '> [SUGGESTED] auto-routed to certified alternate: Manoj Kumar (Cert: Electrical Level 4)',
            '> SUCCESS: Shift lock confirmed (08:22:14 AM)',
          ],
        },
        {
          step: 2,
          moment: 'MOMENT 02',
          rule: 'Academic Continuity',
          title: 'Classroom Exam Conflict Auto-Relocated',
          desc: 'CSAI Semester Exam (BKG-EXAM, 55 students) conflict detected in B-204; system scores and recommends RM-B-206 (80 capacity).',
          inspectorTitle: 'Room Scheduling Engine',
          logs: [
            '> room hazard detected: RM-B-204 (CRITICAL ELECTRICAL)',
            '> timetable collision: BKG-EXAM (55 candidates scheduled 04:30 - 06:30)',
            '> candidate scoring: RM-B-206 ranked #1 (Score 265: same building +50, same floor +60, seminar hall +50)',
            '> Relocation authorized by Department Manager Suresh Balan; faculty Dr. Kavitha Menon notified',
          ],
        },
        {
          step: 3,
          moment: 'MOMENT 03',
          rule: 'Inventory & Work Order',
          title: 'Socket Stock Reserved and Verified On-Site',
          desc: 'Manoj reserves replacement 16A socket (ITM001), replaces faulty panel, tests voltage, and closes incident.',
          inspectorTitle: 'Field Execution Lock',
          logs: [
            '> work order WO-001 transitioned: OPEN -> IN_PROGRESS',
            '> parts reservation: 1x ELEC-SOCKET-16A (ITM001)',
            '> reservation consumed: quantity_on_hand updated in ACID transaction',
            '> resolution logged: "Socket safely replaced and circuit tested OK. Room verified safe."',
          ],
        },
      ],
    },
    2: {
      title: 'C-Wing Wi-Fi Outage',
      steps: [
        {
          step: 1,
          moment: 'MOMENT 01',
          rule: 'Work Order Stoppage',
          title: 'Spare Parts Shortage Blocks Repair',
          desc: 'Wi-Fi transceiver (ITM002) depleted; technician initiates PR for 2 units and work order is automatically locked to BLOCKED.',
          inspectorTitle: 'Inventory Stock Threshold',
          logs: [
            '> incident INC002: HIGH NETWORK in RM-C-201',
            '> technician Anandha Kumar checks stock: ITM002 available is 0',
            '> Purchase Request PR-002 created for 2x NET-TRANSCEIVER',
            '> work order automatically set to BLOCKED: "Awaiting spare parts from Purchase Request"',
          ],
        },
        {
          step: 2,
          moment: 'MOMENT 02',
          rule: 'Financial Separation of Duties',
          title: 'Requester cannot approve own purchase',
          desc: 'Anti-Self-Approval Rule strictly blocks technician from approving own PR (HTTP 403); independent procurement approval required.',
          inspectorTitle: 'Anti-Self-Approval Guardrail',
          logs: [
            '> decide call by USR033 (Technician): action=APPROVE',
            '> SECURITY EXCEPTION: requesterId === deciderId',
            '> REJECT: HTTP 403 SELF_APPROVAL_FORBIDDEN',
            '> Routed to independent Procurement Manager Dinesh I (USR030) -> APPROVED',
            '> INVARIANT VERIFIED: physical stock remains unchanged at 2',
          ],
        },
        {
          step: 3,
          moment: 'MOMENT 03',
          rule: 'Receiving Dock & Auto-Resumption',
          title: 'Stock Receipt Triggers Automatic Resumption',
          desc: 'Physical receipt recorded on dock; system increments stock, auto-reserves part, and resumes work order to IN_PROGRESS.',
          inspectorTitle: 'Warehouse Ledger & Event Dispatch',
          logs: [
            '> POST /api/procurement/receipts (qty: 2, condition: ACCEPTED)',
            '> inventory item ITM002 quantityOnHand incremented to 4',
            '> stock reservation auto-created for waiting work order',
            '> work order transitioned BLOCKED -> IN_PROGRESS; notification sent to technician',
          ],
        },
      ],
    },
  };

  const currentScenario = scenarioData[activeScenario];
  const activeStepData =
    currentScenario.steps.find((s) => s.step === activeStep) || currentScenario.steps[0];

  return (
    <div className="bg-[#0A0A0A] text-[#F2EFE9] antialiased selection:bg-[#C5F135] selection:text-[#0A0A0A] relative overflow-x-hidden w-full font-sans">
      {/* 2XL Side Dossier Badges */}
      <div className="fixed top-20 left-0 bottom-0 w-8 z-40 pointer-events-none hidden 2xl:flex flex-col justify-between items-center py-8 border-r border-[#2A2A2A] bg-[#131313]">
        <span className="font-mono text-[10px] text-brandLime tracking-widest writing-vertical uppercase">
          CAMPUSOPS // ARCHITECTURAL DOSSIER
        </span>
        <div className="h-24 w-[1px] bg-brandLime" />
        <span className="font-mono text-[10px] text-on-surface-variant tracking-widest writing-vertical">
          OVERCLOCK &apos;26
        </span>
      </div>

      <div className="fixed top-20 right-0 bottom-0 w-8 z-40 pointer-events-none hidden 2xl:flex flex-col justify-between items-center py-8 border-l border-[#2A2A2A] bg-[#131313]">
        <span className="font-mono text-[10px] text-on-surface-variant tracking-widest writing-vertical uppercase">
          TEAM LOWKEY CODERS // PS-2
        </span>
        <div className="h-24 w-[1px] bg-[#2A2A2A]" />
        <span className="font-mono text-[10px] text-brandLime tracking-widest writing-vertical uppercase">
          RIGOROUS GOVERNANCE
        </span>
      </div>

      {/* Main Sticky Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#131313] border-b border-[#2A2A2A]">
        <div className="max-w-[1720px] mx-auto px-4 md:px-6 lg:px-16 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-6">
            <a href="#overview" className="flex items-center gap-3 group select-none shrink-0">
              <div className="w-8 h-8 bg-brandLime flex items-center justify-center font-display font-bold text-brandDark text-base tracking-tighter border border-brandDark shadow-[2px_2px_0px_#0A0A0A]">
                CO
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg sm:text-xl tracking-wider text-brandCream uppercase group-hover:text-brandLime transition-colors">
                  CAMPUS<span className="text-brandLime">OPS</span>
                </span>
                <span className="font-mono text-[8px] sm:text-[9px] text-brandLime tracking-widest uppercase mt-0.5">
                  OPERATIONS PLATFORM
                </span>
              </div>
            </a>
            <div className="hidden xl:flex items-center pl-6 border-l border-[#2A2A2A] gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brandLime animate-pulse" />
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                CORE TELEMETRY: OPERATIONAL
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
            <a
              href="#overview"
              className="font-mono text-xs tracking-wider uppercase text-brandCream hover:text-brandLime px-2.5 py-1.5 border border-brandLime bg-[#1C1C1C] flex items-center gap-1.5"
            >
              <span className="text-brandLime font-mono text-[10px] px-1 py-0.5 bg-[#0A0A0A] border border-brandLime font-bold">
                01
              </span>
              <span>OVERVIEW</span>
            </a>
            <a
              href="#who-it-helps"
              className="font-mono text-xs tracking-wider uppercase text-on-surface-variant hover:text-brandCream px-2.5 py-1.5 border border-[#2A2A2A] hover:border-brandCream bg-[#131313] flex items-center gap-1.5 transition-colors"
            >
              <span className="font-mono text-[10px] px-1 py-0.5 bg-[#1C1C1C] border border-[#2A2A2A] font-bold">
                02
              </span>
              <span>WHO IT HELPS</span>
            </a>
            <a
              href="#how-it-works"
              className="font-mono text-xs tracking-wider uppercase text-on-surface-variant hover:text-brandCream px-2.5 py-1.5 border border-[#2A2A2A] hover:border-brandCream bg-[#131313] flex items-center gap-1.5 transition-colors"
            >
              <span className="font-mono text-[10px] px-1 py-0.5 bg-[#1C1C1C] border border-[#2A2A2A] font-bold">
                03
              </span>
              <span>HOW IT WORKS</span>
            </a>
            <a
              href="#capabilities"
              className="font-mono text-xs tracking-wider uppercase text-on-surface-variant hover:text-brandCream px-2.5 py-1.5 border border-[#2A2A2A] hover:border-brandCream bg-[#131313] flex items-center gap-1.5 transition-colors"
            >
              <span className="font-mono text-[10px] px-1 py-0.5 bg-[#1C1C1C] border border-[#2A2A2A] font-bold">
                04
              </span>
              <span>CAPABILITIES</span>
            </a>
            <a
              href="#simulation"
              className="font-mono text-xs tracking-wider uppercase text-on-surface-variant hover:text-brandCream px-2.5 py-1.5 border border-[#2A2A2A] hover:border-brandCream bg-[#131313] flex items-center gap-1.5 transition-colors"
            >
              <span className="font-mono text-[10px] px-1 py-0.5 bg-[#1C1C1C] border border-[#2A2A2A] font-bold">
                05
              </span>
              <span>SIMULATION</span>
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSignIn}
              className="inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-brandDark bg-brandLime hover:bg-brandCream transition-all border border-brandDark shadow-[3px_3px_0px_#2A2A2A] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>ENTER CONSOLE</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-brandCream border border-[#2A2A2A] bg-[#1C1C1C]"
              aria-label="Toggle mobile menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#2A2A2A] bg-[#131313] px-4 py-4 space-y-2 font-mono text-xs uppercase tracking-wider">
            <a
              href="#overview"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 border border-brandLime bg-[#1C1C1C] text-brandLime"
            >
              01 OVERVIEW
            </a>
            <a
              href="#who-it-helps"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 border border-[#2A2A2A] text-brandCream"
            >
              02 WHO IT HELPS
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 border border-[#2A2A2A] text-brandCream"
            >
              03 HOW IT WORKS
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 border border-[#2A2A2A] text-brandCream"
            >
              04 CAPABILITIES
            </a>
            <a
              href="#simulation"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 border border-[#2A2A2A] text-brandCream"
            >
              05 SIMULATION
            </a>
            <button
              type="button"
              onClick={handleSignIn}
              className="w-full text-center py-2.5 bg-brandLime text-brandDark font-bold mt-2 border border-brandDark"
            >
              SIGN IN TO CONSOLE →
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="pt-16 md:pt-20 w-full overflow-x-hidden">
        <section
          id="overview"
          className="relative min-h-[90vh] flex flex-col justify-center border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-16 py-12 lg:py-20 crosshair-grid"
        >
          <div className="max-w-[1720px] w-full mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-6 flex flex-col items-start gap-6 sm:gap-8">
                <div className="inline-flex items-center gap-2 border border-brandLime bg-[#1C1C1C] px-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse" />
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-brandLime font-bold">
                    INTELLIGENT CAMPUS OPERATIONS PLATFORM
                  </span>
                </div>

                <h1 className="font-display text-5xl sm:text-6xl md:text-7xl xl:text-8xl uppercase tracking-tight leading-[0.95] text-brandCream">
                  ONE<br />
                  PLATFORM<br />
                  TO<br />
                  <span className="text-brandLime">RUN YOUR</span><br />
                  <span className="text-brandLime">CAMPUS.</span>
                </h1>

                <p className="font-sans text-lg sm:text-xl text-brandCream max-w-xl font-normal leading-relaxed">
                  Synchronizing facilities, academic venues, and emergency response across the entire
                  collegiate ecosystem. Real-time deterministic dispatch engine routing incidents with verified
                  telemetry.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="px-8 py-4 sm:px-10 sm:py-5 bg-brandLime text-brandDark font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-brandCream transition-all border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <span>LAUNCH OPERATION CONSOLE</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>

                  <a
                    href="#simulation"
                    className="px-6 py-4 bg-[#141414] hover:bg-[#1C1C1C] text-brandCream border border-[#2A2A2A] font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>INTERACTIVE BENCHMARK</span>
                    <span className="material-symbols-outlined text-base">tune</span>
                  </a>
                </div>
              </div>

              {/* Hero Graphic / 3D Telemetry Mockup */}
              <div className="lg:col-span-6 flex justify-center items-center">
                <div className="relative w-full max-w-xl bg-brandCream border-2 border-brandDark shadow-[12px_12px_0px_#C5F135] p-6 lg:p-8 text-brandDark">
                  <div className="flex items-center justify-between pb-4 border-b-2 border-brandDark/20 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-brandLime border border-brandDark inline-block" />
                      <span className="font-mono text-xs uppercase font-bold tracking-wider text-brandDark">
                        SYSTEM ARCHITECTURE // LOCAL-FIRST
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold bg-brandDark text-brandCream px-2 py-0.5">
                      100% OPERATIONAL
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-white border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl text-brandDark">database</span>
                        <div>
                          <div className="font-display font-bold text-base uppercase">SQLite Engine</div>
                          <div className="font-mono text-[11px] text-neutral-600">34 Relational Tables • 1,042 Seed Records</div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-brandDark bg-brandLime px-2 py-0.5 border border-brandDark">
                        VERIFIED
                      </span>
                    </div>

                    <div className="p-4 bg-white border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl text-brandDark">shield_person</span>
                        <div>
                          <div className="font-display font-bold text-base uppercase">Backend RBAC Matrix</div>
                          <div className="font-mono text-[11px] text-neutral-600">7 Role Experiences • bcrypt Cost 12</div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-brandDark bg-brandLime px-2 py-0.5 border border-brandDark">
                        ENFORCED
                      </span>
                    </div>

                    <div className="p-4 bg-white border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl text-brandDark">rule</span>
                        <div>
                          <div className="font-display font-bold text-base uppercase">Deterministic Rules</div>
                          <div className="font-mono text-[11px] text-neutral-600">Anti-Self-Approval • Staff Leave Exclusion</div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-brandDark bg-brandLime px-2 py-0.5 border border-brandDark">
                        ACTIVE
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-brandDark/20 flex items-center justify-between font-mono text-xs">
                    <span className="text-neutral-700 font-bold">VITEST AUTOMATED SUITE</span>
                    <span className="text-brandDark font-black text-sm">63 / 63 TESTS PASSING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Who It Helps */}
        <section id="who-it-helps" className="w-full bg-brandCream text-brandDark py-16 sm:py-24 px-4 sm:px-6 lg:px-16 crosshair-grid-light">
          <div className="max-w-[1720px] mx-auto flex flex-col gap-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-2 border-brandDark pb-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-brandDark text-brandCream px-3 py-1 mb-3">
                  <span className="w-1.5 h-1.5 bg-brandLime" />
                  <span className="font-mono text-[11px] uppercase tracking-widest">
                    STAKEHOLDER ROLE MATRIX
                  </span>
                </div>
                <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight text-brandDark">
                  WHO IT HELPS
                </h2>
                <p className="font-sans text-base sm:text-lg text-[#2A2A2A] mt-2 font-medium">
                  Tailored visibility and zero-friction operational workflows for all seven campus personas.
                </p>
              </div>
              <div className="font-mono text-xs text-brandDark font-bold uppercase tracking-widest">
                7 ROLES • 1 UNIFIED PLATFORM
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  id: '01',
                  role: 'Students',
                  tag: 'INTAKE NODE',
                  desc: 'Report issues in seconds with fast QR scan lookup. Instant offline AI triage classification.',
                  metric: 'SUB-SECOND QR CAPTURE',
                  icon: 'school',
                },
                {
                  id: '02',
                  role: 'Faculty',
                  tag: 'CONTINUITY GUARANTEE',
                  desc: 'Stay informed on room readiness, emergency outage advisories, and immediate exam hall relocations.',
                  metric: 'TIMETABLE SYNC',
                  icon: 'co_present',
                },
                {
                  id: '03',
                  role: 'Technicians',
                  tag: 'DIRECT DISPATCH',
                  desc: 'Receive eligible work orders, check parts availability, transition status, and track shifts.',
                  metric: 'WORK ORDER LIFECYCLE',
                  icon: 'build',
                },
                {
                  id: '04',
                  role: 'Department Managers',
                  tag: 'RESOURCE ALLOCATION',
                  desc: 'Oversee department incidents and authorize 1-click room relocations with automated faculty notifications.',
                  metric: '1-CLICK RELOCATION',
                  icon: 'meeting_room',
                },
                {
                  id: '05',
                  role: 'Facilities Admin',
                  tag: 'PLANT INFRASTRUCTURE',
                  desc: 'Triage campus incidents, check technician leave eligibility, and dispatch available crews.',
                  metric: 'LEAVE-AWARE DISPATCH',
                  icon: 'domain',
                },
                {
                  id: '06',
                  role: 'Procurement',
                  tag: 'FISCAL GOVERNANCE',
                  desc: 'Review purchase requests with enforced separation of duties and physical receipt verification.',
                  metric: 'ANTI-SELF-APPROVAL',
                  icon: 'shopping_cart_checkout',
                },
                {
                  id: '07',
                  role: 'System Admin',
                  tag: 'SECURITY & AUDIT',
                  desc: 'Full visibility over users, roles, SQLite database health diagnostics, and tamper-evident audit logs.',
                  metric: 'IMMUTABLE AUDIT TRAIL',
                  icon: 'shield',
                },
                {
                  id: '08',
                  role: 'Campus Leadership',
                  tag: 'OPERATIONAL COMMAND',
                  desc: 'SLA risk indicators, compliance percentages, and campus-wide facility telemetry.',
                  metric: 'SLA COMPLIANCE ENGINE',
                  icon: 'insights',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="bg-brandCream border-2 border-brandDark p-6 flex flex-col justify-between shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0A0A0A] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <span className="font-display text-4xl text-[#3A3A3A] font-bold">{item.id}</span>
                      <div className="w-10 h-10 bg-brandDark text-brandLime flex items-center justify-center rounded">
                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] uppercase text-neutral-600 tracking-wider mb-1">
                      {item.tag}
                    </div>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-brandDark mb-2 font-bold">
                      {item.role}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-[#2A2A2A] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t-2 border-brandDark/20 flex items-center justify-between font-mono text-[11px] font-bold">
                    <span>{item.metric}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section id="how-it-works" className="w-full bg-brandDark text-brandCream py-16 sm:py-24 px-4 sm:px-6 lg:px-16 crosshair-grid border-b border-[#2A2A2A]">
          <div className="max-w-[1720px] mx-auto flex flex-col gap-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#2A2A2A] pb-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-brandLime" />
                  <span className="font-mono text-xs uppercase tracking-widest text-brandLime">
                    OPERATIONAL TIMELINE SPECIFICATION
                  </span>
                </div>
                <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight text-brandCream mt-3 mb-2">
                  HOW IT WORKS
                </h2>
                <p className="font-sans text-base sm:text-lg text-on-surface-variant max-w-2xl">
                  Four milestone-driven phases from fault discovery to verified closure.
                </p>
              </div>
              <div className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
                DETERMINISTIC // ZERO GUESSWORK
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  num: '01',
                  phase: 'PHASE I',
                  title: 'Report',
                  desc: 'Anyone on campus submits an issue in seconds with exact room tagging, QR equipment scan, and context.',
                  badge: 'FAST-PATH INTAKE',
                  icon: 'qr_code_scanner',
                  limeBorder: true,
                },
                {
                  num: '02',
                  phase: 'PHASE II',
                  title: 'Understand',
                  desc: 'Deterministic AI triage analyzes urgency, hazard severity, and academic schedules to categorize and prioritize.',
                  badge: 'OFFLINE TRIAGE',
                  icon: 'psychology',
                  limeBorder: false,
                },
                {
                  num: '03',
                  phase: 'PHASE III',
                  title: 'Coordinate',
                  desc: 'Rule engine validates technician skills, shift availability, approved leave, and inventory stocks in parallel.',
                  badge: 'ROSTER & PARTS SYNC',
                  icon: 'hub',
                  limeBorder: true,
                },
                {
                  num: '04',
                  phase: 'PHASE IV',
                  title: 'Resolve',
                  desc: 'Work verified on site, closing the loop with automated alerts to affected faculty and room schedulers.',
                  badge: 'VERIFIED CLOSURE',
                  icon: 'verified',
                  limeBorder: false,
                },
              ].map((p) => (
                <div
                  key={p.num}
                  className={`bg-[#131313] border p-6 flex flex-col justify-between min-h-[340px] shadow-[3px_3px_0px_#0A0A0A] ${
                    p.limeBorder ? 'border-t-4 border-t-brandLime border-[#2A2A2A]' : 'border-t-4 border-t-white border-[#2A2A2A]'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start">
                      <span className={`font-display text-7xl font-bold leading-none ${p.limeBorder ? 'text-brandLime' : 'text-brandCream'}`}>
                        {p.num}
                      </span>
                      <span className="font-mono text-[11px] text-on-surface-variant uppercase">{p.phase}</span>
                    </div>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-brandCream mt-4 mb-2 font-bold">
                      {p.title}
                    </h3>
                    <p className="font-sans text-sm text-neutral-300 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-[#2A2A2A] flex items-center gap-2 text-brandLime font-mono text-xs font-bold">
                    <span className="material-symbols-outlined text-base">{p.icon}</span>
                    <span>{p.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Interactive Operations Testbench */}
        <section id="simulation" className="w-full bg-[#0A0A0A] text-brandCream py-16 sm:py-24 px-4 sm:px-6 lg:px-16 crosshair-grid border-b border-[#2A2A2A]">
          <div className="max-w-[1720px] mx-auto flex flex-col gap-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#2A2A2A] pb-8">
              <div>
                <div className="inline-flex items-center gap-2 border border-brandLime bg-[#1C1C1C] px-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse" />
                  <span className="font-mono text-xs uppercase tracking-widest text-brandLime font-bold">
                    INTERACTIVE REASONING TESTBENCH
                  </span>
                </div>
                <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight text-brandCream mt-3 mb-2">
                  OPERATIONS IN ACTION
                </h2>
                <p className="font-sans text-base sm:text-lg text-on-surface-variant">
                  Interactive Rule Enforcement Engine: Experience how CampusOps evaluates hackathon scenarios in real time.
                </p>
              </div>

              {/* Scenario Tab Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-1 bg-[#131313] border border-[#2A2A2A] gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveScenario(1);
                    setActiveStep(1);
                  }}
                  className={`px-5 py-2.5 font-display text-xs uppercase tracking-wider font-bold transition-colors ${
                    activeScenario === 1
                      ? 'bg-brandLime text-brandDark border border-brandLime'
                      : 'text-on-surface-variant hover:text-brandCream bg-[#131313]'
                  }`}
                >
                  Scenario 1: B-204 Electrical Exam Outage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveScenario(2);
                    setActiveStep(1);
                  }}
                  className={`px-5 py-2.5 font-display text-xs uppercase tracking-wider font-bold transition-colors ${
                    activeScenario === 2
                      ? 'bg-brandLime text-brandDark border border-brandLime'
                      : 'text-on-surface-variant hover:text-brandCream bg-[#131313]'
                  }`}
                >
                  Scenario 2: C-Wing Wi-Fi Parts Shortage
                </button>
              </div>
            </div>

            {/* Testbench Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Rule Cards */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {currentScenario.steps.map((st) => {
                  const isSelected = st.step === activeStep;
                  return (
                    <div
                      key={st.step}
                      onClick={() => setActiveStep(st.step)}
                      className={`p-6 bg-[#131313] transition-all cursor-pointer border ${
                        isSelected
                          ? 'border-brandLime shadow-[4px_4px_0px_#C5F135]'
                          : 'border-[#2A2A2A] hover:border-brandCream'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-mono text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-brandLime' : 'text-neutral-400'}`}>
                          RULE ENFORCEMENT • {st.moment}
                        </span>
                        <span className="px-2 py-0.5 border border-[#2A2A2A] bg-[#1C1C1C] text-neutral-300 font-mono text-[10px] uppercase">
                          {st.rule}
                        </span>
                      </div>
                      <h3 className="font-display text-2xl uppercase text-brandCream tracking-wide font-bold">
                        {st.title}
                      </h3>
                      <p className="font-sans text-sm text-neutral-300 mt-2 leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Execution Inspector */}
              <div className="lg:col-span-5 bg-[#131313] border-2 border-brandDark shadow-[6px_6px_0px_#2A2A2A] p-6 lg:p-8 relative">
                <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-brandLime text-lg">terminal</span>
                    <span className="font-mono text-xs uppercase tracking-widest text-brandCream font-bold">
                      EXECUTION INSPECTOR
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-brandLime bg-[#1C1C1C] px-2 py-0.5 border border-brandLime">
                    ENGINE v1.0.0
                  </span>
                </div>

                <div className="py-6 flex flex-col gap-5">
                  <div>
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                      CURRENT EVALUATED DECISION
                    </span>
                    <div className="font-display text-2xl uppercase text-brandCream font-bold mt-1">
                      {activeStepData.inspectorTitle}
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-4 font-mono text-xs space-y-2 text-brandCream min-h-[160px] overflow-x-auto">
                    {activeStepData.logs.map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.includes('REJECT')
                            ? 'text-[#FF5555] font-bold bg-[#FF5555]/10 px-1 py-0.5'
                            : line.includes('SUCCESS') || line.includes('VERIFIED')
                            ? 'text-brandLime font-bold bg-brandLime/10 px-1 py-0.5'
                            : line.includes('[SUGGESTED]')
                            ? 'text-brandLime font-bold'
                            : 'text-neutral-400'
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#1C1C1C] border border-[#2A2A2A]">
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                        MANUAL OVERRIDE
                      </span>
                      <p className="font-display text-2xl text-brandCream font-bold mt-1">FORBIDDEN</p>
                    </div>
                    <div className="p-4 bg-[#1C1C1C] border border-[#2A2A2A]">
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                        RULE COMPLIANCE
                      </span>
                      <p className="font-display text-2xl text-brandLime font-bold mt-1">100.0%</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-mono text-on-surface-variant">
                  <span>Cryptographically logged</span>
                  <div className="flex items-center gap-1 text-brandLime font-bold">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>TAMPER_PROOF_AUDIT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full bg-[#0A0A0A] text-brandCream py-20 px-4 sm:px-6 lg:px-16 border-t border-[#2A2A2A] text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
            <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight text-brandCream leading-tight font-bold">
              SEE YOUR CAMPUS RUN AS<br />
              <span className="text-brandLime bg-[#1C1C1C] border border-[#2A2A2A] px-4 py-1 inline-block mt-2">
                ONE OPERATION.
              </span>
            </h2>
            <p className="font-sans text-base sm:text-lg text-neutral-300 max-w-xl">
              Log into the CampusOps console with any of the 7 pre-configured role personas to experience
              the complete operational platform.
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              className="px-10 py-5 bg-brandLime text-brandDark font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-brandCream transition-all border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer mt-4"
            >
              <span>ENTER CAMPUSOPS PORTAL</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0A0A0A] border-t border-[#2A2A2A] py-10 px-4 sm:px-6 lg:px-16 text-xs font-mono text-neutral-400">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-brandLime text-brandDark font-display font-bold flex items-center justify-center text-xs">
              CO
            </div>
            <span className="font-display text-sm uppercase text-brandCream font-bold">CAMPUSOPS</span>
            <span>•</span>
            <span className="text-brandLime">HACKATHON PROTOTYPE // FICTIONAL DATASET</span>
          </div>
          <div>Team LOWKEY CODERS | Problem Statement 2 | Overclock&apos;26 Hackathon</div>
        </div>
      </footer>
    </div>
  );
};
