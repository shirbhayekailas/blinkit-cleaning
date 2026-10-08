import * as XLSX from 'xlsx';
import { toast } from '../components/Toast';
import { 
  exportMasterExcel,
  exportPendingPaymentsExcel,
  exportCompletedPaymentsExcel,
  exportAllCleaningsExcel,
  exportStorePerformanceExcel
} from './reportExcelGenerator';

// Default export generates the comprehensive multi-sheet workbook
export function exportCleaningsToExcel(cleanings, filename = 'Blinkit_DeepCleaning_Tracker.xlsx', stores = [], filterLabel = 'All Time Records') {
  if (!cleanings || cleanings.length === 0) {
    toast.warning('No records available to export!', 'No Records');
    return;
  }
  exportMasterExcel(cleanings, stores, filterLabel, filename);
}

// Re-export dedicated sheet builders for modular access
export {
  exportMasterExcel,
  exportPendingPaymentsExcel,
  exportCompletedPaymentsExcel,
  exportAllCleaningsExcel,
  exportStorePerformanceExcel
};
