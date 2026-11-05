-- ============================================================================
-- 나도솔로 (NadoSolo) 통합 데이터베이스 스키마 v1.0
-- Supabase SQL Editor에서 전체 실행(Run)하시면 필요한 모든 테이블과 RLS가 생성됩니다.
-- ============================================================================

-- 1. UUID 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 회원 프로필 테이블 (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- 사용자 ID (예: 'user_jisoo' 또는 auth.uid())
  handle TEXT UNIQUE NOT NULL, -- 고유 @핸들 (예: '@jisoo_kim')
  email TEXT,
  phone TEXT,
  nickname TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F')) NOT NULL,
  birth_year INTEGER NOT NULL DEFAULT 1995,
  job_title TEXT,
  dietary TEXT DEFAULT 'NONE', -- 'NONE', 'VEGAN', 'HALAL', 'NO_PORK', 'ALCOHOL_FREE'
  interests JSONB DEFAULT '[]'::jsonb, -- ['WINE', 'COOKING', 'TRAVEL']
  self_domain_scores JSONB DEFAULT '{"APPEARANCE":80,"STYLE":85,"VOICE":80,"CONVERSATION":90,"MANNER":95}'::jsonb,
  verified_badge TEXT DEFAULT 'VERIFIED_MEMBER',
  session_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 모임 신청 내역 테이블 (Event Applications)
CREATE TABLE IF NOT EXISTS public.event_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL, -- 예: 'EVT_JEONPO_FRI'
  status TEXT DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'CONFIRMED', 'CANCELLED')),
  applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, event_id)
);

-- 4. 5×5×5 다면 평가 기록 테이블 (Matrix Evaluations)
CREATE TABLE IF NOT EXISTS public.matrix_evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL, -- 예: 'SESSION_2026_11_JEONPO'
  from_user_id TEXT NOT NULL,
  from_nickname TEXT NOT NULL,
  from_gender TEXT CHECK (from_gender IN ('M', 'F')) NOT NULL,
  to_user_id TEXT NOT NULL,
  sub_element_id TEXT NOT NULL, -- 예: 'SUB_APP_1', 'SUB_STY_2'
  scores JSONB NOT NULL, -- {"C1_NEAT": 4, "C2_HARMONY": 4, "C3_SENSE": 5, "C4_STABILITY": 4, "C5_APPEAL": 5}
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, from_user_id, to_user_id, sub_element_id)
);

-- 5. 시크릿 호감 투표 테이블 (Secret Votes)
CREATE TABLE IF NOT EXISTS public.secret_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('FIRST_ROMANCE', 'WARM_FRIEND')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, from_user_id)
);

-- 6. 익명 피어 미러 피드백 테이블 (Peer Feedbacks)
CREATE TABLE IF NOT EXISTS public.peer_feedbacks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  selected_charm_tag TEXT NOT NULL,
  selected_growth_tip_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 7. Row Level Security (RLS) 및 접근 정책 설정
-- 데모 및 원활한 프로토타이핑을 위해 anon/authenticated 모두 읽기/쓰기 허용 정책 부여
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matrix_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_feedbacks ENABLE ROW LEVEL SECURITY;

-- Profiles 정책
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert/update profiles" ON public.profiles FOR ALL USING (true);

-- Event Applications 정책
CREATE POLICY "Public read event_applications" ON public.event_applications FOR SELECT USING (true);
CREATE POLICY "Public insert/update event_applications" ON public.event_applications FOR ALL USING (true);

-- Matrix Evaluations 정책
CREATE POLICY "Public read matrix_evaluations" ON public.matrix_evaluations FOR SELECT USING (true);
CREATE POLICY "Public insert/update matrix_evaluations" ON public.matrix_evaluations FOR ALL USING (true);

-- Secret Votes 정책
CREATE POLICY "Public read secret_votes" ON public.secret_votes FOR SELECT USING (true);
CREATE POLICY "Public insert/update secret_votes" ON public.secret_votes FOR ALL USING (true);

-- Peer Feedbacks 정책
CREATE POLICY "Public read peer_feedbacks" ON public.peer_feedbacks FOR SELECT USING (true);
CREATE POLICY "Public insert/update peer_feedbacks" ON public.peer_feedbacks FOR ALL USING (true);

-- ============================================================================
-- 8. 초기 시드 데이터 (Seed Data)
-- ============================================================================

INSERT INTO public.profiles (id, handle, email, phone, nickname, gender, birth_year, job_title, dietary, interests)
VALUES 
  ('user_jisoo', '@jisoo_kim', 'jisoo@nadosolo.com', '010-2948-1029', '지수', 'F', 1995, 'UX 디자이너', 'NONE', '["WINE", "BOOK_ART", "TRAVEL"]'::jsonb),
  ('user_minwoo', '@minwoo_jung', 'minwoo@nadosolo.com', '010-9832-1144', '민우', 'M', 1992, '프로덕트 매니저', 'NONE', '["WINE", "RUNNING", "TECH_STARTUP"]'::jsonb),
  ('user_taeo', '@taeo_park', 'taeo@nadosolo.com', '010-3321-9988', '태오', 'M', 1990, '건축가', 'NO_PORK', '["BOOK_ART", "COOKING", "WINE"]'::jsonb),
  ('user_seoa', '@seoa_lee', 'seoa@nadosolo.com', '010-7788-2233', '서아', 'F', 1996, '변호사', 'NONE', '["TRAVEL", "FINANCE", "MOVIE_MUSIC"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

