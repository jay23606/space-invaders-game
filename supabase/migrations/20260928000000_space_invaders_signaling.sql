create table if not exists public.si_rooms (
  id text primary key check (id ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);

create table if not exists public.si_signals (
  id bigint generated always as identity primary key,
  room_id text not null references public.si_rooms(id) on delete cascade,
  kind text not null check (kind in ('offer', 'answer', 'candidate')),
  sender text not null check (sender in ('host', 'guest')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists si_signals_room_created_idx
  on public.si_signals(room_id, created_at);

alter table public.si_rooms enable row level security;
alter table public.si_signals enable row level security;

drop policy if exists si_rooms_public_select on public.si_rooms;
create policy si_rooms_public_select on public.si_rooms
  for select to anon, authenticated using (expires_at > now());

drop policy if exists si_rooms_public_insert on public.si_rooms;
create policy si_rooms_public_insert on public.si_rooms
  for insert to anon, authenticated with check (expires_at > now());

drop policy if exists si_signals_public_select on public.si_signals;
create policy si_signals_public_select on public.si_signals
  for select to anon, authenticated using (
    exists (select 1 from public.si_rooms r where r.id = room_id and r.expires_at > now())
  );

drop policy if exists si_signals_public_insert on public.si_signals;
create policy si_signals_public_insert on public.si_signals
  for insert to anon, authenticated with check (
    exists (select 1 from public.si_rooms r where r.id = room_id and r.expires_at > now())
  );

-- Realtime is used by the browser to receive the remote SDP/ICE signal promptly.
alter publication supabase_realtime add table public.si_signals;

create or replace function public.si_cleanup_expired_rooms()
returns void language sql security definer set search_path = public as $$
  delete from public.si_rooms where expires_at <= now();
$$;

grant execute on function public.si_cleanup_expired_rooms() to anon, authenticated;
