-- Maintenance Pro v2.5.1 - Checklist Management
-- MPRLine production ได้ติดตั้งแล้ว ไฟล์นี้เก็บไว้สำหรับ setup โปรเจกต์ใหม่/อ้างอิงเท่านั้น

create or replace function public.mt_update_checklist_template(
  p_template_id uuid,
  p_template jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_template public.mt_checklist_templates%rowtype;
  v_code text;
  v_name text;
  v_type text;
  v_department text;
  v_minimum_photos integer;
  v_is_active boolean;
  v_item jsonb;
  v_item_id uuid;
  v_item_name text;
  v_answer_type text;
  v_min numeric;
  v_max numeric;
  v_choices jsonb;
  v_existing_ids uuid[] := '{}'::uuid[];
  v_ord integer := 0;
  v_updated jsonb;
begin
  if (select auth.uid()) is null
     or not mt_private.mt_has_role(array['admin','supervisor']::text[])
  then
    raise exception 'CHECKLIST_MANAGER_ONLY' using errcode='42501';
  end if;

  if p_template_id is null then raise exception 'CHECKLIST_TEMPLATE_ID_REQUIRED'; end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0
  then
    raise exception 'CHECKLIST_ITEMS_REQUIRED';
  end if;

  select * into v_template
  from public.mt_checklist_templates t
  where t.id = p_template_id
  for update;
  if not found then raise exception 'CHECKLIST_TEMPLATE_NOT_FOUND' using errcode='P0002'; end if;

  v_code := upper(regexp_replace(btrim(coalesce(p_template ->> 'template_code', v_template.template_code)), '\s+', '-', 'g'));
  v_name := btrim(coalesce(p_template ->> 'template_name', v_template.template_name));
  v_type := lower(btrim(coalesce(p_template ->> 'template_type', v_template.template_type)));
  v_department := nullif(upper(btrim(coalesce(p_template ->> 'department_code', coalesce(v_template.department_code, '')))), '');
  v_minimum_photos := coalesce(nullif(p_template ->> 'minimum_photos', '')::integer, v_template.minimum_photos);
  v_is_active := coalesce((p_template ->> 'is_active')::boolean, v_template.is_active);

  if char_length(v_name) < 2 or char_length(v_name) > 180 then raise exception 'INVALID_CHECKLIST_TEMPLATE_NAME'; end if;
  if char_length(v_code) < 2 or char_length(v_code) > 80 then raise exception 'INVALID_CHECKLIST_TEMPLATE_CODE'; end if;
  if v_type not in ('pm','duty','general','safety','calibration') then raise exception 'INVALID_CHECKLIST_TYPE'; end if;
  if v_minimum_photos < 0 or v_minimum_photos > 20 then raise exception 'INVALID_MINIMUM_PHOTOS'; end if;

  if v_template.is_system then
    v_code := v_template.template_code;
    v_type := v_template.template_type;
    v_department := v_template.department_code;
    v_is_active := v_template.is_active;
  end if;

  if exists (
    select 1 from public.mt_checklist_templates t
    where t.template_code = v_code and t.id <> p_template_id
  ) then raise exception 'CHECKLIST_TEMPLATE_CODE_EXISTS'; end if;

  select coalesce(array_agg((e.value ->> 'id')::uuid), '{}'::uuid[])
  into v_existing_ids
  from jsonb_array_elements(p_items) e(value)
  where nullif(e.value ->> 'id', '') is not null;

  delete from public.mt_checklist_items i
  where i.template_id = p_template_id
    and not (i.id = any(v_existing_ids));

  update public.mt_checklist_templates t
  set template_code = v_code,
      template_name = v_name,
      template_type = v_type,
      department_code = v_department,
      minimum_photos = v_minimum_photos,
      is_active = v_is_active,
      version = t.version + 1,
      updated_at = now()
  where t.id = p_template_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_ord := v_ord + 1;
    v_item_id := nullif(v_item ->> 'id', '')::uuid;
    v_item_name := btrim(coalesce(v_item ->> 'item_name', ''));
    v_answer_type := lower(btrim(coalesce(v_item ->> 'answer_type', 'normal_abnormal')));
    v_min := nullif(v_item ->> 'min_value', '')::numeric;
    v_max := nullif(v_item ->> 'max_value', '')::numeric;
    v_choices := coalesce(v_item -> 'choices', '[]'::jsonb);

    if char_length(v_item_name) < 2 or char_length(v_item_name) > 240 then raise exception 'INVALID_CHECKLIST_ITEM_NAME'; end if;
    if v_answer_type not in ('normal_abnormal','pass_fail','done_not_done','number','select','text','photo','signature') then raise exception 'INVALID_CHECKLIST_ANSWER_TYPE'; end if;
    if v_answer_type = 'number' and v_min is not null and v_max is not null and v_max < v_min then raise exception 'INVALID_CHECKLIST_NUMBER_RANGE'; end if;
    if jsonb_typeof(v_choices) <> 'array' then raise exception 'INVALID_CHECKLIST_CHOICES'; end if;

    if v_item_id is null then
      insert into public.mt_checklist_items (
        template_id,item_code,section_name,item_name,instructions,answer_type,
        choices,unit,min_value,max_value,is_required,require_photo_if_abnormal,sort_order
      ) values (
        p_template_id,
        v_code || '-ITEM-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
        nullif(btrim(coalesce(v_item ->> 'section_name', '')), ''),
        v_item_name,
        nullif(btrim(coalesce(v_item ->> 'instructions', '')), ''),
        v_answer_type,
        v_choices,
        nullif(btrim(coalesce(v_item ->> 'unit', '')), ''),
        v_min,
        v_max,
        coalesce((v_item ->> 'is_required')::boolean, true),
        coalesce((v_item ->> 'require_photo_if_abnormal')::boolean, true),
        v_ord * 10
      );
    else
      update public.mt_checklist_items i
      set section_name = nullif(btrim(coalesce(v_item ->> 'section_name', '')), ''),
          item_name = v_item_name,
          instructions = nullif(btrim(coalesce(v_item ->> 'instructions', '')), ''),
          answer_type = v_answer_type,
          choices = v_choices,
          unit = nullif(btrim(coalesce(v_item ->> 'unit', '')), ''),
          min_value = v_min,
          max_value = v_max,
          is_required = coalesce((v_item ->> 'is_required')::boolean, i.is_required),
          require_photo_if_abnormal = coalesce((v_item ->> 'require_photo_if_abnormal')::boolean, i.require_photo_if_abnormal),
          sort_order = v_ord * 10,
          updated_at = now()
      where i.id = v_item_id and i.template_id = p_template_id;
      if not found then raise exception 'CHECKLIST_ITEM_NOT_FOUND'; end if;
    end if;
  end loop;

  select to_jsonb(t) into v_updated
  from public.mt_checklist_templates t
  where t.id = p_template_id;

  return jsonb_build_object('template', v_updated, 'item_count', jsonb_array_length(p_items));
end;
$$;

revoke all on function public.mt_update_checklist_template(uuid,jsonb,jsonb) from public, anon;
grant execute on function public.mt_update_checklist_template(uuid,jsonb,jsonb) to authenticated;

create or replace function public.mt_delete_checklist_template(p_template_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_template public.mt_checklist_templates%rowtype;
  v_work_count integer;
  v_pm_count integer;
  v_duty_count integer;
begin
  if (select auth.uid()) is null
     or not mt_private.mt_has_role(array['admin','supervisor']::text[])
  then
    raise exception 'CHECKLIST_MANAGER_ONLY' using errcode='42501';
  end if;

  select * into v_template
  from public.mt_checklist_templates t
  where t.id = p_template_id
  for update;
  if not found then raise exception 'CHECKLIST_TEMPLATE_NOT_FOUND' using errcode='P0002'; end if;
  if v_template.is_system then raise exception 'SYSTEM_TEMPLATE_CANNOT_BE_DELETED'; end if;

  select count(*) into v_work_count from public.mt_work_orders wo where wo.checklist_template_id=p_template_id;
  select count(*) into v_pm_count from public.mt_pm_plans p where p.checklist_template_id=p_template_id;
  select count(*) into v_duty_count from public.mt_duty_schedules d where d.checklist_template_id=p_template_id;

  if v_work_count + v_pm_count + v_duty_count > 0 then raise exception 'CHECKLIST_TEMPLATE_IN_USE'; end if;

  delete from public.mt_checklist_templates t where t.id=p_template_id;
  return jsonb_build_object('id', p_template_id, 'template_code', v_template.template_code, 'deleted', true);
end;
$$;

revoke all on function public.mt_delete_checklist_template(uuid) from public, anon;
grant execute on function public.mt_delete_checklist_template(uuid) to authenticated;
