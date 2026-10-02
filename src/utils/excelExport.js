import * as XLSX from 'xlsx';
import { 
  exportMasterExcel,
  exportPendingPaymentsExcel,
  exportCompletedPaymentsExcel,
  exportAllCleaningsExcel,
  exportStorePerformanceExcel
} from './reportExcelGenerator';

// Default export generates the comprehensive multi-sheet workbook
export function exportCleaningsToExcel(cleanings, filename = 'Blinkit_DeepCleaning_Tracker.xlsx') {
  if (!cleanings || cleanings.length === 0) {
    alert('No records available to export!');
    return;
  }
  exportMasterExcel(cleanings, [], 'All Time Records', filename);
}

// Re-export dedicated sheet builders for modular access
export {
  exportMasterExcel,
  exportPendingPaymentsExcel,
  exportCompletedPaymentsExcel,
  exportAllCleaningsExcel,
  exportStorePerformanceExcel
};
