import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import ChunkErrorRecovery from '@/components/ChunkErrorRecovery';
import AppShell from '@/components/AppShell';
import { isTablebaroHost } from '@/modules/tenancy';

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get('host');
  const isTablebaro = isTablebaroHost(host);

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
  const isTablebaro = isTablebaroHost(host);
  const siteUrl = isTablebaro
    ? `https://${(host || 'tablebaro.com').split(':')[0]}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://nadosolo.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: isTablebaro ? '테이블바로' : '나도솔로',
        alternateName: isTablebaro ? ['tablebaro', '테이블바로 공식'] : ['nadosolo', '나도솔로 공식'],
        url: siteUrl,
        inLanguage: 'ko-KR',
      },
      {
        '@type': 'Organization',
        name: isTablebaro ? '테이블바로' : '나도솔로',
        alternateName: isTablebaro ? 'tablebaro' : 'nadosolo',
        url: siteUrl,
        description: isTablebaro
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
        <AppShell initialIsTablebaro={isTablebaro}>{children}</AppShell>
      </body>
    </html>
  );
}
