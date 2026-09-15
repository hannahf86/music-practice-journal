# Music Practice Journal

A web app for music students, teachers, and parents. Students plan weekly practice, write
reflections, and track progress across a term; teachers write structured lesson notes each week;
parents have read-only visibility of their child's journal.

Built with a **safeguarding-first data model** enforced at the database level (Postgres RLS).

## Tech stack

- **Next.js 16** (App Router, mostly client components)
- **Supabase** — auth, Postgres, storage
- **Zustand** — auth state · **TanStack Query** — server state & caching
- **TypeScript**, **Zod** (form validation), **date-fns**
- Plain CSS design tokens in `app/globals.css`

> Originally a React Native / Expo app; ported to the web to remove the Expo Go dependency.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase values
npm run dev
```

Open http://localhost:3000 (or `npm run dev -- --port 3001` if 3000 is busy).

### Environment variables

Client env vars are prefixed `NEXT_PUBLIC_` and read at build time:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

`.env.local` is gitignored. On Vercel, set these two variables in
**Project → Settings → Environment Variables**.

### Database

Apply the schema, RLS policies, and audit triggers from the migration in the companion
React Native repo (`supabase/migrations/0001_init.sql`) — either with `supabase db push` or by
pasting it into the Supabase SQL editor.

## Deployment (Vercel)

1. Import the repo at [vercel.com/new](https://vercel.com/new) — Next.js is auto-detected.
2. Add the two `NEXT_PUBLIC_SUPABASE_*` env vars.
3. Deploy. Every push to the default branch auto-deploys.
4. In Supabase → **Authentication → URL Configuration**, set the **Site URL** and **Redirect
   URLs** to your deployed domain so sign-up and password-reset links resolve correctly.

## Safeguarding model (enforced by RLS)

- Teachers can **only** write lesson notes — no other write access to student data.
- Teachers **cannot** read `practice_notes` or the private fields on `weekly_reviews`
  (`did_well`, `improvements`, `general_notes`). They see aggregates **only** through the
  `teacher_review_summary` view (`days_practised`, `self_rating`, `practice_score`).
- Accepting a student link requires a signed professional declaration.
- All link events are written to an append-only `safeguarding_audit_log`.
- No private teacher↔student messaging exists anywhere in the schema or UI.

## Project structure

```
app/
  layout.tsx              root layout + providers
  providers.tsx           QueryClient + auth listener + route guard
  page.tsx                entry (redirects via the guard)
  (auth)/                 welcome, setup (role + age gate), teacher-declaration, forgot-password
  (app)/
    layout.tsx            authenticated shell + role-aware tab bar
    home, plan, review, progress, students
    student/              lesson-notes, practice-notes, goals, concerts
    teacher/              lesson-notes, student-progress
components/               ui kit, BarChart, Avatar, Logo, TabBar
hooks/queries.ts          TanStack Query hooks
lib/                      supabase client, query client, date + age helpers, labels
store/auth.ts             Zustand auth store
types/database.ts         types mirroring the schema
constants/theme.ts        design token values (also mirrored as CSS vars in globals.css)
```

## User roles & v1 scope

- **Teacher** — completes a professional declaration; writes lesson notes only.
- **Student (13+)** — own account; a parent can be linked as an observer.
- **Parent (`parent_proxy`)** — for under-13s the parent holds the child's journal directly
  (no separate child login).
- DBS/union verification is self-declaration only in v1.
- Goal image upload has a DB column but no uploader wired yet (follow-up).
