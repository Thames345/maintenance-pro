import React, { useMemo, useState } from 'react';
import {
  Calendar, ChevronRight, Clock, Moon, Plus, Send,
  ShieldCheck, Sparkles, Sun, Users, Wrench,
} from '../icons';
import type { AnyRow, DataBundle, MaintenanceRecord } from '../types';
import { formatThaiDate, thaiStatus, todayISO } from '../lib/models';
import { AppIcon } from './AppIcon';
import { BrandLogo } from './BrandLogo';

interface DutyViewProps {
  bundle: DataBundle;
  records: MaintenanceRecord[];
  canManage: boolean;
  busy: boolean;
  onSelectRecord: (record: MaintenanceRecord) => void;
  onOpenCreate: () => void;
  onOpenSettings: () => void;
  onBroadcast?: () => Promise<void>;
}

const standards = [
  { title: '1. ตรวจและจัดเก็บเครื่องมือ', desc: 'ตรวจจำนวนและจัดเก็บเครื่องมือส่วนกลาง พร้อมแนบรูป' },
  { title: '2. ทำความสะอาดพื้นที่', desc: 'กวาดทำความสะอาดโต๊ะและพื้นที่ทำงาน พร้อมแนบรูป' },
  { title: '3. เก็บรถเครื่องเข้าที่', desc: 'นำรถเครื่องมือ/รถเข็นกลับตำแหน่ง พร้อมแนบรูป' },
  { title: '4. ห้องช่างชั้นสอง', desc: 'กวาดทำความสะอาดห้องช่างชั้นสอง พร้อมแนบรูป' },
  { title: '5. ทิ้งขยะ', desc: 'เก็บและทิ้งขยะตามจุดที่กำหนด พร้อมแนบรูป' },
  { title: '6. ทำความสะอาดตู้เย็น', desc: 'ตรวจสอบและทำความสะอาดตู้เย็น พร้อมแนบรูป' },
];

