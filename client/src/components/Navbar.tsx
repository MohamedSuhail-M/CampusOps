import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import {
  Bell,
  LogOut,
  Shield,
  UserCheck,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, activeRole, demoUsers, login, logout, switchActiveRole } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/api/sla/user/all');
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    await apiFetch('/api/sla/user/read-all', { method: 'PATCH' });
    fetchNotifications();
  };

  const handleQuickSwitch = async (demo: any) => {
    setShowDemoMenu(false);
    await login(demo.loginId, 'password123', demo.role);
  };

  return (
    <header className="bg-charcoal-900 border-b border-charcoal-700 h-16 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center font-bold text-obsidian text-lg">
          C
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-cream text-lg tracking-tight">CAMPUS<span className="text-lime">OPS</span></span>
            <span className="text-[10px] font-semibold uppercase bg-charcoal-700 text-lime px-2 py-0.5 rounded border border-charcoal-600">
              Lowkey Coders
            </span>
          </div>
          <p className="text-xs text-neutral-400">Intelligent Operations Platform</p>
        </div>
      </div>

      {/* Center / Right Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="flex items-center gap-2 bg-charcoal-800 hover:bg-charcoal-700 text-cream px-3 py-1.5 rounded-md text-xs font-medium border border-charcoal-600 transition"
          >
            <UserCheck className="w-4 h-4 text-lime" />
            <span>Switch Demo Persona</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-charcoal-800 border border-charcoal-600 rounded-lg shadow-2xl p-2 z-50">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1 mb-1">
                7 Official Demo Personas
              </div>
              <div className="space-y-1">
                {demoUsers.map((d) => (
                  <button
                    key={d.role}
                    onClick={() => handleQuickSwitch(d)}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between hover:bg-charcoal-700 transition ${
                      activeRole === d.role ? 'bg-charcoal-700 text-lime font-semibold' : 'text-cream'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-[10px] text-neutral-400">{d.roleName} ({d.loginId})</div>
                    </div>
                    {activeRole === d.role && <CheckCircle className="w-3.5 h-3.5 text-lime" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current Role Badge & Switcher */}
        {user && (
          <div className="flex items-center gap-2 bg-charcoal-800 border border-charcoal-600 px-3 py-1 rounded-md">
            <Shield className="w-3.5 h-3.5 text-lime" />
            <span className="text-xs font-semibold text-lime">
              {activeRole}
            </span>
            {user.roles.length > 1 && (
              <select
                value={activeRole || ''}
                onChange={(e) => switchActiveRole(e.target.value)}
                className="bg-transparent text-xs text-cream outline-none cursor-pointer border-l border-charcoal-600 pl-2 ml-1"
              >
                {user.roles.map((r) => (
                  <option key={r.code} value={r.code} className="bg-charcoal-800 text-cream">
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-neutral-300 hover:text-cream bg-charcoal-800 hover:bg-charcoal-700 rounded-md border border-charcoal-600 transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-lime text-obsidian text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-charcoal-800 border border-charcoal-600 rounded-lg shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-charcoal-700">
                <span className="text-xs font-bold text-cream">Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-lime hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-xs text-neutral-400">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2 rounded text-xs border ${
                        n.readAt ? 'bg-charcoal-900/50 border-charcoal-700 text-neutral-400' : 'bg-charcoal-700/60 border-lime/30 text-cream'
                      }`}
                    >
                      <div className="font-semibold text-lime flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        {n.title}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge & Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-charcoal-700">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-cream">{user.name}</div>
              <div className="text-[10px] text-neutral-400">{user.departmentName}</div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-2 text-neutral-400 hover:text-critical hover:bg-charcoal-800 rounded-md transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
