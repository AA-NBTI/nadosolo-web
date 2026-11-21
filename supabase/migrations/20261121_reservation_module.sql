-- ============================================================================
-- 범용 예약 모듈 스키마 (reservation_*)
-- 서비스 중립 테이블. 업종별 정보는 attributes(jsonb)에 보관한다.
-- 서버(service role)에서만 접근한다. RLS는 켜고 정책은 두지 않는다.
-- ============================================================================

create table if not exists public.reservation_resources (
  id text primary key,
  kind text not null,
  name text not null,
  capacity integer not null check (capacity >= 1),
  active boolean not null default true,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_reservation_resources_kind on public.reservation_resources(kind);

create table if not exists public.reservation_slots (
  id text primary key,
  resource_id text not null references public.reservation_resources(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer not null check (capacity >= 1),
  open boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_reservation_slots_resource on public.reservation_slots(resource_id, starts_at);

create table if not exists public.reservation_bookings (
  id text primary key,
  slot_id text not null references public.reservation_slots(id) on delete cascade,
  resource_id text not null,
  owner_ref text not null,
  group_ref text,
  party_size integer not null check (party_size >= 1),
  status text not null check (status in
    ('REQUESTED','CONFIRMED','COMPLETED','DECLINED','EXPIRED','CANCELLED','NO_SHOW')),
  idempotency_key text,
  hold_expires_at timestamptz,
  penalty text check (penalty in ('NONE','LATE')),
  reason text,
  fallback_of text,
  fallback_booking_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reservation_bookings_slot on public.reservation_bookings(slot_id, status);
create index if not exists idx_reservation_bookings_owner on public.reservation_bookings(owner_ref);
create index if not exists idx_reservation_bookings_group on public.reservation_bookings(group_ref);
create unique index if not exists uq_reservation_bookings_idem
  on public.reservation_bookings(slot_id, idempotency_key) where idempotency_key is not null;

-- 정원 보호: 슬롯 행을 잠근 뒤 점유량(REQUESTED 홀드 유효분 + CONFIRMED)이 정원을 넘으면 거부.
-- 서버리스 다중 인스턴스에서도 초과 예약이 발생하지 않도록 DB가 최종 방어선이 된다.
create or replace function public.reservation_guard_capacity()
returns trigger
language plpgsql
as $$
declare
  slot_capacity integer;
  occupied integer;
begin
  if new.status not in ('REQUESTED','CONFIRMED') then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.status = new.status
     and old.party_size = new.party_size
     and old.slot_id = new.slot_id then
    return new;
  end if;

  select capacity into slot_capacity
    from public.reservation_slots where id = new.slot_id for update;
  if slot_capacity is null then
    raise exception 'NOT_FOUND: slot %', new.slot_id;
  end if;

  select coalesce(sum(party_size), 0) into occupied
    from public.reservation_bookings b
   where b.slot_id = new.slot_id
     and b.id <> new.id
     and (
       b.status = 'CONFIRMED'
       or (b.status = 'REQUESTED' and (b.hold_expires_at is null or b.hold_expires_at > now()))
     );

  if occupied + new.party_size > slot_capacity then
    raise exception 'SLOT_FULL: capacity % occupied % requested %',
      slot_capacity, occupied, new.party_size;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reservation_guard_capacity on public.reservation_bookings;
create trigger trg_reservation_guard_capacity
  before insert or update on public.reservation_bookings
  for each row execute function public.reservation_guard_capacity();

alter table public.reservation_resources enable row level security;
alter table public.reservation_slots enable row level security;
alter table public.reservation_bookings enable row level security;
