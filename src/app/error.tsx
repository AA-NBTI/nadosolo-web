'use client';

import React, { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AppError]', error);
    if (
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Failed to fetch')
    ) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12151e] border border-white/10 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
          !
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            일시적인 연결 오류가 발생했습니다
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            최신 업데이트 버전으로 화면을 다시 불러옵니다.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3.5 rounded-xl bg-[#f04f74] hover:bg-[#e04568] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-lg"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
}
