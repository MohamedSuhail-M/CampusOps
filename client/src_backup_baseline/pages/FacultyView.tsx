import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import {
  Calendar,
  AlertTriangle,
  Send,
  Info,
} from 'lucide-react';

export const FacultyView: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [outages, setOutages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaintText, setComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);

  const fetchScheduleAndOutages = async () => {
    setLoading(true);
    try {
      const bookingsRes = await apiFetch('/api/rooms/conflicts?roomId=RM-B-204&targetDate=2026-11-03');

      if (bookingsRes.success) {
        setBookings(bookingsRes.data?.impactedBookings || []);
        setOutages(bookingsRes.data?.activeOutages || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleAndOutages();
  }, []);

  const handleQuickReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setSubmitting(true);
    setComplaintSuccess(null);

    const res = await apiFetch('/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ message: complaintText }),
    });

    if (res.success) {
      setComplaintSuccess(`Report submitted. Reference: ${res.data.incident.reference}`);
      setComplaintText('');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cream tracking-tight">Faculty Dashboard</h1>
        <p className="text-sm text-neutral-400">
          Monitor classroom bookings, view emergency room relocation notices, and report facility issues.
        </p>
      </div>

      {/* Relocation / Outage Alert Notice Banner */}
      {outages.length > 0 && (
        <div className="bg-warning/15 border-2 border-warning/50 rounded-xl p-5 shadow-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-warning uppercase tracking-wide">
                Active Classroom Outage Advisory
              </h2>
              <p className="mt-1 text-xs text-cream leading-relaxed">
                Emergency electrical shutdown declared in classroom <strong className="text-lime">RM-B-204</strong> on November 3, 2026.
                Department Manager has authorized relocation of scheduled CSAI Semester Examination to alternative hall <strong className="text-lime">RM-B-206 (Capacity: 80, Seminar Hall)</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Scheduled Lectures & Exams */}
        <div className="lg:col-span-8 bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-charcoal-700 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-lime" />
              <h2 className="font-bold text-cream text-base">Classroom Timetable & Booking Impact</h2>
            </div>
            <button onClick={fetchScheduleAndOutages} className="text-xs text-lime hover:underline">
              Refresh Schedule
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-neutral-400">Loading schedule...</div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-charcoal-800 border border-charcoal-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cream text-sm">{b.purpose}</span>
                      <span className="bg-lime/20 text-lime border border-lime/30 text-[10px] font-bold px-2 py-0.5 rounded">
                        {b.id}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 flex items-center gap-3">
                      <span>Room: <strong className="text-cream">{b.roomId}</strong></span>
                      <span>·</span>
                      <span>{new Date(b.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-charcoal-700 text-neutral-300 border border-charcoal-600">
                      Status: {b.status}
                    </span>
                  </div>
                </div>
              ))}

              <div className="bg-charcoal-800/40 border border-charcoal-700 rounded-lg p-4 text-xs text-neutral-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Relocation Rule:</strong> Room changes require authorized approval by Department Manager (Dr. Suresh Balan) or Facilities Admin. Faculty are alerted automatically upon approval.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Faculty Maintenance Submission */}
        <div className="lg:col-span-4 bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 border-b border-charcoal-700 pb-3">
            <Send className="w-5 h-5 text-lime" />
            <h2 className="font-bold text-cream text-base">Quick Facility Report</h2>
          </div>

          {complaintSuccess && (
            <div className="mb-4 bg-lime/10 border border-lime/30 text-lime text-xs rounded-lg p-3">
              {complaintSuccess}
            </div>
          )}

          <form onSubmit={handleQuickReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Classroom or Lab Malfunction
              </label>
              <textarea
                required
                rows={5}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe equipment malfunction or teaching disruption (e.g., projector lamp flicker in Room 206)..."
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-3 text-xs text-cream focus:outline-none focus:border-lime"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-lime hover:bg-lime-hover text-obsidian font-bold py-2.5 rounded-lg text-xs transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Send Urgent Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
