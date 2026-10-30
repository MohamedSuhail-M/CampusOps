import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { CampusOpsLogo } from './CampusOpsLogo';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
  badgeColor?: 'lime' | 'dark' | 'red' | string;
  active?: boolean;
  onClick?: () => void;
}

interface AppSidebarProps {
  navItems: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  navItems,
  activeId,
  onSelect,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const { user, activeRole, logout } = useAuth();
  const { t } = useTranslation();

  const getInitials = (name?: string) => {
    if (!name) return 'CO';
    const parts = name.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const sidebarContent = (
    <aside className="h-full w-72 bg-[#131313] border-r-2 border-[#2A2A2A] z-50 flex flex-col justify-between overflow-y-auto select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-[#2A2A2A]">
          <CampusOpsLogo roleBadge={activeRole || 'OPS'} />
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-neutral-400 hover:text-brandCream"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* User Identity Card */}
        {user && (
          <div className="p-4">
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3.5 shadow-[3px_3px_0px_#0A0A0A] flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border-2 border-brandLime bg-[#2A2A2A] flex items-center justify-center relative shrink-0 text-sm font-bold text-brandLime font-mono">
                {getInitials(user.name)}
                <span className="w-2.5 h-2.5 bg-brandLime rounded-full border-2 border-[#1C1C1C] absolute bottom-0 right-0" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-brandCream truncate font-sans">
                    {user.name}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-brandLime shrink-0" />
                </div>
                <span className="text-xs font-mono text-on-surface-variant truncate">
                  {user.departmentName}
                </span>
                <span className="text-[11px] font-mono text-[#8E927A] truncate">
                  ID #{user.loginId.toUpperCase()} • {activeRole}
                </span>
              </div>
            </div>

            <div className="px-2 pt-3 pb-1 text-on-surface-variant font-mono text-[10px] uppercase tracking-widest font-bold">
              Dispatch Matrix
            </div>
          </div>
        )}

        {/* Navigation Rows */}
        <nav aria-label="Sidebar navigation" className="flex flex-col gap-1 px-4">
          {navItems.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.onClick ? item.onClick() : onSelect(item.id);
                  onCloseMobile?.();
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg font-bold text-sm transition-all text-left w-full border ${
                  isActive
                    ? 'bg-[#2A2A2A] text-brandLime border-brandLime border-l-4 shadow-[2px_2px_0px_#0A0A0A]'
                    : 'text-on-surface-variant hover:text-brandCream hover:bg-[#1C1C1C] border-transparent hover:border-[#2A2A2A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive ? 'text-brandLime' : 'text-neutral-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="uppercase tracking-wide font-sans text-xs">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      isActive
                        ? 'bg-brandLime text-brandDark'
                        : 'bg-[#2A2A2A] text-brandCream border border-[#353534]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Node Status Footer */}
      <div className="flex flex-col border-t border-[#2A2A2A]">
        <div className="px-5 py-2 flex items-center justify-between bg-[#0E0E0E]">
          <span className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase font-semibold">
            NODE-EAST-01 // CLUSTER-B
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#2A2A2A] border border-[#444934] text-brandLime font-mono text-[9px] font-bold">
            PROD
          </span>
        </div>

        <div className="p-4 flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#2A2A2A] border border-brandLime flex items-center justify-center shrink-0">
              <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-xs text-brandCream font-bold leading-tight truncate">
                COMMAND DISPATCH
              </span>
              <span className="font-mono text-[9px] text-brandLime uppercase truncate">
                ONLINE / CHIEF-OPS
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title={t.nav.logout}
            className="p-1.5 text-neutral-400 hover:text-[#FF5555] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">power_settings_new</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-72 z-50">
        {sidebarContent}
      </div>

      {/* Mobile Slide-over Drawer */}
      {isOpenOnMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex-1 max-w-xs w-full bg-[#131313] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
