import React from 'react';

/**
 * OOPS.MONSTER 전역 레이아웃 래퍼
 * - 하위 모든 페이지(/, /methodology, /archive, /case/*, /app 등)에 .oops-theme를 자동 적용하여
 *   상위 Nadosolo 다크 테마의 ::selection(흰색 글자) 및 기본 스타일 간섭을 원천 차단합니다.
 */
export default function OopsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="oops-theme min-h-screen selection:bg-[#d4d4d8] selection:text-black">
      {children}
    </div>
  );
}
