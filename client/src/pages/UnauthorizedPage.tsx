import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { activeRole, logout } = useAuth();

  return (
    <div className="min-h-screen bg-brandDark text-brandCream flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl p-8 space-y-4">
        <span className="material-symbols-outlined text-6xl text-red-500 animate-pulse">
          gpp_bad
        </span>
        <h1 className="text-2xl font-display font-bold uppercase tracking-wider text-brandCream">
          403 — Access Denied
        </h1>
        <p className="text-xs font-mono text-neutral-400">
          Your current active role ({activeRole || 'UNAUTHORIZED'}) does not have permission to view this operational sector.
        </p>
        <div className="flex gap-3 justify-center pt-2 font-mono text-xs">
          <Link
            to="/app"
            className="px-5 py-2.5 bg-brandLime text-brandDark font-bold uppercase rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28]"
          >
            My Dashboard
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="px-5 py-2.5 bg-[#2A2A2A] hover:bg-[#333] text-brandCream font-bold uppercase rounded-lg border border-[#3A3A3A]"
          >
            Switch Role / Re-login
          </button>
        </div>
      </div>
    </div>
  );
};
