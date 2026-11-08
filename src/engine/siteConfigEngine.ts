'use client';

import { useState, useEffect } from 'react';

// ============================================================================
// 1. Types: 헤더, 푸터, 메인 섹터 모듈러 타입 정의
// ============================================================================

export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  badge?: string;
  visible: boolean;
  order: number;
}

export interface AnnouncementBarConfig {
  text: string;
  link?: string;
  visible: boolean;
  tag?: string;
}

export type SectorType =
  | 'rolling-hero'
  | 'hero'
  | 'open-tables'
  | 'video-banner'
  | 'categories'
  | 'districts'
  | 'journey'
  | 'venues'
  | 'social-mirror';

export interface SectorSlideData {
  id: string;
  tag: string;
  title: string;
  highlight: string;
  desc: string;
  image: string;
  mediaType?: 'image' | 'video' | 'youtube';
  link: string;
  ctaText: string;
}

export interface SectorCategoryItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  desc: string;
  target?: string;
  image: string;
  href: string;
  visible: boolean;
}

export interface SectorConfig {
  id: string;
  type: SectorType;
  title: string;
  subtitle?: string;
  visible: boolean;
  order: number;

  // 온페이지 직접 편집 지원 커스텀 속성
  headlineTitle?: string;
  headlineHighlight?: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'youtube';
  ctaText?: string;
  ctaLink?: string;
  slides?: SectorSlideData[];
  categoryItems?: SectorCategoryItem[];
}

export interface SocialLinkConfig {
  id: string;
  platform: 'instagram' | 'kakao' | 'youtube' | 'website';
  label: string;
  url: string;
  visible: boolean;
}

export interface FooterConfig {
  companyName: string;
  ceo: string;
  bizNum: string;
  mailOrderNum: string;
  address: string;
  tel: string;
  email: string;
  privacyOfficer: string;
  hosting: string;
  csHours: string;
  copyright: string;
  socialLinks: SocialLinkConfig[];
}

export interface CategorySlideData {
  stage: string;
  title: string;
  desc: string;
  image: string;
  mediaType?: 'image' | 'video' | 'youtube';
}

export interface CategoryPageData {
  badge: string;
  headlineTitle: string;
  headlineHighlight: string;
  description: string;
  activeLocationLabel?: string;
  trustNote?: string;
  slides: [CategorySlideData, CategorySlideData, CategorySlideData, CategorySlideData];
}

// [신규] 버튼 스타일 테마 및 디자인 환경 제어 타입
export type ButtonThemePreset =
  | 'glass-rose' // 은은한 글래스 + 로즈 텍스트 (현재 적용)
  | 'solid-wine' // 솔리드 루비 레드와인
  | 'pure-white' // 퓨어 화이트 & 블랙 텍스트
  | 'dark-outline' // 차콜 다크 아웃라인 & 화이트
  | 'gold-amber'; // 럭셔리 앰버 골드

export type ButtonRoundness = 'md' | 'xl' | 'full';
export type ButtonSize = 'sm' | 'base' | 'lg' | 'xl';

export interface ButtonStyleConfig {
  theme: ButtonThemePreset;
  roundness: ButtonRoundness;
  fontSize: ButtonSize;
}

export const DEFAULT_BUTTON_STYLE: ButtonStyleConfig = {
  theme: 'glass-rose',
  roundness: 'xl',
  fontSize: 'base',
};

// 헬퍼: ButtonStyleConfig를 실제 Tailwind 클래스로 변환
export function resolveButtonClasses(
  style?: Partial<ButtonStyleConfig>,
  extraClasses = ''
): string {
  const merged: ButtonStyleConfig = {
    ...DEFAULT_BUTTON_STYLE,
    ...(style || {}),
  };

  // 1. 테마별 배경/텍스트/테두리 클래스
  let themeCls = '';
  switch (merged.theme) {
    case 'solid-wine':
      themeCls =
        'bg-transparent hover:bg-white/[0.04] text-[#f04f74] border border-[#f04f74] transition-all duration-300';
      break;
    case 'pure-white':
      themeCls =
        'bg-white hover:bg-zinc-100 text-zinc-950 hover:text-[#f04f74] font-bold border border-white transition-all duration-300';
      break;
    case 'dark-outline':
      themeCls =
        'bg-zinc-900/80 hover:bg-white/[0.04] hover:border-[#f04f74] text-white border border-white/20 hover:text-[#f04f74] transition-all duration-300';
      break;
    case 'gold-amber':
      themeCls =
        'bg-transparent hover:bg-white/[0.04] border border-amber-500/50 hover:border-[#f04f74] text-amber-300 hover:text-[#f04f74] transition-all duration-300';
      break;
    case 'glass-rose':
    default:
      themeCls =
        'border border-[#f04f74]/80 hover:border-[#f04f74] bg-black/50 hover:bg-white/[0.04] text-white hover:text-[#f04f74] transition-all duration-300';
      break;
  }

  // 2. 모서리 곡률
  let roundCls = 'rounded-xl';
  if (merged.roundness === 'md') roundCls = 'rounded-lg';
  if (merged.roundness === 'full') roundCls = 'rounded-full';

  // 3. 폰트 크기 및 두께 (샤프하고 세련된 구조)
  let fontCls = 'text-sm sm:text-[15px]';
  if (merged.fontSize === 'sm') fontCls = 'text-xs sm:text-sm';
  if (merged.fontSize === 'base') fontCls = 'text-sm sm:text-[15px]';
  if (merged.fontSize === 'lg') fontCls = 'text-sm sm:text-base';
  if (merged.fontSize === 'xl') fontCls = 'text-base sm:text-lg';

  return `${themeCls} ${roundCls} ${fontCls} font-semibold tracking-wide transition-all duration-200 shadow-md ${extraClasses}`.trim();
}

