import React, { useEffect, useMemo, useState } from 'react';
import { useDialogLifecycle } from '../lib/useDialogLifecycle';
import { Calendar, CheckCircle2, Clock, Cpu, Database, ExternalLink, Save, Send, Shield, Sparkles, UserCheck, Users, Wrench, X } from '../icons';
import type { AnyRow, AppProfile, DataBundle, TechnicianEditorPayload } from '../types';
import { roleLabel, teamCrewCode, todayISO } from '../lib/models';
import { TechnicianPicker } from './TechnicianPicker';
import { TechnicianManagement } from './TechnicianManagement';
import { AppIcon } from './AppIcon';

interface SettingsViewProps {
  bundle: DataBundle;
  profile: AppProfile;
  profileName: string;
  canManage: boolean;
  busy: boolean;
  onSave: (shiftRows: AnyRow[], teamMembers: Record<string, string[]>) => Promise<void>;
  onSaveDutyRules: (rules: AnyRow[]) => Promise<void>;
  onSaveTechnician: (payload: TechnicianEditorPayload, photoFile: File | null, removePhoto: boolean) => Promise<void>;
  onDeleteTechnician: (technician: AnyRow) => Promise<void>;
  onOpenLine?: () => void;
}

type SettingsTab = 'overview' | 'technicians' | 'duty' | 'shifts' | 'teams' | 'security';

const text = (value: unknown) => String(value ?? '').trim();
const dutyDays = [
  [1, 'จ'], [2, 'อ'], [3, 'พ'], [4, 'พฤ'], [5, 'ศ'], [6, 'ส'], [7, 'อา'],
] as const;

const scheduleModeLabel = (mode: string) => mode === 'daily'
  ? 'ทุกวัน'
  : mode === 'alternate'
    ? 'สลับแผนก'
    : 'สร้างเอง';

const dateDiffDays = (dateA: string, dateB: string) => {
  const a = Date.parse(`${dateA}T12:00:00+07:00`);
  const b = Date.parse(`${dateB}T12:00:00+07:00`);
  return Math.round((a - b) / 86_400_000);
};

const isodow = (dateISO: string) => {
  const day = new Date(`${dateISO}T12:00:00+07:00`).getDay();
  return day === 0 ? 7 : day;
};

const previewDepartments = (dateISO: string, rules: AnyRow[]) => {
  const day = isodow(dateISO);
  const active = rules.filter((row) => row.is_active !== false
    && row.auto_create !== false
    && (row.work_days || []).map(Number).includes(day)
    && row.schedule_mode !== 'manual');

  const result = new Set<string>();
  active.filter((row) => row.schedule_mode === 'daily')
    .forEach((row) => result.add(text(row.department_code)));

  const groups = [...new Set(active
    .filter((row) => row.schedule_mode === 'alternate' && text(row.rotation_group))
    .map((row) => text(row.rotation_group)))];

  groups.forEach((group) => {
    const candidates = active
      .filter((row) => row.schedule_mode === 'alternate' && text(row.rotation_group) === group)
      .sort((a, b) => Number(a.rotation_order || 0) - Number(b.rotation_order || 0));
    if (!candidates.length) return;
    const anchor = candidates.map((row) => text(row.anchor_date)).filter(Boolean).sort()[0];
    if (!anchor) return;
    const offset = ((dateDiffDays(dateISO, anchor) % candidates.length) + candidates.length) % candidates.length;
    result.add(text(candidates[offset].department_code));
  });

  return [...result];
};


const teamTone = (crew: string) => crew === 'A'
  ? 'from-indigo-600 to-violet-500'
  : crew === 'B'
    ? 'from-cyan-600 to-blue-500'
    : 'from-emerald-600 to-teal-500';

