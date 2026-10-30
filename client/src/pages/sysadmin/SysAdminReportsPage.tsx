import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { MetricCard } from '../../components/common/MetricCard';
import { apiFetch } from '../../services/api';

interface ReportData {
  generatedAt: string;
  incidents: {
    total: number;
    sensitive: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  workOrders: {
    total: number;
    byStatus: Record<string, number>;
    blocked: number;
    completed: number;
  };
  procurement: {
    totalRequests: number;
    approved: number;
    rejected: number;
    pending: number;
    stockReceipts: number;
    stockMovements: number;
    inventoryItems: number;
    lowStockAlerts: number;
  };
  facilities: {
    eventRequests: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
    };
    roomBookings: number;
    activeRoomOutages: number;
  };
  sla: {
    compliancePercentage: number;
    configuredPolicies: number;
    policies: Array<{
      id: string;
      category: string;
      priority: string;
      responseTimeHours: number;
      resolutionTimeHours: number;
    }>;
  };
}

export const SysAdminReportsPage: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d'>('all');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = '';
      const now = new Date();
      if (dateRange === '7d') {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = `?startDate=${d.toISOString()}`;
      } else if (dateRange === '30d') {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = `?startDate=${d.toISOString()}`;
      }

      const res = await apiFetch<ReportData>(`/api/admin/reports${query}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to aggregate platform reports.');
      }
    } catch (e: any) {
      setError(e.message || 'Network error fetching reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleExportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campusops-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'SYSTEM ADMIN', path: '/app/sysadmin/overview' },
          { label: 'REPORTS & ANALYTICS' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Reports & Platform Analytics
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Real-time cross-subsystem telemetry, SLA compliance tracking, incident density, and inventory ledger aggregates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range pills */}
          <div className="flex bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1 rounded-lg uppercase transition-colors ${
                dateRange === '7d' ? 'bg-brandLime text-brandDark font-bold' : 'text-neutral-400 hover:text-brandCream'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1 rounded-lg uppercase transition-colors ${
                dateRange === '30d' ? 'bg-brandLime text-brandDark font-bold' : 'text-neutral-400 hover:text-brandCream'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1 rounded-lg uppercase transition-colors ${
                dateRange === 'all' ? 'bg-brandLime text-brandDark font-bold' : 'text-neutral-400 hover:text-brandCream'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            type="button"
            onClick={fetchReports}
            className="p-2 bg-[#1C1C1C] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-brandCream rounded-xl transition-colors"
            title="Refresh Telemetry"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            disabled={!data}
            className="px-3.5 py-2 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-xl shadow-[3px_3px_0px_#0A0A0A] flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export JSON
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="p-12 text-center font-mono text-xs text-neutral-400 space-y-3">
          <div className="w-8 h-8 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto" />
          <p>AGGREGATING SUBSYSTEM TELEMETRY FROM SQLITE ENGINE...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/40 border border-red-800 rounded-2xl text-red-300 font-mono text-xs space-y-2">
          <p className="font-bold">ERROR GENERATING REPORT</p>
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchReports}
            className="px-3 py-1 bg-red-800 text-white rounded font-mono uppercase text-xs"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top KPI Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="Total Incidents"
              value={data.incidents.total}
              icon="report_problem"
              metaText={`${data.incidents.sensitive} sensitive/safety`}
              badgeText={data.incidents.sensitive > 0 ? 'Confidential Active' : undefined}
              badgeColor="lime"
            />
            <MetricCard
              label="Work Orders"
              value={data.workOrders.total}
              icon="engineering"
              metaText={`${data.workOrders.completed} resolved · ${data.workOrders.blocked} blocked`}
            />
            <MetricCard
              label="Procurement PRs"
              value={data.procurement.totalRequests}
              icon="shopping_cart"
              metaText={`${data.procurement.approved} approved · ${data.procurement.pending} pending`}
            />
            <MetricCard
              label="Event Requests"
              value={data.facilities.eventRequests.total}
              icon="celebration"
              metaText={`${data.facilities.eventRequests.approved} booked · ${data.facilities.eventRequests.pending} in queue`}
            />
            <MetricCard
              label="SLA Compliance"
              value={`${data.sla.compliancePercentage}%`}
              icon="verified"
              badgeText="Target: >95%"
              badgeColor="lime"
              metaText={`${data.sla.configuredPolicies} active policies`}
            />
          </div>

          {/* Incident Category & Priority Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-brandLime text-lg">pie_chart</span>
                  <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
                    Incident Category Distribution
                  </h2>
                </div>
                <span className="font-mono text-xs text-neutral-400">
                  {Object.keys(data.incidents.byCategory).length} categories
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(data.incidents.byCategory).map(([category, count]) => {
                  const pct = data.incidents.total > 0 ? Math.round((count / data.incidents.total) * 100) : 0;
                  const isSensitive = ['SAFETY_INCIDENT', 'STUDENT_MISCONDUCT'].includes(category);
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="flex items-center gap-1.5 text-neutral-300">
                          {isSensitive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Sensitive safety issue" />
                          )}
                          {category}
                        </span>
                        <span className="text-neutral-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#1C1C1C] rounded-full h-2 overflow-hidden border border-[#2A2A2A]">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isSensitive ? 'bg-red-500' : 'bg-brandLime'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Incident Priority & Status Matrix */}
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-brandLime text-lg">bar_chart</span>
                    <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
                      Priority Density & Resolution States
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-neutral-400">Prisma Live Aggregation</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Priority Cards */}
                  <div className="space-y-2">
                    <h3 className="font-mono text-xs text-neutral-400 uppercase tracking-wider">By Priority</h3>
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => {
                      const count = data.incidents.byPriority[p] || 0;
                      return (
                        <div
                          key={p}
                          className="flex items-center justify-between p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-xs font-mono"
                        >
                          <span
                            className={`font-bold ${
                              p === 'CRITICAL'
                                ? 'text-red-400'
                                : p === 'HIGH'
                                ? 'text-amber-400'
                                : 'text-neutral-300'
                            }`}
                          >
                            {p}
                          </span>
                          <span className="bg-[#242424] px-2 py-0.5 rounded text-brandCream font-bold">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status Cards */}
                  <div className="space-y-2">
                    <h3 className="font-mono text-xs text-neutral-400 uppercase tracking-wider">By Status</h3>
                    {Object.entries(data.incidents.byStatus).map(([st, count]) => (
                      <div
                        key={st}
                        className="flex items-center justify-between p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-xs font-mono"
                      >
                        <span className="text-neutral-300">{st}</span>
                        <span className="bg-[#242424] px-2 py-0.5 rounded text-brandCream font-bold">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timestamp footer */}
              <div className="pt-3 border-t border-[#2A2A2A] text-right font-mono text-[10px] text-neutral-500">
                Aggregated timestamp: {new Date(data.generatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Subsystem Deep Dive (Procurement, Facilities & Inventory) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Ledger Summary */}
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-3">
                <span className="material-symbols-outlined text-brandLime text-lg">inventory_2</span>
                <h3 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
                  Inventory & Stock Ledger
                </h3>
              </div>
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-[#222]">
                  <span className="text-neutral-400">Tracked SKU Catalog</span>
                  <span className="text-brandCream font-bold">{data.procurement.inventoryItems} items</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#222]">
                  <span className="text-neutral-400">Total Stock Movements</span>
                  <span className="text-brandCream font-bold">{data.procurement.stockMovements} logs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#222]">
                  <span className="text-neutral-400">Completed Dock Receipts</span>
                  <span className="text-brandCream font-bold">{data.procurement.stockReceipts} receipts</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-400">Reorder Threshold Alerts</span>
                  <span className="text-amber-400 font-bold">{data.procurement.lowStockAlerts} items low</span>
                </div>
              </div>
            </div>

            {/* Facilities & Event Operations */}
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-3">
                <span className="material-symbols-outlined text-brandLime text-lg">domain</span>
                <h3 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
                  Space & Events Allocation
                </h3>
              </div>
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-[#222]">
                  <span className="text-neutral-400">Total Facility Requests</span>
                  <span className="text-brandCream font-bold">{data.facilities.eventRequests.total} requests</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#222]">
                  <span className="text-neutral-400">Approved Event Bookings</span>
                  <span className="text-brandLime font-bold">{data.facilities.eventRequests.approved} approved</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#222]">
                  <span className="text-neutral-400">Pending Review Queue</span>
                  <span className="text-neutral-300 font-bold">{data.facilities.eventRequests.pending} pending</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-400">Active Room Outages</span>
                  <span className={`font-bold ${data.facilities.activeRoomOutages > 0 ? 'text-red-400' : 'text-neutral-300'}`}>
                    {data.facilities.activeRoomOutages} outages
                  </span>
                </div>
              </div>
            </div>

            {/* SLA Policy Target Matrix */}
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-3">
                <span className="material-symbols-outlined text-brandLime text-lg">timer</span>
                <h3 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
                  SLA Target Policy Matrix
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#2A2A2A] text-neutral-400 text-[10px]">
                      <th className="py-1">CATEGORY</th>
                      <th className="py-1">PRIORITY</th>
                      <th className="py-1 text-right">TARGET RESP</th>
                      <th className="py-1 text-right">TARGET RESOLV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222] text-neutral-300">
                    {data.sla.policies.slice(0, 5).map((pol) => (
                      <tr key={pol.id}>
                        <td className="py-1.5 font-bold text-brandCream">{pol.category}</td>
                        <td className="py-1.5 text-neutral-400">{pol.priority}</td>
                        <td className="py-1.5 text-right text-brandLime">{pol.responseTimeHours}h</td>
                        <td className="py-1.5 text-right text-brandCream">{pol.resolutionTimeHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
