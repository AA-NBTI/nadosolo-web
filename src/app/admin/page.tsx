'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
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
import AdminGovernanceManager from '@/components/admin/AdminGovernanceManager';
import AdminAdaptiveMatchingManager from '@/components/admin/AdminAdaptiveMatchingManager';
import AdminPreMatchPage from './pre-match/page';
import { SAMPLE_STALLED_USER_CASES } from '@/engine/processGateEngine';
import { nadoSoloSupabaseService, DbProfile } from '@/lib/supabase/service';
import { buildMeetupSeoSlug } from '@/lib/seoSlug';
import {
  EXECUTIVE_GOVERNANCE_TEAM,
  GovernanceRole,
} from '@/engine/architectureAuditRegistry';
import {
  computeUserAxisProfile,
  matchDynamicTables,
  AdaptiveAnswer,
  DEFAULT_AB_EXPERIMENTS,
  AbExperimentSpec,
} from '@/engine/dynamicMatchingEngine';

type AdminTabKey =
  | 'GOVERNANCE'
  | 'TESTER_USER'
  | 'PROCESS'
  | 'AUDIT'
  | 'EVENT_CREATE'
  | 'EVENT_LIST'
  | 'PRE_MATCH'
  | 'EVENT_GATE'
  | 'MEMBER_EVAL'
  | 'MEMBER_MGMT'
  | 'MEMBER_DOSSIER'
  | 'PROCESS_TEST_REPORT'
  | 'SINGLE_AUDIT_REPORT'
  | 'PIPELINE_ENGINE'
  | 'ADAPTIVE_QA'
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

const normalizeCityName = (city?: string): string => {
  if (!city) return '미지정';
  const trimmed = city.trim();
  if (!trimmed) return '미지정';
  return trimmed
    .replace(/(특별시|광역시|특별자치시|특별자치도)$/g, '')
    .replace(/^(부산|서울|대구|인천|광주|대전|울산)시$/g, '$1') || trimmed;
};

