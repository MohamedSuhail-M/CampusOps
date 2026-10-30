import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import {
  Send,
  QrCode,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  DoorOpen,
  Box,
} from 'lucide-react';

export const StudentView: React.FC = () => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [assetTag, setAssetTag] = useState<string>('');
  const [resolvedAsset, setResolvedAsset] = useState<any | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [complaintText, setComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Load campus buildings on mount
  useEffect(() => {
    apiFetch('/api/directory/buildings').then((res) => {
      if (res.success) {
        setBuildings(res.data || []);
        if (res.data?.length > 0) setSelectedBuilding(res.data[0].id);
      }
    });
    fetchMyComplaints();
  }, []);

  // Load rooms when building changes
  useEffect(() => {
    if (!selectedBuilding) return;
    apiFetch(`/api/directory/rooms?buildingId=${selectedBuilding}`).then((res) => {
      if (res.success) {
        setRooms(res.data || []);
        if (res.data?.length > 0) setSelectedRoom(res.data[0].id);
      }
    });
  }, [selectedBuilding]);

  const fetchMyComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await apiFetch('/api/intake/my-complaints');
      if (res.success) {
        setMyComplaints(res.data || []);
      }
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleQrLookup = async () => {
    if (!assetTag.trim()) return;
    setQrError(null);
    setResolvedAsset(null);
    const res = await apiFetch(`/api/directory/assets/lookup?qr=${encodeURIComponent(assetTag.trim())}`);
    if (res.success && res.data) {
      setResolvedAsset(res.data);
      if (res.data.room?.buildingId) setSelectedBuilding(res.data.room.buildingId);
      if (res.data.roomId) setSelectedRoom(res.data.roomId);
    } else {
      setQrError(res.error?.message || 'Asset QR code not recognized.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setSubmitting(true);
    setSuccessMessage(null);

    const payload = {
      message: complaintText,
      buildingId: selectedBuilding || undefined,
      roomId: selectedRoom || undefined,
      assetId: resolvedAsset?.id || undefined,
    };

    const res = await apiFetch('/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setSuccessMessage(
        `Complaint logged successfully! Incident Reference: ${res.data.incident.reference} · Priority: ${res.data.incident.priority}`
      );
      setComplaintText('');
      setResolvedAsset(null);
      setAssetTag('');
      fetchMyComplaints();
    } else {
      alert(res.error?.message || 'Failed to submit complaint.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-cream tracking-tight">Student Operations Portal</h1>
        <p className="text-sm text-neutral-400">
          Report facility malfunctions, submit maintenance requests, and track real-time resolution progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Complaint Submission */}
        <div className="lg:col-span-7 bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 border-b border-charcoal-700 pb-3">
            <Send className="w-5 h-5 text-lime" />
            <h2 className="font-bold text-cream text-base">Submit Facility Complaint</h2>
          </div>

          {successMessage && (
            <div className="mb-4 bg-lime/10 border border-lime/30 text-lime text-xs rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Asset QR Tag Quick Lookup */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-lime" />
                <span>Asset QR Tag (Optional Scan / Input)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  placeholder="e.g. QR-AST-EL-B-204 or AST-EL-B-204"
                  className="flex-1 bg-charcoal-800 border border-charcoal-700 rounded-lg px-3 py-2 text-xs text-cream focus:outline-none focus:border-lime"
                />
                <button
                  type="button"
                  onClick={handleQrLookup}
                  className="bg-charcoal-700 hover:bg-charcoal-600 text-cream px-3 py-2 rounded-lg text-xs font-semibold border border-charcoal-600 transition"
                >
                  Lookup QR
                </button>
              </div>

              {resolvedAsset && (
                <div className="mt-2 bg-charcoal-800 border border-lime/40 rounded-lg p-2.5 text-xs text-neutral-300 flex items-start gap-2">
                  <Box className="w-4 h-4 text-lime mt-0.5" />
                  <div>
                    <span className="font-bold text-lime">{resolvedAsset.assetTag}</span>: {resolvedAsset.type} in {resolvedAsset.room?.code} ({resolvedAsset.room?.building?.name})
                  </div>
                </div>
              )}
              {qrError && (
                <div className="mt-1 text-[11px] text-critical flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {qrError}
                </div>
              )}
            </div>

            {/* Building & Room Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-neutral-400" />
                  Building
                </label>
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg px-3 py-2 text-xs text-cream focus:outline-none focus:border-lime"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5 text-neutral-400" />
                  Room
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg px-3 py-2 text-xs text-cream focus:outline-none focus:border-lime"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} ({r.roomType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Complaint Text */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                <span>Issue Description (Natural Language)</span>
                <span className="text-[11px] text-lime flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Triage Active
                </span>
              </label>
              <textarea
                required
                rows={4}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe the issue in detail (e.g., 'Sparking switch board near whiteboard in Room B-204, urgent electrical hazard before exam')..."
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-3 text-xs text-cream focus:outline-none focus:border-lime leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-lime hover:bg-lime-hover text-obsidian font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting & Triaging...' : 'Submit Maintenance Request'}
            </button>
          </form>
        </div>

        {/* Right Column: Demo Scenario 1 Quick Test & Guidelines */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Scenario 1 Button */}
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2 text-lime font-bold text-xs uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              Scenario 1: Pre-fill Exam Outage
            </div>
            <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
              Click to instantly load the official Hackathon Scenario 1 complaint (Electrical socket sparking in room RM-B-204 before the CSAI exam).
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedBuilding('BLD-B');
                setSelectedRoom('RM-B-204');
                setAssetTag('AST-EL-B-204');
                setComplaintText(
                  'Sparking power socket near the front lecture desk in Room B-204. Smoke smell detected. There is a semester exam scheduled here this morning!'
                );
              }}
              className="w-full bg-charcoal-800 hover:bg-charcoal-700 text-cream border border-lime/40 font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
            >
              Load Scenario 1 Electrical Issue
            </button>
          </div>

          {/* Quick Scenario 2 Button */}
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2 text-info font-bold text-xs uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              Scenario 2: Pre-fill Wi-Fi Failure
            </div>
            <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
              Click to load Scenario 2 (Shared Wi-Fi router failure in Building C lab RM-C-201).
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedBuilding('BLD-C');
                setSelectedRoom('RM-C-201');
                setAssetTag('AST-NW-C-201');
                setComplaintText(
                  'Wi-Fi router in Building C room 201 has completely stopped working. Multiple students disconnected during practical assignment.'
                );
              }}
              className="w-full bg-charcoal-800 hover:bg-charcoal-700 text-cream border border-info/40 font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
            >
              Load Scenario 2 Wi-Fi Issue
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: My Complaints History */}
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-charcoal-700 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-lime" />
            <h2 className="font-bold text-cream text-base">My Submitted Complaints ({myComplaints.length})</h2>
          </div>
          <button
            onClick={fetchMyComplaints}
            className="text-xs text-lime hover:underline"
          >
            Refresh
          </button>
        </div>

        {loadingComplaints ? (
          <div className="text-center py-6 text-xs text-neutral-400">Loading complaints...</div>
        ) : myComplaints.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-400">No complaints submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-charcoal-800 text-neutral-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3">Associated Incident</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {myComplaints.map((item) => {
                  const inc = item.incidentReports?.[0]?.incident;
                  return (
                    <tr key={item.id} className="hover:bg-charcoal-800/40 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-400">
                        {new Date(item.receivedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate">{item.originalText}</td>
                      <td className="py-2.5 px-3 font-mono text-cream">
                        {inc ? inc.reference : 'In Review'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc?.priority === 'CRITICAL'
                              ? 'bg-critical/20 text-critical border border-critical/30'
                              : inc?.priority === 'HIGH'
                              ? 'bg-warning/20 text-warning border border-warning/30'
                              : 'bg-charcoal-700 text-neutral-300'
                          }`}
                        >
                          {inc?.priority || 'NORMAL'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-charcoal-700 text-lime border border-lime/30">
                          {inc?.status || 'REPORTED'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
