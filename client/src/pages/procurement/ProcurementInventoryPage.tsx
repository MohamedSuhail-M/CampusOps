import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const ProcurementInventoryPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiFetch<any[]>('/api/inventory/items')
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'PROCUREMENT', path: '/app/procurement/requests' }, { label: 'INVENTORY LEDGER' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Campus Central Inventory Ledger
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Real-time stock on hand, reorder thresholds, and active technician reservations.
        </p>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading inventory items...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item SKU</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Quantity on Hand</th>
                  <th className="py-3 px-4">Reorder Level</th>
                  <th className="py-3 px-4">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {items.map((it) => {
                  const isDepleted = it.quantityOnHand <= 0;
                  const isLow = it.quantityOnHand <= it.reorderLevel;
                  return (
                    <tr key={it.id} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brandLime whitespace-nowrap">
                        {it.sku}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-brandCream">
                        {it.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-400 uppercase">
                        {it.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-brandCream">
                        {it.quantityOnHand}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-400">
                        {it.reorderLevel}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isDepleted ? (
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700/60 font-mono text-[10px] font-bold uppercase">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-700/60 font-mono text-[10px] font-bold uppercase">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] font-bold uppercase">
                            Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
