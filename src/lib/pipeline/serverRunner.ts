import { createClient } from '@/lib/supabase/server';
import {
  classifyAccountProfile,
  filterMatchingEligibleProfiles,
} from '@/modules/identity';
import {
  AdaptiveAnswer,
  computeUserAxisProfile,
  DEFAULT_MATCHING_AXES,
  PURPOSE_LABELS,
  runUnifiedMatchingPipeline,
} from '@/engine/dynamicMatchingEngine';

export interface AutoMatchRequestBody {
  mode?: 'DRY_RUN' | 'EXECUTE';
  requirePaid?: boolean;
  coreCount?: 3 | 4;
  excludeTesters?: boolean;
}

export async function runPipelineOnServer(body: AutoMatchRequestBody = {}) {
  const mode = body.mode === 'EXECUTE' ? 'EXECUTE' : 'DRY_RUN';
  const requirePaid = Boolean(body.requirePaid);
  const coreCount: 3 | 4 = body.coreCount === 3 ? 3 : 4;

  const supabase = await createClient();

  const [profilesRes, appsRes, meetupsRes, blocksRes, notifProbeRes, cfgProbeRes, affProbeRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('event_applications').select('user_id, event_id, status'),
    supabase.from('meetups').select('meetup_id, title'),
    supabase.from('user_blocks').select('from_user_id, blocked_user_id'),
    supabase.from('notifications').select('id').limit(1),
    supabase.from('app_configs').select('key').limit(1),
    supabase.from('affiliate_applications').select('id').limit(1),
  ]);

  if (profilesRes.error) {
    throw new Error(`profiles 조회 실패: ${profilesRes.error.message}`);
  }

  const tableHealth = {
    profiles: !profilesRes.error,
    meetups: !meetupsRes.error,
    notifications: !notifProbeRes.error,
    user_blocks: !blocksRes.error,
    app_configs: !cfgProbeRes.error,
    affiliate_applications: !affProbeRes.error,
  };

  const blockedPairs = (blocksRes.data ?? []).map((b: any) => ({
    fromUserId: String(b.from_user_id),
    blockedUserId: String(b.blocked_user_id),
  }));

  const rawProfiles = profilesRes.data ?? [];
  const eligibleProfiles = filterMatchingEligibleProfiles(rawProfiles, {
    excludeTesters: body.excludeTesters,
  });
  const realMemberCount = eligibleProfiles.filter(
    (p) => classifyAccountProfile(p) === 'REAL_MEMBER'
  ).length;
  const testerCount = eligibleProfiles.filter(
    (p) => classifyAccountProfile(p) === 'TESTER'
  ).length;

  const paidUserIds = new Set(
    (appsRes.data ?? [])
      .filter((a: any) => a.status === 'APPLIED' || a.status === 'CONFIRMED')
      .map((a: any) => String(a.user_id))
  );
  const existingTitles = new Set(
    (meetupsRes.data ?? []).map((m: any) => String(m.title ?? ''))
  );

  const profileIdByLabel = new Map<string, string>();
  const participants = eligibleProfiles.map((p: any) => {
    const scores = (p.self_domain_scores || {}) as Record<string, any>;
    const surveyObj = (p.survey_answers || scores._survey_answers || {}) as Record<string, string>;
    const answers: AdaptiveAnswer[] = Object.entries(surveyObj).map(([qId, val]) => ({
      questionId: qId,
      version: 1,
      value: val,
    }));
    const stage = p.matching_stage || scores._matching_stage;
    const isPaid =
      paidUserIds.has(p.id) ||
      stage === 'APPLIED' ||
      stage === 'PRE_MATCHED' ||
      stage === 'CONFIRMED';

    const label = p.nickname || p.handle || p.id;
    profileIdByLabel.set(label, p.id);

    const baseProfile = computeUserAxisProfile(
      {
        userId: label,
        gender: p.gender === 'M' ? 'M' : 'F',
        birthYear: p.birth_year || 1994,
        cityCode: p.residence_city || scores._residence_city || '서울',
        districtName: p.residence_district || scores._residence_district,
        dietary: p.dietary || 'NONE',
        purpose: p.preferred_purpose || scores._preferred_purpose,
        isPaid,
        memberStage: stage,
      },
      answers
    );
    return {
      ...baseProfile,
      tierCode: String(scores._tier_code || 'STANDARD'),
      tierRank: typeof scores._tier_rank === 'number' ? scores._tier_rank : 0,
      invitedByUserId: scores._invited_by ? String(scores._invited_by) : undefined,
    };
  });

  const pipeline = runUnifiedMatchingPipeline({
    participants,
    axes: DEFAULT_MATCHING_AXES,
    coreCount,
    requirePaid,
    blockedPairs,
  });

  const committedEventIds: string[] = [];
  const commitErrors: string[] = [];
  let newlyCommittedRooms = 0;
  let newlyCommittedMembers = 0;
  let notificationsCreated = 0;

  if (mode === 'EXECUTE' && pipeline.allAuditPassed) {
    for (const room of pipeline.grouping.rooms) {
      const alreadyExists = Array.from(existingTitles).some((t) =>
        t.includes(room.spec.title)
      );
      if (alreadyExists) continue;

      const eventId = `EVT-${room.roomId}-${Date.now().toString().slice(-4)}`;
      const { error: meetupErr } = await supabase.from('meetups').upsert(
        {
          meetup_id: eventId,
          title: room.spec.title,
          district_id: room.spec.cityCode === '부산' ? 'BUSAN_HAEUNDAE' : 'SEOUL_GANGNAM',
          region_name: room.spec.cityCode,
          district_name:
            room.spec.districtName || (room.spec.cityCode === '부산' ? '해운대구' : '강남구'),
          venue_id:
            room.assignedVenueId ||
            (room.spec.cityCode === '부산' ? 'VEN_BUSAN_HAEUNDAE_01' : 'VEN_SEOUL_GANGNAM_01'),
          venue_name_override: room.assignedVenueName || null,
          date_text: room.spec.scheduleSlot,
          event_date: room.spec.scheduleSlot.slice(0, 10),
          event_time: room.spec.scheduleSlot.slice(-5),
          mode: '3:3 소셜 다이닝',
          price_krw: 30000,
          max_capacity: 6,
          min_confirm_count: 4,
          status: 'RECRUITING',
          target_age_group: '3045 프라임',
          reason: `자동 파이프라인 확정 · ${PURPOSE_LABELS[room.spec.purpose]} 기준 ${room.expectedScore100}점`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'meetup_id' }
      );

      if (meetupErr) {
        commitErrors.push(`${room.roomId}: ${meetupErr.message}`);
        continue;
      }
      newlyCommittedRooms += 1;
      committedEventIds.push(eventId);
      existingTitles.add(room.spec.title);

      for (const m of room.members) {
        const profileId = profileIdByLabel.get(m.userId);
        if (!profileId) continue;

        const rawRow = rawProfiles.find((r: any) => r.id === profileId);
        const prevScores = (rawRow?.self_domain_scores || {}) as Record<string, any>;

        await supabase
          .from('profiles')
          .update({
            self_domain_scores: {
              ...prevScores,
              _matching_stage: 'CONFIRMED',
              _confirmed_event_id: eventId,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);

        await supabase.from('personal_reports').upsert(
          {
            session_id: eventId,
            user_id: profileId,
            unlocked: false,
            completed_count: 0,
            total_score100: 0,
            top_strengths: [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'session_id,user_id' }
        );

        if (tableHealth.notifications) {
          const { error: notifErr } = await supabase.from('notifications').insert({
            user_id: profileId,
            event_id: eventId,
            type: 'ROOM_CONFIRMED',
            title: '프라이빗 다이닝 방 확정',
            message: `${room.spec.scheduleSlot} · ${room.assignedVenueName || '제휴 다이닝'} 테이블이 확정되었습니다.`,
            channel: 'IN_APP',
            delivery_status: 'SENT',
            is_read: false,
          });
          if (!notifErr) notificationsCreated += 1;
        }

        newlyCommittedMembers += 1;
      }

      // 확정 방의 실제 배정 로스터(동석자 힌트·좌석표·사후평가용) 영속 저장
      const rosterMembers = room.members.map((m, idx) => {
        const profileId = profileIdByLabel.get(m.userId) || m.userId;
        const rawRow = rawProfiles.find((r: any) => r.id === profileId);
        return {
          userId: profileId,
          nickname: rawRow?.nickname || m.userId,
          gender: m.gender,
          birthYear: m.birthYear,
          jobTitle: rawRow?.job_title || m.industry,
          seatNumber: idx + 1,
          pairingReason: `${PURPOSE_LABELS[room.spec.purpose]} · ${m.axisLabels?.DEPTH || '균형'}`,
        };
      });
      await supabase.from('app_configs').upsert(
        {
          key: `matched_room_roster_${eventId}`,
          value: {
            eventId,
            title: room.spec.title,
            venueName: room.assignedVenueName || '제휴 다이닝',
            districtName: room.spec.districtName || room.spec.cityCode,
            dateText: room.spec.scheduleSlot,
            purpose: PURPOSE_LABELS[room.spec.purpose],
            members: rosterMembers,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    }

    if (tableHealth.notifications) {
      for (const w of pipeline.grouping.waitlistRoutings) {
        if (!w.member.isPaid) continue;
        const profileId = profileIdByLabel.get(w.member.userId);
        if (!profileId) continue;
        const { error: wNotifErr } = await supabase.from('notifications').insert({
          user_id: profileId,
          type: 'WAITLIST_ROLLOVER',
          title: '모임 대기 및 다음 회차 우선 배정',
          message: w.primaryRoom?.blockedReason || '인원 및 조건 균형으로 다음 회차 우선 배정 대기 중입니다.',
          channel: 'IN_APP',
          delivery_status: 'SENT',
          is_read: false,
        });
        if (!wNotifErr) notificationsCreated += 1;
      }
    }
  }

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    mode,
    requirePaid,
    allAuditPassed: pipeline.allAuditPassed,
    auditCases: pipeline.auditCases,
    tableHealth,
    stats: {
      totalProfiles: participants.length,
      realMemberCount,
      testerCount,
      paidCount: participants.filter((p) => p.isPaid).length,
      unpaidCount: participants.filter((p) => !p.isPaid).length,
      roomCount: pipeline.grouping.rooms.length,
      assignedVenueCount: pipeline.assignedVenueCount,
      rolloverCount: pipeline.rolloverCount,
      blockedPairCount: blockedPairs.length,
      existingMeetupCount: existingTitles.size,
      newlyCommittedRooms,
      newlyCommittedMembers,
      notificationsCreated,
    },
    committedEventIds,
    commitErrors,
    rooms: pipeline.grouping.rooms.map((r) => ({
      roomId: r.roomId,
      title: r.spec.title,
      cityCode: r.spec.cityCode,
      purpose: PURPOSE_LABELS[r.spec.purpose],
      expectedScore100: r.expectedScore100,
      assignedVenueName: r.assignedVenueName ?? '미배정',
      backupVenueName: r.backupVenueName ?? '-',
      venueAssignmentStatus: r.venueAssignmentStatus,
      memberCount: r.members.length,
      alreadyPublished: Array.from(existingTitles).some((t) => t.includes(r.spec.title)),
    })),
    rollovers: pipeline.grouping.waitlistRoutings.map((w) => ({
      userId: w.member.userId,
      isPaid: w.member.isPaid,
      blockedReason: w.primaryRoom?.blockedReason ?? '인원/조건 대기',
    })),
  };
}
