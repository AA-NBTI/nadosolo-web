-- ============================================================================
-- 나도솔로 (NadoSolo) 통합 데이터베이스 스키마 v2.0
-- 단일 명사 관찰 평가 엔진 & 전주기 품질 점검 스키마
-- ============================================================================

-- 1. UUID 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 회원 프로필 (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  nickname TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F')) NOT NULL,
  birth_year INTEGER NOT NULL DEFAULT 1995,
  job_title TEXT,
  dietary TEXT DEFAULT 'NONE',
  interests JSONB DEFAULT '[]'::jsonb,
  self_domain_scores JSONB DEFAULT '{"APPEARANCE":80,"STYLE":85,"VOICE":80,"CONVERSATION":90,"MANNER":95}'::jsonb,
  verified_badge TEXT DEFAULT 'VERIFIED_MEMBER',
  session_count INTEGER DEFAULT 1,
  residence_city TEXT,
  residence_district TEXT,
  residence_dong TEXT,
  residence_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  preferred_purpose TEXT,
  matching_stage TEXT,
  pre_matched_pool_id TEXT,
  confirmed_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 모임 신청 (Event Applications)
CREATE TABLE IF NOT EXISTS public.event_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  status TEXT DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'CONFIRMED', 'CANCELLED')),
  applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, event_id)
);

-- 4. 단일 명사 참여자 관찰 기록 (Participant Observations)
-- 헌법: 순수 단일 명사 1요소 1기준 매핑 (질문, 경청, 표현, 센스, 배려 등)
CREATE TABLE IF NOT EXISTS public.participant_observations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  module_id TEXT NOT NULL, -- 'MOD_TRACK_3040', 'MOD_TRACK_5060' 등
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  element_id TEXT NOT NULL, -- 'EL_3040_QUESTION', 'EL_3040_LISTEN' 등
  anchor_noun TEXT NOT NULL, -- 단일 명사 (예: '질문', '경청')
  score_step SMALLINT NOT NULL CHECK (score_step BETWEEN 1 AND 5), -- 1~5점
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, from_user_id, to_user_id, element_id)
);

-- 5. 전주기 품질 점검 감사 기록 (Journey Audit Records)
-- 식당 공간(공간, 소음, 조명, 위생, 친절), 식사(맛, 온도, 구성, 음료, 비용), 진행(안내, 좌석, 카드, 이동, 정산)
CREATE TABLE IF NOT EXISTS public.journey_audit_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  module_id TEXT NOT NULL, -- 'MOD_AUDIT_PLACE', 'MOD_AUDIT_MEAL', 'MOD_AUDIT_FLOW'
  element_id TEXT NOT NULL,
  anchor_noun TEXT NOT NULL, -- 단일 명사
  score_step SMALLINT NOT NULL CHECK (score_step BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. 개인 리포트 상태 및 집계 캐시 (Personal Reports)
-- 상호주의 해금 원칙: unlocked = true 일 때만 본인 리포트 열람 가능
CREATE TABLE IF NOT EXISTS public.personal_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT false NOT NULL, -- 상호주의 해금 여부
  completed_count INTEGER DEFAULT 0 NOT NULL, -- 본인이 완료한 동석자 평가 수
  total_score100 INTEGER DEFAULT 0 NOT NULL, -- 100점 만점 표준 종합 점수
  top_strengths JSONB DEFAULT '[]'::jsonb, -- 상위 단일 명사 태그 목록
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, user_id)
);

-- 7. 투표 (Secret Votes)
CREATE TABLE IF NOT EXISTS public.secret_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('FIRST_ROMANCE', 'WARM_FRIEND')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, from_user_id)
);

