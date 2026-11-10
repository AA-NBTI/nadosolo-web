import { createClient } from './client';
import { CriterionCode, Gender, MatrixEvaluationRecord, SecretVote } from '@/engine';

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
  created_at?: string;
  updated_at?: string;
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
      return data as DbProfile;
    } catch (e) {
      console.warn('[Supabase] getProfile failed:', e);
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
      return (data || []) as DbProfile[];
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
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
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
            self_domain_scores: profile.self_domain_scores,
            survey_answers: profile.survey_answers,
            residence_city: profile.residence_city,
            residence_district: profile.residence_district,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

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
};
