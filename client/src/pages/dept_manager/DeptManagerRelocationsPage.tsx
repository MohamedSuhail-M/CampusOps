import React, { useState } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { ActionModal } from '../../components/common/ActionModal';

export const DeptManagerRelocationsPage: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>('RM-B-206');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [relocated, setRelocated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const candidates = [
    { id: 'RM-B-206', name: 'Room B-206 (Capacity 80)', score: 265, distance: 'Same Floor (Wing B)', equipment: 'Dual Projector, 4K Display, AC', recommended: true },
    { id: 'RM-B-208', name: 'Room B-208 (Capacity 60)', score: 210, distance: 'Same Floor (Wing B)', equipment: 'Single Projector, AC', recommended: false },
    { id: 'RM-A-101', name: 'Auditorium Hall A (Capacity 120)', score: 180, distance: 'Building A (Ground Floor)', equipment: 'Stage Audio, Dual Projector', recommended: false },
  ];

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/rooms/relocate', {
        method: 'POST',
        body: JSON.stringify({
          fromRoomId: 'RM-B-204',
          toRoomId: selectedCandidate,
          reason: 'Electrical socket sparking hazard reported before CS301 examination',
        }),
      });
      if (res.success) {
        setRelocated(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'DEPARTMENT MANAGER', path: '/app/dept-manager/home' }, { label: 'RELOCATION APPROVALS' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Classroom Relocation Decision Console
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Automated timetable conflict detection &amp; scored candidate selection under Policy 3.1.
        </p>
      </div>

      {/* Disruption Context Card */}
      <div className="bg-[#181110] border-2 border-red-700/80 rounded-2xl p-6 shadow-[5px_5px_0px_#0A0A0A] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs font-bold text-red-300 uppercase tracking-wider">
              ACTIVE DISRUPTION: ROOM B-204
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold uppercase">
            DEFCON 2 EXAM CONFLICT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-[#1F1413] p-4 rounded-xl border border-red-900/50 space-y-1">
            <span className="text-[10px] text-neutral-400 uppercase">Impacted Session:</span>
            <p className="font-bold text-brandCream text-sm">CS301 Semester Examination</p>
            <p className="text-neutral-400">Scheduled: 09:00 - 12:00 • 60 Candidates</p>
            <p className="text-neutral-400">Invigilator: Dr. Kavitha Menon (Faculty)</p>
          </div>

          <div className="bg-[#1F1413] p-4 rounded-xl border border-red-900/50 space-y-1">
            <span className="text-[10px] text-neutral-400 uppercase">Reported Hazard:</span>
            <p className="font-bold text-red-300 text-sm">Wall Socket Sparking (AST031)</p>
            <p className="text-neutral-400">Incident #INC-2026-001 • Severity: CRITICAL</p>
            <p className="text-neutral-400">Safety Status: Breaker panel tripped by triage</p>
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
          {candidates.map((cand) => (
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
                        AI Recommended (Score {cand.score})
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

        {relocated ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-xl space-y-2 font-mono text-xs text-emerald-300">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>Relocation Successfully Executed &amp; Recorded in Audit Log!</span>
            </div>
            <p>
              Room booking for CS301 examination transferred from <strong>RM-B-204</strong> to <strong>{selectedCandidate}</strong>.
            </p>
            <p className="text-[11px] text-neutral-400">
              Dispatched digital pass to Faculty Dr. Kavitha Menon and published notice to Student Portal.
            </p>
          </div>
        ) : (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-6 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              Authorize Relocation to {selectedCandidate}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ActionModal
          isOpen={true}
          onClose={() => setShowConfirmModal(false)}
          title={`Authorize Room Relocation`}
          subtitle="Department Manager Executive Authorization (Policy 3.1)"
          confirmText="Confirm Transfer"
          onConfirm={handleAuthorize}
          loading={loading}
        >
          <div className="space-y-3 font-mono text-xs text-brandCream">
            <p>
              Are you sure you want to transfer the CS301 Semester Exam from <strong>RM-B-204</strong> to <strong>{selectedCandidate}</strong>?
            </p>
            <div className="p-3 bg-[#1C1C1C] rounded-lg border border-[#2A2A2A] space-y-1 text-neutral-300 text-[11px]">
              <p>• Room B-206 booking will be created in SQLite database.</p>
              <p>• Emergency relocation pass will be issued to invigilators.</p>
              <p>• Electrical technician Manoj Kumar will isolate Room B-204.</p>
            </div>
          </div>
        </ActionModal>
      )}
    </div>
  );
};
