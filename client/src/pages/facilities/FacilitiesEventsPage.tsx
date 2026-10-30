import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionModal } from '../../components/common/ActionModal';

export const FacilitiesEventsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await apiFetch<any[]>('/api/rooms/facility-requests');
      if (res.success && res.data) setRequests(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async () => {
    if (!selectedReq || !actionType) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch(`/api/rooms/facility-requests/${selectedReq.id}/decide`, {
        method: 'POST',
        body: JSON.stringify({
          decision: actionType,
          reviewNotes: reviewNotes || (actionType === 'APPROVE' ? 'Approved for campus activity' : 'Administrative conflict'),
        }),
      });

      if (res.success) {
        await fetchRequests();
        setSelectedReq(null);
        setActionType(null);
        setReviewNotes('');
      } else {
        setErrorMsg(res.error?.message || 'Failed to submit decision.');
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
          { label: 'FACILITIES', path: '/app/facilities/triage' },
          { label: 'EVENT & FACILITY REQUESTS REVIEW' },
        ]}
      />

      <div className="border-b border-[#2A2A2A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Student Event &amp; Facility Review Queue
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Review student facility reservation requests. Approving a request atomically creates a confirmed room booking and updates campus schedules.
          </p>
        </div>

        <div className="px-4 py-2 bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl font-mono text-xs text-brandLime self-start sm:self-auto font-bold">
          {requests.filter((r) => r.status === 'PENDING_APPROVAL').length} Pending Requests
        </div>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading event requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-500">
            No event or facility use requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Event Title &amp; Details</th>
                  <th className="py-3 px-4">Room &amp; Building</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#1A1A1A] transition-colors font-mono">
                    <td className="py-3.5 px-4 font-bold text-brandLime whitespace-nowrap">
                      {r.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brandCream">
                      <div>{r.title}</div>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        {r.category} • {r.equipmentRequirements || 'Standard AV'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      Room {r.room?.code} ({r.room?.building?.code})
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap text-[11px]">
                      <div>{new Date(r.startsAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-neutral-500">
                        {new Date(r.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(r.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      {r.expectedAttendance} attendees
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">
                      {r.requester?.name || 'Student'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {r.status === 'PENDING_APPROVAL' ? (
                        <div className="flex justify-end gap-2 font-mono text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReq(r);
                              setActionType('APPROVE');
                            }}
                            className="px-3 py-1 bg-brandLime text-brandDark font-bold rounded shadow hover:bg-[#b0dc28]"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReq(r);
                              setActionType('REJECT');
                            }}
                            className="px-3 py-1 bg-red-950 text-red-300 border border-red-700/60 font-bold rounded hover:bg-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-neutral-500 uppercase text-[10px]">
                          {r.status === 'APPROVED' ? `Booking: ${r.bookingId || 'Confirmed'}` : 'Declined'}
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

      {/* Review Action Modal */}
      {selectedReq && actionType && (
        <ActionModal
          isOpen={true}
          onClose={() => {
            setSelectedReq(null);
            setActionType(null);
            setErrorMsg(null);
          }}
          title={`${actionType === 'APPROVE' ? 'Approve' : 'Reject'} Facility Request #${selectedReq.id}`}
          subtitle={`Event: "${selectedReq.title}" by ${selectedReq.requester?.name || 'Student'}`}
          confirmText={actionType === 'APPROVE' ? 'Authorize & Reserve Room' : 'Confirm Rejection'}
          onConfirm={handleDecision}
          loading={submitting}
        >
          <div className="space-y-3 font-mono text-xs text-brandCream">
            <div className="p-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl space-y-1 text-[11px]">
              <p>
                <span className="text-neutral-500 uppercase">Room:</span> Room {selectedReq.room?.code} ({selectedReq.room?.building?.name || 'Building'})
              </p>
              <p>
                <span className="text-neutral-500 uppercase">Schedule:</span> {new Date(selectedReq.startsAt).toLocaleDateString()} ({new Date(selectedReq.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedReq.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </p>
              <p>
                <span className="text-neutral-500 uppercase">Attendance:</span> {selectedReq.expectedAttendance} attendees (Room Capacity: {selectedReq.room?.capacity || 'N/A'})
              </p>
              <p>
                <span className="text-neutral-500 uppercase">Equipment:</span> {selectedReq.equipmentRequirements || 'Standard AV'}
              </p>
              <p className="italic text-neutral-300 pt-1">
                "{selectedReq.description}"
              </p>
            </div>

            <p>
              {actionType === 'APPROVE'
                ? 'Approving will atomically create a confirmed RoomBooking record in the campus schedule. Enter approval notes:'
                : 'Enter reason for rejecting this facility request:'}
            </p>
            <input
              type="text"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="e.g. Schedule verified, room reserved for student club"
              className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
            />

            {errorMsg && (
              <div className="p-2.5 bg-red-950 border border-red-700 rounded text-red-300 text-xs">
                {errorMsg}
              </div>
            )}
          </div>
        </ActionModal>
      )}
    </div>
  );
};
