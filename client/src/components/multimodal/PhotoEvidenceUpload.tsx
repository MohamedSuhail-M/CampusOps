import React, { useState } from 'react';

export interface UploadedEvidenceItem {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  previewUrl: string;
}

interface PhotoEvidenceUploadProps {
  evidenceList: UploadedEvidenceItem[];
  onChange: (items: UploadedEvidenceItem[]) => void;
  maxFiles?: number;
}

export const PhotoEvidenceUpload: React.FC<PhotoEvidenceUploadProps> = ({
  evidenceList,
  onChange,
  maxFiles = 3,
}) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const availableSlots = maxFiles - evidenceList.length;
    if (availableSlots <= 0) {
      setErrorMsg(`Maximum of ${maxFiles} photos allowed per complaint.`);
      return;
    }

    const filesToUpload: File[] = [];
    for (let i = 0; i < Math.min(files.length, availableSlots); i++) {
      const file = files[i];
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the 5MB size limit.`);
        return;
      }
      // Validate MIME type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrorMsg(`File "${file.name}" must be JPEG, PNG, or WebP.`);
        return;
      }
      filesToUpload.push(file);
    }

    setUploading(true);

    try {
      const formData = new FormData();
      filesToUpload.forEach((f) => formData.append('photos', f));

      const response = await fetch('/api/intake/evidence', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const json = await response.json();
      if (json.success && json.data) {
        const newItems: UploadedEvidenceItem[] = json.data.map((item: any) => ({
          id: item.id,
          originalFilename: item.originalFilename,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          previewUrl: `/api/intake/evidence/${item.id}`,
        }));
        onChange([...evidenceList, ...newItems]);
      } else {
        setErrorMsg(json.error?.message || 'Failed to upload photo evidence.');
      }
    } catch (err: any) {
      console.error('Evidence upload error:', err);
      setErrorMsg(err.message || 'Connection error during photo upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (id: string) => {
    onChange(evidenceList.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* File Drop / Action Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Browse Files */}
        <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-[#2A2A2A] hover:border-brandLime bg-[#161616] hover:bg-[#1C1C1C] cursor-pointer transition-all text-center group">
          <span className="material-symbols-outlined text-2xl text-neutral-400 group-hover:text-brandLime mb-1">
            add_photo_alternate
          </span>
          <span className="text-xs font-mono font-bold text-brandCream uppercase">
            Browse Image Files
          </span>
          <span className="text-[10px] font-mono text-neutral-500 mt-0.5">
            JPG, PNG, WebP up to 5MB ({evidenceList.length}/{maxFiles})
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading || evidenceList.length >= maxFiles}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </label>

        {/* Camera Capture on Mobile / Laptop */}
        <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-[#2A2A2A] hover:border-brandLime bg-[#161616] hover:bg-[#1C1C1C] cursor-pointer transition-all text-center group">
          <span className="material-symbols-outlined text-2xl text-neutral-400 group-hover:text-brandLime mb-1">
            photo_camera
          </span>
          <span className="text-xs font-mono font-bold text-brandCream uppercase">
            Take Live Photo
          </span>
          <span className="text-[10px] font-mono text-neutral-500 mt-0.5">
            Opens Device Camera Directly
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={uploading || evidenceList.length >= maxFiles}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 font-mono text-xs text-brandLime bg-brandLime/10 border border-brandLime/30 p-2.5 rounded-lg">
          <div className="w-3.5 h-3.5 border-2 border-brandLime border-t-transparent rounded-full animate-spin" />
          <span>Uploading and validating photo evidence...</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 bg-red-950/40 border border-red-700/50 rounded-lg text-xs font-mono text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Uploaded Thumbnails Preview */}
      {evidenceList.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
            Attached Evidence ({evidenceList.length}/{maxFiles}):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {evidenceList.map((item) => (
              <div
                key={item.id}
                className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden p-2 flex items-center gap-3 shadow-[2px_2px_0px_#0A0A0A]"
              >
                <img
                  src={item.previewUrl}
                  alt={item.originalFilename}
                  className="w-14 h-14 object-cover rounded-lg bg-black border border-[#333]"
                  onError={(e) => {
                    // Fallback placeholder icon if preview unavailable
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-mono font-semibold text-brandCream truncate">
                    {item.originalFilename}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-500">
                    {(item.fileSize / 1024).toFixed(0)} KB • Verified
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1 rounded bg-[#2A2A2A] text-neutral-400 hover:text-red-400 hover:bg-red-950/50 transition-colors"
                  title="Remove attachment"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
