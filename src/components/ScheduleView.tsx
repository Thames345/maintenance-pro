import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, RefreshCw,
  Wrench, X,
} from '../icons';
import type { AnyRow, MaintenanceRecord } from '../types';
import { formatThaiDate, todayISO } from '../lib/models';
import { useDialogLifecycle } from '../lib/useDialogLifecycle';
import { TechnicianPicker } from './TechnicianPicker';
import { AppIcon } from './AppIcon';

interface ScheduleViewProps {
  records: MaintenanceRecord[];
  plans: AnyRow[];
  machines: AnyRow[];
  templates: AnyRow[];
  technicians: AnyRow[];
  teams: AnyRow[];
  canManage: boolean;
  busy: boolean;
  onSelectRecord: (record: MaintenanceRecord) => void;
  onCreatePlan: (payload: AnyRow) => Promise<void>;
  onGenerate: () => Promise<void>;
  onRefresh?: () => Promise<unknown>;
}

const frequencyLabel = (type: string, interval: number) => {
  const labels: Record<string, string> = {
    daily: 'รายวัน', weekly: 'รายสัปดาห์', monthly: 'รายเดือน', quarterly: 'ทุก 3 เดือน',
    semiannual: 'ทุก 6 เดือน', annual: 'รายปี', custom: 'กำหนดเอง',
  };
  return `${labels[type] || type}${interval > 1 ? ` · ทุก ${interval} รอบ` : ''}`;
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  records, plans, machines, templates, technicians, teams, canManage, busy,
  onSelectRecord, onCreatePlan, onGenerate, onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pm_plans' | 'calendar'>('pm_plans');
  const [selectedDept, setSelectedDept] = useState('ทั้งหมด');
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [showCreate, setShowCreate] = useState(false);
  useDialogLifecycle(showCreate, () => setShowCreate(false));
  const [form, setForm] = useState<AnyRow>({
    plan_code: `PM-${todayISO()}-${String(Date.now()).slice(-4)}`,
    plan_name: '', machine_id: '', checklist_template_id: '', frequency_type: 'monthly',
    frequency_interval: 1, next_due_date: todayISO(), due_time: '20:00',
    notification_days_before: 3, assignment_mode: 'individual', primary_technician_id: '', team_id: '',
  });

  const filteredPlans = useMemo(() => plans
    .filter((plan) => selectedDept === 'ทั้งหมด' || plan.department_code === selectedDept)
    .sort((a, b) => String(a.next_due_date).localeCompare(String(b.next_due_date))), [plans, selectedDept]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const offset = new Date(year, monthIndex, 1).getDay();
  const monthLabel = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(month);
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const pmRecords = records.filter((row) => row.sourceType === 'pm' && (selectedDept === 'ทั้งหมด' || row.department === selectedDept));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const machine = machines.find((item) => item.id === form.machine_id);
    await onCreatePlan({ ...form, department_code: machine?.department_code || 'MVR' });
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <AppIcon name="pmCalendar" framed className="w-14 h-14 md:w-16 md:h-16 shrink-0" label="แผน PM"/>
          <div>
            <div className="flex items-center gap-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">PM Plan & Calendar Suite</span></div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">แผนบำรุงรักษาเชิงป้องกัน (PM Plans)</h1>
            <p className="text-zinc-400 text-xs md:text-sm mt-1 max-w-xl">จัดการแผน PM เครื่องจักร อัตราความถี่ และปฏิทินงานประจำรอบ</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {onRefresh && <button onClick={() => onRefresh()} disabled={busy} className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold" title="รีเฟรชข้อมูล"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin text-indigo-400' : ''}`} /><span className="hidden sm:inline">รีเฟรช</span></button>}
          {canManage && <button onClick={onGenerate} disabled={busy} className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,.35)]"><Wrench className="w-4 h-4" /><span>ออกใบงาน PM รอบวันนี้</span></button>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 bg-[#18181B] p-1 rounded-2xl border border-zinc-800">
          <button onClick={() => setActiveSubTab('pm_plans')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'pm_plans' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}>รายการแผน PM ({filteredPlans.length})</button>
          <button onClick={() => setActiveSubTab('calendar')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'calendar' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}>ปฏิทินรวม</button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto table-container pb-1">
          <span className="text-xs text-zinc-400 font-bold hidden sm:inline shrink-0">กรองแผนก:</span>
          <div className="flex items-center gap-1 bg-[#18181B] p-1 rounded-2xl border border-zinc-800 text-xs shrink-0">
            {['ทั้งหมด', 'MVR', 'MSR', 'MVR-LOTUS', 'MPR'].map((dept) => <button key={dept} onClick={() => setSelectedDept(dept)} className={`px-3 py-1.5 rounded-xl font-bold transition-all ${selectedDept === dept ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}>{dept}</button>)}
          </div>
        </div>
      </div>

      {activeSubTab === 'pm_plans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-zinc-400">รายการแผนการบำรุงรักษาเชิงป้องกันตามเครื่องจักร</p>
            {canManage && <button onClick={() => setShowCreate(true)} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md self-start sm:self-auto"><Plus className="w-3.5 h-3.5" /><span>เพิ่มแผน PM ใหม่</span></button>}
          </div>
          {filteredPlans.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredPlans.map((plan) => {
                const machine = machines.find((item) => item.id === plan.machine_id);
                const technician = technicians.find((item) => item.id === plan.primary_technician_id);
                const team = teams.find((item) => item.id === plan.team_id);
                return <article key={plan.id} className="p-4 bg-[#18181B] rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2"><span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{machine?.machine_no || plan.plan_code}</span><span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">แผนก {plan.department_code || machine?.department_code || '-'}</span></div>
                    <h4 className="text-sm font-bold text-white mb-1 leading-snug">{plan.plan_name}</h4>
                    <p className="text-xs text-zinc-400">{machine?.machine_name || 'ไม่ระบุเครื่องจักร'}</p>
                    <div className="mt-3 p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-3"><span className="text-zinc-400">รอบความถี่:</span><span className="font-bold text-white text-right">{frequencyLabel(plan.frequency_type, Number(plan.frequency_interval || 1))}</span></div>
                      <div className="flex items-center justify-between gap-3"><span className="text-zinc-400">กำหนด PM ถัดไป:</span><span className="font-mono font-bold text-emerald-400">{formatThaiDate(`${plan.next_due_date}T12:00:00+07:00`, false)}</span></div>
                      <div className="flex items-center justify-between gap-3"><span className="text-zinc-400">ผู้รับผิดชอบ:</span><span className="text-zinc-200 text-right truncate">{technician?.full_name || team?.team_name || 'ทีมซ่อมบำรุง'}</span></div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono"><span>รหัส: {plan.plan_code}</span><span className={plan.is_active === false ? 'text-zinc-500' : 'text-emerald-400'}>{plan.is_active === false ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</span></div>
                </article>;
              })}
            </div>
          ) : <div className="bg-[#18181B] rounded-[2rem] border border-zinc-800 py-20 text-center"><AppIcon name="pmDue" className="w-16 h-16 mx-auto" label="ยังไม่มีแผน PM"/><p className="mt-3 text-sm font-bold text-zinc-300">ยังไม่มีแผน PM</p><p className="text-xs text-zinc-500 mt-1">เพิ่มแผนแรกเพื่อให้ระบบสร้างใบงานตามรอบ</p></div>}
        </div>
      )}

      {activeSubTab === 'calendar' && (
        <section className="bg-[#18181B] rounded-[2rem] p-4 sm:p-6 border border-zinc-800 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-5"><button onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600"><ChevronLeft className="w-4 h-4" /></button><div className="flex items-center gap-2 font-bold"><CalendarIcon className="w-4 h-4 text-indigo-400" />{monthLabel}</div><button onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600"><ChevronRight className="w-4 h-4" /></button></div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-xs text-zinc-500 font-bold mb-2">{['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((day) => <div key={day}>{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: offset }).map((_, index) => <div key={`blank-${index}`} />)}
            {Array.from({ length: days }, (_, index) => index + 1).map((day) => {
              const date = `${monthPrefix}-${String(day).padStart(2, '0')}`;
              const work = pmRecords.filter((row) => row.scheduledDate === date);
              const duePlans = filteredPlans.filter((plan) => plan.next_due_date === date);
              const isToday = date === todayISO();
              return <div key={day} className={`min-h-20 sm:min-h-28 rounded-xl sm:rounded-2xl border p-1.5 sm:p-2.5 ${isToday ? 'border-indigo-500 bg-indigo-500/10' : work.length || duePlans.length ? 'border-zinc-700 bg-zinc-900/80' : 'border-zinc-800/60 bg-zinc-900/30'}`}>
                <div className={`text-[10px] sm:text-xs font-bold ${isToday ? 'text-indigo-300' : 'text-zinc-500'}`}>{day}</div>
                <div className="space-y-1 mt-1">{work.slice(0, 2).map((row) => <button key={row.id} onClick={() => onSelectRecord(row)} title={row.title} className={`block w-full truncate rounded-md sm:rounded-lg px-1 py-1 text-[8px] sm:text-[10px] font-bold text-left ${row.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : row.status === 'overdue' ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'}`}>{row.machineCode}</button>)}{duePlans.slice(0, Math.max(0, 2 - work.length)).map((plan) => <div key={plan.id} title={plan.plan_name} className="truncate rounded-md px-1 py-1 text-[8px] sm:text-[10px] bg-violet-500/15 text-violet-300">{plan.plan_code}</div>)}</div>
              </div>;
            })}
          </div>
        </section>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
          <section className="bg-[#18181B] rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-3xl max-h-[calc(100dvh-.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden border border-zinc-800 flex flex-col shadow-2xl">
            <header className="shrink-0 px-5 sm:px-6 py-5 border-b border-zinc-800 flex justify-between gap-3"><div><h2 className="font-extrabold text-lg">เพิ่มแผน PM ใหม่</h2><p className="text-xs text-zinc-500">ระบบจะสร้างใบงานตามรอบและป้องกันการสร้างซ้ำ</p></div><button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-zinc-800"><X className="w-5 h-5 text-zinc-400" /></button></header>
            <form onSubmit={submit} className="min-h-0 flex-1 p-5 sm:p-6 overflow-y-auto overscroll-contain grid sm:grid-cols-2 gap-4 table-container">
              <label className="field-dark"><span>รหัสแผน *</span><input required value={form.plan_code} onChange={(event) => setForm({ ...form, plan_code: event.target.value })} /></label>
              <label className="field-dark"><span>ชื่อแผน *</span><input required value={form.plan_name} onChange={(event) => setForm({ ...form, plan_name: event.target.value })} placeholder="เช่น Monthly PM Vacuum Pump" /></label>
              <label className="field-dark sm:col-span-2"><span>เครื่องจักร *</span><select required value={form.machine_id} onChange={(event) => setForm({ ...form, machine_id: event.target.value })}><option value="">เลือกเครื่องจักร</option>{machines.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{item.machine_no} · {item.machine_name} · {item.department_code}</option>)}</select></label>
              <label className="field-dark sm:col-span-2"><span>แม่แบบ Checklist *</span><select required value={form.checklist_template_id} onChange={(event) => setForm({ ...form, checklist_template_id: event.target.value })}><option value="">เลือกแม่แบบ PM</option>{templates.filter((item) => item.template_type === 'pm' && item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{item.template_name}</option>)}</select></label>
              <label className="field-dark"><span>รอบการทำ</span><select value={form.frequency_type} onChange={(event) => setForm({ ...form, frequency_type: event.target.value })}><option value="daily">ทุกวัน</option><option value="weekly">ทุกสัปดาห์</option><option value="monthly">ทุกเดือน</option><option value="quarterly">ทุก 3 เดือน</option><option value="semiannual">ทุก 6 เดือน</option><option value="annual">ทุกปี</option><option value="custom">กำหนดเป็นวัน</option></select></label>
              <label className="field-dark"><span>จำนวนรอบ</span><input type="number" min="1" value={form.frequency_interval} onChange={(event) => setForm({ ...form, frequency_interval: Number(event.target.value) })} /></label>
              <label className="field-dark"><span>กำหนดครั้งถัดไป</span><input required type="date" value={form.next_due_date} onChange={(event) => setForm({ ...form, next_due_date: event.target.value })} /></label>
              <label className="field-dark"><span>เวลาครบกำหนด</span><input type="time" value={form.due_time} onChange={(event) => setForm({ ...form, due_time: event.target.value })} /></label>
              <label className="field-dark"><span>แจ้งล่วงหน้า (วัน)</span><input type="number" min="0" value={form.notification_days_before} onChange={(event) => setForm({ ...form, notification_days_before: Number(event.target.value) })} /></label>
              <label className="field-dark"><span>รูปแบบมอบหมาย</span><select value={form.assignment_mode} onChange={(event) => setForm({ ...form, assignment_mode: event.target.value, team_id: '', primary_technician_id: '' })}><option value="individual">รายบุคคล</option><option value="team">ทีม</option></select></label>
              {form.assignment_mode === 'team' ? <label className="field-dark sm:col-span-2"><span>ทีมรับผิดชอบ</span><select value={form.team_id} onChange={(event) => setForm({ ...form, team_id: event.target.value })}><option value="">เลือกทีม</option>{teams.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{item.team_name} · {item.department_code}</option>)}</select></label> : <div className="sm:col-span-2"><TechnicianPicker technicians={technicians} selectedIds={form.primary_technician_id ? [form.primary_technician_id] : []} onChange={(ids) => setForm({ ...form, primary_technician_id: ids.at(-1) || '' })} compact /></div>}
              <footer className="sm:col-span-2 sticky bottom-0 z-10 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 mt-2 px-5 sm:px-6 py-4 border-t border-zinc-800 bg-[#18181B]/95 backdrop-blur flex justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="btn-dark-secondary">ยกเลิก</button><button disabled={busy} className="btn-dark-primary"><Plus className="w-4 h-4" /> บันทึกแผน</button></footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
