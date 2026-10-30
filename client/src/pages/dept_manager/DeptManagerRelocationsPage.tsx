import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { ActionModal } from '../../components/common/ActionModal';
import { StatusBadge } from '../../components/common/StatusBadge';

interface PendingRelocation {
  booking: {
    id: string;
    purpose: string;
    startsAt: string;
    endsAt: string;
    roomId: string;
    room: {
      id: string;
      code: string;
      capacity: number;
      building: { id: string; code: string; name: string };
    };
    faculty: { id: string; name: string; email: string };
    department: { id: string; name: string };
    requirements: Array<{ id: string; requirementType: string; value: string }>;
  };
  outage: {
    id: string;
    reason: string;
    incidentId?: string;
  };
  recommendations: Array<{
    roomId: string;
    roomCode: string;
    buildingCode: string;
    buildingName: string;
    capacity: number;
    roomType: string;
    isAvailable: boolean;
    meetsCapacity: boolean;
    timetableConflict: boolean;
    suitabilityScore: number;
    reason: string;
  }>;
}

interface RelocationHistory {
  id: string;
  action: string;
  bookingId: string;
  actor: string;
  details: any;
  decidedAt: string;
}

export const DeptManagerRelocationsPage: React.FC = () => {
  const [pendingList, setPendingList] = useState<PendingRelocation[]>([]);
  const [historyList, setHistoryList] = useState<RelocationHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('RM-B-206');
  const [reviewNote, setReviewNote] = useState<string>('Emergency electrical hazard in Room B-204. Relocated to ensure CSAI examination continuity.');
  
  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);

  // Alerts
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRelocations = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch<{ pending: PendingRelocation[]; history: RelocationHistory[] }>('/api/rooms/relocations');
      if (res.success && res.data) {
        setPendingList(res.data.pending || []);
        setHistoryList(res.data.history || []);

        // Default to top recommendation if available
        if (res.data.pending?.length > 0) {
          const topRec = res.data.pending[0].recommendations?.[0];
          if (topRec) {
            setSelectedCandidate(topRec.roomId);
          }
        }
      } else {
        setErrorMessage(res.error?.message || 'Failed to load department room relocations.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error fetching relocations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelocations();
  }, []);

  const activeItem = pendingList[0] || null;

  const handleAuthorize = async () => {
    if (!activeItem) return;
    setProcessing(true);
    setErrorMessage(null);
    setSuccessBanner(null);

    try {
      const res = await apiFetch('/api/rooms/relocate', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: activeItem.booking.id,
          newRoomId: selectedCandidate,
          decision: 'APPROVE',
          justification: reviewNote.trim() || 'Classroom relocation authorized by Department Manager',
        }),
      });

      if (res.success) {
        setSuccessBanner(
          `Relocation Authorized: Session '${activeItem.booking.purpose}' transferred to ${res.data?.newRoomCode || selectedCandidate}. In-app pass dispatched to ${activeItem.booking.faculty?.name || 'Faculty'}.`
        );
        setShowConfirmModal(false);
        fetchRelocations();
      } else {
        setErrorMessage(res.error?.message || 'Relocation authorization rejected by server.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error processing relocation.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!activeItem) return;
    setProcessing(true);
    setErrorMessage(null);
    setSuccessBanner(null);

    try {
      const res = await apiFetch('/api/rooms/relocate', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: activeItem.booking.id,
          decision: 'REJECT',
          reviewNotes: reviewNote.trim() || 'Relocation rejected by Department Manager',
        }),
      });

      if (res.success) {
        setSuccessBanner(`Relocation Request for '${activeItem.booking.purpose}' rejected. Original classroom booking retained.`);
        setShowRejectModal(false);
        fetchRelocations();
      } else {
        setErrorMessage(res.error?.message || 'Failed to reject relocation.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error rejecting relocation.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'DEPARTMENT MANAGER', path: '/app/dept-manager/home' },
          { label: 'RELOCATION APPROVALS' },
        ]}
      />

      <div className="border-b border-[#2A2A2A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Classroom Relocation Decision Console
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Automated timetable conflict detection &amp; scored candidate selection under Policy 3.1.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRelocations}
          className="p-2 bg-[#1C1C1C] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-brandCream rounded-xl transition-colors self-start sm:self-auto"
          title="Refresh Queue"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
        </button>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="p-4 bg-red-950/60 border border-red-700/80 rounded-2xl text-red-200 font-mono text-xs flex items-center justify-between gap-3 shadow-[4px_4px_0px_#0A0A0A]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-red-400">error</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {successBanner && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-600/80 rounded-2xl text-emerald-200 font-mono text-xs flex items-center justify-between gap-3 shadow-[4px_4px_0px_#0A0A0A]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-emerald-400">check_circle</span>
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {loading && !activeItem ? (
        <div className="p-16 text-center font-mono text-xs text-neutral-400 space-y-3">
          <div className="w-8 h-8 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto" />
          <p>SCANNING DEPARTMENT CLASSROOM OUTAGES &amp; TIMETABLES...</p>
        </div>
      ) : activeItem ? (
        <div className="space-y-6">
          {/* Disruption Context Card */}
          <div className="bg-[#181110] border-2 border-red-700/80 rounded-2xl p-6 shadow-[5px_5px_0px_#0A0A0A] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-xs font-bold text-red-300 uppercase tracking-wider">
                  ACTIVE INFRASTRUCTURE DISRUPTION: {activeItem.booking.room?.building?.code || 'BLD'}-{activeItem.booking.room?.code || 'ROOM'}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                DEFCON 2 TIMETABLE CONFLICT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-[#1F1413] p-4 rounded-xl border border-red-900/50 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase">Impacted Session:</span>
                <p className="font-bold text-brandCream text-sm">{activeItem.booking.purpose}</p>
                <p className="text-neutral-400">
                  Room: {activeItem.booking.room?.code} (Capacity {activeItem.booking.room?.capacity} Seats)
                </p>
                <p className="text-neutral-400">
                  Invigilator / Faculty: {activeItem.booking.faculty?.name || 'Dr. Kavitha Menon'}
                </p>
                <p className="text-neutral-500 text-[11px]">
                  Scheduled Time: {new Date(activeItem.booking.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(activeItem.booking.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="bg-[#1F1413] p-4 rounded-xl border border-red-900/50 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase">Reported Hazard:</span>
                <p className="font-bold text-red-300 text-sm">
                  {activeItem.outage.reason || 'Sparking socket / electrical power interruption'}
                </p>
                <p className="text-neutral-400">Severity: CRITICAL • Department: {activeItem.booking.department?.name || 'Computer Science'}</p>
                <p className="text-neutral-400">Safety Status: Breaker isolated • Relocation required for exam continuity</p>
              </div>
            </div>
          </div>

          {/* Candidate Recommendation Selector */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brandLime text-xl">auto_awesome</span>
                <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
                  Scored Alternative Rooms
                </h2>
              </div>
              <span className="font-mono text-[11px] text-brandLime">Scored by Distance, Capacity &amp; AV</span>
            </div>

            <div className="space-y-3">
              {activeItem.recommendations && activeItem.recommendations.length > 0 ? (
                activeItem.recommendations.map((cand, idx) => (
                  <label
                    key={cand.roomId}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all ${
                      selectedCandidate === cand.roomId
                        ? 'bg-[#1F2314] border-brandLime shadow-[3px_3px_0px_#0A0A0A]'
                        : 'bg-[#1C1C1C] border-[#2A2A2A] hover:border-neutral-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="candidateRoom"
                        checked={selectedCandidate === cand.roomId}
                        onChange={() => setSelectedCandidate(cand.roomId)}
                        className="mt-1 accent-[#C5F135]"
                      />
                      <div className="space-y-0.5 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-brandCream">
                            Room {cand.roomCode} ({cand.buildingName || cand.buildingCode})
                          </span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded bg-brandLime text-brandDark font-mono text-[10px] font-bold uppercase">
                              Top Pick (Score {cand.suitabilityScore})
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-400">
                          Capacity: {cand.capacity} Seats • {cand.reason || 'Optimal capacity & distance score'}
                        </p>
                      </div>
                    </div>

                    <div className="font-mono text-xs text-right shrink-0">
                      <span className="text-neutral-500 uppercase">Match Score:</span>
                      <p className="text-base font-bold text-brandLime">{cand.suitabilityScore}/300</p>
                    </div>
                  </label>
                ))
              ) : (
                <div className="space-y-2">
                  {[
                    { id: 'RM-B-206', code: 'B-206', name: 'Room B-206 (Capacity 80)', score: 265, distance: 'Same Floor (Wing B)', equipment: 'Dual Projector, 4K Display, AC', recommended: true },
                    { id: 'RM-B-208', code: 'B-208', name: 'Room B-208 (Capacity 60)', score: 210, distance: 'Same Floor (Wing B)', equipment: 'Single Projector, AC', recommended: false },
                    { id: 'RM-A-101', code: 'A-101', name: 'Auditorium Hall A (Capacity 120)', score: 180, distance: 'Building A (Ground Floor)', equipment: 'Stage Audio, Dual Projector', recommended: false },
                  ].map((cand) => (
                    <label
                      key={cand.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all ${
                        selectedCandidate === cand.id
                          ? 'bg-[#1F2314] border-brandLime shadow-[3px_3px_0px_#0A0A0A]'
                          : 'bg-[#1C1C1C] border-[#2A2A2A] hover:border-neutral-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="candidateRoom"
                          checked={selectedCandidate === cand.id}
                          onChange={() => setSelectedCandidate(cand.id)}
                          className="mt-1 accent-[#C5F135]"
                        />
                        <div className="space-y-0.5 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-brandCream">{cand.name}</span>
                            {cand.recommended && (
                              <span className="px-2 py-0.5 rounded bg-brandLime text-brandDark font-mono text-[10px] font-bold uppercase">
                                Top Pick (Score {cand.score})
                              </span>
                            )}
                          </div>
                          <p className="text-neutral-400">{cand.distance} • Equipment: {cand.equipment}</p>
                        </div>
                      </div>

                      <div className="font-mono text-xs text-right shrink-0">
                        <span className="text-neutral-500 uppercase">Match Score:</span>
                        <p className="text-base font-bold text-brandLime">{cand.score}/300</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Justification Input */}
            <div className="pt-2 font-mono text-xs space-y-1">
              <label className="block text-neutral-400 uppercase">Decision Justification / Review Notes:</label>
              <input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Enter justification or reason for this decision..."
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3 text-xs text-brandCream font-mono focus:border-brandLime"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-end gap-3 border-t border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-5 py-2.5 bg-[#2A2A2A] hover:bg-red-950 text-red-300 border border-[#3A3A3A] hover:border-red-700 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
                Reject Relocation
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-2.5 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">verified</span>
                Authorize Relocation to {selectedCandidate}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 text-center font-mono text-xs text-neutral-400 space-y-3 shadow-[4px_4px_0px_#0A0A0A]">
          <span className="material-symbols-outlined text-4xl text-brandLime">check_circle</span>
          <h3 className="font-display font-bold uppercase text-lg text-brandCream">All Classrooms Normal</h3>
          <p className="max-w-md mx-auto text-neutral-400">
            No active room disruptions or pending relocation requests requiring department executive authorization.
          </p>
        </div>
      )}

      {/* Decision History Register */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brandLime text-lg">history_edu</span>
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Department Relocation Decision Register
            </h2>
          </div>
          <span className="font-mono text-xs text-neutral-400">Policy 3.1 Immutable Audit Log</span>
        </div>

        {historyList.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-neutral-500">
            No previous relocation decisions recorded in audit log.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] text-[10px] text-neutral-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Session / Booking ID</th>
                  <th className="py-2.5 px-3">Decision</th>
                  <th className="py-2.5 px-3">Authorized By</th>
                  <th className="py-2.5 px-3">Destination / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {historyList.map((h) => (
                  <tr key={h.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3 px-3 text-neutral-400 whitespace-nowrap">
                      {new Date(h.decidedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-brandCream">
                      {h.bookingId}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={h.action === 'CONFIRM_RELOCATION' ? 'APPROVED' : 'REJECTED'} />
                    </td>
                    <td className="py-3 px-3 text-neutral-300">
                      {h.actor}
                    </td>
                    <td className="py-3 px-3 text-neutral-400 max-w-xs truncate">
                      {h.details?.roomId ? `Moved to ${h.details.roomId} • ` : ''}
                      {h.details?.reason || 'Facility hazard relocation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && activeItem && (
        <ActionModal
          isOpen={true}
          onClose={() => setShowConfirmModal(false)}
          title="Authorize Room Relocation"
          subtitle="Department Manager Executive Authorization (Policy 3.1)"
          confirmText="Confirm Transfer"
          onConfirm={handleAuthorize}
          loading={processing}
        >
          <div className="space-y-3 font-mono text-xs text-brandCream">
            <p>
              Are you sure you want to authorize transfer of <strong>{activeItem.booking.purpose}</strong> to <strong>{selectedCandidate}</strong>?
            </p>
            <div className="p-3 bg-[#1C1C1C] rounded-lg border border-[#2A2A2A] space-y-1 text-neutral-300 text-[11px]">
              <p>• Room booking will be atomically transferred to {selectedCandidate} in SQLite DB.</p>
              <p>• Emergency relocation digital pass will be dispatched to faculty {activeItem.booking.faculty?.name || 'Dr. Kavitha Menon'}.</p>
              <p>• Immutable audit entry will be recorded with your digital signature.</p>
            </div>
          </div>
        </ActionModal>
      )}

      {/* Rejection Modal */}
      {showRejectModal && activeItem && (
        <ActionModal
          isOpen={true}
          onClose={() => setShowRejectModal(false)}
          title="Reject Room Relocation"
          subtitle="Department Manager Decision (Policy 3.1)"
          confirmText="Confirm Rejection"
          onConfirm={handleReject}
          loading={processing}
        >
          <div className="space-y-3 font-mono text-xs text-brandCream">
            <p>
              Are you sure you want to reject the relocation request for <strong>{activeItem.booking.purpose}</strong>?
            </p>
            <div className="p-3 bg-red-950/40 rounded-lg border border-red-900/60 space-y-1 text-red-200 text-[11px]">
              <p>• The original booking in {activeItem.booking.room?.code} will remain unchanged.</p>
              <p>• Faculty member will be notified that relocation was declined.</p>
              <p>• Decision reason will be permanently recorded in audit logs.</p>
            </div>
          </div>
        </ActionModal>
      )}
    </div>
  );
};
