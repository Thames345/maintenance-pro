export type TaskStatus = 'approved' | 'overdue' | 'submitted' | 'in_progress' | 'pending';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type AnyRow = Record<string, any>;

export interface ChecklistItem {
  id: string;
  name: string;
  isPassed: boolean;
  isAbnormal?: boolean;
  notes?: string;
  measuredValue?: string;
  standardValue?: string;
  answerType?: string;
  unit?: string;
  required?: boolean;
  minValue?: number | null;
  maxValue?: number | null;
  answer?: string;
  raw?: AnyRow;
  attachments?: AnyRow[];
}

export interface MaintenanceRecord {
  id: string;
  taskNumber: string;
  department: string;
  machineCode: string;
  machineName: string;
  title: string;
  technician: string;
  technicianAvatar?: string;
  technicianRole?: string;
  checklistTotal: number;
  checklistCompleted: number;
  checklistAbnormal: number;
  abnormalDetails?: string;
  status: TaskStatus;
  rawStatus: string;
  scheduledDate: string;
  dueAt?: string;
  completedDate?: string;
  priority: PriorityLevel;
  type: string;
  sourceType: string;
  location?: string;
  notes?: string;
  checklists: ChecklistItem[];
  cost?: number;
  downtimeHours?: number;
  raw?: AnyRow;
}

export interface FilterState {
  reportType: string;
  startDate: string;
  endDate: string;
  department: string;
  status: string;
  searchQuery: string;
}

export interface SummaryStats { total: number; completed: number; abnormal: number; overdue: number }

export type NavTab = 'dashboard' | 'tasks' | 'pm_plan' | 'duty' | 'templates' | 'reports' | 'line' | 'settings';

export interface AppProfile extends AnyRow {
  user_id: string;
  technician_id?: string | null;
  role: 'admin' | 'supervisor' | 'technician' | string;
  department_code?: string | null;
  full_name?: string;
  employee_code?: string;
  is_active: boolean;
}

export interface DataBundle {
  workOrders: AnyRow[];
  assignees: AnyRow[];
  pmPlans: AnyRow[];
  dutySchedules: AnyRow[];
  templates: AnyRow[];
  templateItems: AnyRow[];
  shiftSettings: AnyRow[];
  notificationSettings: AnyRow[];
  teams: AnyRow[];
  teamMembers: AnyRow[];
  technicians: AnyRow[];
  machines: AnyRow[];
  lineGroups: AnyRow[];
  workOrderItems: AnyRow[];
  checklistResults: AnyRow[];
  abnormalFindings: AnyRow[];
  statusHistory: AnyRow[];
  workAttachments: AnyRow[];
  managedTechnicians: AnyRow[];
  technicianAdminReady: boolean;
}

export interface TechnicianEditorPayload {
  id?: string;
  employeeCode: string;
  fullName: string;
  departmentCode: string;
  shift: 'A' | 'B' | 'O';
  position: string;
  photoUrl: string;
  isActive: boolean;
}

export interface WorkExecutionPayload {
  results: Array<{ workOrderItemId: string; answerType: string; value: string; notes: string; isAbnormal: boolean }>;
  resultSummary: string;
  severity: string;
  machineCanRun: '' | 'true' | 'false';
  immediateAction: string;
  files: File[];
  itemFiles: Record<string, File[]>;
}

export interface NewTaskPayload {
  sourceType: string;
  departmentCode: string;
  title: string;
  description: string;
  priority: string;
  assignmentMode: string;
  teamId: string;
  primaryTechnicianId: string;
  assigneeIds: string[];
  machineId: string;
  checklistTemplateId: string;
  scheduledStartAt: string;
  dueAt: string;
}

export const emptyBundle: DataBundle = {
  workOrders: [], assignees: [], pmPlans: [], dutySchedules: [], templates: [],
  templateItems: [], shiftSettings: [], notificationSettings: [], teams: [],
  teamMembers: [], technicians: [], machines: [], lineGroups: [], workOrderItems: [],
  checklistResults: [], abnormalFindings: [], statusHistory: [], workAttachments: [],
  managedTechnicians: [], technicianAdminReady: false,
};
