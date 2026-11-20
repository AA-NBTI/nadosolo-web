-- ==============================================================================
-- 엿장수(Yot) 코너 전용 스키마 마이그레이션
-- 1. yot_venues (중복 없는 단일 식당 데이터 마스터)
-- 2. yot_reports (제보 트랜잭션: 유저, 방문목적 칩, 주관식 매력, 획득한 엿 개수)
-- 3. yot_coupons (룰렛 당첨 쿠폰 원장: 3일 유효기간, 1만원~할인권)
-- ==============================================================================

-- 1. 식당 마스터 테이블
create table if not exists public.yot_venues (
  id uuid primary key default gen_random_uuid(),
  provider_place_id text unique not null, -- 카카오/네이버 고유 장소 ID
  place_name text not null,               -- 식당명
  category_name text,                     -- 업종 카테고리
  address_name text not null,             -- 전체 주소
  road_address_name text,
  region_city text not null,              -- 도시 (예: 부산, 서울)
  region_gu text not null,                -- 자치구 (예: 부산진구, 해운대구)
  region_dong text not null,              -- 법정동 (예: 전포동, 우동)
  lat double precision,                   -- 위도
  lng double precision,                   -- 경도
  report_count integer default 1,         -- 총 제보 누적 횟수
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 인덱스 생성
create index if not exists idx_yot_venues_city_gu on public.yot_venues(region_city, region_gu);
create index if not exists idx_yot_venues_report_count on public.yot_venues(report_count desc);

-- 2. 제보 트랜잭션 테이블
create table if not exists public.yot_reports (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.yot_venues(id) on delete cascade,
  user_phone text not null,               -- 리드 확보용 전화번호 (또는 회원 식별자)
  purpose_tags text[] not null,           -- 방문 목적 칩 배열
  one_line_review text,                   -- 주관식 매력 한 줄
  awarded_taffy integer default 1,        -- 지급된 엿 개수 (1~3개)
  created_at timestamptz default now()
);

create index if not exists idx_yot_reports_venue_id on public.yot_reports(venue_id);
create index if not exists idx_yot_reports_phone on public.yot_reports(user_phone);

-- 3. 룰렛 당첨 쿠폰 원장 (3일 유효기간)
create table if not exists public.yot_coupons (
  id uuid primary key default gen_random_uuid(),
  user_phone text not null,
  coupon_code text unique not null,       -- 예: YOT-72H-XXXX
  discount_amount integer not null,       -- 할인 금액 (예: 10000, 3000 등)
  is_used boolean default false,
  used_at timestamptz,
  expires_at timestamptz default (now() + interval '3 days'), -- 3일(72시간) 타임어택
  spin_history jsonb default '[]'::jsonb, -- 룰렛 회차별 결과 이력
  created_at timestamptz default now()
);

create index if not exists idx_yot_coupons_phone on public.yot_coupons(user_phone);
create index if not exists idx_yot_coupons_code on public.yot_coupons(coupon_code);
