import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Check, CheckCircle2, Clock, MapPin, Play, Printer,
  Save, Send, Upload, User, Wrench, X,
} from '../icons';
import type { MaintenanceRecord, WorkExecutionPayload } from '../types';
import { formatThaiDate, thaiStatus } from '../lib/models';
import { api } from '../lib/api';
import { useDialogLifecycle } from '../lib/useDialogLifecycle';
import { AppIcon, taskStatusIcon } from './AppIcon';

interface TaskDetailModalProps {
  record: MaintenanceRecord | null;
  canEdit: boolean;
  canManage: boolean;
  busy: boolean;
  onClose: () => void;
  onStart: (id: string) => Promise<void>;
  onSave: (id: string, payload: WorkExecutionPayload, submit: boolean) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onReturn: (id: string, reason: string) => Promise<void>;
}

const selectOptions: Record<string, Array<[string, string]>> = {
  normal_abnormal: [['', 'ยังไม่ตรวจ'], ['normal', 'ปกติ'], ['abnormal', 'ผิดปกติ']],
  pass_fail: [['', 'ยังไม่ตรวจ'], ['pass', 'ผ่าน'], ['fail', 'ไม่ผ่าน']],
  done_not_done: [['', 'ยังไม่ตรวจ'], ['done', 'ทำแล้ว'], ['not_done', 'ยังไม่ได้ทำ']],
  photo: [['', 'ยังไม่แนบ'], ['attached', 'แนบแล้ว']],
  signature: [['', 'ยังไม่ลงชื่อ'], ['signed', 'ลงชื่อแล้ว']],
};

