import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const TechnicianSchedulePage: React.FC = () => {
  const shifts = [
    { day: 'Today (Friday)', shift: '08:00 - 16:30', zone: 'Zone B & C (Academic Complex)', onCall: true },
    { day: 'Saturday', shift: '09:00 - 13:00', zone: 'Central Facilities & Labs', onCall: false },
    { day: 'Monday', shift: '08:00 - 16:30', zone: 'Zone B & C (Academic Complex)', onCall: true },
    { day: 'Tuesday', shift: '08:00 - 16:30', zone: 'Electrical Substation', onCall: false },
  ];

  const leaveRecords = [
    { staff: 'Selvam P (Electrician)', id: 'LEV001', dates: 'Current Week', type: 'Medical Leave', status: 'APPROVED (EXCLUDED FROM DISPATCH)' },
    { staff: 'Manoj Kumar (Electrician)', id: 'USR031', dates: 'Active', type: 'On Duty', status: 'ELIGIBLE & ASSIGNED' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'TECHNICIAN', path: '/app/technician/work-orders' }, { label: 'SCHEDULE & LEAVE' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Technician Shifts & Leave Status
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Duty roster, operational shift zones, and automated leave lockout verification.
        </p>
      </div>

      {/* Shifts Card */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
        <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
          My Operational Shifts
        </h2>

        <div className="divide-y divide-[#2A2A2A]">
          {shifts.map((s, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div>
                <p className="font-bold text-brandLime">{s.day}</p>
                <p className="text-brandCream">{s.shift} • {s.zone}</p>
              </div>
              <div>
                {s.onCall ? (
                  <span className="px-2 py-0.5 rounded bg-brandLime/20 border border-brandLime text-brandLime text-[10px] font-bold uppercase">
                    On-Call Emergency
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-[#2A2A2A] text-neutral-400 text-[10px] uppercase">
                    Standard Shift
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Lockout Audit (Scenario 1 Enforcement) */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-brandLime text-xl">verified_user</span>
          <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
            Leave Dispatch Lockout Engine
          </h2>
        </div>

        <p className="text-xs font-sans text-neutral-400">
          The dispatch engine verifies staff leave records before assigning critical work orders. Technicians on approved leave cannot receive dispatch calls.
        </p>

        <div className="space-y-2 font-mono text-xs">
          {leaveRecords.map((rec, idx) => (
            <div key={idx} className="p-3 bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-brandCream">{rec.staff}</p>
                <p className="text-[11px] text-neutral-400">{rec.type} • {rec.dates}</p>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                rec.status.includes('EXCLUDED')
                  ? 'bg-red-950 text-red-300 border border-red-700/60'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
              }`}>
                {rec.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