const getMemberTotalScore = (p: DbProfile): number => {
  const scores = p.self_domain_scores;
  if (!scores) return 0;
  const domainKeys = ['APPEARANCE', 'STYLE', 'VOICE', 'TALK', 'MANNER'];
  const vals = domainKeys
    .map((k) => scores[k])
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

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
    groupTitle: '모임',
    items: [
      { key: 'EVENT_CREATE', label: '개설' },
      { key: 'EVENT_LIST', label: '목록' },
      { key: 'PRE_MATCH', label: '가매칭' },
      { key: 'EVENT_GATE', label: '관제' },
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
    groupTitle: '시스템',
    items: [
      { key: 'EVAL_ENGINE', label: '엔진' },
      { key: 'PIPELINE_ENGINE', label: '매칭' },
      { key: 'ADAPTIVE_QA', label: '적응매칭' },
      { key: 'PROCESS_TEST_REPORT', label: '점검' },
      { key: 'SINGLE_AUDIT_REPORT', label: '테스트' },
      { key: 'PROCESS', label: '프로세스' },
      { key: 'AUDIT', label: '품질감사' },
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
  {
    groupTitle: '조직',
    items: [
      { key: 'GOVERNANCE', label: '사단' },
      { key: 'TESTER_USER', label: '가상' },
    ],
  },
  {
    groupTitle: '보고서',
    items: [
      { key: 'REPORT_PLAN', label: '계획' },
      { key: 'REPORT_CHECKLIST', label: '항목' },
      { key: 'REPORT_APPROVAL', label: '승인' },
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
    updateConditionalEvent,
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

  const [abExperiments, setAbExperiments] = useState<AbExperimentSpec[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nadosolo_ab_experiments_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_AB_EXPERIMENTS;
  });

  const handleUpdateAbMode = (
    experimentId: string,
    mode: 'A_ONLY' | 'AB_SPLIT' | 'B_ONLY'
  ) => {
    setAbExperiments((prev) => {
      const next = prev.map((e) =>
        e.experimentId === experimentId ? { ...e, activeMode: mode } : e
      );
      try {
        localStorage.setItem('nadosolo_ab_experiments_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
    notify(`A/B 실험 모드 변경: ${mode}`);
  };

  // 신규 접속 기본값: 선택된 탭 없음 → 우측에 전체 카테고리 목록이 먼저 노출
  const [activeTab, setActiveTab] = useState<AdminTabKey | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedStalledUserId, setSelectedStalledUserId] = useState<string | null>(null);
  const [notifiedUserIds, setNotifiedUserIds] = useState<string[]>([]);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // [바프로 주관] Supabase 실서버 라이브 DB 회원 실시간 직결 상태 (SSOT)
  const [liveDbProfiles, setLiveDbProfiles] = useState<DbProfile[]>([]);
  const [liveEventApplications, setLiveEventApplications] = useState<
    Array<{ user_id: string; event_id: string; status: string; applied_at: string }>
  >([]);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  const fetchLiveDbProfiles = useCallback(async () => {
    setIsDbLoading(true);
    try {
      const [data, apps] = await Promise.all([
        nadoSoloSupabaseService.getAllProfiles(),
        nadoSoloSupabaseService.getAllEventApplications(),
      ]);
      setLiveDbProfiles(data);
      setLiveEventApplications(apps);

      // DB 영속화된 가매칭/확정 상태 복원
      const nextPreMatched: Record<string, string> = {};
      const nextConfirmed: Record<string, string> = {};
      for (const p of data) {
        if (p.matching_stage === 'CONFIRMED') {
          nextConfirmed[p.id] = p.confirmed_event_id || 'DB_CONFIRMED';
        } else if (p.matching_stage === 'PRE_MATCHED') {
          nextPreMatched[p.id] = p.pre_matched_pool_id || 'DB_PRE_MATCHED';
        }
      }
      for (const a of apps) {
        if (a.status === 'CONFIRMED') {
          nextConfirmed[a.user_id] = a.event_id;
        }
      }
      setPreMatchedMemberIds(nextPreMatched);
      setConfirmedMemberIds(nextConfirmed);

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

  // [바프로 자동 개설 엔진] 동일 조건(지역×목적) 3명 이상 충족 시 모임방 자동 개설
  const autoOpenedPoolKeysRef = useRef<Set<string>>(new Set());
  const createAutoMeetupEvent = useCallback(
    (
      city: string,
      district: string,
      dong: string,
      purpose: 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE',
      members: DbProfile[],
      status: 'RECRUITING' | 'CONFIRMED' = 'RECRUITING'
    ) => {
      const PURPOSE_NAMES: Record<string, string> = {
        FRIEND: '친구·교류',
        RESET: '지적 환기',
        TASTE: '취향·활동',
        ROMANCE: '인연·동반자',
      };
      const avgBirth =
        members.length > 0
          ? Math.round(members.reduce((s, m) => s + (m.birth_year || 1985), 0) / members.length)
          : 1985;
      const is5060 = avgBirth <= 1980;
      const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayStr = `(${dayNames[targetDate.getDay()]})`;

      const newEv = {
        eventId: buildMeetupSeoSlug(city, district, purpose),
        title: `[${city} ${district}] ${PURPOSE_NAMES[purpose] || purpose} 프라이빗 다이닝`,
        districtId: `DIST_AUTO_${city}`,
        regionName: city,
        districtName: district || '주요 상권',
        dongName: dong || undefined,
        venueId: 'DIRECT',
        dateText: `${dateStr} ${dayStr} 19:30`,
        eventDate: dateStr,
        eventTime: '19:30',
        deadlineAt: `${dateStr}T18:00`,
        mode: purpose === 'ROMANCE' ? ('ROMANCE' as const) : ('THEME' as const),
        purpose,
        compositionMode: purpose === 'ROMANCE' ? ('ROMANCE' as const) : ('THEME' as const),
        enforceGenderRatio: purpose === 'ROMANCE',
        evaluationModuleId: is5060 ? 'MOD_TRACK_5060' : 'MOD_TRACK_3040',
        targetAgeGroup: is5060 ? '5060 골든' : '3040 프로',
        priceKrw: 30000,
        maxCapacity: 6,
        minConfirmCount: 3,
        reason: `동일 조건(${city} · ${PURPOSE_NAMES[purpose] || purpose}) ${members.length}명 충족으로 자동 개설된 프라이빗 테이블`,
        description: `실서버 회원 조건 매칭(${city} ${district}${dong ? ` ${dong}` : ''} · ${PURPOSE_NAMES[purpose] || purpose})으로 자동 개설된 모임입니다.`,
        heroImage: '',
        venueAddress: '확정자 D-1 상세 주소 비공개 안내',
        isVenueSecretUntilConfirm: true,
        expectedMealCost: '인당 4~5만 원대 (현장 1/N 실비 정산)',
        refundPolicy: '모임 24시간 전까지 100% 환불',
        deadlineText: `${dateStr} 18:00 마감`,
        status,
        mealNote: '참가비 ₩30,000 (다면 관찰 엔진 라이선스 및 리포트 포함 / 식음료 매장 현장 1/N)',
        requiredBadgeIds: [],
        minTotalScore100: 75,
        activePresetSubIds: ['SUB_APP_1', 'SUB_STY_2', 'SUB_CON_2'],
      };
      addConditionalEvent(newEv);
      return newEv;
    },
    [addConditionalEvent]
  );

  useEffect(() => {
    if (liveDbProfiles.length === 0) return;
    const eligible = liveDbProfiles.filter((p) => {
      const hasZone = Boolean(p.residence_city?.trim() && p.residence_district?.trim());
      const hasPhone = Boolean(p.phone && p.phone.trim() !== '' && p.phone !== '010-0000-0000');
      const hasPurpose = Boolean(p.preferred_purpose);
      return hasZone && hasPhone && hasPurpose;
    });
    const groups = new Map<string, DbProfile[]>();
    for (const prof of eligible) {
      const city = prof.residence_city || '미지정';
      const purpose = prof.preferred_purpose || 'RESET';
      const key = `${city}|${purpose}`;
      const arr = groups.get(key) || [];
      arr.push(prof);
      groups.set(key, arr);
    }
    groups.forEach((members, key) => {
      if (members.length < 3) return;
      if (autoOpenedPoolKeysRef.current.has(key)) return;
      const [city, purposeRaw] = key.split('|');
      const purpose = (purposeRaw || 'RESET') as 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE';
      const alreadyExists = conditionalEvents.some(
        (ev) =>
          (ev.regionName || '부산') === city &&
          (ev.purpose || 'RESET') === purpose &&
          ev.status !== 'COMPLETED' &&
          ev.status !== 'CANCELLED_MIN'
      );
      autoOpenedPoolKeysRef.current.add(key);
      if (!alreadyExists) {
        const first = members[0];
        const allConfirmed = members.every((m) => m.matching_stage === 'CONFIRMED');
        const created = createAutoMeetupEvent(
          city,
          first.residence_district || '주요 상권',
          first.residence_dong || '',
          purpose,
          members,
          allConfirmed ? 'CONFIRMED' : 'RECRUITING'
        );
        setAdminToast(`조건 충족(${members.length}명) 모임 자동 개설: ${created.title}`);
      }
    });
  }, [liveDbProfiles, conditionalEvents, createAutoMeetupEvent]);

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
  // [관리자 메인화면] 가로 탭 구성 (요약 / 회원·퍼널 / 지역·방현황)
  const [overviewTab, setOverviewTab] = useState<'SUMMARY' | 'FUNNEL' | 'ROOMS'>('SUMMARY');
  // [리스트 페이지네이션] 10줄 초과 시 다음/이전 버튼 제공
  const [eventPage, setEventPage] = useState<number>(1);
  const LIST_PAGE_SIZE = 10;

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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [expandedEvalMemberId, setExpandedEvalMemberId] = useState<string | null>(null);
  const [evalMemberSearch, setEvalMemberSearch] = useState('');
  const [evalMemberGender, setEvalMemberGender] = useState<'ALL' | 'F' | 'M'>('ALL');
  const [evalMemberPage, setEvalMemberPage] = useState<number>(1);
  const EVAL_MEMBERS_PER_PAGE = 10;

  // [회원관리] 검색, 성별, 권역 필터 및 10명 단위 페이징
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberGenderFilter, setMemberGenderFilter] = useState<'ALL' | 'F' | 'M'>('ALL');
  const [memberStageFilter, setMemberStageFilter] = useState<
    'ALL' | 'UNQUALIFIED' | 'READY' | 'APPLIED' | 'PRE_MATCHED' | 'CONFIRMED'
  >('ALL');
  const [memberPurposeFilter, setMemberPurposeFilter] = useState<
    'ALL' | 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE'
  >('ALL');
  const [memberRegionFilter, setMemberRegionFilter] = useState<string>('ALL');
  const [memberDistrictFilter, setMemberDistrictFilter] = useState<string>('ALL');
  const [memberAgeFilter, setMemberAgeFilter] = useState<'ALL' | '2030' | '3040' | '4050' | '5060'>('ALL');
  const [memberDiagFilter, setMemberDiagFilter] = useState<'ALL' | 'DONE' | 'NONE'>('ALL');
  const [memberMissingFilter, setMemberMissingFilter] = useState<'ALL' | 'NO_ZONE' | 'NO_PHONE' | 'NO_PURPOSE'>('ALL');
  const [memberSortBy, setMemberSortBy] = useState<'RECENT' | 'STAGE' | 'AGE' | 'SCORE' | 'NAME' | 'REGION' | 'GENDER' | 'PURPOSE'>('RECENT');
  const [memberSortDir, setMemberSortDir] = useState<'asc' | 'desc'>('desc');
  const handleSortColumn = useCallback((col: 'RECENT' | 'STAGE' | 'AGE' | 'SCORE' | 'NAME' | 'REGION' | 'GENDER' | 'PURPOSE') => {
    setMemberSortBy((prev) => {
      if (prev === col) {
        setMemberSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setMemberSortDir(col === 'SCORE' || col === 'RECENT' ? 'desc' : 'asc');
      return col;
    });
    setMemberPage(1);
  }, []);

  // [모임 관제] 가매칭(Soft-Lock) & 확정 알림(Locked) & 재최적화 결과 상태
  const [preMatchedMemberIds, setPreMatchedMemberIds] = useState<Record<string, string>>({});
  const [confirmedMemberIds, setConfirmedMemberIds] = useState<Record<string, string>>({});
  const [notifiedEventIds, setNotifiedEventIds] = useState<string[]>([]);
  const [reoptResult, setReoptResult] = useState<{
    ranAt: string;
    beforeAvg: number;
    afterAvg: number;
    tables: {
      tableTitle: string;
      region: string;
      purpose: string;
      memberNames: string[];
      harmonyScore: number;
      overflowCount: number;
      recommendation: string;
    }[];
  } | null>(null);
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

  // [모임] 관리자 등록형 모임 유형 · 대상 연령 목록 (LocalStorage 영구 보존)
  const [customMeetupModes, setCustomMeetupModes] = useState<string[]>([
    '3:3 소셜 다이닝',
    '취향 살롱',
    '와인 다이닝',
    '1:1 프라이빗',
  ]);
  const [newModeInput, setNewModeInput] = useState('');
  const [customAgeGroups, setCustomAgeGroups] = useState<string[]>([
    '5060 골든',
    '3040 프라임',
    '4050 미들',
    '전 세대',
  ]);
  const [newAgeInput, setNewAgeInput] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedModes = localStorage.getItem('nadosolo_meetup_modes');
      if (savedModes) {
        const parsed = JSON.parse(savedModes);
        if (Array.isArray(parsed) && parsed.length > 0) setCustomMeetupModes(parsed);
      }
      const savedAges = localStorage.getItem('nadosolo_meetup_ages');
      if (savedAges) {
        const parsed = JSON.parse(savedAges);
        if (Array.isArray(parsed) && parsed.length > 0) setCustomAgeGroups(parsed);
      }
    } catch {}
  }, []);

  const addCustomMode = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || customMeetupModes.includes(trimmed)) return;
    const next = [...customMeetupModes, trimmed];
    setCustomMeetupModes(next);
    setNewEventMode(trimmed);
    setNewModeInput('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('nadosolo_meetup_modes', JSON.stringify(next));
    }
  };

  const removeCustomMode = (val: string) => {
    if (customMeetupModes.length <= 1) return;
    const next = customMeetupModes.filter((m) => m !== val);
    setCustomMeetupModes(next);
    if (newEventMode === val) setNewEventMode(next[0]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nadosolo_meetup_modes', JSON.stringify(next));
    }
  };

  const addCustomAgeGroup = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || customAgeGroups.includes(trimmed)) return;
    const next = [...customAgeGroups, trimmed];
    setCustomAgeGroups(next);
    setNewEventAgeGroup(trimmed);
    setNewAgeInput('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('nadosolo_meetup_ages', JSON.stringify(next));
    }
  };

  const removeCustomAgeGroup = (val: string) => {
    if (customAgeGroups.length <= 1) return;
    const next = customAgeGroups.filter((a) => a !== val);
    setCustomAgeGroups(next);
    if (newEventAgeGroup === val) setNewEventAgeGroup(next[0]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nadosolo_meetup_ages', JSON.stringify(next));
    }
  };

  // [모임] 전국구 자유 개설/수정 폼 (달력·시간·2글자 전국 시/도·식당 직접등록·지도링크)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventRegionName, setNewEventRegionName] = useState('부산');
  const [newEventDistrictName, setNewEventDistrictName] = useState('해운대구 · 마린시티');
  const [newEventDate, setNewEventDate] = useState('2026-11-20');
  const [newEventTime, setNewEventTime] = useState('19:30');
  const [newEventDeadlineAt, setNewEventDeadlineAt] = useState('2026-11-19T18:00');
  const [newEventMode, setNewEventMode] = useState<string>('3:3 소셜 다이닝');
  const [newEventPurpose, setNewEventPurpose] = useState<'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE'>('RESET');
  const [newEventDongName, setNewEventDongName] = useState('');
  const [newEventEnforceGenderRatio, setNewEventEnforceGenderRatio] = useState(true);
  const [newEventEvalModuleId, setNewEventEvalModuleId] = useState('MOD_TRACK_5060');
  const [newEventAgeGroup, setNewEventAgeGroup] = useState<string>('5060 골든');
  const [showEventAdvanced, setShowEventAdvanced] = useState(false);
  const [showOptionManagers, setShowOptionManagers] = useState(false);
  const [newEventPrice, setNewEventPrice] = useState(30000);
  const [newEventMinScore, setNewEventMinScore] = useState(0);
  const [newEventDistrictId, setNewEventDistrictId] = useState('DIST_JEONPO');
  const [newEventVenueId, setNewEventVenueId] = useState('DIRECT');
  const [newEventVenueName, setNewEventVenueName] = useState('');
  const [newEventVenueAddress, setNewEventVenueAddress] = useState('');
  const [newEventVenueMapUrl, setNewEventVenueMapUrl] = useState('');
  const [newEventVenueSecret, setNewEventVenueSecret] = useState(true);
  const [newEventMaxCapacity, setNewEventMaxCapacity] = useState(6);
  const [newEventMinConfirm, setNewEventMinConfirm] = useState(4);
  const [newEventReason, setNewEventReason] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventHeroImage, setNewEventHeroImage] = useState(
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80'
  );
  const [newEventExpectedMealCost, setNewEventExpectedMealCost] = useState('인당 4~5만 원대 (현장 1/N 실비 정산)');
  const [newEventRefundPolicy, setNewEventRefundPolicy] = useState(
    '3일 전 100% 환불 / 2일 전 50% 환불 / 1일 전·당일 환불 불가 (인원 미달 시 100% 환불)'
  );

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

  const getMemberStage = useCallback(
    (p: DbProfile): 'UNQUALIFIED' | 'READY' | 'APPLIED' | 'PRE_MATCHED' | 'CONFIRMED' => {
      if (
        confirmedMemberIds[p.id] ||
        p.matching_stage === 'CONFIRMED' ||
        liveEventApplications.some((a) => a.user_id === p.id && a.status === 'CONFIRMED')
      ) {
        return 'CONFIRMED';
      }
      if (preMatchedMemberIds[p.id] || p.matching_stage === 'PRE_MATCHED') {
        return 'PRE_MATCHED';
      }
      const hasZone = Boolean(p.residence_city?.trim() && p.residence_district?.trim());
      const hasPhone = Boolean(p.phone && p.phone.trim() !== '' && p.phone !== '010-0000-0000');
      const hasPurpose = Boolean(p.preferred_purpose);
      if (!hasZone || !hasPhone || !hasPurpose) return 'UNQUALIFIED';
      const answers = p.survey_answers as Record<string, unknown> | undefined;
      if (
        liveEventApplications.some((a) => a.user_id === p.id && a.status === 'APPLIED') ||
        answers?.paymentStatus === 'PAID' ||
        Boolean(answers?.appliedEventId)
      ) {
        return 'APPLIED';
      }
      return 'READY';
    },
    [confirmedMemberIds, preMatchedMemberIds, liveEventApplications]
  );

  const memberStageCounts = useMemo(() => {
    const counts = {
      ALL: liveDbProfiles.length,
      UNQUALIFIED: 0,
      READY: 0,
      APPLIED: 0,
      PRE_MATCHED: 0,
      CONFIRMED: 0,
    };
    for (const p of liveDbProfiles) {
      counts[getMemberStage(p)] += 1;
    }
    return counts;
  }, [liveDbProfiles, getMemberStage]);

  // [회원관리] 다차원 동적 필터링 및 정렬 연산
  const filteredLiveMembers = useMemo(() => {
    const STAGE_ORDER: Record<string, number> = {
      CONFIRMED: 0,
      PRE_MATCHED: 1,
      APPLIED: 2,
      READY: 3,
      UNQUALIFIED: 4,
    };
    const currentYear = 2026;
    const filtered = liveDbProfiles.filter((p) => {
      const q = memberSearchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.nickname.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q));
      const matchGender =
        memberGenderFilter === 'ALL' || p.gender === memberGenderFilter;
      const matchStage =
        memberStageFilter === 'ALL' || getMemberStage(p) === memberStageFilter;
      const matchPurpose =
        memberPurposeFilter === 'ALL' || (p.preferred_purpose || 'RESET') === memberPurposeFilter;
      const matchRegion =
        memberRegionFilter === 'ALL' || normalizeCityName(p.residence_city) === memberRegionFilter;
      const matchDistrict =
        memberDistrictFilter === 'ALL' || (p.residence_district || '미지정') === memberDistrictFilter;

      const age = currentYear - (p.birth_year || 1990);
      const matchAge =
        memberAgeFilter === 'ALL' ||
        (memberAgeFilter === '2030' && age >= 20 && age < 30) ||
        (memberAgeFilter === '3040' && age >= 30 && age < 40) ||
        (memberAgeFilter === '4050' && age >= 40 && age < 50) ||
        (memberAgeFilter === '5060' && age >= 50);

      const hasDiag = Boolean(p.self_domain_scores && Object.keys(p.self_domain_scores).some((k) => !k.startsWith('_')));
      const matchDiag =
        memberDiagFilter === 'ALL' ||
        (memberDiagFilter === 'DONE' && hasDiag) ||
        (memberDiagFilter === 'NONE' && !hasDiag);

      const hasZone = Boolean(p.residence_city?.trim() && p.residence_district?.trim());
      const hasPhone = Boolean(p.phone && p.phone.trim() !== '' && p.phone !== '010-0000-0000');
      const hasPurpose = Boolean(p.preferred_purpose);
      const matchMissing =
        memberMissingFilter === 'ALL' ||
        (memberMissingFilter === 'NO_ZONE' && !hasZone) ||
        (memberMissingFilter === 'NO_PHONE' && !hasPhone) ||
        (memberMissingFilter === 'NO_PURPOSE' && !hasPurpose);

      return (
        matchQuery &&
        matchGender &&
        matchStage &&
        matchPurpose &&
        matchRegion &&
        matchDistrict &&
        matchAge &&
        matchDiag &&
        matchMissing
      );
    });

    return [...filtered].sort((a, b) => {
      const dir = memberSortDir === 'asc' ? 1 : -1;
      if (memberSortBy === 'STAGE') {
        return ((STAGE_ORDER[getMemberStage(a)] ?? 9) - (STAGE_ORDER[getMemberStage(b)] ?? 9)) * dir;
      }
      if (memberSortBy === 'AGE') {
        return ((a.birth_year || 1990) - (b.birth_year || 1990)) * dir;
      }
      if (memberSortBy === 'SCORE') {
        return (getMemberTotalScore(a) - getMemberTotalScore(b)) * dir;
      }
      if (memberSortBy === 'NAME') {
        return (a.nickname || '').localeCompare(b.nickname || '', 'ko') * dir;
      }
      if (memberSortBy === 'REGION') {
        return normalizeCityName(a.residence_city).localeCompare(normalizeCityName(b.residence_city), 'ko') * dir;
      }
      if (memberSortBy === 'GENDER') {
        return (a.gender || '').localeCompare(b.gender || '') * dir;
      }
      if (memberSortBy === 'PURPOSE') {
        return (a.preferred_purpose || 'RESET').localeCompare(b.preferred_purpose || 'RESET') * dir;
      }
      return (a.created_at || '').localeCompare(b.created_at || '') * dir;
    });
  }, [
    liveDbProfiles,
    memberSearchQuery,
    memberGenderFilter,
    memberStageFilter,
    memberPurposeFilter,
    memberRegionFilter,
    memberDistrictFilter,
    memberAgeFilter,
    memberDiagFilter,
    memberMissingFilter,
    memberSortBy,
    memberSortDir,
    getMemberStage,
  ]);

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
              className={`pb-3 border-b space-y-2.5 ${
                isLight ? 'border-zinc-200' : 'border-white/[0.08]'
              }`}
            >
              {/* 1행: 방패 관리자 영역 (상단/하단 폭 일치, 클릭 시 메인화면 복귀) */}
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="w-full text-left p-2 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer group"
                title="관리자 메인화면으로 이동"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 select-none min-w-0">
                    <div className="w-8 h-8 border border-[#3b82f6]/50 bg-[#3b82f6]/15 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="leading-tight min-w-0">
                      <span className="text-base font-serif-editorial text-white font-normal block group-hover:text-blue-300 transition-colors">
                        관리자
                      </span>
                      <span className="text-sm font-mono text-zinc-400 truncate block">
                        {currentUser?.handle || '@admin'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 border border-[#3b82f6]/50 bg-[#3b82f6]/15 text-sm font-mono font-bold text-white shrink-0">
                    v2.4.0
                  </span>
                </div>
              </button>

              {/* 2행: 단일 메뉴 펼침/닫힘 토글 버튼 (상단 박스와 동일한 좌우 폭) */}
              <button
                type="button"
                onClick={() => {
                  if (openGroupTitles.length === ADMIN_CATEGORY_GROUPS.length) {
                    collapseAllGroups();
                  } else {
                    expandAllGroups();
                  }
                }}
                className={`w-full px-2.5 py-1.5 border text-sm font-mono flex items-center justify-between cursor-pointer transition-colors ${
                  isLight
                    ? 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <span>메뉴</span>
                <span className="text-blue-300 font-bold">
                  {openGroupTitles.length === ADMIN_CATEGORY_GROUPS.length ? '전체 닫힘 ▴' : '전체 펼침 ▾'}
                </span>
              </button>
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
              <div className="space-y-4">
                {/* 1. 실시간 회원·방 개설 분석 현황 다이어그램 (2열 컴팩트 그리드) */}
                {(() => {
                  const totalMembers = Math.max(1, liveDbProfiles.length);
                  const PURPOSE_META = [
                    { key: 'FRIEND' as const, label: 'FRIEND · 친구·교류' },
                    { key: 'RESET' as const, label: 'RESET · 지적 환기' },
                    { key: 'TASTE' as const, label: 'TASTE · 취향·활동' },
                    { key: 'ROMANCE' as const, label: 'ROMANCE · 인연·동반자' },
                  ];
                  const STAGE_META = [
                    { key: 'UNQUALIFIED' as const, label: '조건미입력', count: memberStageCounts.UNQUALIFIED },
                    { key: 'READY' as const, label: '조건완료', count: memberStageCounts.READY },
                    { key: 'APPLIED' as const, label: '결제·신청', count: memberStageCounts.APPLIED },
                    { key: 'PRE_MATCHED' as const, label: '가매칭', count: memberStageCounts.PRE_MATCHED },
                    { key: 'CONFIRMED' as const, label: '확정', count: memberStageCounts.CONFIRMED },
                  ];
                  const regionMap = new Map<string, { city: string; total: number; readyOrMore: number }>();
                  for (const p of liveDbProfiles) {
                    const city = normalizeCityName(p.residence_city);
                    const cur = regionMap.get(city) || { city, total: 0, readyOrMore: 0 };
                    cur.total += 1;
                    if (getMemberStage(p) !== 'UNQUALIFIED') cur.readyOrMore += 1;
                    regionMap.set(city, cur);
                  }
                  const regionList = Array.from(regionMap.values()).sort((a, b) => b.total - a.total);
                  const activeEvents = conditionalEvents.filter(
                    (ev) => ev.status !== 'COMPLETED' && ev.status !== 'CANCELLED_MIN'
                  );
                  const confirmedEvents = activeEvents.filter((ev) => ev.status === 'CONFIRMED');
                  const adaptiveParticipants = liveDbProfiles
                    .filter((p) => p.id !== 'ADMIN_01' && p.handle !== '@admin')
                    .map((p) => {
                      const rawSurvey = p.survey_answers ?? {};
                      const answers: AdaptiveAnswer[] = Object.entries(rawSurvey).map(
                        ([qId, val]) => ({ questionId: qId, version: 1, value: val })
                      );
                      return computeUserAxisProfile(
                        {
                          userId: `${p.nickname || p.handle} (${p.id})`,
                          gender: p.gender === 'M' ? 'M' : 'F',
                          birthYear: p.birth_year || 1994,
                          cityCode: p.residence_city || 'SEOUL',
                          dietary: p.dietary || 'NONE',
                          purpose: p.preferred_purpose,
                        },
                        answers
                      );
                    });
                  const adaptiveGrouping = matchDynamicTables(adaptiveParticipants);

                  const readyTotal = memberStageCounts.READY + memberStageCounts.APPLIED + memberStageCounts.PRE_MATCHED + memberStageCounts.CONFIRMED;
                  const femaleTotal = liveDbProfiles.filter((p) => p.gender === 'F').length;
                  const maleTotal = liveDbProfiles.filter((p) => p.gender === 'M').length;

                  return (
                    <div className="space-y-3">
                      {/* 가로 탭 전환 바 */}
                      <div className="p-2.5 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(
                            [
                              { key: 'SUMMARY', label: '전체요약' },
                              { key: 'FUNNEL', label: '회원·퍼널' },
                              { key: 'ROOMS', label: '지역·방현황' },
                            ] as const
                          ).map((t) => {
                            const active = overviewTab === t.key;
                            return (
                              <button
                                key={t.key}
                                type="button"
                                onClick={() => setOverviewTab(t.key)}
                                className={`px-3.5 py-1.5 text-sm font-mono border cursor-pointer transition-colors ${
                                  active
                                    ? 'border-[#3b82f6]/60 bg-[#3b82f6]/20 text-white font-bold'
                                    : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-mono text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                          <span>실서버 SSOT</span>
                          <span className="text-zinc-600">|</span>
                          <span>여 {femaleTotal} · 남 {maleTotal}</span>
                        </div>
                      </div>

                      {/* 탭 1: 전체요약 (4열 핵심 지표 + 적응매칭/회원 바로가기) */}
                      {overviewTab === 'SUMMARY' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono">
                            <button
                              type="button"
                              onClick={() => handleSelectTab('MEMBER_MGMT')}
                              className="p-4 border border-white/10 bg-[#0c0d12] hover:border-[#3b82f6]/50 text-left space-y-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-sm text-zinc-400">
                                <span>총 실회원</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                              </div>
                              <div className="text-2xl font-bold text-white">{liveDbProfiles.length}명</div>
                              <div className="text-sm text-blue-300">여 {femaleTotal} · 남 {maleTotal}</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMemberStageFilter('READY');
                                setMemberPage(1);
                                handleSelectTab('MEMBER_MGMT');
                              }}
                              className="p-4 border border-white/10 bg-[#0c0d12] hover:border-[#3b82f6]/50 text-left space-y-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-sm text-zinc-400">
                                <span>매칭 가능</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                              </div>
                              <div className="text-2xl font-bold text-white">{readyTotal}명</div>
                              <div className="text-sm text-zinc-300">조건 충족 이상</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectTab('EVENT_LIST')}
                              className="p-4 border border-white/10 bg-[#0c0d12] hover:border-[#f04f74]/50 text-left space-y-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-sm text-zinc-400">
                                <span>개설 모임방</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                              </div>
                              <div className="text-2xl font-bold text-white">{activeEvents.length}방</div>
                              <div className="text-sm text-zinc-300">확정 {confirmedEvents.length}방</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectTab('PRE_MATCH')}
                              className="p-4 border border-white/10 bg-[#0c0d12] hover:border-[#f04f74]/50 text-left space-y-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-sm text-zinc-400">
                                <span>가매칭 방</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                              </div>
                              <div className="text-2xl font-bold text-white">{adaptiveGrouping.rooms.length}방</div>
                              <div className="text-sm text-zinc-300">대기 {adaptiveGrouping.unassigned.length}명</div>
                            </button>
                          </div>

                          {/* 연령대별 분포 (클릭 시 해당 연령대 회원 목록 즉시 이동) */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                            {(
                              [
                                { key: '2030' as const, label: '20대', check: (y: number) => 2026 - y >= 20 && 2026 - y < 30 },
                                { key: '3040' as const, label: '30대', check: (y: number) => 2026 - y >= 30 && 2026 - y < 40 },
                                { key: '4050' as const, label: '40대', check: (y: number) => 2026 - y >= 40 && 2026 - y < 50 },
                                { key: '5060' as const, label: '50대+', check: (y: number) => 2026 - y >= 50 },
                              ]
                            ).map((ag) => {
                              const cnt = liveDbProfiles.filter((p) => ag.check(p.birth_year || 1990)).length;
                              return (
                                <button
                                  key={ag.key}
                                  type="button"
                                  onClick={() => {
                                    setMemberAgeFilter(ag.key);
                                    setMemberPage(1);
                                    handleSelectTab('MEMBER_MGMT');
                                  }}
                                  className="px-3.5 py-2.5 border border-white/10 bg-[#0c0d12] hover:border-[#3b82f6]/50 flex items-center justify-between text-sm cursor-pointer"
                                >
                                  <span className="text-zinc-300">{ag.label}</span>
                                  <span className="text-white font-bold">{cnt}명</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-2">
                              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-sm font-mono">
                                <span className="text-white font-bold">적응매칭 실시간 편성</span>
                                <button
                                  type="button"
                                  onClick={() => handleSelectTab('ADAPTIVE_QA')}
                                  className="text-blue-300 hover:underline cursor-pointer"
                                >
                                  전체보기
                                </button>
                              </div>
                              {adaptiveGrouping.rooms.length === 0 ? (
                                <p className="text-sm font-mono text-zinc-400">편성된 방이 없습니다.</p>
                              ) : (
                                adaptiveGrouping.rooms.map((room) => (
                                  <button
                                    key={room.roomId}
                                    type="button"
                                    onClick={() => handleSelectTab('ADAPTIVE_QA')}
                                    className="w-full px-3 py-2 border border-white/10 bg-[#08090d] hover:bg-white/5 flex items-center justify-between gap-2 text-sm font-mono cursor-pointer"
                                  >
                                    <span className="text-white truncate">{room.spec.title}</span>
                                    <span className="px-2 py-0.5 border border-[#f04f74]/50 text-white shrink-0">
                                      {room.expectedScore100}점
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>

                            <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-2">
                              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-sm font-mono">
                                <span className="text-white font-bold">개설 모임방</span>
                                <button
                                  type="button"
                                  onClick={() => handleSelectTab('EVENT_LIST')}
                                  className="text-blue-300 hover:underline cursor-pointer"
                                >
                                  목록이동
                                </button>
                              </div>
                              {activeEvents.length === 0 ? (
                                <p className="text-sm font-mono text-zinc-400">현재 개설된 모임방이 없습니다.</p>
                              ) : (
                                activeEvents.slice(0, 4).map((ev) => (
                                  <button
                                    key={ev.eventId}
                                    type="button"
                                    onClick={() => handleSelectTab('EVENT_LIST')}
                                    className="w-full px-3 py-2 border border-white/10 bg-[#08090d] hover:bg-white/5 flex items-center justify-between gap-2 text-sm font-mono cursor-pointer"
                                  >
                                    <span className="text-white truncate">{ev.title}</span>
                                    <span className="px-2 py-0.5 border border-[#3b82f6]/50 text-blue-200 shrink-0">
                                      {ev.status === 'CONFIRMED' ? '확정' : '모집중'}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 탭 2: 회원·퍼널 (2열 나란히 비교) */}
                      {overviewTab === 'FUNNEL' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                                <h3 className="font-serif-editorial text-lg text-white font-normal">회원 퍼널</h3>
                              </div>
                              <span className="text-sm font-mono text-blue-300 font-bold">총 {liveDbProfiles.length}명</span>
                            </div>
                            <div className="space-y-2">
                              {STAGE_META.map((st) => {
                                const pct = Math.round((st.count / totalMembers) * 100);
                                return (
                                  <button
                                    key={st.key}
                                    type="button"
                                    onClick={() => {
                                      setMemberStageFilter(st.key);
                                      setMemberPage(1);
                                      handleSelectTab('MEMBER_MGMT');
                                    }}
                                    className="w-full text-left space-y-1 group cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between text-sm font-mono">
                                      <span className="text-zinc-200 group-hover:text-white">{st.label}</span>
                                      <span className="text-white font-bold">{st.count}명 ({pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-white/5 border border-white/10 overflow-hidden">
                                      <div
                                        className="h-full bg-[#3b82f6] group-hover:bg-blue-400 transition-all"
                                        style={{ width: `${Math.max(pct, st.count > 0 ? 4 : 0)}%` }}
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                                <h3 className="font-serif-editorial text-lg text-white font-normal">목적 · 성비</h3>
                              </div>
                              <span className="text-sm font-mono text-zinc-300">여 {femaleTotal} / 남 {maleTotal}</span>
                            </div>
                            <div className="space-y-2">
                              {PURPOSE_META.map((pm) => {
                                const matched = liveDbProfiles.filter((p) => p.preferred_purpose === pm.key);
                                const fCnt = matched.filter((p) => p.gender === 'F').length;
                                const mCnt = matched.filter((p) => p.gender === 'M').length;
                                const pct = Math.round((matched.length / totalMembers) * 100);
                                return (
                                  <button
                                    key={pm.key}
                                    type="button"
                                    onClick={() => {
                                      setMemberPurposeFilter(pm.key);
                                      setMemberPage(1);
                                      handleSelectTab('MEMBER_MGMT');
                                    }}
                                    className="w-full text-left space-y-1 group cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between text-sm font-mono">
                                      <span className="text-zinc-200 group-hover:text-white">{pm.label}</span>
                                      <span className="text-white">
                                        <strong>{matched.length}명</strong> (여{fCnt}/남{mCnt})
                                      </span>
                                    </div>
                                    <div className="h-2 bg-white/5 border border-white/10 overflow-hidden">
                                      <div
                                        className="h-full bg-[#f04f74] group-hover:opacity-90 transition-all"
                                        style={{ width: `${Math.max(pct, matched.length > 0 ? 4 : 0)}%` }}
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 탭 3: 지역·방현황 (2열 나란히 비교) */}
                      {overviewTab === 'ROOMS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                                <h3 className="font-serif-editorial text-lg text-white font-normal">지역 밀집도</h3>
                              </div>
                              <span className="text-sm font-mono text-blue-300">{regionList.length}개 권역</span>
                            </div>
                            <div className="space-y-2">
                              {regionList.map((r) => {
                                const pct6 = Math.min(100, Math.round((r.readyOrMore / 6) * 100));
                                return (
                                  <button
                                    key={r.city}
                                    type="button"
                                    onClick={() => {
                                      setMemberRegionFilter(r.city);
                                      setMemberPage(1);
                                      handleSelectTab('MEMBER_MGMT');
                                    }}
                                    className="w-full text-left space-y-1 group cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between text-sm font-mono">
                                      <span className="text-zinc-200 group-hover:text-white">{r.city}</span>
                                      <span className="text-white">
                                        충족 <strong>{r.readyOrMore}</strong>/6명 (전체 {r.total}명)
                                      </span>
                                    </div>
                                    <div className="h-2 bg-white/5 border border-white/10 overflow-hidden">
                                      <div
                                        className="h-full bg-[#3b82f6] group-hover:bg-blue-400 transition-all"
                                        style={{ width: `${Math.max(pct6, r.readyOrMore > 0 ? 6 : 0)}%` }}
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                                <h3 className="font-serif-editorial text-lg text-white font-normal">방 개설 현황</h3>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectTab('ADAPTIVE_QA')}
                                className="text-sm font-mono px-2.5 py-0.5 border border-[#3b82f6]/50 bg-[#3b82f6]/15 text-white cursor-pointer"
                              >
                                적응매칭 이동
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center font-mono">
                              <div className="p-2.5 border border-white/10 bg-[#08090d]">
                                <div className="text-sm text-zinc-400">개설 방</div>
                                <div className="text-lg font-bold text-white">{activeEvents.length}</div>
                              </div>
                              <div className="p-2.5 border border-[#3b82f6]/40 bg-[#3b82f6]/10">
                                <div className="text-sm text-blue-200">적응 편성</div>
                                <div className="text-lg font-bold text-white">{adaptiveGrouping.rooms.length}</div>
                              </div>
                              <div className="p-2.5 border border-white/10 bg-[#08090d]">
                                <div className="text-sm text-zinc-400">확정</div>
                                <div className="text-lg font-bold text-white">{confirmedEvents.length}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
              [거버넌스/사단] 회장실 직속 안프로 사단 '가·나·다·라·마·바·사' 직보 및 결함 보정 센터
              ---------------------------------------------------------- */}
          {activeTab === 'GOVERNANCE' && (
            <AdminGovernanceManager
              cardCls={cardCls}
              textTitleCls={textTitleCls}
              notify={notify}
              activeMode="SADAN"
              onModeChange={(m) => {
                if (m === 'USER') setActiveTab('TESTER_USER');
              }}
            />
          )}

          {/* ----------------------------------------------------------
              [가상] 가상 1호(aaa) & 2호(bbb) 온보딩 체감 결함 및 VOC 의견 보드
              ---------------------------------------------------------- */}
          {activeTab === 'TESTER_USER' && (
            <AdminGovernanceManager
              cardCls={cardCls}
              textTitleCls={textTitleCls}
              notify={notify}
              activeMode="USER"
              onModeChange={(m) => {
                if (m === 'SADAN') setActiveTab('GOVERNANCE');
              }}
            />
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
                              {`@${p.userId.replace(/^U_/, '').toLowerCase()}`}
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
              {/* 상단 단일 통합 컨트롤 바 (제목 · 검색 · 전체 필터 · 정렬 · 새로고침/초기화 통합) */}
              <div className={`p-3 border ${cardCls} space-y-2.5`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                    <h2 className="font-serif-editorial text-lg font-normal text-white">
                      회원 정보
                    </h2>
                    <span className="text-sm font-mono px-2 py-0.5 border border-[#3b82f6]/40 bg-[#3b82f6]/10 text-white font-bold">
                      {filteredLiveMembers.length}명
                    </span>
                    {lastRefreshedAt && (
                      <span className="text-sm font-mono text-zinc-400">
                        ({lastRefreshedAt})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="검색 (이름, 핸들, 이메일)"
                      value={memberSearchQuery}
                      onChange={(e) => {
                        setMemberSearchQuery(e.target.value);
                        setMemberPage(1);
                      }}
                      className="px-3 py-1 bg-black/40 border border-white/15 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#3b82f6] w-44"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        fetchLiveDbProfiles();
                        notify('회원 목록을 새로고침했습니다.');
                      }}
                      disabled={isDbLoading}
                      className="px-2.5 py-1 border border-white/15 hover:border-white/30 text-sm font-mono text-zinc-200 hover:text-white cursor-pointer disabled:opacity-50"
                    >
                      {isDbLoading ? '조회중' : '새로고침'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearchQuery('');
                        setMemberGenderFilter('ALL');
                        setMemberStageFilter('ALL');
                        setMemberPurposeFilter('ALL');
                        setMemberRegionFilter('ALL');
                        setMemberDistrictFilter('ALL');
                        setMemberAgeFilter('ALL');
                        setMemberDiagFilter('ALL');
                        setMemberMissingFilter('ALL');
                        setMemberSortBy('RECENT');
                        setMemberPage(1);
                      }}
                      className={btnSubCls}
                    >
                      초기화
                    </button>
                  </div>
                </div>

                {/* 통합 필터 & 정렬 행 */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex border border-white/15 divide-x divide-white/15 text-sm font-mono">
                    {(['ALL', 'F', 'M'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setMemberGenderFilter(g);
                          setMemberPage(1);
                        }}
                        className={`px-2.5 py-1 cursor-pointer ${
                          memberGenderFilter === g
                            ? 'bg-white/15 text-white font-bold'
                            : 'bg-black/30 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {g === 'ALL' ? '성별전체' : g === 'F' ? '여성' : '남성'}
                      </button>
                    ))}
                  </div>

                  <div className="flex border border-white/15 divide-x divide-white/15 text-sm font-mono">
                    {(
                      [
                        { key: 'ALL', label: '목적전체' },
                        { key: 'RESET', label: '변화' },
                        { key: 'FRIEND', label: '교류' },
                        { key: 'TASTE', label: '취향' },
                        { key: 'ROMANCE', label: '인연' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setMemberPurposeFilter(p.key);
                          setMemberPage(1);
                        }}
                        className={`px-2.5 py-1 cursor-pointer ${
                          memberPurposeFilter === p.key
                            ? 'bg-[#3b82f6]/25 text-white font-bold'
                            : 'bg-black/30 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <select
                    value={memberRegionFilter}
                    onChange={(e) => {
                      setMemberRegionFilter(e.target.value);
                      setMemberDistrictFilter('ALL');
                      setMemberPage(1);
                    }}
                    className={`${selectCls} w-auto py-1 text-sm`}
                    title="시/도 필터"
                  >
                    <option value="ALL">시/도 전체</option>
                    {Array.from(
                      new Set(
                        liveDbProfiles
                          .map((p) => normalizeCityName(p.residence_city))
                          .filter((c) => c !== '미지정')
                      )
                    ).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>

                  <select
                    value={memberDistrictFilter}
                    onChange={(e) => {
                      setMemberDistrictFilter(e.target.value);
                      setMemberPage(1);
                    }}
                    className={`${selectCls} w-auto py-1 text-sm`}
                    title="구/군 필터"
                  >
                    <option value="ALL">구/군 전체</option>
                    {Array.from(
                      new Set(
                        liveDbProfiles
                          .filter((p) => memberRegionFilter === 'ALL' || normalizeCityName(p.residence_city) === memberRegionFilter)
                          .map((p) => p.residence_district)
                          .filter((d): d is string => Boolean(d))
                      )
                    ).map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>

                  <select
                    value={memberAgeFilter}
                    onChange={(e) => {
                      setMemberAgeFilter(e.target.value as 'ALL' | '2030' | '3040' | '4050' | '5060');
                      setMemberPage(1);
                    }}
                    className={`${selectCls} w-auto py-1 text-sm`}
                    title="연령대 필터"
                  >
                    <option value="ALL">연령 전체</option>
                    <option value="2030">20대</option>
                    <option value="3040">30대</option>
                    <option value="4050">40대</option>
                    <option value="5060">50대+</option>
                  </select>

                  <select
                    value={memberDiagFilter}
                    onChange={(e) => {
                      setMemberDiagFilter(e.target.value as 'ALL' | 'DONE' | 'NONE');
                      setMemberPage(1);
                    }}
                    className={`${selectCls} w-auto py-1 text-sm`}
                    title="진단 필터"
                  >
                    <option value="ALL">진단 전체</option>
                    <option value="DONE">진단완료</option>
                    <option value="NONE">미진단</option>
                  </select>

                  <select
                    value={memberSortBy}
                    onChange={(e) => {
                      setMemberSortBy(e.target.value as 'RECENT' | 'STAGE' | 'AGE' | 'SCORE' | 'NAME' | 'REGION');
                      setMemberPage(1);
                    }}
                    className={`${selectCls} w-auto py-1 text-sm`}
                    title="정렬 기준"
                  >
                    <option value="RECENT">최근 가입순</option>
                    <option value="SCORE">총점 높은순</option>
                    <option value="STAGE">진행 단계순</option>
                    <option value="NAME">이름순</option>
                    <option value="REGION">지역순</option>
                    <option value="AGE">연령순</option>
                  </select>
                </div>
              </div>

              {/* 한눈에 확인하는 4열 회원 현황 다이어그램 (전체/성비 · 지역비율 · 목적비율 · 평균총점) */}
              {(() => {
                const total = Math.max(1, liveDbProfiles.length);
                const fCount = liveDbProfiles.filter((p) => p.gender === 'F').length;
                const mCount = liveDbProfiles.filter((p) => p.gender === 'M').length;
                const fPct = Math.round((fCount / total) * 100);
                const mPct = 100 - fPct;

                const regMap = new Map<string, number>();
                for (const p of liveDbProfiles) {
                  const c = normalizeCityName(p.residence_city);
                  regMap.set(c, (regMap.get(c) ?? 0) + 1);
                }
                const topRegions = Array.from(regMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

                const purpMap = [
                  { key: 'RESET' as const, label: '변화' },
                  { key: 'FRIEND' as const, label: '교류' },
                  { key: 'TASTE' as const, label: '취향' },
                  { key: 'ROMANCE' as const, label: '인연' },
                ];

                const scoredMembers = liveDbProfiles.map((p) => getMemberTotalScore(p)).filter((s) => s > 0);
                const avgScore =
                  scoredMembers.length > 0
                    ? Math.round(scoredMembers.reduce((a, b) => a + b, 0) / scoredMembers.length)
                    : 0;
                const diagPct = Math.round((scoredMembers.length / total) * 100);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono">
                    {/* 1. 전체회원 & 성비 */}
                    <div className="p-3 border border-white/10 bg-[#0c0d12] space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">전체 · 성비</span>
                        <span className="text-white font-bold">{liveDbProfiles.length}명</span>
                      </div>
                      <div className="h-2.5 bg-white/5 flex overflow-hidden border border-white/10">
                        <div className="bg-[#f04f74]" style={{ width: `${fPct}%` }} />
                        <div className="bg-[#3b82f6]" style={{ width: `${mPct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-200">여 {fCount} ({fPct}%)</span>
                        <span className="text-blue-300">남 {mCount} ({mPct}%)</span>
                      </div>
                    </div>

                    {/* 2. 지역별 비율 */}
                    <div className="p-3 border border-white/10 bg-[#0c0d12] space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">지역 비율</span>
                        <span className="text-blue-300">{regMap.size}개 권역</span>
                      </div>
                      {topRegions.map(([city, cnt]) => {
                        const pct = Math.round((cnt / total) * 100);
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setMemberRegionFilter(city === '미지정' ? 'ALL' : city);
                              setMemberPage(1);
                            }}
                            className="w-full text-left space-y-0.5 cursor-pointer group"
                          >
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-200 group-hover:text-white">{city}</span>
                              <span className="text-white font-bold">{cnt}명 ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-white/5 overflow-hidden">
                              <div className="h-full bg-[#3b82f6]" style={{ width: `${pct}%` }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* 3. 목적별 비율 */}
                    <div className="p-3 border border-white/10 bg-[#0c0d12] space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">목적 비율</span>
                        <span className="text-zinc-300">4대 축</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {purpMap.map((pm) => {
                          const cnt = liveDbProfiles.filter((p) => (p.preferred_purpose || 'RESET') === pm.key).length;
                          const pct = Math.round((cnt / total) * 100);
                          return (
                            <button
                              key={pm.key}
                              type="button"
                              onClick={() => {
                                setMemberPurposeFilter(pm.key);
                                setMemberPage(1);
                              }}
                              className="px-2 py-1 border border-white/10 bg-[#08090d] hover:border-[#3b82f6]/50 flex items-center justify-between text-sm cursor-pointer"
                            >
                              <span className="text-zinc-300">{pm.label}</span>
                              <span className="text-white font-bold">{pct}%</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. 평균 총점 & 진단율 */}
                    <div className="p-3 border border-white/10 bg-[#0c0d12] space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">평균 총점</span>
                        <span className="text-blue-300 font-bold">진단율 {diagPct}%</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{avgScore}점</div>
                      <div className="h-1.5 bg-white/5 overflow-hidden">
                        <div className="h-full bg-[#f04f74]" style={{ width: `${avgScore}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 5단계 동적 분류 바 (실서버 조건 충족 기반 퍼널 분류) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {(
                  [
                    { key: 'ALL', label: '전체', count: memberStageCounts.ALL },
                    { key: 'UNQUALIFIED', label: '조건미입력', count: memberStageCounts.UNQUALIFIED },
                    { key: 'READY', label: '조건완료', count: memberStageCounts.READY },
                    { key: 'APPLIED', label: '결제·신청', count: memberStageCounts.APPLIED },
                    { key: 'PRE_MATCHED', label: '가매칭', count: memberStageCounts.PRE_MATCHED },
                    { key: 'CONFIRMED', label: '확정', count: memberStageCounts.CONFIRMED },
                  ] as const
                ).map((st) => {
                  const active = memberStageFilter === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setMemberStageFilter(st.key)}
                      className={`px-3 py-2 border text-sm font-medium flex items-center justify-between transition-colors ${
                        active
                          ? 'bg-white/10 border-white/30 text-white border-l-2 border-l-[#f04f74]'
                          : 'bg-[#0c0d12] border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{st.label}</span>
                      <span className="font-mono text-white font-bold ml-1.5">{st.count}</span>
                    </button>
                  );
                })}
              </div>

              {/* 한 줄 리스트 구조 (10줄 초과 시 이전/다음 페이지네이션, 클릭 시 상세 확장) */}
              {(() => {
                const totalMemberPages = Math.max(1, Math.ceil(filteredLiveMembers.length / LIST_PAGE_SIZE));
                const safeMemberPage = Math.min(memberPage, totalMemberPages);
                const pagedMembers = filteredLiveMembers.slice(
                  (safeMemberPage - 1) * LIST_PAGE_SIZE,
                  safeMemberPage * LIST_PAGE_SIZE
                );

                return (
                  <div className="space-y-2.5">
                    <div className="border border-white/10 bg-[#0c0d12] divide-y divide-white/[0.06]">
                      {/* 테이블 컬럼 헤더 (맨 앞 가입일자 기준 · 재클릭 시 오름/내림차순 토글) */}
                      <div className="hidden md:grid md:grid-cols-12 gap-2 px-3.5 py-2 bg-white/[0.03] text-sm font-mono text-zinc-400">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('RECENT')}
                          className={`col-span-1 text-left cursor-pointer hover:text-white ${memberSortBy === 'RECENT' ? 'text-blue-300 font-bold' : ''}`}
                        >
                          가입 {memberSortBy === 'RECENT' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                        <span className="col-span-1">구분</span>
                        <span className="col-span-2">아이디</span>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('NAME')}
                          className={`col-span-1 text-left cursor-pointer hover:text-white ${memberSortBy === 'NAME' ? 'text-blue-300 font-bold' : ''}`}
                        >
                          이름 {memberSortBy === 'NAME' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('GENDER')}
                          className={`col-span-1 text-left cursor-pointer hover:text-white ${memberSortBy === 'GENDER' ? 'text-blue-300 font-bold' : ''}`}
                        >
                          성별 {memberSortBy === 'GENDER' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('AGE')}
                          className={`col-span-1 text-left cursor-pointer hover:text-white ${memberSortBy === 'AGE' ? 'text-blue-300 font-bold' : ''}`}
                        >
                          출생 {memberSortBy === 'AGE' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('REGION')}
                          className={`col-span-2 text-left cursor-pointer hover:text-white ${memberSortBy === 'REGION' ? 'text-blue-300 font-bold' : ''}`}
                        >
                          지역 {memberSortBy === 'REGION' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('PURPOSE')}
                          className={`col-span-1 text-left cursor-pointer hover:text-white ${memberSortBy === 'PURPOSE' ? 'text-blue-300 font-bold' : ''}`}
                        >
                          목적 {memberSortBy === 'PURPOSE' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('SCORE')}
                          className={`col-span-1 text-left cursor-pointer hover:text-white ${memberSortBy === 'SCORE' ? 'text-blue-300 font-bold' : ''}`}
                        >
                          총점 {memberSortBy === 'SCORE' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSortColumn('STAGE')}
                          className={`col-span-1 text-right cursor-pointer hover:text-white ${memberSortBy === 'STAGE' ? 'text-blue-300 font-bold' : ''}`}
                        >
                          단계 {memberSortBy === 'STAGE' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                      </div>

                      {filteredLiveMembers.length === 0 ? (
                        <div className="p-8 text-center text-sm font-mono text-zinc-500">
                          실서버 DB에 등록된 회원이 없습니다.
                        </div>
                      ) : (
                        pagedMembers.map((m) => {
                          const isExpanded = expandedMemberId === m.id;
                          const isVirtual = m.id === 'aaa' || m.id === 'bbb' || m.handle === '@aaa' || m.handle === '@bbb';
                          const createdStr = m.created_at
                            ? new Date(m.created_at).toLocaleDateString('ko-KR', {
                                month: '2-digit',
                                day: '2-digit',
                              })
                            : '-';
                          const totalScore = getMemberTotalScore(m);
                          const cityNorm = normalizeCityName(m.residence_city);
                          const regionDisplay = m.residence_district
                            ? `${cityNorm !== '미지정' ? cityNorm : ''} ${m.residence_district}`.trim()
                            : cityNorm;

                          const nbtiText = isVirtual
                            ? m.id === 'aaa' || m.handle === '@aaa'
                              ? '경청형 (88점)'
                              : '공감형 (94점)'
                            : totalScore > 0
                            ? `진단완료 (${totalScore}점)`
                            : '미진단';

                          const purposeLabelMap: Record<string, string> = {
                            RESET: '변화',
                            FRIEND: '교류',
                            TASTE: '취향',
                            ROMANCE: '인연',
                          };
                          const rawPurpose = m.preferred_purpose || m.survey_answers?.purpose || 'RESET';
                          const purposeText = purposeLabelMap[rawPurpose] || rawPurpose;

                          const trustText = isVirtual
                            ? '신뢰 98점'
                            : m.verified_badge
                            ? '신뢰 95점'
                            : '신뢰 90점';

                          const memberStage = getMemberStage(m);
                          const STAGE_LABELS: Record<typeof memberStage, string> = {
                            UNQUALIFIED: '조건미입력',
                            READY: '조건완료',
                            APPLIED: '결제·신청',
                            PRE_MATCHED: '가매칭',
                            CONFIRMED: '확정',
                          };

                          return (
                            <div
                              key={m.id}
                              className={isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}
                            >
                              <div
                                onClick={() => setExpandedMemberId(isExpanded ? null : m.id)}
                                className="grid grid-cols-2 md:grid-cols-12 items-center gap-2 px-3.5 py-2.5 cursor-pointer text-sm font-mono"
                              >
                                <div className="col-span-1 flex items-center gap-1.5 text-zinc-300">
                                  <span className="text-zinc-400">{isExpanded ? '▾' : '▸'}</span>
                                  <span>{createdStr}</span>
                                </div>
                                <div className="col-span-1">
                                  <span
                                    className={`px-1.5 py-0.5 border ${
                                      m.id === 'ADMIN_01'
                                        ? 'border-[#3b82f6]/50 bg-[#3b82f6]/15 text-blue-200'
                                        : 'border-white/20 bg-white/5 text-white'
                                    }`}
                                  >
                                    {m.id === 'ADMIN_01' ? '관리' : isVirtual ? '가상' : '회원'}
                                  </span>
                                </div>
                                <div className="col-span-1 md:col-span-2 font-bold text-white truncate">
                                  {m.handle}
                                </div>
                                <div className="col-span-1 text-zinc-100 truncate">
                                  {m.nickname}
                                </div>
                                <div className="col-span-1 text-zinc-300">
                                  {m.gender === 'F' ? '여' : '남'}
                                </div>
                                <div className="col-span-1 text-zinc-300">
                                  {m.birth_year}
                                </div>
                                <div className="col-span-1 md:col-span-2 text-zinc-200 truncate">
                                  {regionDisplay}
                                </div>
                                <div className="col-span-1 text-blue-300 font-medium">
                                  {purposeText}
                                </div>
                                <div className="col-span-1 text-white font-bold">
                                  {totalScore > 0 ? `${totalScore}점` : '-'}
                                </div>
                                <div className="col-span-1 text-right">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectTab(
                                        memberStage === 'PRE_MATCHED' || memberStage === 'READY'
                                          ? 'PRE_MATCH'
                                          : 'EVENT_GATE'
                                      );
                                    }}
                                    title="매칭·관제 화면으로 이동"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#3b82f6]/40 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/25 text-white font-bold cursor-pointer"
                                  >
                                    {(memberStage === 'PRE_MATCHED' || memberStage === 'CONFIRMED') && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                                    )}
                                    {STAGE_LABELS[memberStage]}
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-4 border-t border-white/10 bg-black/40 space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm font-mono">
                                    <div className="p-3 border border-white/20 bg-white/[0.03] space-y-1">
                                      <span className="text-zinc-400 block">소통 성향 (NBTI)</span>
                                      <span className="text-white font-bold text-base">{nbtiText}</span>
                                    </div>
                                    <div className="p-3 border border-white/20 bg-white/[0.03] space-y-1">
                                      <span className="text-zinc-400 block">참여 목적</span>
                                      <span className="text-white font-bold text-base">{purposeText}</span>
                                    </div>
                                    <div className="p-3 border border-white/20 bg-white/[0.03] space-y-1">
                                      <span className="text-zinc-400 block">신뢰도</span>
                                      <span className="text-white font-bold text-base">{trustText}</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-mono">
                                    <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                      <span className="text-zinc-500 block mb-1">DB ID</span>
                                      <span className="text-white font-medium">{m.id}</span>
                                    </div>
                                    <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                      <span className="text-zinc-500 block mb-1">이메일</span>
                                      <span className="text-white font-medium truncate block">{m.email || '미등록'}</span>
                                    </div>
                                    <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                      <span className="text-zinc-500 block mb-1">직업</span>
                                      <span className="text-white font-medium">{m.job_title || '미입력'}</span>
                                    </div>
                                    <div className="p-2.5 border border-white/10 bg-white/[0.02]">
                                      <span className="text-zinc-500 block mb-1">거주지역</span>
                                      <span className="text-white font-medium truncate block">
                                        {regionDisplay}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {filteredLiveMembers.length > LIST_PAGE_SIZE && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border border-white/10 bg-[#0c0d12] text-sm font-mono">
                        <span className="text-zinc-400">
                          총 {filteredLiveMembers.length}명 · {safeMemberPage} / {totalMemberPages} 페이지
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={safeMemberPage <= 1}
                            onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1 border border-white/20 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                          >
                            이전
                          </button>
                          {Array.from({ length: totalMemberPages }, (_, idx) => idx + 1).map((pg) => (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setMemberPage(pg)}
                              className={`px-2.5 py-1 border cursor-pointer ${
                                pg === safeMemberPage
                                  ? 'border-[#3b82f6] bg-[#3b82f6]/25 text-white font-bold'
                                  : 'border-white/15 bg-white/5 text-zinc-300 hover:text-white'
                              }`}
                            >
                              {pg}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={safeMemberPage >= totalMemberPages}
                            onClick={() => setMemberPage((p) => Math.min(totalMemberPages, p + 1))}
                            className="px-3 py-1 border border-[#3b82f6]/50 bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 text-white font-bold disabled:opacity-30 cursor-pointer"
                          >
                            다음
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
              [가매칭] 관리자 전용 가매칭 방 관제 페이지
              ---------------------------------------------------------- */}
          {activeTab === 'PRE_MATCH' && (
            <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-6">
              <AdminPreMatchPage />
            </div>
          )}

          {/* ----------------------------------------------------------
              [적응매칭] 12+4 질문지 · 동적 축 · 방 부합도 · 사후 평가 비교 관제
              ---------------------------------------------------------- */}
          {activeTab === 'ADAPTIVE_QA' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/10 bg-[#0c0d12] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <h2 className="font-serif-editorial text-lg font-normal text-white">A/B 실험</h2>
                    <span className="text-sm font-mono px-2 py-0.5 border border-white/15 text-zinc-300">
                      {abExperiments.length}건
                    </span>
                  </div>
                  <span className="text-sm font-mono text-zinc-400">A안 원형 보존 · B안 비교</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {abExperiments.map((exp) => (
                    <div
                      key={exp.experimentId}
                      className="p-3 border border-white/10 bg-[#08090d] flex flex-wrap items-center justify-between gap-2 text-sm font-mono"
                    >
                      <div className="min-w-0">
                        <span className="text-white font-bold block truncate">{exp.name}</span>
                        <span className="text-zinc-400 block truncate">
                          {exp.activeMode === 'A_ONLY'
                            ? exp.controlLabel
                            : exp.activeMode === 'B_ONLY'
                            ? exp.variantLabel
                            : '50:50 A/B 분할'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(['A_ONLY', 'AB_SPLIT', 'B_ONLY'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleUpdateAbMode(exp.experimentId, m)}
                            className={`px-2.5 py-1 border cursor-pointer ${
                              exp.activeMode === m
                                ? 'border-white/40 bg-white/15 text-white font-bold'
                                : 'border-white/10 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {m === 'A_ONLY' ? 'A안' : m === 'AB_SPLIT' ? 'A/B' : 'B안'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <AdminAdaptiveMatchingManager
                isLight={isLight}
                onNotify={notify}
              />
            </div>
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
              [모임] 1. 개설 / 2. 목록 / 3. 관제 (독립 대분류)
              ---------------------------------------------------------- */}
          {(activeTab === 'EVENT_CREATE' || activeTab === 'EVENT_LIST' || activeTab === 'EVENT_GATE') && (
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
                    {activeTab === 'EVENT_CREATE'
                      ? '모임 개설'
                      : activeTab === 'EVENT_LIST'
                      ? '모임 목록'
                      : '모임 관제'}
                  </h2>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    {activeTab === 'EVENT_LIST' ? `${conditionalEvents.length}건` : '1건'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTab('EVENT_CREATE')}
                    className={`px-2.5 py-1 text-sm font-mono border transition-colors cursor-pointer ${
                      activeTab === 'EVENT_CREATE'
                        ? 'border-white/40 bg-white/15 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-zinc-300 hover:text-white'
                    }`}
                  >
                    개설
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('EVENT_LIST')}
                    className={`px-2.5 py-1 text-sm font-mono border transition-colors cursor-pointer ${
                      activeTab === 'EVENT_LIST'
                        ? 'border-white/40 bg-white/15 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-zinc-300 hover:text-white'
                    }`}
                  >
                    목록
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('EVENT_GATE')}
                    className={`px-2.5 py-1 text-sm font-mono border transition-colors cursor-pointer ${
                      activeTab === 'EVENT_GATE'
                        ? 'border-white/40 bg-white/15 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-zinc-300 hover:text-white'
                    }`}
                  >
                    관제
                  </button>
                </div>
              </div>

              {/* 0. [모임 관제] 동적 시험 */}
              {activeTab === 'EVENT_GATE' && (
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
              )}

              {/* 1. [모임 개설] 전국구 자유 개설 · 수정 (달력/시간/전국 시·도/식당 직접입력/사진) */}
              {activeTab === 'EVENT_CREATE' && (
              <AdminSectionCard
                title={editingEventId ? '모임 수정' : '모임 개설'}
                isOpen={isSectionOpen('SEC_EVENT_CREATE', true)}
                onToggle={() => toggleSection('SEC_EVENT_CREATE', true)}
                isLight={isLight}
              >
                <div className={`space-y-4 p-4 rounded-none border ${subCardCls}`}>
                  {/* ==========================================================
                      1. 엔진 기준 (목적 · 유형 · 연령 · 평가 모듈)
                      ========================================================== */}
                  <div className="space-y-3 pb-4 border-b border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                        <span className="text-sm font-mono font-bold text-white">1. 엔진 기준</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowOptionManagers((v) => !v)}
                        className={btnSubCls}
                      >
                        {showOptionManagers ? '옵션 닫기' : '유형·연령 관리'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>참가 목적 *</label>
                        <select
                          value={newEventPurpose}
                          onChange={(e) => {
                            const val = e.target.value as 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE';
                            setNewEventPurpose(val);
                            setNewEventEnforceGenderRatio(val === 'ROMANCE');
                          }}
                          className={`w-full ${selectCls}`}
                        >
                          <option value="FRIEND">친구·교류 (관계무관)</option>
                          <option value="RESET">지적 환기·리셋 (기혼·리더)</option>
                          <option value="TASTE">취향·활동 공유</option>
                          <option value="ROMANCE">인연·동반자 (미혼 한정)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>구성 방식</label>
                        <select
                          value={newEventMode}
                          onChange={(e) => setNewEventMode(e.target.value)}
                          className={`w-full ${selectCls}`}
                        >
                          {customMeetupModes.map((mode) => (
                            <option key={mode} value={mode}>
                              {mode}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>대상 연령</label>
                        <select
                          value={newEventAgeGroup}
                          onChange={(e) => setNewEventAgeGroup(e.target.value)}
                          className={`w-full ${selectCls}`}
                        >
                          {customAgeGroups.map((age) => (
                            <option key={age} value={age}>
                              {age}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>평가 모듈 *</label>
                        <select
                          value={newEventEvalModuleId}
                          onChange={(e) => setNewEventEvalModuleId(e.target.value)}
                          className={`w-full ${selectCls}`}
                        >
                          <option value="MOD_TRACK_3040">3040 커리어·감각 트랙</option>
                          <option value="MOD_TRACK_5060">5060 골든 인품 트랙</option>
                        </select>
                      </div>
                    </div>

                    {showOptionManagers && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newModeInput}
                              onChange={(e) => setNewModeInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addCustomMode(newModeInput);
                                }
                              }}
                              placeholder="새 구성 방식 입력"
                              className={`flex-1 ${inputCls}`}
                            />
                            <button
                              type="button"
                              onClick={() => addCustomMode(newModeInput)}
                              className="px-3 py-2 text-sm font-mono border border-white/20 text-white hover:bg-white/10 shrink-0"
                            >
                              + 추가
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {customMeetupModes.map((mode) => (
                              <span
                                key={mode}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-mono border border-white/15 text-zinc-200 bg-white/5"
                              >
                                <span>{mode}</span>
                                {customMeetupModes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeCustomMode(mode)}
                                    className="text-zinc-400 hover:text-white"
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newAgeInput}
                              onChange={(e) => setNewAgeInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addCustomAgeGroup(newAgeInput);
                                }
                              }}
                              placeholder="새 대상 연령 입력"
                              className={`flex-1 ${inputCls}`}
                            />
                            <button
                              type="button"
                              onClick={() => addCustomAgeGroup(newAgeInput)}
                              className="px-3 py-2 text-sm font-mono border border-white/20 text-white hover:bg-white/10 shrink-0"
                            >
                              + 추가
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {customAgeGroups.map((age) => (
                              <span
                                key={age}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-mono border border-white/15 text-zinc-200 bg-white/5"
                              >
                                <span>{age}</span>
                                {customAgeGroups.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeCustomAgeGroup(age)}
                                    className="text-zinc-400 hover:text-white"
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ==========================================================
                      2. 생활권 · 일정 · 참가비
                      ========================================================== */}
                  <div className="space-y-3 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                      <span className="text-sm font-mono font-bold text-white">2. 생활권 · 일정</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>지역 *</label>
                        <select
                          value={newEventRegionName}
                          onChange={(e) => setNewEventRegionName(e.target.value)}
                          className={`w-full ${selectCls}`}
                        >
                          {[
                            '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
                            '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
                          ].map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>시 / 군 / 구 *</label>
                        <input
                          type="text"
                          placeholder="강남구 / 해운대구"
                          value={newEventDistrictName}
                          onChange={(e) => setNewEventDistrictName(e.target.value)}
                          className={`w-full ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>읍 / 면 / 동</label>
                        <input
                          type="text"
                          placeholder="역삼동 / 우동"
                          value={newEventDongName}
                          onChange={(e) => setNewEventDongName(e.target.value)}
                          className={`w-full ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>날짜 *</label>
                        <input
                          type="date"
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className={`w-full ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>시간 *</label>
                        <input
                          type="time"
                          value={newEventTime}
                          onChange={(e) => setNewEventTime(e.target.value)}
                          className={`w-full ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>참가비 (원)</label>
                        <input
                          type="number"
                          value={newEventPrice}
                          onChange={(e) => setNewEventPrice(Number(e.target.value))}
                          className={`w-full ${inputCls}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ==========================================================
                      3. 최종 제목 · 설명 (마지막 등록)
                      ========================================================== */}
                  <div className="space-y-3 pb-4 border-b border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                        <span className="text-sm font-mono font-bold text-white">3. 제목 · 설명</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const pMap: Record<string, string> = {
                            FRIEND: '친구·교류',
                            RESET: '지적 환기',
                            TASTE: '취향·살롱',
                            ROMANCE: '인연·다이닝',
                          };
                          const loc = [newEventRegionName, newEventDistrictName.trim(), newEventDongName.trim()]
                            .filter(Boolean)
                            .join(' ');
                          setNewEventTitle(`${loc} ${newEventAgeGroup} ${pMap[newEventPurpose] || newEventMode}`.trim());
                        }}
                        className={btnSubCls}
                      >
                        자동 조합
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>모임명 *</label>
                        <input
                          type="text"
                          placeholder="위 조건을 바탕으로 최종 모임명을 입력하세요."
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          className={`w-full ${inputCls}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>한 줄 이유</label>
                        <input
                          type="text"
                          placeholder="예: 혼자는 못 가던 공간에서 격조 있는 6인의 대화"
                          value={newEventReason}
                          onChange={(e) => setNewEventReason(e.target.value)}
                          className={`w-full ${inputCls}`}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>상세 소개</label>
                        <textarea
                          rows={2}
                          placeholder="공간 분위기, 대화 주제, 진행 방식을 입력하세요."
                          value={newEventDescription}
                          onChange={(e) => setNewEventDescription(e.target.value)}
                          className={`w-full ${inputCls}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ==========================================================
                      [선택] 상세 설정 (정원·마감·장소·식대·사진·규정 - 기본 접힘)
                      ========================================================== */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-mono text-zinc-400">
                        상세 설정 (정원 {newEventMaxCapacity}명 · {newEventVenueSecret ? 'D-1 장소공개' : '장소즉시공개'} · 성비균형 {newEventEnforceGenderRatio ? 'ON' : 'OFF'})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEventAdvanced((v) => !v)}
                        className={btnSubCls}
                      >
                        {showEventAdvanced ? '접기' : '상세 설정'}
                      </button>
                    </div>

                    {showEventAdvanced && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/10">
                        <div>
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>신청 마감 일시</label>
                          <input
                            type="datetime-local"
                            value={newEventDeadlineAt}
                            onChange={(e) => setNewEventDeadlineAt(e.target.value)}
                            className={`w-full ${inputCls}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>정원 / 최소확정(명)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={newEventMaxCapacity}
                              onChange={(e) => setNewEventMaxCapacity(Number(e.target.value))}
                              className={`w-full ${inputCls}`}
                            />
                            <input
                              type="number"
                              value={newEventMinConfirm}
                              onChange={(e) => setNewEventMinConfirm(Number(e.target.value))}
                              className={`w-full ${inputCls}`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>최소 점수 제한</label>
                          <input
                            type="number"
                            value={newEventMinScore}
                            onChange={(e) => setNewEventMinScore(Number(e.target.value))}
                            className={`w-full ${inputCls}`}
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="w-full flex items-center justify-between px-3 py-2 border border-white/15 bg-[#08090d] text-sm font-mono text-white cursor-pointer">
                            <span>3:3 성비 균형 강제</span>
                            <input
                              type="checkbox"
                              checked={newEventEnforceGenderRatio}
                              onChange={(e) => setNewEventEnforceGenderRatio(e.target.checked)}
                              className="accent-[#f04f74]"
                            />
                          </label>
                        </div>

                        <div>
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>장소 방식</label>
                          <select
                            value={newEventVenueId}
                            onChange={(e) => setNewEventVenueId(e.target.value)}
                            className={`w-full ${selectCls}`}
                          >
                            <option value="DIRECT">직접 식당 입력</option>
                            {partnerVenues.map((v) => (
                              <option key={v.venueId} value={v.venueId}>
                                제휴: {v.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>식당 / 공간명</label>
                          <input
                            type="text"
                            placeholder="예: 오스테리아 마린"
                            value={newEventVenueName}
                            onChange={(e) => setNewEventVenueName(e.target.value)}
                            className={`w-full ${inputCls}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>식당 주소</label>
                          <input
                            type="text"
                            placeholder="상세 주소"
                            value={newEventVenueAddress}
                            onChange={(e) => setNewEventVenueAddress(e.target.value)}
                            className={`w-full ${inputCls}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>지도 링크</label>
                          <input
                            type="url"
                            placeholder="URL (선택)"
                            value={newEventVenueMapUrl}
                            onChange={(e) => setNewEventVenueMapUrl(e.target.value)}
                            className={`w-full ${inputCls}`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>예상 1/N 식대</label>
                          <input
                            type="text"
                            value={newEventExpectedMealCost}
                            onChange={(e) => setNewEventExpectedMealCost(e.target.value)}
                            className={`w-full ${inputCls}`}
                          />
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 text-sm font-mono text-zinc-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newEventVenueSecret}
                              onChange={(e) => setNewEventVenueSecret(e.target.checked)}
                            />
                            <span>확정자 D-1 상세 주소 공개</span>
                          </label>
                        </div>
                        <div className="lg:col-span-2">
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>취소 · 환불 규정</label>
                          <input
                            type="text"
                            value={newEventRefundPolicy}
                            onChange={(e) => setNewEventRefundPolicy(e.target.value)}
                            className={`w-full ${inputCls}`}
                          />
                        </div>

                        <div className="lg:col-span-4">
                          <label className={`block text-sm font-mono mb-1 ${textMutedCls}`}>대표 사진 (URL 또는 파일 업로드)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="이미지 URL 입력"
                              value={newEventHeroImage}
                              onChange={(e) => setNewEventHeroImage(e.target.value)}
                              className={`flex-1 ${inputCls}`}
                            />
                            <label className="px-3 py-2 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-white cursor-pointer shrink-0 flex items-center">
                              파일 선택
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      setNewEventHeroImage(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                    {editingEventId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEventId(null);
                          setNewEventTitle('');
                          setNewEventReason('');
                          setNewEventDescription('');
                        }}
                        className={btnSubCls}
                      >
                        취소
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!newEventTitle.trim()) return;
                        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                        const parsedDate = newEventDate ? new Date(`${newEventDate}T00:00:00`) : null;
                        const dayStr = parsedDate && !isNaN(parsedDate.getTime()) ? `(${dayNames[parsedDate.getDay()]})` : '';
                        const formattedDateText = newEventDate
                          ? `${newEventDate} ${dayStr} ${newEventTime || '19:30'}`.trim()
                          : newEventTime || '일정 협의';
                        const formattedDeadline = newEventDeadlineAt
                          ? `${newEventDeadlineAt.replace('T', ' ')} 마감`
                          : '모임 전일 18:00 마감';

                        const payload = {
                          eventId:
                            editingEventId ||
                            buildMeetupSeoSlug(
                              newEventRegionName,
                              newEventDistrictName,
                              newEventPurpose,
                              newEventDate ? newEventDate.replace(/-/g, '').slice(2) : String(Date.now()).slice(-4)
                            ),
                          title: newEventTitle.trim(),
                          districtId: newEventDistrictId,
                          regionName: newEventRegionName,
                          districtName: newEventDistrictName.trim() || '주요 상권',
                          dongName: newEventDongName.trim() || undefined,
                          venueId: newEventVenueId === 'DIRECT' ? 'DIRECT' : newEventVenueId,
                          dateText: formattedDateText,
                          eventDate: newEventDate,
                          eventTime: newEventTime,
                          deadlineAt: newEventDeadlineAt,
                          mode: newEventMode,
                          purpose: newEventPurpose,
                          compositionMode: newEventMode,
                          enforceGenderRatio: newEventEnforceGenderRatio,
                          evaluationModuleId: newEventEvalModuleId,
                          targetAgeGroup: newEventAgeGroup,
                          priceKrw: newEventPrice,
                          maxCapacity: newEventMaxCapacity,
                          minConfirmCount: newEventMinConfirm,
                          reason: newEventReason.trim() || '결이 맞는 6인의 프라이빗 다이닝',
                          description: newEventDescription.trim() || '엄선된 프라이빗 공간에서 결이 맞는 6인이 함께 식사하며 대화를 나눕니다.',
                          heroImage: newEventHeroImage.trim(),
                          venueNameOverride: newEventVenueName.trim() || undefined,
                          venueAddress: newEventVenueAddress.trim() || '확정자 D-1 상세 주소 비공개 안내',
                          venueMapUrl: newEventVenueMapUrl.trim() || undefined,
                          isVenueSecretUntilConfirm: newEventVenueSecret,
                          expectedMealCost: newEventExpectedMealCost.trim(),
                          refundPolicy: newEventRefundPolicy.trim(),
                          deadlineText: formattedDeadline,
                          status: 'RECRUITING' as const,
                          mealNote: `참가비 ₩${newEventPrice.toLocaleString()} (다면 관찰 엔진 라이선스 및 리포트 포함 / 식음료 매장 현장 1/N)`,
                          requiredBadgeIds: [],
                          minTotalScore100: newEventMinScore,
                          activePresetSubIds: [
                            'SUB_APP_1',
                            'SUB_STY_2',
                            'SUB_CON_2',
                          ],
                        };

                        if (editingEventId) {
                          updateConditionalEvent(payload);
                          setEditingEventId(null);
                          notify('모임 상품 정보가 수정되었습니다.');
                        } else {
                          addConditionalEvent(payload);
                          notify('신규 모임 상품이 개설되었습니다.');
                        }
                        setNewEventTitle('');
                        setNewEventReason('');
                        setNewEventDescription('');
                        handleSelectTab('EVENT_LIST');
                      }}
                      className={btnPrimaryCls}
                    >
                      {editingEventId ? '수정 저장' : '+ 개설'}
                    </button>
                  </div>
                </div>
              </AdminSectionCard>
              )}

              {/* 2. [모임 목록] 등록된 모임 상품 목록 */}
              {activeTab === 'EVENT_LIST' && (
              <AdminSectionCard
                title="모임 목록"
                badge={`${conditionalEvents.length}건`}
                isOpen={isSectionOpen('SEC_EVENT_LIST', true)}
                onToggle={() => toggleSection('SEC_EVENT_LIST', true)}
                isLight={isLight}
              >
                {conditionalEvents.length === 0 ? (
                  <p className={`text-sm py-4 text-center ${textMutedCls}`}>
                    개설된 모임이 없습니다. 상단에서 신규 모임을 개설해 주십시오.
                  </p>
                ) : (
                  (() => {
                    const sortedEvents = [...conditionalEvents].sort((a, b) =>
                      (a.dateText || '').localeCompare(b.dateText || '')
                    );
                    const totalEventPages = Math.max(1, Math.ceil(sortedEvents.length / LIST_PAGE_SIZE));
                    const safeEventPage = Math.min(eventPage, totalEventPages);
                    const pagedEvents = sortedEvents.slice(
                      (safeEventPage - 1) * LIST_PAGE_SIZE,
                      safeEventPage * LIST_PAGE_SIZE
                    );
                    return (
                      <div className="space-y-2.5">
                        <div className="border border-white/10 bg-[#0c0d12] divide-y divide-white/[0.06]">
                          {pagedEvents.map((ev, evIdx) => {
                            const rowNum = (safeEventPage - 1) * LIST_PAGE_SIZE + evIdx + 1;
                            const statusLabel =
                              ev.status === 'CONFIRMED'
                                ? '확정'
                                : ev.status === 'CLOSING_SOON'
                                ? '마감임박'
                                : ev.status === 'CANCELLED_MIN'
                                ? '미달취소'
                                : ev.status === 'COMPLETED'
                                ? '종료'
                                : '모집중';
                            return (
                              <div
                                key={ev.eventId}
                                className={`px-3.5 py-2.5 flex flex-col gap-2 transition-colors ${
                                  isLight
                                    ? 'bg-zinc-50 text-zinc-900'
                                    : 'hover:bg-white/[0.02] text-white'
                                }`}
                              >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 border border-[#3b82f6]/50 bg-[#3b82f6]/15 text-sm font-mono font-bold text-white shrink-0">
                                  {rowNum}
                                </span>
                                <span className="text-sm font-mono text-blue-300 shrink-0">
                                  {ev.dateText}
                                </span>
                                <span className="px-2 py-0.5 text-sm font-mono border border-white/20 bg-white/10 text-white shrink-0">
                                  {statusLabel}
                                </span>
                                <h4
                                  className={`font-serif-editorial text-base font-normal truncate ${
                                    isLight ? 'text-zinc-900' : 'text-white'
                                  }`}
                                >
                                  {ev.title}
                                </h4>
                              </div>
                              {ev.reason && (
                                <p className={`text-sm font-light ${textMutedCls}`}>
                                  {ev.reason}
                                </p>
                              )}
                              <p className="text-sm font-mono text-zinc-300 font-light">
                                {ev.dateText} • 정원 {ev.maxCapacity ?? 6}명(최소 {ev.minConfirmCount ?? 4}명) • ₩{ev.priceKrw.toLocaleString()}
                              </p>
                              <p className="text-sm font-mono text-zinc-400">
                                {ev.deadlineText || '모임 전일 18:00 마감'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEventId(ev.eventId);
                                  setNewEventTitle(ev.title);
                                  setNewEventRegionName(ev.regionName || '부산');
                                  setNewEventDistrictName(ev.districtName || '해운대구');
                                  setNewEventDongName(ev.dongName || '');
                                  setNewEventDate(ev.eventDate || '2026-11-20');
                                  setNewEventTime(ev.eventTime || '19:30');
                                  setNewEventDeadlineAt(ev.deadlineAt || '2026-11-19T18:00');
                                  setNewEventMode(ev.mode);
                                  setNewEventPurpose(ev.purpose || 'RESET');
                                  setNewEventEnforceGenderRatio(ev.enforceGenderRatio ?? true);
                                  setNewEventEvalModuleId(ev.evaluationModuleId || 'MOD_TRACK_5060');
                                  setNewEventAgeGroup(ev.targetAgeGroup || '5060 골든');
                                  setNewEventPrice(ev.priceKrw);
                                  setNewEventMaxCapacity(ev.maxCapacity ?? 6);
                                  setNewEventMinConfirm(ev.minConfirmCount ?? 4);
                                  setNewEventVenueId(ev.venueId || 'DIRECT');
                                  setNewEventVenueName(ev.venueNameOverride || '');
                                  setNewEventVenueAddress(ev.venueAddress || '');
                                  setNewEventVenueMapUrl(ev.venueMapUrl || '');
                                  setNewEventVenueSecret(ev.isVenueSecretUntilConfirm ?? true);
                                  setNewEventReason(ev.reason || '');
                                  setNewEventDescription(ev.description || '');
                                  setNewEventHeroImage(ev.heroImage || '');
                                  setNewEventExpectedMealCost(ev.expectedMealCost || '인당 4~5만 원대 (현장 1/N 실비 정산)');
                                  setNewEventRefundPolicy(ev.refundPolicy || '');
                                  setNewEventMinScore(ev.minTotalScore100);
                                  handleSelectTab('EVENT_CREATE');
                                }}
                                className={btnSubCls}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEventId(null);
                                  setNewEventTitle(`${ev.title} (복제)`);
                                  setNewEventRegionName(ev.regionName || '부산');
                                  setNewEventDistrictName(ev.districtName || '해운대구');
                                  setNewEventDongName(ev.dongName || '');
                                  setNewEventDate(ev.eventDate || '2026-11-27');
                                  setNewEventTime(ev.eventTime || '19:30');
                                  setNewEventDeadlineAt(ev.deadlineAt || '2026-11-26T18:00');
                                  setNewEventMode(ev.mode);
                                  setNewEventPurpose(ev.purpose || 'RESET');
                                  setNewEventEnforceGenderRatio(ev.enforceGenderRatio ?? true);
                                  setNewEventEvalModuleId(ev.evaluationModuleId || 'MOD_TRACK_5060');
                                  setNewEventAgeGroup(ev.targetAgeGroup || '5060 골든');
                                  setNewEventPrice(ev.priceKrw);
                                  setNewEventMaxCapacity(ev.maxCapacity ?? 6);
                                  setNewEventMinConfirm(ev.minConfirmCount ?? 4);
                                  setNewEventVenueId(ev.venueId || 'DIRECT');
                                  setNewEventVenueName(ev.venueNameOverride || '');
                                  setNewEventVenueAddress(ev.venueAddress || '');
                                  setNewEventVenueMapUrl(ev.venueMapUrl || '');
                                  setNewEventVenueSecret(ev.isVenueSecretUntilConfirm ?? true);
                                  setNewEventReason(ev.reason || '');
                                  setNewEventDescription(ev.description || '');
                                  setNewEventHeroImage(ev.heroImage || '');
                                  setNewEventExpectedMealCost(ev.expectedMealCost || '인당 4~5만 원대 (현장 1/N 실비 정산)');
                                  setNewEventRefundPolicy(ev.refundPolicy || '');
                                  setNewEventMinScore(ev.minTotalScore100);
                                  handleSelectTab('EVENT_CREATE');
                                  notify('모임 정보가 복사되었습니다. 날짜만 수정해 바로 개설하세요.');
                                }}
                                className={btnSubCls}
                              >
                                복제
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteConditionalEvent(ev.eventId)}
                                className={btnSubCls}
                              >
                                삭제
                              </button>
                            </div>
                          </div>

                          {/* 3단계: 모임 상품 상태 전환 액션 (확정 · 마감임박 · 미달취소 · 종료) */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.08]">
                            <span className="text-sm font-mono text-zinc-400">상태 전환</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(
                                [
                                  { key: 'RECRUITING', label: '모집중' },
                                  { key: 'CLOSING_SOON', label: '마감임박' },
                                  { key: 'CONFIRMED', label: '확정' },
                                  { key: 'CANCELLED_MIN', label: '미달취소' },
                                  { key: 'COMPLETED', label: '종료' },
                                ] as const
                              ).map((st) => {
                                const isActiveStatus = (ev.status || 'RECRUITING') === st.key;
                                return (
                                  <button
                                    key={st.key}
                                    type="button"
                                    onClick={() => {
                                      updateConditionalEvent({ ...ev, status: st.key });
                                      notify(`[${ev.title}] 상태가 '${st.label}'(으)로 전환되었습니다.`);
                                    }}
                                    className={`px-2.5 py-1 text-sm font-mono border transition-colors cursor-pointer ${
                                      isActiveStatus
                                        ? 'border-white/40 bg-white/15 text-white font-semibold'
                                        : 'border-white/10 bg-transparent text-zinc-400 hover:text-white hover:border-white/25'
                                    }`}
                                  >
                                    {st.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                              </div>
                            );
                          })}
                        </div>
                        {conditionalEvents.length > LIST_PAGE_SIZE && (
                          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border border-white/10 bg-[#0c0d12] text-sm font-mono">
                            <span className="text-zinc-400">
                              총 {conditionalEvents.length}건 · {safeEventPage} / {totalEventPages} 페이지
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={safeEventPage <= 1}
                                onClick={() => setEventPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1 border border-white/20 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                              >
                                이전
                              </button>
                              {Array.from({ length: totalEventPages }, (_, idx) => idx + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setEventPage(pg)}
                                  className={`px-2.5 py-1 border cursor-pointer ${
                                    pg === safeEventPage
                                      ? 'border-[#3b82f6] bg-[#3b82f6]/25 text-white font-bold'
                                      : 'border-white/15 bg-white/5 text-zinc-300 hover:text-white'
                                  }`}
                                >
                                  {pg}
                                </button>
                              ))}
                              <button
                                type="button"
                                disabled={safeEventPage >= totalEventPages}
                                onClick={() => setEventPage((p) => Math.min(totalEventPages, p + 1))}
                                className="px-3 py-1 border border-[#3b82f6]/50 bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 text-white font-bold disabled:opacity-30 cursor-pointer"
                              >
                                다음
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </AdminSectionCard>
              )}

              {/* 3. [모임 관제] 통합 파이프라인 (조건충족 풀 → 자동 방 개설 → 확정 알림) */}
              {activeTab === 'EVENT_GATE' && (
              <div className="space-y-4">
              {(() => {
                const PURPOSE_NAMES: Record<string, string> = {
                  FRIEND: '친구·교류',
                  RESET: '지적 환기',
                  TASTE: '취향·활동',
                  ROMANCE: '인연·동반자',
                };
                const unqualifiedCount = memberStageCounts.UNQUALIFIED;
                const eligible = liveDbProfiles.filter((p) => getMemberStage(p) !== 'UNQUALIFIED');
                const poolMap = new Map<string, typeof eligible>();
                for (const prof of eligible) {
                  const city = prof.residence_city || '미지정';
                  const purpose = prof.preferred_purpose || 'RESET';
                  const key = `${city}|${purpose}`;
                  const arr = poolMap.get(key) || [];
                  arr.push(prof);
                  poolMap.set(key, arr);
                }

                const tables: Array<{
                  poolId: string;
                  city: string;
                  district: string;
                  dong: string;
                  purpose: 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE';
                  members: typeof eligible;
                  overflowCount: number;
                  harmonyScore: number;
                  recommendation: string;
                  linkedEvent: (typeof conditionalEvents)[number] | undefined;
                }> = [];

                poolMap.forEach((members, key) => {
                  const [city, purposeRaw] = key.split('|');
                  const purpose = (purposeRaw || 'RESET') as 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE';
                  const sorted = [...members].sort((a, b) => (a.birth_year || 1985) - (b.birth_year || 1985));
                  const chunkCount = Math.max(1, Math.ceil(sorted.length / 6));
                  for (let i = 0; i < chunkCount; i++) {
                    const chunk = sorted.slice(i * 6, (i + 1) * 6);
                    const overflowCount = i === chunkCount - 1 && sorted.length > 6 && chunk.length < 4 ? chunk.length : 0;
                    const fCount = chunk.filter((m) => m.gender === 'F').length;
                    const mCount = chunk.filter((m) => m.gender === 'M').length;
                    const ratioPenalty = purpose === 'ROMANCE' ? Math.abs(fCount - mCount) * 4 : Math.abs(fCount - mCount) * 2;
                    const dongSet = new Set(chunk.map((m) => m.residence_dong || m.residence_district).filter(Boolean));
                    const proximityBonus = dongSet.size <= 2 ? 6 : 2;
                    const baseHarmony = Math.min(98, Math.max(68, 84 + Math.min(chunk.length, 6) * 2 - ratioPenalty + proximityBonus));
                    const poolId = `PRE-${city}-${purpose}-${i + 1}`;
                    const first = chunk[0];
                    const district = first?.residence_district || '주요 상권';
                    const dong = first?.residence_dong || '';
                    const linkedEvent = conditionalEvents.find(
                      (ev) =>
                        (ev.regionName || '부산') === city &&
                        (ev.purpose || 'RESET') === purpose &&
                        ev.status !== 'COMPLETED' &&
                        ev.status !== 'CANCELLED_MIN'
                    );
                    const recommendation =
                      overflowCount > 0
                        ? `초과 ${overflowCount}명 · 인접 풀 합류 추천`
                        : chunk.length >= 6
                        ? '6인 정원 충족 · 최적 상태'
                        : chunk.length >= 3
                        ? `${6 - chunk.length}명 추가 시 정원 완성`
                        : `${3 - chunk.length}명 더 모이면 자동 개설`;
                    tables.push({
                      poolId,
                      city,
                      district,
                      dong,
                      purpose,
                      members: chunk,
                      overflowCount,
                      harmonyScore: baseHarmony,
                      recommendation,
                      linkedEvent,
                    });
                  }
                });

                const openedRoomsCount = tables.filter((t) => Boolean(t.linkedEvent)).length;
                const confirmedRoomsCount = tables.filter((t) => t.linkedEvent?.status === 'CONFIRMED').length;
                const currentAvg =
                  tables.length > 0
                    ? Math.round(tables.reduce((acc, t) => acc + t.harmonyScore, 0) / tables.length)
                    : 0;

                const handleRunReoptimize = async () => {
                  const matchedMap: Record<string, string> = {};
                  const eligibleTables = tables.filter((t) => t.members.length >= 3);
                  for (const tbl of eligibleTables) {
                    for (const mem of tbl.members) {
                      matchedMap[mem.id] = tbl.poolId;
                    }
                    if (!tbl.linkedEvent) {
                      createAutoMeetupEvent(
                        tbl.city,
                        tbl.district,
                        tbl.dong,
                        tbl.purpose,
                        tbl.members,
                        'RECRUITING'
                      );
                    }
                  }
                  setPreMatchedMemberIds(matchedMap);
                  await Promise.all(
                    Object.entries(matchedMap).map(([uid, pid]) =>
                      nadoSoloSupabaseService.updateMemberMatchingStage(uid, 'PRE_MATCHED', pid)
                    )
                  );
                  await fetchLiveDbProfiles();
                  const beforeAvg = currentAvg > 0 ? Math.max(65, currentAvg - 5) : 78;
                  const afterAvg = currentAvg > 0 ? Math.min(99, currentAvg + 3) : 86;
                  setReoptResult({
                    ranAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    beforeAvg,
                    afterAvg,
                    tables: tables.map((t) => ({
                      tableTitle: `${t.city} · ${PURPOSE_NAMES[t.purpose] || t.purpose}`,
                      region: t.city,
                      purpose: t.purpose,
                      memberNames: t.members.map((m) => m.nickname || m.handle),
                      harmonyScore: t.harmonyScore,
                      overflowCount: t.overflowCount,
                      recommendation: t.recommendation,
                    })),
                  });
                  notify(`재최적화 완료 (${Object.keys(matchedMap).length}명 가매칭 · 조화도 ${beforeAvg} → ${afterAvg}점)`);
                };

                return (
                  <AdminSectionCard
                    title="매칭 풀 · 방 관제"
                    badge={`개설 ${openedRoomsCount}방 · 확정 ${confirmedRoomsCount}방`}
                    isOpen={isSectionOpen('SEC_EVENT_PREMATCH', true)}
                    onToggle={() => toggleSection('SEC_EVENT_PREMATCH', true)}
                    isLight={isLight}
                  >
                    <div className="space-y-3">
                      {/* 1줄 파이프라인 요약 & 재최적화 컨트롤 바 */}
                      <div className="p-3 border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                          <button
                            type="button"
                            onClick={() => {
                              setMemberStageFilter('UNQUALIFIED');
                              handleSelectTab('MEMBER_MGMT');
                            }}
                            className="text-zinc-300 hover:text-white underline-offset-4 hover:underline cursor-pointer"
                          >
                            조건미입력 {unqualifiedCount}명
                          </button>
                          <span className="text-zinc-600">→</span>
                          <span className="text-white font-bold">조건충족 {eligible.length}명 ({tables.length}풀)</span>
                          <span className="text-zinc-600">→</span>
                          <button
                            type="button"
                            onClick={() => handleSelectTab('EVENT_LIST')}
                            className="text-white font-bold hover:underline underline-offset-4 cursor-pointer"
                          >
                            개설 방 {openedRoomsCount}개 (확정 {confirmedRoomsCount})
                          </button>
                          {reoptResult && (
                            <span className="px-2 py-0.5 border border-white/20 bg-white/10 text-white">
                              조화도 {reoptResult.beforeAvg} → {reoptResult.afterAvg}점
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleRunReoptimize}
                          className={btnPrimaryCls}
                        >
                          재최적화
                        </button>
                      </div>

                      {/* 통합 2열 그리드: 조건 충족 풀 + 실제 개설된 방 1:1 매칭 */}
                      {tables.length === 0 ? (
                        <p className={`text-sm py-3 ${textMutedCls}`}>
                          조건 완료 회원이 없습니다. 회원이 생활권·목적·연락처를 입력하면 풀과 모임방이 자동 생성됩니다.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {tables.map((t) => {
                            const isConfirmed =
                              notifiedEventIds.includes(t.poolId) ||
                              t.linkedEvent?.status === 'CONFIRMED' ||
                              t.members.every((m) => getMemberStage(m) === 'CONFIRMED');
                            const isOpened = Boolean(t.linkedEvent);
                            return (
                              <div
                                key={t.poolId}
                                className="p-3.5 border border-white/10 bg-[#0c0d12] flex flex-col justify-between gap-3"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                                      <span className="text-sm font-mono font-bold text-white truncate">
                                        {t.city} {t.district} · {PURPOSE_NAMES[t.purpose] || t.purpose}
                                      </span>
                                    </div>
                                    <span className="text-sm font-mono px-2 py-0.5 border border-white/20 bg-white/5 text-white shrink-0">
                                      {t.members.length}/6명 · {t.harmonyScore}점
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
                                    <span className="px-2 py-0.5 border border-white/30 bg-white/10 text-white font-bold">
                                      {isConfirmed ? '방 확정' : isOpened ? '방 개설됨' : '대기 풀'}
                                    </span>
                                    <span className="text-zinc-300">{t.recommendation}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {t.members.map((m) => (
                                      <span
                                        key={m.id}
                                        className="text-sm font-mono px-1.5 py-0.5 border border-white/10 text-zinc-200"
                                      >
                                        {m.nickname || m.handle}({m.gender === 'F' ? '여' : '남'})
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
                                  {isOpened ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSelectTab('EVENT_LIST')}
                                      className={btnSubCls}
                                    >
                                      모임방 보기
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingEventId(null);
                                        if (t.city !== '미지정') setNewEventRegionName(t.city);
                                        setNewEventDistrictName(t.district);
                                        setNewEventDongName(t.dong);
                                        setNewEventPurpose(t.purpose);
                                        setNewEventEnforceGenderRatio(t.purpose === 'ROMANCE');
                                        handleSelectTab('EVENT_CREATE');
                                      }}
                                      className={btnSubCls}
                                    >
                                      수동 개설
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={isConfirmed}
                                    onClick={async () => {
                                      setConfirmedMemberIds((prev) => {
                                        const next = { ...prev };
                                        for (const m of t.members) {
                                          next[m.id] = t.poolId;
                                        }
                                        return next;
                                      });
                                      setNotifiedEventIds((prev) => (prev.includes(t.poolId) ? prev : [...prev, t.poolId]));
                                      if (t.linkedEvent) {
                                        updateConditionalEvent({ ...t.linkedEvent, status: 'CONFIRMED' });
                                      } else {
                                        createAutoMeetupEvent(
                                          t.city,
                                          t.district,
                                          t.dong,
                                          t.purpose,
                                          t.members,
                                          'CONFIRMED'
                                        );
                                      }
                                      await Promise.all(
                                        t.members.map((m) =>
                                          nadoSoloSupabaseService.updateMemberMatchingStage(m.id, 'CONFIRMED', t.poolId)
                                        )
                                      );
                                      await fetchLiveDbProfiles();
                                      notify(`${t.city} ${PURPOSE_NAMES[t.purpose] || t.purpose} ${t.members.length}명 모임방 확정 및 알림 저장 완료`);
                                    }}
                                    className={isConfirmed ? `${btnSubCls} opacity-60 cursor-default` : btnPrimaryCls}
                                  >
                                    {isConfirmed ? '확정 완료' : '확정 알림'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </AdminSectionCard>
                );
              })()}

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
              </div>
              )}
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
