import React, { useState } from 'react';
import { AppSidebar, NavItem } from '../components/common/AppSidebar';
import { AppTopbar } from '../components/common/AppTopbar';

interface DashboardLayoutProps {
  navItems: NavItem[];
  activeNavId: string;
  onNavSelect: (id: string) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  navItems,
  activeNavId,
  onNavSelect,
  searchValue,
  onSearchChange,
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brandDark text-brandCream antialiased flex flex-col font-body selection:bg-brandLime selection:text-brandDark">
      {/* Persistent / Responsive Left Sidebar */}
      <AppSidebar
        navItems={navItems}
        activeId={activeNavId}
        onSelect={onNavSelect}
        isOpenOnMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset for desktop sidebar w-72) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        <AppTopbar
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="border-t border-[#2A2A2A] bg-[#0E0E0E] py-4 px-6 text-xs text-neutral-400 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse" />
              <span className="text-brandCream font-semibold">CampusOps Core v1.0.0</span>
              <span>•</span>
              <span className="text-on-surface-variant">SQLite Local-First Telemetry Engine</span>
            </div>
            <div className="text-neutral-500">
              Team LOWKEY CODERS | Problem Statement 2 | Overclock&apos;26 Hackathon
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
