import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const ProcurementInventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'MOVEMENTS'>('ITEMS');
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Movement Filters
  const [movementFilter, setMovementFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, movRes] = await Promise.all([
        apiFetch<any[]>('/api/inventory/items'),
        apiFetch<any[]>('/api/inventory/movements'),
      ]);
      if (itemsRes.success && itemsRes.data) setItems(itemsRes.data);
      if (movRes.success && movRes.data) setMovements(movRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMovements = movements.filter((m) => {
    const matchesType = movementFilter === 'ALL' || m.reason?.toUpperCase().includes(movementFilter);
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      m.id?.toLowerCase().includes(query) ||
      m.referenceId?.toLowerCase().includes(query) ||
      m.item?.name?.toLowerCase().includes(query) ||
      m.item?.sku?.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs
        items={[
          { label: 'CAMPUSOPS', path: '/' },
          { label: 'PROCUREMENT', path: '/app/procurement/requests' },
          { label: 'INVENTORY & MOVEMENTS LEDGER' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
            Campus Central Inventory &amp; Movements Ledger
          </h1>
          <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
            Real-time stock balance, reorder thresholds, and immutable physical delivery/consumption audit logs.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-[#1C1C1C] border border-[#2A2A2A] p-1 rounded-xl self-start sm:self-auto font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ITEMS')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'ITEMS'
                ? 'bg-brandLime text-brandDark shadow'
                : 'text-neutral-400 hover:text-brandCream'
            }`}
          >
            Stock Balance ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'MOVEMENTS'
                ? 'bg-brandLime text-brandDark shadow'
                : 'text-neutral-400 hover:text-brandCream'
            }`}
          >
            Movements Ledger ({movements.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Stock on hand */}
      {activeTab === 'ITEMS' && (
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-neutral-400">
              <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading inventory stock...
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
      )}

      {/* TAB 2: Movements Ledger */}
      {activeTab === 'MOVEMENTS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 shadow-[4px_4px_0px_#0A0A0A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ALL', label: 'All Movements' },
                { id: 'RECEIPT', label: 'Inward Receipts' },
                { id: 'CONSUMPTION', label: 'Work Order Consumptions' },
                { id: 'RESERVATION', label: 'Reservations' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setMovementFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                    movementFilter === pill.id
                      ? 'bg-brandLime text-brandDark border-brandLime'
                      : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A] hover:border-neutral-500'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-400 text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, reference..."
                className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl pl-8 pr-3 py-1.5 text-xs text-brandCream placeholder:text-neutral-500 font-mono focus:outline-none focus:border-brandLime"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
            {loading ? (
              <div className="py-16 text-center text-xs font-mono text-neutral-400">
                <div className="w-6 h-6 border-2 border-brandLime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading stock movements...
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-neutral-500">
                No movements matching the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Movement ID</th>
                      <th className="py-3 px-4">Item SKU &amp; Name</th>
                      <th className="py-3 px-4">Quantity Delta</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Reference ID</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {filteredMovements.map((mov) => {
                      const isPositive = mov.quantityDelta > 0;
                      return (
                        <tr key={mov.id} className="hover:bg-[#1A1A1A] transition-colors font-mono">
                          <td className="py-3.5 px-4 font-bold text-brandLime whitespace-nowrap">
                            {mov.id}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-brandCream">
                            <span className="text-neutral-400 block text-[10px]">{mov.item?.sku}</span>
                            {mov.item?.name || mov.itemId}
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                isPositive
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                              }`}
                            >
                              {isPositive ? `+${mov.quantityDelta}` : mov.quantityDelta} {mov.item?.unit || 'pcs'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-300">
                            {mov.reason}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400">
                            {mov.referenceId || 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap text-[11px]">
                            {new Date(mov.createdAt).toLocaleString()}
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
      )}
    </div>
  );
};
