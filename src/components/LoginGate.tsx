import React, { useState } from 'react';
import {
  ArrowRight, LoaderCircle, Lock, ShieldCheck, Sparkles, UserCheck,
} from '../icons';
import { AppIcon } from './AppIcon';
import { BrandLogo } from './BrandLogo';

interface LoginGateProps {
  configured: boolean;
  busy: boolean;
  error: string;
  onEmployeeLogin: (employeeCode: string) => Promise<void>;
  onManagerLogin: (username: string, password: string) => Promise<void>;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  configured, busy, error, onEmployeeLogin, onManagerLogin,
}) => {
  const [mode, setMode] = useState<'employee' | 'manager'>('employee');
  const [employeeCode, setEmployeeCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const workOrder = new URLSearchParams(location.search).get('workOrder');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'employee') await onEmployeeLogin(employeeCode);
    else await onManagerLogin(username, password);
  };

  return (
    <main className="theme-light fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090B] text-zinc-200 overflow-y-auto selection:bg-indigo-600">
      <div className="fixed -top-48 -left-24 w-[32rem] h-[32rem] rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -right-24 w-[30rem] h-[30rem] rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
      <section className="relative bg-[#18181B] rounded-[2rem] max-w-md w-full shadow-2xl border border-zinc-800 overflow-hidden flex flex-col animate-in">
        <header className="p-6 pb-4 border-b border-zinc-800 bg-zinc-900/60 text-center">
          <BrandLogo framed className="w-20 h-20 mx-auto mb-3"/>
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block">Maintenance Pro</span>
          <h1 className="text-xl font-bold text-white tracking-tight">เข้าสู่ระบบการทำงาน</h1>
          <p className="text-xs text-zinc-400 mt-1">เลือกระดับการเข้าใช้งานตามหน้าที่รับผิดชอบ</p>
          {workOrder && <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-xs font-mono"><Sparkles className="w-3.5 h-3.5" /><span>เปิดใบงานอัตโนมัติ: {workOrder}</span></div>}
        </header>

        <div className="p-4 pb-0 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setMode('employee')} className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${mode === 'employee' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500/50 shadow-md' : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'}`}><UserCheck className="w-4 h-4" /><span>ช่างผู้ปฏิบัติงาน</span></button>
          <button type="button" onClick={() => setMode('manager')} className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${mode === 'manager' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500/50 shadow-md' : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'}`}><ShieldCheck className="w-4 h-4" /><span>หัวหน้างาน / Admin</span></button>
        </div>

        <div className="p-6 space-y-4">
          {!configured && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"><AppIcon name="warning" className="w-7 h-7 shrink-0"/><span>ยังไม่ได้ตั้งค่า Supabase ใน public/config.js</span></div>}
          {error && <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"><AppIcon name="error" className="w-7 h-7 shrink-0"/><span>{error}</span></div>}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'employee' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">รหัสพนักงาน (Employee Code)</label>
                <input required inputMode="numeric" autoComplete="username" autoFocus value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} placeholder="เช่น 680470" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono tracking-wider placeholder-zinc-500" />
                <p className="text-[11px] text-zinc-500">ไม่ต้องใส่รหัสผ่าน สำหรับบัญชีช่างที่ได้รับอนุญาตแล้ว</p>
              </div>
            ) : (
              <>
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-300">อีเมลหรือชื่อผู้ใช้</label><input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl py-2.5 px-3.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-300">รหัสผ่าน</label><div className="relative mt-1"><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-2.5 pl-3.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono" /><Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" /></div></div>
              </>
            )}
            <button type="submit" disabled={busy || !configured || (mode === 'employee' ? !employeeCode.trim() : !username.trim() || !password)} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-[0_4px_16px_rgba(99,102,241,.3)] transition-all flex items-center justify-center gap-2">
              {busy ? <><LoaderCircle className="w-4 h-4 animate-spin" /><span>กำลังตรวจสอบ...</span></> : <><span>{mode === 'employee' ? 'เข้าสู่ระบบปฏิบัติงาน' : 'เข้าสู่ระบบบริหารจัดการ'}</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <div className="pt-4 border-t border-zinc-800 text-center"><p className="text-[10px] text-zinc-500">Supabase Auth · Row Level Security · Production Data</p></div>
        </div>
      </section>
    </main>
  );
};
