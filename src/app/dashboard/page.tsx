'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CriterionCode,
  DietaryRestriction,
  EvaluationMatrixEngine,
  InterestTag,
  MajorDomainCode,
  useNadoSoloEngine,
} from '@/engine';

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
  const searchParams = useSearchParams();
  const stepQuery = searchParams.get('step');

  const {
    currentUser,
    updateCurrentUser,
    processModules,
    majorDomains,
    evaluationCriteria,
    subElements,
    selfDomainScores100,
    setSelfDomainScore100,
    matrixEvaluations,
    submitMatrixEvaluation,
    myPersonalDossier,
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
    stepQuery || 'P02_PROFILE'
  );

  useEffect(() => {
    if (stepQuery) {
      setActiveProcessId(stepQuery);
    }
  }, [stepQuery]);

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

  // [P03 자가진단] 5대 대분류 단계 이동 상태 (0 ~ 4)
  const [selfStepIdx, setSelfStepIdx] = useState<number>(0);

  // [P04 지역선택] 권역 필터
  const [selectedRegionFilter, setSelectedRegionFilter] =
    useState<string>('전체');

  // [P05 모임신청] 알림 메시지
  const [applyFeedback, setApplyFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

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

          <nav className="space-y-1">
            {enabledModules.map((mod) => {
              const active = currentProcess?.processId === mod.processId;
              const isAccount = mod.processId === 'P01_ACCOUNT';
              return (
                <button
                  key={mod.processId}
                  type="button"
                  onClick={() => setActiveProcessId(mod.processId)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? 'bg-white/10 text-white font-medium border border-white/15'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-normal border border-transparent'
                  } ${isAccount ? 'mt-2 pt-3 border-t border-white/10' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-rose-400' : 'bg-transparent'}`} />
                    <span className="text-sm font-medium">{mod.label}</span>
                  </div>
                  {isAccount && (
                    <span className="text-[10px] text-zinc-500 font-mono">설정</span>
                  )}
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
              [P01] 계정정보 모듈 (@핸들, 이메일, 연락처, 인증)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P01_ACCOUNT' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">계정정보</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    서비스 전역에서 사용되는 고유 @핸들 아이디와 연락처를 관리합니다.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>본인인증 완료</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
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
                    className="w-full px-4 py-3 rounded-xl border border-white/15 text-base font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/15 text-base text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    이름 (닉네임)
                  </label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/15 text-base text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    휴대폰 번호
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/15 text-base text-white"
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
                  className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold cursor-pointer transition-all"
                >
                  계정정보 저장
                </button>
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              [P02] 기본프로필 모듈 (성별, 출생연도, 직업, 식단, 관심사)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P02_PROFILE' && (
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
          )}

          {/* ----------------------------------------------------------
              [P03] 자가진단 모듈 (5대 대분류 100점 자가 평가 - 이전/다음 양방향)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P03_SELF_DIAG' && (
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
              [P05] 모임신청 모듈 (Timeleft식 2.5만 원 참가비 & 세대별 트랙)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P05_EVENT_APPLY' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">소셜 다이닝 모임 신청</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    3045 프라임 및 5060 골든 솔로를 위한 검증된 테이블에 참가 신청합니다. (참가권 ₩25,000 / 식대는 현장 1/N)
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
                      : 'bg-rose-950/40 text-rose-200 border-rose-500/30'
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
                            {dist ? `${dist.regionName} · ${dist.districtName}` : '부산 · 전포'}
                          </span>
                          {ev.targetAgeGroup === '3045_PRIME' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 text-xs font-semibold border border-rose-500/25">
                              3045 프라임 트랙
                            </span>
                          )}
                          {ev.targetAgeGroup === '5060_GOLDEN' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/25">
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
                          <span className="text-emerald-400">✓</span>
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
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
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
                            const res = applyForConditionalEvent(ev.eventId);
                            setApplyFeedback(res);
                          }}
                          className={`px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                            isApplied
                              ? 'bg-white/10 text-zinc-400 border border-white/10 cursor-not-allowed'
                              : 'bg-white hover:bg-zinc-200 text-zinc-950 shadow-md'
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
              [P06] 좌석배정 모듈 (6인 테이블 및 1부/2부 좌석 확인)
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
                    좌석배정 (6인 테이블)
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
              [P08] 개인평가 모듈 (5대분류 × 5중분류 × 5대 평가기준 = 20점/100점 정규화)
              ---------------------------------------------------------- */}
          {currentProcess?.processId === 'P08_EVALUATION' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-2xl font-bold text-white">
                  개인평가 (5×5×5 정규화 엔진)
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  동석자를 선택하고 이번 모임에 배정된 핵심 요소({activeEvalSubElements.length}개)를 5대 기준(정돈 · 조화 · 센스 · 안정 · 호감)으로 평가합니다.
                </p>
              </div>

              {/* 1. 평가 대상 동석자 선택 */}
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">
                  1. 평가할 동석자 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {tablePeers.map((peer) => (
                    <button
                      key={peer.userId}
                      type="button"
                      onClick={() => setEvalTargetUserId(peer.userId)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold border cursor-pointer ${
                        evalTargetUserId === peer.userId
                          ? 'bg-[#10131c] text-white border-stone-900'
                          : 'bg-[#10131c] text-zinc-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {peer.nickname} ({peer.gender === 'F' ? '여' : '남'} ·{' '}
                      {peer.birthYear}년생)
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 이번 모임 활성 평가 요소 탭 (양방향 이동 가능) */}
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">
                  2. 평가 요소 선택 (현재 모임 프리셋:{' '}
                  {activeEvalSubElements.length}개 항목 활성화됨)
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeEvalSubElements.map((sub, idx) => {
                    const dom = majorDomains.find(
                      (d) => d.code === sub.majorCode
                    );
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setEvalSubIdx(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          evalSubIdx === idx
                            ? 'bg-white text-zinc-950'
                            : 'bg-[#1c202e] text-zinc-400 hover:text-white'
                        }`}
                      >
                        [{dom?.label}] {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. 선택된 요소에 대한 5대 기준(정돈·조화·센스·안정·호감) 채점 */}
              {currentEvalSub && (
                <div className="p-6 rounded-2xl bg-[#1c202e] border border-white/10 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-xs font-mono text-zinc-400">
                        항목 {evalSubIdx + 1} / {activeEvalSubElements.length} ·{' '}
                        {
                          majorDomains.find(
                            (d) => d.code === currentEvalSub.majorCode
                          )?.label
                        }{' '}
                        대분류
                      </span>
                      <h4 className="text-2xl font-bold text-white mt-0.5">
                        [{currentEvalSub.label}] 요소 5기준 평가
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-mono text-white">
                        {EvaluationMatrixEngine.computeSubScore20(
                          draftCriteriaScores
                        )}
                        점
                      </span>
                      <span className="text-xs text-zinc-400 block">
                        / 20점 만점 (5기준 × 4점)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {evaluationCriteria.map((crit) => {
                      const val = draftCriteriaScores[crit.code] ?? 4;
                      return (
                        <div
                          key={crit.code}
                          className="p-4 rounded-xl bg-[#1c202e] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <span className="text-base font-bold text-white">
                              {crit.stepOrder}. {crit.label}
                            </span>
                            <p className="text-xs text-zinc-400">
                              {crit.definition}
                            </p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {[1, 2, 3, 4, 5].map((scoreNum) => (
                              <button
                                key={scoreNum}
                                type="button"
                                onClick={() =>
                                  setDraftCriteriaScores((prev) => ({
                                    ...prev,
                                    [crit.code]: scoreNum,
                                  }))
                                }
                                className={`w-10 h-10 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                                  val === scoreNum
                                    ? 'bg-white text-zinc-950'
                                    : 'bg-[#1c202e] text-zinc-400 hover:text-white'
                                }`}
                              >
                                {scoreNum}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {evalSavedMsg && (
                    <div className="p-3 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-medium">
                      {evalSavedMsg}
                    </div>
                  )}

                  {/* 이전 요소 / 저장 / 다음 요소 양방향 컨트롤 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      disabled={evalSubIdx === 0}
                      onClick={() => setEvalSubIdx((p) => Math.max(0, p - 1))}
                      className="px-4 py-2.5 rounded-xl border border-white/10 bg-[#10131c] text-zinc-400 hover:text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      이전 요소
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        submitMatrixEvaluation(
                          evalTargetUserId,
                          currentEvalSub.id,
                          draftCriteriaScores
                        );
                        const targetNick =
                          tablePeers.find((p) => p.userId === evalTargetUserId)
                            ?.nickname ?? evalTargetUserId;
                        setEvalSavedMsg(
                          `[${targetNick}]님의 [${currentEvalSub.label}] 평가(${EvaluationMatrixEngine.computeSubScore20(
                            draftCriteriaScores
                          )}/20점)가 프로파일 DB에 저장되었습니다.`
                        );
                        setTimeout(() => setEvalSavedMsg(null), 2500);
                      }}
                      className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold cursor-pointer transition-all"
                    >
                      현재 요소 점수 저장
                    </button>

                    <button
                      type="button"
                      disabled={evalSubIdx >= activeEvalSubElements.length - 1}
                      onClick={() =>
                        setEvalSubIdx((p) =>
                          Math.min(activeEvalSubElements.length - 1, p + 1)
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-[#10131c] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      다음 요소 ▶
                    </button>
                  </div>
                </div>
              )}
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
                  <span className="text-xs font-mono text-zinc-500 uppercase">
                    5×5×5 PERSONAL DOSSIER
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    개인 마스터 코칭 프로파일 (100점 정규화 지표)
                  </h3>
                </div>
                <Link
                  href="/mirror"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-medium transition-all"
                >
                  전용 리포트 페이지에서 크게 보기 →
                </Link>
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

              {/* 3. 5대 평가 기준(정돈·조화·센스·안정·호감) 오각형 밸런스 지표 (각 20점 × 5 = 100점) */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3">
                  2. 5대 평가 기준 밸런스 지표 (각 20점 × 5기준 = 100점)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {evaluationCriteria.map((crit) => {
                    const score20 =
                      myPersonalDossier.criteriaRadar20[crit.code] ?? 15;
                    return (
                      <div
                        key={crit.code}
                        className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 text-center"
                      >
                        <p className="text-xs font-medium text-zinc-400">
                          {crit.label}
                        </p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {score20}
                          <span className="text-xs text-zinc-500"> / 20</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. 핀포인트 사각지대 코칭 처방 & 강점 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 sm:p-6 rounded-2xl bg-[#181c28] border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
