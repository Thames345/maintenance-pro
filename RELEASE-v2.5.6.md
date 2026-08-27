# Maintenance Pro v2.5.6 — Duty Rotation Rules

## What changed
- All system Duty Checklists (MVR, MSR, MVR-LOTUS, MPR) use the same 6 checklist items as DUTY-MSR.
- Automatic duty rules are now stored in Supabase (`mt_duty_rules`).
- MVR and MSR share `MAIN_ROOM` and alternate every calendar day.
- Rotation anchor: 27/08/2026 = MVR, 28/08/2026 = MSR.
- MVR-LOTUS creates duty every day because it is a separate area.
- MPR stays Manual by default.
- Admin/Supervisor can edit weekdays, DAY/NIGHT shifts, mode, rotation order, and anchor date from Settings → กำหนดเวร.
- Settings includes an 8-day preview before saving.
- LINE dispatcher v12 generates duties from rules and keeps automatic LINE notifications.

## Default rule
- MVR: Alternate, MAIN_ROOM #1, all days, DAY+NIGHT
- MSR: Alternate, MAIN_ROOM #2, all days, DAY+NIGHT
- MVR-LOTUS: Daily, all days, DAY+NIGHT
- MPR: Manual
