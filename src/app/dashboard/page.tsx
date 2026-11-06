'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
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
import { KeyRound, UserX, AlertCircle, CheckCircle2, ShieldAlert, Phone, Mail } from 'lucide-react';

const DIETARY_LABELS: Record<DietaryRestriction, string> = {
  NONE: '일반식',
  VEGAN: '비건',
  HALAL: '할랄',
  NO_PORK: '돼지고기 제외',
  ALCOHOL_FREE: '논알콜',
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
  const [profileSubTab, setProfileSubTab] = useState<'BASIC' | 'SELF_DIAG'>('BASIC');

  useEffect(() => {
    if (stepQuery) {
      if (stepQuery === 'P05_EVENT_APPLY' || stepQuery === 'P06_SEAT' || stepQuery === 'P07_DECK' || stepQuery === 'P08_EVALUATION' || stepQuery === 'P09_VOTE') {
        setActiveProcessId('P00_MEETUP_STATUS');
        if (stepQuery === 'P06_SEAT') setMeetupPhase('VENUE_SEAT');
        if (stepQuery === 'P07_DECK') setMeetupPhase('LIVE_DECK');
        if (stepQuery === 'P08_EVALUATION' || stepQuery === 'P09_VOTE') setMeetupPhase('POST_FEEDBACK');
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
        });
        setIsCheckoutOpen(true);
      }
    }
  }, [stepQuery, eventIdQuery, conditionalEvents, appliedEventIds, regionDistricts]);

  // 현재 선택된 모듈이 비활성화되었을 경우 첫 번째 모듈로 폴백
  const currentProcess =
    enabledModules.find((m) => m.processId === activeProcessId) ??
    enabledModules[0];

  const currentProcessIdx = enabledModules.findIndex(
    (m) => m.processId === currentProcess?.processId
  );

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
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // [비밀번호 변경 로컬 상태]
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwNotice, setPwNotice] = useState<string | null>(null);

  // [회원탈퇴 모달 상태]
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // [연락처 세팅 필요 여부]
  const needsPhoneSetup = !currentUser?.phone || currentUser.phone.trim() === '' || currentUser.phone === '010-0000-0000';
  const needsEmailSetup = !currentUser?.email || currentUser.email.trim() === '';

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
    () => (activeTable?.participants ?? []).filter((p) => p.userId !== 'U01'),
    [activeTable]
  );
  const [evalTargetUserId, setEvalTargetUserId] = useState<string>('U04');
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
    EL_3040_QUESTION: 4,
    EL_3040_LISTEN: 4,
    EL_3040_EXPRESSION: 4,
    EL_3040_SENSE: 4,
    EL_3040_CONSIDERATION: 4,
  });

  const track3040Elements = [
    { id: 'EL_3040_QUESTION', anchorNoun: '질문', question: '상대방의 관심사를 이끌어내는 질문을 하는가?' },
    { id: 'EL_3040_LISTEN', anchorNoun: '경청', question: '상대방의 말을 끊지 않고 끝까지 경청하는가?' },
    { id: 'EL_3040_EXPRESSION', anchorNoun: '표현', question: '자신의 생각과 취향을 명확하고 솔직하게 표현하는가?' },
    { id: 'EL_3040_SENSE', anchorNoun: '센스', question: '상황과 대화 흐름에 맞게 유연한 태도를 보이는가?' },
    { id: 'EL_3040_CONSIDERATION', anchorNoun: '배려', question: '테이블 전체가 소외되지 않도록 고루 배려하는가?' },
  ];

  const [evalSavedMsg, setEvalSavedMsg] = useState<string | null>(null);

  const dashConfig = cmsPages.find((p) => p.pageId === 'PAGE_DASHBOARD');

  const showToast = (msg: string) => {
    setSaveNotice(msg);
    setTimeout(() => setSaveNotice(null), 2500);
  };

  if (!currentUser) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-[#111111] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-2xl text-center space-y-5 text-white">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-white !text-2xl">
              lock
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">로그인이 필요합니다</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            모임 신청, 대화카드 열람, 개인화 코칭 리포트 확인은 회원 로그인 후 이용하실 수 있습니다.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href={`/auth?next=${encodeURIComponent(
                stepQuery ? `/dashboard?step=${stepQuery}` : '/dashboard'
              )}`}
              className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold transition-all shadow-md"
            >
              로그인 / 회원가입 하러 가기
            </Link>
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium transition-colors"
            >
              ← 메인 화면으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1380px] mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* ============================================================
            좌측 사이드바: 서비스 프로세스 단일 모듈 (1모듈 1기능)
            ============================================================ */}
        <aside className="w-full lg:w-64 shrink-0 bg-[#12151e] rounded-3xl border border-white/10 p-5 shadow-sm lg:sticky lg:top-24">
          <div className="px-3 pb-4 mb-3 border-b border-white/10">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1">
              PROCESS MODULES
            </p>
            <h1 className="text-lg font-bold text-white">
              {currentUser ? `${currentUser.nickname} (${currentUser.handle})` : '지수 (@jisoo_kim)'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              종합 프로파일 {myPersonalDossier.totalScore100}점 · 뱃지{' '}
              {myPersonalDossier.earnedBadgeIds.length}개
            </p>
          </div>

          <nav className="space-y-1.5">
            {enabledModules.map((mod) => {
              const active = currentProcess?.processId === mod.processId;
              return (
                <button
                  key={mod.processId}
                  type="button"
                  onClick={() => setActiveProcessId(mod.processId)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? 'bg-white/10 text-white font-bold border border-white/20 shadow-sm'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 hover:text-white border border-white/5 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-zinc-600'}`} />
                    <span className="text-sm">{mod.label}</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    {active ? '●' : '›'}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
            <Link
              href="/mirror"
              className="block w-full py-2.5 px-4 rounded-xl bg-[#10131c] text-white text-center text-xs font-bold hover:bg-stone-700 transition-colors"
            >
              코칭리포트 전체 화면 →
            </Link>
            <Link
              href="/"
              className="block w-full py-2.5 px-4 rounded-xl bg-[#1c202e] text-zinc-300 text-center text-xs font-bold hover:bg-[#252b3d] transition-colors"
            >
              ← 메인 화면으로 이동
            </Link>
          </div>
        </aside>

        {/* ============================================================
            우측 메인 워크스페이스 (선택된 단일 모듈 실행 화면)
            ============================================================ */}
        <div className="flex-1 w-full min-w-0 space-y-6">
          
          {/* [5번 요구사항] 연락처 세팅 유도 배너 (휴대폰 번호 미등록 시) */}
          {(needsPhoneSetup || needsEmailSetup) && (
            <div className="p-4 rounded-2xl bg-[#181c28] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    모임 장소 및 좌석 안내 SMS 수신을 위해 연락처를 등록해주세요
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    모임 D-1 비밀 식당 및 당일 좌석 번호가 등록된 연락처로 안전하게 발송됩니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveProcessId('P01_ACCOUNT')}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-white text-xs font-bold shrink-0 cursor-pointer transition-all duration-200 shadow-md"
              >
                연락처 등록하기
              </button>
            </div>
          )}

          {/* 상단 프로세스 진행 표시바 */}
          <div className="bg-[#12151e] rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-mono">
                STEP {currentProcessIdx + 1} / {enabledModules.length}
              </span>
              <h2 className="text-xl font-bold text-white">
                {currentProcess?.label}
              </h2>
              <span className="text-sm text-zinc-400 hidden sm:inline">
                {currentProcess?.description}
              </span>
            </div>
            {saveNotice && (
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-medium">
                {saveNotice}
              </span>
            )}
          </div>

          {/* ----------------------------------------------------------
              [P00] 모임현황 모듈 (티켓 ➡️ D-1 식당/좌석 ➡️ 현장 대화카드 ➡️ 사후 평가 & 투표)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P00_MEETUP_STATUS' && (
            <div className="space-y-6">
              {/* 모임 진행 단계 타임라인 탭 */}
              <div className="bg-[#12151e] p-3 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto flex-1">
                  <button
                    type="button"
                    onClick={() => setMeetupPhase('TICKET')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      meetupPhase === 'TICKET'
                        ? 'bg-[#f04f74] text-white shadow-md shadow-[#f04f74]/20'
                        : 'text-zinc-400 hover:text-white bg-white/5'
                    }`}
                  >
                    1. 티켓 &amp; 매칭현황
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetupPhase('VENUE_SEAT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      meetupPhase === 'VENUE_SEAT'
                        ? 'bg-[#f04f74] text-white shadow-md shadow-[#f04f74]/20'
                        : 'text-zinc-400 hover:text-white bg-white/5'
                    }`}
                  >
                    2. D-1 장소 &amp; 좌석
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetupPhase('LIVE_DECK')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      meetupPhase === 'LIVE_DECK'
                        ? 'bg-[#f04f74] text-white shadow-md shadow-[#f04f74]/20'
                        : 'text-zinc-400 hover:text-white bg-white/5'
                    }`}
                  >
                    3. 현장 대화카드
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetupPhase('POST_FEEDBACK')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      meetupPhase === 'POST_FEEDBACK'
                        ? 'bg-[#f04f74] text-white shadow-md shadow-[#f04f74]/20'
                        : 'text-zinc-400 hover:text-white bg-white/5'
                    }`}
                  >
                    4. 평가 &amp; 호감투표
                  </button>
                </div>
              </div>

              {/* [단계 1] 티켓 및 매칭 현황 */}
              {meetupPhase === 'TICKET' && (
                <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
                  <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">모임현황</h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        내가 결제·신청한 테이블 일정과 좌석 배정, 매칭 진행 상태를 확인합니다.
                      </p>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-zinc-200 text-xs font-bold">
                      매칭 완료 (3:3)
                    </span>
                  </div>

                  {/* 확정된 모임 티켓 카드 */}
                  <div className="p-7 rounded-3xl bg-[#1c202e] border border-white/15 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div className="space-y-1">
                        <span className="px-3 py-1 rounded-full bg-white/10 text-zinc-300 text-xs font-bold border border-white/15">
                          부산
                        </span>
                        <h4 className="text-2xl font-bold text-white mt-2">
                          부산 소셜 다이닝 (3040 &amp; 5060)
                        </h4>
                        <p className="text-sm text-zinc-400">
                          매주 금요일 19:30 • 소셜 다이닝 테이블
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-400 block">신청 상태</span>
                        <p className="text-lg font-bold text-white">참가권 결제완료</p>
                      </div>
                    </div>

                    {/* D-1 장소 비공개 상태 안내 */}
                    <div className="p-5 rounded-2xl bg-[#10131c] border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 text-[#f04f74] font-bold text-sm">
                        <span>🔒</span>
                        <span>D-1 목요일 19:00 비공개 식당 및 좌석이 공개됩니다.</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        엄선된 비스트로/와인바로 최종 확정되며, 참가자 전원의 동선과 분위기에 맞는 프라이빗 공간으로 안내됩니다. 
                        식대 및 주류 비용은 식당 현장에서 테이블 1/N 정산됩니다.
                      </p>
                    </div>

                    {/* 3:3 큐레이션 현황 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                        <span>테이블 성비 밸런스</span>
                        <span className="text-zinc-200 font-bold">정원 6명 확정 (남 3 / 여 3)</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                          <span className="text-xs block">👔</span>
                          <span className="text-[11px] text-zinc-300 font-bold">건축가</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                          <span className="text-xs block">👗</span>
                          <span className="text-[11px] text-[#f04f74] font-bold">나 (디자이너)</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                          <span className="text-xs block">👔</span>
                          <span className="text-[11px] text-zinc-300 font-bold">브랜드마케터</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                          <span className="text-xs block">👗</span>
                          <span className="text-[11px] text-zinc-300 font-bold">스타트업 대표</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                          <span className="text-xs block">👔</span>
                          <span className="text-[11px] text-zinc-300 font-bold">개발자</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                          <span className="text-xs block">👗</span>
                          <span className="text-[11px] text-zinc-300 font-bold">약사</span>
                        </div>
                      </div>
                    </div>

                    {/* 빠른 시뮬레이션 이동 버튼 */}
                    <div className="pt-2 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setMeetupPhase('VENUE_SEAT')}
                        className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
                      >
                        D-1 식당 &amp; 좌석 배치도 미리보기 →
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetupPhase('LIVE_DECK')}
                        className="py-3 px-5 rounded-xl border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        현장 대화카드 모드 열기 →
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* [단계 2] D-1 식당 및 좌석 안내 */}
              {meetupPhase === 'VENUE_SEAT' && (
                <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
                  <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">D-1 식당 및 좌석 배정</h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        전포 시크릿 비스트로 예약 정보와 1부/2부 좌석 배치도입니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSecondHalfRotated(!isSecondHalfRotated)}
                      className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 text-zinc-200 hover:bg-white/20 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      {isSecondHalfRotated ? '2부 좌석 로테이션 중 (되돌리기)' : '2부 자리이동 시뮬레이션 (3자리 회전)'}
                    </button>
                  </div>

                  {/* 식당 안내 */}
                  <div className="p-6 rounded-2xl bg-[#1c202e] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-[#f04f74] font-bold">제휴 식당 확정</span>
                      <h4 className="text-xl font-bold text-white">시크릿 비스트로 (룸 예약)</h4>
                      <p className="text-xs text-zinc-400">부산 시크릿 프라이빗 다이닝</p>
                    </div>
                    <span className="text-xs text-zinc-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                      예약자명: 나도솔로 (금요일 19:30)
                    </span>
                  </div>

                  {/* 좌석 배치도 시각화 */}
                  <div className="p-8 rounded-3xl bg-[#090a0f] border border-white/10 space-y-8">
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="text-center text-xs text-zinc-400">
                        {isSecondHalfRotated ? '【 2부 디저트 & 와인 타임 - 대화 상대 회전 배치 】' : '【 1부 메인 다이닝 - 첫인상 좌석 배치 】'}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {currentSeats.slice(0, 3).map((seat) => (
                          <div
                            key={seat.seatNumber}
                            className={`p-4 rounded-2xl border text-center space-y-1.5 transition-all ${
                              seat.userId === 'U01'
                                ? 'bg-[#f04f74]/15 border-[#f04f74] shadow-[0_0_15px_rgba(240,79,116,0.3)]'
                                : 'bg-[#181c28] border-white/10'
                            }`}
                          >
                            <span className="text-[10px] text-zinc-400 font-mono block">좌석 {seat.seatNumber}</span>
                            <p className="text-sm font-bold text-white">
                              {seat.userId === 'U01' ? `${seat.nickname} (나)` : seat.nickname}
                            </p>
                            <span className="text-[11px] text-zinc-400 block truncate">{seat.pairingReason}</span>
                          </div>
                        ))}
                      </div>

                      {/* 테이블 중앙 바 */}
                      <div className="h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-zinc-400 font-serif-editorial">
                        nadosolo private dining table (6 seats)
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {currentSeats.slice(3, 6).map((seat) => (
                          <div
                            key={seat.seatNumber}
                            className={`p-4 rounded-2xl border text-center space-y-1.5 transition-all ${
                              seat.userId === 'U01'
                                ? 'bg-[#f04f74]/15 border-[#f04f74] shadow-[0_0_15px_rgba(240,79,116,0.3)]'
                                : 'bg-[#181c28] border-white/10'
                            }`}
                          >
                            <span className="text-[10px] text-zinc-400 font-mono block">좌석 {seat.seatNumber}</span>
                            <p className="text-sm font-bold text-white">
                              {seat.userId === 'U01' ? `${seat.nickname} (나)` : seat.nickname}
                            </p>
                            <span className="text-[11px] text-zinc-400 block truncate">{seat.pairingReason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* [단계 3] 현장 대화카드 */}
              {meetupPhase === 'LIVE_DECK' && (
                <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
                  <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">현장 대화카드 모드</h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        어색한 침묵 없이 자연스럽게 깊은 대화를 이끌어주는 라운드별 질문 카드입니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDeckViewType('SLIDE')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                          deckViewType === 'SLIDE' ? 'bg-white text-zinc-950' : 'bg-white/5 text-zinc-400'
                        }`}
                      >
                        카드 넘기기
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeckViewType('LIST')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                          deckViewType === 'LIST' ? 'bg-white text-zinc-950' : 'bg-white/5 text-zinc-400'
                        }`}
                      >
                        전체 보기
                      </button>
                    </div>
                  </div>

                  {/* 카드 슬라이더 */}
                  {deckViewType === 'SLIDE' ? (
                    filteredDeckCards[safeCardIdx] && (
                      <div className="p-10 rounded-3xl bg-[#1c202e] border border-white/15 text-center space-y-6 max-w-xl mx-auto shadow-2xl">
                        <span className="px-3.5 py-1 rounded-full bg-white/10 text-zinc-300 text-xs font-bold border border-white/10">
                          라운드 {safeCardIdx + 1} / {filteredDeckCards.length}
                        </span>
                        <h4 className="text-2xl sm:text-3xl font-bold text-white leading-relaxed">
                          "{filteredDeckCards[safeCardIdx].promptText}"
                        </h4>
                        <p className="text-xs text-zinc-400">
                          {filteredDeckCards[safeCardIdx].title}
                        </p>
                        <div className="flex items-center justify-center gap-4 pt-4">
                          <button
                            type="button"
                            disabled={safeCardIdx === 0}
                            onClick={() => setCurrentCardIdx((prev) => Math.max(0, prev - 1))}
                            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold cursor-pointer"
                          >
                            ← 이전 질문
                          </button>
                          <button
                            type="button"
                            disabled={safeCardIdx >= filteredDeckCards.length - 1}
                            onClick={() => setCurrentCardIdx((prev) => Math.min(filteredDeckCards.length - 1, prev + 1))}
                            className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 disabled:opacity-30 text-xs font-bold transition-all duration-200 cursor-pointer shadow-md"
                          >
                            다음 질문 →
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredDeckCards.map((c, idx) => (
                        <div key={c.cardId} className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 space-y-2">
                          <span className="text-[10px] text-[#f04f74] font-mono">QUESTION {idx + 1}</span>
                          <h5 className="text-base font-bold text-white">{c.title}</h5>
                          <p className="text-sm text-zinc-300">"{c.promptText}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* [단계 4] 모임 종료 후 매너평가 & 투표 */}
              {meetupPhase === 'POST_FEEDBACK' && (
                <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-8">
                  <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">모임 후 매너평가 &amp; 시크릿 호감 투표</h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        오늘 함께한 테이블 동석자 5명에게 익명 매너 피드백을 전달하고, 설레는 호감을 투표합니다.
                      </p>
                    </div>
                    <span className="text-xs text-[#f04f74] bg-[#f04f74]/10 px-3 py-1.5 rounded-xl border border-[#f04f74]/25 font-bold">
                      익명 100% 보장
                    </span>
                  </div>

                  {/* 시크릿 투표 */}
                  <div className="p-6 rounded-2xl bg-[#1c202e] border border-white/10 space-y-4">
                    <h4 className="text-lg font-bold text-white">오늘 밤 가장 마음이 통했던 이성 1인 투표</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {tablePeers.filter((p) => p.gender === 'M').map((peer) => (
                        <button
                          key={peer.userId}
                          type="button"
                          onClick={() => {
                            setMyVoteTargetId(peer.userId);
                            setMyVoteCategory('ROMANCE');
                          }}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            myVoteTargetId === peer.userId
                              ? 'bg-[#f04f74] border-[#f04f74] text-white shadow-md shadow-[#f04f74]/20'
                              : 'bg-[#10131c] border-white/10 text-zinc-300 hover:text-white'
                          }`}
                        >
                          <p className="text-base font-bold">{peer.nickname}</p>
                          <p className="text-xs text-zinc-400">
                            {peer.gender === 'F' ? '여성' : '남성'} · {peer.birthYear}년생
                          </p>
                        </button>
                      ))}
                    </div>
                    {myVoteTargetId && (
                      <p className="text-xs text-[#f04f74] font-medium">
                        ✓ 투표가 등록되었습니다. 자정(24:00) 이후 상호 매칭 결과가 대시보드에 공개됩니다.
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------
              [P01] 계정정보 모듈 (@핸들, 이메일, 연락처, 비밀번호, 회원탈퇴)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P01_ACCOUNT' && (
            <div className="space-y-6">
              {/* 1. 기본 계정정보 및 연락처 관리 */}
              <section className="bg-[#12151e] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-sm space-y-6">
                <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">기본 계정정보</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      모임 안내 SMS 및 영수증 발송에 사용되는 기본 연락처입니다.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <span>인증 계정</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      고유 아이디 (@핸들)
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/40 text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      이름 (닉네임)
                    </label>
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/40 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span>이메일 주소</span>
                      <span className="text-[10px] text-[#f04f74] font-normal">(필수 수신용)</span>
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="예: user@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/40 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>휴대폰 번호</span>
                      <span className="text-[10px] text-[#f04f74] font-normal">(D-1 식당 SMS 수신)</span>
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="예: 010-1234-5678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/40 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
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
                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold cursor-pointer transition-all"
                  >
                    계정정보 저장
                  </button>
                </div>
              </section>

              {/* 2. 비밀번호 수정 섹션 */}
              <section className="bg-[#12151e] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-sm space-y-5">
                <div className="border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-zinc-400" />
                    <span>비밀번호 수정</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    로그인에 사용되는 비밀번호를 안전하게 변경합니다.
                  </p>
                </div>

                {pwNotice && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/15 text-xs text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#f04f74]" />
                    <span>{pwNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1.5">현재 비밀번호</label>
                    <input
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="현재 비밀번호"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/40 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1.5">새 비밀번호</label>
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="6자리 이상"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/40 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1.5">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="새 비밀번호 재입력"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/40 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    비밀번호 변경
                  </button>
                </div>
              </section>

              {/* 3. 회원탈퇴 섹션 */}
              <section className="bg-[#150d12] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserX className="w-5 h-5 text-zinc-400" />
                      <h3 className="text-xl font-bold text-white">회원 탈퇴</h3>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                      탈퇴 시 회원님의 성향 진단 프로필(NBTI), 매너 평가 이력, 보유 모임 티켓 및 매칭 기록이 영구 파기되며 즉시 로그아웃 처리됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-bold shrink-0 transition-colors cursor-pointer border border-white/15"
                  >
                    회원 탈퇴
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* ----------------------------------------------------------
              [P02] 프로필설정 모듈 (기본프로필 + 5대 영역 자가진단)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P02_PROFILE' && (
            <div className="space-y-6">
              {/* 프로필설정 서브 탭 */}
              <div className="bg-[#12151e] p-1.5 rounded-2xl border border-white/10 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProfileSubTab('BASIC')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    profileSubTab === 'BASIC'
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  기본 프로필 &amp; 관심사
                </button>
                <button
                  type="button"
                  onClick={() => setProfileSubTab('SELF_DIAG')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    profileSubTab === 'SELF_DIAG'
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  5대 영역 성향 자가진단
                </button>
              </div>

              {profileSubTab === 'BASIC' ? (
                <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="text-2xl font-bold text-white">기본프로필</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      모임 배정 및 레스토랑 식단 준비에 사용되는 기본 조건입니다.
                    </p>
                  </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    성별
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditGender('F')}
                      className={`py-3 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                        editGender === 'F'
                          ? 'bg-white text-zinc-950 border-white'
                          : 'bg-[#10131c] text-zinc-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      여성 (F)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditGender('M')}
                      className={`py-3 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                        editGender === 'M'
                          ? 'bg-white text-zinc-950 border-white'
                          : 'bg-[#10131c] text-zinc-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      남성 (M)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    출생연도
                  </label>
                  <input
                    type="number"
                    value={editBirthYear}
                    onChange={(e) =>
                      setEditBirthYear(Number(e.target.value) || 1995)
                    }
                    className="w-full px-4 py-3 rounded-xl border border-white/15 text-base text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    직업 / 분야
                  </label>
                  <input
                    type="text"
                    value={editJob}
                    onChange={(e) => setEditJob(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/15 text-base text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2.5">
                  식단 제한
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(DIETARY_LABELS) as DietaryRestriction[]).map(
                    (dKey) => (
                      <button
                        key={dKey}
                        type="button"
                        onClick={() => setDietary(dKey)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          dietary === dKey
                            ? 'bg-white text-zinc-950 border-white shadow-sm font-bold'
                            : 'bg-[#10131c] text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {DIETARY_LABELS[dKey]}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2.5">
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
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            active
                              ? 'bg-white text-zinc-950 border-white shadow-sm font-bold'
                              : 'bg-[#10131c] text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {INTEREST_LABELS[tag]}
                        </button>
                      );
                    }
                  )}
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
                    });
                    showToast('기본프로필이 저장되었습니다.');
                  }}
                  className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold cursor-pointer transition-all"
                >
                  기본프로필 저장
                </button>
              </div>
            </section>
          ) : (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    자가진단 (5대 대분류)
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    본인이 생각하는 자신의 5대 영역(외모 · 스타일 · 음성 · 대화 · 매너) 점수를 입력합니다. 모임 후 동석자 평가 점수와 비교됩니다.
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {majorDomains.map((dom, idx) => (
                    <button
                      key={dom.code}
                      type="button"
                      onClick={() => setSelfStepIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        selfStepIdx === idx
                          ? 'bg-white text-zinc-950 shadow-sm font-bold'
                          : 'bg-[#10131c] text-zinc-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {idx + 1}. {dom.label}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const activeDom = majorDomains[selfStepIdx] ?? majorDomains[0];
                const domSubs = subElements.filter(
                  (s) => s.majorCode === activeDom.code
                );
                const currentVal = selfDomainScores100[activeDom.code] ?? 80;

                return (
                  <div className="bg-[#1c202e] rounded-2xl p-6 border border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-zinc-400 uppercase">
                          영역 {selfStepIdx + 1} / {majorDomains.length}
                        </span>
                        <h4 className="text-2xl font-bold text-white mt-1">
                          [{activeDom.label}] 영역 자가 점수
                        </h4>
                        <p className="text-sm text-zinc-400 mt-1">
                          포함 중분류 (5요소):{' '}
                          {domSubs.map((s) => s.label).join(' · ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-white">
                          {currentVal}점
                        </span>
                        <span className="text-xs text-zinc-400 block">
                          / 100점 만점
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
                      <div className="flex justify-between text-xs font-bold text-zinc-400 mt-2">
                        <span>40점 (보완 필요)</span>
                        <span>60점 (보통)</span>
                        <span>80점 (우수)</span>
                        <span>100점 (최상)</span>
                      </div>
                    </div>

                    {/* 이전 / 다음 양방향 버튼 */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <button
                        type="button"
                        disabled={selfStepIdx === 0}
                        onClick={() =>
                          setSelfStepIdx((p) => Math.max(0, p - 1))
                        }
                        className="px-5 py-2.5 rounded-xl border border-white/10 bg-[#10131c] text-zinc-400 hover:text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        ◀ 이전 영역
                      </button>
                      <span className="text-xs font-bold text-zinc-400">
                        {selfStepIdx + 1} / {majorDomains.length}
                      </span>
                      <button
                        type="button"
                        disabled={selfStepIdx === majorDomains.length - 1}
                        onClick={() =>
                          setSelfStepIdx((p) =>
                            Math.min(majorDomains.length - 1, p + 1)
                          )
                        }
                        className="px-5 py-2.5 rounded-xl bg-[#10131c] text-white text-sm font-bold disabled:opacity-40 cursor-pointer"
                      >
                        다음 영역 ▶
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 5대 대분류 자가 점수 요약 표 */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {majorDomains.map((dom, idx) => (
                  <button
                    key={dom.code}
                    type="button"
                    onClick={() => setSelfStepIdx(idx)}
                    className={`p-4 rounded-2xl border text-center cursor-pointer transition-all ${
                      selfStepIdx === idx
                        ? 'border-white/40 bg-white/10 ring-1 ring-white/20'
                        : 'border-white/10 bg-[#10131c] hover:border-white/25'
                    }`}
                  >
                    <p className="text-xs font-bold text-zinc-400">
                      {dom.label}
                    </p>
                    <p className="text-xl font-bold text-white mt-1">
                      {selfDomainScores100[dom.code]}점
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

          {/* ----------------------------------------------------------
              [P04] 지역선택 모듈 (권역 > 상권 > 제휴 매장 확인)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P04_REGION' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">지역선택</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    오프라인 만남이 진행될 권역과 세부 상권을 선택합니다.
                  </p>
                </div>
                <div className="flex gap-2">
                  {['전체', '서울', '경기', '부산'].map((rName) => (
                    <button
                      key={rName}
                      type="button"
                      onClick={() => setSelectedRegionFilter(rName)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        selectedRegionFilter === rName
                          ? 'bg-white text-zinc-950 shadow-sm font-bold'
                          : 'bg-[#10131c] text-zinc-400 border border-white/10 hover:text-white'
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
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                          selected
                            ? 'border-white/50 bg-[#1c202e] ring-1 ring-white/30 shadow-lg'
                            : 'border-white/10 bg-[#1c202e] hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 rounded-full bg-[#10131c] text-zinc-300 text-xs font-medium border border-white/10">
                            {dist.regionName}
                          </span>
                          <span className="text-xs font-semibold text-zinc-300">
                            {dist.defaultGatherTime}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-1">
                          {dist.districtName}
                        </h4>
                        <p className="text-xs text-zinc-400">
                          {dist.description}
                        </p>
                      </div>
                    );
                  })}
              </div>

              {/* 제휴 매장 목록 */}
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-base font-bold text-white mb-3">
                  등록된 제휴 매장 ({partnerVenues.length}곳)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partnerVenues.map((v) => (
                    <div
                      key={v.venueId}
                      className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-white">{v.name}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          지원 식단: {v.supportedDietary.join(', ')} · 최대{' '}
                          {v.maxTablesPerNight}테이블
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#10131c] border border-white/10 text-xs font-medium text-zinc-300">
                        {v.budgetTier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              [P05] 모임신청 모듈 (₩30,000 참가비 & 세대별 트랙)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P05_EVENT_APPLY' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">소셜 다이닝 모임 신청</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    3040 &amp; 5060을 위한 검증된 테이블에 참가 신청합니다. (참가권 ₩30,000 / 식대는 현장 1/N)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-zinc-400">
                    내 매너 프로파일:{' '}
                  </span>
                  <span className="text-base font-semibold text-white">
                    {myPersonalDossier.totalScore100}점
                  </span>
                </div>
              </div>

              {applyFeedback && (
                <div
                  className={`p-4 rounded-2xl text-sm font-medium border ${
                    applyFeedback.ok
                      ? 'bg-[#181c28] text-white border-white/20'
                      : 'bg-[#f04f74]/10 text-white border-[#f04f74]/30'
                  }`}
                >
                  {applyFeedback.message}
                </div>
              )}

              <div className="space-y-4">
                {conditionalEvents.map((ev) => {
                  const dist = regionDistricts.find(
                    (d) => d.districtId === ev.districtId
                  );
                  const isApplied = appliedEventIds.includes(ev.eventId);

                  return (
                    <div
                      key={ev.eventId}
                      className="p-6 rounded-2xl border border-white/10 bg-[#1c202e] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#10131c] text-white text-xs font-semibold border border-white/10">
                            {dist ? dist.regionName : '부산'}
                          </span>
                          {ev.targetAgeGroup === '3045_PRIME' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#f04f74]/15 text-[#f04f74] text-xs font-semibold border border-[#f04f74]/25">
                              3040 트랙
                            </span>
                          )}
                          {ev.targetAgeGroup === '5060_GOLDEN' && (
                            <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700">
                              5060 골든 트랙
                            </span>
                          )}
                          <span className="px-3 py-1 rounded-full bg-white/10 text-zinc-300 text-xs font-semibold border border-white/10">
                            {ev.mode === 'ROMANCE'
                              ? '3:3 로맨스'
                              : ev.mode === 'ONE_ON_ONE'
                              ? '1:1 매칭'
                              : '소셜 다이닝'}
                          </span>
                          <span className="text-xs font-medium text-zinc-400">
                            {ev.dateText}
                          </span>
                        </div>

                        <h4 className="text-xl font-bold text-white">
                          {ev.title}
                        </h4>

                        {/* 식대 안내 */}
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <span className="text-[#f04f74]">✓</span>
                          <span>{ev.mealNote || '식사 및 주류 비용은 식당 현장에서 테이블 동행자들과 1/N 정산됩니다.'}</span>
                        </p>

                        {/* 참가 자격 조건 표시 */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {ev.minTotalScore100 > 0 ? (
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium">
                              조건: 종합 {ev.minTotalScore100}점 이상
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium">
                              누구나 신청 가능
                            </span>
                          )}
                          {ev.requiredBadgeIds.map((bId) => {
                            const badge = granularBadges.find(
                              (b) => b.badgeId === bId
                            );
                            const hasIt =
                              myPersonalDossier.earnedBadgeIds.includes(bId);
                            return (
                              <span
                                key={bId}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                  hasIt
                                    ? 'bg-[#f04f74]/15 border-[#f04f74]/30 text-[#f04f74]'
                                    : 'bg-white/5 border-white/10 text-zinc-500'
                                }`}
                              >
                                필수: {badge?.name ?? bId}{' '}
                                {hasIt ? '(보유)' : '(미보유)'}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">
                            ₩{ev.priceKrw.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-zinc-400">참가권 (식대 별도 1/N)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isApplied) return;
                            setCheckoutEvent({
                              eventId: ev.eventId,
                              title: ev.title,
                              dateText: ev.dateText,
                              priceKrw: ev.priceKrw,
                              districtName: dist ? dist.regionName : '부산',
                              mealNote: ev.mealNote,
                            });
                            setIsCheckoutOpen(true);
                          }}
                          className={`h-11 px-5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 inline-flex items-center justify-center ${
                            isApplied
                              ? 'bg-white/10 text-zinc-400 border border-white/10 cursor-not-allowed'
                              : 'border border-white/15 bg-white/10 hover:bg-[#f04f74] hover:border-[#f04f74] text-white hover:text-white shadow-md hover:shadow-[0_0_20px_rgba(240,79,116,0.4)]'
                          }`}
                        >
                          {isApplied ? '신청 완료' : '신청하기'}
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
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              {dashConfig?.heroImage && (
                <div className="relative rounded-2xl overflow-hidden h-48 border border-white/10">
                  <img
                    src={dashConfig.heroImage}
                    alt="Venue"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
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
                    1부 착석 위치와 2부 하프타임 로테이션 좌석을 확인합니다.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSecondHalfRotated(false)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                      !isSecondHalfRotated
                        ? 'bg-white text-zinc-950'
                        : 'bg-[#1c202e] text-zinc-400 hover:text-white'
                    }`}
                  >
                    1부 좌석
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSecondHalfRotated(true)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                      isSecondHalfRotated
                        ? 'bg-white text-zinc-950'
                        : 'bg-[#1c202e] text-zinc-400 hover:text-white'
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
                  const isMe = seat.userId === 'U01';
                  return (
                    <div
                      key={seat.seatNumber}
                      className={`p-5 rounded-2xl border ${
                        isMe
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/10 bg-[#12151e]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 rounded-full bg-[#10131c] text-white text-xs font-mono">
                          {seat.seatNumber}번 좌석
                        </span>
                        <span className="text-xs font-medium text-zinc-400">
                          {member?.gender === 'F' ? '여성' : '남성'} ·{' '}
                          {member?.birthYear}년생
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-white">
                        {seat.nickname} {isMe && '(나)'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
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
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        deckModeFilter === mKey
                          ? 'bg-white text-zinc-950'
                          : 'bg-[#1c202e] text-zinc-400 hover:text-white'
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
                    className="px-3.5 py-2 rounded-xl bg-[#10131c] text-white text-xs font-bold cursor-pointer"
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
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                            safeCardIdx === idx
                              ? 'bg-[#10131c] text-white'
                              : 'bg-[#1c202e] text-zinc-400 hover:bg-[#252b3d]'
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
                        <div className="p-8 rounded-3xl bg-[#1c202e] border-2 border-white/10 space-y-5">
                          <div className="flex items-center justify-between">
                            <span className="px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-mono">
                              CARD {safeCardIdx + 1} / {filteredDeckCards.length}
                            </span>
                            <span className="text-xs text-zinc-400">
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
                                    className="p-4 rounded-2xl bg-[#12151e] border border-white/10 text-base font-medium text-zinc-200"
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
                        className="px-6 py-3 rounded-xl border border-white/10 bg-[#10131c] text-zinc-400 hover:text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
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
                        className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold disabled:opacity-40 cursor-pointer transition-all"
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
                      className="p-6 rounded-2xl bg-[#1c202e] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-zinc-500">
                          CARD {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCardIdx(idx);
                            setDeckViewType('SLIDE');
                          }}
                          className="text-xs font-bold text-zinc-400 underline cursor-pointer"
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
              [P08] 평가 모듈 (단일 명사 1요소 1기준 매핑)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P08_EVALUATION' && (
            <section className="bg-[#12151e] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                    EVALUATION
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-0.5">
                    평가
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
                    완료: <strong className="text-white">{completedEvalUserIds.length}</strong> / 5명
                  </span>
                  {completedEvalUserIds.length >= 5 ? (
                    <button
                      type="button"
                      onClick={() => setActiveProcessId('P10_REPORT')}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer"
                    >
                      리포트 열람 가능 ➔
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-[#f04f74]/15 text-[#f04f74] border border-[#f04f74]/30 text-xs font-semibold">
                      잠금 상태
                    </span>
                  )}
                </div>
              </div>

              {/* 1. 동석자 선택 버튼 */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
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
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-white text-zinc-950 border-white shadow-md'
                            : isDone
                            ? 'bg-white/5 text-zinc-300 border-white/10 hover:border-white/20'
                            : 'bg-[#181c28] text-zinc-400 border-white/5 hover:text-white'
                        }`}
                      >
                        <span>{peer.nickname}</span>
                        {isDone && <span className="text-[10px] text-emerald-400">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 단일 명사 5대 항목 평가 폼 */}
              <div className="space-y-3">
                {track3040Elements.map((el) => {
                  const currentScore = draftSingleNounScores[el.id] ?? 4;
                  return (
                    <div
                      key={el.id}
                      className="p-4 rounded-2xl bg-[#181c28] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-zinc-200 font-mono">
                          #{el.anchorNoun}
                        </span>
                        <p className="text-xs text-zinc-300">
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
                            className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                              currentScore === stepVal
                                ? 'bg-white text-zinc-950 shadow-md scale-105'
                                : 'bg-[#12151e] text-zinc-400 border border-white/10 hover:text-white hover:border-white/20'
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
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium">
                  {evalSavedMsg}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-xs text-zinc-500">
                  전원 완료 시 리포트 자동 해금
                </span>
                <button
                  type="button"
                  onClick={() => {
                    track3040Elements.forEach((el) => {
                      submitParticipantObservation(
                        evalTargetUserId,
                        'MOD_TRACK_3040',
                        el.id,
                        draftSingleNounScores[el.id] ?? 4
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
                  className="px-8 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-bold shadow-md transition-all cursor-pointer"
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
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
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
                  className="px-4 py-2 rounded-xl bg-[#10131c] text-white text-xs font-bold cursor-pointer"
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
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        selected
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/10 bg-[#10131c]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white">
                          {peer.nickname}
                        </span>
                        <span className="text-xs font-medium text-zinc-400">
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                              myVoteCategory === 'ROMANCE'
                                ? 'bg-white text-zinc-950'
                                : 'bg-[#181c28] text-zinc-400 border border-white/10 hover:text-white'
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                              myVoteCategory === 'DINING_FRIEND'
                                ? 'bg-white text-zinc-950'
                                : 'bg-[#181c28] text-zinc-400 border border-white/10 hover:text-white'
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

              <div className="p-6 rounded-2xl bg-[#1c202e] border border-white/10">
                <h4 className="text-base font-bold text-white mb-2">
                  자정 상호 매칭 결과
                </h4>
                {visibleMatchesForMe.length > 0 ? (
                  <div className="space-y-2">
                    {visibleMatchesForMe.map((m, idx) => {
                      const partnerId =
                        m.userA === 'U01' ? m.userB : m.userA;
                      const partner = activeTable?.participants.find(
                        (p) => p.userId === partnerId
                      );
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-[#181c28] border border-white/15 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-base font-semibold text-white">
                              {partner?.nickname ?? partnerId}님과 상호 매칭되었습니다
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              매칭 유형: {m.matchedCategory}
                            </p>
                          </div>
                          <span className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-semibold">
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
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-8">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                    REPORT
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    리포트
                  </h3>
                </div>
              </div>

              {/* 상호주의 해금 원칙 배너 (헌법 규칙 1 적용) */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                personalSocialDossier.unlocked
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-white/5 border-white/10'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{personalSocialDossier.unlocked ? '🔓' : '🔒'}</span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${personalSocialDossier.unlocked ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {personalSocialDossier.unlocked ? '상호주의 해금 완료 (내 소셜 리포트 열람 가능)' : '상호주의 잠금 상태 (무임승차 방지)'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    {personalSocialDossier.unlocked
                      ? '동석자 전원 평가를 100% 완료하여 타인의 시선으로 관찰된 나의 소셜 프로필이 잠금 해제되었습니다.'
                      : `동석자 전원에 대한 관찰 평가를 완료해야만 내 리포트가 공개됩니다. (현재 진행도: ${completedEvalUserIds.length}/5명 완료)`}
                  </p>
                </div>
                {personalSocialDossier.unlocked && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-zinc-400 font-medium">최고 돋보인 단일 명사:</span>
                    {personalSocialDossier.topStrengths.map((str) => (
                      <span key={str} className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-xs font-bold font-mono">
                        #{str}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 1. 종합 점수 & 이성/동성 분리 점수 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-[#10131c] text-white">
                  <p className="text-xs text-zinc-500 font-medium">
                    종합 프로파일 지표 (5대 영역 평균)
                  </p>
                  <p className="text-4xl font-bold mt-2">
                    {myPersonalDossier.totalScore100}
                    <span className="text-base font-normal text-zinc-500">
                      {' '}
                      / 100점
                    </span>
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-[#181c28] border border-white/10">
                  <p className="text-xs text-zinc-400 font-medium">
                    이성 동석자(3인) 평가 환산
                  </p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {myPersonalDossier.oppositeSexTotal100}
                    <span className="text-base font-normal text-zinc-400">
                      {' '}
                      / 100점
                    </span>
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-[#1c202e] border border-white/10">
                  <p className="text-xs text-zinc-400 font-bold">
                    동성 동석자(2인) 평가 환산
                  </p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {myPersonalDossier.sameSexTotal100}
                    <span className="text-base font-normal text-zinc-400">
                      {' '}
                      / 100점
                    </span>
                  </p>
                </div>
              </div>

              {/* 2. 5대 대분류(외모·스타일·음성·대화·매너) 100점 성적표 */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3">
                  1. 5대 대분류 성적표 (각 20점 × 5중분류 = 100점 만점)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {myPersonalDossier.domainSummaries.map((dom) => (
                    <div
                      key={dom.majorCode}
                      className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          {dom.label}
                        </span>
                        <span className="text-xs font-mono text-zinc-400">
                          이성 {dom.oppositeSexScore100}점
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {dom.score100}점
                      </p>
                      <p className="text-xs text-zinc-400">
                        자가 {dom.selfScore100}점 (편차{' '}
                        {dom.gapScore >= 0 ? `+${dom.gapScore}` : dom.gapScore})
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. 모듈별 단일 명사 관찰 지표 (100점 정규화) */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3">
                  2. 세대 및 환경 관찰 지표 (100점 정규화)
                </h4>
                <div className="space-y-4">
                  {personalSocialDossier.moduleReports.map((mod) => (
                    <div
                      key={mod.moduleId}
                      className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-sm font-bold text-white">{mod.moduleName}</span>
                        <span className="text-sm font-bold text-white font-mono">
                          종합 {mod.totalScore100}점
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                        {mod.elementScores.map((el) => (
                          <div
                            key={el.elementId}
                            className="p-3 rounded-xl bg-[#12151e] border border-white/5 text-center"
                          >
                            <p className="text-xs font-mono font-bold text-zinc-300">
                              #{el.anchorNoun}
                            </p>
                            <p className="text-xl font-bold text-white mt-0.5 font-mono">
                              {el.score100}점
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
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
                <div className="p-5 sm:p-6 rounded-2xl bg-[#181c28] border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <h5 className="text-sm font-semibold text-white">
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
                        className="p-3.5 rounded-xl bg-[#12151e] border border-white/10"
                      >
                        <div className="flex justify-between text-xs font-medium text-zinc-300">
                          <span>
                            [{dom?.label} &gt; {el.label}]
                          </span>
                          <span className="text-white font-semibold">{el.score20} / 20점</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1.5">
                          {subDef?.coachingHintHigh}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-[#181c28] border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    <h5 className="text-sm font-semibold text-white">
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
                        className="p-3.5 rounded-xl bg-[#12151e] border border-white/10"
                      >
                        <div className="flex justify-between text-xs font-medium text-zinc-300">
                          <span>
                            [{dom?.label} &gt; {el.label}]
                          </span>
                          <span className="text-zinc-400">{el.score20} / 20점 (보완 권장)</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1.5">
                          {subDef?.coachingHintLow}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. 획득한 세분화 뱃지 도감 */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3">
                  3. 세분화 뱃지 도감 ({myPersonalDossier.earnedBadgeIds.length} /{' '}
                  {granularBadges.length} 획득)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {granularBadges.map((b) => {
                    const earned = myPersonalDossier.earnedBadgeIds.includes(
                      b.badgeId
                    );
                    return (
                      <div
                        key={b.badgeId}
                        className={`p-4 rounded-2xl border transition-all ${
                          earned
                            ? 'bg-white/10 border-white/20'
                            : 'bg-[#12151e] border-white/5 opacity-40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-zinc-400">BADGE</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                              earned
                                ? 'bg-white text-zinc-950 font-semibold'
                                : 'bg-white/5 text-zinc-500'
                            }`}
                          >
                            {earned ? '획득 완료' : '미획득'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white">
                          {b.name}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
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
                  <div>
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">AUDIT</span>
                    <h4 className="text-lg font-bold text-white mt-0.5">
                      품질 점검
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
                      종합 점수: <strong className="text-white font-bold">{fullJourneyAudit.totalAuditScore100}점</strong>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      fullJourneyAudit.verifiedPartnerEligible
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {fullJourneyAudit.verifiedPartnerEligible ? '인증 완료' : '점검 대상'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  
                  {/* 기둥 1: 식당 공간 점검 */}
                  <div className="p-5 rounded-2xl bg-[#181c28] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white/70" />
                        <span className="text-sm font-bold text-white">공간</span>
                      </div>
                      <span className="text-base font-bold text-white font-mono">
                        {fullJourneyAudit.placeReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-2">
                      {fullJourneyAudit.placeReport.elementScores.map((el) => (
                        <div key={el.elementId} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-medium">#{el.anchorNoun}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-[10px]">{el.rawAverageStep}단계</span>
                            <span className="font-mono font-bold text-white">{el.score100}점</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 기둥 2: 식사 미식 점검 */}
                  <div className="p-5 rounded-2xl bg-[#181c28] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-sm font-bold text-white">식사</span>
                      </div>
                      <span className="text-base font-bold text-amber-400 font-mono">
                        {fullJourneyAudit.mealReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-2">
                      {fullJourneyAudit.mealReport.elementScores.map((el) => (
                        <div key={el.elementId} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-medium">#{el.anchorNoun}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-[10px]">{el.rawAverageStep}단계</span>
                            <span className="font-mono font-bold text-white">{el.score100}점</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 기둥 3: 가변 진행 점검 */}
                  <div className="p-5 rounded-2xl bg-[#181c28] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        <span className="text-sm font-bold text-white">진행</span>
                      </div>
                      <span className="text-base font-bold text-sky-400 font-mono">
                        {fullJourneyAudit.flowReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-2">
                      {fullJourneyAudit.flowReport.elementScores.map((el) => (
                        <div key={el.elementId} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-medium">#{el.anchorNoun}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-[10px]">{el.rawAverageStep}단계</span>
                            <span className="font-mono font-bold text-white">{el.score100}점</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </section>
          )}

          {/* 하단 프로세스 이전/다음 단계 이동 네비게이션 */}
          <div className="bg-[#12151e] rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <button
              type="button"
              disabled={currentProcessIdx <= 0}
              onClick={() => {
                const prevMod = enabledModules[currentProcessIdx - 1];
                if (prevMod) setActiveProcessId(prevMod.processId);
              }}
              className="px-5 py-2.5 rounded-xl border border-white/10 bg-[#10131c] text-zinc-400 hover:text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
            >
              ◀ 이전 단계 ({enabledModules[currentProcessIdx - 1]?.label ?? '없음'})
            </button>
            <span className="text-xs font-bold text-zinc-400">
              {currentProcess?.label} ({currentProcessIdx + 1} /{' '}
              {enabledModules.length})
            </span>
            <button
              type="button"
              disabled={currentProcessIdx >= enabledModules.length - 1}
              onClick={() => {
                const nextMod = enabledModules[currentProcessIdx + 1];
                if (nextMod) setActiveProcessId(nextMod.processId);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#10131c] text-white text-sm font-bold disabled:opacity-40 cursor-pointer"
            >
              다음 단계 ({enabledModules[currentProcessIdx + 1]?.label ?? '완료'}) ▶
            </button>
          </div>
        </div>
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
            className="w-full max-w-md bg-[#140d12] border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-[#f04f74]">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-xl font-bold text-white">회원 탈퇴 확인</h3>
            </div>

            <div className="text-xs text-zinc-300 space-y-2 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
              <p>• 탈퇴 시 현재 계정에 등록된 <strong>성향 프로필(NBTI), 매너 평가 점수, 모임 티켓</strong>이 즉시 영구 삭제됩니다.</p>
              <p>• 삭제된 데이터는 복구할 수 없습니다.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-zinc-300 font-semibold">
                탈퇴를 확인하기 위해 아래에 <strong className="text-[#f04f74]">&apos;회원탈퇴&apos;</strong>를 입력하세요:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="회원탈퇴"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/20 bg-black/60 text-sm text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAccountDeletion}
                disabled={deleteConfirmText.trim() !== '회원탈퇴'}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors cursor-pointer border border-white/15"
              >
                탈퇴 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
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
