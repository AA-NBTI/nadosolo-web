-- ============================================================================
-- 나도솔로 실서비스 전환용 RLS 보안 강화 스크립트 (Production Hardening)
-- ============================================================================
-- [주의] 본 스크립트는 Supabase Auth JWT(auth.uid()) 로그인 및
--        서버 전용 SUPABASE_SERVICE_ROLE_KEY 연동이 완료된 실오픈 직전에 적용하세요.
--        (커스텀 @handle 조회 방식 상태에서는 anon 쓰기 차단 시 관리자/대시보드 쓰기가 막힙니다.)

-- 1. profiles: 본인 프로필만 수정 허용 (관리/배치는 service_role)
DROP POLICY IF EXISTS "Public insert/update profiles" ON public.profiles;
CREATE POLICY "Owner update profiles" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = id);

-- 2. event_applications: 본인 신청만 생성/조회/취소 허용
DROP POLICY IF EXISTS "Public read event_applications" ON public.event_applications;
DROP POLICY IF EXISTS "Public insert/update event_applications" ON public.event_applications;
CREATE POLICY "Owner read event_applications" ON public.event_applications
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Owner write event_applications" ON public.event_applications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Owner update event_applications" ON public.event_applications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- 3. meetups: 누구나 조회 가능, 개설/수정은 service_role(서버 API)만 허용
DROP POLICY IF EXISTS "Public insert/update/delete meetups" ON public.meetups;

-- 4. notifications: 본인 알림만 조회 및 읽음 처리 허용
DROP POLICY IF EXISTS "Public read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public insert/update notifications" ON public.notifications;
CREATE POLICY "Owner read notifications" ON public.notifications
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Owner update notifications" ON public.notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- 5. user_blocks: 본인이 등록한 차단 기록만 조회/추가 허용
DROP POLICY IF EXISTS "Public read user_blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Public insert/update user_blocks" ON public.user_blocks;
CREATE POLICY "Owner read user_blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid()::text = from_user_id);
CREATE POLICY "Owner insert user_blocks" ON public.user_blocks
  FOR INSERT WITH CHECK (auth.uid()::text = from_user_id);

-- 6. personal_reports: 본인 리포트만 조회 허용 (쓰기는 서버/service_role 전용)
DROP POLICY IF EXISTS "Public insert/update personal_reports" ON public.personal_reports;
DROP POLICY IF EXISTS "Public read personal_reports" ON public.personal_reports;
CREATE POLICY "Owner read personal_reports" ON public.personal_reports
  FOR SELECT USING (auth.uid()::text = user_id);
