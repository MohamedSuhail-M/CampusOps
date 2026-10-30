import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TimetableItem {
  id: string;
  bookingId: string;
  roomId: string;
  roomCode: string;
  roomName: string;
  roomType: string;
  capacity: number;
  buildingCode: string;
  buildingName: string;
  departmentName: string;
  facultyId: string;
  facultyName: string;
  startsAt: string;
  endsAt: string;
  date: string;
  dayOfWeek: string;
  timeSlot: string;
  purpose: string;
  status: string;
  isDisrupted: boolean;
  outageStatus: string;
  outageReason: string | null;
}

export const FacultyTimetablePage: React.FC = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('ALL');

  const fetchTimetable = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch timetable scoped to current faculty or department
      const res = await apiFetch<TimetableItem[]>(`/api/rooms/timetable?status=CONFIRMED`);
      if (res.success && res.data) {
        setTimetable(res.data);
      } else {
        setError(res.error?.message || 'Failed to load timetable.');
      }
    } catch (e: any) {
      setError(e.message || 'Error communicating with timetable service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const filtered = timetable.filter((item) => {
    if (selectedDay === 'ALL') return true;
    return item.dayOfWeek.toLowerCase() === selectedDay.toLowerCase();
  });

  // Highlight faculty's own classes if facultyId matches
  const mySessions = timetable.filter((t) => t.facultyId === user?.id || t.facultyName === user?.name);
  const disruptedCount = timetable.filter((t) => t.isDisrupted).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'FACULTY', path: '/app/faculty/home' }, { label: 'MY TIMETABLE' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Academic Schedule &amp; Classrooms
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Weekly lecture hall bookings synced directly with campus timetable database.
            {mySessions.length > 0 && (
              <span className="ml-2 text-brandLime font-mono text-xs">
                ({mySessions.length} session{mySessions.length > 1 ? 's' : ''} in your portfolio)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchTimetable}
            className="p-2 bg-[#1C1C1C] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-brandCream rounded-xl transition-colors font-mono text-xs flex items-center gap-1.5"
            title="Refresh Timetable"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Sync</span>
          </button>
          <Link
            to="/app/faculty/rooms"
            className="px-4 py-2 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28]"
          >
            Check Relocation Passes
          </Link>
        </div>
      </div>

      {/* Disruption Alert if any */}
      {disruptedCount > 0 && (
        <div className="p-4 bg-red-950/60 border border-red-700/80 rounded-2xl text-red-200 font-mono text-xs flex items-center justify-between gap-3 shadow-[4px_4px_0px_#0A0A0A]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-red-400 animate-pulse">warning</span>
            <span>
              <strong>ATTENTION:</strong> {disruptedCount} classroom timetable slot(s) currently affected by active infrastructure outages. Relocation passes available.
            </span>
          </div>
          <Link
            to="/app/faculty/rooms"
            className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white font-mono text-[10px] font-bold uppercase rounded"
          >
            View Passes →
          </Link>
        </div>
      )}

      {/* Day Navigation Filters */}
      <div className="flex flex-wrap gap-2 font-mono text-xs">
        {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
              selectedDay === day
                ? 'bg-brandLime text-brandDark border-brandLime shadow-[2px_2px_0px_#0A0A0A]'
                : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:text-brandCream'
            }`}
          >
            {day === 'ALL' ? 'ALL DAYS' : day.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto font-mono text-xs text-neutral-400 self-center">
          Showing <span className="text-brandLime font-bold">{filtered.length}</span> scheduled sessions
        </div>
      </div>

      {/* Timetable Table */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400 space-y-2">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Syncing live timetable matrix from campus database...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-xs font-mono text-red-400 space-y-3">
            <span className="material-symbols-outlined text-3xl">error</span>
            <p>{error}</p>
            <button
              onClick={fetchTimetable}
              className="px-4 py-2 bg-brandLime text-brandDark font-bold rounded-lg uppercase"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-500">
            No scheduled classes found for &quot;{selectedDay}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Day &amp; Time</th>
                  <th className="py-3 px-4">Course &amp; Subject</th>
                  <th className="py-3 px-4">Faculty In-Charge</th>
                  <th className="py-3 px-4">Assigned Room</th>
                  <th className="py-3 px-4">Room Capacity</th>
                  <th className="py-3 px-4">Hall Health</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                      {row.dayOfWeek} • {row.timeSlot}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brandCream">
                      {row.purpose}
                      <span className="block font-mono text-[10px] text-neutral-500 font-normal">
                        {row.departmentName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {row.facultyName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      <span className="font-bold text-brandCream">{row.roomCode}</span>
                      <span className="text-[10px] text-neutral-500 block">
                        {row.buildingName} ({row.buildingCode})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">
                      {row.capacity} Seats
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {row.isDisrupted ? (
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700/60 font-mono text-[10px] font-bold uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                          Outage Disruption
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] font-bold uppercase">
                          Operational
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {row.isDisrupted ? (
                        <Link
                          to="/app/faculty/rooms"
                          className="px-3 py-1 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded hover:bg-[#b0dc28]"
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
        )}
      </div>
    </div>
  );
};
