import React from 'react';
import { SummaryStats } from '../types';
import { AppIcon } from './AppIcon';

interface StatCardsProps {
  stats: SummaryStats;
  activeStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  stats,
  activeStatusFilter,
  onSelectStatusFilter
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 md:gap-4">
      {/* 1. All Tasks */}
      <button
        onClick={() => onSelectStatusFilter('')}
        className={`bg-[#18181B] border rounded-[2rem] p-5 flex flex-col justify-between text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-95 w-full shadow-lg ${
          activeStatusFilter === ''
            ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-zinc-900'
            : 'border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <div className="flex justify-between items-start w-full mb-3">
          <AppIcon name="info" className="w-11 h-11 -mt-1" label="งานทั้งหมด"/>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</span>
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {stats.total}
          </div>
          <div className="text-xs font-semibold text-zinc-400 mt-0.5">
            งานทั้งหมด
          </div>
        </div>
      </button>

      {/* 2. Completed */}
      <button
        onClick={() => onSelectStatusFilter('approved')}
        className={`bg-[#18181B] border rounded-[2rem] p-5 flex flex-col justify-between text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-95 w-full shadow-lg ${
          activeStatusFilter === 'approved'
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-zinc-900'
            : 'border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <div className="flex justify-between items-start w-full mb-3">
          <AppIcon name="success" className="w-11 h-11 -mt-1" label="เสร็จสิ้น"/>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Done</span>
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-emerald-400 tracking-tight">
            {stats.completed}
          </div>
          <div className="text-xs font-semibold text-zinc-400 mt-0.5">
            เสร็จสิ้น
          </div>
        </div>
      </button>

      {/* 3. Abnormal */}
      <button
        onClick={() => onSelectStatusFilter('abnormal')}
        className={`bg-[#18181B] border rounded-[2rem] p-5 flex flex-col justify-between text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-95 w-full shadow-lg ${
          activeStatusFilter === 'abnormal'
            ? 'border-amber-500 ring-2 ring-amber-500/30 bg-zinc-900'
            : 'border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <div className="flex justify-between items-start w-full mb-3">
          <AppIcon name="warning" className="w-11 h-11 -mt-1" label="พบความผิดปกติ"/>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Warning</span>
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-amber-400 tracking-tight">
            {stats.abnormal}
          </div>
          <div className="text-xs font-semibold text-zinc-400 mt-0.5">
            พบผิดปกติ
          </div>
        </div>
      </button>

      {/* 4. Overdue */}
      <button
        onClick={() => onSelectStatusFilter('overdue')}
        className={`bg-[#18181B] border rounded-[2rem] p-5 flex flex-col justify-between text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-95 w-full shadow-lg ${
          activeStatusFilter === 'overdue'
            ? 'border-rose-500 ring-2 ring-rose-500/30 bg-zinc-900'
            : 'border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <div className="flex justify-between items-start w-full mb-3">
          <AppIcon name="overdue" className="w-11 h-11 -mt-1" label="งานเกินกำหนด"/>
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Alert</span>
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-rose-400 tracking-tight">
            {stats.overdue}
          </div>
          <div className="text-xs font-semibold text-zinc-400 mt-0.5">
            เกินกำหนด
          </div>
        </div>
      </button>
    </div>
  );
};
