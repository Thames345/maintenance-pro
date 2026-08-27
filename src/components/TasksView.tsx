import React, { useState } from 'react';
import { MaintenanceRecord, TaskStatus } from '../types';
import { Search, Plus } from '../icons';
import { AppIcon, taskStatusIcon } from './AppIcon';

interface TasksViewProps {
  records: MaintenanceRecord[];
  onSelectRecord: (record: MaintenanceRecord) => void;
  onOpenCreateModal: () => void;
  onUpdateStatus: (id: string, newStatus: TaskStatus) => void;
  canCreate: boolean;
}

export const TasksView: React.FC<TasksViewProps> = ({
  records,
  onSelectRecord,
  onOpenCreateModal,
  onUpdateStatus,
  canCreate,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const filtered = records.filter(r => {
    if (activeTab === 'approved' && r.status !== 'approved') return false;
    if (activeTab === 'overdue' && r.status !== 'overdue') return false;
    if (activeTab === 'in_progress' && (r.status !== 'in_progress' && r.status !== 'submitted')) return false;
    if (deptFilter && r.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.taskNumber.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.machineCode.toLowerCase().includes(q) ||
        r.technician.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <AppIcon name="workOrder" framed className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" label="รายการงานซ่อม"/>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">รายการงานซ่อมบำรุง</h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">จัดการ ติดตาม และอัปเดตสถานะงานทั้งหมด</p>
          </div>
        </div>
        {canCreate && <button
          onClick={onOpenCreateModal}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-[0_4px_16px_rgba(99,102,241,0.35)] flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างงานใหม่</span>
        </button>}
      </div>

      {/* Tabs & Search */}
      <div className="bg-[#18181B] p-4 rounded-[2rem] border border-zinc-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'ทั้งหมด', count: records.length },
            { id: 'in_progress', label: 'กำลังดำเนินการ / รอตรวจ', count: records.filter(r => r.status === 'in_progress' || r.status === 'submitted').length },
            { id: 'approved', label: 'เสร็จสิ้น', count: records.filter(r => r.status === 'approved').length },
            { id: 'overdue', label: 'เกินกำหนด', count: records.filter(r => r.status === 'overdue').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850 bg-zinc-900/60 border border-zinc-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Dept */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="ค้นหาชื่อช่าง, เครื่อง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="" className="bg-zinc-900">ทุกแผนก</option>
            <option value="MVR" className="bg-zinc-900">MVR</option>
            <option value="MSR" className="bg-zinc-900">MSR</option>
            <option value="LOTUS" className="bg-zinc-900">LOTUS</option>
            <option value="MVR-LOTUS" className="bg-zinc-900">MVR-LOTUS</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => (
          <div
            key={r.id}
            onClick={() => onSelectRecord(r)}
            className="bg-[#18181B] rounded-[2rem] p-5 border border-zinc-800 shadow-lg hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {r.department}
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-200">
                    {r.machineCode}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  r.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  r.status === 'submitted' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  <AppIcon name={taskStatusIcon(r.status, r.checklistAbnormal > 0)} className="w-4 h-4"/>
                  {r.status === 'approved' ? 'เสร็จสิ้น' : r.status === 'overdue' ? 'เกินกำหนด' : r.status === 'submitted' ? 'รอตรวจรับ' : 'กำลังทำ'}
                </span>
              </div>

              <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                {r.title}
              </h4>
              <p className="text-xs text-zinc-400 mt-1">{r.machineName}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-1 font-medium text-zinc-300">
                <span>{r.technician}</span>
              </div>
              <span className="font-mono text-xs text-zinc-500">{r.scheduledDate}</span>
            </div>
          </div>
        ))}
        {!filtered.length && <div className="md:col-span-2 lg:col-span-3 min-h-52 rounded-[2rem] border border-dashed border-zinc-800 bg-[#18181B] flex flex-col items-center justify-center text-center p-6"><AppIcon name="info" className="w-16 h-16" label="ไม่พบงาน"/><p className="mt-3 text-sm font-extrabold text-zinc-300">ไม่พบงานตามตัวกรอง</p><p className="mt-1 text-xs text-zinc-500">ลองเปลี่ยนสถานะ แผนก หรือคำค้นหา</p></div>}
      </div>
    </div>
  );
};
