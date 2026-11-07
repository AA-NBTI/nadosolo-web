'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useVisualEditor, SectorConfig } from '@/engine/siteConfigEngine';

interface SectorHeroProps {
  config?: SectorConfig;
  onUpdate?: (updates: Partial<SectorConfig>) => void;
  onOpenCheckout?: () => void;
}

export default function SectorHero({ config, onUpdate, onOpenCheckout }: SectorHeroProps) {
  const { isEditMode } = useVisualEditor();

  return (
    <section className="relative w-full min-h-[calc(100vh-72px)] flex items-center justify-center bg-[#07080a] text-[#f5f2eb] overflow-hidden border-b border-white/[0.08]">
      
      {/* ==============================================================
          [전장폭 실사 동적 영상 캔버스]: Full-Width HTML5 Video
          ============================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover filter brightness-[0.42] contrast-[1.12] scale-105 transition-all duration-1000"
          poster="https://images.unsplash.com/photo-1590846406792-04a0f443b092?auto=format&fit=crop&w=2000&q=85"
        >
          <source
            src="https://thecoreclub.com/storage/images/videos/CORE_Intro_Landscape.mp4"
            type="video/mp4"
          />
        </video>
        
        {/* 시네마틱 앰비언트 섀도우 & 비네팅 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/40 to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#07080a_90%)] pointer-events-none" />
      </div>

      {/* ==============================================================
          [아래 내용쪽 기준 폭과 100% 일치하는 단일 중앙 정렬 컨테이너]
          max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20
          ============================================================== */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 pt-3 sm:pt-4 pb-8 sm:pb-12 flex flex-col justify-between min-h-[calc(100vh-72px)]">
        
        {/* [메인 타이포그래피]: 상단 여백을 60% 이상 축소하고 텍스트는 시원하게 2줄로 정렬 */}
        <div className="mt-2 sm:mt-4 mb-4 sm:mb-6 max-w-4xl lg:max-w-5xl space-y-4 sm:space-y-5 animate-in fade-in duration-1000">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74] animate-ping" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] text-zinc-300 uppercase">
              An Intimate Sanctuary for Refined Minds
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-serif-editorial text-3xl sm:text-5xl lg:text-6xl xl:text-[68px] font-normal text-white tracking-tight leading-[1.14] drop-shadow-2xl">
              <span className="block whitespace-nowrap">소음이 닿지 않는 밤,</span>
              <span className="block whitespace-nowrap font-light italic text-[#f5f2eb]/90 mt-1 sm:mt-1.5">
                지성과 취향이 마주하는 식탁
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed max-w-2xl tracking-wide pt-1 drop-shadow-md">
              엄선된 프라이빗 룸과 셰프의 시그니처 코스 요리, 소믈리에 와인 페어링.<br className="hidden sm:inline" />
              신원과 에티켓이 검증된 분들이 마주 앉아 서로의 품격과 온도를 나누는 5060 프라이빗 소셜 살롱입니다.
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="pt-3 flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={onOpenCheckout}
              className="group px-8 py-4 rounded-none border border-[#f04f74] bg-black/50 hover:bg-white/[0.05] text-white hover:text-[#f04f74] text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer flex items-center gap-3 backdrop-blur-sm"
            >
              <span>REQUEST INVITATION</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#f04f74] group-hover:translate-x-1 transition-transform" />
            </button>

            <Link
              href="/dining"
              className="px-6 py-4 border border-white/20 hover:border-white/40 bg-black/30 hover:bg-black/50 text-xs font-mono tracking-[0.2em] text-zinc-300 hover:text-white uppercase transition-all backdrop-blur-sm flex items-center gap-2"
            >
              <span>VIEW CHAPTERS</span>
              <span className="text-[10px] text-zinc-500">↓</span>
            </Link>
          </div>

        </div>

        {/* [하단 3대 인덱스]: 아래 섹터의 3열 그리드와 좌우 폭이 100% 일치 */}
        <div className="w-full pt-6 sm:pt-8 border-t border-white/[0.1] grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 text-xs backdrop-blur-[2px]">
          
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-[#f04f74] uppercase block font-semibold">
              01 / CURATED SYNERGY
            </span>
            <p className="text-zinc-200 font-serif-editorial text-sm">3:3 맞춤 밸런스 테이블</p>
            <p className="text-zinc-400 text-[11px] font-light leading-relaxed">
              나도솔로 매칭 엔진이 성향, 커리어, 가치관을 분석하여 최적의 테이블을 편성합니다.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-[#f04f74] uppercase block font-semibold">
              02 / ABSOLUTE DISCRETION
            </span>
            <p className="text-zinc-200 font-serif-editorial text-sm">철저한 익명성과 안전망</p>
            <p className="text-zinc-400 text-[11px] font-light leading-relaxed">
              100% 에티켓 사전 서약 회원만 참석하며, 비매너 행위자는 시스템에서 영구 제외됩니다.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-[#f04f74] uppercase block font-semibold">
              03 / SOCIAL DOSSIER
            </span>
            <p className="text-zinc-200 font-serif-editorial text-sm">상호주의 매너 리포트</p>
            <p className="text-zinc-400 text-[11px] font-light leading-relaxed">
              동석자들의 단일 명사 관찰을 통해 나의 소통 품격을 100점 표준 리포트로 확인합니다.
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}
