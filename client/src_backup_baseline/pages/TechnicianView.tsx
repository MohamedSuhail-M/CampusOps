import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import {
  Wrench,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  PackagePlus,
  RefreshCw,
  Layers,
} from 'lucide-react';

export const TechnicianView: React.FC = () => {
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
      setActionMessage(`Purchase Request ${res.data?.id} submitted. Work order marked as BLOCKED.`);
      setShowPrModal(false);
      fetchData();
    } else {
      alert(res.error?.message || 'Failed to create PR');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream tracking-tight">Technician Workbench</h1>
          <p className="text-sm text-neutral-400">
            Manage assigned repair tasks, update work order lifecycle states, and reserve maintenance spares.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-charcoal-800 hover:bg-charcoal-700 text-cream px-3.5 py-2 rounded-lg text-xs font-semibold border border-charcoal-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-lime" />
          Refresh Orders
        </button>
      </div>

      {actionMessage && (
        <div className="bg-lime/10 border border-lime/30 text-lime text-xs rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {actionMessage}
        </div>
      )}

      {/* Work Orders List */}
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-charcoal-700 pb-3">
          <Wrench className="w-5 h-5 text-lime" />
          <h2 className="font-bold text-cream text-base">Active Work Orders ({workOrders.length})</h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-neutral-400">Loading work orders...</div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-neutral-400">No work orders found.</div>
        ) : (
          <div className="space-y-4">
            {workOrders.map((wo) => (
              <div
                key={wo.id}
                className="bg-charcoal-800 border border-charcoal-700 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-lime font-bold text-xs">{wo.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        wo.status === 'COMPLETED'
                          ? 'bg-lime/20 text-lime border border-lime/30'
                          : wo.status === 'BLOCKED'
                          ? 'bg-critical/20 text-critical border border-critical/30'
                          : wo.status === 'IN_PROGRESS'
                          ? 'bg-info/20 text-info border border-info/30'
                          : 'bg-charcoal-700 text-neutral-300'
                      }`}
                    >
                      {wo.status}
                    </span>
                    {wo.incident?.priority && (
                      <span className="text-[10px] font-semibold bg-charcoal-700 text-neutral-300 px-2 py-0.5 rounded">
                        Priority: {wo.incident.priority}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-cream text-sm">
                    {wo.incident?.title || 'Maintenance Task'}
                  </h3>

                  <p className="text-xs text-neutral-400">
                    Location: {wo.incident?.room?.code} ({wo.incident?.building?.name || 'Main Campus'})
                  </p>

                  {wo.blockedReason && (
                    <div className="bg-critical/10 text-critical text-xs p-2 rounded border border-critical/20 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{wo.blockedReason}</span>
                    </div>
                  )}

                  {/* Active Reservations */}
                  {wo.stockReservations?.length > 0 && (
                    <div className="text-xs text-lime flex items-center gap-1.5 mt-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>
                        Parts Reserved: {wo.stockReservations.map((r: any) => `${r.quantity}x ${r.itemId}`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* State Machine Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {wo.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleTransition(wo.id, 'START')}
                      className="bg-lime hover:bg-lime-hover text-obsidian text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Work
                    </button>
                  )}

                  {wo.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedWo(wo);
                          setShowBlockModal(true);
                        }}
                        className="bg-warning/20 hover:bg-warning/30 text-warning border border-warning/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Block
                      </button>

                      <button
                        onClick={() => {
                          setSelectedWo(wo);
                          setShowPrModal(true);
                        }}
                        className="bg-charcoal-700 hover:bg-charcoal-600 text-cream text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition border border-charcoal-600"
                      >
                        <PackagePlus className="w-3.5 h-3.5 text-lime" />
                        Request Parts
                      </button>

                      <button
                        onClick={() => {
                          setSelectedWo(wo);
                          setShowCompleteModal(true);
                        }}
                        className="bg-lime hover:bg-lime-hover text-obsidian text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete
                      </button>
                    </>
                  )}

                  {wo.status === 'BLOCKED' && (
                    <button
                      onClick={() => handleTransition(wo.id, 'RESUME')}
                      className="bg-info/20 hover:bg-info/30 text-info border border-info/30 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Resume Work
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Reason Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-cream text-base mb-2">Block Work Order</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Enter reason for blocking work order {selectedWo?.id} (e.g., waiting for parts or power shutdown).
            </p>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Awaiting spare transceiver from central store"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2.5 text-xs text-cream mb-4 focus:outline-none focus:border-lime"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-cream"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransition(selectedWo?.id, 'BLOCK', { blockedReason: blockReason })}
                disabled={!blockReason.trim()}
                className="bg-warning text-obsidian font-bold text-xs px-4 py-1.5 rounded-lg disabled:opacity-50"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Resolution Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-cream text-base mb-2">Complete Work Order</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Document resolution to record permanent maintenance history and clear room outages.
            </p>
            <textarea
              rows={3}
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="e.g. Socket safely replaced and circuit tested OK"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2.5 text-xs text-cream mb-4 focus:outline-none focus:border-lime"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-cream"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransition(selectedWo?.id, 'COMPLETE', { resolution: resolutionText })}
                disabled={!resolutionText.trim()}
                className="bg-lime hover:bg-lime-hover text-obsidian font-bold text-xs px-4 py-1.5 rounded-lg disabled:opacity-50"
              >
                Save Resolution & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Parts (PR) Modal */}
      {showPrModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-cream text-base mb-2">Create Purchase Request</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Request out-of-stock spares. Submitting this will automatically mark work order {selectedWo?.id} as BLOCKED.
            </p>
            <form onSubmit={handleCreatePr} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Select Spare Part</label>
                <select
                  value={prItemId}
                  onChange={(e) => setPrItemId(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-cream focus:outline-none focus:border-lime"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - Available: {item.availableQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Quantity Needed</label>
                <input
                  type="number"
                  min="1"
                  value={prQuantity}
                  onChange={(e) => setPrQuantity(Number(e.target.value))}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-cream focus:outline-none focus:border-lime"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Procurement Justification</label>
                <input
                  type="text"
                  required
                  value={prReason}
                  onChange={(e) => setPrReason(e.target.value)}
                  placeholder="e.g. Replacement switch needed to restore network"
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-cream focus:outline-none focus:border-lime"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-lime hover:bg-lime-hover text-obsidian font-bold text-xs px-4 py-1.5 rounded-lg"
                >
                  Submit Purchase Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
