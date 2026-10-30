import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { NavItem } from '../components/common/AppSidebar';
import { MetricCard } from '../components/common/MetricCard';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Send,
  Radio,
} from 'lucide-react';

export const DepartmentManagerView: React.FC = () => {
  const { user } = useAuth();

  const [activeNav, setActiveNav] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [impactedBooking, setImpactedBooking] = useState<any | null>(null);
  const [alternativeRooms, setAlternativeRooms] = useState<any[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<string>('RM-B-206');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  const fetchRelocationDetails = async () => {
    setLoading(true);
    try {
      const conflictRes = await apiFetch(
        '/api/rooms/conflicts?roomId=RM-B-204&targetDate=2026-11-03'
      );
      if (conflictRes.success && conflictRes.data?.impactedBookings?.length > 0) {
        const exam =
          conflictRes.data.impactedBookings.find((b: any) => b.id === 'BKG-EXAM') ||
          conflictRes.data.impactedBookings[0];
        setImpactedBooking(exam);

        const altRes = await apiFetch(`/api/rooms/alternatives?bookingId=${exam.id}`);
        if (altRes.success) {
          setAlternativeRooms(altRes.data?.alternatives || []);
          if (altRes.data?.alternatives?.length > 0) {
            setSelectedAlternative(altRes.data.alternatives[0].id);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelocationDetails();
  }, []);

  const handleAuthorizeRelocation = async () => {
    if (!impactedBooking || !selectedAlternative) return;
    setAuthorizing(true);
    setActionSuccess(null);

    const res = await apiFetch('/api/rooms/relocate', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: impactedBooking.id,
        newRoomId: selectedAlternative,
        justification:
          'Emergency electrical hazard in Room B-204. Relocated to ensure CSAI examination continuity.',
      }),
    });

    if (res.success) {
      setActionSuccess(
        `RELOCATION AUTHORIZED & DISPATCHED! Examination venue updated to ${selectedAlternative}. SMS & Portal alerts pushed to 55 examinees and Dr. Kavitha Menon. Room door locks disengaged.`
      );
      fetchRelocationDetails();
    } else {
      alert(res.error?.message || 'Relocation authorization failed');
    }
    setAuthorizing(false);
  };

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Department Overview', icon: 'dashboard' },
    { id: 'issues', label: 'Department Issues', icon: 'warning', badge: '2 Active' },
    { id: 'timetable', label: 'Rooms & Timetable', icon: 'calendar_month' },
    {
      id: 'approvals',
      label: 'Relocation Approvals',
      icon: 'rule',
      badge: '1 Pending',
      badgeColor: 'lime',
    },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      activeNavId={activeNav}
      onNavSelect={setActiveNav}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="flex flex-col gap-6">
        {/* Top Header Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#2A2A2A]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">
              <span>CAMPUSOPS</span>
              <span className="text-neutral-600">/</span>
              <span className="text-brandLime">DEPARTMENT OPERATIONS &amp; GOVERNANCE</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-brandCream uppercase font-bold tracking-tight">
                {user?.name || 'Prof. Suresh Balan'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-neutral-400 font-mono text-xs">
                DEPARTMENT HEAD • RM 401 (CSE)
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1C1C] text-brandLime font-mono text-xs border border-brandLime/30">
                <span className="w-1.5 h-1.5 rounded-full bg-brandLime animate-pulse" />
                ACADEMIC CONTINUITY LOCK
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchRelocationDetails}
              className="inline-flex items-center gap-2 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-brandCream border-2 border-brandDark px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#0A0A0A] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brandLime" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Hero Editorial Banner */}
        <div className="bg-[#1C1C1C] border-2 border-[#2A2A2A] rounded-2xl p-6 md:p-8 flex flex-col justify-between gap-6 shadow-[4px_4px_0px_#0A0A0A]">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 self-start bg-[#131313] border border-[#2A2A2A] px-3 py-1 rounded-full text-brandLime font-mono text-xs uppercase tracking-wider font-bold">
              <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse" />
              ACTIVE DISRUPTION MITIGATION
            </div>
            <h1 className="font-display text-3xl md:text-5xl uppercase tracking-tight text-brandCream leading-none font-bold mt-1">
              YOUR DEPARTMENT.{' '}
              <span className="underline decoration-brandLime decoration-4 underline-offset-4">
                ON TRACK.
              </span>
            </h1>
            <p className="font-body text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed font-medium">
              Academic disruption mitigation, departmental resource oversight, and timetable
              continuity. Authorize emergency relocations with automated candidate scoring.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#2A2A2A] font-mono text-xs">
            <div className="flex items-center gap-2 bg-[#131313] border border-[#2A2A2A] px-3.5 py-1.5 rounded-lg">
              <span className="text-neutral-400 uppercase font-bold">BUILDING STATUS</span>
              <span className="text-brandCream font-bold">TURING COMPLEX &amp; LECTURE WINGS</span>
            </div>
            <div className="flex items-center gap-2 bg-[#131313] border border-[#2A2A2A] px-3.5 py-1.5 rounded-lg">
              <span className="text-neutral-400 uppercase font-bold">TIME WINDOW</span>
              <span className="text-brandLime font-bold">MORNING BLOCK [08:00 - 13:00]</span>
            </div>
          </div>
        </div>

        {/* 3 KPI Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Open Issues"
            subtitle="Department Complex"
            value="02"
            variant="cream"
            badge="1 CRITICAL"
            progressPercent={65}
            metaText="Active incidents in CS wings"
            icon="warning"
          />
          <MetricCard
            title="Affected Classes"
            subtitle="Academic Conflicts"
            value="01"
            variant="lime"
            badge="RELOCATION READY"
            progressPercent={100}
            metaText="CSAI Semester Examination"
            icon="school"
          />
          <MetricCard
            title="Pending Decisions"
            subtitle="Action Queue"
            value="01"
            variant="cream"
            badge="URGENT"
            progressPercent={80}
            metaText="RM-B-206 authorization"
            icon="gavel"
          />
        </div>

        {/* Confirmation Banner if Relocated */}
        {actionSuccess && (
          <div className="p-4 bg-brandLime text-brandDark border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-brandDark shrink-0" />
              <div>
                <p className="font-display text-base uppercase font-bold">
                  RELOCATION CONFIRMED &amp; DISPATCHED
                </p>
                <p className="font-body text-xs font-medium text-neutral-800">{actionSuccess}</p>
              </div>
            </div>
            <span className="font-mono text-xs uppercase bg-brandDark text-brandLime px-3 py-1 rounded-full font-bold">
              DISPATCHED 100%
            </span>
          </div>
        )}

        {/* Scenario 1 Relocation Action Card */}
        {loading ? (
          <div className="bg-brandCream border-2 border-brandDark rounded-xl p-8 text-center text-xs font-mono text-neutral-600 shadow-[4px_4px_0px_#0A0A0A]">
            Scanning room schedules &amp; capacity conflicts...
          </div>
        ) : (
          <div className="bg-brandCream text-brandDark border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] p-6 md:p-8 rounded-xl flex flex-col gap-6 w-full">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-brandDark animate-pulse" />
                <span className="bg-brandLime text-brandDark border border-brandDark px-2.5 py-0.5 rounded font-mono text-xs uppercase tracking-widest font-bold">
                  PENDING APPROVAL • ROOM RELOCATION REQUEST
                </span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl uppercase text-brandDark tracking-tight font-bold">
                CS-301 CSAI SEMESTER EXAM (ROOM B-204 → RM-B-206)
              </h2>
              <p className="font-body text-sm text-neutral-800 mt-1.5 leading-relaxed font-medium">
                Scheduled at 09:00 AM •{' '}
                <strong className="font-bold underline decoration-2 decoration-brandLime">
                  55 Registered Examinees
                </strong>{' '}
                • Disruption Cause: Critical power arc fault &amp; sparking switchboard in Room
                B-204.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end justify-center shrink-0 bg-white px-5 py-3 rounded-xl border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] font-mono">
              <span className="text-[10px] text-neutral-600 uppercase font-bold">
                DECISION WINDOW
              </span>
              <span className="text-xl font-bold text-brandDark mt-0.5">00:35:19</span>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-brandLime text-brandDark border border-brandDark font-mono text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wide">
                  RANK #1 CANDIDATE (SCORE: 265)
                </span>
                <select
                  value={selectedAlternative}
                  onChange={(e) => setSelectedAlternative(e.target.value)}
                  className="bg-white border-2 border-brandDark font-mono text-sm font-bold px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_#0A0A0A] text-brandDark"
                >
                  {alternativeRooms.length > 0 ? (
                    alternativeRooms.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.building?.name || 'Academic'} (Cap: {r.capacity})
                      </option>
                    ))
                  ) : (
                    <option value="RM-B-206">RM-B-206 - Seminar Hall (Cap: 80)</option>
                  )}
                </select>
                <span className="font-body text-xs text-neutral-600 font-semibold">
                  (B-Wing North Complex - Seminar Hall 2nd Floor)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-100 border-2 border-brandDark rounded-lg p-3.5 font-mono text-xs">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                    CAPACITY
                  </span>
                  <span className="font-bold text-brandDark block text-sm">80 Seats</span>
                  <span className="text-[10px] text-green-700 font-semibold">+25 Surplus</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                    TRANSIT DISTANCE
                  </span>
                  <span className="font-bold text-brandDark block text-sm">Same Floor (40m)</span>
                  <span className="text-[10px] text-neutral-600">+60 Floor Score</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                    AV RIG
                  </span>
                  <span className="font-bold text-brandDark block text-sm">Dual Mic + 4K</span>
                  <span className="text-[10px] text-green-700 font-semibold">Ready</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                    STATUS
                  </span>
                  <span className="font-bold text-brandDark block text-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-brandLime border border-brandDark" />
                    Unlocked
                  </span>
                  <span className="text-[10px] text-neutral-600">Zero Collisions</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={handleAuthorizeRelocation}
                disabled={authorizing}
                className="bg-brandLime hover:bg-[#b2dc26] text-brandDark font-display font-bold text-sm uppercase px-6 py-3 rounded-lg flex items-center justify-center gap-2 border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {authorizing ? 'AUTHORIZING DISPATCH...' : 'CONFIRM RELOCATION →'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Tracking Register: Department Issues */}
        <div className="bg-brandCream text-brandDark border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] p-6 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-brandDark">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider block font-bold text-neutral-600">
                TRACKING REGISTER
              </span>
              <h2 className="font-display text-xl uppercase font-bold text-brandDark">
                DEPARTMENT ISSUES &amp; FACILITY ALERTS
              </h2>
            </div>
            <span className="font-mono text-xs bg-brandLime text-brandDark px-2.5 py-1 rounded border border-brandDark font-bold">
              2 ACTIVE INCIDENTS
            </span>
          </div>

          <div className="divide-y-2 divide-brandDark/15 font-body text-xs">
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <div className="font-bold text-brandDark text-sm">
                    Room B-204 Lecture Hall — Power Arc Fault &amp; Smoke Scent
                  </div>
                  <div className="text-neutral-600 font-mono text-[11px] mt-0.5">
                    Reported 08:14 AM • Technician Manoj Kumar (USR031) dispatched
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                  CRITICAL
                </span>
                <span className="bg-brandLime text-brandDark border border-brandDark px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                  RELOCATION AUTHORIZED
                </span>
              </div>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Radio className="w-5 h-5 text-neutral-600 shrink-0" />
                <div>
                  <div className="font-bold text-brandDark text-sm">
                    Turing 102 AV Podium — Display Flicker Intermittent
                  </div>
                  <div className="text-neutral-600 font-mono text-[11px] mt-0.5">
                    Reported 09:02 AM • Scheduled for afternoon inspection
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-neutral-100 text-neutral-800 border border-neutral-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                  MEDIUM
                </span>
                <span className="bg-white text-brandDark border border-brandDark px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                  QUEUED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
