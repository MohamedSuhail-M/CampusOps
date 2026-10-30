import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import {
  ShoppingBag,
  CheckCircle,
  XCircle,
  PackageCheck,
  AlertTriangle,
  RefreshCw,
  Layers,
} from 'lucide-react';

export const ProcurementView: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPr, setSelectedPr] = useState<any | null>(null);
  const [receiptItemId, setReceiptItemId] = useState('');
  const [receiptQty, setReceiptQty] = useState(1);
  const [receiptCondition, setReceiptCondition] = useState<'ACCEPTED' | 'DAMAGED'>('ACCEPTED');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prRes, invRes] = await Promise.all([
        apiFetch('/api/procurement/requests'),
        apiFetch('/api/inventory'),
      ]);
      if (prRes.success) setRequests(prRes.data || []);
      if (invRes.success) setInventory(invRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    setActionMessage(null);
    const comment = prompt(`Enter comments for ${decision}ing request ${id}:`, 'Approved based on operational requirements.');
    if (comment === null) return;

    const res = await apiFetch(`/api/procurement/requests/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, comment }),
    });

    if (res.success) {
      setActionMessage(`Request ${id} ${decision}d. Note: Stock remains unchanged until physical delivery.`);
      fetchData();
    } else {
      alert(res.error?.message || 'Action failed');
    }
  };

  const handleOpenReceipt = (pr: any) => {
    setSelectedPr(pr);
    if (pr.lines?.length > 0) {
      setReceiptItemId(pr.lines[0].itemId);
      setReceiptQty(pr.lines[0].quantity);
    }
    setShowReceiptModal(true);
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPr) return;
    setActionMessage(null);

    const res = await apiFetch('/api/procurement/receipts', {
      method: 'POST',
      body: JSON.stringify({
        purchaseRequestId: selectedPr.id,
        itemId: receiptItemId,
        quantityReceived: Number(receiptQty),
        condition: receiptCondition,
      }),
    });

    if (res.success) {
      setActionMessage(
        `Physical stock received into inventory! ${
          res.data?.workOrderResumed ? 'Waiting blocked work order unblocked and resumed!' : ''
        }`
      );
      setShowReceiptModal(false);
      fetchData();
    } else {
      alert(res.error?.message || 'Receipt failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream tracking-tight">Procurement & Inventory Operations</h1>
          <p className="text-sm text-neutral-400">
            Independent purchase request approvals (Anti-Self-Approval enforced) and physical goods receipt.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-charcoal-800 hover:bg-charcoal-700 text-cream px-3.5 py-2 rounded-lg text-xs font-semibold border border-charcoal-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-lime" />
          Refresh Ledger
        </button>
      </div>

      {actionMessage && (
        <div className="bg-lime/10 border border-lime/30 text-lime text-xs rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {actionMessage}
        </div>
      )}

      {/* Pending Approval Queue */}
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-charcoal-700 pb-3">
          <ShoppingBag className="w-5 h-5 text-lime" />
          <h2 className="font-bold text-cream text-base">Purchase Requests Queue ({requests.length})</h2>
        </div>

        {loading ? (
          <div className="text-center py-6 text-xs text-neutral-400">Loading purchase requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-400">No purchase requests found.</div>
        ) : (
          <div className="space-y-4">
            {requests.map((pr) => (
              <div
                key={pr.id}
                className="bg-charcoal-800 border border-charcoal-700 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lime font-bold text-xs">{pr.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        pr.status === 'APPROVED'
                          ? 'bg-lime/20 text-lime border border-lime/30'
                          : pr.status === 'RECEIVED'
                          ? 'bg-info/20 text-info border border-info/30'
                          : pr.status === 'REJECTED'
                          ? 'bg-critical/20 text-critical border border-critical/30'
                          : 'bg-warning/20 text-warning border border-warning/30'
                      }`}
                    >
                      {pr.status}
                    </span>
                    {pr.workOrderId && (
                      <span className="text-[10px] bg-charcoal-700 text-neutral-300 px-2 py-0.5 rounded">
                        For Work Order: {pr.workOrderId}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-cream text-sm">{pr.reason}</h3>

                  <div className="text-xs text-neutral-400">
                    Requested by: <span className="text-cream">{pr.requester?.name}</span> · Items:{' '}
                    {pr.lines?.map((l: any) => `${l.quantity}x ${l.item?.name} (${l.itemId})`).join(', ')}
                  </div>

                  {pr.estimatedTotal && (
                    <div className="text-xs text-neutral-300 font-semibold">
                      Estimated Cost: ₹{pr.estimatedTotal.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {pr.status === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        onClick={() => handleDecision(pr.id, 'APPROVE')}
                        className="bg-lime hover:bg-lime-hover text-obsidian text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(pr.id, 'REJECT')}
                        className="bg-critical/20 hover:bg-critical/30 text-critical border border-critical/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}

                  {pr.status === 'APPROVED' && (
                    <button
                      onClick={() => handleOpenReceipt(pr)}
                      className="bg-info hover:bg-info/80 text-obsidian text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Receive Physical Stock
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Inventory Ledger */}
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-charcoal-700 pb-3">
          <Layers className="w-5 h-5 text-lime" />
          <h2 className="font-bold text-cream text-base">Campus Inventory Ledger ({inventory.length} Items)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-charcoal-800 text-neutral-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">On Hand</th>
                <th className="py-2.5 px-3">Active Reserved</th>
                <th className="py-2.5 px-3">Available</th>
                <th className="py-2.5 px-3">Reorder Level</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-charcoal-800/40 transition">
                  <td className="py-2.5 px-3 font-mono text-lime font-bold">{item.sku}</td>
                  <td className="py-2.5 px-3 font-semibold text-cream">{item.name}</td>
                  <td className="py-2.5 px-3 font-mono">{item.quantityOnHand} {item.unit}</td>
                  <td className="py-2.5 px-3 font-mono text-neutral-400">{item.activeReservedQuantity}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-cream">{item.availableQuantity}</td>
                  <td className="py-2.5 px-3 font-mono text-neutral-400">{item.reorderLevel}</td>
                  <td className="py-2.5 px-3">
                    {item.isLowStock ? (
                      <span className="bg-critical/20 text-critical border border-critical/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3" />
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="bg-lime/20 text-lime border border-lime/30 text-[10px] font-bold px-2 py-0.5 rounded">
                        ADEQUATE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-cream text-base mb-2">Record Physical Delivery</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Physical receipt will increment stock-on-hand, log a positive stock movement, and resume any waiting blocked work order.
            </p>
            <form onSubmit={handleReceiveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Select Item Delivered</label>
                <select
                  value={receiptItemId}
                  onChange={(e) => setReceiptItemId(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-cream focus:outline-none focus:border-lime"
                >
                  {selectedPr?.lines?.map((l: any) => (
                    <option key={l.itemId} value={l.itemId}>
                      {l.item?.name || l.itemId} (Ordered: {l.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Quantity Received</label>
                <input
                  type="number"
                  min="1"
                  value={receiptQty}
                  onChange={(e) => setReceiptQty(Number(e.target.value))}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-cream focus:outline-none focus:border-lime"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Inspection Condition</label>
                <select
                  value={receiptCondition}
                  onChange={(e) => setReceiptCondition(e.target.value as any)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-cream focus:outline-none focus:border-lime"
                >
                  <option value="ACCEPTED">ACCEPTED (Passes inspection)</option>
                  <option value="DAMAGED">DAMAGED (Rejected)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-lime hover:bg-lime-hover text-obsidian font-bold text-xs px-4 py-1.5 rounded-lg"
                >
                  Confirm Physical Stock Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
