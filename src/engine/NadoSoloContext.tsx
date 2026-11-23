'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { nadoSoloSupabaseService, DbProfile } from '@/lib/supabase/service';
import { buildMeetupSeoSlug } from '@/lib/seoSlug';
import { getAppConfig, saveAppConfig } from '@/lib/appConfigDb';
import {
  ADMIN_SESSION_STORAGE_KEY,
  filterMatchingEligibleProfiles,
  isAdminAccount,
} from '@/modules/identity';
import {
  ADAPTIVE_DINING_PLAYBOOK,
  CityLocaleConfig,
  ConditionalEventItem,
  CriterionCode,
  DEFAULT_SURVEY_QUESTIONS,
  DietaryRestriction,
  DynamicPriceQuote,
  EvaluationCriterionDef,
  EvaluationMatrixEngine,
  Gender,
  GranularBadgeDef,
  GroupingEngine,
  GrowthCoachingEngine,
  GrowthCoachingReport,
  GrowthPointTag,
  INITIAL_CONDITIONAL_EVENTS,
  INITIAL_EVALUATION_CRITERIA,
  INITIAL_GRANULAR_BADGES,
  INITIAL_GROWTH_SNAPSHOTS,
  INITIAL_MAJOR_DOMAINS,
  INITIAL_MATRIX_EVALUATIONS,
  INITIAL_PARTICIPANTS,
  INITIAL_PEER_FEEDBACKS,
  INITIAL_REGION_DISTRICTS,
  INITIAL_SERVICE_PROCESS_MODULES,
  INITIAL_SUB_ELEMENTS,
  InterestTag,
  LanguageCode,
  LocalePolicyEngine,
  LoggedInUser,
  MajorDomainCode,
  MajorDomainDef,
  MatchedTable,
  MatrixEvaluationRecord,
  MirrorDiagnosisResult,
  MirrorEngine,
  MutualMatchEngine,
  MutualMatchPair,
  ParticipantProfile,
  PartnerVenue,
  PeerMirrorFeedback,
  PersonalDossierReport,
  PlaybookCard,
  PlaybookEngine,
  PositiveCharmTag,
  ProfilingEngine,
  RegionDistrictItem,
  SAMPLE_PARTNER_VENUES,
  SeatAssignment,
  SecretVote,
  ServiceProcessModuleConfig,
  SocialMode,
  STANDBY_WAITLIST_POOL,
  SubElementDef,
  SurveyAnswer,
  TraitVector,
  VenueAndYieldEngine,
  VoteCategory,
  CoreRunner,
  EvaluationRegistry,
  PersonalSocialDossier,
  ParticipantObservationRecord,
  FullJourneyAuditReport,
  evaluateProcessGate,
  evaluateFullJourney,
  ProcessStepId,
  ProcessGateResult,
  UserContextSnapshot,
} from './index';

export type CityKey =
  | 'BUSAN_HAEUNDAE'
  | 'BUSAN_GWANGAN'
  | 'BUSAN_JEONPO'
  | 'BUSAN_CENTUM'
  | 'BUSAN_DONGNAE'
  | 'SEOUL_SEONGSU'
  | 'SEOUL_GANGNAM'
  | 'TOKYO_SHIBUYA'
  | 'NYC_SOHO';

export interface CmsPageConfig {
  pageId: string;
  route: string;
  title: string;
  badgeText: string;
  headline: string;
  subheadline: string;
  heroImage: string;
  status: 'PUBLISHED' | 'MAINTENANCE';
}

export interface CmsAtmosphereItem {
  id: string;
  mode: SocialMode;
  badge: string;
  badgeColor: string;
  icon: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  tags: string[];
}

export interface CmsStepItem {
  id: string;
  stepNum: string;
  title: string;
  desc: string;
}

export interface CmsMirrorQuoteItem {
  id: string;
  quoteText: string;
  authorLabel: string;
}

const INITIAL_CMS_PAGES: CmsPageConfig[] = [
  {
    pageId: 'PAGE_HOME',
    route: '/',
    title: '메인 홈',
    badgeText: '매주 금요일 밤, 검증된 싱글들의 프라이빗 디너 클럽',
    headline: '매주 금요일 저녁 7시, 결이 맞는 낯선 5명과의 저녁 식사',
    subheadline:
      '끝없는 스와이프와 어색한 소개팅 대신, 성향이 조화로운 6명이 와인과 함께 마주 앉습니다.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuADjfVgvn4klh4VubiVJmy_CPl-l2OBim99Lx0OM0H_DtK-QqALTh_v-RLCqyF9bD5vfZRVl_04kBlsLiguM538bZlR1JPSnkgis7a48NWmqPn3DArA-XUpTHPtnfBjldXbp_2CnkX6JHQCRu0epB1S4S0O8zmjCm_EmsN-8XT5B38ZrQKjurB3kMJyUc3KyFs8StfLGhKCDKkSnp5M-I7Dhj3bNn4cjBCb-E2IYU4',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_AUTH',
    route: '/auth',
    title: '로그인 · 회원가입',
    badgeText: 'ACCOUNT ACCESS',
    headline: '계정 로그인 및 @핸들 회원가입',
    subheadline: '고유 @핸들 아이디로 나도솔로 계정을 생성하거나 로그인하세요.',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_DASHBOARD',
    route: '/dashboard',
    title: '이용자 대시보드',
    badgeText: 'MEMBER WORKSPACE',
    headline: '프로필 · 지역 · 신청 · 대화카드 · 평가 · 코칭리포트',
    subheadline:
      '단계별 단일 모듈로 모임 참여와 개인 마스터 프로파일을 관리합니다.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuADjfVgvn4klh4VubiVJmy_CPl-l2OBim99Lx0OM0H_DtK-QqALTh_v-RLCqyF9bD5vfZRVl_04kBlsLiguM538bZlR1JPSnkgis7a48NWmqPn3DArA-XUpTHPtnfBjldXbp_2CnkX6JHQCRu0epB1S4S0O8zmjCm_EmsN-8XT5B38ZrQKjurB3kMJyUc3KyFs8StfLGhKCDKkSnp5M-I7Dhj3bNn4cjBCb-E2IYU4',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_MIRROR',
    route: '/mirror',
    title: '개인화 코칭 리포트',
    badgeText: '5×5×5 PERSONAL DOSSIER REPORT',
    headline: '동석자 5명이 기록한 당신의 100점 정밀 코칭 프로파일',
    subheadline:
      '외모 · 스타일 · 음성 · 대화 · 매너 5대 영역과 정돈 · 조화 · 센스 · 안정 · 호감 5대 기준으로 분석한 독점 코칭 자산입니다.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUJfjbffBQl2kZ4567cjeJkI4qL95CmH-zCAj3cePtOSvSqDfzkL1qluQx--znKzww8gszKU3Z_1brYJye92iBMCQZY_9ItYYmVYLLGt3hgWTGQzOkVyMHfX2UlAzEiGEayoTPSjDovFQaRYy2qv8svCeZSeNXqL6J78I4CFQEIOtldn_eMQsMtYYwdpyL5ivD6UhRsDlPTGwfWilvlfhyfPzBdgw2DUsUSwKufSY',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_BUSAN',
    route: '/busan',
    title: '부산 다이닝',
    badgeText: 'BUSAN PRIVATE DINING',
    headline: '부산 해운대·광안·전포 프라이빗 6인 식탁',
    subheadline: '기존 다크 럭셔리 부산 다이닝 예약(레퍼런스 A안)',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_MEETUP',
    route: '/meetup',
    title: '블라인드 슬롯 예약',
    badgeText: 'BLIND SLOT BOOKING',
    headline: '도시와 요일만 고르면 나머지는 매칭 엔진이 설계합니다',
    subheadline: 'D-1 19:00 식당·동석자 비공개 공개, 48시간 전 무료 취소/이월',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_LOCATIONS',
    route: '/locations',
    title: '운영 도시',
    badgeText: 'CITIES & DISTRICTS',
    headline: '서울 · 부산 핵심 생활권 소셜 다이닝',
    subheadline: '성수·강남·해운대·광안 등 검증된 제휴 비스트로에서 만납니다.',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_PRICING',
    route: '/pricing',
    title: '요금 및 참가권',
    badgeText: 'PRICING & TICKETS',
    headline: '다면 관찰 엔진 라이선스 ₩30,000',
    subheadline: '식음료 비용은 현장에서 1/N 직접 결제하며 수수료를 받지 않습니다.',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_ABOUT',
    route: '/about',
    title: '브랜드 소개',
    badgeText: 'ABOUT NADOSOLO',
    headline: '그렇다, 인간은 누구나 솔로다',
    subheadline: '타인의 시선으로 나의 소통 역량을 발견하는 소셜 메타인지 플랫폼',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_AFFILIATE',
    route: '/affiliate',
    title: '어필리에이트',
    badgeText: 'AFFILIATE PARTNER',
    headline: '나도솔로 프렌즈 제휴 파트너 프로그램',
    subheadline: '전용 추천 코드 발급 및 제휴 수익 공유',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_PARTNERS',
    route: '/biz?tab=signup',
    title: '제휴 매장 입점',
    badgeText: 'MERCHANT',
    headline: '마케팅 비용 0원 · 매칭 테이블 송객',
    subheadline: '당일 1/N 매장 직접 결제, 식음료 수수료 없음',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_SAFETY',
    route: '/safety',
    title: '안전 · 에티켓 규율',
    badgeText: 'SAFETY & TRUST',
    headline: '절대 익명성 · 영구 재매칭 차단 · 노쇼 방지 규율',
    subheadline: '건강하고 안전한 6인 테이블을 위한 5대 보호 장치',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_GUIDE',
    route: '/guide',
    title: '이용 가이드',
    badgeText: 'USER GUIDE',
    headline: '나도솔로 다이닝 가이드 & 에티켓 헌장',
    subheadline: '퀴즈부터 D-1 Reveal, 1/N 정산, 상호 평가까지 전 과정 안내',
    heroImage: '',
    status: 'PUBLISHED',
  },
  {
    pageId: 'PAGE_CHECKLIST',
    route: '/checklist',
    title: '성향 · 소통 체크리스트',
    badgeText: 'PERSONALITY QUIZ',
    headline: '나와 결이 맞는 6인 테이블을 찾는 성향 진단',
    subheadline: '15문항(A안) 또는 19문항(B안) 기반 동적 매칭 프로파일 생성',
    heroImage: '',
    status: 'PUBLISHED',
  },
];

