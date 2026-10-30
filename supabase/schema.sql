-- Run once in the storyBooks Supabase SQL editor. No service_role key is
-- needed by the browser; ownership is enforced by Postgres for every request.
create table if not exists public.reading_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint reading_state_object check (jsonb_typeof(data) = 'object'),
  constraint reading_state_size check (octet_length(data::text) <= 1048576)
);

alter table public.reading_state enable row level security;
revoke all on public.reading_state from anon;
grant select, insert, update, delete on public.reading_state to authenticated;

drop policy if exists "Parents read own reading state" on public.reading_state;
create policy "Parents read own reading state" on public.reading_state
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Parents create own reading state" on public.reading_state;
create policy "Parents create own reading state" on public.reading_state
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Parents update own reading state" on public.reading_state;
create policy "Parents update own reading state" on public.reading_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Parents delete own reading state" on public.reading_state;
create policy "Parents delete own reading state" on public.reading_state
  for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.reading_state is
  'Private parent-owned reading snapshots: children, progress, pins, and quizzes.';
