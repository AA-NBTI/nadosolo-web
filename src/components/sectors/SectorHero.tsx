'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface SectorHeroProps {
  onOpenCheckout?: () => void;
  onOpenCityModal?: () => void;
}

export default function SectorHero({ onOpenCheckout, onOpenCityModal }: SectorHeroProps) {
  return (
    <section className="relative w-full bg-[#090a0f] py-16 sm:py-24 border-b border-white/10">
      <div className="relative w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* 상단 1열: 거점 안내 칩 (단정한 모노크롬 & 와인레드 포인트) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          <button
            type="button"
            onClick={onOpenCityModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>부산 (전포·서면·해운대) 진행중</span>
            <span className="text-[10px] text-zinc-500">▼</span>
          </button>
        </div>

        {/* 메인 헤드라인 & 슬로건 */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-zinc-400 uppercase">
            Private Social Dining &amp; Salon
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif-editorial font-bold text-white tracking-tight leading-[1.2]">
            결이 맞는 사람들과의<br />
            품격 있는 주말 다이닝
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            끝없는 스와이프와 어색한 침묵 대신, 에티켓과 결이 검증된 솔로들이 모여
            미식과 와인, 그리고 진솔한 대화를 나누는 프라이빗 소셜 살롱입니다.
          </p>
        </div>

        {/* 액션 버튼 영역 (간결화 & 고급화) */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenCheckout}
            className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm sm:text-base transition-colors cursor-pointer"
          >
            신청하기
          </button>

          <Link
            href="/dining"
            className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 hover:text-white hover:bg-white/10 font-medium text-sm sm:text-base transition-all flex items-center gap-2"
          >
            <span>자세히 보기</span>
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>

        {/* 하단 신뢰 지표 3열 (블랙/그레이/와인레드 모노크롬 통일) */}
        <div className="mt-14 pt-10 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xl sm:text-2xl font-bold text-white font-serif-editorial">3045 &amp; 5060</p>
            <p className="text-xs text-zinc-400 mt-1">연령·성향별 맞춤 테이블 큐레이션</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xl sm:text-2xl font-bold text-rose-500 font-serif-editorial">100% 신뢰</p>
            <p className="text-xs text-zinc-400 mt-1">에티켓 서약 및 비매너 원아웃제</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xl sm:text-2xl font-bold text-white font-serif-editorial">엄선된 공간</p>
            <p className="text-xs text-zinc-400 mt-1">프라이빗 룸 &amp; 와인바 단독 테이블</p>
          </div>
        </div>

      </div>
    </section>
  );
}
