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

export type SectorType = 'hero' | 'categories' | 'districts' | 'journey' | 'venues';

export interface SectorConfig {
  id: string;
  type: SectorType;
  title: string;
  subtitle?: string;
  visible: boolean;
  order: number;
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

export interface SiteConfig {
  version: number;
  header: {
    announcement: AnnouncementBarConfig;
    navItems: NavItemConfig[];
    activeCityLabel: string;
  };
  mainSectors: SectorConfig[];
  footer: FooterConfig;
}

// ============================================================================
// 2. Default Config: 기본값 (초기 세팅)
// ============================================================================

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  version: 1,
  header: {
    announcement: {
      text: '🍷 이번 주 금요일 전포/서면 3040 & 5060 소셜 다이닝 좌석 마감 임박!',
      link: '/dining',
      visible: true,
      tag: 'HOT',
    },
    navItems: [
      { id: 'dining', label: '소셜 다이닝', href: '/dining', badge: '대표', visible: true, order: 1 },
      { id: 'salon', label: '소셜 살롱', href: '/salon', visible: true, order: 2 },
      { id: 'club', label: '소셜 클럽', href: '/club', visible: true, order: 3 },
      { id: 'meetup', label: '테마 밋업', href: '/meetup', badge: 'NEW', visible: true, order: 4 },
    ],
    activeCityLabel: '부산 (전포·서면)',
  },
  mainSectors: [
    { id: 'sector-hero', type: 'hero', title: '거점 히어로 배너', subtitle: '선택된 도시 집중 조명 및 2차 오픈예정 알림', visible: true, order: 1 },
    { id: 'sector-categories', type: 'categories', title: '4대 메인 카테고리', subtitle: '소셜 다이닝, 살롱, 클럽, 밋업 쇼케이스', visible: true, order: 2 },
    { id: 'sector-districts', type: 'districts', title: '권역별 탐색', subtitle: '전포·서면, 해운대·광안리, 남포·영도 등', visible: true, order: 3 },
    { id: 'sector-journey', type: 'journey', title: '모임 여정 4단계', subtitle: '착석 ➡️ 대화 ➡️ 식사 ➡️ 매너평가', visible: true, order: 4 },
    { id: 'sector-venues', type: 'venues', title: '엄선 제휴 공간 갤러리', subtitle: '신뢰할 수 있는 프라이빗 와인바 & 다이닝 공간', visible: true, order: 5 },
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

const STORAGE_KEY = 'NADOSOLO_SITE_CONFIG_V1';

// ============================================================================
// 3. Storage Helpers & Custom Event
// ============================================================================

export function getStoredSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SITE_CONFIG,
      ...parsed,
      header: { ...DEFAULT_SITE_CONFIG.header, ...(parsed.header || {}) },
      footer: { ...DEFAULT_SITE_CONFIG.footer, ...(parsed.footer || {}) },
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
    window.dispatchEvent(new CustomEvent('nadosolo_site_config_updated', { detail: DEFAULT_SITE_CONFIG }));
  } catch (err) {
    console.error('Failed to reset site config:', err);
  }
  return DEFAULT_SITE_CONFIG;
}

// ============================================================================
// 4. React Hook: useSiteConfig
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

  const resetConfig = () => {
    const res = resetStoredSiteConfig();
    setConfig(res);
  };

  return {
    config,
    isLoaded,
    updateConfig,
    resetConfig,
  };
}

