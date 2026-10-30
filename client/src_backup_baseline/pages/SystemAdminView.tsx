import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import {
  FileText,
  RefreshCw,
  Server,
} from 'lucide-react';

export const SystemAdminView: React.FC = () => {
  const [overview, setOverview] = useState<any | null>(null);
  const [health, setHealth] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, hlRes, audRes, slaRes] = await Promise.all([
        apiFetch('/api/admin/overview'),
        apiFetch('/api/admin/system-health'),
        apiFetch('/api/admin/audit-logs?limit=15'),
        apiFetch('/api/sla/metrics'),
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (hlRes.success) setHealth(hlRes.data);
      if (audRes.success) setAuditLogs(audRes.data?.logs || []);
      if (slaRes.success) setSlaMetrics(slaRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream tracking-tight">System Administration & Audit</h1>
          <p className="text-sm text-neutral-400">
            Platform governance, SQLite database integrity, SLA response monitoring, and immutable audit logging.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-charcoal-800 hover:bg-charcoal-700 text-cream px-3.5 py-2 rounded-lg text-xs font-semibold border border-charcoal-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-lime" />
          Refresh Diagnostics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-5 shadow-xl">
          <div className="text-xs text-neutral-400 font-medium">Campus Accounts</div>
          <div className="text-2xl font-extrabold text-cream mt-1">{overview?.users?.total || 0}</div>
          <div className="text-[11px] text-lime mt-1 font-semibold">7 Authorized Roles</div>
        </div>

        <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-5 shadow-xl">
          <div className="text-xs text-neutral-400 font-medium">Active Incidents</div>
          <div className="text-2xl font-extrabold text-cream mt-1">{overview?.incidents?.open || 0}</div>
          <div className="text-[11px] text-critical mt-1 font-semibold">
            {overview?.incidents?.critical || 0} Critical Priority
          </div>
        </div>

        <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-5 shadow-xl">
          <div className="text-xs text-neutral-400 font-medium">SLA Compliance</div>
          <div className="text-2xl font-extrabold text-lime mt-1">
            {slaMetrics?.complianceRatePercent || 100}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-semibold">
            {slaMetrics?.atRiskCount || 0} At Risk (<span className="text-warning">&lt;25% SLA</span>)
          </div>
        </div>

        <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-5 shadow-xl">
          <div className="text-xs text-neutral-400 font-medium">Database Health</div>
          <div className="text-2xl font-extrabold text-info mt-1">SQLite</div>
          <div className="text-[11px] text-cream mt-1 font-semibold font-mono">
            {health?.database?.sizeFormatted || '1.1 MB'}
          </div>
        </div>
      </div>

      {/* System Health Diagnostics */}
      {health && (
        <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 border-b border-charcoal-700 pb-3">
            <Server className="w-5 h-5 text-lime" />
            <h2 className="font-bold text-cream text-base">Local-First Engine Health (SQLite + Prisma)</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-charcoal-800 p-3 rounded-lg border border-charcoal-700">
              <span className="text-neutral-400 block mb-1">Users & Staff</span>
              <span className="font-mono text-base font-bold text-cream">{health.tableRecordCounts?.users}</span>
            </div>
            <div className="bg-charcoal-800 p-3 rounded-lg border border-charcoal-700">
              <span className="text-neutral-400 block mb-1">Campus Buildings & Rooms</span>
              <span className="font-mono text-base font-bold text-cream">
                {health.tableRecordCounts?.buildings} / {health.tableRecordCounts?.rooms}
              </span>
            </div>
            <div className="bg-charcoal-800 p-3 rounded-lg border border-charcoal-700">
              <span className="text-neutral-400 block mb-1">Physical Assets</span>
              <span className="font-mono text-base font-bold text-cream">{health.tableRecordCounts?.assets}</span>
            </div>
            <div className="bg-charcoal-800 p-3 rounded-lg border border-charcoal-700">
              <span className="text-neutral-400 block mb-1">Inventory Ledger Items</span>
              <span className="font-mono text-base font-bold text-cream">{health.tableRecordCounts?.inventoryItems}</span>
            </div>
          </div>
        </div>
      )}

      {/* Immutable Audit Log Trail */}
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-charcoal-700 pb-3">
          <FileText className="w-5 h-5 text-lime" />
          <h2 className="font-bold text-cream text-base">Immutable Audit Trail (Recent Security Events)</h2>
        </div>

        {loading ? (
          <div className="text-center py-6 text-xs text-neutral-400">Loading audit trail...</div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-400">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-charcoal-800 text-neutral-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Entity ID</th>
                  <th className="py-2.5 px-3">Details (State Change)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-charcoal-800/40 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-cream">{log.actor?.name || log.actorId}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-charcoal-700 text-lime border border-lime/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-300">{log.entityType}</td>
                    <td className="py-2.5 px-3 font-mono text-neutral-400">{log.entityId}</td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-[11px] text-neutral-400 font-mono">
                      {log.afterJson || log.beforeJson || 'State recorded'}
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
