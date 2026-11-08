'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  DietaryRestriction,
  Gender,
  MajorDomainCode,
  ParticipantProfile,
  PartnerVenue,
  PlaybookCard,
  SocialMode,
  EvaluationRegistry,
  useNadoSoloEngine,
} from '@/engine';

import AdminLayoutManager from '@/components/admin/AdminLayoutManager';
import AdminDesignSystemInspector from '@/components/admin/AdminDesignSystemInspector';
import AdminSectionCard from '@/components/admin/AdminSectionCard';

type AdminTabKey =
  | 'PROCESS'
  | 'AUDIT'
  | 'EVENT_GATE'
  | 'MEMBER_EVAL'
  | 'MEMBER_MGMT'
  | 'MEMBER_DOSSIER'
  | 'EVAL_ENGINE'
  | 'BADGE'
  | 'REGION'
  | 'VENUE'
  | 'DECK'
  | 'LAYOUT_CMS'
  | 'PAGE_CMS'
  | 'DESIGN_SYSTEM'
  | 'ADMIN_ACCOUNT';

interface AdminCategoryItem {
  key: AdminTabKey;
  label: string;
  badge?: string;
}

interface AdminCategoryGroup {
  groupTitle: string;
  items: AdminCategoryItem[];
}

const ADMIN_CATEGORY_GROUPS: AdminCategoryGroup[] = [
  {
    groupTitle: '운영 관제',
    items: [
      { key: 'PROCESS', label: '프로세스' },
      { key: 'AUDIT', label: '품질점검' },
      { key: 'EVENT_GATE', label: '모임조건' },
    ],
  },
  {
    groupTitle: '평가 & 회원',
    items: [
      { key: 'MEMBER_EVAL', label: '회원평가' },
      { key: 'MEMBER_MGMT', label: '회원관리' },
      { key: 'EVAL_ENGINE', label: '평가엔진' },
      { key: 'BADGE', label: '뱃지' },
    ],
  },
  {
    groupTitle: '공간 & 콘텐츠',
    items: [
      { key: 'REGION', label: '지역' },
      { key: 'VENUE', label: '매장' },
      { key: 'DECK', label: '대화카드' },
    ],
  },
  {
    groupTitle: '사이트 설정',
    items: [
      { key: 'LAYOUT_CMS', label: '화면배치' },
      { key: 'PAGE_CMS', label: '페이지' },
      { key: 'DESIGN_SYSTEM', label: '디자인' },
      { key: 'ADMIN_ACCOUNT', label: '관리자계정' },
    ],
  },
];

const ALL_ADMIN_CATEGORIES: AdminCategoryItem[] = ADMIN_CATEGORY_GROUPS.flatMap((g) => g.items);

