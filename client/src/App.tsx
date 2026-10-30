import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentView } from './pages/StudentView';
import { FacultyView } from './pages/FacultyView';
import { TechnicianView } from './pages/TechnicianView';
import { ProcurementView } from './pages/ProcurementView';
import { FacilitiesAdminView } from './pages/FacilitiesAdminView';
import { DepartmentManagerView } from './pages/DepartmentManagerView';
import { SystemAdminView } from './pages/SystemAdminView';

const MainContent: React.FC = () => {
  const { user, activeRole, loading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState<boolean>(() => {
    return window.location.hash === '#login';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setShowLogin(window.location.hash === '#login');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brandDark flex items-center justify-center text-brandCream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brandLime border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-neutral-400 font-mono tracking-wider">
            AUTHENTICATING CAMPUSOPS SESSION...
          </span>
        </div>
      </div>
    );
  }

  // If not logged in, switch between Public Architectural Broadsheet & Dispatch Login Console
  if (!user) {
    if (showLogin) {
      return (
        <LoginPage
          onBackToLanding={() => {
            window.location.hash = '#landing';
            setShowLogin(false);
          }}
        />
      );
    }
    return (
      <LandingPage
        onSignIn={() => {
          window.location.hash = '#login';
          setShowLogin(true);
        }}
      />
    );
  }

  // Normalize active role
  const rawRole = activeRole || user.activeRole || user.roles?.[0]?.code || '';
  const currentRole = rawRole.toUpperCase().trim();

  // Render role-specific operational dashboard
  switch (currentRole) {
    case 'STUDENT':
      return <StudentView />;
    case 'FACULTY':
      return <FacultyView />;
    case 'TECHNICIAN':
      return <TechnicianView />;
    case 'PROCUREMENT_MANAGER':
    case 'PROCUREMENT':
      return <ProcurementView />;
    case 'FACILITIES_ADMIN':
    case 'FACILITIES_ADMINISTRATOR':
      return <FacilitiesAdminView />;
    case 'DEPARTMENT_MANAGER':
      return <DepartmentManagerView />;
    case 'SYSTEM_ADMIN':
    case 'SYSTEM_ADMINISTRATOR':
      return <SystemAdminView />;
    default:
      return (
        <div className="min-h-screen bg-brandDark flex items-center justify-center text-brandCream p-6 text-center">
          <div className="max-w-md p-6 bg-[#181818] border border-[#2A2A2A] rounded-xl space-y-4">
            <h2 className="text-lg font-bold font-display uppercase tracking-wider text-brandCream">
              Unrecognized Role: {rawRole || 'None'}
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              The assigned role for this session could not be matched.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#b0dc28]"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      );
  }
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
