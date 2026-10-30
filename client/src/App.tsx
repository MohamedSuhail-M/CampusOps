import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { RoleLayout } from './layouts/RoleLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Student Portal Pages
import { StudentHomePage } from './pages/student/StudentHomePage';
import { StudentReportPage } from './pages/student/StudentReportPage';
import { StudentReportsListPage } from './pages/student/StudentReportsListPage';
import { ComplaintDetailsPage } from './pages/student/ComplaintDetailsPage';
import { StudentAlertsPage } from './pages/student/StudentAlertsPage';
import { StudentHelpPage } from './pages/student/StudentHelpPage';

// Faculty Portal Pages
import { FacultyHomePage } from './pages/faculty/FacultyHomePage';
import { FacultyTimetablePage } from './pages/faculty/FacultyTimetablePage';
import { FacultyRoomsPage } from './pages/faculty/FacultyRoomsPage';
import { FacultyReportPage } from './pages/faculty/FacultyReportPage';

// Technician Portal Pages
import { TechnicianWorkOrdersPage } from './pages/technician/TechnicianWorkOrdersPage';
import { TechnicianPartsPage } from './pages/technician/TechnicianPartsPage';
import { TechnicianSchedulePage } from './pages/technician/TechnicianSchedulePage';
import { TechnicianDiagnosticsPage } from './pages/technician/TechnicianDiagnosticsPage';

// Department Manager Pages
import { DeptManagerHomePage } from './pages/dept_manager/DeptManagerHomePage';
import { DeptManagerRelocationsPage } from './pages/dept_manager/DeptManagerRelocationsPage';
import { DeptManagerIssuesPage } from './pages/dept_manager/DeptManagerIssuesPage';
import { DeptManagerRoomsPage } from './pages/dept_manager/DeptManagerRoomsPage';

// Facilities Admin Pages
import { FacilitiesTriagePage } from './pages/facilities/FacilitiesTriagePage';
import { FacilitiesWorkOrdersPage } from './pages/facilities/FacilitiesWorkOrdersPage';
import { FacilitiesRoomsPage } from './pages/facilities/FacilitiesRoomsPage';
import { FacilitiesRosterPage } from './pages/facilities/FacilitiesRosterPage';

// Procurement Manager Pages
import { ProcurementRequestsPage } from './pages/procurement/ProcurementRequestsPage';
import { ProcurementReceiptsPage } from './pages/procurement/ProcurementReceiptsPage';
import { ProcurementInventoryPage } from './pages/procurement/ProcurementInventoryPage';
import { ProcurementPoliciesPage } from './pages/procurement/ProcurementPoliciesPage';

// System Admin Pages
import { SysAdminOverviewPage } from './pages/sysadmin/SysAdminOverviewPage';
import { SysAdminDataPage } from './pages/sysadmin/SysAdminDataPage';
import { SysAdminAuditPage } from './pages/sysadmin/SysAdminAuditPage';
import { SysAdminUsersPage } from './pages/sysadmin/SysAdminUsersPage';
import { SysAdminIntegrationsPage } from './pages/sysadmin/SysAdminIntegrationsPage';

/**
 * HashSyncHandler:
 * Preserves backward compatibility for #login and #landing URLs
 */
const HashSyncHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.location.hash === '#login' && location.pathname !== '/login') {
      window.location.hash = '';
      navigate('/login', { replace: true });
    } else if (window.location.hash === '#landing' && location.pathname !== '/') {
      window.location.hash = '';
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  return null;
};

/**
 * RoleRedirect:
 * Redirects authenticated users accessing /app to their default role landing page
 */
