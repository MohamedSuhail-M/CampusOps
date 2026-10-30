import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { MetricCard } from '../../components/common/MetricCard';
import { apiFetch } from '../../services/api';

export const DeptManagerHomePage: React.FC = () => {
  const { t } = useTranslation();
  const [pendingRelocations, setPendingRelocations] = useState<any[]>([]);
  const [historyCount, setHistoryCount] = useState<number>(0);

  useEffect(() => {
    apiFetch<any>('/api/rooms/relocations')
      .then((res) => {
        if (res.success && res.data) {
          setPendingRelocations(res.data.pending || []);
          setHistoryCount(res.data.history?.length || 0);
        }
      })
      .catch((e) => console.error('Failed to load relocations status', e));
  }, []);

  const urgentRelocation = pendingRelocations[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: t.nav.dashboard, path: '/app/dept-manager/home' }, { label: t.dashboards.deptManager.title }]} />

      {/* Critical Exam Disruption Alert for Room B-204 if pending */}
      {urgentRelocation ? (
        <div className="bg-[#1C1210] border-2 border-red-700/80 rounded-2xl p-6 shadow-[5px_5px_0px_#0A0A0A] flex flex-col md:flex-row md:items-center justify-between gap-6 animate-pulse">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950 border border-red-700/60 rounded-full text-red-300 font-mono text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              {t.dashboards.deptManager.urgentAction}
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-brandCream">
              Room {urgentRelocation.booking?.room?.code || 'B-204'} Facility Disruption
            </h2>
            <p className="text-xs sm:text-sm font-sans text-neutral-300 max-w-xl">
              {urgentRelocation.outage?.reason || 'Critical hazard reported.'} Session: <strong className="text-brandLime">{urgentRelocation.booking?.purpose}</strong>. Candidate recommendation: <strong className="text-brandLime">{urgentRelocation.recommendations?.[0]?.roomCode || 'RM-B-206'}</strong>.
            </p>
          </div>

          <Link
            to="/app/dept-manager/relocations"
            className="px-6 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all whitespace-nowrap self-start md:self-auto"
          >
            {t.dashboards.deptManager.approveRelocationBtn} →
          </Link>
        </div>
      ) : (
        <div className="bg-[#141812] border-2 border-emerald-700/60 rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] flex items-center justify-between gap-4 font-mono text-xs text-emerald-300">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-emerald-400">verified</span>
            <div>
              <p className="font-bold text-brandCream uppercase text-sm">All Department Classrooms Operational</p>
              <p className="text-neutral-400 text-[11px]">No active classroom disruptions or emergency relocations pending executive approval.</p>
            </div>
          </div>
          <Link
            to="/app/dept-manager/rooms"
            className="px-3.5 py-1.5 bg-[#1F2618] hover:bg-[#28321F] text-brandLime border border-brandLime/40 rounded-lg text-xs font-bold uppercase"
          >
            View Timetable Matrix →
          </Link>
        </div>
      )}

      {/* Hero Welcome */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] bg-gradient-to-r from-[#141414] via-[#1A1A1A] to-[#121212] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brandLime/10 border border-brandLime/40 rounded-full text-brandLime font-mono text-[10px] font-bold uppercase tracking-widest">
              {t.dashboards.deptManager.title}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold uppercase tracking-tight text-brandCream">
              {t.dashboards.deptManager.title}
            </h1>
            <p className="text-xs sm:text-sm font-sans text-neutral-300 max-w-xl">
              {t.dashboards.deptManager.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/app/dept-manager/relocations"
              className="px-5 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28]"
            >
              {t.nav.relocations}
            </Link>
            <Link
              to="/app/dept-manager/rooms"
              className="px-5 py-3 bg-[#2A2A2A] text-brandCream font-mono font-bold text-xs uppercase tracking-wider rounded-xl border border-[#3A3A3A] hover:bg-[#333]"
            >
              {t.nav.rooms}
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={t.dashboards.deptManager.conflictMatrix} value={18} icon="meeting_room" metaText="Building B & C" />
        <MetricCard
          label={t.dashboards.deptManager.relocationsNeeded}
          value={pendingRelocations.length}
          icon="report"
          badgeText={pendingRelocations.length > 0 ? `${pendingRelocations.length} Pending` : 'All Clear'}
          badgeColor={pendingRelocations.length > 0 ? 'red' : 'lime'}
        />
        <MetricCard
          label={t.dashboards.deptManager.authorizedRelocations}
          value={historyCount}
          icon="swap_horiz"
          badgeText="Recorded"
          badgeColor="lime"
        />
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/app/dept-manager/relocations"
          className="bg-[#141414] border border-[#2A2A2A] hover:border-brandLime p-5 rounded-2xl shadow transition-all block group"
        >
          <span className="material-symbols-outlined text-2xl text-brandLime mb-2">fact_check</span>
          <h3 className="font-display font-bold uppercase text-sm text-brandCream group-hover:text-brandLime">
            Relocation Approvals
          </h3>
          <p className="text-xs font-sans text-neutral-400 mt-1">
            Authorize classroom transfers with instant faculty advisory dispatch.
          </p>
        </Link>

        <Link
          to="/app/dept-manager/issues"
          className="bg-[#141414] border border-[#2A2A2A] hover:border-brandLime p-5 rounded-2xl shadow transition-all block group"
        >
          <span className="material-symbols-outlined text-2xl text-yellow-400 mb-2">assignment_late</span>
          <h3 className="font-display font-bold uppercase text-sm text-brandCream group-hover:text-brandLime">
            Department Issues
          </h3>
          <p className="text-xs font-sans text-neutral-400 mt-1">
            Track hardware tickets logged by CSE faculty, staff, and students.
          </p>
        </Link>

        <Link
          to="/app/dept-manager/rooms"
          className="bg-[#141414] border border-[#2A2A2A] hover:border-brandLime p-5 rounded-2xl shadow transition-all block group"
        >
          <span className="material-symbols-outlined text-2xl text-cyan-400 mb-2">domain</span>
          <h3 className="font-display font-bold uppercase text-sm text-brandCream group-hover:text-brandLime">
            Rooms &amp; Timetable
          </h3>
          <p className="text-xs font-sans text-neutral-400 mt-1">
            View room capacities, projector health, and timetable schedules.
          </p>
        </Link>
      </div>
    </div>
  );
};
