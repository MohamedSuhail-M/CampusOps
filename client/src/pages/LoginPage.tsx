import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onBackToLanding?: () => void;
}

const ROLES = [
  {
    code: 'STUDENT',
    shortLabel: 'STUDENT',
    name: 'Student',
    demoLogin: 'campus001',
    demoName: 'Ananya Sharma',
    department: 'Computer Science & Engineering',
    destDesc: 'STUDENT PORTAL (TICKET INTAKE & QR ASSET SCAN)',
  },
  {
    code: 'FACULTY',
    shortLabel: 'FACULTY',
    name: 'Faculty',
    demoLogin: 'campus017',
    demoName: 'Dr. Kavitha Menon',
    department: 'Computer Science & Engineering',
    destDesc: 'FACULTY PORTAL (TIMETABLE & CLASSROOM ADVISORIES)',
  },
  {
    code: 'TECHNICIAN',
    shortLabel: 'TECH',
    name: 'Technician',
    demoLogin: 'campus031',
    demoName: 'Manoj Kumar',
    department: 'Electrical Maintenance',
    destDesc: 'TECHNICIAN CONSOLE (WORK ORDERS & REPAIR DISPATCH)',
  },
  {
    code: 'PROCUREMENT_MANAGER',
    shortLabel: 'PROCUREMENT',
    name: 'Procurement',
    demoLogin: 'campus030',
    demoName: 'Mr. Dinesh I',
    department: 'Central Procurement',
    destDesc: 'PROCUREMENT QUEUE (PURCHASE APPROVAL & DOCK RECEIPTS)',
  },
  {
    code: 'FACILITIES_ADMIN',
    shortLabel: 'FACILITIES',
    name: 'Facilities Admin',
    demoLogin: 'campus028',
    demoName: 'Mr. Joseph Thomas',
    department: 'Campus Estate & Facilities',
    destDesc: 'FACILITIES DESK (INCIDENT TRIAGE & LEAVE CHECK)',
  },
  {
    code: 'DEPARTMENT_MANAGER',
    shortLabel: 'DEPT MGR',
    name: 'Dept Manager',
    demoLogin: 'campus024',
    demoName: 'Dr. Suresh Balan',
    department: 'Computer Science & Engineering',
    destDesc: 'DEPARTMENT OVERSIGHT (EMERGENCY EXAM RELOCATION)',
  },
  {
    code: 'SYSTEM_ADMIN',
    shortLabel: 'SYS ADMIN',
    name: 'System Admin',
    demoLogin: 'campus029',
    demoName: 'Ms. Aisha Rahman',
    department: 'IT Services',
    destDesc: 'SYSTEM ADMIN CONSOLE (AUDIT LOGS & HEALTH METRICS)',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding }) => {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('campus001');
  const [password, setPassword] = useState('password123');
  const [requestedRole, setRequestedRole] = useState('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedRoleObj = ROLES.find((r) => r.code === requestedRole) || ROLES[0];

  const handleSelectRole = (r: typeof ROLES[0]) => {
    setRequestedRole(r.code);
    setLoginId(r.demoLogin);
    setPassword('password123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(loginId, password, requestedRole);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#0A0A0A] text-brandCream font-sans min-h-screen antialiased selection:bg-brandLime selection:text-brandDark flex flex-col justify-between">
      {/* Top Utility Bar / Status Strip */}
      <header className="h-10 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono tracking-wider text-neutral-400 uppercase bg-[#070707] z-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brandLime animate-pulse" />
          <span className="text-brandCream font-semibold">CAMPUSOPS GATEWAY</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400">NODE 01-PROD</span>
        </div>

        <div className="flex items-center gap-4 text-[10px]">
          <span className="hidden sm:inline text-neutral-500">TAMPER-EVIDENT RBAC DISPATCH</span>
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="font-mono text-brandLime hover:underline uppercase font-bold"
            >
              ← PUBLIC BROADSHEET
            </button>
          )}
        </div>
      </header>

      {/* Main 50/50 Split Container */}
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-8 lg:p-12 relative blueprint-grid">
        <div className="w-full max-w-6xl bg-brandCream border-2 border-brandDark shadow-[8px_8px_0px_0px_#C5F135] grid grid-cols-1 lg:grid-cols-12 overflow-hidden text-brandDark">
          {/* Left Column (Obsidian Dark Telemetry Panel) */}
          <div className="lg:col-span-5 bg-[#0E0E0E] text-brandCream p-6 sm:p-10 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-brandDark relative overflow-hidden">
            <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center bg-[#0a1612]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0E0E0E]/90 to-[#0A0A0A]/80 pointer-events-none" />
              <div className="absolute inset-0 blueprint-grid opacity-20 pointer-events-none" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brandLime border-2 border-brandDark flex items-center justify-center text-brandDark font-display font-bold text-xl tracking-tighter shadow-[2px_2px_0px_#FFFFFF20]">
                  CO
                </div>
                <div>
                  <span className="font-display font-bold text-2xl tracking-wider text-brandCream block leading-none">
                    CAMPUS<span className="text-brandLime">OPS</span>
                  </span>
                  <div className="font-mono text-[9px] tracking-[0.2em] text-brandCream/70 uppercase pt-1">
                    OPERATIONS DISPATCH CONSOLE
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 my-auto py-8">
              <div className="max-w-md">
                <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl uppercase tracking-tight text-brandCream leading-none mb-4">
                  DIGITAL CAMPUS<br />
                  <span className="text-brandLime">COORDINATION</span>
                </h1>

                <div className="font-sans text-brandCream text-sm leading-relaxed bg-[#0A0A0A]/85 p-4 border-l-2 border-brandLime space-y-3 mb-4">
                  <p className="font-medium text-brandCream leading-relaxed">
                    Synchronizing facilities, academic scheduling, and emergency dispatch across the entire university campus.
                  </p>
                  <p className="font-mono text-xs text-brandLime tracking-wide leading-relaxed">
                    Deterministic policy enforcement with zero manual overrides.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-neutral-400 uppercase">
              <span>SECURITY: BCRYPT-12</span>
              <span>OVERCLOCK &apos;26</span>
            </div>
          </div>

          {/* Right Column (Warm Cream Brutalist Action Panel) */}
          <div className="lg:col-span-7 bg-brandCream p-6 sm:p-10 flex flex-col justify-between">
            {/* Top Bar inside panel */}
            <div className="flex items-center justify-between pb-4 border-b border-brandDark/15">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-brandDark">
                <span className="w-2 h-2 bg-brandLime border border-brandDark inline-block" />
                GATEWAY ACCESS // DISPATCH CONSOLE
              </div>
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="font-mono text-xs text-brandDark font-bold tracking-wider uppercase inline-flex items-center gap-1 py-1 px-2.5 border-2 border-brandDark bg-white shadow-[2px_2px_0px_#0A0A0A] hover:bg-brandCream active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  ← BACK
                </button>
              )}
            </div>

            {/* Form Area */}
            <div className="my-auto py-4 max-w-lg mx-auto w-full">
              <div className="mb-5">
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-brandDark uppercase tracking-tight leading-none mb-1">
                  SIGN IN
                </h2>
                <p className="font-sans text-neutral-700 text-xs sm:text-sm font-medium">
                  Select your campus role and enter credentials to access the operations engine.
                </p>
              </div>

              {/* 7 Role Selector Chips */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs font-bold tracking-wider uppercase text-brandDark">
                    1. SELECT AUTHORIZED ROLE
                  </label>
                  <span className="font-mono text-[10px] text-neutral-600 uppercase font-bold truncate max-w-[200px]">
                    → {selectedRoleObj.shortLabel}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 font-mono font-bold uppercase tracking-wider text-center text-[10px]">
                  {ROLES.map((r) => {
                    const isSelected = requestedRole === r.code;
                    return (
                      <button
                        type="button"
                        key={r.code}
                        onClick={() => handleSelectRole(r)}
                        className={`py-2 px-1 border-2 border-brandDark transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brandDark text-brandLime shadow-[2px_2px_0px_#0A0A0A]'
                            : 'bg-white text-brandDark hover:bg-[#EBE7DF]'
                        }`}
                      >
                        {r.shortLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 p-2 bg-white border border-brandDark font-mono text-[10px] text-neutral-700 flex items-center justify-between">
                  <span className="font-bold text-brandDark">{selectedRoleObj.name}: {selectedRoleObj.demoName}</span>
                  <span className="text-neutral-500">{selectedRoleObj.department}</span>
                </div>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div className="mb-4 p-3 bg-[#FF5555]/15 border-2 border-[#FF5555] text-brandDark font-mono text-xs font-bold flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-[#FF5555]">error</span>
                  <div>
                    <div className="uppercase">AUTHENTICATION DENIED</div>
                    <div className="font-normal text-neutral-800">{error}</div>
                  </div>
                </div>
              )}

              {/* Real Credentials Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="campus-login-id"
                      className="font-mono text-xs font-bold tracking-wider uppercase text-brandDark"
                    >
                      CAMPUS LOGIN ID / USERNAME
                    </label>
                    <span className="font-mono text-[10px] text-neutral-600">
                      e.g. {selectedRoleObj.demoLogin}
                    </span>
                  </div>
                  <input
                    id="campus-login-id"
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter login username"
                    required
                    className="w-full h-11 px-3 bg-white border-2 border-brandDark font-mono text-brandDark text-sm focus:outline-none focus:ring-2 focus:ring-brandLime focus:border-brandDark transition-all shadow-[2px_2px_0px_#0A0A0A]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="campus-password"
                      className="font-mono text-xs font-bold tracking-wider uppercase text-brandDark"
                    >
                      PASSWORD
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="font-mono text-[11px] font-bold tracking-wider uppercase text-brandDark hover:underline"
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  <input
                    id="campus-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full h-11 px-3 bg-white border-2 border-brandDark font-mono text-brandDark text-sm focus:outline-none focus:ring-2 focus:ring-brandLime focus:border-brandDark transition-all shadow-[2px_2px_0px_#0A0A0A]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-brandLime border-2 border-brandDark text-brandDark font-display font-bold text-base tracking-wider uppercase flex items-center justify-center space-x-2 shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0A0A0A] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-brandDark border-t-transparent rounded-full animate-spin" />
                        <span>AUTHENTICATING SESSION...</span>
                      </span>
                    ) : (
                      <span>SIGN IN TO DISPATCH CONSOLE →</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Destination Summary */}
              <div className="mt-4 pt-3 border-t border-brandDark/15 font-mono text-[10px] text-neutral-600 flex items-center justify-between">
                <span>TARGET EXPERIENCE:</span>
                <span className="font-bold text-brandDark">{selectedRoleObj.destDesc}</span>
              </div>
            </div>

            {/* Bottom Panel Metadata */}
            <div className="pt-4 border-t border-brandDark/15 flex items-center justify-between font-mono text-neutral-600 uppercase tracking-wider text-[10px]">
              <span>SSO &amp; SESSION COOKIE ENFORCED</span>
              <span>© 2026 CAMPUSOPS INC.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-white/10 px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono tracking-wider text-neutral-400 uppercase bg-[#070707] z-20 shrink-0">
        <div>TEAM LOWKEY CODERS // OVERCLOCK &apos;26</div>
        <div>DEMO PASSWORD: password123</div>
      </footer>
    </div>
  );
};
