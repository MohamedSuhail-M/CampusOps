import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const ProcurementReceiptsPage: React.FC = () => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [approvedPrs, setApprovedPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [selectedPrId, setSelectedPrId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [carrier, setCarrier] = useState<string>('BlueDart Express');
  const [waybill, setWaybill] = useState<string>('WB-2026-9811');
  const [quantityReceived, setQuantityReceived] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [receiptSuccess, setReceiptSuccess] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReceiptsAndPrs = async () => {
    try {
      const [recRes, prRes] = await Promise.all([
        apiFetch<any[]>('/api/procurement/receipts'),
        apiFetch<any[]>('/api/procurement/requests'),
      ]);
      if (recRes.success && recRes.data) {
        setReceipts(recRes.data);
      }
      if (prRes.success && prRes.data) {
        const approved = prRes.data.filter((p: any) => p.status === 'APPROVED');
        setApprovedPrs(approved);
        if (approved.length > 0 && !selectedPrId) {
          setSelectedPrId(approved[0].id);
          const firstLine = approved[0].lines?.[0];
          if (firstLine) {
            setSelectedItemId(firstLine.itemId);
            setQuantityReceived(firstLine.quantity || 1);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiptsAndPrs();
  }, []);

  const handlePrSelect = (prId: string) => {
    setSelectedPrId(prId);
    const pr = approvedPrs.find((p) => p.id === prId);
    if (pr?.lines?.[0]) {
      setSelectedItemId(pr.lines[0].itemId);
      setQuantityReceived(pr.lines[0].quantity || 1);
    }
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setReceiptSuccess(null);

    try {
      const res = await apiFetch('/api/procurement/receipts', {
        method: 'POST',
        body: JSON.stringify({
          purchaseRequestId: selectedPrId,
          itemId: selectedItemId || 'INV-NET-01',
          quantityReceived: Number(quantityReceived),
          carrier,
          waybillNumber: waybill,
        }),
      });

      if (res.success) {
        setReceiptSuccess(res.data);
        await fetchReceiptsAndPrs();
      } else {
        setErrorMsg(res.error?.message || 'Failed to record dock receipt.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'PROCUREMENT', path: '/app/procurement/requests' },
          { label: 'PHYSICAL DOCK GOODS RECEIPTS' },
        ]}
      />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Physical Dock Goods Receipt Console
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Receipt at central loading dock automatically replenishes inventory on-hand, logs an immutable stock movement, and unblocks waiting work orders.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receipt Submission Form (1 col) */}
        <div className="bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-3">
            <span className="material-symbols-outlined text-brandLime text-lg">local_shipping</span>
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Receive Incoming Delivery
            </h2>
          </div>

          <form onSubmit={handleReceiveGoods} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-neutral-400 uppercase mb-1">Select Approved Purchase Request:</label>
              {approvedPrs.length > 0 ? (
                <select
                  value={selectedPrId}
                  onChange={(e) => handlePrSelect(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
                >
                  {approvedPrs.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.id}: {pr.lines?.[0]?.item?.name || 'Spares'} ({pr.lines?.[0]?.quantity} qty)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedPrId}
                  onChange={(e) => setSelectedPrId(e.target.value)}
                  placeholder="e.g. PR-002"
                  className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
                />
              )}
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Carrier / Logistics Provider:</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Waybill / Tracking #:</label>
              <input
                type="text"
                value={waybill}
                onChange={(e) => setWaybill(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Quantity Received:</label>
              <input
                type="number"
                min={1}
                max={100}
                value={quantityReceived}
                onChange={(e) => setQuantityReceived(Number(e.target.value))}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            {receiptSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-700/60 rounded-xl space-y-1 text-emerald-300 text-xs">
                <p className="font-bold">✓ Dock Goods Receipt Recorded!</p>
                <p className="text-[11px] font-mono">
                  Receipt ID: {receiptSuccess.receipt?.id || receiptSuccess.id || 'RCV-SUCCESS'}
                </p>
                <p className="text-[10px] text-neutral-300">
                  Physical stock updated and movement ledger logged.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-red-950 border border-red-700 rounded-lg text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all"
            >
              {submitting ? 'Recording Receipt...' : 'Record Inward Goods Receipt'}
            </button>
          </form>
        </div>

        {/* Existing Receipts Ledger Table (2 cols) */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Stock Inward Delivery Receipts ({receipts.length})
            </h2>
            <span className="font-mono text-xs text-brandLime font-bold">Live Database Ledger</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-neutral-400">
              <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading stock receipts...
            </div>
          ) : receipts.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              No stock receipts recorded yet. Process an incoming shipment above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Receipt ID</th>
                    <th className="py-3 px-3">Item Received</th>
                    <th className="py-3 px-3">Qty</th>
                    <th className="py-3 px-3">PR Ref</th>
                    <th className="py-3 px-3">Received By</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-brandLime whitespace-nowrap">
                        {r.id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-brandCream">
                        {r.item?.name || r.itemId}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-300 font-bold">
                        +{r.quantityReceived}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-400">
                        {r.purchaseRequestId}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-400">
                        {r.receiver?.name || 'Staff'}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-500 whitespace-nowrap">
                        {new Date(r.receivedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
