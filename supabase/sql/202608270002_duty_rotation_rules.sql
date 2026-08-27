-- Maintenance Pro v2.5.6
-- Duty rotation rules + shared checklist standard
-- Production migration already applied to project fyntvktkourwvgtnylcc.

create table if not exists public.mt_duty_rules (
  id uuid primary key default gen_random_uuid(),
  department_code text not null unique references public.departments(dept_code),
  schedule_mode text not null default 'manual'
    check (schedule_mode in ('daily','alternate','manual')),
  rotation_group text,
  rotation_order integer,
  anchor_date date,
  work_days smallint[] not null default array[1,2,3,4,5,6,7]::smallint[],
  shift_codes text[] not null default array['DAY','NIGHT']::text[],
  auto_create boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mt_duty_rules_days_check
    check (cardinality(work_days) > 0 and work_days <@ array[1,2,3,4,5,6,7]::smallint[]),
  constraint mt_duty_rules_shifts_check
    check (cardinality(shift_codes) > 0 and shift_codes <@ array['DAY','NIGHT']::text[]),
  constraint mt_duty_rules_alternate_check
    check (
      schedule_mode <> 'alternate'
      or (rotation_group is not null and rotation_order is not null and rotation_order > 0 and anchor_date is not null)
    )
);

alter table public.mt_duty_rules enable row level security;
drop policy if exists mt_duty_rules_select on public.mt_duty_rules;
create policy mt_duty_rules_select
on public.mt_duty_rules for select to authenticated using (true);

revoke all on public.mt_duty_rules from public, anon;
grant select on public.mt_duty_rules to authenticated;

insert into public.mt_duty_rules (
  department_code,schedule_mode,rotation_group,rotation_order,anchor_date,
  work_days,shift_codes,auto_create,is_active
) values
('MVR','alternate','MAIN_ROOM',1,date '2026-08-27',array[1,2,3,4,5,6,7]::smallint[],array['DAY','NIGHT']::text[],true,true),
('MSR','alternate','MAIN_ROOM',2,date '2026-08-27',array[1,2,3,4,5,6,7]::smallint[],array['DAY','NIGHT']::text[],true,true),
('MVR-LOTUS','daily',null,null,null,array[1,2,3,4,5,6,7]::smallint[],array['DAY','NIGHT']::text[],true,true),
('MPR','manual',null,null,null,array[1,2,3,4,5,6,7]::smallint[],array['DAY','NIGHT']::text[],false,true)
on conflict (department_code) do update set
  schedule_mode=excluded.schedule_mode,
  rotation_group=excluded.rotation_group,
  rotation_order=excluded.rotation_order,
  anchor_date=excluded.anchor_date,
  work_days=excluded.work_days,
  shift_codes=excluded.shift_codes,
  auto_create=excluded.auto_create,
  is_active=excluded.is_active,
  updated_at=now();

create or replace function mt_private.mt_duty_rule_applies(
  p_department_code text,
  p_duty_date date,
  p_shift_code text
)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_rule public.mt_duty_rules%rowtype;
  v_count integer;
  v_offset integer;
  v_selected text;
  v_anchor date;
begin
  select * into v_rule
  from public.mt_duty_rules
  where department_code=p_department_code and is_active=true;

  if not found or v_rule.auto_create is false then return false; end if;
  if not (extract(isodow from p_duty_date)::smallint = any(v_rule.work_days)) then return false; end if;
  if not (upper(p_shift_code) = any(v_rule.shift_codes)) then return false; end if;

  if v_rule.schedule_mode='daily' then return true; end if;
  if v_rule.schedule_mode='manual' then return false; end if;

  select count(*), min(anchor_date)
  into v_count, v_anchor
  from public.mt_duty_rules
  where schedule_mode='alternate'
    and rotation_group=v_rule.rotation_group
    and is_active=true and auto_create=true
    and extract(isodow from p_duty_date)::smallint = any(work_days)
    and upper(p_shift_code) = any(shift_codes);

  if coalesce(v_count,0)=0 or v_anchor is null then return false; end if;
  v_offset := mod(mod((p_duty_date-v_anchor),v_count)+v_count,v_count);

  select department_code into v_selected
  from public.mt_duty_rules
  where schedule_mode='alternate'
    and rotation_group=v_rule.rotation_group
    and is_active=true and auto_create=true
    and extract(isodow from p_duty_date)::smallint = any(work_days)
    and upper(p_shift_code) = any(shift_codes)
  order by rotation_order,department_code
  offset v_offset limit 1;

  return v_selected=p_department_code;
end;
$$;

revoke all on function mt_private.mt_duty_rule_applies(text,date,text) from public, anon, authenticated;
grant usage on schema mt_private to service_role;
grant execute on function mt_private.mt_duty_rule_applies(text,date,text) to service_role;

