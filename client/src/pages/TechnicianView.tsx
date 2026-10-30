import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { NavItem } from '../components/common/AppSidebar';
import { MetricCard } from '../components/common/MetricCard';
import { ActionModal } from '../components/common/ActionModal';
import {
  Wrench,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  PackagePlus,
  RefreshCw,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const TechnicianView: React.FC = () => {
  const { user } = useAuth();

  const [activeNav, setActiveNav] = useState('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWo, setSelectedWo] = useState<any | null>(null);

  // Modals state
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPrModal, setShowPrModal] = useState(false);
  const [prReason, setPrReason] = useState('');
  const [prItemId, setPrItemId] = useState('ITM008');
  const [prQuantity, setPrQuantity] = useState(2);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [woRes, invRes] = await Promise.all([
        apiFetch('/api/work-orders'),
        apiFetch('/api/inventory'),
      ]);
      if (woRes.success) setWorkOrders(woRes.data || []);
      if (invRes.success) setInventory(invRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransition = async (woId: string, action: string, extraData: any = {}) => {
    setActionMessage(null);
    const res = await apiFetch(`/api/work-orders/${woId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ action, ...extraData }),
    });

    if (res.success) {
      setActionMessage(`Work order transition successful: ${action}`);
      fetchData();
      setShowBlockModal(false);
      setShowCompleteModal(false);
    } else {
      alert(res.error?.message || 'Transition failed');
    }
  };

  const handleCreatePr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWo) return;
    setActionMessage(null);

    const res = await apiFetch('/api/procurement/requests', {
      method: 'POST',
      body: JSON.stringify({
        workOrderId: selectedWo.id,
        reason: prReason,
        lines: [{ itemId: prItemId, quantity: Number(prQuantity) }],
      }),
    });

    if (res.success) {
      setActionMessage(
        `Purchase Request ${res.data?.id} submitted. Work order marked as BLOCKED.`
      );
      setShowPrModal(false);
      fetchData();
    } else {
      alert(res.error?.message || 'Failed to create PR');
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    let assigned = 0;
    let inProgress = 0;
    let completed = 0;

    workOrders.forEach((wo) => {
      if (wo.status === 'ASSIGNED') assigned += 1;
      else if (wo.status === 'IN_PROGRESS' || wo.status === 'BLOCKED') inProgress += 1;
      else if (wo.status === 'COMPLETED' || wo.status === 'CLOSED') completed += 1;
    });

    return { assigned, inProgress, completed };
  }, [workOrders]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return workOrders;
    const query = searchQuery.toLowerCase();
    return workOrders.filter(
      (wo) =>
        wo.id?.toLowerCase().includes(query) ||
        wo.incident?.title?.toLowerCase().includes(query) ||
        wo.incident?.room?.code?.toLowerCase().includes(query) ||
        wo.status?.toLowerCase().includes(query)
    );
  }, [workOrders, searchQuery]);

  const navItems: NavItem[] = [
    { id: 'orders', label: 'Work Orders', icon: 'build', badge: workOrders.length.toString() },
    { id: 'parts', label: 'Parts Requests', icon: 'inventory_2' },
    { id: 'schedule', label: 'Schedule & Leave', icon: 'calendar_month' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications', badge: '3', badgeColor: 'lime' },
    { id: 'help', label: 'Diagnostic Tools', icon: 'help' },
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
        {/* Top Meta Ribbon & Identity Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#2A2A2A]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">
              <span className="text-brandLime font-bold">CAMPUSOPS</span>
              <span className="text-neutral-600">/</span>
              <span className="text-brandCream">TECHNICIAN CONSOLE</span>
              <span className="px-2 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-brandLime font-bold text-[10px]">
                ROLE: TECHNICIAN
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-brandCream uppercase font-bold tracking-tight">
                {user?.name || 'Manoj Kumar'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-neutral-400 font-mono text-xs">
                {user?.departmentName || 'Electrical Maintenance'} • CERT LEVEL 4
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1C1C] text-brandLime font-mono text-xs border border-brandLime/30">
                <span className="w-1.5 h-1.5 rounded-full bg-brandLime animate-pulse" />
                ON-DUTY SHIFT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-brandCream border-2 border-brandDark px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#0A0A0A] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brandLime" />
              <span>Refresh Orders</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="bg-lime-100 border-2 border-brandDark text-brandDark font-mono text-xs rounded-xl p-3 flex items-center gap-2 shadow-[3px_3px_0px_#0A0A0A]">
            <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
            <span className="font-bold">DISPATCH UPDATE:</span> {actionMessage}
          </div>
        )}

        {/* Hero Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-brandCream p-6 rounded-2xl border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] text-brandDark">
          <div className="flex flex-col gap-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brandDark font-bold">
              <span className="w-2 h-2 rounded-full bg-brandDark" />
              <span>FIELD DISPATCH MATRIX</span>
              <span className="text-neutral-500">//</span>
              <span className="text-neutral-500">TASK BENCH</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-brandDark uppercase leading-none mt-1">
              YOUR WORK.{' '}
              <span className="underline decoration-brandLime decoration-4 underline-offset-4">
                MADE SIMPLE.
              </span>
            </h1>
            <p className="text-xs md:text-sm text-[#1C1C1C] font-body font-medium mt-1 leading-relaxed">
              Live work order dispatch queue, ACID stock consumption locks, and shift readiness.
            </p>
          </div>
          <div className="flex items-center sm:shrink-0">
            <div className="bg-brandDark text-brandCream px-4 py-3 rounded-xl border-2 border-brandDark flex items-center gap-3 font-mono text-xs">
              <ShieldCheck className="w-5 h-5 text-brandLime" />
              <div>
                <div className="text-[10px] text-neutral-400">ROSTER VALIDATION</div>
                <div className="font-bold text-brandLime">ACTIVE (ON-LEAVE TECHS EXCLUDED)</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Bento Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Assigned"
            subtitle="Active Queue"
            value={metrics.assigned.toString().padStart(2, '0')}
            variant="cream"
            badge="PENDING"
            progressPercent={metrics.assigned > 0 ? 50 : 0}
            metaText="Awaiting start on-site"
            icon="assignment_ind"
          />
          <MetricCard
            title="In Progress"
            subtitle="Under Diagnosis"
            value={metrics.inProgress.toString().padStart(2, '0')}
            variant="lime"
            badge="ACTIVE"
            progressPercent={metrics.inProgress > 0 ? 75 : 0}
            metaText="Bench / repair active"
            icon="timelapse"
          />
          <MetricCard
            title="Completed"
            subtitle="Closeout Cycle"
            value={metrics.completed.toString().padStart(2, '0')}
            variant="cream"
            badge="VALIDATED"
            progressPercent={100}
            metaText="History sealed in DB"
            icon="task_alt"
          />
        </div>

        {/* Dispatch Work Orders Section */}
        <div className="bg-brandCream border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] rounded-xl p-5 flex flex-col gap-4 text-brandDark">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-brandDark gap-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brandDark" />
              <h2 className="text-xl font-bold uppercase tracking-wider font-display text-brandDark">
                DISPATCH WORK ORDERS ({filteredOrders.length})
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-600">
              ACID INVENTORY RESERVATION &amp; STATE ENGINE
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              Synchronizing active work orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              No work orders assigned to current queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-body">
                <thead>
                  <tr className="border-b-2 border-brandDark bg-[#E5E0D5] text-brandDark font-mono text-[11px] uppercase font-bold">
                    <th className="py-2.5 px-3 rounded-l-lg">Order ID</th>
                    <th className="py-2.5 px-3">Issue Description</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-right">Lifecycle Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brandDark/10 text-brandDark">
                  {filteredOrders.map((wo) => {
                    const priority = wo.incident?.priority || 'NORMAL';
                    const isCritical = priority === 'CRITICAL';

                    return (
                      <tr key={wo.id} className="hover:bg-[#EAE5DA] transition-colors group">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-brandDark bg-brandLime px-2 py-0.5 rounded border border-brandDark shadow-[1px_1px_0px_#0A0A0A]">
                            {wo.id}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col max-w-sm">
                            <span className="font-bold text-brandDark">
                              {wo.incident?.title || 'Maintenance Task'}
                            </span>
                            {wo.blockedReason && (
                              <span className="text-[10px] text-red-700 font-mono mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                BLOCKED: {wo.blockedReason}
                              </span>
                            )}
                            {wo.stockReservations?.length > 0 && (
                              <span className="text-[10px] text-brandDark font-mono mt-0.5 flex items-center gap-1 font-semibold">
                                <Layers className="w-3 h-3" />
                                RESERVED:{' '}
                                {wo.stockReservations
                                  .map((r: any) => `${r.quantity}x ${r.itemId}`)
                                  .join(', ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-brandDark">
                          {wo.incident?.room?.code} (
                          {wo.incident?.building?.name || 'Main Campus'})
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              isCritical
                                ? 'bg-red-100 text-red-800 border-red-400'
                                : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                            }`}
                          >
                            {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                            {priority}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                              wo.status === 'IN_PROGRESS'
                                ? 'bg-brandLime text-brandDark border-brandDark'
                                : wo.status === 'BLOCKED'
                                ? 'bg-red-100 text-red-800 border-red-400'
                                : wo.status === 'COMPLETED'
                                ? 'bg-[#E0DCD4] text-brandDark border-brandDark'
                                : 'bg-white text-brandDark border-brandDark/40'
                            }`}
                          >
                            {wo.status === 'IN_PROGRESS' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-brandDark animate-ping" />
                            )}
                            {wo.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {wo.status === 'ASSIGNED' && (
                              <button
                                type="button"
                                onClick={() => handleTransition(wo.id, 'START')}
                                className="inline-flex items-center gap-1 bg-brandDark text-brandLime hover:bg-neutral-800 font-mono text-[11px] font-bold px-3 py-1.5 rounded border border-brandDark transition cursor-pointer"
                              >
                                <Play className="w-3 h-3" />
                                <span>START</span>
                              </button>
                            )}

                            {wo.status === 'IN_PROGRESS' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedWo(wo);
                                    setShowBlockModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-amber-200 text-amber-900 border border-amber-400 font-mono text-[11px] font-bold px-2.5 py-1.5 rounded hover:bg-amber-300 transition cursor-pointer"
                                >
                                  <Pause className="w-3 h-3" />
                                  <span>BLOCK</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedWo(wo);
                                    setShowPrModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-white text-brandDark border border-brandDark font-mono text-[11px] font-bold px-2.5 py-1.5 rounded hover:bg-neutral-100 transition cursor-pointer"
                                >
                                  <PackagePlus className="w-3 h-3" />
                                  <span>PARTS (PR)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedWo(wo);
                                    setShowCompleteModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-brandLime text-brandDark border border-brandDark font-mono text-[11px] font-bold px-3 py-1.5 rounded shadow-[1px_1px_0px_#0A0A0A] hover:bg-[#b2dc26] transition cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>COMPLETE</span>
                                </button>
                              </>
                            )}

                            {wo.status === 'BLOCKED' && (
                              <button
                                type="button"
                                onClick={() => handleTransition(wo.id, 'RESUME')}
                                className="inline-flex items-center gap-1 bg-brandLime text-brandDark border border-brandDark font-mono text-[11px] font-bold px-3 py-1.5 rounded shadow-[1px_1px_0px_#0A0A0A] hover:bg-[#b2dc26] transition cursor-pointer"
                              >
                                <Play className="w-3 h-3" />
                                <span>RESUME WORK</span>
                              </button>
                            )}

                            {wo.status === 'COMPLETED' && (
                              <span className="font-mono text-[10px] text-neutral-500 uppercase font-bold">
                                SEALED
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Shift Assignment Card */}
        <div className="bg-brandCream border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-brandDark">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-lg bg-brandDark text-brandLime flex items-center justify-center border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] shrink-0">
              <Clock className="w-5 h-5 text-brandLime" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-mono tracking-wider text-neutral-600 font-bold">
                Shift Assignment
              </span>
              <span className="text-sm font-bold text-brandDark">
                Morning Maintenance Shift • 07:00 – 15:30
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-brandDark/20 pt-3 sm:pt-0">
            <div className="flex items-center gap-2 bg-brandDark px-3.5 py-2 rounded-lg border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A]">
              <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse inline-block" />
              <span className="text-xs text-brandLime font-bold font-mono tracking-wide">
                Electrical Quadrant On-Call
              </span>
            </div>
          </div>
        </div>

        {/* ActionModal: Block Work Order */}
        <ActionModal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          title="Block Work Order"
          subtitle={`WORK ORDER: ${selectedWo?.id}`}
        >
          <div className="space-y-4 font-body">
            <p className="text-xs text-neutral-600 font-medium">
              Enter reason for blocking work order {selectedWo?.id} (e.g., waiting for parts, power
              shutdown, or structural clearance).
            </p>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Awaiting spare transceiver from central store"
              className="w-full bg-white border-2 border-brandDark rounded-lg p-2.5 text-xs text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase text-neutral-600 hover:text-brandDark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleTransition(selectedWo?.id, 'BLOCK', { blockedReason: blockReason })
                }
                disabled={!blockReason.trim()}
                className="bg-amber-400 text-brandDark font-mono font-bold text-xs uppercase px-4 py-2 rounded-lg border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-50"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </ActionModal>

        {/* ActionModal: Complete Work Order */}
        <ActionModal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          title="Complete Work Order & Close Incident"
          subtitle={`WORK ORDER: ${selectedWo?.id}`}
        >
          <div className="space-y-4 font-body">
            <p className="text-xs text-neutral-600 font-medium">
              Document resolution to record permanent maintenance history and clear room outages.
            </p>
            <textarea
              rows={3}
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="e.g. Socket safely replaced and circuit tested OK. Room verified safe."
              className="w-full bg-white border-2 border-brandDark rounded-lg p-2.5 text-xs text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase text-neutral-600 hover:text-brandDark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleTransition(selectedWo?.id, 'COMPLETE', { resolution: resolutionText })
                }
                disabled={!resolutionText.trim()}
                className="bg-brandLime text-brandDark font-display font-bold text-xs uppercase px-5 py-2 rounded-lg border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] disabled:opacity-50"
              >
                Save Resolution &amp; Complete
              </button>
            </div>
          </div>
        </ActionModal>

        {/* ActionModal: Request Parts (PR) */}
        <ActionModal
          isOpen={showPrModal}
          onClose={() => setShowPrModal(false)}
          title="Create Emergency Purchase Request"
          subtitle={`AUTO-BLOCKS WORK ORDER ${selectedWo?.id} (SCENARIO 2)`}
        >
          <form onSubmit={handleCreatePr} className="space-y-4 font-body">
            <p className="text-xs text-neutral-600">
              Request out-of-stock spares. Submitting this will automatically mark work order{' '}
              {selectedWo?.id} as <strong>BLOCKED</strong> until parts are received at the loading
              dock.
            </p>
            <div>
              <label className="block text-xs font-mono font-bold text-brandDark mb-1">
                SELECT SPARE PART
              </label>
              <select
                value={prItemId}
                onChange={(e) => setPrItemId(e.target.value)}
                className="w-full bg-white border-2 border-brandDark rounded-lg p-2 text-xs font-mono text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku}) - Available: {item.availableQuantity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-brandDark mb-1">
                QUANTITY NEEDED
              </label>
              <input
                type="number"
                min="1"
                value={prQuantity}
                onChange={(e) => setPrQuantity(Number(e.target.value))}
                className="w-full bg-white border-2 border-brandDark rounded-lg p-2 text-xs font-mono text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-brandDark mb-1">
                PROCUREMENT JUSTIFICATION
              </label>
              <input
                type="text"
                required
                value={prReason}
                onChange={(e) => setPrReason(e.target.value)}
                placeholder="e.g. Replacement Wi-Fi transceiver required to restore C-Wing connectivity"
                className="w-full bg-white border-2 border-brandDark rounded-lg p-2 text-xs text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPrModal(false)}
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase text-neutral-600 hover:text-brandDark"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brandLime text-brandDark font-display font-bold text-xs uppercase px-5 py-2 rounded-lg border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A]"
              >
                Submit Purchase Request →
              </button>
            </div>
          </form>
        </ActionModal>
      </div>
    </DashboardLayout>
  );
};
