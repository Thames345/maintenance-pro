-- Maintenance Pro: จัดการช่าง + รูปประจำตัว
-- ให้ผู้ใช้รันไฟล์นี้เองใน Supabase Dashboard > SQL Editor เพียง 1 ครั้ง
-- ไม่ลบประวัติงานเดิม และไม่แก้ auth.users โดยตรง

begin;

-- ผู้ใช้งานที่ยัง active ดูชื่อช่างเก่าได้ในรายงาน แม้ช่างคนนั้นถูกปิดใช้งานแล้ว
-- ตัวเลือกมอบหมายงานในหน้าเว็บยังกรองเฉพาะ is_active = true
drop policy if exists mt_technician_directory_select on public.mt_technician_directory;
create policy mt_technician_directory_select
on public.mt_technician_directory
for select
to authenticated
using (mt_private.mt_is_active_user());

-- รายการสำหรับหน้า Admin เท่านั้น มีรหัสพนักงานและสถานะบัญชี Login
create or replace function public.mt_admin_list_technicians()
returns table (
  id uuid,
  employee_code text,
  full_name text,
  department_code text,
  shift text,
  "position" text,
  photo_url text,
  is_active boolean,
  has_login boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not mt_private.mt_has_role(array['admin']::text[])
  then
    raise exception 'TECHNICIAN_ADMIN_ONLY' using errcode = '42501';
  end if;

  return query
  select
    t.id,
    t.employee_code,
    t.full_name,
    t.department_code,
    t.shift,
    t.position,
    t.photo_url,
    t.is_active,
    (t.auth_user_id is not null) as has_login
  from public.technicians t
  order by t.is_active desc, t.department_code, t.full_name;
end;
$$;

-- เพิ่ม/แก้ไข/ย้ายแผนก/ย้ายทีม/ปิดใช้งาน ใน transaction เดียว
-- role ของรายการใหม่ถูกกำหนดเป็น technician เพื่อไม่เปิดสิทธิ์ Admin จากหน้าเว็บโดยไม่ตั้งใจ
create or replace function public.mt_admin_save_technician(
  p_id uuid default null,
  p_employee_code text default null,
  p_full_name text default null,
  p_department_code text default null,
  p_shift text default null,
  p_position text default null,
  p_photo_url text default null,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_employee_code text := btrim(coalesce(p_employee_code, ''));
  v_full_name text := btrim(coalesce(p_full_name, ''));
  v_department_code text := upper(btrim(coalesce(p_department_code, '')));
  v_shift text := upper(btrim(coalesce(p_shift, '')));
  v_position text := nullif(btrim(coalesce(p_position, '')), '');
  v_photo_url text := nullif(btrim(coalesce(p_photo_url, '')), '');
  v_old_employee_code text;
  v_auth_user_id uuid;
  v_target_team_id uuid;
  v_result jsonb;
begin
  if (select auth.uid()) is null
    or not mt_private.mt_has_role(array['admin']::text[])
  then
    raise exception 'TECHNICIAN_ADMIN_ONLY' using errcode = '42501';
  end if;

  if char_length(v_employee_code) < 3
    or char_length(v_employee_code) > 20
    or v_employee_code !~ '^[0-9A-Za-z_-]+$'
  then
    raise exception 'INVALID_EMPLOYEE_CODE';
  end if;

  if char_length(v_full_name) < 2 or char_length(v_full_name) > 160 then
    raise exception 'INVALID_TECHNICIAN_NAME';
  end if;

  if v_shift not in ('A', 'B', 'O') then
    raise exception 'INVALID_TECHNICIAN_SHIFT';
  end if;

  if not exists (
    select 1
    from public.departments d
    where d.dept_code = v_department_code
      and d.is_active is true
  ) then
    raise exception 'INVALID_TECHNICIAN_DEPARTMENT';
  end if;

  if p_id is null then
    insert into public.technicians (
      id, employee_code, full_name, department_code, shift,
      role, position, photo_url, is_active
    ) values (
      v_id, v_employee_code, v_full_name, v_department_code, v_shift,
      'technician', v_position, v_photo_url, coalesce(p_is_active, true)
    );
  else
    select t.employee_code, t.auth_user_id
      into v_old_employee_code, v_auth_user_id
    from public.technicians t
    where t.id = v_id
    for update;

    if not found then
      raise exception 'TECHNICIAN_NOT_FOUND' using errcode = 'P0002';
    end if;

    if v_auth_user_id is not null and v_old_employee_code <> v_employee_code then
      raise exception 'EMPLOYEE_CODE_LINKED_ACCOUNT';
    end if;

    if coalesce(p_is_active, true) is false and exists (
      select 1
      from public.mt_user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.technician_id = v_id
        and ur.is_active is true
    ) then
      raise exception 'CANNOT_DISABLE_CURRENT_ADMIN';
    end if;

    update public.technicians t
    set
      employee_code = v_employee_code,
      full_name = v_full_name,
      department_code = v_department_code,
      shift = v_shift,
      position = v_position,
      photo_url = v_photo_url,
      is_active = coalesce(p_is_active, true),
      updated_at = now()
    where t.id = v_id;
  end if;

  -- ให้บัญชีที่เชื่อมแล้วใช้แผนกและสถานะเดียวกับทะเบียนช่าง
  update public.mt_user_roles ur
  set
    department_code = v_department_code,
    is_active = coalesce(p_is_active, true),
    updated_at = now()
  where ur.technician_id = v_id;

  -- ทีมประจำถูกเลือกจากแผนก + A/B/O โดยอัตโนมัติ
  select team.id
    into v_target_team_id
  from public.mt_teams team
  where team.department_code = v_department_code
    and team.crew_code = v_shift
    and team.is_active is true
  order by team.created_at
  limit 1;

  update public.mt_team_members tm
  set
    is_active = false,
    valid_until = greatest(tm.valid_from, current_date),
    updated_at = now()
  where tm.technician_id = v_id
    and tm.is_active is true
    and (
      coalesce(p_is_active, true) is false
      or v_target_team_id is null
      or tm.team_id <> v_target_team_id
    );

  if coalesce(p_is_active, true) is true
    and v_target_team_id is not null
    and not exists (
      select 1
      from public.mt_team_members tm
      where tm.team_id = v_target_team_id
        and tm.technician_id = v_id
        and tm.is_active is true
    )
  then
    insert into public.mt_team_members (
      team_id, technician_id, member_role, valid_from, valid_until, is_active
    ) values (
      v_target_team_id, v_id, 'member', current_date, null, true
    )
    on conflict (team_id, technician_id, valid_from)
    do update set
      member_role = 'member',
      valid_until = null,
      is_active = true,
      updated_at = now();
  end if;

  select jsonb_build_object(
    'id', t.id,
    'employee_code', t.employee_code,
    'full_name', t.full_name,
    'department_code', t.department_code,
    'shift', t.shift,
    'position', t.position,
    'photo_url', t.photo_url,
    'is_active', t.is_active,
    'has_login', t.auth_user_id is not null
  )
  into v_result
  from public.technicians t
  where t.id = v_id;

  return v_result;
end;
$$;

-- ลบถาวรได้เฉพาะคนที่ยังไม่มีประวัติงาน/แผน PM/บัญชี Login
-- หากมีประวัติ ให้ใช้ปิดใช้งานเพื่อคงรายงานย้อนหลังไว้ครบ
create or replace function public.mt_admin_delete_technician(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.technicians%rowtype;
begin
  if (select auth.uid()) is null
    or not mt_private.mt_has_role(array['admin']::text[])
  then
    raise exception 'TECHNICIAN_ADMIN_ONLY' using errcode = '42501';
  end if;

  select * into v_row
  from public.technicians t
  where t.id = p_id
  for update;

  if not found then
    raise exception 'TECHNICIAN_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_row.auth_user_id is not null
    or exists (select 1 from public.mt_user_roles ur where ur.technician_id = p_id)
    or exists (select 1 from public.mt_work_order_assignees wa where wa.technician_id = p_id)
    or exists (select 1 from public.mt_work_orders wo where wo.primary_technician_id = p_id)
    or exists (select 1 from public.mt_pm_plans pp where pp.primary_technician_id = p_id)
    or exists (select 1 from public.mt_duty_schedules ds where ds.primary_technician_id = p_id)
  then
    raise exception 'TECHNICIAN_HAS_HISTORY';
  end if;

  delete from public.mt_team_members tm where tm.technician_id = p_id;
  delete from public.technicians t where t.id = p_id;

  return jsonb_build_object(
    'id', v_row.id,
    'full_name', v_row.full_name,
    'photo_url', v_row.photo_url,
    'deleted', true
  );
end;
$$;

-- จำกัดสิทธิ์ RPC: ไม่ให้ anon/PUBLIC เรียก แม้ฟังก์ชันอยู่ใน public เพื่อใช้ผ่าน Data API
revoke all on function public.mt_admin_list_technicians() from public, anon;
revoke all on function public.mt_admin_save_technician(uuid, text, text, text, text, text, text, boolean) from public, anon;
revoke all on function public.mt_admin_delete_technician(uuid) from public, anon;

grant execute on function public.mt_admin_list_technicians() to authenticated;
grant execute on function public.mt_admin_save_technician(uuid, text, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.mt_admin_delete_technician(uuid) to authenticated;

-- Bucket รูปช่างเป็น private: ผู้ใช้งานที่ active ดูได้, เฉพาะ Admin เพิ่ม/แก้/ลบได้
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'mt-technician-photos',
  'mt-technician-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists mt_technician_photos_read on storage.objects;
drop policy if exists mt_technician_photos_insert on storage.objects;
drop policy if exists mt_technician_photos_update on storage.objects;
drop policy if exists mt_technician_photos_delete on storage.objects;

create policy mt_technician_photos_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'mt-technician-photos'
  and mt_private.mt_is_active_user()
);

create policy mt_technician_photos_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mt-technician-photos'
  and mt_private.mt_has_role(array['admin']::text[])
);

create policy mt_technician_photos_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'mt-technician-photos'
  and mt_private.mt_has_role(array['admin']::text[])
)
with check (
  bucket_id = 'mt-technician-photos'
  and mt_private.mt_has_role(array['admin']::text[])
);

create policy mt_technician_photos_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mt-technician-photos'
  and mt_private.mt_has_role(array['admin']::text[])
);

commit;

-- ผลตรวจหลังรันควรได้ 3 functions และ bucket public = false
select p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'mt_admin_list_technicians',
    'mt_admin_save_technician',
    'mt_admin_delete_technician'
  )
order by p.proname;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'mt-technician-photos';