export default function AdminOperationsDashboardPage() {
  const {
    currentUser,
    fullJourneyAudit,
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
  // 관리자 화면 기본 테마: 다크 모노크롬 (시스템 헌법 표준)
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>('dark');

  // [대분류 아코디언] 열린 그룹 타이틀 목록 (기본값: 현재 활성 탭이 속한 그룹 1개만 열어 컴팩트하게 조망)
  const [openGroupTitles, setOpenGroupTitles] = useState<string[]>(['운영 관제']);

  const toggleGroup = useCallback((groupTitle: string) => {
    setOpenGroupTitles((prev) =>
      prev.includes(groupTitle)
        ? prev.filter((t) => t !== groupTitle)
        : [...prev, groupTitle]
    );
  }, []);

  const expandAllGroups = useCallback(() => {
    setOpenGroupTitles(ADMIN_CATEGORY_GROUPS.map((g) => g.groupTitle));
  }, []);

  const collapseAllGroups = useCallback(() => {
    setOpenGroupTitles([]);
  }, []);

  // [우측 메인 워크스페이스 아코디언] 섹션별 열림/닫힘 상태 관리 (기본 닫힘 / 펼침 제어)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const isSectionOpen = useCallback(
    (key: string, defaultVal = false) => {
      return openSections[key] !== undefined ? openSections[key] : defaultVal;
    },
    [openSections]
  );

  const toggleSection = useCallback(
    (key: string, defaultVal = false) => {
      setOpenSections((prev) => ({
        ...prev,
        [key]: !isSectionOpen(key, defaultVal),
      }));
    },
    [isSectionOpen]
  );

  const expandAllSections = useCallback((keys: string[]) => {
    setOpenSections((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = true));
      return next;
    });
  }, []);

  const collapseAllSections = useCallback((keys: string[]) => {
    setOpenSections((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = false));
      return next;
    });
  }, []);

  // [회원평가] 상세 조회할 회원 ID 및 검색/페이징 (10명 단위)
  const [selectedUserId, setSelectedUserId] = useState<string>('U01');
  const [evalMemberSearch, setEvalMemberSearch] = useState('');
  const [evalMemberGender, setEvalMemberGender] = useState<'ALL' | 'F' | 'M'>('ALL');
  const [evalMemberPage, setEvalMemberPage] = useState<number>(1);
  const EVAL_MEMBERS_PER_PAGE = 10;

  // [회원관리] 검색, 성별, 권역 필터 및 10명 단위 페이징
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberGenderFilter, setMemberGenderFilter] = useState<'ALL' | 'F' | 'M'>('ALL');
  const [memberCityFilter, setMemberCityFilter] = useState<string>('ALL');
  const [memberPage, setMemberPage] = useState<number>(1);
  const MEMBERS_PER_PAGE = 10;

  // [회원관리] 신규 등록 폼
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

  // 카테고리 탭 클릭 시 스크롤 점프 방지 및 소속 그룹 자동 오픈
  const handleSelectTab = useCallback((key: AdminTabKey) => {
    setActiveTab(key);
    const parentGroup = ADMIN_CATEGORY_GROUPS.find((g) =>
      g.items.some((item) => item.key === key)
    );
    if (parentGroup) {
      setOpenGroupTitles((prev) =>
        prev.includes(parentGroup.groupTitle)
          ? prev
          : [...prev, parentGroup.groupTitle]
      );
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  const notify = useCallback((msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 2500);
  }, []);

  const selectedUserDossier = useMemo(
    () => getPersonalDossierForUser(selectedUserId),
    [getPersonalDossierForUser, selectedUserId]
  );

  const selectedUserProfile = useMemo(
    () => participantsPool.find((p) => p.userId === selectedUserId),
    [participantsPool, selectedUserId]
  );

  // [회원관리] 필터링 및 10명 단위 페이징 연산
  const filteredMembers = useMemo(() => {
    return participantsPool.filter((p) => {
      const q = memberSearchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.nickname.toLowerCase().includes(q) ||
        p.userId.toLowerCase().includes(q);
      const matchGender =
        memberGenderFilter === 'ALL' || p.gender === memberGenderFilter;
      const matchCity =
        memberCityFilter === 'ALL' || (p.cityCode && p.cityCode.includes(memberCityFilter));
      return matchQuery && matchGender && matchCity;
    });
  }, [participantsPool, memberSearchQuery, memberGenderFilter, memberCityFilter]);

  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE));
  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * MEMBERS_PER_PAGE;
    return filteredMembers.slice(start, start + MEMBERS_PER_PAGE);
  }, [filteredMembers, memberPage]);

  // [회원평가] 회원 선택 필터링 및 10명 단위 페이징 연산
  const evalFilteredMembers = useMemo(() => {
    return participantsPool.filter((p) => {
      const q = evalMemberSearch.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.nickname.toLowerCase().includes(q) ||
        p.userId.toLowerCase().includes(q);
      const matchGender =
        evalMemberGender === 'ALL' || p.gender === evalMemberGender;
      return matchQuery && matchGender;
    });
  }, [participantsPool, evalMemberSearch, evalMemberGender]);

  const totalEvalMemberPages = Math.max(1, Math.ceil(evalFilteredMembers.length / EVAL_MEMBERS_PER_PAGE));
  const paginatedEvalMembers = useMemo(() => {
    const start = (evalMemberPage - 1) * EVAL_MEMBERS_PER_PAGE;
    return evalFilteredMembers.slice(start, start + EVAL_MEMBERS_PER_PAGE);
  }, [evalFilteredMembers, evalMemberPage]);

  // [보안 가드] 최고 관리자 인증 검증
  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.handle === '@admin' ||
    currentUser?.userId === 'ADMIN_01';

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#07080a] flex items-center justify-center px-6 text-[#f5f2eb]">
        <div className="max-w-md w-full bg-[#0c0d12] border border-white/[0.08] rounded-none p-8 sm:p-10 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-transparent border border-[#f04f74]/60 text-[#f04f74] flex items-center justify-center mx-auto text-xl font-mono font-bold">
            !
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold">
              RESTRICTED CONSOLE
            </span>
            <h1 className="font-serif-editorial text-2xl font-normal text-white">최고 관리자 전용 구역</h1>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              본 콘솔은 나도솔로 시스템 총괄 관리자만 접근할 수 있습니다. 관리자 계정(@admin)으로 인증 후 이용해 주십시오.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/auth"
              className="w-full py-3.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-xs font-mono tracking-[0.2em] uppercase font-semibold transition-all duration-300"
            >
              관리자 로그인
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-white/10 hover:border-white/20 bg-white/[0.02] text-zinc-400 hover:text-white text-xs font-mono tracking-wider transition-colors"
            >
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isLight = adminTheme === 'light';

  // 테마별 시맨틱 헬퍼 클래스
  const cardCls = isLight
    ? 'bg-white border-zinc-200 shadow-sm'
    : 'bg-[#0c0d12] border-white/[0.08]';
  const subCardCls = isLight
    ? 'bg-zinc-50 border-zinc-200'
    : 'bg-white/[0.015] border-white/10';
  const textTitleCls = isLight ? 'text-zinc-900' : 'text-white';
  const textMutedCls = isLight ? 'text-zinc-500' : 'text-zinc-400';
  const inputCls = isLight
    ? 'px-3.5 py-2 rounded-none border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-800 text-xs font-mono'
    : 'px-3.5 py-2 rounded-none border border-white/15 bg-black/40 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 text-xs font-mono';
  const selectCls = isLight
    ? 'px-3 py-2 rounded-none border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-800 text-xs font-mono cursor-pointer'
    : 'px-3 py-2 rounded-none border border-white/15 bg-black/40 text-white focus:outline-none focus:border-white/30 text-xs font-mono cursor-pointer';
  const btnSubCls = isLight
    ? 'px-3 py-1.5 rounded-none bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 text-xs font-mono cursor-pointer transition-colors'
    : 'px-3 py-1.5 rounded-none bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-mono cursor-pointer transition-colors';
  const btnPrimaryCls = isLight
    ? 'px-4 py-2 rounded-none border border-zinc-900 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono tracking-wider uppercase font-medium transition-all cursor-pointer'
    : 'px-4 py-2 rounded-none border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/40 text-white text-xs font-mono tracking-wider uppercase font-medium transition-all cursor-pointer';

  return (
    <div
      className={`min-h-screen ${
        isLight
          ? 'admin-light-mode bg-[#f4f5f7] text-zinc-900'
          : 'bg-[#07080a] text-[#f5f2eb]'
      } pt-3 pb-10 sm:pt-5 sm:pb-12 transition-colors duration-150`}
    >
      <main className="w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ============================================================
              좌측 사이드바: 일반화된 백오피스 문서 창고 네비게이션
              ============================================================ */}
          <aside
            className={`w-full lg:w-64 shrink-0 border p-5 shadow-xl lg:sticky lg:top-24 space-y-4 transition-colors ${
              isLight
                ? 'bg-white border-zinc-200 text-zinc-900'
                : 'bg-[#0c0d12] border-white/[0.08] text-white'
            }`}
          >
            <div
              className={`px-2 pb-4 border-b ${
                isLight ? 'border-zinc-200' : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04f74] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74] animate-ping" />
                  SYSTEM ADMIN
                </p>
                <span className="px-2 py-0.5 rounded-none bg-transparent border border-[#f04f74]/60 text-[9px] font-mono font-bold text-[#f04f74]">
                  v1.4.3
                </span>
              </div>
              <h1
                className={`font-serif-editorial text-xl font-normal ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
                {currentUser?.nickname || '최고관리자'}
              </h1>
              <p
                className={`text-[11px] mt-0.5 font-mono ${
                  isLight ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                {currentUser?.handle || '@admin'} • 슈퍼 권한
              </p>

              {/* 화이트 모드(문서 창고) / 다크 모드 뷰어 토글 */}
              <div
                className={`flex items-center gap-1 p-0.5 border text-[10px] font-mono mt-3 rounded-none ${
                  isLight
                    ? 'border-zinc-300 bg-zinc-100'
                    : 'border-white/15 bg-black/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setAdminTheme('light')}
                  className={`flex-1 py-1 text-center font-medium transition-all cursor-pointer ${
                    isLight
                      ? 'bg-white text-zinc-900 shadow-sm font-bold border border-zinc-200'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  화이트 모드
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTheme('dark')}
                  className={`flex-1 py-1 text-center font-medium transition-all cursor-pointer ${
                    !isLight
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  다크 모드
                </button>
              </div>

              {/* 대분류 전체 접기 / 펼치기 원클릭 도구 */}
              <div className="flex items-center justify-between pt-2.5 text-[10px] font-mono">
                <span className={isLight ? 'text-zinc-400' : 'text-zinc-500'}>
                  대분류 아코디언
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={collapseAllGroups}
                    className={`hover:underline cursor-pointer ${
                      isLight ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    모두 접기
                  </button>
                  <span className={isLight ? 'text-zinc-300' : 'text-zinc-600'}>
                    |
                  </span>
                  <button
                    type="button"
                    onClick={expandAllGroups}
                    className={`hover:underline cursor-pointer ${
                      isLight ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    모두 펼치기
                  </button>
                </div>
              </div>
            </div>

            <nav className="space-y-3">
              {ADMIN_CATEGORY_GROUPS.map((group) => {
                const isOpen = openGroupTitles.includes(group.groupTitle);
                const hasActiveChild = group.items.some(
                  (item) => item.key === activeTab
                );
                return (
                  <div key={group.groupTitle} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.groupTitle)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer select-none ${
                        isLight
                          ? hasActiveChild
                            ? 'text-zinc-900 font-bold'
                            : 'text-zinc-600 hover:text-zinc-900'
                          : hasActiveChild
                          ? 'text-zinc-100 font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{group.groupTitle}</span>
                      <span className="text-[11px] font-mono opacity-60">
                        {isOpen ? '▾' : '▸'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="space-y-0.5 pl-1 transition-all">
                        {group.items.map((cat) => {
                          const active = activeTab === cat.key;
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => handleSelectTab(cat.key)}
                              className={`w-full text-left px-3 py-2 transition-all flex items-center justify-between cursor-pointer text-xs font-mono tracking-wide ${
                                active
                                  ? isLight
                                    ? 'bg-zinc-100 text-zinc-900 font-semibold border-l-2 border-[#f04f74] pl-2.5'
                                    : 'bg-white/[0.04] text-white font-medium border-l-2 border-[#f04f74] pl-2.5'
                                  : isLight
                                  ? 'bg-transparent hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border-l-2 border-transparent pl-2.5 font-normal'
                                  : 'bg-transparent hover:bg-white/[0.02] text-zinc-400 hover:text-white border-l-2 border-transparent pl-2.5 font-normal'
                              }`}
                            >
                              <span>{cat.label}</span>
                              {cat.badge && (
                                <span
                                  className={`px-1.5 py-0.2 text-[9px] font-mono border ${
                                    isLight
                                      ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                      : 'bg-white/10 text-zinc-400 border-white/10'
                                  }`}
                                >
                                  {cat.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div
              className={`mt-6 pt-4 border-t space-y-2 ${
                isLight ? 'border-zinc-200' : 'border-white/10'
              }`}
            >
              <Link
                href="/dashboard"
                className={`block w-full py-2.5 px-3 rounded-none border text-center text-xs font-mono transition-colors ${
                  isLight
                    ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                마이페이지 →
              </Link>
              <Link
                href="/"
                className={`block w-full py-2.5 px-3 rounded-none text-center text-xs font-mono transition-colors ${
                  isLight
                    ? 'text-zinc-500 hover:text-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                ← 메인 화면
              </Link>
            </div>
          </aside>

          {/* ============================================================
              우측 메인 워크스페이스 (최소 높이 확보로 탭 전환 시 화면 점프 방지)
              ============================================================ */}
          <div className="flex-1 w-full min-w-0 space-y-4 min-h-[85vh]">
            {/* 상단 탭 헤더 */}
            <div
              className={`rounded-none px-5 py-3.5 border flex items-center justify-between gap-4 transition-colors ${
                isLight
                  ? 'bg-white border-zinc-200 shadow-sm text-zinc-900'
                  : 'bg-[#0c0d12] border-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
                <h2
                  className={`font-serif-editorial text-xl sm:text-2xl font-normal ${
                    isLight ? 'text-zinc-900' : 'text-white'
                  }`}
                >
                  {ALL_ADMIN_CATEGORIES.find((c) => c.key === activeTab)?.label}
                </h2>
              </div>

              {adminToast && (
                <span
                  className={`px-3.5 py-1.5 rounded-none border text-xs font-medium ${
                    isLight
                      ? 'bg-zinc-100 border-zinc-300 text-zinc-900'
                      : 'bg-white/10 border-white/15 text-white'
                  }`}
                >
                  {adminToast}
                </span>
              )}
            </div>

          {/* ----------------------------------------------------------
              1. [프로세스] 서비스 프로세스 모듈 ON/OFF 제어
              ---------------------------------------------------------- */}
          {activeTab === 'PROCESS' && (
            <section className="space-y-4">
              <AdminSectionCard
                title="서비스 프로세스 모듈 (1모듈 1기능 ON/OFF)"
                categoryTag="SERVICE FLOW CONTROL"
                desc="이용자 대시보드(/dashboard)에 노출되는 프로세스 단계를 켜거나 끌 수 있습니다."
                badge={`${processModules.filter((m) => m.enabled).length}/${processModules.length} 사용중`}
                isOpen={isSectionOpen('SEC_PROCESS_LIST', true)}
                onToggle={() => toggleSection('SEC_PROCESS_LIST', true)}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processModules.map((mod) => (
                    <div
                      key={mod.processId}
                      className={`p-4 sm:p-5 rounded-none border flex items-center justify-between gap-4 transition-all ${
                        mod.enabled
                          ? isLight
                            ? 'bg-white border-zinc-300 text-zinc-900 shadow-xs'
                            : 'border-white/20 bg-white/[0.02] text-white'
                          : isLight
                          ? 'bg-zinc-100 border-zinc-200 opacity-60 text-zinc-500'
                          : 'bg-[#0c0d12]/60 border-white/5 opacity-50 text-zinc-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-none text-[10px] font-mono border ${
                              isLight
                                ? 'bg-zinc-200 text-zinc-800 border-zinc-300'
                                : 'bg-black/40 text-[#f04f74] border-white/10'
                            }`}
                          >
                            P0{mod.stepOrder}
                          </span>
                          <span
                            className={`font-serif-editorial text-base font-normal ${
                              isLight ? 'text-zinc-900' : 'text-white'
                            }`}
                          >
                            {mod.label}
                          </span>
                          {mod.coreRequired && (
                            <span
                              className={`px-2 py-0.5 rounded-none text-[10px] font-mono ${
                                isLight
                                  ? 'bg-zinc-200 text-zinc-700'
                                  : 'bg-white/10 text-zinc-400'
                              }`}
                            >
                              필수코어
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs mt-1.5 font-light leading-relaxed ${textMutedCls}`}
                        >
                          {mod.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          toggleProcessModule(mod.processId);
                          notify(
                            `[${mod.label}] 모듈이 ${
                              !mod.enabled ? '활성화' : '비활성화'
                            }되었습니다.`
                          );
                        }}
                        className={`px-4 py-2 rounded-none text-xs font-mono tracking-wider cursor-pointer shrink-0 transition-all ${
                          mod.enabled
                            ? isLight
                              ? 'border border-zinc-900 bg-zinc-900 text-white'
                              : 'border border-[#f04f74]/60 bg-transparent text-[#f04f74] hover:bg-white/[0.04]'
                            : isLight
                            ? 'border border-zinc-300 bg-white text-zinc-600 hover:border-zinc-800'
                            : 'border border-white/10 bg-transparent text-zinc-400 hover:text-white'
                        }`}
                      >
                        {mod.enabled ? 'ON (사용중)' : 'OFF (비활성)'}
                      </button>
                    </div>
                  ))}
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              [품질점검] 6대 마이크로 평가 모듈 및 전주기 품질 감사 관제
              ---------------------------------------------------------- */}
          {activeTab === 'AUDIT' && (
            <section className="space-y-4">
              {/* 상단 전주기 감사 지표 카드 */}
              <AdminSectionCard
                title="품질 점검 관제 (전주기 감사 대시보드)"
                categoryTag="FULL-JOURNEY AUDIT DASHBOARD"
                desc="공간, 식사, 진행 3대 영역의 종합 품질 점수를 모니터링합니다."
                badge={`${fullJourneyAudit.totalAuditScore100}점 / 100점`}
                isOpen={isSectionOpen('SEC_AUDIT_TOTAL', true)}
                onToggle={() => toggleSection('SEC_AUDIT_TOTAL', true)}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`p-5 rounded-none border space-y-3 ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-200'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-2 ${
                        isLight ? 'border-zinc-200' : 'border-white/[0.08]'
                      }`}
                    >
                      <span
                        className={`text-xs font-mono font-medium ${
                          isLight ? 'text-zinc-700' : 'text-zinc-300'
                        }`}
                      >
                        공간
                      </span>
                      <span className="font-serif-editorial text-lg font-normal text-[#f04f74]">
                        {fullJourneyAudit.placeReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {fullJourneyAudit.placeReport.elementScores.map((el) => (
                        <div
                          key={el.elementId}
                          className="flex justify-between text-xs font-mono"
                        >
                          <span className={textMutedCls}>#{el.anchorNoun}</span>
                          <span
                            className={`font-medium ${
                              isLight ? 'text-zinc-900' : 'text-zinc-200'
                            }`}
                          >
                            {el.score100}점
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`p-5 rounded-none border space-y-3 ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-200'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-2 ${
                        isLight ? 'border-zinc-200' : 'border-white/[0.08]'
                      }`}
                    >
                      <span
                        className={`text-xs font-mono font-medium ${
                          isLight ? 'text-zinc-700' : 'text-zinc-300'
                        }`}
                      >
                        식사
                      </span>
                      <span className="font-serif-editorial text-lg font-normal text-amber-500">
                        {fullJourneyAudit.mealReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {fullJourneyAudit.mealReport.elementScores.map((el) => (
                        <div
                          key={el.elementId}
                          className="flex justify-between text-xs font-mono"
                        >
                          <span className={textMutedCls}>#{el.anchorNoun}</span>
                          <span
                            className={`font-medium ${
                              isLight ? 'text-zinc-900' : 'text-zinc-200'
                            }`}
                          >
                            {el.score100}점
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`p-5 rounded-none border space-y-3 ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-200'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-2 ${
                        isLight ? 'border-zinc-200' : 'border-white/[0.08]'
                      }`}
                    >
                      <span
                        className={`text-xs font-mono font-medium ${
                          isLight ? 'text-zinc-700' : 'text-zinc-300'
                        }`}
                      >
                        진행
                      </span>
                      <span className="font-serif-editorial text-lg font-normal text-sky-500">
                        {fullJourneyAudit.flowReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {fullJourneyAudit.flowReport.elementScores.map((el) => (
                        <div
                          key={el.elementId}
                          className="flex justify-between text-xs font-mono"
                        >
                          <span className={textMutedCls}>#{el.anchorNoun}</span>
                          <span
                            className={`font-medium ${
                              isLight ? 'text-zinc-900' : 'text-zinc-200'
                            }`}
                          >
                            {el.score100}점
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AdminSectionCard>

              {/* 하단 6대 핫플러그 등록 모듈 현황 */}
              <AdminSectionCard
                title="핫플러그 마이크로 모듈 현황"
                categoryTag="PLUGGABLE MICRO-MODULES"
                desc="각 모듈은 단일 명사 5대 앵커와 관찰 기준을 자율 패키징하여 핫플러그로 작동합니다."
                badge={`${EvaluationRegistry.getAllModules().length}개 모듈`}
                isOpen={isSectionOpen('SEC_AUDIT_MODULES', false)}
                onToggle={() => toggleSection('SEC_AUDIT_MODULES', false)}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {EvaluationRegistry.getAllModules().map((mod) => (
                    <div
                      key={mod.id}
                      className={`p-5 rounded-none border space-y-3 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          : 'bg-white/[0.02] border-white/[0.08] text-white'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between border-b pb-2 ${
                          isLight ? 'border-zinc-200' : 'border-white/[0.08]'
                        }`}
                      >
                        <span
                          className={`font-serif-editorial text-base font-normal ${
                            isLight ? 'text-zinc-900' : 'text-white'
                          }`}
                        >
                          {mod.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-none border ${
                            isLight
                              ? 'bg-white text-zinc-600 border-zinc-300'
                              : 'bg-white/5 text-zinc-400 border-white/10'
                          }`}
                        >
                          {mod.targetContext}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className={`text-[11px] font-mono ${textMutedCls}`}>
                          단일 명사 5대 앵커:
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {mod.getObservationElements().map((el) => (
                            <span
                              key={el.id}
                              className={`px-2.5 py-1 rounded-none border text-xs font-mono font-medium ${
                                isLight
                                  ? 'bg-white border-zinc-300 text-zinc-800'
                                  : 'bg-white/5 border-white/10 text-zinc-300'
                              }`}
                            >
                              #{el.anchorNoun}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              [화면배치] 메인 화면 섹터 순서 이동 & 헤더/푸터 관리
              ---------------------------------------------------------- */}
          {activeTab === 'LAYOUT_CMS' && (
            <section className="space-y-4">
              <AdminSectionCard
                title="사이트 레이아웃 & 네비게이션 관리"
                categoryTag="MODULAR BUILDER"
                desc="메인 화면의 모듈별 블록 순서(위치이동 ▲/▼) 및 노출 여부, 헤더 메뉴와 상단 공지 띠배너, 푸터 법정 정보를 코드 수정 없이 실시간으로 제어합니다."
                isOpen={true}
                onToggle={() => {}}
                isLight={isLight}
              >
                <AdminLayoutManager onNotify={notify} />
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              [디자인] 전역 디자인 시스템 및 타이포그래피 인스펙터
              ---------------------------------------------------------- */}
          {activeTab === 'DESIGN_SYSTEM' && (
            <section className="space-y-4">
              <AdminDesignSystemInspector theme={adminTheme} />
            </section>
          )}

          {/* ----------------------------------------------------------
              [회원평가] 5×5×5 개인 마스터 프로파일 심층 검수
              ---------------------------------------------------------- */}
          {(activeTab === 'MEMBER_EVAL' || activeTab === 'MEMBER_DOSSIER') && (
            <section className="space-y-4">
              <AdminSectionCard
                title={`[${selectedUserProfile?.nickname ?? selectedUserId}] 5×5×5 마스터 프로파일`}
                categoryTag="PERSONAL DOSSIER INSPECTOR"
                desc="동석자들의 다면 관찰 데이터가 표준 100점으로 정규화된 개인 리포트입니다."
                badge={`신뢰 ${selectedUserProfile?.trustScore ?? 90}점`}
                isOpen={isSectionOpen('SEC_MEMBER_EVAL_MAIN', true)}
                onToggle={() => toggleSection('SEC_MEMBER_EVAL_MAIN', true)}
                isLight={isLight}
              >
                <div className="space-y-5">
                  {/* 검색 & 성별 필터 */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
                      isLight ? 'border-zinc-200' : 'border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        placeholder="회원 검색 (닉네임 / ID)"
                        value={evalMemberSearch}
                        onChange={(e) => {
                          setEvalMemberSearch(e.target.value);
                          setEvalMemberPage(1);
                        }}
                        className={inputCls}
                      />
                      <div className="flex gap-1">
                        {(['ALL', 'F', 'M'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setEvalMemberGender(g);
                              setEvalMemberPage(1);
                            }}
                            className={`px-2.5 py-1.5 rounded-none text-xs font-mono transition-all cursor-pointer ${
                              evalMemberGender === g
                                ? isLight
                                  ? 'border border-zinc-900 bg-zinc-900 text-white font-medium'
                                  : 'border border-white/40 bg-white/10 text-white font-medium'
                                : isLight
                                ? 'bg-zinc-100 text-zinc-600 border border-zinc-300 hover:text-zinc-900'
                                : 'bg-black/40 text-zinc-400 border border-white/10 hover:text-white'
                            }`}
                          >
                            {g === 'ALL' ? '전체' : g === 'F' ? '여성' : '남성'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 10명 단위 회원 선택 버튼 그리드 */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {paginatedEvalMembers.map((p) => {
                        const isSelected = selectedUserId === p.userId;
                        return (
                          <button
                            key={p.userId}
                            type="button"
                            onClick={() => setSelectedUserId(p.userId)}
                            className={`px-3 py-2 rounded-none text-xs font-mono tracking-wider transition-all cursor-pointer ${
                              isSelected
                                ? isLight
                                  ? 'border border-zinc-900 bg-zinc-900 text-white font-medium'
                                  : 'border border-white/40 bg-white/10 text-white font-medium'
                                : isLight
                                ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                                : 'border border-white/[0.08] bg-black/40 text-zinc-400 hover:text-white hover:border-white/20'
                            }`}
                          >
                            {p.nickname} ({p.gender})
                          </button>
                        );
                      })}
                    </div>

                    {/* 10명 단위 페이징 컨트롤 */}
                    {totalEvalMemberPages > 1 && (
                      <div
                        className={`flex items-center justify-between pt-2 text-xs font-mono border-t ${
                          isLight
                            ? 'text-zinc-500 border-zinc-200'
                            : 'text-zinc-500 border-white/[0.04]'
                        }`}
                      >
                        <span>
                          회원 {evalFilteredMembers.length}명 중{' '}
                          {(evalMemberPage - 1) * EVAL_MEMBERS_PER_PAGE + 1} -{' '}
                          {Math.min(
                            evalMemberPage * EVAL_MEMBERS_PER_PAGE,
                            evalFilteredMembers.length
                          )}
                          명
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={evalMemberPage === 1}
                            onClick={() => setEvalMemberPage((p) => Math.max(1, p - 1))}
                            className={`px-2.5 py-1 rounded-none border text-xs font-mono disabled:opacity-30 cursor-pointer ${
                              isLight
                                ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                            }`}
                          >
                            이전
                          </button>
                          {Array.from(
                            { length: totalEvalMemberPages },
                            (_, i) => i + 1
                          ).map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setEvalMemberPage(num)}
                              className={`px-2.5 py-1 rounded-none text-xs font-mono cursor-pointer ${
                                evalMemberPage === num
                                  ? isLight
                                    ? 'border border-zinc-900 bg-zinc-900 text-white font-medium'
                                    : 'border border-white/40 bg-white/10 text-white font-medium'
                                  : isLight
                                  ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                                  : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={evalMemberPage === totalEvalMemberPages}
                            onClick={() =>
                              setEvalMemberPage((p) =>
                                Math.min(totalEvalMemberPages, p + 1)
                              )
                            }
                            className={`px-2.5 py-1 rounded-none border text-xs font-mono disabled:opacity-30 cursor-pointer ${
                              isLight
                                ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                            }`}
                          >
                            다음
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 종합 100점 / 이성 100점 / 동성 100점 / 신뢰 점수 */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                    <div
                      className={`p-5 rounded-none border space-y-1 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200'
                          : 'bg-white/[0.02] border-white/[0.08]'
                      }`}
                    >
                      <p className="text-[10px] font-mono tracking-widest text-[#f04f74] uppercase font-semibold">
                        종합 프로파일 점수
                      </p>
                      <p
                        className={`font-serif-editorial text-3xl font-normal mt-1 ${textTitleCls}`}
                      >
                        {selectedUserDossier.totalScore100}점
                      </p>
                    </div>
                    <div
                      className={`p-5 rounded-none border space-y-1 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200'
                          : 'bg-white/[0.02] border-white/[0.08]'
                      }`}
                    >
                      <p className={`text-[10px] font-mono tracking-widest uppercase font-medium ${textMutedCls}`}>
                        이성 관찰자 평가
                      </p>
                      <p
                        className={`font-serif-editorial text-3xl font-normal mt-1 ${textTitleCls}`}
                      >
                        {selectedUserDossier.oppositeSexTotal100}점
                      </p>
                    </div>
                    <div
                      className={`p-5 rounded-none border space-y-1 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200'
                          : 'bg-white/[0.02] border-white/[0.08]'
                      }`}
                    >
                      <p className={`text-[10px] font-mono tracking-widest uppercase font-medium ${textMutedCls}`}>
                        동성 관찰자 평가
                      </p>
                      <p
                        className={`font-serif-editorial text-3xl font-normal mt-1 ${textTitleCls}`}
                      >
                        {selectedUserDossier.sameSexTotal100}점
                      </p>
                    </div>
                    <div
                      className={`p-5 rounded-none border space-y-1 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200'
                          : 'bg-white/[0.02] border-white/[0.08]'
                      }`}
                    >
                      <p className={`text-[10px] font-mono tracking-widest uppercase font-medium ${textMutedCls}`}>
                        신뢰 점수 / 출생연도
                      </p>
                      <p
                        className={`font-serif-editorial text-xl font-normal mt-2 ${textTitleCls}`}
                      >
                        {selectedUserProfile?.trustScore ?? 90}점 ·{' '}
                        {selectedUserProfile?.birthYear ?? 1995}년생
                      </p>
                    </div>
                  </div>

                  {/* 5대 대분류 × 5개 중분류 상세 점수표 */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                    {selectedUserDossier.domainSummaries.map((dom) => (
                      <div
                        key={dom.majorCode}
                        className={`p-4 rounded-none border space-y-3 ${
                          isLight
                            ? 'bg-zinc-50 border-zinc-200'
                            : 'bg-white/[0.02] border-white/[0.08]'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between border-b pb-2 ${
                            isLight ? 'border-zinc-200' : 'border-white/[0.08]'
                          }`}
                        >
                          <span
                            className={`font-serif-editorial text-base font-normal ${textTitleCls}`}
                          >
                            {dom.label}
                          </span>
                          <span className="font-mono text-sm text-[#f04f74] font-medium">
                            {dom.score100}점
                          </span>
                        </div>
                        <div
                          className={`space-y-1.5 divide-y ${
                            isLight
                              ? 'divide-zinc-200'
                              : 'divide-white/[0.04]'
                          }`}
                        >
                          {dom.subSummaries.map((sub) => (
                            <div
                              key={sub.subElementId}
                              className="flex items-center justify-between text-xs pt-1.5"
                            >
                              <span
                                className={`font-light font-mono text-[11px] ${textMutedCls}`}
                              >
                                {sub.label}
                              </span>
                              <span
                                className={`font-mono text-xs font-medium ${
                                  isLight ? 'text-zinc-800' : 'text-zinc-200'
                                }`}
                              >
                                {sub.score20} / 20
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              [회원관리] 전체 회원 검색 · 필터 · 페이징(10명 단위) · 관리
              ---------------------------------------------------------- */}
          {activeTab === 'MEMBER_MGMT' && (
            <section className="space-y-4">
              {/* 상단 회원 목록 및 검색 아코디언 */}
              <AdminSectionCard
                title={`회원 관리 (${filteredMembers.length}명)`}
                categoryTag="MEMBERSHIP DIRECTORY"
                desc="플랫폼에 가입된 회원들의 프로필, 신뢰점수, 성별, 권역을 관리하고 검색합니다."
                badge={`${filteredMembers.length}명`}
                isOpen={isSectionOpen('SEC_MEMBER_MGMT_LIST', true)}
                onToggle={() => toggleSection('SEC_MEMBER_MGMT_LIST', true)}
                isLight={isLight}
              >
                <div className="space-y-5">
                  {/* 실시간 검색 및 필터 컨트롤 */}
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${
                      isLight ? 'border-zinc-200' : 'border-white/[0.08]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="회원 검색 (닉네임 / ID)"
                        value={memberSearchQuery}
                        onChange={(e) => {
                          setMemberSearchQuery(e.target.value);
                          setMemberPage(1);
                        }}
                        className={inputCls}
                      />

                      {/* 성별 필터 */}
                      <div className="flex gap-1">
                        {(['ALL', 'F', 'M'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setMemberGenderFilter(g);
                              setMemberPage(1);
                            }}
                            className={`px-3 py-2 rounded-none text-xs font-mono transition-all cursor-pointer ${
                              memberGenderFilter === g
                                ? isLight
                                  ? 'border border-zinc-900 bg-zinc-900 text-white font-medium'
                                  : 'border border-white/40 bg-white/10 text-white font-medium'
                                : isLight
                                ? 'bg-zinc-100 text-zinc-600 border border-zinc-300 hover:text-zinc-900'
                                : 'bg-black/40 text-zinc-400 border border-white/10 hover:text-white'
                            }`}
                          >
                            {g === 'ALL' ? '전체' : g === 'F' ? '여성' : '남성'}
                          </button>
                        ))}
                      </div>

                      {/* 권역 필터 */}
                      <select
                        value={memberCityFilter}
                        onChange={(e) => {
                          setMemberCityFilter(e.target.value);
                          setMemberPage(1);
                        }}
                        className={selectCls}
                      >
                        <option value="ALL">전체 지역</option>
                        <option value="SEOUL">서울</option>
                        <option value="BUSAN">부산</option>
                        <option value="GYEONGGI">경기</option>
                      </select>
                    </div>
                  </div>

                  {/* 10명 단위 회원 테이블 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr
                          className={`border-b text-xs font-mono uppercase tracking-wider ${
                            isLight
                              ? 'border-zinc-200 text-zinc-500 bg-zinc-50'
                              : 'border-white/[0.08] text-zinc-500 bg-white/[0.02]'
                          }`}
                        >
                          <th className="py-3 px-3 font-normal">ID</th>
                          <th className="py-3 px-3 font-normal">닉네임</th>
                          <th className="py-3 px-3 font-normal">성별</th>
                          <th className="py-3 px-3 font-normal">출생연도</th>
                          <th className="py-3 px-3 font-normal">신뢰점수</th>
                          <th className="py-3 px-3 font-normal text-right">작업</th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y text-xs font-mono ${
                          isLight ? 'divide-zinc-200' : 'divide-white/[0.04]'
                        }`}
                      >
                        {paginatedMembers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className={`py-8 text-center font-light ${textMutedCls}`}
                            >
                              조건에 일치하는 회원이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          paginatedMembers.map((m) => (
                            <tr
                              key={m.userId}
                              className={`transition-colors ${
                                isLight
                                  ? 'hover:bg-zinc-50'
                                  : 'hover:bg-white/[0.015]'
                              }`}
                            >
                              <td className={`py-3.5 px-3 ${textMutedCls}`}>
                                {m.userId}
                              </td>
                              <td
                                className={`py-3.5 px-3 font-medium ${
                                  isLight ? 'text-zinc-900' : 'text-white'
                                }`}
                              >
                                {m.nickname}
                              </td>
                              <td
                                className={`py-3.5 px-3 ${
                                  isLight ? 'text-zinc-700' : 'text-zinc-300'
                                }`}
                              >
                                {m.gender === 'F' ? '여성' : '남성'}
                              </td>
                              <td className={`py-3.5 px-3 ${textMutedCls}`}>
                                {m.birthYear}년생
                              </td>
                              <td
                                className={`py-3.5 px-3 ${
                                  isLight ? 'text-zinc-800' : 'text-zinc-200'
                                }`}
                              >
                                {m.trustScore}점
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUserId(m.userId);
                                      setActiveTab('MEMBER_EVAL');
                                    }}
                                    className={`px-2.5 py-1 rounded-none border text-[11px] font-mono cursor-pointer transition-colors ${
                                      isLight
                                        ? 'border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                                        : 'border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                                    }`}
                                  >
                                    평가 조회
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      adjustTrustScore(m.userId, 5);
                                      notify(`[${m.nickname}] 신뢰점수가 +5점 조정되었습니다.`);
                                    }}
                                    className={`px-2 py-1 rounded-none border text-[11px] font-mono cursor-pointer ${
                                      isLight
                                        ? 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                                        : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:text-white'
                                    }`}
                                  >
                                    +5
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      adjustTrustScore(m.userId, -5);
                                      notify(`[${m.nickname}] 신뢰점수가 -5점 조정되었습니다.`);
                                    }}
                                    className={`px-2 py-1 rounded-none border text-[11px] font-mono cursor-pointer ${
                                      isLight
                                        ? 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100'
                                        : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white'
                                    }`}
                                  >
                                    -5
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`정말 [${m.nickname}] 회원을 삭제하시겠습니까?`)) {
                                        deleteParticipant(m.userId);
                                        notify(`[${m.nickname}] 회원이 삭제되었습니다.`);
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-none border text-[11px] font-mono cursor-pointer transition-colors ${
                                      isLight
                                        ? 'border-zinc-300 bg-white text-zinc-600 hover:text-red-600 hover:border-red-300'
                                        : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-red-400'
                                    }`}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 10명 단위 페이징 바 */}
                  {totalMemberPages > 1 && (
                    <div
                      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t text-xs font-mono ${
                        isLight
                          ? 'border-zinc-200 text-zinc-500'
                          : 'border-white/[0.06] text-zinc-500'
                      }`}
                    >
                      <span>
                        전체 {filteredMembers.length}명 중 {(memberPage - 1) * MEMBERS_PER_PAGE + 1} -{' '}
                        {Math.min(memberPage * MEMBERS_PER_PAGE, filteredMembers.length)}명 표시
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={memberPage === 1}
                          onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                          className={`px-3 py-1.5 rounded-none border text-xs font-mono disabled:opacity-30 cursor-pointer ${
                            isLight
                              ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                              : 'border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                          }`}
                        >
                          이전
                        </button>
                        {Array.from({ length: totalMemberPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setMemberPage(pageNum)}
                            className={`px-3 py-1.5 rounded-none text-xs font-mono cursor-pointer transition-colors ${
                              memberPage === pageNum
                                ? isLight
                                  ? 'border border-zinc-900 bg-zinc-900 text-white font-medium'
                                  : 'border border-white/40 bg-white/10 text-white font-medium'
                                : isLight
                                ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                                : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={memberPage === totalMemberPages}
                          onClick={() => setMemberPage((p) => Math.min(totalMemberPages, p + 1))}
                          className={`px-3 py-1.5 rounded-none border text-xs font-mono disabled:opacity-30 cursor-pointer ${
                            isLight
                              ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                              : 'border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                          }`}
                        >
                          다음
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </AdminSectionCard>

              {/* 신규 회원 등록 아코디언 */}
              <AdminSectionCard
                title="신규 회원 등록"
                categoryTag="MEMBER REGISTRATION"
                desc="새로운 회원을 풀에 추가하고 기본 신뢰점수(90점)를 부여합니다."
                isOpen={isSectionOpen('SEC_MEMBER_MGMT_CREATE', false)}
                onToggle={() => toggleSection('SEC_MEMBER_MGMT_CREATE', false)}
                isLight={isLight}
              >
                <div className={`flex flex-wrap items-center gap-3 p-4 rounded-none border ${subCardCls}`}>
                  <span className={`text-xs font-mono font-medium ${textMutedCls}`}>
                    신규 등록:
                  </span>
                  <input
                    type="text"
                    placeholder="닉네임"
                    value={newNick}
                    onChange={(e) => setNewNick(e.target.value)}
                    className={inputCls}
                  />
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as Gender)}
                    className={selectCls}
                  >
                    <option value="F">여성 (F)</option>
                    <option value="M">남성 (M)</option>
                  </select>
                  <input
                    type="number"
                    value={newBirth}
                    onChange={(e) => setNewBirth(Number(e.target.value))}
                    className={`w-28 ${inputCls}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newNick.trim()) return;
                      const created: ParticipantProfile = {
                        userId: `U_${Date.now().toString().slice(-4)}`,
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
                    className={btnPrimaryCls}
                  >
                    + 회원 추가
                  </button>
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              3. [평가엔진] 5대분류 × 5중분류 × 5평가기준 정규화 매트릭스 제어
              ---------------------------------------------------------- */}
          {activeTab === 'EVAL_ENGINE' && (
            <section className="space-y-4">
              {/* 5대 평가 기준 (정돈·조화·센스·안정·호감) 규격 표 */}
              <AdminSectionCard
                title="5대 표준 평가 기준 (전 영역 공통 적용)"
                categoryTag="NORMALIZED 5 CRITERIA"
                desc="각 기준당 4점 만점이며, 5개 기준의 합이 20점 만점을 형성합니다."
                badge="4점 × 5 = 20점"
                isOpen={isSectionOpen('SEC_EVAL_CRITERIA', true)}
                onToggle={() => toggleSection('SEC_EVAL_CRITERIA', true)}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {evaluationCriteria.map((crit) => (
                    <div
                      key={crit.code}
                      className={`p-4 rounded-none border ${subCardCls}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-serif-editorial text-base font-normal ${textTitleCls}`}
                        >
                          {crit.stepOrder}. {crit.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-none text-xs font-mono border ${
                            isLight
                              ? 'bg-zinc-200 border-zinc-300 text-zinc-800'
                              : 'bg-white/10 border-white/10 text-zinc-300'
                          }`}
                        >
                          {crit.maxPoints}점
                        </span>
                      </div>
                      <p className={`text-xs font-light ${textMutedCls}`}>
                        {crit.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </AdminSectionCard>

              {/* 5대 대분류 × 5개 중분류 요소 매트릭스 */}
              <AdminSectionCard
                title="5대분류 × 5중분류 요소 (각 20점 × 5 = 100점 정규화)"
                categoryTag="DOMAIN SUB-ELEMENT MATRIX"
                desc="각 대분류는 정확히 5개의 단일 명사 요소로 구성되며, 모임 프리셋에 따라 활성화할 수 있습니다."
                badge={`${majorDomains.length}대 영역 • 25개 요소`}
                isOpen={isSectionOpen('SEC_EVAL_ELEMENTS', true)}
                onToggle={() => toggleSection('SEC_EVAL_ELEMENTS', true)}
                isLight={isLight}
              >
                <div className="space-y-4">
                  {/* 도메인 필터 버튼 탭 */}
                  <div className="flex gap-1.5 flex-wrap pb-3 border-b border-zinc-200 dark:border-white/10">
                    {majorDomains.map((dom) => (
                      <button
                        key={dom.code}
                        type="button"
                        onClick={() => setSelectedMajorFilter(dom.code)}
                        className={`px-3.5 py-1.5 rounded-none text-xs font-mono tracking-wider cursor-pointer transition-all ${
                          selectedMajorFilter === dom.code
                            ? isLight
                              ? 'border border-zinc-900 bg-zinc-900 text-white font-medium'
                              : 'border border-white/40 bg-white/10 text-white font-medium'
                            : isLight
                            ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                            : 'border border-white/10 bg-[#08090d] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {dom.label} (100점)
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {subElements
                      .filter((s) => s.majorCode === selectedMajorFilter)
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className={`p-4 sm:p-5 rounded-none border space-y-3 ${subCardCls}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-none text-xs font-mono border ${
                                  isLight
                                    ? 'bg-zinc-200 border-zinc-300 text-zinc-800'
                                    : 'bg-black/40 border-white/10 text-zinc-300'
                                }`}
                              >
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
                                className={`w-32 ${inputCls}`}
                              />
                              <span
                                className={`text-xs font-mono ${textMutedCls}`}
                              >
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
                              className={`px-4 py-2 rounded-none text-xs font-mono tracking-wider cursor-pointer transition-all ${
                                sub.activeInCurrentProcess
                                  ? isLight
                                    ? 'border border-zinc-900 bg-zinc-900 text-white'
                                    : 'border border-[#f04f74]/60 bg-transparent text-[#f04f74] hover:bg-white/[0.04]'
                                  : isLight
                                  ? 'border border-zinc-300 bg-white text-zinc-600 hover:border-zinc-800'
                                  : 'border border-white/10 bg-transparent text-zinc-400 hover:text-white'
                              }`}
                            >
                              {sub.activeInCurrentProcess
                                ? '현재 모임 평가 ON'
                                : '현재 모임 평가 OFF'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label
                                className={`block text-xs font-mono mb-1 ${textMutedCls}`}
                              >
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
                                className={`w-full ${inputCls}`}
                              />
                            </div>
                            <div>
                              <label
                                className={`block text-xs font-mono mb-1 ${textMutedCls}`}
                              >
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
                                className={`w-full ${inputCls}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              4. [뱃지] 세분화 뱃지 도감 추가 · 수정 · 삭제
              ---------------------------------------------------------- */}
          {activeTab === 'BADGE' && (
            <section className="space-y-4">
              {/* 등록된 뱃지 목록 아코디언 */}
              <AdminSectionCard
                title={`세분화 뱃지 도감 (${granularBadges.length}종)`}
                categoryTag="BADGE DIRECTORY"
                desc="특정 영역·요소 점수가 기준치를 넘을 때 자동 부여되는 뱃지 목록입니다."
                badge={`${granularBadges.length}종`}
                isOpen={isSectionOpen('SEC_BADGE_LIST', true)}
                onToggle={() => toggleSection('SEC_BADGE_LIST', true)}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {granularBadges.map((b) => (
                    <div
                      key={b.badgeId}
                      className={`p-5 rounded-none border flex flex-col justify-between gap-3 ${subCardCls}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-mono ${textMutedCls}`}
                          >
                            BADGE
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-mono border ${
                              isLight
                                ? 'bg-zinc-200 border-zinc-300 text-zinc-800'
                                : 'bg-black/40 border-white/10 text-zinc-300'
                            }`}
                          >
                            기준 {b.minScoreThreshold}/20점+
                          </span>
                        </div>
                        <h4
                          className={`font-serif-editorial text-base font-normal ${textTitleCls}`}
                        >
                          {b.name}
                        </h4>
                        <p className={`text-xs mt-1 ${textMutedCls}`}>
                          {b.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteGranularBadge(b.badgeId)}
                        className={`self-end ${btnSubCls}`}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </AdminSectionCard>

              {/* 신규 뱃지 생성 폼 아코디언 */}
              <AdminSectionCard
                title="신규 뱃지 발급 등록"
                categoryTag="BADGE CREATION"
                desc="새로운 세분화 뱃지를 등록하고 기준 점수를 설정합니다."
                isOpen={isSectionOpen('SEC_BADGE_CREATE', false)}
                onToggle={() => toggleSection('SEC_BADGE_CREATE', false)}
                isLight={isLight}
              >
                <div className={`grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-none border ${subCardCls}`}>
                  <input
                    type="text"
                    placeholder="식별 태그 (예: BADGE)"
                    value={newBadgeIcon}
                    onChange={(e) => setNewBadgeIcon(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="뱃지명 (예: 헤어 정돈 장인)"
                    value={newBadgeName}
                    onChange={(e) => setNewBadgeName(e.target.value)}
                    className={inputCls}
                  />
                  <select
                    value={newBadgeMajor}
                    onChange={(e) =>
                      setNewBadgeMajor(e.target.value as MajorDomainCode)
                    }
                    className={selectCls}
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
                    className={inputCls}
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
                    className={btnPrimaryCls}
                  >
                    + 뱃지 추가
                  </button>
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              5. [지역] 권역 및 세부 상권 설정
              ---------------------------------------------------------- */}
          {activeTab === 'REGION' && (
            <section className="space-y-4">
              <AdminSectionCard
                title={`지역 · 상권 (${regionDistricts.length}곳)`}
                categoryTag="DISTRICT DIRECTORY"
                desc="오프라인 모임이 열리는 권역(서울/경기/부산 등)과 세부 상권을 관리합니다."
                badge={`${regionDistricts.length}곳`}
                isOpen={isSectionOpen('SEC_REGION_LIST', true)}
                onToggle={() => toggleSection('SEC_REGION_LIST', true)}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regionDistricts.map((dist) => (
                    <div
                      key={dist.districtId}
                      className={`p-5 rounded-none border space-y-2 ${subCardCls}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-none text-xs font-mono border ${
                            isLight
                              ? 'bg-zinc-200 border-zinc-300 text-zinc-800'
                              : 'bg-black/40 border-white/10 text-zinc-300'
                          }`}
                        >
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
                          className={`px-2.5 py-0.5 rounded-none text-xs font-mono font-medium cursor-pointer border ${
                            dist.active
                              ? isLight
                                ? 'bg-zinc-900 border-zinc-900 text-white'
                                : 'bg-white/15 border-white/20 text-white'
                              : isLight
                              ? 'bg-zinc-100 border-zinc-300 text-zinc-500'
                              : 'bg-white/5 border-white/10 text-zinc-500'
                          }`}
                        >
                          {dist.active ? '활성' : '비활성'}
                        </button>
                      </div>
                      <h4
                        className={`font-serif-editorial text-lg font-normal ${textTitleCls}`}
                      >
                        {dist.districtName}
                      </h4>
                      <p className={`text-xs font-light ${textMutedCls}`}>
                        {dist.description}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className={`text-xs font-mono ${textMutedCls}`}>
                          {dist.defaultGatherTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteRegionDistrict(dist.districtId)}
                          className={`text-xs cursor-pointer transition-colors font-mono hover:text-red-500 ${textMutedCls}`}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminSectionCard>

              {/* 신규 상권 등록 아코디언 */}
              <AdminSectionCard
                title="신규 권역 및 상권 등록"
                categoryTag="DISTRICT CREATION"
                desc="새로운 오프라인 다이닝 거점 상권을 등록합니다."
                isOpen={isSectionOpen('SEC_REGION_CREATE', false)}
                onToggle={() => toggleSection('SEC_REGION_CREATE', false)}
                isLight={isLight}
              >
                <div className={`grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-none border ${subCardCls}`}>
                  <input
                    type="text"
                    placeholder="권역 (예: 서울)"
                    value={newRegionName}
                    onChange={(e) => setNewRegionName(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="상권명 (예: 연남)"
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="모임 시간"
                    value={newGatherTime}
                    onChange={(e) => setNewGatherTime(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="상권 설명"
                    value={newDistrictDesc}
                    onChange={(e) => setNewDistrictDesc(e.target.value)}
                    className={inputCls}
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
                    className={btnPrimaryCls}
                  >
                    + 지역 추가
                  </button>
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              6. [매장] 제휴 레스토랑 추가 · 삭제
              ---------------------------------------------------------- */}
          {activeTab === 'VENUE' && (
            <section className="space-y-4">
              <AdminSectionCard
                title={`제휴 매장 (${partnerVenues.length}곳)`}
                categoryTag="VENUE DIRECTORY"
                desc="엄선된 프라이빗 룸과 제휴된 파트너 레스토랑 목록입니다."
                badge={`${partnerVenues.length}곳`}
                isOpen={isSectionOpen('SEC_VENUE_LIST', true)}
                onToggle={() => toggleSection('SEC_VENUE_LIST', true)}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnerVenues.map((v) => (
                    <div
                      key={v.venueId}
                      className={`p-5 rounded-none border flex items-center justify-between ${subCardCls}`}
                    >
                      <div>
                        <h4
                          className={`font-serif-editorial text-base font-normal ${textTitleCls}`}
                        >
                          {v.name}
                        </h4>
                        <p className={`text-xs mt-1 font-light ${textMutedCls}`}>
                          지원 식단: {v.supportedDietary.join(', ')} · 최대{' '}
                          {v.maxTablesPerNight}테이블
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deletePartnerVenue(v.venueId)}
                        className={btnSubCls}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </AdminSectionCard>

              {/* 신규 제휴 매장 등록 아코디언 */}
              <AdminSectionCard
                title="신규 제휴 레스토랑 등록"
                categoryTag="VENUE CREATION"
                desc="새로운 파트너 매장을 등록합니다."
                isOpen={isSectionOpen('SEC_VENUE_CREATE', false)}
                onToggle={() => toggleSection('SEC_VENUE_CREATE', false)}
                isLight={isLight}
              >
                <div className={`flex flex-wrap gap-3 p-4 rounded-none border ${subCardCls}`}>
                  <input
                    type="text"
                    placeholder="매장명 (예: 한남 오스테리아)"
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    className={`flex-1 ${inputCls}`}
                  />
                  <input
                    type="number"
                    value={newVenueMaxTables}
                    onChange={(e) => setNewVenueMaxTables(Number(e.target.value))}
                    className={`w-28 ${inputCls}`}
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
                    className={btnPrimaryCls}
                  >
                    + 매장 추가
                  </button>
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              7. [모임조건] 조건부 모임 개설 & 테이블 노쇼 대기자 관리
              ---------------------------------------------------------- */}
          {activeTab === 'EVENT_GATE' && (
            <section className="space-y-4">
              {/* 상단 섹션 전체 접기 / 펼치기 바 */}
              <div className="flex items-center justify-between px-1 text-xs font-mono">
                <span className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>
                  모임조건 섹터 관제 (총 3개 기능 블록)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      collapseAllSections([
                        'SEC_EVENT_CREATE',
                        'SEC_EVENT_LIST',
                        'SEC_EVENT_NOSHOW',
                      ])
                    }
                    className={`hover:underline cursor-pointer ${
                      isLight ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    섹션 전체 접기
                  </button>
                  <span className={isLight ? 'text-zinc-300' : 'text-zinc-600'}>
                    |
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      expandAllSections([
                        'SEC_EVENT_CREATE',
                        'SEC_EVENT_LIST',
                        'SEC_EVENT_NOSHOW',
                      ])
                    }
                    className={`hover:underline cursor-pointer ${
                      isLight ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    섹션 전체 펼치기
                  </button>
                </div>
              </div>

              {/* 1. 조건부 모임 신규 개설 */}
              <AdminSectionCard
                title="조건부 모임 신규 개설"
                categoryTag="EVENT CREATION"
                desc="최소 프로파일 점수(100점 기준) 및 필수 보유 뱃지 조건을 걸어 모임을 개설합니다."
                isOpen={isSectionOpen('SEC_EVENT_CREATE', true)}
                onToggle={() => toggleSection('SEC_EVENT_CREATE', true)}
                isLight={isLight}
              >
                <div className={`grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-none border ${subCardCls}`}>
                  <input
                    type="text"
                    placeholder="모임명 (예: 부산 5060 골든 다이닝)"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className={`sm:col-span-2 ${inputCls}`}
                  />
                  <select
                    value={newEventDistrictId}
                    onChange={(e) => setNewEventDistrictId(e.target.value)}
                    className={selectCls}
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
                    className={inputCls}
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
                    className={btnPrimaryCls}
                  >
                    + 모임 개설
                  </button>
                </div>
              </AdminSectionCard>

              {/* 2. 등록된 조건부 모임 목록 */}
              <AdminSectionCard
                title="개설된 조건부 모임 목록"
                categoryTag="EVENT REGISTRY"
                desc="현재 신청 접수 중인 조건부 모임 리스트 및 참가 자격"
                badge={`${conditionalEvents.length}개`}
                isOpen={isSectionOpen('SEC_EVENT_LIST', true)}
                onToggle={() => toggleSection('SEC_EVENT_LIST', true)}
                isLight={isLight}
              >
                {conditionalEvents.length === 0 ? (
                  <p className={`text-xs py-4 text-center ${textMutedCls}`}>
                    개설된 모임이 없습니다. 상단에서 신규 모임을 개설해 주십시오.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {conditionalEvents.map((ev) => (
                      <div
                        key={ev.eventId}
                        className={`p-4 sm:p-5 rounded-none border flex items-center justify-between gap-4 transition-colors ${
                          isLight
                            ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
                            : 'bg-white/[0.015] border-white/[0.08] text-white'
                        }`}
                      >
                        <div>
                          <h4
                            className={`font-serif-editorial text-base font-normal ${
                              isLight ? 'text-zinc-900' : 'text-white'
                            }`}
                          >
                            {ev.title}
                          </h4>
                          <p className={`text-xs mt-1 font-light ${textMutedCls}`}>
                            참가비 ₩{ev.priceKrw.toLocaleString()} · 최소 프로파일{' '}
                            {ev.minTotalScore100}점 이상 · 필수뱃지{' '}
                            {ev.requiredBadgeIds.length}개
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteConditionalEvent(ev.eventId)}
                          className={btnSubCls}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </AdminSectionCard>

              {/* 3. 당일 노쇼 및 대기자 자동 대체 */}
              <AdminSectionCard
                title="테이블 편성 및 노쇼 대기자 자동 대체"
                categoryTag="NO-SHOW RECOVERY"
                desc="당일 취소 발생 시 신뢰점수 80점 이상 대기자를 즉시 투입하여 3:3 정원을 유지합니다."
                isOpen={isSectionOpen('SEC_EVENT_NOSHOW', false)}
                onToggle={() => toggleSection('SEC_EVENT_NOSHOW', false)}
                isLight={isLight}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className={`text-xs font-light ${textMutedCls}`}>
                      스탠바이 큐에서 신뢰 검증 회원을 테이블 빈자리로 즉각 자동 재배치합니다.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={triggerNoShowAndStandbyRecovery}
                      className={btnPrimaryCls}
                    >
                      노쇼 대기자 투입
                    </button>
                    <button
                      type="button"
                      onClick={resetParticipantsPool}
                      className={btnSubCls}
                    >
                      초기화
                    </button>
                  </div>
                </div>

                {standbyReplacementLog && (
                  <div
                    className={`p-4 rounded-none border text-xs font-mono font-medium mt-3 ${
                      isLight
                        ? 'bg-zinc-100 border-zinc-200 text-zinc-800'
                        : 'bg-white/[0.02] border-white/[0.08] text-zinc-300'
                    }`}
                  >
                    {standbyReplacementLog}
                  </div>
                )}
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              8. [대화카드] 대화카드 추가 · 수정 · 삭제
              ---------------------------------------------------------- */}
          {activeTab === 'DECK' && (
            <section className="space-y-4">
              <AdminSectionCard
                title={`대화카드 (${activeStageCards.length}장)`}
                categoryTag="PLAYBOOK CARDS"
                desc="다이닝 현장에서 어색함을 깨고 깊이 있는 대화를 돕는 질문 카드입니다."
                badge={`${activeStageCards.length}장`}
                isOpen={isSectionOpen('SEC_DECK_LIST', true)}
                onToggle={() => toggleSection('SEC_DECK_LIST', true)}
                isLight={isLight}
              >
                <div className="space-y-3">
                  {activeStageCards.map((c) => (
                    <div
                      key={c.cardId}
                      className={`p-4 sm:p-5 rounded-none border space-y-2 ${subCardCls}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) =>
                            updatePlaybookCard({ ...c, title: e.target.value })
                          }
                          className={`font-serif-editorial text-base font-normal border-b focus:outline-none bg-transparent ${
                            isLight
                              ? 'border-zinc-300 text-zinc-900'
                              : 'border-white/10 text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => deletePlaybookCard(c.cardId)}
                          className={btnSubCls}
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
                        className={`w-full p-2.5 rounded-none border text-xs font-light focus:outline-none ${
                          isLight
                            ? 'bg-white border-zinc-300 text-zinc-900 focus:border-zinc-800'
                            : 'bg-black/30 border-white/10 text-zinc-300 focus:border-white/30'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </AdminSectionCard>

              {/* 신규 대화카드 추가 아코디언 */}
              <AdminSectionCard
                title="신규 대화카드 등록"
                categoryTag="CARD CREATION"
                desc="새로운 질문 카드를 플레이북 덱에 추가합니다."
                isOpen={isSectionOpen('SEC_DECK_CREATE', false)}
                onToggle={() => toggleSection('SEC_DECK_CREATE', false)}
                isLight={isLight}
              >
                <div className={`grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-none border ${subCardCls}`}>
                  <input
                    type="text"
                    placeholder="카드 제목"
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="질문 본문"
                    value={newCardPrompt}
                    onChange={(e) => setNewCardPrompt(e.target.value)}
                    className={`sm:col-span-2 ${inputCls}`}
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
                    className={btnPrimaryCls}
                  >
                    + 대화카드 추가
                  </button>
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              9. [페이지] 전체 페이지 타이틀 · 배너 · 홈 섹션 편집
              ---------------------------------------------------------- */}
          {activeTab === 'PAGE_CMS' && (
            <section className="space-y-4">
              <AdminSectionCard
                title={`페이지 구성 편집 (${cmsPages.length}개)`}
                categoryTag="PAGE METADATA CMS"
                desc="각 페이지의 헤드라인, 서브카피, 상단 배지 문구를 실시간으로 편집합니다."
                badge={`${cmsPages.length}개 페이지`}
                isOpen={true}
                onToggle={() => {}}
                isLight={isLight}
              >
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2 pb-3 border-b border-zinc-200 dark:border-white/10">
                    {cmsPages.map((pg) => (
                      <button
                        key={pg.pageId}
                        type="button"
                        onClick={() => setSelectedPageId(pg.pageId)}
                        className={`px-3.5 py-2 rounded-none text-xs font-mono cursor-pointer transition-colors border ${
                          selectedPageId === pg.pageId
                            ? isLight
                              ? 'border-zinc-900 bg-zinc-900 text-white font-medium'
                              : 'border-white/40 bg-white/10 text-white font-medium'
                            : isLight
                            ? 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                            : 'border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {pg.title} ({pg.route})
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const page =
                      cmsPages.find((p) => p.pageId === selectedPageId) ??
                      cmsPages[0];
                    if (!page) return null;
                    return (
                      <div className={`space-y-4 p-5 rounded-none border ${subCardCls}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-xs font-mono mb-1 ${textMutedCls}`}>
                              페이지명
                            </label>
                            <input
                              type="text"
                              value={page.title}
                              onChange={(e) =>
                                updateCmsPage({ ...page, title: e.target.value })
                              }
                              className={`w-full ${inputCls}`}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-mono mb-1 ${textMutedCls}`}>
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
                              className={`w-full ${inputCls}`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-xs font-mono mb-1 ${textMutedCls}`}>
                            헤드라인
                          </label>
                          <input
                            type="text"
                            value={page.headline}
                            onChange={(e) =>
                              updateCmsPage({ ...page, headline: e.target.value })
                            }
                            className={`w-full ${inputCls}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-mono mb-1 ${textMutedCls}`}>
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
                            className={`w-full ${inputCls}`}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </AdminSectionCard>
            </section>
          )}

          {/* ----------------------------------------------------------
              [관리자계정] ADMIN ACCOUNT & SECURITY
              ---------------------------------------------------------- */}
          {activeTab === 'ADMIN_ACCOUNT' && (
            <section className="space-y-4">
              <AdminSectionCard
                title="관리자 계정 및 보안 설정"
                categoryTag="SECURITY & ACCESS CONTROL"
                desc="플랫폼 전체 데이터 및 프로세스 제어 권한을 가진 최고 관리자 계정입니다."
                badge="Level 5 마스터 권한"
                isOpen={true}
                onToggle={() => {}}
                isLight={isLight}
              >
                <div className="space-y-4">
                  {/* 관리자 프로필 정보 카드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-none border space-y-3 ${subCardCls}`}>
                      <div className={`text-xs font-mono ${textMutedCls}`}>
                        관리자 고유 식별자
                      </div>
                      <div className={`text-base font-medium font-mono flex items-center gap-2 ${textTitleCls}`}>
                        <span>{currentUser?.handle || '@admin'}</span>
                        <span className={`text-[11px] font-normal ${textMutedCls}`}>
                          (ID: {currentUser?.userId || 'ADMIN_01'})
                        </span>
                      </div>
                      <div className={`text-xs font-mono ${textMutedCls}`}>
                        등록 이메일: <span className={textTitleCls}>{currentUser?.email || 'admin@nadosolo.com'}</span>
                      </div>
                    </div>

                    <div className={`p-5 rounded-none border space-y-3 ${subCardCls}`}>
                      <div className={`text-xs font-mono ${textMutedCls}`}>
                        권한 등급 및 세션
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f04f74] animate-pulse" />
                        <span className={`text-sm font-mono font-medium ${textTitleCls}`}>
                          활성 세션 (정상 연결)
                        </span>
                      </div>
                      <div className={`text-xs font-mono ${textMutedCls}`}>
                        보안 레벨: <span className={textTitleCls}>Level 5 (마스터 권한)</span>
                      </div>
                    </div>
                  </div>

                  {/* 비밀번호 관리 & 보안 수칙 안내 */}
                  <div className={`p-5 rounded-none border space-y-4 ${subCardCls}`}>
                    <h3 className={`font-serif-editorial text-sm font-normal ${textTitleCls}`}>
                      관리자 로그인 인증 정보 관리
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <label className={`block mb-1 font-normal ${textMutedCls}`}>
                          관리자 로그인 아이디
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="admin"
                          className={`w-full cursor-not-allowed opacity-75 ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label className={`block mb-1 font-normal ${textMutedCls}`}>
                          관리자 기본 비밀번호
                        </label>
                        <input
                          type="password"
                          readOnly
                          value="aa1111"
                          className={`w-full cursor-not-allowed opacity-75 ${inputCls}`}
                        />
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed font-light ${textMutedCls}`}>
                      관리자 계정 정보는 소스코드 및 Supabase 환경 변수와 동기화되어 안전하게 보호됩니다. 상용 배포 환경에서는 Supabase Auth의 관리자 전용 2FA(2단계 인증)를 적용하여 보안을 더욱 강화할 수 있습니다.
                    </p>
                  </div>

                  {/* 빠른 바로가기 액션 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Link
                      href="/dashboard"
                      className={btnSubCls}
                    >
                      사용자 대시보드 화면 전환 →
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminToast('관리자 세션 상태가 최신으로 동기화되었습니다.');
                        setTimeout(() => setAdminToast(null), 3000);
                      }}
                      className={btnPrimaryCls}
                    >
                      관리자 권한 캐시 갱신
                    </button>
                  </div>
                </div>
              </AdminSectionCard>
            </section>
          )}
        </div>
      </div>
    </main>
    </div>
  );
}
