import type { AppProfile, AnyRow, DataBundle } from '../types';

export interface RuntimeConfig {
  appName: string;
  environment: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  employeeLoginFunction: string;
  lineDispatchFunction: string;
  lineWebhookUrl: string;
  lineGroupName: string;
  publicAppUrl: string;
}

interface SessionData {
  access_token: string;
  refresh_token: string;
  profile?: AppProfile | null;
}

const inferredPublicAppUrl = typeof window !== 'undefined'
  ? new URL('./', window.location.href).toString()
  : '';

const fallbackConfig: RuntimeConfig = {
  appName: 'Maintenance Pro',
  environment: 'production',
  supabaseUrl: '',
  supabasePublishableKey: '',
  employeeLoginFunction: 'mt-employee-code-login',
  lineDispatchFunction: 'mt-line-dispatch',
  lineWebhookUrl: '',
  lineGroupName: 'MVR–MSR Maintenance',
  publicAppUrl: inferredPublicAppUrl,
};

export const config: RuntimeConfig = {
  ...fallbackConfig,
  ...(window.APP_CONFIG || {}),
};

const storageKey = 'mtpm.session.v1';
const technicianPhotoBucket = 'mt-technician-photos';
let session: SessionData | null = null;
let profile: AppProfile | null = null;
let refreshPromise: Promise<SessionData | null> | null = null;
const technicianPhotoCache = new Map<string, { url: string; expiresAt: number }>();
const requestTimeoutMs = 15_000;

function configured() {
  return Boolean(config.supabaseUrl && config.supabasePublishableKey);
}

function saveSession(next: SessionData, nextProfile?: AppProfile | null) {
  session = {
    access_token: next.access_token,
    refresh_token: next.refresh_token,
    profile: nextProfile || profile || next.profile || null,
  };
  profile = session.profile || null;
  localStorage.setItem(storageKey, JSON.stringify(session));
}

function clearSession() {
  session = null;
  profile = null;
  localStorage.removeItem(storageKey);
}

function loadStoredSession() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null') as SessionData | null;
    if (value?.access_token && value?.refresh_token) {
      session = value;
      profile = value.profile || null;
    }
  } catch {
    clearSession();
  }
}

function decodeJwt(token: string): AnyRow {
  try {
    const body = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(body).split('').map((char) =>
      `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`
    ).join('')));
  } catch {
    return {};
  }
}

function accessExpiresSoon() {
  if (!session?.access_token) return true;
  const exp = Number(decodeJwt(session.access_token).exp || 0);
  return exp * 1000 < Date.now() + 60_000;
}

async function parseResponse(response: Response) {
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text();
  if (!response.ok) {
    const message = body?.message || body?.error_description || body?.error || body || 'ไม่สามารถเชื่อมต่อระบบได้';
    const error = new Error(String(message)) as Error & { status?: number; details?: unknown };
    error.status = response.status;
    error.details = body;
    throw error;
  }
  return body;
}

function statusOf(error: unknown) {
  return Number((error as Error & { status?: number })?.status || 0);
}

function networkError(message: string) {
  const error = new Error(message) as Error & { status?: number; code?: string };
  error.status = 0;
  error.code = 'NETWORK_ERROR';
  return error;
}

