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
  | 'video-banner'
  | 'categories'
  | 'districts'
  | 'journey'
  | 'venues';

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
  fontSize: 'lg',
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
        'bg-rose-600 hover:bg-rose-700 text-white border border-rose-500 shadow-rose-950/50';
      break;
    case 'pure-white':
      themeCls =
        'bg-white hover:bg-zinc-200 text-zinc-950 font-bold border border-white shadow-zinc-900/50';
      break;
    case 'dark-outline':
      themeCls =
        'bg-zinc-900/80 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 shadow-black/60';
      break;
    case 'gold-amber':
      themeCls =
        'bg-amber-950/40 hover:bg-amber-600 border border-amber-500/40 hover:border-amber-500 text-amber-300 hover:text-white shadow-amber-950/40';
      break;
    case 'glass-rose':
    default:
      themeCls =
        'border border-white/15 bg-white/10 hover:bg-white/20 hover:border-white/30 text-rose-400 hover:text-white shadow-black/40';
      break;
  }

  // 2. 모서리 곡률
  let roundCls = 'rounded-xl';
  if (merged.roundness === 'md') roundCls = 'rounded-lg';
  if (merged.roundness === 'full') roundCls = 'rounded-full';

  // 3. 폰트 크기
  let fontCls = 'text-base sm:text-lg';
  if (merged.fontSize === 'sm') fontCls = 'text-xs sm:text-sm';
  if (merged.fontSize === 'base') fontCls = 'text-sm sm:text-base';
  if (merged.fontSize === 'xl') fontCls = 'text-lg sm:text-xl';

  return `${themeCls} ${roundCls} ${fontCls} font-bold transition-all duration-200 shadow-lg ${extraClasses}`.trim();
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

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  version: 5,
  header: {
    announcement: {
      text: '🍷 부산 3040 & 5060 소셜 다이닝 참가 신청 안내',
      link: '/dining',
      visible: true,
      tag: 'NOTICE',
    },
    navItems: [
      { id: 'dining', label: '소셜 다이닝', href: '/dining', badge: '대표', visible: true, order: 1 },
      { id: 'salon', label: '소셜 살롱', href: '/salon', visible: false, order: 2 },
      { id: 'club', label: '소셜 클럽', href: '/club', visible: false, order: 3 },
      { id: 'meetup', label: '테마 밋업', href: '/meetup', badge: '준비중', visible: false, order: 4 },
    ],
    activeCityLabel: '부산',
  },
  buttonStyle: DEFAULT_BUTTON_STYLE,
  mainSectors: [
    {
      id: 'sector-rolling-hero',
      type: 'rolling-hero',
      title: '메인 롤링 쇼케이스',
      subtitle: '부산 소셜 다이닝 쇼케이스',
      visible: true,
      order: 1,
    },
    {
      id: 'sector-hero',
      type: 'hero',
      title: '소셜 다이닝 헤드라인',
      subtitle: '부산 소셜 다이닝 집중 조명',
      headlineTitle: '좋은 사람들과 나누는',
      headlineHighlight: '부산 소셜 다이닝',
      description: '에티켓 서약 기반의 프라이빗 다이닝 테이블. 와인과 디너, 진솔한 대화가 있는 시간.',
      ctaText: '신청하기',
      visible: true,
      order: 2,
    },
    {
      id: 'sector-video-banner',
      type: 'video-banner',
      title: '프라이빗 앰비언트 비디오 배너',
      subtitle: '와인 & 다이닝 분위기 무한루프 동영상 배너',
      headlineTitle: '오직 신뢰할 수 있는 사람들과의',
      headlineHighlight: '가장 특별한 밤의 사교',
      description: '엄선된 와인과 셰프의 디너, 편안한 대화가 흐르는 나도솔로 프라이빗 다이닝 클럽입니다.',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-red-wine-in-a-glass-at-a-dinner-table-42646-large.mp4',
      mediaType: 'video',
      ctaText: '신청하기',
      ctaLink: '/dining',
      visible: false,
      order: 3,
    },
    {
      id: 'sector-categories',
      type: 'categories',
      title: '4대 메인 카테고리',
      subtitle: '소셜 다이닝 프로그램 안내',
      visible: true,
      order: 4,
    },
    {
      id: 'sector-districts',
      type: 'districts',
      title: '권역별 탐색',
      subtitle: '부산 중심 권역 안내',
      visible: true,
      order: 5,
    },
    {
      id: 'sector-journey',
      type: 'journey',
      title: '모임 여정 4단계',
      subtitle: '착석 ➡️ 대화 ➡️ 식사 ➡️ 매너평가',
      visible: true,
      order: 6,
    },
    {
      id: 'sector-venues',
      type: 'venues',
      title: '엄선 제휴 공간 갤러리',
      subtitle: '신뢰할 수 있는 프라이빗 와인바 & 다이닝 공간',
      visible: true,
      order: 7,
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

const STORAGE_KEY = 'NADOSOLO_SITE_CONFIG_V120';
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
    const mergedHeader = {
      ...DEFAULT_SITE_CONFIG.header,
      ...(parsed.header || {}),
      announcement: {
        ...DEFAULT_SITE_CONFIG.header.announcement,
        ...(parsed.header?.announcement || {}),
      },
      navItems:
        Array.isArray(parsed.header?.navItems) && parsed.header.navItems.length > 0
          ? parsed.header.navItems
          : DEFAULT_SITE_CONFIG.header.navItems,
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
      return match ? { ...defSector, ...match } : defSector;
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
