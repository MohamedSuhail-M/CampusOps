import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiFetch } from '../../services/api';
import { LanguageSelector } from '../common/LanguageSelector';
import { CameraQrScanner } from './CameraQrScanner';
import { VoiceDictation } from './VoiceDictation';
import { PhotoEvidenceUpload, UploadedEvidenceItem } from './PhotoEvidenceUpload';
import { StatusBadge } from '../common/StatusBadge';

interface Building {
  id: string;
  code: string;
  name: string;
}

interface Room {
  id: string;
  code: string;
  buildingId: string;
}

interface AssetLookupData {
  id: string;
  assetTag: string;
  type: string;
  status: string;
  room?: {
    id: string;
    code: string;
    buildingId: string;
    building?: { id: string; code: string; name: string };
  };
}

interface MultimodalComplaintFormProps {
  onSuccess?: (reference: string) => void;
  returnRoute?: string;
}

export const MultimodalComplaintForm: React.FC<MultimodalComplaintFormProps> = ({
  onSuccess,
  returnRoute = '/app/student/reports',
}) => {
  const { language, t } = useTranslation();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('AI_SUGGESTED');
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState<string>('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [scannedAssetTag, setScannedAssetTag] = useState<string>('');
  const [verifiedAsset, setVerifiedAsset] = useState<AssetLookupData | null>(null);
  const [evidenceList, setEvidenceList] = useState<UploadedEvidenceItem[]>([]);
  const [inputMethod, setInputMethod] = useState<string>('TEXT');

  // Directory Data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

  // QR Modal
  const [showQrScanner, setShowQrScanner] = useState<boolean>(false);

  // Smart Triage Preview
  const [triageData, setTriageData] = useState<any>(null);
  const [triageLoading, setTriageLoading] = useState<boolean>(false);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);

  // Load buildings on mount
  useEffect(() => {
    apiFetch<Building[]>('/api/directory/buildings')
      .then((res) => {
        if (res.success && res.data) {
          setBuildings(res.data);
        }
      })
      .catch((err) => console.error('Failed to load buildings', err));
  }, []);

  // Load rooms when building selection changes
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
        }
      })
      .finally(() => setLoadingRooms(false));
  }, [selectedBuildingId]);

  // Debounced Smart Triage preview as user types or changes location
  useEffect(() => {
    if (!description || description.trim().length < 5) {
      setTriageData(null);
      return;
    }

    const timer = setTimeout(() => {
      setTriageLoading(true);
      apiFetch('/api/intake/triage-preview', {
        method: 'POST',
        body: JSON.stringify({
          originalText: description,
          buildingId: selectedBuildingId || null,
          roomId: selectedRoomId || null,
          assetTag: scannedAssetTag || null,
        }),
      })
        .then((res) => {
          if (res.success && res.data) {
            setTriageData(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setTriageLoading(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [description, selectedBuildingId, selectedRoomId, scannedAssetTag]);

  // Handle scanned QR code
  const handleQrScanned = async (tag: string) => {
    setScannedAssetTag(tag);
    setInputMethod((prev) => (prev === 'VOICE' ? 'QR_VOICE' : 'QR_TEXT'));

    try {
      const res = await apiFetch<AssetLookupData>(`/api/directory/assets/lookup?qr=${encodeURIComponent(tag)}`);
      if (res.success && res.data) {
        setVerifiedAsset(res.data);
        // Autofill building and room without race condition
        if (res.data.room) {
          setSelectedBuildingId(res.data.room.buildingId);
          // Load rooms for that building immediately and set room
          const roomsRes = await apiFetch<Room[]>(`/api/directory/rooms?buildingId=${res.data.room.buildingId}`);
          if (roomsRes.success && roomsRes.data) {
            setRooms(roomsRes.data);
            setSelectedRoomId(res.data.room.id);
          }
        }
      }
    } catch (e) {
      console.warn('Asset lookup failed for tag:', tag);
    }
  };

  // Handle Voice Dictation update
  const handleTranscript = (text: string) => {
    setDescription(text);
    setInputMethod((prev) => (prev.includes('QR') ? 'QR_VOICE' : 'VOICE'));
  };

  // Submit Complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setErrorMsg('Please enter a description of at least 5 characters.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      // Determine final input method
      let finalMethod = inputMethod;
      if (evidenceList.length > 0 && finalMethod === 'TEXT') {
        finalMethod = 'MULTIMODAL';
      }

      const res = await apiFetch('/api/intake/submit', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim() || undefined,
          category: category !== 'AI_SUGGESTED' ? category : undefined,
          incidentDate,
          originalText: description,
          channel: finalMethod.includes('VOICE') ? 'VOICE' : finalMethod.includes('QR') ? 'QR' : 'WEB',
          language,
          inputMethod: finalMethod,
          buildingId: selectedBuildingId || null,
          roomId: selectedRoomId || null,
          assetTag: scannedAssetTag || null,
          evidenceIds: evidenceList.map((e) => e.id),
        }),
      });

      if (res.success && res.data) {
        setSubmissionSuccess(res.data);
        onSuccess?.(res.data.incidentReference || res.data.incidentId);
      } else {
        setErrorMsg(res.error?.message || 'Failed to submit complaint. Please try again.');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg(err.message || 'Connection error while saving complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setTitle('');
    setCategory('AI_SUGGESTED');
    setIncidentDate(new Date().toISOString().slice(0, 16));
    setDescription('');
    setSelectedBuildingId('');
    setSelectedRoomId('');
    setScannedAssetTag('');
    setVerifiedAsset(null);
    setEvidenceList([]);
    setInputMethod('TEXT');
    setSubmissionSuccess(null);
    setErrorMsg(null);
  };

  // If already submitted, show confirmation screen
  if (submissionSuccess) {
    const inc = submissionSuccess.incident;
    return (
      <div className="bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl p-6 sm:p-10 text-center space-y-6 max-w-2xl mx-auto animate-fadeIn">
        <div className="w-16 h-16 bg-brandLime/20 border-2 border-brandLime text-brandLime rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
        </div>

        <div>
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-brandCream">
            {t.complaintForm.successTitle}
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Persisted securely to SQLite operational database with immutable audit log.
          </p>
        </div>

        <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-4 text-left space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-2">
            <span className="text-neutral-500 uppercase">Reference Ticket:</span>
            <span className="text-brandLime font-bold text-sm">
              {inc?.reference || submissionSuccess.incidentReference || 'INC-2026-TKT'}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-2">
            <span className="text-neutral-500 uppercase">Category & Priority:</span>
            <div className="flex items-center gap-2">
              <span className="text-brandCream font-bold">{submissionSuccess.category || inc?.category}</span>
              <StatusBadge status={submissionSuccess.priority || inc?.priority || 'MEDIUM'} />
            </div>
          </div>

          <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-2">
            <span className="text-neutral-500 uppercase">Language & Channel:</span>
            <span className="text-brandCream font-semibold">
              {language.toUpperCase()} • {submissionSuccess.isDuplicate ? 'RELATED REPORT (CORRELATED)' : 'NEW INCIDENT'}
            </span>
          </div>

          {verifiedAsset && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 uppercase">Linked Equipment:</span>
              <span className="text-brandCream font-semibold">
                {verifiedAsset.assetTag} ({verifiedAsset.type})
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => navigate(returnRoute)}
            className="px-6 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all"
          >
            {t.complaintForm.viewInReports} →
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 bg-[#2A2A2A] hover:bg-[#353535] text-brandCream font-mono font-bold text-xs uppercase tracking-wider rounded-lg border border-[#3A3A3A] transition-all"
          >
            {t.complaintForm.submitAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* SECTION A: Language Selector */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brandLime" />
            <h3 className="font-display font-bold uppercase text-sm tracking-wider text-brandCream">
              {t.complaintForm.step1Language}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Current: {language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिन्दी' : 'English'}
          </span>
        </div>
        <LanguageSelector />
      </div>

      {/* SECTION B: Location & Equipment */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brandLime" />
            <h3 className="font-display font-bold uppercase text-sm tracking-wider text-brandCream">
              {t.complaintForm.step2Location}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowQrScanner(true)}
            className="px-3 py-1.5 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">qr_code_scanner</span>
            {t.complaintForm.scanQrBtn}
          </button>
        </div>

        {/* Canteen / Dining Sector Notice */}
        {category === 'CANTEEN_HYGIENE' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">restaurant</span>
            <span>Food / Canteen report: Location defaults to Central Campus Dining Hall & Food Court.</span>
          </div>
        )}

        {/* Verified Asset Banner if QR Scanned */}
        {verifiedAsset && (
          <div className="p-3 bg-brandLime/10 border border-brandLime/40 rounded-xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-brandLime text-xl">verified</span>
              <div>
                <p className="font-bold text-brandCream">
                  {verifiedAsset.assetTag} • {verifiedAsset.type}
                </p>
                <p className="text-[10px] text-neutral-400">
                  Located in: {verifiedAsset.room?.building?.name || 'Building'} ({verifiedAsset.room?.code})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setVerifiedAsset(null);
                setScannedAssetTag('');
              }}
              className="text-[10px] text-neutral-400 hover:text-red-400 uppercase font-bold"
            >
              Clear
            </button>
          </div>
        )}

        {/* Building & Room Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
              {t.complaintForm.buildingLabel}
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                setSelectedRoomId('');
              }}
              className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-brandCream font-mono focus:outline-none focus:border-brandLime"
            >
              <option value="">{t.complaintForm.buildingPlaceholder}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
              {t.complaintForm.roomLabel}
            </label>
            <select
              value={selectedRoomId}
              disabled={!selectedBuildingId || loadingRooms}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-brandCream font-mono focus:outline-none focus:border-brandLime disabled:opacity-50"
            >
              <option value="">
                {loadingRooms ? 'Loading rooms...' : t.complaintForm.roomPlaceholder}
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION B2: Category & Incident Classification */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brandLime" />
          <h3 className="font-display font-bold uppercase text-sm tracking-wider text-brandCream">
            Incident Category &amp; Classification
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-brandCream font-mono focus:outline-none focus:border-brandLime"
            >
              <option value="AI_SUGGESTED">✦ AI Auto-Classification (Smart Triage)</option>
              <option value="SAFETY_INCIDENT">🚨 Safety / Physical Altercation (Sensitive)</option>
              <option value="STUDENT_MISCONDUCT">🛡️ Bullying / Misconduct / Harassment (Sensitive)</option>
              <option value="CANTEEN_HYGIENE">🍽️ Canteen / Food Quality &amp; Hygiene</option>
              <option value="WATER_SANITATION">🚰 Water Supply &amp; Sanitation</option>
              <option value="CLEANLINESS">🧹 Classroom Cleanliness &amp; Housekeeping</option>
              <option value="NETWORK">📶 Internet / Wi-Fi Connectivity</option>
              <option value="ELECTRICAL">⚡ Electrical Faults &amp; Lighting</option>
              <option value="HVAC">❄️ Air Conditioning &amp; Ventilation</option>
              <option value="PLUMBING">🔧 Plumbing &amp; Restroom Repairs</option>
              <option value="AV">📽️ Projector &amp; AV Equipment</option>
              <option value="FURNITURE_EQUIPMENT">🪑 Furniture &amp; Physical Fixtures</option>
              <option value="LOST_AND_FOUND">🔍 Lost &amp; Found Property</option>
              <option value="GENERAL">📋 Other Campus Grievance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
              Incident Title / Short Subject (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Canteen food hygiene issue, Projector bulb blown"
              className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-brandCream font-mono focus:outline-none focus:border-brandLime"
            />
          </div>
        </div>

        {/* Sensitive Safety & Emergency Advisory Banner */}
        {(category === 'SAFETY_INCIDENT' || category === 'STUDENT_MISCONDUCT' || triageData?.triage?.isSensitive) && (
          <div className="p-3.5 bg-red-950/40 border border-red-700/60 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold uppercase">
              <span className="material-symbols-outlined text-base">security</span>
              <span>Confidential Safety Routing Protocol</span>
            </div>
            <p className="text-[11px] font-sans text-neutral-300 leading-relaxed">
              This report contains sensitive incident details and is automatically restricted from general queues. It will be routed directly to authorized Campus Security and Student Affairs officers. For active physical threats or emergencies, contact Campus Security Dispatch immediately at Ext 999.
            </p>
          </div>
        )}
      </div>

      {/* SECTION C: Describe Issue with Voice Dictation */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brandLime" />
            <h3 className="font-display font-bold uppercase text-sm tracking-wider text-brandCream">
              {t.complaintForm.step3Description}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Native Script Supported (EN / தமிழ் / हिन्दी)
          </span>
        </div>

        {/* Voice Dictation Control Strip */}
        <VoiceDictation
          language={language}
          currentText={description}
          onTranscriptChange={handleTranscript}
        />

        {/* Editable Description Textarea */}
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.complaintForm.descriptionPlaceholder}
          className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3.5 text-xs text-brandCream placeholder:text-neutral-500 font-sans focus:outline-none focus:border-brandLime transition-all"
        />

        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
          <span>Minimum 5 characters required</span>
          <span>{description.length} characters</span>
        </div>
      </div>

      {/* SECTION D: Attach Photo Evidence */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brandLime" />
          <h3 className="font-display font-bold uppercase text-sm tracking-wider text-brandCream">
            {t.complaintForm.step4Evidence}
          </h3>
        </div>
        <PhotoEvidenceUpload
          evidenceList={evidenceList}
          onChange={setEvidenceList}
          maxFiles={3}
        />
      </div>

      {/* SECTION E: Smart AI Triage Analysis (Live Preview) */}
      {triageData && (
        <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brandLime text-lg">auto_awesome</span>
              <h3 className="font-display font-bold uppercase text-sm tracking-wider text-brandCream">
                {t.complaintForm.step5Triage}
              </h3>
            </div>
            {triageLoading && (
              <span className="text-[10px] font-mono text-brandLime animate-pulse">
                Analyzing...
              </span>
            )}
          </div>

          {/* Safety Hazard Warning Banner */}
          {triageData.triage?.safety_flags && triageData.triage.safety_flags.length > 0 && (
            <div className="p-3 bg-red-950/70 border-2 border-red-600 rounded-xl text-xs font-mono text-red-200 flex items-start gap-2.5 animate-pulse shadow-[2px_2px_0px_#0A0A0A]">
              <span className="material-symbols-outlined text-red-400 text-lg shrink-0">emergency</span>
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider block text-red-300">
                  Critical Safety Hazard Detected ({triageData.triage.safety_flags.join(', ')})
                </span>
                <p className="text-[11px] text-neutral-300">
                  This report has been flagged for priority emergency response and campus safety dispatch.
                </p>
              </div>
            </div>
          )}

          {/* Clarification Alert */}
          {triageData.triage?.needs_clarification && triageData.triage.clarification_prompt && (
            <div className="p-3 bg-blue-950/40 border border-blue-600/60 rounded-xl text-xs font-mono text-blue-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-blue-400 text-lg shrink-0">help</span>
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider block text-blue-300">
                  Clarification Recommended
                </span>
                <p className="text-[11px] text-neutral-300">
                  {triageData.triage.clarification_prompt}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-3">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                {t.complaintForm.detectedCategory}
              </span>
              <span className="text-brandCream font-bold text-sm block">
                {triageData.triage?.category || 'GENERAL'}
              </span>
              {triageData.triage?.subcategory && (
                <span className="text-[10px] text-brandLime block mt-0.5 truncate">
                  {triageData.triage.subcategory}
                </span>
              )}
            </div>

            <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-3">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                {t.complaintForm.suggestedPriority}
              </span>
              <StatusBadge status={triageData.triage?.suggestedPriority || 'LOW'} />
            </div>

            <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-3">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                Department & Skill
              </span>
              <span className="text-brandCream font-bold text-xs block">
                {triageData.triage?.department || 'Facilities'}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                {triageData.triage?.requiredSkillName || 'General'}
              </span>
            </div>

            <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-3">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                Correlation State
              </span>
              <span className="text-brandLime font-bold text-xs">
                {triageData.correlation?.isDuplicate
                  ? 'Duplicate Correlated'
                  : 'New Incident Candidate'}
              </span>
            </div>
          </div>

          {/* Contextual Reasoning */}
          {triageData.triage?.explanation && (
            <div className="p-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-xs font-mono text-neutral-300 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">AI Contextual Assessment:</span>
              <p className="text-[11px] leading-relaxed text-neutral-300">
                {triageData.triage.explanation}
              </p>
            </div>
          )}

          {triageData.triage?.missingInformation && triageData.triage.missingInformation.length > 0 && (
            <div className="p-2.5 bg-yellow-950/20 border border-yellow-700/40 rounded-xl text-xs font-mono text-yellow-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">warning</span>
              <span>{triageData.triage.missingInformation.join(' ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Feedback */}
      {errorMsg && (
        <div className="p-3 bg-red-950/50 border border-red-700 rounded-xl text-xs font-mono text-red-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION F: Submit Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs font-mono text-neutral-400 text-center sm:text-left">
          Protected by CampusOps RBAC & Tamper-Evident Audit Logging.
        </p>

        <button
          type="submit"
          disabled={submitting || description.trim().length < 5}
          className="w-full sm:w-auto px-8 py-3.5 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#b0dc28] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-brandDark border-t-transparent rounded-full animate-spin" />
              <span>{t.complaintForm.submitting}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">send</span>
              <span>{t.complaintForm.submitBtn}</span>
            </>
          )}
        </button>
      </div>

      {/* Camera QR Modal */}
      {showQrScanner && (
        <CameraQrScanner
          onScanSuccess={handleQrScanned}
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </form>
  );
};
