import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const NotFoundPage: React.FC = () => {
  const { user, activeRole } = useAuth();

  const getHomeRoute = () => {
    if (!user) return '/login';
    switch (activeRole) {
      case 'STUDENT': return '/app/student/home';
      case 'FACULTY': return '/app/faculty/home';
      case 'TECHNICIAN': return '/app/technician/work-orders';
      case 'DEPARTMENT_MANAGER': return '/app/dept-manager/home';
      case 'FACILITIES_ADMIN': return '/app/facilities/triage';
      case 'PROCUREMENT_MANAGER': return '/app/procurement/requests';
      case 'SYSTEM_ADMIN': return '/app/sysadmin/overview';
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen bg-brandDark text-brandCream flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl p-8 space-y-4">
        <span className="material-symbols-outlined text-6xl text-brandLime animate-pulse">
          location_off
        </span>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-brandCream">
          404 — Page Not Found
        </h1>
        <p className="text-xs font-mono text-neutral-400">
          The requested route does not exist in the CampusOps telemetry matrix.
        </p>
        <div className="pt-2">
          <Link
            to={getHomeRoute()}
            className="inline-block px-6 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all"
          >
            Return to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
};
