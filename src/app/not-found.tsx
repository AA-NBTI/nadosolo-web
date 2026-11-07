'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07080a] text-[#f5f2eb] flex flex-col items-center justify-center px-6 text-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
        <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-400 uppercase">
          PAGE NOT FOUND
        </span>
      </div>

      <h1 className="font-serif-editorial text-5xl sm:text-7xl font-light text-white mb-4">
        404
      </h1>

      <p className="text-zinc-400 text-sm sm:text-base font-light max-w-md mb-8 leading-relaxed">
        요청하신 페이지가 존재하지 않거나 비공개 살롱으로 이동되었습니다.
      </p>

      <Link
        href="/"
        className="px-6 py-3.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-xs font-mono tracking-[0.2em] uppercase transition-all duration-300"
      >
        홈으로
      </Link>
    </div>
  );
}

