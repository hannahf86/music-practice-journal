// components/BarChart.tsx — practice-score bars across the term (pure CSS, no chart lib).
import { TERM_WEEKS } from '@/lib/date';

export interface BarDatum {
  week: number; // 1..13
  score: number | null; // 1..10, null = no data
}

export function BarChart({
  data,
  currentWeek,
  height = 140,
}: {
  data: BarDatum[];
  currentWeek?: number;
  height?: number;
}) {
  const byWeek = new Map(data.map((d) => [d.week, d.score]));
  const weeks = Array.from({ length: TERM_WEEKS }, (_, i) => i + 1);
  const maxScore = 10;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 3,
        height,
      }}
    >
      {weeks.map((w) => {
        const score = byWeek.get(w) ?? null;
        const isCurrent = w === currentWeek;
        const isFuture = currentWeek != null && w > currentWeek;
        const barHeight = score ? Math.max(4, (score / maxScore) * (height - 20)) : 4;
        const color = isCurrent
          ? 'var(--accent)'
          : isFuture || score == null
            ? 'var(--bg-secondary)'
            : 'var(--primary)';
        return (
          <div
            key={w}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
            }}
          >
            <div
              style={{
                width: '100%',
                height: barHeight,
                minHeight: 4,
                background: color,
                borderRadius: 'var(--r-sm)',
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: isCurrent ? 'var(--accent)' : 'var(--text-tertiary)',
                fontWeight: isCurrent ? 700 : 400,
              }}
            >
              {w}
            </span>
          </div>
        );
      })}
    </div>
  );
}
