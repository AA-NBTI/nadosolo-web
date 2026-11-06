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

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert/update profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Public read event_applications" ON public.event_applications FOR SELECT USING (true);
CREATE POLICY "Public insert/update event_applications" ON public.event_applications FOR ALL USING (true);

CREATE POLICY "Public read participant_observations" ON public.participant_observations FOR SELECT USING (true);
CREATE POLICY "Public insert/update participant_observations" ON public.participant_observations FOR ALL USING (true);

CREATE POLICY "Public read journey_audit_records" ON public.journey_audit_records FOR SELECT USING (true);
CREATE POLICY "Public insert/update journey_audit_records" ON public.journey_audit_records FOR ALL USING (true);

CREATE POLICY "Public read personal_reports" ON public.personal_reports FOR SELECT USING (true);
CREATE POLICY "Public insert/update personal_reports" ON public.personal_reports FOR ALL USING (true);

CREATE POLICY "Public read secret_votes" ON public.secret_votes FOR SELECT USING (true);
CREATE POLICY "Public insert/update secret_votes" ON public.secret_votes FOR ALL USING (true);

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
