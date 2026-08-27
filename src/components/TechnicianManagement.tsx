import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera, CheckCircle2, ImagePlus, Pause, Pencil, Play, Plus,
  Search, Trash2, X,
} from '../icons';
import type { AnyRow, TechnicianEditorPayload } from '../types';
import { TechnicianAvatar } from './TechnicianAvatar';
import { AppIcon } from './AppIcon';
import { useDialogLifecycle } from '../lib/useDialogLifecycle';

interface TechnicianManagementProps {
  technicians: AnyRow[];
  departments: string[];
  ready: boolean;
  canAdmin: boolean;
  busy: boolean;
  onSave: (payload: TechnicianEditorPayload, photoFile: File | null, removePhoto: boolean) => Promise<void>;
  onDelete: (technician: AnyRow) => Promise<void>;
}

const clean = (value: unknown) => String(value ?? '').trim();
const emptyEditor = (department = 'MVR'): TechnicianEditorPayload => ({
  employeeCode: '', fullName: '', departmentCode: department, shift: 'A',
  position: '', photoUrl: '', isActive: true,
});

export const TechnicianManagement: React.FC<TechnicianManagementProps> = ({
  technicians, departments, ready, canAdmin, busy, onSave, onDelete,
}) => {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [editing, setEditing] = useState<AnyRow | null | undefined>(undefined);
  const [form, setForm] = useState<TechnicianEditorPayload>(emptyEditor(departments[0]));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);
  useDialogLifecycle(editing !== undefined, () => setEditing(undefined));

  const visible = useMemo(() => {
    const needle = query.toLocaleLowerCase('th').trim();
    return [...technicians]
      .filter((row) => !department || clean(row.department_code) === department)
      .filter((row) => status === 'all' || (status === 'active' ? row.is_active !== false : row.is_active === false))
      .filter((row) => !needle || [row.employee_code, row.full_name, row.department_code, row.shift, row.position]
        .map(clean).join(' ').toLocaleLowerCase('th').includes(needle))
      .sort((a, b) => `${a.is_active === false ? 1 : 0}-${clean(a.department_code)}-${clean(a.full_name)}`
        .localeCompare(`${b.is_active === false ? 1 : 0}-${clean(b.department_code)}-${clean(b.full_name)}`, 'th'));
  }, [department, query, status, technicians]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyEditor(departments[0] || 'MVR'));
    setPhotoFile(null);
    setPhotoPreview('');
    setRemovePhoto(false);
  };

  const openEdit = (row: AnyRow) => {
    setEditing(row);
    setForm({
      id: clean(row.id), employeeCode: clean(row.employee_code), fullName: clean(row.full_name),
      departmentCode: clean(row.department_code) || departments[0] || 'MVR',
      shift: (['A', 'B', 'O'].includes(clean(row.shift).toUpperCase()) ? clean(row.shift).toUpperCase() : 'A') as 'A' | 'B' | 'O',
      position: clean(row.position), photoUrl: clean(row.photo_url), isActive: row.is_active !== false,
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setRemovePhoto(false);
  };

  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      window.alert('รองรับเฉพาะรูป JPG, PNG และ WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert('รูปต้องมีขนาดไม่เกิน 5 MB');
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.employeeCode.trim() || !form.fullName.trim() || !form.departmentCode) return;
    try {
      await onSave({
        ...form,
        employeeCode: form.employeeCode.trim(), fullName: form.fullName.trim(),
        position: form.position.trim(), photoUrl: form.photoUrl,
      }, photoFile, removePhoto);
      setEditing(undefined);
    } catch {
      // Toast จาก App จะแสดงข้อผิดพลาดและคงฟอร์มไว้ให้แก้ไข
    }
  };

  const toggleActive = async (row: AnyRow) => {
    const nextActive = row.is_active === false;
    if (!window.confirm(`${nextActive ? 'เปิด' : 'ปิด'}ใช้งาน ${row.full_name} ใช่หรือไม่?`)) return;
    await onSave({
      id: clean(row.id), employeeCode: clean(row.employee_code), fullName: clean(row.full_name),
      departmentCode: clean(row.department_code), shift: clean(row.shift) as 'A' | 'B' | 'O',
      position: clean(row.position), photoUrl: clean(row.photo_url), isActive: nextActive,
    }, null, false).catch(() => undefined);
  };

  const removePermanently = async (row: AnyRow) => {
    if (!window.confirm(`ลบ ${row.full_name} ถาวรหรือไม่?\n\nถ้ามีประวัติงาน ระบบจะไม่อนุญาตและให้ใช้ “ปิดใช้งาน” แทน`)) return;
    await onDelete(row).catch(() => undefined);
  };

  if (!canAdmin) return <section className="light-card p-6 sm:p-8 text-center">
    <AppIcon name="technicians" className="w-14 h-14 mx-auto" label="จัดการช่าง"/>
    <h2 className="font-extrabold text-slate-900 mt-3">การจัดการช่างใช้สิทธิ์ Admin</h2>
    <p className="text-xs text-slate-500 mt-1">หัวหน้างานยังจัดสมาชิกทีมและตั้งเวลาได้ แต่เพิ่ม แก้ไข หรือลบข้อมูลช่างไม่ได้</p>
  </section>;

  if (!ready) return <section className="light-card p-6 sm:p-8">
    <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
      <AppIcon name="warning" className="w-10 h-10 shrink-0" label="ต้องติดตั้งส่วนจัดการช่าง"/>
      <div><h2 className="font-extrabold text-amber-950">ต้องติดตั้งส่วนจัดการช่างก่อน</h2><p className="text-xs text-amber-800 mt-1">เปิด Supabase SQL Editor แล้วรันไฟล์ <code className="font-mono font-bold">supabase/sql/202608260001_technician_admin_and_photos.sql</code> หนึ่งครั้ง จากนั้นรีเฟรชเว็บ</p></div>
    </div>
  </section>;

  return <section className="light-card overflow-hidden">
    <header className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-white to-indigo-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3"><AppIcon name="technicians" framed className="w-12 h-12 shrink-0" label="ทำเนียบช่าง"/><div><h2 className="font-extrabold text-slate-950">ทำเนียบและบัญชีช่าง</h2><p className="text-xs text-slate-500 mt-1">แก้ข้อมูลได้อิสระ · ย้ายแผนกหรือทีม A/B/O แล้วระบบจัดทีมให้ใหม่อัตโนมัติ</p></div></div>
      <button type="button" onClick={openNew} className="btn-dark-primary w-full sm:w-auto"><Plus className="w-4 h-4"/> เพิ่มช่างใหม่</button>
    </header>

    <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/70 grid sm:grid-cols-[1fr_auto_auto] gap-2">
      <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} className="light-input pl-9" placeholder="ค้นหารหัส ชื่อ แผนก หรือตำแหน่ง..."/></label>
      <select value={department} onChange={(event) => setDepartment(event.target.value)} className="light-input min-w-36"><option value="">ทุกแผนก</option>{departments.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="light-input min-w-36"><option value="all">ทุกสถานะ</option><option value="active">เปิดใช้งาน</option><option value="inactive">ปิดใช้งาน</option></select>
    </div>

    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3"><p className="text-xs font-bold text-slate-600">พบ {visible.length} คน</p><p className="text-[10px] text-slate-400">ช่างที่ปิดใช้งานยังคงอยู่ในประวัติงานเดิม</p></div>
      {visible.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{visible.map((row) => <article key={row.id} className={`rounded-3xl border p-4 transition shadow-sm ${row.is_active === false ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}>
        <div className="flex items-start gap-3"><TechnicianAvatar fullName={row.full_name} photoUrl={row.photo_url} className="w-14 h-14 rounded-2xl text-sm shadow-sm"/><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-sm font-extrabold text-slate-950 truncate">{row.full_name}</h3>{row.has_login && <span title="เคยสร้างบัญชีเข้าใช้งานแล้ว" className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"/>}</div><p className="mt-1 text-[10px] font-mono font-bold text-indigo-600">{row.employee_code}</p><p className="mt-1 text-[11px] text-slate-500 truncate">{row.department_code} · ทีม {row.shift || '-'}{row.position ? ` · ${row.position}` : ''}</p></div><span className={`text-[9px] font-extrabold px-2 py-1 rounded-full border ${row.is_active === false ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{row.is_active === false ? 'ปิดใช้งาน' : 'ใช้งานอยู่'}</span></div>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100"><button type="button" onClick={() => openEdit(row)} className="light-action"><Pencil className="w-3.5 h-3.5"/> แก้ไข</button><button type="button" disabled={busy} onClick={() => toggleActive(row)} className="light-action">{row.is_active === false ? <Play className="w-3.5 h-3.5"/> : <Pause className="w-3.5 h-3.5"/>}{row.is_active === false ? 'เปิด' : 'พัก'}</button><button type="button" disabled={busy} onClick={() => removePermanently(row)} className="light-action !text-rose-600 hover:!bg-rose-50 hover:!border-rose-200"><Trash2 className="w-3.5 h-3.5"/> ลบ</button></div>
      </article>)}</div> : <div className="min-h-44 rounded-3xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center p-6"><Search className="w-7 h-7 text-slate-300"/><p className="text-sm font-bold text-slate-500 mt-2">ไม่พบช่างตามตัวกรอง</p><button type="button" onClick={() => { setQuery(''); setDepartment(''); setStatus('all'); }} className="text-xs font-bold text-indigo-600 mt-2">ล้างตัวกรอง</button></div>}
    </div>

    {editing !== undefined && <div className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="technician-editor-title">
      <form onSubmit={submit} className="w-full max-w-2xl max-h-[calc(100dvh-.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] bg-white border border-slate-200 shadow-2xl flex flex-col">
        <header className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><AppIcon name="profilePhoto" framed className="w-11 h-11 shrink-0" label="ข้อมูลและรูปประจำตัวช่าง"/><div><h2 id="technician-editor-title" className="font-extrabold text-slate-950">{editing ? 'แก้ไขข้อมูลช่าง' : 'เพิ่มช่างใหม่'}</h2><p className="text-[11px] text-slate-500 mt-1">ข้อมูลที่บันทึกจะใช้กับใบงาน ทีม และการเข้าสู่ระบบด้วยรหัสพนักงาน</p></div></div><button type="button" onClick={() => setEditing(undefined)} className="w-9 h-9 rounded-xl text-slate-500 hover:bg-white flex items-center justify-center"><X className="w-5 h-5"/></button></header>

        <div className="min-h-0 flex-1 p-5 sm:p-6 overflow-y-auto overscroll-contain table-container space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            {photoPreview ? <span className="w-24 h-24 rounded-3xl overflow-hidden shadow-md shrink-0"><img src={photoPreview} alt="ตัวอย่างรูปช่าง" className="w-full h-full object-cover"/></span> : <TechnicianAvatar fullName={form.fullName} photoUrl={removePhoto ? '' : form.photoUrl} className="w-24 h-24 rounded-3xl text-xl shadow-md"/>}
            <div className="flex-1 text-center sm:text-left"><h3 className="font-extrabold text-slate-900">รูปประจำตัวช่าง</h3><p className="text-[11px] text-slate-500 mt-1">JPG, PNG หรือ WebP · ไม่เกิน 5 MB · ควรใช้รูปสี่เหลี่ยมจัตุรัส</p><div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3"><label className="btn-dark-secondary"><ImagePlus className="w-4 h-4"/> เลือกรูป<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0])} className="hidden"/></label>{(photoPreview || form.photoUrl) && <button type="button" onClick={() => { if (photoPreview) URL.revokeObjectURL(photoPreview); setPhotoPreview(''); setPhotoFile(null); setRemovePhoto(true); }} className="btn-dark-secondary !text-rose-600"><Camera className="w-4 h-4"/> ลบรูป</button>}</div></div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="field-dark"><span>รหัสพนักงาน *</span><input required maxLength={20} disabled={Boolean(editing?.has_login)} value={form.employeeCode} onChange={(event) => setForm((old) => ({ ...old, employeeCode: event.target.value.replace(/\s/g, '') }))} placeholder="เช่น 680470"/>{editing?.has_login && <small>รหัสถูกล็อกหลังสร้างบัญชีเข้าใช้งานแล้ว เพื่อไม่ให้ Login เสีย</small>}</label>
            <label className="field-dark"><span>ชื่อ–นามสกุล *</span><input required maxLength={160} value={form.fullName} onChange={(event) => setForm((old) => ({ ...old, fullName: event.target.value }))} placeholder="เช่น นายอภิวุฒิ ขวัญเมืองคูณ"/></label>
            <label className="field-dark"><span>แผนก *</span><select required value={form.departmentCode} onChange={(event) => setForm((old) => ({ ...old, departmentCode: event.target.value }))}>{departments.map((item) => <option key={item}>{item}</option>)}</select><small>ย้ายแผนกแล้วระบบจะย้ายสมาชิกทีมให้ด้วย</small></label>
            <label className="field-dark"><span>ทีม / กลุ่มกะ *</span><select value={form.shift} onChange={(event) => setForm((old) => ({ ...old, shift: event.target.value as 'A' | 'B' | 'O' }))}><option value="A">ทีม A · หมุนเช้า/ดึก</option><option value="B">ทีม B · หมุนเช้า/ดึก</option><option value="O">ทีม O · 08:00–17:00</option></select></label>
            <label className="field-dark sm:col-span-2"><span>ตำแหน่ง / หน้าที่</span><input maxLength={100} value={form.position} onChange={(event) => setForm((old) => ({ ...old, position: event.target.value }))} placeholder="เช่น Technician, TC หรือปล่อยว่าง"/></label>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div><p className="text-sm font-extrabold text-slate-900">เปิดสิทธิ์ใช้งานช่าง</p><p className="text-[11px] text-slate-500 mt-1">ปิดแล้วจะ Login และรับงานใหม่ไม่ได้ แต่ประวัติงานยังอยู่ครบ</p></div><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((old) => ({ ...old, isActive: event.target.checked }))} className="w-5 h-5 accent-indigo-600"/></label>
        </div>

        <footer className="shrink-0 p-4 sm:px-6 border-t border-slate-200 bg-slate-50 flex gap-2 justify-end"><button type="button" onClick={() => setEditing(undefined)} className="btn-dark-secondary flex-1 sm:flex-none">ยกเลิก</button><button type="submit" disabled={busy || !form.employeeCode.trim() || !form.fullName.trim()} className="btn-dark-primary flex-1 sm:flex-none"><CheckCircle2 className="w-4 h-4"/>{busy ? 'กำลังบันทึก...' : editing ? 'บันทึกการแก้ไข' : 'เพิ่มช่าง'}</button></footer>
      </form>
    </div>}
  </section>;
};
