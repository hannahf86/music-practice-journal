-- 0001_init.sql — Music Practice Journal schema, view, RLS, and audit triggers.
-- Matches the Next.js app's types/hooks exactly.
-- Run in the Supabase SQL editor.
--
-- ⚠️ DESTRUCTIVE PREAMBLE: drops any existing objects with these names first so the
-- rebuild is clean. Only run on a database whose current contents you don't need.

-- ── Drop existing (mismatched) objects ────────────────────────────────────────
drop view if exists teacher_review_summary cascade;
drop table if exists
  safeguarding_audit_log, concert_exam_dates, goals, weekly_reviews,
  practice_plan_notes, practice_notes, practice_plans, weekly_goals,
  lesson_weeks, parent_student_links, student_teacher_links,
  teacher_declarations, profiles
  cascade;
drop function if exists is_active_teacher_of(uuid) cascade;
drop function if exists is_linked_parent_of(uuid) cascade;
drop function if exists teacher_has_signed_declaration(uuid) cascade;
drop function if exists log_link_event() cascade;
drop function if exists touch_updated_at() cascade;
drop type if exists user_role cascade;
drop type if exists link_status cascade;
drop type if exists parent_link_type cascade;
drop type if exists day_of_week cascade;
drop type if exists practice_category cascade;
drop type if exists practice_section cascade;
drop type if exists dbs_level cascade;
drop type if exists self_rating cascade;
drop type if exists mood cascade;

-- ── Enums ─────────────────────────────────────────────────────────────────────
create type user_role         as enum ('teacher', 'student', 'parent_proxy');
create type link_status        as enum ('pending', 'active', 'revoked');
create type parent_link_type   as enum ('owner', 'observer');
create type day_of_week        as enum ('monday','tuesday','wednesday','thursday','friday','saturday','sunday');
create type practice_category  as enum ('technical_work','sight_reading','pieces','musicianship');
create type practice_section   as enum ('technical_work','repertoire','sight_reading','musicianship');
create type dbs_level          as enum ('basic','standard','enhanced','enhanced_barred_list');
create type self_rating        as enum ('not_my_best','i_did_well','smashed_it');
create type mood               as enum ('tired','meh','good','great');

-- ── Tables ────────────────────────────────────────────────────────────────────
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null,
  full_name     text not null default '',
  date_of_birth date,
  avatar_url    text,
  teacher_code  text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table teacher_declarations (
  id                     uuid primary key default gen_random_uuid(),
  teacher_id             uuid not null references profiles(id) on delete cascade,
  mu_number              text,
  ism_number             text,
  dbs_certificate_number text,
  dbs_level              dbs_level,
  institution_name       text,
  declaration_confirmed  boolean not null default false,
  signed_at              timestamptz not null default now(),
  constraint one_professional_id check (
    mu_number is not null or ism_number is not null or dbs_certificate_number is not null
  ),
  unique (teacher_id)
);

create table student_teacher_links (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references profiles(id) on delete cascade,
  teacher_id   uuid not null references profiles(id) on delete cascade,
  status       link_status not null default 'pending',
  requested_at timestamptz not null default now(),
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  unique (student_id, teacher_id)
);

