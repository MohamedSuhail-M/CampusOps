import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';

interface TechnicianUser {
  id: string;
  name: string;
  loginId: string;
  department?: { id: string; name: string };
  skills?: Array<{ skill: string; level: number }>;
}

interface EligibleTechInfo {
  userId: string;
  name: string;
  loginId: string;
  skillName: string;
  skillLevel: number;
  isEligible: boolean;
  status: 'AVAILABLE' | 'ON_LEAVE' | 'NO_SHIFT' | 'WORKLOAD_BUSY';
  reason: string;
  activeWorkload: number;
}

export const FacilitiesWorkOrdersPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dispatch Modal State
  const [selectedWo, setSelectedWo] = useState<any>(null);
  const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);
  const [eligibleTechs, setEligibleTechs] = useState<EligibleTechInfo[]>([]);
  const [excludedTechs, setExcludedTechs] = useState<EligibleTechInfo[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [dispatchLoading, setDispatchLoading] = useState<boolean>(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  const fetchWorkOrders = async () => {
    try {
      const res = await apiFetch<any[]>('/api/work-orders?all=true');
      if (res.success && res.data) {
        setWorkOrders(res.data);
      }
    } catch (e: any) {
      console.error('Failed to load work orders', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await apiFetch<TechnicianUser[]>('/api/directory/users?roleCode=TECHNICIAN');
      if (res.success && res.data) {
        setTechnicians(res.data);
      }
    } catch (e) {
      console.error('Failed to load technicians directory', e);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchTechnicians();
  }, []);

  const openDispatchModal = async (wo: any) => {
    setSelectedWo(wo);
    setSelectedTechId(wo.assignedTo || '');
    setDispatchError(null);
    setDispatchSuccess(null);

    // Fetch eligibility evaluation if skill specified
    try {
      const elRes = await apiFetch<any>(`/api/work-orders/${wo.id}/eligible-technicians`);
      if (elRes.success && elRes.data) {
        setEligibleTechs(elRes.data.eligible || []);
        setExcludedTechs(elRes.data.excluded || []);
        if (!wo.assignedTo && elRes.data.eligible?.length > 0) {
          setSelectedTechId(elRes.data.eligible[0].userId);
        }
      } else {
        setEligibleTechs([]);
        setExcludedTechs([]);
      }
    } catch {
      setEligibleTechs([]);
      setExcludedTechs([]);
    }
  };

  const handleDispatch = async () => {
    if (!selectedWo) return;
    if (!selectedTechId) {
      setDispatchError('Please select a technician to dispatch this work order.');
      return;
    }

    setDispatchLoading(true);
    setDispatchError(null);
    setDispatchSuccess(null);

    try {
      const res = await apiFetch<any>(`/api/work-orders/${selectedWo.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ technicianId: selectedTechId }),
      });

      if (res.success) {
        const assignedName = res.data?.assignee?.name || 'Technician';
        setDispatchSuccess(`Work order #${selectedWo.id} successfully assigned to ${assignedName}!`);
        await fetchWorkOrders();
        // Update selected work order in modal
        setSelectedWo((prev: any) => ({
          ...prev,
          assignedTo: selectedTechId,
          assignee: res.data?.assignee,
          status: 'ASSIGNED',
        }));
      } else {
        setDispatchError(res.error?.message || 'Failed to dispatch work order.');
      }
    } catch (e: any) {
      setDispatchError(e.message || 'Network error executing dispatch.');
    } finally {
      setDispatchLoading(false);
    }
  };

  // Filtered & Searched Work Orders
  const filteredWorkOrders = workOrders.filter((wo) => {
    if (filterStatus === 'OPEN') {
      if (wo.status !== 'OPEN' && wo.assignedTo) return false;
    } else if (filterStatus !== 'ALL') {
      if (wo.status !== filterStatus) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idMatch = wo.id?.toLowerCase().includes(q);
    const titleMatch = wo.incident?.title?.toLowerCase().includes(q);
    const refMatch = wo.incident?.reference?.toLowerCase().includes(q);
    const roomMatch = wo.incident?.room?.code?.toLowerCase().includes(q);
    const techMatch = wo.assignee?.name?.toLowerCase().includes(q);
    return idMatch || titleMatch || refMatch || roomMatch || techMatch;
  });

  const totalCount = workOrders.length;
  const openCount = workOrders.filter((w) => w.status === 'OPEN' || !w.assignedTo).length;
  const inProgressCount = workOrders.filter((w) => w.status === 'IN_PROGRESS' || w.status === 'ASSIGNED').length;
  const blockedCount = workOrders.filter((w) => w.status === 'BLOCKED').length;
  const completedCount = workOrders.filter((w) => w.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'FACILITIES ADMIN', path: '/app/facilities/triage' },
          { label: 'CAMPUS WORK ORDERS & DISPATCH' },
        ]}
      />

      <div className="border-b border-[#2A2A2A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Work Order Management &amp; Dispatch Console
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Dispatch maintenance tickets to qualified campus technicians with real-time leave and shift enforcement.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchWorkOrders}
          className="p-2.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-brandCream rounded-xl transition-colors self-start sm:self-auto flex items-center gap-2 font-mono text-xs"
          title="Refresh Work Orders"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard label="Total Work Orders" value={totalCount} icon="assignment" metaText="All Categories" />
        <MetricCard label="Open / Unassigned" value={openCount} icon="pending_actions" badgeText="Needs Dispatch" badgeColor="yellow" />
        <MetricCard label="Active Repair" value={inProgressCount} icon="construction" badgeText="In Field" badgeColor="lime" />
        <MetricCard label="Pending Parts" value={blockedCount} icon="inventory_2" badgeText="Blocked" badgeColor="red" />
        <MetricCard label="Completed" value={completedCount} icon="task_alt" badgeText="Verified" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          {[
            { id: 'ALL', label: 'ALL JOBS' },
            { id: 'OPEN', label: 'UNASSIGNED / OPEN' },
            { id: 'ASSIGNED', label: 'ASSIGNED' },
            { id: 'IN_PROGRESS', label: 'IN PROGRESS' },
            { id: 'BLOCKED', label: 'BLOCKED (PARTS)' },
            { id: 'COMPLETED', label: 'COMPLETED' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                filterStatus === tab.id
                  ? 'bg-brandLime text-brandDark border-brandLime shadow-[2px_2px_0px_#0A0A0A]'
                  : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:text-brandCream'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-500 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by WO, title, room, tech..."
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2 text-xs text-brandCream font-mono focus:border-brandLime"
          />
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400 space-y-2">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading work orders ledger...</p>
          </div>
        ) : filteredWorkOrders.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-500">
            No work orders found matching current filter &quot;{filterStatus}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">WO ID</th>
                  <th className="py-3 px-4">Incident Reference</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Required Skill</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filteredWorkOrders.map((wo) => {
                  const isUnassigned = !wo.assignedTo || wo.status === 'OPEN';
                  const roomCode = wo.incident?.room?.code || '';
                  const bldCode = wo.incident?.room?.building?.code || wo.incident?.building?.code || '';
                  const locationText = roomCode ? `${bldCode ? bldCode + '-' : ''}${roomCode}` : 'Campus wide';

                  return (
                    <tr key={wo.id} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                        {wo.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-brandCream max-w-xs">
                        <div className="truncate font-semibold">{wo.incident?.title || 'Maintenance Repair'}</div>
                        <div className="font-mono text-[10px] text-neutral-500">
                          {wo.incident?.reference || 'N/A'} • Priority: {wo.incident?.priority || 'NORMAL'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-300 whitespace-nowrap">
                        {locationText}
                      </td>
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        {isUnassigned ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono text-[10px] font-bold uppercase">
                            Unassigned
                          </span>
                        ) : (
                          <span className="text-neutral-200 font-bold">
                            {wo.assignee?.name || wo.assignedTo}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={wo.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-400 whitespace-nowrap">
                        {wo.requiredSkill?.name || 'General Maintenance'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDispatchModal(wo)}
                          className={`px-3 py-1.5 font-mono font-bold text-xs uppercase rounded-lg shadow-[2px_2px_0px_#0A0A0A] transition-all ${
                            isUnassigned
                              ? 'bg-brandLime text-brandDark hover:bg-[#b0dc28]'
                              : 'bg-[#2A2A2A] hover:bg-[#333] text-brandCream border border-[#3A3A3A]'
                          }`}
                        >
                          {isUnassigned ? 'Dispatch →' : 'Reassign / View'}
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

      {/* DISPATCH / REASSIGN MODAL */}
      {selectedWo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border-2 border-brandDark shadow-[8px_8px_0px_#0A0A0A] rounded-2xl max-w-xl w-full p-6 space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brandLime text-xl">send</span>
                <h2 className="font-display font-bold uppercase tracking-wider text-lg text-brandCream">
                  Dispatch Work Order #{selectedWo.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWo(null)}
                className="text-neutral-400 hover:text-white font-mono text-xs font-bold"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Error & Success Alerts */}
            {dispatchError && (
              <div className="p-3 bg-red-950/70 border border-red-700 rounded-xl text-red-200 font-mono text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-red-400">error</span>
                <span>{dispatchError}</span>
              </div>
            )}
            {dispatchSuccess && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-600 rounded-xl text-emerald-200 font-mono text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                <span>{dispatchSuccess}</span>
              </div>
            )}

            {/* Work Order Incident Info Card */}
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase">Associated Incident:</span>
                  <p className="font-bold text-brandCream text-sm">{selectedWo.incident?.title || 'Maintenance Task'}</p>
                </div>
                <StatusBadge status={selectedWo.incident?.priority || 'CRITICAL'} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-neutral-400 text-[11px]">
                <div>
                  Location: <span className="text-neutral-200 font-bold">{selectedWo.incident?.room?.code || 'Campus Wide'}</span>
                </div>
                <div>
                  Category: <span className="text-neutral-200 font-bold">{selectedWo.incident?.category || 'General'}</span>
                </div>
                <div>
                  Required Skill: <span className="text-brandLime font-bold">{selectedWo.requiredSkill?.name || 'General'}</span>
                </div>
                <div>
                  Current Status: <span className="text-brandCream font-bold">{selectedWo.status}</span>
                </div>
              </div>
            </div>

            {/* Technician Selection */}
            <div className="space-y-2 font-mono text-xs">
              <label className="block text-neutral-300 font-bold uppercase tracking-wider">
                Select Technician for Dispatch:
              </label>

              <select
                value={selectedTechId}
                onChange={(e) => {
                  setSelectedTechId(e.target.value);
                  setDispatchError(null);
                }}
                className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl p-3 text-xs text-brandCream font-mono focus:outline-none focus:border-brandLime"
              >
                <option value="">-- Choose Eligible Technician --</option>
                {/* 1. Recommended / Eligible Technicians */}
                {eligibleTechs.length > 0 && (
                  <optgroup label="✓ Eligible & Available Technicians">
                    {eligibleTechs.map((t) => (
                      <option key={t.userId} value={t.userId}>
                        ★ {t.name} ({t.loginId}) — Skill Level {t.skillLevel} (Workload: {t.activeWorkload} active)
                      </option>
                    ))}
                  </optgroup>
                )}
                {/* 2. Ineligible / On Leave Technicians */}
                {excludedTechs.length > 0 && (
                  <optgroup label="⚠️ Excluded (On Leave / Shift Conflict)">
                    {excludedTechs.map((t) => (
                      <option key={t.userId} value={t.userId}>
                        ✕ {t.name} ({t.loginId}) — {t.reason}
                      </option>
                    ))}
                  </optgroup>
                )}
                {/* 3. Fallback: All Roster Technicians */}
                <optgroup label="All Department Technicians">
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.loginId}) — {t.skills?.map((s) => s.skill).join(', ') || 'Technician'}
                    </option>
                  ))}
                </optgroup>
              </select>

              {/* Technician Status Hint */}
              {selectedTechId && (
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#2A2A2A] text-[11px] font-mono">
                  {(() => {
                    const ex = excludedTechs.find((c) => c.userId === selectedTechId);
                    if (ex) {
                      return (
                        <span className="text-red-400 font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          {ex.reason}
                        </span>
                      );
                    }
                    const el = eligibleTechs.find((c) => c.userId === selectedTechId);
                    if (el) {
                      return (
                        <span className="text-brandLime font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          Available on shift • Active tasks: {el.activeWorkload} • Skill match verified
                        </span>
                      );
                    }
                    return <span className="text-neutral-400">Selected technician from campus roster.</span>;
                  })()}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => setSelectedWo(null)}
                className="px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333] text-brandCream font-mono font-bold text-xs uppercase rounded-xl border border-[#3A3A3A]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={dispatchLoading || !selectedTechId}
                onClick={handleDispatch}
                className="px-6 py-2.5 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {dispatchLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-brandDark border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">send</span>
                    <span>Confirm Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
