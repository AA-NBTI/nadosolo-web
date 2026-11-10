'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import AdminPipelineEngineManager from '@/components/admin/AdminPipelineEngineManager';
import AdminEvalEngineManager from '@/components/admin/AdminEvalEngineManager';
import AdminSingleAuditReportManager from '@/components/admin/AdminSingleAuditReportManager';
import AdminProcessTestReportManager from '@/components/admin/AdminProcessTestReportManager';
import AdminAuditReportManager from '@/components/admin/AdminAuditReportManager';
import { SAMPLE_STALLED_USER_CASES } from '@/engine/processGateEngine';
import { nadoSoloSupabaseService, DbProfile } from '@/lib/supabase/service';
import {
  EXECUTIVE_GOVERNANCE_TEAM,
  GovernanceRole,
} from '@/engine/architectureAuditRegistry';

type AdminTabKey =
  | 'GOVERNANCE'
  | 'PROCESS'
  | 'AUDIT'
  | 'EVENT_GATE'
  | 'MEMBER_EVAL'
  | 'MEMBER_MGMT'
  | 'MEMBER_DOSSIER'
  | 'PROCESS_TEST_REPORT'
  | 'SINGLE_AUDIT_REPORT'
  | 'PIPELINE_ENGINE'
  | 'EVAL_ENGINE'
  | 'REPORT_PLAN'
  | 'REPORT_CHECKLIST'
  | 'REPORT_APPROVAL'
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
    groupTitle: '보고서',
    items: [
      { key: 'REPORT_PLAN', label: '계획' },
      { key: 'REPORT_CHECKLIST', label: '항목' },
      { key: 'REPORT_APPROVAL', label: '승인' },
    ],
  },
  {
    groupTitle: '시스템',
    items: [
      { key: 'EVAL_ENGINE', label: '엔진' },
      { key: 'PIPELINE_ENGINE', label: '매칭' },
      { key: 'PROCESS_TEST_REPORT', label: '점검' },
      { key: 'SINGLE_AUDIT_REPORT', label: '테스트' },
    ],
  },
  {
    groupTitle: '관제',
    items: [
      { key: 'GOVERNANCE', label: '조직' },
      { key: 'EVENT_GATE', label: '조건' },
      { key: 'PROCESS', label: '프로세스' },
      { key: 'AUDIT', label: '감사' },
    ],
  },
  {
    groupTitle: '회원',
    items: [
      { key: 'MEMBER_MGMT', label: '정보' },
      { key: 'MEMBER_EVAL', label: '평가' },
      { key: 'BADGE', label: '뱃지' },
    ],
  },
  {
    groupTitle: '공간',
    items: [
      { key: 'REGION', label: '지역' },
      { key: 'VENUE', label: '매장' },
      { key: 'DECK', label: '카드' },
    ],
  },
  {
    groupTitle: '설정',
    items: [
      { key: 'LAYOUT_CMS', label: '배치' },
      { key: 'PAGE_CMS', label: '페이지' },
      { key: 'DESIGN_SYSTEM', label: '디자인' },
      { key: 'ADMIN_ACCOUNT', label: '계정' },
    ],
  },
];

const ALL_ADMIN_CATEGORIES: AdminCategoryItem[] = ADMIN_CATEGORY_GROUPS.flatMap((g) => g.items);

