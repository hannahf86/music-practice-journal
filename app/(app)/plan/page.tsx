'use client';
// app/(app)/plan/page.tsx — weekly 7×4 practice-plan grid with a cell editor sheet.
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Card, Button, Textarea, Sheet } from '@/components/ui';
import { DAYS, DAY_LABELS, todayDayOfWeek, weekRangeLabel, weekStartISO } from '@/lib/date';
import {
  useCurrentLessonWeek,
  useEnsureCurrentWeek,
  usePracticePlans,
  useUpsertPracticePlan,
  useTogglePlanComplete,
  usePlanNote,
  useSavePlanNote,
} from '@/hooks/queries';
import type { DayOfWeek, PracticeCategory, PracticePlan } from '@/types/database';

const CATEGORIES: { key: PracticeCategory; label: string }[] = [
  { key: 'technical_work', label: 'Tech' },
  { key: 'sight_reading', label: 'Sight' },
  { key: 'pieces', label: 'Pieces' },
  { key: 'musicianship', label: 'Music' },
];

export default function Plan() {
  const profile = useAuthStore((s) => s.profile);
  const studentId = profile?.id;
  const today = todayDayOfWeek();

  const { data: lessonWeek } = useCurrentLessonWeek(studentId);
  const ensureWeek = useEnsureCurrentWeek();
  const { data: plans = [] } = usePracticePlans(lessonWeek?.id);
  const upsertCell = useUpsertPracticePlan();
  const toggleComplete = useTogglePlanComplete();
  const { data: planNote = '' } = usePlanNote(lessonWeek?.id);
  const savePlanNote = useSavePlanNote();
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    if (studentId && !lessonWeek) ensureWeek.mutate(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, lessonWeek]);
  useEffect(() => setNoteDraft(planNote), [planNote]);

  const [editing, setEditing] = useState<{ day: DayOfWeek; category: PracticeCategory } | null>(null);
  const [draft, setDraft] = useState('');

  const cellFor = (day: DayOfWeek, category: PracticeCategory): PracticePlan | undefined =>
    plans.find((p) => p.day === day && p.category === category);

  function openCell(day: DayOfWeek, category: PracticeCategory) {
    setEditing({ day, category });
    setDraft(cellFor(day, category)?.content ?? '');
  }
  function saveCell() {
    if (!editing || !lessonWeek || !studentId) return;
    const text = draft.trim();
    if (text) upsertCell.mutate({ student_id: studentId, lesson_week_id: lessonWeek.id, day: editing.day, category: editing.category, content: text });
    setEditing(null);
  }

  const editingCell = editing ? cellFor(editing.day, editing.category) : undefined;

  return (
    <main className="screen">
      <div className="col gap-1">
        <h1 className="title">Practice plan</h1>
        <p className="caption">{weekRangeLabel(lessonWeek?.week_start ?? weekStartISO())}</p>
      </div>

      <Card>
        {/* header row */}
        <div style={{ display: 'flex', gap: 3 }}>
          <div style={{ width: 40 }} />
          {CATEGORIES.map((c) => (
            <div key={c.key} className="caption" style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>
              {c.label}
            </div>
          ))}
        </div>
        {/* day rows */}
        {DAYS.map((day) => {
          const isToday = day === today;
          return (
            <div key={day} style={{ display: 'flex', gap: 3, alignItems: 'stretch', background: isToday ? 'var(--primary-light)' : 'transparent', borderRadius: 'var(--r-sm)', padding: '2px 0' }}>
              <div className="caption" style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--text-secondary)' }}>
                {DAY_LABELS[day]}
              </div>
              {CATEGORIES.map((c) => {
                const cell = cellFor(day, c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => openCell(day, c.key)}
                    style={{
                      flex: 1,
                      minHeight: 52,
                      borderRadius: 'var(--r-sm)',
                      border: `1px solid ${cell ? (cell.completed ? 'var(--success)' : 'var(--border)') : 'transparent'}`,
                      background: cell ? (cell.completed ? 'var(--success-light)' : 'var(--bg-tertiary)') : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: 11,
                      color: cell?.completed ? 'var(--success)' : 'var(--text-primary)',
                      textDecoration: cell?.completed ? 'line-through' : 'none',
                      overflow: 'hidden',
                    }}
                  >
                    {cell ? `${cell.completed ? '✓ ' : ''}${cell.content}` : '+'}
                  </button>
                );
              })}
            </div>
          );
        })}
      </Card>

      <Card>
        <h3 className="heading">Notes</h3>
        <p className="caption">e.g. &quot;Saturday — family event, less practice than normal.&quot;</p>
        <textarea
          className="textarea"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            if (studentId && lessonWeek && noteDraft !== planNote) savePlanNote.mutate({ student_id: studentId, lesson_week_id: lessonWeek.id, note_text: noteDraft });
          }}
          placeholder="Anything that affected your practice this week…"
        />
      </Card>

      <p className="caption muted" style={{ textAlign: 'center' }}>
        Build your plan from your lesson notes — a little each day beats a lot in one go.
      </p>

      <Sheet open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <>
            <h3 className="heading">
              {DAY_LABELS[editing.day]} · {CATEGORIES.find((c) => c.key === editing.category)?.label}
            </h3>
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus placeholder="What will you practise?" />
            <div className="row gap-3">
              <Button title="Save" onClick={saveCell} block />
              {editingCell && (
                <Button
                  title={editingCell.completed ? 'Mark undone' : 'Mark done'}
                  variant="secondary"
                  block
                  onClick={() => {
                    toggleComplete.mutate({ id: editingCell.id, completed: !editingCell.completed });
                    setEditing(null);
                  }}
                />
              )}
            </div>
            <Button title="Cancel" variant="ghost" onClick={() => setEditing(null)} block />
          </>
        )}
      </Sheet>
    </main>
  );
}