create or replace function mt_private.mt_save_duty_rule_tx(
  p_department_code text,
  p_schedule_mode text,
  p_rotation_group text,
  p_rotation_order integer,
  p_anchor_date date,
  p_work_days smallint[],
  p_shift_codes text[],
  p_auto_create boolean
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_department text:=upper(btrim(coalesce(p_department_code,'')));
  v_mode text:=lower(btrim(coalesce(p_schedule_mode,'')));
  v_result jsonb;
begin
  if (select auth.uid()) is null
     or not mt_private.mt_has_role(array['admin','supervisor']::text[])
  then
    raise exception 'Manager permission required' using errcode='42501';
  end if;

  if not exists(select 1 from public.departments d where d.dept_code=v_department and d.is_active=true) then
    raise exception 'INVALID_DEPARTMENT';
  end if;
  if v_mode not in ('daily','alternate','manual') then raise exception 'INVALID_SCHEDULE_MODE'; end if;
  if p_work_days is null or cardinality(p_work_days)=0 or not (p_work_days <@ array[1,2,3,4,5,6,7]::smallint[]) then
    raise exception 'INVALID_WORK_DAYS';
  end if;
  if p_shift_codes is null or cardinality(p_shift_codes)=0 or not (p_shift_codes <@ array['DAY','NIGHT']::text[]) then
    raise exception 'INVALID_SHIFT_CODES';
  end if;
  if v_mode='alternate' and (
    nullif(btrim(coalesce(p_rotation_group,'')),'') is null
    or p_rotation_order is null or p_rotation_order<1 or p_anchor_date is null
  ) then
    raise exception 'ALTERNATE_RULE_INCOMPLETE';
  end if;

  insert into public.mt_duty_rules(
    department_code,schedule_mode,rotation_group,rotation_order,anchor_date,
    work_days,shift_codes,auto_create,is_active
  ) values (
    v_department,v_mode,
    case when v_mode='alternate' then upper(btrim(p_rotation_group)) else null end,
    case when v_mode='alternate' then p_rotation_order else null end,
    case when v_mode='alternate' then p_anchor_date else null end,
    p_work_days,array(select upper(x) from unnest(p_shift_codes) x),
    coalesce(p_auto_create,false),true
  )
  on conflict(department_code) do update set
    schedule_mode=excluded.schedule_mode,
    rotation_group=excluded.rotation_group,
    rotation_order=excluded.rotation_order,
    anchor_date=excluded.anchor_date,
    work_days=excluded.work_days,
    shift_codes=excluded.shift_codes,
    auto_create=excluded.auto_create,
    is_active=true,
    updated_at=now();

  select to_jsonb(r) into v_result
  from public.mt_duty_rules r
  where r.department_code=v_department;
  return v_result;
end;
$$;

revoke all on function mt_private.mt_save_duty_rule_tx(text,text,text,integer,date,smallint[],text[],boolean)
from public, anon;
grant execute on function mt_private.mt_save_duty_rule_tx(text,text,text,integer,date,smallint[],text[],boolean)
to authenticated;

create or replace function public.mt_save_duty_rule(
  p_department_code text,
  p_schedule_mode text,
  p_rotation_group text default null,
  p_rotation_order integer default null,
  p_anchor_date date default null,
  p_work_days smallint[] default array[1,2,3,4,5,6,7]::smallint[],
  p_shift_codes text[] default array['DAY','NIGHT']::text[],
  p_auto_create boolean default true
)
returns jsonb
language sql
set search_path=''
as $$
  select mt_private.mt_save_duty_rule_tx(
    p_department_code,p_schedule_mode,p_rotation_group,p_rotation_order,
    p_anchor_date,p_work_days,p_shift_codes,p_auto_create
  );
$$;

revoke all on function public.mt_save_duty_rule(text,text,text,integer,date,smallint[],text[],boolean)
from public,anon;
grant execute on function public.mt_save_duty_rule(text,text,text,integer,date,smallint[],text[],boolean)
to authenticated;

-- Standardize all Duty templates to the 6-item MSR checklist.
insert into public.mt_checklist_templates(
  template_code,template_name,template_type,department_code,description,
  version,minimum_photos,require_approval,is_system,is_active
)
select
  'DUTY-MPR','เวรหลังเลิกงาน MPR','duty','MPR',
  'แม่แบบเวรพื้นที่ห้องช่าง ใช้รายการมาตรฐานเดียวกับ MSR',
  1,src.minimum_photos,src.require_approval,true,true
from public.mt_checklist_templates src
where src.template_code='DUTY-MSR'
on conflict(template_code) do update set
  template_name=excluded.template_name,
  template_type='duty',
  department_code='MPR',
  description=excluded.description,
  minimum_photos=excluded.minimum_photos,
  require_approval=excluded.require_approval,
  is_system=true,
  is_active=true,
  updated_at=now();

update public.mt_checklist_templates dst
set minimum_photos=src.minimum_photos,
    require_approval=src.require_approval,
    description='รายการมาตรฐานเดียวกับ DUTY-MSR',
    version=dst.version+1,
    updated_at=now()
from public.mt_checklist_templates src
where src.template_code='DUTY-MSR'
  and dst.template_code in ('DUTY-MVR','DUTY-MVR-LOTUS','DUTY-MPR');

delete from public.mt_checklist_items
where template_id in (
  select id from public.mt_checklist_templates
  where template_code in ('DUTY-MVR','DUTY-MVR-LOTUS','DUTY-MPR')
);

insert into public.mt_checklist_items(
  template_id,item_code,section_name,item_name,instructions,answer_type,
  choices,unit,min_value,max_value,is_required,require_photo_if_abnormal,sort_order
)
select
  dst.id,src.item_code,src.section_name,src.item_name,src.instructions,src.answer_type,
  src.choices,src.unit,src.min_value,src.max_value,src.is_required,src.require_photo_if_abnormal,src.sort_order
from public.mt_checklist_items src
join public.mt_checklist_templates msr on msr.id=src.template_id and msr.template_code='DUTY-MSR'
cross join public.mt_checklist_templates dst
where dst.template_code in ('DUTY-MVR','DUTY-MVR-LOTUS','DUTY-MPR');

-- mt_generate_duty_work_orders(date) must include:
--   and mt_private.mt_duty_rule_applies(s.department_code,p_duty_date,s.shift_code)
-- in its mt_shift_settings loop.
-- Production v2.5.6 already contains that replacement and LINE dispatcher v12 calls it automatically.
