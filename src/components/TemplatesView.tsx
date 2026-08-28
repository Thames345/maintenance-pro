import React, { useMemo, useState } from 'react';
import { useDialogLifecycle } from '../lib/useDialogLifecycle';
import {
  ArrowDown, ArrowUp, CheckCircle2, ListChecks, LockKeyhole, Pencil,
  Plus, Save, ShieldCheck, Trash2, Wrench, X,
} from '../icons';
import type { AnyRow } from '../types';
import { AppIcon } from './AppIcon';

interface TemplatesViewProps {
  templates: AnyRow[];
  items: AnyRow[];
  workOrders: AnyRow[];
  pmPlans: AnyRow[];
  dutySchedules: AnyRow[];
  canManage: boolean;
  busy: boolean;
  onCreate: (payload: AnyRow, itemNames: string[]) => Promise<void>;
  onUpdate: (templateId: string, payload: AnyRow, items: AnyRow[]) => Promise<void>;
  onDelete: (template: AnyRow) => Promise<void>;
}

interface ItemDraft {
  id: string;
  item_name: string;
  section_name: string;
  answer_type: string;
  unit: string;
  min_value: string;
  max_value: string;
  is_required: boolean;
  require_photo: boolean;
  require_photo_if_abnormal: boolean;
  choicesText: string;
}

interface EditState {
  templateId: string;
  template_code: string;
  template_name: string;
  template_type: string;
  department_code: string;
  minimum_photos: number;
  is_active: boolean;
  is_system: boolean;
  items: ItemDraft[];
}

const typeNames: Record<string, string> = {
  pm: 'PM เครื่องจักร', duty: 'งานเวร', safety: 'ความปลอดภัย',
  calibration: 'สอบเทียบ', general: 'งานทั่วไป',
};

const answerNames: Record<string, string> = {
  normal_abnormal: 'ปกติ / ผิดปกติ',
  pass_fail: 'ผ่าน / ไม่ผ่าน',
  done_not_done: 'ทำแล้ว / ยังไม่ได้ทำ',
  number: 'ตัวเลข',
  select: 'ตัวเลือก',
  text: 'ข้อความ',
  photo: 'รูปภาพ',
  signature: 'ลายเซ็น',
};

const draftFromRow = (item: AnyRow): ItemDraft => ({
  id: String(item.id || ''),
  item_name: String(item.item_name || ''),
  section_name: String(item.section_name || ''),
  answer_type: String(item.answer_type || 'normal_abnormal'),
  unit: String(item.unit || ''),
  min_value: item.min_value === null || item.min_value === undefined ? '' : String(item.min_value),
  max_value: item.max_value === null || item.max_value === undefined ? '' : String(item.max_value),
  is_required: item.is_required !== false,
  require_photo: item.require_photo === true,
  require_photo_if_abnormal: item.require_photo_if_abnormal !== false,
  choicesText: Array.isArray(item.choices) ? item.choices.join(', ') : '',
});

