import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const FacilitiesRosterPage: React.FC = () => {
  const roster = [
    { name: 'Manoj Kumar', role: 'Electrician', shift: '08:00 - 16:30', zone: 'Zone B & C', status: 'ON DUTY (ELIGIBLE)', color: 'emerald' },
    { name: 'Selvam P', role: 'Senior Electrician', shift: 'On Leave', zone: 'Zone A', status: 'MEDICAL LEAVE (LEV001)', color: 'red' },
    { name: 'Karthik R', role: 'HVAC Specialist', shift: '08:00 - 16:30', zone: 'Central Plant', status: 'ON DUTY (ELIGIBLE)', color: 'emerald' },
    { name: 'Ganesh M', role: 'Plumbing & Water', shift: '10:00 - 18:30', zone: 'Hostels & Canteen', status: 'ON DUTY (ELIGIBLE)', color: 'emerald' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'FACILITIES ADMIN', path: '/app/facilities/triage' }, { label: 'TECHNICIAN ROSTER' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Campus Technician Duty Roster
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Active shift assignments, skill profiles, and automated leave lockout verification.
        </p>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Technician Name</th>
              <th className="py-3 px-4">Primary Trade</th>
              <th className="py-3 px-4">Shift Hours</th>
              <th className="py-3 px-4">Assigned Campus Zone</th>
              <th className="py-3 px-4">Dispatch Eligibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {roster.map((tech, idx) => (
              <tr key={idx} className="hover:bg-[#1A1A1A] transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-brandCream">
                  {tech.name}
                </td>
                <td className="py-3.5 px-4 text-neutral-300">
                  {tech.role}
                </td>
                <td className="py-3.5 px-4 font-mono text-neutral-400">
                  {tech.shift}
                </td>
                <td className="py-3.5 px-4 font-mono text-neutral-300">
                  {tech.zone}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase ${
                    tech.color === 'red'
                      ? 'bg-red-950 text-red-300 border border-red-700/60'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                  }`}>
                    {tech.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
