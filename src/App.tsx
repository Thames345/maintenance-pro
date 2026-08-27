import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, LoaderCircle, RefreshCw } from './icons';
import type {
  AnyRow, AppProfile, DataBundle, FilterState, MaintenanceRecord, NavTab,
  NewTaskPayload, SummaryStats, TechnicianEditorPayload, WorkExecutionPayload,
} from './types';
import { emptyBundle } from './types';
import { api, config } from './lib/api';
import {
  buildRecords, canManage as checkCanManage, currentTechnicianName, firstDayOfMonthISO,
  friendlyError, localInputToISO, teamCrewCode, todayISO,
} from './lib/models';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { LoginGate } from './components/LoginGate';
import { ReportFilter } from './components/ReportFilter';
import { StatCards } from './components/StatCards';
import { ReportTable } from './components/ReportTable';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { DashboardView } from './components/DashboardView';
import { TasksView } from './components/TasksView';
import { ScheduleView } from './components/ScheduleView';
import { DutyView } from './components/DutyView';
import { TemplatesView } from './components/TemplatesView';
import { LineView } from './components/LineView';
import { SettingsView } from './components/SettingsView';
import { ManualDutyModal, type ManualDutyPayload } from './components/ManualDutyModal';
import { AppIcon } from './components/AppIcon';
import { exportToCSV, exportToExcel, printPDFReport } from './utils/exportUtils';

