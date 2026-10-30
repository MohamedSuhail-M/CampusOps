import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiFetch } from '../../services/api';
import { LanguageSelector } from './LanguageSelector';

interface NotificationItem {
  id: string;
  eventType: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface AppTopbarProps {
  onToggleSidebar?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export const AppTopbar: React.FC<AppTopbarProps> = ({
  onToggleSidebar,
  searchValue = '',
  onSearchChange,
}) => {
  const { user, activeRole, switchActiveRole, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch<any>('/api/sla/user/all');
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch('/api/sla/user/read-all', { method: 'PATCH' });
      setUnreadCount(0);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CO';
    const parts = name.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 h-16 sm:h-20 bg-surface/90 backdrop-blur-xl border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Drawer Trigger + Telemetry Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-[#1C1C1C] text-brandCream border border-[#2A2A2A] hover:border-brandLime"
            aria-label="Toggle Navigation Sidebar"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}

        <div className="hidden xl:flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant shrink-0">
          <span className="text-brandLime font-bold">CAMPUS OPS</span>
          <span className="text-neutral-600">/</span>
          <span className="text-brandCream">COMMAND MATRIX</span>
        </div>

        <div className="hidden sm:flex items-center bg-[#131313] border border-[#2A2A2A] rounded-full px-3 py-1 gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse" />
          <span className="font-mono text-[10px] text-brandCream font-semibold tracking-wider uppercase">
            TELEMETRY: OPERATIONAL
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center flex-1 max-w-xs md:max-w-sm min-w-0">
          <span className="material-symbols-outlined absolute left-3 text-neutral-400 text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={t.topbar?.searchPlaceholder || 'Search tickets, rooms, assets...'}
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg pl-9 pr-8 py-1.5 text-xs text-brandCream placeholder:text-neutral-500 focus:outline-none focus:border-brandLime transition-all"
          />
          <kbd className="hidden md:inline absolute right-2.5 px-1.5 py-0.5 rounded bg-[#2A2A2A] border border-[#353534] font-mono text-[9px] text-neutral-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Quick Role Switcher + Notification Bell + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Role Switcher Dropdown */}
        {user && user.roles && user.roles.length > 1 && (
          <div className="relative hidden md:flex items-center gap-1.5 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-2.5 py-1 text-xs">
            <span className="font-mono text-[9px] text-on-surface-variant uppercase font-bold">{t.topbar?.activeRoleLabel || 'ROLE'}:</span>
            <select
              value={activeRole || ''}
              onChange={async (e) => {
                const targetRole = e.target.value;
                const ok = await switchActiveRole(targetRole);
                if (ok) {
                  navigate('/app');
                }
              }}
              className="bg-transparent text-brandLime font-mono font-bold text-xs focus:outline-none cursor-pointer"
            >
              {user.roles.map((r) => (
                <option key={r.code} value={r.code} className="bg-[#1C1C1C] text-brandCream">
                  {r.name || r.code}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Language Selector */}
        <LanguageSelector compact />

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg bg-[#1C1C1C] border border-[#2A2A2A] text-on-surface-variant hover:text-brandCream hover:border-brandLime transition-colors"
            title={t.nav.alerts}
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brandLime animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#131313] border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] rounded-xl z-50 p-4 flex flex-col text-brandCream">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm uppercase font-bold text-brandCream">
                    {t.alertsPage.title}
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-brandLime text-brandDark font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                      {unreadCount} {t('common.new', 'NEW')}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] font-mono text-brandLime hover:underline"
                  >
                    {t.alertsPage.markAllRead}
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-500 font-mono">
                    {t.alertsPage.emptySubtitle}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        !n.readAt
                          ? 'bg-[#1C1C1C] border-brandLime/40'
                          : 'bg-[#141414] border-[#2A2A2A] opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant mb-1">
                        <span className="font-bold text-brandLime uppercase">{n.eventType}</span>
                        <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="font-bold text-brandCream mb-0.5">{n.title}</div>
                      <div className="text-neutral-400 leading-snug">{n.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        {user && (
          <div className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg bg-[#1C1C1C] border border-[#2A2A2A] shadow-[2px_2px_0px_#0A0A0A]">
            <div className="w-8 h-8 rounded-full border border-brandLime bg-[#2A2A2A] flex items-center justify-center text-xs font-bold text-brandLime font-mono shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="hidden lg:flex flex-col text-left min-w-0 pr-1">
              <span className="text-xs font-bold font-mono text-brandCream uppercase tracking-wider truncate">
                {user.name}
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider truncate">
                {activeRole} • {user.departmentName}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-1 text-neutral-400 hover:text-[#FF5555] transition-colors"
            >
              <span className="material-symbols-outlined text-base">power_settings_new</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
