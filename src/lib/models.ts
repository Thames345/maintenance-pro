import type { AnyRow, AppProfile, DataBundle, MaintenanceRecord, PriorityLevel, TaskStatus } from '../types';

export const thaiStatus: Record<string, string> = {
  draft: 'แบบร่าง', assigned: 'รอดำเนินการ', acknowledged: 'รับทราบแล้ว',
  in_progress: 'กำลังดำเนินการ', waiting_parts: 'รออะไหล่', waiting_machine: 'รอหยุดเครื่อง',
  submitted: 'รอตรวจรับ', approved: 'เสร็จสิ้น', returned: 'ส่งกลับแก้ไข',
  overdue: 'เกินกำหนด', cancelled: 'ยกเลิก', scheduled: 'รอเริ่ม', completed: 'ส่งแล้ว',
};

export const thaiType: Record<string, string> = {
  pm: 'งาน PM', duty: 'เวรประจำกะ', general: 'งานทั่วไป', follow_up: 'งานติดตาม/แก้ไข',
};

export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export function firstDayOfMonthISO() {
  const [year, month] = todayISO().split('-');
  return `${year}-${month}-01`;
}

export function localInputToISO(value: string) {
  if (!value) return null;
  return new Date(`${value}:00+07:00`).toISOString();
}

