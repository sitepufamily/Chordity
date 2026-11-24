-- Chordity: tabel sinkron. AMAN dijalankan berulang kali (idempotent).
-- Supabase > SQL Editor > New query > tempel semua > Run.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.user_data add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.user_data add column if not exists client_ts bigint not null default 0;
alter table public.user_data add column if not exists updated_at timestamptz not null default now();

alter table public.user_data enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.user_data to authenticated;

drop policy if exists "user_data_select" on public.user_data;
drop policy if exists "user_data_insert" on public.user_data;
drop policy if exists "user_data_update" on public.user_data;
drop policy if exists "user_data_delete" on public.user_data;
drop policy if exists "own select" on public.user_data;
drop policy if exists "own insert" on public.user_data;
drop policy if exists "own update" on public.user_data;
drop policy if exists "own delete" on public.user_data;

create policy "user_data_select" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_data_insert" on public.user_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_data_update" on public.user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_data_delete" on public.user_data for delete to authenticated using ((select auth.uid()) = user_id);

-- Real-time (opsional; aplikasi tetap sinkron lewat pengecekan tiap 20 detik jika ini gagal)
do $$ begin
  alter publication supabase_realtime add table public.user_data;
exception when others then null;
end $$;

notify pgrst, 'reload schema';
