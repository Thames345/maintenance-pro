import React, { useEffect, useMemo, useState } from 'react';
import { Check, Search, Users, X } from '../icons';
import type { AnyRow } from '../types';
import { TechnicianAvatar } from './TechnicianAvatar';

interface TechnicianPickerProps {
  technicians: AnyRow[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  preferredDepartment?: string;
  lockDepartment?: string;
  lockShift?: string;
  compact?: boolean;
  emptyText?: string;
  title?: string;
  description?: string;
  single?: boolean;
}

const text = (value: unknown) => String(value ?? '').trim();

export const TechnicianPicker: React.FC<TechnicianPickerProps> = ({
  technicians,
  selectedIds,
  onChange,
  disabled = false,
  preferredDepartment = '',
  lockDepartment = '',
  lockShift = '',
  compact = false,
  emptyText = 'ไม่พบช่างตามเงื่อนไขที่เลือก',
  title = 'เลือกผู้ปฏิบัติงาน',
  description = 'แตะชื่อเพื่อเลือกหรือยกเลิกได้ทันที',
  single = false,
}) => {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState(lockDepartment || preferredDepartment);

  useEffect(() => {
    setDepartment(lockDepartment || preferredDepartment);
  }, [lockDepartment, preferredDepartment]);

  const eligible = useMemo(() => technicians
    .filter((row) => row.is_active !== false)
    .filter((row) => !lockDepartment || text(row.department_code) === lockDepartment)
    .filter((row) => !lockShift || text(row.shift).toUpperCase() === lockShift.toUpperCase())
    .sort((a, b) => text(a.full_name).localeCompare(text(b.full_name), 'th')),
  [technicians, lockDepartment, lockShift]);

  const departments = useMemo(() => [...new Set(eligible.map((row) => text(row.department_code)).filter(Boolean))], [eligible]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedRows = useMemo(() => technicians
    .filter((row) => selectedSet.has(text(row.id)))
    .sort((a, b) => text(a.full_name).localeCompare(text(b.full_name), 'th')),
  [technicians, selectedSet]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('th');
    return eligible.filter((row) => {
      if (department && text(row.department_code) !== department) return false;
      if (!needle) return true;
      const haystack = [row.full_name, row.employee_code, row.department_code, row.shift, row.job_position, row.role]
        .map(text)
        .join(' ')
        .toLocaleLowerCase('th');
      return haystack.includes(needle);
    });
  }, [department, eligible, query]);

  const toggle = (id: string) => {
    if (disabled) return;
    onChange(selectedSet.has(id) ? selectedIds.filter((value) => value !== id) : single ? [id] : [...selectedIds, id]);
  };

  const allVisibleSelected = visible.length > 0 && visible.every((row) => selectedSet.has(text(row.id)));
  const toggleVisible = () => {
    if (disabled || !visible.length) return;
    const visibleIds = new Set(visible.map((row) => text(row.id)));
    if (allVisibleSelected) onChange(selectedIds.filter((id) => !visibleIds.has(id)));
    else onChange([...new Set([...selectedIds, ...visibleIds])]);
  };

  return <div className={`rounded-2xl border border-zinc-800 bg-[#101012] overflow-hidden ${disabled ? 'opacity-70' : ''}`}>
    <div className="p-3 sm:p-4 border-b border-zinc-800 bg-zinc-900/55 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0"><Users className="w-4 h-4"/></span>
          <div className="min-w-0"><p className="text-xs font-extrabold">{title}</p><p className="text-[10px] text-zinc-500">{description}</p></div>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1 text-[10px] font-extrabold text-indigo-300">เลือกแล้ว {selectedIds.length}</span>
      </div>

      {selectedRows.length > 0 && <div className="flex flex-wrap gap-1.5" aria-label="รายชื่อที่เลือกแล้ว">
        {selectedRows.map((row) => <span key={row.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/25 pl-2.5 pr-1 py-1 text-[10px] font-bold text-indigo-100">
          <span className="truncate">{row.full_name}</span>
          {!disabled && <button type="button" onClick={() => toggle(text(row.id))} className="w-5 h-5 rounded-full flex items-center justify-center text-indigo-300 hover:bg-indigo-400/20" aria-label={`ยกเลิกเลือก ${row.full_name}`}><X className="w-3 h-3"/></button>}
        </span>)}
        {!disabled && <button type="button" onClick={() => onChange([])} className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-rose-300">ล้างทั้งหมด</button>}
      </div>}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"/>
        <input disabled={disabled} value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-black/55 py-2.5 pl-9 pr-9 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="ค้นหาชื่อ แผนก หรือทีม..." aria-label="ค้นหาช่าง"/>
        {query && !disabled && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white" aria-label="ล้างคำค้นหา"><X className="w-4 h-4 mx-auto"/></button>}
      </div>

      {!lockDepartment && departments.length > 1 && <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5" aria-label="กรองตามแผนก">
        {[['', 'ทั้งหมด'], ...departments.map((item) => [item, item])].map(([value, label]) => <button key={value || 'all'} type="button" disabled={disabled} onClick={() => setDepartment(value)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition ${department === value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-indigo-500/60 hover:text-white'}`}>{label}</button>)}
      </div>}
    </div>

    <div className="px-3 sm:px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between gap-3">
      <p className="text-[10px] text-zinc-500">พบ {visible.length} คน{lockShift ? ` · ทีม ${lockShift}` : ''}</p>
      {!disabled && !single && visible.length > 0 && <button type="button" onClick={toggleVisible} className="text-[10px] font-extrabold text-indigo-300 hover:text-indigo-200">{allVisibleSelected ? 'ยกเลิกที่แสดง' : 'เลือกทั้งหมดที่แสดง'}</button>}
    </div>

    <div className={`table-container overflow-y-auto p-2 sm:p-3 ${compact ? 'max-h-52 sm:max-h-60' : 'max-h-72 sm:max-h-80'}`}>
      {visible.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visible.map((row) => {
          const id = text(row.id);
          const selected = selectedSet.has(id);
          return <button key={id} type="button" disabled={disabled} onClick={() => toggle(id)} role="checkbox" aria-checked={selected} className={`group min-w-0 rounded-2xl border p-3 text-left flex items-center gap-3 transition ${selected ? 'border-indigo-500/70 bg-indigo-500/12 shadow-[0_0_0_1px_rgba(99,102,241,.15)]' : 'border-zinc-800 bg-zinc-900/55 hover:border-zinc-600 hover:bg-zinc-900'} disabled:cursor-default`}>
            <TechnicianAvatar fullName={text(row.full_name)} photoUrl={row.photo_url} className={`w-10 h-10 rounded-xl text-xs ${selected ? 'ring-2 ring-indigo-400/50' : ''}`}/>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-zinc-100">{row.full_name}</span><span className="block truncate mt-0.5 text-[10px] text-zinc-500">{row.department_code} · ทีม {row.shift || '-'}{row.employee_code ? ` · ${row.employee_code}` : ''}</span></span>
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition ${selected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-zinc-700 text-transparent group-hover:border-zinc-500'}`}><Check className="w-3.5 h-3.5"/></span>
          </button>;
        })}
      </div> : <div className="min-h-28 flex flex-col items-center justify-center text-center p-5"><Search className="w-6 h-6 text-zinc-700"/><p className="mt-2 text-xs font-bold text-zinc-400">{emptyText}</p><p className="mt-1 text-[10px] text-zinc-600">ลองเปลี่ยนคำค้นหาหรือตัวกรองแผนก</p></div>}
    </div>
  </div>;
};
