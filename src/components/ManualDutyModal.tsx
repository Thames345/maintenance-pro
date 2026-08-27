import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, X } from '../icons';
import type { AnyRow } from '../types';
import { todayISO } from '../lib/models';
import { useDialogLifecycle } from '../lib/useDialogLifecycle';
import { TechnicianPicker } from './TechnicianPicker';
import { AppIcon } from './AppIcon';

export interface ManualDutyPayload {
  dutyDate: string;
  departmentCode: string;
  shiftCode: 'DAY' | 'NIGHT';
  teamId: string;
  primaryTechnicianId: string;
  checklistTemplateId: string;
  startsAt: string;
  dueAt: string;
  notes: string;
}

interface ManualDutyModalProps {
  open: boolean;
  busy: boolean;
  teams: AnyRow[];
  technicians: AnyRow[];
  templates: AnyRow[];
  onClose: () => void;
  onCreate: (payload: ManualDutyPayload) => Promise<void>;
}

const defaults = (): ManualDutyPayload => ({
  dutyDate: todayISO(),
  departmentCode: 'MVR',
  shiftCode: 'DAY',
  teamId: '',
  primaryTechnicianId: '',
  checklistTemplateId: '',
  startsAt: `${todayISO()}T20:00`,
  dueAt: `${todayISO()}T20:30`,
  notes: '',
});

export const ManualDutyModal: React.FC<ManualDutyModalProps> = ({ open, busy, teams, technicians, templates, onClose, onCreate }) => {
  const [form, setForm] = useState<ManualDutyPayload>(defaults());
  const filteredTeams = useMemo(() => teams.filter((team) => team.department_code === form.departmentCode), [teams, form.departmentCode]);
  const filteredTechs = useMemo(() => technicians.filter((tech) => tech.department_code === form.departmentCode), [technicians, form.departmentCode]);

  useDialogLifecycle(open, onClose);

  useEffect(() => {
    if (!open) return;
    setForm(defaults());
  }, [open]);

  if (!open) return null;

  const set = <K extends keyof ManualDutyPayload>(key: K, value: ManualDutyPayload[K]) => setForm((old) => ({ ...old, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onCreate(form);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center overflow-hidden bg-slate-950/55 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-duty-title"
        className="theme-light flex max-h-[calc(100dvh-.5rem)] w-full min-h-0 flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-4xl sm:rounded-[1.75rem]"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
          <div className="flex min-w-0 gap-3">
            <AppIcon name="duty" framed className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" label="สร้างเวรพิเศษ" />
            <div className="min-w-0">
              <h2 id="manual-duty-title" className="text-base font-extrabold text-slate-950 sm:text-lg">สร้างเวรเอง</h2>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-500 sm:text-xs">สร้างเวรด้วยตนเองทุกแผนก · LINE แจ้งเตือนอัตโนมัติตามเวลา</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            aria-label="ปิดหน้าต่างสร้างเวร"
            title="ปิด (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="table-container min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="field-dark"><span>วันที่เวร *</span><div className="relative"><Calendar className="input-icon"/><input className="with-icon" required type="date" value={form.dutyDate} onChange={(e) => set('dutyDate', e.target.value)}/></div></label>
              <label className="field-dark"><span>แผนก *</span><select value={form.departmentCode} onChange={(e) => setForm((old) => ({ ...old, departmentCode: e.target.value, teamId: '', primaryTechnicianId: '' }))}><option>MVR</option><option>MSR</option><option>MVR-LOTUS</option><option>MPR</option></select></label>
              <label className="field-dark"><span>กะ *</span><select value={form.shiftCode} onChange={(e) => set('shiftCode', e.target.value as 'DAY' | 'NIGHT')}><option value="DAY">กะเช้า</option><option value="NIGHT">กะดึก</option></select></label>
              <label className="field-dark"><span>ทีม</span><select value={form.teamId} onChange={(e) => set('teamId', e.target.value)}><option value="">ไม่ใช้ทีม</option>{filteredTeams.map((team) => <option key={team.id} value={team.id}>{team.team_name}</option>)}</select></label>

              <div className="sm:col-span-2">
                <TechnicianPicker
                  technicians={filteredTechs}
                  selectedIds={form.primaryTechnicianId ? [form.primaryTechnicianId] : []}
                  onChange={(ids) => set('primaryTechnicianId', ids[0] || '')}
                  lockDepartment={form.departmentCode}
                  title="เลือกผู้รับผิดชอบหลัก (ไม่บังคับ)"
                  description="หากไม่เลือก ระบบใช้สมาชิกคนแรกของทีม"
                  single
                  compact
                />
              </div>

              <label className="field-dark sm:col-span-2"><span>Checklist เวร</span><select value={form.checklistTemplateId} onChange={(e) => set('checklistTemplateId', e.target.value)}><option value="">ไม่ใช้ Checklist</option>{templates.filter((template) => template.template_type === 'duty' && template.is_active).map((template) => <option key={template.id} value={template.id}>{template.template_name}</option>)}</select></label>
              <label className="field-dark"><span>เริ่มทำเวร *</span><input required type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)}/></label>
              <label className="field-dark"><span>กำหนดส่ง *</span><input required type="datetime-local" value={form.dueAt} onChange={(e) => set('dueAt', e.target.value)}/></label>
              <label className="field-dark sm:col-span-2"><span>หมายเหตุ</span><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="min-h-16 resize-y"/></label>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4" style={{ paddingBottom: 'max(.75rem, env(safe-area-inset-bottom))' }}>
            <button type="button" onClick={onClose} disabled={busy} className="btn-dark-secondary">ยกเลิก</button>
            <button disabled={busy} className="btn-dark-primary"><Plus className="h-4 w-4"/> {busy ? 'กำลังสร้าง...' : 'สร้างเวรและใบงาน'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
};