function abnormal(answerType: string, value: string, min?: number | null, max?: number | null) {
  if (['abnormal', 'fail', 'not_done', 'ผิดปกติ', 'ไม่ผ่าน'].includes(value.toLowerCase())) return true;
  if (answerType === 'number' && value !== '') {
    const number = Number(value);
    return (min !== null && min !== undefined && number < min) || (max !== null && max !== undefined && number > max);
  }
  return false;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  record, canEdit, canManage, busy, onClose, onStart, onSave, onApprove, onReturn,
}) => {
  const [answers, setAnswers] = useState<Record<string, { value: string; notes: string }>>({});
  const [summary, setSummary] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [machineCanRun, setMachineCanRun] = useState<'' | 'true' | 'false'>('');
  const [immediateAction, setImmediateAction] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [itemFiles, setItemFiles] = useState<Record<string, File[]>>({});
  const [returnReason, setReturnReason] = useState('');
  const [showReturn, setShowReturn] = useState(false);
  const [validation, setValidation] = useState('');

  useDialogLifecycle(Boolean(record), onClose);

  useEffect(() => {
    if (!record) return;
    setAnswers(Object.fromEntries(record.checklists.map((item) => [item.id, { value: item.answer || '', notes: item.notes || '' }])));
    setSummary(record.raw?.result_summary || '');
    setFiles([]);
    setItemFiles({});
    setValidation('');
    setShowReturn(false);
    setReturnReason('');
  }, [record]);

  const resultRows = useMemo(() => record?.checklists.map((item) => {
    const answer = answers[item.id] || { value: '', notes: '' };
    return {
      workOrderItemId: item.id,
      answerType: item.answerType || 'normal_abnormal',
      value: answer.value,
      notes: answer.notes,
      isAbnormal: abnormal(item.answerType || '', answer.value, item.minValue, item.maxValue),
    };
  }) || [], [record, answers]);

  if (!record) return null;
  const editableStatus = !['submitted', 'approved', 'cancelled'].includes(record.rawStatus);
  const editable = canEdit && editableStatus;
  const abnormalCount = resultRows.filter((row) => row.isAbnormal).length;

  const save = async (submit: boolean) => {
    setValidation('');
    if (submit) {
      const missing = record.checklists.find((item) => item.required && !answers[item.id]?.value.trim());
      if (missing) return setValidation(`กรุณากรอกหัวข้อบังคับ “${missing.name}”`);
      const missingNote = resultRows.find((row) => row.isAbnormal && !row.notes.trim());
      if (missingNote) return setValidation('ผลที่ผิดปกติต้องกรอกหมายเหตุใต้หัวข้อนั้น');
      if (abnormalCount > 0 && !immediateAction.trim()) return setValidation('กรุณาระบุการแก้ไขเบื้องต้นเมื่อพบความผิดปกติ');
      const missingPhoto = resultRows.find((row) => {
        if (!row.isAbnormal) return false;
        const item = record.checklists.find((entry) => entry.id === row.workOrderItemId);
        if (!item?.raw?.require_photo_if_abnormal) return false;
        const existing = (item.attachments || []).some((file) => String(file.mime_type || '').startsWith('image/'));
        const selected = (itemFiles[row.workOrderItemId] || []).some((file) => file.type.startsWith('image/'));
        return !existing && !selected;
      });
      if (missingPhoto) {
        const item = record.checklists.find((entry) => entry.id === missingPhoto.workOrderItemId);
        return setValidation(`หัวข้อผิดปกติ “${item?.name || 'Checklist'}” ต้องแนบรูปในหัวข้อนั้นก่อนส่ง`);
      }
    }
    await onSave(record.id, { results: resultRows, resultSummary: summary, severity, machineCanRun, immediateAction, files, itemFiles }, submit);
  };

  const openAttachment = async (objectPath: string) => {
    try {
      const url = await api.getWorkFileUrl(objectPath);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setValidation(String((error as Error)?.message || error));
    }
  };

  const badgeClass = record.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : record.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : record.status === 'submitted' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : record.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-800 text-zinc-300 border-zinc-700';

  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/65 backdrop-blur-md">
    <section role="dialog" aria-modal="true" className="bg-[#18181B] sm:rounded-[2rem] rounded-t-[2rem] max-w-4xl w-full max-h-[calc(100dvh-.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden shadow-2xl border border-zinc-800 flex flex-col">
      <header className="shrink-0 px-5 sm:px-7 py-5 border-b border-zinc-800 bg-zinc-900/60 flex items-start justify-between gap-4">
        <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap mb-2"><span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700">{record.department}</span><span className="font-mono text-xs font-bold text-indigo-300">{record.taskNumber}</span><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${badgeClass}`}><AppIcon name={taskStatusIcon(record.status, record.checklistAbnormal > 0)} className="w-4 h-4"/>{thaiStatus[record.rawStatus] || record.rawStatus}</span></div><h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">{record.title}</h2></div>
        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400" aria-label="ปิด" title="ปิด (Esc)"><X className="w-5 h-5"/></button>
      </header>

      <div className="min-h-0 flex-1 p-5 sm:p-7 overflow-y-auto overscroll-contain table-container space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            [<Wrench className="w-4 h-4"/>, 'เครื่องจักร', `${record.machineCode} · ${record.machineName}`],
            [<User className="w-4 h-4"/>, 'ผู้รับผิดชอบ', record.technician],
            [<Calendar className="w-4 h-4"/>, 'กำหนดส่ง', formatThaiDate(record.dueAt)],
            [<MapPin className="w-4 h-4"/>, 'พื้นที่', record.location || record.department],
          ].map(([icon, label, value], index) => <div key={index} className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800"><div className="flex items-center gap-2 text-[11px] text-zinc-500">{icon}{label}</div><p className="text-xs font-bold text-zinc-200 mt-2 line-clamp-2">{value}</p></div>)}
        </div>

        {record.raw?.rejection_reason && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200"><strong>เหตุผลที่ส่งกลับ:</strong> {record.raw.rejection_reason}</div>}
        {record.abnormalDetails && <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex gap-3"><AppIcon name="warning" className="w-9 h-9 shrink-0"/><div><strong>ความผิดปกติที่บันทึกไว้</strong><p className="mt-1 leading-relaxed">{record.abnormalDetails}</p></div></div>}

        <section><div className="flex items-center justify-between mb-3"><div><h3 className="font-bold text-white">Checklist งาน ({record.checklists.length} หัวข้อ)</h3><p className="text-[11px] text-zinc-500 mt-1">หัวข้อ * ต้องกรอกครบก่อนส่งตรวจ</p></div><span className="text-xs font-bold text-indigo-400">{resultRows.filter((row) => row.value).length}/{record.checklists.length}</span></div>
          {!editable && <div className="mb-3 flex items-start gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-[11px] leading-relaxed text-indigo-700"><Clock className="mt-0.5 h-4 w-4 shrink-0"/><span>ขณะนี้แสดง Checklist แบบอ่านอย่างเดียว รายการที่ยังไม่ตรวจจะแสดงชัดเจน และจะกรอกได้เมื่อเริ่มงานหรือเมื่อคุณเป็นผู้รับผิดชอบใบงานนี้</span></div>}
          <div className="space-y-3">
            {record.checklists.length ? record.checklists.map((item, index) => {
              const state = answers[item.id] || { value: '', notes: '' };
              const isAbnormal = abnormal(item.answerType || '', state.value, item.minValue, item.maxValue);
              const set = (next: Partial<typeof state>) => setAnswers((old) => ({ ...old, [item.id]: { ...state, ...next } }));
              return <div key={item.id} className={`rounded-2xl border p-4 ${isAbnormal ? 'bg-rose-500/10 border-rose-500/20' : 'bg-zinc-900/60 border-zinc-800'}`}>
                <div className="flex gap-3"><span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${isAbnormal ? 'bg-rose-500 text-white' : state.value ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>{state.value && !isAbnormal ? <Check className="w-4 h-4"/> : index + 1}</span><div className="flex-1 min-w-0"><p className="text-sm font-bold text-zinc-200">{item.name}{item.required && <span className="text-rose-400"> *</span>}</p>{item.standardValue && <p className="text-[11px] text-zinc-500 mt-1">มาตรฐาน {item.standardValue}</p>}</div></div>
                <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2 mt-3">
                  {item.answerType === 'number' ? <div className="flex"><input disabled={!editable} type="number" step="any" value={state.value} onChange={(e) => set({ value: e.target.value })} placeholder="ค่าที่วัดได้" className="checklist-control w-full bg-zinc-950 border border-zinc-800 rounded-l-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"/><span className="px-3 flex items-center bg-zinc-800 rounded-r-xl text-xs text-zinc-400">{item.unit || 'ค่า'}</span></div> : item.answerType === 'text' ? <input disabled={!editable} value={state.value} onChange={(e) => set({ value: e.target.value })} placeholder="บันทึกผลตรวจ" className="checklist-control bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"/> : <select disabled={!editable} value={state.value} onChange={(e) => set({ value: e.target.value })} className="checklist-control bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500">{(selectOptions[item.answerType || 'normal_abnormal'] || [['', 'ยังไม่บันทึก'], ['ok', 'เรียบร้อย']]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
                  <input disabled={!editable} value={state.notes} onChange={(e) => set({ notes: e.target.value })} placeholder={isAbnormal ? 'ระบุความผิดปกติ (จำเป็น)' : 'หมายเหตุเพิ่มเติม'} className="checklist-control bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"/>
                </div>
                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-zinc-400">รูปหลักฐานของหัวข้อนี้ {isAbnormal && item.raw?.require_photo_if_abnormal ? <span className="text-rose-400">* จำเป็นเมื่อผิดปกติ</span> : null}</p>
                    {editable && <label className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-[10px] font-bold text-zinc-300 hover:border-indigo-500">
                      <Upload className="mr-1 inline h-3.5 w-3.5"/> เลือกรูป
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setItemFiles((old) => ({ ...old, [item.id]: Array.from(e.target.files || []) }))}/>
                    </label>}
                  </div>
                  {(itemFiles[item.id] || []).length > 0 && <p className="mt-2 text-[10px] text-indigo-300">เลือกรออัปโหลด {(itemFiles[item.id] || []).length} รูป</p>}
                  {(item.attachments || []).length > 0 && <div className="mt-2 flex flex-wrap gap-2">{(item.attachments || []).map((file) => <button type="button" key={file.id} onClick={() => openAttachment(String(file.object_path))} className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700">{file.original_name || 'เปิดรูปหลักฐาน'}</button>)}</div>}
                </div>
              </div>;
            }) : <div className="rounded-2xl bg-zinc-900/50 border border-dashed border-zinc-800 text-xs text-zinc-500 py-8 text-center">ใบงานนี้ไม่มี Checklist สามารถบันทึกผลสรุปแล้วส่งตรวจได้</div>}
          </div>
        </section>

        {editable && abnormalCount > 0 && <section className="rounded-2xl bg-rose-500/5 border border-rose-500/20 p-4"><h3 className="text-sm font-bold text-rose-300">รายละเอียดความผิดปกติ</h3><div className="grid sm:grid-cols-2 gap-3 mt-3"><select value={severity} onChange={(e) => setSeverity(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs"><option value="low">ต่ำ</option><option value="medium">ปานกลาง</option><option value="high">สูง</option><option value="critical">วิกฤต</option></select><select value={machineCanRun} onChange={(e) => setMachineCanRun(e.target.value as typeof machineCanRun)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs"><option value="">ยังไม่ระบุสถานะเครื่อง</option><option value="true">ยังเดินเครื่องได้</option><option value="false">ต้องหยุดเครื่อง</option></select><textarea value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} placeholder="การแก้ไขเบื้องต้น / วิธีควบคุมปัญหา" className="sm:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs min-h-20"/></div></section>}

        <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4"><h3 className="text-sm font-bold">ผลการดำเนินงานและหลักฐาน</h3><textarea disabled={!editable} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="สรุปสิ่งที่ดำเนินการและผลหลังทำงาน" className="checklist-control w-full mt-3 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-xs min-h-24"/>{editable && <label className="mt-3 flex items-center justify-center gap-2 border border-dashed border-zinc-700 rounded-xl py-3 text-xs text-zinc-400 hover:border-indigo-500 cursor-pointer"><Upload className="w-4 h-4"/> {files.length ? `เลือกแล้ว ${files.length} ไฟล์` : 'แนบรูป JPG/PNG/WebP หรือ PDF (ไฟล์ละไม่เกิน 10 MB)'}<input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))}/></label>}</section>

        {validation && <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">{validation}</div>}
        {showReturn && <section className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20"><label className="text-xs font-bold text-rose-300">เหตุผลที่ส่งกลับให้แก้ไข</label><textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs min-h-20"/><button disabled={!returnReason.trim() || busy} onClick={() => onReturn(record.id, returnReason)} className="mt-2 px-4 py-2 rounded-xl bg-rose-600 text-xs font-bold disabled:opacity-50">ยืนยันส่งกลับ</button></section>}
      </div>

      <footer className="shrink-0 px-4 sm:px-7 py-3 sm:py-4 bg-zinc-900/90 border-t border-zinc-800 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 sm:gap-3">
        <button onClick={() => window.print()} className="px-4 py-2.5 bg-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center gap-2"><Printer className="w-4 h-4"/> พิมพ์ใบงาน</button>
        <div className="flex w-full sm:w-auto flex-wrap justify-end gap-2">
          {editable && ['assigned', 'acknowledged', 'returned'].includes(record.rawStatus) && <button disabled={busy} onClick={() => onStart(record.id)} className="px-4 py-2.5 bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-2"><Play className="w-4 h-4"/> เริ่มงาน</button>}
          {editable && <><button disabled={busy} onClick={() => save(false)} className="px-4 py-2.5 bg-zinc-800 rounded-xl text-xs font-bold flex items-center gap-2"><Save className="w-4 h-4"/> บันทึกร่าง</button><button disabled={busy} onClick={() => save(true)} className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-xs font-bold flex items-center gap-2"><Send className="w-4 h-4"/> ส่งตรวจ</button></>}
          {canManage && record.rawStatus === 'submitted' && <><button disabled={busy} onClick={() => setShowReturn(!showReturn)} className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold">ส่งกลับแก้ไข</button><button disabled={busy} onClick={() => onApprove(record.id)} className="px-4 py-2.5 bg-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> อนุมัติ</button></>}
          <button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 rounded-xl text-xs text-zinc-300">ปิด</button>
        </div>
      </footer>
    </section>
  </div>;
};
