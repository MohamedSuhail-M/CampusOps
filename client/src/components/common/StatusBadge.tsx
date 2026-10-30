import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', pulse }) => {
  const normalized = (status || '').toUpperCase().trim();
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  // Config mapping per High-Contrast Kinetic Editorial guidelines
  let bgClass = 'bg-[#1C1C1C] text-[#F2EFE9] border-[#2A2A2A]';
  let dotClass = 'bg-brandLime';
  let shouldPulse = pulse ?? false;

  switch (normalized) {
    case 'IN_PROGRESS':
    case 'ACTIVE':
    case 'OPEN':
      bgClass = 'bg-brandLime text-brandDark border-brandDark shadow-[1px_1px_0px_#0A0A0A] font-black';
      dotClass = 'bg-brandDark';
      shouldPulse = true;
      break;
    case 'CRITICAL':
    case 'EMERGENCY':
      bgClass = 'bg-brandDark text-[#FF5555] border-[#FF5555] font-black';
      dotClass = 'bg-[#FF5555]';
      shouldPulse = true;
      break;
    case 'HIGH':
    case 'BLOCKED':
    case 'PENDING_APPROVAL':
    case 'NEEDS ATTENTION':
      bgClass = 'bg-[#FFAA00]/20 text-[#FFAA00] border-[#FFAA00]/40 font-bold';
      dotClass = 'bg-[#FFAA00]';
      break;
    case 'COMPLETED':
    case 'RESOLVED':
    case 'CLOSED':
    case 'APPROVED':
    case 'RECEIVED':
      bgClass = 'bg-brandCream text-brandDark border-brandDark font-bold';
      dotClass = 'bg-brandLime';
      break;
    case 'MEDIUM':
      bgClass = 'bg-[#1C1C1C] text-brandCream border-[#2A2A2A] font-medium';
      dotClass = 'bg-neutral-400';
      break;
    case 'LOW':
    default:
      bgClass = 'bg-[#141414] text-on-surface-variant border-[#2A2A2A] font-medium';
      dotClass = 'bg-neutral-500';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${pad} rounded border font-mono tracking-wider uppercase whitespace-nowrap ${bgClass}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotClass} ${shouldPulse ? 'animate-ping' : ''} shrink-0`}
      />
      <span>{normalized.replace(/_/g, ' ')}</span>
    </span>
  );
};
