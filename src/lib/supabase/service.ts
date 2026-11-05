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
  verified_badge?: string;
  session_count?: number;
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
      return data.map((row) => row.event_id);
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
};
