import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { useTranslation } from '../../i18n/LanguageContext';

export const StudentAlertsPage: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);

  const fetchNotifs = async () => {
    try {
      const res = await apiFetch<any>('/api/sla/user/all');
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/api/sla/user/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/sla/user/read-all', { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const displayed = filterUnreadOnly
    ? notifications.filter((n) => !n.readAt)
    : notifications;

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'STUDENT', path: '/app/student/home' },
          { label: 'NOTIFICATIONS & ALERTS' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
              {t.alertsPage.title}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-brandLime text-brandDark font-mono font-bold text-xs">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Real-time status notifications for your submitted campus tickets.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-[#2A2A2A] hover:bg-[#333] text-brandLime font-mono font-bold text-xs uppercase rounded-lg border border-[#3A3A3A] transition-all self-start sm:self-auto"
          >
            {t.alertsPage.markAllRead}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setFilterUnreadOnly(false)}
          className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
            !filterUnreadOnly
              ? 'bg-brandLime text-brandDark border-brandLime shadow-[2px_2px_0px_#0A0A0A]'
              : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:text-brandCream'
          }`}
        >
          {t.alertsPage.allFilter} ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterUnreadOnly(true)}
          className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
            filterUnreadOnly
              ? 'bg-brandLime text-brandDark border-brandLime shadow-[2px_2px_0px_#0A0A0A]'
              : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:text-brandCream'
          }`}
        >
          {t.alertsPage.unreadOnly} ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-16 bg-[#141414] border border-[#2A2A2A] rounded-2xl text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-neutral-600">notifications_off</span>
            <p className="font-display font-bold uppercase tracking-wider text-brandCream">
              {t.alertsPage.emptyTitle}
            </p>
            <p className="text-xs font-mono text-neutral-400">
              {t.alertsPage.emptySubtitle}
            </p>
          </div>
        ) : (
          displayed.map((n) => {
            const isUnread = !n.readAt;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-[#1C1C1C] border-brandLime/60 shadow-[3px_3px_0px_#0A0A0A]'
                    : 'bg-[#141414] border-[#2A2A2A] text-neutral-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`material-symbols-outlined text-xl mt-0.5 ${
                      isUnread ? 'text-brandLime' : 'text-neutral-500'
                    }`}
                  >
                    {n.eventType === 'STATUS_CHANGE'
                      ? 'update'
                      : n.eventType === 'TECHNICIAN_ASSIGNED'
                      ? 'person'
                      : 'info'}
                  </span>
                  <div className="space-y-1">
                    <p className={`text-xs font-bold font-sans ${isUnread ? 'text-brandCream' : 'text-neutral-300'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs font-sans text-neutral-300">
                      {n.body}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-500">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {isUnread && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    className="shrink-0 px-2.5 py-1 bg-[#2A2A2A] hover:bg-[#353535] text-brandLime font-mono text-[10px] uppercase font-bold rounded border border-[#353534]"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
