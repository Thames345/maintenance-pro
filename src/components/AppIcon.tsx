import React from 'react';
import type { TaskStatus } from '../types';
import { STREAMLINE_FILES, StreamlineIcon, type StreamlineFile } from '../icons';

export type AppIconName =
  | 'dashboard' | 'workOrder' | 'pmCalendar' | 'duty' | 'checklist' | 'report'
  | 'line' | 'settings' | 'technicians' | 'machine' | 'machineWarning' | 'profilePhoto'
  | 'info' | 'success' | 'warning' | 'error' | 'overdue' | 'pmDue'
  | 'newTask' | 'assigned' | 'inProgress' | 'submitted' | 'approved' | 'returned';

const iconFiles: Record<AppIconName, StreamlineFile> = {
  dashboard: STREAMLINE_FILES.dashboard,
  workOrder: STREAMLINE_FILES.taskAdd,
  pmCalendar: STREAMLINE_FILES.calendarEdit,
  duty: STREAMLINE_FILES.shiftClock,
  checklist: STREAMLINE_FILES.checklist,
  report: STREAMLINE_FILES.performance,
  line: STREAMLINE_FILES.alarmRing,
  settings: STREAMLINE_FILES.cogAdvanced,
  technicians: STREAMLINE_FILES.users,
  machine: STREAMLINE_FILES.maintenance,
  machineWarning: STREAMLINE_FILES.alertMessage,
  profilePhoto: STREAMLINE_FILES.userEdit,
  info: STREAMLINE_FILES.alertCircle,
  success: STREAMLINE_FILES.checkCircle,
  warning: STREAMLINE_FILES.alertTriangle,
  error: STREAMLINE_FILES.remove,
  overdue: STREAMLINE_FILES.clockFileWarning,
  pmDue: STREAMLINE_FILES.alarmTimer,
  newTask: STREAMLINE_FILES.taskAdd,
  assigned: STREAMLINE_FILES.clockFileAdd,
  inProgress: STREAMLINE_FILES.maintenance,
  submitted: STREAMLINE_FILES.clockFileUpload,
  approved: STREAMLINE_FILES.alarmCheck,
  returned: STREAMLINE_FILES.sync,
};

interface AppIconProps {
  name: AppIconName;
  className?: string;
  label?: string;
  framed?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, className = 'w-8 h-8', label, framed = false }) => (
  <StreamlineIcon
    file={iconFiles[name]}
    className={`app-image-icon ${framed ? 'app-image-framed' : ''} ${className}`}
    label={label}
  />
);

export function taskStatusIcon(status: TaskStatus, abnormal = false): AppIconName {
  if (abnormal) return 'warning';
  if (status === 'approved') return 'approved';
  if (status === 'overdue') return 'overdue';
  if (status === 'submitted') return 'submitted';
  if (status === 'in_progress') return 'inProgress';
  return 'assigned';
}
