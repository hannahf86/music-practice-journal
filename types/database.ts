// types/database.ts — TypeScript types mirroring the Supabase/PostgreSQL schema.
// Kept in sync with supabase/migrations/0001_init.sql.

// ── Enums ─────────────────────────────────────────────────────────────────────
export type UserRole = 'teacher' | 'student' | 'parent_proxy';
export type LinkStatus = 'pending' | 'active' | 'revoked';
export type ParentLinkType = 'owner' | 'observer';
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
export type PracticeCategory =
  | 'technical_work'
  | 'sight_reading'
  | 'pieces'
  | 'musicianship';
export type PracticeSection =
  | 'technical_work'
  | 'repertoire'
  | 'sight_reading'
  | 'musicianship';
export type DbsLevel = 'basic' | 'standard' | 'enhanced' | 'enhanced_barred_list';
export type SelfRating = 'not_my_best' | 'i_did_well' | 'smashed_it';
export type Mood = 'tired' | 'meh' | 'good' | 'great';

// ── Row types ─────────────────────────────────────────────────────────────────
export type Profile = {
  id: string; // = auth.users.id
  role: UserRole;
  full_name: string;
  date_of_birth: string | null; // ISO date
  avatar_url: string | null;
  teacher_code: string | null; // teachers only — shareable link code
  created_at: string;
  updated_at: string;
}

export type TeacherDeclaration = {
  id: string;
  teacher_id: string;
  mu_number: string | null;
  ism_number: string | null;
  dbs_certificate_number: string | null;
  dbs_level: DbsLevel | null;
  institution_name: string | null;
  declaration_confirmed: boolean;
  signed_at: string;
}

export type StudentTeacherLink = {
  id: string;
  student_id: string;
  teacher_id: string;
  status: LinkStatus;
  requested_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

export type ParentStudentLink = {
  id: string;
  parent_id: string;
  student_id: string;
  link_type: ParentLinkType;
  status: LinkStatus;
  created_at: string;
}

export type LessonWeek = {
  id: string;
  student_id: string;
  teacher_id: string;
  week_start: string; // ISO date (Monday)
  week_number: number; // 1..13 within the term
  technical_work: string | null;
  repertoire: string | null;
  sight_reading: string | null;
  musicianship: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type WeeklyGoal = {
  id: string;
  lesson_week_id: string;
  student_id: string;
  goal_text: string;
  created_at: string;
}

export type PracticePlan = {
  id: string;
  student_id: string;
  lesson_week_id: string;
  day: DayOfWeek;
  category: PracticeCategory;
  content: string;
  completed: boolean;
  completed_at: string | null;
}

export type PracticeNote = {
  id: string;
  student_id: string;
  lesson_week_id: string;
  section: PracticeSection;
  note_text: string;
  updated_at: string;
}

export type PracticePlanNote = {
  lesson_week_id: string;
  student_id: string;
  note_text: string;
  updated_at: string;
}

export type WeeklyReview = {
  id: string;
  student_id: string;
  lesson_week_id: string;
  did_well: string | null; // PRIVATE — never exposed to teachers
  improvements: string | null; // PRIVATE
  general_notes: string | null; // PRIVATE
  days_practised: number; // 0..7  — aggregate, visible to teacher via view
  self_rating: SelfRating | null; // aggregate
  practice_score: number | null; // 1..10 aggregate
  mood: Mood | null;
  submitted: boolean;
  submitted_at: string | null;
  created_at: string;
}

export type Goal = {
  id: string;
  student_id: string;
  title: string;
  target_date: string | null;
  image_url: string | null;
  achieved: boolean;
  achieved_at: string | null;
  created_at: string;
}

export type ConcertExamDate = {
  id: string;
  student_id: string;
  title: string;
  due_date: string;
  memorise_by: string | null;
  pieces: string[]; // text[]
  created_at: string;
}

export type SafeguardingAuditLog = {
  id: string;
  actor_id: string | null;
  event_type: string;
  subject_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

// Teacher-facing view — aggregate fields only, never private reflections.
export type TeacherReviewSummary = {
  lesson_week_id: string;
  student_id: string;
  week_number: number;
  week_start: string;
  days_practised: number;
  self_rating: SelfRating | null;
  practice_score: number | null;
}

// ── Supabase Database shape ───────────────────────────────────────────────────
// NOTE: each table/view MUST include `Relationships: []` and the schema MUST include
// Functions/Enums/CompositeTypes — otherwise the type fails Supabase's GenericSchema
// constraint and every query silently degrades to `never`.
type Rel = [];

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile>; Relationships: Rel };
      teacher_declarations: {
        Row: TeacherDeclaration;
        Insert: Partial<TeacherDeclaration> & { teacher_id: string };
        Update: Partial<TeacherDeclaration>;
        Relationships: Rel;
      };
      student_teacher_links: {
        Row: StudentTeacherLink;
        Insert: Partial<StudentTeacherLink> & { student_id: string; teacher_id: string };
        Update: Partial<StudentTeacherLink>;
        Relationships: Rel;
      };
      parent_student_links: {
        Row: ParentStudentLink;
        Insert: Partial<ParentStudentLink> & { parent_id: string; student_id: string };
        Update: Partial<ParentStudentLink>;
        Relationships: Rel;
      };
      lesson_weeks: {
        Row: LessonWeek;
        Insert: Partial<LessonWeek> & { student_id: string; teacher_id: string; week_start: string };
        Update: Partial<LessonWeek>;
        Relationships: Rel;
      };
      weekly_goals: {
        Row: WeeklyGoal;
        Insert: Partial<WeeklyGoal> & { student_id: string; goal_text: string };
        Update: Partial<WeeklyGoal>;
        Relationships: Rel;
      };
      practice_plans: {
        Row: PracticePlan;
        Insert: Partial<PracticePlan> & {
          student_id: string;
          lesson_week_id: string;
          day: DayOfWeek;
          category: PracticeCategory;
          content: string;
        };
        Update: Partial<PracticePlan>;
        Relationships: Rel;
      };
      practice_notes: {
        Row: PracticeNote;
        Insert: Partial<PracticeNote> & {
          student_id: string;
          lesson_week_id: string;
          section: PracticeSection;
          note_text: string;
        };
        Update: Partial<PracticeNote>;
        Relationships: Rel;
      };
      practice_plan_notes: {
        Row: PracticePlanNote;
        Insert: PracticePlanNote;
        Update: Partial<PracticePlanNote>;
        Relationships: Rel;
      };
      weekly_reviews: {
        Row: WeeklyReview;
        Insert: Partial<WeeklyReview> & { student_id: string; lesson_week_id: string };
        Update: Partial<WeeklyReview>;
        Relationships: Rel;
      };
      goals: {
        Row: Goal;
        Insert: Partial<Goal> & { student_id: string; title: string };
        Update: Partial<Goal>;
        Relationships: Rel;
      };
      concert_exam_dates: {
        Row: ConcertExamDate;
        Insert: Partial<ConcertExamDate> & { student_id: string; title: string; due_date: string };
        Update: Partial<ConcertExamDate>;
        Relationships: Rel;
      };
      safeguarding_audit_log: {
        Row: SafeguardingAuditLog;
        Insert: Partial<SafeguardingAuditLog> & { event_type: string };
        Update: Partial<SafeguardingAuditLog>;
        Relationships: Rel;
      };
    };
    Views: {
      teacher_review_summary: { Row: TeacherReviewSummary; Relationships: Rel };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
