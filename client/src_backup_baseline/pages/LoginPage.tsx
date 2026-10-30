import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

const ROLES = [
  { code: 'STUDENT', name: 'Student', desc: 'Report issues & track complaints', demoLogin: 'campus001', demoName: 'Aarav Sharma' },
  { code: 'FACULTY', name: 'Faculty', desc: 'Classroom schedules & outage alerts', demoLogin: 'campus017', demoName: 'Dr. Kavitha Menon' },
  { code: 'TECHNICIAN', name: 'Technician', desc: 'Work orders, spares & repairs', demoLogin: 'campus031', demoName: 'Manoj Kumar' },
  { code: 'PROCUREMENT_MANAGER', name: 'Procurement Manager', desc: 'Approve PRs & stock receipts', demoLogin: 'campus030', demoName: 'Mr Dinesh I' },
  { code: 'FACILITIES_ADMIN', name: 'Facilities Admin', desc: 'Incident triage & technician dispatch', demoLogin: 'campus028', demoName: 'Dr Priya R' },
  { code: 'DEPARTMENT_MANAGER', name: 'Department Manager', desc: 'Department oversight & relocation approval', demoLogin: 'campus024', demoName: 'Dr Suresh Balan' },
  { code: 'SYSTEM_ADMIN', name: 'System Admin', desc: 'Full audit trail, SLA & master data', demoLogin: 'campus029', demoName: 'Mr Rajesh K' },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('campus001');
  const [password, setPassword] = useState('password123');
  const [requestedRole, setRequestedRole] = useState('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSelectDemo = (role: typeof ROLES[0]) => {
    setRequestedRole(role.code);
    setLoginId(role.demoLogin);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-cream">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-lime items-center justify-center font-extrabold text-obsidian text-3xl mb-4 shadow-lg shadow-lime/20">
          C
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">
          CAMPUS<span className="text-lime">OPS</span>
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          Intelligent Operations Platform · Team LOWKEY CODERS (Problem Statement 2)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-charcoal-900 py-8 px-6 shadow-2xl rounded-xl border border-charcoal-700 sm:px-10">
          {error && (
            <div className="mb-6 bg-critical/10 border border-critical/40 text-critical text-sm rounded-lg p-3 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Authentication Denied</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Quick Demo Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-lime" />
              1-Click Demo Persona Quick-Fill
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.code}
                  onClick={() => handleSelectDemo(r)}
                  className={`p-2.5 text-left rounded-lg border text-xs transition ${
                    requestedRole === r.code && loginId === r.demoLogin
                      ? 'bg-charcoal-800 border-lime text-cream ring-1 ring-lime'
                      : 'bg-charcoal-800/60 border-charcoal-700 text-neutral-300 hover:border-charcoal-500'
                  }`}
                >
                  <div className="font-bold truncate text-cream">{r.name}</div>
                  <div className="text-[10px] text-neutral-400 truncate">{r.demoName}</div>
                  <div className="text-[10px] text-lime font-mono mt-0.5">{r.demoLogin}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Campus Login ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. campus001"
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-9 pr-3 py-2 text-sm text-cream focus:outline-none focus:border-lime"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Password (Demo: password123)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-9 pr-3 py-2 text-sm text-cream focus:outline-none focus:border-lime"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                <span>Requested Active Role</span>
                <span className="text-[11px] text-neutral-400">Enforced by backend RBAC</span>
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-9 pr-3 py-2 text-sm text-cream focus:outline-none focus:border-lime cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r.code} value={r.code} className="bg-charcoal-900 text-cream">
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-lime hover:bg-lime-hover text-obsidian font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as {requestedRole}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-charcoal-700 text-center text-xs text-neutral-400">
            Backed by SQLite, Prisma ORM, bcryptjs (cost factor 12) & HTTP-only sessions.
          </div>
        </div>
      </div>
    </div>
  );
};
