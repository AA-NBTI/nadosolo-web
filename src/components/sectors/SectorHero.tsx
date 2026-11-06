'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useVisualEditor, SectorConfig } from '@/engine/siteConfigEngine';

interface SectorHeroProps {
  config?: SectorConfig;
  onUpdate?: (updates: Partial<SectorConfig>) => void;
  onOpenCheckout?: () => void;
}

export default function SectorHero({ config, onUpdate, onOpenCheckout }: SectorHeroProps) {
  const { isEditMode } = useVisualEditor();

  return (
    <section className="relative w-full min-h-[92vh] flex flex-col justify-between bg-[#07080a] text-[#f5f2eb] px-6 sm:px-12 lg:px-20 pt-16 pb-14 border-b border-white/[0.08] overflow-hidden">
      
      {/* ==============================================================
          배경: CORE: Club 스타일의 압도적인 풀스크린 건축적 앰비언스
          ============================================================== */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1590846406792-04a0f443b092?auto=format&fit=crop&w=2400&q=90"
          alt="프라이빗 소셜 클럽 다이닝 룸"
          className="w-full h-full object-cover object-center filter brightness-[0.4] contrast-110 scale-105"
        />
        {/* 극도의 미니멀 다크 비네팅 & 은은한 앰버 섀도우 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/60 to-black/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#07080a_95%)] pointer-events-none" />
      </div>

      {/* ==============================================================
          [상단]: CORE: Club 시그니처 미니멀 메타 바 (Tracked-out uppercase)
          ============================================================== */}
      <div className="relative z-10 w-full flex items-center justify-between border-b border-white/[0.1] pb-6">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.35em] text-zinc-400 uppercase font-light">
            NADOSOLO PRIVATE SALON • BUSAN
          </span>
        </div>
        <div className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] text-zinc-500 uppercase hidden sm:block">
          INVITATION ONLY • EST. 2026
        </div>
      </div>

      {/* ==============================================================
          [중앙]: 압도적인 럭셔리 에디토리얼 세리프 헤드라인
          장황한 사족을 100% 덜어내고, 여백과 활자의 품격으로 공간을 지배
          ============================================================== */}
      <div className="relative z-10 my-auto py-16 sm:py-24 max-w-4xl space-y-8">
        
        <div className="space-y-3">
          <p className="text-[11px] sm:text-xs font-mono tracking-[0.3em] text-[#f04f74] uppercase font-semibold">
            A Sanctuary for Refined Minds
          </p>

          <h1 className="font-serif-editorial text-4xl sm:text-6xl lg:text-[72px] font-normal text-white tracking-tight leading-[1.12]">
            소음이 닿지 않는 밤,<br />
            <span className="font-light italic text-[#e6e2d8]">지성과 취향이 마주하는 식탁</span>
          </h1>
        </div>

        <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed max-w-xl tracking-wide">
          엄선된 프라이빗 룸과 셰프의 시그니처 코스 요리, 소믈리에 와인 페어링.<br className="hidden sm:inline" />
          신원과 에티켓이 검증된 분들이 마주 앉아 서로의 품격과 온도를 나누는 5060 프라이빗 소셜 다이닝 클럽입니다.
        </p>

        {/* CORE: Club의 시그니처 액션: 디지털 벨벳 로프 [REQUEST INVITATION] */}
        <div className="pt-4 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={onOpenCheckout}
            className="group px-8 py-4 rounded-none border border-[#f04f74] bg-transparent hover:bg-[#f04f74] text-[#f04f74] hover:text-white text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-500 cursor-pointer flex items-center gap-3 shadow-[0_0_30px_rgba(240,79,116,0.25)]"
          >
            <span>REQUEST INVITATION</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>

          <Link
            href="/guide"
            className="px-6 py-4 text-xs font-mono tracking-[0.2em] text-zinc-400 hover:text-white uppercase transition-colors flex items-center gap-2"
          >
            <span>THE PROTOCOL</span>
            <span className="text-[10px] text-zinc-600">→</span>
          </Link>
        </div>

      </div>

      {/* ==============================================================
          [하단]: CORE: Club 스타일의 3대 미니멀 메타 인덱스 (Index Columns)
          ============================================================== */}
      <div className="relative z-10 w-full pt-8 border-t border-white/[0.1] grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-xs">
        
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-[#f04f74] uppercase block font-semibold">
            01 / CURATED SYNERGY
          </span>
          <p className="text-zinc-300 font-serif-editorial text-sm">3:3 맞춤 밸런스 테이블</p>
          <p className="text-zinc-500 text-[11px] font-light leading-relaxed">
            나도솔로 매칭 엔진이 성향, 커리어, 가치관을 분석하여 최적의 테이블을 편성합니다.
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-[#f04f74] uppercase block font-semibold">
            02 / ABSOLUTE DISCRETION
          </span>
          <p className="text-zinc-300 font-serif-editorial text-sm">철저한 익명성과 안전망</p>
          <p className="text-zinc-500 text-[11px] font-light leading-relaxed">
            100% 에티켓 사전 서약 회원만 참석하며, 비매너 행위자는 시스템에서 영구 제외됩니다.
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-[#f04f74] uppercase block font-semibold">
            03 / SOCIAL DOSSIER
          </span>
          <p className="text-zinc-300 font-serif-editorial text-sm">상호주의 매너 리포트</p>
          <p className="text-zinc-500 text-[11px] font-light leading-relaxed">
            동석자들의 단일 명사 관찰을 통해 나의 소통 품격을 100점 표준 리포트로 확인합니다.
          </p>
        </div>

      </div>

    </section>
  );
}
