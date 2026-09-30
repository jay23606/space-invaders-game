alter table public.si_rooms
  add column if not exists name text not null default 'Unnamed mission',
  add column if not exists last_seen_at timestamptz not null default now();

update public.si_rooms
set last_seen_at = coalesce(last_seen_at, created_at),
    name = case when trim(name) = '' then 'Unnamed mission' else left(trim(name), 40) end;

alter table public.si_rooms
  drop constraint if exists si_rooms_name_length;
alter table public.si_rooms
  add constraint si_rooms_name_length check (char_length(trim(name)) between 1 and 40);

create index if not exists si_rooms_active_idx
  on public.si_rooms(last_seen_at, created_at);

drop policy if exists si_rooms_public_update on public.si_rooms;
create policy si_rooms_public_update on public.si_rooms
  for update to anon, authenticated
  using (last_seen_at > now() - interval '90 seconds')
  with check (last_seen_at > now() - interval '90 seconds');

drop policy if exists si_rooms_public_delete on public.si_rooms;
create policy si_rooms_public_delete on public.si_rooms
  for delete to anon, authenticated using (true);

create or replace function public.si_cleanup_expired_rooms()
returns void language sql security definer set search_path = public as $$
  delete from public.si_rooms
  where expires_at <= now()
     or last_seen_at <= now() - interval '90 seconds';
$$;

grant execute on function public.si_cleanup_expired_rooms() to anon, authenticated;
