import React from 'react';
import { MaintenanceRecord } from '../types';
import { 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  Wrench,
  Sparkles
} from '../icons';
import { AppIcon, taskStatusIcon } from './AppIcon';

interface DashboardViewProps {
  records: MaintenanceRecord[];
  onSelectRecord: (record: MaintenanceRecord) => void;
  onGoToReports: () => void;
  onGoToDuty?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  onSelectRecord,
  onGoToReports,
  onGoToDuty
}) => {
  const completed = records.filter(r => r.status === 'approved').length;
  const overdue = records.filter(r => r.status === 'overdue').length;
  const abnormal = records.filter(r => r.checklistAbnormal > 0).length;
  const inProgress = records.filter(r => r.status === 'in_progress' || r.status === 'submitted').length;
  const completionRate = Math.round((completed / (records.length || 1)) * 100);

  const deptCounts: Record<string, number> = {};
  records.forEach(r => {
    deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Bento */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 text-white p-6 md:p-8 rounded-[2rem] border border-zinc-800 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="hidden lg:flex absolute right-10 inset-y-0 items-center gap-2 opacity-20 pointer-events-none">
          <AppIcon name="machine" className="w-28 h-28 app-icon-float"/>
          <AppIcon name="technicians" className="w-24 h-24 app-icon-float [animation-delay:700ms]"/>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            <span className="text-[11px] uppercase tracking-widest text-indigo-400 font-bold">
              Executive Maintenance Overview
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">ภาพรวมการซ่อมบำรุงและเครื่องจักร</h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-1.5 max-w-xl">
            สถานะเครื่องจักรในไลน์การผลิต อัตราการทำ PM ตามแผน และรายการเร่งด่วนที่ต้องติดตาม
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {onGoToDuty && <button onClick={onGoToDuty} className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"><Sparkles className="w-4 h-4 text-emerald-400" /><span>เวรทำความสะอาดห้องช่าง</span></button>}
          <button onClick={onGoToReports} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-[0_4px_16px_rgba(99,102,241,0.35)] flex items-center gap-2"><span>ดูรายงานและส่งออก</span><ArrowUpRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* KPI Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181B] border border-zinc-800 p-6 rounded-[2rem] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>อัตราความสำเร็จ PM (MTD)</span>
            <AppIcon name="pmDue" className="w-10 h-10 -my-2" label="อัตราความสำเร็จ PM"/>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl md:text-4xl font-bold text-white tracking-tight">{completionRate}%</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +4.2%
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-[#18181B] border border-zinc-800 p-6 rounded-[2rem] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>งานเสร็จสิ้นแล้ว</span>
            <AppIcon name="approved" className="w-10 h-10 -my-2" label="งานเสร็จสิ้น"/>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-emerald-400 tracking-tight mt-3">{completed}</div>
          <p className="text-xs text-zinc-500 mt-2">จากทั้งหมด {records.length} แผนงาน</p>
        </div>

        <div className="bg-[#18181B] border border-zinc-800 p-6 rounded-[2rem] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>รายการพบข้อผิดปกติ</span>
            <AppIcon name="warning" className="w-10 h-10 -my-2" label="พบความผิดปกติ"/>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-amber-400 tracking-tight mt-3">{abnormal}</div>
          <p className="text-xs text-zinc-500 mt-2">รอจัดซื้ออะไหล่เปลี่ยนซ่อม</p>
        </div>

        <div className="bg-[#18181B] border border-zinc-800 p-6 rounded-[2rem] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>งานเกินกำหนดเวลา</span>
            <AppIcon name="overdue" className="w-10 h-10 -my-2" label="งานเกินกำหนด"/>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-rose-400 tracking-tight mt-3">{overdue}</div>
          <p className="text-xs text-zinc-500 mt-2">ต้องเร่งดำเนินการแก้ไขทันที</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Urgent & In Progress Tasks */}
        <div className="lg:col-span-8 bg-[#18181B] rounded-[2rem] p-6 md:p-7 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">รายการงานสำคัญล่าสุด</h3>
              <p className="text-xs text-zinc-400">งานที่อยู่ระหว่างดำเนินการหรือต้องการการตรวจสอบ</p>
            </div>
            <button onClick={onGoToReports} className="text-xs text-indigo-400 font-bold hover:text-indigo-300">
              ดูทั้งหมด →
            </button>
          </div>

          <div className="space-y-2.5">
            {records.slice(0, 5).map(r => (
              <div
                key={r.id}
                onClick={() => onSelectRecord(r)}
                className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 text-indigo-400 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {r.machineCode.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{r.taskNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 rounded-md text-zinc-300 border border-zinc-700">{r.department}</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-200 line-clamp-1 mt-0.5">{r.title}</p>
                    <p className="text-[11px] text-zinc-400">ช่าง: {r.technician} · นัดหมาย: {r.scheduledDate}</p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full shrink-0 uppercase tracking-wider ${
                  r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  r.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  r.status === 'submitted' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  <AppIcon name={taskStatusIcon(r.status, r.checklistAbnormal > 0)} className="w-4 h-4"/>
                  {r.status === 'approved' ? 'เสร็จสิ้น' : r.status === 'overdue' ? 'เกินกำหนด' : r.status === 'submitted' ? 'รอตรวจรับ' : 'กำลังทำ'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Machine Breakdown by Dept */}
        <div className="lg:col-span-4 bg-[#18181B] rounded-[2rem] p-6 md:p-7 border border-zinc-800 shadow-xl space-y-4">
          <div className="pb-3 border-b border-zinc-800">
            <h3 className="text-base font-bold text-white tracking-tight">สัดส่วนงานตามแผนก</h3>
            <p className="text-xs text-zinc-400">ปริมาณงานซ่อมบำรุงประจำรอบ</p>
          </div>

          <div className="space-y-3.5">
            {Object.entries(deptCounts).map(([dept, count]) => {
              const pct = Math.round((count / records.length) * 100);
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-zinc-200">
                    <span>แผนก {dept}</span>
                    <span className="text-zinc-400 font-mono">{count} งาน ({pct}%)</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-400 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>เครื่องจักรที่เปิดใช้งาน: <strong className="text-zinc-200">42 เครื่อง</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-400" />
              <span>ช่างเทคนิคปฏิบัติงาน: <strong className="text-zinc-200">6 ท่าน</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