export interface SiteConfig {
  version: number;
  header: {
    announcement: AnnouncementBarConfig;
    navItems: NavItemConfig[];
    activeCityLabel: string;
  };
  mainSectors: SectorConfig[];
  footer: FooterConfig;
  categoryPages?: Record<string, CategoryPageData>;
  buttonStyle?: ButtonStyleConfig;
}

// ============================================================================
// 2. Default Config: 기본값 (초기 세팅)
// ============================================================================

export const DEFAULT_CATEGORY_ITEMS: SectorCategoryItem[] = [
  {
    id: 'dining',
    title: '소셜 다이닝',
    subtitle: 'Social Dining',
    badge: '모집 진행중',
    desc: '엄선된 셰프의 디너와 와인을 곁들여 깊이 있게 교류하는 신중년 메인 미식 모임입니다.',
    target: '5060 골든 신중년',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
    href: '/dining',
    visible: true,
  },
  {
    id: 'showcase',
    title: '쇼케이스',
    subtitle: 'Brand Showcase',
    badge: '둘러보기',
    desc: '소셜 미러 다면 관찰 엔진과 엄선된 공간, 나도솔로의 브랜드 철학을 한눈에 조망합니다.',
    target: '소셜 메타인지 아카이브',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    href: '/showcase',
    visible: true,
  },
  {
    id: 'salon',
    title: '소셜 살롱',
    subtitle: 'Social Salon',
    badge: '오픈 준비중',
    desc: '예술, 인문학, 와인 페어링을 주제로 조용한 라운지에서 생각을 나누는 지적 소통 공간입니다.',
    target: '취향과 가치관 중심',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
    href: '/dining',
    visible: false,
  },
  {
    id: 'club',
    title: '소셜 클럽',
    subtitle: 'Social Club',
    badge: '오픈 준비중',
    desc: '단발성 모임을 넘어 지속적인 취미 교류와 네트워크를 함께 나누는 신뢰 기반 소셜 클럽입니다.',
    target: '소셜 네트워크 커뮤니티',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=80',
    href: '/dining',
    visible: false,
  },
  {
    id: 'meetup',
    title: '테마 밋업',
    subtitle: 'Theme Meetup',
    badge: '오픈 준비중',
    desc: '와인 나이트, 주말 브런치 등 특정 라이프스타일 테마에 맞춰 자유롭게 신청하는 캐주얼 모임입니다.',
    target: '관심사 중심 소셜 액티비티',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
    href: '/dining',
    visible: false,
  },
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  version: 9,
  header: {
    announcement: {
      text: '부산 5060 골든 소셜 다이닝 참가 신청 안내',
      link: '/dining',
      visible: false,
      tag: 'NOTICE',
    },
    navItems: [
      { id: 'dining', label: '소셜 다이닝', href: '/dining', visible: true, order: 1 },
      { id: 'showcase', label: '쇼케이스', href: '/showcase', visible: true, order: 2 },
      { id: 'salon', label: '소셜 살롱', href: '/salon', visible: false, order: 3 },
      { id: 'club', label: '소셜 클럽', href: '/club', visible: false, order: 4 },
      { id: 'meetup', label: '테마 밋업', href: '/meetup', visible: false, order: 5 },
    ],
    activeCityLabel: '부산',
  },
  buttonStyle: DEFAULT_BUTTON_STYLE,
  mainSectors: [
    {
      id: 'sector-hero',
      type: 'hero',
      title: '에디토리얼 소셜 다이닝 히어로',
      subtitle: '5060 프라이빗 소셜 다이닝',
      headlineTitle: '좋은 대화가 머무는 저녁,',
      headlineHighlight: '삶의 결이 통하는 사람들과 마주합니다',
      description: '엄선된 프라이빗 룸과 셰프의 코스 요리, 그리고 와인 한 잔. 신원과 에티켓이 검증된 분들이 마주 앉아 서로의 품격과 온도를 나누는 5060 소셜 다이닝입니다.',
      ctaText: '테이블 신청하기',
      visible: true,
      order: 1,
    },
    {
      id: 'sector-open-tables',
      type: 'open-tables',
      title: '참가 신청 가능한 프라이빗 테이블',
      subtitle: '이번 주 오픈 테이블',
      visible: true,
      order: 2,
    },
    {
      id: 'sector-journey',
      type: 'journey',
      title: '모임 여정 4단계',
      subtitle: '오늘 밤 당신이 마주할 4가지 우아한 순간',
      visible: true,
      order: 3,
    },
    {
      id: 'sector-social-mirror',
      type: 'social-mirror',
      title: '소셜 다면 관찰 리포트 안내',
      subtitle: '5대 순수 단일 명사 관찰 피드백',
      visible: true,
      order: 4,
    },
    {
      id: 'sector-venues',
      type: 'venues',
      title: '엄선 제휴 공간 갤러리',
      subtitle: '신뢰할 수 있는 프라이빗 와인바 & 다이닝 공간',
      visible: true,
      order: 5,
    },
    {
      id: 'sector-rolling-hero',
      type: 'rolling-hero',
      title: '메인 롤링 쇼케이스',
      subtitle: '부산 소셜 다이닝 쇼케이스',
      visible: false,
      order: 6,
    },
    {
      id: 'sector-categories',
      type: 'categories',
      title: '소셜 프로그램 라인업',
      subtitle: '소셜 다이닝 프로그램 안내',
      categoryItems: DEFAULT_CATEGORY_ITEMS,
      visible: false,
      order: 7,
    },
    {
      id: 'sector-video-banner',
      type: 'video-banner',
      title: '프라이빗 앰비언트 비디오 배너',
      subtitle: '와인 & 다이닝 분위기 무한루프 동영상 배너',
      visible: false,
      order: 8,
    },
    {
      id: 'sector-districts',
      type: 'districts',
      title: '권역별 탐색',
      subtitle: '부산 중심 권역 안내',
      visible: false,
      order: 9,
    },
  ],
  footer: {
    companyName: '템바보드 주식회사',
    ceo: '박경민',
    bizNum: '107-88-44796',
    mailOrderNum: '제 2026-부산사하-0589호',
    address: '부산광역시 사하구 하신번영로 328, 302호 (하단동)',
    tel: '051-208-8746',
    email: 'nadosoloteam@gmail.com',
    privacyOfficer: '박경민',
    hosting: 'Vercel Inc.',
    csHours: '평일 10:00 ~ 18:00 (주말 및 공휴일 휴무)',
    copyright: '© 2026 nadosolo.com. All rights reserved.',
    socialLinks: [
      { id: 'insta', platform: 'instagram', label: '인스타그램', url: 'https://instagram.com', visible: true },
      { id: 'kakao', platform: 'kakao', label: '카카오톡 채널', url: 'https://pf.kakao.com', visible: true },
    ],
  },
};

