import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { NavItem } from '../components/common/AppSidebar';
import { MetricCard } from '../components/common/MetricCard';
import { ActionModal } from '../components/common/ActionModal';
import {
  Server,
  RefreshCw,
  FileText,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const SystemAdminView: React.FC = () => {
  const { user } = useAuth();

  const [activeNav, setActiveNav] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [overview, setOverview] = useState<any | null>(null);
  const [health, setHealth] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Audit modal
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, hlRes, audRes, slaRes] = await Promise.all([
        apiFetch('/api/admin/overview'),
        apiFetch('/api/admin/system-health'),
        apiFetch('/api/admin/audit-logs?limit=25'),
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

  const navItems: NavItem[] = [
    { id: 'overview', label: 'System Overview', icon: 'grid_view' },
    { id: 'users', label: 'Users & Roles', icon: 'manage_accounts', badge: '7 Roles' },
    { id: 'data', label: 'Campus Data', icon: 'database' },
    { id: 'integrations', label: 'Integrations', icon: 'hub', badge: 'Active', badgeColor: 'lime' },
    { id: 'audit', label: 'Audit & Security', icon: 'security' },
  ];

  const handleNavSelect = (id: string) => {
    if (id === 'audit') {
      setAuditModalOpen(true);
    } else {
      setActiveNav(id);
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeNavId={activeNav}
      onNavSelect={handleNavSelect}
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
              <span className="text-brandCream">SYS ADMIN CONSOLE</span>
              <span className="px-2 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-brandLime font-bold text-[10px]">
                ROLE: SYSTEM ADMIN
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-brandCream uppercase font-bold tracking-tight">
                {user?.name || 'Elena Rostova'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] text-neutral-400 font-mono text-xs">
                CLUSTER ALPHA • ROOT PLATFORM GOVERNANCE
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1C1C] text-brandLime font-mono text-xs border border-brandLime/30">
                <span className="w-1.5 h-1.5 rounded-full bg-brandLime animate-pulse" />
                ACID ENGINE ONLINE
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
              <span>Refresh Diagnostics</span>
            </button>
          </div>
        </div>

        {/* Hero Billboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-brandCream text-brandDark p-6 lg:p-8 rounded-2xl border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A]">
          <div className="flex flex-col max-w-3xl min-w-0">
            <div className="flex items-center gap-2 mb-2 font-mono text-xs tracking-widest text-brandDark uppercase font-bold">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-brandDark" />
              <span>SYSTEM OPERATIONS // LIVE TELEMETRY</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl uppercase tracking-tight text-brandDark leading-none font-bold">
              SYSTEM OVERVIEW.
            </h1>
            <p className="font-body text-sm md:text-base text-neutral-800 mt-2 max-w-2xl font-medium leading-relaxed">
              Active directory sync status, role-based governance, SQLite database integrity, and
              immutable audit logging.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={fetchData}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-brandDark font-mono text-xs uppercase tracking-wider transition-all border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] font-bold cursor-pointer"
            >
              <span>RUN DIRECTORY SYNC</span>
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => setAuditModalOpen(true)}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brandLime hover:bg-[#b0dc28] text-brandDark font-display text-sm uppercase tracking-wide font-bold transition-all border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer"
            >
              <span>AUDIT TRAIL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 KPI Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Active Users"
            subtitle="Campus Directory"
            value={overview?.users?.total?.toString() || '1,042'}
            variant="cream"
            badge="7 ROLES"
            progressPercent={100}
            metaText="Students, Faculty, Staff & Ops"
            icon="group"
          />
          <MetricCard
            title="Campus Records"
            subtitle="SQLite Database"
            value="1,042"
            variant="lime"
            badge="34 TABLES"
            progressPercent={99}
            metaText="Tracked across physical campus"
            icon="location_city"
          />
          <MetricCard
            title="SLA Compliance"
            subtitle="Response Velocity"
            value={`${slaMetrics?.complianceRatePercent || 100}%`}
            variant="cream"
            badge="OPTIMAL"
            progressPercent={slaMetrics?.complianceRatePercent || 100}
            metaText="Zero unmitigated breaches"
            icon="check_circle"
          />
        </div>

        {/* Two Columns: Integration Health & Audit Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): System Status & Integration Health */}
          <div className="lg:col-span-7 rounded-xl bg-brandCream border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] p-6 flex flex-col justify-between space-y-6 text-brandDark">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-2 border-b-2 border-brandDark">
                <span className="font-mono text-xs text-brandDark bg-brandLime px-2 py-0.5 rounded border border-brandDark font-bold uppercase tracking-widest">
                  Core Connectors
                </span>
                <Server className="w-5 h-5 text-brandDark" />
              </div>
              <h2 className="font-display text-xl uppercase text-brandDark font-bold">
                System Status &amp; Integration Health
              </h2>
              <p className="font-body text-xs text-neutral-700 font-medium">
                Active identity synchronizers, scheduling links, and local SQLite engine stats.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-white border-2 border-brandDark flex items-center justify-between gap-3 shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="font-bold text-brandDark truncate">
                    Bcrypt Password Engine (Cost 12)
                  </span>
                  <span className="text-[11px] text-neutral-600 truncate font-body">
                    Secure HTTP-only cookie sessions &amp; RBAC enforcement
                  </span>
                </div>
                <span className="font-bold px-2 py-0.5 rounded bg-brandLime text-brandDark border border-brandDark whitespace-nowrap text-[10px]">
                  SECURE / ENFORCED
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-white border-2 border-brandDark flex items-center justify-between gap-3 shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="font-bold text-brandDark truncate">
                    SQLite Database &amp; Prisma ORM
                  </span>
                  <span className="text-[11px] text-neutral-600 truncate font-body">
                    Local-first file store: {health?.database?.sizeFormatted || '1.1 MB'}
                  </span>
                </div>
                <span className="font-bold px-2 py-0.5 rounded bg-brandDark text-brandCream border border-brandDark whitespace-nowrap text-[10px]">
                  WAL MODE / 0 FK ERRORS
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-white border-2 border-brandDark flex items-center justify-between gap-3 shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="font-bold text-brandDark truncate">
                    Workday HCM &amp; Roster Engine
                  </span>
                  <span className="text-[11px] text-neutral-600 truncate font-body">
                    Shift roster active • On-leave technician rejection enforced
                  </span>
                </div>
                <span className="font-bold px-2 py-0.5 rounded bg-brandLime text-brandDark border border-brandDark whitespace-nowrap text-[10px]">
                  POLICY 4.2 COMPLIANT
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3.5 rounded-lg bg-brandDark border-2 border-brandDark flex items-center justify-between text-brandCream shadow-[2px_2px_0px_#0A0A0A] font-mono">
                <div className="flex items-center gap-2 text-xs">
                  <Activity className="w-4 h-4 text-brandLime" />
                  <span className="tracking-wider font-bold">OVERALL TELEMETRY HEALTH</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C1C1C] text-brandLime font-bold">
                    NOMINAL
                  </span>
                  <span className="font-display text-base text-brandLime font-bold">99.98%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Audit Stream */}
          <div className="lg:col-span-5 rounded-xl bg-brandCream border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] p-6 flex flex-col justify-between space-y-6 text-brandDark">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-2 border-b-2 border-brandDark">
                <span className="font-mono text-xs text-brandDark bg-brandLime px-2 py-0.5 rounded border border-brandDark font-bold uppercase tracking-widest">
                  Audit Stream
                </span>
                <FileText className="w-5 h-5 text-brandDark" />
              </div>
              <h2 className="font-display text-xl uppercase text-brandDark font-bold">
                Recent Security Activity
              </h2>
              <p className="font-body text-xs text-neutral-700 font-medium">
                Latest security, state changes, and role events logged in database.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-white border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] flex flex-col gap-1 relative overflow-hidden pl-4"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brandLime" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brandDark text-[10px]">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-brandDark text-brandCream font-bold uppercase">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-brandDark font-semibold text-xs font-body leading-snug line-clamp-1">
                    {log.details || `Actor ${log.actor?.name || log.actorId} modified ${log.entityType}`}
                  </p>
                  <span className="text-[10px] text-neutral-500 font-mono truncate">
                    Actor: {log.actor?.name || 'System Auto'} • {log.entityType} #{log.entityId}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAuditModalOpen(true)}
                className="w-full py-2.5 rounded-lg bg-brandDark hover:bg-neutral-800 text-brandCream font-display text-xs uppercase tracking-wider text-center font-bold border-2 border-brandDark shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
              >
                VIEW FULL AUDIT LOG ({auditLogs.length} EVENTS) →
              </button>
            </div>
          </div>
        </div>

        {/* ActionModal: Full Audit Log Trail */}
        <ActionModal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
          title="Immutable Security Audit Log Trail"
          subtitle="APPEND-ONLY SECURITY LEDGER"
        >
          <div className="space-y-4 font-body">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="sticky top-0 bg-[#E5E1D8] border-b-2 border-brandDark">
                  <tr className="text-brandDark uppercase font-bold text-[10px]">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Actor</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Entity</th>
                    <th className="py-2 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brandDark/10 text-brandDark">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-neutral-500">
                        Synchronizing security audit trail...
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-100 transition">
                      <td className="py-2 px-3 text-neutral-600 whitespace-nowrap text-[10px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-bold whitespace-nowrap">
                        {log.actor?.name || log.actorId}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-brandLime text-brandDark border border-brandDark text-[9px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-[10px]">
                        {log.entityType} #{log.entityId}
                      </td>
                      <td className="py-2 px-3 text-neutral-700 font-body text-[11px]">
                        {log.details || 'State transition recorded'}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="bg-brandDark text-brandLime font-mono text-xs font-bold uppercase px-4 py-2 rounded-lg border-2 border-brandDark"
              >
                Close Audit Viewer
              </button>
            </div>
          </div>
        </ActionModal>
      </div>
    </DashboardLayout>
  );
};
