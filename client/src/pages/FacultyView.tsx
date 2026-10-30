import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { NavItem } from '../components/common/AppSidebar';
import { MetricCard } from '../components/common/MetricCard';
import { ActionModal } from '../components/common/ActionModal';
import {
  Calendar,
  AlertTriangle,
  Plus,
  CheckCircle2,
  MapPin,
  Flame,
  ArrowUpRight,
} from 'lucide-react';

export const FacultyView: React.FC = () => {
  const { user } = useAuth();

  const [activeNav, setActiveNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [outages, setOutages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal for quick report
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);

  // Relocation detail modal
  const [relocationModalOpen, setRelocationModalOpen] = useState(false);

  const fetchScheduleAndOutages = async () => {
    setLoading(true);
    try {
      const bookingsRes = await apiFetch(
        '/api/rooms/conflicts?roomId=RM-B-204&targetDate=2026-11-03'
      );
      if (bookingsRes.success) {
        setBookings(bookingsRes.data?.impactedBookings || []);
        setOutages(bookingsRes.data?.activeOutages || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleAndOutages();
  }, []);

  const handleQuickReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setSubmitting(true);
    setComplaintSuccess(null);

    const res = await apiFetch('/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ message: complaintText }),
    });

    if (res.success) {
      setComplaintSuccess(`Report submitted. Incident Reference: ${res.data.incident.reference}`);
      setComplaintText('');
      fetchScheduleAndOutages();
      setTimeout(() => {
        setReportModalOpen(false);
      }, 2000);
    } else {
      alert(res.error?.message || 'Failed to submit report');
    }
    setSubmitting(false);
  };

  const navItems: NavItem[] = [
    { id: 'home', label: 'Overview', icon: 'home' },
    { id: 'timetable', label: 'My Timetable', icon: 'calendar_today' },
    {
      id: 'report',
      label: 'Report Issue',
      icon: 'report_problem',
      badge: '+',
      badgeColor: 'lime',
    },
    { id: 'rooms', label: 'Room Requests', icon: 'meeting_room' },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'notifications',
      badge: outages.length > 0 ? outages.length.toString() : '1',
      badgeColor: 'lime',
    },
    { id: 'help', label: 'Help & Ops FAQ', icon: 'help' },
  ];

  const handleNavSelect = (id: string) => {
    if (id === 'report') {
      setReportModalOpen(true);
    } else {
      setActiveNav(id);
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeNavId={activeNav}
      onNavSelect={handleNavSelect}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="flex flex-col gap-6">
        {/* Top Meta Ribbon & Identity Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#2A2A2A]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">
              <span className="text-brandLime font-bold">CAMPUSOPS</span>
              <span className="text-neutral-600">/</span>
              <span className="text-brandCream">FACULTY CONSOLE</span>
              <span className="px-2 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-brandLime font-bold text-[10px]">
                ROLE: FACULTY
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-brandCream uppercase font-bold tracking-tight">
                {user?.name || 'Dr. Kavitha Menon'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-neutral-400 font-mono text-xs">
                {user?.departmentName || 'Computer Science & Engineering'} • RM 412
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1C1C] text-brandLime font-mono text-xs border border-brandLime/30">
                <span className="w-1.5 h-1.5 rounded-full bg-brandLime animate-pulse" />
                ACTIVE SESSION
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="inline-flex items-center gap-2 bg-brandLime hover:bg-[#b2dc26] text-brandDark px-5 py-2.5 rounded-xl font-display text-sm uppercase font-bold tracking-wider border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0A0A0A] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Report Room Issue →</span>
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="rounded-2xl border-2 border-brandDark bg-brandCream p-6 lg:p-8 shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between gap-6 relative overflow-hidden text-brandDark">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-brandLime/25 blur-3xl pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-brandDark/10 pb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-2.5 py-1 rounded-md bg-brandLime text-brandDark text-xs font-mono font-bold uppercase tracking-wider border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A]">
                // FACULTY PORTAL
              </span>
              <span className="px-2.5 py-1 rounded-md bg-brandDark text-brandCream text-xs font-mono font-medium">
                {user?.name || 'DR. KAVITHA MENON'} • RM 412
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-brandDark bg-brandDark/5 px-2.5 py-1 rounded-md border-2 border-brandDark">
              <span className="w-2 h-2 rounded-full bg-brandLime border border-brandDark" />
              ACTIVE SESSION: WEDNESDAY TERM 2
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
            <div className="flex flex-col gap-2 max-w-2xl">
              <h1 className="font-display uppercase font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-brandDark">
                FOCUS ON TEACHING.
              </h1>
              <p className="font-body text-sm sm:text-base leading-relaxed mt-1 font-medium text-[#1C1C1C] max-w-xl">
                Classroom readiness verified and automated facility support active for your upcoming
                sessions across campus.
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl h-12 px-6 bg-brandLime hover:bg-[#b2dc26] text-brandDark border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] font-bold font-display uppercase tracking-wider text-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>REPORT ROOM ISSUE →</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Today's Classes"
            subtitle="Scheduled Lectures"
            value="03"
            variant="cream"
            badge="ON TRACK"
            progressPercent={100}
            metaText="3 Scheduled"
            icon="school"
          />
          <MetricCard
            title="Room Issues"
            subtitle="Compromised Facilities"
            value="01"
            variant="lime"
            badge="ACTION NEEDED"
            progressPercent={65}
            metaText="Room B-204"
            icon="warning"
          />
          <MetricCard
            title="Pending Requests"
            subtitle="Department Workflow"
            value="01"
            variant="cream"
            badge="REVIEWING"
            progressPercent={50}
            metaText="Lab Extension"
            icon="pending_actions"
          />
        </div>

        {/* Urgent Room Disruption Alert Component */}
        <div className="rounded-xl border-2 border-brandDark bg-brandCream p-5 lg:p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden text-brandDark">
          <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-brandLime border-r-2 border-brandDark" />
          <div className="flex items-start gap-4 pl-2">
            <div className="w-12 h-12 rounded-xl bg-brandDark flex items-center justify-center shrink-0 border-2 border-brandDark text-brandLime shadow-[2px_2px_0px_#0A0A0A]">
              <Flame className="w-6 h-6 text-brandLime" />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brandLime text-brandDark border-2 border-brandDark shadow-[1px_1px_0px_#0A0A0A]">
                  URGENT DISRUPTION
                </span>
                <h2 className="font-display uppercase font-bold text-xl tracking-wide text-brandDark">
                  ROOM B-204 COMPROMISED (ELECTRICAL FAULT)
                </h2>
              </div>
              <p className="font-body text-sm mt-1.5 leading-relaxed max-w-2xl font-medium text-[#1C1C1C]">
                Power failure &amp; sparking switchboard detected in Room B-204 before the upcoming
                CSAI semester exam / algorithm lecture. Department Manager has authorized relocation.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 bg-brandDark px-2.5 py-1 rounded-md border border-brandDark text-brandCream font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brandLime" />
                  Recommended Alternate: RM-B-206 (Capacity: 80, Seminar Hall)
                </span>
                <span className="text-brandDark font-bold flex items-center gap-1 bg-brandLime px-2.5 py-1 rounded-md border-2 border-brandDark">
                  <span className="w-1.5 h-1.5 rounded-full bg-brandDark" />
                  Verified Power &amp; AV Ready
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 pl-2 lg:pl-0">
            <button
              type="button"
              onClick={() => setRelocationModalOpen(true)}
              className="w-full lg:w-auto flex items-center justify-center gap-2 rounded-xl h-11 px-5 bg-brandLime hover:bg-[#b2dc26] text-brandDark border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] text-xs font-bold font-display uppercase tracking-wider transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
            >
              <span>VIEW RELOCATION STATUS →</span>
            </button>
          </div>
        </div>

        {/* Two-Column Workspace: Teaching Timetable & Bulletin Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Timetable */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-[#2A2A2A] pb-3">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-6 h-6 text-brandLime" />
                <h2 className="text-brandCream font-display uppercase text-2xl tracking-wider font-bold">
                  TODAY&apos;S TIMETABLE
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant font-mono tracking-wide bg-[#1C1C1C] px-3 py-1 rounded-md border border-[#2A2A2A]">
                WEDNESDAY • {bookings.length > 0 ? bookings.length : 3} SESSIONS
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs font-mono text-neutral-400">
                Synchronizing live timetable and outage advisories...
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
              {/* Session 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl bg-brandCream border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] transition-all gap-4 text-brandDark">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-20 font-mono font-bold text-base text-brandCream py-2 px-3 rounded-lg bg-[#2A2A2A] text-center border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] shrink-0">
                    08:30
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-brandDark">
                        CS-101 Intro to Computing
                      </span>
                      <span className="text-[10px] font-mono text-brandDark bg-neutral-200 px-2 py-0.5 rounded font-bold border border-brandDark/40">
                        LECTURE
                      </span>
                    </div>
                    <div className="text-xs text-[#2A2A2A] flex flex-wrap items-center gap-2 mt-1.5 font-medium font-body">
                      <span className="flex items-center gap-1 text-brandDark font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                        Turing 101
                      </span>
                      <span>•</span>
                      <span className="font-mono text-brandDark font-bold">85 Enrolled</span>
                      <span>•</span>
                      <span className="text-[#2A2A2A] font-mono">AV &amp; Microphones Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brandDark text-brandCream border-2 border-brandDark font-mono">
                    <span className="w-2 h-2 rounded-full bg-brandLime" />
                    Operational / Ready
                  </span>
                </div>
              </div>

              {/* Session 2: Compromised B-204 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl bg-brandCream border-2 border-brandDark border-l-[6px] border-l-brandLime shadow-[4px_4px_0px_#0A0A0A] transition-all gap-4 text-brandDark relative overflow-hidden">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-20 font-mono font-bold text-base text-brandDark bg-brandLime py-2 px-3 rounded-lg text-center border-2 border-brandDark shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                    10:15
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-brandDark">
                        CS-301 CSAI Semester Exam
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brandLime text-brandDark border-2 border-brandDark shadow-[1px_1px_0px_#0A0A0A]">
                        RELOCATION AUTHORIZED
                      </span>
                    </div>
                    <div className="text-xs text-[#2A2A2A] flex flex-wrap items-center gap-2 mt-1.5 font-medium font-body">
                      <span className="flex items-center gap-1 text-brandDark font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        Room B-204 → RM-B-206
                      </span>
                      <span>•</span>
                      <span className="font-mono text-brandDark font-bold">55 Enrolled</span>
                      <span>•</span>
                      <span className="text-brandDark font-mono font-semibold">
                        Lectern Circuit Failed
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setRelocationModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase bg-brandLime hover:bg-[#b2dc26] text-brandDark border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] cursor-pointer transition-transform"
                  >
                    <span>View Room Pass</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Session 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl bg-brandCream border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] transition-all gap-4 text-brandDark">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-20 font-mono font-bold text-base text-brandCream py-2 px-3 rounded-lg bg-[#2A2A2A] text-center border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] shrink-0">
                    14:00
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-brandDark">
                        CS-504 Distributed Systems
                      </span>
                      <span className="text-[10px] font-mono text-brandDark bg-neutral-200 px-2 py-0.5 rounded font-bold border border-brandDark/40">
                        LAB SESSION
                      </span>
                    </div>
                    <div className="text-xs text-[#2A2A2A] flex flex-wrap items-center gap-2 mt-1.5 font-medium font-body">
                      <span className="flex items-center gap-1 text-brandDark font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                        Lab 4B
                      </span>
                      <span>•</span>
                      <span className="font-mono text-brandDark font-bold">28 Enrolled</span>
                      <span>•</span>
                      <span className="text-[#2A2A2A] font-mono">Workstations Checked</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brandDark text-brandCream border-2 border-brandDark font-mono">
                    <span className="w-2 h-2 rounded-full bg-brandLime" />
                    Verified Ready
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Right Col: Bulletin Feed */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-[#2A2A2A] pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-brandCream font-display uppercase text-2xl tracking-wider font-bold">
                  BULLETIN FEED
                </h2>
              </div>
              <span className="text-xs text-brandLime font-mono font-bold tracking-wide">
                LIVE FEED
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-brandCream border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] flex flex-col gap-2 text-brandDark">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brandDark bg-brandLime px-2 py-0.5 rounded border-2 border-brandDark shadow-[1px_1px_0px_#0A0A0A]">
                    FACILITY ADVISORY
                  </span>
                  <span className="text-[11px] font-mono text-[#2A2A2A] font-bold">08:10 AM</span>
                </div>
                <h3 className="text-sm font-bold text-brandDark leading-snug">
                  B-Wing Electrical Subpanel Inspection
                </h3>
                <p className="text-xs text-[#1C1C1C] leading-relaxed font-medium font-body">
                  Electrical engineering teams dispatched to B-Wing riser 3. Power reset scheduled
                  between 10:00 - 11:30.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-brandCream border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] flex flex-col gap-2 text-brandDark">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brandCream bg-brandDark px-2 py-0.5 rounded border-2 border-brandDark">
                    ROOM AUTOMATION
                  </span>
                  <span className="text-[11px] font-mono text-[#2A2A2A] font-bold">Yesterday</span>
                </div>
                <h3 className="text-sm font-bold text-brandDark leading-snug">
                  Smart Mic Recalibration Completed
                </h3>
                <p className="text-xs text-[#1C1C1C] leading-relaxed font-medium font-body">
                  All seminar hall microphones in B-206 &amp; C-102 have been re-calibrated for hybrid
                  streaming.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Quick Facility Report */}
        <ActionModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          title="Rapid Classroom Issue Report"
          subtitle="FACULTY PRIORITY TRIAGE CHANNEL"
        >
          {complaintSuccess && (
            <div className="mb-4 bg-lime-100 border-2 border-brandDark text-brandDark font-mono text-xs rounded-lg p-3 flex items-start gap-2 shadow-[2px_2px_0px_#0A0A0A]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-700 mt-0.5" />
              <div>
                <span className="font-bold">SUCCESS:</span> {complaintSuccess}
              </div>
            </div>
          )}

          <form onSubmit={handleQuickReport} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-brandDark mb-1">
                MALFUNCTION DESCRIPTION / ROOM HAZARD
              </label>
              <textarea
                required
                rows={4}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Enter classroom malfunction details (e.g. 'Projector flickering and AC tripping circuit in B-204 during morning session')..."
                className="w-full bg-white border-2 border-brandDark rounded-lg p-3 text-xs font-body text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 border-2 border-brandDark font-mono text-xs font-bold uppercase rounded-lg hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-brandLime hover:bg-[#b2dc26] text-brandDark font-display font-bold px-6 py-2 rounded-lg text-sm uppercase tracking-wider border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'DISPATCHING...' : 'TRANSMIT REPORT →'}
              </button>
            </div>
          </form>
        </ActionModal>

        {/* Modal: Relocation Pass Details */}
        <ActionModal
          isOpen={relocationModalOpen}
          onClose={() => setRelocationModalOpen(false)}
          title="Emergency Classroom Relocation Authorization"
          subtitle="HACKATHON SCENARIO 1 RELOCATION PASS"
        >
          <div className="space-y-4 font-body text-brandDark">
            <div className="p-4 bg-brandLime border-2 border-brandDark rounded-xl shadow-[3px_3px_0px_#0A0A0A]">
              <div className="font-display text-lg uppercase font-bold text-brandDark">
                RELOCATION APPROVED: RM-B-206
              </div>
              <div className="font-mono text-xs text-neutral-800 mt-1">
                Authorized by Suresh Balan (Department Manager) · Conflict: BKG-EXAM (55 Students)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-white border-2 border-brandDark rounded-lg">
                <span className="text-neutral-500 block text-[10px]">ORIGINAL VENUE</span>
                <span className="font-bold text-brandDark text-sm">RM-B-204 (UNSAFE)</span>
                <span className="text-[10px] text-red-600 block mt-1">Electrical Spark Hazard</span>
              </div>
              <div className="p-3 bg-white border-2 border-brandDark rounded-lg">
                <span className="text-neutral-500 block text-[10px]">NEW ASSIGNED VENUE</span>
                <span className="font-bold text-brandDark text-sm">RM-B-206 (SEMINAR HALL)</span>
                <span className="text-[10px] text-green-700 block mt-1">
                  Capacity: 80 · Ready &amp; Unlocked
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed font-body">
              All 55 registered examinees have been notified via automated SMS &amp; Portal
              broadcast. Keycard and digital access credentials have been provisioned to Dr.
              Kavitha Menon for Room B-206.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRelocationModalOpen(false)}
                className="bg-brandDark text-brandLime font-mono text-xs font-bold uppercase px-4 py-2 rounded-lg border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A]"
              >
                Acknowledge Pass
              </button>
            </div>
          </div>
        </ActionModal>
      </div>
    </DashboardLayout>
  );
};
