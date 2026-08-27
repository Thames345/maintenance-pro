import React from 'react';
import {
  LogOut, Plus, ShieldCheck, UserCheck, Wrench, X,
} from '../icons';
import type { AppProfile, NavTab } from '../types';
import { roleLabel } from '../lib/models';
import { AppIcon, type AppIconName } from './AppIcon';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreateModal: () => void;
  onLogout: () => void;
  profile: AppProfile;
  profileName: string;
  pendingCount: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  id: NavTab;
  label: string;
  icon: AppIconName;
  badge?: string | number;
  accent?: 'emerald';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab, onSelectTab, onOpenCreateModal, onLogout, profile, profileName,
  pendingCount, mobileOpen = false, onCloseMobile,
}) => {
  const canCreate = ['admin', 'supervisor'].includes(profile.role);
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'หน้าหลัก (Dashboard)', icon: 'dashboard' },
    { id: 'duty', label: 'เวรทำความสะอาดห้องช่าง', icon: 'duty', badge: '5S', accent: 'emerald' },
    { id: 'pm_plan', label: 'แผนบำรุงรักษา (PM Plan)', icon: 'pmCalendar' },
    { id: 'tasks', label: 'รายการงานซ่อม (Work Orders)', icon: 'workOrder', badge: pendingCount || undefined },
    { id: 'templates', label: 'แม่แบบ Checklist', icon: 'checklist' },
    { id: 'reports', label: 'รายงานและสถิติ', icon: 'report' },
    { id: 'line', label: 'LINE และการแจ้งเตือน', icon: 'line' },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: 'settings' },
  ];

  const select = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };

  return (
    <>
      {mobileOpen && <div onClick={onCloseMobile} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 no-print" />}

      <aside className={`lg:hidden fixed top-0 left-0 h-[100dvh] w-[min(20rem,88vw)] pt-20 pb-6 px-5 bg-[#18181B]/95 backdrop-blur-2xl border-r border-zinc-800 shadow-2xl z-40 flex flex-col transition-transform duration-300 no-print ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={onCloseMobile} className="lg:hidden absolute top-5 right-4 p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"><X className="w-5 h-5" /></button>

        <div className="mb-5 px-2">
          <div className="flex items-center gap-3">
            <BrandLogo framed className="w-12 h-12"/>
            <div>
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block">Maintenance Pro</span>
              <div className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">Task & PM System</div>
            </div>
          </div>
          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="font-mono text-[11px] text-zinc-300">Live Supabase Sync</span>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-xs font-bold shrink-0">
              {profile.role === 'admin' ? <ShieldCheck className="w-4 h-4 text-rose-400" /> : <UserCheck className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{profileName}</p>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <span className="font-mono">{profile.employee_code || '-'}</span><span>•</span><span>{profile.department_code || 'MVR–MSR'}</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 table-container">
          {menuItems.map((item, index) => {
            const active = currentTab === item.id;
            return (
              <React.Fragment key={item.id}>
                {index === 6 && <p className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-600">การจัดการระบบ</p>}
                <button
                  onClick={() => select(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all text-xs font-semibold text-left ${active ? (item.accent === 'emerald' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-[0_4px_16px_rgba(16,185,129,.25)] scale-[1.01]' : 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-[0_4px_16px_rgba(99,102,241,.3)] scale-[1.01]') : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800'}`}
                >
                  <AppIcon name={item.icon} framed className="w-8 h-8 -my-1" label={item.label}/>
                  <span className="flex-1 leading-tight">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 min-w-5 rounded-md text-center text-[9px] font-bold border ${item.accent === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : active ? 'bg-white/15 text-white border-white/10' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>{item.badge}</span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 space-y-2.5">
          {canCreate && (
            <button onClick={() => { onOpenCreateModal(); onCloseMobile?.(); }} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 px-4 rounded-2xl font-bold text-xs shadow-[0_4px_16px_rgba(99,102,241,.3)] active:scale-98 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /><span>สร้างใบงานใหม่</span>
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <Wrench className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] text-zinc-500 flex-1 truncate">{roleLabel(profile.role)}</span>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 px-4 py-2 rounded-2xl transition-all text-xs font-medium border border-transparent hover:border-rose-500/20">
            <LogOut className="w-4 h-4 text-zinc-500" /><span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
};