create table parent_student_links (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  link_type  parent_link_type not null,
  status     link_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create table lesson_weeks (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references profiles(id) on delete cascade,
  teacher_id     uuid not null references profiles(id) on delete cascade,
  week_start     date not null,
  week_number    int not null default 1,
  technical_work text,
  repertoire     text,
  sight_reading  text,
  musicianship   text,
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (student_id, week_start)
);

create table weekly_goals (
  id             uuid primary key default gen_random_uuid(),
  lesson_week_id uuid references lesson_weeks(id) on delete cascade,
  student_id     uuid not null references profiles(id) on delete cascade,
  goal_text      text not null,
  created_at     timestamptz not null default now()
);

create table practice_plans (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references profiles(id) on delete cascade,
  lesson_week_id uuid not null references lesson_weeks(id) on delete cascade,
  day            day_of_week not null,
  category       practice_category not null,
  content        text not null,
  completed      boolean not null default false,
  completed_at   timestamptz,
  unique (lesson_week_id, day, category)
);

create table practice_notes (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references profiles(id) on delete cascade,
  lesson_week_id uuid not null references lesson_weeks(id) on delete cascade,
  section        practice_section not null,
  note_text      text not null default '',
  updated_at     timestamptz not null default now(),
  unique (lesson_week_id, section)
);

create table practice_plan_notes (
  lesson_week_id uuid primary key references lesson_weeks(id) on delete cascade,
  student_id     uuid not null references profiles(id) on delete cascade,
  note_text      text not null default '',
  updated_at     timestamptz not null default now()
);

create table weekly_reviews (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references profiles(id) on delete cascade,
  lesson_week_id uuid not null references lesson_weeks(id) on delete cascade,
  did_well       text,
  improvements   text,
  general_notes  text,
  days_practised int not null default 0 check (days_practised between 0 and 7),
  self_rating    self_rating,
  practice_score int check (practice_score between 1 and 10),
  mood           mood,
  submitted      boolean not null default false,
  submitted_at   timestamptz,
  created_at     timestamptz not null default now(),
  unique (lesson_week_id)
);

create table goals (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  title       text not null,
  target_date date,
  image_url   text,
  achieved    boolean not null default false,
  achieved_at timestamptz,
  created_at  timestamptz not null default now()
);

create table concert_exam_dates (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  title       text not null,
  due_date    date not null,
  memorise_by date,
  pieces      text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table safeguarding_audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid,
  event_type text not null,
  subject_id uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);

-- ── Helper functions (SECURITY DEFINER to check relationships across RLS) ──────
create or replace function is_active_teacher_of(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from student_teacher_links
    where student_id = p_student and teacher_id = auth.uid() and status = 'active'
  );
$$;

create or replace function is_linked_parent_of(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from parent_student_links
    where student_id = p_student and parent_id = auth.uid() and status = 'active'
  );
$$;

create or replace function teacher_has_signed_declaration(p_teacher uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from teacher_declarations
    where teacher_id = p_teacher and declaration_confirmed = true
  );
$$;

-- ── Aggregate-only teacher view (never exposes private reflection fields) ──────
create view teacher_review_summary as
  select
    wr.lesson_week_id,
    wr.student_id,
    lw.week_number,
    lw.week_start,
    wr.days_practised,
    wr.self_rating,
    wr.practice_score
  from weekly_reviews wr
  join lesson_weeks lw on lw.id = wr.lesson_week_id
  where is_active_teacher_of(wr.student_id) or wr.student_id = auth.uid();

-- ── Triggers: audit log + updated_at ───────────────────────────────────────────
create or replace function log_link_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare rec jsonb;
begin
  rec := to_jsonb(coalesce(new, old));
  insert into safeguarding_audit_log (actor_id, event_type, subject_id, detail)
  values (
    auth.uid(),
    tg_argv[0] || '.' || lower(tg_op),
    (rec->>'student_id')::uuid,
    jsonb_build_object('status', rec->>'status', 'teacher_id', rec->>'teacher_id', 'parent_id', rec->>'parent_id')
  );
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_student_teacher_links
  after insert or update on student_teacher_links
  for each row execute function log_link_event('student_teacher_link');

create trigger trg_audit_parent_student_links
  after insert or update on parent_student_links
  for each row execute function log_link_event('parent_student_link');

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_touch_profiles     before update on profiles     for each row execute function touch_updated_at();
create trigger trg_touch_lesson_weeks before update on lesson_weeks for each row execute function touch_updated_at();

-- ── Enable RLS ─────────────────────────────────────────────────────────────────
alter table profiles               enable row level security;
alter table teacher_declarations   enable row level security;
alter table student_teacher_links  enable row level security;
alter table parent_student_links   enable row level security;
alter table lesson_weeks           enable row level security;
alter table weekly_goals           enable row level security;
alter table practice_plans         enable row level security;
alter table practice_notes         enable row level security;
alter table practice_plan_notes    enable row level security;
alter table weekly_reviews         enable row level security;
alter table goals                  enable row level security;
alter table concert_exam_dates     enable row level security;
alter table safeguarding_audit_log enable row level security;
-- No policies on safeguarding_audit_log → writable only via SECURITY DEFINER triggers.

-- ── Policies ───────────────────────────────────────────────────────────────────
create policy profiles_self_select on profiles for select
  using (
    id = auth.uid()
    or is_active_teacher_of(id)
    or is_linked_parent_of(id)
    or exists (select 1 from student_teacher_links stl where stl.teacher_id = profiles.id and stl.student_id = auth.uid())
  );
create policy profiles_self_insert on profiles for insert with check (id = auth.uid());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy decl_owner_all on teacher_declarations for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy stl_select on student_teacher_links for select
  using (student_id = auth.uid() or teacher_id = auth.uid() or is_linked_parent_of(student_id));
create policy stl_insert on student_teacher_links for insert
  with check (student_id = auth.uid() or is_linked_parent_of(student_id));
create policy stl_update on student_teacher_links for update
  using (teacher_id = auth.uid() or student_id = auth.uid() or is_linked_parent_of(student_id))
  with check (
    (teacher_id = auth.uid() and (status <> 'active' or teacher_has_signed_declaration(auth.uid())))
    or ((student_id = auth.uid() or is_linked_parent_of(student_id)) and status = 'revoked')
  );

create policy psl_select on parent_student_links for select
  using (parent_id = auth.uid() or student_id = auth.uid());
create policy psl_insert on parent_student_links for insert with check (parent_id = auth.uid());
create policy psl_update on parent_student_links for update using (parent_id = auth.uid()) with check (parent_id = auth.uid());

create policy lw_select on lesson_weeks for select
  using (student_id = auth.uid() or is_linked_parent_of(student_id) or (teacher_id = auth.uid() and is_active_teacher_of(student_id)));
create policy lw_insert on lesson_weeks for insert
  with check (
    (teacher_id = auth.uid() and is_active_teacher_of(student_id))
    or (student_id = auth.uid() and teacher_id = auth.uid())
  );
create policy lw_update on lesson_weeks for update
  using (
    (teacher_id = auth.uid() and is_active_teacher_of(student_id))
    or (student_id = auth.uid() and teacher_id = auth.uid())
  )
  with check (
    (teacher_id = auth.uid() and is_active_teacher_of(student_id))
    or (student_id = auth.uid() and teacher_id = auth.uid())
  );

create policy wg_select on weekly_goals for select
  using (student_id = auth.uid() or is_linked_parent_of(student_id));
create policy wg_write on weekly_goals for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy pp_select on practice_plans for select
  using (student_id = auth.uid() or is_linked_parent_of(student_id));
create policy pp_write on practice_plans for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- practice_notes: student-private; parent read; teachers have NO policy → blocked.
create policy pn_select on practice_notes for select
  using (student_id = auth.uid() or is_linked_parent_of(student_id));
create policy pn_write on practice_notes for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy ppn_select on practice_plan_notes for select
  using (student_id = auth.uid() or is_linked_parent_of(student_id));
create policy ppn_write on practice_plan_notes for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- weekly_reviews: student full; parent read; teachers have NO policy → only the view.
create policy wr_select on weekly_reviews for select
  using (student_id = auth.uid() or is_linked_parent_of(student_id));
create policy wr_write on weekly_reviews for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy goals_select on goals for select
  using (student_id = auth.uid() or is_linked_parent_of(student_id));
create policy goals_write on goals for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy ced_select on concert_exam_dates for select
  using (student_id = auth.uid() or is_linked_parent_of(student_id));
create policy ced_write on concert_exam_dates for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ── Grants ─────────────────────────────────────────────────────────────────────
grant select on teacher_review_summary to authenticated;
