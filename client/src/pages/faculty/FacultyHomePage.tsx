import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { MetricCard } from '../../components/common/MetricCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const FacultyHomePage: React.FC = () => {
  const { t } = useTranslation();
  const [hasDisruption, setHasDisruption] = useState<boolean>(true);

  // Timetable demo schedule
  const timetable = [
    { time: '09:00 - 10:30', code: 'CS301', name: 'Data Structures & Algorithms', room: 'RM-B-204', status: 'DISRUPTED' },
    { time: '11:00 - 12:30', code: 'CS402', name: 'Operating Systems Lab', room: 'RM-C-102', status: 'OK' },
    { time: '14:00 - 15:30', code: 'CS205', name: 'Database Management Systems', room: 'RM-A-101', status: 'OK' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: t.nav.dashboard, path: '/app/faculty/home' }, { label: t.dashboards.faculty.title }]} />

      {/* Disruption Warning Banner for RM-B-204 */}
      {hasDisruption && (
        <div className="bg-[#1A1110] border-2 border-red-700/80 rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-red-500 mt-0.5">warning</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                  {t.common.critical}
                </span>
                <span className="font-mono text-xs text-red-300 font-bold">ROOM B-204</span>
              </div>
              <p className="text-sm font-bold text-brandCream mt-1">
                {t.dashboards.faculty.alertDisruption}
              </p>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">
                CSAI Semester Exam conflict detected. Relocation candidate: RM-B-206.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/app/faculty/rooms"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs uppercase rounded-lg shadow-[2px_2px_0px_#0A0A0A]"
            >
              {t.dashboards.faculty.roomPasses}
            </Link>
            <button
              type="button"
              onClick={() => setHasDisruption(false)}
              className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#333] text-neutral-300 font-mono text-xs uppercase rounded-lg"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}

      {/* Hero Strip */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] bg-gradient-to-r from-[#141414] via-[#1A1A1A] to-[#121212] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brandLime/10 border border-brandLime/40 rounded-full text-brandLime font-mono text-[10px] font-bold uppercase tracking-widest">
              {t.dashboards.faculty.title}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold uppercase tracking-tight text-brandCream">
              {t.dashboards.faculty.title}
            </h1>
            <p className="text-xs sm:text-sm font-sans text-neutral-300 max-w-xl">
              {t.dashboards.faculty.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/app/faculty/report"
              className="px-6 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">report_problem</span>
              {t.dashboards.faculty.reportHazardBtn}
            </Link>
            <Link
              to="/app/faculty/timetable"
              className="px-5 py-3 bg-[#2A2A2A] text-brandCream font-mono font-bold text-xs uppercase tracking-wider rounded-xl border border-[#3A3A3A] hover:bg-[#353535] transition-all"
            >
              {t.dashboards.faculty.mySchedule}
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={t.dashboards.faculty.todayClasses} value={3} icon="calendar_today" />
        <MetricCard label={t.dashboards.faculty.timetableStatus} value="1 Disrupted" icon="room_preferences" badgeText={t.common.critical} badgeColor="red" />
        <MetricCard label={t.dashboards.faculty.roomPasses} value={1} icon="swap_horiz" badgeText="RM-B-206" badgeColor="lime" />
      </div>

      {/* Today's Schedule Overview */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brandLime" />
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Today&apos;s Lecture Schedule
            </h2>
          </div>
          <Link to="/app/faculty/timetable" className="text-xs font-mono font-bold text-brandLime hover:underline uppercase">
            Full Timetable →
          </Link>
        </div>

        <div className="space-y-3">
          {timetable.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.status === 'DISRUPTED'
                  ? 'bg-red-950/20 border-red-700/50'
                  : 'bg-[#1C1C1C] border-[#2A2A2A]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brandLime">{item.time}</span>
                  <span className="text-neutral-500">•</span>
                  <span className="font-mono text-xs text-brandCream font-bold">{item.code}</span>
                </div>
                <p className="text-sm font-sans font-semibold text-brandCream">{item.name}</p>
                <p className="text-xs font-mono text-neutral-400">Scheduled in {item.room}</p>
              </div>

              {item.status === 'DISRUPTED' ? (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-red-600 text-white font-mono text-[10px] font-bold uppercase">
                    Disrupted
                  </span>
                  <Link
                    to="/app/faculty/rooms"
                    className="px-3 py-1.5 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-lg shadow"
                  >
                    Relocate
                  </Link>
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded bg-[#2A2A2A] text-neutral-300 font-mono text-[10px] font-bold uppercase">
                  Verified Clear
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