const INITIAL_CMS_ATMOSPHERES: CmsAtmosphereItem[] = [
  {
    id: 'ATM_ROMANCE',
    mode: 'ROMANCE',
    badge: 'ROMANTIC CURATED TABLE',
    badgeColor: 'bg-primary-fixed text-primary',
    icon: 'favorite',
    title: '설렘 로맨스 3:3 다이닝',
    subtitle: '남성 3명, 여성 3명 • 나이 및 대화 케미스트리 맞춤',
    desc: '1:1 소개팅의 어색함 없이, 촛불이 켜진 프라이빗 비스트로에서 6명의 검증된 싱글이 자연스러운 설렘과 대화를 나눕니다.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCskWVY7k2IjTQQHCQBeOFe4p56ikZVwshmqk5tHalN8XoynNCoXq3XZltqeOFe9yjPDJdEriQ7N0NVnsc6I_u3H5SqaX-wY8LIEGN4aQSDC5xeQqZegqkHayldA7S1IzFkpGKykppzbLM1hBZlHWCox7kY0zlHzTl25YKN4LrdiCHiz5aJ7QnbcLP7Dw8NwADV1t2w5-oeA3zviqu8Iaktsh716rVR5Rc9eJ4IKEE',
    tags: ['캔들라이트 비스트로', '28–36세 연령대 맞춤', '남녀 3:3 고정'],
  },
  {
    id: 'ATM_PLATONIC',
    mode: 'PLATONIC',
    badge: 'SOCIAL WARMTH',
    badgeColor: 'bg-secondary-fixed text-secondary',
    icon: 'forum',
    title: '플라토닉 동네 친구 다이닝',
    subtitle: '열린 마음의 로컬 소셜 다이닝',
    desc: '연애 부담은 덜어내고, 동네 이웃들과 맛있는 음식을 나누며 진짜 친구를 만듭니다.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA0IGtq9pAsly2ttJLA7Iy0xBbLvvpRtJfNQwwpiaFReBPIfAc8kgrQzLTbGeAmR0rPz05p-K2mjOGZr67ldDYL18L46--ADi5Lmj-wbZxYLoEK3z7fwnrWKb6OnwLKLw6JuROAoWTqsMeSZZpUAZuGjJw1EBfOp5jbpfU4JeleLt5xnsu1I8EUy7WY4E8HLsGXXQZiwXC4X_yArzUp_HN7_yeEm0jtEzQjU5q0A-M',
    tags: ['코지 와인바', '크리에이티브 & IT', '소셜 다이닝'],
  },
  {
    id: 'ATM_THEME',
    mode: 'THEME',
    badge: 'GASTRONOMY & INTIMACY',
    badgeColor: 'bg-tertiary-fixed text-tertiary',
    icon: 'wine_bar',
    title: '와인 & 미식 딥토크',
    subtitle: '미식 소셜 • 내추럴 와인 페어링 & 가치관 대화',
    desc: '셰프의 계절 요리와 내추럴 와인을 곁들이며, 일상에서 쉽게 나누지 못했던 깊이 있는 질문 카드로 밤을 채웁니다.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD-tmtY7XKJE4kOUE02AtAu9CnWgDlNzZAmC2Ty5YsBxraXjjcSN3XjiGAN_4XyB2Hy1S1R4o0dMJLBkqmQAHzJh4-PNkUAU2tNahZ7K7GzGO5ZTttcR-J4HZ0v55tLvX2cgnwcztYEgyi5DC385diQBFFgCvZ1oWoYNuYOP3JvUJiee40a-YA5eA0Tq-ZDGXtmpi_vsOOCdf0vEwPo7rYBAxVFFE7UF_hcrDpYAhk',
    tags: ['셰프 카운터', '내추럴 와인 페어링', '깊이 있는 대화카드'],
  },
];

const INITIAL_CMS_STEPS: CmsStepItem[] = [
  {
    id: 'STEP_1',
    stepNum: '1',
    title: '@핸들 가입 및 기본프로필 설정',
    desc: '간편하게 @핸들 계정을 만들고 희망 지역과 기본 프로필을 등록합니다.',
  },
  {
    id: 'STEP_2',
    stepNum: '2',
    title: '소셜 다이닝 & 양방향 대화카드',
    desc: '배정된 제휴 레스토랑에서 라운드별 대화카드로 깊이 있는 대화를 나눕니다.',
  },
  {
    id: 'STEP_3',
    stepNum: '3',
    title: '5×5×5 100점 코칭 프로파일 & 1:1 연결',
    desc: '동석자 5인의 정밀 평가로 완성된 나만의 100점 코칭 리포트와 세분화 뱃지, 후속 1:1 매칭을 경험하세요.',
  },
];

const INITIAL_CMS_MIRROR_QUOTES: CmsMirrorQuoteItem[] = [
  {
    id: 'MQ_1',
    quoteText:
      '눈을 맞추며 웃어주셔서 테이블 전체가 금방 편안해졌어요. 와인이 나왔을 때 모두가 자연스럽게 속마음을 털어놓게 만들어주셨습니다.',
    authorLabel: '2번 좌석 이성 동석자 (한남동 · 건축디자이너)',
  },
  {
    id: 'MQ_2',
    quoteText:
      '음색과 경청 태도는 만점이었으나, 상의 컬러 톤만 조금 더 밝게 매치하시면 첫인상 호감도가 훨씬 높아질 것 같아요.',
    authorLabel: '5번 좌석 이성 동석자 (성수동 · 브랜드 디렉터)',
  },
];

interface NadoSoloEngineContextValue {
  // 인증 및 회원 상태
  currentUser: LoggedInUser | null;
  adminOriginUser: LoggedInUser | null;
  isSessionReady: boolean;
  isImpersonating: boolean;
  startAdminImpersonation: (targetUserId: string) => void;
  stopAdminImpersonation: () => void;
  loginAsUser: (user: LoggedInUser) => void;
  updateCurrentUser: (patch: Partial<LoggedInUser>) => void;
  logout: () => void;

  // 글로벌 언어 및 선택 상태
  lang: 'ko' | 'en';
  setLang: React.Dispatch<React.SetStateAction<'ko' | 'en'>>;
  selectedCity: CityKey;
  setSelectedCity: (city: CityKey) => void;
  selectedMode: SocialMode;
  setSelectedMode: (mode: SocialMode) => void;
  preferredLang: LanguageCode;
  setPreferredLang: (l: LanguageCode) => void;
  dietary: DietaryRestriction;
  setDietary: (d: DietaryRestriction) => void;
  interests: InterestTag[];
  toggleInterest: (tag: InterestTag) => void;
  surveyAnswers: Record<string, string>;
  setSurveyAnswer: (questionId: string, optionId: string) => void;
  saveSurveyAnswers: (answers: Record<string, string>) => void;
  isSeatReserved: boolean;
  setIsSeatReserved: (v: boolean) => void;

  // [신규] 서비스 프로세스 모듈 제어 (P01~P10 ON/OFF)
  processModules: ServiceProcessModuleConfig[];
  toggleProcessModule: (processId: string) => void;

  // [신규] 5×5×5 정규화 평가 매트릭스 엔진 & 개인 마스터 프로파일 (Dossier)
  majorDomains: MajorDomainDef[];
  evaluationCriteria: EvaluationCriterionDef[];
  subElements: SubElementDef[];
  toggleSubElementActive: (subId: string) => void;
  updateSubElement: (item: SubElementDef) => void;
  selfDomainScores100: Record<MajorDomainCode, number>;
  setSelfDomainScore100: (code: MajorDomainCode, score100: number) => void;
  matrixEvaluations: MatrixEvaluationRecord[];
  submitMatrixEvaluation: (
    toUserId: string,
    subElementId: string,
    scores: Record<CriterionCode, number>
  ) => void;
  myPersonalDossier: PersonalDossierReport;
  getPersonalDossierForUser: (userId: string) => PersonalDossierReport;

  // [신규 헌법 기반] 마이크로 플러그인 평가 엔진 및 상호주의 해금 소셜 프로필
  participantObservations: ParticipantObservationRecord[];
  submitParticipantObservation: (
    toUserId: string,
    moduleId: string,
    elementId: string,
    scoreStep: 1 | 2 | 3 | 4 | 5
  ) => void;
  completedEvalUserIds: string[];
  personalSocialDossier: PersonalSocialDossier;
  fullJourneyAudit: FullJourneyAuditReport;

  // [신규] 세분화 뱃지 도감 엔진
  granularBadges: GranularBadgeDef[];
  addGranularBadge: (b: GranularBadgeDef) => void;
  updateGranularBadge: (b: GranularBadgeDef) => void;
  deleteGranularBadge: (badgeId: string) => void;

  // [신규] 지역 · 상권 엔진
  regionDistricts: RegionDistrictItem[];
  selectedDistrictId: string;
  setSelectedDistrictId: (id: string) => void;
  addRegionDistrict: (item: RegionDistrictItem) => void;
  updateRegionDistrict: (item: RegionDistrictItem) => void;
  deleteRegionDistrict: (id: string) => void;

  // [신규] 조건부 모임 게이트 엔진
  conditionalEvents: ConditionalEventItem[];
  appliedEventIds: string[];
  applyForConditionalEvent: (eventId: string) => { ok: boolean; message: string };
  addConditionalEvent: (ev: ConditionalEventItem) => void;
  updateConditionalEvent: (ev: ConditionalEventItem) => void;
  deleteConditionalEvent: (eventId: string) => void;

  // Domain A: 기존 호환
  selfVector: TraitVector;
  selfPersonaTitle: { ko: string; en: string; descKo: string; descEn: string };
  mirrorPersonaTitle: { ko: string; en: string; descKo: string; descEn: string };
  mirrorDiagnosis: MirrorDiagnosisResult;
  coachingReport: GrowthCoachingReport;
  peerFeedbacks: PeerMirrorFeedback[];
  addPeerFeedbackSimulation: (
    charm: PositiveCharmTag,
    growthTip: GrowthPointTag,
    observedTalkLead: number
  ) => void;
  isProfileLevelUpApproved: boolean;
  approveProfileLevelUp: () => void;

