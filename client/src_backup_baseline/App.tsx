import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { StudentView } from './pages/StudentView';
import { FacultyView } from './pages/FacultyView';
import { TechnicianView } from './pages/TechnicianView';
import { ProcurementView } from './pages/ProcurementView';
import { FacilitiesAdminView } from './pages/FacilitiesAdminView';
import { DepartmentManagerView } from './pages/DepartmentManagerView';
import { SystemAdminView } from './pages/SystemAdminView';

const DashboardContent: React.FC = () => {
  const { user, activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center text-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-lime border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-neutral-400 font-mono">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Render role-specific operational dashboard
  const renderRoleView = () => {
    switch (activeRole) {
      case 'STUDENT':
        return <StudentView />;
      case 'FACULTY':
        return <FacultyView />;
      case 'TECHNICIAN':
        return <TechnicianView />;
      case 'PROCUREMENT_MANAGER':
        return <ProcurementView />;
      case 'FACILITIES_ADMIN':
        return <FacilitiesAdminView />;
      case 'DEPARTMENT_MANAGER':
        return <DepartmentManagerView />;
      case 'SYSTEM_ADMIN':
        return <SystemAdminView />;
      default:
        return (
          <div className="text-center py-12 text-cream">
            <h2 className="text-lg font-bold">Unrecognized Role: {activeRole}</h2>
            <p className="text-xs text-neutral-400 mt-1">Please select an authorized role from the top navbar.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderRoleView()}
      </main>

      <footer className="bg-charcoal-900 border-t border-charcoal-800 py-4 px-6 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse"></span>
            <span className="text-neutral-300 font-semibold">CampusOps Core v1.0.0</span>
            <span>·</span>
            <span>SQLite Local-First Engine</span>
          </div>
          <div className="text-neutral-400">
            Team LOWKEY CODERS | Problem Statement 2 | Overclock&apos;26 Hackathon
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
