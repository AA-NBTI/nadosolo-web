import type { Metadata } from 'next';
import './globals.css';
import { NadoSoloProvider } from '@/engine';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import VisualEditorToolbar from '@/components/editor/VisualEditorToolbar';

export const metadata: Metadata = {
  title: 'nadosolo | 좋은 사람들과, 좋은 시간을. 신뢰 기반 프리미엄 솔로 라이프스타일 플랫폼',
  description:
    '검증된 매너와 삶의 결이 맞는 사람들의 만남. 3045 프라임 & 5060 골든 솔로를 위한 소셜 다이닝 및 라이프스타일 소셜 클럽',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
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
      <body className="bg-background text-on-surface antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary">
        <NadoSoloProvider>
          <GlobalHeader />
          <div className="flex-1 flex flex-col">{children}</div>
          <GlobalFooter />
          <VisualEditorToolbar />
        </NadoSoloProvider>
      </body>
    </html>
  );
}
