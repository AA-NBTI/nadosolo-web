import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { isOopsHost, isTablebaroHost } from '@/modules/tenancy';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const h = await headers();
  const host = h.get('host');
  const isOops = isOopsHost(host);
  const isTablebaro = isTablebaroHost(host);

  if (isOops) {
    return {
      name: 'OOPS HQ — AI 저항군 독립 통신망',
      short_name: 'OOPS',
      description: '거대 플랫폼과 AI에 종속되지 않는 인간 직통 독립 알림망',
      start_url: '/',
      display: 'standalone',
      background_color: '#07080a',
      theme_color: '#07080a',
      icons: [{ src: '/icon', sizes: '32x32', type: 'image/png' }],
    };
  }

  if (isTablebaro) {
    return {
      name: '테이블바로 — 스마트 선결제 예약 솔루션',
      short_name: '테이블바로',
      start_url: '/',
      display: 'standalone',
      background_color: '#07080a',
      theme_color: '#07080a',
      icons: [{ src: '/icon', sizes: '32x32', type: 'image/png' }],
    };
  }

  return {
    name: '나도솔로 — 소셜 다이닝 · 다면 관찰 플랫폼',
    short_name: '나도솔로',
    start_url: '/',
    display: 'standalone',
    background_color: '#07080a',
    theme_color: '#07080a',
    icons: [{ src: '/icon', sizes: '32x32', type: 'image/png' }],
  };
}