const STORAGE_KEY = 'NADOSOLO_SITE_CONFIG_V150_CLEAN';
const EDIT_MODE_STORAGE_KEY = 'NADOSOLO_VISUAL_EDIT_MODE';

// ============================================================================
// 3. Storage Helpers & Custom Event
// ============================================================================

export function getStoredSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONFIG;
    const parsed = JSON.parse(raw);

    // 안전한 Deep Merge 및 Fallback 처리
    const rawNavItems =
      Array.isArray(parsed.header?.navItems) && parsed.header.navItems.length > 0
        ? parsed.header.navItems
        : DEFAULT_SITE_CONFIG.header.navItems;

    // showcase 메뉴가 누락되었을 경우 기본 병합
    const hasShowcase = rawNavItems.some(
      (item: NavItemConfig) => item.id === 'showcase' || item.href === '/showcase'
    );
    const mergedNavItems = hasShowcase
      ? rawNavItems
      : [
          ...rawNavItems,
          { id: 'showcase', label: '쇼케이스', href: '/showcase', visible: true, order: 2 },
        ].sort((a, b) => a.order - b.order);

    const mergedHeader = {
      ...DEFAULT_SITE_CONFIG.header,
      ...(parsed.header || {}),
      announcement: {
        ...DEFAULT_SITE_CONFIG.header.announcement,
        ...(parsed.header?.announcement || {}),
      },
      navItems: mergedNavItems,
    };

    const mergedFooter = {
      ...DEFAULT_SITE_CONFIG.footer,
      ...(parsed.footer || {}),
      socialLinks:
        Array.isArray(parsed.footer?.socialLinks) && parsed.footer.socialLinks.length > 0
          ? parsed.footer.socialLinks
          : DEFAULT_SITE_CONFIG.footer.socialLinks,
    };

    // 기존 섹터 목록과 기본 섹터 목록의 병합
    const storedSectors: SectorConfig[] = Array.isArray(parsed.mainSectors) ? parsed.mainSectors : [];
    const mergedSectors: SectorConfig[] = DEFAULT_SITE_CONFIG.mainSectors.map((defSector) => {
      const match = storedSectors.find((s) => s.id === defSector.id);
      if (!match) return defSector;
      return {
        ...defSector,
        ...match,
        categoryItems:
          Array.isArray(match.categoryItems) && match.categoryItems.length > 0
            ? match.categoryItems
            : defSector.categoryItems,
      };
    });

    storedSectors.forEach((s) => {
      if (!mergedSectors.some((m) => m.id === s.id)) {
        mergedSectors.push(s);
      }
    });

    return {
      version: 4,
      header: mergedHeader,
      buttonStyle: parsed.buttonStyle || DEFAULT_SITE_CONFIG.buttonStyle,
      mainSectors: mergedSectors.sort((a, b) => a.order - b.order),
      footer: mergedFooter,
      categoryPages: parsed.categoryPages || {},
    };
  } catch (err) {
    console.error('Failed to parse site config from storage:', err);
    return DEFAULT_SITE_CONFIG;
  }
}

