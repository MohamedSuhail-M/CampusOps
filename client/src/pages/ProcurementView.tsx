import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { NavItem } from '../components/common/AppSidebar';
import { MetricCard } from '../components/common/MetricCard';
import { ActionModal } from '../components/common/ActionModal';
import {
  ShoppingBag,
  CheckCircle,
  PackageCheck,
  AlertTriangle,
  RefreshCw,
  Layers,
  ShieldAlert,
  Gavel,
} from 'lucide-react';

export const ProcurementView: React.FC = () => {
  const { user } = useAuth();

  const [activeNav, setActiveNav] = useState('requests');
  const [searchQuery, setSearchQuery] = useState('');
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
    const comment = prompt(
      `Enter authorization notes for ${decision}ing purchase request ${id}:`,
      'Approved per operational compliance policy 4.2.'
    );
    if (comment === null) return;

    const res = await apiFetch(`/api/procurement/requests/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, comment }),
    });

    if (res.success) {
      setActionMessage(
        `Purchase Request ${id} ${decision}d. Note: Stock remains unchanged until physical delivery.`
      );
      fetchData();
    } else {
      alert(res.error?.message || 'Action failed (Check Anti-Self-Approval policy)');
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
          res.data?.workOrderResumed
            ? 'Waiting blocked work order automatically unblocked and resumed!'
            : ''
        }`
      );
      setShowReceiptModal(false);
      fetchData();
    } else {
      alert(res.error?.message || 'Receipt failed');
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let received = 0;

    requests.forEach((r) => {
      if (r.status === 'PENDING_APPROVAL') pending += 1;
      else if (r.status === 'APPROVED') approved += 1;
      else if (r.status === 'RECEIVED') received += 1;
    });

    return { pending, approved, received };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const query = searchQuery.toLowerCase();
    return requests.filter(
      (r) =>
        r.id?.toLowerCase().includes(query) ||
        r.reason?.toLowerCase().includes(query) ||
        r.requester?.name?.toLowerCase().includes(query) ||
        r.status?.toLowerCase().includes(query)
    );
  }, [requests, searchQuery]);

  const navItems: NavItem[] = [
    { id: 'requests', label: 'Purchase Requests', icon: 'shopping_bag', badge: requests.length.toString() },
    { id: 'inventory', label: 'Inventory Ledger', icon: 'inventory_2' },
    { id: 'receipts', label: 'Stock Receipts', icon: 'fact_check' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications', badge: '1', badgeColor: 'lime' },
    { id: 'help', label: 'Policy Rules', icon: 'gavel' },
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
              <span className="text-brandCream">PROCUREMENT DESK</span>
              <span className="px-2 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-brandLime font-bold text-[10px]">
                ROLE: PROCUREMENT MANAGER
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-brandCream uppercase font-bold tracking-tight">
                {user?.name || 'Mr. Dinesh I'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-neutral-400 font-mono text-xs">
                CENTRAL PROCUREMENT • COMPLIANCE LEVEL 4
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1C1C] text-brandLime font-mono text-xs border border-brandLime/30">
                <span className="w-1.5 h-1.5 rounded-full bg-brandLime animate-pulse" />
                AUDIT LOGGED
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
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="bg-lime-100 border-2 border-brandDark text-brandDark font-mono text-xs rounded-xl p-3 flex items-center gap-2 shadow-[3px_3px_0px_#0A0A0A]">
            <CheckCircle className="w-4 h-4 text-green-700 shrink-0" />
            <span className="font-bold">LEDGER NOTIFICATION:</span> {actionMessage}
          </div>
        )}

        {/* Hero Editorial Banner */}
        <div className="relative w-full overflow-hidden bg-brandCream rounded-2xl p-6 lg:p-8 border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] text-brandDark">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brandDark font-bold mb-2">
                <span className="px-2 py-0.5 rounded bg-brandLime border border-brandDark font-bold">
                  PROCUREMENT DESK
                </span>
                <span>//</span>
                <span>COMPLIANCE ENGINE LEVEL 4</span>
                <span>//</span>
                <span className="text-neutral-600">SYS-ACTIVE</span>
              </div>
              <h1 className="font-display text-3xl md:text-5xl uppercase tracking-tight text-brandDark leading-none font-bold">
                PURCHASES.{' '}
                <span className="underline decoration-brandLime decoration-4 underline-offset-4">
                  UNDER CONTROL.
                </span>
              </h1>
              <p className="font-body text-sm md:text-base text-[#1C1C1C] mt-2 max-w-xl font-medium leading-relaxed">
                Dual-control purchase authorization and physical receiving verification. Requesters
                cannot approve their own orders.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="bg-white text-brandDark px-4 py-2.5 rounded-xl flex items-center gap-3 border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A]">
                <Gavel className="w-5 h-5 text-brandDark" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                    Comptroller Signoff
                  </span>
                  <span className="font-display text-sm font-bold text-brandDark">
                    {user?.name || 'Mr. Dinesh I'} (Active)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 KPI Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Pending Approval"
            subtitle="Dual-Sign Queue"
            value={metrics.pending.toString().padStart(2, '0')}
            variant="cream"
            badge="CRITICAL"
            progressPercent={metrics.pending > 0 ? 60 : 0}
            metaText="Awaiting authorization"
            icon="gavel"
          />
          <MetricCard
            title="Awaiting Delivery"
            subtitle="Approved Orders"
            value={metrics.approved.toString().padStart(2, '0')}
            variant="lime"
            badge="DISPATCHED"
            progressPercent={metrics.approved > 0 ? 80 : 0}
            metaText="Vendors en route"
            icon="local_shipping"
          />
          <MetricCard
            title="Received"
            subtitle="Ledger Matched"
            value={metrics.received.toString().padStart(2, '0')}
            variant="cream"
            badge="VERIFIED"
            progressPercent={100}
            metaText="Intake scans credited"
            icon="verified"
          />
        </div>

        {/* Dual-Control Safeguard Banner */}
        <div className="bg-brandCream text-brandDark rounded-xl p-5 border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-lg bg-brandDark text-brandLime flex items-center justify-center shrink-0 border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A]">
              <ShieldAlert className="w-6 h-6 text-brandLime" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-lg uppercase text-brandDark font-bold tracking-wide">
                  DUAL-CONTROL SAFEGUARD ACTIVE (POLICY 4.2)
                </span>
                <span className="px-2 py-0.5 rounded bg-brandDark text-brandCream font-mono text-[10px] font-bold">
                  ANTI-SELF-APPROVAL
                </span>
              </div>
              <p className="font-body text-xs text-neutral-700 font-medium mt-1 leading-relaxed">
                Requesters cannot approve their own purchases. Stock is not marked as received until
                a physical receiving scan is completed at the loading dock.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-1 rounded-lg bg-brandLime text-brandDark border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] font-mono text-xs uppercase font-bold">
              POLICY ENFORCED
            </span>
          </div>
        </div>

        {/* Two Columns: Purchase Requests Table & Stock Shortage Alert */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Purchase Requests */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="bg-brandCream text-brandDark rounded-xl p-5 md:p-6 border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-brandDark">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brandDark" />
                  <h2 className="font-display text-xl uppercase text-brandDark font-bold tracking-wide">
                    PURCHASE REQUESTS ({filteredRequests.length})
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-brandLime text-brandDark border border-brandDark font-mono text-xs font-bold">
                  {metrics.pending} PENDING SIGNOFF
                </span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs font-mono text-neutral-500">
                  Loading requests from central ledger...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-neutral-500">
                  No purchase requests found.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left font-body text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#E5E1D8] text-brandDark font-mono text-[11px] uppercase tracking-wider border-b-2 border-brandDark">
                        <th className="py-2.5 px-3 font-bold rounded-l-lg">PR REF / ITEM</th>
                        <th className="py-2.5 px-3 text-center font-bold">QTY</th>
                        <th className="py-2.5 px-3 font-bold">REQUESTER</th>
                        <th className="py-2.5 px-3 font-bold">STATUS</th>
                        <th className="py-2.5 px-3 text-right font-bold rounded-r-lg">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brandDark/15">
                      {filteredRequests.map((pr) => {
                        const isPending = pr.status === 'PENDING_APPROVAL';
                        const isApproved = pr.status === 'APPROVED';

                        return (
                          <tr key={pr.id} className="hover:bg-[#EBE7DF] transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold bg-brandLime text-brandDark px-1.5 py-0.5 rounded border border-brandDark shadow-[1px_1px_0px_#0A0A0A]">
                                  {pr.id}
                                </span>
                                <span className="font-bold text-brandDark">
                                  {pr.lines?.[0]?.item?.name || pr.reason}
                                </span>
                              </div>
                              <div className="text-[11px] text-neutral-600 font-mono mt-0.5">
                                {pr.workOrderId ? `Work Order #${pr.workOrderId}` : 'Stock Replenish'}
                                {pr.estimatedTotal ? ` • ₹${pr.estimatedTotal.toLocaleString()}` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-brandDark">
                              {pr.lines?.[0]?.quantity || 1}
                            </td>
                            <td className="py-3 px-3 font-mono text-xs">
                              <span className="font-bold text-brandDark">
                                {pr.requester?.name || 'Field Technician'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : isApproved
                                    ? 'bg-brandLime text-brandDark border-brandDark'
                                    : pr.status === 'RECEIVED'
                                    ? 'bg-[#E0DCD4] text-brandDark border-brandDark'
                                    : 'bg-red-100 text-red-800 border-red-300'
                                }`}
                              >
                                {pr.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isPending && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDecision(pr.id, 'APPROVE')}
                                    className="bg-brandDark text-brandLime hover:bg-neutral-800 font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 rounded border border-brandDark cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDecision(pr.id, 'REJECT')}
                                    className="bg-white text-red-700 hover:bg-neutral-100 font-mono text-[10px] font-bold uppercase px-2 py-1.5 rounded border border-red-400 cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceipt(pr)}
                                  className="bg-brandLime hover:bg-[#b2dc26] text-brandDark font-mono text-[10px] font-bold uppercase px-3 py-1.5 rounded border border-brandDark shadow-[1px_1px_0px_#0A0A0A] cursor-pointer inline-flex items-center gap-1"
                                >
                                  <PackageCheck className="w-3 h-3" />
                                  <span>Receive Stock</span>
                                </button>
                              )}
                              {pr.status === 'RECEIVED' && (
                                <span className="font-mono text-[10px] text-neutral-500 uppercase font-bold">
                                  CREDITED
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Live Campus Inventory Ledger */}
            <div className="bg-brandCream text-brandDark rounded-xl p-5 md:p-6 border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-brandDark">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brandDark" />
                  <h2 className="font-display text-xl uppercase font-bold text-brandDark">
                    CAMPUS INVENTORY LEDGER ({inventory.length} SKUs)
                  </h2>
                </div>
                <span className="font-mono text-xs text-neutral-600">
                  REAL-TIME ACID RESERVATIONS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E5E1D8] text-brandDark font-mono text-[11px] uppercase tracking-wider border-b-2 border-brandDark">
                      <th className="py-2.5 px-3 font-bold rounded-l-lg">SKU / ITEM</th>
                      <th className="py-2.5 px-3 font-mono font-bold">ON HAND</th>
                      <th className="py-2.5 px-3 font-mono font-bold">RESERVED</th>
                      <th className="py-2.5 px-3 font-mono font-bold">AVAILABLE</th>
                      <th className="py-2.5 px-3 font-bold rounded-r-lg text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brandDark/15 text-brandDark">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-[#EBE7DF] transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-brandDark block">{item.sku}</span>
                          <span className="text-neutral-700 text-xs font-medium">{item.name}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold">
                          {item.quantityOnHand} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600">
                          {item.activeReservedQuantity}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-brandDark">
                          {item.availableQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {item.isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 font-mono text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-brandLime text-brandDark border border-brandDark font-mono text-[10px] font-bold">
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
          </div>

          {/* Right Column (4 cols): Stock Shortage Alerts */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-brandCream text-brandDark rounded-xl p-5 border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-brandDark">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-brandDark" />
                  <h3 className="font-display text-lg uppercase font-bold text-brandDark">
                    STOCK SHORTAGE ALERT
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-brandDark text-brandLime font-mono text-[10px] font-bold">
                  ATTENTION
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl flex flex-col gap-3 border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-brandDark truncate">
                    Wi-Fi Transceiver 5GHz (C-Wing)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-brandLime text-brandDark border border-brandDark font-mono text-[10px] font-bold shrink-0">
                    DEPLETED
                  </span>
                </div>
                <p className="font-body text-xs text-neutral-600 font-medium leading-relaxed">
                  0 units available in Central Store. Work Order for Building C lab Wi-Fi failure is
                  currently blocked awaiting PO receipt.
                </p>
                <div className="flex items-center justify-between pt-2 border-t-2 border-brandDark">
                  <span className="font-mono text-[10px] text-neutral-500 font-bold">
                    CENTRAL STORE // BAY 2
                  </span>
                  <span className="font-mono text-[10px] text-brandDark font-bold bg-neutral-200 px-2 py-0.5 rounded">
                    SCENARIO 2 CRITICAL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ActionModal: Goods Receipt Intake */}
        <ActionModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Physical Goods Intake & Dock Verification"
          subtitle={`PURCHASE REQUEST: ${selectedPr?.id} • AUTO-RESUMES BLOCKED WORK ORDER`}
        >
          <form onSubmit={handleReceiveStock} className="space-y-4 font-body">
            <p className="text-xs text-neutral-600">
              Confirm physical delivery of goods at the central loading dock. Completing this intake
              increments available stock in the inventory ledger and triggers auto-resumption for any
              waiting work order.
            </p>

            <div>
              <label className="block text-xs font-mono font-bold text-brandDark mb-1">
                ITEM TO RECEIVE
              </label>
              <input
                type="text"
                readOnly
                value={receiptItemId}
                className="w-full bg-neutral-100 border-2 border-brandDark rounded-lg p-2 text-xs font-mono text-brandDark font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-brandDark mb-1">
                DELIVERED QUANTITY (PHYSICALLY COUNTED)
              </label>
              <input
                type="number"
                min="1"
                required
                value={receiptQty}
                onChange={(e) => setReceiptQty(Number(e.target.value))}
                className="w-full bg-white border-2 border-brandDark rounded-lg p-2 text-xs font-mono text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-brandDark mb-1">
                INSPECTION CONDITION
              </label>
              <select
                value={receiptCondition}
                onChange={(e) => setReceiptCondition(e.target.value as any)}
                className="w-full bg-white border-2 border-brandDark rounded-lg p-2 text-xs font-mono text-brandDark focus:outline-none focus:ring-2 focus:ring-brandLime shadow-[2px_2px_0px_#0A0A0A]"
              >
                <option value="ACCEPTED">ACCEPTED (Pristine / Factory Sealed)</option>
                <option value="DAMAGED">DAMAGED (Rejected at Dock)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase text-neutral-600 hover:text-brandDark"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brandLime text-brandDark font-display font-bold text-xs uppercase px-5 py-2 rounded-lg border-2 border-brandDark shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b2dc26] transition"
              >
                Sign Off &amp; Credit Inventory →
              </button>
            </div>
          </form>
        </ActionModal>
      </div>
    </DashboardLayout>
  );
};
