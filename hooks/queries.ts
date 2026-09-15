// hooks/queries.ts — TanStack Query hooks wrapping Supabase reads/writes.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { weekStartISO } from '@/lib/date';
import type {
  LessonWeek,
  PracticePlan,
  PracticeNote,
  WeeklyReview,
  WeeklyGoal,
  Goal,
  ConcertExamDate,
  Profile,
  TeacherReviewSummary,
  StudentTeacherLink,
  PracticeSection,
} from '@/types/database';

// ── Lesson weeks ──────────────────────────────────────────────────────────────
export function useCurrentLessonWeek(studentId?: string) {
  const week = weekStartISO();
  return useQuery({
    queryKey: ['lessonWeek', studentId, week],
    enabled: !!studentId,
    queryFn: async (): Promise<LessonWeek | null> => {
      const { data, error } = await supabase
        .from('lesson_weeks')
        .select('*')
        .eq('student_id', studentId!)
        .eq('week_start', week)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useLessonWeeks(studentId?: string) {
  return useQuery({
    queryKey: ['lessonWeeks', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<LessonWeek[]> => {
      const { data, error } = await supabase
        .from('lesson_weeks')
        .select('*')
        .eq('student_id', studentId!)
        .order('week_start', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Ensure a lesson week exists for the current week. If a teacher already created
// one it is reused; otherwise the student self-authors an empty week so Plan/Review
// have something to attach to. Returns the week id.
export function useEnsureCurrentWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string): Promise<LessonWeek> => {
      const week = weekStartISO();
      const { data: existing, error: readErr } = await supabase
        .from('lesson_weeks')
        .select('*')
        .eq('student_id', studentId)
        .eq('week_start', week)
        .maybeSingle();
      if (readErr) throw readErr;
      if (existing) return existing;

      const { data, error } = await supabase
        .from('lesson_weeks')
        .insert({ student_id: studentId, teacher_id: studentId, week_start: week })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, studentId) => {
      qc.invalidateQueries({ queryKey: ['lessonWeek', studentId] });
      qc.invalidateQueries({ queryKey: ['lessonWeeks', studentId] });
    },
  });
}

// ── Practice plans ────────────────────────────────────────────────────────────
export function usePracticePlans(lessonWeekId?: string) {
  return useQuery({
    queryKey: ['practicePlans', lessonWeekId],
    enabled: !!lessonWeekId,
    queryFn: async (): Promise<PracticePlan[]> => {
      const { data, error } = await supabase
        .from('practice_plans')
        .select('*')
        .eq('lesson_week_id', lessonWeekId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertPracticePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: {
      student_id: string;
      lesson_week_id: string;
      day: PracticePlan['day'];
      category: PracticePlan['category'];
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('practice_plans')
        .upsert(row, { onConflict: 'lesson_week_id,day,category' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['practicePlans', vars.lesson_week_id] }),
  });
}

export function useTogglePlanComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('practice_plans')
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practicePlans'] }),
  });
}

// ── Practice notes (private) ──────────────────────────────────────────────────
export function usePracticeNotes(lessonWeekId?: string) {
  return useQuery({
    queryKey: ['practiceNotes', lessonWeekId],
    enabled: !!lessonWeekId,
    queryFn: async (): Promise<PracticeNote[]> => {
      const { data, error } = await supabase
        .from('practice_notes')
        .select('*')
        .eq('lesson_week_id', lessonWeekId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSavePracticeNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: {
      student_id: string;
      lesson_week_id: string;
      section: PracticeSection;
      note_text: string;
    }) => {
      const { data, error } = await supabase
        .from('practice_notes')
        .upsert(
          { ...row, updated_at: new Date().toISOString() },
          { onConflict: 'lesson_week_id,section' },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['practiceNotes', vars.lesson_week_id] }),
  });
}

// ── Practice plan free-text note ──────────────────────────────────────────────
export function usePlanNote(lessonWeekId?: string) {
  return useQuery({
    queryKey: ['planNote', lessonWeekId],
    enabled: !!lessonWeekId,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase
        .from('practice_plan_notes')
        .select('note_text')
        .eq('lesson_week_id', lessonWeekId!)
        .maybeSingle();
      if (error) throw error;
      return data?.note_text ?? '';
    },
  });
}

export function useSavePlanNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { student_id: string; lesson_week_id: string; note_text: string }) => {
      const { error } = await supabase
        .from('practice_plan_notes')
        .upsert(
          { ...row, updated_at: new Date().toISOString() },
          { onConflict: 'lesson_week_id' },
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['planNote', vars.lesson_week_id] }),
  });
}

// ── Weekly review ─────────────────────────────────────────────────────────────
export function useWeeklyReview(lessonWeekId?: string) {
  return useQuery({
    queryKey: ['weeklyReview', lessonWeekId],
    enabled: !!lessonWeekId,
    queryFn: async (): Promise<WeeklyReview | null> => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('lesson_week_id', lessonWeekId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<WeeklyReview> & { student_id: string; lesson_week_id: string }) => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .upsert(row, { onConflict: 'lesson_week_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['weeklyReview', vars.lesson_week_id] });
      qc.invalidateQueries({ queryKey: ['reviewsForStudent', vars.student_id] });
    },
  });
}

// All reviews for a student (progress chart / notes) — student's own data.
export function useStudentReviews(studentId?: string) {
  return useQuery({
    queryKey: ['reviewsForStudent', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<(WeeklyReview & { week_number: number })[]> => {
      const { data: reviews, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('student_id', studentId!);
      if (error) throw error;
      const weekIds = (reviews ?? []).map((r) => r.lesson_week_id);
      if (weekIds.length === 0) return [];
      // Fetch the matching weeks separately and join in JS (keeps typing simple).
      const { data: weeks, error: wErr } = await supabase
        .from('lesson_weeks')
        .select('id, week_number')
        .in('id', weekIds);
      if (wErr) throw wErr;
      const weekNumById = new Map((weeks ?? []).map((w) => [w.id, w.week_number]));
      return (reviews ?? []).map((r) => ({ ...r, week_number: weekNumById.get(r.lesson_week_id) ?? 1 }));
    },
  });
}

// ── Weekly goal ───────────────────────────────────────────────────────────────
export function useWeeklyGoal(lessonWeekId?: string) {
  return useQuery({
    queryKey: ['weeklyGoal', lessonWeekId],
    enabled: !!lessonWeekId,
    queryFn: async (): Promise<WeeklyGoal | null> => {
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('lesson_week_id', lessonWeekId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// ── Long-term goals ───────────────────────────────────────────────────────────
export function useGoals(studentId?: string) {
  return useQuery({
    queryKey: ['goals', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('student_id', studentId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { student_id: string; title: string; target_date?: string | null }) => {
      const { data, error } = await supabase.from('goals').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['goals', vars.student_id] }),
  });
}

export function useToggleGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, achieved }: { id: string; achieved: boolean }) => {
      const { data, error } = await supabase
        .from('goals')
        .update({ achieved, achieved_at: achieved ? new Date().toISOString() : null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

// ── Concert / exam dates ──────────────────────────────────────────────────────
export function useConcerts(studentId?: string) {
  return useQuery({
    queryKey: ['concerts', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<ConcertExamDate[]> => {
      const { data, error } = await supabase
        .from('concert_exam_dates')
        .select('*')
        .eq('student_id', studentId!)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddConcert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: {
      student_id: string;
      title: string;
      due_date: string;
      memorise_by?: string | null;
      pieces?: string[];
    }) => {
      const { data, error } = await supabase.from('concert_exam_dates').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['concerts', vars.student_id] }),
  });
}

// ── Teacher: student list via aggregate view + links + profiles ────────────────
export interface TeacherStudentRow {
  link: StudentTeacherLink;
  profile: Profile | null;
  summary: TeacherReviewSummary | null;
}

export function useTeacherStudents(teacherId?: string) {
  return useQuery({
    queryKey: ['teacherStudents', teacherId],
    enabled: !!teacherId,
    queryFn: async (): Promise<TeacherStudentRow[]> => {
      const { data: links, error: linkErr } = await supabase
        .from('student_teacher_links')
        .select('*')
        .eq('teacher_id', teacherId!)
        .in('status', ['active', 'pending']);
      if (linkErr) throw linkErr;
      const studentIds = (links ?? []).map((l) => l.student_id);
      if (studentIds.length === 0) return [];

      const [{ data: profiles }, { data: summaries }] = await Promise.all([
        supabase.from('profiles').select('*').in('id', studentIds),
        supabase.from('teacher_review_summary').select('*').in('student_id', studentIds),
      ]);

      const week = weekStartISO();
      return (links ?? []).map((link) => ({
        link,
        profile: profiles?.find((p) => p.id === link.student_id) ?? null,
        summary:
          summaries?.find((s) => s.student_id === link.student_id && s.week_start === week) ??
          summaries?.find((s) => s.student_id === link.student_id) ??
          null,
      }));
    },
  });
}

// Aggregate summary rows for one student (teacher-facing, via the safe view).
export function useStudentSummary(studentId?: string) {
  return useQuery({
    queryKey: ['studentSummary', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<TeacherReviewSummary[]> => {
      const { data, error } = await supabase
        .from('teacher_review_summary')
        .select('*')
        .eq('student_id', studentId!)
        .order('week_number', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAcceptLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { data, error } = await supabase
        .from('student_teacher_links')
        .update({ status: 'active', accepted_at: new Date().toISOString() })
        .eq('id', linkId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacherStudents'] }),
  });
}

// ── Teacher: write / publish lesson notes ─────────────────────────────────────
export function useSaveLessonNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<LessonWeek> & {
      student_id: string;
      teacher_id: string;
      week_start: string;
    }) => {
      const { data, error } = await supabase
        .from('lesson_weeks')
        .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'student_id,week_start' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['lessonWeeks', vars.student_id] });
      qc.invalidateQueries({ queryKey: ['lessonWeek', vars.student_id] });
    },
  });
}