-- ============================================================================
-- 8. 성능 최적화 인덱스 (Indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_participant_obs_target ON public.participant_observations (session_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_participant_obs_author ON public.participant_observations (session_id, from_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_module ON public.journey_audit_records (session_id, module_id);
CREATE INDEX IF NOT EXISTS idx_personal_reports_lookup ON public.personal_reports (session_id, user_id);

-- ============================================================================
-- 9. Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_audit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert/update profiles" ON public.profiles;
CREATE POLICY "Public insert/update profiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read event_applications" ON public.event_applications;
CREATE POLICY "Public read event_applications" ON public.event_applications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert/update event_applications" ON public.event_applications;
CREATE POLICY "Public insert/update event_applications" ON public.event_applications FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read participant_observations" ON public.participant_observations;
CREATE POLICY "Public read participant_observations" ON public.participant_observations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert/update participant_observations" ON public.participant_observations;
CREATE POLICY "Public insert/update participant_observations" ON public.participant_observations FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read journey_audit_records" ON public.journey_audit_records;
CREATE POLICY "Public read journey_audit_records" ON public.journey_audit_records FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert/update journey_audit_records" ON public.journey_audit_records;
CREATE POLICY "Public insert/update journey_audit_records" ON public.journey_audit_records FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read personal_reports" ON public.personal_reports;
CREATE POLICY "Public read personal_reports" ON public.personal_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert/update personal_reports" ON public.personal_reports;
CREATE POLICY "Public insert/update personal_reports" ON public.personal_reports FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read secret_votes" ON public.secret_votes;
CREATE POLICY "Public read secret_votes" ON public.secret_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert/update secret_votes" ON public.secret_votes;
CREATE POLICY "Public insert/update secret_votes" ON public.secret_votes FOR ALL USING (true);

-- ============================================================================
-- 11. 밋업 상품 테이블 (Meetups) - 전국구 자유 개설·수정·상태전환 SSOT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.meetups (
  meetup_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  district_id TEXT NOT NULL DEFAULT 'DIST_JEONPO',
  region_name TEXT,
  district_name TEXT,
  venue_id TEXT NOT NULL DEFAULT 'DIRECT',
  date_text TEXT NOT NULL,
  event_date TEXT,
  event_time TEXT,
  deadline_at TEXT,
  mode TEXT NOT NULL DEFAULT 'ROMANCE',
  price_krw INTEGER NOT NULL DEFAULT 30000,
  max_capacity INTEGER DEFAULT 6,
  min_confirm_count INTEGER DEFAULT 4,
  reason TEXT,
  description TEXT,
  hero_image TEXT,
  venue_name_override TEXT,
  venue_address TEXT,
  venue_map_url TEXT,
  is_venue_secret_until_confirm BOOLEAN DEFAULT true,
  expected_meal_cost TEXT,
  refund_policy TEXT,
  deadline_text TEXT,
  status TEXT DEFAULT 'RECRUITING',
  target_age_group TEXT DEFAULT '5060_GOLDEN',
  meal_note TEXT,
  required_badge_ids JSONB DEFAULT '[]'::jsonb,
  min_total_score100 INTEGER DEFAULT 0,
  active_preset_sub_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read meetups" ON public.meetups;
CREATE POLICY "Public read meetups" ON public.meetups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert/update/delete meetups" ON public.meetups;
CREATE POLICY "Public insert/update/delete meetups" ON public.meetups FOR ALL USING (true);

-- ============================================================================
-- 12. 이용자 알림 원장 & 발송 큐 (Notifications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_id TEXT,
  type TEXT NOT NULL DEFAULT 'ROOM_CONFIRMED',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'IN_APP',
  delivery_status TEXT NOT NULL DEFAULT 'SENT',
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read notifications" ON public.notifications;
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert/update notifications" ON public.notifications;
CREATE POLICY "Public insert/update notifications" ON public.notifications FOR ALL USING (true);

-- ============================================================================
-- 13. 영구 재매칭 차단 및 노쇼 신고 기록 (User Blocks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  blocked_user_id TEXT NOT NULL,
  session_id TEXT,
  reason TEXT DEFAULT 'UNCOMFORTABLE',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(from_user_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_lookup ON public.user_blocks (from_user_id, blocked_user_id);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read user_blocks" ON public.user_blocks;
CREATE POLICY "Public read user_blocks" ON public.user_blocks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert/update user_blocks" ON public.user_blocks;
CREATE POLICY "Public insert/update user_blocks" ON public.user_blocks FOR ALL USING (true);

-- ============================================================================
-- 10. 시드 데이터 (Seed Data)
-- ============================================================================
INSERT INTO public.profiles (id, handle, email, phone, nickname, gender, birth_year, job_title, dietary, interests)
VALUES 
  ('user_jisoo', '@jisoo_kim', 'jisoo@nadosolo.com', '010-2948-1029', '지수', 'F', 1995, 'UX 디자이너', 'NONE', '["WINE", "BOOK_ART", "TRAVEL"]'::jsonb),
  ('user_minwoo', '@minwoo_jung', 'minwoo@nadosolo.com', '010-9832-1144', '민우', 'M', 1992, '프로덕트 매니저', 'NONE', '["WINE", "RUNNING", "TECH_STARTUP"]'::jsonb),
  ('user_taeo', '@taeo_park', 'taeo@nadosolo.com', '010-3321-9988', '태오', 'M', 1990, '건축가', 'NO_PORK', '["BOOK_ART", "COOKING", "WINE"]'::jsonb),
  ('user_seoa', '@seoa_lee', 'seoa@nadosolo.com', '010-7788-2233', '서아', 'F', 1996, '변호사', 'NONE', '["TRAVEL", "FINANCE", "MOVIE_MUSIC"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
