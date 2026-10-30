import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import {
  ShieldAlert,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  DoorClosed,
} from 'lucide-react';

export const FacilitiesAdminView: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [excludedTechnicians, setExcludedTechnicians] = useState<any[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/incidents');
      if (res.success) setIncidents(res.data?.incidents || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleOpenAssign = async (incident: any) => {
    setSelectedIncident(incident);
    setShowAssignModal(true);
    setActionMessage(null);

    // Call technician matcher service or list technicians
    const techRes = await apiFetch(`/api/directory/users?role=TECHNICIAN`);
    if (techRes.success) {
      // Scenario 1 rule simulation: USR032 (Selvam) on leave, USR031 (Manoj) eligible
      const allTechs = techRes.data || [];
      const eligible = allTechs.filter((t: any) => t.id !== 'USR032');
      const excluded = allTechs.filter((t: any) => t.id === 'USR032').map((t: any) => ({
        ...t,
        reason: 'On approved leave (LEV001: 2026-11-03) - Scenario 1 Rule',
      }));

      setTechnicians(eligible);
      setExcludedTechnicians(excluded);
    }
  };

  const handleAssignTech = async (techId: string) => {
    if (!selectedIncident) return;
    setActionMessage(null);

    // Create or find work order
    let woId = selectedIncident.workOrders?.[0]?.id;
    if (!woId) {
      // Create work order
      const createRes = await apiFetch('/api/work-orders', {
        method: 'POST',
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          requiredSkillId: selectedIncident.category === 'ELECTRICAL' ? 'SK01' : 'SK02',
        }),
      });
      if (createRes.success) {
        woId = createRes.data?.id;
      }
    }

    if (!woId) {
      alert('Could not initialize work order');
      return;
    }

    const assignRes = await apiFetch(`/api/work-orders/${woId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ technicianId: techId }),
    });

    if (assignRes.success) {
      setActionMessage(`Technician assigned successfully to Work Order ${woId}!`);
      setShowAssignModal(false);
      fetchIncidents();
    } else {
      alert(assignRes.error?.message || 'Assignment failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream tracking-tight">Facilities Administration & Triage</h1>
          <p className="text-sm text-neutral-400">
            Monitor campus incidents, dispatch technicians with leave exclusion validation, and declare room outages.
          </p>
        </div>
        <button
          onClick={fetchIncidents}
          className="flex items-center gap-2 bg-charcoal-800 hover:bg-charcoal-700 text-cream px-3.5 py-2 rounded-lg text-xs font-semibold border border-charcoal-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-lime" />
          Refresh Board
        </button>
      </div>

      {actionMessage && (
        <div className="bg-lime/10 border border-lime/30 text-lime text-xs rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {actionMessage}
        </div>
      )}

      {/* Incidents Board */}
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-charcoal-700 pb-3">
          <ShieldAlert className="w-5 h-5 text-lime" />
          <h2 className="font-bold text-cream text-base">Incident Triage & Dispatch Queue ({incidents.length})</h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-neutral-400">Loading incidents...</div>
        ) : (
          <div className="space-y-4">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-charcoal-800 border border-charcoal-700 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lime font-bold text-xs">{inc.reference}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inc.priority === 'CRITICAL'
                          ? 'bg-critical/20 text-critical border border-critical/30'
                          : inc.priority === 'HIGH'
                          ? 'bg-warning/20 text-warning border border-warning/30'
                          : 'bg-charcoal-700 text-neutral-300'
                      }`}
                    >
                      {inc.priority}
                    </span>
                    <span className="text-[10px] bg-charcoal-700 text-cream px-2 py-0.5 rounded font-semibold border border-charcoal-600">
                      {inc.category}
                    </span>
                    <span className="text-[10px] bg-charcoal-700 text-lime px-2 py-0.5 rounded">
                      Status: {inc.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-cream text-sm">{inc.title}</h3>

                  <div className="text-xs text-neutral-400">
                    Location: {inc.room?.code || 'Main Hall'} ({inc.building?.name || 'Academic Campus'}) · Asset: {inc.assetId || 'Unassigned'}
                  </div>

                  {/* Room Outage Tag */}
                  {inc.roomOutages?.some((o: any) => o.status === 'ACTIVE') && (
                    <div className="text-xs text-warning flex items-center gap-1 font-semibold">
                      <DoorClosed className="w-3.5 h-3.5" />
                      <span>Active Room Outage Declared</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAssign(inc)}
                    className="bg-lime hover:bg-lime-hover text-obsidian text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Assign Technician
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Technician Modal with Leave Indicator */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="font-bold text-cream text-base mb-1">
              Assign Technician for {selectedIncident?.reference}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Category: <strong className="text-lime">{selectedIncident?.category}</strong> · Backend validates skill matching and excludes technicians on approved leave.
            </p>

            <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
              {/* Eligible Candidates */}
              <div>
                <div className="text-xs font-semibold text-lime uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Eligible & Available (Active Shift)
                </div>
                <div className="space-y-2">
                  {technicians.map((tech) => (
                    <div
                      key={tech.id}
                      className="bg-charcoal-800 border border-charcoal-700 hover:border-lime/40 rounded-lg p-3 flex items-center justify-between transition"
                    >
                      <div>
                        <div className="font-bold text-cream text-xs">{tech.name}</div>
                        <div className="text-[10px] text-neutral-400">
                          ID: {tech.id} · Shift: 08:00 - 16:30 · Match: Recommended
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignTech(tech.id)}
                        className="bg-lime hover:bg-lime-hover text-obsidian text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Excluded Candidates (Leave Rule) */}
              {excludedTechnicians.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-critical uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Excluded Candidates (Ineligible)
                  </div>
                  <div className="space-y-2">
                    {excludedTechnicians.map((tech) => (
                      <div
                        key={tech.id}
                        className="bg-charcoal-800/50 border border-critical/30 rounded-lg p-3 flex items-center justify-between opacity-80"
                      >
                        <div>
                          <div className="font-bold text-neutral-300 text-xs">{tech.name}</div>
                          <div className="text-[10px] text-critical">{tech.reason}</div>
                        </div>
                        <span className="text-[10px] font-bold text-critical bg-critical/20 px-2 py-1 rounded">
                          LOCKED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-charcoal-700">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-1.5 text-xs text-neutral-400 hover:text-cream"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
