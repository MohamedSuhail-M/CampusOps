import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiFetch } from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const StudentHomePage: React.FC = () => {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiFetch<any[]>('/api/intake/my-complaints')
      .then((res) => {
        if (res.success && res.data) {
          setComplaints(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const totalComplaints = complaints.length;
  const inProgress = complaints.filter(
    (c) => c.incident?.status === 'IN_PROGRESS' || c.incident?.status === 'ASSIGNED'
  ).length;
  const resolved = complaints.filter((c) => c.incident?.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: t.nav.dashboard, path: '/app/student/home' }, { label: t.dashboards.student.title }]} />

      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] bg-gradient-to-r from-[#141414] via-[#1A1A1A] to-[#121212] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brandLime/10 border border-brandLime/40 rounded-full text-brandLime font-mono text-[10px] font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse" />
              {t.dashboards.student.title}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold uppercase tracking-tight text-brandCream">
              {t.dashboards.student.title}
            </h1>
            <p className="text-xs sm:text-sm font-sans text-neutral-300 max-w-xl">
              {t.dashboards.student.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/app/student/report"
              className="px-6 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              {t.dashboards.student.reportNewIssueBtn}
            </Link>
            <Link
              to="/app/student/reports"
              className="px-5 py-3 bg-[#2A2A2A] text-brandCream font-mono font-bold text-xs uppercase tracking-wider rounded-xl border border-[#3A3A3A] hover:bg-[#353535] transition-all"
            >
              {t.nav.myReports} ({t.formatNumber(totalComplaints)})
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={t.dashboards.student.recentReports}
          value={t.formatNumber(totalComplaints)}
          icon="assignment"
          metaText="SQLite audit trail"
        />
        <MetricCard
          label={t.dashboards.student.activeIncidents}
          value={t.formatNumber(inProgress)}
          icon="pending_actions"
          badgeText="Active"
          badgeColor="lime"
          progressPercent={totalComplaints > 0 ? (inProgress / totalComplaints) * 100 : 0}
        />
        <MetricCard
          label={t.dashboards.student.resolvedMonth}
          value={t.formatNumber(resolved)}
          icon="task_alt"
          badgeText={t.common.verified}
          progressPercent={totalComplaints > 0 ? (resolved / totalComplaints) * 100 : 0}
        />
      </div>

      {/* Two Column Layout: Recent Complaints & Campus Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints (2 cols) */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brandLime" />
              <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
                {t.dashboards.student.recentReports}
              </h2>
            </div>
            <Link
              to="/app/student/reports"
              className="text-xs font-mono font-bold text-brandLime hover:underline uppercase"
            >
              {t.dashboards.student.viewAllReports}
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-neutral-400">
              {t.common.loading}
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-neutral-600">inbox</span>
              <p className="text-xs font-mono text-neutral-400">
                {t.dashboards.student.emptyReports}
              </p>
              <Link
                to="/app/student/report"
                className="inline-block px-4 py-2 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-lg"
              >
                {t.dashboards.student.reportNewIssueBtn}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to={`/app/student/reports/${item.id}`}
                  className="block p-4 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] hover:border-brandLime transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-mono text-xs font-bold text-brandLime group-hover:underline">
                      {item.incident?.reference || item.id}
                    </span>
                    <StatusBadge status={item.incident?.status || 'PENDING'} />
                  </div>
                  <p className="text-xs text-brandCream font-sans line-clamp-2 mb-2">
                    {item.originalText}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>{item.incident?.location || 'Campus'}</span>
                    <span>{new Date(item.receivedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Campus Notices / Quick Guide (1 col) */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-3">
            <span className="material-symbols-outlined text-brandLime text-lg">campaign</span>
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Campus Bulletins
            </h2>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="p-3 bg-[#1C1C1C] border-l-4 border-brandLime rounded-r-xl space-y-1">
              <span className="font-mono text-[10px] text-brandLime uppercase font-bold">Advisory</span>
              <p className="text-brandCream font-semibold">Semester Exams Underway</p>
              <p className="text-neutral-400 text-[11px]">
                Electrical and AV disruption issues receive priority routing during exam hours.
              </p>
            </div>

            <div className="p-3 bg-[#1C1C1C] border-l-4 border-yellow-400 rounded-r-xl space-y-1">
              <span className="font-mono text-[10px] text-yellow-400 uppercase font-bold">Facilities Notice</span>
              <p className="text-brandCream font-semibold">C-Wing Wi-Fi Maintenance</p>
              <p className="text-neutral-400 text-[11px]">
                Replacement hardware requested for lab transceiver AP-042.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#2A2A2A]">
            <Link
              to="/app/student/help"
              className="text-xs font-mono font-bold text-neutral-400 hover:text-brandLime flex items-center justify-between"
            >
              <span>View Student Help Guide</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
