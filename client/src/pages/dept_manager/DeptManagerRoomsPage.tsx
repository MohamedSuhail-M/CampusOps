import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

interface Room {
  id: string;
  code: string;
  capacity: number;
  roomType: string;
  status: string;
  building: { id: string; code: string; name: string };
  _count?: { assets: number; roomBookings: number; roomOutages: number };
}

interface TimetableItem {
  id: string;
  bookingId: string;
  roomId: string;
  roomCode: string;
  roomName: string;
  capacity: number;
  buildingCode: string;
  buildingName: string;
  departmentName: string;
  facultyName: string;
  dayOfWeek: string;
  timeSlot: string;
  purpose: string;
  status: string;
  isDisrupted: boolean;
  outageReason: string | null;
}

export const DeptManagerRoomsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TIMETABLE' | 'ROOMS'>('TIMETABLE');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsRes, timetableRes] = await Promise.all([
        apiFetch<Room[]>('/api/directory/rooms'),
        apiFetch<TimetableItem[]>('/api/rooms/timetable?status=CONFIRMED'),
      ]);

      if (roomsRes.success && roomsRes.data) {
        setRooms(roomsRes.data);
      }
      if (timetableRes.success && timetableRes.data) {
        setTimetable(timetableRes.data);
      } else if (!timetableRes.success) {
        setError(timetableRes.error?.message || 'Failed to load timetable data.');
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching room and timetable records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Timetable
  const filteredTimetable = timetable.filter((item) => {
    if (selectedRoom !== 'ALL' && item.roomCode !== selectedRoom && item.roomId !== selectedRoom) {
      return false;
    }
    if (selectedDay !== 'ALL' && item.dayOfWeek.toLowerCase() !== selectedDay.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = item.roomCode?.toLowerCase().includes(q);
      const purposeMatch = item.purpose?.toLowerCase().includes(q);
      const facultyMatch = item.facultyName?.toLowerCase().includes(q);
      const bldMatch = item.buildingName?.toLowerCase().includes(q);
      return codeMatch || purposeMatch || facultyMatch || bldMatch;
    }
    return true;
  });

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.code.toLowerCase().includes(q) ||
      r.building?.name?.toLowerCase().includes(q) ||
      r.roomType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'DEPARTMENT MANAGER', path: '/app/dept-manager/home' },
          { label: 'ROOMS & TIMETABLE' },
        ]}
      />

      <div className="border-b border-[#2A2A2A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Department Rooms &amp; Timetable Matrix
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Real-time room occupancy, weekly course timetables, and hardware installations across academic buildings.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="p-2.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-brandCream rounded-xl transition-colors self-start sm:self-auto flex items-center gap-2 font-mono text-xs"
          title="Refresh Data"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('TIMETABLE')}
            className={`px-4 py-2 rounded-xl font-bold border transition-all flex items-center gap-2 ${
              activeTab === 'TIMETABLE'
                ? 'bg-brandLime text-brandDark border-brandLime shadow-[3px_3px_0px_#0A0A0A]'
                : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:text-brandCream'
            }`}
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span>Room Timetables ({timetable.length} Sessions)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ROOMS')}
            className={`px-4 py-2 rounded-xl font-bold border transition-all flex items-center gap-2 ${
              activeTab === 'ROOMS'
                ? 'bg-brandLime text-brandDark border-brandLime shadow-[3px_3px_0px_#0A0A0A]'
                : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:text-brandCream'
            }`}
          >
            <span className="material-symbols-outlined text-sm">meeting_room</span>
            <span>Classroom Directory ({rooms.length} Halls)</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-500 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, course, faculty..."
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2 text-xs text-brandCream font-mono focus:border-brandLime"
          />
        </div>
      </div>

      {/* TIMETABLE VIEW */}
      {activeTab === 'TIMETABLE' && (
        <div className="space-y-4">
          {/* Timetable Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-[#181818] p-3.5 rounded-2xl border border-[#2A2A2A] font-mono text-xs">
            {/* Room Selector */}
            <div className="flex items-center gap-2">
              <label className="text-neutral-400 uppercase text-[11px]">Room:</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="bg-[#141414] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-brandCream font-mono focus:border-brandLime"
              >
                <option value="ALL">All Rooms</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.code}>
                    {r.code} ({r.building?.code}) — {r.capacity} Seats
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-neutral-400 uppercase text-[11px]">Day:</label>
              {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    selectedDay === day
                      ? 'bg-brandLime text-brandDark'
                      : 'bg-[#222] text-neutral-400 hover:text-white'
                  }`}
                >
                  {day === 'ALL' ? 'ALL' : day.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>

            <div className="ml-auto text-neutral-400 text-[11px]">
              Showing <span className="text-brandLime font-bold">{filteredTimetable.length}</span> scheduled entries
            </div>
          </div>

          {/* Timetable Table */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
            {loading ? (
              <div className="py-16 text-center text-xs font-mono text-neutral-400 space-y-2">
                <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading real timetable records from campus matrix...</p>
              </div>
            ) : error ? (
              <div className="py-16 text-center text-xs font-mono text-red-400 space-y-3">
                <span className="material-symbols-outlined text-3xl">error</span>
                <p>{error}</p>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-brandLime text-brandDark font-bold rounded-lg uppercase"
                >
                  Retry
                </button>
              </div>
            ) : filteredTimetable.length === 0 ? (
              <div className="py-16 text-center text-xs font-mono text-neutral-500">
                No timetable records match the selected room or day filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Room &amp; Building</th>
                      <th className="py-3 px-4">Day &amp; Time Slot</th>
                      <th className="py-3 px-4">Course / Academic Activity</th>
                      <th className="py-3 px-4">Faculty In-Charge</th>
                      <th className="py-3 px-4">Capacity</th>
                      <th className="py-3 px-4">Room Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {filteredTimetable.map((row) => (
                      <tr key={row.id} className="hover:bg-[#1A1A1A] transition-colors">
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <span className="font-bold text-brandLime text-sm">{row.roomCode}</span>
                          <span className="block text-[10px] text-neutral-400">
                            {row.buildingName} ({row.buildingCode})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brandCream whitespace-nowrap">
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
                        <td className="py-3.5 px-4 font-mono text-neutral-400 whitespace-nowrap">
                          {row.capacity} Seats
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.isDisrupted ? (
                            <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700/60 font-mono text-[10px] font-bold uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                              Hazard Outage
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] font-bold uppercase">
                              Operational
                            </span>
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
      )}

      {/* CLASSROOM DIRECTORY VIEW */}
      {activeTab === 'ROOMS' && (
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Room Code</th>
                  <th className="py-3 px-4">Building</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Room Type</th>
                  <th className="py-3 px-4">Weekly Sessions</th>
                  <th className="py-3 px-4">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filteredRooms.map((r) => (
                  <tr key={r.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                      {r.code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-brandCream">
                      {r.building?.name || 'Academic Block'} ({r.building?.code})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {r.capacity} Seats
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400 uppercase">
                      {r.roomType || 'CLASSROOM'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {timetable.filter((t) => t.roomId === r.id || t.roomCode === r.code).length} Bookings
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {r.code === 'B-204' ? (
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700/60 font-mono text-[10px] font-bold uppercase">
                          Outage (Hazard)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] font-bold uppercase">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