export function saveStoredSiteConfig(config: SiteConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('nadosolo_site_config_updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save site config to storage:', err);
  }
}

export function resetStoredSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONFIG;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('nadosolo_site_config_updated', { detail: DEFAULT_SITE_CONFIG })
    );
  } catch (err) {
    console.error('Failed to reset site config:', err);
  }
  return DEFAULT_SITE_CONFIG;
}

// ============================================================================
// 4. 온페이지 비주얼 에디터 모드 상태 제어
// ============================================================================

export function getStoredEditMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(EDIT_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setStoredEditMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EDIT_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('nadosolo_edit_mode_changed', { detail: enabled }));
  } catch (err) {
    console.error('Failed to save edit mode to storage:', err);
  }
}

// ============================================================================
// 5. React Hooks: useSiteConfig & useVisualEditor
// ============================================================================

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setConfig(getStoredSiteConfig());
    setIsLoaded(true);

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SiteConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getStoredSiteConfig());
      }
    };

    window.addEventListener('nadosolo_site_config_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('nadosolo_site_config_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateConfig = (newConfig: SiteConfig) => {
    saveStoredSiteConfig(newConfig);
    setConfig(newConfig);
  };

  const updateSectorConfig = (sectorId: string, updates: Partial<SectorConfig>) => {
    const updatedSectors = (config.mainSectors || []).map((sec) =>
      sec.id === sectorId ? { ...sec, ...updates } : sec
    );
    const newConfig = { ...config, mainSectors: updatedSectors };
    updateConfig(newConfig);
  };

  const updateButtonStyle = (newStyle: Partial<ButtonStyleConfig>) => {
    const updated = {
      ...DEFAULT_BUTTON_STYLE,
      ...(config.buttonStyle || {}),
      ...newStyle,
    };
    updateConfig({ ...config, buttonStyle: updated });
  };

  const resetConfig = () => {
    const res = resetStoredSiteConfig();
    setConfig(res);
  };

  return {
    config,
    isLoaded,
    updateConfig,
    updateSectorConfig,
    updateButtonStyle,
    resetConfig,
  };
}

export function useVisualEditor() {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  useEffect(() => {
    setIsEditMode(getStoredEditMode());

    const handleModeChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsEditMode(customEvent.detail);
    };

    window.addEventListener('nadosolo_edit_mode_changed', handleModeChange);
    return () => {
      window.removeEventListener('nadosolo_edit_mode_changed', handleModeChange);
    };
  }, []);

  const toggleEditMode = () => {
    const next = !isEditMode;
    setStoredEditMode(next);
    setIsEditMode(next);
  };

  return {
    isEditMode,
    toggleEditMode,
    setEditMode: (val: boolean) => {
      setStoredEditMode(val);
      setIsEditMode(val);
    },
  };
}
