import React, { useEffect, useState } from 'react';
import { Calendar, ClipboardList, Plus, Users, Wrench, X } from '../icons';
import type { AnyRow, NewTaskPayload } from '../types';
import { todayISO } from '../lib/models';
import { useDialogLifecycle } from '../lib/useDialogLifecycle';
import { TechnicianPicker } from './TechnicianPicker';
import { AppIcon } from './AppIcon';

interface CreateTaskModalProps {
  isOpen: boolean;
  busy: boolean;
  canManage: boolean;
  technicians: AnyRow[];
  machines: AnyRow[];
  templates: AnyRow[];
  teams: AnyRow[];
  onClose: () => void;
  onCreate: (payload: NewTaskPayload) => Promise<void>;
}

const dateTime = (time: string) => `${todayISO()}T${time}`;
const defaults = (): NewTaskPayload => ({ sourceType: 'general', departmentCode: 'MVR', title: '', description: '', priority: 'normal', assignmentMode: 'individual', teamId: '', primaryTechnicianId: '', assigneeIds: [], machineId: '', checklistTemplateId: '', scheduledStartAt: dateTime('09:00'), dueAt: dateTime('20:00') });

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, busy, canManage, technicians, machines, templates, teams, onClose, onCreate }) => {
  const [form, setForm] = useState<NewTaskPayload>(defaults());
  const [error, setError] = useState('');
  useEffect(() => { if (isOpen) { setForm(defaults()); setError(''); } }, [isOpen]);
  useDialogLifecycle(isOpen, onClose);
  if (!isOpen) return null;
  const set = <K extends keyof NewTaskPayload>(key: K, value: NewTaskPayload[K]) => setForm((old) => ({ ...old, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!canManage) return setError('บัญชีช่างไม่มีสิทธิ์สร้างใบงาน');
    if (!form.title.trim() || !form.dueAt) return setError('กรุณากรอกชื่องานและกำหนดส่ง');
    await onCreate(form);
  };

  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md"><section className="bg-[#18181B] sm:rounded-[2rem] rounded-t-[2rem] max-w-3xl w-full max-h-[calc(100dvh-.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden border border-zinc-800 shadow-2xl flex flex-col"><header className="shrink-0 px-6 py-5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between"><div className="flex items-center gap-3"><AppIcon name="newTask" framed className="w-11 h-11 shrink-0" label="สร้างงานใหม่"/><div><h2 className="font-extrabold">สร้างงานมอบหมายใหม่</h2><p className="text-xs text-zinc-500">บันทึกจริงและแจ้ง LINE ตามคิวระบบ</p></div></div><button type="button" onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-xl" aria-label="ปิด" title="ปิด (Esc)"><X className="w-5 h-5"/></button></header>
    <form onSubmit={submit} className="min-h-0 flex-1 p-5 sm:p-7 overflow-y-auto overscroll-contain table-container space-y-5"><div className="grid sm:grid-cols-2 gap-4">
      <label className="field-dark"><span>ประเภทงาน *</span><select value={form.sourceType} onChange={(e) => set('sourceType', e.target.value)}><option value="general">งานทั่วไป</option><option value="duty">เวรประจำกะ (สร้างเอง)</option><option value="follow_up">งานติดตาม/แก้ไข</option></select></label>
      <label className="field-dark"><span>แผนก *</span><select value={form.departmentCode} onChange={(e) => set('departmentCode', e.target.value)}><option>MVR</option><option>MSR</option><option>MVR-LOTUS</option><option>MPR</option></select><small>งานเวรทุกแผนกสร้างด้วยตนเอง และ LINE แจ้งเตือนตามคิวอัตโนมัติ</small></label>
      <label className="field-dark sm:col-span-2"><span>ชื่องาน *</span><div className="relative"><ClipboardList className="input-icon"/><input className="with-icon" required maxLength={180} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="เช่น ตรวจสอบหลอดฮีทเตอร์ IVF#4"/></div></label>
      <label className="field-dark"><span>เครื่องจักร/พื้นที่</span><div className="relative"><Wrench className="input-icon"/><select className="with-icon" value={form.machineId} onChange={(e) => { const machine = machines.find((row) => row.id === e.target.value); setForm((old) => ({ ...old, machineId: e.target.value, departmentCode: machine?.department_code || old.departmentCode })); }}><option value="">ไม่ระบุเครื่องจักร</option>{machines.map((row) => <option key={row.id} value={row.id}>{row.machine_no} · {row.machine_name}</option>)}</select></div></label>
      <label className="field-dark"><span>Checklist</span><select value={form.checklistTemplateId} onChange={(e) => set('checklistTemplateId', e.target.value)}><option value="">ไม่ใช้ Checklist</option>{templates.filter((row) => row.is_active).map((row) => <option key={row.id} value={row.id}>{row.template_name}</option>)}</select></label>
      <label className="field-dark sm:col-span-2"><span>รูปแบบมอบหมาย</span><div className="grid grid-cols-3 gap-2">{[['individual', 'รายบุคคล'], ['multiple', 'หลายคน'], ['team', 'ทั้งทีม']].map(([value, label]) => <button key={value} type="button" onClick={() => setForm((old) => ({ ...old, assignmentMode: value, primaryTechnicianId: value === 'team' ? '' : old.primaryTechnicianId, teamId: value === 'team' ? old.teamId : '' }))} className={`rounded-2xl border px-3 py-3 text-xs font-extrabold transition ${form.assignmentMode === value ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'}`}>{label}</button>)}</div></label>
      {form.assignmentMode === 'team' ? <div className="sm:col-span-2 space-y-2"><div className="flex items-center gap-2 text-xs font-extrabold text-zinc-300"><Users className="w-4 h-4 text-indigo-400"/>เลือกทีมรับผิดชอบ</div><div className="grid sm:grid-cols-2 gap-2">{teams.filter((row) => row.is_active !== false && (!form.departmentCode || row.department_code === form.departmentCode)).map((row) => <button key={row.id} type="button" onClick={() => set('teamId', row.id)} className={`rounded-2xl border p-3 text-left transition ${form.teamId === row.id ? 'border-indigo-500 bg-indigo-500/15 shadow-[0_0_0_1px_rgba(99,102,241,.15)]' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'}`}><span className="block text-xs font-extrabold text-white">{row.team_name}</span><span className="block mt-1 text-[10px] text-zinc-500">{row.department_code} · ทีม {row.shift_code || row.team_code || '-'}</span></button>)}</div>{!teams.some((row) => row.is_active !== false && (!form.departmentCode || row.department_code === form.departmentCode)) && <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-xs text-zinc-500">ไม่พบทีมในแผนกนี้</p>}</div> : <div className="sm:col-span-2"><TechnicianPicker technicians={technicians} selectedIds={form.primaryTechnicianId ? [form.primaryTechnicianId] : []} onChange={(ids) => set('primaryTechnicianId', ids[0] || '')} preferredDepartment={form.departmentCode} title="เลือกผู้รับผิดชอบหลัก" description="ค้นหาชื่อหรือรหัส แล้วแตะเลือกได้ทันที" single compact /></div>}
      {(form.assignmentMode === 'multiple' || form.assignmentMode === 'team') && <div className="sm:col-span-2"><TechnicianPicker technicians={technicians} selectedIds={form.assigneeIds} onChange={(ids) => set('assigneeIds', ids)} preferredDepartment={form.departmentCode} title={form.assignmentMode === 'team' ? 'ผู้ร่วมงานเพิ่มเติม (ไม่บังคับ)' : 'เลือกผู้ร่วมงาน'} description={form.assignmentMode === 'team' ? 'สมาชิกของทีมจะถูกเพิ่มอัตโนมัติ เลือกเฉพาะคนเสริม' : 'แตะเลือกได้หลายคน ไม่ต้องกด Ctrl/Cmd'} /></div>}
      <label className="field-dark"><span>วันที่เริ่ม</span><div className="relative"><Calendar className="input-icon"/><input className="with-icon" type="datetime-local" value={form.scheduledStartAt} onChange={(e) => set('scheduledStartAt', e.target.value)}/></div></label>
      <label className="field-dark"><span>กำหนดส่ง *</span><input required type="datetime-local" value={form.dueAt} onChange={(e) => set('dueAt', e.target.value)}/></label>
      <label className="field-dark"><span>ระดับความสำคัญ</span><select value={form.priority} onChange={(e) => set('priority', e.target.value)}><option value="normal">ปกติ</option><option value="high">สูง</option><option value="urgent">เร่งด่วน</option><option value="low">ต่ำ</option></select></label>
      <label className="field-dark sm:col-span-2"><span>รายละเอียด</span><textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="ขอบเขตงาน สิ่งที่ต้องตรวจ และข้อควรระวัง" className="min-h-24"/></label>
    </div>{error && <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-3"><AppIcon name="error" className="w-9 h-9 shrink-0" label="เกิดข้อผิดพลาด"/><span>{error}</span></div>}<footer className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 mt-2 px-5 sm:px-7 py-4 border-t border-zinc-800 bg-[#18181B]/95 backdrop-blur flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-dark-secondary">ยกเลิก</button><button disabled={busy || !canManage} className="btn-dark-primary"><Plus className="w-4 h-4"/>{busy ? 'กำลังบันทึก...' : 'สร้างและแจ้งงาน'}</button></footer></form>
  </section></div>;
};