const RoleDashboardRedirect: React.FC = () => {
  const { user, activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brandDark flex items-center justify-center text-brandCream">
        <div className="flex flex-col items-center gap-3 font-mono text-xs text-neutral-400">
          <div className="w-10 h-10 border-4 border-brandLime border-t-transparent rounded-full animate-spin" />
          <span>ROUTING TO OPERATIONAL SECTOR...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (activeRole || user.activeRole || user.roles?.[0]?.code || '').toUpperCase().trim();

  switch (role) {
    case 'STUDENT':
      return <Navigate to="/app/student/home" replace />;
    case 'FACULTY':
      return <Navigate to="/app/faculty/home" replace />;
    case 'TECHNICIAN':
      return <Navigate to="/app/technician/work-orders" replace />;
    case 'DEPARTMENT_MANAGER':
      return <Navigate to="/app/dept-manager/home" replace />;
    case 'FACILITIES_ADMIN':
    case 'FACILITIES_ADMINISTRATOR':
      return <Navigate to="/app/facilities/triage" replace />;
    case 'PROCUREMENT_MANAGER':
      return <Navigate to="/app/procurement/requests" replace />;
    case 'SYSTEM_ADMIN':
    case 'SYSTEM_ADMINISTRATOR':
      return <Navigate to="/app/sysadmin/overview" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <HashSyncHandler />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Dynamic Role Dashboard Base Redirect */}
            <Route path="/app" element={<RoleDashboardRedirect />} />

            {/* STUDENT PORTAL */}
            <Route path="/app/student" element={<RoleLayout allowedRoles={['STUDENT', 'SYSTEM_ADMIN']} />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<StudentHomePage />} />
              <Route path="report" element={<StudentReportPage />} />
              <Route path="reports" element={<StudentReportsListPage />} />
              <Route path="reports/:id" element={<ComplaintDetailsPage />} />
              <Route path="alerts" element={<StudentAlertsPage />} />
              <Route path="help" element={<StudentHelpPage />} />
            </Route>

            {/* FACULTY PORTAL */}
            <Route path="/app/faculty" element={<RoleLayout allowedRoles={['FACULTY', 'SYSTEM_ADMIN']} />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<FacultyHomePage />} />
              <Route path="timetable" element={<FacultyTimetablePage />} />
              <Route path="report" element={<FacultyReportPage />} />
              <Route path="rooms" element={<FacultyRoomsPage />} />
              <Route path="alerts" element={<StudentAlertsPage />} />
              <Route path="help" element={<StudentHelpPage />} />
            </Route>

            {/* TECHNICIAN PORTAL */}
            <Route path="/app/technician" element={<RoleLayout allowedRoles={['TECHNICIAN', 'SYSTEM_ADMIN']} />}>
              <Route index element={<Navigate to="work-orders" replace />} />
              <Route path="work-orders" element={<TechnicianWorkOrdersPage />} />
              <Route path="parts" element={<TechnicianPartsPage />} />
              <Route path="schedule" element={<TechnicianSchedulePage />} />
              <Route path="diagnostics" element={<TechnicianDiagnosticsPage />} />
              <Route path="alerts" element={<StudentAlertsPage />} />
            </Route>

            {/* DEPARTMENT MANAGER PORTAL */}
            <Route path="/app/dept-manager" element={<RoleLayout allowedRoles={['DEPARTMENT_MANAGER', 'SYSTEM_ADMIN']} />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<DeptManagerHomePage />} />
              <Route path="relocations" element={<DeptManagerRelocationsPage />} />
              <Route path="issues" element={<DeptManagerIssuesPage />} />
              <Route path="rooms" element={<DeptManagerRoomsPage />} />
              <Route path="alerts" element={<StudentAlertsPage />} />
            </Route>

            {/* FACILITIES ADMIN PORTAL */}
            <Route path="/app/facilities" element={<RoleLayout allowedRoles={['FACILITIES_ADMIN', 'FACILITIES_ADMINISTRATOR', 'SYSTEM_ADMIN']} />}>
              <Route index element={<Navigate to="triage" replace />} />
              <Route path="triage" element={<FacilitiesTriagePage />} />
              <Route path="work-orders" element={<FacilitiesWorkOrdersPage />} />
              <Route path="rooms" element={<FacilitiesRoomsPage />} />
              <Route path="roster" element={<FacilitiesRosterPage />} />
              <Route path="alerts" element={<StudentAlertsPage />} />
            </Route>

            {/* PROCUREMENT PORTAL */}
            <Route path="/app/procurement" element={<RoleLayout allowedRoles={['PROCUREMENT_MANAGER', 'SYSTEM_ADMIN']} />}>
              <Route index element={<Navigate to="requests" replace />} />
              <Route path="requests" element={<ProcurementRequestsPage />} />
              <Route path="receipts" element={<ProcurementReceiptsPage />} />
              <Route path="inventory" element={<ProcurementInventoryPage />} />
              <Route path="policies" element={<ProcurementPoliciesPage />} />
              <Route path="alerts" element={<StudentAlertsPage />} />
            </Route>

            {/* SYSTEM ADMIN PORTAL */}
            <Route path="/app/sysadmin" element={<RoleLayout allowedRoles={['SYSTEM_ADMIN', 'SYSTEM_ADMINISTRATOR']} />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<SysAdminOverviewPage />} />
              <Route path="data" element={<SysAdminDataPage />} />
              <Route path="audit" element={<SysAdminAuditPage />} />
              <Route path="users" element={<SysAdminUsersPage />} />
              <Route path="integrations" element={<SysAdminIntegrationsPage />} />
            </Route>

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
