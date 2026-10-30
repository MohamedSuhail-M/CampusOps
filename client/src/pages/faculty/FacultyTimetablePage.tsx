import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Link } from 'react-router-dom';

export const FacultyTimetablePage: React.FC = () => {
  const schedule = [
    { day: 'Monday', time: '09:00 - 10:30', course: 'CS301 — Data Structures', room: 'RM-B-204', capacity: 60, status: 'DISRUPTED' },
    { day: 'Monday', time: '11:00 - 12:30', course: 'CS402 — Operating Systems Lab', room: 'RM-C-102', capacity: 45, status: 'OK' },
    { day: 'Tuesday', time: '10:00 - 11:30', course: 'CS205 — DBMS Lecture', room: 'RM-A-101', capacity: 70, status: 'OK' },
    { day: 'Wednesday', time: '14:00 - 16:00', course: 'CS502 — AI & Neural Networks', room: 'RM-B-206', capacity: 80, status: 'OK' },
    { day: 'Thursday', time: '09:00 - 11:00', course: 'CS301 — Algorithms Practical', room: 'RM-C-104', capacity: 40, status: 'OK' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'FACULTY', path: '/app/faculty/home' }, { label: 'MY TIMETABLE' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Academic Schedule & Classrooms
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Weekly lecture hall bookings synced directly with campus timetable system.
          </p>
        </div>

        <Link
          to="/app/faculty/rooms"
          className="px-4 py-2 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-xl shadow-[3px_3px_0px_#0A0A0A]"
        >
          Check Relocation Passes
        </Link>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Day & Time</th>
              <th className="py-3 px-4">Course & Subject</th>
              <th className="py-3 px-4">Assigned Room</th>
              <th className="py-3 px-4">Room Capacity</th>
              <th className="py-3 px-4">Hall Health</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {schedule.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#1A1A1A] transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                  {row.day} • {row.time}
                </td>
                <td className="py-3.5 px-4 font-semibold text-brandCream">
                  {row.course}
                </td>
                <td className="py-3.5 px-4 font-mono text-neutral-300">
                  {row.room}
                </td>
                <td className="py-3.5 px-4 font-mono text-neutral-400">
                  {row.capacity} Seats
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {row.status === 'DISRUPTED' ? (
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700/60 font-mono text-[10px] font-bold uppercase">
                      Socket Hazard
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] font-bold uppercase">
                      Operational
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {row.status === 'DISRUPTED' ? (
                    <Link
                      to="/app/faculty/rooms"
                      className="px-3 py-1 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded"
                    >
                      Relocate →
                    </Link>
                  ) : (
                    <Link
                      to="/app/faculty/report"
                      className="text-neutral-400 hover:text-brandLime font-mono text-xs uppercase"
                    >
                      Report Issue
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
