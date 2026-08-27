import { MaintenanceRecord } from '../types';

export function exportToCSV(records: MaintenanceRecord[], filename = 'รายงานประวัติงาน_PM.csv') {
  const headers = ['เลขที่งาน', 'แผนก', 'รหัสเครื่องจักร', 'ชื่อเครื่องจักร', 'รายการซ่อมบำรุง', 'ผู้ปฏิบัติงาน', 'Checklist ผ่าน', 'Checklist ทั้งหมด', 'พบสิ่งผิดปกติ', 'สถานะ', 'วันที่นัดหมาย', 'วันที่เสร็จสิ้น', 'หมายเหตุ'];
  
  const statusThaiMap: Record<string, string> = {
    approved: 'เสร็จสิ้น',
    overdue: 'เกินกำหนด',
    submitted: 'รอตรวจรับ',
    in_progress: 'กำลังดำเนินการ',
    pending: 'รอดำเนินการ'
  };

  const rows = records.map(r => [
    `"${r.taskNumber}"`,
    `"${r.department}"`,
    `"${r.machineCode}"`,
    `"${r.machineName || ''}"`,
    `"${r.title.replace(/"/g, '""')}"`,
    `"${r.technician}"`,
    r.checklistCompleted,
    r.checklistTotal,
    r.checklistAbnormal,
    `"${statusThaiMap[r.status] || r.status}"`,
    `"${r.scheduledDate}"`,
    `"${r.completedDate || '-'}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(records: MaintenanceRecord[], filename = 'รายงานประวัติงาน_PM.xls') {
  const statusThaiMap: Record<string, string> = {
    approved: 'เสร็จสิ้น',
    overdue: 'เกินกำหนด',
    submitted: 'รอตรวจรับ',
    in_progress: 'กำลังดำเนินการ',
    pending: 'รอดำเนินการ'
  };

  const rowsHtml = records.map(r => `
    <tr>
      <td>${r.taskNumber}</td>
      <td>${r.department}</td>
      <td>${r.machineCode}</td>
      <td>${r.machineName || ''}</td>
      <td>${r.title}</td>
      <td>${r.technician}</td>
      <td>${r.checklistCompleted}/${r.checklistTotal} ${r.checklistAbnormal > 0 ? `(ผิดปกติ ${r.checklistAbnormal})` : ''}</td>
      <td>${statusThaiMap[r.status] || r.status}</td>
      <td>${r.scheduledDate}</td>
      <td>${r.completedDate || '-'}</td>
      <td>${r.notes || ''}</td>
    </tr>
  `).join('');

  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>PM_Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Sarabun, sans-serif; }
        th { background-color: #4648d4; color: white; border: 1px solid #c7c4d7; padding: 8px; text-align: left; font-weight: bold; }
        td { border: 1px solid #e5eeff; padding: 6px 8px; text-align: left; }
        tr:nth-child(even) { background-color: #f8f9ff; }
      </style>
    </head>
    <body>
      <h2 style="color: #4648d4;">Maintenance Pro - รายงานประวัติงาน PM</h2>
      <p>ข้อมูล ณ วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')}</p>
      <table>
        <thead>
          <tr>
            <th>เลขที่งาน</th>
            <th>แผนก</th>
            <th>รหัสเครื่องจักร</th>
            <th>ชื่อเครื่องจักร</th>
            <th>รายการ</th>
            <th>ผู้ปฏิบัติงาน</th>
            <th>Checklist</th>
            <th>สถานะ</th>
            <th>วันที่นัดหมาย</th>
            <th>วันที่เสร็จสิ้น</th>
            <th>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printPDFReport() {
  window.print();
}
