import React, { useState } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const FacultyRoomsPage: React.FC = () => {
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'FACULTY', path: '/app/faculty/home' }, { label: 'ROOM REQUESTS & RELOCATIONS' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Emergency Relocation Passes
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Authorized classroom transfers generated during campus infrastructure disruptions.
        </p>
      </div>

      {/* Relocation Pass Card (Scenario 1) */}
      <div className="bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl overflow-hidden">
        <div className="bg-[#1C1C1C] border-b border-[#2A2A2A] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brandLime animate-pulse" />
            <span className="font-mono text-xs font-bold text-brandLime uppercase tracking-wider">
              OFFICIAL RELOCATION PASS #REL-2026-081
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-brandLime text-brandDark font-mono font-bold text-[10px] uppercase">
            Authorized by Dept Manager
          </span>
        </div>

        <div className="p-6 space-y-6 font-mono text-xs">
          {/* Visual Transfer Arrow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#181818] p-5 rounded-xl border border-[#2A2A2A] text-center">
            <div className="space-y-1">
              <span className="text-[10px] text-red-400 uppercase font-bold block">Original Disrupted Room</span>
              <p className="text-xl font-bold font-display text-brandCream">RM-B-204</p>
              <p className="text-[11px] text-neutral-400">Building B • Capacity 60</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-red-950 text-red-400 text-[10px]">
                Electrical Spark Hazard
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-brandLime">
              <span className="material-symbols-outlined text-3xl animate-pulse">arrow_forward</span>
              <span className="text-[10px] font-bold tracking-widest uppercase mt-1">
                EMERGENCY RELOCATION
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-brandLime uppercase font-bold block">Assigned Substitute Room</span>
              <p className="text-xl font-bold font-display text-brandLime">RM-B-206</p>
              <p className="text-[11px] text-neutral-400">Building B • Capacity 80 (Score 265)</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]">
                Projector & Power Verified
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-sans text-neutral-300 bg-[#1C1C1C] p-4 rounded-xl border border-[#2A2A2A]">
            <p className="font-bold text-brandCream">Faculty Relocation Protocol:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400 text-xs font-mono">
              <li>Students have been notified via campus SMS and digital board alerts.</li>
              <li>Exam invigilation packages have been redirected to Room B-206.</li>
              <li>Technician Manoj Kumar is assigned to inspect Room B-204 breaker panel.</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-neutral-500 text-[11px]">
              Digital Signature: Dr. Suresh Balan (Dept Manager CSE)
            </span>

            <button
              type="button"
              disabled={acknowledged}
              onClick={() => setAcknowledged(true)}
              className={`px-5 py-2.5 font-mono font-bold text-xs uppercase rounded-lg shadow-[3px_3px_0px_#0A0A0A] transition-all ${
                acknowledged
                  ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                  : 'bg-brandLime text-brandDark hover:bg-[#b0dc28]'
              }`}
            >
              {acknowledged ? '✓ Pass Acknowledged' : 'Acknowledge Relocation Pass'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
