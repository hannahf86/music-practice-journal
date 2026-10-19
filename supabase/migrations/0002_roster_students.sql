-- 0002_roster_students.sql — teacher-created roster students (no account required).
-- A teacher builds their student list by name; a student later claims the entry via the
-- teacher's code (account_id is set at claim time). Lesson notes can be written against a
-- roster student before any account exists.
-- Run in the Supabase SQL editor after 0001.

-- ── Roster students ────────────────────────────────────────────────────────────
create table if not exists roster_students (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references profiles(id) on delete cascade,
  display_name  text not null,
  date_of_birth date,
  account_id    uuid references profiles(id) on delete set null, -- set when claimed by a student
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (account_id)
);

alter table roster_students enable row level security;

-- Teacher owns their roster entries; a linked student account may read its own entry.
drop policy if exists roster_teacher_all on roster_students;
create policy roster_teacher_all on roster_students for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists roster_account_select on roster_students;
create policy roster_account_select on roster_students for select
  using (account_id = auth.uid());

create trigger trg_touch_roster_students
  before update on roster_students for each row execute function touch_updated_at();

-- ── lesson_weeks: allow a roster student as the subject (account optional) ───────
alter table lesson_weeks alter column student_id drop not null;
alter table lesson_weeks add column if not exists roster_student_id uuid references roster_students(id) on delete cascade;

-- exactly-one-subject guard + per-roster weekly uniqueness (nulls are distinct, so account
-- rows with a null roster_student_id never collide here)
alter table lesson_weeks drop constraint if exists lw_subject_chk;
alter table lesson_weeks add constraint lw_subject_chk
  check (student_id is not null or roster_student_id is not null);
alter table lesson_weeks drop constraint if exists lesson_weeks_roster_week_key;
alter table lesson_weeks add constraint lesson_weeks_roster_week_key unique (roster_student_id, week_start);

-- ── RLS: teachers write lesson weeks for their roster; linked account reads them ─
drop policy if exists lw_select on lesson_weeks;
create policy lw_select on lesson_weeks for select using (
  student_id = auth.uid()
  or is_linked_parent_of(student_id)
  or (teacher_id = auth.uid() and is_active_teacher_of(student_id))
  or (teacher_id = auth.uid() and roster_student_id in (select id from roster_students where teacher_id = auth.uid()))
  or roster_student_id in (select id from roster_students where account_id = auth.uid())
);

drop policy if exists lw_insert on lesson_weeks;
create policy lw_insert on lesson_weeks for insert with check (
  (teacher_id = auth.uid() and is_active_teacher_of(student_id))
  or (student_id = auth.uid() and teacher_id = auth.uid())
  or (teacher_id = auth.uid() and roster_student_id in (select id from roster_students where teacher_id = auth.uid()))
);

drop policy if exists lw_update on lesson_weeks;
create policy lw_update on lesson_weeks for update using (
  (teacher_id = auth.uid() and is_active_teacher_of(student_id))
  or (student_id = auth.uid() and teacher_id = auth.uid())
  or (teacher_id = auth.uid() and roster_student_id in (select id from roster_students where teacher_id = auth.uid()))
) with check (
  (teacher_id = auth.uid() and is_active_teacher_of(student_id))
  or (student_id = auth.uid() and teacher_id = auth.uid())
  or (teacher_id = auth.uid() and roster_student_id in (select id from roster_students where teacher_id = auth.uid()))
);
