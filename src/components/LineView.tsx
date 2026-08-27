import React, { useEffect, useState } from 'react';
import { Bell, Clock, RefreshCw, Save, Send } from '../icons';
import type { AnyRow } from '../types';
import { AppIcon, type AppIconName } from './AppIcon';
import { BrandLogo } from './BrandLogo';

interface LineViewProps {
  lineGroups: AnyRow[];
  settings: AnyRow[];
  groupName: string;
  webhookUrl: string;
  publicAppUrl: string;
  canManage: boolean;
  busy: boolean;
  onSave: (rows: AnyRow[]) => Promise<void>;
  onTest: () => Promise<void>;
  onDispatch: () => Promise<void>;
}

export const LineView: React.FC<LineViewProps> = ({ lineGroups, settings, groupName, webhookUrl, publicAppUrl, canManage, busy, onSave, onTest, onDispatch }) => {
  const [rows, setRows] = useState<AnyRow[]>(settings.map((row) => ({ ...row })));
  useEffect(() => setRows(settings.map((row) => ({ ...row }))), [settings]);
  const active = lineGroups.find((row) => row.is_active);
  const update = (id: string, key: string, value: number) => setRows((all) => all.map((row) => row.id === id ? { ...row, [key]: value } : row));

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div className="flex items-start gap-4"><AppIcon name="line" framed className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" label="LINE และการแจ้งเตือน"/><div><div className="eyebrow-dark"><span/> LINE Messaging API</div><h1 className="page-title-dark">LINE และการแจ้งเตือน</h1><p className="page-subtitle-dark">ส่งงาน PM งานเวร และแจ้งเตือนกำหนดส่งไปยังกลุ่มรวม MVR–MSR Maintenance</p></div></div><div className="flex gap-2">{canManage && <button disabled={busy} onClick={onTest} className="btn-dark-secondary"><Send className="w-4 h-4"/> ทดสอบส่ง</button>}{canManage && <button disabled={busy} onClick={onDispatch} className="btn-dark-primary"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`}/> ประมวลผลคิว</button>}</div></div>

    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950/70 via-[#18181B] to-indigo-950/60 border border-emerald-500/20 p-6 sm:p-8"><div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl"/><div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center"><div className="flex gap-4"><AppIcon name={active ? 'success' : 'warning'} className="w-14 h-14 shrink-0" label={active ? 'LINE เชื่อมต่อแล้ว' : 'LINE รอลงทะเบียน'}/><div><div className="flex items-center gap-2"><h2 className="text-xl font-extrabold">{active?.group_name || groupName}</h2>{active ? <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">เชื่อมต่อแล้ว</span> : <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">รอลงทะเบียน</span>}</div><p className="text-xs text-zinc-400 mt-2">{active ? `ลงทะเบียนเมื่อ ${new Date(active.registered_at).toLocaleString('th-TH')}` : 'เชิญ LINE OA เข้ากลุ่มแล้วพิมพ์คำสั่งลงทะเบียนตามคู่มือ'}</p><p className="text-[10px] font-mono text-zinc-600 mt-2 break-all">{webhookUrl}</p></div></div><div className="grid grid-cols-2 gap-2"><div className="rounded-2xl bg-black/20 border border-white/10 p-4 text-center"><strong className="text-2xl text-emerald-400">{lineGroups.filter((g) => g.is_active).length}</strong><p className="text-[10px] text-zinc-500">กลุ่มที่ใช้งาน</p></div><div className="rounded-2xl bg-black/20 border border-white/10 p-4 text-center"><strong className="text-2xl text-indigo-400">{settings.length}</strong><p className="text-[10px] text-zinc-500">ชุดแจ้งเตือน</p></div></div></div></section>

    <section className="grid lg:grid-cols-[1fr_24rem] gap-4 items-stretch">
      <div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-5 sm:p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <BrandLogo framed className="w-14 h-14"/>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold">Flex Message + Deep Link</h2><span className="px-2 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">v2.5.4</span></div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">ข้อความงานใน LINE จะแสดงเป็นการ์ดพร้อมโลโก้ สถานะ เลขใบงาน ผู้รับผิดชอบ และปุ่ม <strong className="text-indigo-300">เปิดทำใบงาน</strong> กดแล้วเข้าสู่งานนั้นโดยตรง หากยังไม่ Login ระบบจะกลับมาเปิดงานเดิมหลังเข้าสู่ระบบ</p>
            <p className="text-[10px] font-mono text-zinc-500 mt-3 break-all">{publicAppUrl}</p>
          </div>
        </div>
      </div>
      <div className="rounded-[2rem] border border-zinc-800 bg-white p-4 text-slate-800 shadow-xl">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200"><BrandLogo className="w-11 h-11"/><div><p className="font-extrabold text-sm">Maintenance Pro</p><p className="text-[10px] text-slate-500">ใบงานมอบหมายใหม่</p></div></div>
        <p className="font-extrabold text-sm mt-3">ตรวจสอบและดำเนินการใบงาน</p>
        <div className="mt-3 text-[11px] space-y-1.5 text-slate-600"><p><strong>เลขที่งาน:</strong> MT-YYYYMMDD-00001</p><p><strong>แผนก:</strong> MVR</p><p><strong>ผู้รับผิดชอบ:</strong> ช่างผู้ได้รับมอบหมาย</p><p><strong>สถานะ:</strong> รอดำเนินการ</p></div>
        <a href={publicAppUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-500">เปิดทำใบงาน</a>
      </div>
    </section>

    <section className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-5 sm:p-7 shadow-2xl"><div className="flex items-center justify-between border-b border-zinc-800 pb-4"><div><h2 className="font-extrabold flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400"/> เวลาแจ้งเตือนแยกตามกะ</h2><p className="text-[11px] text-zinc-500 mt-1">กำหนดได้เอง และค่าใหม่มีผลกับงานใหม่</p></div>{canManage && <button disabled={busy} onClick={() => onSave(rows)} className="btn-dark-primary"><Save className="w-4 h-4"/> บันทึกเวลา</button>}</div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">{rows.map((row) => <article key={row.id} className="rounded-2xl bg-zinc-900/65 border border-zinc-800 p-4"><div className="flex justify-between items-center"><div><span className="text-[10px] text-indigo-400 font-bold">{row.department_code}</span><h3 className="font-bold mt-1">{row.shift_code === 'DAY' ? 'กะเช้า' : row.shift_code === 'NIGHT' ? 'กะดึก' : `กลุ่ม ${row.shift_code}`}</h3></div><Bell className="w-5 h-5 text-violet-400"/></div><div className="grid grid-cols-2 gap-2 mt-4">
        {[
          ['advance_minutes', 'แจ้งล่วงหน้า'], ['reminder_before_due_minutes', 'เตือนก่อนครบ'],
          ['repeat_every_minutes', 'เตือนซ้ำทุก'], ['max_repeats', 'จำนวนครั้ง'],
        ].map(([key, label]) => <label key={key} className="field-dark"><span>{label}</span><div className="flex"><input disabled={!canManage} type="number" min="0" value={row[key] ?? 0} onChange={(e) => update(row.id, key, Number(e.target.value))}/>{key !== 'max_repeats' && <small className="bg-zinc-800 px-2 flex items-center rounded-r-xl">นาที</small>}</div></label>)}
      </div></article>)}</div>
    </section>

    <section className="grid sm:grid-cols-3 gap-3">{([
      ['งานมอบหมายใหม่', 'แจ้งกลุ่มเมื่อมีใบงานใหม่', 'newTask'], ['ก่อนครบกำหนด', 'Cron ตรวจคิวทุกนาที', 'pmDue'], ['ส่งตรวจและผิดปกติ', 'แจ้งสถานะสำคัญทันที', 'warning'],
    ] as [string, string, AppIconName][]).map(([title, text, icon]) => <div key={title} className="bg-[#18181B] rounded-2xl border border-zinc-800 p-4 flex gap-3"><AppIcon name={icon} className="w-9 h-9 shrink-0" label={title}/><div><p className="text-xs font-bold">{title}</p><p className="text-[10px] text-zinc-500 mt-1">{text}</p></div></div>)}</section>
  </div>;
};