export function formatThaiDate(value?: string | null, includeTime = true) {
  if (!value) return '–';
  try {
    return new Intl.DateTimeFormat('th-TH', includeTime
      ? { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }
      : { dateStyle: 'medium', timeZone: 'Asia/Bangkok' }
    ).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function canManage(profile: AppProfile | null) {
  return Boolean(profile && ['admin', 'supervisor'].includes(profile.role));
}

export function roleLabel(role?: string) {
  return ({ admin: 'ผู้ดูแลระบบ', supervisor: 'หัวหน้างาน', technician: 'ช่างผู้ปฏิบัติงาน' } as Record<string, string>)[role || ''] || role || 'ผู้ใช้งาน';
}

export function teamCrewCode(team?: AnyRow | null) {
  if (!team) return '';
  const direct = String(team.crew_code ?? '').trim().toUpperCase();
  if (['A', 'B', 'O'].includes(direct)) return direct;
  const fallback = `${String(team.team_code ?? '').trim()} ${String(team.team_name ?? '').trim()}`
    .toUpperCase()
    .match(/(?:^|[-_\s])(A|B|O)(?:$|[-_\s])/);
  return fallback?.[1] || '';
}

function uiStatus(code: string, dueAt?: string): TaskStatus {
  if (code === 'approved' || code === 'completed') return 'approved';
  if (code === 'submitted') return 'submitted';
  if (code === 'in_progress' || code === 'waiting_parts' || code === 'waiting_machine') return 'in_progress';
  if (code === 'overdue' || (dueAt && new Date(dueAt).getTime() < Date.now() && !['approved', 'cancelled'].includes(code))) return 'overdue';
  return 'pending';
}

function uiPriority(code?: string): PriorityLevel {
  if (code === 'urgent') return 'urgent';
  if (code === 'high') return 'high';
  if (code === 'low') return 'low';
  return 'medium';
}

function answerValue(result?: AnyRow) {
  if (!result) return '';
  if (result.numeric_value !== null && result.numeric_value !== undefined) return String(result.numeric_value);
  return String(result.answer?.value ?? result.answer ?? '');
}

function isPassValue(value: string) {
  return ['normal', 'pass', 'done', 'ok', 'attached', 'signed', 'ปกติ', 'ผ่าน', 'ทำแล้ว'].includes(value.toLowerCase());
}

export function buildRecords(bundle: DataBundle): MaintenanceRecord[] {
  const technicians = new Map(bundle.technicians.map((row) => [row.id, row]));
  const machines = new Map(bundle.machines.map((row) => [row.id, row]));
  const teams = new Map(bundle.teams.map((row) => [row.id, row]));
  const resultByItem = new Map(bundle.checklistResults.map((row) => [row.work_order_item_id, row]));
  const attachmentsByResult = new Map<string, AnyRow[]>();
  bundle.workAttachments.forEach((row) => {
    const key = String(row.checklist_result_id || '');
    if (!key) return;
    const list = attachmentsByResult.get(key) || [];
    list.push(row);
    attachmentsByResult.set(key, list);
  });

  const assignedNames = (order: AnyRow) => {
    const ids = bundle.assignees
      .filter((row) => row.work_order_id === order.id)
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((row) => row.technician_id);
    const names = ids.map((id) => technicians.get(id)?.full_name).filter(Boolean);
    if (names.length) return names.join(', ');
    const primary = technicians.get(order.primary_technician_id)?.full_name;
    if (primary) return primary;
    return teams.get(order.team_id)?.team_name || 'ยังไม่กำหนดผู้รับผิดชอบ';
  };

  return bundle.workOrders.map((order) => {
    const machine = machines.get(order.machine_id);
    const items = bundle.workOrderItems.filter((item) => item.work_order_id === order.id);
    const findings = bundle.abnormalFindings.filter((finding) => finding.work_order_id === order.id);
    const checklists = items.map((item) => {
      const result = resultByItem.get(item.id);
      const value = answerValue(result);
      const standard = item.min_value !== null || item.max_value !== null
        ? `${item.min_value ?? '–'}–${item.max_value ?? '–'}${item.unit ? ` ${item.unit}` : ''}`
        : undefined;
      return {
        id: item.id,
        name: item.item_name,
        isPassed: Boolean(result && !result.is_abnormal && (isPassValue(value) || item.answer_type === 'number' || item.answer_type === 'text' || item.answer_type === 'select')),
        isAbnormal: Boolean(result?.is_abnormal),
        notes: result?.notes || '',
        measuredValue: value || undefined,
        standardValue: standard,
        answerType: item.answer_type,
        unit: item.unit,
        required: Boolean(item.is_required),
        minValue: item.min_value,
        maxValue: item.max_value,
        answer: value,
        raw: item,
        attachments: result?.id ? (attachmentsByResult.get(String(result.id)) || []) : [],
      };
    });
    const completed = checklists.filter((item) => item.answer !== '').length;
    const sourceDate = order.source_date || String(order.scheduled_start_at || order.created_at || '').slice(0, 10);
    return {
      id: order.id,
      taskNumber: order.work_order_no,
      department: order.department_code || 'ไม่ระบุ',
      machineCode: machine?.machine_no || 'ไม่ระบุ',
      machineName: machine?.machine_name || 'ไม่ระบุเครื่องจักร',
      title: order.title,
      technician: assignedNames(order),
      technicianRole: order.assignment_mode === 'team' ? 'มอบหมายเป็นทีม' : 'ผู้รับผิดชอบใบงาน',
      checklistTotal: items.length,
      checklistCompleted: completed,
      checklistAbnormal: findings.length || checklists.filter((item) => item.isAbnormal).length,
      abnormalDetails: findings.map((item) => item.description).filter(Boolean).join(' · ') || undefined,
      status: uiStatus(order.status, order.due_at),
      rawStatus: order.status,
      scheduledDate: sourceDate || todayISO(),
      dueAt: order.due_at,
      completedDate: order.completed_at || undefined,
      priority: uiPriority(order.priority),
      type: thaiType[order.source_type] || order.source_type,
      sourceType: order.source_type,
      location: machine?.area || machine?.production_line || order.department_code,
      notes: order.result_summary || order.description || '',
      checklists,
      raw: order,
    };
  });
}

export function currentTechnicianName(bundle: DataBundle, profile: AppProfile | null) {
  const technician = bundle.technicians.find((row) => row.id === profile?.technician_id);
  return technician?.full_name || profile?.full_name || 'ผู้ใช้งาน';
}

export function friendlyError(error: unknown) {
  const text = String((error as Error)?.message || error || 'เกิดข้อผิดพลาด');
  const translations: Array<[string, string]> = [
    ['Complete all required checklist items', 'กรอก Checklist บังคับให้ครบก่อนส่งงาน'],
    ['Attach at least', 'จำนวนรูปแนบยังไม่ครบตามแม่แบบ'],
    ['Add an abnormal finding', 'ผลตรวจผิดปกติต้องบันทึกรายละเอียดและแนวทางแก้ไข'],
    ['Attach a photo to every checklist item marked as photo-required', 'ยังมีหัวข้อที่ตั้งค่า “บังคับแนบรูป” แต่ยังไม่ได้แนบรูป กรุณาแนบรูปให้ครบก่อนส่งตรวจ'],
    ['Attach a photo to every abnormal checklist item', 'ผลตรวจผิดปกติที่กำหนดให้มีรูป ต้องแนบรูปในหัวข้อนั้นก่อนส่งงาน'],
    ['Not assigned to this work order', 'คุณไม่ได้รับมอบหมายในใบงานนี้'],
    ['Manager permission required', 'รายการนี้ต้องใช้สิทธิ์หัวหน้าหรือผู้ดูแล'],
    ['LINE_CHANNEL_ACCESS_TOKEN', 'ยังไม่ได้ตั้งค่า LINE Channel Access Token ใน Supabase'],
    ['ยังไม่ได้ลงทะเบียนกลุ่ม LINE', 'ยังไม่ได้ลงทะเบียนกลุ่ม MVR–MSR Maintenance'],
    ['duplicate key', 'ข้อมูลนี้มีอยู่แล้ว กรุณาตรวจรหัสหรือรายการซ้ำ'],
    ['TECHNICIAN_HAS_HISTORY', 'ช่างคนนี้มีประวัติงานหรือบัญชีเข้าใช้งานแล้ว จึงลบถาวรไม่ได้ กรุณาใช้ “ปิดใช้งาน” แทน'],
    ['EMPLOYEE_CODE_LINKED_ACCOUNT', 'รหัสพนักงานนี้เชื่อมกับบัญชีเข้าใช้งานแล้ว จึงแก้รหัสไม่ได้ แต่ยังแก้ชื่อ แผนก ทีม และตำแหน่งได้'],
    ['TECHNICIAN_ADMIN_ONLY', 'รายการนี้ใช้สิทธิ์ Admin เท่านั้น'],
    ['CHECKLIST_MANAGER_ONLY', 'การจัดการแม่แบบ Checklist ใช้สิทธิ์ Admin หรือ Supervisor เท่านั้น'],
    ['SYSTEM_TEMPLATE_CANNOT_BE_DELETED', 'แม่แบบระบบลบไม่ได้ เพราะระบบเวร/PM อัตโนมัติใช้อ้างอิงอยู่ แต่สามารถแก้รายการตรวจได้'],
    ['CHECKLIST_TEMPLATE_IN_USE', 'แม่แบบนี้มีใบงาน แผน PM หรือเวรอ้างอิงอยู่ จึงลบถาวรไม่ได้ กรุณาปิดใช้งานแทน'],
    ['CHECKLIST_TEMPLATE_CODE_EXISTS', 'รหัสแม่แบบนี้มีอยู่แล้ว กรุณาใช้รหัสอื่น'],
    ['CHECKLIST_ITEMS_REQUIRED', 'แม่แบบ Checklist ต้องมีหัวข้อตรวจอย่างน้อย 1 ข้อ'],
    ['CHECKLIST_ITEM_NOT_FOUND', 'ไม่พบหัวข้อ Checklist ที่ต้องการแก้ไข กรุณารีเฟรชแล้วลองใหม่'],
    ['mt_admin_save_technician', 'ยังไม่ได้ติดตั้ง SQL สำหรับจัดการช่าง กรุณารันไฟล์ SQL ที่ให้มาก่อน'],
    ['mt_admin_delete_technician', 'ยังไม่ได้ติดตั้ง SQL สำหรับจัดการช่าง กรุณารันไฟล์ SQL ที่ให้มาก่อน'],
    ['Bucket not found', 'ยังไม่ได้สร้างพื้นที่เก็บรูปช่าง กรุณารันไฟล์ SQL สำหรับจัดการช่างก่อน'],
    ['new row violates row-level security policy for table "objects"', 'ไม่มีสิทธิ์อัปโหลดรูปช่าง กรุณาตรวจ SQL Policy ของ Storage'],
    ['Failed to fetch', 'เชื่อมต่อระบบไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่'],
    ['NetworkError', 'เชื่อมต่อระบบไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่'],
  ];
  return translations.find(([needle]) => text.includes(needle))?.[1] || text;
}
