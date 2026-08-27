import React, { useState } from 'react';
import {
  HelpCircle, LogOut, Menu, Search, Shield, Sparkles,
  User, X,
} from '../icons';
import type { AppProfile, MaintenanceRecord, NavTab } from '../types';
import { formatThaiDate, roleLabel, thaiStatus } from '../lib/models';
import { AppIcon, taskStatusIcon } from './AppIcon';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
  profile: AppProfile;
  profileName: string;
  records: MaintenanceRecord[];
}

const navItems: Array<{ id: NavTab; label: string; duty?: boolean }> = [
  { id: 'dashboard', label: 'หน้าหลัก' },
  { id: 'duty', label: 'เวรห้องช่าง', duty: true },
  { id: 'pm_plan', label: 'แผน PM' },
  { id: 'tasks', label: 'งานซ่อม' },
  { id: 'templates', label: 'Checklist' },
  { id: 'reports', label: 'รายงาน' },
  { id: 'line', label: 'LINE' },
  { id: 'settings', label: 'ตั้งค่า' },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab, onSelectTab, searchQuery, onSearchChange, onOpenMobileSidebar,
  onLogout, profile, profileName, records,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const alerts = records
    .filter((row) => row.status === 'overdue' || row.rawStatus === 'submitted' || row.checklistAbnormal > 0)
    .slice(0, 8);
  const initials = profileName.replace(/^นาย|^นางสาว|^นาง/, '').trim().slice(0, 2) || 'MT';

  const select = (tab: NavTab) => {
    onSelectTab(tab);
    setShowNotifications(false);
    setShowProfileMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center gap-2 px-3 md:px-5 xl:px-8 py-3 bg-[#09090B]/90 backdrop-blur-xl border-b border-zinc-800/80 no-print">
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden text-zinc-400 p-2 -ml-1 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors"
          title="เปิดเมนู"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => select('dashboard')} className="font-bold text-lg md:text-xl text-white flex items-center gap-2.5">
          <BrandLogo framed className="w-10 h-10"/>
          <span className="hidden sm:flex lg:hidden xl:flex flex-col text-left">
            <span className="text-white font-bold leading-tight">Maintenance Pro</span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Task & PM Management</span>
          </span>
        </button>
      </div>

      <nav className="hidden lg:flex min-w-0 items-center gap-0.5 xl:gap-1 bg-[#18181B] p-1 rounded-2xl border border-zinc-800 shadow-inner mx-1 xl:mx-3">
        {navItems.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => select(item.id)}
              className={`px-2.5 xl:px-3.5 py-1.5 rounded-xl text-[11px] xl:text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                active
                  ? item.duty
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_2px_10px_rgba(16,185,129,.3)]'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_2px_10px_rgba(99,102,241,.3)]'
                  : item.duty
                    ? 'text-emerald-400/90 hover:bg-emerald-500/10 hover:text-emerald-300'
                    : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
              }`}
            >
              {item.duty && <Sparkles className="w-3.5 h-3.5" />}
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="relative hidden 2xl:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="ค้นหาใบงาน..."
            className="pl-9 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-32 md:w-48 2xl:w-52 transition-all text-zinc-100 placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowNotifications((value) => !value); setShowProfileMenu(false); }}
            className="relative text-zinc-400 p-2 rounded-xl bg-[#18181B] border border-zinc-800 hover:text-white hover:border-zinc-700 transition-colors"
            title="การแจ้งเตือน"
          >
            <AppIcon name="newTask" className="w-7 h-7 -m-1" label="การแจ้งเตือน"/>
            {alerts.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" />}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] bg-[#18181B] rounded-2xl shadow-2xl border border-zinc-800 p-3 z-50 animate-in">
              <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-zinc-800">
                <span className="font-bold text-xs text-white uppercase tracking-wider">งานที่ต้องติดตาม</span>
                <button onClick={() => setShowNotifications(false)} className="p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto table-container">
                {alerts.length ? alerts.map((row) => (
                  <button
                    key={row.id}
                    onClick={() => { onSearchChange(row.taskNumber); select('tasks'); }}
                    className="w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/40 transition-colors"
                  >
                    <AppIcon name={taskStatusIcon(row.status, row.checklistAbnormal > 0)} className="w-7 h-7 shrink-0"/>
                    <span className="min-w-0 flex-1">
                      <span className="text-zinc-200 font-semibold leading-relaxed text-xs block truncate">{row.taskNumber} · {row.title}</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 block">{thaiStatus[row.rawStatus] || row.rawStatus} · {formatThaiDate(row.dueAt)}</span>
                    </span>
                  </button>
                )) : (
                  <div className="py-8 text-center text-zinc-500">
                    <AppIcon name="success" className="w-10 h-10 mx-auto mb-2" label="ไม่มีงานเร่งติดตาม"/>
                    <p className="text-xs">ไม่มีงานเร่งติดตาม</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowProfileMenu((value) => !value); setShowNotifications(false); }}
            className="flex items-center gap-2 bg-[#18181B] border border-zinc-800 hover:border-zinc-700 py-1 px-1 sm:px-2 rounded-2xl transition-all"
          >
            <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">{initials}</span>
            <span className="text-left hidden md:block pr-1">
              <span className="text-xs font-bold text-white leading-tight truncate max-w-[90px] block">{profileName.replace(/^นาย/, '').split(' ')[0]}</span>
              <span className="text-[10px] text-zinc-400 leading-tight block">{profile.department_code || 'MVR–MSR'}</span>
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#18181B] rounded-2xl shadow-2xl border border-zinc-800 p-2.5 z-50 animate-in">
              <div className="px-3 py-2.5 border-b border-zinc-800 mb-1.5">
                <p className="font-bold text-xs text-white">{profileName}</p>
                <p className="text-[11px] text-zinc-400 font-mono">รหัส: {profile.employee_code || '-'}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${profile.role === 'admin' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>{roleLabel(profile.role)}</span>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-md border border-zinc-700">{profile.department_code || 'MVR–MSR'}</span>
                </div>
              </div>
              <button onClick={() => select('settings')} className="w-full px-3 py-2.5 rounded-xl text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"><User className="w-4 h-4 text-zinc-500" /> บัญชีและการตั้งค่า</button>
              <button onClick={() => alert('ลำดับใช้งาน: สร้าง Checklist → สร้างแผน PM/ใบงาน → ช่างกรอกผล → หัวหน้าตรวจรับ → ส่งออกรายงาน')} className="w-full px-3 py-2.5 rounded-xl text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-zinc-500" /> คู่มือแบบย่อ</button>
              <div className="px-3 py-2 mt-1 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2 text-[10px] text-zinc-500"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Supabase Security Active</div>
              <button onClick={onLogout} className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 border-t border-zinc-800"><LogOut className="w-4 h-4" /> ออกจากระบบ</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
