import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useTranslation } from '../../i18n/LanguageContext';

export const ComplaintDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch(`/api/intake/${encodeURIComponent(id)}`)
      .then((res) => {
        if (res.success && res.data) {
          setComplaint(res.data);
        } else {
          setErrorMsg(res.error?.message || 'Complaint not found.');
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Error loading complaint details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 font-mono text-xs text-neutral-400">
        <div className="w-8 h-8 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading complaint telemetry from database...</p>
      </div>
    );
  }

  if (errorMsg || !complaint) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
        <div className="p-6 bg-red-950/40 border border-red-700/60 rounded-2xl space-y-3">
          <span className="material-symbols-outlined text-4xl text-red-400">error</span>
          <h2 className="text-lg font-display font-bold uppercase text-brandCream">
            Complaint Not Found
          </h2>
          <p className="text-xs font-mono text-neutral-300">
            {errorMsg || 'Could not locate record matching ID: ' + id}
          </p>
          <Link
            to="/app/student/reports"
            className="inline-block mt-3 px-5 py-2.5 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-[3px_3px_0px_#0A0A0A]"
          >
            ← Back to My Reports
          </Link>
        </div>
      </div>
    );
  }

  const inc = complaint.incident;
  const workOrder = inc?.workOrders?.[0];

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'STUDENT', path: '/app/student/home' },
          { label: 'MY REPORTS', path: '/app/student/reports' },
          { label: inc?.reference || complaint.id },
        ]}
      />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
              {inc?.reference || complaint.id}
            </h1>
            <StatusBadge status={inc?.status || 'PENDING'} />
            <StatusBadge status={inc?.priority || 'MEDIUM'} />
          </div>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Submitted on {new Date(complaint.receivedAt).toLocaleString()} • Channel: {complaint.channel}
          </p>
        </div>

        <Link
          to="/app/student/reports"
          className="self-start sm:self-auto px-4 py-2 bg-[#2A2A2A] hover:bg-[#333] text-brandCream font-mono font-bold text-xs uppercase rounded-lg border border-[#3A3A3A] transition-all"
        >
          {t.details.backBtn}
        </Link>
      </div>

      {/* Grid: Main Info + Side Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Photos, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Complaint Box */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold uppercase text-xs tracking-wider text-brandLime">
                {t.details.originalComplaint}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#2A2A2A] font-mono text-[10px] text-brandCream uppercase">
                Lang: {complaint.language?.toUpperCase() || 'EN'}
              </span>
            </div>
            <p className="text-sm font-sans text-brandCream whitespace-pre-wrap leading-relaxed bg-[#1C1C1C] p-4 rounded-xl border border-[#2A2A2A]">
              {complaint.originalText}
            </p>
          </div>

          {/* Normalized Summary (if present) */}
          {complaint.normalizedText && (
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-2">
              <span className="font-display font-bold uppercase text-xs tracking-wider text-neutral-400">
                {t.details.normalizedSummary}
              </span>
              <p className="text-xs font-mono text-neutral-300 bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2A2A]">
                {complaint.normalizedText}
              </p>
            </div>
          )}

          {/* Attached Photo Evidence */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
            <span className="font-display font-bold uppercase text-xs tracking-wider text-brandCream block">
              {t.details.photoEvidence}
            </span>

            {complaint.evidence && complaint.evidence.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.evidence.map((ev: any) => (
                  <div
                    key={ev.id}
                    onClick={() => setPreviewImage(`/api/intake/evidence/${ev.id}`)}
                    className="relative group bg-[#1C1C1C] border border-[#2A2A2A] hover:border-brandLime rounded-xl overflow-hidden cursor-pointer transition-all aspect-video"
                  >
                    <img
                      src={`/api/intake/evidence/${ev.id}`}
                      alt={ev.originalFilename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-brandLime">
                      <span className="material-symbols-outlined text-2xl">zoom_in</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-neutral-500 italic">
                {t.details.noEvidence}
              </p>
            )}
          </div>

          {/* Status Timeline */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
            <span className="font-display font-bold uppercase text-xs tracking-wider text-brandCream block">
              {t.details.statusTimeline}
            </span>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-brandLime mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-brandCream">Intake Recorded</p>
                  <p className="text-[11px] text-neutral-500">
                    {new Date(complaint.receivedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {workOrder && (
                <div className="flex items-start gap-3">
                  <span className="w-3 h-3 rounded-full bg-brandLime mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-brandCream">
                      Technician Assigned ({workOrder.assignee?.name || 'Assigned Staff'})
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Work Order #{workOrder.id} • Status: {workOrder.status}
                    </p>
                  </div>
                </div>
              )}

              {inc?.status === 'RESOLVED' && (
                <div className="flex items-start gap-3">
                  <span className="w-3 h-3 rounded-full bg-brandLime mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-brandCream">Incident Resolved</p>
                    <p className="text-[11px] text-neutral-500">
                      Hardware restored and verified operational.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Metadata & Location */}
        <div className="space-y-6">
          {/* AI Intelligence Triage Dossier Card */}
          {complaint.aiMetadata && (
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold uppercase tracking-wider text-brandLime flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">psychology</span>
                  AI Operations Triage
                </span>
                {complaint.aiMetadata.confidence && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#222] text-brandLime border border-[#333]">
                    {Math.round(complaint.aiMetadata.confidence * 100)}% Confidence
                  </span>
                )}
              </div>

              {/* Safety Warning if present */}
              {complaint.aiMetadata.safety_flags && complaint.aiMetadata.safety_flags.length > 0 && (
                <div className="p-2.5 bg-red-950/60 border border-red-700/80 rounded-xl text-[11px] text-red-200 font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-red-400">warning</span>
                  <span>Safety Hazard: {complaint.aiMetadata.safety_flags.join(', ')}</span>
                </div>
              )}

              <div className="space-y-2 divide-y divide-[#2A2A2A]">
                {complaint.aiMetadata.subcategory && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-neutral-500">Subcategory:</span>
                    <span className="text-brandCream font-bold">{complaint.aiMetadata.subcategory}</span>
                  </div>
                )}
                {complaint.aiMetadata.department && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-neutral-500">Department:</span>
                    <span className="text-brandCream font-bold">{complaint.aiMetadata.department} ({complaint.aiMetadata.requiredSkillName || 'Technical'})</span>
                  </div>
                )}
                {complaint.aiMetadata.reason && (
                  <div className="pt-2 space-y-1">
                    <span className="text-neutral-500 block text-[10px] uppercase">Reasoning:</span>
                    <p className="text-[11px] text-neutral-300 leading-relaxed font-sans bg-[#1C1C1C] p-2.5 rounded-lg border border-[#2A2A2A]">
                      {complaint.aiMetadata.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location & Equipment Card */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3 font-mono text-xs">
            <span className="font-display font-bold uppercase tracking-wider text-brandCream block">
              {t.details.equipmentInfo}
            </span>

            <div className="space-y-2 divide-y divide-[#2A2A2A]">
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Building:</span>
                <span className="text-brandCream font-bold">{inc?.building?.name || inc?.room?.building?.name || 'Campus Wide'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Room:</span>
                <span className="text-brandCream font-bold">{inc?.room?.code || 'Unspecified'}</span>
              </div>
              {inc?.asset && (
                <div className="pt-2 flex justify-between">
                  <span className="text-neutral-500">Asset Tag:</span>
                  <span className="text-brandLime font-bold">{inc.asset.assetTag} ({inc.asset.type})</span>
                </div>
              )}
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Category:</span>
                <span className="text-brandCream font-bold">{inc?.category || 'GENERAL'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Staff */}
          {workOrder && workOrder.assignee && (
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3 font-mono text-xs">
              <span className="font-display font-bold uppercase tracking-wider text-brandCream block">
                {t.details.technicianAssigned}
              </span>
              <div className="flex items-center gap-3 bg-[#1C1C1C] p-3 rounded-xl border border-[#2A2A2A]">
                <div className="w-10 h-10 rounded-full bg-brandLime text-brandDark font-bold flex items-center justify-center text-sm">
                  {workOrder.assignee.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-brandCream">{workOrder.assignee.name}</p>
                  <p className="text-[10px] text-neutral-400">Status: {workOrder.status}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Photo Evidence */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Evidence Large Preview"
              className="max-w-full max-h-[85vh] rounded-xl border-2 border-brandDark shadow-2xl object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/80 text-white hover:text-brandLime"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
