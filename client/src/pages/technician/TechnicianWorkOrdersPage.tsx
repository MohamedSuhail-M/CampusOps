import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { ActionModal } from '../../components/common/ActionModal';

export const TechnicianWorkOrdersPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State for State Machine transitions
  const [activeModal, setActiveModal] = useState<any>(null);
  const [selectedWo, setSelectedWo] = useState<any>(null);
  const [modalComment, setModalComment] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchWorkOrders = async () => {
    try {
      const res = await apiFetch<any[]>('/api/work-orders');
      if (res.success && res.data) {
        setWorkOrders(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleAction = async (status: string, reason?: string) => {
    if (!selectedWo) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/work-orders/${selectedWo.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          blockedReason: reason || modalComment,
          resolutionNotes: modalComment,
        }),
      });
      await fetchWorkOrders();
      setActiveModal(null);
      setSelectedWo(null);
      setModalComment('');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = workOrders.filter((wo) => {
    if (filterStatus === 'ALL') return true;
    return wo.status === filterStatus;
  });

  const activeCount = workOrders.filter((w) => w.status === 'ASSIGNED' || w.status === 'IN_PROGRESS').length;
  const blockedCount = workOrders.filter((w) => w.status === 'BLOCKED').length;
  const completedCount = workOrders.filter((w) => w.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'TECHNICIAN', path: '/app/technician/work-orders' }, { label: 'WORK ORDERS' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Assigned Work Orders
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Execute maintenance lifecycle: START → BLOCK → RESUME → COMPLETE with spare reservations.
          </p>
        </div>

        <Link
          to="/app/technician/parts"
          className="px-4 py-2 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-xl shadow-[3px_3px_0px_#0A0A0A] flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">inventory_2</span>
          Request Spares (PR)
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Active Work Orders" value={activeCount} icon="construction" badgeText="In Queue" badgeColor="lime" />
        <MetricCard label="Blocked on Spares" value={blockedCount} icon="block" badgeText="Needs Parts" badgeColor="red" />
        <MetricCard label="Completed Repairs" value={completedCount} icon="task_alt" badgeText="Verified" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 font-mono text-xs">
        {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
              filterStatus === st
                ? 'bg-brandLime text-brandDark border-brandLime shadow-[2px_2px_0px_#0A0A0A]'
                : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:text-brandCream'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Work Orders Table */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading assigned work orders...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-500">
            No work orders matching filter &quot;{filterStatus}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">WO ID</th>
                  <th className="py-3 px-4">Incident Title</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Required Skill</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filtered.map((wo) => (
                  <tr key={wo.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                      {wo.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-brandCream max-w-xs truncate">
                      {wo.incident?.title || 'Maintenance Repair'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300 whitespace-nowrap">
                      {wo.incident?.room ? `${wo.incident.room.building?.code || 'B'}-${wo.incident.room.code}` : 'Campus wide'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={wo.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400 whitespace-nowrap">
                      {wo.requiredSkill?.name || 'General Maintenance'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5 font-mono text-xs">
                        {wo.status === 'ASSIGNED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWo(wo);
                              setActiveModal('START');
                            }}
                            className="px-2.5 py-1 bg-brandLime text-brandDark font-bold rounded"
                          >
                            Start Work
                          </button>
                        )}
                        {wo.status === 'IN_PROGRESS' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWo(wo);
                                setActiveModal('BLOCK');
                              }}
                              className="px-2 py-1 bg-yellow-600 text-black font-bold rounded"
                            >
                              Block (Spares)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWo(wo);
                                setActiveModal('COMPLETE');
                              }}
                              className="px-2 py-1 bg-emerald-600 text-white font-bold rounded"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        {wo.status === 'BLOCKED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWo(wo);
                              setActiveModal('RESUME');
                            }}
                            className="px-2.5 py-1 bg-cyan-500 text-black font-bold rounded"
                          >
                            Resume Work
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Transitions */}
      {activeModal && selectedWo && (
        <ActionModal
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setSelectedWo(null);
            setModalComment('');
          }}
          title={`${activeModal} Work Order #${selectedWo.id}`}
          subtitle={`Incident: ${selectedWo.incident?.title || 'Hardware Repair'}`}
          confirmText={activeModal === 'START' ? 'Confirm Start' : activeModal === 'BLOCK' ? 'Confirm Block' : activeModal === 'RESUME' ? 'Confirm Resume' : 'Confirm Complete'}
          onConfirm={() => {
            if (activeModal === 'START') handleAction('IN_PROGRESS');
            else if (activeModal === 'BLOCK') handleAction('BLOCKED', modalComment || 'Awaiting optical transceiver spare');
            else if (activeModal === 'RESUME') handleAction('IN_PROGRESS');
            else if (activeModal === 'COMPLETE') handleAction('COMPLETED');
          }}
          loading={actionLoading}
        >
          <div className="space-y-3 font-mono text-xs text-brandCream">
            <p className="text-neutral-300">
              {activeModal === 'START' && 'You are moving this work order to IN_PROGRESS. Physical tools and spare inventory will be checked.'}
              {activeModal === 'BLOCK' && 'Work paused pending replacement parts. Enter blocking reason to trigger an automatic Purchase Request notice:'}
              {activeModal === 'RESUME' && 'Inventory has verified received stock. Resume on-site technician repair.'}
              {activeModal === 'COMPLETE' && 'Confirm that electrical socket or equipment has been safely repaired, tested, and restored.'}
            </p>
            {activeModal === 'BLOCK' && (
              <input
                type="text"
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
                placeholder="Reason (e.g. Optical transceiver out of stock in central inventory)..."
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:outline-none focus:border-brandLime"
              />
            )}
            {activeModal === 'COMPLETE' && (
              <input
                type="text"
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
                placeholder="Resolution notes (e.g. Replaced 16A modular socket, tested voltage 230V)..."
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:outline-none focus:border-brandLime"
              />
            )}
          </div>
        </ActionModal>
      )}
    </div>
  );
};
