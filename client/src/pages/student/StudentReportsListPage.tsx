import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useTranslation } from '../../i18n/LanguageContext';

export const StudentReportsListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    apiFetch<any[]>('/api/intake/my-complaints')
      .then((res) => {
        if (res.success && res.data) {
          setComplaints(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = complaints.filter((c) => {
    const inc = c.incident;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'PENDING' && (inc?.status === 'OPEN' || inc?.status === 'PENDING' || !inc?.status)) ||
      (filterStatus === 'ASSIGNED' && inc?.status === 'ASSIGNED') ||
      (filterStatus === 'IN_PROGRESS' && inc?.status === 'IN_PROGRESS') ||
      (filterStatus === 'RESOLVED' && (inc?.status === 'RESOLVED' || inc?.status === 'CLOSED'));

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      c.id.toLowerCase().includes(query) ||
      (c.originalText && c.originalText.toLowerCase().includes(query)) ||
      (inc?.reference && inc.reference.toLowerCase().includes(query)) ||
      (inc?.location && inc.location.toLowerCase().includes(query)) ||
      (inc?.category && inc.category.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'STUDENT', path: '/app/student/home' },
          { label: 'MY REPORTS' },
        ]}
      />

      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            {t.reportsList.title}
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            {t.reportsList.subtitle}
          </p>
        </div>

        <Link
          to="/app/student/report"
          className="px-5 py-2.5 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New Complaint
        </Link>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 shadow-[4px_4px_0px_#0A0A0A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {[
            { id: 'ALL', label: t.reportsList.allFilter },
            { id: 'PENDING', label: t.reportsList.pendingFilter },
            { id: 'ASSIGNED', label: t.reportsList.assignedFilter },
            { id: 'IN_PROGRESS', label: t.reportsList.inProgressFilter },
            { id: 'RESOLVED', label: t.reportsList.resolvedFilter },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilterStatus(pill.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all border ${
                filterStatus === pill.id
                  ? 'bg-brandLime text-brandDark border-brandLime shadow-[2px_2px_0px_#0A0A0A]'
                  : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:border-neutral-500 hover:text-brandCream'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.reportsList.searchPlaceholder}
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl pl-9 pr-3.5 py-2 text-xs text-brandCream placeholder:text-neutral-500 font-mono focus:outline-none focus:border-brandLime"
          />
        </div>
      </div>

      {/* Reports Table / Card Container */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading your complaints from SQLite database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-neutral-600">search_off</span>
            <p className="text-sm font-display font-bold uppercase tracking-wider text-brandCream">
              {t.reportsList.emptyTitle}
            </p>
            <p className="text-xs font-mono text-neutral-400 max-w-sm mx-auto">
              {t.reportsList.emptySubtitle}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] text-neutral-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t.reportsList.tableRef}</th>
                  <th className="py-3.5 px-4">{t.reportsList.tableSummary}</th>
                  <th className="py-3.5 px-4">{t.reportsList.tableCategory}</th>
                  <th className="py-3.5 px-4">{t.reportsList.tablePriority}</th>
                  <th className="py-3.5 px-4">{t.reportsList.tableStatus}</th>
                  <th className="py-3.5 px-4">{t.reportsList.tableLocation}</th>
                  <th className="py-3.5 px-4">{t.reportsList.tableDate}</th>
                  <th className="py-3.5 px-4 text-right">{t.reportsList.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filtered.map((item) => {
                  const inc = item.incident;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/app/student/reports/${item.id}`)}
                      className="hover:bg-[#1A1A1A] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                        {inc?.reference || item.id}
                      </td>
                      <td className="py-3.5 px-4 text-brandCream max-w-xs truncate font-medium">
                        {item.originalText}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-300 whitespace-nowrap">
                        {inc?.category || 'GENERAL'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={inc?.priority || 'MEDIUM'} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={inc?.status || 'PENDING'} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-400 whitespace-nowrap">
                        {inc?.location || 'Campus'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-500 whitespace-nowrap">
                        {new Date(item.receivedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-brandLime group-hover:underline">
                          {t.reportsList.viewDetails}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
