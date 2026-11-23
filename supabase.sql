-- Jalankan sekali di Supabase: SQL Editor > New query > paste > Run.
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  client_ts  bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "baca data sendiri"   on public.user_data for select using (auth.uid() = user_id);
create policy "buat data sendiri"   on public.user_data for insert with check (auth.uid() = user_id);
create policy "ubah data sendiri"   on public.user_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "hapus data sendiri"  on public.user_data for delete using (auth.uid() = user_id);

-- Opsional: sinkron real-time antar perangkat
alter publication supabase_realtime add table public.user_data;
