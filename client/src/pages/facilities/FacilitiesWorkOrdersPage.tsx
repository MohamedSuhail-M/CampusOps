import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';

export const FacilitiesWorkOrdersPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiFetch<any[]>('/api/work-orders')
      .then((res) => {
        if (res.success && res.data) {
          setWorkOrders(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'FACILITIES ADMIN', path: '/app/facilities/triage' }, { label: 'CAMPUS WORK ORDERS' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Campus-wide Work Order Ledger
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Real-time oversight of all maintenance jobs, assigned technicians, and parts blockages.
        </p>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading work orders...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">WO ID</th>
                  <th className="py-3 px-4">Incident Reference</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Required Skill</th>
                  <th className="py-3 px-4">Blockage Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                      {wo.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-brandCream">
                      {wo.incident?.title || 'Maintenance Repair'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {wo.assignee?.name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={wo.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">
                      {wo.requiredSkill?.name || 'General'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400 max-w-xs truncate">
                      {wo.blockedReason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
