import { db } from '../db/db';

/**
 * Extracts friendly device, operating system, and browser information.
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined' || !navigator) {
    return 'Unknown Device';
  }

  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || 
    (window.innerWidth && window.innerWidth < 768);

  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  let os = 'OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return `${isMobile ? '📱 Mobile' : '💻 Desktop'} • ${os} (${browser})`;
}

/**
 * Records a login event into Dexie loginLogs table.
 */
export async function logUserLogin({ role, userName, loginId, status = 'Success', notes = '' }) {
  try {
    const entry = {
      role, // 'admin' | 'manager' | 'supervisor' | 'client' | 'unknown'
      userName: userName || 'User',
      loginId: loginId || 'N/A',
      status, // 'Success' | 'Failed'
      notes: notes || '',
      device: getDeviceInfo(),
      timestamp: new Date().toISOString()
    };

    if (db.loginLogs) {
      await db.loginLogs.add(entry);
    }
    return entry;
  } catch (err) {
    console.warn('Audit logger warning:', err);
    return null;
  }
}

/**
 * Exports login logs to CSV file for download.
 */
export function exportLoginLogsToCSV(logs = []) {
  if (!logs || logs.length === 0) {
    alert('No login logs available to export.');
    return;
  }

  const headers = ['ID', 'Date & Time', 'Role', 'User Name', 'Login ID', 'Status', 'Device / Platform', 'Notes'];
  const rows = logs.map(l => [
    l.id || '',
    l.timestamp ? new Date(l.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
    (l.role || '').toUpperCase(),
    `"${(l.userName || '').replace(/"/g, '""')}"`,
    `"${(l.loginId || '').replace(/"/g, '""')}"`,
    l.status || 'Success',
    `"${(l.device || '').replace(/"/g, '""')}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Blinkit_Login_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
