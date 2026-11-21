import type { Metadata } from 'next';
import './globals.css';
import { NadoSoloProvider } from '@/engine';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import ChunkErrorRecovery from '@/components/ChunkErrorRecovery';
import AdminViewerBanner from '@/components/admin/AdminViewerBanner';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nadosolo.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: '나도솔로',
      alternateName: ['nadosolo', '나도솔로 공식'],
      url: SITE_URL,
      inLanguage: 'ko-KR',
    },
    {
      '@type': 'Organization',
      name: '나도솔로',
      alternateName: 'nadosolo',
      url: SITE_URL,
      description:
        '오프라인 소셜 다이닝 환경에서의 실제 상호작용을 통해 소통 역량과 매너를 다면 관찰하는 소셜 메타인지 플랫폼',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <NadoSoloProvider>
          <AdminViewerBanner />
          <GlobalHeader />
          <div className="flex-1 flex flex-col">{children}</div>
          <GlobalFooter />
        </NadoSoloProvider>
      </body>
    </html>
  );
}
