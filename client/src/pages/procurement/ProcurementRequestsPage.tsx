import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { useTranslation } from '../../i18n/LanguageContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionModal } from '../../components/common/ActionModal';

export const ProcurementRequestsPage: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPr, setSelectedPr] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPrs = async () => {
    try {
      const res = await apiFetch<any[]>('/api/procurement/requests');
      if (res.success && res.data) setRequests(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrs();
  }, []);

  const handleDecision = async () => {
    if (!selectedPr || !actionType) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/procurement/requests/${selectedPr.id}/decide`, {
        method: 'POST',
        body: JSON.stringify({
          decision: actionType,
          comments: decisionNotes || (actionType === 'APPROVE' ? 'Approved under Policy 4.2' : 'Budget rejected'),
        }),
      });
      if (res.success) {
        await fetchPrs();
        setSelectedPr(null);
        setActionType(null);
        setDecisionNotes('');
      } else {
        setErrorMsg(res.error?.message || 'Failed to submit approval decision.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: t.nav.purchaseRequests, path: '/app/procurement/requests' }, { label: t.dashboards.procurement.title }]} />

      {/* Dual Control Banner */}
      <div className="bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brandLime/10 border border-brandLime/40 rounded-full text-brandLime font-mono text-[10px] font-bold uppercase tracking-wider">
            {t.dashboards.procurement.dualSign}
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold uppercase tracking-tight text-brandCream">
            {t.dashboards.procurement.title}
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-300 max-w-xl">
            {t.dashboards.procurement.subtitle}
          </p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
            {t.dashboards.procurement.pendingRequests}
          </h2>
          <span className="font-mono text-xs text-neutral-400">{t.formatNumber(requests.length)} Orders</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            {t.common.loading}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">PR #</th>
                  <th className="py-3 px-4">Item &amp; Description</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Approval Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {requests.map((pr) => (
                  <tr key={pr.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                      {pr.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brandCream">
                      {pr.lines?.[0]?.item?.name || 'Hardware Parts'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {pr.lines?.[0]?.quantity || 1} units
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">
                      {pr.requester?.name || 'Technician'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={pr.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {pr.status === 'SUBMITTED' || pr.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2 font-mono text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPr(pr);
                              setActionType('APPROVE');
                            }}
                            className="px-3 py-1 bg-brandLime text-brandDark font-bold rounded shadow"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPr(pr);
                              setActionType('REJECT');
                            }}
                            className="px-3 py-1 bg-red-950 text-red-300 border border-red-700/60 font-bold rounded"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-neutral-500 uppercase text-[10px]">Decision Recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {selectedPr && actionType && (
        <ActionModal
          isOpen={true}
          onClose={() => {
            setSelectedPr(null);
            setActionType(null);
            setErrorMsg(null);
          }}
          title={`${actionType === 'APPROVE' ? 'Approve' : 'Reject'} Purchase Request #${selectedPr.id}`}
          subtitle={`Requester: ${selectedPr.requester?.name || 'Technician'}`}
          confirmText={actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
          onConfirm={handleDecision}
          loading={submitting}
        >
          <div className="space-y-3 font-mono text-xs text-brandCream">
            <p>
              {actionType === 'APPROVE'
                ? 'Verify budget and dual-control sign-off. Authorize purchase of replacement spare parts:'
                : 'Enter rejection notes explaining reason for purchase denial:'}
            </p>
            <input
              type="text"
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Comments / justification..."
              className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
            />
            {errorMsg && (
              <div className="p-2.5 bg-red-950 border border-red-700 rounded text-red-300 text-xs">
                {errorMsg}
              </div>
            )}
          </div>
        </ActionModal>
      )}
    </div>
  );
};
