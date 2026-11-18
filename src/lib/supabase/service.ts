import { createClient } from './client';
import { nadosoloBillingEngine } from '@/modules/billing';
import {
  ConditionalEventItem,
  CriterionCode,
  EventProductStatus,
  Gender,
  MatrixEvaluationRecord,
  SecretVote,
} from '@/engine';

export interface DbProfile {
  id: string;
  handle: string;
  email?: string;
  phone?: string;
  nickname: string;
  gender: 'M' | 'F';
  birth_year: number;
  job_title?: string;
  dietary?: string;
  interests?: string[];
  self_domain_scores?: Record<string, number>;
  survey_answers?: Record<string, string>;
  verified_badge?: string;
  session_count?: number;
  residence_city?: string;
  residence_district?: string;
  residence_dong?: string;
  residence_address?: string;
  latitude?: number;
  longitude?: number;
  preferred_purpose?: 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE';
  matching_stage?: 'UNQUALIFIED' | 'READY' | 'APPLIED' | 'PRE_MATCHED' | 'CONFIRMED';
  pre_matched_pool_id?: string;
  confirmed_event_id?: string;
  created_at?: string;
  updated_at?: string;
}

function normalizeDbProfile(raw: any): DbProfile {
  const scores = (raw.self_domain_scores || {}) as Record<string, any>;
  return {
    ...raw,
    residence_city: raw.residence_city || scores._residence_city,
    residence_district: raw.residence_district || scores._residence_district,
    residence_dong: raw.residence_dong || scores._residence_dong,
    residence_address: raw.residence_address || scores._residence_address,
    latitude: typeof raw.latitude === 'number' ? raw.latitude : scores._latitude,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : scores._longitude,
    preferred_purpose: raw.preferred_purpose || scores._preferred_purpose,
    survey_answers: raw.survey_answers || scores._survey_answers,
    matching_stage: raw.matching_stage || scores._matching_stage,
    pre_matched_pool_id: raw.pre_matched_pool_id || scores._pre_matched_pool_id,
    confirmed_event_id: raw.confirmed_event_id || scores._confirmed_event_id,
  };
}