export const DutyView: React.FC<DutyViewProps> = ({
  bundle, records, canManage, busy, onSelectRecord, onOpenCreate,
  onOpenSettings, onBroadcast,
}) => {
  const dates = [...new Set(bundle.dutySchedules.map((row) => row.duty_date))].sort().reverse();
  const [selectedDate, setSelectedDate] = useState(dates.includes(todayISO()) ? todayISO() : dates[0] || todayISO());
  const [selectedDept, setSelectedDept] = useState('ทั้งหมด');
  const [filterShift, setFilterShift] = useState<'all' | 'day' | 'night'>('all');
  const [lineStatus, setLineStatus] = useState('');
  const lineFailed = lineStatus.includes('ไม่สำเร็จ');
  const technicianMap = new Map(bundle.technicians.map((row) => [row.id, row]));
  const teamMap = new Map(bundle.teams.map((row) => [row.id, row]));

  const workFor = (schedule: AnyRow) => records.find((record) => record.raw?.duty_schedule_id === schedule.id);
  const peopleFor = (schedule: AnyRow, record?: MaintenanceRecord) => {
    if (record?.technician) return record.technician;
    const team = teamMap.get(schedule.team_id);
    const names = bundle.teamMembers
      .filter((member) => member.team_id === schedule.team_id && member.is_active)
      .map((member) => technicianMap.get(member.technician_id)?.full_name)
      .filter(Boolean);
    return names.join(', ') || team?.team_name || 'สมาชิกทุกคนในกะ';
  };

  const rows = useMemo(() => bundle.dutySchedules
    .filter((row) => row.duty_date === selectedDate)
    .filter((row) => selectedDept === 'ทั้งหมด' || row.department_code === selectedDept)
    .filter((row) => filterShift === 'all' || (filterShift === 'day' ? row.shift_code === 'DAY' : row.shift_code === 'NIGHT')),
  [bundle.dutySchedules, selectedDate, selectedDept, filterShift]);

  const handleBroadcast = async () => {
    if (!onBroadcast) return;
    setLineStatus('กำลังส่งสรุปเวรไปยังกลุ่ม LINE...');
    try {
      await onBroadcast();
      setLineStatus('ส่งสรุปและแจ้งเตือนเวรไปยังกลุ่ม LINE แล้ว');
    } catch {
      setLineStatus('ส่ง LINE ไม่สำเร็จ โปรดตรวจสอบการตั้งค่า');
    }
    window.setTimeout(() => setLineStatus(''), 5000);
  };

  return (
    <div className="min-w-0 space-y-6 animate-in">
      <div className="duty-hero flex min-w-0 flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-indigo-950/30 to-zinc-900 p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-zinc-800 shadow-2xl">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <BrandLogo framed className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" label="Maintenance Pro"/>
          <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3 h-3" />Workshop Housekeeping & 5S Schedule</span></div>
          <h1 className="duty-hero-title text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mt-1">กำหนดเวรทำความสะอาดห้องช่าง</h1>
          <p className="duty-hero-copy text-xs md:text-sm mt-1 max-w-2xl">ระบบสร้างเวรตามกฎอัตโนมัติ · MVR/MSR สลับวันกัน · MVR-LOTUS ทำทุกวัน · LINE แจ้งเตือนอัตโนมัติ</p>
          </div>
        </div>
        <div className="flex w-full md:w-auto flex-wrap items-center gap-2.5">
          {onBroadcast && <button onClick={handleBroadcast} disabled={busy} className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all"><Send className="w-4 h-4 text-emerald-400" /><span>แจ้งเตือนเวรเข้า LINE</span></button>}
        </div>
      </div>

      {lineStatus && <div role={lineFailed ? 'alert' : 'status'} className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in border ${lineFailed ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}><AppIcon name={lineFailed ? 'error' : 'success'} className="w-8 h-8 shrink-0" label={lineFailed ? 'ส่ง LINE ไม่สำเร็จ' : 'ส่ง LINE สำเร็จ'}/><span>{lineStatus}</span></div>}

      <section className="bg-[#18181B] rounded-[2rem] p-5 border border-zinc-800 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2"><h3 className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-400" /><span>เกณฑ์มาตรฐาน 5S การทำความสะอาดห้องช่างประจำกะ</span></h3><span className="text-[11px] text-zinc-400 font-mono">ส่งมอบกะ: กะวัน 20:00 น. / กะคืน 08:00 น.</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">{standards.map((item) => <div key={item.title} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1"><div className="text-xs font-bold text-indigo-300">{item.title}</div><p className="text-[11px] text-zinc-400 leading-relaxed">{item.desc}</p></div>)}</div>
      </section>

      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#18181B] rounded-2xl border border-zinc-800 overflow-x-auto table-container max-w-full">{['ทั้งหมด', 'MVR', 'MSR', 'MVR-LOTUS', 'MPR'].map((dept) => <button key={dept} onClick={() => setSelectedDept(dept)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedDept === dept ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'}`}>{dept}</button>)}</div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 w-full xl:w-auto">
          <label className="flex min-w-0 items-center gap-2 px-3 py-2 bg-[#18181B] rounded-2xl border border-zinc-800 text-xs text-zinc-300"><Calendar className="w-4 h-4 shrink-0 text-indigo-400" /><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="min-w-0 bg-transparent outline-none [color-scheme:light]" /></label>
          <div className="flex items-center gap-1 bg-[#18181B] p-1 rounded-2xl border border-zinc-800 text-xs">
            <button onClick={() => setFilterShift('all')} className={`px-2.5 py-1 rounded-xl font-medium ${filterShift === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'}`}>ทุกกะ</button>
            <button onClick={() => setFilterShift('day')} className={`px-2.5 py-1 rounded-xl font-medium flex items-center gap-1 ${filterShift === 'day' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-zinc-400'}`}><Sun className="w-3 h-3" />กะเช้า</button>
            <button onClick={() => setFilterShift('night')} className={`px-2.5 py-1 rounded-xl font-medium flex items-center gap-1 ${filterShift === 'night' ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30' : 'text-zinc-400'}`}><Moon className="w-3 h-3" />กะดึก</button>
          </div>
          {canManage && <button onClick={onOpenCreate} className="px-3.5 py-2 bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-2xl text-xs font-bold flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 text-indigo-400" />สร้างเวรเอง</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.length ? rows.map((schedule) => {
          const work = workFor(schedule);
          const statusCode = work?.rawStatus || schedule.status || 'scheduled';
          const isDay = schedule.shift_code === 'DAY';
          const completed = ['approved', 'completed'].includes(statusCode);
          const team = teamMap.get(schedule.team_id);
          return <article key={schedule.id} className="p-5 rounded-[2rem] bg-[#18181B] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 shadow-lg group relative overflow-hidden">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 font-bold">{schedule.duty_date}</span><span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">{schedule.department_code}</span></div><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${isDay ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>{isDay ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}<span>{isDay ? 'กะเช้า' : 'กะดึก'}</span></span></div>
              <div><h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">เวรทำความสะอาดห้องช่าง · {schedule.department_code}</h4><p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-zinc-500" /><span>ทีมรับผิดชอบ: <strong className="text-zinc-200">{team?.team_name || 'กำหนดรายบุคคล'}</strong></span></p></div>
              <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1"><div className="text-zinc-500 text-[10px] font-semibold">สมาชิกผู้ปฏิบัติงานเวร:</div><div className="text-zinc-300 font-medium line-clamp-2">{peopleFor(schedule, work)}</div><div className="pt-1 flex items-center gap-1.5 text-zinc-500"><Clock className="w-3.5 h-3.5" />{formatThaiDate(schedule.starts_at)} – {formatThaiDate(schedule.due_at)}</div></div>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3"><div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${completed ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : statusCode === 'overdue' ? 'bg-rose-400' : 'bg-amber-400'}`} /><span className="text-[11px] text-zinc-400 font-medium">{thaiStatus[statusCode] || statusCode}</span></div>{work ? <button onClick={() => onSelectRecord(work)} className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold flex items-center gap-1 transition-all"><span>บันทึกเช็คลิสต์</span><ChevronRight className="w-3 h-3" /></button> : <span className="text-[11px] font-mono text-zinc-500">DUTY-READY</span>}</div>
          </article>;
        }) : <div className="col-span-full py-16 text-center rounded-[2rem] bg-[#18181B] border border-zinc-800 space-y-3"><AppIcon name="duty" className="w-16 h-16 mx-auto" label="ยังไม่มีตารางเวร"/><h4 className="text-base font-bold text-white">ยังไม่มีตารางเวรของวันที่เลือก</h4><p className="text-xs text-zinc-400 max-w-sm mx-auto">ระบบตั้งเป็นโหมดสร้างเวรด้วยตนเอง เลือกแผนก ทีม/ช่าง เวลาเริ่ม และกำหนดส่งได้เอง</p>{canManage && <button onClick={onOpenCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500">สร้างเวรเอง</button>}</div>}
      </div>

      <button onClick={onOpenSettings} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-2"><Wrench className="w-3.5 h-3.5" />ตั้งค่ากฎเวร เวลา และการแจ้งเตือน →</button>
    </div>
  );
};
