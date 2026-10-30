import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const ProcurementPoliciesPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'PROCUREMENT', path: '/app/procurement/requests' }, { label: 'POLICY RULES' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Campus Procurement Governance &amp; Policy Rules
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Mandatory compliance rules enforced deterministically at the backend API layer.
        </p>
      </div>

      <div className="space-y-4">
        {/* Policy 4.2 */}
        <div className="bg-[#141414] border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] rounded-2xl p-6 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brandLime" />
            <h2 className="font-display font-bold text-base uppercase text-brandCream">
              Policy 4.2: Anti-Self-Approval &amp; Dual-Control Sign-off
            </h2>
          </div>
          <p className="text-neutral-300 font-sans leading-relaxed">
            No employee, department manager, or procurement officer may approve a Purchase Request that they submitted. If requester ID matches approver ID, the Express backend automatically rejects the request with HTTP 403 Forbidden.
          </p>
          <div className="p-3 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-[11px] text-neutral-400">
            Enforced in: <code>server/src/modules/procurement/procurement.routes.ts</code>
          </div>
        </div>

        {/* Policy 3.4 */}
        <div className="bg-[#141414] border-2 border-brandDark shadow-[4px_4px_0px_#0A0A0A] rounded-2xl p-6 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brandLime" />
            <h2 className="font-display font-bold text-base uppercase text-brandCream">
              Policy 3.4: Emergency Hardware Fast-Track
            </h2>
          </div>
          <p className="text-neutral-300 font-sans leading-relaxed">
            Purchase requests linked to active CRITICAL work orders bypass standard 72-hour bidding windows, routing directly to the Central Procurement Manager console with auto-reservation on dock intake.
          </p>
        </div>
      </div>
    </div>
  );
};