async function fetchWithTimeout(input: RequestInfo | URL, options: RequestInit = {}) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abort = () => controller.abort();
  if (externalSignal) externalSignal.addEventListener('abort', abort, { once: true });
  const timer = window.setTimeout(abort, requestTimeoutMs);
  try {
    return await fetch(input, { ...options, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw networkError('การเชื่อมต่อใช้เวลานานเกินไป กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่');
    }
    if (error instanceof TypeError) {
      throw networkError('เชื่อมต่อระบบไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', abort);
  }
}

function waitBeforeRetry(attempt: number) {
  return new Promise((resolve) => window.setTimeout(resolve, 350 * (2 ** attempt)));
}

async function performRefresh() {
  if (!session?.refresh_token) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
  try {
    const response = await fetchWithTimeout(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: config.supabasePublishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const body = await parseResponse(response) as SessionData;
    if (!body.access_token) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
    saveSession(body, profile);
    return session;
  } catch (error) {
    if ([400, 401, 403].includes(statusOf(error))) {
      clearSession();
      const expired = new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง') as Error & { status?: number };
      expired.status = 401;
      throw expired;
    }
    throw error;
  }
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function authHeaders(extra: HeadersInit = {}) {
  if (session && accessExpiresSoon()) await refreshSession();
  return {
    apikey: config.supabasePublishableKey,
    Authorization: `Bearer ${session?.access_token || config.supabasePublishableKey}`,
    ...extra,
  } as HeadersInit;
}

async function request(path: string, options: RequestInit = {}, allowRetry = true): Promise<any> {
  const method = String(options.method || 'GET').toUpperCase();
  const idempotent = method === 'GET' || method === 'HEAD';
  let authRetryAvailable = allowRetry;
  let transientAttempt = 0;

  while (true) {
    let response: Response;
    try {
      response = await fetchWithTimeout(`${config.supabaseUrl}${path}`, {
        ...options,
        headers: await authHeaders(options.headers),
      });
    } catch (error) {
      if (idempotent && transientAttempt < 2 && statusOf(error) === 0) {
        await waitBeforeRetry(transientAttempt++);
        continue;
      }
      throw error;
    }
    if (response.status === 401 && authRetryAvailable && session?.refresh_token) {
      authRetryAvailable = false;
      await refreshSession();
      continue;
    }
    if (idempotent && transientAttempt < 2 && [429, 502, 503, 504].includes(response.status)) {
      await response.body?.cancel().catch(() => undefined);
      await waitBeforeRetry(transientAttempt++);
      continue;
    }
    return parseResponse(response);
  }
}

async function select(table: string, query = ''): Promise<AnyRow[]> {
  return request(`/rest/v1/${table}${query ? `?${query}` : ''}`, {
    method: 'GET', headers: { Accept: 'application/json' },
  });
}

async function selectAll(table: string, query = '', pageSize = 1000): Promise<AnyRow[]> {
  const rows: AnyRow[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await request(`/rest/v1/${table}${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { Accept: 'application/json', Range: `${offset}-${offset + pageSize - 1}`, 'Range-Unit': 'items' },
    }) as AnyRow[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function insert(table: string, values: unknown, options: { query?: string; upsert?: boolean; return?: boolean } = {}) {
  return request(`/rest/v1/${table}${options.query ? `?${options.query}` : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: [options.upsert ? 'resolution=merge-duplicates' : '', options.return === false ? 'return=minimal' : 'return=representation'].filter(Boolean).join(','),
    },
    body: JSON.stringify(values),
  });
}

async function update(table: string, query: string, values: unknown, options: { return?: boolean } = {}) {
  return request(`/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: options.return === false ? 'return=minimal' : 'return=representation' },
    body: JSON.stringify(values),
  });
}

async function remove(table: string, query: string) {
  return request(`/rest/v1/${table}?${query}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
}

async function rpc(name: string, args: AnyRow = {}) {
  return request(`/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args),
  });
}

async function invoke(name: string, body: AnyRow = {}) {
  return request(`/functions/v1/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

async function login(employeeCode: string) {
  if (!configured()) throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase');
  const response = await fetchWithTimeout(`${config.supabaseUrl}/functions/v1/${config.employeeLoginFunction}`, {
    method: 'POST',
    headers: { apikey: config.supabasePublishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeCode: String(employeeCode || '').trim() }),
  });
  const body = await parseResponse(response);
  const nextProfile = { ...body.profile, is_active: body.profile?.is_active !== false } as AppProfile;
  saveSession(body.session, nextProfile);
  return nextProfile;
}

async function loginPassword(username: string, password: string) {
  if (!configured()) throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase');
  const cleanUsername = String(username || '').trim().toLowerCase();
  const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@maintenance-v2.local`;
  const response = await fetchWithTimeout(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: config.supabasePublishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: String(password || '') }),
  });
  const body = await parseResponse(response);
  session = { access_token: body.access_token, refresh_token: body.refresh_token };
  const rows = await select('mt_user_roles', `user_id=eq.${encodeURIComponent(body.user.id)}&select=user_id,technician_id,role,department_code,is_active&limit=1`);
  const nextProfile = rows[0] as AppProfile | undefined;
  if (!nextProfile?.is_active) {
    clearSession();
    throw new Error('บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าใช้ระบบ Maintenance Task & PM');
  }
  saveSession(body, nextProfile);
  return nextProfile;
}

async function restore() {
  loadStoredSession();
  if (!session) return null;
  try {
    if (accessExpiresSoon()) await refreshSession();
    const user = await request('/auth/v1/user', { method: 'GET' });
    const rows = await select('mt_user_roles', `user_id=eq.${encodeURIComponent(user.id)}&select=user_id,technician_id,role,department_code,is_active&limit=1`);
    profile = rows[0] ? { ...(profile || {}), ...rows[0] } as AppProfile : null;
    if (!profile?.is_active) throw new Error('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งาน');
    saveSession(session, profile);
    return profile;
  } catch (error) {
    if ([401, 403].includes(statusOf(error))) {
      clearSession();
      return null;
    }
    if (profile?.is_active) return profile;
    throw error;
  }
}

async function logout() {
  try {
    if (session?.access_token) await request('/auth/v1/logout', { method: 'POST' }, false);
  } catch {
    // Local sign-out must still work if the network is unavailable.
  }
  clearSession();
}

async function uploadWorkFile(workOrderId: string, file: File, kind = 'evidence', checklistResultId?: string | null) {
  if (!session?.access_token || !profile?.user_id) throw new Error('กรุณาเข้าสู่ระบบก่อนแนบไฟล์');
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  if (!allowed.has(file.type)) throw new Error('รองรับเฉพาะไฟล์ JPG, PNG, WebP และ PDF');
  if (file.size > 10 * 1024 * 1024) throw new Error('ไฟล์แนบต้องมีขนาดไม่เกิน 10 MB');
  const extension = (file.name.split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'bin';
  const objectPath = `${workOrderId}/${profile.user_id}/${crypto.randomUUID()}.${extension}`;
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  await request(`/storage/v1/object/mt-work-files/${encodedPath}`, {
    method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' }, body: file,
  });
  try {
    const rows = await insert('mt_work_attachments', {
      work_order_id: workOrderId, checklist_result_id: checklistResultId || null, file_kind: kind, object_path: objectPath,
      original_name: file.name, mime_type: file.type || 'application/octet-stream',
      file_size: file.size, uploaded_by: profile.user_id,
    });
    return rows[0];
  } catch (error) {
    await request('/storage/v1/object/mt-work-files', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: [objectPath] }),
    }).catch(() => undefined);
    throw error;
  }
}

function validateTechnicianPhoto(file: File) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowed.has(file.type)) throw new Error('รูปช่างรองรับเฉพาะ JPG, PNG และ WebP');
  if (file.size > 5 * 1024 * 1024) throw new Error('รูปช่างต้องมีขนาดไม่เกิน 5 MB');
}

async function uploadTechnicianPhoto(technicianId: string, file: File) {
  if (!session?.access_token) throw new Error('กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปช่าง');
  validateTechnicianPhoto(file);
  const extension = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'jpg';
  const objectPath = `${technicianId}/${crypto.randomUUID()}.${extension}`;
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  await request(`/storage/v1/object/${technicianPhotoBucket}/${encodedPath}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
    body: file,
  });
  technicianPhotoCache.delete(objectPath);
  return objectPath;
}

async function deleteTechnicianPhoto(objectPath?: string | null) {
  const cleanPath = String(objectPath || '').trim();
  if (!cleanPath || /^https?:\/\//i.test(cleanPath)) return;
  await request(`/storage/v1/object/${technicianPhotoBucket}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [cleanPath] }),
  });
  technicianPhotoCache.delete(cleanPath);
}

async function getWorkFileUrl(objectPath?: string | null) {
  const cleanPath = String(objectPath || '').trim();
  if (!cleanPath) return '';
  const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
  const body = await request(`/storage/v1/object/sign/mt-work-files/${encodedPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 900 }),
  });
  const signed = String(body?.signedURL || body?.signedUrl || body?.signed_url || '');
  if (!signed) throw new Error('ไม่สามารถสร้างลิงก์ไฟล์หลักฐานได้');
  return /^https?:\/\//i.test(signed)
    ? signed
    : signed.startsWith('/storage/v1/')
      ? `${config.supabaseUrl}${signed}`
      : `${config.supabaseUrl}/storage/v1${signed.startsWith('/') ? '' : '/'}${signed}`;
}

async function getTechnicianPhotoUrl(objectPath?: string | null) {
  const cleanPath = String(objectPath || '').trim();
  if (!cleanPath) return '';
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
  const cached = technicianPhotoCache.get(cleanPath);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url;
  const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
  const body = await request(`/storage/v1/object/sign/${technicianPhotoBucket}/${encodedPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  const signed = String(body?.signedURL || body?.signedUrl || body?.signed_url || '');
  if (!signed) throw new Error('ไม่สามารถสร้างลิงก์รูปช่างได้');
  const url = /^https?:\/\//i.test(signed)
    ? signed
    : signed.startsWith('/storage/v1/')
      ? `${config.supabaseUrl}${signed}`
      : `${config.supabaseUrl}/storage/v1${signed.startsWith('/') ? '' : '/'}${signed}`;
  technicianPhotoCache.set(cleanPath, { url, expiresAt: Date.now() + 3_600_000 });
  return url;
}

async function loadBundle(): Promise<DataBundle> {
  const rows = await Promise.all([
    selectAll('mt_work_orders', 'select=id,work_order_no,source_type,source_date,parent_work_order_id,pm_plan_id,duty_schedule_id,checklist_template_id,machine_id,department_code,title,description,priority,status,assignment_mode,team_id,primary_technician_id,scheduled_start_at,due_at,actual_started_at,submitted_at,completed_at,result_summary,rejection_reason,created_at&order=created_at.desc'),
    selectAll('mt_work_order_assignees', 'select=work_order_id,technician_id,is_primary,acknowledged_at,contribution_summary&order=work_order_id.asc,created_at.asc'),
    selectAll('mt_pm_plans', 'select=*&order=next_due_date.asc'),
    selectAll('mt_duty_schedules', 'select=*&order=duty_date.desc,department_code.asc,shift_code.asc'),
    select('mt_checklist_templates', 'select=*&order=template_type.asc,template_name.asc&limit=500'),
    select('mt_checklist_items', 'select=*&order=template_id.asc,sort_order.asc&limit=5000'),
    select('mt_shift_settings', 'select=*&order=department_code.asc,shift_code.asc'),
    select('mt_notification_settings', 'select=*&order=department_code.asc,shift_code.asc'),
    select('mt_teams', 'select=*&order=department_code.asc,shift_code.asc'),
    select('mt_team_members', 'select=*&order=team_id.asc,member_role.asc'),
    select('mt_technician_directory', 'select=id,full_name,department_code,shift,role,job_position,photo_url,is_active&order=department_code.asc,full_name.asc'),
    select('mt_machine_directory', 'select=id,machine_no,machine_name,department_code,production_line,area,criticality,photo_url,is_active&is_active=eq.true&order=department_code.asc,machine_no.asc'),
    select('mt_line_groups', 'select=id,group_name,department_scope,is_active,registered_at&order=registered_at.desc&limit=10'),
    selectAll('mt_work_order_checklist_items', 'select=*&order=work_order_id.asc,sort_order.asc'),
    selectAll('mt_checklist_results', 'select=*&order=work_order_id.asc,completed_at.asc'),
    selectAll('mt_abnormal_findings', 'select=*&order=created_at.asc'),
    selectAll('mt_work_status_history', 'select=*&order=created_at.asc'),
    selectAll('mt_work_attachments', 'select=id,work_order_id,checklist_result_id,file_kind,object_path,original_name,mime_type,file_size,caption,uploaded_by,created_at&order=created_at.asc'),
  ]);
  let managedTechnicians: AnyRow[] = [];
  let technicianAdminReady = false;
  if (profile?.role === 'admin') {
    try {
      const adminRows = await rpc('mt_admin_list_technicians');
      managedTechnicians = Array.isArray(adminRows) ? adminRows : [];
      technicianAdminReady = true;
    } catch (error) {
      console.warn('Technician administration RPC is not ready', error);
    }
  }
  return {
    workOrders: rows[0], assignees: rows[1], pmPlans: rows[2], dutySchedules: rows[3],
    templates: rows[4], templateItems: rows[5], shiftSettings: rows[6], notificationSettings: rows[7],
    teams: rows[8], teamMembers: rows[9], technicians: rows[10], machines: rows[11], lineGroups: rows[12],
    workOrderItems: rows[13], checklistResults: rows[14], abnormalFindings: rows[15], statusHistory: rows[16], workAttachments: rows[17],
    managedTechnicians, technicianAdminReady,
  };
}

export const api = {
  configured, login, loginPassword, restore, logout, select, selectAll, insert,
  update, remove, rpc, invoke, uploadWorkFile, getWorkFileUrl, loadBundle,
  uploadTechnicianPhoto, deleteTechnicianPhoto, getTechnicianPhotoUrl,
  getSession: () => session,
  getProfile: () => profile,
};
