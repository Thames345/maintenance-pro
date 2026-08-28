-- Maintenance Pro v2.5.9
-- Required photo per checklist item.
-- This migration has already been applied to production project fyntvktkourwvgtnylcc.

alter table public.mt_checklist_items
  add column if not exists require_photo boolean not null default false;

alter table public.mt_work_order_checklist_items
  add column if not exists require_photo boolean not null default false;

-- Existing duty checklist items require photo by default.
update public.mt_checklist_items i
set require_photo=true,
    updated_at=now()
from public.mt_checklist_templates t
where t.id=i.template_id
  and t.template_type='duty'
  and t.is_active=true;

-- Keep already-created work-order snapshots aligned with source checklist items.
update public.mt_work_order_checklist_items wi
set require_photo=ci.require_photo
from public.mt_checklist_items ci
where wi.source_item_id=ci.id
  and wi.require_photo is distinct from ci.require_photo;

-- NOTE:
-- Production also updates these existing functions to carry/enforce require_photo:
--   mt_private.mt_snapshot_work_order_checklist()
--   mt_private.mt_guard_work_order_update()
--   public.mt_update_checklist_template(uuid,jsonb,jsonb)
-- Keep the database migration history in Supabase as the source of truth.
