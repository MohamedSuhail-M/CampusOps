import React, { useState } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const ProcurementReceiptsPage: React.FC = () => {
  const [purchaseRequestId, setPurchaseRequestId] = useState<string>('PR-002');
  const [waybill, setWaybill] = useState<string>('WB-2026-9811');
  const [quantityReceived, setQuantityReceived] = useState<number>(2);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [receiptSuccess, setReceiptSuccess] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setReceiptSuccess(null);

    try {
      const res = await apiFetch('/api/procurement/receipts', {
        method: 'POST',
        body: JSON.stringify({
          purchaseRequestId,
          carrier: 'BlueDart Express',
          waybillNumber: waybill,
          items: [{ inventoryItemId: 'INV-NET-01', quantityReceived: Number(quantityReceived) }],
        }),
      });

      if (res.success) {
        setReceiptSuccess(res.data);
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
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'PROCUREMENT', path: '/app/procurement/requests' }, { label: 'PHYSICAL DOCK GOODS RECEIPTS' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Physical Dock Goods Receipt Console
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Scenario 2 Pipeline: Receipt at central loading dock automatically replenishes inventory and resumes blocked technician work orders.
        </p>
      </div>

      <div className="bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl p-6 space-y-6">
        <form onSubmit={handleReceiveGoods} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 uppercase mb-1">Approved Purchase Request ID:</label>
              <input
                type="text"
                value={purchaseRequestId}
                onChange={(e) => setPurchaseRequestId(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
                placeholder="e.g. PR-002"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Carrier Waybill / Tracking #:</label>
              <input
                type="text"
                value={waybill}
                onChange={(e) => setWaybill(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 uppercase mb-1">Inventory Item:</label>
              <input
                type="text"
                disabled
                value="INV-NET-01: 10G SFP+ Optical Transceiver"
                className="w-full bg-[#242424] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-neutral-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Quantity Received:</label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantityReceived}
                onChange={(e) => setQuantityReceived(Number(e.target.value))}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950 border border-red-700 rounded-xl text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all"
          >
            {submitting ? 'Verifying Delivery...' : 'Acknowledge Delivery & Auto-Resume Blocked Jobs'}
          </button>
        </form>

        {receiptSuccess && (
          <div className="p-5 bg-emerald-950/40 border border-emerald-700 rounded-xl space-y-3 font-mono text-xs text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <span className="material-symbols-outlined">verified</span>
              <span>Dock Receipt Verified &amp; Work Orders Auto-Resumed!</span>
            </div>
            <p>
              Receipt <strong>{receiptSuccess.receiptId || 'RCP-2026-DOCK'}</strong> logged in inventory ledger.
            </p>
            <p className="text-[11px] text-neutral-300">
              Blocked Work Order <strong>WO-005 (C-Wing Lab AP-042)</strong> has been automatically unblocked and moved to <strong>IN_PROGRESS</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
