import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';

export const DeptManagerIssuesPage: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiFetch<any[]>('/api/incidents')
      .then((res) => {
        if (res.success && res.data) {
          setIncidents(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'DEPARTMENT MANAGER', path: '/app/dept-manager/home' }, { label: 'DEPARTMENT ISSUES' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Department Maintenance Incidents
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Active operational issues logged within Computer Science &amp; Engineering department blocks.
        </p>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading department issues...
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-500">
            No active incidents found in department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Incident Title</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                      {inc.reference || inc.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brandCream max-w-xs truncate">
                      {inc.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300 whitespace-nowrap">
                      {inc.room ? `${inc.room.building?.code || 'B'}-${inc.room.code}` : 'Campus wide'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">
                      {inc.category}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={inc.priority} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-500 whitespace-nowrap">
                      {new Date(inc.createdAt).toLocaleDateString()}
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
