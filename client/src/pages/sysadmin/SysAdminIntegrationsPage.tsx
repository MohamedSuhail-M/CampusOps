import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const SysAdminIntegrationsPage: React.FC = () => {
  const connectors = [
    { name: 'SAP S/4HANA ERP Connector', type: 'REST / OAuth2', latency: '48ms', status: 'HEALTHY', sync: 'PO & Inventory Lines' },
    { name: 'Ellucian Banner SIS Connector', type: 'GraphQL', latency: '62ms', status: 'HEALTHY', sync: 'Student & Faculty Enrollment' },
    { name: 'Siemens Desigo CC IoT Gateway', type: 'MQTT / TLS', latency: '18ms', status: 'ALERT', sync: 'Room B-204 Breaker Trip Event' },
    { name: 'TimeTabler Academic Engine', type: 'Webhooks', latency: '35ms', status: 'HEALTHY', sync: 'Classroom Schedule Matrix' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'SYSTEM ADMIN', path: '/app/sysadmin/overview' }, { label: 'INTEGRATIONS' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Campus Subsystem Integrations &amp; Telemetry
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Real-time connector status with enterprise campus systems.
        </p>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {connectors.map((c, idx) => (
          <div key={idx} className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-brandCream">{c.name}</span>
                <span className="text-[10px] text-neutral-400">({c.type})</span>
              </div>
              <p className="text-neutral-400 text-[11px] font-sans">{c.sync} • Latency: {c.latency}</p>
            </div>

            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
              c.status === 'ALERT'
                ? 'bg-red-950 text-red-300 border border-red-700/60'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
            }`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
