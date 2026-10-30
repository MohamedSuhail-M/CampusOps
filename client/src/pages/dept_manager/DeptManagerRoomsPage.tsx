import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const DeptManagerRoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiFetch<any[]>('/api/directory/rooms')
      .then((res) => {
        if (res.success && res.data) {
          setRooms(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'DEPARTMENT MANAGER', path: '/app/dept-manager/home' }, { label: 'ROOMS & TIMETABLE' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Department Classrooms &amp; Laboratories
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Real-time occupancy, hardware installations, and capacity allocation across Building B &amp; C.
        </p>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading campus rooms...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Room Code</th>
                  <th className="py-3 px-4">Building</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Room Type</th>
                  <th className="py-3 px-4">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {rooms.slice(0, 15).map((r) => (
                  <tr key={r.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                      {r.code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-brandCream">
                      {r.building?.name || 'Academic Block'} ({r.building?.code})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {r.capacity} Seats
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400 uppercase">
                      {r.roomType || 'CLASSROOM'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {r.code === 'B-204' ? (
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700/60 font-mono text-[10px] font-bold uppercase">
                          Outage (Hazard)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] font-bold uppercase">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
