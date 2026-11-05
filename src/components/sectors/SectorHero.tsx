'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, MapPin, ArrowRight, ShieldCheck, Users } from 'lucide-react';

interface SectorHeroProps {
  onOpenCheckout?: () => void;
  onOpenCityModal?: () => void;
}

export default function SectorHero({ onOpenCheckout, onOpenCityModal }: SectorHeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#090a0f] via-[#120f18] to-[#090a0f] py-16 sm:py-24 border-b border-white/5">
      {/* 앰비언스 배경 라이트 효과 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-950/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* 상단 1열: 거점 활성화 칩 & 서울 확장 안내 스위처 */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          <button
            type="button"
            onClick={onOpenCityModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>부산 (전포·서면·해운대) 매주 금/토 진행중</span>
            <span className="text-[10px] text-zinc-400">변경 ▼</span>
          </button>

          <Link
            href="/seoul"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>서울 (성수·강남·한남) 2차 오픈예정 알림</span>
            <ArrowRight className="w-3 h-3 text-zinc-500" />
          </Link>
        </div>

        {/* 메인 헤드라인 & 슬로건 */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-rose-400 uppercase">
            Curated Private Social Dining & Salon
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif-editorial font-bold text-white tracking-tight leading-[1.2]">
            결이 맞는 사람들과의<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-400 to-amber-200">
              품격 있는 주말 다이닝
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            끝없는 스와이프와 어색한 침묵 대신, 에티켓과 결이 검증된 솔로들이 모여
            미식과 와인, 그리고 진솔한 대화를 나누는 프라이빗 소셜 살롱입니다.
          </p>
        </div>

        {/* 액션 CTA 버튼 영역 */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenCheckout}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-700 text-white font-semibold text-sm sm:text-base hover:opacity-95 shadow-lg shadow-rose-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-rose-200" />
            <span>이번 주 모임 참여하기</span>
          </button>

          <Link
            href="/dining"
            className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 hover:text-white hover:bg-white/10 font-medium text-sm sm:text-base transition-all flex items-center gap-2"
          >
            <span>소셜 다이닝 자세히 보기</span>
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>

        {/* 하단 신뢰 지표 카드 3열 */}
        <div className="mt-14 pt-10 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xl sm:text-2xl font-bold text-white font-serif-editorial">3045 & 5060</p>
            <p className="text-xs text-zinc-400 mt-0.5">연령·성향별 맞춤 테이블 큐레이션</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xl sm:text-2xl font-bold text-rose-400 font-serif-editorial">100% 검증</p>
            <p className="text-xs text-zinc-400 mt-0.5">신원 확인 및 비매너 원스트라이크 아웃</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xl sm:text-2xl font-bold text-amber-300 font-serif-editorial">엄선된 제휴 공간</p>
            <p className="text-xs text-zinc-400 mt-0.5">프라이빗 룸 & 감성 와인바 단독 대관</p>
          </div>
        </div>

      </div>
    </section>
  );
}