  // Domain B: 기존 호환 + CRUD
  cityConfig: CityLocaleConfig;
  dynamicQuote: DynamicPriceQuote;
  matchedTables: MatchedTable[];
  activeTable: MatchedTable;
  participantsPool: ParticipantProfile[];
  standbyPool: ParticipantProfile[];
  partnerVenues: PartnerVenue[];
  standbyReplacementLog: string | null;
  triggerNoShowAndStandbyRecovery: () => void;
  resetParticipantsPool: () => void;
  adjustTrustScore: (userId: string, delta: number) => void;
  addParticipant: (p: ParticipantProfile) => void;
  updateParticipant: (p: ParticipantProfile) => void;
  deleteParticipant: (userId: string) => void;
  addPartnerVenue: (v: PartnerVenue) => void;
  updatePartnerVenue: (v: PartnerVenue) => void;
  deletePartnerVenue: (venueId: string) => void;

  // Domain C: 대화카드 + 투표
  isSecondHalfRotated: boolean;
  setIsSecondHalfRotated: React.Dispatch<React.SetStateAction<boolean>>;
  currentSeats: SeatAssignment[];
  activeStageCards: PlaybookCard[];
  addPlaybookCard: (card: PlaybookCard) => void;
  updatePlaybookCard: (card: PlaybookCard) => void;
  deletePlaybookCard: (cardId: string) => void;
  myVoteTargetId: string;
  setMyVoteTargetId: (userId: string) => void;
  myVoteCategory: VoteCategory;
  setMyVoteCategory: (cat: VoteCategory) => void;
  isMidnightPassed: boolean;
  setIsMidnightPassed: React.Dispatch<React.SetStateAction<boolean>>;
  allMutualMatches: MutualMatchPair[];
  visibleMatchesForMe: MutualMatchPair[];
  isVipUnlockedForMe: boolean;

  // CMS 페이지 관리
  cmsPages: CmsPageConfig[];
  updateCmsPage: (page: CmsPageConfig) => void;
  addCmsPage: (page: CmsPageConfig) => void;
  deleteCmsPage: (pageId: string) => void;

  cmsAtmospheres: CmsAtmosphereItem[];
  addCmsAtmosphere: (item: CmsAtmosphereItem) => void;
  updateCmsAtmosphere: (item: CmsAtmosphereItem) => void;
  deleteCmsAtmosphere: (id: string) => void;

  cmsSteps: CmsStepItem[];
  addCmsStep: (item: CmsStepItem) => void;
  updateCmsStep: (item: CmsStepItem) => void;
  deleteCmsStep: (id: string) => void;

  cmsMirrorQuotes: CmsMirrorQuoteItem[];
  addCmsMirrorQuote: (item: CmsMirrorQuoteItem) => void;
  updateCmsMirrorQuote: (item: CmsMirrorQuoteItem) => void;
  deleteCmsMirrorQuote: (id: string) => void;

  // [동적 프로세스 게이트 엔진] 1~3단계 프로세스 선행 조건 & 진행 상태 추적
  userJourney: ReturnType<typeof evaluateFullJourney>;
  evaluateGate: (stepId: ProcessStepId) => ProcessGateResult;
}

const NadoSoloContext = createContext<NadoSoloEngineContextValue | null>(null);

function mapDbProfileToParticipant(p: DbProfile): ParticipantProfile {
  let mappedCity = 'BUSAN_JEONPO';
  if (p.residence_district) {
    if (p.residence_district.includes('해운대')) mappedCity = 'BUSAN_HAEUNDAE';
    else if (p.residence_district.includes('광안') || p.residence_district.includes('수영')) mappedCity = 'BUSAN_GWANGAN';
    else if (p.residence_district.includes('전포') || p.residence_district.includes('부산진') || p.residence_district.includes('서면')) mappedCity = 'BUSAN_JEONPO';
    else if (p.residence_district.includes('성수') || p.residence_district.includes('성동')) mappedCity = 'SEOUL_SEONGSU';
    else if (p.residence_district.includes('강남')) mappedCity = 'SEOUL_GANGNAM';
  }

  return {
    userId: p.id,
    nickname: p.nickname,
    gender: p.gender,
    birthYear: p.birth_year,
    cityCode: mappedCity,
    preferredMode: 'ROMANCE',
    languages: { ko: 'NATIVE' },
    preferredTableLanguage: 'ko',
    budgetTier: '$$',
    dietary: p.dietary ? [p.dietary as DietaryRestriction] : ['NONE'],
    interests: (p.interests && p.interests.length > 0 ? (p.interests as InterestTag[]) : ['WINE', 'COOKING']),
    selfVector: {
      extroversion: 0.7,
      talkLead: 0.6,
      lifestyleActive: 0.8,
      romanceIntent: 0.8,
      alcoholPreference: 0.7,
    },
    trustScore: 95,
    verified: true,
  };
}