export const SettingsView: React.FC<SettingsViewProps> = ({ bundle, profile, profileName, canManage, busy, onSave, onSaveDutyRules, onSaveTechnician, onDeleteTechnician, onOpenLine }) => {
  const [tab, setTab] = useState<SettingsTab>('overview');
  const [shifts, setShifts] = useState<AnyRow[]>([]);
  const [dutyRules, setDutyRules] = useState<AnyRow[]>([]);
  const [members, setMembers] = useState<Record<string, string[]>>({});
  const [editingTeam, setEditingTeam] = useState<AnyRow | null>(null);
  useDialogLifecycle(Boolean(editingTeam), () => setEditingTeam(null));
  const [draftMembers, setDraftMembers] = useState<string[]>([]);

  useEffect(() => {
    setShifts(bundle.shiftSettings.map((shift) => {
      const notification = bundle.notificationSettings.find((row) => row.department_code === shift.department_code && row.shift_code === shift.shift_code);
      return {
        ...shift,
        notification_id: notification?.id,
        advance_minutes: notification?.advance_minutes ?? 30,
        reminder_before_due_minutes: notification?.reminder_before_due_minutes ?? 10,
      };
    }));
    setDutyRules(bundle.dutyRules.map((row) => ({ ...row })));
    const technicianIndex = new Map(bundle.technicians.map((row) => [text(row.id), row]));
    setMembers(Object.fromEntries(bundle.teams.map((team) => {
      const crew = teamCrewCode(team);
      const validIds = bundle.teamMembers
        .filter((row) => row.team_id === team.id && row.is_active)
        .map((row) => text(row.technician_id))
        .filter((id) => {
          const technician = technicianIndex.get(id);
          return technician
            && text(technician.department_code) === text(team.department_code)
            && (!crew || text(technician.shift).toUpperCase() === crew);
        });
      return [text(team.id), validIds];
    })));
  }, [bundle]);

  const techniciansById = useMemo(() => new Map(bundle.technicians.map((row) => [text(row.id), row])), [bundle.technicians]);
  const directoryRows = bundle.managedTechnicians.length ? bundle.managedTechnicians : bundle.technicians;
  const sortedTeams = useMemo(() => [...bundle.teams]
    .filter((team) => team.is_active !== false)
    .sort((a, b) => `${text(a.department_code)}-${teamCrewCode(a)}`.localeCompare(`${text(b.department_code)}-${teamCrewCode(b)}`)),
  [bundle.teams]);

  const updateShift = (id: string, key: string, value: string | number) => {
    setShifts((all) => all.map((row) => row.id === id ? { ...row, [key]: value } : row));
  };

  const updateDutyRule = (departmentCode: string, key: string, value: unknown) => {
    setDutyRules((all) => all.map((row) => row.department_code === departmentCode
      ? { ...row, [key]: value }
      : row));
  };

  const toggleDutyArrayValue = (departmentCode: string, key: 'work_days' | 'shift_codes', value: number | string) => {
    setDutyRules((all) => all.map((row) => {
      if (row.department_code !== departmentCode) return row;
      const current = Array.isArray(row[key]) ? row[key] : [];
      const exists = current.map(String).includes(String(value));
      const next = exists
        ? current.filter((item: unknown) => String(item) !== String(value))
        : [...current, value];
      return { ...row, [key]: next };
    }));
  };

  const dutyPreview = useMemo(() => {
    const start = todayISO();
    return Array.from({ length: 8 }, (_, index) => {
      const date = new Date(`${start}T12:00:00+07:00`);
      date.setDate(date.getDate() + index);
      const iso = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(date);
      return { iso, departments: previewDepartments(iso, dutyRules) };
    });
  }, [dutyRules]);

  const eligibleTechnicians = (team: AnyRow) => {
    const crew = teamCrewCode(team);
    return bundle.technicians.filter((row) => row.is_active !== false
      && text(row.department_code) === text(team.department_code)
      && (!crew || text(row.shift).toUpperCase() === crew));
  };

  const openTeam = (team: AnyRow) => {
    const eligibleIds = new Set(eligibleTechnicians(team).map((row) => text(row.id)));
    setDraftMembers((members[text(team.id)] || []).filter((id) => eligibleIds.has(id)));
    setEditingTeam(team);
  };

  const saveTeam = async () => {
    if (!editingTeam || !canManage) return;
    const nextMembers = { ...members, [text(editingTeam.id)]: draftMembers };
    setMembers(nextMembers);
    try {
      await onSave(shifts, nextMembers);
      setEditingTeam(null);
    } catch {
      // App แสดงรายละเอียดข้อผิดพลาดผ่าน toast และเปิดหน้าต่างนี้ไว้ให้แก้ไขต่อ
    }
  };

  return <div className="space-y-6 max-w-6xl animate-in">
    <div className="flex items-start gap-4"><AppIcon name="settings" framed className="w-14 h-14 md:w-16 md:h-16 shrink-0" label="ตั้งค่าระบบ"/><div><div className="flex items-center gap-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">System Administration</span></div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">ตั้งค่าระบบ (System Configuration)</h1><p className="text-xs sm:text-sm text-zinc-400">การเชื่อมต่อ Supabase, การแจ้งเตือน LINE, กฎเวรอัตโนมัติ และทีมช่าง</p></div></div>

    <section className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-indigo-950/35 to-zinc-900 border border-zinc-800 rounded-[2rem] p-6"><div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-indigo-500/10 blur-3xl"/><div className="relative flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-lg font-black">{profileName.replace(/^นาย/, '').trim().slice(0, 2) || 'MT'}</div><div><h2 className="font-extrabold text-lg">{profileName}</h2><p className="text-xs text-zinc-400 mt-1">{roleLabel(profile.role)} · {profile.department_code || 'MVR–MSR'} · {canManage ? 'แก้ไขการตั้งค่าได้' : 'ดูการตั้งค่าได้เท่านั้น'}</p></div></div></section>

    <div className="flex gap-2 overflow-auto no-scrollbar">{([
      ['overview', <Sparkles className="w-4 h-4"/>, 'ภาพรวมระบบ'],
      ['technicians', <UserCheck className="w-4 h-4"/>, 'จัดการช่าง'],
      ['duty', <Calendar className="w-4 h-4"/>, 'กำหนดเวร'],
      ['shifts', <Clock className="w-4 h-4"/>, 'กะและเวลา'],
      ['teams', <Users className="w-4 h-4"/>, 'ทีมและสมาชิก'],
      ['security', <Shield className="w-4 h-4"/>, 'ความปลอดภัย'],
    ] as const).map(([id, icon, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={`btn-dark-secondary whitespace-nowrap ${tab === id ? '!bg-indigo-600 !border-indigo-500 !text-white' : ''}`}>{icon}{label}</button>)}</div>

    {tab === 'overview' && <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-[#18181B] rounded-[2rem] p-6 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-white flex items-center gap-2"><AppIcon name="success" className="w-7 h-7" label="เชื่อมต่อสำเร็จ"/><span>สถานะการเชื่อมต่อ Supabase</span></h3><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Connected (Live)</span></div>
          <div className="p-3.5 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-xs font-mono space-y-2 text-zinc-400"><div><span className="text-zinc-500 block text-[10px]">DATA SOURCE:</span><span className="text-indigo-300">Supabase REST API · public/config.js</span></div><div><span className="text-zinc-500 block text-[10px]">SECURITY LEVEL:</span><span className="text-emerald-400">Publishable Key + Row Level Security</span></div><div><span className="text-zinc-500 block text-[10px]">CLIENT DATA:</span><span className="text-zinc-200">ไม่ใช้ Mock Data หรือ Local Storage</span></div></div>
          <div className="grid grid-cols-4 gap-2">{[[bundle.technicians.length, 'ช่าง'], [bundle.machines.length, 'เครื่อง'], [bundle.templates.length, 'Checklist'], [bundle.teams.length, 'ทีม']].map(([value, label]) => <div key={label as string} className="rounded-xl bg-zinc-900/70 border border-zinc-800 p-3 text-center"><strong className="text-lg text-indigo-300">{value}</strong><p className="text-[9px] text-zinc-500">{label}</p></div>)}</div>
        </section>

        <section className="bg-[#18181B] rounded-[2rem] p-6 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-white flex items-center gap-2"><AppIcon name={bundle.lineGroups.some((row) => row.is_active !== false) ? 'success' : 'warning'} className="w-7 h-7" label={bundle.lineGroups.some((row) => row.is_active !== false) ? 'LINE ใช้งานอยู่' : 'LINE รอตั้งค่า'}/><span>การแจ้งเตือน LINE Messaging API</span></h3><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${bundle.lineGroups.some((row) => row.is_active !== false) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{bundle.lineGroups.some((row) => row.is_active !== false) ? 'Active' : 'รอตั้งค่า'}</span></div>
          <div className="space-y-2"><div><label className="text-[11px] font-bold text-zinc-300">ชื่อกลุ่ม LINE ปลายทาง</label><div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-emerald-300 font-bold mt-1">{bundle.lineGroups.find((row) => row.is_active !== false)?.group_name || 'MVR–MSR Maintenance'}</div></div><div><label className="text-[11px] font-bold text-zinc-300">รูปแบบการแจ้งเตือน</label><div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-400 mt-1">งานใหม่ · ก่อนเริ่ม · ก่อนครบกำหนด · เกินกำหนด · ส่งตรวจ</div></div></div>
          {onOpenLine && <button onClick={onOpenLine} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"><Send className="w-3.5 h-3.5"/><span>เปิดหน้าตั้งค่าและทดสอบ LINE</span><ExternalLink className="w-3.5 h-3.5"/></button>}
        </section>
      </div>

      <section className="bg-[#18181B] rounded-[2rem] p-6 border border-zinc-800 shadow-xl space-y-4"><div className="flex items-center justify-between gap-3"><h3 className="text-base font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-400"/><span>กฎเวรทำความสะอาดปัจจุบัน</span></h3><button type="button" onClick={() => setTab('duty')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">แก้กฎเวร →</button></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs"><div className="p-3.5 bg-zinc-900/70 rounded-2xl border border-zinc-800 space-y-2"><span className="font-bold text-indigo-300 block">ห้องช่างหลัก</span><p className="text-white text-sm font-bold">MVR ↔ MSR</p><p className="text-[11px] text-zinc-400">สลับกันทำทุกวัน · 27/08/2026 เริ่ม MVR</p></div><div className="p-3.5 bg-zinc-900/70 rounded-2xl border border-zinc-800 space-y-2"><span className="font-bold text-emerald-400 block">พื้นที่ Lotus</span><p className="text-white text-sm font-bold">MVR-LOTUS ทุกวัน</p><p className="text-[11px] text-zinc-400">พื้นที่แยก จึงสร้างเวรทุกวันทั้งกะเช้าและกะดึก</p></div><div className="p-3.5 bg-zinc-900/70 rounded-2xl border border-zinc-800 space-y-2"><span className="font-bold text-zinc-300 block">MPR</span><p className="text-white text-sm font-bold">Manual</p><p className="text-[11px] text-zinc-400">มี Checklist มาตรฐานเดียวกัน แต่ยังไม่สร้างเวรอัตโนมัติ</p></div></div></section>

      <section className="bg-[#18181B] rounded-[2rem] p-6 border border-zinc-800 shadow-xl space-y-4"><div className="flex items-center justify-between gap-3"><h3 className="text-base font-bold text-white flex items-center gap-2"><AppIcon name="technicians" className="w-8 h-8" label="ทำเนียบช่าง"/><span>ทำเนียบช่างเทคนิคและสิทธิ์เข้าใช้งาน</span></h3><button type="button" onClick={() => setTab('technicians')} className="text-xs font-bold text-indigo-500 hover:text-indigo-600">จัดการทั้งหมด →</button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">{directoryRows.filter((technician) => technician.is_active !== false).slice(0, 9).map((technician) => <div key={technician.id} className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-2"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><span className="text-xs font-bold font-mono text-indigo-500 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">{technician.employee_code || 'ช่าง'}</span><p className="font-bold text-white mt-1.5 truncate">{technician.full_name}</p></div><span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">ทีม {technician.shift || '-'}</span></div><div className="text-[11px] text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-800/80"><span>{technician.department_code}</span><span className="font-mono text-zinc-500">Active</span></div></div>)}</div>{directoryRows.filter((technician) => technician.is_active !== false).length > 9 && <p className="text-[11px] text-zinc-500">แสดง 9 จาก {directoryRows.filter((technician) => technician.is_active !== false).length} คน · ดูและแก้ไขทั้งหมดในแท็บ “จัดการช่าง”</p>}</section>

      <div className="grid sm:grid-cols-3 gap-3">{[[Cpu, 'Data API', 'Supabase REST เชื่อมต่อจริง'], [Shield, 'RLS Security', 'ควบคุมสิทธิ์ตามบทบาท'], [Wrench, 'Maintenance Core', 'PM · งานซ่อม · เวร · Checklist']].map(([Icon, title, desc]) => { const Component = Icon as React.FC<{className?: string}>; return <div key={title as string} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-3"><Component className="w-5 h-5 text-emerald-400"/><div><p className="text-xs font-bold">{title as string}</p><p className="text-[10px] text-zinc-500 mt-0.5">{desc as string}</p></div></div>; })}</div>
    </div>}

    {tab === 'technicians' && <TechnicianManagement
      technicians={bundle.managedTechnicians}
      departments={[...new Set(bundle.teams.map((row) => text(row.department_code)).filter(Boolean))].sort()}
      ready={bundle.technicianAdminReady}
      canAdmin={profile.role === 'admin'}
      busy={busy}
      onSave={onSaveTechnician}
      onDelete={onDeleteTechnician}
    />}


    {tab === 'duty' && <div className="space-y-5">
      <section className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div><h2 className="font-extrabold flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-400"/>กำหนดเวรอัตโนมัติ</h2><p className="text-[11px] text-zinc-500 mt-1">เลือกวัน กะ และรูปแบบของแต่ละแผนก · MVR/MSR ใช้ Rotation Group เดียวกันเพื่อสลับพื้นที่ห้องช่าง</p></div>
          {canManage && <button type="button" disabled={busy} onClick={() => onSaveDutyRules(dutyRules)} className="btn-dark-primary shrink-0"><Save className="w-4 h-4"/>{busy ? 'กำลังบันทึก...' : 'บันทึกกฎเวร'}</button>}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-5">{dutyRules.map((row) => {
          const mode = text(row.schedule_mode) || 'manual';
          const days = (row.work_days || []).map(Number);
          const shiftsSelected = (row.shift_codes || []).map(String);
          return <article key={row.department_code} className="rounded-3xl bg-zinc-900/65 border border-zinc-800 p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-black text-indigo-400">{row.department_code}</span><h3 className="font-extrabold mt-0.5">{row.department_code === 'MVR-LOTUS' ? 'พื้นที่ Lotus' : row.department_code === 'MPR' ? 'MPR' : 'ห้องช่างหลัก'}</h3><p className="text-[10px] text-zinc-500 mt-1">{scheduleModeLabel(mode)} · {row.auto_create === false ? 'ไม่สร้างอัตโนมัติ' : 'สร้างอัตโนมัติ'}</p></div><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${mode === 'daily' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : mode === 'alternate' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{scheduleModeLabel(mode)}</span></div>

            <label className="field-dark"><span>รูปแบบเวร</span><select disabled={!canManage} value={mode} onChange={(event) => {
              const nextMode = event.target.value;
              updateDutyRule(row.department_code, 'schedule_mode', nextMode);
              updateDutyRule(row.department_code, 'auto_create', nextMode !== 'manual');
            }}><option value="daily">ทุกวัน (Daily)</option><option value="alternate">สลับแผนก (Alternate)</option><option value="manual">สร้างเอง (Manual)</option></select></label>

            <div><p className="text-[10px] font-bold text-zinc-400 mb-2">วันที่ต้องทำ</p><div className="grid grid-cols-7 gap-1.5">{dutyDays.map(([value, label]) => <button key={value} type="button" disabled={!canManage || mode === 'manual'} onClick={() => toggleDutyArrayValue(row.department_code, 'work_days', value)} className={`h-9 rounded-xl border text-[10px] font-black transition ${days.includes(value) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>{label}</button>)}</div></div>

            <div><p className="text-[10px] font-bold text-zinc-400 mb-2">กะที่สร้างเวร</p><div className="grid grid-cols-2 gap-2">{[['DAY','กะเช้า 20:00'],['NIGHT','กะดึก 08:00']].map(([value,label]) => <button key={value} type="button" disabled={!canManage || mode === 'manual'} onClick={() => toggleDutyArrayValue(row.department_code, 'shift_codes', value)} className={`h-10 rounded-xl border text-[11px] font-bold ${shiftsSelected.includes(value) ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>{label}</button>)}</div></div>

            {mode === 'alternate' && <div className="grid sm:grid-cols-3 gap-2">
              <label className="field-dark"><span>Rotation Group</span><input disabled={!canManage} value={row.rotation_group || 'MAIN_ROOM'} onChange={(event) => updateDutyRule(row.department_code, 'rotation_group', event.target.value)}/></label>
              <label className="field-dark"><span>ลำดับ</span><input disabled={!canManage} type="number" min="1" value={row.rotation_order || 1} onChange={(event) => updateDutyRule(row.department_code, 'rotation_order', Number(event.target.value))}/></label>
              <label className="field-dark"><span>วันเริ่มรอบ</span><input disabled={!canManage} type="date" value={row.anchor_date || todayISO()} onChange={(event) => updateDutyRule(row.department_code, 'anchor_date', event.target.value)}/></label>
            </div>}
          </article>;
        })}</div>
      </section>

      <section className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-5 sm:p-7 shadow-2xl">
        <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-400"/><div><h2 className="font-extrabold">ตัวอย่างเวร 8 วันถัดไป</h2><p className="text-[11px] text-zinc-500 mt-0.5">คำนวณจากกฎที่กำลังแสดงอยู่ ก่อนกดบันทึก</p></div></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">{dutyPreview.map((row) => <div key={row.iso} className="rounded-2xl bg-zinc-900/65 border border-zinc-800 p-3.5"><p className="text-[10px] font-mono text-zinc-500">{row.iso}</p><div className="flex flex-wrap gap-1.5 mt-2">{row.departments.length ? row.departments.map((dept) => <span key={dept} className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300">{dept}</span>) : <span className="text-[10px] text-zinc-600">ไม่มีเวรอัตโนมัติ</span>}</div></div>)}</div>
      </section>
    </div>}

    {tab === 'shifts' && <section className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-5 sm:p-7 shadow-2xl">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-800"><div><h2 className="font-extrabold">เวลากะและเวลาทำเวร</h2><p className="text-[11px] text-zinc-500 mt-1">A/B ใช้ DAY/NIGHT ตามรอบ 14 วัน · O ใช้กะปกติและไม่สร้างเวรอัตโนมัติ</p></div>{canManage && <button type="button" disabled={busy} onClick={() => onSave(shifts, members)} className="btn-dark-primary shrink-0"><Save className="w-4 h-4"/> บันทึก</button>}</div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">{shifts.map((row) => <article key={row.id} className="rounded-2xl bg-zinc-900/65 border border-zinc-800 p-4"><div className="flex justify-between"><div><span className="text-[10px] font-bold text-indigo-400">{row.department_code}</span><h3 className="font-extrabold mt-1">{row.shift_code === 'DAY' ? 'กะเช้า' : row.shift_code === 'NIGHT' ? 'กะดึก' : 'กะปกติ O'}</h3></div><Clock className="w-5 h-5 text-violet-400"/></div><div className="grid grid-cols-2 gap-2 mt-4">{([
        ['start_time', 'เริ่มงาน', 'time'],
        ['end_time', 'เลิกงาน', 'time'],
        ['duty_start_offset_minutes', 'เริ่มเวรหลังเลิก', 'number'],
        ['duty_duration_minutes', 'เวลาทำเวร', 'number'],
        ['advance_minutes', 'แจ้งล่วงหน้า', 'number'],
        ['reminder_before_due_minutes', 'เตือนก่อนครบ', 'number'],
      ] as const).map(([key, label, type]) => <label key={key} className="field-dark"><span>{label}</span><input disabled={!canManage} type={type} min="0" value={type === 'time' ? text(row[key]).slice(0, 5) : row[key] ?? 0} onChange={(event) => updateShift(row.id, key, type === 'number' ? Number(event.target.value) : event.target.value)}/>{type === 'number' && <small>นาที</small>}</label>)}</div></article>)}</div>
    </section>}

    {tab === 'teams' && <section className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-5 sm:p-7 shadow-2xl">
      <div className="pb-4 border-b border-zinc-800"><h2 className="font-extrabold">ทีม A/B/O และสมาชิก</h2><p className="text-[11px] text-zinc-500 mt-1">เลือกจัดสมาชิกทีละทีมได้ง่าย ทั้งบนคอมพิวเตอร์และโทรศัพท์ · ทุกคนมีสิทธิ์เท่ากัน ไม่มีหัวหน้าทีม</p></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">{sortedTeams.map((team) => {
        const crew = teamCrewCode(team) || '-';
        const assignedRows = (members[text(team.id)] || []).map((id) => techniciansById.get(id)).filter(Boolean) as AnyRow[];
        const eligibleCount = eligibleTechnicians(team).length;
        return <article key={team.id} className="rounded-3xl bg-zinc-900/65 border border-zinc-800 p-4 flex flex-col min-h-60 hover:border-zinc-700 transition">
          <div className="flex items-center gap-3"><div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${teamTone(crew)} flex items-center justify-center text-lg font-black text-white shadow-lg shrink-0`}>{crew}</div><div className="min-w-0 flex-1"><h3 className="font-extrabold truncate">{team.team_name}</h3><p className="text-[10px] text-zinc-500 mt-0.5">{team.department_code} · ทีม {crew}{crew === 'O' ? ' · 08:00–17:00' : ''}</p></div><span className="rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-[10px] font-extrabold text-zinc-300 shrink-0">{assignedRows.length}/{eligibleCount} คน</span></div>
          <div className="mt-4 flex-1"><p className="text-[10px] font-bold text-zinc-500">สมาชิกปัจจุบัน</p>{assignedRows.length ? <div className="mt-2 flex flex-wrap gap-1.5">{assignedRows.slice(0, 5).map((row) => <span key={row.id} className="max-w-full truncate rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-[10px] font-bold text-zinc-300">{row.full_name}</span>)}{assignedRows.length > 5 && <span className="rounded-full bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1 text-[10px] font-bold text-indigo-300">+{assignedRows.length - 5} คน</span>}</div> : <div className="mt-2 rounded-2xl border border-dashed border-zinc-700 p-4 text-center text-[10px] text-zinc-600">ยังไม่ได้กำหนดสมาชิก</div>}</div>
          {crew === 'O' && <p className="mt-3 text-[10px] text-emerald-400/80">กะปกติ · ระบบไม่สร้างงานเวรอัตโนมัติ</p>}
          <button type="button" onClick={() => openTeam(team)} className={`mt-4 w-full ${canManage ? 'btn-dark-primary' : 'btn-dark-secondary'}`}><Users className="w-4 h-4"/>{canManage ? 'จัดสมาชิกทีม' : 'ดูสมาชิกทีม'}</button>
        </article>;
      })}</div>
    </section>}

    {tab === 'security' && <section className="grid lg:grid-cols-[1fr_.8fr] gap-6"><div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 shadow-2xl"><h2 className="font-extrabold flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-400"/> กฎความปลอดภัย</h2><div className="space-y-3 mt-5">{[
      ['Row Level Security', 'จำกัดข้อมูลตามบัญชีและสิทธิ์ใน Supabase'],
      ['Checklist บังคับ', 'ฐานข้อมูลตรวจหัวข้อบังคับก่อนส่งงาน'],
      ['รูปหลักฐาน', 'ตรวจจำนวนรูปขั้นต่ำตามแม่แบบ'],
      ['สิทธิ์ตรวจรับ', 'เฉพาะ Admin/Supervisor อนุมัติหรือส่งกลับ'],
    ].map(([title, description]) => <div key={title} className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0"/><div><p className="text-xs font-bold">{title}</p><p className="text-[10px] text-zinc-500 mt-1">{description}</p></div></div>)}</div></div><div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 shadow-2xl"><h2 className="font-extrabold flex items-center gap-2"><Database className="w-5 h-5 text-indigo-400"/> ข้อมูลเชื่อมต่อ</h2><div className="grid grid-cols-2 gap-3 mt-5">{[
      [bundle.technicians.length, 'ช่าง'],
      [bundle.machines.length, 'เครื่องจักร'],
      [bundle.templates.length, 'Checklist'],
      [bundle.teams.length, 'ทีม'],
    ].map(([value, label]) => <div key={label as string} className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 text-center"><strong className="text-2xl text-indigo-300">{value}</strong><p className="text-[10px] text-zinc-500 mt-1">{label}</p></div>)}</div><div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"><Wrench className="w-5 h-5 text-emerald-400"/><div><p className="text-xs font-bold text-emerald-300">Supabase · เชื่อมต่อแล้ว</p><p className="text-[10px] text-zinc-500 mt-1">ใช้งานข้อมูลจริง ไม่ใช้ Mock Data</p></div></div></div></section>}

    {editingTeam && <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="team-picker-title">
      <section className="w-full max-w-2xl max-h-[calc(100dvh-.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border border-zinc-800 bg-[#18181B] shadow-2xl flex flex-col">
        <header className="shrink-0 px-5 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900/65 flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><div className={`w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-tr ${teamTone(teamCrewCode(editingTeam))} flex items-center justify-center font-black`}>{teamCrewCode(editingTeam)}</div><div className="min-w-0"><h2 id="team-picker-title" className="font-extrabold truncate">จัดสมาชิก {editingTeam.team_name}</h2><p className="mt-0.5 text-[10px] text-zinc-500">แสดงเฉพาะ {editingTeam.department_code} ทีม {teamCrewCode(editingTeam)} เท่านั้น</p></div></div><button type="button" onClick={() => setEditingTeam(null)} className="w-9 h-9 rounded-xl text-zinc-400 hover:bg-zinc-800 flex items-center justify-center" aria-label="ปิด"><X className="w-5 h-5"/></button></header>
        <div className="min-h-0 flex-1 p-4 sm:p-6 overflow-y-auto overscroll-contain table-container"><TechnicianPicker technicians={bundle.technicians} selectedIds={draftMembers} onChange={setDraftMembers} disabled={!canManage} lockDepartment={text(editingTeam.department_code)} lockShift={teamCrewCode(editingTeam)} compact emptyText={`ไม่พบช่าง ${editingTeam.department_code} ทีม ${teamCrewCode(editingTeam)}`}/></div>
        <footer className="shrink-0 px-4 sm:px-6 py-4 border-t border-zinc-800 bg-zinc-900/65 flex items-center justify-between gap-3"><p className="hidden sm:block text-[10px] text-zinc-500">เลือกแล้ว {draftMembers.length} คน · ไม่มีการกำหนดหัวหน้าทีม</p><div className="flex gap-2 w-full sm:w-auto"><button type="button" onClick={() => setEditingTeam(null)} className="btn-dark-secondary flex-1 sm:flex-none">{canManage ? 'ยกเลิก' : 'ปิด'}</button>{canManage && <button type="button" disabled={busy} onClick={saveTeam} className="btn-dark-primary flex-1 sm:flex-none"><Save className="w-4 h-4"/>{busy ? 'กำลังบันทึก...' : `บันทึก ${draftMembers.length} คน`}</button>}</div></footer>
      </section>
    </div>}
  </div>;
};
