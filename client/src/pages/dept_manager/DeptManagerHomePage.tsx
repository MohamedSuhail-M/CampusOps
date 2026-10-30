import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { MetricCard } from '../../components/common/MetricCard';

export const DeptManagerHomePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: t.nav.dashboard, path: '/app/dept-manager/home' }, { label: t.dashboards.deptManager.title }]} />

      {/* Critical Exam Disruption Alert for Room B-204 */}
      <div className="bg-[#1C1210] border-2 border-red-700/80 rounded-2xl p-6 shadow-[5px_5px_0px_#0A0A0A] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950 border border-red-700/60 rounded-full text-red-300 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            {t.dashboards.deptManager.urgentAction}
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-brandCream">
            Room B-204 Electrical Failure
          </h2>
          <p className="text-xs sm:text-sm font-sans text-neutral-300 max-w-xl">
            Sparking socket reported 20 minutes before CS301 examination. Best alternative candidate: <strong className="text-brandLime">RM-B-206</strong> (Capacity 80, Match Score 265).
          </p>
        </div>

        <Link
          to="/app/dept-manager/relocations"
          className="px-6 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all whitespace-nowrap self-start md:self-auto"
        >
          {t.dashboards.deptManager.approveRelocationBtn} →
        </Link>
      </div>

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
        <MetricCard label={t.dashboards.deptManager.relocationsNeeded} value={2} icon="report" badgeText="1 Critical Exam" badgeColor="red" />
        <MetricCard label={t.dashboards.deptManager.authorizedRelocations} value={1} icon="swap_horiz" badgeText="Ready to Sign" badgeColor="lime" />
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
            Rooms & Timetable
          </h3>
          <p className="text-xs font-sans text-neutral-400 mt-1">
            View room capacities, projector health, and timetable schedules.
          </p>
        </Link>
      </div>
    </div>
  );
};
