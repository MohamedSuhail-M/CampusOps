import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CameraQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScanSuccess,
  onClose,
}) => {
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'campusops-qr-reader';

  // Demo asset quick picks for instant testing/demonstration
  const demoAssets = [
    { tag: 'AST-EL-B-204', name: 'Wall Socket / Panel (RM-B-204)' },
    { tag: 'AST-PJ-B-204', name: 'Projector (RM-B-204)' },
    { tag: 'AST-AC-A-101', name: 'Split AC (RM-A-101)' },
    { tag: 'AST-AP-C-102', name: 'Wi-Fi AP (RM-C-102)' },
  ];

  useEffect(() => {
    let isMounted = true;

    // Discover available camera devices
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera if available
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMsg('No camera detected on this device. You can enter an asset tag or choose a demo equipment code below.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Camera enumeration error:', err);
        setErrorMsg('Camera access was blocked or not allowed. Please grant camera permission or use manual entry.');
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraIdToUse?: string) => {
    try {
      setErrorMsg(null);
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5Qr = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5Qr;

      const camId = cameraIdToUse || selectedCameraId;
      const cameraConfig = camId ? { deviceId: { exact: camId } } : { facingMode: 'environment' };

      await html5Qr.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleSuccess(decodedText);
        },
        () => {
          // Frame scan error - ignore to prevent log spam
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.error('Failed to start QR scanner:', err);
      setScannerActive(false);
      setErrorMsg(err.message || 'Could not access camera. Please verify camera permissions in your browser.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      } finally {
        scannerRef.current = null;
        setScannerActive(false);
      }
    }
  };

  const handleSuccess = (rawText: string) => {
    stopScanner();
    // Parse URL if encoded as a deep link (e.g. https://campusops.demo/asset/AST024)
    let cleanTag = rawText.trim();
    if (cleanTag.includes('/')) {
      const parts = cleanTag.split('/');
      cleanTag = parts[parts.length - 1];
    }
    if (cleanTag.includes('=')) {
      const parts = cleanTag.split('=');
      cleanTag = parts[parts.length - 1];
    }
    onScanSuccess(cleanTag);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5Qr = new Html5Qrcode(scannerContainerId);
      const decoded = await html5Qr.scanFile(file, true);
      handleSuccess(decoded);
    } catch (err: any) {
      setErrorMsg('No readable QR code found in the uploaded image.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleSuccess(manualInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl max-w-lg w-full overflow-hidden flex flex-col text-brandCream">
        {/* Header */}
        <div className="h-16 px-6 bg-[#0E0E0E] border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brandLime text-2xl">qr_code_scanner</span>
            <div>
              <h3 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
                Scan Equipment QR
              </h3>
              <p className="text-[10px] font-mono text-neutral-400">
                AI Equipment Lookup & Auto-fill
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-brandCream hover:bg-[#2A2A2A]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-6 space-y-4">
          <div className="relative bg-black rounded-xl overflow-hidden border-2 border-[#2A2A2A] min-h-[260px] flex items-center justify-center">
            <div id={scannerContainerId} className="w-full h-full" />

            {!scannerActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90">
                <span className="material-symbols-outlined text-5xl text-brandLime mb-3 animate-pulse">
                  qr_code_scanner
                </span>
                <p className="text-xs font-mono text-neutral-300 max-w-xs mb-4">
                  Point camera at equipment asset QR badge affixed to campus hardware.
                </p>
                <button
                  type="button"
                  onClick={() => startScanner()}
                  className="px-5 py-2.5 bg-brandLime text-brandDark font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#b0dc28] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                  Activate Live Camera
                </button>
              </div>
            )}
          </div>

          {/* Camera controls if active */}
          {scannerActive && (
            <div className="flex items-center justify-between gap-2">
              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    startScanner(e.target.value);
                  }}
                  className="bg-[#1C1C1C] border border-[#2A2A2A] rounded px-3 py-1.5 text-xs font-mono text-brandCream focus:outline-none focus:border-brandLime"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera ${c.id.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={stopScanner}
                className="px-3 py-1.5 bg-[#2A2A2A] text-brandCream hover:bg-[#353535] rounded font-mono text-xs font-bold uppercase transition-all"
              >
                Stop Camera
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-700/50 rounded-lg text-xs font-mono text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Upload File / Manual fallback */}
          <div className="pt-2 border-t border-[#2A2A2A] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>Alternative: Upload photo or type tag</span>
              <label className="text-brandLime hover:underline cursor-pointer font-bold">
                Browse Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter Asset Tag (e.g. AST024)..."
                className="flex-1 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs font-mono text-brandCream placeholder:text-neutral-500 focus:outline-none focus:border-brandLime"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#2A2A2A] hover:bg-[#353535] text-brandCream font-mono font-bold text-xs uppercase rounded-lg border border-[#353534]"
              >
                Verify
              </button>
            </form>

            {/* Quick Demo asset buttons for instant testing */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                Quick Demo Hardware Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {demoAssets.map((asset) => (
                  <button
                    key={asset.tag}
                    type="button"
                    onClick={() => handleSuccess(asset.tag)}
                    className="px-2 py-1 bg-[#1C1C1C] hover:bg-brandLime hover:text-brandDark border border-[#2A2A2A] rounded text-[11px] font-mono text-neutral-300 transition-colors"
                  >
                    <span className="font-bold text-brandLime group-hover:text-black">{asset.tag}</span>: {asset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
