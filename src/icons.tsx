import React from 'react';

export const STREAMLINE_FILES = {
  alarmCheck: 'Alarm-Bell-Check-1--Streamline-Ultimate.png',
  alarmDisabled: 'Alarm-Bell-Disable-1--Streamline-Ultimate.png',
  alarmRing: 'Alarm-Bell-Ring-1--Streamline-Ultimate.png',
  alarmTimer: 'Alarm-Bell-Timer-1--Streamline-Ultimate.png',
  alertCircle: 'Alert-Circle--Streamline-Ultimate.png',
  alertMessage: 'Alert-Message-Laptop--Streamline-Ultimate.png',
  alertTriangle: 'Alert-Triangle--Streamline-Ultimate.png',
  calendar: 'Calendar--Streamline-Ultimate.png',
  calendarCheck: 'Calendar-Check-1--Streamline-Ultimate.png',
  calendarDisabled: 'Calendar-Disable-1--Streamline-Ultimate.png',
  calendarEdit: 'Calendar-Edit-1--Streamline-Ultimate.png',
  calendarWarning: 'Calendar-Warning--Streamline-Ultimate.png',
  checkCircle: 'Check-Circle-1--Streamline-Ultimate.png',
  checklist: 'Checklist--Streamline-Ultimate.png',
  cog: 'Cog-1--Streamline-Ultimate.png',
  cogAdvanced: 'Cog-3--Streamline-Ultimate.png',
  clipboard: 'Copy-Paste--Streamline-Ultimate.png',
  databaseCheck: 'Database-Check--Streamline-Ultimate.png',
  databaseRemove: 'Database-Remove--Streamline-Ultimate.png',
  delete: 'Delete-2--Streamline-Ultimate.png',
  maintenance: 'Hammer-Wrench--Streamline-Ultimate.png',
  download: 'Harddrive-Download-1--Streamline-Ultimate.png',
  upload: 'Harddrive-Upload--Streamline-Ultimate.png',
  hierarchy: 'Hierarchy-5--Streamline-Ultimate.png',
  home: 'House-Chimney-1--Streamline-Ultimate.png',
  link: 'Hyperlink-3--Streamline-Ultimate.png',
  dashboard: 'Layout-Dashboard--Streamline-Ultimate.png',
  brokenLink: 'Link-Broken--Streamline-Ultimate.png',
  brokenLinkAlt: 'Link-Broken-2--Streamline-Ultimate.png',
  listAdd: 'List-Add--Streamline-Ultimate.png',
  login: 'Login-1--Streamline-Ultimate.png',
  loginAlt: 'Login-3--Streamline-Ultimate.png',
  logout: 'Logout--Streamline-Ultimate.png',
  users: 'Multiple-Circle--Streamline-Ultimate.png',
  menu: 'Navigation-Menu-Vertical--Streamline-Ultimate.png',
  security: 'Password-Desktop-Approved--Streamline-Ultimate.png',
  edit: 'Pencil-Write--Streamline-Ultimate.png',
  performance: 'Performance-Increase-2--Streamline-Ultimate.png',
  pin: 'Pin-1--Streamline-Ultimate.png',
  print: 'Print-Text--Streamline-Ultimate.png',
  remove: 'Remove-Circle--Streamline-Ultimate.png',
  search: 'Search-Bar-1--Streamline-Ultimate.png',
  filters: 'Settings-Horizontal--Streamline-Ultimate.png',
  share: 'Share-1--Streamline-Ultimate.png',
  userAdd: 'Single-Neutral-Actions-Add_1--Streamline-Ultimate.png',
  userEdit: 'Single-Neutral-Actions-Edit-1--Streamline-Ultimate.png',
  userEditAlt: 'Single-Neutral-Actions-Edit-1_1--Streamline-Ultimate.png',
  sync: 'Synchronize-Arrow-1--Streamline-Ultimate.png',
  taskAdd: 'Task-Checklist-Add--Streamline-Ultimate.png',
  clock: 'Time-Clock-Circle--Streamline-Ultimate.png',
  clockFile: 'Time-Clock-File--Streamline-Ultimate.png',
  clockFileAdd: 'Time-Clock-File-Add--Streamline-Ultimate.png',
  clockFileUpload: 'Time-Clock-File-Upload--Streamline-Ultimate.png',
  clockFileWarning: 'Time-Clock-File-Warning--Streamline-Ultimate.png',
  shiftClock: 'Time-Clock-Hand-1--Streamline-Ultimate.png',
  wrench: 'Wrench-Double--Streamline-Ultimate.png',
} as const;

export type StreamlineFile = typeof STREAMLINE_FILES[keyof typeof STREAMLINE_FILES];

type IconProps = React.HTMLAttributes<HTMLSpanElement> & {
  size?: number | string;
  strokeWidth?: number;
};

type StreamlineIconProps = IconProps & {
  file: StreamlineFile;
  label?: string;
  imageRotation?: number;
};

export const StreamlineIcon = React.forwardRef<HTMLSpanElement, StreamlineIconProps>(
  function StreamlineIcon({ file, label, imageRotation = 0, size, strokeWidth: _strokeWidth, className = '', style, ...props }, ref) {
    const base = import.meta.env.BASE_URL || './';
    const sizedStyle = size === undefined ? style : { ...style, width: size, height: size };
    const fallbackSize = size === undefined && className.length === 0 ? 'w-4 h-4' : '';

    return (
      <span
        {...props}
        ref={ref}
        className={`streamline-ui-icon ${fallbackSize} ${className}`}
        style={sizedStyle}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        <img
          src={`${base}icons/streamline/${file}`}
          alt=""
          draggable={false}
          style={imageRotation ? { transform: `rotate(${imageRotation}deg)` } : undefined}
        />
      </span>
    );
  },
);

