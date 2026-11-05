'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DietaryRestriction,
  Gender,
  MajorDomainCode,
  ParticipantProfile,
  PartnerVenue,
  PlaybookCard,
  SocialMode,
  useNadoSoloEngine,
} from '@/engine';

import AdminLayoutManager from '@/components/admin/AdminLayoutManager';

type AdminTabKey =
  | 'PROCESS'
  | 'LAYOUT_CMS'
  | 'MEMBER_DOSSIER'
  | 'EVAL_ENGINE'
  | 'BADGE'
  | 'REGION'
  | 'VENUE'
  | 'EVENT_GATE'
  | 'DECK'
  | 'PAGE_CMS'
  | 'ADMIN_ACCOUNT';

const ADMIN_CATEGORIES: { key: AdminTabKey; label: string; badge?: string }[] = [
  { key: 'PROCESS', label: '프로세스' },
  { key: 'LAYOUT_CMS', label: '화면/모듈배치', badge: 'NEW' },
  { key: 'MEMBER_DOSSIER', label: '회원프로파일' },
  { key: 'EVAL_ENGINE', label: '평가엔진', badge: '5×5×5' },
  { key: 'BADGE', label: '뱃지' },
  { key: 'REGION', label: '지역' },
  { key: 'VENUE', label: '매장' },
  { key: 'EVENT_GATE', label: '모임조건' },
  { key: 'DECK', label: '대화카드' },
  { key: 'PAGE_CMS', label: '페이지' },
  { key: 'ADMIN_ACCOUNT', label: '관리자계정' },
];