export const nadoSoloSupabaseService = {
  /**
   * 사용자 프로필 조회
   */
  async getProfile(userId: string): Promise<DbProfile | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('[Supabase] getProfile warning (using fallback):', error.message);
        return null;
      }
      return normalizeDbProfile(data);
    } catch (e) {
      console.warn('[Supabase] getProfile failed:', e);
      return null;
    }
  },

  /**
   * 아이디 또는 핸들(@)로 사용자 프로필 조회 (SSOT)
   */
  async getProfileByIdOrHandle(identifier: string): Promise<DbProfile | null> {
    try {
      const supabase = createClient();
      const clean = identifier.trim();
      if (!clean) return null;

      const normHandle = clean.startsWith('@') ? clean.toLowerCase() : `@${clean.toLowerCase()}`;
      const rawId = clean.replace(/^@/, '');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${rawId},id.eq.U_${rawId},id.ilike.${rawId},handle.ilike.${normHandle}`)
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }
      return normalizeDbProfile(data[0]);
    } catch (e) {
      console.warn('[Supabase] getProfileByIdOrHandle failed:', e);
      return null;
    }
  },

  /**
   * 전체 등록 회원 프로필 목록 조회 (SSOT)
   */
  async getAllProfiles(): Promise<DbProfile[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[Supabase] getAllProfiles warning:', error.message);
        return [];
      }
      return (data || []).map(normalizeDbProfile);
    } catch (e) {
      console.warn('[Supabase] getAllProfiles failed:', e);
      return [];
    }
  },

  /**
   * 사용자 프로필 업데이트 (Upsert)
   */
  async upsertProfile(profile: DbProfile): Promise<boolean> {
    try {
      const supabase = createClient();
      const domainScoresWithRegion = {
        ...(profile.self_domain_scores || {}),
        ...(profile.residence_city ? { _residence_city: profile.residence_city } : {}),
        ...(profile.residence_district ? { _residence_district: profile.residence_district } : {}),
        ...(profile.residence_dong ? { _residence_dong: profile.residence_dong } : {}),
        ...(profile.residence_address ? { _residence_address: profile.residence_address } : {}),
        ...(typeof profile.latitude === 'number' ? { _latitude: profile.latitude } : {}),
        ...(typeof profile.longitude === 'number' ? { _longitude: profile.longitude } : {}),
        ...(profile.preferred_purpose ? { _preferred_purpose: profile.preferred_purpose } : {}),
        ...(profile.survey_answers ? { _survey_answers: profile.survey_answers } : {}),
        ...(profile.matching_stage ? { _matching_stage: profile.matching_stage } : {}),
        ...(profile.pre_matched_pool_id ? { _pre_matched_pool_id: profile.pre_matched_pool_id } : {}),
        ...(profile.confirmed_event_id ? { _confirmed_event_id: profile.confirmed_event_id } : {}),
      };

      const rowPayload: Record<string, any> = {
        id: profile.id,
        handle: profile.handle,
        email: profile.email,
        phone: profile.phone,
        nickname: profile.nickname,
        gender: profile.gender,
        birth_year: profile.birth_year,
        job_title: profile.job_title,
        dietary: profile.dietary,
        interests: profile.interests,
        self_domain_scores: domainScoresWithRegion,
        verified_badge: profile.verified_badge,
        session_count: profile.session_count,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(rowPayload, { onConflict: 'id' });

      if (error) {
        console.warn('[Supabase] upsertProfile warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] upsertProfile error:', e);
      return false;
    }
  },

  /**
   * 전체 모임 신청 내역 조회 (관리자 대시보드 SSOT)
   */
  async getAllEventApplications(): Promise<
    Array<{ user_id: string; event_id: string; status: string; applied_at: string }>
  > {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('event_applications')
        .select('user_id, event_id, status, applied_at')
        .order('applied_at', { ascending: false });

      if (error || !data) return [];
      return data as Array<{ user_id: string; event_id: string; status: string; applied_at: string }>;
    } catch (e) {
      console.warn('[Supabase] getAllEventApplications error:', e);
      return [];
    }
  },

  /**
   * 회원 매칭 단계 DB 영속화 (가매칭 / 확정 / 대기)
   */
  async updateMemberMatchingStage(
    userId: string,
    stage: 'READY' | 'PRE_MATCHED' | 'CONFIRMED',
    poolOrEventId?: string
  ): Promise<boolean> {
    try {
      const existing = await this.getProfile(userId);
      if (!existing) return false;
      return await this.upsertProfile({
        ...existing,
        matching_stage: stage,
        pre_matched_pool_id: stage === 'PRE_MATCHED' ? poolOrEventId : existing.pre_matched_pool_id,
        confirmed_event_id: stage === 'CONFIRMED' ? poolOrEventId : existing.confirmed_event_id,
      });
    } catch (e) {
      console.warn('[Supabase] updateMemberMatchingStage error:', e);
      return false;
    }
  },

  /**
   * 모임 신청 내역 조회
   */
  async getAppliedEventIds(userId: string): Promise<string[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('event_applications')
        .select('event_id')
        .eq('user_id', userId)
        .eq('status', 'APPLIED');

      if (error || !data) return [];
      return (data as Array<{ event_id: string }>).map((row) => row.event_id);
    } catch (e) {
      console.warn('[Supabase] getAppliedEventIds error:', e);
      return [];
    }
  },

  /**
   * 모임 참가 신청
   */
  async applyForEvent(userId: string, eventId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('event_applications')
        .upsert(
          { user_id: userId, event_id: eventId, status: 'APPLIED' },
          { onConflict: 'user_id,event_id' }
        );

      if (error) {
        console.warn('[Supabase] applyForEvent warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] applyForEvent error:', e);
      return false;
    }
  },

  /**
   * 보유 참가권(이월 티켓) 수량 조회
   */
  async getTicketCredits(userId: string): Promise<number> {
    return nadosoloBillingEngine.getCreditBalance(userId);
  },

  /**
   * 보유 참가권(이월 티켓) 증감
   */
  async adjustTicketCredits(userId: string, delta: number): Promise<number> {
    return nadosoloBillingEngine.adjustCredits(userId, delta, {
      reason: 'ADMIN_ADJUST',
    });
  },

  /**
   * 보유 참가권(1매) 차감 후 즉시 슬롯 예약 확정
   */
  async redeemTicketForEvent(
    userId: string,
    eventId: string,
    eventTitle: string
  ): Promise<{ ok: boolean; remainingCredits: number }> {
    const credits = await this.getTicketCredits(userId);
    if (credits <= 0) return { ok: false, remainingCredits: 0 };

    const applied = await this.applyForEvent(userId, eventId);
    if (!applied) return { ok: false, remainingCredits: credits };

    const remainingCredits = await this.adjustTicketCredits(userId, -1);
    await this.createNotification({
      userId,
      eventId,
      type: 'ROOM_CONFIRMED',
      title: '보유 참가권으로 슬롯 예약 완료',
      message: `[${eventTitle}] 예약이 완료되었습니다. (잔여 참가권 ${remainingCredits}매)`,
    });
    return { ok: true, remainingCredits };
  },

  /**
   * 모임 예약 취소 또는 다음 회차 이월 (48h/24h 정책 판별 + 상태 복구 + 이월 티켓 적립 + 알림 기록)
   */
  async cancelOrRolloverApplication(
    userId: string,
    eventId: string,
    eventTitle: string,
    action: 'CANCEL' | 'ROLLOVER',
    eventDateStr?: string
  ): Promise<{ ok: boolean; policyNote: string; ticketCredits?: number }> {
    const { grantCredit, policyNote } = nadosoloBillingEngine.evaluateCancellationPolicy(
      action,
      eventDateStr
    );

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('event_applications')
        .update({ status: 'CANCELLED' })
        .eq('user_id', userId)
        .eq('event_id', eventId);

      if (error) {
        return { ok: false, policyNote: error.message };
      }

      const existing = await this.getProfile(userId);
      if (existing) {
        await this.upsertProfile({
          ...existing,
          matching_stage: 'READY',
          confirmed_event_id: undefined,
        });
      }

      const nextCredits = grantCredit
        ? await nadosoloBillingEngine.adjustCredits(userId, 1, {
            reason: action === 'ROLLOVER' ? 'ROLLOVER' : 'CANCEL_REFUND',
            itemId: eventId,
            note: policyNote,
          })
        : await nadosoloBillingEngine.getCreditBalance(userId);

      await this.createNotification({
        userId,
        eventId,
        type: action === 'ROLLOVER' ? 'WAITLIST_ROLLOVER' : 'CANCELLED',
        title: action === 'ROLLOVER' ? '모임 일정 이월 완료' : '모임 예약 취소 완료',
        message: `[${eventTitle}] ${policyNote} 처리되었습니다.`,
      });

      return { ok: true, policyNote, ticketCredits: nextCredits };
    } catch (e: any) {
      return { ok: false, policyNote: e?.message || '처리 실패' };
    }
  },

  /**
   * 5×5×5 매트릭스 평가 데이터 조회
   */
  async getMatrixEvaluations(sessionId: string): Promise<MatrixEvaluationRecord[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('matrix_evaluations')
        .select('*')
        .eq('session_id', sessionId);

      if (error || !data) return [];
      return data.map((d: any) => ({
        recordId: d.id,
        sessionId: d.session_id,
        fromUserId: d.from_user_id,
        fromNickname: d.from_nickname,
        fromGender: d.from_gender as Gender,
        toUserId: d.to_user_id,
        subElementId: d.sub_element_id,
        scores: d.scores as Record<CriterionCode, number>,
        createdAt: d.created_at,
      }));
    } catch (e) {
      console.warn('[Supabase] getMatrixEvaluations error:', e);
      return [];
    }
  },

  /**
   * 5×5×5 매트릭스 평가 점수 저장
   */
  async saveMatrixEvaluation(record: {
    sessionId: string;
    fromUserId: string;
    fromNickname: string;
    fromGender: Gender;
    toUserId: string;
    subElementId: string;
    scores: Record<CriterionCode, number>;
  }): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('matrix_evaluations')
        .upsert(
          {
            session_id: record.sessionId,
            from_user_id: record.fromUserId,
            from_nickname: record.fromNickname,
            from_gender: record.fromGender,
            to_user_id: record.toUserId,
            sub_element_id: record.subElementId,
            scores: record.scores,
          },
          { onConflict: 'session_id,from_user_id,to_user_id,sub_element_id' }
        );

      if (error) {
        console.warn('[Supabase] saveMatrixEvaluation warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] saveMatrixEvaluation error:', e);
      return false;
    }
  },

  /**
   * 시크릿 호감 투표 저장
   */
  async saveSecretVote(vote: SecretVote): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('secret_votes')
        .upsert(
          {
            session_id: vote.sessionId,
            from_user_id: vote.fromUserId,
            target_user_id: vote.toUserId,
            category: vote.category,
          },
          { onConflict: 'session_id,from_user_id' }
        );

      if (error) {
        console.warn('[Supabase] saveSecretVote warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] saveSecretVote error:', e);
      return false;
    }
  },

  /**
   * 단일 명사 참여자 관찰 기록 저장
   */
  async saveParticipantObservation(record: {
    sessionId: string;
    moduleId: string;
    fromUserId: string;
    toUserId: string;
    elementId: string;
    anchorNoun: string;
    scoreStep: 1 | 2 | 3 | 4 | 5;
  }): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('participant_observations')
        .upsert(
          {
            session_id: record.sessionId,
            module_id: record.moduleId,
            from_user_id: record.fromUserId,
            to_user_id: record.toUserId,
            element_id: record.elementId,
            anchor_noun: record.anchorNoun,
            score_step: record.scoreStep,
          },
          { onConflict: 'session_id,from_user_id,to_user_id,element_id' }
        );
      if (error) {
        console.warn('[Supabase] saveParticipantObservation warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] saveParticipantObservation error:', e);
      return false;
    }
  },

  /**
   * 단일 명사 참여자 관찰 기록 조회
   */
  async getParticipantObservations(sessionId: string): Promise<any[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('participant_observations')
        .select('*')
        .eq('session_id', sessionId);
      if (error || !data) return [];
      return data;
    } catch (e) {
      console.warn('[Supabase] getParticipantObservations error:', e);
      return [];
    }
  },

  /**
   * 개인 리포트 상태 및 점수 캐시 조회
   */
  async getPersonalReport(
    sessionId: string,
    userId: string
  ): Promise<{
    unlocked: boolean;
    completedCount: number;
    totalScore100: number;
    topStrengths: string[];
  } | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('personal_reports')
        .select('unlocked, completed_count, total_score100, top_strengths')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();
      if (error || !data) return null;
      return {
        unlocked: Boolean(data.unlocked),
        completedCount: Number(data.completed_count ?? 0),
        totalScore100: Number(data.total_score100 ?? 0),
        topStrengths: Array.isArray(data.top_strengths) ? data.top_strengths : [],
      };
    } catch (e) {
      console.warn('[Supabase] getPersonalReport error:', e);
      return null;
    }
  },

  /**
   * 상호주의 해금 및 100점 표준 점수 자동 집계 (평가 저장 직후 호출)
   * - 본인이 평가한 동석자 수가 requiredPeerCount 이상이면 unlocked = true
   * - 타인이 나를 평가한 단일 명사 관찰 점수를 100점 만점으로 정규화·상위 강점 3개 산출
   */
  async syncReciprocalReportUnlock(
    sessionId: string,
    evaluatorUserId: string,
    requiredPeerCount: number = 5
  ): Promise<{
    unlocked: boolean;
    completedPeers: number;
    totalScore100: number;
    topStrengths: string[];
  }> {
    const observations = await this.getParticipantObservations(sessionId);
    const outgoingPeers = new Set(
      observations
        .filter((o) => o.from_user_id === evaluatorUserId)
        .map((o) => String(o.to_user_id))
    );
    const completedPeers = outgoingPeers.size;
    const unlocked = completedPeers >= requiredPeerCount;

    const incoming = observations.filter((o) => o.to_user_id === evaluatorUserId);
    let totalScore100 = 0;
    let topStrengths: string[] = [];

    if (incoming.length > 0) {
      const sumSteps = incoming.reduce((acc, o) => acc + Number(o.score_step ?? 0), 0);
      totalScore100 = Math.round(((sumSteps / incoming.length) / 5) * 100);

      const nounBuckets = new Map<string, { sum: number; count: number }>();
      for (const obs of incoming) {
        const noun = String(obs.anchor_noun || '').trim();
        if (!noun) continue;
        const cur = nounBuckets.get(noun) ?? { sum: 0, count: 0 };
        cur.sum += Number(obs.score_step ?? 0);
        cur.count += 1;
        nounBuckets.set(noun, cur);
      }
      topStrengths = Array.from(nounBuckets.entries())
        .map(([noun, v]) => ({ noun, avg: v.sum / v.count }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 3)
        .map((x) => x.noun);
    }

    await this.upsertPersonalReport({
      sessionId,
      userId: evaluatorUserId,
      unlocked,
      completedCount: completedPeers,
      totalScore100,
      topStrengths,
    });

    if (unlocked) {
      await this.createNotification({
        userId: evaluatorUserId,
        eventId: sessionId,
        type: 'REPORT_UNLOCKED',
        title: '소셜 리포트 잠금 해제',
        message: `동석자 ${completedPeers}명 관찰 평가를 완료해 내 리포트(${totalScore100}점)가 열렸습니다.`,
      });
    }

    return { unlocked, completedPeers, totalScore100, topStrengths };
  },

  /**
   * 이용자 알림 생성 (인앱 + 외부 알림톡/SMS 발송 큐 기록)
   */
  async createNotification(input: {
    userId: string;
    eventId?: string;
    type: 'ROOM_CONFIRMED' | 'VENUE_REVEAL' | 'WAITLIST_ROLLOVER' | 'EVAL_REQUEST' | 'REPORT_UNLOCKED' | 'CANCELLED';
    title: string;
    message: string;
    channel?: 'IN_APP' | 'KAKAO_ALIMTALK' | 'SMS';
    deliveryStatus?: 'PENDING' | 'SENT' | 'FAILED';
  }): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('notifications').insert({
        user_id: input.userId,
        event_id: input.eventId || null,
        type: input.type,
        title: input.title,
        message: input.message,
        channel: input.channel || 'IN_APP',
        delivery_status: input.deliveryStatus || 'SENT',
        is_read: false,
      });
      if (error) {
        console.warn('[Supabase] createNotification warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] createNotification error:', e);
      return false;
    }
  },

  /**
   * 이용자 알림 목록 조회
   */
  async getUserNotifications(userId: string): Promise<
    Array<{
      id: string;
      user_id: string;
      event_id?: string;
      type: string;
      title: string;
      message: string;
      channel: string;
      delivery_status: string;
      is_read: boolean;
      created_at: string;
    }>
  > {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error || !data) return [];
      return data as any[];
    } catch {
      return [];
    }
  },

  /**
   * 알림 읽음 처리
   */
  async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * 영구 재매칭 차단 / 노쇼 신고 등록
   */
  async blockUserPair(
    fromUserId: string,
    blockedUserId: string,
    sessionId?: string,
    reason: 'UNCOMFORTABLE' | 'NO_SHOW' | 'SAFETY' = 'UNCOMFORTABLE'
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('user_blocks').upsert(
        {
          from_user_id: fromUserId,
          blocked_user_id: blockedUserId,
          session_id: sessionId || null,
          reason,
        },
        { onConflict: 'from_user_id,blocked_user_id' }
      );
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * 전체 재매칭 차단 쌍 조회
   */
  async getBlockedPairs(): Promise<Array<{ fromUserId: string; blockedUserId: string }>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_blocks')
        .select('from_user_id, blocked_user_id');
      if (error || !data) return [];
      return data.map((row: any) => ({
        fromUserId: String(row.from_user_id),
        blockedUserId: String(row.blocked_user_id),
      }));
    } catch {
      return [];
    }
  },

  /**
   * 편성 확정 방을 DB(meetups + profiles 매칭단계 + personal_reports 초기화)에 일괄 영속화
   */
  async commitMatchedRoomSession(
    event: ConditionalEventItem,
    memberProfileIds: string[]
  ): Promise<{ ok: boolean; updatedMembers: number }> {
    const eventSaved = await this.upsertEvent(event);
    let updatedMembers = 0;

    for (const userId of memberProfileIds) {
      if (!userId) continue;
      const stageOk = await this.updateMemberMatchingStage(userId, 'CONFIRMED', event.eventId);
      const reportOk = await this.upsertPersonalReport({
        sessionId: event.eventId,
        userId,
        unlocked: false,
        completedCount: 0,
        totalScore100: 0,
        topStrengths: [],
      });
      if (stageOk && reportOk) updatedMembers += 1;
    }

    return { ok: eventSaved, updatedMembers };
  },

  /**
   * 개인 리포트 상태 및 점수 캐시 저장
   */
  async upsertPersonalReport(report: {
    sessionId: string;
    userId: string;
    unlocked: boolean;
    completedCount: number;
    totalScore100: number;
    topStrengths: string[];
  }): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('personal_reports')
        .upsert(
          {
            session_id: report.sessionId,
            user_id: report.userId,
            unlocked: report.unlocked,
            completed_count: report.completedCount,
            total_score100: report.totalScore100,
            top_strengths: report.topStrengths,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'session_id,user_id' }
        );
      if (error) {
        console.warn('[Supabase] upsertPersonalReport warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] upsertPersonalReport error:', e);
      return false;
    }
  },

  /**
   * 전체 밋업(모임) 상품 목록 실시간 조회 (Supabase meetups 테이블 SSOT)
   */
  async getEvents(): Promise<ConditionalEventItem[] | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('meetups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase] getEvents(meetups) warning:', error.message);
        return null;
      }
      return (data || []).map((row: any) => {
        const rawPresets: string[] = Array.isArray(row.active_preset_sub_ids)
          ? row.active_preset_sub_ids
          : [];
        const getMeta = (prefix: string) => {
          const hit = rawPresets.find((t) => typeof t === 'string' && t.startsWith(prefix));
          return hit ? hit.slice(prefix.length) : undefined;
        };
        const cleanPresets = rawPresets.filter(
          (t) => typeof t === 'string' && !t.startsWith('__ENG_')
        );
        const purposeRaw = row.purpose || getMeta('__ENG_PURPOSE:');
        const compRaw = row.composition_mode || getMeta('__ENG_COMP:');
        const genderRaw = getMeta('__ENG_GENDER:');
        const evalRaw = row.evaluation_module_id || getMeta('__ENG_EVAL:');
        const dongRaw = row.dong_name || getMeta('__ENG_DONG:');

        return {
          eventId: row.meetup_id || row.event_id,
          title: row.title,
          districtId: row.district_id || 'DIST_JEONPO',
          regionName: row.region_name || undefined,
          districtName: row.district_name || undefined,
          dongName: dongRaw || undefined,
          venueId: row.venue_id || 'DIRECT',
          dateText: row.date_text,
          eventDate: row.event_date || undefined,
          eventTime: row.event_time || undefined,
          deadlineAt: row.deadline_at || undefined,
          mode: row.mode || '3:3 소셜 다이닝',
          purpose: (purposeRaw as ConditionalEventItem['purpose']) || undefined,
          compositionMode: compRaw || undefined,
          enforceGenderRatio:
            typeof row.enforce_gender_ratio === 'boolean'
              ? row.enforce_gender_ratio
              : genderRaw === '1'
              ? true
              : genderRaw === '0'
              ? false
              : undefined,
          evaluationModuleId: evalRaw || undefined,
          priceKrw: row.price_krw ?? 30000,
          maxCapacity: row.max_capacity ?? 6,
          minConfirmCount: row.min_confirm_count ?? 4,
          reason: row.reason || undefined,
          description: row.description || undefined,
          heroImage: row.hero_image || undefined,
          venueNameOverride: row.venue_name_override || undefined,
          venueAddress: row.venue_address || undefined,
          venueMapUrl: row.venue_map_url || undefined,
          isVenueSecretUntilConfirm: row.is_venue_secret_until_confirm ?? true,
          expectedMealCost: row.expected_meal_cost || undefined,
          refundPolicy: row.refund_policy || undefined,
          deadlineText: row.deadline_text || undefined,
          status: (row.status || 'RECRUITING') as EventProductStatus,
          targetAgeGroup: row.target_age_group || '5060 골든',
          mealNote: row.meal_note || undefined,
          requiredBadgeIds: Array.isArray(row.required_badge_ids) ? row.required_badge_ids : [],
          minTotalScore100: row.min_total_score100 ?? 0,
          activePresetSubIds: cleanPresets,
        };
      });
    } catch (e) {
      console.warn('[Supabase] getEvents(meetups) error:', e);
      return null;
    }
  },

  /**
   * 밋업(모임) 상품 개설 / 수정 / 상태전환 (Supabase meetups 테이블 Upsert)
   */
  async upsertEvent(ev: ConditionalEventItem): Promise<boolean> {
    try {
      const supabase = createClient();
      const engineTags: string[] = [
        ...(ev.purpose ? [`__ENG_PURPOSE:${ev.purpose}`] : []),
        ...(ev.compositionMode ? [`__ENG_COMP:${ev.compositionMode}`] : []),
        ...(typeof ev.enforceGenderRatio === 'boolean'
          ? [`__ENG_GENDER:${ev.enforceGenderRatio ? '1' : '0'}`]
          : []),
        ...(ev.evaluationModuleId ? [`__ENG_EVAL:${ev.evaluationModuleId}`] : []),
        ...(ev.dongName ? [`__ENG_DONG:${ev.dongName}`] : []),
      ];
      const mergedPresets = [
        ...(ev.activePresetSubIds || []).filter((t) => !t.startsWith('__ENG_')),
        ...engineTags,
      ];

      const { error } = await supabase.from('meetups').upsert(
        {
          meetup_id: ev.eventId,
          title: ev.title,
          district_id: ev.districtId || 'DIST_JEONPO',
          region_name: ev.regionName || null,
          district_name: ev.districtName || null,
          venue_id: ev.venueId || 'DIRECT',
          date_text: ev.dateText,
          event_date: ev.eventDate || null,
          event_time: ev.eventTime || null,
          deadline_at: ev.deadlineAt || null,
          mode: ev.mode,
          price_krw: ev.priceKrw,
          max_capacity: ev.maxCapacity ?? 6,
          min_confirm_count: ev.minConfirmCount ?? 4,
          reason: ev.reason || null,
          description: ev.description || null,
          hero_image: ev.heroImage || null,
          venue_name_override: ev.venueNameOverride || null,
          venue_address: ev.venueAddress || null,
          venue_map_url: ev.venueMapUrl || null,
          is_venue_secret_until_confirm: ev.isVenueSecretUntilConfirm ?? true,
          expected_meal_cost: ev.expectedMealCost || null,
          refund_policy: ev.refundPolicy || null,
          deadline_text: ev.deadlineText || null,
          status: ev.status || 'RECRUITING',
          target_age_group: ev.targetAgeGroup || '5060 골든',
          meal_note: ev.mealNote || null,
          required_badge_ids: ev.requiredBadgeIds || [],
          min_total_score100: ev.minTotalScore100 ?? 0,
          active_preset_sub_ids: mergedPresets,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'meetup_id' }
      );
      if (error) {
        console.warn('[Supabase] upsertEvent(meetups) warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] upsertEvent(meetups) error:', e);
      return false;
    }
  },

  /**
   * 밋업(모임) 상품 영구 삭제
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('meetups').delete().eq('meetup_id', eventId);
      if (error) {
        console.warn('[Supabase] deleteEvent(meetups) warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] deleteEvent(meetups) error:', e);
      return false;
    }
  },
};
