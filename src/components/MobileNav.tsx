import React, { useEffect, useState } from 'react';
import { ChevronRight, X } from '../icons';
import type { NavTab } from '../types';
import { AppIcon, type AppIconName } from './AppIcon';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

interface MobileItem {
  id: NavTab;
  label: string;
  icon: AppIconName;
  description?: string;
}

const primaryItems: MobileItem[] = [
  { id: 'dashboard', label: 'หน้าหลัก', icon: 'dashboard' },
  { id: 'tasks', label: 'งานซ่อม', icon: 'workOrder' },
  { id: 'duty', label: 'เวร 5S', icon: 'duty' },
  { id: 'pm_plan', label: 'แผน PM', icon: 'pmCalendar' },
];

const moreItems: MobileItem[] = [
  { id: 'templates', label: 'แม่แบบ Checklist', icon: 'checklist', description: 'สร้างและแก้ไขรายการตรวจ' },
  { id: 'reports', label: 'รายงานและส่งออก', icon: 'report', description: 'สรุปผล Excel, CSV และ PDF' },
  { id: 'line', label: 'LINE และการแจ้งเตือน', icon: 'line', description: 'กลุ่ม LINE และเวลาแจ้งเตือน' },
  { id: 'settings', label: 'ตั้งค่าระบบ', icon: 'settings', description: 'ทีม ช่าง เวรกะ และสิทธิ์ใช้งาน' },
];

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) => item.id === currentTab);

  useEffect(() => {
    if (!moreOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [moreOpen]);

  const select = (tab: NavTab) => {
    onSelectTab(tab);
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-[54] no-print">
          <button
            aria-label="ปิดเมนูเพิ่มเติม"
            className="absolute inset-0 w-full bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="เมนูเพิ่มเติม"
            className="absolute inset-x-0 bottom-0 max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain rounded-t-[1.75rem] border border-slate-200 bg-white px-4 pt-3 shadow-[0_-20px_60px_rgba(15,23,42,.18)] animate-in"
            style={{ paddingBottom: 'calc(5.9rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-950">เมนูเพิ่มเติม</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">การตั้งค่า รายงาน และเครื่องมือระบบ</p>
              </div>
              <button onClick={() => setMoreOpen(false)} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500" aria-label="ปิด">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {moreItems.map((item) => {
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => select(item.id)}
                    className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[.99] ${active ? 'border-indigo-200 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white'}`}
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${active ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                      <AppIcon name={item.icon} className="h-9 w-9" label={item.label} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-extrabold ${active ? 'text-indigo-700' : 'text-slate-900'}`}>{item.label}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">{item.description}</span>
                    </span>
                    <ChevronRight className={`h-4 w-4 shrink-0 ${active ? 'text-indigo-500' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <nav aria-label="เมนูหลักบนโทรศัพท์" className="mobile-pro-nav lg:hidden fixed inset-x-0 bottom-0 z-[55] no-print">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end gap-1 px-2 pt-2" style={{ paddingBottom: 'calc(.45rem + env(safe-area-inset-bottom))' }}>
          {primaryItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => select(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`mobile-pro-tab ${active ? 'is-active' : ''}`}
              >
                <span className="mobile-pro-icon"><AppIcon name={item.icon} className="h-7 w-7" label={item.label} /></span>
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen((value) => !value)}
            aria-expanded={moreOpen}
            className={`mobile-pro-tab ${moreActive || moreOpen ? 'is-active' : ''}`}
          >
            <span className="mobile-pro-icon"><AppIcon name="settings" className="h-7 w-7" label="เพิ่มเติม" /></span>
            <span>เพิ่มเติม</span>
          </button>
        </div>
      </nav>
    </>
  );
};
