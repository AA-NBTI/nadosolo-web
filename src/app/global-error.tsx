'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
    // ChunkLoadError 등 신규 배포 청크 누락일 경우 자동 새로고침 시도
    if (
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Failed to fetch')
    ) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="ko">
      <body className="bg-[#090a0f] text-white min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#12151e] border border-white/10 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              화면을 불러오는 중입니다
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              새로운 기능이 업데이트되어 화면을 갱신합니다.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full py-3.5 rounded-xl bg-[#f04f74] hover:bg-[#e04568] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-lg"
            >
              새로고침
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

