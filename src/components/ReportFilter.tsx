import React from 'react';
import { Search, ChevronDown, FileSpreadsheet, FileCode2, FileText, RotateCcw } from '../icons';
import { FilterState } from '../types';

interface ReportFilterProps {
  filter: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilter: () => void;
  onApplyFilter: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  departments: string[];
}

export const ReportFilter: React.FC<ReportFilterProps> = ({
  filter,
  onFilterChange,
  onResetFilter,
  onApplyFilter,
  onExportExcel,
  onExportCSV,
  onExportPDF,
  departments
}) => {
  return (
    <section className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 flex flex-col gap-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block">Query Engine</span>
          <h2 className="text-xl font-bold text-white">ตัวกรองรายงาน</h2>
          <p className="text-xs text-zinc-400 mt-0.5">เลือกข้อมูลจริงที่ต้องการส่งออก</p>
        </div>
        <button
          onClick={onResetFilter}
          title="ล้างตัวกรอง"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 font-semibold bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>รีเซ็ต</span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Report Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400">ประเภทรายงาน</label>
          <div className="relative">
            <select
              value={filter.reportType}
              onChange={(e) => onFilterChange('reportType', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-2.5 pl-4 pr-10 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none text-zinc-100 font-medium transition-all cursor-pointer"
            >
              <option value="ประวัติงาน PM">ประวัติงาน PM</option>
              <option value="งานมอบหมายทั้งหมด">งานมอบหมายทั้งหมด</option>
              <option value="ผล Checklist">ผล Checklist</option>
              <option value="รายการผิดปกติ">รายการผิดปกติ</option>
              <option value="งานเวรประจำกะ">งานเวรประจำกะ</option>
              <option value="งานเกินกำหนด">งานเกินกำหนด</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Date Range: Start & End Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 font-medium transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-2 px-3 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 font-medium transition-all"
            />
          </div>
        </div>

        {/* Department */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400">แผนก</label>
          <div className="relative">
            <select
              value={filter.department}
              onChange={(e) => onFilterChange('department', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-2.5 pl-4 pr-10 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none text-zinc-100 font-medium transition-all cursor-pointer"
            >
              <option value="">ทั้งหมด</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400">สถานะ</label>
          <div className="relative">
            <select
              value={filter.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-2.5 pl-4 pr-10 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none text-zinc-100 font-medium transition-all cursor-pointer"
            >
              <option value="">ทั้งหมด</option>
              <option value="approved">เสร็จสิ้น</option>
              <option value="overdue">เกินกำหนด</option>
              <option value="submitted">รอตรวจรับ</option>
              <option value="in_progress">กำลังดำเนินการ</option>
              <option value="pending">รอดำเนินการ</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Preview Button */}
      <button
        onClick={onApplyFilter}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(99,102,241,0.3)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-1"
      >
        <Search className="w-4 h-4" />
        <span>ดูตัวอย่างรายงาน</span>
      </button>

      {/* Quick Export Grid */}
      <div className="pt-4 border-t border-zinc-800 grid grid-cols-3 gap-2.5">
        <button
          onClick={onExportExcel}
          className="bg-zinc-900 border border-zinc-800 text-zinc-200 py-3 rounded-2xl text-xs font-semibold hover:bg-zinc-800/80 hover:border-emerald-500/30 transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm hover:scale-102 active:scale-95"
        >
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <span>Excel</span>
        </button>
        <button
          onClick={onExportCSV}
          className="bg-zinc-900 border border-zinc-800 text-zinc-200 py-3 rounded-2xl text-xs font-semibold hover:bg-zinc-800/80 hover:border-indigo-500/30 transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm hover:scale-102 active:scale-95"
        >
          <FileCode2 className="w-5 h-5 text-indigo-400" />
          <span>CSV</span>
        </button>
        <button
          onClick={onExportPDF}
          className="bg-zinc-900 border border-zinc-800 text-zinc-200 py-3 rounded-2xl text-xs font-semibold hover:bg-zinc-800/80 hover:border-rose-500/30 transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm hover:scale-102 active:scale-95"
        >
          <FileText className="w-5 h-5 text-rose-400" />
          <span>PDF</span>
        </button>
      </div>
    </section>
  );
};
