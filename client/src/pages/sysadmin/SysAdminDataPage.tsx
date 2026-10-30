import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const SysAdminDataPage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  useEffect(() => {
    // Demo campus equipment assets mapped to seeded database
    const sampleAssets = [
      { id: 'AST-PJ-B-204', assetTag: 'PJ-B-204-01', type: 'PROJECTOR', roomCode: 'B-204', building: 'Building B' },
      { id: 'AST-EL-B-204', assetTag: 'EL-B-204-01', type: 'ELECTRICAL_PANEL', roomCode: 'B-204', building: 'Building B' },
      { id: 'AST-AP-C-102', assetTag: 'AP-C-102-01', type: 'NETWORK_ACCESS_POINT', roomCode: 'C-102', building: 'Building C' },
      { id: 'AST-AC-A-101', assetTag: 'AC-A-101-01', type: 'AC_SPLIT', roomCode: 'A-101', building: 'Building A' },
      { id: 'AST-PJ-B-206', assetTag: 'PJ-B-206-01', type: 'PROJECTOR', roomCode: 'B-206', building: 'Building B' },
    ];
    setAssets(sampleAssets);
    setSelectedAsset(sampleAssets[0]);
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'SYSTEM ADMIN', path: '/app/sysadmin/overview' }, { label: 'CAMPUS DATA & QR GENERATOR' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Campus Hardware Directory &amp; QR Code Generator
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Generate live printable QR code badges to test the camera scanner from your phone or secondary monitor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets List (2 cols) */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] space-y-4">
          <h2 className="font-display font-bold uppercase tracking-wider text-base text-brandCream">
            Equipment Asset Catalog (242 Assets)
          </h2>

          <div className="divide-y divide-[#2A2A2A]">
            {assets.map((ast) => (
              <div
                key={ast.id}
                onClick={() => setSelectedAsset(ast)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                  selectedAsset?.id === ast.id
                    ? 'bg-[#1F2314] border border-brandLime'
                    : 'bg-[#1C1C1C] border border-[#2A2A2A] hover:border-neutral-500'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brandLime">{ast.assetTag}</span>
                    <span className="text-neutral-500">•</span>
                    <span className="font-bold text-xs text-brandCream">{ast.type}</span>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-400">
                    Room {ast.roomCode} • {ast.building}
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3 py-1 bg-[#2A2A2A] hover:bg-brandLime hover:text-brandDark font-mono text-xs font-bold uppercase rounded"
                >
                  View QR Badge →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Printable QR Code Card (1 col) */}
        {selectedAsset && (
          <div className="bg-[#141414] border-2 border-brandDark shadow-[6px_6px_0px_#0A0A0A] rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brandLime/20 text-brandLime font-mono text-[10px] font-bold uppercase rounded-full">
              <span className="material-symbols-outlined text-sm">qr_code</span>
              OFFICIAL EQUIPMENT BADGE
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-black">
              {/* Clean SVG QR code representation using api.qrserver.com or data url */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `https://campusops.demo/asset/${selectedAsset.assetTag}`
                )}`}
                alt={`QR for ${selectedAsset.assetTag}`}
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="space-y-1 font-mono text-xs">
              <p className="text-base font-bold text-brandLime uppercase">{selectedAsset.assetTag}</p>
              <p className="text-brandCream font-semibold">{selectedAsset.type}</p>
              <p className="text-neutral-400">Room {selectedAsset.roomCode} • {selectedAsset.building}</p>
            </div>

            <p className="text-[10px] font-mono text-neutral-400 max-w-xs">
              Point your smartphone or web camera at this screen inside the Student Complaint Form to verify instant equipment auto-fill.
            </p>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 bg-[#2A2A2A] hover:bg-[#333] text-brandCream font-mono font-bold text-xs uppercase rounded-lg border border-[#3A3A3A] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print Asset Badge
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
