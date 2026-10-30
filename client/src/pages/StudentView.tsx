import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { NavItem } from '../components/common/AppSidebar';
import { MetricCard } from '../components/common/MetricCard';
import { ActionModal } from '../components/common/ActionModal';
import {
  QrCode,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building,
  DoorOpen,
  Box,
  Plus,
  ArrowRight,
  PhoneCall,
} from 'lucide-react';

export const StudentView: React.FC = () => {
  const { user } = useAuth();

  // Navigation state
  const [activeNav, setActiveNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Complaint submission form state
  const [modalOpen, setModalOpen] = useState(false);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [assetTag, setAssetTag] = useState<string>('');
  const [resolvedAsset, setResolvedAsset] = useState<any | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [complaintText, setComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Complaints history state
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  // Load campus buildings on mount
  useEffect(() => {
    apiFetch('/api/directory/buildings').then((res) => {
      if (res.success && res.data?.length > 0) {
        setBuildings(res.data);
        setSelectedBuilding(res.data[0].id);
      }
    });
    fetchMyComplaints();
  }, []);

  // Load rooms when building changes
  useEffect(() => {
    if (!selectedBuilding) return;
    apiFetch(`/api/directory/rooms?buildingId=${selectedBuilding}`).then((res) => {
      if (res.success && res.data?.length > 0) {
        setRooms(res.data);
        setSelectedRoom(res.data[0].id);
      } else {
        setRooms([]);
        setSelectedRoom('');
      }
    });
  }, [selectedBuilding]);

  const fetchMyComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await apiFetch('/api/intake/my-complaints');
      if (res.success) {
        setMyComplaints(res.data || []);
      }
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleQrLookup = async () => {
    if (!assetTag.trim()) return;
    setQrError(null);
    setResolvedAsset(null);
    const res = await apiFetch(`/api/directory/assets/lookup?qr=${encodeURIComponent(assetTag.trim())}`);
    if (res.success && res.data) {
      setResolvedAsset(res.data);
      if (res.data.room?.buildingId) setSelectedBuilding(res.data.room.buildingId);
      if (res.data.roomId) setSelectedRoom(res.data.roomId);
    } else {
      setQrError(res.error?.message || 'Asset QR code not recognized in registry.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setSubmitting(true);
    setSuccessMessage(null);

    const payload = {
      message: complaintText,
      buildingId: selectedBuilding || undefined,
      roomId: selectedRoom || undefined,
      assetId: resolvedAsset?.id || undefined,
    };

    const res = await apiFetch('/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setSuccessMessage(
        `Incident Logged: ${res.data.incident.reference} · Priority: ${res.data.incident.priority}`
      );
      setComplaintText('');
      setResolvedAsset(null);
      setAssetTag('');
      fetchMyComplaints();
      setTimeout(() => {
        setModalOpen(false);
      }, 2000);
    } else {
      alert(res.error?.message || 'Failed to submit complaint.');
    }
    setSubmitting(false);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = myComplaints.length;
    let inProgress = 0;
    let resolved = 0;

    myComplaints.forEach((c) => {
      const status = c.incidentReports?.[0]?.incident?.status || 'REPORTED';
      if (status === 'IN_PROGRESS' || status === 'ASSIGNED') {
        inProgress += 1;
      } else if (status === 'RESOLVED' || status === 'CLOSED') {
        resolved += 1;
      }
    });

    return { total, inProgress, resolved };
  }, [myComplaints]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return myComplaints.filter((c) => {
      const inc = c.incidentReports?.[0]?.incident;
      const status = inc?.status || 'REPORTED';

      if (statusFilter === 'ACTIVE' && (status === 'RESOLVED' || status === 'CLOSED')) {
        return false;
      }
      if (statusFilter === 'RESOLVED' && status !== 'RESOLVED' && status !== 'CLOSED') {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = c.originalText?.toLowerCase().includes(query);
        const refMatch = inc?.reference?.toLowerCase().includes(query);
        const roomMatch = inc?.room?.code?.toLowerCase().includes(query);
        return textMatch || refMatch || roomMatch;
      }

      return true;
    });
  }, [myComplaints, statusFilter, searchQuery]);

  // Sidebar navigation items
  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    {
      id: 'report',
      label: 'Report Issue',
      icon: 'add_circle',
      badge: '+',
      badgeColor: 'lime',
    },
    {
      id: 'reports',
      label: 'My Reports',
      icon: 'assignment',
      badge: myComplaints.length.toString(),
    },
    {
      id: 'notices',
      label: 'Notifications',
      icon: 'notifications',
      badge: '2',
      badgeColor: 'lime',
    },
    { id: 'help', label: 'Help', icon: 'help' },
  ];

  const handleNavSelect = (id: string) => {
    if (id === 'report') {
      setModalOpen(true);
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
              <span className="text-brandCream">STUDENT CONSOLE</span>
              <span className="px-2 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-brandLime font-bold text-[10px]">
                ROLE: STUDENT
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-brandCream uppercase font-bold tracking-tight">
                {user?.name || 'Alex Chen'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-neutral-400 font-mono text-xs">
                ID #{user?.loginId?.toUpperCase() || 'STU-99214'}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1C1C] text-brandLime font-mono text-xs border border-brandLime/30">
                <span className="w-1.5 h-1.5 rounded-full bg-brandLime animate-pulse" />
                ACTIVE SESSION
              </span>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-brandLime hover:bg-[#b2dc26] text-brandDark px-6 py-2.5 rounded-xl font-display text-sm uppercase font-bold tracking-wider border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0A0A0A] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Report an Issue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Editorial Banner */}
        <div className="relative overflow-hidden rounded-xl bg-brandCream border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] p-6 lg:p-8">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-brandLime/25 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 font-mono text-xs text-brandDark uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-brandDark" />
                <span className="px-2 py-0.5 rounded bg-brandLime text-brandDark font-bold border border-brandDark">
                  AUTONOMOUS DISPATCH SYSTEM
                </span>
                <span className="text-neutral-600 font-semibold">// STUDENT PORTAL</span>
              </div>
              <h1 className="font-display text-3xl md:text-5xl text-brandDark uppercase font-bold tracking-tight leading-none">
                YOUR CAMPUS.{' '}
                <span className="underline decoration-brandLime decoration-4 underline-offset-4">
                  YOUR VOICE.
                </span>
              </h1>
              <p className="font-body text-sm text-[#2A2A2A] max-w-xl font-medium leading-relaxed">
                Report maintenance issues, track live resolution timelines, and stay notified on
                campus facilities in real time. Powered by local-first verified telemetry.
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 bg-brandLime hover:bg-[#b2dc26] text-brandDark px-5 py-3 rounded-xl font-display text-sm uppercase font-bold tracking-wider border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0A0A0A] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Submit Complaint</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI Bento Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="My Reports"
            subtitle="Active Lifecycle"
            value={metrics.total.toString().padStart(2, '0')}
            variant="cream"
            badge="ACTIVE"
            progressPercent={metrics.total > 0 ? 50 : 0}
            metaText="This semester"
            icon="description"
          />
          <MetricCard
            title="In Progress"
            subtitle="Active Deployment"
            value={metrics.inProgress.toString().padStart(2, '0')}
            variant="lime"
            badge="AVG RES 4.2H"
            progressPercent={metrics.inProgress > 0 ? 70 : 0}
            metaText="Crew on-site"
            icon="engineering"
          />
          <MetricCard
            title="Resolved"
            subtitle="Historical Index"
            value={metrics.resolved.toString().padStart(2, '0')}
            variant="cream"
            badge="CLOSED"
            progressPercent={100}
            metaText="100% verified"
            icon="task_alt"
          />
        </div>

        {/* Dominant Split Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Recent Reports Workspace */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="p-6 rounded-xl bg-brandCream border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] text-brandDark">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b-2 border-brandDark mb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest font-bold">
                    <span className="px-2 py-0.5 rounded bg-brandLime border border-brandDark text-brandDark">
                      DISPATCH REPOSITORY
                    </span>
                    <span className="text-neutral-500">//</span>
                    <span className="text-neutral-500">STUDENT QUEUE</span>
                  </div>
                  <h2 className="font-display text-2xl uppercase font-bold text-brandDark mt-1">
                    Recent Reports
                  </h2>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-lg border border-brandDark font-bold uppercase transition-all ${
                      statusFilter === 'ALL'
                        ? 'bg-brandDark text-brandCream'
                        : 'bg-white text-brandDark hover:bg-neutral-100'
                    }`}
                  >
                    All ({myComplaints.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-3 py-1 rounded-lg border border-brandDark font-bold uppercase transition-all ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-brandDark text-brandCream'
                        : 'bg-white text-brandDark hover:bg-neutral-100'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('RESOLVED')}
                    className={`px-3 py-1 rounded-lg border border-brandDark font-bold uppercase transition-all ${
                      statusFilter === 'RESOLVED'
                        ? 'bg-brandDark text-brandCream'
                        : 'bg-white text-brandDark hover:bg-neutral-100'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#E5E0D5] font-mono text-[11px] text-brandDark uppercase tracking-wider border-b-2 border-brandDark">
                      <th className="py-2.5 px-3 rounded-l-lg font-bold">REPORTED ISSUE</th>
                      <th className="py-2.5 px-3 font-bold">LOCATION</th>
                      <th className="py-2.5 px-3 font-bold">PRIORITY</th>
                      <th className="py-2.5 px-3 rounded-r-lg text-right font-bold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brandDark/10 font-body text-xs text-brandDark">
                    {loadingComplaints ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-neutral-500 font-mono">
                          Loading submitted reports...
                        </td>
                      </tr>
                    ) : filteredComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-neutral-500 font-mono">
                          No reports found matching criteria. Click &quot;Report an Issue&quot; above to log a facility request.
                        </td>
                      </tr>
                    ) : (
                      filteredComplaints.map((item) => {
                        const inc = item.incidentReports?.[0]?.incident;
                        const status = inc?.status || 'REPORTED';
                        const priority = inc?.priority || 'NORMAL';
                        const location = inc?.room
                          ? `${inc.room.code} (${inc.room.building?.name || 'Academic'})`
                          : 'General Campus Facility';

                        return (
                          <tr key={item.id} className="hover:bg-[#EAE5DA] transition-colors group">
                            <td className="py-3 px-3">
                              <div className="flex flex-col pr-2">
                                <span className="font-bold text-brandDark line-clamp-1">
                                  {item.originalText}
                                </span>
                                <span className="font-mono text-[10px] text-neutral-600 uppercase mt-0.5">
                                  REF: {inc?.reference || item.id.substring(0, 8)} •{' '}
                                  {new Date(item.receivedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-brandDark">{location}</span>
                                <span className="text-[11px] text-neutral-600 font-mono">
                                  {inc?.category || 'FACILITY_OPS'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  priority === 'CRITICAL'
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : priority === 'HIGH'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                                }`}
                              >
                                {priority}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                  status === 'IN_PROGRESS' || status === 'ASSIGNED'
                                    ? 'bg-brandLime text-brandDark border-brandDark'
                                    : status === 'RESOLVED' || status === 'CLOSED'
                                    ? 'bg-[#E0DCD4] text-brandDark border-brandDark'
                                    : 'bg-white text-brandDark border-brandDark/40'
                                }`}
                              >
                                {status === 'IN_PROGRESS' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-brandDark animate-ping" />
                                )}
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Campus Notices & Security Hotline */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="p-6 rounded-xl bg-brandCream border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] flex flex-col text-brandDark">
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-brandDark">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest font-semibold">
                    BULLETIN FEED
                  </span>
                  <h2 className="font-display text-xl uppercase font-bold text-brandDark mt-0.5">
                    Campus Notices
                  </h2>
                </div>
                <span className="w-8 h-8 rounded-lg bg-brandLime border border-brandDark flex items-center justify-center font-bold">
                  !
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-lg bg-white border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-brandLime text-brandDark border border-brandDark flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                    ELV
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-brandDark truncate">
                        North Tower Elevator B
                      </span>
                      <span className="font-mono text-[9px] bg-neutral-200 text-brandDark px-1 py-0.5 rounded font-bold shrink-0">
                        UNTIL 14:00
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-tight font-medium">
                      Scheduled safety cable inspection. Use Elevators A &amp; C.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-brandLime text-brandDark border border-brandDark flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                    LGT
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-brandDark truncate">
                        East Lawn Walkway
                      </span>
                      <span className="font-mono text-[9px] bg-neutral-200 text-brandDark px-1 py-0.5 rounded font-bold shrink-0">
                        20:00 - 22:00
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-tight font-medium">
                      Pathway LED luminaire upgrade. Security shuttles running on schedule.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between border-t-2 border-brandDark">
                <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase">
                  NEED URGENT SECURITY?
                </span>
                <a
                  href="#contact"
                  className="font-mono text-[10px] bg-brandDark text-brandLime px-2.5 py-1 rounded uppercase font-bold hover:bg-neutral-800 flex items-center gap-1 transition-colors"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>CALL DISPATCH 24/7</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ActionModal for Complaint Submission */}
        <ActionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Submit Facility Maintenance Request"
          subtitle="AUTONOMOUS AI TRIAGE & TICKET INTAKE"
        >
          {successMessage && (
            <div className="mb-4 bg-lime-100 border-2 border-brandDark text-brandDark font-mono text-xs rounded-lg p-3 flex items-start gap-2 shadow-[2px_2px_0px_#0A0A0A]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-700 mt-0.5" />
              <div>
                <span className="font-bold">SUCCESS:</span> {successMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-body">
            {/* Quick Demo Pre-fills */}
            <div className="p-3 bg-[#EAE5DA] border-2 border-brandDark rounded-lg flex flex-col gap-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-brandDark font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brandDark" />
                <span>1-Click Hackathon Scenarios:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuilding('BLD-B');
                    setSelectedRoom('RM-B-204');
                    setAssetTag('AST-EL-B-204');
                    setComplaintText(
                      'Sparking power socket near the front lecture desk in Room B-204. Smoke smell detected. There is a semester exam scheduled here this morning!'
                    );
                  }}
                  className="px-2.5 py-1.5 bg-brandLime border border-brandDark font-mono text-[10px] font-bold text-brandDark uppercase rounded hover:shadow-sm text-left transition-all"
                >
                  ⚡ Load Scenario 1 (B-204 Sparking Socket)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuilding('BLD-C');
                    setSelectedRoom('RM-C-201');
                    setAssetTag('AST-NW-C-201');
                    setComplaintText(
                      'Wi-Fi router in Building C room 201 has completely stopped working. Multiple students disconnected during practical assignment.'
                    );
                  }}
                  className="px-2.5 py-1.5 bg-white border border-brandDark font-mono text-[10px] font-bold text-brandDark uppercase rounded hover:shadow-sm text-left transition-all"
                >
                  📶 Load Scenario 2 (C-201 Wi-Fi Failure)
                </button>
              </div>
            </div>

            {/* Asset QR Tag Quick Lookup */}
            <div>
              <label className="block text-xs font-mono font-bold text-brandDark mb-1 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-brandDark" />
                <span>ASSET QR CODE OR HARDWARE TAG (OPTIONAL)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  placeholder="e.g. QR-AST-EL-B-204 or AST-EL-B-204"
                  className="flex-1 bg-white border-2 border-brandDark rounded-lg px-3 py-2 text-xs font-mono text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
                />
                <button
                  type="button"
                  onClick={handleQrLookup}
                  className="bg-brandDark hover:bg-neutral-800 text-brandCream px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition"
                >
                  Verify QR
                </button>
              </div>

              {resolvedAsset && (
                <div className="mt-2 bg-white border-2 border-brandDark rounded-lg p-2.5 text-xs text-brandDark flex items-start gap-2 shadow-[2px_2px_0px_#0A0A0A]">
                  <Box className="w-4 h-4 text-brandDark mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold font-mono">{resolvedAsset.assetTag}</span>:{' '}
                    {resolvedAsset.type} located in{' '}
                    <span className="font-bold">{resolvedAsset.room?.code}</span> (
                    {resolvedAsset.room?.building?.name})
                  </div>
                </div>
              )}
              {qrError && (
                <div className="mt-1 text-[11px] font-mono text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {qrError}
                </div>
              )}
            </div>

            {/* Building & Room Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-brandDark mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-brandDark" />
                  BUILDING
                </label>
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full bg-white border-2 border-brandDark rounded-lg px-3 py-2 text-xs font-mono text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-brandDark mb-1 flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5 text-brandDark" />
                  ROOM
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full bg-white border-2 border-brandDark rounded-lg px-3 py-2 text-xs font-mono text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} ({r.roomType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Complaint Text */}
            <div>
              <label className="block text-xs font-mono font-bold text-brandDark mb-1 flex items-center justify-between">
                <span>ISSUE DESCRIPTION (NATURAL LANGUAGE)</span>
                <span className="text-[10px] bg-brandLime text-brandDark px-1.5 py-0.5 rounded font-mono font-bold border border-brandDark flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI TRIAGE ACTIVE
                </span>
              </label>
              <textarea
                required
                rows={4}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe the issue in detail (e.g., 'Sparking power socket near lecture desk in Room B-204, urgent electrical hazard before exam')..."
                className="w-full bg-white border-2 border-brandDark rounded-lg p-3 text-xs font-body text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A] leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border-2 border-brandDark font-mono text-xs font-bold uppercase rounded-lg hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-brandLime hover:bg-[#b2dc26] text-brandDark font-display font-bold px-6 py-2 rounded-lg text-sm uppercase tracking-wider border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'TRIAGING & SUBMITTING...' : 'SUBMIT REPORT →'}
              </button>
            </div>
          </form>
        </ActionModal>
      </div>
    </DashboardLayout>
  );
};