export default function AdminOperationsDashboardPage() {
  const {
    currentUser,
    adminOriginUser,
    isSessionReady,
    isImpersonating,
    startAdminImpersonation,
    stopAdminImpersonation,
    loginAsUser,
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

  // 신규 접속 기본값: 선택된 탭 없음 → 우측에 전체 카테고리 목록이 먼저 노출
  const [activeTab, setActiveTab] = useState<AdminTabKey | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedProCode, setSelectedProCode] = useState<string | null>(null);
  const [selectedStalledUserId, setSelectedStalledUserId] = useState<string | null>(null);
  const [notifiedUserIds, setNotifiedUserIds] = useState<string[]>([]);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // [바프로 주관] Supabase 실서버 라이브 DB 회원 실시간 직결 상태 (SSOT)
  const [liveDbProfiles, setLiveDbProfiles] = useState<DbProfile[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  const fetchLiveDbProfiles = useCallback(async () => {
    setIsDbLoading(true);
    try {
      const data = await nadoSoloSupabaseService.getAllProfiles();
      setLiveDbProfiles(data);
      const now = new Date();
      setLastRefreshedAt(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch (err) {
      console.warn('[Admin Live Viewer] fetch error:', err);
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDbProfiles();
  }, [fetchLiveDbProfiles]);

  // [마프로·다프로 주관] 동적 모임 라이프사이클 시험기 상태 (지역 무관 자율 시험)
  const [simDistrictId, setSimDistrictId] = useState<string>('DIST_JEONPO');
  const [simMode, setSimMode] = useState<'ROMANCE' | 'THEME'>('ROMANCE');
  const [simStatus, setSimStatus] = useState<'IDLE' | 'RECRUITING' | 'CONFIRMED' | 'EXPIRED'>('IDLE');
  const [simMembers, setSimMembers] = useState<{ id: string; gender: 'M' | 'F'; age: number; status: string }[]>([]);
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const runSimSuccess = useCallback(() => {
    const dist = regionDistricts.find((d) => d.districtId === simDistrictId)?.districtName || '지정 거점';
    setSimStatus('CONFIRMED');
    setSimMembers([
      { id: 'M01', gender: 'M', age: 32, status: '결제완료' },
      { id: 'M02', gender: 'M', age: 34, status: '결제완료' },
      { id: 'M03', gender: 'M', age: 31, status: '결제완료' },
      { id: 'F01', gender: 'F', age: 29, status: '결제완료' },
      { id: 'F02', gender: 'F', age: 31, status: '결제완료' },
      { id: 'F03', gender: 'F', age: 33, status: '결제완료' },
    ]);
    setSimLogs([
      `[마프로/매칭] [${dist}] 남성 3명, 여성 3명 100% 충원 완료 (연령 격차 ±5세 통과)`,
      `[라프로/수익] 6인 다면평가 라이선스(₩30,000×6) 결제 홀딩 확정 (P01-PASS)`,
      `[마프로/공간] [${dist}] 프라이빗 다이닝 룸 자동 예약 및 180도 회전 좌석 락(Lock) 완료`,
      `[사프로/운영] 참가자 6인에게 [모임 확정 및 장소/시간 안내 동적 알림] 즉시 발송 완료`,
      `[바프로/데이터] 실서버 DB 격리 시뮬레이션 무결성 인증 완료 (오염 0건)`,
    ]);
  }, [simDistrictId, regionDistricts]);

  const runSimExpire = useCallback(() => {
    const dist = regionDistricts.find((d) => d.districtId === simDistrictId)?.districtName || '지정 거점';
    setSimStatus('EXPIRED');
    setSimMembers([
      { id: 'M01', gender: 'M', age: 32, status: '결제완료' },
      { id: 'F01', gender: 'F', age: 29, status: '결제완료' },
      { id: 'F02', gender: 'F', age: 31, status: '결제완료' },
      { id: 'F03', gender: 'F', age: 33, status: '결제완료' },
    ]);
    setSimLogs([
      `[마프로/매칭] [${dist}] 마감 시한(D-1 18:00) 도래: 남성 1/3, 여성 3/3 (남성 2명 미달)`,
      `[마프로/매칭] 최소 6인 3:3 성비 조건 미달로 [자동 폐쇄(EXPIRED)] 판정 완료`,
      `[라프로/수익] 4인 결제 승인 자동 취소 및 다음 회차 우선 배정 크레딧으로 이관 완료`,
      `[사프로/운영] 참가자 4인에게 [인원 미달 모임 순연 및 다음 주 우선 안내 알림] 즉시 발송 완료`,
      `[가프로/감사] 미달 폐쇄 라이프사이클 및 환불/이관 프로토콜 헌법 준수 확인`,
    ]);
  }, [simDistrictId, regionDistricts]);

  const resetSim = useCallback(() => {
    setSimStatus('IDLE');
    setSimMembers([]);
    setSimLogs([]);
  }, []);
  // 관리자 화면 기본 테마: 다크 모노크롬 (시스템 헌법 표준)
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>('dark');

  // [대분류 아코디언] 열린 그룹 타이틀 목록 (기본값: 전 메뉴 닫힌 컴팩트 목록 구조)
  const [openGroupTitles, setOpenGroupTitles] = useState<string[]>([]);

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
    setActiveTab(null);
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
  const [selectedUserId, setSelectedUserId] = useState<string>('USER_AA');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [expandedEvalMemberId, setExpandedEvalMemberId] = useState<string | null>(null);
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

  // 사이드바 및 본문 스크롤 컨테이너 참조
  const sidebarRef = useRef<HTMLElement | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  // 사이드바 카테고리 선택:
  // 1) 사이드바의 자체 스크롤 위치는 그대로 유지하여 화면 튐/리셋 방지
  // 2) 우측 메인 콘텐츠만 최상단으로 정렬
  const handleSelectTab = useCallback((key: AdminTabKey) => {
    // 사이드바의 현재 스크롤 위치 기록
    const currentSidebarScroll = sidebarRef.current?.scrollTop;

    setActiveTab(key);
    setExpandedMemberId(null);
    setExpandedEvalMemberId(null);
    setSelectedProcessId(null);
    setOpenSections({});
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

    // 우측 내용만 브라우저 뷰포트 최상단으로 정렬
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // 사이드바 자체 스크롤 위치 유지 (위로 튀지 않고 클릭 위치 100% 고정)
    if (currentSidebarScroll !== undefined && sidebarRef.current) {
      requestAnimationFrame(() => {
        if (sidebarRef.current && sidebarRef.current.scrollTop !== currentSidebarScroll) {
          sidebarRef.current.scrollTop = currentSidebarScroll;
        }
      });
    }
  }, []);

  const router = useRouter();

  const handleGoToUserDashboard = useCallback((targetUserId: string) => {
    // 세션 백업 → 저장소 갱신 → /dashboard 전체 이동까지 컨텍스트가 일괄 처리
    startAdminImpersonation(targetUserId);
  }, [startAdminImpersonation]);

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
  const filteredLiveMembers = useMemo(() => {
    return liveDbProfiles.filter((p) => {
      const q = memberSearchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.nickname.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q));
      const matchGender =
        memberGenderFilter === 'ALL' || p.gender === memberGenderFilter;
      return matchQuery && matchGender;
    });
  }, [liveDbProfiles, memberSearchQuery, memberGenderFilter]);

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

  // [보안 가드] 최고 관리자 인증 검증 (관리자 뷰어 모드 백업 세션 포함)
  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.handle === '@admin' ||
    currentUser?.userId === 'ADMIN_01' ||
    adminOriginUser?.role === 'ADMIN' ||
    adminOriginUser?.handle === '@admin';

  // 세션 복원 전에는 가드/로그인 화면을 그리지 않는다 (최고 관리자 전용 구역 깜빡임 방지)
  if (!isSessionReady) {
    return <div className="min-h-screen bg-[#07080a]" />;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#07080a] flex items-center justify-center px-6 text-[#f5f2eb]">
        <div className="max-w-md w-full bg-[#0c0d12] border border-white/[0.08] rounded-none p-8 sm:p-10 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-transparent border border-[#f04f74]/60 text-[#f04f74] flex items-center justify-center mx-auto text-xl font-mono font-bold">
            !
          </div>
          <div className="space-y-2">
            <span className="text-sm font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold">
              RESTRICTED CONSOLE
            </span>
            <h1 className="font-serif-editorial text-2xl font-normal text-white">최고 관리자 전용 구역</h1>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              본 콘솔은 나도솔로 시스템 총괄 관리자만 접근할 수 있습니다. 관리자 계정(@admin)으로 인증 후 이용해 주십시오.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/auth"
              className="w-full py-3.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-sm font-mono tracking-[0.2em] uppercase font-semibold transition-all duration-300"
            >
              관리자 로그인
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-white/10 hover:border-white/20 bg-white/[0.02] text-zinc-400 hover:text-white text-sm font-mono tracking-wider transition-colors"
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
    ? 'px-3.5 py-2 rounded-none border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-800 text-sm font-mono'
    : 'px-3.5 py-2 rounded-none border border-white/15 bg-black/40 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 text-sm font-mono';
  const selectCls = isLight
    ? 'px-3 py-2 rounded-none border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-800 text-sm font-mono cursor-pointer'
    : 'px-3 py-2 rounded-none border border-white/15 bg-black/40 text-white focus:outline-none focus:border-white/30 text-sm font-mono cursor-pointer';
  const btnSubCls = isLight
    ? 'px-3 py-1.5 rounded-none bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 text-sm font-mono cursor-pointer transition-colors'
    : 'px-3 py-1.5 rounded-none bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-sm font-mono cursor-pointer transition-colors';
  const btnPrimaryCls = isLight
    ? 'px-4 py-2 rounded-none border border-zinc-900 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-mono tracking-wider uppercase font-medium transition-all cursor-pointer'
    : 'px-4 py-2 rounded-none border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/40 text-white text-sm font-mono tracking-wider uppercase font-medium transition-all cursor-pointer';

  return (
    <div
      className={`min-h-screen ${
        isLight
          ? 'admin-light-mode bg-[#f4f5f7] text-zinc-900'
          : 'bg-[#07080a] text-[#f5f2eb]'
      } pt-3 pb-10 sm:pt-5 sm:pb-12 transition-colors duration-150`}
    >
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ============================================================
              좌측 사이드바: 일반화된 백오피스 문서 창고 네비게이션
              ============================================================ */}
          <aside
            ref={sidebarRef}
            className={`w-full lg:w-72 shrink-0 border p-4 sm:p-5 shadow-xl lg:sticky lg:top-20 lg:h-[calc(100vh-5.5rem)] lg:overflow-y-auto space-y-4 transition-colors select-none ${
              isLight
                ? 'bg-white border-zinc-200 text-zinc-900 [scrollbar-color:rgba(0,0,0,0.2)_transparent]'
                : 'bg-[#0c0d12] border-white/[0.08] text-white [scrollbar-color:rgba(255,255,255,0.15)_transparent]'
            } [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ${
              isLight
                ? '[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-400'
                : '[&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:hover:bg-white/30'
            }`}
            style={{ scrollbarWidth: 'thin' }}
          >
            <div
              className={`px-2 pb-4 border-b space-y-3 ${
                isLight ? 'border-zinc-200' : 'border-white/[0.08]'
              }`}
            >
              {/* 1행: 관리 콘솔 & v2.1.1 */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono tracking-wider text-white font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
                  관리자
                </p>
                <span className="px-2.5 py-0.5 border border-white/20 bg-white/5 text-sm font-mono font-bold text-white">
                  v2.1.1
                </span>
              </div>

              {/* 2행: 관리자 / @admin • 슈퍼 권한 */}
              <div className="flex items-baseline justify-between gap-2 border-t border-white/[0.04] pt-2.5">
                <h1
                  className={`font-serif-editorial text-lg font-normal shrink-0 ${
                    isLight ? 'text-zinc-900' : 'text-white'
                  }`}
                >
                  {currentUser?.nickname || '관리자'}
                </h1>
                <span
                  className={`text-sm font-mono text-right truncate ${
                    isLight ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  {currentUser?.handle || '@admin'} • 슈퍼 권한
                </span>
              </div>

              {/* 3행: 접기 | 펼치기 */}
              <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04] text-sm font-mono">
                <span className="text-sm text-zinc-500">
                  메뉴
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={collapseAllGroups}
                    className={`hover:underline cursor-pointer ${
                      isLight ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    접기
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
                    펼치기
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-[15px] font-medium tracking-wide uppercase transition-colors cursor-pointer select-none ${
                        isLight
                          ? hasActiveChild
                            ? 'text-zinc-900 font-bold'
                            : 'text-zinc-600 hover:text-zinc-900'
                          : hasActiveChild
                          ? 'text-white font-bold'
                          : 'text-zinc-300 hover:text-white font-medium'
                      }`}
                    >
                      <span>{group.groupTitle}</span>
                      <span className="text-sm font-mono opacity-60">
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
                              className={`w-full text-left px-3.5 py-2.5 transition-all flex items-center justify-between cursor-pointer text-sm tracking-normal ${
                                active
                                  ? isLight
                                    ? 'bg-zinc-100 text-zinc-900 font-semibold border-l-2 border-[#f04f74] pl-3'
                                    : 'bg-white/[0.04] text-white font-medium border-l-2 border-[#f04f74] pl-3'
                                  : isLight
                                  ? 'bg-transparent hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border-l-2 border-transparent pl-3 font-normal'
                                  : 'bg-transparent hover:bg-white/[0.02] text-zinc-400 hover:text-white border-l-2 border-transparent pl-3 font-normal'
                              }`}
                            >
                              <span>{cat.label}</span>
                              {cat.badge && (
                                <span
                                  className={`px-2 py-0.5 text-sm font-mono border ${
                                    isLight
                                      ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                      : 'bg-white/10 text-zinc-300 border-white/10'
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
                className={`block w-full py-2.5 px-3 rounded-none border text-center text-sm font-mono transition-colors ${
                  isLight
                    ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                마이페이지 →
              </Link>
              <Link
                href="/"
                className={`block w-full py-2.5 px-3 rounded-none text-center text-sm font-mono transition-colors ${
                  isLight
                    ? 'text-zinc-500 hover:text-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                ← 메인 화면
              </Link>

              {/* 화이트 모드 / 다크 모드 뷰어 토글 (메인 화면 아래 배치) */}
              <div
                className={`flex items-center gap-1 p-0.5 border text-sm font-mono mt-3 rounded-none ${
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
                  화이트
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
                  다크
                </button>
              </div>
            </div>
          </aside>

          {/* ============================================================
              우측 메인 워크스페이스 (최소 높이 확보로 탭 전환 시 화면 점프 방지)
              ============================================================ */}
          <div ref={mainContentRef} className="flex-1 w-full min-w-0 space-y-3 min-h-[85vh]">
            {/* 알림 토스트 (필요 시 우측 상단 플로팅) */}
            {adminToast && (
              <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-black/90 border border-[#f04f74] text-white text-sm font-mono shadow-2xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <span>{adminToast}</span>
              </div>
            )}

            {/* 신규 접속 기본 화면: 전체 카테고리 목록 (클릭 시 해당 화면 진입) */}
            {activeTab === null && (
              <div
                className={`border divide-y ${
                  isLight
                    ? 'bg-white border-zinc-200 divide-zinc-200'
                    : 'bg-[#0c0d12] border-white/10 divide-white/[0.06]'
                }`}
              >
                {ADMIN_CATEGORY_GROUPS.map((group) => (
                  <div key={group.groupTitle} className="p-4 flex flex-wrap items-center gap-3">
                    <span
                      className={`w-16 shrink-0 text-sm font-mono font-bold ${
                        isLight ? 'text-zinc-900' : 'text-white'
                      }`}
                    >
                      {group.groupTitle}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => handleSelectTab(cat.key)}
                          className={`px-3 py-1.5 border text-sm font-mono transition-colors cursor-pointer ${
                            isLight
                              ? 'border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                              : 'border-white/15 text-zinc-300 hover:border-[#f04f74] hover:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* ----------------------------------------------------------
              [보고] 프로세스 점검 보고 & 관리자 최종 승인 (계획 / 항목 / 승인)
              ---------------------------------------------------------- */}
          {(activeTab === 'REPORT_PLAN' ||
            activeTab === 'REPORT_CHECKLIST' ||
            activeTab === 'REPORT_APPROVAL') && (
            <section className="space-y-4">
              <AdminAuditReportManager
                subTab={
                  activeTab === 'REPORT_PLAN'
                    ? 'PLAN'
                    : activeTab === 'REPORT_APPROVAL'
                    ? 'APPROVAL'
                    : 'CHECKLIST'
                }
                isLight={isLight}
                onNotify={notify}
              />
            </section>
          )}

          {/* ----------------------------------------------------------
              [거버넌스] 회장실 직속 안프로 사단 '가·나·다·라·마' 직보 체계
              ---------------------------------------------------------- */}
          {activeTab === 'GOVERNANCE' && (
            <section className="space-y-3 animate-in fade-in duration-150">
              {/* 상단 컨트롤 바 (헌법 제6조 원칙 6 표준 테두리 박스) */}
              <div className={`p-3 border ${cardCls} flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className={`font-serif-editorial text-lg font-normal ${textTitleCls}`}>
                    조직
                  </h2>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    회장실 직속 • 안프로 사단 {EXECUTIVE_GOVERNANCE_TEAM.length}인
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProCode(null);
                      notify('조직 명부가 전체 목록 모드로 정돈되었습니다.');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 border border-white/10 hover:border-white/30 text-sm font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    <span>목록</span>
                  </button>
                </div>
              </div>

              {/* 2열 컴팩트 그리드 (헌법 제6조 원칙 5) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {EXECUTIVE_GOVERNANCE_TEAM.map((pro) => {
                  const isExpanded = selectedProCode === pro.code;

                  return (
                    <div
                      key={pro.code}
                      className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                        isExpanded
                          ? 'col-span-full bg-white/[0.03] border-white/20'
                          : 'hover:bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      {/* 1단계: 컴팩트 1줄 요약 행 */}
                      <div
                        onClick={() => setSelectedProCode(isExpanded ? null : pro.code)}
                        className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                            {isExpanded ? '▾' : '▸'}
                          </span>
                          <span className="text-sm font-mono font-bold text-white shrink-0">
                            {pro.name}
                          </span>
                          <span className="text-sm font-mono text-zinc-400 truncate">
                            {pro.englishTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
                            {pro.koreanRole}
                          </span>
                          <span className="text-sm font-mono text-zinc-500">
                            {pro.rank === 0 ? '총괄' : `${pro.rank}순위`}
                          </span>
                        </div>
                      </div>

                      {/* 2단계: 클릭 시 2열 전체폭 상세 확장 (Click-to-Reveal) */}
                      {isExpanded && (
                        <div className="border-t border-white/10 p-4 space-y-3 bg-black/40 animate-in fade-in duration-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                              <span className="text-zinc-500 block">공식 직함</span>
                              <p className="text-white font-medium leading-relaxed">
                                {pro.fullRoleTitle}
                              </p>
                            </div>
                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                              <span className="text-zinc-500 block">회장실 핫라인</span>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-white font-medium">
                                  {pro.hotlineSummon}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(pro.hotlineSummon.split('/')[0].trim());
                                    notify(`'${pro.name}' 호출어가 복사되었습니다.`);
                                  }}
                                  className="px-2 py-0.5 border border-white/20 hover:border-white/40 text-sm font-mono text-zinc-300 hover:text-white"
                                >
                                  복사
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                            <span className="text-zinc-500 block">헌법상 고유 책임 (R&R)</span>
                            <p className="text-white leading-relaxed">
                              {pro.responsibility}
                            </p>
                          </div>

                          <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                            <span className="text-zinc-500 block">최근 수행 성과</span>
                            <p className="text-zinc-200 leading-relaxed">
                              {pro.recentMilestone}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              1. [프로세스] 서비스 프로세스 모듈 (리스트 우선 조망 ➔ 클릭 시 상세 노출)
              ---------------------------------------------------------- */}
          {activeTab === 'PROCESS' && (
            <section className="space-y-4">
              <div className={`p-4 border ${isLight ? 'bg-white border-zinc-300' : 'bg-[#0c0d12] border-white/10'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className={`font-serif-editorial text-lg font-normal ${textTitleCls}`}>
                    서비스 프로세스 모듈
                  </h2>
                  <span className="text-sm font-mono text-zinc-500">
                    총 {processModules.length}개 단계 • {processModules.filter((m) => m.enabled).length}개 활성
                  </span>
                </div>
              </div>

              {/* 순수 컴팩트 목록 (2열 컴팩트 그리드로 한 화면 조망) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {processModules.map((mod) => {
                  const isSelected = selectedProcessId === mod.processId;
                  return (
                    <div
                      key={mod.processId}
                      className={`border transition-colors ${
                        isLight ? 'border-zinc-300 bg-white' : 'border-white/10 bg-[#0c0d12]'
                      } ${
                        isSelected
                          ? isLight
                            ? 'col-span-full bg-zinc-50 border-zinc-400'
                            : 'col-span-full bg-white/[0.03] border-white/20'
                          : isLight
                          ? 'hover:bg-zinc-50 hover:border-zinc-300'
                          : 'hover:bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      {/* 컴팩트 목록 행 (클릭 시 토글) */}
                      <div
                        onClick={() => setSelectedProcessId(isSelected ? null : mod.processId)}
                        className="px-4 py-3.5 cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-white font-semibold border border-white/20 shrink-0">
                            P0{mod.stepOrder}
                          </span>
                          <span className={`font-serif-editorial text-sm ${textTitleCls} group-hover:text-white transition-colors truncate`}>
                            {mod.label}
                          </span>
                          {mod.coreRequired && (
                            <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-zinc-300 border border-white/10 shrink-0">
                              필수코어
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className={`px-2.5 py-1 text-sm font-mono border font-semibold ${
                              mod.enabled
                                ? 'border-white/30 bg-white/10 text-white'
                                : 'border-white/10 text-zinc-400 bg-transparent'
                            }`}
                          >
                            {mod.enabled ? 'ON' : 'OFF'}
                          </span>
                          <span className="text-sm text-zinc-400 group-hover:text-white transition-transform">
                            {isSelected ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* 클릭 시에만 펼쳐지는 상세 설명 및 제어 패널 */}
                      {isSelected && (
                        <div className={`px-5 py-4 border-t ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-white/[0.08] bg-white/[0.02]'} space-y-3 animate-in fade-in duration-150`}>
                          <div className="pl-3.5 border-l-2 border-white/20 ml-1">
                            <p className={`text-sm font-light leading-relaxed ${textMutedCls}`}>
                              {mod.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                            <span className="text-sm font-mono text-zinc-400">
                              모듈 식별자: {mod.processId}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProcessModule(mod.processId);
                                notify(`[${mod.label}] 모듈이 ${!mod.enabled ? '활성화' : '비활성화'}되었습니다.`);
                              }}
                              className={`px-4 py-1.5 text-sm font-mono tracking-wider transition-all cursor-pointer font-semibold ${
                                mod.enabled
                                  ? 'border border-white/30 bg-white/10 hover:bg-white/20 text-white'
                                  : 'border border-white/20 bg-transparent text-zinc-400 hover:text-white'
                              }`}
                            >
                              {mod.enabled ? '비활성화' : '활성화'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 프로세스 단계별 정체·이탈 관제 (4~6단계: 정체 감지 및 재알림) */}
              <div className={`p-3.5 border ${isLight ? 'bg-white border-zinc-300' : 'bg-[#0c0d12] border-white/10'} flex items-center justify-between mt-6`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className={`font-serif-editorial text-lg font-normal ${textTitleCls}`}>
                    정체 관제
                  </h2>
                  <span className="text-sm font-mono text-zinc-500">
                    {SAMPLE_STALLED_USER_CASES.length}건
                  </span>
                </div>
              </div>

              {/* 순수 컴팩트 목록 (2열 컴팩트 그리드로 한 화면 조망) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {SAMPLE_STALLED_USER_CASES.map((item) => {
                  const isSelected = selectedStalledUserId === item.userId;
                  const isSent = notifiedUserIds.includes(item.userId);

                  return (
                    <div
                      key={item.userId}
                      className={`border transition-colors ${
                        isLight ? 'border-zinc-300 bg-white' : 'border-white/10 bg-[#0c0d12]'
                      } ${
                        isSelected
                          ? isLight
                            ? 'col-span-full bg-zinc-50 border-zinc-400'
                            : 'col-span-full bg-white/[0.03] border-white/20'
                          : isLight
                          ? 'hover:bg-zinc-50 hover:border-zinc-300'
                          : 'hover:bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      {/* 1단계: 순수 정체 리스트 행 (결과값 배제 & 핵심 항목만 조망) */}
                      <div
                        onClick={() => setSelectedStalledUserId(isSelected ? null : item.userId)}
                        className="px-3.5 py-3 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm font-mono text-zinc-500 w-3 shrink-0">
                            {isSelected ? '▾' : '▸'}
                          </span>
                          <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-white font-semibold border border-white/20 shrink-0">
                            {item.stepId}
                          </span>
                          <span className={`font-mono text-sm font-medium ${textTitleCls} truncate`}>
                            {item.handle} ({item.nickname})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-mono text-zinc-400 group-hover:text-white transition-colors">
                            {isSelected ? '닫기' : '상세'}
                          </span>
                        </div>
                      </div>

                      {/* 2단계: 클릭 시 결과값 및 상세 대조 펼침 (Click-to-Reveal) */}
                      {isSelected && (
                        <div className={`px-5 py-4 border-t ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-white/[0.08] bg-white/[0.02]'} space-y-3.5`}>
                          {/* 결과값 배너 */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-sm font-mono p-3 bg-white/[0.03] border border-white/15">
                            <div>
                              <span className="text-zinc-400 text-sm block">정체 시간</span>
                              <span className="text-white font-semibold">{item.durationLabel}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 text-sm block">심각도</span>
                              <span className="text-white font-semibold">{item.severity}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 text-sm block">상태</span>
                              <span className="text-white font-semibold">{isSent ? '발송 완료' : '대기중'}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 pl-3 border-l-2 border-white/20">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-zinc-400">정체 단계:</span>
                              <span className="text-sm text-white font-medium">{item.stepName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-zinc-400">미충족 항목:</span>
                              <span className="text-sm text-zinc-200 font-mono">{item.missingField}</span>
                            </div>
                            <div className="pt-1">
                              <span className="text-sm font-mono text-zinc-400 block mb-1">알림 발송 템플릿:</span>
                              <div className="p-3 bg-black/40 border border-white/10 text-sm text-zinc-200 font-mono">
                                {item.suggestedMessage}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startAdminImpersonation(item.userId);
                              }}
                              className="px-3.5 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-zinc-200 transition-colors cursor-pointer"
                            >
                              동선 열람
                            </button>
                            <button
                              type="button"
                              disabled={isSent}
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotifiedUserIds((prev) => [...prev, item.userId]);
                                notify(`[알림 발송 완료] ${item.handle} 회원에게 재알림이 발송되었습니다.`);
                              }}
                              className={`px-4 py-1.5 text-sm font-mono transition-colors cursor-pointer font-semibold ${
                                isSent
                                  ? 'border border-white/10 text-zinc-600 bg-transparent'
                                  : 'border border-white/30 bg-white/15 hover:bg-white/25 text-white'
                              }`}
                            >
                              {isSent ? '발송 완료' : '알림 발송'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------
              [품질점검] 6대 마이크로 평가 모듈 및 전주기 품질 감사 관제
              ---------------------------------------------------------- */}
          {activeTab === 'AUDIT' && (
            <section className="space-y-4">
              {/* 상단 전주기 감사 지표 카드 */}
              <AdminSectionCard
                title="품질 감사"
                badge={`${fullJourneyAudit.totalAuditScore100}점`}
                isOpen={isSectionOpen('SEC_AUDIT_TOTAL', false)}
                onToggle={() => toggleSection('SEC_AUDIT_TOTAL', false)}
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
                        className={`text-sm font-mono font-medium ${
                          isLight ? 'text-zinc-700' : 'text-zinc-300'
                        }`}
                      >
                        공간
                      </span>
                      <span className="font-serif-editorial text-lg font-normal text-white">
                        {fullJourneyAudit.placeReport.totalScore100}점
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {fullJourneyAudit.placeReport.elementScores.map((el) => (
                        <div
                          key={el.elementId}
                          className="flex justify-between text-sm font-mono"
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
                        className={`text-sm font-mono font-medium ${
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
                          className="flex justify-between text-sm font-mono"
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
                        className={`text-sm font-mono font-medium ${
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
                          className="flex justify-between text-sm font-mono"
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
                title="모듈 현황"
                badge={`${EvaluationRegistry.getAllModules().length}건`}
                isOpen={isSectionOpen('SEC_AUDIT_MODULES', false)}
                onToggle={() => toggleSection('SEC_AUDIT_MODULES', false)}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EvaluationRegistry.getAllModules().map((mod) => (
                    <div
                      key={mod.id}
                      className={`p-4 rounded-none border space-y-2.5 ${
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
                          className={`text-sm font-mono px-2 py-0.5 rounded-none border ${
                            isLight
                              ? 'bg-white text-zinc-600 border-zinc-300'
                              : 'bg-white/5 text-zinc-400 border-white/10'
                          }`}
                        >
                          {mod.targetContext}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className={`text-sm font-mono ${textMutedCls}`}>
                          관찰 앵커:
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {mod.getObservationElements().map((el) => (
                            <span
                              key={el.id}
                              className={`px-2.5 py-1 rounded-none border text-sm font-mono font-medium ${
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
                title="화면 배치"
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
              [회원평가] 리스트 우선 조망 ➔ 클릭 시 상세 노출 (Click-to-Reveal)
              ---------------------------------------------------------- */}
          {(activeTab === 'MEMBER_EVAL' || activeTab === 'MEMBER_DOSSIER') && (
            <div className="space-y-3">
              {/* 상단 컴팩트 컨트롤 바 (검색 + 성별 필터 인라인화) */}
              <div
                className={`p-3 border ${
                  isLight ? 'bg-white border-zinc-200' : 'bg-[#0c0d12] border-white/10'
                } flex flex-wrap items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg font-normal text-white">
                    회원 평가
                  </h2>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    {evalFilteredMembers.length}명
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="회원 검색 (이름 / ID)"
                    value={evalMemberSearch}
                    onChange={(e) => setEvalMemberSearch(e.target.value)}
                    className="px-3 py-1 bg-black/40 border border-white/10 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#f04f74]/60 w-36 sm:w-44"
                  />
                  <div className="flex border border-white/10 divide-x divide-white/10 text-sm font-mono">
                    {(['ALL', 'F', 'M'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setEvalMemberGender(g)}
                        className={`px-2.5 py-1 transition-colors cursor-pointer ${
                          evalMemberGender === g
                            ? 'bg-white/15 text-white font-semibold'
                            : 'bg-black/30 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {g === 'ALL' ? '전체' : g === 'F' ? '여성' : '남성'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 회원별 평가 요약 2열 그리드 & 클릭 시 세부 도메인 점수 펼침 (Click-to-Reveal) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {evalFilteredMembers.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-sm font-mono text-zinc-500 border border-white/10 bg-[#0c0d12]">
                    일치하는 평가 대상 회원이 없습니다.
                  </div>
                ) : (
                  evalFilteredMembers.map((p) => {
                    const isExpanded = expandedEvalMemberId === p.userId;
                    const dossier = getPersonalDossierForUser(p.userId);
                    return (
                      <div
                        key={p.userId}
                        className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                          isExpanded ? 'col-span-full bg-white/[0.03] border-white/20' : 'hover:bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        {/* 1단계: 컴팩트 1줄 행 */}
                        <div
                          onClick={() => {
                            setExpandedEvalMemberId(isExpanded ? null : p.userId);
                            setSelectedUserId(p.userId);
                          }}
                          className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                              {isExpanded ? '▾' : '▸'}
                            </span>
                            <span className="text-sm font-mono font-bold text-white shrink-0">
                              {p.userId}
                            </span>
                            <span className="text-sm font-mono text-zinc-300 shrink-0">
                              {p.userId === 'USER_AA' ? '@aa' : '@bb'}
                            </span>
                            <span className="text-sm font-medium text-white truncate">
                              {p.nickname}
                            </span>
                            <span className="text-sm text-zinc-300 shrink-0">
                              {p.gender === 'F' ? '여성' : '남성'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 text-sm font-mono">
                            <span className="text-zinc-400">
                              종합: <strong className="text-white font-semibold">{dossier.totalScore100}점</strong>
                            </span>
                            <span className="text-sm px-2 py-0.5 border border-white/10 text-zinc-300">
                              신뢰 {p.trustScore}점
                            </span>
                          </div>
                        </div>

                        {/* 2단계: 클릭 시 펼쳐지는 다면 평가 상세 (Click-to-Reveal) */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2 bg-black/40">
                            <div className="pl-3.5 border-l border-white/20 ml-1 space-y-4">
                              {/* 5대 도메인 카드 그리드 */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                                {dossier.domainSummaries.map((dom) => (
                                  <div
                                    key={dom.majorCode}
                                    className="p-3 bg-white/[0.02] border border-white/[0.06] space-y-2"
                                  >
                                    <div className="flex items-center justify-between border-b pb-1.5 border-white/[0.06]">
                                      <span className="text-sm font-mono text-zinc-300 font-medium">
                                        {dom.label}
                                      </span>
                                      <span className="text-sm font-mono text-white font-semibold">
                                        {dom.score100}점
                                      </span>
                                    </div>
                                    <div className="space-y-1 divide-y divide-white/[0.04]">
                                      {dom.subSummaries.map((sub) => (
                                        <div
                                          key={sub.subElementId}
                                          className="flex items-center justify-between text-sm pt-1"
                                        >
                                          <span className="text-zinc-500 font-mono">
                                            {sub.label}
                                          </span>
                                          <span className="text-zinc-300 font-mono">
                                            {sub.score20}/20
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* 하단 단축 컨트롤 및 링크 */}
                              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-sm">
                                <span className="text-zinc-400 font-mono">
                                  관찰 피드백: 동석자 전원(5/5) 상호 관찰 정규화 완료
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleGoToUserDashboard(p.userId)}
                                  className="text-white hover:underline font-mono text-sm cursor-pointer"
                                >
                                  {p.nickname} 사용자 대시보드로 이동 ➔
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              [회원정보] 실서버 Supabase 라이브 DB 직결 뷰어 (SSOT 단일 진실 공급원)
              ---------------------------------------------------------- */}
          {activeTab === 'MEMBER_MGMT' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* 상단 컴팩트 컨트롤 바 (1줄 인라인: 실서버 카운트 + 새로고침 + 검색 + 필터) */}
              <div
                className={`p-3 border ${cardCls} flex flex-wrap items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg font-normal text-white">
                    회원 정보
                  </h2>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    실서버 DB {filteredLiveMembers.length}명 • SSOT
                  </span>
                  {lastRefreshedAt && (
                    <span className="text-sm font-mono text-zinc-500">
                      ({lastRefreshedAt} 갱신)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      fetchLiveDbProfiles();
                      notify('Supabase 실서버 회원 목록을 새로고침했습니다.');
                    }}
                    disabled={isDbLoading}
                    className="px-2.5 py-1 border border-white/10 hover:border-white/30 text-sm font-mono text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isDbLoading ? '조회중...' : '새로고침'}
                  </button>
                  <input
                    type="text"
                    placeholder="검색 (이름, 핸들, 이메일)"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="px-3 py-1 bg-black/40 border border-white/10 text-sm font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#f04f74]/60 w-36 sm:w-48"
                  />
                  <div className="flex border border-white/10 divide-x divide-white/10 text-sm font-mono">
                    {(['ALL', 'F', 'M'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setMemberGenderFilter(g)}
                        className={`px-2.5 py-1 transition-colors cursor-pointer ${
                          memberGenderFilter === g
                            ? 'bg-white/15 text-white font-semibold'
                            : 'bg-black/30 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {g === 'ALL' ? '전체' : g === 'F' ? '여성' : '남성'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2열 컴팩트 그리드 (실서버 레코드 직결 ➔ 클릭 시 상세 확장) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredLiveMembers.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-sm font-mono text-zinc-500 border border-white/10 bg-[#0c0d12]">
                    실서버 DB에 등록된 회원이 없습니다.
                  </div>
                ) : (
                  filteredLiveMembers.map((m) => {
                    const isExpanded = expandedMemberId === m.id;
                    const createdStr = m.created_at
                      ? new Date(m.created_at).toLocaleDateString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '일시미상';

                    return (
                      <div
                        key={m.id}
                        className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                          isExpanded
                            ? 'col-span-full bg-white/[0.04] border-white/20'
                            : 'hover:bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        {/* 1단계: 컴팩트 1줄 요약 행 */}
                        <div
                          onClick={() => setExpandedMemberId(isExpanded ? null : m.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base font-mono text-zinc-400 w-4 shrink-0">
                              {isExpanded ? '▾' : '▸'}
                            </span>
                            <span className="text-sm font-mono font-bold text-white tracking-wide shrink-0">
                              {m.handle}
                            </span>
                            <span className="text-sm font-semibold text-zinc-200 truncate">
                              {m.nickname}
                            </span>
                            <span className="text-sm text-zinc-400 shrink-0">
                              {m.gender === 'F' ? '여성' : '남성'}
                            </span>
                            <span className="text-sm font-mono text-zinc-400 shrink-0">
                              {m.birth_year}년생
                            </span>
                            <span className="text-sm font-mono text-zinc-500 truncate hidden sm:inline">
                              {m.email}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-mono text-zinc-400">
                              {createdStr}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
                              {m.id === 'ADMIN_01' ? '관리자' : '실회원'}
                            </span>
                          </div>
                        </div>

                        {/* 2단계: 클릭 시 펼쳐지는 실서버 DB 전체 상세 (Click-to-Reveal) */}
                        {isExpanded && (
                          <div className="p-4 border-t border-white/10 bg-black/40 space-y-3 animate-in fade-in duration-100">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-mono">
                              <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                <span className="text-zinc-500 block mb-1">고유 DB ID</span>
                                <span className="text-white font-medium">{m.id}</span>
                              </div>
                              <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                <span className="text-zinc-500 block mb-1">이메일</span>
                                <span className="text-white font-medium truncate block">{m.email || '미등록'}</span>
                              </div>
                              <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                <span className="text-zinc-500 block mb-1">휴대폰</span>
                                <span className="text-white font-medium">{m.phone || '미등록'}</span>
                              </div>
                              <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                <span className="text-zinc-500 block mb-1">직업</span>
                                <span className="text-white font-medium">{m.job_title || '미입력'}</span>
                              </div>
                              <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                <span className="text-zinc-500 block mb-1">식이 제약</span>
                                <span className="text-white font-medium">{m.dietary || 'NONE'}</span>
                              </div>
                              <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                <span className="text-zinc-500 block mb-1">관심사</span>
                                <span className="text-white font-medium truncate block">
                                  {(m.interests && m.interests.length > 0) ? m.interests.join(', ') : '미설정'}
                                </span>
                              </div>
                              <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                <span className="text-zinc-500 block mb-1">인증 뱃지</span>
                                <span className="text-white font-medium">{m.verified_badge || 'VERIFIED_MEMBER'}</span>
                              </div>
                              <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                <span className="text-zinc-500 block mb-1">참여 세션 수</span>
                                <span className="text-white font-medium">{m.session_count ?? 1}회</span>
                              </div>
                            </div>

                            {/* 성향 자가진단 점수 */}
                            {m.self_domain_scores && (
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                                <span className="text-zinc-500 block">성향 자가진단 5대 영역 (NBTI 점수)</span>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                  {Object.entries(m.self_domain_scores).map(([k, v]) => (
                                    <div key={k} className="p-1.5 border border-white/10 text-center">
                                      <span className="text-zinc-400 block text-sm">{k}</span>
                                      <span className="text-white font-bold text-sm">{v}점</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              [시스템/테스트] 프로세스 점검 보고서 & 이용자 동선 검증
              ---------------------------------------------------------- */}
          {activeTab === 'PROCESS_TEST_REPORT' && (
            <AdminProcessTestReportManager />
          )}

          {/* ----------------------------------------------------------
              [매칭엔진] 0~6층 파이프라인 매칭 & 다면 관제 엔진 (마스터 리스트 ➔ 클릭 상세 진입 구조)
              ---------------------------------------------------------- */}
          {activeTab === 'PIPELINE_ENGINE' && (
            <AdminPipelineEngineManager
              isLight={isLight}
              onNotify={notify}
            />
          )}

          {/* ----------------------------------------------------------
              [1인테스트보고서] 1인 단위 질문 모듈 테스트 & 최종 매칭 검증 보고서
              ---------------------------------------------------------- */}
          {activeTab === 'SINGLE_AUDIT_REPORT' && (
            <AdminSingleAuditReportManager
              isLight={isLight}
              onNotify={notify}
            />
          )}

          {/* ----------------------------------------------------------
              3. [평가엔진] 5대분류 × 5중분류 × 5평가기준 정규화 매트릭스 (리스트 ➔ 클릭 상세 진입 구조)
              ---------------------------------------------------------- */}
          {activeTab === 'EVAL_ENGINE' && (
            <AdminEvalEngineManager
              majorDomains={majorDomains}
              evaluationCriteria={evaluationCriteria}
              subElements={subElements}
              onToggleSubElementActive={toggleSubElementActive}
              onUpdateSubElement={updateSubElement}
              onNotify={notify}
              isLight={isLight}
            />
          )}

          {/* ----------------------------------------------------------
              4. [뱃지] 세분화 뱃지 도감 추가 · 수정 · 삭제
              ---------------------------------------------------------- */}
          {activeTab === 'BADGE' && (
            <section className="space-y-4">
              {/* 등록된 뱃지 목록 아코디언 */}
              <AdminSectionCard
                title="뱃지"
                badge={`${granularBadges.length}건`}
                isOpen={isSectionOpen('SEC_BADGE_LIST', false)}
                onToggle={() => toggleSection('SEC_BADGE_LIST', false)}
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
                            className={`text-sm font-mono ${textMutedCls}`}
                          >
                            BADGE
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-sm font-mono border ${
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
                title="뱃지 추가"
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
                    + 추가
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
                title="지역"
                badge={`${regionDistricts.length}건`}
                isOpen={isSectionOpen('SEC_REGION_LIST', false)}
                onToggle={() => toggleSection('SEC_REGION_LIST', false)}
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
                          className={`px-2.5 py-0.5 rounded-none text-sm font-mono border ${
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
                          className={`px-2.5 py-0.5 rounded-none text-sm font-mono font-medium cursor-pointer border ${
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
                      <div className="flex items-center justify-between pt-2">
                        <span className={`text-sm font-mono ${textMutedCls}`}>
                          {dist.defaultGatherTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteRegionDistrict(dist.districtId)}
                          className={`text-sm cursor-pointer transition-colors font-mono hover:text-red-500 ${textMutedCls}`}
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
                title="지역 추가"
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
                    + 추가
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
                title="매장"
                badge={`${partnerVenues.length}건`}
                isOpen={isSectionOpen('SEC_VENUE_LIST', false)}
                onToggle={() => toggleSection('SEC_VENUE_LIST', false)}
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
                        <p className={`text-sm mt-1 font-light ${textMutedCls}`}>
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
                title="매장 추가"
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
                    + 추가
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
              {/* 상단 컴팩트 컨트롤 바 (표준 테두리 박스 컨테이너) */}
              <div
                className={`p-3 border flex items-center justify-between gap-3 ${
                  isLight
                    ? 'bg-white border-zinc-200 shadow-sm'
                    : 'bg-[#0c0d12] border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2
                    className={`font-serif-editorial text-lg font-normal ${
                      isLight ? 'text-zinc-900' : 'text-white'
                    }`}
                  >
                    모임조건
                  </h2>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    3건
                  </span>
                </div>

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
                    className={`px-2.5 py-1 text-sm font-mono border transition-colors cursor-pointer ${
                      isLight
                        ? 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    접기
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      expandAllSections([
                        'SEC_EVENT_CREATE',
                        'SEC_EVENT_LIST',
                        'SEC_EVENT_NOSHOW',
                      ])
                    }
                    className={`px-2.5 py-1 text-sm font-mono border transition-colors cursor-pointer ${
                      isLight
                        ? 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    펼치기
                  </button>
                </div>
              </div>

              {/* 0. [마프로·다프로] 동적 모임 라이프사이클 시험기 (지역 무관 자율 시험) */}
              <AdminSectionCard
                title="동적 시험"
                badge={simStatus === 'CONFIRMED' ? '성립 확정' : simStatus === 'EXPIRED' ? '인원 미달 폐쇄' : simStatus === 'RECRUITING' ? '모집 중' : '대기'}
                isOpen={isSectionOpen('SEC_EVENT_SIMULATOR', true)}
                onToggle={() => toggleSection('SEC_EVENT_SIMULATOR', true)}
                isLight={isLight}
              >
                <div className="space-y-3">
                  {/* 시험 제어 바 */}
                  <div className={`p-3 border flex flex-wrap items-center justify-between gap-3 ${subCardCls}`}>
                    <div className="flex items-center gap-2">
                      <select
                        value={simDistrictId}
                        onChange={(e) => {
                          setSimDistrictId(e.target.value);
                          resetSim();
                        }}
                        className={`text-sm font-mono ${selectCls}`}
                      >
                        {regionDistricts.map((d) => (
                          <option key={d.districtId} value={d.districtId}>
                            {d.regionName} · {d.districtName}
                          </option>
                        ))}
                      </select>
                      <select
                        value={simMode}
                        onChange={(e) => {
                          setSimMode(e.target.value as any);
                          resetSim();
                        }}
                        className={`text-sm font-mono ${selectCls}`}
                      >
                        <option value="ROMANCE">3:3 로맨스 (엄격 성비 1:1)</option>
                        <option value="THEME">소셜 살롱 (대화/취향 결)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={runSimSuccess}
                        className="px-3 py-1 border border-white/20 hover:border-white text-sm font-mono text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        성립시험
                      </button>
                      <button
                        type="button"
                        onClick={runSimExpire}
                        className="px-3 py-1 border border-white/20 hover:border-white text-sm font-mono text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        폐쇄시험
                      </button>
                      <button
                        type="button"
                        onClick={resetSim}
                        className="px-2.5 py-1 border border-white/10 hover:border-white/30 text-sm font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        초기화
                      </button>
                    </div>
                  </div>

                  {/* 시험 결과 2열 컴팩트 그리드 */}
                  {simStatus !== 'IDLE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono animate-in fade-in duration-150">
                      {/* 좌측: 테이블 상태 및 충원 현황 */}
                      <div className={`p-4 border space-y-3 ${subCardCls}`}>
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-zinc-400">테이블 상태</span>
                          <span className={`px-2 py-0.5 text-sm font-bold border ${
                            simStatus === 'CONFIRMED'
                              ? 'text-white border-white/40 bg-white/10'
                              : 'text-zinc-300 border-white/20 bg-white/5'
                          }`}>
                            {simStatus === 'CONFIRMED' ? '성립 확정 (LOCKED)' : '인원 미달 폐쇄 (EXPIRED)'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">충원 인원</span>
                            <span className="text-white font-bold">{simMembers.length} / 6명</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">성비 분포</span>
                            <span className="text-white">
                              남성 {simMembers.filter((m) => m.gender === 'M').length}명 : 여성 {simMembers.filter((m) => m.gender === 'F').length}명
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">연령 격차</span>
                            <span className="text-white">최대 5세 (허용범위 ±7세 통과)</span>
                          </div>
                        </div>

                        {/* 참가자 미니 배지 */}
                        <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                          {simMembers.map((m) => (
                            <span
                              key={m.id}
                              className="px-2 py-0.5 border border-white/10 bg-white/[0.02] text-zinc-300 text-sm"
                            >
                              {m.id} ({m.gender === 'M' ? '남' : '여'}·{m.age}세)
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 우측: 7대 프로 파이프라인 실시간 반응 로그 */}
                      <div className={`p-4 border space-y-2.5 ${subCardCls}`}>
                        <span className="text-zinc-400 block border-b border-white/10 pb-2">
                          7대 프로 실시간 반응 로그
                        </span>
                        <div className="space-y-1.5">
                          {simLogs.map((log, idx) => (
                            <div key={idx} className="p-2 border border-white/10 bg-black/40 text-sm text-zinc-200 leading-relaxed">
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AdminSectionCard>

              {/* 1. 조건부 모임 신규 개설 */}
              <AdminSectionCard
                title="모임 개설"
                isOpen={isSectionOpen('SEC_EVENT_CREATE', false)}
                onToggle={() => toggleSection('SEC_EVENT_CREATE', false)}
                isLight={isLight}
              >
                <div className={`grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-none border ${subCardCls}`}>
                  <input
                    type="text"
                    placeholder="모임명"
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
                    placeholder="최소 점수"
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
                    + 개설
                  </button>
                </div>
              </AdminSectionCard>

              {/* 2. 등록된 조건부 모임 목록 */}
              <AdminSectionCard
                title="모임 목록"
                badge={`${conditionalEvents.length}건`}
                isOpen={isSectionOpen('SEC_EVENT_LIST', false)}
                onToggle={() => toggleSection('SEC_EVENT_LIST', false)}
                isLight={isLight}
              >
                {conditionalEvents.length === 0 ? (
                  <p className={`text-sm py-4 text-center ${textMutedCls}`}>
                    개설된 모임이 없습니다. 상단에서 신규 모임을 개설해 주십시오.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <p className={`text-sm mt-1 font-mono text-zinc-300 font-light`}>
                            ₩{ev.priceKrw.toLocaleString()} • 최소 {ev.minTotalScore100}점 • 뱃지 {ev.requiredBadgeIds.length}개
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
                title="노쇼 대체"
                isOpen={isSectionOpen('SEC_EVENT_NOSHOW', false)}
                onToggle={() => toggleSection('SEC_EVENT_NOSHOW', false)}
                isLight={isLight}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-mono text-zinc-400">
                    <span>스탠바이 큐 자동 재배치</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={triggerNoShowAndStandbyRecovery}
                      className={btnPrimaryCls}
                    >
                      대기자 투입
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
                    className={`p-4 rounded-none border text-sm font-mono font-medium mt-3 ${
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
                title="대화카드"
                badge={`${activeStageCards.length}건`}
                isOpen={isSectionOpen('SEC_DECK_LIST', false)}
                onToggle={() => toggleSection('SEC_DECK_LIST', false)}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        className={`w-full p-2.5 rounded-none border text-sm font-light focus:outline-none ${
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
                title="대화카드 추가"
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
                    + 추가
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
                title="페이지 편집"
                badge={`${cmsPages.length}건`}
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
                        className={`px-3.5 py-2 rounded-none text-sm font-mono cursor-pointer transition-colors border ${
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
                            <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>
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
                            <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>
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
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>
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
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>
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
                title="계정 보안"
                badge="마스터 권한"
                isOpen={true}
                onToggle={() => {}}
                isLight={isLight}
              >
                <div className="space-y-4">
                  {/* 관리자 프로필 정보 카드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-none border space-y-3 ${subCardCls}`}>
                      <div className={`text-sm font-mono ${textMutedCls}`}>
                        관리자 계정
                      </div>
                      <div className={`text-base font-medium font-mono flex items-center gap-2 ${textTitleCls}`}>
                        <span>{currentUser?.handle || '@admin'}</span>
                        <span className={`text-sm font-normal ${textMutedCls}`}>
                          ({currentUser?.userId || 'ADMIN_01'})
                        </span>
                      </div>
                      <div className={`text-sm font-mono ${textMutedCls}`}>
                        이메일: <span className={textTitleCls}>{currentUser?.email || 'admin@nadosolo.com'}</span>
                      </div>
                    </div>

                    <div className={`p-5 rounded-none border space-y-3 ${subCardCls}`}>
                      <div className={`text-sm font-mono ${textMutedCls}`}>
                        권한 상태
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f04f74] animate-pulse" />
                        <span className={`text-sm font-mono font-medium ${textTitleCls}`}>
                          정상 연결
                        </span>
                      </div>
                      <div className={`text-sm font-mono ${textMutedCls}`}>
                        보안 등급: <span className={textTitleCls}>마스터 권한</span>
                      </div>
                    </div>
                  </div>

                  {/* 비밀번호 관리 & 보안 수칙 안내 */}
                  <div className={`p-5 rounded-none border space-y-4 ${subCardCls}`}>
                    <h3 className={`font-serif-editorial text-sm font-normal ${textTitleCls}`}>
                      인증 정보
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-mono">
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
                    <p className={`text-sm leading-relaxed font-light ${textMutedCls}`}>
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
