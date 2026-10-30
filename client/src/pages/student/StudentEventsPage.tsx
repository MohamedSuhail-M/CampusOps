import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';

interface Building {
  id: string;
  code: string;
  name: string;
}

interface Room {
  id: string;
  code: string;
  buildingId: string;
  capacity: number;
}

export const StudentEventsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('16:00');
  const [expectedAttendance, setExpectedAttendance] = useState<number>(45);
  const [category, setCategory] = useState<string>('CLUB_EVENT');
  const [equipment, setEquipment] = useState<string>('Projector, PA System, 50 Chairs');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      const [reqRes, bldRes] = await Promise.all([
        apiFetch<any[]>('/api/rooms/facility-requests'),
        apiFetch<Building[]>('/api/directory/buildings'),
      ]);
      if (reqRes.success && reqRes.data) setRequests(reqRes.data);
      if (bldRes.success && bldRes.data) {
        setBuildings(bldRes.data);
        if (bldRes.data.length > 0) {
          setSelectedBuildingId(bldRes.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) {
      setRooms([]);
      return;
    }
    setLoadingRooms(true);
    apiFetch<Room[]>(`/api/directory/rooms?buildingId=${selectedBuildingId}`)
      .then((res) => {
        if (res.success && res.data) {
          setRooms(res.data);
          if (res.data.length > 0) {
            setSelectedRoomId(res.data[0].id);
          }
        }
      })
      .finally(() => setLoadingRooms(false));
  }, [selectedBuildingId]);

  const selectedRoomObj = rooms.find((r) => r.id === selectedRoomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiFetch<any>('/api/rooms/facility-requests', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          buildingId: selectedBuildingId,
          roomId: selectedRoomId,
          eventDate,
          startTime,
          endTime,
          expectedAttendance: Number(expectedAttendance),
          category,
          equipmentRequirements: equipment,
          notes,
        }),
      });

      if (res.success) {
        setSuccessMsg(`Event request submitted successfully! Tracking ID: ${res.data?.id}`);
        setTitle('');
        setDescription('');
        setNotes('');
        // Refresh list
        const refreshed = await apiFetch<any[]>('/api/rooms/facility-requests');
        if (refreshed.success && refreshed.data) setRequests(refreshed.data);
      } else {
        setErrorMsg(res.error?.message || 'Failed to submit event request.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'STUDENT', path: '/app/student/home' },
          { label: 'EVENT & FACILITY REQUESTS' },
        ]}
      />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Campus Event &amp; Facility Booking Desk
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Request student club events, seminars, or workshops in campus auditoriums and seminar halls with automated availability checks and Facilities Admin approval.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Request Form (5 cols) */}
        <div className="lg:col-span-5 bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-3">
            <span className="material-symbols-outlined text-brandLime text-lg">celebration</span>
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Submit Facility Request
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-neutral-400 uppercase mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI & Robotics Club Annual Workshop"
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2 text-xs text-brandCream font-mono focus:border-brandLime"
                >
                  <option value="CLUB_EVENT">Club Activity</option>
                  <option value="ACADEMIC_SEMINAR">Academic Seminar</option>
                  <option value="WORKSHOP">Technical Workshop</option>
                  <option value="CULTURAL_FEST">Cultural Event</option>
                  <option value="HACKATHON">Hackathon / Competition</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 uppercase mb-1">Expected Attendance</label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  required
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(Number(e.target.value))}
                  className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2 text-xs text-brandCream font-mono focus:border-brandLime"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 uppercase mb-1">Campus Building</label>
                <select
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2 text-xs text-brandCream font-mono focus:border-brandLime"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 uppercase mb-1">Requested Room</label>
                <select
                  value={selectedRoomId}
                  disabled={loadingRooms}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2 text-xs text-brandCream font-mono focus:border-brandLime"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.code} (Cap: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRoomObj && expectedAttendance > selectedRoomObj.capacity && (
              <div className="p-2 bg-yellow-950/40 border border-yellow-700/60 rounded text-[11px] text-yellow-300">
                ⚠️ Attendance ({expectedAttendance}) exceeds room capacity ({selectedRoomObj.capacity}). Consider an auditorium hall.
              </div>
            )}

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Event Date</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 uppercase mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2 text-xs text-brandCream font-mono focus:border-brandLime"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase mb-1">End Time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2 text-xs text-brandCream font-mono focus:border-brandLime"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Event Description *</label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief outline of activity, guest speakers, student club goals..."
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Equipment / AV Requirements</label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="Projectors, mics, podium, extra tables..."
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            {successMsg && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-red-950/50 border border-red-700 rounded-lg text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !title || !description}
              className="w-full py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting Request...' : 'Submit Request to Facilities Admin'}
            </button>
          </form>
        </div>

        {/* Right Column: Submitted Requests History (7 cols) */}
        <div className="lg:col-span-7 bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              My Facility Requests ({requests.length})
            </h2>
            <span className="font-mono text-xs text-brandLime font-bold">Facilities Admin Desk</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-neutral-400">
              <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-neutral-500">
              No event or facility requests submitted yet. Complete the form to request room reservations.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl space-y-2 font-mono text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2A2A] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brandLime text-sm">{r.title}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <span className="text-[10px] text-neutral-500">ID: {r.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-300">
                    <div>
                      <span className="text-neutral-500 uppercase">Room:</span> Room {r.room?.code} ({r.room?.building?.name || 'Building'})
                    </div>
                    <div>
                      <span className="text-neutral-500 uppercase">Schedule:</span> {new Date(r.startsAt).toLocaleDateString()} ({new Date(r.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(r.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </div>
                    <div>
                      <span className="text-neutral-500 uppercase">Attendance:</span> {r.expectedAttendance} attendees
                    </div>
                    <div>
                      <span className="text-neutral-500 uppercase">Category:</span> {r.category}
                    </div>
                  </div>

                  <p className="text-neutral-400 text-xs italic bg-[#141414] p-2.5 rounded-lg border border-[#252525]">
                    "{r.description}"
                  </p>

                  {r.status === 'APPROVED' && r.bookingId && (
                    <div className="p-2 bg-emerald-950/40 border border-emerald-700/60 rounded text-[11px] text-emerald-300 flex items-center justify-between">
                      <span>✓ Official Room Booking Confirmed: <strong>{r.bookingId}</strong></span>
                      {r.reviewer && <span>Approved by {r.reviewer.name}</span>}
                    </div>
                  )}

                  {r.status === 'REJECTED' && r.reviewNotes && (
                    <div className="p-2 bg-red-950/40 border border-red-700/60 rounded text-[11px] text-red-300">
                      Declined: {r.reviewNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
