import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  X, 
  FlaskConical, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  Calendar, 
  Building2, 
  ArrowDownRight, 
  ArrowUpRight 
} from 'lucide-react';
import { db } from '../db/db';

const DEFAULT_CHEMICALS = [
  { itemName: 'Industrial Alkaline Degreaser (Floor Deep Clean)', unit: 'Liters', totalStock: 50, alertThreshold: 15 },
  { itemName: 'Cold Storage Food-Safe Sanitizer (-20°C Chiller)', unit: 'Liters', totalStock: 30, alertThreshold: 10 },
  { itemName: 'Acidic Toilet Descaler & Stain Remover', unit: 'Liters', totalStock: 25, alertThreshold: 8 },
  { itemName: 'Single Disc 17" Machine Scrubbing Pads', unit: 'Pads (Pcs)', totalStock: 20, alertThreshold: 5 },
  { itemName: 'Metal Rust Remover & Surface Treatment', unit: 'Liters', totalStock: 15, alertThreshold: 5 }
];

export default function ChemicalTrackerModal({
  isOpen,
  onClose,
  stores = [],
  supervisors = []
}) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'action' | 'logs'
  const [actionType, setActionType] = useState('issue'); // 'add' | 'issue'
  const [selectedChemicalId, setSelectedChemicalId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [targetStoreCode, setTargetStoreCode] = useState('');
  const [targetSupervisorName, setTargetSupervisorName] = useState('');
  const [notes, setNotes] = useState('');

  // Live queries from Dexie
  const chemicalStockData = useLiveQuery(async () => {
    try {
      return await db.chemicalStock.toArray();
    } catch {
      return [];
    }
  }, []);
  const chemicals = Array.isArray(chemicalStockData) ? chemicalStockData : [];

  const chemicalLogsData = useLiveQuery(async () => {
    try {
      const list = await db.chemicalLogs.toArray();
      return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    } catch {
      return [];
    }
  }, []);
  const logs = Array.isArray(chemicalLogsData) ? chemicalLogsData : [];

  // Seed default chemicals if table is empty
  useEffect(() => {
    const checkAndSeed = async () => {
      try {
        const count = await db.chemicalStock.count();
        if (count === 0) {
          for (const item of DEFAULT_CHEMICALS) {
            await db.chemicalStock.add({
              ...item,
              updatedAt: new Date()
            });
          }
        }
      } catch (e) {
        console.warn('Chemical seed notice', e);
      }
    };
    if (isOpen) checkAndSeed();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTransaction = async (e) => {
    e.preventDefault();
    const qtyNum = Number(quantity);
    if (!selectedChemicalId || isNaN(qtyNum) || qtyNum <= 0) {
      alert('Kripya valid chemical aur quantity enter karein.');
      return;
    }

    try {
      const chem = await db.chemicalStock.get(Number(selectedChemicalId));
      if (!chem) return;

      if (actionType === 'issue' && chem.totalStock < qtyNum) {
        alert(`Stock kam hai! Current stock sirf ${chem.totalStock} ${chem.unit} hai.`);
        return;
      }

      const newStock = actionType === 'add' ? chem.totalStock + qtyNum : chem.totalStock - qtyNum;

      await db.chemicalStock.update(chem.id, {
        totalStock: newStock,
        updatedAt: new Date()
      });

      await db.chemicalLogs.add({
        chemicalId: chem.id,
        itemName: chem.itemName,
        type: actionType, // 'add' or 'issue'
        quantity: qtyNum,
        unit: chem.unit,
        storeCode: targetStoreCode || '',
        supervisorName: targetSupervisorName || '',
        date: new Date().toISOString(),
        notes: notes.trim()
      });

      // Reset form
      setQuantity('');
      setNotes('');
      setActiveTab('inventory');
      alert(`Chemical stock successfully updated! New balance: ${newStock} ${chem.unit}`);
    } catch (err) {
      alert('Error updating chemical: ' + err.message);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chemical Stock &amp; Consumption Tracker
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track machine chemicals, degreasers, sanitizers &amp; issue to field teams
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-2 px-3 rounded-xl transition ${
                activeTab === 'inventory'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🧪 Stock Balance ({chemicals.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('action');
                if (chemicals.length > 0 && !selectedChemicalId) {
                  setSelectedChemicalId(chemicals[0].id);
                }
              }}
              className={`py-2 px-3 rounded-xl transition ${
                activeTab === 'action'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ⇄ Issue / Add Stock
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-3 rounded-xl transition ${
                activeTab === 'logs'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              📋 Usage History ({logs.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Current Stock */}
        {activeTab === 'inventory' && (
          <div className="p-6 space-y-3 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 gap-2.5">
              {chemicals.map((chem) => {
                const isLow = chem.totalStock <= (chem.alertThreshold || 10);
                return (
                  <div
                    key={chem.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isLow
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
                        : 'bg-slate-50/60 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{chem.itemName}</span>
                        {isLow && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Alert Threshold: &le; {chem.alertThreshold} {chem.unit}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-lg font-black ${isLow ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {chem.totalStock} <span className="text-xs font-semibold text-slate-400">{chem.unit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChemicalId(chem.id);
                          setActionType('issue');
                          setActiveTab('action');
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Issue to Store &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Issue / Add Stock Form */}
        {activeTab === 'action' && (
          <form onSubmit={handleTransaction} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
            
            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType('issue')}
                className={`py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 border ${
                  actionType === 'issue'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span>- Issue to Store / Supervisor</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('add')}
                className={`py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 border ${
                  actionType === 'add'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span>+ Add Stock In (Supplier Se Aaya)</span>
              </button>
            </div>

            {/* Select Chemical */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Chemical / Item *
              </label>
              <select
                required
                value={selectedChemicalId}
                onChange={(e) => setSelectedChemicalId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="">-- Choose Chemical --</option>
                {chemicals.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.itemName} (Balance: {c.totalStock} {c.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quantity ({actionType === 'issue' ? 'Kitna Issue Kiya' : 'Kitna Stock Aaya'}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                placeholder="e.g. 5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            {/* If Issue: Target Store & Supervisor */}
            {actionType === 'issue' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Blinkit Dark Store (Optional)
                  </label>
                  <select
                    value={targetStoreCode}
                    onChange={(e) => setTargetStoreCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Store --</option>
                    {stores.map(s => (
                      <option key={s.storeCode} value={s.storeCode}>
                        {s.storeCode} - {s.storeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supervisor Name (Optional)
                  </label>
                  <select
                    value={targetSupervisorName}
                    onChange={(e) => setTargetSupervisorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Supervisor --</option>
                    {supervisors.map(sup => (
                      <option key={sup.id} value={sup.name}>
                        {sup.name} ({sup.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Bill Note
              </label>
              <input
                type="text"
                placeholder={actionType === 'add' ? 'e.g. Purchased 50L from Diversey Vendor' : 'e.g. Night shift cold storage deep scrubbing'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition ${
                actionType === 'issue'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {actionType === 'issue' ? 'Issue Chemical Stock →' : 'Add to Stock Inventory →'}
            </button>

          </form>
        )}

        {/* Tab 3: Usage History Logs */}
        {activeTab === 'logs' && (
          <div className="p-6 space-y-2 overflow-y-auto flex-1">
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className={log.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}>
                          {log.type === 'add' ? '▲ Stock Added' : '▼ Issued Out'}:
                        </span>
                        <span>{log.quantity} {log.unit} &bull; {log.itemName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {log.storeCode && <span>Store: {log.storeCode} &bull; </span>}
                        {log.supervisorName && <span>Supervisor: {log.supervisorName} &bull; </span>}
                        <span>{new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {log.notes && <span className="italic block text-slate-500">"{log.notes}"</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Abhi koi chemical transactions record nahi hue hain.
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
