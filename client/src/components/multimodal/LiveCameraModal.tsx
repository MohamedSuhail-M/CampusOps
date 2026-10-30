import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (blob: Blob, filename: string) => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Capture State
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Enumerate video input devices
  const discoverCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          // Prefer back/rear camera on mobile
          const rear = videoInputs.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedDeviceId(rear ? rear.deviceId : videoInputs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('Device enumeration error:', e);
    }
  };

  // Start live camera stream
  const startCamera = async (deviceIdToUse?: string) => {
    setIsInitializing(true);
    setErrorMsg(null);
    stopCameraStream();

    // Check browser support and secure context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsInitializing(false);
      setErrorMsg(
        'Camera API is not supported in this browser or context. Camera access requires HTTPS or localhost.'
      );
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceIdToUse
          ? { deviceId: { exact: deviceIdToUse }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback to basic video constraint if ideal resolution/facingMode failed
        console.warn('First getUserMedia attempt failed, retrying with basic constraints:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((playErr) => {
            console.warn('Video play interrupted:', playErr);
          });
          setIsInitializing(false);
        };
      } else {
        setIsInitializing(false);
      }

      // Re-enumerate devices now that permission is granted (labels are now visible)
      await discoverCameras();
    } catch (err: any) {
      setIsInitializing(false);
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg(
          'Camera permission was denied. Please click the camera icon in your browser address bar to allow camera access.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera hardware was detected on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMsg(
          'Your camera is currently in use by another application (e.g. Zoom, Teams, or another browser tab). Please close it and retry.'
        );
      } else {
        setErrorMsg(err.message || 'Failed to start camera feed.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null);
      setCapturedPreview(null);
      startCamera(selectedDeviceId);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  // Handle camera switch
  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    startCamera(newDeviceId);
  };

  // Capture frame to canvas
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const previewUrl = URL.createObjectURL(blob);
          setCapturedPreview(previewUrl);
          // Pause/stop live stream to save resources while viewing preview
          stopCameraStream();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedBlob(null);
    setCapturedPreview(null);
    startCamera(selectedDeviceId);
  };

  // Confirm and attach
  const handleConfirm = () => {
    if (capturedBlob) {
      const filename = `camera_photo_${Date.now()}.jpg`;
      onPhotoCaptured(capturedBlob, filename);
      handleClose();
    }
  };

  // Close modal and clean up
  const handleClose = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedBlob(null);
    setCapturedPreview(null);
    stopCameraStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brandDark/90 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl rounded-2xl bg-brandCream border-2 border-brandDark shadow-[8px_8px_0px_#0A0A0A] p-5 sm:p-6 z-10 text-brandDark transform transition-all animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-brandDark">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-brandDark">photo_camera</span>
            <div>
              <h3 className="font-display text-lg uppercase font-bold text-brandDark leading-tight">
                {capturedPreview ? 'Review Captured Photo' : 'Live Camera Viewfinder'}
              </h3>
              <p className="font-mono text-[10px] text-neutral-600 uppercase font-semibold">
                Capture evidence directly from device camera
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white border-2 border-brandDark flex items-center justify-center text-brandDark hover:bg-neutral-100 transition-colors shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
            aria-label="Close camera"
          >
            <span className="material-symbols-outlined text-base font-bold">close</span>
          </button>
        </div>

        {/* Camera Selector (if multiple cameras detected) */}
        {!capturedPreview && devices.length > 1 && (
          <div className="mt-3 flex items-center gap-2 font-mono text-xs">
            <label className="text-neutral-700 font-bold uppercase text-[10px]">Camera:</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="flex-1 bg-white border-2 border-brandDark rounded-lg px-2.5 py-1 text-xs text-brandDark font-mono focus:outline-none focus:bg-yellow-50"
            >
              {devices.map((d, index) => (
                <option key={d.deviceId || index} value={d.deviceId}>
                  {d.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Viewfinder / Preview Container */}
        <div className="mt-4 relative bg-black rounded-xl overflow-hidden border-2 border-brandDark aspect-video flex items-center justify-center shadow-inner">
          {/* Active Live Video Stream */}
          {!capturedPreview && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isInitializing ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}

          {/* Captured Image Preview */}
          {capturedPreview && (
            <img
              src={capturedPreview}
              alt="Captured evidence preview"
              className="w-full h-full object-contain bg-black"
            />
          )}

          {/* Loading Indicator */}
          {!capturedPreview && isInitializing && !errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-brandCream font-mono text-xs">
              <div className="w-8 h-8 border-4 border-brandLime border-t-transparent rounded-full animate-spin" />
              <span>Initializing device camera...</span>
            </div>
          )}

          {/* Live Recording Badge */}
          {!capturedPreview && !isInitializing && !errorMsg && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE VIEW
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-black/90 text-red-300 font-mono text-xs space-y-3">
              <span className="material-symbols-outlined text-4xl text-red-500">videocam_off</span>
              <p className="max-w-md font-semibold">{errorMsg}</p>
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId)}
                className="px-4 py-1.5 bg-brandCream text-brandDark font-bold uppercase text-[10px] rounded-lg border border-white shadow hover:bg-white"
              >
                Retry Camera Access
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-brandDark border-2 border-brandDark rounded-xl font-mono font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#0A0A0A]"
          >
            {t.common.cancel}
          </button>

          {!capturedPreview ? (
            <button
              type="button"
              disabled={isInitializing || !!errorMsg}
              onClick={handleCapture}
              className="px-6 py-2.5 bg-brandLime hover:bg-[#b0dc28] text-brandDark border-2 border-brandDark rounded-xl font-mono font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_#0A0A0A] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">camera</span>
              Capture Photo
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 bg-white hover:bg-neutral-100 text-brandDark border-2 border-brandDark rounded-xl font-mono font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#0A0A0A] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">replay</span>
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2.5 bg-brandLime hover:bg-[#b0dc28] text-brandDark border-2 border-brandDark rounded-xl font-mono font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_#0A0A0A] flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                Attach Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
