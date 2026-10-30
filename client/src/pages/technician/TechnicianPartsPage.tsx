import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LiveCameraModal } from '../../components/multimodal/LiveCameraModal';

export const TechnicianPartsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  // Form for New Purchase Request
  const [selectedItemId, setSelectedItemId] = useState<string>('ITM002');
  const [quantity, setQuantity] = useState<number>(2);
  const [workOrderId, setWorkOrderId] = useState<string>('WO005');
  const [reason, setReason] = useState<string>('Immediate replacement required for blocked hardware repair');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [prRes, invRes, woRes] = await Promise.all([
        apiFetch<any[]>('/api/procurement/requests'),
        apiFetch<any[]>('/api/inventory/items'),
        apiFetch<any[]>('/api/work-orders'),
      ]);
      if (prRes.success && prRes.data) setRequests(prRes.data);
      if (invRes.success && invRes.data) {
        setInventory(invRes.data);
        if (invRes.data.length > 0 && !selectedItemId) {
          setSelectedItemId(invRes.data[0].id);
        }
      }
      if (woRes.success && woRes.data) {
        setWorkOrders(woRes.data);
        if (woRes.data.length > 0 && !workOrderId) {
          setWorkOrderId(woRes.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadFile = async (file: File) => {
    setPhotoError(null);

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image exceeds the 5MB file size limit.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photos', file);
      const res = await apiFetch<any[]>('/api/intake/evidence', {
        method: 'POST',
        body: formData,
      });
      if (res.success && res.data?.[0]) {
        setPhotoUrl(`/api/intake/evidence/${res.data[0].id}`);
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        setPhotoError(res.error?.message || 'Failed to upload photo evidence.');
      }
    } catch (err: any) {
      setPhotoError(err.message || 'Error uploading photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
    // Reset file input so re-selecting same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSuccessMsg(null);
    setSubmitError(null);

    try {
      const payload: any = {
        lines: [{ itemId: selectedItemId, quantity: Math.max(1, Number(quantity)) }],
        reason: reason.trim() || 'Immediate hardware spare replacement',
      };

      if (workOrderId && workOrderId.trim()) {
        payload.workOrderId = workOrderId.trim();
      }

      if (photoUrl) {
        payload.attachmentUrl = photoUrl;
      }

      const res = await apiFetch('/api/procurement/requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        const prId = res.data?.id || res.data?.pr?.id || 'PR-NEW';
        setSuccessMsg(`Purchase Request created successfully: ${prId}`);
        setPhotoUrl(null);
        setPhotoPreview(null);
        setPhotoError(null);
        fetchData();
      } else {
        setSubmitError(res.error?.message || 'Failed to submit purchase request. Please check required fields.');
      }
    } catch (e: any) {
      setSubmitError(e.message || 'Network error submitting purchase request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'TECHNICIAN', path: '/app/technician/work-orders' },
          { label: 'PARTS & SPARES REQUESTS' },
        ]}
      />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Hardware Spares &amp; Parts Requests
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Submit purchase requests for depleted inventory to unblock pending work orders with optional defect photo evidence.
        </p>
      </div>

      {/* Grid: Create PR Form + Active Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create PR (1 col) */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-3">
            <span className="material-symbols-outlined text-brandLime text-lg">add_shopping_cart</span>
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Request Hardware Spares
            </h2>
          </div>

          <form onSubmit={handleCreatePr} className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-neutral-400 uppercase mb-1">Required Spare Part:</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
                required
              >
                {inventory.length > 0 ? (
                  inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (In Stock: {inv.quantityOnHand} {inv.unit})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ITM002">Wi-Fi Network Transceiver (Stock: 2)</option>
                    <option value="ITM001">16A Power Socket (Stock: 14)</option>
                    <option value="ITM006">HDMI Cable (Stock: 18)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Quantity Needed:</label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">Reason / Justification:</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this replacement needed?"
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase mb-1">
                Linked Work Order (Optional):
              </label>
              <select
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-2.5 text-xs text-brandCream font-mono focus:border-brandLime"
              >
                <option value="">(None - General Warehouse Spares)</option>
                {workOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.id} — {wo.incident?.title || wo.blockedReason || `Status: ${wo.status}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Photo Attachment */}
            <div>
              <label className="block text-neutral-400 uppercase mb-1">
                Optional Defective Part Photo:
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {photoPreview ? (
                <div className="relative border border-brandLime/40 bg-[#1A1A1A] rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={photoPreview}
                      alt="Part Preview"
                      className="w-12 h-12 rounded object-cover border border-[#333]"
                    />
                    <div>
                      <span className="text-[11px] font-bold text-brandCream block">Photo Attached</span>
                      <span className="text-[10px] text-neutral-400">Procurement will inspect image</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="px-2 py-1 bg-[#2A2A2A] hover:bg-[#353535] text-[10px] uppercase font-bold text-brandCream rounded"
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl(null);
                        setPhotoPreview(null);
                        setPhotoError(null);
                      }}
                      className="px-2 py-1 bg-red-950/60 hover:bg-red-900 text-red-300 text-[10px] uppercase font-bold rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="flex-1 py-2 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] hover:border-brandLime text-brandCream rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase transition-all"
                  >
                    <span className="material-symbols-outlined text-base text-brandLime">photo_camera</span>
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] hover:border-brandLime text-brandCream rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase transition-all"
                  >
                    <span className="material-symbols-outlined text-base text-neutral-400">upload_file</span>
                    Browse
                  </button>
                </div>
              )}
              {uploadingPhoto && (
                <p className="text-[10px] text-brandLime mt-1 animate-pulse">Uploading photo evidence...</p>
              )}
              {photoError && (
                <p className="text-[10px] text-red-400 mt-1">{photoError}</p>
              )}
            </div>

            {submitError && (
              <div className="p-2.5 bg-red-950/50 border border-red-700/60 rounded-lg text-red-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-red-400">error</span>
                <span>{submitError}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-950/50 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-emerald-400">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="w-full mt-2 py-3 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-brandDark border-t-transparent rounded-full animate-spin" />
                  <span>Submitting PR...</span>
                </>
              ) : (
                <span>Submit Purchase Request</span>
              )}
            </button>
          </form>
        </div>

        {/* Requests List (2 cols) */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
              Active Purchase Requests
            </h2>
            <span className="font-mono text-xs text-neutral-400">Policy 4.2 Dual-Sign</span>
          </div>

          <div className="divide-y divide-[#2A2A2A]">
            {requests.length === 0 ? (
              <div className="py-12 text-center font-mono text-xs text-neutral-500">
                No active purchase requests logged.
              </div>
            ) : (
              requests.map((pr) => (
                <div key={pr.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brandLime">{pr.id}</span>
                      <StatusBadge status={pr.status} />
                    </div>
                    <p className="text-xs text-brandCream font-medium">
                      {pr.lines?.[0]?.item?.name || 'Hardware Spares'} ({pr.lines?.[0]?.quantity || 1} units)
                    </p>
                    <p className="text-[10px] font-mono text-neutral-500">
                      Linked to Work Order: {pr.workOrderId || 'N/A (General)'} • Submitted by {pr.requester?.name || 'Technician'}
                    </p>
                    {pr.attachmentUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoPreview(pr.attachmentUrl)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-brandLime hover:underline mt-1"
                      >
                        <span className="material-symbols-outlined text-xs">image</span>
                        View Defective Part Photo
                      </button>
                    )}
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-neutral-500 block text-[10px] uppercase">Est. Total</span>
                    <span className="font-bold text-brandCream">
                      {pr.estimatedTotal ? `₹${pr.estimatedTotal.toLocaleString()}` : 'Pending Quote'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Camera Modal */}
      {showCameraModal && (
        <LiveCameraModal
          isOpen={showCameraModal}
          onPhotoCaptured={(blob: Blob, filename: string) => {
            const file = new File([blob], filename || 'part-defective.jpg', { type: blob.type || 'image/jpeg' });
            handleUploadFile(file);
            setShowCameraModal(false);
          }}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* Photo Preview Modal */}
      {selectedPhotoPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141414] border-2 border-brandDark rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-[8px_8px_0px_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <span className="font-display font-bold uppercase text-brandCream text-sm">
                Defective Hardware Photo Evidence
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoPreview(null)}
                className="p-1 hover:bg-[#2A2A2A] rounded-lg text-neutral-400 hover:text-brandCream"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-96">
              <img
                src={selectedPhotoPreview}
                alt="Defective Spare Attachment"
                className="max-h-96 object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPhotoPreview(null)}
                className="px-4 py-2 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
