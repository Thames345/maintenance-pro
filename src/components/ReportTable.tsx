import React, { useState } from 'react';
import { MaintenanceRecord, TaskStatus } from '../types';
import { ChevronLeft, ChevronRight, Eye, AlertCircle } from '../icons';
import { AppIcon, taskStatusIcon } from './AppIcon';

interface ReportTableProps {
  records: MaintenanceRecord[];
  allRecordsCount: number;
  reportTitle?: string;
  reportSubtitle?: string;
  onSelectRecord: (record: MaintenanceRecord) => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  records,
  allRecordsCount,
  reportTitle = 'รายงานประวัติงาน PM',
  reportSubtitle = 'ข้อมูล ณ 24 ต.ค. 2566 · แผนก MVR, MSR และ MVR-LOTUS',
  onSelectRecord
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedRecords = records.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <AppIcon name={taskStatusIcon(status)} className="w-4 h-4"/>
            เสร็จสิ้น
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AppIcon name={taskStatusIcon(status)} className="w-4 h-4"/>
            เกินกำหนด
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AppIcon name={taskStatusIcon(status)} className="w-4 h-4"/>
            รอตรวจรับ
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <AppIcon name={taskStatusIcon(status)} className="w-4 h-4"/>
            กำลังดำเนินการ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <AppIcon name={taskStatusIcon(status)} className="w-4 h-4"/>
            รอดำเนินการ
          </span>
        );
    }
  };

  const getDeptBadgeClass = (dept: string) => {
    switch (dept) {
      case 'MVR':
        return 'bg-zinc-800 text-indigo-300 border border-zinc-700';
      case 'MSR':
        return 'bg-zinc-800 text-emerald-300 border border-zinc-700';
      case 'LOTUS':
        return 'bg-zinc-800 text-amber-300 border border-zinc-700';
      case 'MVR-LOTUS':
        return 'bg-zinc-800 text-violet-300 border border-zinc-700';
      default:
        return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
    }
  };

  return (
    <div className="bg-[#18181B] rounded-[2rem] shadow-2xl border border-zinc-800 p-6 md:p-8 min-h-[560px] flex flex-col justify-between">
      <div>
        {/* Document Header */}
        <div className="text-center mb-6 pb-5 border-b border-zinc-800">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Official Maintenance Record</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {reportTitle}
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1.5 font-normal">
            {reportSubtitle}
          </p>
        </div>

        {/* Table Content */}
        <div className="table-container overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">เลขที่งาน</th>
                <th className="py-3.5 px-4">เครื่องจักร</th>
                <th className="py-3.5 px-4">รายการ</th>
                <th className="py-3.5 px-4">ผู้ปฏิบัติงาน</th>
                <th className="py-3.5 px-4">Checklist</th>
                <th className="py-3.5 px-4 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="text-sm text-zinc-300 divide-y divide-zinc-800/60">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-zinc-500" />
                    <p className="font-semibold text-zinc-300">ไม่พบข้อมูลที่ตรงกับตัวกรอง</p>
                    <p className="text-xs text-zinc-500 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองวันที่/แผนก</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onSelectRecord(r)}
                    className="hover:bg-zinc-900/90 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-zinc-100 group-hover:text-indigo-400 flex items-center gap-1.5 font-mono text-xs sm:text-sm">
                      <span>{r.taskNumber}</span>
                      <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${getDeptBadgeClass(r.department)}`}>
                          {r.department}
                        </span>
                        <span className="font-mono text-xs text-zinc-200">{r.machineCode}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-200 max-w-[240px] truncate" title={r.title}>
                      {r.title}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-medium">
                      {r.technician}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.checklistAbnormal > 0 ? (
                        <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-xs">
                          {r.checklistCompleted}/{r.checklistTotal} · ผิดปกติ {r.checklistAbnormal}
                        </span>
                      ) : (
                        <span className="font-medium text-zinc-400 text-xs">
                          {r.checklistCompleted}/{r.checklistTotal}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {getStatusBadge(r.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Pagination Footer */}
      <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 no-print">
        <div className="font-medium">
          หน้า <span className="text-white font-bold">{validCurrentPage}</span> จาก {totalPages} (แสดง {paginatedRecords.length} จาก {records.length} รายการที่กรอง | รวมทั้งหมด {allRecordsCount} งาน)
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={validCurrentPage === 1}
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors text-zinc-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  validCurrentPage === page
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_2px_10px_rgba(99,102,241,0.3)]'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white bg-zinc-900/60 border border-zinc-800'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={validCurrentPage === totalPages}
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors text-zinc-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
