import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const SysAdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [limit] = useState<number>(25);
  const [offset, setOffset] = useState<number>(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      if (entityTypeFilter !== 'ALL') {
        params.append('entityType', entityTypeFilter);
      }
      const res = await apiFetch<any>(`/api/admin/audit-logs?${params.toString()}`);
      if (res.success && res.data) {
        const logList = Array.isArray(res.data) ? res.data : res.data.logs || [];
        setLogs(logList);
        setTotal(res.data.total || logList.length);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityTypeFilter, offset]);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      log.id?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.entityType?.toLowerCase().includes(q) ||
      log.entityId?.toLowerCase().includes(q) ||
      log.actor?.name?.toLowerCase().includes(q) ||
      log.actorId?.toLowerCase().includes(q)
    );
  });

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'SYSTEM ADMIN', path: '/app/sysadmin/overview' },
          { label: 'AUDIT & SECURITY' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Immutable System Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Tamper-evident transaction history of authentication, triage decisions, facility requests, work orders, and stock movements.
          </p>
        </div>

        <div className="px-4 py-2 bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl font-mono text-xs text-brandLime self-start sm:self-auto font-bold">
          {total} Total Audited Events
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 shadow-[4px_4px_0px_#0A0A0A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-neutral-500 uppercase font-bold text-[10px]">Filter Entity:</span>
          {['ALL', 'INCIDENT', 'WORK_ORDER', 'ROOM_BOOKING', 'FACILITY_REQUEST', 'PURCHASE_REQUEST'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setEntityTypeFilter(type);
                setOffset(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                entityTypeFilter === type
                  ? 'bg-brandLime text-brandDark border-brandLime'
                  : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:border-neutral-500 hover:text-brandCream'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, entity ID..."
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl pl-8 pr-3 py-1.5 text-xs text-brandCream placeholder:text-neutral-500 font-mono focus:outline-none focus:border-brandLime"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Querying audit log ledger...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-500">
            No audit records matching the specified filter.
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
                  <th className="py-3 px-4">Details / Summary</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filteredLogs.map((log) => {
                  let summary = '';
                  try {
                    if (log.afterJson) {
                      const parsed = JSON.parse(log.afterJson);
                      summary = Object.entries(parsed)
                        .filter(([k]) => !['password', 'hash', 'token'].includes(k.toLowerCase()))
                        .map(([k, v]) => `${k}: ${v}`)
                        .slice(0, 2)
                        .join('; ');
                    }
                  } catch {
                    summary = log.action;
                  }

                  return (
                    <tr key={log.id} className="hover:bg-[#1A1A1A] transition-colors font-mono">
                      <td className="py-3.5 px-4 font-bold text-brandLime whitespace-nowrap">
                        {log.id}
                      </td>
                      <td className="py-3.5 px-4 text-brandCream">
                        <span className="px-2 py-0.5 rounded bg-[#242424] border border-[#353535] text-[11px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300">
                        {log.actor?.name || log.actorId || 'SYSTEM'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400">
                        {log.entityType}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400">
                        {log.entityId}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 max-w-xs truncate text-[11px]">
                        {summary || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-[#181818] border-t border-[#2A2A2A] flex items-center justify-between font-mono text-xs text-neutral-400">
          <span>
            Page {currentPage} of {totalPages} ({total} entries)
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={offset === 0 || loading}
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              className="px-3 py-1.5 bg-[#242424] hover:bg-[#333] disabled:opacity-40 rounded text-brandCream font-bold uppercase transition-all"
            >
              ← Previous
            </button>
            <button
              type="button"
              disabled={offset + limit >= total || loading}
              onClick={() => setOffset((prev) => prev + limit)}
              className="px-3 py-1.5 bg-[#242424] hover:bg-[#333] disabled:opacity-40 rounded text-brandCream font-bold uppercase transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
