import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppSidebar, NavItem } from '../components/common/AppSidebar';
import { AppTopbar } from '../components/common/AppTopbar';

interface RoleLayoutProps {
  allowedRoles?: string[];
}

export const RoleLayout: React.FC<RoleLayoutProps> = ({ allowedRoles }) => {
  const { user, activeRole, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-brandDark flex items-center justify-center text-brandCream">
        <div className="flex flex-col items-center gap-3 font-mono text-xs text-neutral-400">
          <div className="w-10 h-10 border-4 border-brandLime border-t-transparent rounded-full animate-spin" />
          <span>AUTHENTICATING CAMPUSOPS SESSION...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check role authorization if specified
  const currentRole = (activeRole || user.activeRole || '').toUpperCase();
  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = allowedRoles.some((r) => r.toUpperCase() === currentRole);
    if (!isAuthorized) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Generate role-specific navigation items
  const getNavItems = (): (NavItem & { path: string })[] => {
    switch (currentRole) {
      case 'STUDENT':
        return [
          { id: 'home', label: 'Dashboard', icon: 'dashboard', path: '/app/student/home' },
          { id: 'report', label: 'Report Issue', icon: 'add_circle', path: '/app/student/report' },
          { id: 'reports', label: 'My Reports', icon: 'assignment', path: '/app/student/reports' },
          { id: 'alerts', label: 'Notifications', icon: 'notifications', path: '/app/student/alerts' },
          { id: 'help', label: 'Help & Support', icon: 'help', path: '/app/student/help' },
        ];
      case 'FACULTY':
        return [
          { id: 'home', label: 'Overview', icon: 'dashboard', path: '/app/faculty/home' },
          { id: 'timetable', label: 'My Timetable', icon: 'calendar_month', path: '/app/faculty/timetable' },
          { id: 'report', label: 'Report Issue', icon: 'report_problem', path: '/app/faculty/report' },
          { id: 'rooms', label: 'Room Passes', icon: 'swap_horiz', path: '/app/faculty/rooms' },
          { id: 'alerts', label: 'Notifications', icon: 'notifications', path: '/app/faculty/alerts' },
          { id: 'help', label: 'Operations FAQ', icon: 'help', path: '/app/faculty/help' },
        ];
      case 'TECHNICIAN':
        return [
          { id: 'work-orders', label: 'Work Orders', icon: 'construction', path: '/app/technician/work-orders' },
          { id: 'parts', label: 'Parts Requests', icon: 'inventory_2', path: '/app/technician/parts' },
          { id: 'schedule', label: 'Schedule & Leave', icon: 'event_available', path: '/app/technician/schedule' },
          { id: 'diagnostics', label: 'Diagnostic Tools', icon: 'terminal', path: '/app/technician/diagnostics' },
          { id: 'alerts', label: 'Notifications', icon: 'notifications', path: '/app/technician/alerts' },
        ];
      case 'DEPARTMENT_MANAGER':
        return [
          { id: 'home', label: 'Dept Overview', icon: 'dashboard', path: '/app/dept-manager/home' },
          { id: 'relocations', label: 'Relocations', icon: 'fact_check', path: '/app/dept-manager/relocations' },
          { id: 'issues', label: 'Dept Issues', icon: 'report', path: '/app/dept-manager/issues' },
          { id: 'rooms', label: 'Rooms & Matrix', icon: 'domain', path: '/app/dept-manager/rooms' },
          { id: 'alerts', label: 'Notifications', icon: 'notifications', path: '/app/dept-manager/alerts' },
        ];
      case 'FACILITIES_ADMIN':
      case 'FACILITIES_ADMINISTRATOR':
        return [
          { id: 'triage', label: 'Incident Triage', icon: 'emergency', path: '/app/facilities/triage' },
          { id: 'work-orders', label: 'Campus Orders', icon: 'assignment', path: '/app/facilities/work-orders' },
          { id: 'rooms', label: 'Rooms & Outages', icon: 'meeting_room', path: '/app/facilities/rooms' },
          { id: 'roster', label: 'Technician Roster', icon: 'engineering', path: '/app/facilities/roster' },
          { id: 'alerts', label: 'Notifications', icon: 'notifications', path: '/app/facilities/alerts' },
        ];
      case 'PROCUREMENT_MANAGER':
        return [
          { id: 'requests', label: 'Purchase Requests', icon: 'shopping_cart', path: '/app/procurement/requests' },
          { id: 'receipts', label: 'Dock Receipts', icon: 'local_shipping', path: '/app/procurement/receipts' },
          { id: 'inventory', label: 'Inventory Ledger', icon: 'inventory', path: '/app/procurement/inventory' },
          { id: 'policies', label: 'Policy Rules', icon: 'gavel', path: '/app/procurement/policies' },
          { id: 'alerts', label: 'Notifications', icon: 'notifications', path: '/app/procurement/alerts' },
        ];
      case 'SYSTEM_ADMIN':
      case 'SYSTEM_ADMINISTRATOR':
        return [
          { id: 'overview', label: 'System Overview', icon: 'speed', path: '/app/sysadmin/overview' },
          { id: 'data', label: 'Campus Data & QR', icon: 'qr_code_2', path: '/app/sysadmin/data' },
          { id: 'audit', label: 'Audit Ledger', icon: 'lock', path: '/app/sysadmin/audit' },
          { id: 'users', label: 'Users & Roles', icon: 'group', path: '/app/sysadmin/users' },
          { id: 'integrations', label: 'Integrations', icon: 'hub', path: '/app/sysadmin/integrations' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Find active nav item based on current pathname
  const activeNav = navItems.find((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')) || navItems[0];

  return (
    <div className="min-h-screen bg-brandDark text-brandCream antialiased flex flex-col font-body selection:bg-brandLime selection:text-brandDark">
      {/* Persistent Left Sidebar */}
      <AppSidebar
        navItems={navItems.map((item) => ({
          ...item,
          onClick: () => {
            navigate(item.path);
            setMobileSidebarOpen(false);
          },
        }))}
        activeId={activeNav?.id || ''}
        onSelect={(id) => {
          const target = navItems.find((n) => n.id === id);
          if (target) navigate(target.path);
        }}
        isOpenOnMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        <AppTopbar
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        <footer className="border-t border-[#2A2A2A] bg-[#0E0E0E] py-4 px-6 text-xs text-neutral-400 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse" />
              <span className="text-brandCream font-semibold">CampusOps Core v1.0.0</span>
              <span>•</span>
              <span className="text-neutral-500">Multimodal Telemetry Engine</span>
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
