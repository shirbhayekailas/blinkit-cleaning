import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  Truck,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Plus,
  Trash2,
  Edit3,
  Share2,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  User,
  Clock,
  ClipboardCheck,
  FileText,
  RefreshCw,
  ArrowRight,
  MapPin,
  Sparkles,
  Filter,
  IndianRupee,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Package,
  Activity,
  ArrowLeftRight,
  Navigation,
  Warehouse,
  CheckSquare,
  Square,
  Receipt
} from 'lucide-react';
import {
  saveEquipment,
  recordEquipmentMovement,
  deleteEquipment,
  saveToolAllocation,
  recordToolReturn,
  deleteToolAllocation,
  saveStoreExpense,
  deleteStoreExpense,
  saveTeamDispatch,
  deleteTeamDispatch
} from '../services/api';
import { toast } from './Toast';

const STANDARD_TOOL_CATALOG = [
  { id: 't_mop', name: 'Kentucky Mop & Bucket Wringer Set', category: 'Floor Cleaning', standardQty: 2, unitPrice: 850 },
  { id: 't_wiper', name: 'Heavy Metal 24" Floor Wiper Squeegee', category: 'Floor Cleaning', standardQty: 2, unitPrice: 350 },
  { id: 't_micro', name: 'Microfiber Cleaning Duster Cloths (Pack of 6)', category: 'Dusting & Racks', standardQty: 6, unitPrice: 60 },
  { id: 't_pads', name: '17" Single Disc Scrubbing Floor Pads (Black/Red)', category: 'Machine Consumable', standardQty: 3, unitPrice: 220 },
  { id: 't_sign', name: 'Caution "Wet Floor / Slippery Surface" Signboard', category: 'Safety & Signage', standardQty: 2, unitPrice: 400 },
  { id: 't_spray', name: 'Chemical Trigger Spray Bottles 1 Liter', category: 'Chemical Dispenser', standardQty: 3, unitPrice: 90 },
  { id: 't_scraper', name: 'Heavy Duty Floor & Corner Razor Scrapers', category: 'Tools', standardQty: 2, unitPrice: 150 },
  { id: 't_wire', name: '50-Meter 16A Heavy Duty Power Extension Cable', category: 'Electrical', standardQty: 1, unitPrice: 1800 },
  { id: 't_ppe', name: 'Safety PPE Kit (Nitrile Gloves, Masks, Boots)', category: 'Safety PPE', standardQty: 4, unitPrice: 250 }
];

const EXPENSE_CATEGORIES = [
  'Conveyance & Transport',
  'Team Food & Midnight Snacks',
  'Extra Labor & Overtime Wages',
  'Machine Spares & Urgent Repairs',
  'Local Material Purchase (Emergency)',
  'Store Penalty / Escalation Cost',
  'Miscellaneous & Incidentals'
];