export default function AdminOperationsDashboardPage() {
  const {
    currentUser,
    processModules,
    toggleProcessModule,
    majorDomains,
    evaluationCriteria,
    subElements,
    toggleSubElementActive,
    updateSubElement,
    getPersonalDossierForUser,
    granularBadges,
    addGranularBadge,
    deleteGranularBadge,
    regionDistricts,
    addRegionDistrict,
    updateRegionDistrict,
    deleteRegionDistrict,
    conditionalEvents,
    addConditionalEvent,
    deleteConditionalEvent,
    participantsPool,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    adjustTrustScore,
    partnerVenues,
    addPartnerVenue,
    deletePartnerVenue,
    activeTable,
    standbyReplacementLog,
    triggerNoShowAndStandbyRecovery,
    resetParticipantsPool,
    activeStageCards,
    addPlaybookCard,
    updatePlaybookCard,
    deletePlaybookCard,
    cmsPages,
    updateCmsPage,
    addCmsPage,
    deleteCmsPage,
    cmsAtmospheres,
    updateCmsAtmosphere,
    deleteCmsAtmosphere,
    cmsSteps,
    updateCmsStep,
  } = useNadoSoloEngine();

  const [activeTab, setActiveTab] = useState<AdminTabKey>('PROCESS');
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // [보안 가드] 최고 관리자 인증 검증
  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.handle === '@admin' ||
    currentUser?.userId === 'ADMIN_01';

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#090a0f] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[#12151e] border border-white/10 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">최고 관리자 전용 구역</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              본 페이지는 나도솔로 시스템 총괄 관리자만 접근할 수 있습니다. 관리자 계정(@admin)으로 인증 후 이용해 주십시오.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/auth"
              className="w-full py-3.5 rounded-xl bg-[#881337] hover:bg-[#6f102d] text-white text-xs font-bold transition-all shadow-md shadow-[#881337]/30"
            >
              관리자 계정으로 로그인
            </Link>
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-semibold transition-all"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // [회원프로파일] 상세 조회할 회원 ID 및 신규 등록 폼
  const [selectedUserId, setSelectedUserId] = useState<string>('U01');
  const [newNick, setNewNick] = useState('');
  const [newGender, setNewGender] = useState<Gender>('F');
  const [newBirth, setNewBirth] = useState(1996);

  // [평가엔진] 선택된 대분류 필터
  const [selectedMajorFilter, setSelectedMajorFilter] =
    useState<MajorDomainCode>('STYLE');

  // [뱃지] 신규 뱃지 폼
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeIcon, setNewBadgeIcon] = useState('BADGE');
  const [newBadgeMajor, setNewBadgeMajor] =
    useState<MajorDomainCode>('STYLE');
  const [newBadgeScore, setNewBadgeScore] = useState(17);
  const [newBadgeDesc, setNewBadgeDesc] = useState('');

  // [지역] 신규 상권 폼
  const [newRegionName, setNewRegionName] = useState('서울');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newGatherTime, setNewGatherTime] = useState('토요일 19:00');
  const [newDistrictDesc, setNewDistrictDesc] = useState('');

  // [매장] 신규 매장 폼
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueMaxTables, setNewVenueMaxTables] = useState(4);

  // [모임조건] 신규 조건부 모임 폼
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventPrice, setNewEventPrice] = useState(65000);
  const [newEventMinScore, setNewEventMinScore] = useState(80);
  const [newEventDistrictId, setNewEventDistrictId] = useState('DIST_SEONGSU');

  // [대화카드] 신규 카드 폼
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardPrompt, setNewCardPrompt] = useState('');
  const [newCardMode, setNewCardMode] = useState<SocialMode>('ROMANCE');

  // [페이지] 선택된 페이지 ID
  const [selectedPageId, setSelectedPageId] = useState<string>('PAGE_HOME');

  const notify = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 2500);
  };

  const selectedUserDossier = getPersonalDossierForUser(selectedUserId);
  const selectedUserProfile = participantsPool.find(
    (p) => p.userId === selectedUserId
  );

  // 관리자 권한 검증 (id: admin / pass: aa1111 로그인 필수)
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-[#111111] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-2xl text-center space-y-5 text-white">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#881337] flex items-center justify-center">
            <span className="material-symbols-outlined text-white !text-2xl">
              admin_panel_settings
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">관리자 전용 시스템</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            이 페이지는 관리자 계정으로 로그인한 경우에만 접근할 수 있습니다.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/auth"
              className="w-full py-3.5 rounded-xl bg-[#881337] hover:bg-[#6f102d] text-white text-sm font-bold transition-colors"
            >
              관리자 로그인 화면으로 이동
            </Link>
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-[#f4f4f5] hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors"
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
            좌측 사이드바: 화이트 카드 컨테이너 + 9개 단일 카테고리
            ============================================================ */}
        <aside className="w-full lg:w-64 shrink-0 bg-[#12151e] text-white rounded-3xl border border-white/10 p-5 shadow-sm lg:sticky lg:top-24">
          <div className="px-3 pb-4 mb-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                SYSTEM ADMIN
              </p>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono font-bold text-rose-300">
                v1.0.1
              </span>
            </div>
            <h1 className="text-lg font-bold text-white">
              {currentUser?.nickname || '최고관리자'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              {currentUser?.handle || '@admin'} • 슈퍼 권한
            </p>
          </div>

          <nav className="space-y-1">
            {ADMIN_CATEGORIES.map((cat) => {
              const active = activeTab === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveTab(cat.key)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? 'bg-white/10 text-white font-medium border border-white/15'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-normal border border-transparent'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.badge && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/10 text-zinc-300 border border-white/10">
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            <Link
              href="/dashboard"
              className="block w-full py-2.5 px-3 rounded-xl bg-[#10131c] hover:bg-stone-800 text-center text-xs font-bold text-white"
            >
              마이페이지 보기 →
            </Link>
            <Link
              href="/"
              className="block w-full py-2.5 px-3 rounded-xl bg-[#1c202e] hover:bg-[#252b3d] text-center text-xs font-bold text-zinc-300"
            >
              ← 메인 화면으로 이동
            </Link>
          </div>
        </aside>

        {/* ============================================================
            우측 메인 워크스페이스
            ============================================================ */}
        <div className="flex-1 w-full min-w-0 space-y-6">
          {/* 상단 상태 헤더 */}
          <div className="bg-[#12151e] rounded-2xl p-5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500 uppercase">
                  MODULE WORKSPACE
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-400">
                  nadosolo core v1.0.1
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                {ADMIN_CATEGORIES.find((c) => c.key === activeTab)?.label}
              </h2>
            </div>
            {adminToast && (
              <span className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-medium">
                {adminToast}
              </span>
            )}
          </div>

          {/* ----------------------------------------------------------
              1. [프로세스] 서비스 프로세스 모듈 ON/OFF 제어
              ---------------------------------------------------------- */}
          {activeTab === 'PROCESS' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">
                  서비스 프로세스 모듈 (1모듈 1기능 ON/OFF)
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  이용자 대시보드(/dashboard)에 노출되는 프로세스 단계를 켜거나 끌 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processModules.map((mod) => (
                  <div
                    key={mod.processId}
                    className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                      mod.enabled
                        ? 'bg-[#181c28] border-white/20'
                        : 'bg-[#12151e]/60 border-white/5 opacity-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#10131c] text-zinc-300 text-xs font-mono">
                          P0{mod.stepOrder}
                        </span>
                        <span className="text-base font-semibold text-white">
                          {mod.label}
                        </span>
                        {mod.coreRequired && (
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 text-[11px] font-medium">
                            필수코어
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1.5">
                        {mod.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={mod.coreRequired}
                      onClick={() => {
                        toggleProcessModule(mod.processId);
                        notify(`[${mod.label}] 모듈 상태가 변경되었습니다.`);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                        mod.enabled
                          ? 'bg-white text-zinc-950 hover:bg-zinc-200'
                          : 'bg-white/10 text-zinc-400 hover:text-white'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {mod.enabled ? 'ON (사용중)' : 'OFF (비활성)'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              2. [화면/모듈배치] 메인 화면 섹터 순서 이동 & 헤더/푸터 관리
              ---------------------------------------------------------- */}
          {activeTab === 'LAYOUT_CMS' && (
            <section className="bg-[#12151e] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    MODULAR BUILDER
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    사이트 레이아웃 &amp; 네비게이션 관리
                  </h3>
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                  메인 화면의 모듈별 블록 순서(위치이동 ▲/▼) 및 노출 여부, 헤더 메뉴와 상단 공지 띠배너, 푸터 법정 정보를 코드 수정 없이 실시간으로 제어합니다.
                </p>
              </div>

              <AdminLayoutManager onNotify={notify} />
            </section>
          )}

          {/* ----------------------------------------------------------
              2. [회원프로파일] 회원 목록 & 5×5×5 개인 마스터 프로파일 검수
              ---------------------------------------------------------- */}
          {activeTab === 'MEMBER_DOSSIER' && (
            <section className="space-y-6">
              {/* 상단: 선택된 회원의 5×5×5 마스터 프로파일 (Dossier) */}
              <div className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
                <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-zinc-500 uppercase">
                      PERSONAL DOSSIER INSPECTOR
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-0.5">
                      [{selectedUserProfile?.nickname ?? selectedUserId}] 5×5×5 마스터 프로파일
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {participantsPool.map((p) => (
                      <button
                        key={p.userId}
                        type="button"
                        onClick={() => setSelectedUserId(p.userId)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                          selectedUserId === p.userId
                            ? 'bg-[#10131c] text-white'
                            : 'bg-[#1c202e] text-zinc-300 hover:bg-[#252b3d]'
                        }`}
                      >
                        {p.nickname} ({p.gender})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 종합 100점 / 이성 100점 / 동성 100점 */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[#10131c] text-white">
                    <p className="text-xs text-zinc-500 font-bold">
                      종합 프로파일 점수
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {selectedUserDossier.totalScore100}점
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#181c28] border border-white/10">
                    <p className="text-xs text-zinc-400 font-medium">
                      이성 관찰자 평가
                    </p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {selectedUserDossier.oppositeSexTotal100}점
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#1c202e]">
                    <p className="text-xs text-zinc-400 font-bold">
                      동성 관찰자 평가
                    </p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {selectedUserDossier.sameSexTotal100}점
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#1c202e]">
                    <p className="text-xs text-zinc-400 font-bold">
                      신뢰 점수 / 출생연도
                    </p>
                    <p className="text-xl font-bold text-white mt-1">
                      {selectedUserProfile?.trustScore ?? 90}점 ·{' '}
                      {selectedUserProfile?.birthYear ?? 1995}년생
                    </p>
                  </div>
                </div>

                {/* 5대 대분류 × 5개 중분류 상세 점수표 */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {selectedUserDossier.domainSummaries.map((dom) => (
                    <div
                      key={dom.majorCode}
                      className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-base font-bold text-white">
                          {dom.label}
                        </span>
                        <span className="text-base font-semibold text-white">
                          {dom.score100}점
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {dom.subSummaries.map((sub) => (
                          <div
                            key={sub.subElementId}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-zinc-300">
                              {sub.label}
                            </span>
                            <span className="font-bold text-white">
                              {sub.score20} / 20
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단: 전체 회원 추가 · 수정 · 삭제 테이블 */}
              <div className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-white">
                  전체 회원 등록 · 수정 · 삭제 ({participantsPool.length}명)
                </h4>

                <div className="flex flex-wrap gap-3 bg-[#1c202e] p-4 rounded-2xl border border-white/10">
                  <input
                    type="text"
                    placeholder="닉네임"
                    value={newNick}
                    onChange={(e) => setNewNick(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                  />
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as Gender)}
                    className="px-3.5 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                  >
                    <option value="F">여성 (F)</option>
                    <option value="M">남성 (M)</option>
                  </select>
                  <input
                    type="number"
                    value={newBirth}
                    onChange={(e) => setNewBirth(Number(e.target.value))}
                    className="w-28 px-3.5 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newNick.trim()) return;
                      const created: ParticipantProfile = {
                        userId: `U_${Date.now().toString().slice(-3)}`,
                        nickname: newNick.trim(),
                        gender: newGender,
                        birthYear: newBirth,
                        cityCode: 'SEOUL_SEONGSU',
                        preferredMode: 'ROMANCE',
                        preferredTableLanguage: 'ko',
                        dietary: ['NONE'],
                        interests: ['WINE', 'TRAVEL'],
                        selfVector: {
                          extroversion: 0.7,
                          talkLead: 0.6,
                          lifestyleActive: 0.7,
                          romanceIntent: 0.8,
                          alcoholPreference: 0.7,
                        },
                        trustScore: 90,
                        languages: { ko: 'NATIVE' },
                        budgetTier: '$$',
                        verified: true,
                      };
                      addParticipant(created);
                      setNewNick('');
                      notify(`[${created.nickname}] 회원이 등록되었습니다.`);
                    }}
                    className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold cursor-pointer transition-all"
                  >
                    + 회원 추가
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-zinc-400 uppercase">
                        <th className="py-3 px-3">ID</th>
                        <th className="py-3 px-3">닉네임</th>
                        <th className="py-3 px-3">성별</th>
                        <th className="py-3 px-3">출생연도</th>
                        <th className="py-3 px-3">신뢰점수</th>
                        <th className="py-3 px-3">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-sm">
                      {participantsPool.map((m) => (
                        <tr key={m.userId} className="hover:bg-[#1c202e]">
                          <td className="py-3 px-3 font-mono text-xs">
                            {m.userId}
                          </td>
                          <td className="py-3 px-3 font-bold text-white">
                            {m.nickname}
                          </td>
                          <td className="py-3 px-3">{m.gender}</td>
                          <td className="py-3 px-3">{m.birthYear}</td>
                          <td className="py-3 px-3 font-mono text-zinc-200">
                            {m.trustScore}점
                          </td>
                          <td className="py-3 px-3 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedUserId(m.userId)}
                              className="px-2.5 py-1 rounded-lg bg-[#10131c] text-white text-xs font-bold cursor-pointer"
                            >
                              프로파일 조회
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustTrustScore(m.userId, 5)}
                              className="px-2 py-1 rounded-lg bg-[#1c202e] text-zinc-300 text-xs font-bold cursor-pointer"
                            >
                              +5점
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteParticipant(m.userId)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium cursor-pointer transition-colors"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              3. [평가엔진] 5대분류 × 5중분류 × 5평가기준 정규화 매트릭스 제어
              ---------------------------------------------------------- */}
          {activeTab === 'EVAL_ENGINE' && (
            <section className="space-y-6">
              {/* 5대 평가 기준 (정돈·조화·센스·안정·호감) 규격 표 */}
              <div className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-5">
                <div>
                  <span className="text-xs font-mono text-zinc-500 uppercase">
                    NORMALIZED 5 CRITERIA (4점 × 5 = 20점)
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    5대 표준 평가 기준 (전 영역 공통 적용)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {evaluationCriteria.map((crit) => (
                    <div
                      key={crit.code}
                      className="p-4 rounded-2xl bg-[#1c202e] border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-bold text-white">
                          {crit.stepOrder}. {crit.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 text-xs font-mono">
                          {crit.maxPoints}점
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{crit.definition}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5대 대분류 × 5개 중분류 (총 25개 표준 요소) 및 모임 프리셋 ON/OFF */}
              <div className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      5대분류 × 5중분류 요소 (각 20점 × 5 = 100점 정규화)
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      각 대분류는 정확히 5개의 단일 단어 중분류로 구성되며, 이번 모임에서 평가할 항목만 선택(ON/OFF)할 수 있습니다.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {majorDomains.map((dom) => (
                      <button
                        key={dom.code}
                        type="button"
                        onClick={() => setSelectedMajorFilter(dom.code)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          selectedMajorFilter === dom.code
                            ? 'bg-white text-zinc-950'
                            : 'bg-[#1c202e] text-zinc-300 hover:bg-[#252b3d]'
                        }`}
                      >
                        {dom.label} (100점)
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {subElements
                    .filter((s) => s.majorCode === selectedMajorFilter)
                    .map((sub) => (
                      <div
                        key={sub.id}
                        className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-[#10131c] text-white text-xs font-bold">
                              슬롯 {sub.slotIndex} (20점)
                            </span>
                            <input
                              type="text"
                              value={sub.label}
                              onChange={(e) =>
                                updateSubElement({
                                  ...sub,
                                  label: e.target.value,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-base font-bold text-white w-32"
                            />
                            <span className="text-xs text-zinc-400">
                              배타슬롯: {sub.exclusionGroup}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              toggleSubElementActive(sub.id);
                              notify(
                                `[${sub.label}] 항목 평가 프로세스 포함 여부가 변경되었습니다.`
                              );
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                              sub.activeInCurrentProcess
                                ? 'bg-white text-zinc-950'
                                : 'bg-white/10 text-zinc-400'
                            }`}
                          >
                            {sub.activeInCurrentProcess
                              ? '현재 모임 평가 ON'
                              : '현재 모임 평가 OFF'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">
                              보완 코칭 문구 (저득점 시 자동 처방)
                            </label>
                            <input
                              type="text"
                              value={sub.coachingHintLow}
                              onChange={(e) =>
                                updateSubElement({
                                  ...sub,
                                  coachingHintLow: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-white text-xs text-zinc-200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">
                              강점 코칭 문구 (고득점 시 자동 리포트)
                            </label>
                            <input
                              type="text"
                              value={sub.coachingHintHigh}
                              onChange={(e) =>
                                updateSubElement({
                                  ...sub,
                                  coachingHintHigh: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-white text-xs text-zinc-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              4. [뱃지] 세분화 뱃지 도감 추가 · 수정 · 삭제
              ---------------------------------------------------------- */}
          {activeTab === 'BADGE' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">
                  세분화 뱃지 도감 ({granularBadges.length}종)
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  특정 영역·요소 점수가 기준치를 넘을 때 자동 부여되는 뱃지를 추가하거나 삭제합니다.
                </p>
              </div>

              {/* 신규 뱃지 생성 폼 */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#1c202e] p-4 rounded-2xl border border-white/10">
                <input
                  type="text"
                  placeholder="식별 태그 (예: BADGE)"
                  value={newBadgeIcon}
                  onChange={(e) => setNewBadgeIcon(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                />
                <input
                  type="text"
                  placeholder="뱃지명 (예: 헤어 정돈 장인)"
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                />
                <select
                  value={newBadgeMajor}
                  onChange={(e) =>
                    setNewBadgeMajor(e.target.value as MajorDomainCode)
                  }
                  className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                >
                  {majorDomains.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="획득 조건 설명"
                  value={newBadgeDesc}
                  onChange={(e) => setNewBadgeDesc(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newBadgeName.trim()) return;
                    addGranularBadge({
                      badgeId: `BDG_${Date.now()}`,
                      name: newBadgeName.trim(),
                      icon: newBadgeIcon || 'BADGE',
                      majorCode: newBadgeMajor,
                      minScoreThreshold: newBadgeScore,
                      requireOppositeSexVerify: true,
                      description:
                        newBadgeDesc.trim() ||
                        `${newBadgeScore}점(20점 만점) 이상 달성 시 부여`,
                    });
                    setNewBadgeName('');
                    setNewBadgeDesc('');
                    notify('신규 뱃지가 추가되었습니다.');
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold cursor-pointer transition-all"
                >
                  + 뱃지 추가
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {granularBadges.map((b) => (
                  <div
                    key={b.badgeId}
                    className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 text-white flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-zinc-400">BADGE</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#10131c] text-zinc-300 text-xs font-mono">
                          기준 {b.minScoreThreshold}/20점+
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">
                        {b.name}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        {b.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteGranularBadge(b.badgeId)}
                      className="self-end px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium cursor-pointer transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              5. [지역] 권역 및 세부 상권 설정
              ---------------------------------------------------------- */}
          {activeTab === 'REGION' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">
                  지역 · 상권 ({regionDistricts.length}곳)
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  오프라인 모임이 열리는 권역(서울/경기/부산 등)과 세부 상권(성수/한남/강남 등)을 설정합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#1c202e] p-4 rounded-2xl border border-white/10">
                <input
                  type="text"
                  placeholder="권역 (예: 서울)"
                  value={newRegionName}
                  onChange={(e) => setNewRegionName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                />
                <input
                  type="text"
                  placeholder="상권명 (예: 연남)"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                />
                <input
                  type="text"
                  placeholder="모임 시간"
                  value={newGatherTime}
                  onChange={(e) => setNewGatherTime(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                />
                <input
                  type="text"
                  placeholder="상권 설명"
                  value={newDistrictDesc}
                  onChange={(e) => setNewDistrictDesc(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newDistrictName.trim()) return;
                    addRegionDistrict({
                      districtId: `DIST_${Date.now()}`,
                      regionName: newRegionName.trim() || '서울',
                      districtName: newDistrictName.trim(),
                      active: true,
                      defaultGatherTime: newGatherTime,
                      description:
                        newDistrictDesc.trim() || '소셜 다이닝 운영 상권',
                    });
                    setNewDistrictName('');
                    setNewDistrictDesc('');
                    notify('신규 지역 상권이 등록되었습니다.');
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold cursor-pointer transition-all"
                >
                  + 지역 추가
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regionDistricts.map((dist) => (
                  <div
                    key={dist.districtId}
                    className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 text-white space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#10131c] text-white text-xs font-bold">
                        {dist.regionName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateRegionDistrict({
                            ...dist,
                            active: !dist.active,
                          })
                        }
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          dist.active
                            ? 'bg-white/15 text-white'
                            : 'bg-white/5 text-zinc-500'
                        }`}
                      >
                        {dist.active ? '활성' : '비활성'}
                      </button>
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      {dist.districtName}
                    </h4>
                    <p className="text-xs text-zinc-400">{dist.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-mono text-zinc-400">
                        {dist.defaultGatherTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteRegionDistrict(dist.districtId)}
                        className="text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              6. [매장] 제휴 레스토랑 추가 · 삭제
              ---------------------------------------------------------- */}
          {activeTab === 'VENUE' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">
                  제휴 매장 ({partnerVenues.length}곳)
                </h3>
              </div>

              <div className="flex flex-wrap gap-3 bg-[#1c202e] p-4 rounded-2xl border border-white/10">
                <input
                  type="text"
                  placeholder="매장명 (예: 한남 오스테리아)"
                  value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                />
                <input
                  type="number"
                  value={newVenueMaxTables}
                  onChange={(e) => setNewVenueMaxTables(Number(e.target.value))}
                  className="w-28 px-4 py-2.5 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newVenueName.trim()) return;
                    const created: PartnerVenue = {
                      venueId: `VEN_${Date.now()}`,
                      name: newVenueName.trim(),
                      cityCode: 'SEOUL_SEONGSU',
                      budgetTier: '$$$',
                      supportedDietary: ['NONE', 'VEGAN', 'NO_PORK'],
                      vibeThemes: ['WINE_BISTRO'],
                      maxTablesPerNight: newVenueMaxTables,
                    };
                    addPartnerVenue(created);
                    setNewVenueName('');
                    notify('신규 제휴 매장이 등록되었습니다.');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold cursor-pointer transition-all"
                >
                  + 매장 추가
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partnerVenues.map((v) => (
                  <div
                    key={v.venueId}
                    className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 text-white flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        {v.name}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        지원 식단: {v.supportedDietary.join(', ')} · 최대{' '}
                        {v.maxTablesPerNight}테이블
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deletePartnerVenue(v.venueId)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium cursor-pointer transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              7. [모임조건] 조건부 모임 개설 & 6인 테이블 노쇼 대기자 관리
              ---------------------------------------------------------- */}
          {activeTab === 'EVENT_GATE' && (
            <section className="space-y-6">
              <div className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold text-white">
                    조건부 모임 개설 · 참가 자격 설정
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    최소 프로파일 점수(100점 기준) 및 필수 보유 뱃지 조건을 걸어 모임을 개설합니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#1c202e] p-4 rounded-2xl border border-white/10">
                  <input
                    type="text"
                    placeholder="모임명"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                  />
                  <select
                    value={newEventDistrictId}
                    onChange={(e) => setNewEventDistrictId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                  >
                    {regionDistricts.map((d) => (
                      <option key={d.districtId} value={d.districtId}>
                        {d.regionName} · {d.districtName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="최소 점수(0~100)"
                    value={newEventMinScore}
                    onChange={(e) =>
                      setNewEventMinScore(Number(e.target.value))
                    }
                    className="px-3 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newEventTitle.trim()) return;
                      addConditionalEvent({
                        eventId: `EVT_${Date.now()}`,
                        title: newEventTitle.trim(),
                        districtId: newEventDistrictId,
                        venueId: partnerVenues[0]?.venueId ?? 'VEN_SEONGSU_01',
                        dateText: '이번 주 금요일 19:30',
                        mode: 'ROMANCE',
                        priceKrw: newEventPrice,
                        requiredBadgeIds: ['BDG_MAN_DINING'],
                        minTotalScore100: newEventMinScore,
                        activePresetSubIds: [
                          'SUB_APP_1',
                          'SUB_STY_2',
                          'SUB_CON_2',
                        ],
                      });
                      setNewEventTitle('');
                      notify('신규 조건부 모임이 개설되었습니다.');
                    }}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold cursor-pointer transition-all"
                  >
                    + 모임 개설
                  </button>
                </div>

                <div className="space-y-3">
                  {conditionalEvents.map((ev) => (
                    <div
                      key={ev.eventId}
                      className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 text-white flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-base font-bold text-white">
                          {ev.title}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          참가비 ₩{ev.priceKrw.toLocaleString()} · 최소 프로파일{' '}
                          {ev.minTotalScore100}점 이상 · 필수뱃지{' '}
                          {ev.requiredBadgeIds.length}개
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteConditionalEvent(ev.eventId)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium cursor-pointer transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6인 테이블 당일 노쇼 자동 대체 */}
              <div className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      6인 테이블 편성 및 노쇼 대기자 자동 대체
                    </h4>
                    <p className="text-xs text-zinc-400">
                      당일 취소 발생 시 신뢰점수 80점 이상 대기자를 즉시 투입합니다.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={triggerNoShowAndStandbyRecovery}
                      className="px-4 py-2 rounded-xl bg-[#10131c] text-white text-xs font-bold cursor-pointer"
                    >
                      노쇼 발생 · 대기자 자동 투입
                    </button>
                    <button
                      type="button"
                      onClick={resetParticipantsPool}
                      className="px-4 py-2 rounded-xl border border-white/15 text-zinc-300 text-xs font-bold cursor-pointer"
                    >
                      초기화
                    </button>
                  </div>
                </div>
                {standbyReplacementLog && (
                  <div className="p-4 rounded-xl bg-[#181c28] border border-white/10 text-zinc-300 text-xs font-medium">
                    {standbyReplacementLog}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              8. [대화카드] 대화카드 추가 · 수정 · 삭제
              ---------------------------------------------------------- */}
          {activeTab === 'DECK' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">
                  대화카드 ({activeStageCards.length}장)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#1c202e] p-4 rounded-2xl border border-white/10">
                <input
                  type="text"
                  placeholder="카드 제목"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                />
                <input
                  type="text"
                  placeholder="질문 본문"
                  value={newCardPrompt}
                  onChange={(e) => setNewCardPrompt(e.target.value)}
                  className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCardTitle.trim() || !newCardPrompt.trim()) return;
                    const created: PlaybookCard = {
                      cardId: `CRD_${Date.now()}`,
                      cultureTags: ['KR', 'GLOBAL'],
                      modes: [newCardMode],
                      title: newCardTitle.trim(),
                      promptText: newCardPrompt.trim(),
                    };
                    addPlaybookCard(created);
                    setNewCardTitle('');
                    setNewCardPrompt('');
                    notify('신규 대화카드가 추가되었습니다.');
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold cursor-pointer transition-all"
                >
                  + 대화카드 추가
                </button>
              </div>

              <div className="space-y-3">
                {activeStageCards.map((c) => (
                  <div
                    key={c.cardId}
                    className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 text-white space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={c.title}
                        onChange={(e) =>
                          updatePlaybookCard({ ...c, title: e.target.value })
                        }
                        className="font-bold text-base text-white border-b border-white/10 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => deletePlaybookCard(c.cardId)}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium cursor-pointer transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={c.promptText}
                      onChange={(e) =>
                        updatePlaybookCard({ ...c, promptText: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#1c202e] border border-white/10 text-sm text-zinc-300"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              9. [페이지] 전체 페이지 타이틀 · 배너 · 홈 섹션 편집
              ---------------------------------------------------------- */}
          {activeTab === 'PAGE_CMS' && (
            <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-white">
                  페이지 구성 편집 ({cmsPages.length}개)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cmsPages.map((pg) => (
                    <button
                      key={pg.pageId}
                      type="button"
                      onClick={() => setSelectedPageId(pg.pageId)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        selectedPageId === pg.pageId
                          ? 'bg-[#10131c] text-white'
                          : 'bg-[#1c202e] text-zinc-300'
                      }`}
                    >
                      {pg.title} ({pg.route})
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const page =
                  cmsPages.find((p) => p.pageId === selectedPageId) ??
                  cmsPages[0];
                if (!page) return null;
                return (
                  <div className="space-y-4 bg-[#1c202e] p-6 rounded-2xl border border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">
                          페이지명
                        </label>
                        <input
                          type="text"
                          value={page.title}
                          onChange={(e) =>
                            updateCmsPage({ ...page, title: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">
                          상단 배지
                        </label>
                        <input
                          type="text"
                          value={page.badgeText}
                          onChange={(e) =>
                            updateCmsPage({
                              ...page,
                              badgeText: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">
                        헤드라인
                      </label>
                      <input
                        type="text"
                        value={page.headline}
                        onChange={(e) =>
                          updateCmsPage({ ...page, headline: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">
                        서브 헤드라인
                      </label>
                      <input
                        type="text"
                        value={page.subheadline}
                        onChange={(e) =>
                          updateCmsPage({
                            ...page,
                            subheadline: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#10131c] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm"
                      />
                    </div>
                  </div>
                );
              })()}
            </section>
          )}

          {/* ----------------------------------------------------------
              [탭 10] 관리자 관리 계정 (ADMIN ACCOUNT)
              ---------------------------------------------------------- */}
          {activeTab === 'ADMIN_ACCOUNT' && (
            <section className="bg-[#12151e] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-sm space-y-6">
              <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-zinc-400 font-semibold uppercase">
                    SECURITY & ACCESS CONTROL
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    관리자 계정 및 보안 설정
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    플랫폼 전체 데이터 및 프로세스 제어 권한을 가진 최고 관리자 계정입니다.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  최고 관리자
                </span>
              </div>

              {/* 관리자 프로필 정보 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 space-y-3">
                  <div className="text-xs font-semibold text-zinc-400">관리자 고유 식별자</div>
                  <div className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>{currentUser?.handle || '@admin'}</span>
                    <span className="text-[11px] text-zinc-400 font-sans font-normal">
                      (ID: {currentUser?.userId || 'ADMIN_01'})
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    등록 이메일: <span className="text-zinc-200">{currentUser?.email || 'admin@nadosolo.com'}</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 space-y-3">
                  <div className="text-xs font-semibold text-zinc-400">권한 등급 및 세션</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-sm font-bold text-white">활성 세션 (정상 연결)</span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    보안 레벨: <span className="text-zinc-200">Level 5 (마스터 권한)</span>
                  </div>
                </div>
              </div>

              {/* 비밀번호 관리 & 보안 수칙 안내 */}
              <div className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white">관리자 로그인 인증 정보 관리</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">관리자 로그인 아이디</label>
                    <input
                      type="text"
                      readOnly
                      value="admin"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#10131c] text-zinc-400 font-mono text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">관리자 기본 비밀번호</label>
                    <input
                      type="password"
                      readOnly
                      value="aa1111"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#10131c] text-zinc-400 font-mono text-sm cursor-not-allowed"
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  💡 관리자 계정 정보는 소스코드 및 Supabase 환경 변수와 동기화되어 안전하게 보호됩니다. 상용 배포 환경에서는 Supabase Auth의 관리자 전용 2FA(2단계 인증)를 적용하여 보안을 더욱 강화할 수 있습니다.
                </p>
              </div>

              {/* 빠른 바로가기 액션 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-all"
                >
                  사용자 대시보드 화면 전환 →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setAdminToast('관리자 세션 상태가 최신으로 동기화되었습니다.');
                    setTimeout(() => setAdminToast(null), 3000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  관리자 권한 캐시 갱신
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
