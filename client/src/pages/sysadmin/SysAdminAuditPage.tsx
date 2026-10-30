import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const SysAdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiFetch<any[]>('/api/admin/audit-logs')
      .then((res) => {
        if (res.success && res.data) setLogs(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'SYSTEM ADMIN', path: '/app/sysadmin/overview' }, { label: 'AUDIT & SECURITY' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Immutable System Audit Ledger
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Cryptographically timestamped transaction log of every incident, room relocation, and procurement decision.
        </p>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Querying audit log ledger...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                      {log.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-brandCream">
                      <span className="px-2 py-0.5 rounded bg-[#242424] border border-[#353535]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {log.actor?.name || log.actorId || 'SYSTEM'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">
                      {log.entityType}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">
                      {log.entityId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
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
