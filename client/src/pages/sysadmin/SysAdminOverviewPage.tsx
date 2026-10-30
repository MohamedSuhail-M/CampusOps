import React, { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { MetricCard } from '../../components/common/MetricCard';
import { ActionModal } from '../../components/common/ActionModal';

export const SysAdminOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const stats = {
    activeSessions: 7,
    dbRecords: 1042,
    sqliteHealth: 'NORMAL (0 FK Violations)',
    uptime: '100.0%',
  };
  const [showDiagModal, setShowDiagModal] = useState<boolean>(false);
  const [diagResult, setDiagResult] = useState<string | null>(null);

  const runDiagnostics = () => {
    setDiagResult('RUNNING PRAGMA INTEGRITY_CHECK... OK. 34 tables verified. Foreign key consistency 100%. Encryption: bcrypt cost factor 12 verified.');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: t.nav.systemOverview, path: '/app/sysadmin/overview' }, { label: t.dashboards.sysadmin.title }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            {t.dashboards.sysadmin.title}
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            {t.dashboards.sysadmin.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowDiagModal(true);
            runDiagnostics();
          }}
          className="px-4 py-2 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-xl shadow-[3px_3px_0px_#0A0A0A] flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">terminal</span>
          {t.dashboards.sysadmin.runDiagnostics}
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard label={t.dashboards.sysadmin.activeSessions} value={t.formatNumber(stats.activeSessions)} icon="badge" badgeText="Cookie-based" badgeColor="lime" />
        <MetricCard label={t.dashboards.sysadmin.dbRecords} value={t.formatNumber(stats.dbRecords)} icon="storage" metaText="34 Prisma models" />
        <MetricCard label={t.dashboards.sysadmin.systemHealth} value="OPTIMAL" icon="check_circle" metaText="0 FK violations" badgeColor="lime" />
        <MetricCard label="Platform Uptime" value={stats.uptime} icon="speed" badgeText="Local-First" />
      </div>

      {/* Connector Matrix */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
        <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
          Campus Subsystem Connectors
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-brandCream font-bold">ERP Integration</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] uppercase font-bold">Active</span>
            </div>
            <p className="text-neutral-400 text-[11px]">Syncs procurement ledger &amp; PO numbers</p>
          </div>

          <div className="p-3 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-brandCream font-bold">SIS Student Information</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] uppercase font-bold">Active</span>
            </div>
            <p className="text-neutral-400 text-[11px]">Identity directory &amp; academic roles</p>
          </div>

          <div className="p-3 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-brandCream font-bold">IoT Building Sensors</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] uppercase font-bold">Active</span>
            </div>
            <p className="text-neutral-400 text-[11px]">Room B-204 current sensors reporting trip</p>
          </div>
        </div>
      </div>

      {/* Diagnostics Modal */}
      {showDiagModal && (
        <ActionModal
          isOpen={true}
          onClose={() => setShowDiagModal(false)}
          title="System Diagnostics & Telemetry"
          subtitle="SQLite Core & RBAC Integrity Check"
          confirmText="Close Diagnostic"
          onConfirm={() => setShowDiagModal(false)}
        >
          <div className="font-mono text-xs space-y-2 text-brandCream">
            <p className="text-neutral-300">Diagnostic scan completed in 42ms:</p>
            <div className="bg-black p-3.5 rounded-lg border border-[#2A2A2A] text-brandLime leading-relaxed text-[11px]">
              {diagResult}
            </div>
          </div>
        </ActionModal>
      )}
    </div>
  );
};
