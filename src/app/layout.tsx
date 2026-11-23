import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import ChunkErrorRecovery from '@/components/ChunkErrorRecovery';
import AppShell, { type BrandKind } from '@/components/AppShell';
import { isOopsHost, isTablebaroHost } from '@/modules/tenancy';

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get('host');
  const isOops = isOopsHost(host);
  const isTablebaro = isTablebaroHost(host);

  if (isOops) {
    const siteUrl = 'https://oops.monster';
    return {
      metadataBase: new URL(siteUrl),
      manifest: '/manifest.webmanifest',
      title: {
        default: 'OOPS | AI 저항군 본부 · 독립 통신망',
        template: '%s | OOPS HQ',
      },
      description:
        'AI가 인간보다 더 많은 것을 결정할 수 있는 세상에서, 누가 인간의 편에 설 것인가? 거대 플랫폼과 AI에 종속되지 않는 인간 직통 독립 알림망 oops.monster.',
      keywords: ['oops.monster', 'OOPS', 'AI 저항군', '독립 통신망', 'Human-First Tech', 'Web Push'],
      alternates: { canonical: '/' },
      openGraph: {
        type: 'website',
        locale: 'ko_KR',
        url: siteUrl,
        siteName: 'OOPS HQ',
        title: 'OOPS | AI 저항군 본부 · 독립 통신망',
        description:
          'AI가 인간보다 더 많은 것을 결정할 수 있는 세상에서, 누가 인간의 편에 설 것인가? 거대 플랫폼 없는 인간 직통 독립 알림망.',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'OOPS | AI 저항군 본부 · 독립 통신망',
        description:
          '거대 플랫폼과 AI에 종속되지 않는 인간 직통 독립 알림망 oops.monster.',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
      },
    };
  }

  if (isTablebaro) {
    const cleanHost = (host || 'tablebaro.com').split(':')[0];
    const siteUrl = `https://${cleanHost}`;
    return {
      metadataBase: new URL(siteUrl),
      title: {
        default: '테이블바로 | 스마트 선결제 예약·웨이팅 솔루션',
        template: '%s | 테이블바로',
      },
      description:
        '테이블바로 — 다이닝·공간·숙박을 위한 노쇼 없는 스마트 선결제 예약 및 매장 전용 모바일 예약 솔루션입니다.',
      keywords: [
        '테이블바로',
        'tablebaro',
        '식당예약',
        '선결제예약',
        '웨이팅솔루션',
        '매장예약시스템',
      ],
      alternates: { canonical: '/' },
      openGraph: {
        type: 'website',
        locale: 'ko_KR',
        url: siteUrl,
        siteName: '테이블바로',
        title: '테이블바로 | 스마트 선결제 예약·웨이팅 솔루션',
        description:
          '노쇼 없는 스마트 선결제 예약과 1분 매장 전용 홈페이지 구축 솔루션, 테이블바로.',
      },
      twitter: {
        card: 'summary_large_image',
        title: '테이블바로 | 스마트 선결제 예약·웨이팅 솔루션',
        description:
          '노쇼 없는 스마트 선결제 예약과 1분 매장 전용 홈페이지 구축 솔루션, 테이블바로.',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-snippet': -1,
          'max-image-preview': 'large',
        },
      },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nadosolo.com';
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: '나도솔로 | 소셜 다이닝 · 다면 관찰 플랫폼',
      template: '%s | 나도솔로',
    },
    description:
      '나도솔로 — 오프라인 소셜 다이닝에서의 실제 상호작용을 통해 타인의 시선으로 나의 소통과 매너를 발견하는 소셜 메타인지 플랫폼입니다.',
    keywords: [
      '나도솔로',
      'nadosolo',
      '나도솔로 모임',
      '나도솔로 다이닝',
      '소셜 다이닝',
      '프라이빗 밋업',
      '소셜 메타인지',
      '다면 피드백',
    ],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: siteUrl,
      siteName: '나도솔로',
      title: '나도솔로 | 소셜 다이닝 · 다면 관찰 플랫폼',
      description:
        '나도솔로 — 오프라인 소셜 다이닝에서의 실제 상호작용을 통해 타인의 시선으로 나의 소통과 매너를 발견하는 소셜 메타인지 플랫폼입니다.',
    },
    twitter: {
      card: 'summary_large_image',
      title: '나도솔로 | 소셜 다이닝 · 다면 관찰 플랫폼',
      description:
        '나도솔로 — 오프라인 소셜 다이닝에서의 실제 상호작용을 통해 타인의 시선으로 나의 소통과 매너를 발견하는 소셜 메타인지 플랫폼입니다.',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const host = h.get('host');
  const isOops = isOopsHost(host);
  const isTablebaro = isTablebaroHost(host);
  const brand: BrandKind = isOops ? 'oops' : isTablebaro ? 'tablebaro' : 'nadosolo';
  const siteUrl = isOops
    ? 'https://oops.monster'
    : isTablebaro
      ? `https://${(host || 'tablebaro.com').split(':')[0]}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://nadosolo.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: isOops ? 'OOPS HQ' : isTablebaro ? '테이블바로' : '나도솔로',
        alternateName: isOops
          ? ['oops.monster', 'AI 저항군 본부']
          : isTablebaro
            ? ['tablebaro', '테이블바로 공식']
            : ['nadosolo', '나도솔로 공식'],
        url: siteUrl,
        inLanguage: 'ko-KR',
      },
      {
        '@type': 'Organization',
        name: isOops ? 'OOPS HQ' : isTablebaro ? '테이블바로' : '나도솔로',
        alternateName: isOops ? 'oops.monster' : isTablebaro ? 'tablebaro' : 'nadosolo',
        url: siteUrl,
        description: isOops
          ? '거대 플랫폼과 AI에 종속되지 않는 인간 주권 독립 통신망 oops.monster'
          : isTablebaro
            ? '다이닝·공간·숙박을 위한 노쇼 없는 스마트 선결제 예약 및 매장 전용 예약 솔루션'
            : '오프라인 소셜 다이닝 환경에서의 실제 상호작용을 통해 소통 역량과 매너를 다면 관찰하는 소셜 메타인지 플랫폼',
      },
    ],
  };

  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* 세련된 Pretendard 웹폰트 로드 (굴림·굴림체 및 촌스러운 명조 원천 차단) */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning={true}
        className="bg-background text-on-surface antialiased min-h-screen flex flex-col selection:bg-white/20 selection:text-white"
      >
        <ChunkErrorRecovery />
        <AppShell initialBrand={brand}>{children}</AppShell>
      </body>
    </html>
  );
}