function createIcon(file: StreamlineFile, imageRotation = 0) {
  return React.forwardRef<HTMLSpanElement, IconProps>(function Icon(props, ref) {
    return <StreamlineIcon ref={ref} file={file} imageRotation={imageRotation} {...props} />;
  });
}

export const LayoutDashboard = createIcon(STREAMLINE_FILES.dashboard);
export const ClipboardList = createIcon(STREAMLINE_FILES.taskAdd);
export const Calendar = createIcon(STREAMLINE_FILES.calendar);
export const BarChart3 = createIcon(STREAMLINE_FILES.performance);
export const Settings = createIcon(STREAMLINE_FILES.cogAdvanced);
export const Plus = createIcon(STREAMLINE_FILES.listAdd);
export const LogOut = createIcon(STREAMLINE_FILES.logout);
export const X = createIcon(STREAMLINE_FILES.remove);
export const Menu = createIcon(STREAMLINE_FILES.menu);
export const Search = createIcon(STREAMLINE_FILES.search);
export const Bell = createIcon(STREAMLINE_FILES.alarmRing);
export const User = createIcon(STREAMLINE_FILES.userEditAlt);
export const Shield = createIcon(STREAMLINE_FILES.security);
export const ShieldCheck = createIcon(STREAMLINE_FILES.security);
export const HelpCircle = createIcon(STREAMLINE_FILES.alertCircle);
export const ChevronDown = createIcon(STREAMLINE_FILES.share, 90);
export const ChevronLeft = createIcon(STREAMLINE_FILES.share, 180);
export const ChevronRight = createIcon(STREAMLINE_FILES.share);
export const ArrowUpRight = createIcon(STREAMLINE_FILES.share, -45);
export const Download = createIcon(STREAMLINE_FILES.download);
export const Upload = createIcon(STREAMLINE_FILES.upload);
export const FileText = createIcon(STREAMLINE_FILES.clipboard);
export const FileSpreadsheet = createIcon(STREAMLINE_FILES.checklist);
export const FileCode2 = createIcon(STREAMLINE_FILES.databaseCheck);
export const RotateCcw = createIcon(STREAMLINE_FILES.sync);
export const Check = createIcon(STREAMLINE_FILES.checkCircle);
export const CheckCircle2 = createIcon(STREAMLINE_FILES.checkCircle);
export const AlertTriangle = createIcon(STREAMLINE_FILES.alertTriangle);
export const AlertCircle = createIcon(STREAMLINE_FILES.alertCircle);
export const Clock = createIcon(STREAMLINE_FILES.clock);
export const Activity = createIcon(STREAMLINE_FILES.performance);
export const TrendingUp = createIcon(STREAMLINE_FILES.performance);
export const Wrench = createIcon(STREAMLINE_FILES.wrench);
export const Eye = createIcon(STREAMLINE_FILES.search);
export const MapPin = createIcon(STREAMLINE_FILES.pin);
export const Printer = createIcon(STREAMLINE_FILES.print);
export const DollarSign = createIcon(STREAMLINE_FILES.performance);
export const Database = createIcon(STREAMLINE_FILES.databaseCheck);
export const Users = createIcon(STREAMLINE_FILES.users);
export const Save = createIcon(STREAMLINE_FILES.upload);
export const Send = createIcon(STREAMLINE_FILES.share);
export const Play = createIcon(STREAMLINE_FILES.share);
export const RefreshCw = createIcon(STREAMLINE_FILES.sync);
export const MessageCircle = createIcon(STREAMLINE_FILES.alertMessage);
export const ListChecks = createIcon(STREAMLINE_FILES.checklist);
export const LockKeyhole = createIcon(STREAMLINE_FILES.security);
export const LoaderCircle = createIcon(STREAMLINE_FILES.sync);
export const Filter = createIcon(STREAMLINE_FILES.filters);
export const Sparkles = createIcon(STREAMLINE_FILES.cog);
export const UserCheck = createIcon(STREAMLINE_FILES.alarmCheck);
export const LogIn = createIcon(STREAMLINE_FILES.login);
export const Lock = createIcon(STREAMLINE_FILES.security);
export const ArrowRight = createIcon(STREAMLINE_FILES.share);
export const ArrowUp = createIcon(STREAMLINE_FILES.share, -90);
export const ArrowDown = createIcon(STREAMLINE_FILES.share, 90);
export const Layers = createIcon(STREAMLINE_FILES.hierarchy);
export const Building = createIcon(STREAMLINE_FILES.home);
export const ShieldAlert = createIcon(STREAMLINE_FILES.alertMessage);
export const Sun = createIcon(STREAMLINE_FILES.calendarCheck);
export const Moon = createIcon(STREAMLINE_FILES.shiftClock);
export const ExternalLink = createIcon(STREAMLINE_FILES.link);
export const Cpu = createIcon(STREAMLINE_FILES.cog);
export const Pause = createIcon(STREAMLINE_FILES.alarmDisabled);
export const Camera = createIcon(STREAMLINE_FILES.upload);
export const FileCheck = createIcon(STREAMLINE_FILES.calendarCheck);
export const Pencil = createIcon(STREAMLINE_FILES.edit);
export const Trash2 = createIcon(STREAMLINE_FILES.delete);
export const ImagePlus = createIcon(STREAMLINE_FILES.userAdd);
