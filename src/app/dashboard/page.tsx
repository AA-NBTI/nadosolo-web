'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { blocksReveal, type ReservationPublicState } from '@/lib/reservation/reveal';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CriterionCode,
  DietaryRestriction,
  EvaluationMatrixEngine,
  InterestTag,
  MajorDomainCode,
  useNadoSoloEngine,
} from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import ProcessGateLockedCard from '@/components/dashboard/ProcessGateLockedCard';
import DashboardYotWidget from '@/components/dashboard/DashboardYotWidget';
import { nadoSoloSupabaseService } from '@/lib/supabase/service';
import { getAppConfig, saveAppConfig } from '@/lib/appConfigDb';
import { KeyRound, UserX, AlertCircle, CheckCircle2, ShieldAlert, Phone, Mail, Bell, MapPin, Clock, Wine, Users, ExternalLink } from 'lucide-react';

const DIETARY_LABELS: Record<DietaryRestriction, string> = {
  NONE: '없음 (다 잘 먹어요)',
  VEGAN: '비건 (채식)',
  HALAL: '할랄',
  NO_PORK: '돼지고기 제외',
  ALCOHOL_FREE: '술 안 마심 (논알콜)',
};

const INTEREST_LABELS: Record<InterestTag, string> = {
  WINE: '와인',
  COOKING: '요리',
  RUNNING: '러닝',
  FITNESS: '운동',
  TECH_STARTUP: '스타트업',
  FINANCE: '금융/투자',
  BOOK_ART: '독서/전시',
  TRAVEL: '여행',
  MOVIE_MUSIC: '영화/음악',
  LANGUAGE: '외국어',
};

function MemberDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepQuery = searchParams.get('step');
  const eventIdQuery = searchParams.get('eventId');

  const {
    currentUser,
    isSessionReady,
    updateCurrentUser,
    logout,
    processModules,
    majorDomains,
    evaluationCriteria,
    subElements,
    selfDomainScores100,
    setSelfDomainScore100,
    matrixEvaluations,
    submitMatrixEvaluation,
    myPersonalDossier,
    participantObservations,
    submitParticipantObservation,
    completedEvalUserIds,
    personalSocialDossier,
    fullJourneyAudit,
    granularBadges,
    regionDistricts,
    selectedDistrictId,
    setSelectedDistrictId,
    conditionalEvents,
    appliedEventIds,
    applyForConditionalEvent,
    dietary,
    setDietary,
    interests,
    toggleInterest,
    surveyAnswers,
    activeTable,
    partnerVenues,
    isSecondHalfRotated,
    setIsSecondHalfRotated,
    currentSeats,
    activeStageCards,
    myVoteTargetId,
    setMyVoteTargetId,
    myVoteCategory,
    setMyVoteCategory,
    isMidnightPassed,
    setIsMidnightPassed,
    visibleMatchesForMe,
    cmsPages,
  } = useNadoSoloEngine();

  // 활성화된 프로세스 모듈만 추출
  const enabledModules = useMemo(
    () => processModules.filter((m) => m.enabled).sort((a, b) => a.stepOrder - b.stepOrder),
    [processModules]
  );

  const [activeProcessId, setActiveProcessId] = useState<string>(
    stepQuery || 'P00_MEETUP_STATUS'
  );

  // [모임현황 라이프사이클 단계]
  // TICKET (티켓 및 매칭 대기) -> VENUE_SEAT (D-1 장소 및 좌석) -> LIVE_DECK (현장 대화카드) -> POST_FEEDBACK (매너평가 & 투표)
  const [meetupPhase, setMeetupPhase] = useState<'TICKET' | 'VENUE_SEAT' | 'LIVE_DECK' | 'POST_FEEDBACK'>('TICKET');
  const [profileSubTab, setProfileSubTab] = useState<'BASIC' | 'SELF_DIAG' | 'ACCOUNT'>('BASIC');

  useEffect(() => {
    if (stepQuery) {
      if (stepQuery === 'P06_SEAT' || stepQuery === 'P07_DECK' || stepQuery === 'P08_EVALUATION' || stepQuery === 'P09_VOTE') {
        setActiveProcessId('P00_MEETUP_STATUS');
        if (stepQuery === 'P06_SEAT') setMeetupPhase('VENUE_SEAT');
        if (stepQuery === 'P07_DECK') setMeetupPhase('LIVE_DECK');
        if (stepQuery === 'P08_EVALUATION' || stepQuery === 'P09_VOTE') setMeetupPhase('POST_FEEDBACK');
      } else if (stepQuery === 'P01_ACCOUNT') {
        setActiveProcessId('P02_PROFILE');
        setProfileSubTab('ACCOUNT');
      } else {
        setActiveProcessId(stepQuery);
      }
    }
    if (eventIdQuery) {
      const targetEv = conditionalEvents.find((e) => e.eventId === eventIdQuery);
      if (targetEv && !appliedEventIds.includes(targetEv.eventId)) {
        const dist = regionDistricts.find((d) => d.districtId === targetEv.districtId);
        setCheckoutEvent({
          eventId: targetEv.eventId,
          title: targetEv.title,
          dateText: targetEv.dateText,
          priceKrw: targetEv.priceKrw,
          districtName: dist ? dist.regionName : '부산',
          mealNote: targetEv.mealNote,
          refundPolicy: targetEv.refundPolicy,
          deadlineText: targetEv.deadlineText,
        });
        setIsCheckoutOpen(true);
      }
    }
  }, [stepQuery, eventIdQuery, conditionalEvents, appliedEventIds, regionDistricts]);

  // 매칭 및 다이닝 서비스 모듈 (계정정보는 사이드바 하단으로 분리)
  const serviceModules = useMemo(
    () => enabledModules.filter((m) => m.processId !== 'P01_ACCOUNT'),
    [enabledModules]
  );

  // 이용자 대시보드 핵심 4대 상단 탭 (Timeleft형 단일 허브)
  const USER_DASHBOARD_MENUS = useMemo(
    () => [
      { id: 'P00_MEETUP_STATUS', label: '내 모임' },
      { id: 'P05_EVENT_APPLY', label: '모임 찾기' },
      { id: 'P10_REPORT', label: '모임 평가' },
      { id: 'P02_PROFILE', label: '내 정보' },
    ],
    []
  );

  // 현재 선택된 모듈이 비활성화되었을 경우 첫 번째 모듈로 폴백
  const currentProcess =
    enabledModules.find((m) => m.processId === activeProcessId) ??
    serviceModules[0];

  const [cancelledEventIds, setCancelledEventIds] = useState<string[]>([]);

  const myAppliedEvents = useMemo(() => {
    const activeIds = appliedEventIds.filter((id) => !cancelledEventIds.includes(id));
    const matched = conditionalEvents.filter((ev) => activeIds.includes(ev.eventId));
    const matchedIds = new Set(matched.map((ev) => ev.eventId));
    const fallbacks = activeIds
      .filter((id) => !matchedIds.has(id))
      .map((id): (typeof conditionalEvents)[number] => {
        const isBusan = id.includes('BUSAN');
        const isSat = id.includes('SAT');
        return {
          eventId: id,
          title: `${isBusan ? '부산' : '서울'} · ${isSat ? '이번 주 토요일 19:30' : '이번 주 금요일 19:30'} 프라이빗 다이닝`,
          districtId: isBusan ? 'DIST_JEONPO' : 'DIST_SEONGSU',
          regionName: isBusan ? '부산' : '서울',
          venueId: 'DIRECT',
          dateText: isSat ? '이번 주 토요일 19:30' : '이번 주 금요일 19:30',
          mode: '블라인드 슬롯',
          priceKrw: 30000,
          status: 'RECRUITING',
          requiredBadgeIds: [],
          minTotalScore100: 0,
          activePresetSubIds: [],
        };
      });
    return [...matched, ...fallbacks];
  }, [conditionalEvents, appliedEventIds, cancelledEventIds]);

  // 범용 예약 모듈 상태: 식당이 확정되지 않은 모임은 D-1이어도 식당 Reveal을 보류한다
  const reservationEventId = myAppliedEvents[0]?.eventId;
  const [reservationState, setReservationState] = useState<ReservationPublicState>('DISABLED');
  const [reservationVenue, setReservationVenue] = useState<{
    name?: string;
    address?: string;
    addressDetail?: string;
    phone?: string;
    guideNote?: string;
  } | null>(null);
  useEffect(() => {
    if (!reservationEventId) return;
    let alive = true;
    fetch(`/api/reservations/status?eventId=${encodeURIComponent(reservationEventId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        if (data?.state) setReservationState(data.state as ReservationPublicState);
        setReservationVenue(data?.venue || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [reservationEventId]);
  const reservationBlocksReveal = blocksReveal(reservationState);

  // [P01 계정정보 & P02 기본프로필] 로컬 폼 상태
  const [editHandle, setEditHandle] = useState(
    currentUser?.handle ?? '@jisoo_kim'
  );
  const [editEmail, setEditEmail] = useState(
    currentUser?.email ?? 'jisoo@nadosolo.com'
  );
  const [editPhone, setEditPhone] = useState(
    currentUser?.phone ?? '010-2948-1029'
  );
  const [editNickname, setEditNickname] = useState(
    currentUser?.nickname ?? '지수'
  );
  const [editBirthYear, setEditBirthYear] = useState(
    currentUser?.birthYear ?? 1995
  );
  const [editGender, setEditGender] = useState<'F' | 'M'>(
    currentUser?.gender ?? 'F'
  );
  const [editJob, setEditJob] = useState(
    currentUser?.jobTitle ?? '프로덕트 디자이너'
  );
  const [editResidenceCity, setEditResidenceCity] = useState(
    currentUser?.residenceCity ?? '서울'
  );
  const [editResidenceDistrict, setEditResidenceDistrict] = useState(
    currentUser?.residenceDistrict ?? ''
  );
  const [editResidenceDong, setEditResidenceDong] = useState(
    currentUser?.residenceDong ?? ''
  );
  const [editResidenceAddress, setEditResidenceAddress] = useState(
    currentUser?.residenceAddress ?? ''
  );
  const [editPreferredPurpose, setEditPreferredPurpose] = useState<
    'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE'
  >(currentUser?.preferredPurpose ?? 'RESET');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // [타임레프트 현장·사후 UX 상태: 도착 체크인 · 다중 Connect · 2차 애프터 라운지]
  const [checkinStatus, setCheckinStatus] = useState<'NONE' | 'ON_THE_WAY' | 'LATE_10' | 'ARRIVED'>('NONE');
  const [connectTargets, setConnectTargets] = useState<string[]>([]);
  const [afterPartyRsvp, setAfterPartyRsvp] = useState<'NONE' | 'JOIN' | 'PASS'>('NONE');
  const [sessionLiveMap, setSessionLiveMap] = useState<
    Record<string, { nickname?: string; checkin?: string; connects?: string[] }>
  >({});

  const activeSessionKey = myAppliedEvents[0]?.eventId || 'SES_DEFAULT';

  useEffect(() => {
    if (!currentUser?.userId) return;
    getAppConfig<{
      checkin?: 'NONE' | 'ON_THE_WAY' | 'LATE_10' | 'ARRIVED';
      connects?: string[];
      afterParty?: 'NONE' | 'JOIN' | 'PASS';
    }>(
      `member_live_ux_${currentUser.userId}`,
      `nadosolo_live_ux_${currentUser.userId}`,
      {}
    ).then((data) => {
      if (data?.checkin) setCheckinStatus(data.checkin);
      if (Array.isArray(data?.connects)) setConnectTargets(data.connects);
      if (data?.afterParty) setAfterPartyRsvp(data.afterParty);
    });

    getAppConfig<Record<string, { nickname?: string; checkin?: string; connects?: string[] }>>(
      `session_live_ux_${activeSessionKey}`,
      `nadosolo_session_live_ux_${activeSessionKey}`,
      {}
    ).then((mapData) => {
      if (mapData && typeof mapData === 'object') setSessionLiveMap(mapData);
    });
  }, [currentUser?.userId, activeSessionKey]);

  const persistLiveUxState = (patch: {
    checkin?: 'NONE' | 'ON_THE_WAY' | 'LATE_10' | 'ARRIVED';
    connects?: string[];
    afterParty?: 'NONE' | 'JOIN' | 'PASS';
  }) => {
    if (!currentUser?.userId) return;
    const nextCheckin = patch.checkin ?? checkinStatus;
    const nextConnects = patch.connects ?? connectTargets;
    const nextAfterParty = patch.afterParty ?? afterPartyRsvp;
    if (patch.checkin !== undefined) setCheckinStatus(patch.checkin);
    if (patch.connects !== undefined) setConnectTargets(patch.connects);
    if (patch.afterParty !== undefined) setAfterPartyRsvp(patch.afterParty);
    void saveAppConfig(
      `member_live_ux_${currentUser.userId}`,
      `nadosolo_live_ux_${currentUser.userId}`,
      { checkin: nextCheckin, connects: nextConnects, afterParty: nextAfterParty }
    );
    const nextSessionMap = {
      ...sessionLiveMap,
      [currentUser.userId]: {
        nickname: currentUser.nickname,
        checkin: nextCheckin,
        connects: nextConnects,
      },
    };
    setSessionLiveMap(nextSessionMap);
    void saveAppConfig(
      `session_live_ux_${activeSessionKey}`,
      `nadosolo_session_live_ux_${activeSessionKey}`,
      nextSessionMap
    );
  };

  // currentUser가 변경(관리자 뷰어 모드 회원 전환 등)될 때 로컬 폼 상태 동기화
  useEffect(() => {
    if (currentUser) {
      setEditHandle(currentUser.handle);
      setEditEmail(currentUser.email);
      setEditPhone(currentUser.phone ?? '');
      setEditNickname(currentUser.nickname);
      setEditBirthYear(currentUser.birthYear);
      setEditGender(currentUser.gender);
      setEditJob(currentUser.jobTitle ?? '');
      setEditResidenceCity(currentUser.residenceCity ?? '서울');
      setEditResidenceDistrict(currentUser.residenceDistrict ?? '');
      setEditResidenceDong(currentUser.residenceDong ?? '');
      setEditResidenceAddress(currentUser.residenceAddress ?? '');
      setEditPreferredPurpose(currentUser.preferredPurpose ?? 'RESET');
    }
  }, [currentUser]);

  // [비밀번호 변경 로컬 상태]
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwNotice, setPwNotice] = useState<string | null>(null);

  // [회원탈퇴 모달 상태]
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handlePasswordChange = () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwNotice('모든 비밀번호 항목을 입력해주세요.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwNotice('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPw.length < 6) {
      setPwNotice('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }
    setPwNotice('비밀번호가 성공적으로 변경되었습니다.');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setPwNotice(null), 3000);
  };

  const handleAccountDeletion = () => {
    if (deleteConfirmText.trim() !== '회원탈퇴') {
      alert("탈퇴 확인을 위해 '회원탈퇴'를 정확히 입력해주세요.");
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('NADOSOLO_USER_SESSION');
    }
    logout();
    alert('회원 탈퇴가 완료되었습니다. 그동안 나도솔로를 이용해주셔서 감사합니다.');
    router.push('/');
  };

  // [P03 자가진단] 5대 대분류 단계 이동 상태 (0 ~ 4)
  const [selfStepIdx, setSelfStepIdx] = useState<number>(0);

  // [P04 지역선택] 권역 필터
  const [selectedRegionFilter, setSelectedRegionFilter] =
    useState<string>('전체');

  // [P05 모임신청 & 토스페이먼츠 결제 모달 상태]
  const [applyFeedback, setApplyFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handlePaymentSuccess = (eventId: string) => {
    applyForConditionalEvent(eventId);
    setApplyFeedback({
      ok: true,
      message: '토스페이먼츠 참가권 결제 및 테이블 신청이 완료되었습니다! D-1에 상세 장소가 개별 안내됩니다.',
    });
  };

  // [P07 대화카드] 양방향 네비게이션 및 보기 모드 상태
  const [deckModeFilter, setDeckModeFilter] = useState<'ALL' | 'ROMANCE' | 'THEME'>('ALL');
  const [deckViewType, setDeckViewType] = useState<'SLIDE' | 'LIST'>('SLIDE');
  const [currentCardIdx, setCurrentCardIdx] = useState<number>(0);

  const filteredDeckCards = useMemo(() => {
    if (deckModeFilter === 'ALL') return activeStageCards;
    return activeStageCards.filter((c) => c.modes.includes(deckModeFilter));
  }, [activeStageCards, deckModeFilter]);

  const safeCardIdx =
    filteredDeckCards.length > 0
      ? Math.min(currentCardIdx, filteredDeckCards.length - 1)
      : 0;

  // [P08 개인평가] 동석자 선택 및 평가 중분류 양방향 이동 상태
  const tablePeers = useMemo(
    () => (activeTable?.participants ?? []).filter((p) => p.userId !== (currentUser?.userId ?? '')),
    [activeTable, currentUser]
  );

  // 실매칭 방 로스터 로드 (DB 확정 방 우선, 미확정 시 목업 폴백)
  const [matchedRoster, setMatchedRoster] = useState<Awaited<
    ReturnType<typeof nadoSoloSupabaseService.getMatchedRoomRoster>
  >>(null);

  useEffect(() => {
    const targetId = myAppliedEvents[0]?.eventId;
    if (!targetId) {
      setMatchedRoster(null);
      return;
    }
    nadoSoloSupabaseService
      .getMatchedRoomRoster(targetId)
      .then((roster) => setMatchedRoster(roster))
      .catch(() => setMatchedRoster(null));
  }, [myAppliedEvents]);

  const effectivePeers = useMemo(() => {
    if (matchedRoster && matchedRoster.members.length > 0) {
      return matchedRoster.members.filter((m) => m.userId !== (currentUser?.userId ?? ''));
    }
    return tablePeers;
  }, [matchedRoster, tablePeers, currentUser?.userId]);

  const effectiveSeats = useMemo(() => {
    if (matchedRoster && matchedRoster.members.length > 0) {
      const base = matchedRoster.members.map((m, i) => ({
        seatNumber: m.seatNumber || i + 1,
        userId: m.userId,
        nickname: m.nickname,
        pairingReason: m.pairingReason || m.jobTitle || '성향 매칭 배정',
      }));
      if (!isSecondHalfRotated || base.length < 4) return base;
      const rotated = [...base];
      const temp = rotated[1];
      rotated[1] = rotated[3];
      rotated[3] = rotated[5] ?? temp;
      if (rotated[5]) rotated[5] = temp;
      return rotated.map((s, idx) => ({ ...s, seatNumber: idx + 1 }));
    }
    return currentSeats;
  }, [matchedRoster, currentSeats, isSecondHalfRotated]);

  const [evalTargetUserId, setEvalTargetUserId] = useState<string>('');

  useEffect(() => {
    if (!evalTargetUserId && effectivePeers.length > 0) {
      setEvalTargetUserId(effectivePeers[0].userId);
    }
  }, [evalTargetUserId, effectivePeers]);
  const activeEvalSubElements = useMemo(
    () => subElements.filter((s) => s.activeInCurrentProcess),
    [subElements]
  );
  const [evalSubIdx, setEvalSubIdx] = useState<number>(0);
  const currentEvalSub =
    activeEvalSubElements[
      Math.min(evalSubIdx, Math.max(0, activeEvalSubElements.length - 1))
    ] ?? subElements[0];

  const [draftCriteriaScores, setDraftCriteriaScores] = useState<
    Record<CriterionCode, number>
  >({
    C1_NEAT: 4,
    C2_HARMONY: 4,
    C3_SENSE: 4,
    C4_STABILITY: 4,
    C5_APPEAL: 4,
  });
  const [draftSingleNounScores, setDraftSingleNounScores] = useState<Record<string, 1 | 2 | 3 | 4 | 5>>({
    EL_5060_DIGNITY: 5,
    EL_5060_WARMTH: 5,
    EL_5060_EMPATHY: 4,
    EL_5060_CHARACTER: 5,
    EL_5060_ETIQUETTE: 5,
  });

  const track5060Elements = [
    { id: 'EL_5060_DIGNITY', anchorNoun: '품격', question: '식사 자리에서의 몸가짐과 사용하는 어휘에서 교양과 단정함이 느껴지는가?' },
    { id: 'EL_5060_WARMTH', anchorNoun: '온화', question: '상대방을 편안하게 맞이하는 부드러운 인상과 미소를 유지하는가?' },
    { id: 'EL_5060_EMPATHY', anchorNoun: '공감', question: '상대방의 인생 이야기나 의견에 훈계 없이 진심으로 고개를 끄덕여주는가?' },
    { id: 'EL_5060_CHARACTER', anchorNoun: '인품', question: '과거 경력이나 조건을 과시하지 않고 겸손하고 진솔하게 대화하는가?' },
    { id: 'EL_5060_ETIQUETTE', anchorNoun: '예절', question: '식당 직원 및 동석자들을 존중하며 배려하는 매너를 지키는가?' },
  ];

  const [evalSavedMsg, setEvalSavedMsg] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      event_id?: string;
      type: string;
      title: string;
      message: string;
      is_read: boolean;
      created_at: string;
    }>
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [blockedPeerIds, setBlockedPeerIds] = useState<string[]>([]);
  const [ticketCredits, setTicketCredits] = useState<number>(0);

  useEffect(() => {
    if (!currentUser?.userId) return;
    nadoSoloSupabaseService
      .getUserNotifications(currentUser.userId)
      .then((rows) => setNotifications(rows))
      .catch(() => {});
    nadoSoloSupabaseService
      .getTicketCredits(currentUser.userId)
      .then((credits) => setTicketCredits(credits))
      .catch(() => {});
  }, [currentUser?.userId]);

  const handleCancelOrRollover = async (
    ev: (typeof conditionalEvents)[number],
    action: 'CANCEL' | 'ROLLOVER'
  ) => {
    if (!currentUser?.userId) return;
    const res = await nadoSoloSupabaseService.cancelOrRolloverApplication(
      currentUser.userId,
      ev.eventId,
      ev.title,
      action,
      ev.eventDate
    );
    if (res.ok) {
      setCancelledEventIds((prev) => [...prev, ev.eventId]);
      if (typeof res.ticketCredits === 'number') {
        setTicketCredits(res.ticketCredits);
      }
      const rows = await nadoSoloSupabaseService.getUserNotifications(currentUser.userId);
      setNotifications(rows);
      showToast(`${action === 'ROLLOVER' ? '이월' : '취소'} 완료 (${res.policyNote})`);
    } else {
      showToast('처리 중 오류가 발생했습니다.');
    }
  };

  const handleReportPeer = async (
    peerUserId: string,
    reason: 'NO_SHOW' | 'UNCOMFORTABLE'
  ) => {
    if (!currentUser?.userId) return;
    const activeSessionId = myAppliedEvents[0]?.eventId || 'SES_DEFAULT';
    const ok = await nadoSoloSupabaseService.blockUserPair(
      currentUser.userId,
      peerUserId,
      activeSessionId,
      reason
    );
    if (ok) {
      setBlockedPeerIds((prev) => (prev.includes(peerUserId) ? prev : [...prev, peerUserId]));
      showToast(reason === 'NO_SHOW' ? '노쇼 신고 완료' : '영구 재매칭 차단 완료');
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkNotifRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await nadoSoloSupabaseService.markNotificationRead(id);
  };

  const dashConfig = cmsPages.find((p) => p.pageId === 'PAGE_DASHBOARD');

  const showToast = (msg: string) => {
    setSaveNotice(msg);
    setTimeout(() => setSaveNotice(null), 2500);
  };

  // 세션 복원 전에는 로그인 안내 화면을 그리지 않는다 (깜빡임 방지)
  if (!isSessionReady) {
    return <div className="min-h-screen bg-[#07080a]" />;
  }

  if (!currentUser) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-[#07080a] flex items-center justify-center px-4 py-12 text-[#f5f2eb]">
        <div className="w-full max-w-[440px] bg-[#0c0d12] rounded-none p-8 border border-white/[0.08] shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-transparent border border-[#f04f74]/30 flex items-center justify-center text-[#f04f74]">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold">
              AUTHENTICATION REQUIRED
            </span>
            <h1 className="font-serif-editorial text-2xl font-normal text-white">로그인이 필요합니다</h1>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              모임 신청 현황, 플레이북 대화카드 열람, 다면 소셜 리포트 확인은 회원 인증 후 안전하게 이용하실 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href={`/auth?next=${encodeURIComponent(
                stepQuery ? `/dashboard?step=${stepQuery}` : '/dashboard'
              )}`}
              className="w-full py-3.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-sm font-mono tracking-[0.2em] uppercase font-semibold transition-all duration-300"
            >
              로그인 / 회원가입
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-white/10 hover:border-white/20 bg-white/[0.02] text-zinc-400 hover:text-white text-sm font-mono tracking-wider transition-colors"
            >
              ← 메인 화면으로 이동
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-8 sm:py-12">
      <main className="w-full max-w-[1120px] mx-auto px-5 sm:px-10 space-y-6">
        {/* ============================================================
            상단 프로필 헤더 + 가로 4탭 네비게이션 (사이드바 없는 단일 허브)
            ============================================================ */}
        <header className="bg-[#0c0d12] border border-white/[0.08] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <span className="text-sm font-mono text-zinc-400">마이페이지</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="font-serif-editorial text-2xl font-normal text-white">
                  {currentUser ? `${currentUser.nickname} (${currentUser.handle})` : '지수 (@jisoo_kim)'}
                </h1>
                <span className="text-sm font-mono text-zinc-400">
                  종합 <strong className="text-zinc-200">{myPersonalDossier.totalScore100}점</strong> · 뱃지{' '}
                  {myPersonalDossier.earnedBadgeIds.length}개 · 참가권{' '}
                  <strong className="text-white">{ticketCredits}매</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {saveNotice && (
                <span className="px-2.5 py-1 border border-white/20 bg-white/5 text-zinc-200 text-sm font-mono">
                  {saveNotice}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowNotifications((v) => !v)}
                className="px-3 py-2 border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-[#f04f74]" />
                <span>알림 {unreadNotifCount > 0 ? unreadNotifCount : notifications.length}</span>
              </button>
              <Link
                href="/meetup"
                prefetch={true}
                className="px-3.5 py-2 border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-mono transition-colors"
              >
                모임 둘러보기 →
              </Link>
            </div>
          </div>

          {showNotifications && (
            <div className="p-3 border border-white/15 bg-[#08090d] space-y-2 text-sm font-mono">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">알림함 ({notifications.length}건)</span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="px-2 py-0.5 border border-white/20 text-white cursor-pointer"
                >
                  닫기
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-zinc-400">수신된 알림이 없습니다.</p>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className={`font-bold ${n.is_read ? 'text-zinc-400' : 'text-white'}`}>
                          {n.title}
                        </span>
                        <p className="text-zinc-400 truncate">{n.message}</p>
                      </div>
                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkNotifRead(n.id)}
                          className="px-2 py-0.5 border border-white/20 text-white shrink-0 cursor-pointer"
                        >
                          읽음
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <nav className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-white/[0.08]">
            {USER_DASHBOARD_MENUS.map((menu) => {
              const currentId = currentProcess?.processId ?? activeProcessId;
              const active =
                currentId === menu.id || (currentId === 'P01_ACCOUNT' && menu.id === 'P02_PROFILE');
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setActiveProcessId(menu.id)}
                  className={`py-2.5 px-3 text-center transition-all cursor-pointer text-sm font-mono border ${
                    active
                      ? 'border-b-2 border-b-[#f04f74] border-white/20 bg-white/[0.08] text-white font-bold'
                      : 'border-white/[0.06] bg-black/30 text-zinc-400 hover:text-white hover:bg-white/[0.03] font-normal'
                  }`}
                >
                  {menu.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* ============================================================
            메인 워크스페이스 (선택된 단일 메뉴 화면)
            ============================================================ */}
        <div className="w-full min-w-0 space-y-6">

          {/* ----------------------------------------------------------
              [P00] 모임현황 모듈 (티켓 ➡️ D-1 식당/좌석 ➡️ 현장 대화카드 ➡️ 사후 평가 & 투표)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P00_MEETUP_STATUS' && (
            <div className="space-y-6">
              {/* [신설] 엿장수 바우처 & 내 제보 맛집 현황 위젯 */}
              <DashboardYotWidget />

              {/* 모임 진행 단계 타임라인 탭 (단일 명사화) */}
              <div className="bg-[#0c0d12] p-2 border border-white/10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => setMeetupPhase('TICKET')}
                    className={`py-2 px-3 text-sm font-mono tracking-wider transition-all cursor-pointer ${
                      meetupPhase === 'TICKET'
                        ? 'border border-white/40 bg-white/15 text-white font-bold'
                        : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                    }`}
                  >
                    티켓·매칭
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetupPhase('VENUE_SEAT')}
                    className={`py-2 px-3 text-sm font-mono tracking-wider transition-all cursor-pointer ${
                      meetupPhase === 'VENUE_SEAT'
                        ? 'border border-white/40 bg-white/15 text-white font-bold'
                        : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                    }`}
                  >
                    식당·좌석
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetupPhase('LIVE_DECK')}
                    className={`py-2 px-3 text-sm font-mono tracking-wider transition-all cursor-pointer ${
                      meetupPhase === 'LIVE_DECK'
                        ? 'border border-white/40 bg-white/15 text-white font-bold'
                        : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                    }`}
                  >
                    대화카드
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetupPhase('POST_FEEDBACK')}
                    className={`py-2 px-3 text-sm font-mono tracking-wider transition-all cursor-pointer ${
                      meetupPhase === 'POST_FEEDBACK'
                        ? 'border border-white/40 bg-white/15 text-white font-bold'
                        : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                    }`}
                  >
                    평가·투표
                  </button>
                </div>
              </div>

              {/* [단계 1] 티켓 및 매칭 현황 (모노크롬 고대비) */}
              {meetupPhase === 'TICKET' && (
                <section className="bg-[#0c0d12] p-5 sm:p-6 border border-white/10 shadow-sm space-y-5">
                  <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                      <h3 className="font-serif-editorial text-xl font-normal text-white">내 모임</h3>
                    </div>
                    <span className="px-2.5 py-0.5 border border-white/20 bg-white/5 text-white text-sm font-mono font-semibold">
                      {myAppliedEvents.length > 0 ? `신청 ${myAppliedEvents.length}건` : '예정 모임 없음'}
                    </span>
                  </div>

                  {/* D-1 정밀 배정 프로파일러 완성도 배너 (Timeleft Big Five 심층 체크리스트) */}
                  {(() => {
                    const deepCount = Object.keys(surveyAnswers).filter((k) => k.startsWith('DEEP_')).length;
                    const isDeepComplete = deepCount >= 20;
                    return (
                      <div className="p-4 border border-white/15 bg-white/[0.03] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                            <span className="text-sm font-mono font-bold text-white">
                              {isDeepComplete
                                ? 'D-1 정밀 매칭 프로필 완료 (100%)'
                                : `D-1 정밀 매칭 프로필 미완성 (${deepCount}/24)`}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-300 font-light leading-relaxed">
                            {isDeepComplete
                              ? '타임레프트 Big Five 심층 성향과 가치관 분석이 완료되어 나에게 최적화된 6인 테이블이 자동 배정됩니다.'
                              : '모임 전 심층 24문항을 작성하면 나와 가치관·대화 결이 꼭 맞는 동석자가 우선 배정됩니다.'}
                          </p>
                        </div>
                        <Link
                          href="/checklist?mode=DEEP"
                          prefetch={true}
                          className="px-3.5 py-1.5 border border-white/20 bg-white/10 hover:bg-white/20 text-white text-sm font-mono font-medium transition-colors shrink-0"
                        >
                          {isDeepComplete ? '수정하기' : '정밀 체크 시작 →'}
                        </Link>
                      </div>
                    );
                  })()}

                  {myAppliedEvents.length === 0 ? (
                    <div className="p-6 sm:p-8 border border-white/10 bg-white/[0.02] text-center space-y-4">
                      <p className="font-serif-editorial text-lg text-white">
                        예정된 모임이 없습니다.
                      </p>
                      <p className="text-sm text-zinc-400 font-light">
                        모임을 신청하면 티켓, D-1 식당·좌석, 대화카드, 동석자 평가가 이곳에 순서대로 열립니다.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveProcessId('P05_EVENT_APPLY')}
                          className="px-4 py-2 border border-white/25 bg-white/10 hover:bg-white/15 text-white text-sm font-mono transition-colors cursor-pointer"
                        >
                          모임 찾기
                        </button>
                        <Link
                          href="/meetup"
                          prefetch={true}
                          className="px-4 py-2 border border-white/15 bg-black/40 hover:bg-white/10 text-zinc-200 hover:text-white text-sm font-mono transition-colors"
                        >
                          모임 둘러보기 →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {myAppliedEvents.map((ev) => (
                        <div key={ev.eventId} className="p-4 border border-white/10 bg-white/[0.02] space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                            <span className="px-2 py-0.5 bg-white/5 text-zinc-300 text-sm font-mono border border-white/10">
                              {ev.regionName || '전국'} · {ev.districtName || '상권'}
                            </span>
                            <span className="px-2 py-0.5 border border-white/20 bg-white/10 text-white text-sm font-mono font-bold">
                              신청완료
                            </span>
                          </div>
                          <h4 className="font-serif-editorial text-lg font-normal text-white">
                            {ev.title}
                          </h4>
                          <p className="text-sm text-zinc-300 font-mono">
                            {ev.dateText} • ₩{ev.priceKrw.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                            <button
                              type="button"
                              onClick={() => setMeetupPhase('VENUE_SEAT')}
                              className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-mono transition-colors cursor-pointer"
                            >
                              식당·좌석
                            </button>
                            <button
                              type="button"
                              onClick={() => setMeetupPhase('LIVE_DECK')}
                              className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-mono transition-colors cursor-pointer"
                            >
                              대화카드
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                const inviteUrl = `${origin}/meetup?invite=${encodeURIComponent(currentUser?.userId || '')}&event=${encodeURIComponent(ev.eventId)}`;
                                navigator.clipboard?.writeText(inviteUrl).catch(() => {});
                                showToast('+1 친구 초대 링크 복사됨');
                              }}
                              className="px-3 py-1.5 border border-[#f04f74]/50 bg-[#f04f74]/10 hover:bg-[#f04f74]/20 text-white text-sm font-mono transition-colors cursor-pointer"
                            >
                              +1 초대
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelOrRollover(ev, 'ROLLOVER')}
                              className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-mono transition-colors cursor-pointer"
                            >
                              이월
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelOrRollover(ev, 'CANCEL')}
                              className="px-3 py-1.5 border border-white/20 bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white text-sm font-mono transition-colors cursor-pointer"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* D-1 장소 비공개 상태 안내 카드 */}
                      <div className="p-4 bg-white/[0.02] border border-white/10 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-white font-mono text-sm font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                            <span>D-1 19:00 비공개 식당 및 좌석 안내</span>
                          </div>
                          <p className="text-sm text-zinc-400 font-normal leading-relaxed">
                            프라이빗 단독 룸으로 확정 안내되며, 식대 및 주류는 당일 현장에서 1/N 실비 정산합니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* [단계 2] D-1 식당 및 좌석 안내 (타임레프트 Reveal 상태 머신) */}
              {meetupPhase === 'VENUE_SEAT' && (() => {
                const primaryEv = myAppliedEvents[0];
                const assignedVenue = primaryEv
                  ? partnerVenues.find((v) => v.venueId === primaryEv.venueId)
                  : undefined;
                const hoursUntilEvent = primaryEv?.eventDate
                  ? (new Date(primaryEv.eventDate).getTime() - Date.now()) / (1000 * 60 * 60)
                  : Number.POSITIVE_INFINITY;
                const hasRevealNotif = notifications.some(
                  (n) =>
                    n.type === 'D1_REVEAL' &&
                    (!primaryEv || !n.event_id || n.event_id === primaryEv.eventId)
                );
                const isRevealed =
                  primaryEv?.status === 'CONFIRMED' ||
                  hasRevealNotif ||
                  (!Number.isNaN(hoursUntilEvent) && hoursUntilEvent <= 24);

                if (!isRevealed || reservationBlocksReveal) {
                  return (
                    <section className="bg-[#0c0d12] border border-white/10 p-8 space-y-5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                          <h3 className="font-serif-editorial text-xl font-normal text-white">
                            D-1 19:00 공개 대기 (Reveal 잠금)
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 border border-white/20 text-sm font-mono text-white">
                          비공개 보호중
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 font-light leading-relaxed">
                        {primaryEv
                          ? `[${primaryEv.title}] 일정의 6인 테이블과 제휴 식당을 배정하고 있습니다.`
                          : '예약하신 일정의 6인 테이블과 제휴 식당을 배정하고 있습니다.'}{' '}
                        식당 이름·위치 및 동석자 힌트(직군·연령대)는 모임 전날(D-1) 19:00에 공개되며, 사전 1:1 연락은 원천 차단됩니다.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-mono">
                        <div className="p-4 border border-white/10 bg-[#08090d]">
                          <span className="text-zinc-400 block mb-1">배정 식당</span>
                          <span className="text-white font-bold">D-1 19:00 공개 예정</span>
                        </div>
                        <div className="p-4 border border-white/10 bg-[#08090d]">
                          <span className="text-zinc-400 block mb-1">동석자 정보</span>
                          <span className="text-white font-bold">직군·연령대 힌트만 D-1 공개</span>
                        </div>
                      </div>
                    </section>
                  );
                }

                return (
                <section className="bg-[#0c0d12] border border-white/[0.08] p-8 border border-white/10 shadow-sm space-y-6">
                  <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif-editorial text-xl font-normal text-white">D-1 식당 및 좌석 배정 (Reveal)</h3>
                      <p className="text-sm text-zinc-400 mt-1 font-light">
                        확정된 제휴 식당 정보와 동석자 힌트 · 1부/2부 좌석 배치입니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSecondHalfRotated(!isSecondHalfRotated)}
                      className="px-4 py-2 rounded-none border border-white/15 bg-white/10 text-zinc-200 hover:bg-white/20 hover:text-white text-sm font-mono transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      {isSecondHalfRotated ? '2부 좌석 로테이션 중 (되돌리기)' : '2부 자리이동 시뮬레이션 (3자리 회전)'}
                    </button>
                  </div>

                  {/* 식당 안내 + 지도 길찾기 */}
                  <div className="p-6 rounded-none bg-white/[0.015] border border-white/[0.08] space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <span className="text-sm text-[#f04f74] font-mono">제휴 식당 확정</span>
                        <h4 className="font-serif-editorial text-lg font-normal text-white">
                          {reservationVenue?.name || primaryEv?.venueNameOverride || assignedVenue?.name || '제휴 프라이빗 다이닝'}
                        </h4>
                        <p className="text-sm text-zinc-400 font-light flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#f04f74] shrink-0" />
                          <span>
                            {reservationVenue?.address
                              ? `${reservationVenue.address} ${reservationVenue.addressDetail || ''}`.trim()
                              : `${primaryEv?.regionName || '서울'} ${primaryEv?.districtName || '강남구'} 제휴 살롱 (상세 주소 D-1 19:00 안내)`}
                          </span>
                        </p>
                        {(reservationVenue?.phone || reservationVenue?.guideNote) && (
                          <p className="text-xs text-zinc-300 font-mono">
                            {reservationVenue.phone ? `전화: ${reservationVenue.phone}` : ''}
                            {reservationVenue.phone && reservationVenue.guideNote ? ' · ' : ''}
                            {reservationVenue.guideNote ? `안내: ${reservationVenue.guideNote}` : ''}
                          </p>
                        )}
                        <p className="text-xs text-zinc-400 font-mono">
                          일정: {primaryEv?.dateText || '확정 일정'} · 현장 1/N 실비 정산 (인당 예상 3~5만원대)
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-sm text-zinc-300 font-mono bg-white/5 px-3 py-1.5 rounded-none border border-white/10">
                          예약자명: 나도솔로
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://map.naver.com/p/search/${encodeURIComponent(primaryEv?.venueNameOverride || assignedVenue?.name || '강남 파인다이닝')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-mono text-white inline-flex items-center gap-1"
                          >
                            <span>네이버지도</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://map.kakao.com/link/search/${encodeURIComponent(primaryEv?.venueNameOverride || assignedVenue?.name || '강남 파인다이닝')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-mono text-white inline-flex items-center gap-1"
                          >
                            <span>카카오맵</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* 익명 동석자 힌트 요약 (실매칭 방 동적 집계 우선, 미확정 시 폴백) */}
                    {(() => {
                      const rosterMembers = matchedRoster?.members || [];
                      const jobs = Array.from(
                        new Set(
                          rosterMembers
                            .map((m) => m.jobTitle)
                            .filter((j): j is string => Boolean(j && j.trim()))
                        )
                      ).slice(0, 4);
                      const ages = rosterMembers
                        .map((m) => new Date().getFullYear() - m.birthYear)
                        .filter((a) => a > 18 && a < 90);
                      const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
                      const mCount = rosterMembers.filter((m) => m.gender === 'M').length;
                      const fCount = rosterMembers.filter((m) => m.gender === 'F').length;

                      return (
                        <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                          <div className="p-3 bg-[#08090d] border border-white/10">
                            <span className="text-zinc-400 block mb-1">동석자 직군 힌트</span>
                            <span className="text-white font-semibold">
                              {jobs.length > 0 ? jobs.join(' · ') : 'IT · 디자인 · 전문직 · 창업'}
                            </span>
                          </div>
                          <div className="p-3 bg-[#08090d] border border-white/10">
                            <span className="text-zinc-400 block mb-1">평균 연령대 · 성비</span>
                            <span className="text-white font-semibold">
                              {avgAge > 0 ? `평균 ${avgAge}세 · ${fCount}:${mCount} 균형` : '30대 초중반 · 3:3 균형'}
                            </span>
                          </div>
                          <div className="p-3 bg-[#08090d] border border-white/10">
                            <span className="text-zinc-400 block mb-1">테이블 대화 결</span>
                            <span className="text-white font-semibold">
                              {matchedRoster?.purpose ? `${matchedRoster.purpose} 트랙 · 한국어 중심` : '깊이 중상 · 한국어 중심'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 당일 현장 도착 체크인 (사전 DM 없이 원클릭 상태 공유) */}
                  <div className="p-5 bg-[#08090d] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
                        <Clock className="w-4 h-4 text-[#f04f74]" />
                        <span>당일 도착 체크인</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        개인 연락처 공개 없이 테이블 동석자에게 도착/지연 상태를 즉시 알립니다.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {(
                        [
                          { id: 'ON_THE_WAY', label: '출발 중' },
                          { id: 'LATE_10', label: '10분 늦어요' },
                          { id: 'ARRIVED', label: '도착했어요!' },
                        ] as const
                      ).map((st) => {
                        const active = checkinStatus === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              persistLiveUxState({ checkin: st.id });
                              showToast(`현장 상태가 [${st.label}]로 테이블에 공유되었습니다.`);
                            }}
                            className={`px-3.5 py-2 border text-xs font-mono cursor-pointer transition-all ${
                              active
                                ? 'border-[#f04f74] bg-[#f04f74] text-white font-bold'
                                : 'border-white/20 bg-white/5 hover:bg-white/10 text-zinc-200'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 좌석 배치도 시각화 */}
                  <div className="p-8 border border-white/[0.08] bg-[#090a0f] space-y-8">
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="text-center text-sm text-zinc-400 font-mono">
                        {isSecondHalfRotated ? '【 2부 디저트 & 와인 타임 - 대화 상대 회전 배치 】' : '【 1부 메인 다이닝 - 첫인상 좌석 배치 】'}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {effectiveSeats.slice(0, 3).map((seat) => (
                          <div
                            key={seat.seatNumber}
                            className={`p-4 rounded-none border text-center space-y-1.5 transition-all ${
                              Boolean(currentUser?.userId && seat.userId === currentUser.userId)
                                ? 'bg-white/[0.03] border-[#f04f74]'
                                : 'bg-black/40 border-white/10'
                            }`}
                          >
                            <span className="text-sm text-zinc-400 font-mono block">좌석 {seat.seatNumber}</span>
                            <p className="text-sm font-medium text-white">
                              {Boolean(currentUser?.userId && seat.userId === currentUser.userId) ? `${seat.nickname} (나)` : seat.nickname}
                            </p>
                            <span className="text-sm text-zinc-400 block truncate font-light">{seat.pairingReason}</span>
                          </div>
                        ))}
                      </div>

                      {/* 테이블 중앙 바 */}
                      <div className="h-10 rounded-none bg-white/5 border border-white/10 flex items-center justify-center text-sm text-zinc-400 font-serif-editorial">
                        nadosolo private dining table (6 seats)
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {effectiveSeats.slice(3, 6).map((seat) => (
                          <div
                            key={seat.seatNumber}
                            className={`p-4 rounded-none border text-center space-y-1.5 transition-all ${
                              Boolean(currentUser?.userId && seat.userId === currentUser.userId)
                                ? 'bg-white/[0.03] border-[#f04f74]'
                                : 'bg-black/40 border-white/10'
                            }`}
                          >
                            <span className="text-sm text-zinc-400 font-mono block">좌석 {seat.seatNumber}</span>
                            <p className="text-sm font-medium text-white">
                              {Boolean(currentUser?.userId && seat.userId === currentUser.userId) ? `${seat.nickname} (나)` : seat.nickname}
                            </p>
                            <span className="text-sm text-zinc-400 block truncate font-light">{seat.pairingReason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                );
              })()}

              {/* [단계 3] 현장 대화카드 */}
              {meetupPhase === 'LIVE_DECK' && (
                <section className="bg-[#0c0d12] border border-white/[0.08] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-white/[0.08] pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif-editorial text-xl font-normal text-white">현장 대화카드 모드</h3>
                      <p className="text-sm text-zinc-400 mt-1 font-light">
                        어색한 침묵 없이 자연스럽게 깊은 대화를 이끌어주는 라운드별 질문 카드입니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDeckViewType('SLIDE')}
                        className={`px-3 py-1.5 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-colors ${
                          deckViewType === 'SLIDE' ? 'border border-white/30 bg-white/10 text-white font-medium' : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                        }`}
                      >
                        카드 넘기기
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeckViewType('LIST')}
                        className={`px-3 py-1.5 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-colors ${
                          deckViewType === 'LIST' ? 'border border-white/30 bg-white/10 text-white font-medium' : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                        }`}
                      >
                        전체 보기
                      </button>
                    </div>
                  </div>

                  {/* 카드 슬라이더 */}
                  {deckViewType === 'SLIDE' ? (
                    filteredDeckCards[safeCardIdx] && (
                      <div className="p-10 border border-white/[0.08] bg-white/[0.015] text-center space-y-6 max-w-xl mx-auto shadow-2xl">
                        <span className="px-3.5 py-1 rounded-none text-zinc-300 text-sm font-mono border border-white/10">
                          라운드 {safeCardIdx + 1} / {filteredDeckCards.length}
                        </span>
                        <h4 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white leading-relaxed">
                          "{filteredDeckCards[safeCardIdx].promptText}"
                        </h4>
                        <p className="text-sm text-zinc-400 font-light">
                          {filteredDeckCards[safeCardIdx].title}
                        </p>
                        <div className="flex items-center justify-center gap-4 pt-4">
                          <button
                            type="button"
                            disabled={safeCardIdx === 0}
                            onClick={() => setCurrentCardIdx((prev) => Math.max(0, prev - 1))}
                            className="px-6 py-2.5 rounded-none bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-sm font-mono cursor-pointer"
                          >
                            ← 이전 질문
                          </button>
                          <button
                            type="button"
                            disabled={safeCardIdx >= filteredDeckCards.length - 1}
                            onClick={() => setCurrentCardIdx((prev) => Math.min(filteredDeckCards.length - 1, prev + 1))}
                            className="px-6 py-2.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-sm font-mono tracking-wider uppercase font-medium transition-all duration-300"
                          >
                            다음 질문 →
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredDeckCards.map((c, idx) => (
                        <div key={c.cardId} className="p-5 rounded-none bg-white/[0.015] border border-white/[0.08] space-y-2">
                          <span className="text-sm text-[#f04f74] font-mono">QUESTION {idx + 1}</span>
                          <h5 className="font-serif-editorial text-base font-normal text-white">{c.title}</h5>
                          <p className="text-sm text-zinc-300 font-light leading-relaxed">"{c.promptText}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* [단계 4] 모임 종료 후 매너평가 & 투표 */}
              {meetupPhase === 'POST_FEEDBACK' && (
                <section className="bg-[#0c0d12] border border-white/[0.08] p-6 sm:p-8 space-y-8">
                  <div className="border-b border-white/[0.08] pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif-editorial text-xl font-normal text-white">모임 후 매너평가 &amp; 시크릿 호감 투표</h3>
                      <p className="text-sm text-zinc-400 mt-1 font-light">
                        오늘 함께한 테이블 동석자 5명에게 익명 매너 피드백을 전달하고, 설레는 호감을 투표합니다.
                      </p>
                    </div>
                    <span className="text-sm text-[#f04f74] bg-transparent px-3 py-1.5 rounded-none border border-[#f04f74]/25 font-mono">
                      익명 100% 보장
                    </span>
                  </div>

                  {/* 시크릿 투표 */}
                  <div className="p-6 rounded-none bg-white/[0.015] border border-white/[0.08] space-y-4">
                    <h4 className="font-serif-editorial text-base font-normal text-white">오늘 밤 가장 마음이 통했던 이성 1인 투표</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {effectivePeers
                        .filter((p) => p.gender !== (currentUser?.gender ?? 'F'))
                        .map((peer) => (
                        <button
                          key={peer.userId}
                          type="button"
                          onClick={() => {
                            setMyVoteTargetId(peer.userId);
                            setMyVoteCategory('ROMANCE');
                          }}
                          className={`p-4 rounded-none border text-left transition-all cursor-pointer ${
                            myVoteTargetId === peer.userId
                              ? 'bg-[#f04f74] border-[#f04f74] text-white shadow-md shadow-[#f04f74]/20'
                              : 'bg-[#08090d] border-white/10 text-zinc-300 hover:text-white'
                          }`}
                        >
                          <p className="font-serif-editorial text-base font-normal">{peer.nickname}</p>
                          <p className="text-sm text-zinc-400 font-light mt-0.5">
                            {peer.gender === 'F' ? '여성' : '남성'} · {peer.birthYear}년생
                          </p>
                        </button>
                      ))}
                    </div>
                    {myVoteTargetId && (
                      <p className="text-sm text-[#f04f74] font-medium">
                        ✓ 투표가 등록되었습니다. 자정(24:00) 이후 상호 매칭 결과가 대시보드에 공개됩니다.
                      </p>
                    )}
                  </div>

                  {/* 사후 다중 Connect (성별 무관 · 계속 교류하고 싶은 동석자 선택) */}
                  <div className="p-6 rounded-none bg-white/[0.015] border border-white/[0.08] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-serif-editorial text-base font-normal text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#f04f74]" />
                          <span>계속 교류하고 싶은 멤버 선택 (다중 Connect)</span>
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          성별과 무관하게 친구·커리어·취향 교류를 이어가고 싶은 분을 선택하세요. 쌍방 선택 시에만 연락 채널이 열립니다.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-zinc-300 border border-white/15 px-2.5 py-1">
                        {connectTargets.length}명 선택됨
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {effectivePeers.map((peer) => {
                        const isConnected = connectTargets.includes(peer.userId);
                        const peerWantsMe = Boolean(
                          currentUser?.userId &&
                            sessionLiveMap[peer.userId]?.connects?.includes(currentUser.userId)
                        );
                        const isMutualConnect = isConnected && peerWantsMe;
                        return (
                          <button
                            key={`conn-${peer.userId}`}
                            type="button"
                            onClick={() => {
                              const next = isConnected
                                ? connectTargets.filter((id) => id !== peer.userId)
                                : [...connectTargets, peer.userId];
                              persistLiveUxState({ connects: next });
                              showToast(
                                isConnected
                                  ? `${peer.nickname}님 Connect 선택 해제`
                                  : `${peer.nickname}님 Connect 요청 저장`
                              );
                            }}
                            className={`p-3 border text-left transition-all cursor-pointer ${
                              isMutualConnect
                                ? 'border-emerald-400 bg-emerald-500/15 text-white'
                                : isConnected
                                ? 'border-[#f04f74] bg-[#f04f74]/15 text-white'
                                : 'border-white/10 bg-[#08090d] text-zinc-300 hover:border-white/25 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{peer.nickname}</span>
                              {isMutualConnect ? (
                                <span className="text-[11px] font-mono text-emerald-300 font-bold">쌍방 성사!</span>
                              ) : (
                                isConnected && <CheckCircle2 className="w-4 h-4 text-[#f04f74]" />
                              )}
                            </div>
                            <span className="text-xs text-zinc-400 font-mono">
                              {peer.gender === 'F' ? '여성' : '남성'} · {peer.birthYear}년생
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 디너 후 2차 애프터 라운지 (Last Drink) 공개 */}
                  <div className="p-6 rounded-none bg-[#08090d] border border-white/15 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Wine className="w-4 h-4 text-[#f04f74]" />
                          <span className="text-xs font-mono text-[#f04f74] font-bold">
                            21:30 OPEN · AFTER-PARTY LOUNGE
                          </span>
                        </div>
                        <h4 className="font-serif-editorial text-lg font-normal text-white">
                          2차 애프터 라운지 (Last Drink)
                        </h4>
                        <p className="text-sm text-zinc-400 font-light">
                          식사 종료 후 같은 지역의 다른 나도솔로 테이블 멤버들과 가볍게 한 잔(또는 논알콜 티) 더 나누는 자율 합류 공간입니다.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            persistLiveUxState({ afterParty: 'JOIN' });
                            showToast('2차 애프터 라운지 참석 의사가 등록되었습니다.');
                          }}
                          className={`px-4 py-2 border text-xs font-mono font-bold cursor-pointer transition-all ${
                            afterPartyRsvp === 'JOIN'
                              ? 'border-[#f04f74] bg-[#f04f74] text-white'
                              : 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                          }`}
                        >
                          참석할게요
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            persistLiveUxState({ afterParty: 'PASS' });
                            showToast('오늘은 1차 식사로 마무리합니다.');
                          }}
                          className={`px-4 py-2 border text-xs font-mono cursor-pointer transition-all ${
                            afterPartyRsvp === 'PASS'
                              ? 'border-white/40 bg-white/15 text-white font-bold'
                              : 'border-white/15 bg-transparent text-zinc-400 hover:text-white'
                          }`}
                        >
                          이번엔 패스
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-[#0c0d12] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-zinc-400 block">오늘의 제휴 라운지</span>
                        <span className="text-white font-bold text-sm">
                          {currentUser?.residenceCity === '부산'
                            ? '전포 살롱 바 루프탑 (서면역 8번 출구 도보 5분)'
                            : '바 아틀리에 라운지 (강남역 11번 출구 도보 4분)'}
                        </span>
                      </div>
                      <a
                        href={`https://map.naver.com/p/search/${encodeURIComponent(currentUser?.residenceCity === '부산' ? '부산 서면 라운지 바' : '강남 라운지 바')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 border border-white/20 text-white hover:bg-white/10 inline-flex items-center gap-1"
                      >
                        <span>라운지 위치</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* 노쇼 신고 & 영구 재매칭 차단 */}
                  <div className="p-6 rounded-none bg-white/[0.015] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-serif-editorial text-base font-normal text-white">
                        결석(노쇼) 신고 · 재매칭 차단
                      </h4>
                      <span className="text-sm font-mono text-zinc-400">차단 시 향후 영구 미배정</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {effectivePeers.map((peer) => {
                        const isBlocked = blockedPeerIds.includes(peer.userId);
                        return (
                          <div
                            key={`blk-${peer.userId}`}
                            className="p-3 border border-white/10 bg-[#08090d] flex items-center justify-between gap-2 text-sm font-mono"
                          >
                            <span className="text-white truncate">{peer.nickname}</span>
                            {isBlocked ? (
                              <span className="px-2 py-0.5 border border-white/20 text-zinc-400">
                                차단됨
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleReportPeer(peer.userId, 'NO_SHOW')}
                                  className="px-2.5 py-1 border border-white/20 hover:bg-white/10 text-white cursor-pointer"
                                >
                                  노쇼
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReportPeer(peer.userId, 'UNCOMFORTABLE')}
                                  className="px-2.5 py-1 border border-white/20 hover:bg-white/10 text-white cursor-pointer"
                                >
                                  차단
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------
              [P02] 내 정보 모듈 (프로필 / 성향 진단 / 계정 관리)
              ---------------------------------------------------------- */}
          {(currentProcess?.processId === 'P02_PROFILE' ||
            currentProcess?.processId === 'P01_ACCOUNT') && (
            <div className="space-y-6">
              {/* 프로필설정 서브 탭 (프로필 / 성향 진단 / 계정 관리) */}
              <div className="bg-[#0c0d12] p-1 rounded-none border border-white/[0.08] grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setProfileSubTab('BASIC')}
                  className={`py-2.5 rounded-none text-sm font-mono tracking-wider transition-all cursor-pointer ${
                    profileSubTab === 'BASIC'
                      ? 'border border-white/30 bg-white/10 text-white font-medium'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  프로필
                </button>
                <button
                  type="button"
                  onClick={() => setProfileSubTab('SELF_DIAG')}
                  className={`py-2.5 rounded-none text-sm font-mono tracking-wider transition-all cursor-pointer ${
                    profileSubTab === 'SELF_DIAG'
                      ? 'border border-white/30 bg-white/10 text-white font-medium'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  성향 진단
                </button>
                <button
                  type="button"
                  onClick={() => setProfileSubTab('ACCOUNT')}
                  className={`py-2.5 rounded-none text-sm font-mono tracking-wider transition-all cursor-pointer ${
                    profileSubTab === 'ACCOUNT'
                      ? 'border border-white/30 bg-white/10 text-white font-medium'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  계정 관리
                </button>
              </div>

              {profileSubTab === 'BASIC' ? (
                <section className="bg-[#0c0d12] border border-white/[0.08] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-white/[0.08] pb-4">
                    <h3 className="font-serif-editorial text-xl font-normal text-white">기본 프로필</h3>
                    <p className="text-sm text-zinc-400 mt-1 font-light">
                      모임 배정 및 레스토랑 식단 준비에 사용되는 기본 조건입니다.
                    </p>
                  </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-mono text-zinc-400 mb-2">
                    성별
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditGender('F')}
                      className={`py-3 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-all ${
                        editGender === 'F'
                          ? 'border border-white/40 bg-white/10 text-white font-medium'
                          : 'bg-[#08090d] text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white font-normal'
                      }`}
                    >
                      여성 (F)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditGender('M')}
                      className={`py-3 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-all ${
                        editGender === 'M'
                          ? 'border border-white/40 bg-white/10 text-white font-medium'
                          : 'bg-[#08090d] text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white font-normal'
                      }`}
                    >
                      남성 (M)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-mono text-zinc-400 mb-2">
                    출생연도
                  </label>
                  <input
                    type="number"
                    value={editBirthYear}
                    onChange={(e) =>
                      setEditBirthYear(Number(e.target.value) || 1995)
                    }
                    className="w-full px-4 py-3 rounded-none border border-white/15 bg-black/40 text-sm font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-zinc-400 mb-2">
                    직업 / 분야
                  </label>
                  <input
                    type="text"
                    value={editJob}
                    onChange={(e) => setEditJob(e.target.value)}
                    className="w-full px-4 py-3 rounded-none border border-white/15 bg-black/40 text-sm font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-zinc-400 mb-2.5">
                  음식 · 주류 취향 (해당 시 선택)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: 'VEGAN' as const, label: '비건' },
                      { key: 'ALCOHOL_FREE' as const, label: '논알콜' },
                    ]
                  ).map((item) => {
                    const active = dietary === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setDietary(active ? 'NONE' : item.key)}
                        className={`px-4 py-2 rounded-none text-sm font-mono tracking-wider border transition-all cursor-pointer ${
                          active
                            ? 'border-white/40 bg-white/15 text-white font-bold'
                            : 'bg-[#08090d] text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-zinc-400 mb-2.5">
                  관심사 키워드
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(INTEREST_LABELS) as InterestTag[]).map(
                    (tag) => {
                      const active = interests.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleInterest(tag)}
                          className={`px-3.5 py-2 rounded-none text-sm font-mono tracking-wider border transition-all cursor-pointer ${
                            active
                              ? 'border-white/40 bg-white/10 text-white font-medium'
                              : 'bg-[#08090d] text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {INTEREST_LABELS[tag]}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* 내 생활권 · 위치 정보 (시/도 -> 시/군/구 -> 읍/면/동 -> 상세 주소) */}
              <div className="pt-4 border-t border-white/[0.08] space-y-4">
                <div>
                  <label className="block text-sm font-mono text-zinc-200 font-medium">
                    내 생활권 · 위치
                  </label>
                  <p className="text-sm text-zinc-400 mt-0.5 font-light">
                    시/도, 시/군/구, 읍/면/동까지 입력하면 가까운 생활권 테이블 매칭에 반영됩니다.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-mono text-zinc-400 mb-1.5">시 / 도</label>
                    <select
                      value={editResidenceCity}
                      onChange={(e) => setEditResidenceCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-white/15 bg-[#08090d] text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    >
                      {[
                        '서울',
                        '부산',
                        '대구',
                        '인천',
                        '광주',
                        '대전',
                        '울산',
                        '세종',
                        '경기',
                        '강원',
                        '충북',
                        '충남',
                        '전북',
                        '전남',
                        '경북',
                        '경남',
                        '제주',
                      ].map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-zinc-400 mb-1.5">시 / 군 / 구</label>
                    <input
                      type="text"
                      value={editResidenceDistrict}
                      onChange={(e) => setEditResidenceDistrict(e.target.value)}
                      placeholder="예: 강남구, 해운대구"
                      className="w-full px-3.5 py-2.5 border border-white/15 bg-[#08090d] text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-zinc-400 mb-1.5">읍 / 면 / 동</label>
                    <input
                      type="text"
                      value={editResidenceDong}
                      onChange={(e) => setEditResidenceDong(e.target.value)}
                      placeholder="예: 역삼동, 우동"
                      className="w-full px-3.5 py-2.5 border border-white/15 bg-[#08090d] text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-mono text-zinc-400 mb-1.5">
                    상세 주소 / 주요 역세권 (선택)
                  </label>
                  <input
                    type="text"
                    value={editResidenceAddress}
                    onChange={(e) => setEditResidenceAddress(e.target.value)}
                    placeholder="예: 강남역 인근 / 해운대 센텀시티 인근"
                    className="w-full px-3.5 py-2.5 border border-white/15 bg-[#08090d] text-sm font-mono text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {/* 희망 참가 목적 (엔진 2층 4대 목적 풀 직결) */}
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <div>
                  <label className="block text-sm font-mono text-zinc-200 font-medium">
                    희망 모임 목적
                  </label>
                  <p className="text-sm text-zinc-400 mt-0.5 font-light">
                    선택한 목적에 맞는 테이블로 우선 배정됩니다.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { code: 'FRIEND' as const, label: '친구·사회적 교류', desc: '관계상태 무관 · 폭넓은 소통' },
                    { code: 'RESET' as const, label: '지적 환기·리셋', desc: '기혼·리더 환영 · 연애 목적 배제' },
                    { code: 'TASTE' as const, label: '취향·활동 공유', desc: '와인·미식·독서 등 공통 취향' },
                    { code: 'ROMANCE' as const, label: '인연·동반자', desc: '미혼·싱글 한정 · 진지한 만남' },
                  ].map((item) => {
                    const active = editPreferredPurpose === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setEditPreferredPurpose(item.code)}
                        className={`p-3.5 text-left border transition-all cursor-pointer ${
                          active
                            ? 'border-white/40 bg-white/10 text-white'
                            : 'border-white/10 bg-[#08090d] text-zinc-400 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <div className="text-sm font-mono font-bold text-white">{item.label}</div>
                        <div className="text-sm text-zinc-400 mt-0.5 font-light">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    updateCurrentUser({
                      gender: editGender,
                      birthYear: editBirthYear,
                      jobTitle: editJob,
                      residenceCity: editResidenceCity,
                      residenceDistrict: editResidenceDistrict.trim(),
                      residenceDong: editResidenceDong.trim(),
                      residenceAddress: editResidenceAddress.trim(),
                      preferredPurpose: editPreferredPurpose,
                    });
                    showToast('기본프로필 및 희망 조건이 저장되었습니다.');
                  }}
                  className="px-6 py-3 rounded-none border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/40 text-white text-sm font-mono tracking-wider uppercase font-medium transition-all duration-300"
                >
                  기본프로필 저장
                </button>
              </div>
            </section>
          ) : profileSubTab === 'SELF_DIAG' ? (
            <section className="bg-[#0c0d12] border border-white/[0.08] p-6 sm:p-8 space-y-6">
              {/* 소통 성향 자가진단 (5문항) 상단 배너 */}
              <div className="p-5 bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <span className="text-sm font-mono text-[#f04f74] font-medium">
                      {Object.keys(surveyAnswers).length >= 4 ? '소통 성향 자가진단 완료' : '소통 성향 자가진단 필요'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 font-light">
                    {Object.keys(surveyAnswers).length >= 4
                      ? '6인의 식탁 매칭과 기준선 측정을 위한 성향 질문지가 완료되었습니다.'
                      : '테이블 3:3 균형 매칭을 위해 5개 문항의 소통 성향 진단을 진행해 주세요.'}
                  </p>
                </div>
                <Link
                  href="/checklist"
                  prefetch={true}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-mono transition-colors shrink-0"
                >
                  {Object.keys(surveyAnswers).length >= 4 ? '성향 다시 진단' : '자가진단 시작'}
                </Link>
              </div>

              <div className="border-b border-white/[0.08] pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif-editorial text-xl font-normal text-white">
                    자가진단 (5대 대분류)
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1 font-light">
                    본인이 생각하는 자신의 5대 영역(외모 · 스타일 · 음성 · 대화 · 매너) 점수를 입력합니다. 모임 후 동석자 평가 점수와 비교됩니다.
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {majorDomains.map((dom, idx) => (
                    <button
                      key={dom.code}
                      type="button"
                      onClick={() => setSelfStepIdx(idx)}
                      className={`px-3 py-1.5 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-all ${
                        selfStepIdx === idx
                          ? 'border border-white/40 bg-white/10 text-white font-medium'
                          : 'bg-[#08090d] text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white font-normal'
                      }`}
                    >
                      {idx + 1}. {dom.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5대 대분류 능동 선택 탭 (1클릭 즉시 전환) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {majorDomains.map((dom, idx) => {
                  const isSelected = selfStepIdx === idx;
                  return (
                    <button
                      key={dom.code}
                      type="button"
                      onClick={() => setSelfStepIdx(idx)}
                      className={`p-3 border text-center cursor-pointer transition-all ${
                        isSelected
                          ? 'border-white/40 bg-white/15 text-white'
                          : 'border-white/10 bg-[#0c0d12] hover:border-white/20 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <p className={`text-sm font-mono ${isSelected ? 'text-[#f04f74] font-bold' : 'text-zinc-400'}`}>
                        {dom.label}
                      </p>
                      <p className="text-lg font-bold text-white mt-0.5 font-mono">
                        {selfDomainScores100[dom.code]}점
                      </p>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const activeDom = majorDomains[selfStepIdx] ?? majorDomains[0];
                const domSubs = subElements.filter(
                  (s) => s.majorCode === activeDom.code
                );
                const currentVal = selfDomainScores100[activeDom.code] ?? 80;

                return (
                  <div className="bg-[#0c0d12] p-5 sm:p-6 border border-white/10 space-y-5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                          <h4 className="font-serif-editorial text-lg font-normal text-white">
                            [{activeDom.label}] 자가진단
                          </h4>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1 font-normal">
                          포함 항목:{' '}
                          {domSubs.map((s) => s.label).join(' · ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-2xl font-bold text-white">
                          {currentVal}점
                        </span>
                        <span className="text-sm font-mono text-zinc-500 block">
                          / 100점
                        </span>
                      </div>
                    </div>

                    <div>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        step={4}
                        value={currentVal}
                        onChange={(e) =>
                          setSelfDomainScore100(
                            activeDom.code,
                            Number(e.target.value)
                          )
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-sm font-mono text-zinc-400 mt-2">
                        <span>40점 (보완)</span>
                        <span>60점 (보통)</span>
                        <span>80점 (우수)</span>
                        <span>100점 (최상)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>
          ) : (
            <div className="space-y-6">
              {/* 1. 기본 계정정보 및 연락처 관리 */}
              <section className="bg-[#0c0d12] border border-white/10 p-5 sm:p-6 shadow-sm space-y-5">
                <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <h3 className="font-serif-editorial text-lg font-normal text-white">기본 계정정보</h3>
                  </div>
                  <span className="px-2.5 py-0.5 border border-white/15 bg-white/5 text-zinc-300 text-sm font-mono">
                    인증 계정
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-mono text-zinc-400 mb-1.5 font-normal">
                      아이디
                    </label>
                    <input
                      type="text"
                      value={editHandle}
                      onChange={(e) =>
                        setEditHandle(
                          e.target.value.startsWith('@')
                            ? e.target.value
                            : `@${e.target.value}`
                        )
                      }
                      className="w-full px-3.5 py-2.5 border border-white/15 bg-black/40 text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-zinc-400 mb-1.5 font-normal">
                      닉네임
                    </label>
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-white/15 bg-black/40 text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-zinc-400 mb-1.5 flex items-center gap-1 font-normal">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span>이메일</span>
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="예: user@example.com"
                      className="w-full px-3.5 py-2.5 border border-white/15 bg-black/40 text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-zinc-400 mb-1.5 flex items-center gap-1 font-normal">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>연락처</span>
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="예: 010-1234-5678"
                      className="w-full px-3.5 py-2.5 border border-white/15 bg-black/40 text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      updateCurrentUser({
                        handle: editHandle,
                        email: editEmail,
                        nickname: editNickname,
                        phone: editPhone,
                      });
                      showToast('계정정보가 저장되었습니다.');
                    }}
                    className="px-6 py-2 border border-white/30 bg-white/15 hover:bg-white/25 text-white text-sm font-mono font-semibold transition-colors cursor-pointer"
                  >
                    저장
                  </button>
                </div>
              </section>

              {/* 2. 비밀번호 수정 섹션 */}
              <section className="bg-[#0c0d12] border border-white/[0.08] p-6 sm:p-8 space-y-5">
                <div className="border-b border-white/[0.08] pb-4">
                  <h3 className="font-serif-editorial text-xl font-normal text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-zinc-400" />
                    <span>비밀번호 수정</span>
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1 font-light">
                    로그인에 사용되는 비밀번호를 안전하게 변경합니다.
                  </p>
                </div>

                {pwNotice && (
                  <div className="p-3 rounded-none bg-white/5 border border-white/15 text-sm text-white flex items-center gap-2 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-[#f04f74]" />
                    <span>{pwNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-mono">
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-normal">현재 비밀번호</label>
                    <input
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="현재 비밀번호"
                      className="w-full px-3.5 py-2.5 rounded-none border border-white/15 bg-black/40 text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-normal">새 비밀번호</label>
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="6자리 이상"
                      className="w-full px-3.5 py-2.5 rounded-none border border-white/15 bg-black/40 text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-normal">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="새 비밀번호 재입력"
                      className="w-full px-3.5 py-2.5 rounded-none border border-white/15 bg-black/40 text-sm font-mono text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    className="px-5 py-2.5 rounded-none bg-white/10 hover:bg-white/20 text-white text-sm font-mono tracking-wider uppercase font-medium transition-colors cursor-pointer"
                  >
                    비밀번호 변경
                  </button>
                </div>

                {/* 3. 회원탈퇴 미니멀 링크 */}
                <div className="pt-8 mt-8 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-mono">
                  <span className="text-zinc-500 text-sm">
                    계정 파기 및 서비스 탈퇴가 필요하신가요?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 underline decoration-zinc-700 underline-offset-4 cursor-pointer text-left sm:text-right text-sm transition-colors"
                  >
                    회원 탈퇴
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

          {/* ----------------------------------------------------------
              [P04] 지역선택 모듈 (권역 > 상권 > 제휴 매장 확인)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P04_REGION' && (
            <section className="bg-[#0c0d12] border border-white/[0.08] p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif-editorial text-xl font-normal text-white">지역선택</h3>
                  <p className="text-sm text-zinc-400 mt-1 font-light">
                    오프라인 만남이 진행될 권역과 세부 상권을 선택합니다.
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['전체', '서울', '경기', '부산'].map((rName) => (
                    <button
                      key={rName}
                      type="button"
                      onClick={() => setSelectedRegionFilter(rName)}
                      className={`px-3.5 py-1.5 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-all ${
                        selectedRegionFilter === rName
                          ? 'border border-white/40 bg-white/10 text-white font-medium'
                          : 'bg-[#08090d] text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {rName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regionDistricts
                  .filter(
                    (d) =>
                      d.active &&
                      (selectedRegionFilter === '전체' ||
                        d.regionName === selectedRegionFilter)
                  )
                  .map((dist) => {
                    const selected = selectedDistrictId === dist.districtId;
                    return (
                      <div
                        key={dist.districtId}
                        onClick={() => setSelectedDistrictId(dist.districtId)}
                        className={`p-5 rounded-none border transition-all cursor-pointer ${
                          selected
                            ? 'border-white/50 bg-white/[0.015] ring-1 ring-white/30 shadow-lg'
                            : 'border-white/10 bg-white/[0.015] hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 rounded-none bg-[#08090d] text-zinc-300 text-sm font-mono border border-white/10">
                            {dist.regionName}
                          </span>
                          <span className="text-sm font-mono text-zinc-400">
                            {dist.defaultGatherTime}
                          </span>
                        </div>
                        <h4 className="font-serif-editorial text-lg font-normal text-white mb-1">
                          {dist.districtName}
                        </h4>
                        <p className="text-sm text-zinc-400 font-light">
                          {dist.description}
                        </p>
                      </div>
                    );
                  })}
              </div>

              {/* 제휴 매장 목록 */}
              <div className="pt-4 border-t border-white/10">
                <h4 className="font-serif-editorial text-base font-normal text-white mb-3">
                  등록된 제휴 매장 ({partnerVenues.length}곳)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partnerVenues.map((v) => (
                    <div
                      key={v.venueId}
                      className="p-4 rounded-none bg-white/[0.015] border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-serif-editorial text-base font-normal text-white">{v.name}</p>
                        <p className="text-sm text-zinc-400 mt-1 font-light">
                          지원 식단: {v.supportedDietary.join(', ')} · 최대{' '}
                          {v.maxTablesPerNight}테이블
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-none bg-[#08090d] border border-white/10 text-sm font-mono text-zinc-300">
                        {v.budgetTier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              [P05] 모임신청 모듈 (2열 컴팩트 그리드 & 고대비 모노크롬)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P05_EVENT_APPLY' && (
            <section className="bg-[#0c0d12] border border-white/10 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h3 className="font-serif-editorial text-xl font-normal text-white">소셜 다이닝 신청</h3>
                  <span className="px-2 py-0.5 text-sm font-mono border border-white/10 bg-white/5 text-zinc-300">
                    {conditionalEvents.length}개 테이블
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono">
                  <span className="text-zinc-400">내 매너 점수:</span>
                  <span className="px-2 py-0.5 border border-white/20 bg-white/5 text-white font-bold">
                    {myPersonalDossier.totalScore100}점
                  </span>
                </div>
              </div>

              {applyFeedback && (
                <div
                  className={`p-3 text-sm font-medium border ${
                    applyFeedback.ok
                      ? 'bg-white/5 text-white border-white/20'
                      : 'bg-white/5 text-zinc-200 border-white/30'
                  }`}
                >
                  {applyFeedback.message}
                </div>
              )}

              {/* 2열 컴팩트 그리드로 한 화면 조망 (관리자 대시보드 규격 준수) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {conditionalEvents.map((ev) => {
                  const dist = regionDistricts.find(
                    (d) => d.districtId === ev.districtId
                  );
                  const isApplied = appliedEventIds.includes(ev.eventId);

                  return (
                    <div
                      key={ev.eventId}
                      className="p-4 border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors flex flex-col justify-between space-y-3.5"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-white/10 text-white text-sm font-semibold border border-white/20">
                              {dist ? dist.regionName : '부산'}
                            </span>
                            <span className="px-2 py-0.5 bg-white/5 text-zinc-300 text-sm font-mono border border-white/10">
                              5060 골든
                            </span>
                            <span className="px-2 py-0.5 text-zinc-300 text-sm font-mono border border-white/10">
                              {ev.mode === 'ROMANCE'
                                ? '3:3 로맨스'
                                : ev.mode === 'ONE_ON_ONE'
                                ? '1:1 매칭'
                                : '소셜 다이닝'}
                            </span>
                          </div>
                          <span className="text-sm font-mono text-zinc-300">
                            {ev.dateText}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <h4 className="font-serif-editorial text-lg font-normal text-white">
                            {ev.title}
                          </h4>
                          <span className="px-2 py-0.5 text-sm font-mono border border-white/20 bg-white/10 text-white shrink-0">
                            {ev.status === 'CONFIRMED'
                              ? '확정'
                              : ev.status === 'CLOSING_SOON'
                              ? '마감임박'
                              : ev.status === 'CANCELLED_MIN'
                              ? '미달취소'
                              : ev.status === 'COMPLETED'
                              ? '종료'
                              : '모집중'}
                          </span>
                        </div>

                        {ev.reason && (
                          <p className="text-sm text-zinc-200 font-light">
                            {ev.reason}
                          </p>
                        )}

                        {/* 식대 안내 */}
                        <p className="text-sm text-zinc-400 font-normal leading-relaxed">
                          {ev.mealNote || '식음료 비용은 당일 식당 현장에서 테이블 1/N 실비 카드 결제합니다.'}
                        </p>

                        {/* 참가 조건 태그 */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {ev.minTotalScore100 > 0 ? (
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-zinc-300 text-sm font-mono">
                              조건: {ev.minTotalScore100}점 이상
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-zinc-300 text-sm font-mono">
                              신청 가능
                            </span>
                          )}
                          {ev.requiredBadgeIds.map((bId) => {
                            const badge = granularBadges.find((b) => b.badgeId === bId);
                            const hasIt = myPersonalDossier.earnedBadgeIds.includes(bId);
                            return (
                              <span
                                key={bId}
                                className={`px-2 py-0.5 text-sm font-mono border ${
                                  hasIt
                                    ? 'bg-white/10 border-white/30 text-white font-semibold'
                                    : 'bg-white/5 border-white/10 text-zinc-500'
                                }`}
                              >
                                {badge?.name ?? bId} {hasIt ? '(보유)' : '(미보유)'}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* 하단 가격 및 신청 버튼 바 */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.08]">
                        <div>
                          <span className="text-lg font-bold text-white font-mono">
                            ₩{ev.priceKrw.toLocaleString()}
                          </span>
                          <span className="text-sm text-zinc-400 ml-1.5 font-mono">
                            (식대 별도 1/N)
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isApplied || ev.status === 'CANCELLED_MIN' || ev.status === 'COMPLETED'}
                          onClick={() => {
                            if (isApplied || ev.status === 'CANCELLED_MIN' || ev.status === 'COMPLETED') return;
                            setCheckoutEvent({
                              eventId: ev.eventId,
                              title: ev.title,
                              dateText: ev.dateText,
                              priceKrw: ev.priceKrw,
                              districtName: dist ? dist.regionName : '부산',
                              mealNote: ev.mealNote,
                              refundPolicy: ev.refundPolicy,
                              deadlineText: ev.deadlineText,
                            });
                            setIsCheckoutOpen(true);
                          }}
                          className={`px-4 py-1.5 text-sm font-mono transition-colors cursor-pointer font-semibold ${
                            isApplied || ev.status === 'CANCELLED_MIN' || ev.status === 'COMPLETED'
                              ? 'border border-white/10 text-zinc-500 bg-transparent cursor-not-allowed'
                              : 'border border-white/30 bg-white/15 hover:bg-white/25 text-white'
                          }`}
                        >
                          {isApplied
                            ? '완료'
                            : ev.status === 'CANCELLED_MIN'
                            ? '미달취소'
                            : ev.status === 'COMPLETED'
                            ? '종료'
                            : '신청하기'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              [P06] 좌석배정 모듈 (테이블 및 1부/2부 좌석 확인)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P06_SEAT' && (
            <section className="bg-[#0c0d12] border border-white/[0.08] p-8 border border-white/10 shadow-sm space-y-6">
              {dashConfig?.heroImage && (
                <div className="relative rounded-none overflow-hidden h-48 border border-white/10">
                  <img
                    src={dashConfig.heroImage}
                    alt="Venue"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                    <span className="text-sm font-bold uppercase tracking-widest text-zinc-300">
                      ASSIGNED VENUE
                    </span>
                    <h3 className="text-2xl font-bold">
                      {activeTable?.assignedVenue?.name ??
                        '성수 까브 내추럴 와인바'}
                    </h3>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    좌석배정
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {(() => {
                      const appliedEv = conditionalEvents.find((e) => appliedEventIds.includes(e.eventId));
                      return appliedEv
                        ? `[${appliedEv.title}] • ${appliedEv.dateText} • 1부 착석 및 2부 로테이션 좌석`
                        : '1부 착석 위치와 2부 하프타임 로테이션 좌석을 확인합니다.';
                    })()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSecondHalfRotated(false)}
                    className={`px-4 py-2.5 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-all ${
                      !isSecondHalfRotated
                        ? 'border border-white/30 bg-white/10 text-white font-medium'
                        : 'bg-white/[0.015] text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    1부 좌석
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSecondHalfRotated(true)}
                    className={`px-4 py-2.5 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-all ${
                      isSecondHalfRotated
                        ? 'border border-white/30 bg-white/10 text-white font-medium'
                        : 'bg-white/[0.015] text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    2부 로테이션 좌석
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentSeats.map((seat) => {
                  const member = activeTable?.participants.find(
                    (p) => p.userId === seat.userId
                  );
                  const isMe = Boolean(currentUser?.userId && seat.userId === currentUser.userId);
                  return (
                    <div
                      key={seat.seatNumber}
                      className={`p-5 rounded-none border ${
                        isMe
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/10 bg-[#0c0d12]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 rounded-full bg-[#08090d] text-white text-sm font-mono">
                          {seat.seatNumber}번 좌석
                        </span>
                        <span className="text-sm font-medium text-zinc-400">
                          {member?.gender === 'F' ? '여성' : '남성'} ·{' '}
                          {member?.birthYear}년생
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-white">
                        {seat.nickname} {isMe && '(나)'}
                      </p>
                      <p className="text-sm text-zinc-400 mt-1">
                        {seat.pairingReason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              [P07] 대화카드 모듈 (이전/다음 양방향 슬라이드 + 전체 목록 보기 전환)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P07_DECK' && (
            <section className="bg-[#0c0d12] border border-white/[0.08] p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">대화카드</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    이전/다음 카드로 자유롭게 이동하거나 전체 카드 목록을 한눈에 볼 수 있습니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* 테마 필터 */}
                  {(['ALL', 'ROMANCE', 'THEME'] as const).map((mKey) => (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => {
                        setDeckModeFilter(mKey);
                        setCurrentCardIdx(0);
                      }}
                      className={`px-3.5 py-2 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-all ${
                        deckModeFilter === mKey
                          ? 'border border-white/30 bg-white/10 text-white font-medium'
                          : 'bg-white/[0.015] text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {mKey === 'ALL'
                        ? '전체'
                        : mKey === 'ROMANCE'
                        ? '로맨스'
                        : '미식·테마'}
                    </button>
                  ))}
                  {/* 보기 방식 전환 */}
                  <button
                    type="button"
                    onClick={() =>
                      setDeckViewType((v) =>
                        v === 'SLIDE' ? 'LIST' : 'SLIDE'
                      )
                    }
                    className="px-3.5 py-2 rounded-none bg-[#08090d] text-white text-sm font-bold cursor-pointer"
                  >
                    {deckViewType === 'SLIDE'
                      ? '전체 목록 보기'
                      : '슬라이드 보기'}
                  </button>
                </div>
              </div>

              {deckViewType === 'SLIDE' ? (
                filteredDeckCards.length > 0 ? (
                  <div className="space-y-6">
                    {/* 카드 번호 탭 바로가기 */}
                    <div className="flex flex-wrap gap-2">
                      {filteredDeckCards.map((c, idx) => (
                        <button
                          key={c.cardId}
                          type="button"
                          onClick={() => setCurrentCardIdx(idx)}
                          className={`px-3.5 py-1.5 rounded-none text-sm font-bold cursor-pointer ${
                            safeCardIdx === idx
                              ? 'bg-[#08090d] text-white'
                              : 'bg-white/[0.015] text-zinc-400 hover:bg-[#252b3d]'
                          }`}
                        >
                          카드 {idx + 1}: {c.title}
                        </button>
                      ))}
                    </div>

                    {/* 현재 카드 상세 */}
                    {(() => {
                      const card = filteredDeckCards[safeCardIdx];
                      return (
                        <div className="p-8 border border-white/[0.08] bg-white/[0.015] border-2 border-white/10 space-y-5">
                          <div className="flex items-center justify-between">
                            <span className="px-3.5 py-1 rounded-none bg-white/5 border border-white/10 text-zinc-400 text-sm font-mono">
                              CARD {safeCardIdx + 1} / {filteredDeckCards.length}
                            </span>
                            <span className="text-sm text-zinc-400">
                              {card.modes.join(' · ')}
                            </span>
                          </div>
                          <h4 className="text-2xl font-bold text-white">
                            {card.title}
                          </h4>
                          <p className="text-lg text-zinc-300 leading-relaxed">
                            {card.promptText}
                          </p>
                          {card.balanceOptions &&
                            card.balanceOptions.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {card.balanceOptions.map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className="p-4 rounded-none bg-[#0c0d12] border border-white/10 text-base font-medium text-zinc-200"
                                  >
                                    <span className="text-zinc-500 font-mono mr-2">
                                      선택 {oIdx === 0 ? 'A' : 'B'}.
                                    </span>
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      );
                    })()}

                    {/* 양방향 카드 이동 버튼 */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={safeCardIdx === 0}
                        onClick={() =>
                          setCurrentCardIdx((p) => Math.max(0, p - 1))
                        }
                        className="px-6 py-3 rounded-none border border-white/10 bg-[#08090d] text-zinc-400 hover:text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        이전 카드
                      </button>
                      <span className="text-sm font-mono text-zinc-400">
                        {safeCardIdx + 1} / {filteredDeckCards.length}
                      </span>
                      <button
                        type="button"
                        disabled={safeCardIdx === filteredDeckCards.length - 1}
                        onClick={() =>
                          setCurrentCardIdx((p) =>
                            Math.min(filteredDeckCards.length - 1, p + 1)
                          )
                        }
                        className="px-6 py-3 rounded-none border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-sm font-mono tracking-wider uppercase font-semibold disabled:opacity-40 cursor-pointer transition-all duration-300"
                      >
                        다음 카드
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400">등록된 대화카드가 없습니다.</p>
                )
              ) : (
                /* 전체 목록 보기 모드 */
                <div className="space-y-4">
                  {filteredDeckCards.map((card, idx) => (
                    <div
                      key={card.cardId}
                      className="p-6 rounded-none bg-white/[0.015] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-zinc-500">
                          CARD {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCardIdx(idx);
                            setDeckViewType('SLIDE');
                          }}
                          className="text-sm font-bold text-zinc-400 underline cursor-pointer"
                        >
                          슬라이드로 크게 보기
                        </button>
                      </div>
                      <h4 className="text-lg font-bold text-white">
                        {card.title}
                      </h4>
                      <p className="text-sm text-zinc-300">{card.promptText}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ----------------------------------------------------------
              [P08] 다면평가 모듈 (상호주의 잠금 & 고대비 모노크롬)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P08_EVALUATION' && (
            <section className="bg-[#0c0d12] border border-white/10 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <div>
                    <h3 className="font-serif-editorial text-xl font-normal text-white">
                      다면평가
                    </h3>
                    {(() => {
                      const appliedEv = conditionalEvents.find((e) => appliedEventIds.includes(e.eventId));
                      return appliedEv ? (
                        <span className="text-sm font-mono text-zinc-400">
                          대상 모임: {appliedEv.title} ({appliedEv.dateText})
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="px-2.5 py-0.5 border border-white/10 bg-white/5 text-zinc-300">
                    완료: <strong className="text-white">{completedEvalUserIds.length}</strong> / 5명
                  </span>
                  {completedEvalUserIds.length >= 5 ? (
                    <button
                      type="button"
                      onClick={() => setActiveProcessId('P10_REPORT')}
                      className="px-3 py-1 border border-white/30 bg-white/15 hover:bg-white/25 text-white text-sm font-mono font-bold transition-all cursor-pointer"
                    >
                      리포트 열람
                    </button>
                  ) : (
                    <span className="px-2.5 py-0.5 border border-white/20 bg-white/5 text-zinc-300 text-sm font-semibold">
                      잠금상태
                    </span>
                  )}
                </div>
              </div>

              {/* 1. 동석자 선택 버튼 */}
              <div>
                <label className="block text-sm font-mono text-zinc-400 mb-2">
                  동석자 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {tablePeers.map((peer) => {
                    const isDone = completedEvalUserIds.includes(peer.userId);
                    const isSelected = evalTargetUserId === peer.userId;
                    return (
                      <button
                        key={peer.userId}
                        type="button"
                        onClick={() => setEvalTargetUserId(peer.userId)}
                        className={`px-3.5 py-1.5 text-sm font-mono tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'border-white/40 bg-white/15 text-white font-bold'
                            : isDone
                            ? 'bg-white/5 text-zinc-300 border-white/10 hover:border-white/20'
                            : 'bg-black/40 text-zinc-400 border-white/10 hover:text-white'
                        }`}
                      >
                        <span>{peer.nickname}</span>
                        {isDone && <span className="text-sm text-zinc-400">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 5060 골든 단일 명사 5대 항목 평가 폼 (품격, 온화, 공감, 인품, 예절) */}
              <div className="space-y-2.5">
                {track5060Elements.map((el) => {
                  const currentScore = draftSingleNounScores[el.id] ?? 5;
                  return (
                    <div
                      key={el.id}
                      className="p-3.5 bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-white font-mono">
                          #{el.anchorNoun}
                        </span>
                        <p className="text-sm text-zinc-300 font-normal">
                          {el.question}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {([1, 2, 3, 4, 5] as const).map((stepVal) => (
                          <button
                            key={stepVal}
                            type="button"
                            onClick={() =>
                              setDraftSingleNounScores((prev) => ({
                                ...prev,
                                [el.id]: stepVal,
                              }))
                            }
                            className={`w-8 h-8 text-sm font-mono transition-all cursor-pointer ${
                              currentScore === stepVal
                                ? 'border border-white/40 bg-white/20 text-white font-bold'
                                : 'bg-[#0c0d12] text-zinc-400 border border-white/10 hover:text-white hover:border-white/20'
                            }`}
                          >
                            {stepVal}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 저장 알림 및 액션 버튼 */}
              {evalSavedMsg && (
                <div className="p-3 bg-white/5 border border-white/20 text-white text-sm font-mono font-medium">
                  {evalSavedMsg}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
                <span className="text-sm text-zinc-400 font-mono">
                  전원 완료 시 리포트 자동 해금
                </span>
                <button
                  type="button"
                  onClick={() => {
                    track5060Elements.forEach((el) => {
                      submitParticipantObservation(
                        evalTargetUserId,
                        'MOD_TRACK_5060',
                        el.id,
                        draftSingleNounScores[el.id] ?? 5
                      );
                    });
                    const targetPeer = tablePeers.find((p) => p.userId === evalTargetUserId);
                    setEvalSavedMsg(`${targetPeer?.nickname ?? evalTargetUserId} 평가 완료`);
                    setTimeout(() => setEvalSavedMsg(null), 2000);

                    // 다음 미완료 동석자로 자동 전환
                    const remainingPeers = tablePeers.filter(
                      (p) => p.userId !== evalTargetUserId && !completedEvalUserIds.includes(p.userId)
                    );
                    if (remainingPeers.length > 0) {
                      setEvalTargetUserId(remainingPeers[0].userId);
                    }
                  }}
                  className="px-6 py-2 border border-white/30 bg-white/15 hover:bg-white/25 text-white text-sm font-mono font-bold transition-colors cursor-pointer"
                >
                  저장
                </button>
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              [P09] 매칭투표 모듈 (시크릿 투표 및 자정 상호 매칭 결과)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P09_VOTE' && (
            <section className="bg-[#0c0d12] border border-white/[0.08] p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">매칭투표</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    다시 만나고 싶은 동석자를 선택하면 자정(00:00)에 상호 매칭 결과가 공개됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMidnightPassed((p) => !p)}
                  className="px-4 py-2 rounded-none bg-[#08090d] text-white text-sm font-bold cursor-pointer"
                >
                  {isMidnightPassed ? '자정(00:00) 공개 완료' : '자정 이전 대기'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tablePeers.map((peer) => {
                  const selected = myVoteTargetId === peer.userId;
                  return (
                    <div
                      key={peer.userId}
                      onClick={() => setMyVoteTargetId(peer.userId)}
                      className={`p-5 rounded-none border cursor-pointer transition-all ${
                        selected
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/10 bg-[#08090d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white">
                          {peer.nickname}
                        </span>
                        <span className="text-sm font-medium text-zinc-400">
                          {peer.gender === 'F' ? '여성' : '남성'} ·{' '}
                          {peer.birthYear}년생
                        </span>
                      </div>
                      {selected && (
                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMyVoteCategory('ROMANCE');
                            }}
                            className={`px-3 py-1.5 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-all ${
                              myVoteCategory === 'ROMANCE'
                                ? 'border border-white/40 bg-white/10 text-white font-medium'
                                : 'bg-black/40 text-zinc-400 border border-white/10 hover:text-white'
                            }`}
                          >
                            1:1 로맨스 호감
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMyVoteCategory('DINING_FRIEND');
                            }}
                            className={`px-3 py-1.5 rounded-none text-sm font-mono tracking-wider cursor-pointer transition-all ${
                              myVoteCategory === 'DINING_FRIEND'
                                ? 'border border-white/40 bg-white/10 text-white font-medium'
                                : 'bg-black/40 text-zinc-400 border border-white/10 hover:text-white'
                            }`}
                          >
                            미식 친구 호감
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-6 rounded-none bg-white/[0.015] border border-white/10">
                <h4 className="text-base font-bold text-white mb-2">
                  자정 상호 매칭 결과
                </h4>
                {visibleMatchesForMe.length > 0 ? (
                  <div className="space-y-2">
                    {visibleMatchesForMe.map((m, idx) => {
                      const myId = currentUser?.userId ?? '';
                      const partnerId = m.userA === myId ? m.userB : m.userA;
                      const partner = activeTable?.participants.find(
                        (p) => p.userId === partnerId
                      );
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-none bg-black/40 border border-white/15 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-base font-semibold text-white">
                              {partner?.nickname ?? partnerId}님과 상호 매칭되었습니다
                            </p>
                            <p className="text-sm text-zinc-400 mt-0.5">
                              매칭 유형: {m.matchedCategory}
                            </p>
                          </div>
                          <span className="px-3.5 py-1.5 rounded-none border border-[#f04f74] bg-transparent text-[#f04f74] font-semibold text-sm font-semibold">
                            1:1 연결 가능
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">
                    자정(00:00) 이후 상호 지목된 상대가 공개됩니다.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              [P10] 코칭리포트 모듈 (5×5×5 100점 성적표 + 오각형 5기준 지표 + 뱃지 도감)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P10_REPORT' && (
            <section className="bg-[#0c0d12] border border-white/[0.08] p-6 sm:p-8 space-y-8">
              <div className="border-b border-white/[0.08] pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-mono text-zinc-500 uppercase tracking-[0.25em]">
                    METALOGUE SOCIAL DOSSIER
                  </span>
                  <h3 className="font-serif-editorial text-2xl font-normal text-white mt-1">
                    모임 평가
                  </h3>
                </div>
              </div>

              {/* 상호주의 해금 원칙에 따른 잠금 처리 (헌법 규칙 1 적용) */}
              {!personalSocialDossier.unlocked ? (
                <ProcessGateLockedCard
                  title="소셜 코칭 리포트 상호주의 잠금"
                  badgeLabel="상호주의 해금 원칙"
                  description="동석자 전원에 대한 관찰 평가를 100% 완료해야 타인의 시선으로 관찰된 나의 소셜 프로필이 잠금 해제됩니다."
                  subDescription="헌법 제3조 제1항: 일방적인 평가 열람(무임승차)을 원천 차단하고 상호 신뢰와 데이터 진실성을 보장하기 위해 상호주의 원칙이 엄격히 적용됩니다."
                  progressText={`진행도: ${completedEvalUserIds.length} / 5명 완료`}
                  actionLabel="동석자 평가"
                  onAction={() => setActiveProcessId('P00_MEETUP_STATUS')}
                />
              ) : (
                <>
                  {/* 상호주의 해금 원칙 배너 (헌법 규칙 1 적용) */}
                  <div className="p-4 border border-white/20 bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                        <span className="text-sm font-mono font-bold text-white">
                          상호주의 해금 완료
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 font-normal leading-relaxed">
                        동석자 전원 평가를 완료하여 타인의 시선으로 관찰된 소셜 프로필이 잠금 해제되었습니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm text-zinc-400 font-mono">핵심 앵커:</span>
                      {personalSocialDossier.topStrengths.map((str) => (
                        <span key={str} className="px-2 py-0.5 bg-white/10 text-white border border-white/20 text-sm font-mono font-bold">
                          #{str}
                        </span>
                      ))}
                    </div>
                  </div>

              {/* 1. 종합 점수 & 이성/동성 분리 점수 카드 (2열/3열 컴팩트 조망) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-5 bg-white/[0.02] border border-white/10 relative space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-zinc-400 font-semibold">
                      종합 지표
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  </div>
                  <p className="text-sm text-zinc-300 font-normal">
                    5대 영역 종합 평균
                  </p>
                  <div className="pt-1 flex items-baseline gap-1.5">
                    <span className="font-serif-editorial text-4xl sm:text-5xl font-normal text-white tracking-tight">
                      {myPersonalDossier.totalScore100}
                    </span>
                    <span className="text-sm font-mono text-zinc-400 font-normal">
                      / 100점
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-white/[0.015] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-zinc-400 font-semibold">
                      이성 관찰
                    </span>
                    <span className="text-sm font-mono text-zinc-400">3인</span>
                  </div>
                  <p className="text-sm text-zinc-300 font-normal">
                    이성 동석자 평가 지표
                  </p>
                  <div className="pt-1 flex items-baseline gap-1.5">
                    <span className="font-serif-editorial text-4xl sm:text-5xl font-normal text-white tracking-tight">
                      {myPersonalDossier.oppositeSexTotal100}
                    </span>
                    <span className="text-sm font-mono text-zinc-400 font-normal">
                      / 100점
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-white/[0.015] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-zinc-400 font-semibold">
                      동성 관찰
                    </span>
                    <span className="text-sm font-mono text-zinc-400">2인</span>
                  </div>
                  <p className="text-sm text-zinc-300 font-normal">
                    동성 동석자 평가 지표
                  </p>
                  <div className="pt-1 flex items-baseline gap-1.5">
                    <span className="font-serif-editorial text-4xl sm:text-5xl font-normal text-white tracking-tight">
                      {myPersonalDossier.sameSexTotal100}
                    </span>
                    <span className="text-sm font-mono text-zinc-400 font-normal">
                      / 100점
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 5대 대분류(외모·스타일·음성·대화·매너) 100점 성적표 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif-editorial text-base font-normal text-white">
                    1. 5대 영역 다면 성적표
                  </h4>
                  <span className="text-sm font-mono text-zinc-500">
                    각 20점 × 5중분류 = 100점 만점
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {myPersonalDossier.domainSummaries.map((dom) => (
                    <div
                      key={dom.majorCode}
                      className="p-4 rounded-none bg-white/[0.015] border border-white/[0.08] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-zinc-300 font-medium">
                          {dom.label}
                        </span>
                        <span className="text-sm font-mono text-zinc-500">
                          이성 {dom.oppositeSexScore100}점
                        </span>
                      </div>
                      <p className="font-serif-editorial text-2xl font-normal text-white">
                        {dom.score100}
                        <span className="text-sm font-mono text-zinc-500 ml-1 font-normal">점</span>
                      </p>
                      <p className="text-sm font-mono text-zinc-500">
                        자가 {dom.selfScore100}점 · 편차{' '}
                        <span className={dom.gapScore >= 0 ? 'text-zinc-300' : 'text-zinc-500'}>
                          {dom.gapScore >= 0 ? `+${dom.gapScore}` : dom.gapScore}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 모듈별 단일 명사 관찰 지표 (100점 정규화) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif-editorial text-base font-normal text-white">
                    2. 관찰 모듈 지표
                  </h4>
                  <span className="text-sm font-mono text-zinc-500">
                    단일 명사 1:1 관찰 100점 정규화
                  </span>
                </div>
                <div className="space-y-4">
                  {personalSocialDossier.moduleReports.map((mod) => (
                    <div
                      key={mod.moduleId}
                      className="p-5 rounded-none bg-white/[0.015] border border-white/[0.08] space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                        <span className="text-sm font-mono text-zinc-300 font-medium">{mod.moduleName}</span>
                        <span className="text-sm font-mono text-zinc-400">
                          종합 <span className="text-white font-medium">{mod.totalScore100}점</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                        {mod.elementScores.map((el) => (
                          <div
                            key={el.elementId}
                            className="p-3 rounded-none bg-[#0c0d12] border border-white/[0.06] text-center"
                          >
                            <p className="text-sm font-mono font-medium text-zinc-300">
                              #{el.anchorNoun}
                            </p>
                            <p className="font-serif-editorial text-xl font-normal text-white mt-0.5">
                              {el.score100}
                              <span className="text-sm font-mono text-zinc-500 ml-0.5 font-normal">점</span>
                            </p>
                            <p className="text-sm font-mono text-zinc-500 mt-0.5">
                              평균 {el.rawAverageStep}단계
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. 핀포인트 사각지대 코칭 처방 & 강점 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 sm:p-6 rounded-none bg-white/[0.015] border border-white/[0.08] space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <h5 className="font-serif-editorial text-sm font-normal text-white">
                      동석자가 꼽은 결정적 강점 요소
                    </h5>
                  </div>
                  {myPersonalDossier.topStrengthElements.map((el) => {
                    const subDef = subElements.find(
                      (s) => s.id === el.subElementId
                    );
                    const dom = majorDomains.find(
                      (d) => d.code === el.majorCode
                    );
                    return (
                      <div
                        key={el.subElementId}
                        className="p-3.5 rounded-none bg-[#0c0d12] border border-white/[0.06] space-y-1.5"
                      >
                        <div className="flex justify-between text-sm font-mono">
                          <span className="text-zinc-300">
                            [{dom?.label} › {el.label}]
                          </span>
                          <span className="text-white font-medium">{el.score20} / 20점</span>
                        </div>
                        <p className="text-sm text-zinc-400 font-light leading-relaxed">
                          {subDef?.coachingHintHigh}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-5 sm:p-6 rounded-none bg-white/[0.015] border border-white/[0.08] space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    <h5 className="font-serif-editorial text-sm font-normal text-white">
                      1:1 매칭 확률을 높이는 디테일 교정 포인트
                    </h5>
                  </div>
                  {myPersonalDossier.blindSpotElements.map((el) => {
                    const subDef = subElements.find(
                      (s) => s.id === el.subElementId
                    );
                    const dom = majorDomains.find(
                      (d) => d.code === el.majorCode
                    );
                    return (
                      <div
                        key={el.subElementId}
                        className="p-3.5 rounded-none bg-[#0c0d12] border border-white/[0.06] space-y-1.5"
                      >
                        <div className="flex justify-between text-sm font-mono">
                          <span className="text-zinc-300">
                            [{dom?.label} › {el.label}]
                          </span>
                          <span className="text-zinc-400">{el.score20} / 20점</span>
                        </div>
                        <p className="text-sm text-zinc-400 font-light leading-relaxed">
                          {subDef?.coachingHintLow}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. 획득한 세분화 뱃지 도감 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif-editorial text-base font-normal text-white">
                    3. 세분화 뱃지 도감
                  </h4>
                  <span className="text-sm font-mono text-zinc-500">
                    {myPersonalDossier.earnedBadgeIds.length} / {granularBadges.length} 획득
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {granularBadges.map((b) => {
                    const earned = myPersonalDossier.earnedBadgeIds.includes(
                      b.badgeId
                    );
                    return (
                      <div
                        key={b.badgeId}
                        className={`p-4 rounded-none border transition-all ${
                          earned
                            ? 'bg-white/[0.03] border-white/20'
                            : 'bg-[#0c0d12] border-white/[0.04] opacity-35'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-mono text-zinc-400">뱃지</span>
                          <span
                            className={`px-2 py-0.5 text-sm font-mono tracking-wider border ${
                              earned
                                ? 'border-white/30 bg-white/10 text-white font-bold'
                                : 'bg-white/5 text-zinc-500 border-white/10'
                            }`}
                          >
                            {earned ? '획득' : '미획득'}
                          </span>
                        </div>
                        <p className="font-serif-editorial text-base font-normal text-white">
                          {b.name}
                        </p>
                        <p className="text-sm text-zinc-400 mt-1 font-light leading-relaxed">
                          {b.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. 품질 점검 (공간 · 식사 · 진행) */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <h4 className="font-serif-editorial text-lg font-normal text-white">
                      품질 점검
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 border border-white/10 bg-white/5 text-sm font-mono text-zinc-300">
                      종합 점수: <strong className="text-white font-bold">{fullJourneyAudit.totalAuditScore100}점</strong>
                    </span>
                    <span className={`px-2.5 py-0.5 text-sm font-mono font-bold border ${
                      fullJourneyAudit.verifiedPartnerEligible
                        ? 'bg-white/10 text-white border-white/30'
                        : 'bg-white/5 text-zinc-400 border-white/10'
                    }`}>
                      {fullJourneyAudit.verifiedPartnerEligible ? '인증' : '점검'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  
                  {/* 기둥 1: 식당 공간 점검 */}
                  <div className="p-4 bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        <span className="text-sm font-bold text-white">공간</span>
                      </div>
                      <span className="text-base font-bold text-white font-mono">
                        {fullJourneyAudit.placeReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-2">
                      {fullJourneyAudit.placeReport.elementScores.map((el) => (
                        <div key={el.elementId} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300 font-medium">#{el.anchorNoun}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-sm font-mono">{el.rawAverageStep}단계</span>
                            <span className="font-mono font-bold text-white">{el.score100}점</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 기둥 2: 식사 미식 점검 */}
                  <div className="p-4 bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        <span className="text-sm font-bold text-white">식사</span>
                      </div>
                      <span className="text-base font-bold text-white font-mono">
                        {fullJourneyAudit.mealReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-2">
                      {fullJourneyAudit.mealReport.elementScores.map((el) => (
                        <div key={el.elementId} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300 font-medium">#{el.anchorNoun}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-sm font-mono">{el.rawAverageStep}단계</span>
                            <span className="font-mono font-bold text-white">{el.score100}점</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 기둥 3: 가변 진행 점검 */}
                  <div className="p-4 bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        <span className="text-sm font-bold text-white">진행</span>
                      </div>
                      <span className="text-base font-bold text-white font-mono">
                        {fullJourneyAudit.flowReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-2">
                      {fullJourneyAudit.flowReport.elementScores.map((el) => (
                        <div key={el.elementId} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300 font-medium">#{el.anchorNoun}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-sm font-mono">{el.rawAverageStep}단계</span>
                            <span className="font-mono font-bold text-white">{el.score100}점</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </section>
          )}
        </div>

      {/* 토스페이먼츠 참가권 결제 & 주문 확인 모달 */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={checkoutEvent}
        onSuccessPayment={handlePaymentSuccess}
      />

      {/* 회원탈퇴 확인 모달 (와인레드 테마) */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#140d12] border border-white/20 border border-white/[0.08] p-6 sm:p-7 shadow-2xl text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-[#f04f74]">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-xl font-bold text-white">회원 탈퇴 확인</h3>
            </div>

            <div className="text-sm text-zinc-300 space-y-2 leading-relaxed bg-black/40 p-4 rounded-none border border-white/5">
              <p>• 탈퇴 시 현재 계정에 등록된 <strong>성향 프로필(NBTI), 매너 평가 점수, 모임 티켓</strong>이 즉시 영구 삭제됩니다.</p>
              <p>• 삭제된 데이터는 복구할 수 없습니다.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-zinc-300 font-semibold">
                탈퇴를 확인하기 위해 아래에 <strong className="text-[#f04f74]">&apos;회원탈퇴&apos;</strong>를 입력하세요:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="회원탈퇴"
                className="w-full px-3.5 py-2.5 rounded-none border border-white/20 bg-black/60 text-sm text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-none bg-white/10 hover:bg-white/15 text-sm font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAccountDeletion}
                disabled={deleteConfirmText.trim() !== '회원탈퇴'}
                className="px-5 py-2 rounded-none bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors cursor-pointer border border-white/15"
              >
                탈퇴 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}

export default function MemberDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1280px] mx-auto px-6 py-16 text-center text-zinc-400">
          로딩 중...
        </div>
      }
    >
      <MemberDashboardContent />
    </Suspense>
  );
}
