import React, { useState, useEffect } from 'react';
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
  ArrowUpRight,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  RefreshCw,
  Layers
} from 'lucide-react';
import { saveChemicalStock, addChemicalLog, deleteChemicalStock, seedStandardChemicals } from '../services/api';

const CHEMICAL_CATEGORIES = [
  'Floor Care',
  'General Cleaning',
  'Cold Chain Sanitation',
  'Washroom Care',
  'Glass & Surface',
  'Machine Consumables',
  'Disinfection',
  'Maintenance'
];

const PACKAGING_UNITS = [
  'Liters',
  'Can (5L)',
  'Kg',
  'Pads (Pcs)',
  'Bottles',
  'Pack',
  'Gallon'
];

export default function ChemicalTrackerModal({
  isOpen,
  onClose,
  stores = [],
  supervisors = [],
  chemicals = [],
  logs = [],
  onChemicalUpdated
}) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'action' | 'logs'
  const [actionType, setActionType] = useState('issue'); // 'add' | 'issue'
  const [selectedChemicalId, setSelectedChemicalId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [targetStoreCode, setTargetStoreCode] = useState('');
  const [targetSupervisorName, setTargetSupervisorName] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Add / Edit Chemical Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [productForm, setProductForm] = useState({
    itemName: '',
    category: 'Floor Care',
    unit: 'Liters',
    totalStock: 20,
    alertThreshold: 5
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Ensure default chemicals are present if catalog has <= 1 item
  useEffect(() => {
    const autoSeedIfEmpty = async () => {
      try {
        if (chemicals.length <= 1) {
          await seedStandardChemicals();
          if (onChemicalUpdated) onChemicalUpdated();
        }
      } catch (e) {
        console.warn('Chemical seed notice:', e);
      }
    };
    if (isOpen && chemicals.length <= 1) {
      autoSeedIfEmpty();
    }
  }, [isOpen, chemicals.length]);

  if (!isOpen) return null;

  // Filtered chemicals based on search
  const filteredChemicals = chemicals.filter(c => {
    if (!c) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (c.itemName || '').toLowerCase().includes(q);
    const catMatch = (c.category || '').toLowerCase().includes(q);
    return nameMatch || catMatch;
  });

  const handleOpenAddProduct = () => {
    setEditingItem(null);
    setProductForm({
      itemName: '',
      category: 'Floor Care',
      unit: 'Liters',
      totalStock: 20,
      alertThreshold: 5
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (chem) => {
    setEditingItem(chem);
    setProductForm({
      itemName: chem.itemName || '',
      category: chem.category || 'Floor Care',
      unit: chem.unit || 'Liters',
      totalStock: chem.totalStock ?? chem.quantity ?? 0,
      alertThreshold: chem.alertThreshold ?? chem.minimumThreshold ?? 5
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.itemName.trim()) {
      alert('Chemical item ka naam likhna zaroori hai.');
      return;
    }
    setIsSavingProduct(true);
    try {
      const payload = {
        ...(editingItem || {}),
        itemName: productForm.itemName.trim(),
        category: productForm.category,
        unit: productForm.unit,
        totalStock: Number(productForm.totalStock) || 0,
        alertThreshold: Number(productForm.alertThreshold) || 5
      };

      await saveChemicalStock(payload);
      if (onChemicalUpdated) onChemicalUpdated();
      setShowProductModal(false);
      alert(editingItem ? 'Chemical item successfully updated!' : 'Naya chemical product successfully catalog me add ho gaya!');
    } catch (err) {
      alert('Chemical save error: ' + err.message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteChemical = async (chem) => {
    if (!window.confirm(`Kya aap "${chem.itemName}" ko inventory catalog se permanently delete karna chahte hain?`)) {
      return;
    }
    try {
      await deleteChemicalStock(chem.id);
      if (onChemicalUpdated) onChemicalUpdated();
    } catch (err) {
      alert('Delete chemical error: ' + err.message);
    }
  };

  const handleSeedCatalog = async () => {
    setIsSeeding(true);
    try {
      await seedStandardChemicals();
      if (onChemicalUpdated) onChemicalUpdated();
      alert('Standard Blinkit dark store chemicals catalog successfully load ho gaya!');
    } catch (err) {
      alert('Seed catalog error: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    const qtyNum = Number(quantity);
    if (!selectedChemicalId || isNaN(qtyNum) || qtyNum <= 0) {
      alert('Kripya valid chemical aur quantity enter karein.');
      return;
    }

    try {
      const chem = chemicals.find(c => String(c.id) === String(selectedChemicalId));
      if (!chem) return;

      const currentStock = Number(chem.totalStock ?? chem.quantity ?? 0);

      if (actionType === 'issue' && currentStock < qtyNum) {
        alert(`Stock kam hai! Current stock sirf ${currentStock} ${chem.unit} hai.`);
        return;
      }

      const newStock = actionType === 'add' 
        ? +(currentStock + qtyNum).toFixed(2)
        : +(currentStock - qtyNum).toFixed(2);

      await saveChemicalStock({
        ...chem,
        totalStock: newStock,
        quantity: newStock
      });

      await addChemicalLog({
        chemicalId: chem.id,
        itemName: chem.itemName,
        type: actionType, // 'add' or 'issue'
        quantity: qtyNum,
        unit: chem.unit || 'Liters',
        storeCode: targetStoreCode || '',
        supervisorName: targetSupervisorName || '',
        date: new Date().toISOString(),
        notes: notes.trim()
      });

      // Reset form
      setQuantity('');
      setNotes('');
      if (onChemicalUpdated) onChemicalUpdated();
      setActiveTab('inventory');
      alert(`Chemical stock successfully updated! New balance: ${newStock} ${chem.unit}`);
    } catch (err) {
      alert('Error updating chemical: ' + err.message);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 flex items-center justify-center shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Chemical Stock &amp; Consumption Tracker</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                  {chemicals.length} Items
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track machine chemicals, degreasers, sanitizers &amp; dark store consumption
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

        {/* Global Action Toolbar */}
        <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddProduct}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Naya Chemical Add Karein</span>
            </button>

            <button
              onClick={handleSeedCatalog}
              disabled={isSeeding}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              title="Standard Blinkit Dark Store Catalog Load Karein (8 Standard Chemicals)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isSeeding ? 'Loading Catalog...' : 'Load Standard Catalog (8 Chemicals)'}</span>
            </button>
          </div>

          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Total Stock Catalog: <span className="font-bold text-slate-800 dark:text-slate-200">{chemicals.length} Types</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3">
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

        {/* Tab 1: Current Stock Inventory */}
        {activeTab === 'inventory' && (
          <div className="p-5 space-y-3 overflow-y-auto flex-1">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chemical name or category (e.g. Degreaser, TASKI, Sanitizer)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {filteredChemicals.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredChemicals.map((chem) => {
                  const stockNum = Number(chem.totalStock ?? chem.quantity ?? 0);
                  const threshold = Number(chem.alertThreshold ?? chem.minimumThreshold ?? 10);
                  const isLow = stockNum <= threshold;

                  return (
                    <div
                      key={chem.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLow
                          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
                          : 'bg-slate-50/60 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span>{chem.itemName}</span>
                          {chem.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                              {chem.category}
                            </span>
                          )}
                          {isLow && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low Stock Alert</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span>Packaging Unit: <strong className="text-slate-600 dark:text-slate-300">{chem.unit || 'Liters'}</strong></span>
                          <span>&bull;</span>
                          <span>Alert Threshold: &le; {threshold} {chem.unit || 'Liters'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                        <div className="text-left sm:text-right">
                          <div className={`text-xl font-black ${isLow ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {stockNum} <span className="text-xs font-semibold text-slate-400">{chem.unit || 'Liters'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChemicalId(chem.id);
                              setActionType('issue');
                              setActiveTab('action');
                            }}
                            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
                            title="Issue or Add Stock"
                          >
                            Issue / Add &rarr;
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(chem)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            title="Edit Item Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChemical(chem)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <div>Koi chemical item match nahi hua.</div>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleOpenAddProduct}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold"
                  >
                    + Naya Chemical Add Karein
                  </button>
                  <button
                    onClick={handleSeedCatalog}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Standard Catalog Load Karein
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Issue / Add Stock Form */}
        {activeTab === 'action' && (
          <form onSubmit={handleTransaction} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
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
                <span>- Issue to Store / Site (Kharch Huwa)</span>
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
                <span>+ Add Stock In (Supplier Se Stock Aaya)</span>
              </button>
            </div>

            {/* Select Chemical */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Chemical Item *
                </label>
                <button
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  + Add New Chemical Product
                </button>
              </div>
              <select
                required
                value={selectedChemicalId}
                onChange={(e) => setSelectedChemicalId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="">-- Choose Chemical Item --</option>
                {chemicals.map(c => {
                  const stock = Number(c.totalStock ?? c.quantity ?? 0);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.itemName} (Balance: {stock} {c.unit || 'Liters'})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quantity ({actionType === 'issue' ? 'Kitna Issue Kiya' : 'Kitna Naya Stock Aaya'}) *
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <option key={sup.id || sup.name} value={sup.name}>
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
          <div className="p-5 space-y-2 overflow-y-auto flex-1">
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className={log.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}>
                          {log.type === 'add' ? '▲ Stock Added' : '▼ Issued Out'}:
                        </span>
                        <span>{log.quantity} {log.unit || 'Liters'} &bull; {log.itemName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {log.storeCode && <span>Store: <strong>{log.storeCode}</strong> &bull; </span>}
                        {log.supervisorName && <span>Supervisor: <strong>{log.supervisorName}</strong> &bull; </span>}
                        <span>{new Date(log.date || log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {log.notes && <span className="italic block text-slate-500">"{log.notes}"</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Abhi koi chemical transactions record nahi hue hain.
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Total Items: <strong className="text-slate-700 dark:text-slate-300">{chemicals.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>

      {/* Sub-Modal: Add / Edit Chemical Product */}
      {showProductModal && (
        <div className="fixed inset-0 z-110 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-600" />
                <span>{editingItem ? 'Edit Chemical Product' : '+ Naya Chemical Catalog Item'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chemical / Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TASKI R2 Multi-Surface Floor Cleaner"
                  value={productForm.itemName}
                  onChange={(e) => setProductForm({ ...productForm, itemName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {CHEMICAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Packaging Unit
                  </label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    {PACKAGING_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {editingItem ? 'Current Stock' : 'Opening Stock Balance'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={productForm.totalStock}
                    onChange={(e) => setProductForm({ ...productForm, totalStock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Low Stock Alert At (&le;) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.alertThreshold}
                    onChange={(e) => setProductForm({ ...productForm, alertThreshold: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSavingProduct ? 'Saving...' : editingItem ? 'Save Changes' : '+ Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