export function NadoSoloProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [adminOriginUser, setAdminOriginUser] = useState<LoggedInUser | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [selectedCity, setSelectedCity] = useState<CityKey>('BUSAN_JEONPO');
  const [selectedMode, setSelectedMode] = useState<SocialMode>('ROMANCE');
  const [preferredLang, setPreferredLang] = useState<LanguageCode>('ko');
  const [dietary, setDietary] = useState<DietaryRestriction>('NONE');
  const [interests, setInterests] = useState<InterestTag[]>(['WINE', 'COOKING']);

  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [isSeatReserved, setIsSeatReserved] = useState<boolean>(false);

  // [신규] 프로세스 모듈 상태
  const [processModules, setProcessModules] = useState<
    ServiceProcessModuleConfig[]
  >(INITIAL_SERVICE_PROCESS_MODULES);

  // [신규] 5×5×5 평가 매트릭스 상태
  const [majorDomains] = useState<MajorDomainDef[]>(INITIAL_MAJOR_DOMAINS);
  const [evaluationCriteria] = useState<EvaluationCriterionDef[]>(
    INITIAL_EVALUATION_CRITERIA
  );
  const [subElements, setSubElements] =
    useState<SubElementDef[]>(INITIAL_SUB_ELEMENTS);
  const [selfDomainScores100, setSelfDomainScores100] = useState<
    Record<MajorDomainCode, number>
  >({
    APPEARANCE: 80,
    STYLE: 84,
    VOICE: 76,
    CONVERSATION: 72,
    MANNER: 88,
  });
  const [matrixEvaluations, setMatrixEvaluations] = useState<
    MatrixEvaluationRecord[]
  >(INITIAL_MATRIX_EVALUATIONS);

  // [신규] 세분화 뱃지 도감 상태
  const [granularBadges, setGranularBadges] = useState<GranularBadgeDef[]>(
    INITIAL_GRANULAR_BADGES
  );

  // [신규] 지역·상권 상태
  const [regionDistricts, setRegionDistricts] = useState<RegionDistrictItem[]>(
    INITIAL_REGION_DISTRICTS
  );
  const [selectedDistrictId, setSelectedDistrictId] =
    useState<string>('DIST_JEONPO');

  // [신규] 조건부 모임 상태
  const [conditionalEvents, setConditionalEvents] = useState<
    ConditionalEventItem[]
  >(INITIAL_CONDITIONAL_EVENTS);
  const [appliedEventIds, setAppliedEventIds] = useState<string[]>([
    'EVT_SEONGSU_ROMANCE',
  ]);

  const [peerFeedbacks, setPeerFeedbacks] = useState<PeerMirrorFeedback[]>(
    INITIAL_PEER_FEEDBACKS
  );
  const [isProfileLevelUpApproved, setIsProfileLevelUpApproved] =
    useState<boolean>(false);

  const [participantsPool, setParticipantsPool] = useState<ParticipantProfile[]>(
    INITIAL_PARTICIPANTS
  );
  const [partnerVenues, setPartnerVenues] = useState<PartnerVenue[]>(
    SAMPLE_PARTNER_VENUES
  );

  useEffect(() => {
    getAppConfig<PartnerVenue[]>('partner_venues', 'nadosolo_partner_venues_v1', SAMPLE_PARTNER_VENUES).then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setPartnerVenues(list);
      }
    });
  }, []);
  const [standbyReplacementLog, setStandbyReplacementLog] = useState<
    string | null
  >(null);

  const [isSecondHalfRotated, setIsSecondHalfRotated] =
    useState<boolean>(false);
  const [myVoteTargetId, setMyVoteTargetId] = useState<string>('');
  const [myVoteCategory, setMyVoteCategory] = useState<VoteCategory>('ROMANCE');
  const [isMidnightPassed, setIsMidnightPassed] = useState<boolean>(true);

  // CMS 관리 상태
  const [cmsPages, setCmsPages] = useState<CmsPageConfig[]>(INITIAL_CMS_PAGES);

  useEffect(() => {
    getAppConfig<CmsPageConfig[]>('cms_pages', 'nadosolo_cms_pages_v1', INITIAL_CMS_PAGES).then((saved) => {
      if (Array.isArray(saved) && saved.length > 0) {
        const savedMap = new Map(saved.map((p) => [p.pageId, p]));
        const merged = INITIAL_CMS_PAGES.map((def) => savedMap.get(def.pageId) ?? def);
        const extras = saved.filter((p) => !INITIAL_CMS_PAGES.some((d) => d.pageId === p.pageId));
        setCmsPages([...merged, ...extras]);
      }
    });
  }, []);
  const [cmsAtmospheres, setCmsAtmospheres] = useState<CmsAtmosphereItem[]>(
    INITIAL_CMS_ATMOSPHERES
  );
  const [cmsSteps, setCmsSteps] = useState<CmsStepItem[]>(INITIAL_CMS_STEPS);
  const [cmsMirrorQuotes, setCmsMirrorQuotes] = useState<CmsMirrorQuoteItem[]>(
    INITIAL_CMS_MIRROR_QUOTES
  );

  const initialCards = useMemo(() => {
    const all: PlaybookCard[] = [];
    ADAPTIVE_DINING_PLAYBOOK.stages.forEach((st) => {
      if (st.cards) all.push(...st.cards);
    });
    return all;
  }, []);
  const [customCards, setCustomCards] = useState<PlaybookCard[]>(initialCards);

  // [Supabase 실시간 서버 데이터 및 세션 복원]
  useEffect(() => {
    let isMounted = true;
    async function initSupabaseData() {
      try {
        // 1. LocalStorage에서 저장된 로그인 유저 복원
        let localUser: LoggedInUser | null = null;
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('nadosolo_current_user');
          if (saved) {
            try {
              localUser = JSON.parse(saved);
              if (localUser && isMounted) {
                setCurrentUser(localUser);
              }
            } catch (e) {
              console.warn('[LocalStorage] parse error:', e);
            }
          }

          // 관리자 뷰어 모드 백업 세션 복원
          let adminOrigin: LoggedInUser | null = null;
          const savedAdmin = localStorage.getItem('nadosolo_admin_origin');
          if (savedAdmin) {
            try {
              adminOrigin = JSON.parse(savedAdmin);
            } catch (e) {
              console.warn('[LocalStorage] parse admin error:', e);
            }
          }

          if (adminOrigin) {
            if (localUser?.role === 'ADMIN') {
              // 이미 관리자 세션이면 남은 열람 백업은 무효 데이터이므로 폐기
              adminOrigin = null;
              localStorage.removeItem('nadosolo_admin_origin');
            } else if (window.location.pathname.startsWith('/admin')) {
              // /admin 진입 시 회원 열람 세션이 남아 있으면 즉시 관리자 세션으로 복원
              localUser = adminOrigin;
              adminOrigin = null;
              localStorage.setItem('nadosolo_current_user', JSON.stringify(localUser));
              localStorage.removeItem('nadosolo_admin_origin');
              if (isMounted) setCurrentUser(localUser);
            }
          } else if (!localUser && window.location.pathname.startsWith('/admin')) {
            const savedAdminSession = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
            if (savedAdminSession) {
              try {
                localUser = JSON.parse(savedAdminSession);
                if (localUser && isMounted) setCurrentUser(localUser);
              } catch {}
            }
          }
          if (isMounted) setAdminOriginUser(adminOrigin);
        }

        // 세션 복원 완료 (이 시점 이전에는 관리자/회원 가드 화면을 그리지 않는다)
        if (isMounted) setIsSessionReady(true);

        // [SSOT] Supabase 라이브 DB 전체 회원 + 모임 상품 실시간 로드 (이중 목업 완전 배제)
        try {
          const [allDbProfiles, allDbEvents] = await Promise.all([
            nadoSoloSupabaseService.getAllProfiles(),
            nadoSoloSupabaseService.getEvents(),
          ]);
          if (isMounted && allDbProfiles && allDbProfiles.length > 0) {
            setParticipantsPool(
              filterMatchingEligibleProfiles(allDbProfiles).map(mapDbProfileToParticipant)
            );
          }
          if (isMounted && allDbEvents && allDbEvents.length > 0) {
            setConditionalEvents(allDbEvents);
            try {
              localStorage.setItem('nadosolo_conditional_events_v1', JSON.stringify(allDbEvents));
            } catch {}
          } else if (isMounted) {
            let restored: ConditionalEventItem[] | null = null;
            try {
              const rawSaved = localStorage.getItem('nadosolo_conditional_events_v1');
              if (rawSaved) {
                const parsed = JSON.parse(rawSaved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  restored = parsed;
                }
              }
            } catch {}
            if (restored) {
              const migrated = restored.map((ev) =>
                ev.eventId.startsWith('EVT_AUTO_') || /^[a-z0-9-]+$/.test(ev.eventId)
                  ? { ...ev, eventId: buildMeetupSeoSlug(ev.regionName, ev.districtName, ev.purpose) }
                  : ev
              );
              setConditionalEvents(migrated);
            } else if (allDbProfiles && allDbProfiles.length > 0) {
              // meetups 테이블 미생성 시에도 실서버 조건 충족(3명+) 풀 기반 자동 개설 모임 복원
              const PURPOSE_NAMES: Record<string, string> = {
                FRIEND: '친구·교류',
                RESET: '지적 환기',
                TASTE: '취향·활동',
                ROMANCE: '인연·동반자',
              };
              const groups = new Map<string, typeof allDbProfiles>();
              for (const p of allDbProfiles) {
                const hasZone = Boolean(p.residence_city?.trim() && p.residence_district?.trim());
                const hasPhone = Boolean(p.phone && p.phone.trim() !== '' && p.phone !== '010-0000-0000');
                const hasPurpose = Boolean(p.preferred_purpose);
                if (!hasZone || !hasPhone || !hasPurpose) continue;
                const key = `${p.residence_city}|${p.preferred_purpose}`;
                const arr = groups.get(key) || [];
                arr.push(p);
                groups.set(key, arr);
              }
              const autoEvents: ConditionalEventItem[] = [];
              groups.forEach((members, key) => {
                if (members.length < 3) return;
                const [city, purposeRaw] = key.split('|');
                const purpose = (purposeRaw || 'RESET') as 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE';
                const first = members[0];
                const allConfirmed = members.every((m) => m.matching_stage === 'CONFIRMED');
                const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
                autoEvents.push({
                  eventId: buildMeetupSeoSlug(city, first.residence_district || '주요 상권', purpose),
                  title: `[${city} ${first.residence_district || '주요 상권'}] ${PURPOSE_NAMES[purpose] || purpose} 프라이빗 다이닝`,
                  districtId: `DIST_AUTO_${city}`,
                  regionName: city,
                  districtName: first.residence_district || '주요 상권',
                  dongName: first.residence_dong || undefined,
                  venueId: 'DIRECT',
                  dateText: `${dateStr} 19:30`,
                  eventDate: dateStr,
                  eventTime: '19:30',
                  deadlineAt: `${dateStr}T18:00`,
                  mode: purpose === 'ROMANCE' ? 'ROMANCE' : 'THEME',
                  purpose,
                  compositionMode: purpose === 'ROMANCE' ? 'ROMANCE' : 'THEME',
                  enforceGenderRatio: purpose === 'ROMANCE',
                  evaluationModuleId: 'MOD_TRACK_3040',
                  targetAgeGroup: '3040 프로',
                  priceKrw: 30000,
                  maxCapacity: 6,
                  minConfirmCount: 3,
                  reason: `동일 조건(${city} · ${PURPOSE_NAMES[purpose] || purpose}) ${members.length}명 충족으로 자동 개설된 프라이빗 테이블`,
                  description: `실서버 회원 조건 매칭으로 자동 개설된 모임입니다.`,
                  venueAddress: '확정자 D-1 상세 주소 비공개 안내',
                  isVenueSecretUntilConfirm: true,
                  expectedMealCost: '인당 4~5만 원대 (현장 1/N 실비 정산)',
                  refundPolicy: '모임 24시간 전까지 100% 환불',
                  deadlineText: `${dateStr} 18:00 마감`,
                  status: allConfirmed ? 'CONFIRMED' : 'RECRUITING',
                  mealNote: '참가비 (다면 관찰 엔진 라이선스 및 리포트 포함 / 식음료 매장 현장 1/N)',
                  requiredBadgeIds: [],
                  minTotalScore100: 75,
                  activePresetSubIds: ['SUB_APP_1', 'SUB_STY_2', 'SUB_CON_2'],
                });
              });
              if (autoEvents.length > 0) {
                setConditionalEvents(autoEvents);
              }
            }
          }
        } catch (e) {
          console.warn('[Supabase] initial SSOT load error:', e);
        }

        // 로그인 세션이 없는 경우 자동 로그인(기본 사용자 강제 로그인)을 차단하고 비로그인 초기 세팅 유지
        const activeUser = localUser ?? currentUser;
        if (!activeUser) {
          return;
        }

        const targetUserId = activeUser.userId;
        const [dbProfile, dbEventIds, dbMatrix] = await Promise.all([
          nadoSoloSupabaseService.getProfile(targetUserId),
          nadoSoloSupabaseService.getAppliedEventIds(targetUserId),
          nadoSoloSupabaseService.getMatrixEvaluations('SES_SEONGSU_38'),
        ]);

        if (!isMounted) return;

        if (dbProfile) {
          const restoredUser: LoggedInUser = {
            userId: dbProfile.id,
            handle: dbProfile.handle,
            role: dbProfile.handle === '@admin' || dbProfile.id === 'ADMIN_01' ? 'ADMIN' : 'MEMBER',
            email: dbProfile.email ?? activeUser.email ?? 'member@nadosolo.com',
            nickname: dbProfile.nickname,
            phone: dbProfile.phone ?? activeUser.phone ?? '010-0000-0000',
            jobTitle: dbProfile.job_title ?? activeUser.jobTitle ?? '일반 회원',
            gender: dbProfile.gender,
            birthYear: dbProfile.birth_year,
            authProvider: 'EMAIL',
            verifiedBadge: dbProfile.verified_badge ?? '본인인증 완료',
            sessionCount: dbProfile.session_count ?? 1,
            residenceCity: dbProfile.residence_city ?? activeUser.residenceCity,
            residenceDistrict: dbProfile.residence_district ?? activeUser.residenceDistrict,
            residenceDong: dbProfile.residence_dong ?? activeUser.residenceDong,
            residenceAddress: dbProfile.residence_address ?? activeUser.residenceAddress,
            preferredPurpose: dbProfile.preferred_purpose ?? activeUser.preferredPurpose,
          };
          setCurrentUser(restoredUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('nadosolo_current_user', JSON.stringify(restoredUser));
          }

          if (dbProfile.dietary) {
            setDietary(dbProfile.dietary as DietaryRestriction);
          }
          if (dbProfile.interests && dbProfile.interests.length > 0) {
            setInterests(dbProfile.interests as InterestTag[]);
          }
          if (dbProfile.self_domain_scores) {
            setSelfDomainScores100((prev) => ({
              ...prev,
              ...(dbProfile.self_domain_scores as Record<MajorDomainCode, number>),
            }));
          }
          if (dbProfile.survey_answers && Object.keys(dbProfile.survey_answers).length > 0) {
            setSurveyAnswers(dbProfile.survey_answers);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`nadosolo_survey_${dbProfile.id}`, JSON.stringify(dbProfile.survey_answers));
            }
          }
        }

        if (dbEventIds && dbEventIds.length > 0) {
          setAppliedEventIds((prev) => Array.from(new Set([...prev, ...dbEventIds])));
        }

        if (dbMatrix && dbMatrix.length > 0) {
          setMatrixEvaluations((prev) => {
            const map = new Map<string, MatrixEvaluationRecord>();
            prev.forEach((r) => map.set(`${r.fromUserId}_${r.toUserId}_${r.subElementId}`, r));
            dbMatrix.forEach((r) => map.set(`${r.fromUserId}_${r.toUserId}_${r.subElementId}`, r));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('[Supabase Sync Init] error:', err);
        if (isMounted) setIsSessionReady(true);
      }
    }

    initSupabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  const loginAsUser = (user: LoggedInUser) => {
    setCurrentUser(user);
    // 새 로그인은 항상 관리자 열람 상태를 해제한다
    setAdminOriginUser(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nadosolo_current_user', JSON.stringify(user));
      localStorage.removeItem('nadosolo_admin_origin');
      if (isAdminAccount(user)) {
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(user));
      }
    }

    // 관리자 계정은 일반 회원 DB(profiles) 및 매칭 풀(participantsPool)에 혼입하지 않는다
    if (isAdminAccount(user)) {
      return;
    }

    // Supabase DB 자동 upsert (새 가입자 및 로그인 계정 영구 보존)
    nadoSoloSupabaseService.upsertProfile({
      id: user.userId,
      handle: user.handle,
      email: user.email,
      phone: user.phone,
      nickname: user.nickname,
      gender: user.gender,
      birth_year: user.birthYear,
      job_title: user.jobTitle,
      dietary,
      interests,
      self_domain_scores: selfDomainScores100,
      verified_badge: user.verifiedBadge,
      session_count: user.sessionCount,
      residence_city: user.residenceCity,
      residence_district: user.residenceDistrict,
    });

    // participantsPool 실시간 동기화
    setParticipantsPool((prev) => {
      const exists = prev.some((p) => p.userId === user.userId);
      if (exists) {
        return prev.map((p) =>
          p.userId === user.userId
            ? { ...p, nickname: user.nickname, gender: user.gender, birthYear: user.birthYear }
            : p
        );
      }
      return [
        ...prev,
        {
          userId: user.userId,
          nickname: user.nickname,
          gender: user.gender,
          birthYear: user.birthYear,
          cityCode: user.residenceDistrict?.includes('해운대')
            ? 'BUSAN_HAEUNDAE'
            : user.residenceDistrict?.includes('진구') || user.residenceDistrict?.includes('전포')
            ? 'BUSAN_JEONPO'
            : user.residenceCity?.includes('서울')
            ? 'SEOUL_SEONGSU'
            : 'BUSAN_JEONPO',
          preferredMode: 'ROMANCE',
          languages: { ko: 'NATIVE' },
          preferredTableLanguage: 'ko',
          budgetTier: '$$',
          dietary: ['NONE'],
          interests: ['WINE', 'COOKING'],
          selfVector: {
            extroversion: 0.7,
            talkLead: 0.6,
            lifestyleActive: 0.8,
            romanceIntent: 0.8,
            alcoholPreference: 0.7,
          },
          trustScore: 95,
          verified: true,
        },
      ];
    });
  };

  const updateCurrentUser = (patch: Partial<LoggedInUser>) => {
    setCurrentUser((prev) => {
      const nextUser: LoggedInUser = prev
        ? { ...prev, ...patch }
        : {
            userId: 'user_jisoo',
            handle: patch.handle ?? '@jisoo_kim',
            role: 'MEMBER',
            email: patch.email ?? 'jisoo@nadosolo.com',
            nickname: patch.nickname ?? '지수',
            phone: patch.phone ?? '010-2948-1029',
            jobTitle: patch.jobTitle ?? 'UX 디자이너',
            gender: patch.gender ?? 'F',
            birthYear: patch.birthYear ?? 1995,
            authProvider: 'EMAIL',
            verifiedBadge: '본인인증 완료',
            sessionCount: 1,
          };

      if (typeof window !== 'undefined') {
        localStorage.setItem('nadosolo_current_user', JSON.stringify(nextUser));
      }

      // Supabase 비동기 동기화 (Background Sync)
      nadoSoloSupabaseService.upsertProfile({
        id: nextUser.userId,
        handle: nextUser.handle,
        email: nextUser.email,
        phone: nextUser.phone,
        nickname: nextUser.nickname,
        gender: nextUser.gender,
        birth_year: nextUser.birthYear,
        job_title: nextUser.jobTitle,
        dietary,
        interests,
        self_domain_scores: selfDomainScores100,
        verified_badge: nextUser.verifiedBadge,
        session_count: nextUser.sessionCount,
        residence_city: nextUser.residenceCity,
        residence_district: nextUser.residenceDistrict,
        residence_dong: nextUser.residenceDong,
        residence_address: nextUser.residenceAddress,
        preferred_purpose: nextUser.preferredPurpose,
      });

      return nextUser;
    });
  };

  const isImpersonating = Boolean(adminOriginUser);

  const startAdminImpersonation = useCallback((targetUserId: string) => {
    // 1. 현재 관리자 세션을 백업
    const currentAdmin = currentUser?.role === 'ADMIN' ? currentUser : adminOriginUser;
    if (currentAdmin) {
      // React 상태는 건드리지 않고 저장소에만 백업한다 (이동 직전 /admin 재렌더·복원 로직 오발동 방지)
      if (typeof window !== 'undefined') {
        localStorage.setItem('nadosolo_admin_origin', JSON.stringify(currentAdmin));
      }
    }

    // 2. 대상 회원 정보 구성
    const foundProfile = participantsPool.find((p) => p.userId === targetUserId);

    const targetUser: LoggedInUser = {
      userId: targetUserId,
      handle: `@${targetUserId.replace(/^U_/, '').toLowerCase()}`,
      role: 'MEMBER',
      email: `${targetUserId.toLowerCase()}@nadosolo.com`,
      nickname: foundProfile?.nickname || '회원',
      phone: '010-0000-0000',
      jobTitle: '전문직',
      gender: foundProfile?.gender || 'F',
      birthYear: foundProfile?.birthYear || 1995,
      authProvider: 'EMAIL',
      verifiedBadge: '본인인증 완료',
      sessionCount: 1,
    };

    // 화면(React 상태)은 바꾸지 않고 저장소만 갱신한 뒤 전체 이동한다.
    // → 이동 전 /admin 화면이 회원 세션으로 다시 그려지는 중간 화면을 원천 차단
    if (typeof window !== 'undefined') {
      localStorage.setItem('nadosolo_current_user', JSON.stringify(targetUser));
      window.location.assign('/dashboard');
    }
  }, [currentUser, adminOriginUser, participantsPool]);

  const stopAdminImpersonation = useCallback(() => {
    const adminToRestore: LoggedInUser = adminOriginUser || {
      userId: 'ADMIN_01',
      handle: '@admin',
      role: 'ADMIN',
      email: 'admin@nadosolo.com',
      nickname: '관리자',
      phone: '010-0000-0000',
      jobTitle: '시스템 총괄',
      gender: 'M',
      birthYear: 1990,
      authProvider: 'EMAIL',
      verifiedBadge: 'ADMIN',
      sessionCount: 99,
    };

    setCurrentUser(adminToRestore);
    setAdminOriginUser(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nadosolo_current_user', JSON.stringify(adminToRestore));
      localStorage.removeItem('nadosolo_admin_origin');
    }
  }, [adminOriginUser]);

  const logout = () => {
    setCurrentUser(null);
    setAdminOriginUser(null);
    setIsSeatReserved(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nadosolo_current_user');
      localStorage.removeItem('nadosolo_admin_origin');
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    }
  };

  // 사용자별 성향 자가진단 답변 동기화 (비로그인 게스트 응답 자동 이관 포함)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const uId = currentUser?.userId;
    if (uId) {
      let existing: Record<string, string> | null = null;
      const stored = localStorage.getItem(`nadosolo_survey_${uId}`);
      if (stored) {
        try {
          existing = JSON.parse(stored);
        } catch (e) {
          console.warn('[LocalStorage] survey parse error:', e);
        }
      }

      const guestRaw = localStorage.getItem('nadosolo_survey_guest');
      let guestParsed: Record<string, string> | null = null;
      if (guestRaw) {
        try {
          guestParsed = JSON.parse(guestRaw) as Record<string, string>;
        } catch {}
      }

      setSurveyAnswers((prev) => {
        const combined = {
          ...(existing || {}),
          ...(guestParsed && Object.keys(guestParsed).length > 0 ? guestParsed : {}),
          ...(Object.keys(prev || {}).length > 0 ? prev : {}),
        };

        if (Object.keys(combined).length > 0) {
          localStorage.setItem(`nadosolo_survey_${uId}`, JSON.stringify(combined));
          if (guestRaw) localStorage.removeItem('nadosolo_survey_guest');
          if (currentUser) {
            nadoSoloSupabaseService.upsertProfile({
              id: currentUser.userId,
              handle: currentUser.handle,
              nickname: currentUser.nickname,
              gender: currentUser.gender,
              birth_year: currentUser.birthYear,
              email: currentUser.email,
              phone: currentUser.phone,
              job_title: currentUser.jobTitle,
              survey_answers: combined,
            });
          }
          return combined;
        }

        if (uId === 'user_jisoo' || uId === 'aa' || uId === 'bb') {
          return {
            Q1_COMM_PACE: 'Q1_A',
            Q2_SILENCE_COPING: 'Q2_B',
            Q3_DINING_VIBE: 'Q3_A',
            Q4_SOLO_PURPOSE: 'Q4_A',
            Q5_FEEDBACK_STYLE: 'Q5_B',
          };
        }
        return {};
      });
    } else {
      const guestRaw = localStorage.getItem('nadosolo_survey_guest');
      if (guestRaw) {
        try {
          const guestParsed = JSON.parse(guestRaw);
          if (guestParsed && Object.keys(guestParsed).length > 0) {
            setSurveyAnswers(guestParsed);
            return;
          }
        } catch {}
      }
      setSurveyAnswers((prev) => (Object.keys(prev || {}).length > 0 ? prev : {}));
    }
  }, [currentUser]);

  const setSurveyAnswer = (questionId: string, optionId: string) => {
    setSurveyAnswers((prev) => {
      const next = { ...prev, [questionId]: optionId };
      if (typeof window !== 'undefined') {
        const uId = currentUser?.userId ?? 'guest';
        localStorage.setItem(`nadosolo_survey_${uId}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const saveSurveyAnswers = (answers: Record<string, string>) => {
    setSurveyAnswers(answers);
    const quizDietary = answers['Q13_DIETARY'];
    const resolvedDietary = quizDietary && quizDietary.trim() ? quizDietary.trim() : dietary;
    if (quizDietary) {
      const firstToken = quizDietary.split(',')[0]?.trim();
      if (
        firstToken === 'NONE' ||
        firstToken === 'VEGAN' ||
        firstToken === 'HALAL' ||
        firstToken === 'NO_PORK' ||
        firstToken === 'ALCOHOL_FREE'
      ) {
        setDietary(firstToken);
      }
    }
    const quizIndustry = answers['Q03_INDUSTRY'] || '';
    const customJobToken = quizIndustry
      .split(',')
      .map((t) => t.trim())
      .find((t) => t.startsWith('CUSTOM:'));
    const resolvedJob = customJobToken ? customJobToken.slice(7).trim() : currentUser?.jobTitle;

    if (typeof window !== 'undefined') {
      const uId = currentUser?.userId ?? 'guest';
      localStorage.setItem(`nadosolo_survey_${uId}`, JSON.stringify(answers));
    }
    if (currentUser?.userId) {
      nadoSoloSupabaseService.upsertProfile({
        id: currentUser.userId,
        handle: currentUser.handle,
        nickname: currentUser.nickname,
        gender: currentUser.gender,
        birth_year: currentUser.birthYear,
        email: currentUser.email,
        phone: currentUser.phone,
        job_title: resolvedJob,
        dietary: resolvedDietary,
        interests: interests,
        self_domain_scores: selfDomainScores100,
        survey_answers: answers,
      });
    }
  };

  const toggleInterest = (tag: InterestTag) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 프로세스 모듈 ON/OFF 토글
  const toggleProcessModule = (processId: string) => {
    setProcessModules((prev) =>
      prev.map((m) =>
        m.processId === processId
          ? { ...m, enabled: !m.enabled }
          : m
      )
    );
  };

  // 중분류 요소 활성 토글 & 수정
  const toggleSubElementActive = (subId: string) => {
    setSubElements((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, activeInCurrentProcess: !s.activeInCurrentProcess }
          : s
      )
    );
  };

  const updateSubElement = (item: SubElementDef) => {
    setSubElements((prev) =>
      prev.map((s) => (s.id === item.id ? item : s))
    );
  };

  const setSelfDomainScore100 = (code: MajorDomainCode, score100: number) => {
    setSelfDomainScores100((prev) => ({ ...prev, [code]: score100 }));
  };

  const submitMatrixEvaluation = (
    toUserId: string,
    subElementId: string,
    scores: Record<CriterionCode, number>
  ) => {
    const fromId = currentUser?.userId ?? '';
    const fromNick = currentUser?.nickname ?? '회원';
    const fromGen = currentUser?.gender ?? 'F';

    setMatrixEvaluations((prev) => {
      const existingIdx = prev.findIndex(
        (r) =>
          r.fromUserId === fromId &&
          r.toUserId === toUserId &&
          r.subElementId === subElementId
      );
      const nextRec: MatrixEvaluationRecord = {
        recordId: `REC_USR_${Date.now()}`,
        sessionId: 'SES_SEONGSU_38',
        fromUserId: fromId,
        fromNickname: fromNick,
        fromGender: fromGen,
        toUserId,
        subElementId,
        scores,
        createdAt: new Date().toISOString(),
      };
      // Supabase 비동기 저장
      nadoSoloSupabaseService.saveMatrixEvaluation({
        sessionId: 'SES_SEONGSU_38',
        fromUserId: fromId,
        fromNickname: fromNick,
        fromGender: fromGen,
        toUserId,
        subElementId,
        scores,
      });

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = nextRec;
        return copy;
      }
      return [...prev, nextRec];
    });
  };

  const getPersonalDossierForUser = useCallback(
    (targetUserId: string): PersonalDossierReport => {
      const targetProfile = participantsPool.find((p) => p.userId === targetUserId);
      const targetGender: Gender =
        targetUserId === currentUser?.userId
          ? currentUser.gender
          : targetProfile?.gender ?? 'M';

      return EvaluationMatrixEngine.buildPersonalDossier({
        userId: targetUserId,
        userGender: targetGender,
        majorDomains,
        subElements,
        records: matrixEvaluations,
        selfDomainScores100,
        badges: granularBadges,
      });
    },
    [
      participantsPool,
      currentUser,
      majorDomains,
      subElements,
      matrixEvaluations,
      selfDomainScores100,
      granularBadges,
    ]
  );

  const myPersonalDossier = useMemo(() => {
    return EvaluationMatrixEngine.buildPersonalDossier({
      userId: currentUser?.userId ?? '',
      userGender: currentUser?.gender ?? 'F',
      majorDomains,
      subElements,
      records: matrixEvaluations,
      selfDomainScores100,
      badges: granularBadges,
    });
  }, [
    currentUser,
    majorDomains,
    subElements,
    matrixEvaluations,
    selfDomainScores100,
    granularBadges,
  ]);

  // ==========================================================================
  // [신규 헌법 기반] 마이크로 플러그인 평가 엔진 및 상호주의 해금 소셜 프로필
  // ==========================================================================
  const [participantObservations, setParticipantObservations] = useState<ParticipantObservationRecord[]>([]);

  const [completedEvalUserIds, setCompletedEvalUserIds] = useState<string[]>([]);

  const submitParticipantObservation = (
    toUserId: string,
    moduleId: string,
    elementId: string,
    scoreStep: 1 | 2 | 3 | 4 | 5
  ) => {
    const fromId = currentUser?.userId ?? '';
    const nextRec: ParticipantObservationRecord = {
      recordId: `REC_OBS_${Date.now()}`,
      sessionId: 'SES_BUSAN_01',
      moduleId,
      fromUserId: fromId,
      toUserId,
      elementId,
      scoreStep,
      createdAt: new Date().toISOString(),
    };
    setParticipantObservations((prev) => [...prev, nextRec]);
    setCompletedEvalUserIds((prev) => (prev.includes(toUserId) ? prev : [...prev, toUserId]));

    // Supabase 비동기 동기화
    const targetModule = EvaluationRegistry.getModule(moduleId);
    const anchorNoun = targetModule?.getObservationElements().find((el: { id: string; anchorNoun: string }) => el.id === elementId)?.anchorNoun ?? '관찰';
    nadoSoloSupabaseService.saveParticipantObservation({
      sessionId: 'SES_BUSAN_01',
      moduleId,
      fromUserId: fromId,
      toUserId,
      elementId,
      anchorNoun,
      scoreStep,
    })
      .then(() =>
        nadoSoloSupabaseService.syncReciprocalReportUnlock('SES_BUSAN_01', fromId, 5)
      )
      .catch((err) => console.warn('[Supabase Sync]', err));
  };

  const personalSocialDossier = useMemo(() => {
    const myId = currentUser?.userId ?? '';
    return CoreRunner.generateDossier(
      myId,
      'SES_BUSAN_01',
      '3045_PRIME',
      participantObservations,
      completedEvalUserIds.length,
      5,
      currentUser?.sessionCount ?? 1
    );
  }, [currentUser, participantObservations, completedEvalUserIds]);

  const fullJourneyAudit = useMemo(() => {
    return CoreRunner.generateFullAuditReport('SES_BUSAN_01', participantObservations);
  }, [participantObservations]);

  // 세분화 뱃지 CRUD
  const addGranularBadge = (b: GranularBadgeDef) => {
    setGranularBadges((prev) => [b, ...prev]);
  };
  const updateGranularBadge = (b: GranularBadgeDef) => {
    setGranularBadges((prev) =>
      prev.map((x) => (x.badgeId === b.badgeId ? b : x))
    );
  };
  const deleteGranularBadge = (badgeId: string) => {
    setGranularBadges((prev) => prev.filter((x) => x.badgeId !== badgeId));
  };

  // 지역·상권 CRUD
  const addRegionDistrict = (item: RegionDistrictItem) => {
    setRegionDistricts((prev) => [item, ...prev]);
  };
  const updateRegionDistrict = (item: RegionDistrictItem) => {
    setRegionDistricts((prev) =>
      prev.map((x) => (x.districtId === item.districtId ? item : x))
    );
  };
  const deleteRegionDistrict = (id: string) => {
    setRegionDistricts((prev) => prev.filter((x) => x.districtId !== id));
  };

  // 조건부 모임 CRUD & 자격 검증 신청
  const applyForConditionalEvent = (
    eventId: string
  ): { ok: boolean; message: string } => {
    const ev = conditionalEvents.find((e) => e.eventId === eventId);
    if (!ev) return { ok: false, message: '모임 정보를 찾을 수 없습니다.' };

    // 1) 최소 종합 점수 검증
    if (
      ev.minTotalScore100 > 0 &&
      myPersonalDossier.totalScore100 < ev.minTotalScore100
    ) {
      return {
        ok: false,
        message: `참가 조건 미달: 종합 프로파일 점수 ${ev.minTotalScore100}점 이상 필요 (현재 ${myPersonalDossier.totalScore100}점)`,
      };
    }

    // 2) 필수 보유 뱃지 검증
    const missingBadges = ev.requiredBadgeIds.filter(
      (reqId) => !myPersonalDossier.earnedBadgeIds.includes(reqId)
    );
    if (missingBadges.length > 0) {
      const names = missingBadges
        .map((id) => granularBadges.find((b) => b.badgeId === id)?.name ?? id)
        .join(', ');
      return {
        ok: false,
        message: `필수 인증 뱃지 미보유: [${names}] 뱃지가 필요합니다.`,
      };
    }

    if (!appliedEventIds.includes(eventId)) {
      setAppliedEventIds((prev) => [...prev, eventId]);
      const currentUserId = currentUser?.userId ?? 'user_jisoo';
      nadoSoloSupabaseService.applyForEvent(currentUserId, eventId);
    }
    setIsSeatReserved(true);
    return {
      ok: true,
      message: `[${ev.title}] 참가 자격 검증 통과 및 모임 신청이 완료되었습니다.`,
    };
  };

  const addConditionalEvent = (ev: ConditionalEventItem) => {
    setConditionalEvents((prev) => {
      const next = [ev, ...prev];
      try {
        localStorage.setItem('nadosolo_conditional_events_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
    void nadoSoloSupabaseService.upsertEvent(ev);
  };
  const updateConditionalEvent = (ev: ConditionalEventItem) => {
    setConditionalEvents((prev) => {
      const next = prev.map((x) => (x.eventId === ev.eventId ? ev : x));
      try {
        localStorage.setItem('nadosolo_conditional_events_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
    void nadoSoloSupabaseService.upsertEvent(ev);
  };
  const deleteConditionalEvent = (eventId: string) => {
    setConditionalEvents((prev) => {
      const next = prev.filter((x) => x.eventId !== eventId);
      try {
        localStorage.setItem('nadosolo_conditional_events_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
    void nadoSoloSupabaseService.deleteEvent(eventId);
  };

  // ① ProfilingEngine
  const selfVector = useMemo(() => {
    const answersList: SurveyAnswer[] = Object.entries(surveyAnswers).map(
      ([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })
    );
    return ProfilingEngine.computeSelfVector(
      DEFAULT_SURVEY_QUESTIONS,
      answersList
    );
  }, [surveyAnswers]);

  const selfPersonaTitle = useMemo(() => {
    if (selfVector.talkLead >= 0.65 && selfVector.extroversion >= 0.65) {
      return {
        ko: '다정한 분위기 메이커',
        en: 'Warm Vibe Maker',
        descKo: '밝은 에너지로 어색함을 깨고 대화를 이끄는 리더형',
        descEn: 'Breaks the ice warmly and leads the table naturally.',
      };
    }
    if (selfVector.romanceIntent >= 0.65) {
      return {
        ko: '설렘을 찾는 로맨티스트',
        en: 'Intentional Romantic',
        descKo: '가벼운 스몰토크보다 진솔한 눈맞춤과 깊은 대화를 선호하는 유형',
        descEn: 'Prefers meaningful eye contact and inner stories over small talk.',
      };
    }
    return {
      ko: '편안한 리액션 리스너',
      en: 'Calm Empathetic Listener',
      descKo: '상대방의 이야기를 경청하며 테이블의 온도를 높이는 공감형',
      descEn: 'Listens deeply and raises the warmth of the entire table.',
    };
  }, [selfVector]);

  // ② MirrorEngine
  const mirrorDiagnosis = useMemo(
    () => MirrorEngine.analyzeMirror(currentUser?.userId ?? '', selfVector, peerFeedbacks),
    [currentUser?.userId, selfVector, peerFeedbacks]
  );

  const mirrorPersonaTitle = useMemo(() => {
    const mv = mirrorDiagnosis.mirrorVector;
    if (mv.extroversion >= 0.65 && mv.talkLead < 0.65) {
      return {
        ko: '눈빛으로 안심시키는 경청가',
        en: 'Reassuring Soulful Listener',
        descKo:
          '동석자들은 당신이 말을 많이 하기보다, 상대가 주인공이 되도록 편안한 여백을 만들어준 점을 가장 큰 매력으로 꼽았습니다.',
        descEn:
          'Tablemates loved how your warm eye contact made everyone feel like the main character.',
      };
    }
    return {
      ko: '대화의 깊이를 여는 따뜻한 리더',
      en: 'Warm Conversation Catalyst',
      descKo:
        '동석자들은 당신의 자연스러운 질문과 미소 덕분에 테이블 전체가 빠르게 가까워졌다고 응답했습니다.',
      descEn:
        'Tablemates noted your thoughtful questions brought the whole table closer.',
    };
  }, [mirrorDiagnosis]);

  // ③ GrowthCoachingEngine
  const coachingReport = useMemo(
    () =>
      GrowthCoachingEngine.generateCoachingReport(
        currentUser?.userId ?? '',
        INITIAL_GROWTH_SNAPSHOTS,
        mirrorDiagnosis
      ),
    [currentUser?.userId, mirrorDiagnosis]
  );

  // ④ LocalePolicyEngine & ⑤ GroupingEngine & ⑥ VenueAndYieldEngine
  const cityConfig = useMemo(
    () => LocalePolicyEngine.getCityConfig(selectedCity),
    [selectedCity]
  );

  const dynamicQuote = useMemo(
    () =>
      VenueAndYieldEngine.calculateDynamicPrice({
        cityCode: selectedCity,
        mode: selectedMode,
        applicantGender: currentUser?.gender ?? 'F',
        currentMaleCount: 3,
        currentFemaleCount: 1,
        hoursUntilEvent: 36,
      }),
    [selectedCity, selectedMode, currentUser]
  );

  const matchedTables = useMemo(() => {
    const updatedPool = participantsPool.map((p) => {
      if (currentUser?.userId && p.userId === currentUser.userId) {
        return {
          ...p,
          nickname: currentUser?.nickname ?? p.nickname,
          gender: currentUser?.gender ?? p.gender,
          birthYear: currentUser?.birthYear ?? p.birthYear,
          dietary: [dietary],
          interests: interests.length > 0 ? interests : p.interests,
          selfVector,
          effectiveVector: isProfileLevelUpApproved
            ? mirrorDiagnosis.mirrorVector
            : mirrorDiagnosis.effectiveVector,
        };
      }
      return p;
    });

    const grouped = GroupingEngine.matchTables(updatedPool);
    return VenueAndYieldEngine.assignVenuesToTables(
      grouped.matchedTables,
      partnerVenues
    );
  }, [
    participantsPool,
    partnerVenues,
    currentUser,
    dietary,
    interests,
    selfVector,
    isProfileLevelUpApproved,
    mirrorDiagnosis,
  ]);

  const activeTable = useMemo(() => {
    const targetMode = selectedMode === 'PLATONIC' ? 'THEME' : selectedMode;
    return (
      matchedTables.find((t) => t.mode === targetMode) ?? matchedTables[0]
    );
  }, [matchedTables, selectedMode]);

  const triggerNoShowAndStandbyRecovery = () => {
    if (!activeTable) return;
    const dropped =
      activeTable.participants.find((p) => p.userId !== currentUser?.userId) ??
      activeTable.participants[1];
    if (!dropped) return;
    const replacement = VenueAndYieldEngine.findStandbyReplacement(
      activeTable,
      dropped,
      STANDBY_WAITLIST_POOL
    );
    if (replacement) {
      setParticipantsPool((prev) =>
        prev.map((p) => (p.userId === dropped.userId ? replacement : p))
      );
      setStandbyReplacementLog(
        `[${dropped.nickname}] 취소 발생 ➔ 대기열 [${replacement.nickname} (신뢰점수 ${replacement.trustScore}점)] 자동 대체 완료`
      );
    }
  };

  // ⑦ PlaybookEngine & ⑧ MutualMatchEngine
  const currentSeats = useMemo(() => {
    if (!activeTable) return [];
    const base =
      activeTable.mode === 'ROMANCE'
        ? PlaybookEngine.arrangeRomanceAlternatingSeats(activeTable.participants)
        : PlaybookEngine.arrangeInterestSynergySeats(activeTable.participants);

    return isSecondHalfRotated
      ? PlaybookEngine.rotateSeatsForSecondHalf(
          base,
          activeTable.participants,
          activeTable.mode
        )
      : base;
  }, [activeTable, isSecondHalfRotated]);

  const activeStageCards = useMemo(() => {
    return customCards;
  }, [customCards]);

  const { allMutualMatches, visibleMatchesForMe, isVipUnlockedForMe } =
    useMemo(() => {
      if (!activeTable) {
        return {
          allMutualMatches: [],
          visibleMatchesForMe: [],
          isVipUnlockedForMe: false,
        };
      }
      const sessionId = `SES_${activeTable.tableId}`;
      const revealUtc = '2026-11-07T00:00:00Z';

      const myId = currentUser?.userId ?? '';
      const votes: SecretVote[] = myVoteTargetId
        ? [
            {
              sessionId,
              fromUserId: myId,
              toUserId: myVoteTargetId,
              category: myVoteCategory,
              submittedAt: new Date().toISOString(),
            },
          ]
        : [];

      const all = MutualMatchEngine.resolveMutualMatches(
        sessionId,
        activeTable.cityCode,
        votes,
        revealUtc
      );
      const nowIso = isMidnightPassed
        ? '2026-11-07T00:05:00Z'
        : '2026-11-06T21:15:00Z';
      const visible = MutualMatchEngine.getVisibleMatchesForUser(
        myId,
        all,
        nowIso
      );

      const syncedFeedbacks = peerFeedbacks.map((f) => ({ ...f, sessionId }));
      const vipList = MutualMatchEngine.evaluateVipTierUnlocks(
        sessionId,
        votes,
        syncedFeedbacks
      );

      return {
        allMutualMatches: all,
        visibleMatchesForMe: visible,
        isVipUnlockedForMe: vipList.includes(myId),
      };
    }, [
      activeTable,
      myVoteTargetId,
      myVoteCategory,
      isMidnightPassed,
      peerFeedbacks,
      currentUser?.userId,
    ]);

  const addPeerFeedbackSimulation = (
    charm: PositiveCharmTag,
    growthTip: GrowthPointTag,
    observedTalkLead: number
  ) => {
    const newFb: PeerMirrorFeedback = {
      sessionId: `SES_SIM_${peerFeedbacks.length + 1}`,
      fromUserId: `PEER_${peerFeedbacks.length + 1}`,
      toUserId: currentUser?.userId ?? '',
      observedTraitHint: {
        talkLead: observedTalkLead,
        extroversion: 0.8,
      },
      competencyRatings: {
        communicationBalance: growthTip === 'NEED_MORE_QUESTIONS' ? 65 : 90,
        groomingAndSelfCare: growthTip === 'UPGRADE_STYLING' ? 64 : 86,
        empathyAndVibe: growthTip === 'RELAX_FACIAL_TENSION' ? 66 : 92,
        lifestyleVitality: growthTip === 'EXPAND_LIFE_TOPICS' ? 66 : 86,
      },
      selectedCharmTag: charm,
      selectedGrowthTipTag: growthTip,
    };
    setPeerFeedbacks((prev) => [...prev, newFb]);
  };

  const approveProfileLevelUp = () => {
    setIsProfileLevelUpApproved(true);
  };

  const resetParticipantsPool = () => {
    setParticipantsPool(INITIAL_PARTICIPANTS);
    setStandbyReplacementLog(null);
  };

  const adjustTrustScore = (userId: string, delta: number) => {
    setParticipantsPool((prev) =>
      prev.map((p) =>
        p.userId === userId
          ? {
              ...p,
              trustScore: Math.max(0, Math.min(100, p.trustScore + delta)),
            }
          : p
      )
    );
  };

  const addParticipant = (p: ParticipantProfile) => {
    setParticipantsPool((prev) => [p, ...prev]);
  };
  const updateParticipant = (p: ParticipantProfile) => {
    setParticipantsPool((prev) =>
      prev.map((item) => (item.userId === p.userId ? p : item))
    );
  };
  const deleteParticipant = (userId: string) => {
    setParticipantsPool((prev) => prev.filter((item) => item.userId !== userId));
  };

  const addPartnerVenue = (v: PartnerVenue) => {
    setPartnerVenues((prev) => {
      const next = [v, ...prev];
      void saveAppConfig('partner_venues', 'nadosolo_partner_venues_v1', next);
      return next;
    });
  };
  const updatePartnerVenue = (v: PartnerVenue) => {
    setPartnerVenues((prev) => {
      const next = prev.map((item) => (item.venueId === v.venueId ? v : item));
      void saveAppConfig('partner_venues', 'nadosolo_partner_venues_v1', next);
      return next;
    });
  };
  const deletePartnerVenue = (venueId: string) => {
    setPartnerVenues((prev) => {
      const next = prev.filter((item) => item.venueId !== venueId);
      void saveAppConfig('partner_venues', 'nadosolo_partner_venues_v1', next);
      return next;
    });
  };

  const addPlaybookCard = (card: PlaybookCard) => {
    setCustomCards((prev) => [card, ...prev]);
  };
  const updatePlaybookCard = (card: PlaybookCard) => {
    setCustomCards((prev) =>
      prev.map((c) => (c.cardId === card.cardId ? card : c))
    );
  };
  const deletePlaybookCard = (cardId: string) => {
    setCustomCards((prev) => prev.filter((c) => c.cardId !== cardId));
  };

  const updateCmsPage = (page: CmsPageConfig) => {
    setCmsPages((prev) => {
      const next = prev.map((p) => (p.pageId === page.pageId ? page : p));
      void saveAppConfig('cms_pages', 'nadosolo_cms_pages_v1', next);
      return next;
    });
  };
  const addCmsPage = (page: CmsPageConfig) => {
    setCmsPages((prev) => {
      const next = [...prev, page];
      void saveAppConfig('cms_pages', 'nadosolo_cms_pages_v1', next);
      return next;
    });
  };
  const deleteCmsPage = (pageId: string) => {
    setCmsPages((prev) => {
      const next = prev.filter((p) => p.pageId !== pageId);
      void saveAppConfig('cms_pages', 'nadosolo_cms_pages_v1', next);
      return next;
    });
  };

  const addCmsAtmosphere = (item: CmsAtmosphereItem) => {
    setCmsAtmospheres((prev) => [...prev, item]);
  };
  const updateCmsAtmosphere = (item: CmsAtmosphereItem) => {
    setCmsAtmospheres((prev) =>
      prev.map((a) => (a.id === item.id ? item : a))
    );
  };
  const deleteCmsAtmosphere = (id: string) => {
    setCmsAtmospheres((prev) => prev.filter((a) => a.id !== id));
  };

  const addCmsStep = (item: CmsStepItem) => {
    setCmsSteps((prev) => [...prev, item]);
  };
  const updateCmsStep = (item: CmsStepItem) => {
    setCmsSteps((prev) => prev.map((s) => (s.id === item.id ? item : s)));
  };
  const deleteCmsStep = (id: string) => {
    setCmsSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const addCmsMirrorQuote = (item: CmsMirrorQuoteItem) => {
    setCmsMirrorQuotes((prev) => [item, ...prev]);
  };
  const updateCmsMirrorQuote = (item: CmsMirrorQuoteItem) => {
    setCmsMirrorQuotes((prev) =>
      prev.map((q) => (q.id === item.id ? item : q))
    );
  };
  const deleteCmsMirrorQuote = (id: string) => {
    setCmsMirrorQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  // [동적 프로세스 게이트 엔진] 사용자 진행 상태 및 선행 진입 조건 평가
  const userSnapshot: UserContextSnapshot = useMemo(
    () => ({
      user: currentUser,
      hasSurveyAnswers: Object.keys(surveyAnswers).length >= 4,
      isSeatReserved,
      hasCompletedObservationCount: completedEvalUserIds.length,
      totalObservationPeersCount: 5,
    }),
    [currentUser, surveyAnswers, isSeatReserved, completedEvalUserIds]
  );

  const userJourney = useMemo(
    () => evaluateFullJourney(userSnapshot),
    [userSnapshot]
  );

  const evaluateGate = useCallback(
    (stepId: ProcessStepId) => evaluateProcessGate(stepId, userSnapshot),
    [userSnapshot]
  );

  const contextValue = useMemo<NadoSoloEngineContextValue>(
    () => ({
      currentUser,
      adminOriginUser,
      isSessionReady,
      isImpersonating,
      startAdminImpersonation,
      stopAdminImpersonation,
      loginAsUser,
      updateCurrentUser,
      logout,
      userJourney,
      evaluateGate,
      lang,
      setLang,
      selectedCity,
      setSelectedCity,
      selectedMode,
      setSelectedMode,
      preferredLang,
      setPreferredLang,
      dietary,
      setDietary,
      interests,
      toggleInterest,
      surveyAnswers,
      setSurveyAnswer,
      saveSurveyAnswers,
      isSeatReserved,
      setIsSeatReserved,
      processModules,
      toggleProcessModule,
      majorDomains,
      evaluationCriteria,
      subElements,
      toggleSubElementActive,
      updateSubElement,
      selfDomainScores100,
      setSelfDomainScore100,
      matrixEvaluations,
      submitMatrixEvaluation,
      myPersonalDossier,
      getPersonalDossierForUser,
      participantObservations,
      submitParticipantObservation,
      completedEvalUserIds,
      personalSocialDossier,
      fullJourneyAudit,
      granularBadges,
      addGranularBadge,
      updateGranularBadge,
      deleteGranularBadge,
      regionDistricts,
      selectedDistrictId,
      setSelectedDistrictId,
      addRegionDistrict,
      updateRegionDistrict,
      deleteRegionDistrict,
      conditionalEvents,
      appliedEventIds,
      applyForConditionalEvent,
      addConditionalEvent,
      updateConditionalEvent,
      deleteConditionalEvent,
      selfVector,
      selfPersonaTitle,
      mirrorPersonaTitle,
      mirrorDiagnosis,
      coachingReport,
      peerFeedbacks,
      addPeerFeedbackSimulation,
      isProfileLevelUpApproved,
      approveProfileLevelUp,
      cityConfig,
      dynamicQuote,
      matchedTables,
      activeTable,
      participantsPool,
      standbyPool: STANDBY_WAITLIST_POOL,
      partnerVenues,
      standbyReplacementLog,
      triggerNoShowAndStandbyRecovery,
      resetParticipantsPool,
      adjustTrustScore,
      addParticipant,
      updateParticipant,
      deleteParticipant,
      addPartnerVenue,
      updatePartnerVenue,
      deletePartnerVenue,
      isSecondHalfRotated,
      setIsSecondHalfRotated,
      currentSeats,
      activeStageCards,
      addPlaybookCard,
      updatePlaybookCard,
      deletePlaybookCard,
      myVoteTargetId,
      setMyVoteTargetId,
      myVoteCategory,
      setMyVoteCategory,
      isMidnightPassed,
      setIsMidnightPassed,
      allMutualMatches,
      visibleMatchesForMe,
      isVipUnlockedForMe,
      cmsPages,
      updateCmsPage,
      addCmsPage,
      deleteCmsPage,
      cmsAtmospheres,
      addCmsAtmosphere,
      updateCmsAtmosphere,
      deleteCmsAtmosphere,
      cmsSteps,
      addCmsStep,
      updateCmsStep,
      deleteCmsStep,
      cmsMirrorQuotes,
      addCmsMirrorQuote,
      updateCmsMirrorQuote,
      deleteCmsMirrorQuote,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentUser,
      adminOriginUser,
      isSessionReady,
      isImpersonating,
      startAdminImpersonation,
      stopAdminImpersonation,
      userJourney,
      evaluateGate,
      lang,
      selectedCity,
      selectedMode,
      preferredLang,
      dietary,
      interests,
      surveyAnswers,
      isSeatReserved,
      processModules,
      majorDomains,
      evaluationCriteria,
      subElements,
      selfDomainScores100,
      matrixEvaluations,
      myPersonalDossier,
      getPersonalDossierForUser,
      participantObservations,
      completedEvalUserIds,
      personalSocialDossier,
      fullJourneyAudit,
      granularBadges,
      regionDistricts,
      selectedDistrictId,
      conditionalEvents,
      appliedEventIds,
      selfVector,
      selfPersonaTitle,
      mirrorPersonaTitle,
      mirrorDiagnosis,
      coachingReport,
      peerFeedbacks,
      isProfileLevelUpApproved,
      cityConfig,
      dynamicQuote,
      matchedTables,
      activeTable,
      participantsPool,
      partnerVenues,
      standbyReplacementLog,
      isSecondHalfRotated,
      currentSeats,
      activeStageCards,
      myVoteTargetId,
      myVoteCategory,
      isMidnightPassed,
      allMutualMatches,
      visibleMatchesForMe,
      isVipUnlockedForMe,
      cmsPages,
      cmsAtmospheres,
      cmsSteps,
      cmsMirrorQuotes,
    ]
  );

  return (
    <NadoSoloContext.Provider value={contextValue}>
      {children}
    </NadoSoloContext.Provider>
  );
}

export function useNadoSoloEngine() {
  const ctx = useContext(NadoSoloContext);
  if (!ctx) {
    throw new Error('useNadoSoloEngine must be used within NadoSoloProvider');
  }
  return ctx;
}
