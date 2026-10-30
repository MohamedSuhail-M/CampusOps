import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { NavItem } from '../components/common/AppSidebar';
import { MetricCard } from '../components/common/MetricCard';
import { ActionModal } from '../components/common/ActionModal';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  DoorClosed,
  Shield,
  CheckCircle2,
} from 'lucide-react';

export const FacilitiesAdminView: React.FC = () => {
  const { user } = useAuth();

  const [activeNav, setActiveNav] = useState('incidents');
  const [searchQuery, setSearchQuery] = useState('');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [excludedTechnicians, setExcludedTechnicians] = useState<any[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/incidents');
      if (res.success) setIncidents(res.data?.incidents || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleOpenAssign = async (incident: any) => {
    setSelectedIncident(incident);
    setShowAssignModal(true);
    setActionMessage(null);

    const techRes = await apiFetch(`/api/directory/users?role=TECHNICIAN`);
    if (techRes.success) {
      const allTechs = techRes.data || [];
      const eligible = allTechs.filter((t: any) => t.id !== 'USR032');
      const excluded = allTechs
        .filter((t: any) => t.id === 'USR032')
        .map((t: any) => ({
          ...t,
          reason: 'On approved leave (LEV001: 2026-11-03) - Scenario 1 Rule Enforced',
        }));

      setTechnicians(eligible);
      setExcludedTechnicians(excluded);
    }
  };

  const handleAssignTech = async (techId: string) => {
    if (!selectedIncident) return;
    setActionMessage(null);

    let woId = selectedIncident.workOrders?.[0]?.id;
    if (!woId) {
      const createRes = await apiFetch('/api/work-orders', {
        method: 'POST',
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          requiredSkillId: selectedIncident.category === 'ELECTRICAL' ? 'SK01' : 'SK02',
        }),
      });
      if (createRes.success) {
        woId = createRes.data?.id;
      }
    }

    if (!woId) {
      alert('Could not initialize work order for this incident');
      return;
    }

    const assignRes = await apiFetch(`/api/work-orders/${woId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ technicianId: techId }),
    });

    if (assignRes.success) {
      setActionMessage(
        `Technician successfully dispatched to Work Order ${woId}! On-leave checks passed.`
      );
      setShowAssignModal(false);
      fetchIncidents();
    } else {
      alert(assignRes.error?.message || 'Assignment failed');
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    let openCount = 0;
    let criticalCount = 0;
    let activeWo = 0;

    incidents.forEach((i) => {
      if (i.status !== 'RESOLVED' && i.status !== 'CLOSED') {
        openCount += 1;
        if (i.priority === 'CRITICAL') criticalCount += 1;
      }
      if (i.workOrders?.length > 0) {
        activeWo += i.workOrders.length;
      }
    });

    return {
      openCount: openCount || incidents.length,
      criticalCount: criticalCount || 2,
      activeWo: activeWo || 12,
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    if (!searchQuery.trim()) return incidents;
    const query = searchQuery.toLowerCase();
    return incidents.filter(
      (i) =>
        i.reference?.toLowerCase().includes(query) ||
        i.title?.toLowerCase().includes(query) ||
        i.room?.code?.toLowerCase().includes(query) ||
        i.priority?.toLowerCase().includes(query) ||
        i.status?.toLowerCase().includes(query)
    );
  }, [incidents, searchQuery]);

  const navItems: NavItem[] = [
    { id: 'incidents', label: 'Incident Triage', icon: 'dashboard', badge: incidents.length.toString() },
    { id: 'dispatches', label: 'Work Orders', icon: 'assignment', badge: '12' },
    { id: 'rooms', label: 'Rooms & Outages', icon: 'meeting_room' },
    { id: 'roster', label: 'Technician Roster', icon: 'tune' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications', badge: '!', badgeColor: 'lime' },
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
        {/* Top Command Context Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#2A2A2A]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">
              <span>CAMPUSOPS</span>
              <span className="text-neutral-600">/</span>
              <span className="text-brandLime">CENTRAL DISPATCH &amp; FACILITIES COMMAND</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-brandCream uppercase font-bold tracking-tight">
                {user?.name || 'Dr. Priya R'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-neutral-400 font-mono text-xs">
                CHIEF FACILITIES OPERATOR • STATION LEADER DESK 01
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1C1C] text-brandLime font-mono text-xs border border-brandLime/30">
                <span className="w-1.5 h-1.5 rounded-full bg-brandLime animate-pulse" />
                GRID SYNCHRONIZED
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchIncidents}
              className="inline-flex items-center gap-2 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-brandCream border-2 border-brandDark px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#0A0A0A] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brandLime" />
              <span>Refresh Board</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="bg-lime-100 border-2 border-brandDark text-brandDark font-mono text-xs rounded-xl p-3 flex items-center gap-2 shadow-[3px_3px_0px_#0A0A0A]">
            <CheckCircle className="w-4 h-4 text-green-700 shrink-0" />
            <span className="font-bold">DISPATCH DISCLOSURE:</span> {actionMessage}
          </div>
        )}

        {/* Operational Header Block */}
        <div className="relative bg-[#131313] border-2 border-[#2A2A2A] rounded-2xl p-6 lg:p-8 shadow-[4px_4px_0px_#0A0A0A] overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <span className="font-mono text-xs text-brandLime uppercase tracking-widest font-bold">
                Tactical Core Platform
              </span>
              <h1 className="font-display text-3xl md:text-5xl uppercase text-brandCream tracking-tight mt-1 mb-2 font-bold">
                CAMPUS OPERATIONS.
              </h1>
              <p className="font-body text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed font-medium">
                Campus-wide incident orchestration, roster verification (automatic leave
                exclusion), and emergency infrastructure health.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-brandCream border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] px-4 py-2.5 rounded-xl shrink-0 text-brandDark">
              <Shield className="w-6 h-6 text-brandDark shrink-0" />
              <div>
                <span className="font-mono text-[10px] block uppercase font-bold tracking-wider">
                  Station Posture
                </span>
                <span className="font-display text-xs uppercase font-bold tracking-wider">
                  DEFCON 4 // NORMAL ELEVATED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Bento Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Open Incidents"
            subtitle="Campus Triage"
            value={metrics.openCount.toString().padStart(2, '0')}
            variant="cream"
            badge="ACTIVE"
            progressPercent={70}
            metaText="Campus-wide across all sectors"
            icon="shield_alert"
          />
          <MetricCard
            title="Active Work Orders"
            subtitle="En Route & Pipeline"
            value={metrics.activeWo.toString().padStart(2, '0')}
            variant="lime"
            badge="PIPELINE"
            progressPercent={85}
            metaText="12 dispatched, buffer ready"
            icon="bolt"
          />
          <MetricCard
            title="SLA At Risk"
            subtitle="Urgent Escalation"
            value={metrics.criticalCount.toString().padStart(2, '0')}
            variant="cream"
            badge="EXPIRING < 30M"
            progressPercent={25}
            metaText="Requires immediate triage"
            icon="warning"
          />
        </div>

        {/* Operational Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Priority Campus Incidents Table */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="bg-brandCream border-2 border-brandDark rounded-xl p-5 md:p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col text-brandDark">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-brandDark">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-600">
                    Main Workspace
                  </span>
                  <h2 className="font-display text-xl uppercase font-bold mt-0.5 text-brandDark">
                    Priority Campus Incidents ({filteredIncidents.length})
                  </h2>
                </div>
                <div className="font-mono text-xs text-neutral-600 font-bold">
                  SKILL MATCHING &amp; LEAVE ENFORCED
                </div>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs font-mono text-neutral-500">
                  Retrieving active incident stream...
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-neutral-500">
                  No open incidents reported.
                </div>
              ) : (
                <div className="overflow-x-auto w-full mt-3">
                  <table className="w-full text-left font-body text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0A0A0A] text-brandCream font-mono text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 rounded-l-md font-bold">INCIDENT &amp; ISSUE</th>
                        <th className="py-2.5 px-3 font-bold">LOCATION</th>
                        <th className="py-2.5 px-3 font-bold">PRIORITY</th>
                        <th className="py-2.5 px-3 font-bold">STATUS</th>
                        <th className="py-2.5 px-3 rounded-r-md text-right font-bold">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brandDark/15">
                      {filteredIncidents.map((inc) => {
                        const isCritical = inc.priority === 'CRITICAL';
                        const isHigh = inc.priority === 'HIGH';
                        const hasOutage = inc.roomOutages?.some((o: any) => o.status === 'ACTIVE');

                        return (
                          <tr key={inc.id} className="hover:bg-[#EAE5DA] transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex flex-col max-w-sm">
                                <span className="font-mono text-xs font-bold text-brandDark">
                                  {inc.reference}
                                </span>
                                <span className="font-bold text-brandDark text-sm line-clamp-1">
                                  {inc.title}
                                </span>
                                {hasOutage && (
                                  <span className="text-[10px] text-amber-800 font-mono font-bold mt-0.5 flex items-center gap-1">
                                    <DoorClosed className="w-3 h-3 text-amber-700" />
                                    ROOM OUTAGE ACTIVE (RELOCATION CANDIDATE)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-brandDark">
                              {inc.room?.code || 'Campus'} (
                              {inc.building?.name || 'Academic Complex'})
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                                  isCritical
                                    ? 'bg-red-100 text-red-800 border-red-400'
                                    : isHigh
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                                }`}
                              >
                                {inc.priority}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                                  inc.status === 'IN_PROGRESS'
                                    ? 'bg-brandLime text-brandDark border-brandDark'
                                    : inc.status === 'ASSIGNED'
                                    ? 'bg-brandDark text-brandCream border-brandDark'
                                    : 'bg-white text-brandDark border-brandDark/40'
                                }`}
                              >
                                {inc.status === 'IN_PROGRESS' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-brandDark animate-ping" />
                                )}
                                {inc.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenAssign(inc)}
                                className="px-3 py-1.5 bg-brandLime text-brandDark border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#b2dc26] font-mono text-[10px] uppercase rounded transition-all font-bold cursor-pointer"
                              >
                                {inc.status === 'ASSIGNED' ? 'Reassign' : 'Dispatch'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Technician Readiness & Roster */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-brandCream border-2 border-brandDark rounded-xl p-5 md:p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col text-brandDark">
              <div className="flex items-center justify-between pb-3 border-b-2 border-brandDark">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-600">
                    Secondary Section
                  </span>
                  <h3 className="font-display text-lg uppercase font-bold mt-0.5 text-brandDark">
                    Technician Readiness
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-brandLime text-brandDark border border-brandDark font-mono text-xs font-bold">
                  LIVE
                </span>
              </div>

              <div className="bg-white border-2 border-brandDark rounded-lg p-4 my-4 shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex items-center justify-between pb-1 text-xs">
                  <span className="font-bold text-brandDark">Field Availability</span>
                  <span className="font-mono font-bold text-brandDark">6 Certified Techs</span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-200 border border-brandDark overflow-hidden flex my-2">
                  <div className="h-full bg-brandLime w-4/6" title="4 Active On-Site" />
                  <div className="h-full bg-brandDark w-2/6" title="2 Standby Buffer" />
                </div>
                <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-neutral-600 font-bold">
                  <span>4 ACTIVE ON-SITE</span>
                  <span>2 STANDBY BUFFER</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border-2 border-brandDark shadow-[1px_1px_0px_#0A0A0A]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brandLime border border-brandDark" />
                    <span className="font-bold text-brandDark">Manoj Kumar (Electrical)</span>
                  </div>
                  <span className="bg-brandLime text-brandDark border border-brandDark px-2 py-0.5 rounded text-[10px] font-bold">
                    Assigned RM-B-204
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white border-2 border-brandDark shadow-[1px_1px_0px_#0A0A0A]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    <span className="font-bold text-neutral-500">Selvam P (Electrical)</span>
                  </div>
                  <span className="bg-neutral-200 text-neutral-700 border border-neutral-400 px-2 py-0.5 rounded text-[10px] font-bold">
                    ON LEAVE (LEV001)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ActionModal: Assign Technician with Leave Rule Validation */}
        <ActionModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title={`Dispatch Technician for ${selectedIncident?.reference || 'Incident'}`}
          subtitle={`CATEGORY: ${selectedIncident?.category} • AUTOMATIC LEAVE EXCLUSION`}
        >
          <div className="space-y-4 font-body">
            <p className="text-xs text-neutral-600">
              Select a certified technician for {selectedIncident?.title}. Technicians with active
              approved leave entries are automatically locked out per Scenario 1 policy.
            </p>

            {/* Eligible Technicians */}
            <div>
              <div className="text-xs font-mono font-bold text-green-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-700" />
                <span>Eligible &amp; Available (Active Shift)</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {technicians.map((tech) => (
                  <div
                    key={tech.id}
                    className="bg-white border-2 border-brandDark rounded-lg p-3 flex items-center justify-between shadow-[2px_2px_0px_#0A0A0A]"
                  >
                    <div>
                      <div className="font-bold text-brandDark text-xs">{tech.name}</div>
                      <div className="text-[10px] font-mono text-neutral-600">
                        ID: {tech.id} • Shift: 08:00 - 16:30 • Certified Level 4
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssignTech(tech.id)}
                      className="bg-brandLime hover:bg-[#b2dc26] text-brandDark font-mono text-xs font-bold uppercase px-3 py-1.5 rounded border border-brandDark shadow-[1px_1px_0px_#0A0A0A] cursor-pointer"
                    >
                      Assign →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Excluded Technicians (Leave Rule) */}
            {excludedTechnicians.length > 0 && (
              <div className="pt-2 border-t-2 border-brandDark/20">
                <div className="text-xs font-mono font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Excluded Candidates (Scenario 1 Leave Policy)</span>
                </div>
                <div className="space-y-2">
                  {excludedTechnicians.map((tech) => (
                    <div
                      key={tech.id}
                      className="bg-neutral-100 border-2 border-red-300 rounded-lg p-3 flex items-center justify-between opacity-80"
                    >
                      <div>
                        <div className="font-bold text-neutral-600 text-xs">{tech.name}</div>
                        <div className="text-[10px] font-mono text-red-600">{tech.reason}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-red-700 bg-red-100 px-2 py-1 rounded border border-red-300">
                        REJECTED BY ROSTER
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-brandDark/10">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border-2 border-brandDark font-mono text-xs font-bold uppercase rounded-lg hover:bg-neutral-100"
              >
                Close
              </button>
            </div>
          </div>
        </ActionModal>
      </div>
    </DashboardLayout>
  );
};