const newDraft = (): ItemDraft => ({
  id: '', item_name: '', section_name: 'รายการตรวจ', answer_type: 'normal_abnormal',
  unit: '', min_value: '', max_value: '', is_required: true,
  require_photo: false, require_photo_if_abnormal: true, choicesText: '',
});

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates, items, workOrders, pmPlans, dutySchedules,
  canManage, busy, onCreate, onUpdate, onDelete,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [edit, setEdit] = useState<EditState | null>(null);
  useDialogLifecycle(Boolean(edit || selectedId || showCreate), () => {
    if (edit) setEdit(null);
    else if (showCreate) setShowCreate(false);
    else setSelectedId(null);
  });
  const [form, setForm] = useState({
    template_code: '', template_name: '', template_type: 'pm', department_code: '', minimum_photos: 2, items: '',
  });

  const selected = useMemo(
    () => templates.find((row) => row.id === selectedId) || null,
    [templates, selectedId],
  );

  const templateItems = (templateId: string) => items
    .filter((item) => item.template_id === templateId)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  const usage = (templateId: string) => ({
    work: workOrders.filter((row) => row.checklist_template_id === templateId).length,
    pm: pmPlans.filter((row) => row.checklist_template_id === templateId).length,
    duty: dutySchedules.filter((row) => row.checklist_template_id === templateId).length,
  });

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const names = form.items.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    if (!names.length) return;
    await onCreate(form, names);
    setForm({ template_code: '', template_name: '', template_type: 'pm', department_code: '', minimum_photos: 2, items: '' });
    setShowCreate(false);
  };

  const openEdit = (template: AnyRow) => {
    setEdit({
      templateId: template.id,
      template_code: String(template.template_code || ''),
      template_name: String(template.template_name || ''),
      template_type: String(template.template_type || 'general'),
      department_code: String(template.department_code || ''),
      minimum_photos: Number(template.minimum_photos || 0),
      is_active: template.is_active !== false,
      is_system: template.is_system === true,
      items: templateItems(template.id).map(draftFromRow),
    });
  };

  const patchItem = (index: number, patch: Partial<ItemDraft>) => {
    if (!edit) return;
    setEdit({ ...edit, items: edit.items.map((item, i) => i === index ? { ...item, ...patch } : item) });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (!edit) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= edit.items.length) return;
    const next = [...edit.items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setEdit({ ...edit, items: next });
  };

  const removeItem = (index: number) => {
    if (!edit || edit.items.length <= 1) return;
    const item = edit.items[index];
    if (item.item_name && !window.confirm(`ลบหัวข้อ “${item.item_name}” ออกจากแม่แบบใช่หรือไม่?`)) return;
    setEdit({ ...edit, items: edit.items.filter((_, i) => i !== index) });
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!edit) return;
    const cleanItems = edit.items.filter((item) => item.item_name.trim());
    if (!cleanItems.length) return;
    await onUpdate(edit.templateId, {
      template_code: edit.template_code,
      template_name: edit.template_name,
      template_type: edit.template_type,
      department_code: edit.department_code || null,
      minimum_photos: Number(edit.minimum_photos),
      is_active: edit.is_active,
    }, cleanItems.map((item) => ({
      id: item.id || null,
      item_name: item.item_name.trim(),
      section_name: item.section_name.trim() || null,
      answer_type: item.answer_type,
      unit: item.unit.trim() || null,
      min_value: item.min_value === '' ? null : Number(item.min_value),
      max_value: item.max_value === '' ? null : Number(item.max_value),
      is_required: item.is_required,
      require_photo: item.require_photo,
      require_photo_if_abnormal: item.require_photo_if_abnormal,
      choices: item.choicesText.split(',').map((value) => value.trim()).filter(Boolean),
    })));
    setEdit(null);
  };

  const deleteTemplate = async (template: AnyRow) => {
    const refs = usage(template.id);
    const total = refs.work + refs.pm + refs.duty;
    if (template.is_system) return;
    if (total > 0) return;
    if (!window.confirm(`ลบแม่แบบ “${template.template_name}” ถาวรใช่หรือไม่?\nการลบนี้ย้อนกลับไม่ได้`)) return;
    await onDelete(template);
    setSelectedId(null);
  };

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        <AppIcon name="checklist" framed className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" label="แม่แบบ Checklist"/>
        <div>
          <div className="eyebrow-dark"><span/> Smart Checklist</div>
          <h1 className="page-title-dark">แม่แบบ Checklist</h1>
          <p className="page-subtitle-dark">สร้าง แก้ไข เพิ่ม/ลบหัวข้อตรวจ และควบคุมแม่แบบที่ใช้กับ PM งานเวร และใบงาน</p>
        </div>
      </div>
      {canManage && <button onClick={() => setShowCreate(true)} className="btn-dark-primary"><Plus className="w-4 h-4"/> สร้างแม่แบบ</button>}
    </div>

    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {templates.length ? templates.map((template) => {
        const count = templateItems(template.id).length;
        const refs = usage(template.id);
        const refCount = refs.work + refs.pm + refs.duty;
        return <button key={template.id} onClick={() => setSelectedId(template.id)} className="text-left bg-[#18181B] border border-zinc-800 rounded-[2rem] p-5 shadow-xl hover:border-indigo-500/40 hover:-translate-y-0.5 transition group">
          <div className="flex items-center justify-between">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${template.template_type === 'pm' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : template.template_type === 'duty' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-violet-500/10 text-violet-400 border-violet-500/20'}`}>
              {template.template_type === 'duty' ? <ShieldCheck className="w-5 h-5"/> : template.template_type === 'pm' ? <Wrench className="w-5 h-5"/> : <ListChecks className="w-5 h-5"/>}
            </div>
            <div className="flex items-center gap-2">
              {template.is_system && <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400">SYSTEM</span>}
              <span className={`w-2.5 h-2.5 rounded-full ${template.is_active ? 'bg-emerald-400' : 'bg-zinc-600'}`}/>
            </div>
          </div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-400 mt-4">{typeNames[template.template_type] || template.template_type}</span>
          <h2 className="font-extrabold mt-1 group-hover:text-indigo-300 transition">{template.template_name}</h2>
          <p className="font-mono text-[10px] text-zinc-600 mt-1">{template.template_code} · v{template.version || 1}</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-xl bg-zinc-900/70 border border-zinc-800 p-3"><strong className="text-xl">{count}</strong><p className="text-[10px] text-zinc-500">หัวข้อตรวจ</p></div>
            <div className="rounded-xl bg-zinc-900/70 border border-zinc-800 p-3"><strong className="text-xl">{template.minimum_photos || 0}</strong><p className="text-[10px] text-zinc-500">รูปขั้นต่ำ</p></div>
            <div className="rounded-xl bg-zinc-900/70 border border-zinc-800 p-3"><strong className="text-xl">{refCount}</strong><p className="text-[10px] text-zinc-500">กำลังอ้างอิง</p></div>
          </div>
        </button>;
      }) : <div className="sm:col-span-2 xl:col-span-3 py-20 text-center bg-[#18181B] border border-dashed border-zinc-800 rounded-[2rem] text-zinc-500"><AppIcon name="checklist" className="w-16 h-16 mx-auto mb-3" label="ยังไม่มีแม่แบบ Checklist"/>ยังไม่มีแม่แบบ Checklist</div>}
    </div>

    {selected && (() => {
      const refs = usage(selected.id);
      const totalRefs = refs.work + refs.pm + refs.duty;
      return <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
        <section className="bg-[#18181B] w-full max-w-3xl max-h-[calc(100dvh-.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border border-zinc-800 flex flex-col">
          <header className="shrink-0 px-6 py-5 border-b border-zinc-800 flex gap-3 justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold text-indigo-400">{selected.template_code}</p>
                {selected.is_system && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400"><LockKeyhole className="w-3 h-3"/> SYSTEM TEMPLATE</span>}
              </div>
              <h2 className="font-extrabold text-lg mt-1 truncate">{selected.template_name}</h2>
              <p className="text-[11px] text-zinc-500 mt-1">{typeNames[selected.template_type] || selected.template_type} · {selected.department_code || 'ทุกแผนก'} · ใช้งาน {totalRefs} รายการ</p>
            </div>
            <div className="flex items-start gap-2 shrink-0">
              {canManage && <button onClick={() => openEdit(selected)} className="btn-dark-secondary !px-3"><Pencil className="w-4 h-4"/> แก้ไข</button>}
              <button onClick={() => setSelectedId(null)} className="p-2 rounded-xl hover:bg-zinc-800"><X className="w-5 h-5 text-zinc-400"/></button>
            </div>
          </header>

          <div className="min-h-0 flex-1 p-6 overflow-y-auto overscroll-contain table-container space-y-3">
            {selected.is_system && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300 flex gap-2"><LockKeyhole className="w-4 h-4 shrink-0"/><span>แม่แบบระบบแก้ชื่อและรายการตรวจได้ แต่ไม่อนุญาตให้ลบหรือเปลี่ยนรหัส/ประเภท/แผนก เพราะระบบเวรอัตโนมัติใช้อ้างอิงอยู่</span></div>}
            {!selected.is_system && totalRefs > 0 && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300">แม่แบบนี้ถูกใช้อ้างอิงแล้ว {totalRefs} รายการ จึงลบถาวรไม่ได้ แต่ยังแก้ไขหรือปิดใช้งานสำหรับงานใหม่ได้</div>}

            {templateItems(selected.id).map((item, index) => <div key={item.id} className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex gap-3">
              <span className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-black">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{item.item_name}{item.is_required && <span className="text-rose-400"> *</span>}</p>
                <p className="text-[11px] text-zinc-500 mt-1">{item.section_name || 'รายการตรวจ'} · {answerNames[item.answer_type] || item.answer_type}{item.unit ? ` · ${item.unit}` : ''}</p>
              </div>
              {item.is_required && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0"/>}
            </div>)}
          </div>

          {canManage && <footer className="px-6 py-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] text-zinc-500">แก้ไขหัวข้อตรวจจะมีผลกับใบงานที่สร้างหลังจากบันทึกเท่านั้น</p>
            {!selected.is_system && <button disabled={busy || totalRefs > 0} onClick={() => deleteTemplate(selected)} className="btn-dark-secondary !text-rose-500 disabled:opacity-40" title={totalRefs > 0 ? 'มีงานหรือแผนอ้างอิงแม่แบบนี้อยู่' : 'ลบแม่แบบถาวร'}><Trash2 className="w-4 h-4"/> ลบแม่แบบ</button>}
          </footer>}
        </section>
      </div>;
    })()}

    {edit && <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
      <section className="bg-[#18181B] w-full max-w-5xl max-h-[calc(100dvh-.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border border-zinc-800 flex flex-col">
        <header className="shrink-0 px-6 py-5 border-b border-zinc-800 flex justify-between gap-4">
          <div><h2 className="font-extrabold text-lg">แก้ไขแม่แบบ Checklist</h2><p className="text-xs text-zinc-500 mt-1">แก้ข้อมูลแม่แบบและรายการตรวจทั้งหมดในหน้าจอเดียว</p></div>
          <button onClick={() => setEdit(null)} className="p-2 rounded-xl hover:bg-zinc-800"><X className="w-5 h-5 text-zinc-400"/></button>
        </header>
        <form onSubmit={saveEdit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain table-container p-6 space-y-5">
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <label className="field-dark"><span>รหัสแม่แบบ *</span><input required disabled={edit.is_system} value={edit.template_code} onChange={(e) => setEdit({...edit, template_code: e.target.value.toUpperCase().replace(/\s+/g, '-')})}/></label>
            <label className="field-dark sm:col-span-1 lg:col-span-2"><span>ชื่อแม่แบบ *</span><input required value={edit.template_name} onChange={(e) => setEdit({...edit, template_name: e.target.value})}/></label>
            <label className="field-dark"><span>ประเภท</span><select disabled={edit.is_system} value={edit.template_type} onChange={(e) => setEdit({...edit, template_type: e.target.value})}><option value="pm">PM เครื่องจักร</option><option value="duty">งานเวร</option><option value="safety">ความปลอดภัย</option><option value="calibration">สอบเทียบ</option><option value="general">งานทั่วไป</option></select></label>
            <label className="field-dark"><span>แผนก</span><select disabled={edit.is_system} value={edit.department_code} onChange={(e) => setEdit({...edit, department_code: e.target.value})}><option value="">ใช้ได้ทุกแผนก</option><option>MVR</option><option>MSR</option><option>MVR-LOTUS</option><option>MPR</option></select></label>
            <label className="field-dark"><span>จำนวนรูปขั้นต่ำ</span><input type="number" min="0" max="20" value={edit.minimum_photos} onChange={(e) => setEdit({...edit, minimum_photos: Number(e.target.value)})}/></label>
            <label className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-xs">
              <input type="checkbox" disabled={edit.is_system} checked={edit.is_active} onChange={(e) => setEdit({...edit, is_active: e.target.checked})}/>
              <span><strong>เปิดใช้งานแม่แบบ</strong><span className="block text-[10px] text-zinc-500 mt-0.5">เมื่อปิดใช้งาน แม่แบบจะไม่ขึ้นให้เลือกในใบงานใหม่</span></span>
            </label>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div><h3 className="font-extrabold">รายการตรวจ</h3><p className="text-[11px] text-zinc-500">ลากลำดับด้วยปุ่มขึ้น/ลง เพิ่มข้อใหม่ หรือลบข้อที่ไม่ใช้แล้ว</p></div>
              <button type="button" onClick={() => setEdit({...edit, items: [...edit.items, newDraft()]})} className="btn-dark-secondary"><Plus className="w-4 h-4"/> เพิ่มข้อ</button>
            </div>

            <div className="space-y-3">
              {edit.items.map((item, index) => <article key={item.id || `new-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-black shrink-0">{index + 1}</span>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-w-0">
                    <label className="field-dark sm:col-span-2 lg:col-span-2"><span>หัวข้อตรวจ *</span><input required value={item.item_name} onChange={(e) => patchItem(index, {item_name: e.target.value})}/></label>
                    <label className="field-dark"><span>หมวด</span><input value={item.section_name} onChange={(e) => patchItem(index, {section_name: e.target.value})}/></label>
                    <label className="field-dark"><span>รูปแบบคำตอบ</span><select value={item.answer_type} onChange={(e) => patchItem(index, {answer_type: e.target.value})}>{Object.entries(answerNames).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>

                    {item.answer_type === 'number' && <>
                      <label className="field-dark"><span>ค่าต่ำสุด</span><input type="number" step="any" value={item.min_value} onChange={(e) => patchItem(index, {min_value: e.target.value})}/></label>
                      <label className="field-dark"><span>ค่าสูงสุด</span><input type="number" step="any" value={item.max_value} onChange={(e) => patchItem(index, {max_value: e.target.value})}/></label>
                      <label className="field-dark"><span>หน่วย</span><input value={item.unit} onChange={(e) => patchItem(index, {unit: e.target.value})} placeholder="เช่น bar, °C"/></label>
                    </>}
                    {item.answer_type === 'select' && <label className="field-dark sm:col-span-2 lg:col-span-3"><span>ตัวเลือก (คั่นด้วย ,)</span><input value={item.choicesText} onChange={(e) => patchItem(index, {choicesText: e.target.value})} placeholder="ปกติ, ต่ำ, สูง"/></label>}

                    <label className="flex items-center gap-2 text-[11px] text-zinc-400"><input type="checkbox" checked={item.is_required} onChange={(e) => patchItem(index, {is_required: e.target.checked})}/> บังคับตอบ</label>
                    <label className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold ${item.require_photo ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-zinc-800 text-zinc-400'}`}><input type="checkbox" checked={item.require_photo} onChange={(e) => patchItem(index, {require_photo: e.target.checked})}/> บังคับแนบรูปทุกครั้ง</label>
                    <label className="flex items-center gap-2 text-[11px] text-zinc-400"><input type="checkbox" checked={item.require_photo_if_abnormal} onChange={(e) => patchItem(index, {require_photo_if_abnormal: e.target.checked})}/> ผิดปกติต้องมีรูป</label>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button type="button" disabled={index === 0} onClick={() => moveItem(index, -1)} className="p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-indigo-400 disabled:opacity-30" title="เลื่อนขึ้น"><ArrowUp className="w-4 h-4"/></button>
                    <button type="button" disabled={index === edit.items.length - 1} onClick={() => moveItem(index, 1)} className="p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-indigo-400 disabled:opacity-30" title="เลื่อนลง"><ArrowDown className="w-4 h-4"/></button>
                    <button type="button" disabled={edit.items.length <= 1} onClick={() => removeItem(index)} className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 disabled:opacity-30" title="ลบหัวข้อนี้"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </article>)}
            </div>
          </section>

          <footer className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-[#18181B]/95 backdrop-blur border-t border-zinc-800 flex justify-end gap-2">
            <button type="button" onClick={() => setEdit(null)} className="btn-dark-secondary">ยกเลิก</button>
            <button disabled={busy || !edit.items.some((item) => item.item_name.trim())} className="btn-dark-primary"><Save className="w-4 h-4"/>{busy ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</button>
          </footer>
        </form>
      </section>
    </div>}

    {showCreate && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
      <section className="bg-[#18181B] w-full max-w-2xl max-h-[calc(100dvh-.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border border-zinc-800 flex flex-col">
        <header className="shrink-0 px-6 py-5 border-b border-zinc-800 flex justify-between"><div><h2 className="font-extrabold">สร้างแม่แบบ Checklist</h2><p className="text-xs text-zinc-500">แต่ละบรรทัดจะกลายเป็นหนึ่งหัวข้อตรวจ และแก้รายละเอียดเพิ่มภายหลังได้</p></div><button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-zinc-400"/></button></header>
        <form onSubmit={submitCreate} className="min-h-0 flex-1 p-6 overflow-y-auto overscroll-contain grid sm:grid-cols-2 gap-4 table-container">
          <label className="field-dark"><span>รหัสแม่แบบ *</span><input required value={form.template_code} onChange={(e) => setForm({...form, template_code: e.target.value.toUpperCase().replace(/\s+/g, '-')})}/></label>
          <label className="field-dark"><span>ชื่อแม่แบบ *</span><input required value={form.template_name} onChange={(e) => setForm({...form, template_name: e.target.value})}/></label>
          <label className="field-dark"><span>ประเภท</span><select value={form.template_type} onChange={(e) => setForm({...form, template_type: e.target.value})}><option value="pm">PM เครื่องจักร</option><option value="duty">งานเวร</option><option value="safety">ความปลอดภัย</option><option value="calibration">สอบเทียบ</option><option value="general">งานทั่วไป</option></select></label>
          <label className="field-dark"><span>แผนก</span><select value={form.department_code} onChange={(e) => setForm({...form, department_code: e.target.value})}><option value="">ใช้ได้ทุกแผนก</option><option>MVR</option><option>MSR</option><option>MVR-LOTUS</option><option>MPR</option></select></label>
          <label className="field-dark"><span>จำนวนรูปขั้นต่ำ</span><input type="number" min="0" max="20" value={form.minimum_photos} onChange={(e) => setForm({...form, minimum_photos: Number(e.target.value)})}/></label>
          <label className="field-dark sm:col-span-2"><span>หัวข้อตรวจ * (หนึ่งบรรทัดต่อหนึ่งข้อ)</span><textarea required value={form.items} onChange={(e) => setForm({...form, items: e.target.value})} className="min-h-48" placeholder={'ตรวจสภาพหลอดฮีทเตอร์\nวัดกระแสฮีทเตอร์\nตรวจสายไฟและขั้วต่อ'}/></label>
          <footer className="sm:col-span-2 sticky bottom-0 z-10 -mx-6 -mb-6 mt-2 px-6 py-4 border-t border-zinc-800 bg-[#18181B]/95 backdrop-blur flex justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="btn-dark-secondary">ยกเลิก</button><button disabled={busy} className="btn-dark-primary"><Plus className="w-4 h-4"/> สร้างแม่แบบ</button></footer>
        </form>
      </section>
    </div>}
  </div>;
};