interface ToastState { title: string; message?: string; error?: boolean }

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [bundle, setBundle] = useState<DataBundle>(emptyBundle);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manualDutyOpen, setManualDutyOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    reportType: 'ประวัติงาน PM', startDate: firstDayOfMonthISO(), endDate: todayISO(),
    department: '', status: '', searchQuery: '',
  });

  const notify = useCallback((title: string, message = '', error = false) => {
    setToast({ title, message, error });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const loadData = useCallback(async (focusId?: string | null) => {
    setLoading(true);
    try {
      const nextBundle = { ...emptyBundle, ...(await api.loadBundle()) };
      const nextRecords = buildRecords(nextBundle);
      setBundle(nextBundle);
      setRecords(nextRecords);
      if (focusId) setSelectedRecord(nextRecords.find((row) => row.id === focusId || row.taskNumber === focusId) || null);
      return { nextBundle, nextRecords };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const restored = await api.restore();
        if (!active || !restored) return;
        setProfile(restored);
        const { nextRecords } = await loadData();
        const workOrder = new URLSearchParams(location.search).get('workOrder');
        if (workOrder) {
          setCurrentTab('tasks');
          setSelectedRecord(nextRecords.find((row) => row.id === workOrder || row.taskNumber === workOrder) || null);
        }
      } catch (error) {
        if (active) {
          const cachedProfile = api.getProfile();
          if (cachedProfile) {
            setProfile(cachedProfile);
            notify('โหลดข้อมูลล่าสุดไม่สำเร็จ', friendlyError(error), true);
          } else {
            setLoginError(friendlyError(error));
          }
        }
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    return () => { active = false; };
  }, [loadData, notify]);

  const authenticate = async (work: () => Promise<AppProfile>) => {
    setLoginBusy(true);
    setLoginError('');
    try {
      const nextProfile = await work();
      setProfile(nextProfile);
      const { nextRecords } = await loadData();
      const workOrder = new URLSearchParams(location.search).get('workOrder');
      if (workOrder) {
        setCurrentTab('tasks');
        setSelectedRecord(nextRecords.find((row) => row.id === workOrder || row.taskNumber === workOrder) || null);
      }
    } catch (error) {
      const activeProfile = api.getProfile();
      if (activeProfile) {
        setProfile(activeProfile);
        notify('เข้าสู่ระบบแล้ว แต่โหลดข้อมูลไม่ครบ', friendlyError(error), true);
      } else {
        setLoginError(friendlyError(error));
      }
    } finally {
      setLoginBusy(false);
    }
  };

  const run = async <T,>(work: () => Promise<T>, success?: string, focusId?: string | null) => {
    setBusy(true);
    try {
      const result = await work();
      await loadData(focusId);
      if (success) notify(success);
      return result;
    } catch (error) {
      notify('ไม่สามารถดำเนินการได้', friendlyError(error), true);
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const manager = checkCanManage(profile);
  const profileName = currentTechnicianName(bundle, profile);
  const canEditRecord = (record: MaintenanceRecord | null) => {
    if (!record || !profile) return false;
    if (manager) return true;
    if (record.raw?.primary_technician_id === profile.technician_id) return true;
    return bundle.assignees.some((row) => row.work_order_id === record.id && row.technician_id === profile.technician_id);
  };

  const handleLogout = async () => {
    if (!window.confirm('ต้องการออกจากระบบใช่หรือไม่?')) return;
    await api.logout();
    setProfile(null);
    setBundle(emptyBundle);
    setRecords([]);
    setSelectedRecord(null);
    history.replaceState(null, '', location.pathname);
  };

  const handleCreateTask = async (values: NewTaskPayload) => {
    await run(async () => {
      const machine = bundle.machines.find((row) => row.id === values.machineId);
      const team = bundle.teams.find((row) => row.id === values.teamId);
      const crew = teamCrewCode(team);
      const teamMembers = values.assignmentMode === 'team' && team
        ? bundle.teamMembers.filter((row) => {
          if (row.team_id !== team.id || !row.is_active) return false;
          const technician = bundle.technicians.find((item) => item.id === row.technician_id);
          return technician
            && technician.department_code === team.department_code
            && (!crew || String(technician.shift || '').toUpperCase() === crew);
        })
        : [];
      const primary = values.primaryTechnicianId || teamMembers[0]?.technician_id || null;
      if (!primary) throw new Error('กรุณาเลือกผู้รับผิดชอบหลัก');
      const assignees = new Set(values.assigneeIds);
      assignees.add(primary);
      teamMembers.forEach((row) => assignees.add(row.technician_id));
      const order = await api.rpc('mt_create_work_order', {
        p_payload: {
          source_type: values.sourceType,
          checklist_template_id: values.checklistTemplateId || null,
          machine_id: values.machineId || null,
          department_code: machine?.department_code || values.departmentCode,
          title: values.title.trim(),
          description: values.description.trim() || null,
          priority: values.priority,
          assignment_mode: values.assignmentMode,
          team_id: values.assignmentMode === 'team' ? (values.teamId || null) : null,
          primary_technician_id: primary,
          scheduled_start_at: localInputToISO(values.scheduledStartAt),
          due_at: localInputToISO(values.dueAt),
        },
        p_assignee_ids: [...assignees],
      });
      setIsCreateModalOpen(false);
      setCurrentTab('tasks');
      return order;
    }, 'สร้างและแจ้งงานเรียบร้อย');
  };

  const handleStart = async (id: string) => {
    await run(() => api.update('mt_work_orders', `id=eq.${encodeURIComponent(id)}`, { status: 'in_progress' }), 'เริ่มงานและบันทึกเวลาแล้ว', id);
  };

  const handleSaveWork = async (id: string, payload: WorkExecutionPayload, submit: boolean) => {
    await run(async () => {
      const resultsToSave = payload.results.filter((row) => row.value.trim()).map((result) => ({
          work_order_id: id, work_order_item_id: result.workOrderItemId,
          answer: { value: result.value }, numeric_value: result.answerType === 'number' ? Number(result.value) : null,
          notes: result.notes.trim() || null, is_abnormal: result.isAbnormal,
          completed_by: profile?.user_id, completed_at: new Date().toISOString(),
      }));
      const savedResults = resultsToSave.length
        ? await api.insert('mt_checklist_results', resultsToSave, { query: 'on_conflict=work_order_id,work_order_item_id', upsert: true }) as AnyRow[]
        : [];
      for (const result of savedResults.filter((row) => row.is_abnormal)) {
        const source = payload.results.find((row) => row.workOrderItemId === result.work_order_item_id);
        const item = bundle.workOrderItems.find((row) => row.id === result.work_order_item_id);
        const finding = {
          work_order_id: id, checklist_result_id: result.id, severity: payload.severity,
          description: `${item?.item_name || 'หัวข้อตรวจ'}: ${source?.notes || 'พบความผิดปกติ'}`,
          machine_can_run: payload.machineCanRun === '' ? null : payload.machineCanRun === 'true',
          immediate_action: payload.immediateAction, reported_by: profile?.user_id,
        };
        const current = await api.select('mt_abnormal_findings', `checklist_result_id=eq.${encodeURIComponent(result.id)}&select=id&limit=1`);
        if (current[0]) await api.update('mt_abnormal_findings', `id=eq.${encodeURIComponent(current[0].id)}`, finding, { return: false });
        else await api.insert('mt_abnormal_findings', finding, { return: false });
      }
      for (const result of savedResults.filter((row) => !row.is_abnormal)) {
        const current = await api.select('mt_abnormal_findings', `checklist_result_id=eq.${encodeURIComponent(result.id)}&status=not.in.(resolved,accepted)&select=id&limit=1`);
        if (current[0]) await api.update('mt_abnormal_findings', `id=eq.${encodeURIComponent(current[0].id)}`, {
          status: 'resolved', resolved_by: profile?.user_id, resolved_at: new Date().toISOString(),
        }, { return: false });
      }
      for (const [workOrderItemId, itemFiles] of Object.entries(payload.itemFiles || {})) {
        if (!itemFiles.length) continue;
        const savedResult = savedResults.find((row) => row.work_order_item_id === workOrderItemId)
          || (await api.select('mt_checklist_results', `work_order_id=eq.${encodeURIComponent(id)}&work_order_item_id=eq.${encodeURIComponent(workOrderItemId)}&select=id&limit=1`))[0];
        if (!savedResult?.id) throw new Error('กรุณาบันทึกผล Checklist ก่อนแนบรูปในหัวข้อนั้น');
        for (const file of itemFiles) await api.uploadWorkFile(id, file, 'evidence', savedResult.id);
      }
      for (let index = 0; index < payload.files.length; index += 1) await api.uploadWorkFile(id, payload.files[index], index === 0 ? 'before' : 'after');
      await api.update('mt_work_orders', `id=eq.${encodeURIComponent(id)}`, {
        result_summary: payload.resultSummary.trim() || null,
        ...(submit ? { status: 'submitted' } : {}),
      });
    }, submit ? 'ส่งงานให้หัวหน้าตรวจแล้ว' : 'บันทึกผลการทำงานแล้ว', id);
  };

  const handleApprove = async (id: string) => {
    await run(() => api.update('mt_work_orders', `id=eq.${encodeURIComponent(id)}`, { status: 'approved' }), 'อนุมัติงานเรียบร้อย', id);
  };
  const handleReturn = async (id: string, reason: string) => {
    await run(() => api.update('mt_work_orders', `id=eq.${encodeURIComponent(id)}`, { status: 'returned', rejection_reason: reason.trim() }), 'ส่งงานกลับให้แก้ไขแล้ว', id);
  };

  const handleCreatePlan = async (values: AnyRow) => {
    await run(async () => {
      await api.insert('mt_pm_plans', {
        plan_code: values.plan_code.trim().toUpperCase(), plan_name: values.plan_name.trim(),
        machine_id: values.machine_id, checklist_template_id: values.checklist_template_id,
        department_code: values.department_code, frequency_type: values.frequency_type,
        frequency_interval: Number(values.frequency_interval), due_time: values.due_time,
        notification_days_before: Number(values.notification_days_before), assignment_mode: values.assignment_mode,
        team_id: values.team_id || null, primary_technician_id: values.primary_technician_id || null,
        next_due_date: values.next_due_date, created_by: profile?.user_id,
      });
      await api.rpc('mt_generate_pm_work_orders', { p_as_of: todayISO() });
    }, 'บันทึกแผน PM และตรวจรอบงานแล้ว');
  };

  const handleCreateTemplate = async (values: AnyRow, itemNames: string[]) => {
    await run(() => api.rpc('mt_create_checklist_template', {
      p_template: {
        template_code: values.template_code.trim().toUpperCase().replace(/\s+/g, '-'),
        template_name: values.template_name.trim(),
        template_type: values.template_type,
        department_code: values.department_code || null,
        minimum_photos: Number(values.minimum_photos),
      },
      p_item_names: itemNames,
    }), 'สร้างแม่แบบ Checklist เรียบร้อย');
  };

  const handleUpdateTemplate = async (templateId: string, values: AnyRow, templateItems: AnyRow[]) => {
    await run(() => api.rpc('mt_update_checklist_template', {
      p_template_id: templateId,
      p_template: {
        template_code: values.template_code.trim().toUpperCase().replace(/\s+/g, '-'),
        template_name: values.template_name.trim(),
        template_type: values.template_type,
        department_code: values.department_code || null,
        minimum_photos: Number(values.minimum_photos),
        is_active: values.is_active !== false,
      },
      p_items: templateItems,
    }), 'บันทึกแม่แบบ Checklist เรียบร้อย');
  };

  const handleDeleteTemplate = async (template: AnyRow) => {
    await run(() => api.rpc('mt_delete_checklist_template', {
      p_template_id: template.id,
    }), 'ลบแม่แบบ Checklist เรียบร้อย');
  };

  const handleCreateManualDuty = async (values: ManualDutyPayload) => {
    await run(async () => {
      if (new Date(values.dueAt).getTime() <= new Date(values.startsAt).getTime()) throw new Error('กำหนดส่งต้องอยู่หลังเวลาเริ่มทำเวร');
      const teamMembers = values.teamId ? bundle.teamMembers.filter((row) => row.team_id === values.teamId && row.is_active) : [];
      const primary = values.primaryTechnicianId || teamMembers[0]?.technician_id || null;
      if (!primary) throw new Error('กรุณาเลือกผู้รับผิดชอบหลักหรือเลือกทีมที่มีสมาชิก');
      await api.rpc('mt_create_manual_duty', {
        p_payload: {
          duty_date: values.dutyDate,
          department_code: values.departmentCode,
          shift_code: values.shiftCode,
          team_id: values.teamId || null,
          primary_technician_id: primary,
          checklist_template_id: values.checklistTemplateId || null,
          starts_at: localInputToISO(values.startsAt),
          due_at: localInputToISO(values.dueAt),
          notes: values.notes.trim() || null,
        },
      });
      setManualDutyOpen(false);
    }, 'สร้างเวรและใบงานเรียบร้อย');
  };

  const saveLineSettings = async (rows: AnyRow[]) => {
    await run(async () => {
      for (const row of rows) await api.update('mt_notification_settings', `id=eq.${encodeURIComponent(row.id)}`, {
        advance_minutes: Number(row.advance_minutes), reminder_before_due_minutes: Number(row.reminder_before_due_minutes),
        repeat_every_minutes: Number(row.repeat_every_minutes), max_repeats: Number(row.max_repeats),
      }, { return: false });
    }, 'บันทึกเวลาแจ้งเตือนแล้ว');
  };

  const saveSystemSettings = async (shifts: AnyRow[], teamMembers: Record<string, string[]>) => {
    await run(async () => {
      for (const row of shifts) {
        await api.update('mt_shift_settings', `id=eq.${encodeURIComponent(row.id)}`, {
          start_time: row.start_time, end_time: row.end_time,
          duty_start_offset_minutes: Number(row.duty_start_offset_minutes), duty_duration_minutes: Number(row.duty_duration_minutes),
        }, { return: false });
        if (row.notification_id) await api.update('mt_notification_settings', `id=eq.${encodeURIComponent(row.notification_id)}`, {
          advance_minutes: Number(row.advance_minutes), reminder_before_due_minutes: Number(row.reminder_before_due_minutes),
        }, { return: false });
      }
      for (const [teamId, ids] of Object.entries(teamMembers)) {
        const selected = new Set(ids);
        const currentRows = bundle.teamMembers.filter((row) => row.team_id === teamId && row.is_active);
        for (const row of currentRows.filter((item) => !selected.has(item.technician_id))) {
          await api.update('mt_team_members', `id=eq.${encodeURIComponent(row.id)}`, {
            is_active: false,
            valid_until: todayISO(),
          }, { return: false });
        }
        const activeIds = new Set(currentRows.map((row) => row.technician_id));
        const additions = ids.filter((technicianId) => !activeIds.has(technicianId));
        if (additions.length) {
          await api.insert('mt_team_members', additions.map((technicianId) => ({
            team_id: teamId, technician_id: technicianId, member_role: 'member',
            valid_from: todayISO(), valid_until: null, is_active: true,
          })), { query: 'on_conflict=team_id,technician_id,valid_from', upsert: true, return: false });
        }
      }
    }, 'บันทึกการตั้งค่าระบบแล้ว');
  };

  const saveTechnician = async (values: TechnicianEditorPayload, photoFile: File | null, removePhoto: boolean) => {
    let photoWarning = '';
    await run(async () => {
      const args = {
        p_id: values.id || null,
        p_employee_code: values.employeeCode,
        p_full_name: values.fullName,
        p_department_code: values.departmentCode,
        p_shift: values.shift,
        p_position: values.position || null,
        p_photo_url: removePhoto ? null : (values.photoUrl || null),
        p_is_active: values.isActive,
      };
      const savedResponse = await api.rpc('mt_admin_save_technician', args) as AnyRow | AnyRow[];
      const saved = Array.isArray(savedResponse) ? savedResponse[0] : savedResponse;
      const technicianId = String(saved?.id || values.id || '');
      if (!technicianId) throw new Error('ระบบไม่ได้คืนรหัสช่างหลังบันทึก');

      if (photoFile) {
        const oldPhoto = values.photoUrl;
        let uploadedPhoto = '';
        try {
          uploadedPhoto = await api.uploadTechnicianPhoto(technicianId, photoFile);
          await api.rpc('mt_admin_save_technician', { ...args, p_id: technicianId, p_photo_url: uploadedPhoto });
          if (oldPhoto && oldPhoto !== uploadedPhoto) await api.deleteTechnicianPhoto(oldPhoto).catch(() => undefined);
        } catch (error) {
          if (uploadedPhoto) await api.deleteTechnicianPhoto(uploadedPhoto).catch(() => undefined);
          photoWarning = friendlyError(error);
        }
      } else if (removePhoto && values.photoUrl) {
        await api.deleteTechnicianPhoto(values.photoUrl).catch(() => undefined);
      }
    }, values.id ? 'บันทึกข้อมูลช่างเรียบร้อย' : 'เพิ่มช่างและจัดเข้าทีมเรียบร้อย');
    if (photoWarning) notify('บันทึกข้อมูลช่างแล้ว แต่รูปไม่สำเร็จ', photoWarning, true);
  };

  const deleteTechnician = async (technician: AnyRow) => {
    await run(async () => {
      const response = await api.rpc('mt_admin_delete_technician', { p_id: technician.id }) as AnyRow | AnyRow[];
      const result = Array.isArray(response) ? response[0] : response;
      const photoUrl = String(result?.photo_url || technician.photo_url || '');
      if (photoUrl) await api.deleteTechnicianPhoto(photoUrl).catch(() => undefined);
    }, 'ลบข้อมูลช่างที่ยังไม่มีประวัติงานแล้ว');
  };

  const logExport = (format: string, count: number) => {
    if (!profile) return;
    api.insert('mt_export_logs', {
      export_scope: filter.reportType === 'ประวัติงาน PM' ? 'pm_history' : filter.reportType === 'งานเวรประจำกะ' ? 'duty_history' : filter.reportType === 'รายการผิดปกติ' ? 'abnormal_findings' : 'work_orders',
      export_format: format, filters: filter, row_count: count, requested_by: profile.user_id,
    }, { return: false }).catch(() => undefined);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => setFilter((old) => ({ ...old, [key]: value }));
  const handleResetFilter = () => {
    setFilter({ reportType: 'ประวัติงาน PM', startDate: firstDayOfMonthISO(), endDate: todayISO(), department: '', status: '', searchQuery: '' });
    setSearchQuery('');
  };

  const searchedRecords = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return records;
    return records.filter((row) => `${row.taskNumber} ${row.title} ${row.machineCode} ${row.machineName} ${row.technician} ${row.department}`.toLowerCase().includes(search));
  }, [records, searchQuery]);

  const filteredRecords = useMemo(() => searchedRecords.filter((row) => {
    const date = row.scheduledDate;
    if (filter.reportType === 'ประวัติงาน PM' && row.sourceType !== 'pm') return false;
    if (filter.reportType === 'งานเวรประจำกะ' && row.sourceType !== 'duty') return false;
    if (filter.reportType === 'งานเกินกำหนด' && row.status !== 'overdue') return false;
    if (filter.reportType === 'ผล Checklist' && row.checklistTotal === 0) return false;
    if (filter.reportType === 'รายการผิดปกติ' && row.checklistAbnormal === 0) return false;
    if (filter.department && row.department !== filter.department) return false;
    if (filter.status === 'abnormal' && row.checklistAbnormal === 0) return false;
    if (filter.status && filter.status !== 'abnormal' && row.status !== filter.status) return false;
    if (filter.startDate && date < filter.startDate) return false;
    if (filter.endDate && date > filter.endDate) return false;
    return true;
  }), [searchedRecords, filter]);

  const stats: SummaryStats = useMemo(() => ({
    total: filteredRecords.length,
    completed: filteredRecords.filter((row) => row.status === 'approved').length,
    abnormal: filteredRecords.filter((row) => row.checklistAbnormal > 0).length,
    overdue: filteredRecords.filter((row) => row.status === 'overdue').length,
  }), [filteredRecords]);

  if (authLoading) return <div className="theme-light min-h-screen bg-[#09090B] text-zinc-400 flex flex-col items-center justify-center gap-3"><LoaderCircle className="w-8 h-8 text-indigo-400 animate-spin"/><p className="text-xs">กำลังตรวจสอบเซสชัน...</p></div>;
  if (!profile) return <LoginGate configured={api.configured()} busy={loginBusy} error={loginError} onEmployeeLogin={(code) => authenticate(() => api.login(code))} onManagerLogin={(username, password) => authenticate(() => api.loginPassword(username, password))}/>;

  const reportSubtitle = `ข้อมูล ณ ${new Date().toLocaleString('th-TH')} · ${filter.department ? `แผนก ${filter.department}` : 'MVR, MSR, MVR-LOTUS และ MPR'}`;

  return <div className="theme-light bg-[#09090B] text-[#FAFAFA] min-h-screen pb-28 lg:pb-12 selection:bg-indigo-600 selection:text-white font-sans antialiased overflow-x-hidden">
    <Header currentTab={currentTab} onSelectTab={setCurrentTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} onLogout={handleLogout} profile={profile} profileName={profileName} records={records}/>
    <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} onOpenCreateModal={() => setIsCreateModalOpen(true)} onLogout={handleLogout} profile={profile} profileName={profileName} pendingCount={records.filter((row) => !['approved', 'cancelled'].includes(row.rawStatus)).length} mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)}/>

    <main className="w-full min-w-0 pt-20 px-3 sm:px-4 md:px-6 xl:px-8 max-w-[1440px] mx-auto min-h-screen flex flex-col gap-6 overflow-x-clip">
      {loading && <div className="fixed top-20 right-4 z-20 flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-[10px] text-indigo-300"><RefreshCw className="w-3 h-3 animate-spin"/> กำลังอัปเดตข้อมูล</div>}
      {currentTab === 'dashboard' && <DashboardView records={records} onSelectRecord={setSelectedRecord} onGoToReports={() => setCurrentTab('reports')} onGoToDuty={() => setCurrentTab('duty')}/>} 
      {currentTab === 'tasks' && <TasksView records={searchedRecords} onSelectRecord={setSelectedRecord} onOpenCreateModal={() => setIsCreateModalOpen(true)} onUpdateStatus={() => undefined} canCreate={manager}/>} 
      {currentTab === 'pm_plan' && <ScheduleView records={records} plans={bundle.pmPlans} machines={bundle.machines} templates={bundle.templates} technicians={bundle.technicians} teams={bundle.teams} canManage={manager} busy={busy} onSelectRecord={setSelectedRecord} onCreatePlan={handleCreatePlan} onRefresh={() => loadData()} onGenerate={() => run(() => api.rpc('mt_generate_pm_work_orders', { p_as_of: todayISO() }), 'สร้างใบงาน PM ถึงวันนี้แล้ว')}/>} 
      {currentTab === 'duty' && <DutyView bundle={bundle} records={records} canManage={manager} busy={busy} onSelectRecord={setSelectedRecord} onOpenCreate={() => setManualDutyOpen(true)} onOpenSettings={() => setCurrentTab('settings')} onBroadcast={() => run(() => api.invoke(config.lineDispatchFunction, { mode: 'dispatch' }), 'ส่งคิวแจ้งเตือนเวรเข้า LINE แล้ว')}/>} 
      {currentTab === 'templates' && <TemplatesView templates={bundle.templates} items={bundle.templateItems} workOrders={bundle.workOrders} pmPlans={bundle.pmPlans} dutySchedules={bundle.dutySchedules} canManage={manager} busy={busy} onCreate={handleCreateTemplate} onUpdate={handleUpdateTemplate} onDelete={handleDeleteTemplate}/>} 
      {currentTab === 'line' && <LineView lineGroups={bundle.lineGroups} settings={bundle.notificationSettings} groupName={config.lineGroupName} webhookUrl={config.lineWebhookUrl} publicAppUrl={config.publicAppUrl} canManage={manager} busy={busy} onSave={saveLineSettings} onTest={() => run(() => api.invoke(config.lineDispatchFunction, { mode: 'test' }), 'ส่งข้อความทดสอบ LINE แล้ว')} onDispatch={() => run(() => api.invoke(config.lineDispatchFunction, { mode: 'dispatch' }), 'ประมวลผลคิว LINE แล้ว')}/>} 
      {currentTab === 'settings' && <SettingsView bundle={bundle} profile={profile} profileName={profileName} canManage={manager} busy={busy} onSave={saveSystemSettings} onSaveTechnician={saveTechnician} onDeleteTechnician={deleteTechnician} onOpenLine={() => setCurrentTab('line')}/>} 
      {currentTab === 'reports' && <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div className="flex items-start gap-4"><AppIcon name="report" framed className="w-14 h-14 md:w-16 md:h-16 shrink-0" label="รายงานและส่งออก"/><div><div className="eyebrow-dark"><span/> Maintenance Operations</div><h1 className="page-title-dark">รายงานและส่งออก</h1><p className="page-subtitle-dark">ค้นหาและส่งออกประวัติ PM งานเวร Checklist และรายการผิดปกติ</p></div></div><div className="flex gap-2 no-print"><button onClick={() => { exportToCSV(filteredRecords); logExport('csv', filteredRecords.length); }} className="btn-dark-secondary"><Download className="w-4 h-4"/> CSV</button><button onClick={() => { printPDFReport(); logExport('pdf', filteredRecords.length); }} className="btn-dark-primary"><FileText className="w-4 h-4"/> ส่งออก PDF</button></div></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"><div className="lg:col-span-4 no-print"><ReportFilter filter={filter} onFilterChange={handleFilterChange} onResetFilter={handleResetFilter} onApplyFilter={() => notify('อัปเดตตัวอย่างรายงานแล้ว', `${filteredRecords.length} รายการ`)} onExportExcel={() => { exportToExcel(filteredRecords); logExport('xlsx', filteredRecords.length); }} onExportCSV={() => { exportToCSV(filteredRecords); logExport('csv', filteredRecords.length); }} onExportPDF={() => { printPDFReport(); logExport('pdf', filteredRecords.length); }} departments={['MVR', 'MSR', 'MVR-LOTUS', 'MPR']}/></div><div className="lg:col-span-8 flex flex-col gap-6"><div className="no-print"><StatCards stats={stats} activeStatusFilter={filter.status} onSelectStatusFilter={(status) => handleFilterChange('status', status)}/></div><ReportTable records={filteredRecords} allRecordsCount={records.length} reportTitle={`รายงาน${filter.reportType}`} reportSubtitle={reportSubtitle} onSelectRecord={setSelectedRecord}/></div></div>
      </div>}
    </main>

    <MobileNav currentTab={currentTab} onSelectTab={setCurrentTab}/>
    <TaskDetailModal record={selectedRecord} canEdit={canEditRecord(selectedRecord)} canManage={manager} busy={busy} onClose={() => setSelectedRecord(null)} onStart={handleStart} onSave={handleSaveWork} onApprove={handleApprove} onReturn={handleReturn}/>
    <CreateTaskModal isOpen={isCreateModalOpen} busy={busy} canManage={manager} technicians={bundle.technicians} machines={bundle.machines} templates={bundle.templates} teams={bundle.teams} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateTask}/>
    <ManualDutyModal open={manualDutyOpen} busy={busy} teams={bundle.teams} technicians={bundle.technicians} templates={bundle.templates} onClose={() => setManualDutyOpen(false)} onCreate={handleCreateManualDuty}/>
    {toast && <div role={toast.error ? 'alert' : 'status'} className={`fixed right-4 bottom-24 lg:bottom-6 z-[70] w-[min(22rem,calc(100vw-2rem))] p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3 ${toast.error ? 'bg-rose-950/95 border-rose-500/30 text-rose-100' : 'bg-zinc-900/95 border-indigo-500/30 text-white'}`}><AppIcon name={toast.error ? 'error' : 'success'} className="w-10 h-10 shrink-0" label={toast.error ? 'เกิดข้อผิดพลาด' : 'สำเร็จ'}/><div className="min-w-0"><p className="text-sm font-extrabold">{toast.title}</p>{toast.message && <p className="text-xs text-zinc-400 mt-1">{toast.message}</p>}</div></div>}
  </div>;
}