export default function EquipmentExpenseHubModal({
  isOpen,
  onClose,
  stores = [],
  supervisors = [],
  cleaners = [],
  cleanings = [],
  equipments = [],
  equipmentMovements = [],
  toolAllocations = [],
  storeExpenses = [],
  teamDispatches = [],
  onDataUpdated
}) {
  const { t } = useLanguage();
  // Tabs: 'dispatch' | 'fleet' | 'tools' | 'expenses' | 'history'
  const [activeTab, setActiveTab] = useState('dispatch');

  // Search & Filters for Dispatch
  const [dispatchSearch, setDispatchSearch] = useState('');
  const [dispatchDateFilter, setDispatchDateFilter] = useState('ALL');
  const [dispatchTeamFilter, setDispatchTeamFilter] = useState('ALL');

  // Search & Filters for Fleet
  const [fleetSearch, setFleetSearch] = useState('');
  const [fleetCityFilter, setFleetCityFilter] = useState('ALL');
  const [fleetStatusFilter, setFleetStatusFilter] = useState('ALL');

  // Search & Filters for Tools
  const [toolSearch, setToolSearch] = useState('');
  const [toolStatusFilter, setToolStatusFilter] = useState('ALL');

  // Search & Filters for Expenses
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCityFilter, setExpenseCityFilter] = useState('ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');

  // Dispatch modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({
    date: new Date().toISOString().split('T')[0],
    teamName: 'Team Alpha (Pune)',
    supervisorName: '',
    cleaners: '',
    storeCode: '',
    city: 'Pune',
    selectedEquipmentIds: [],
    carriedTools: STANDARD_TOOL_CATALOG.map(t => ({ name: t.name, qty: t.standardQty })),
    leftBehindItems: [],
    nextDestination: '',
    nextDate: '',
    notes: ''
  });

  // Machine sub-modal states
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineForm, setMachineForm] = useState({
    name: '',
    category: 'Single Disc Scrubber',
    brandModel: '',
    assetTag: '',
    serialNumber: '',
    currentLocationName: '',
    assignedSupervisor: '',
    status: 'Working',
    condition: 'Good',
    purchaseDate: '',
    lastServiceDate: '',
    nextServiceDue: '',
    notes: ''
  });

  const [showMoveMachineModal, setShowMoveMachineModal] = useState(false);
  const [movingMachine, setMovingMachine] = useState(null);
  const [moveForm, setMoveForm] = useState({
    targetLocationName: '',
    assignedSupervisor: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [servicingMachine, setServicingMachine] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    serviceDate: new Date().toISOString().split('T')[0],
    nextServiceDue: '',
    serviceCost: '',
    serviceCenter: '',
    status: 'Working',
    condition: 'Good',
    notes: ''
  });

  // Tools allocation modals
  const [showAllocateToolModal, setShowAllocateToolModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    storeCode: '',
    supervisorName: '',
    teamLeader: '',
    shiftDate: new Date().toISOString().split('T')[0],
    items: STANDARD_TOOL_CATALOG.map(i => ({ ...i, qtyGiven: i.standardQty })),
    remarks: ''
  });

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningAllocation, setReturningAllocation] = useState(null);
  const [returnItemsState, setReturnItemsState] = useState([]);
  const [returnInspector, setReturnInspector] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    storeCode: '',
    city: 'Pune',
    category: 'Conveyance & Transport',
    amount: '',
    paidTo: '',
    paidBy: '',
    paymentMode: 'UPI',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // TAB 0: TEAM DAILY DISPATCH & CUSTODY FILTERING
  // -------------------------------------------------------------
  const filteredDispatches = useMemo(() => {
    return (teamDispatches || []).filter(disp => {
      if (!disp) return false;
      const q = dispatchSearch.toLowerCase().trim();
      const matchSearch = !q ||
        (disp.teamName && disp.teamName.toLowerCase().includes(q)) ||
        (disp.supervisorName && disp.supervisorName.toLowerCase().includes(q)) ||
        (disp.storeCode && disp.storeCode.toLowerCase().includes(q)) ||
        (disp.storeName && disp.storeName.toLowerCase().includes(q)) ||
        (disp.city && disp.city.toLowerCase().includes(q));

      const matchDate = dispatchDateFilter === 'ALL' || disp.date === dispatchDateFilter;
      const matchTeam = dispatchTeamFilter === 'ALL' || disp.teamName === dispatchTeamFilter;

      return matchSearch && matchDate && matchTeam;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [teamDispatches, dispatchSearch, dispatchDateFilter, dispatchTeamFilter]);

  const uniqueDispatchDates = useMemo(() => {
    return Array.from(new Set((teamDispatches || []).map(d => d.date).filter(Boolean))).sort().reverse();
  }, [teamDispatches]);

  const uniqueDispatchTeams = useMemo(() => {
    return Array.from(new Set((teamDispatches || []).map(d => d.teamName).filter(Boolean))).sort();
  }, [teamDispatches]);

  // -------------------------------------------------------------
  // TAB 1: FLEET FILTERING & CALCULATIONS
  // -------------------------------------------------------------
  const filteredEquipments = useMemo(() => {
    return (equipments || []).filter(eq => {
      if (!eq) return false;
      const q = fleetSearch.toLowerCase().trim();
      const matchSearch = !q ||
        (eq.name && eq.name.toLowerCase().includes(q)) ||
        (eq.assetTag && eq.assetTag.toLowerCase().includes(q)) ||
        (eq.brandModel && eq.brandModel.toLowerCase().includes(q)) ||
        (eq.currentLocationName && eq.currentLocationName.toLowerCase().includes(q)) ||
        (eq.assignedSupervisor && eq.assignedSupervisor.toLowerCase().includes(q));

      const matchCity = fleetCityFilter === 'ALL' ||
        (eq.currentLocationName && eq.currentLocationName.toLowerCase().includes(fleetCityFilter.toLowerCase()));

      const matchStatus = fleetStatusFilter === 'ALL' || eq.status === fleetStatusFilter;

      return matchSearch && matchCity && matchStatus;
    });
  }, [equipments, fleetSearch, fleetCityFilter, fleetStatusFilter]);

  const fleetStats = useMemo(() => {
    const total = equipments.length;
    const working = equipments.filter(e => e.status === 'Working').length;
    const serviceDue = equipments.filter(e => e.status === 'Needs Service').length;
    const maintenance = equipments.filter(e => e.status === 'Maintenance').length;
    return { total, working, serviceDue, maintenance };
  }, [equipments]);

  // -------------------------------------------------------------
  // TAB 2: TOOLS ALLOCATION FILTERING
  // -------------------------------------------------------------
  const filteredToolAllocations = useMemo(() => {
    return (toolAllocations || []).filter(alloc => {
      if (!alloc) return false;
      const q = toolSearch.toLowerCase().trim();
      const matchSearch = !q ||
        (alloc.teamLeader && alloc.teamLeader.toLowerCase().includes(q)) ||
        (alloc.supervisorName && alloc.supervisorName.toLowerCase().includes(q)) ||
        (alloc.storeCode && alloc.storeCode.toLowerCase().includes(q)) ||
        (alloc.storeName && alloc.storeName.toLowerCase().includes(q));

      const matchStatus = toolStatusFilter === 'ALL' ||
        (toolStatusFilter === 'Issued' && alloc.status === 'Issued') ||
        (toolStatusFilter === 'Returned' && (alloc.status === 'Returned OK' || alloc.status === 'Returned')) ||
        (toolStatusFilter === 'Discrepancy' && alloc.status?.includes('Discrepancy'));

      return matchSearch && matchStatus;
    });
  }, [toolAllocations, toolSearch, toolStatusFilter]);

  const toolStats = useMemo(() => {
    const activeKits = toolAllocations.filter(t => t.status === 'Issued').length;
    const totalDiscrepancies = toolAllocations.filter(t => t.status?.includes('Discrepancy')).length;
    const totalLossVal = toolAllocations.reduce((sum, t) => sum + Number(t.totalFinancialLoss || 0), 0);
    return { activeKits, totalDiscrepancies, totalLossVal };
  }, [toolAllocations]);

  // -------------------------------------------------------------
  // TAB 3: STORE EXPENSES & P&L MATRIX
  // -------------------------------------------------------------
  const filteredExpenses = useMemo(() => {
    return (storeExpenses || []).filter(exp => {
      if (!exp) return false;
      const q = expenseSearch.toLowerCase().trim();
      const matchSearch = !q ||
        (exp.storeCode && exp.storeCode.toLowerCase().includes(q)) ||
        (exp.storeName && exp.storeName.toLowerCase().includes(q)) ||
        (exp.paidTo && exp.paidTo.toLowerCase().includes(q)) ||
        (exp.paidBy && exp.paidBy.toLowerCase().includes(q)) ||
        (exp.remarks && exp.remarks.toLowerCase().includes(q));

      const matchCity = expenseCityFilter === 'ALL' || exp.city === expenseCityFilter;
      const matchCategory = expenseCategoryFilter === 'ALL' || exp.category === expenseCategoryFilter;

      return matchSearch && matchCity && matchCategory;
    });
  }, [storeExpenses, expenseSearch, expenseCityFilter, expenseCategoryFilter]);

  // Real Store P&L Matrix Calculation
  const storePnLMatrix = useMemo(() => {
    const matrix = [];
    const storesMap = new Map();

    cleanings.forEach(c => {
      if (!c || !c.storeCode) return;
      const code = String(c.storeCode).toUpperCase();
      if (!storesMap.has(code)) {
        const storeObj = stores.find(s => (s.storeCode || s.code || '').toUpperCase() === code);
        storesMap.set(code, {
          storeCode: code,
          storeName: c.storeName || storeObj?.storeName || code,
          city: c.city || storeObj?.city || 'Pune',
          cleaningsCount: 0,
          totalBilled: 0,
          totalLaborCost: 0,
          totalExpenses: 0
        });
      }
      const record = storesMap.get(code);
      record.cleaningsCount += 1;
      record.totalBilled += Number(c.amount || c.billingAmount || 2500);

      if (Array.isArray(c.cleanersAssigned)) {
        c.cleanersAssigned.forEach(cln => {
          record.totalLaborCost += Number(cln.wage || 600);
        });
      } else {
        record.totalLaborCost += 1200;
      }
    });

    storeExpenses.forEach(exp => {
      if (!exp || !exp.storeCode) return;
      const code = String(exp.storeCode).toUpperCase();
      if (!storesMap.has(code)) {
        const storeObj = stores.find(s => (s.storeCode || s.code || '').toUpperCase() === code);
        storesMap.set(code, {
          storeCode: code,
          storeName: exp.storeName || storeObj?.storeName || code,
          city: exp.city || storeObj?.city || 'Pune',
          cleaningsCount: 0,
          totalBilled: 0,
          totalLaborCost: 0,
          totalExpenses: 0
        });
      }
      const record = storesMap.get(code);
      record.totalExpenses += Number(exp.amount || 0);
    });

    storesMap.forEach(item => {
      const netProfit = item.totalBilled - (item.totalLaborCost + item.totalExpenses);
      const margin = item.totalBilled > 0 ? Math.round((netProfit / item.totalBilled) * 100) : 0;
      matrix.push({
        ...item,
        netProfit,
        margin
      });
    });

    return matrix.sort((a, b) => b.totalBilled - a.totalBilled);
  }, [stores, cleanings, storeExpenses]);

  const expenseStats = useMemo(() => {
    const totalExp = storeExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const transportExp = storeExpenses.filter(e => e.category?.includes('Transport')).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const snacksExp = storeExpenses.filter(e => e.category?.includes('Snacks') || e.category?.includes('Food')).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const repairExp = storeExpenses.filter(e => e.category?.includes('Repairs') || e.category?.includes('Spares')).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return { totalExp, transportExp, snacksExp, repairExp };
  }, [storeExpenses]);

  // -------------------------------------------------------------
  // HANDLERS: TEAM DISPATCH & CUSTODY
  // -------------------------------------------------------------
  const handleOpenAddDispatch = (disp = null) => {
    if (disp) {
      setEditingDispatch(disp);
      setDispatchForm({
        date: disp.date || new Date().toISOString().split('T')[0],
        teamName: disp.teamName || 'Team Alpha (Pune)',
        supervisorName: disp.supervisorName || '',
        cleaners: Array.isArray(disp.cleaners) ? disp.cleaners.join(', ') : (disp.cleaners || ''),
        storeCode: disp.storeCode || '',
        city: disp.city || 'Pune',
        selectedEquipmentIds: (disp.carriedEquipments || []).map(e => e.id),
        carriedTools: disp.carriedTools || STANDARD_TOOL_CATALOG.map(t => ({ name: t.name, qty: t.standardQty })),
        leftBehindItems: disp.leftBehindItems || [],
        nextDestination: disp.nextDestination || '',
        nextDate: disp.nextDate || '',
        notes: disp.notes || ''
      });
    } else {
      setEditingDispatch(null);
      // Pre-select first 2 standard machines as carried
      const initialEquipIds = equipments.slice(0, 2).map(e => e.id);
      
      // Auto-compute remaining unselected machines & where they are currently placed
      const initialLeftBehind = equipments.slice(2).map(eq => ({
        id: eq.id,
        name: eq.name,
        assetTag: eq.assetTag,
        location: eq.currentLocationName || 'Central Base Hub (Navi Mumbai)',
        reason: 'Kept at Base Warehouse / Standby'
      }));

      setDispatchForm({
        date: new Date().toISOString().split('T')[0],
        teamName: 'Team Alpha (Pune)',
        supervisorName: supervisors[0]?.name || 'Rahul Shinde',
        cleaners: cleaners.slice(0, 2).map(c => c.name).join(', ') || 'Ramesh Cleaner, Suresh Valmiki',
        storeCode: stores[0]?.storeCode || stores[0]?.code || 'ES2',
        city: stores[0]?.city || 'Pune',
        selectedEquipmentIds: initialEquipIds,
        carriedTools: STANDARD_TOOL_CATALOG.map(t => ({ name: t.name, qty: t.standardQty })),
        leftBehindItems: initialLeftBehind,
        nextDestination: '',
        nextDate: '',
        notes: ''
      });
    }
    setShowDispatchModal(true);
  };

  const handleToggleEquipmentSelection = (eq) => {
    const isSelected = dispatchForm.selectedEquipmentIds.includes(eq.id);
    let newSelectedIds = [];
    if (isSelected) {
      newSelectedIds = dispatchForm.selectedEquipmentIds.filter(id => id !== eq.id);
    } else {
      newSelectedIds = [...dispatchForm.selectedEquipmentIds, eq.id];
    }

    // Auto-recalculate left behind items
    const newLeftBehind = equipments
      .filter(item => !newSelectedIds.includes(item.id))
      .map(item => {
        const existing = dispatchForm.leftBehindItems.find(lb => lb.id === item.id);
        return existing || {
          id: item.id,
          name: item.name,
          assetTag: item.assetTag,
          location: item.currentLocationName || 'Central Base Hub (Navi Mumbai)',
          reason: 'Kept at Base / Not needed for this store'
        };
      });

    setDispatchForm({
      ...dispatchForm,
      selectedEquipmentIds: newSelectedIds,
      leftBehindItems: newLeftBehind
    });
  };

  const handleUpdateLeftBehindField = (eqId, field, value) => {
    const updated = dispatchForm.leftBehindItems.map(lb => {
      if (lb.id === eqId) {
        return { ...lb, [field]: value };
      }
      return lb;
    });
    setDispatchForm({ ...dispatchForm, leftBehindItems: updated });
  };

  const handleSaveDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchForm.storeCode) {
      toast.error('Dark store select karein.');
      return;
    }
    setIsSubmitting(true);
    try {
      const storeObj = stores.find(s => (s.storeCode || s.code) === dispatchForm.storeCode);
      const storeName = storeObj ? storeObj.storeName : dispatchForm.storeCode;

      // Extract carried equipments objects
      const carriedEquipments = equipments
        .filter(eq => dispatchForm.selectedEquipmentIds.includes(eq.id))
        .map(eq => ({
          id: eq.id,
          name: eq.name,
          assetTag: eq.assetTag,
          category: eq.category
        }));

      const payload = {
        id: editingDispatch ? editingDispatch.id : undefined,
        date: dispatchForm.date,
        teamName: dispatchForm.teamName,
        supervisorName: dispatchForm.supervisorName,
        cleaners: typeof dispatchForm.cleaners === 'string'
          ? dispatchForm.cleaners.split(',').map(s => s.trim()).filter(Boolean)
          : dispatchForm.cleaners,
        storeCode: dispatchForm.storeCode,
        storeName: storeName,
        city: storeObj ? storeObj.city : dispatchForm.city,
        carriedEquipments,
        carriedTools: dispatchForm.carriedTools,
        leftBehindItems: dispatchForm.leftBehindItems,
        nextDestination: dispatchForm.nextDestination,
        nextDate: dispatchForm.nextDate,
        notes: dispatchForm.notes,
        status: 'Active'
      };

      await saveTeamDispatch(payload);
      toast.success(editingDispatch ? 'Team dispatch updated!' : 'Team route & gear custody safely recorded!');
      setShowDispatchModal(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Save dispatch failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDispatch = async (id) => {
    if (!window.confirm('Kya aap is team dispatch movement record ko delete karna chahte hain?')) return;
    try {
      await deleteTeamDispatch(id);
      toast.success('Dispatch record deleted');
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleShareDispatchWhatsApp = (disp) => {
    let text = `🚚 *SK ENTERPRISES - TEAM STORE MOVEMENT & GEAR CUSTODY*\n`;
    text += `📅 Date: ${disp.date}\n`;
    text += `👥 Team: *${disp.teamName}*\n`;
    text += `👷 Supervisor In-Charge: *${disp.supervisorName}*\n`;
    if (disp.cleaners && disp.cleaners.length > 0) {
      text += `🧹 Cleaners: ${Array.isArray(disp.cleaners) ? disp.cleaners.join(', ') : disp.cleaners}\n`;
    }
    text += `🏢 Store: *${disp.storeCode} - ${disp.storeName} (${disp.city || 'Pune'})*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `📦 *SAATH MEIN KYA LEKE GAYE (CARRIED GEAR):*\n`;
    if (disp.carriedEquipments && disp.carriedEquipments.length > 0) {
      disp.carriedEquipments.forEach(eq => {
        text += `• ✅ ${eq.name} (${eq.assetTag || 'EQ'})\n`;
      });
    } else {
      text += `• Standard basic tools only\n`;
    }

    if (disp.carriedTools && disp.carriedTools.length > 0) {
      text += `Tools: `;
      const toolsStr = disp.carriedTools.map(t => `${t.qty}x ${t.name}`).join(' | ');
      text += `${toolsStr}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏠 *JO NAHI LEKE GAYE WO KAHAN HAI (REMAINING ITEMS):*\n`;
    if (disp.leftBehindItems && disp.leftBehindItems.length > 0) {
      disp.leftBehindItems.forEach(item => {
        text += `• 📍 *${item.name}* (${item.assetTag || 'EQ'})\n`;
        text += `  Location: ${item.location || 'Central Base Hub'}\n`;
        if (item.reason) text += `  Reason: ${item.reason}\n`;
      });
    } else {
      text += `• All standard equipment active with team\n`;
    }

    if (disp.nextDestination) {
      text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `➡️ *AGLE DIN KAHAN GAYE (NEXT ROUTE):*\n`;
      text += `📅 Next Date: ${disp.nextDate || 'Next Day'}\n`;
      text += `🏢 Next Destination: *${disp.nextDestination}*\n`;
    }

    if (disp.notes) {
      text += `📝 Notes: "${disp.notes}"\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Zero-Loss Accountability Verified by SK Enterprises Operations`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // -------------------------------------------------------------
  // HANDLERS: MACHINE CRUD & MOVEMENT
  // -------------------------------------------------------------
  const handleOpenAddMachine = (eq = null) => {
    if (eq) {
      setEditingMachine(eq);
      setMachineForm({
        name: eq.name || '',
        category: eq.category || 'Single Disc Scrubber',
        brandModel: eq.brandModel || '',
        assetTag: eq.assetTag || '',
        serialNumber: eq.serialNumber || '',
        currentLocationName: eq.currentLocationName || '',
        assignedSupervisor: eq.assignedSupervisor || '',
        status: eq.status || 'Working',
        condition: eq.condition || 'Good',
        purchaseDate: eq.purchaseDate || '',
        lastServiceDate: eq.lastServiceDate || '',
        nextServiceDue: eq.nextServiceDue || '',
        notes: eq.notes || ''
      });
    } else {
      setEditingMachine(null);
      setMachineForm({
        name: '',
        category: 'Single Disc Scrubber',
        brandModel: '',
        assetTag: `EQ-${Math.floor(1000 + Math.random() * 9000)}`,
        serialNumber: '',
        currentLocationName: stores[0]?.storeName ? `${stores[0].storeCode} - ${stores[0].storeName}` : 'Central Base Hub (Navi Mumbai)',
        assignedSupervisor: supervisors[0]?.name || 'Rahul Shinde',
        status: 'Working',
        condition: 'Good',
        purchaseDate: new Date().toISOString().split('T')[0],
        lastServiceDate: new Date().toISOString().split('T')[0],
        nextServiceDue: '',
        notes: ''
      });
    }
    setShowAddMachineModal(true);
  };

  const handleSaveMachine = async (e) => {
    e.preventDefault();
    if (!machineForm.name.trim()) {
      toast.error('Machine name zaroori hai.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...machineForm,
        id: editingMachine ? editingMachine.id : undefined
      };
      await saveEquipment(payload);
      toast.success(editingMachine ? 'Machine details updated!' : 'Nayi machine fleet me add ho gayi!');
      setShowAddMachineModal(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMachine = async (id, name) => {
    if (!window.confirm(`Kya aap sure hain ki "${name}" ko fleet se delete karna chahte hain?`)) return;
    try {
      await deleteEquipment(id);
      toast.success('Machine deleted successfully');
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleOpenMoveMachine = (eq) => {
    setMovingMachine(eq);
    setMoveForm({
      targetLocationName: '',
      assignedSupervisor: eq.assignedSupervisor || supervisors[0]?.name || '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowMoveMachineModal(true);
  };

  const handleExecuteMove = async (e) => {
    e.preventDefault();
    if (!moveForm.targetLocationName) {
      toast.error('Target store ya base select karein.');
      return;
    }
    setIsSubmitting(true);
    try {
      await recordEquipmentMovement({
        equipmentId: movingMachine.id,
        toLocationName: moveForm.targetLocationName,
        assignedSupervisor: moveForm.assignedSupervisor,
        movedBy: moveForm.assignedSupervisor,
        date: moveForm.date,
        notes: moveForm.notes || `Transferred from ${movingMachine.currentLocationName} to ${moveForm.targetLocationName}`
      });
      toast.success(`Machine ${moveForm.targetLocationName} me safely transfer ho gayi!`);
      setShowMoveMachineModal(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Transfer failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenService = (eq) => {
    setServicingMachine(eq);
    setServiceForm({
      serviceDate: new Date().toISOString().split('T')[0],
      nextServiceDue: '',
      serviceCost: '',
      serviceCenter: 'Authorized Service Center (Taski/Roots)',
      status: 'Working',
      condition: 'Excellent',
      notes: 'Motor servicing, brush plate lubrication & carbon check done.'
    });
    setShowServiceModal(true);
  };

  const handleExecuteService = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updatedCost = Number(servicingMachine.serviceCostTotal || 0) + Number(serviceForm.serviceCost || 0);
      await saveEquipment({
        ...servicingMachine,
        lastServiceDate: serviceForm.serviceDate,
        nextServiceDue: serviceForm.nextServiceDue,
        status: serviceForm.status,
        condition: serviceForm.condition,
        serviceCostTotal: updatedCost,
        notes: servicingMachine.notes ? `${servicingMachine.notes}\n[Service ${serviceForm.serviceDate}]: ${serviceForm.notes}` : serviceForm.notes
      });
      toast.success('Service log recorded & machine status updated to Working!');
      setShowServiceModal(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Service log failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: TOOLS ALLOCATION & RETURN
  // -------------------------------------------------------------
  const handleOpenAllocateTool = () => {
    setAllocateForm({
      storeCode: stores[0]?.storeCode || '',
      supervisorName: supervisors[0]?.name || '',
      teamLeader: cleaners[0]?.name || '',
      shiftDate: new Date().toISOString().split('T')[0],
      items: STANDARD_TOOL_CATALOG.map(i => ({ ...i, qtyGiven: i.standardQty })),
      remarks: ''
    });
    setShowAllocateToolModal(true);
  };

  const handleExecuteAllocate = async (e) => {
    e.preventDefault();
    if (!allocateForm.teamLeader && !allocateForm.supervisorName) {
      toast.error('Team Leader ya Supervisor name darj karein.');
      return;
    }
    const storeObj = stores.find(s => (s.storeCode || s.code) === allocateForm.storeCode);
    setIsSubmitting(true);
    try {
      await saveToolAllocation({
        ...allocateForm,
        storeName: storeObj ? storeObj.storeName : allocateForm.storeCode,
        status: 'Issued',
        issuedAt: new Date().toISOString()
      });
      toast.success('Tool kit successfully team ko issue ho gaya!');
      setShowAllocateToolModal(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Allocation failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReturnModal = (alloc) => {
    setReturningAllocation(alloc);
    setReturnItemsState((alloc.items || []).map(item => ({
      ...item,
      qtyGiven: item.qtyGiven || item.standardQty || 0,
      qtyReturned: item.qtyReturned !== undefined ? item.qtyReturned : (item.qtyGiven || item.standardQty || 0),
      qtyLost: item.qtyLost || 0,
      qtyDamaged: item.qtyDamaged || 0
    })));
    setReturnInspector(alloc.supervisorName || supervisors[0]?.name || 'Supervisor');
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const handleExecuteReturn = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await recordToolReturn({
        allocationId: returningAllocation.id,
        returnedItems: returnItemsState,
        inspectorName: returnInspector,
        returnNotes: returnNotes
      });
      toast.success('Tool kit return inspection complete!');
      setShowReturnModal(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Return failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteToolAllocation = async (id) => {
    if (!window.confirm('Kya aap is tool allocation record ko delete karna chahte hain?')) return;
    try {
      await deleteToolAllocation(id);
      toast.success('Allocation record deleted');
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: STORE EXPENSES CRUD
  // -------------------------------------------------------------
  const handleOpenAddExpense = (prefillStoreCode = '', existingExp = null) => {
    if (existingExp) {
      setExpenseForm({
        id: existingExp.id,
        storeCode: existingExp.storeCode || '',
        city: existingExp.city || 'Pune',
        category: existingExp.category || 'Conveyance & Transport',
        amount: existingExp.amount || '',
        paidTo: existingExp.paidTo || '',
        paidBy: existingExp.paidBy || '',
        paymentMode: existingExp.paymentMode || 'UPI',
        date: existingExp.date || new Date().toISOString().split('T')[0],
        remarks: existingExp.remarks || ''
      });
    } else {
      const storeObj = stores.find(s => (s.storeCode || s.code) === prefillStoreCode) || stores[0];
      setExpenseForm({
        storeCode: storeObj ? (storeObj.storeCode || storeObj.code) : '',
        city: storeObj ? storeObj.city : 'Pune',
        category: 'Conveyance & Transport',
        amount: '',
        paidTo: '',
        paidBy: supervisors[0]?.name || 'Rahul Shinde (Supervisor)',
        paymentMode: 'UPI',
        date: new Date().toISOString().split('T')[0],
        remarks: ''
      });
    }
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      toast.error('Valid expense amount darj karein.');
      return;
    }
    const storeObj = stores.find(s => (s.storeCode || s.code) === expenseForm.storeCode);
    setIsSubmitting(true);
    try {
      await saveStoreExpense({
        ...expenseForm,
        storeName: storeObj ? storeObj.storeName : expenseForm.storeCode,
        city: storeObj ? storeObj.city : expenseForm.city,
        amount: Number(expenseForm.amount)
      });
      toast.success('Store expense safely recorded in cloud P&L!');
      setShowExpenseModal(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Save expense failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Kya aap is expense entry ko delete karna chahte hain?')) return;
    try {
      await deleteStoreExpense(id);
      toast.success('Expense entry deleted');
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in duration-150">

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Team Store Movement &amp; Machinery Custody Hub
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  Zero Loss &amp; Full Route Tracking
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track date-wise team store visits, carried gear, remaining base assets &amp; store P&amp;L
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs - 5 Full Modules */}
        <div className="px-5 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 shrink-0 ${
              activeTab === 'dispatch'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>🚚 Team Daily Route &amp; Gear Custody ({teamDispatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 shrink-0 ${
              activeTab === 'fleet'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>🚜 Heavy Machines Fleet ({equipments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 shrink-0 ${
              activeTab === 'tools'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>🧰 Tools &amp; Loss Recovery ({toolAllocations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 shrink-0 ${
              activeTab === 'expenses'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>💰 Store Expenses &amp; Real P&amp;L ({storeExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 shrink-0 ${
              activeTab === 'history'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>📜 Machine Movement Audit ({equipmentMovements.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-900/60">

          {/* ========================================================= */}
          {/* TAB 0: TEAM DAILY MOVEMENT & GEAR CUSTODY (CORE USER NEED) */}
          {/* ========================================================= */}
          {activeTab === 'dispatch' && (
            <div className="space-y-5">
              {/* Top Banner Guide */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span>Team-Wise Daily Store Route &amp; Gear Custody Manifest</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Roz kaunsi team kis store par gayi thi, kya leke gayi thi, agle din kahan gayi, aur jo nahi leke gayi wo kahan rakha hai!
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAddDispatch()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Dispatch Team to Store</span>
                </button>
              </div>

              {/* Filters Ribbon */}
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search team, supervisor, store, city..."
                      value={dispatchSearch}
                      onChange={(e) => setDispatchSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <select
                    value={dispatchDateFilter}
                    onChange={(e) => setDispatchDateFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="ALL">All Recorded Dates ({uniqueDispatchDates.length})</option>
                    {uniqueDispatchDates.map(d => (
                      <option key={d} value={d}>📅 Date: {d}</option>
                    ))}
                  </select>

                  <select
                    value={dispatchTeamFilter}
                    onChange={(e) => setDispatchTeamFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="ALL">All Teams</option>
                    {uniqueDispatchTeams.map(tm => (
                      <option key={tm} value={tm}>👥 {tm}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date-Wise Dispatches Chain Cards */}
              <div className="space-y-4">
                {filteredDispatches.map((disp) => {
                  return (
                    <div
                      key={disp.id}
                      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:shadow-md transition space-y-4"
                    >
                      {/* Card Header: Date, Store & Team */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-xs">
                              📅 {disp.date}
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {disp.storeCode} - {disp.storeName}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                              {disp.city || 'Hub'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 pt-0.5">
                            <span>👥 Team: <strong className="text-slate-800 dark:text-slate-200">{disp.teamName}</strong></span>
                            <span>👤 Supervisor: <strong className="text-slate-800 dark:text-slate-200">{disp.supervisorName}</strong></span>
                            {disp.cleaners && disp.cleaners.length > 0 && (
                              <span>🧹 Cleaners: {Array.isArray(disp.cleaners) ? disp.cleaners.join(', ') : disp.cleaners}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => handleShareDispatchWhatsApp(disp)}
                            className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                            title="Share complete daily gear manifest on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>WhatsApp Gear Slip</span>
                          </button>

                          <button
                            onClick={() => handleOpenAddDispatch(disp)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
                            title="Edit dispatch details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteDispatch(disp.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 2 Grid Columns: What They Carried vs Where Remaining Items Are Kept */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* SECTION A: SAATH MEIN KYA LEKE GAYE */}
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-3.5 space-y-2.5">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-xs uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Saath Mein Kya Leke Gaye (Carried With Team)</span>
                          </div>

                          {/* Machines List */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Heavy Machines:</span>
                            {disp.carriedEquipments && disp.carriedEquipments.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {disp.carriedEquipments.map((eq, i) => (
                                  <span key={i} className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1 shadow-2xs">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>{eq.name}</span>
                                    <span className="text-[10px] font-mono text-emerald-700">({eq.assetTag})</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No heavy machines with this dispatch</span>
                            )}
                          </div>

                          {/* Tools List */}
                          <div className="space-y-1 pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Tools &amp; Consumables:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(disp.carriedTools || []).map((t, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                                  {t.qty}x {t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* SECTION B: JO NAHI LEKE GAYE WO KAHAN RAKHA HAI */}
                        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl p-3.5 space-y-2.5">
                          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-xs uppercase tracking-wider">
                            <Warehouse className="w-4 h-4 text-amber-600" />
                            <span>Jo Nahi Leke Gaye Wo Kahan Rakha Hai (Remaining Assets)</span>
                          </div>

                          <div className="space-y-2">
                            {disp.leftBehindItems && disp.leftBehindItems.length > 0 ? (
                              disp.leftBehindItems.map((item, i) => (
                                <div key={i} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 text-xs">
                                  <div className="flex items-center justify-between gap-1 font-bold text-slate-900 dark:text-white">
                                    <span>{item.name}</span>
                                    <span className="text-[10px] font-mono text-amber-700">{item.assetTag}</span>
                                  </div>
                                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>Location: {item.location || 'Central Base Hub'}</span>
                                  </div>
                                  {item.reason && (
                                    <div className="text-[10px] text-slate-400 italic mt-0.5">
                                      Reason: "{item.reason}"
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="p-2 text-center text-xs text-slate-400 italic">
                                All fleet machines are deployed on duty.
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* SECTION C: DUSRE DIN KAHAN GAYE (NEXT ROUTE CHAIN) */}
                      {disp.nextDestination && (
                        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-indigo-600" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              Agle Din Kahan Gaye (Next Destination):
                            </span>
                            <span className="font-black text-indigo-900 dark:text-indigo-200">
                              {disp.nextDestination} {disp.nextDate ? `(📅 ${disp.nextDate})` : ''}
                            </span>
                          </div>
                          {disp.notes && (
                            <span className="text-[11px] text-slate-500 italic hidden sm:inline">
                              "{disp.notes}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredDispatches.length === 0 && (
                  <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                    <Navigation className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Koi Team Dispatch Route Record Nahi Mila
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Roz team kis store par gayi aur kya kya gear saath leke gayi uska record yahan darj karein.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenAddDispatch()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                    >
                      + First Team Dispatch Record Karein
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: HEAVY MACHINERY FLEET                              */}
          {/* ========================================================= */}
          {activeTab === 'fleet' && (
            <div className="space-y-5">
              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Fleet</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{fleetStats.total} Units</div>
                  <span className="text-[10px] text-slate-500">Scrubbers, Vacuums, Jets</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Working / Active</span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{fleetStats.working} Ready</div>
                  <span className="text-[10px] text-slate-500">De-scaled &amp; motor safe</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Service Due</span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{fleetStats.serviceDue} Alerts</div>
                  <span className="text-[10px] text-slate-500">Routine maintenance due</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-xs">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Under Maintenance</span>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{fleetStats.maintenance} Units</div>
                  <span className="text-[10px] text-slate-500">Service workshop breakdown</span>
                </div>
              </div>

              {/* Action Ribbon & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search machine, model, asset tag, store..."
                      value={fleetSearch}
                      onChange={(e) => setFleetSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <select
                    value={fleetCityFilter}
                    onChange={(e) => setFleetCityFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="ALL">All Cities &amp; Hubs</option>
                    <option value="Pune">Pune Stores</option>
                    <option value="Mumbai">Mumbai Stores</option>
                    <option value="Navi Mumbai">Navi Mumbai Stores</option>
                    <option value="Central Base">Central Base Hub</option>
                  </select>

                  <select
                    value={fleetStatusFilter}
                    onChange={(e) => setFleetStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="ALL">All Status</option>
                    <option value="Working">Working Ready</option>
                    <option value="Needs Service">Needs Service</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddMachine()}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Machine</span>
                  </button>
                </div>
              </div>

              {/* Machine Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEquipments.map((eq) => {
                  const isWorking = eq.status === 'Working';
                  const isNeedsService = eq.status === 'Needs Service';

                  return (
                    <div
                      key={eq.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4.5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Tag & Status */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-[11px] font-black text-slate-800 dark:text-slate-200">
                              {eq.assetTag || 'EQ-TAG'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
                              {eq.category || 'Machinery'}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 text-[10px] font-black rounded-md flex items-center gap-1 ${
                              isWorking
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : isNeedsService
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                            }`}
                          >
                            {isWorking ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {eq.status}
                          </span>
                        </div>

                        {/* Machine Name & Model */}
                        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                          {eq.name}
                        </h4>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {eq.brandModel || 'Industrial Grade'}
                        </div>

                        {/* Location Box (CRITICAL ZERO-LOSS FEATURE) */}
                        <div className="mt-3.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                              Abhi Kahan Rakhi Hai (Current Location):
                            </span>
                            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {eq.currentLocationName || 'Central Base Hub'}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3" />
                              <span>In-charge: {eq.assignedSupervisor || 'Akash Jadhav'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Service & Details Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Last Service</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {eq.lastServiceDate || 'Not recorded'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Next Service Due</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {eq.nextServiceDue || 'Within 60 days'}
                            </span>
                          </div>
                        </div>

                        {eq.notes && (
                          <p className="mt-2 text-[10px] italic text-slate-400 truncate">
                            "{eq.notes}"
                          </p>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenMoveMachine(eq)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition shadow-xs"
                          title="Transfer machine to another dark store or base"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Move / Transfer</span>
                        </button>

                        <button
                          onClick={() => handleOpenService(eq)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                          title="Record service / maintenance"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenAddMachine(eq)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                          title="Edit details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteMachine(eq.id, eq.name)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredEquipments.length === 0 && (
                  <div className="col-span-full p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                    <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Koi Heavy Machine ya Equipment Darj Nahi Hai
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Single disc scrubbers, vacuums, ladders ko system me add karke unka location track karein.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenAddMachine()}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
                    >
                      + First Heavy Machine Register Karein
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: TEAM TOOLS & CONSUMABLES ALLOCATION                */}
          {/* ========================================================= */}
          {activeTab === 'tools' && (
            <div className="space-y-5">
              {/* Tool Stats Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 shadow-xs">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Active Kits On Duty</span>
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{toolStats.activeKits} Teams Deployed</div>
                  <span className="text-[10px] text-slate-500">Mops, wipers, cables issued</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Loss / Discrepancy Cases</span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{toolStats.totalDiscrepancies} Incidents</div>
                  <span className="text-[10px] text-slate-500">Items gum ya damage hue</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-xs">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Total Financial Loss (₹)</span>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">₹{toolStats.totalLossVal.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-500">Accountability recovery amount</span>
                </div>
              </div>

              {/* Action Ribbon & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search supervisor, team leader, store code..."
                      value={toolSearch}
                      onChange={(e) => setToolSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <select
                    value={toolStatusFilter}
                    onChange={(e) => setToolStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="ALL">All Status</option>
                    <option value="Issued">Active (Issued to Team)</option>
                    <option value="Returned">Returned OK (100% Safe)</option>
                    <option value="Discrepancy">Discrepancy (Loss / Damage)</option>
                  </select>
                </div>

                <button
                  onClick={handleOpenAllocateTool}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Issue Tool Kit to Team</span>
                </button>
              </div>

              {/* Tool Allocations List */}
              <div className="space-y-3">
                {filteredToolAllocations.map((alloc) => {
                  const isIssued = alloc.status === 'Issued';
                  const hasDiscrepancy = alloc.status?.includes('Discrepancy');

                  return (
                    <div
                      key={alloc.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {alloc.storeName || alloc.storeCode}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-black rounded-md ${
                                isIssued
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                  : hasDiscrepancy
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              }`}
                            >
                              {alloc.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                            <span>📅 Date: {alloc.shiftDate || alloc.issuedAt?.split('T')[0]}</span>
                            <span>👤 Supervisor: {alloc.supervisorName}</span>
                            <span>👥 Team Leader: {alloc.teamLeader}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isIssued && (
                            <button
                              onClick={() => handleOpenReturnModal(alloc)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>Inspect &amp; Return</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteToolAllocation(alloc.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 transition"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items Table in allocation */}
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700">
                              <th className="py-1.5 pr-2">Tool / Consumable Item</th>
                              <th className="py-1.5 px-2 text-center">Given</th>
                              <th className="py-1.5 px-2 text-center">Returned</th>
                              <th className="py-1.5 px-2 text-center text-rose-600">Lost (Gum)</th>
                              <th className="py-1.5 px-2 text-center text-amber-600">Damaged</th>
                              <th className="py-1.5 pl-2 text-right">Loss Cost (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {(alloc.items || []).map((it, idx) => {
                              const lost = Number(it.qtyLost || 0);
                              const dmg = Number(it.qtyDamaged || 0);
                              const lossCost = Number(it.totalLossCost || (lost * (it.unitPrice || 0)));

                              return (
                                <tr key={idx} className={lost > 0 || dmg > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}>
                                  <td className="py-1.5 pr-2 font-medium text-slate-800 dark:text-slate-200">
                                    {it.name}
                                  </td>
                                  <td className="py-1.5 px-2 text-center font-bold">{it.qtyGiven || it.standardQty || 0}</td>
                                  <td className="py-1.5 px-2 text-center font-bold text-emerald-600">
                                    {it.qtyReturned !== undefined ? it.qtyReturned : '-'}
                                  </td>
                                  <td className="py-1.5 px-2 text-center font-bold text-rose-600">
                                    {lost > 0 ? lost : 0}
                                  </td>
                                  <td className="py-1.5 px-2 text-center font-bold text-amber-600">
                                    {dmg > 0 ? dmg : 0}
                                  </td>
                                  <td className="py-1.5 pl-2 text-right font-bold text-slate-900 dark:text-white">
                                    {lossCost > 0 ? `₹${lossCost}` : '₹0'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                {filteredToolAllocations.length === 0 && (
                  <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                    <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Koi Active Tool Kit Allocation Nahi Hai
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Cleaning team ko wipers, mops, extension cables issue karke loss aur damage track karein.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenAllocateTool()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                    >
                      + Allocate Tool Kit to Team
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: STORE-WISE EXPENSES & REAL P&L MATRIX              */}
          {/* ========================================================= */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Expense KPI Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Store Expenses</span>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">₹{expenseStats.totalExp.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-500">Conveyance, snacks, spares</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/40 shadow-xs">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Tempo &amp; Transport</span>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">₹{expenseStats.transportExp.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-500">Machine tempo movement</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Night Food &amp; Snacks</span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">₹{expenseStats.snacksExp.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-500">Tea &amp; midnight meals</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-900/40 shadow-xs">
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Machine Repairs &amp; Spares</span>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">₹{expenseStats.repairExp.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-500">Store site repairs</span>
                </div>
              </div>

              {/* SECTION: STORE-WISE P&L MATRIX */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>Dark Store Operational P&amp;L Matrix (Real Net Margin)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Revenue Billed vs Cleaner Wages vs Store Direct Expenses = Asli Net Munafa per store
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenAddExpense()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Store Expense</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[11px] font-black uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850">
                        <th className="py-2.5 px-3">Dark Store &amp; City</th>
                        <th className="py-2.5 px-2 text-center">Cleanings</th>
                        <th className="py-2.5 px-2 text-right">Billed Revenue</th>
                        <th className="py-2.5 px-2 text-right text-amber-600">Labor Cost</th>
                        <th className="py-2.5 px-2 text-right text-rose-600">Store Direct Exp</th>
                        <th className="py-2.5 px-2 text-right font-black text-emerald-600">Net Profit (₹)</th>
                        <th className="py-2.5 px-3 text-center">Net Margin %</th>
                        <th className="py-2.5 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                      {storePnLMatrix.map((item, idx) => {
                        const isProfitable = item.netProfit >= 0;
                        const isHighMargin = item.margin >= 45;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {item.storeCode} - {item.storeName}
                              </div>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {item.city}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-bold">
                              {item.cleaningsCount}
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-slate-900 dark:text-white">
                              ₹{item.totalBilled.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-amber-600">
                              ₹{item.totalLaborCost.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-rose-600">
                              ₹{item.totalExpenses.toLocaleString('en-IN')}
                            </td>
                            <td className={`py-3 px-2 text-right font-black ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                              ₹{item.netProfit.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                  isHighMargin
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    : item.margin > 20
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                }`}
                              >
                                {item.margin}%
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() => handleOpenAddExpense(item.storeCode)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition"
                              >
                                + Exp
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION: INDIVIDUAL RECORDED EXPENSE ENTRIES */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-rose-500" />
                      <span>Recorded Expense Vouchers &amp; Receipts ({filteredExpenses.length})</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Store direct expenses for tempo conveyance, snacks, repairs with bill details
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <select
                      value={expenseCategoryFilter}
                      onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Conveyance & Transport">Conveyance & Transport</option>
                      <option value="Team Food & Midnight Snacks">Food & Snacks</option>
                      <option value="Machine Repair & Maintenance">Repairs & Maintenance</option>
                      <option value="Emergency Purchase & Consumables">Emergency Purchase</option>
                      <option value="Miscellaneous / Other">Miscellaneous</option>
                    </select>
                  </div>
                </div>

                {filteredExpenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[11px] font-black uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Store</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Paid To / Paid By</th>
                          <th className="py-2.5 px-3">Mode</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                        {filteredExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                              📅 {exp.date}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {exp.storeCode} - {exp.storeName}
                              </span>
                              <span className="text-[10px] text-slate-400">{exp.city || 'Hub'}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[10px]">
                                {exp.category}
                              </span>
                              {exp.remarks && (
                                <p className="text-[10px] text-slate-400 italic mt-0.5 max-w-xs truncate">
                                  "{exp.remarks}"
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-slate-800 dark:text-slate-200 font-bold block">{exp.paidTo || '-'}</span>
                              <span className="text-[10px] text-slate-400">By: {exp.paidBy || '-'}</span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                                {exp.paymentMode || 'UPI'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-rose-600 text-sm whitespace-nowrap">
                              ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenAddExpense(exp.storeCode, exp)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 transition"
                                  title="Edit Expense"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Koi Expense Voucher Darj Nahi Hai
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Tempo transport, midnight snacks, ya repair bills record karne ke liye upar "+ Add Store Expense" par click karein.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: MOVEMENT & AUDIT LOG                               */}
          {/* ========================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs">
                <div className="mb-4">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span>Machinery Transfer &amp; Relocation Audit Log</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Which machine was transferred from Pune to Mumbai or Dark Store to Base
                  </p>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {equipmentMovements.map((mov, idx) => (
                    <div key={mov.id || idx} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-white dark:ring-slate-800" />
                      <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-1.5">
                          <span className="font-black text-slate-900 dark:text-white">
                            {mov.equipmentName} ({mov.assetTag || 'EQ'})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            📅 {mov.date || mov.timestamp?.split('T')[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {mov.fromLocation}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
                            {mov.toLocation}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                          <span>Moved By: <strong>{mov.movedBy || 'Supervisor'}</strong></span>
                          {mov.notes && <span className="italic text-slate-400">"{mov.notes}"</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <span>100% Zero Loss &amp; Real-Time Inventory Control Enabled</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition"
          >
            Close Hub
          </button>
        </div>

      </div>

      {/* ========================================================= */}
      {/* SUB-MODAL: DISPATCH TEAM TO STORE (RECORD MOVEMENT & GEAR)*/}
      {/* ========================================================= */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-110 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-600" />
                <span>{editingDispatch ? 'Edit Team Dispatch' : 'Dispatch Team & Record Gear Custody'}</span>
              </h4>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dispatchForm.date}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Team Alpha (Pune)"
                    value={dispatchForm.teamName}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, teamName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supervisor In-Charge *
                  </label>
                  <select
                    value={dispatchForm.supervisorName}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, supervisorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    {supervisors.map(s => (
                      <option key={s.id || s.phone} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Dark Store *
                  </label>
                  <select
                    required
                    value={dispatchForm.storeCode}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, storeCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    {stores.map(s => (
                      <option key={s.id || s.code} value={s.storeCode || s.code}>
                        {s.storeCode || s.code} - {s.storeName} ({s.city || 'Pune'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cleaners on Team (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Cleaner, Suresh Valmiki"
                    value={dispatchForm.cleaners}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, cleaners: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Heavy Machines Selection Checkboxes */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <label className="block font-black text-emerald-900 dark:text-emerald-300 mb-2 uppercase tracking-wider text-[11px]">
                  1. Saath Mein Konsi Machines Leke Ja Rahe Hain? (Select Carried Machines):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {equipments.map(eq => {
                    const isChecked = dispatchForm.selectedEquipmentIds.includes(eq.id);
                    return (
                      <div
                        key={eq.id}
                        onClick={() => handleToggleEquipmentSelection(eq)}
                        className={`p-2 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{eq.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{eq.assetTag}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {isChecked ? 'Carried' : 'Remaining'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remaining Gear Storage Tracker */}
              {dispatchForm.leftBehindItems.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
                  <label className="block font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[11px]">
                    2. Jo Items Team Saath Nahi Leke Gayi, Wo Kahan Rakhe Hain? (Storage Location):
                  </label>
                  <div className="space-y-2">
                    {dispatchForm.leftBehindItems.map(lb => (
                      <div key={lb.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <strong className="text-xs text-slate-900 dark:text-white block">{lb.name} ({lb.assetTag})</strong>
                          <span className="text-[10px] text-slate-400">Current Storage Place:</span>
                          <input
                            type="text"
                            value={lb.location}
                            onChange={(e) => handleUpdateLeftBehindField(lb.id, 'location', e.target.value)}
                            placeholder="e.g. Central Base Hub (Navi Mumbai) Bay 2 or Stored at Store Room"
                            className="w-full mt-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-amber-700"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Reason / Why Left Behind:</span>
                          <input
                            type="text"
                            value={lb.reason}
                            onChange={(e) => handleUpdateLeftBehindField(lb.id, 'reason', e.target.value)}
                            placeholder="e.g. Not needed for vinyl cleaning / Reserved for Mumbai"
                            className="w-full mt-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Store Destination (DUSRE DIN KAHAN GAYE) */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <label className="block font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider text-[11px]">
                  3. Phir Dusre Din Kahan Gaye? (Next Destination Store &amp; Date):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. Blinkit Dark Store - Baner (Pune)"
                      value={dispatchForm.nextDestination}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, nextDestination: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={dispatchForm.nextDate}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, nextDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tempo / Vehicle &amp; Shift Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Machines transported via Tempo MH-12. All cords checked."
                  value={dispatchForm.notes}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Dispatch Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: ADD MACHINE */}
      {showAddMachineModal && (
        <div className="fixed inset-0 z-110 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" />
                <span>{editingMachine ? 'Edit Machine Details' : 'Add New Machine to Fleet'}</span>
              </h4>
              <button
                onClick={() => setShowAddMachineModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMachine} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Machine Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taski Ergodisc 165 Single Disc Scrubber"
                  value={machineForm.name}
                  onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={machineForm.category}
                    onChange={(e) => setMachineForm({ ...machineForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Single Disc Scrubber">Single Disc Scrubber</option>
                    <option value="Wet & Dry Vacuum Cleaner">Wet &amp; Dry Vacuum Cleaner</option>
                    <option value="High Pressure Jet Washer">High Pressure Jet Washer</option>
                    <option value="Heavy Step Ladder">Heavy Step Ladder</option>
                    <option value="Carpet Extractor">Carpet Extractor</option>
                    <option value="Other Heavy Equipment">Other Heavy Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Asset Tag / QR Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EQ-SCRUB-01"
                    value={machineForm.assetTag}
                    onChange={(e) => setMachineForm({ ...machineForm, assetTag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Brand &amp; Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Diversey Taski / Roots"
                    value={machineForm.brandModel}
                    onChange={(e) => setMachineForm({ ...machineForm, brandModel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Location (Store / Base) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ES2 Kothrud or Central Base"
                    value={machineForm.currentLocationName}
                    onChange={(e) => setMachineForm({ ...machineForm, currentLocationName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-amber-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMachineModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition"
                >
                  {isSubmitting ? 'Saving...' : 'Save Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: MOVE MACHINE */}
      {showMoveMachineModal && movingMachine && (
        <div className="fixed inset-0 z-110 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                <span>Move Machine to Another Dark Store</span>
              </h4>
              <button
                onClick={() => setShowMoveMachineModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteMove} className="space-y-3.5 text-xs mt-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Dark Store / Warehouse *
                </label>
                <select
                  required
                  value={moveForm.targetLocationName}
                  onChange={(e) => setMoveForm({ ...moveForm, targetLocationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                >
                  <option value="">Select Destination Store...</option>
                  <option value="Central Base Hub (Navi Mumbai)">Central Base Hub (Navi Mumbai)</option>
                  <option value="Central Base Hub (Pune)">Central Base Hub (Pune)</option>
                  {stores.map(s => {
                    const label = `${s.storeCode || s.code} - ${s.storeName} (${s.city || 'Pune'})`;
                    return (
                      <option key={s.id || s.code} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMoveMachineModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition"
                >
                  {isSubmitting ? 'Transferring...' : 'Execute Move'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: LOG EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-110 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-500" />
                <span>Record Store Expense</span>
              </h4>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dark Store *
                </label>
                <select
                  required
                  value={expenseForm.storeCode}
                  onChange={(e) => setExpenseForm({ ...expenseForm, storeCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                >
                  {stores.map(s => (
                    <option key={s.id || s.code} value={s.storeCode || s.code}>
                      {s.storeCode || s.code} - {s.storeName} ({s.city || 'Pune'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Category *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 800"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
