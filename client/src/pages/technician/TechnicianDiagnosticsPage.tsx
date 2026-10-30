import React, { useState } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const TechnicianDiagnosticsPage: React.FC = () => {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runTest = (testName: string) => {
    setActiveTest(testName);
    setTestResult(null);
    setTimeout(() => {
      if (testName === 'voltage') {
        setTestResult('VOLTAGE PROBE: 231.4V AC @ 50.02 Hz — Circuit impedance within acceptable threshold (0.42 ohms). Socket ready for load testing.');
      } else if (testName === 'ping') {
        setTestResult('ACCESS POINT DIAGNOSTIC: AP-042 (C-Wing Lab) — Packet loss 100%. Interface down: Optical transceiver link state NO-CARRIER. Hardware replacement mandatory.');
      } else {
        setTestResult('AV HANDSHAKE: Projector PRJ-B204 — EDID handshake failed via HDMI extender. Lamp hours: 1,420 / 3,000 hrs.');
      }
      setActiveTest(null);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'TECHNICIAN', path: '/app/technician/work-orders' }, { label: 'DIAGNOSTIC TOOLS' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Field Diagnostic Hardware Console
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Perform live probe tests, socket voltage diagnostics, and network transceiver loopbacks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 space-y-3">
          <span className="material-symbols-outlined text-3xl text-brandLime">bolt</span>
          <h3 className="font-display font-bold uppercase text-sm text-brandCream">
            Electrical Voltage Probe
          </h3>
          <p className="text-xs text-neutral-400 font-sans">
            Test mains socket voltage, neutral-to-ground potential, and RCD trip threshold in classrooms.
          </p>
          <button
            type="button"
            disabled={activeTest !== null}
            onClick={() => runTest('voltage')}
            className="w-full py-2 bg-[#2A2A2A] hover:bg-brandLime hover:text-brandDark text-brandCream font-mono font-bold text-xs uppercase rounded-lg border border-[#3A3A3A] transition-all"
          >
            {activeTest === 'voltage' ? 'Probing Socket...' : 'Run Voltage Test'}
          </button>
        </div>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 space-y-3">
          <span className="material-symbols-outlined text-3xl text-cyan-400">router</span>
          <h3 className="font-display font-bold uppercase text-sm text-brandCream">
            AP Optical Loopback
          </h3>
          <p className="text-xs text-neutral-400 font-sans">
            Diagnose transceiver link state on Cisco Cat6/Fiber switches in C-Wing computer lab.
          </p>
          <button
            type="button"
            disabled={activeTest !== null}
            onClick={() => runTest('ping')}
            className="w-full py-2 bg-[#2A2A2A] hover:bg-cyan-400 hover:text-black text-brandCream font-mono font-bold text-xs uppercase rounded-lg border border-[#3A3A3A] transition-all"
          >
            {activeTest === 'ping' ? 'Pinging Switch...' : 'Run AP Ping Test'}
          </button>
        </div>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 space-y-3">
          <span className="material-symbols-outlined text-3xl text-yellow-400">videocam</span>
          <h3 className="font-display font-bold uppercase text-sm text-brandCream">
            AV EDID Signal Handshake
          </h3>
          <p className="text-xs text-neutral-400 font-sans">
            Query projector EDID resolution and HDMI transmitter handshake in Room B-204.
          </p>
          <button
            type="button"
            disabled={activeTest !== null}
            onClick={() => runTest('av')}
            className="w-full py-2 bg-[#2A2A2A] hover:bg-yellow-400 hover:text-black text-brandCream font-mono font-bold text-xs uppercase rounded-lg border border-[#3A3A3A] transition-all"
          >
            {activeTest === 'av' ? 'Querying EDID...' : 'Run AV Handshake'}
          </button>
        </div>
      </div>

      {testResult && (
        <div className="bg-[#101010] border-2 border-brandLime/50 rounded-2xl p-5 shadow-[4px_4px_0px_#0A0A0A] font-mono text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-brandLime">
            <span className="w-2 h-2 rounded-full bg-brandLime animate-ping" />
            <span className="font-bold uppercase tracking-wider">DIAGNOSTIC TELEMETRY TELEMETRY OUTPUT:</span>
          </div>
          <p className="text-neutral-200 leading-relaxed bg-[#181818] p-3 rounded-xl border border-[#2A2A2A]">
            {testResult}
          </p>
        </div>
      )}
    </div>
  );
};
