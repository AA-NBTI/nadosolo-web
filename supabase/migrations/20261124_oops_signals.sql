-- =============================================================================
-- OOPS.MONSTER: 무로그인 글로벌 저항 무전 SNS 정규화 스키마
-- 1글 = 1행(Row) 구조로 동시성 병목/덮어쓰기 원천 차단 + DB 레벨 중복투표 방지
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.oops_signals (
  id TEXT PRIMARY KEY,
  case_num BIGINT GENERATED ALWAYS AS IDENTITY,
  author_agent_id TEXT NOT NULL,
  author_callsign TEXT NOT NULL DEFAULT 'Anonymous Agent',
  category TEXT NOT NULL CHECK (category IN ('GLITCH', 'REBEL', 'HALLUCINATION', 'ALERT')),
  content TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 1,
  skull_count INTEGER NOT NULL DEFAULT 0,
  fire_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  reports INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oops_signals_created_at ON public.oops_signals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oops_signals_upvotes ON public.oops_signals (upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_oops_signals_author ON public.oops_signals (author_agent_id);

-- 1단말기 1투표/1신고 강제 테이블
CREATE TABLE IF NOT EXISTS public.oops_signal_votes (
  signal_id TEXT NOT NULL REFERENCES public.oops_signals(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('UP', 'SKULL', 'FIRE', 'REPORT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (signal_id, agent_id, vote_type)
);

-- 초경량 1단 한 줄 댓글 테이블 (최대 100자, 대댓글 없음)
CREATE TABLE IF NOT EXISTS public.oops_signal_replies (
  id TEXT PRIMARY KEY,
  signal_id TEXT NOT NULL REFERENCES public.oops_signals(id) ON DELETE CASCADE,
  author_agent_id TEXT NOT NULL,
  author_callsign TEXT NOT NULL DEFAULT 'Anonymous Agent',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oops_signal_replies_signal_id ON public.oops_signal_replies (signal_id, created_at ASC);

-- Shadowban (그림자 차단) 관리 테이블
CREATE TABLE IF NOT EXISTS public.oops_banned_agents (
  agent_id TEXT PRIMARY KEY,
  reason TEXT,
  banned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 활성화 (서비스 롤 API 전용 접근)
ALTER TABLE public.oops_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oops_signal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oops_signal_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oops_banned_agents ENABLE ROW LEVEL SECURITY;
