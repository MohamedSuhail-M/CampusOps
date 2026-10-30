import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TechnicianPartsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  // Form for New Purchase Request
  const [selectedItemId, setSelectedItemId] = useState<string>('INV-NET-01');
  const [quantity, setQuantity] = useState<number>(2);
  const [workOrderId, setWorkOrderId] = useState<string>('WO-005');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [prRes, invRes] = await Promise.all([
        apiFetch<any[]>('/api/procurement/requests'),
        apiFetch<any[]>('/api/inventory/items'),
      ]);
      if (prRes.success && prRes.data) setRequests(prRes.data);
      if (invRes.success && invRes.data) setInventory(invRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    try {
      const res = await apiFetch('/api/procurement/requests', {
        method: 'POST',
        body: JSON.stringify({
          workOrderId,
          lines: [{ inventoryItemId: selectedItemId, quantity: Number(quantity) }],
          justification: 'Immediate replacement required for blocked network equipment repair',
        }),
      });
      if (res.success) {
        setSuccessMsg(`Purchase Request created successfully: ${res.data?.id || 'PR-2026-NEW'}`);
        fetchData();
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'TECHNICIAN', path: '/app/technician/work-orders' }, { label: 'PARTS & SPARES REQUESTS' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Hardware Spares & Parts Requests
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Submit purchase requests for depleted inventory to unblock pending work orders.
        </p>
      </div>

      {/* Grid: Create PR Form + Active Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create PR (1 col) */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-3">
            <span className="material-symbols-outlined text-brandLime text-lg">add_shopping_cart</span>
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Request Hardware Spares
            </h2>
          </div>

          <form onSubmit={handleCreatePr} className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-neutral-400 uppercase mb-1">Required Spare Part:</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              >
                {inventory.length > 0 ? (
                  inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (In Stock: {inv.quantityOnHand})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="INV-NET-01">10G SFP+ Optical Transceiver (Stock: 0)</option>
                    <option value="INV-ELE-02">16A Modular Socket (Stock: 4)</option>
                    <option value="INV-AV-01">HDMI 4K Extender Cable (Stock: 1)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Quantity Needed:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Blocked Work Order ID:</label>
              <input
                type="text"
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                placeholder="e.g. WO-005"
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            {successMsg && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all"
            >
              {submitting ? 'Submitting PR...' : 'Submit Purchase Request'}
            </button>
          </form>
        </div>

        {/* Requests List (2 cols) */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Active Purchase Requests
            </h2>
            <span className="font-mono text-xs text-neutral-400">Policy 4.2 Dual-Sign</span>
          </div>

          <div className="divide-y divide-[#2A2A2A]">
            {requests.map((pr) => (
              <div key={pr.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brandLime">{pr.id}</span>
                    <StatusBadge status={pr.status} />
                  </div>
                  <p className="text-xs text-brandCream font-medium">
                    {pr.lines?.[0]?.item?.name || 'Hardware Spares'} ({pr.lines?.[0]?.quantity || 1} units)
                  </p>
                  <p className="text-[10px] font-mono text-neutral-500">
                    Linked to Work Order: {pr.workOrderId || 'N/A'} • Submitted by {pr.requester?.name || 'Technician'}
                  </p>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-neutral-400">{new Date(pr.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
