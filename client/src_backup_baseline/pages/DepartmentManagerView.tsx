import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import {
  AlertTriangle,
  DoorOpen,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const DepartmentManagerView: React.FC = () => {
  const [impactedBooking, setImpactedBooking] = useState<any | null>(null);
  const [alternativeRooms, setAlternativeRooms] = useState<any[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<string>('RM-B-206');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  const fetchRelocationDetails = async () => {
    setLoading(true);
    try {
      const conflictRes = await apiFetch('/api/rooms/conflicts?roomId=RM-B-204&targetDate=2026-11-03');
      if (conflictRes.success && conflictRes.data?.impactedBookings?.length > 0) {
        const exam = conflictRes.data.impactedBookings.find((b: any) => b.id === 'BKG-EXAM') || conflictRes.data.impactedBookings[0];
        setImpactedBooking(exam);

        const altRes = await apiFetch(`/api/rooms/alternatives?bookingId=${exam.id}`);
        if (altRes.success) {
          setAlternativeRooms(altRes.data?.alternatives || []);
          if (altRes.data?.alternatives?.length > 0) {
            setSelectedAlternative(altRes.data.alternatives[0].id);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelocationDetails();
  }, []);

  const handleAuthorizeRelocation = async () => {
    if (!impactedBooking || !selectedAlternative) return;
    setAuthorizing(true);
    setActionSuccess(null);

    const res = await apiFetch('/api/rooms/relocate', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: impactedBooking.id,
        newRoomId: selectedAlternative,
        justification: 'Emergency electrical hazard in Room B-204. Relocated to ensure CSAI examination continuity.',
      }),
    });

    if (res.success) {
      setActionSuccess(
        `Relocation AUTHORIZED! Examination booking updated to ${selectedAlternative}. Faculty notification dispatched to Dr. Kavitha Menon (USR017) and audit trail recorded.`
      );
      fetchRelocationDetails();
    } else {
      alert(res.error?.message || 'Relocation authorization failed');
    }
    setAuthorizing(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream tracking-tight">Department Operations & Governance</h1>
          <p className="text-sm text-neutral-400">
            Department manager oversight, academic continuity governance, and statutory relocation authorizations.
          </p>
        </div>
        <button
          onClick={fetchRelocationDetails}
          className="flex items-center gap-2 bg-charcoal-800 hover:bg-charcoal-700 text-cream px-3.5 py-2 rounded-lg text-xs font-semibold border border-charcoal-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-lime" />
          Refresh Status
        </button>
      </div>

      {actionSuccess && (
        <div className="bg-lime/10 border-2 border-lime/40 text-lime text-xs rounded-xl p-4 flex items-start gap-3 shadow-xl">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">Action Successfully Authorized</div>
            <div>{actionSuccess}</div>
          </div>
        </div>
      )}

      {/* Scenario 1 Relocation Authorization Card */}
      <div className="bg-charcoal-900 border-2 border-warning/40 rounded-xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-charcoal-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 border border-warning/30 flex items-center justify-center text-warning">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-cream text-base">
                Scenario 1: Critical Examination Relocation Authorization
              </h2>
              <p className="text-xs text-neutral-400">
                Department Manager approval required for classroom reallocation due to active electrical outage.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-critical/20 text-critical border border-critical/30">
            HIGH IMPACT
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-neutral-400">Loading conflict and alternative models...</div>
        ) : impactedBooking ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Impacted Session */}
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-lg p-5 space-y-3">
              <div className="text-xs font-bold text-critical uppercase tracking-wider flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4" />
                Disrupted Academic Booking
              </div>

              <div>
                <div className="font-bold text-cream text-sm">{impactedBooking.purpose}</div>
                <div className="text-xs text-neutral-400 mt-1">
                  ID: <span className="font-mono text-lime font-bold">{impactedBooking.id}</span>
                </div>
              </div>

              <div className="text-xs text-neutral-300 space-y-1 pt-2 border-t border-charcoal-700">
                <div>Original Room: <strong className="text-critical">{impactedBooking.roomId} (Damaged)</strong></div>
                <div>Faculty In-Charge: <strong>Dr. Kavitha Menon (USR017)</strong></div>
                <div>Scheduled Time: <strong>09:00 AM - 12:00 PM (Nov 3, 2026)</strong></div>
                <div>Required Capacity: <strong>80 Candidates</strong></div>
              </div>
            </div>

            {/* Alternative Candidate Recommendation */}
            <div className="bg-charcoal-800 border border-lime/40 rounded-lg p-5 space-y-3">
              <div className="text-xs font-bold text-lime uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Recommended Alternative Room
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Select Verified Alternative Classroom
                </label>
                <select
                  value={selectedAlternative}
                  onChange={(e) => setSelectedAlternative(e.target.value)}
                  className="w-full bg-charcoal-900 border border-lime/50 rounded-lg p-2.5 text-xs text-cream focus:outline-none"
                >
                  {alternativeRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} - {r.building?.name} (Capacity: {r.capacity}, Type: {r.roomType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-neutral-300 space-y-1 pt-2 border-t border-charcoal-700">
                <div className="flex items-center gap-1 text-lime font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Capacity Matches / Exceeds (80 seats required)</span>
                </div>
                <div className="flex items-center gap-1 text-lime font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AV Projector & Accessibility Validated</span>
                </div>
                <div className="text-neutral-400 text-[11px] pt-1">
                  Authorizing this will update room_bookings, log an immutable audit trail, and dispatch an in-app notice to faculty.
                </div>
              </div>

              <button
                onClick={handleAuthorizeRelocation}
                disabled={authorizing}
                className="w-full mt-3 bg-lime hover:bg-lime-hover text-obsidian font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-lime/20 disabled:opacity-50"
              >
                {authorizing ? 'Authorizing & Alerting...' : 'Authorize Room Relocation'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-neutral-400">
            No active room conflicts requiring department manager authorization.
          </div>
        )}
      </div>
    </div>
  );
};
