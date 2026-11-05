'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

export interface GallerySlideItem {
  stage: string; // 예: "01. 장소", "02. 음식", "03. 만남", "04. 여운"
  title: string;
  desc: string;
  image: string;
}

export interface SpecBadgeItem {
  label: string;
  value: string;
  subText: string;
}

export interface CategoryProductHeroProps {
  badge: string;
  headlineTitle: string;
  headlineHighlight: string;
  description: string;
  specs: [SpecBadgeItem, SpecBadgeItem, SpecBadgeItem];
  slides: [GallerySlideItem, GallerySlideItem, GallerySlideItem, GallerySlideItem];
  onApply: () => void;
  trustNote?: string;
  activeLocationLabel?: string;
}

export default function CategoryProductHero({
  badge,
  headlineTitle,
  headlineHighlight,
  description,
  specs,
  slides,
  onApply,
  trustNote = '에티켓 서약 및 신원 확인이 완료된 검증된 회원만 참석 가능합니다.',
  activeLocationLabel = '부산 (전포·서면·해운대)',
}: CategoryProductHeroProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const currentSlide = slides[currentIdx];

  return (
    <section className="relative w-full bg-[#090a0f] pt-2 sm:pt-4 pb-12 sm:pb-16 px-4 sm:px-6 border-b border-white/10">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* ==============================================================
            [모바일 1순위 / 데스크톱 좌측]: 큰 사진 슬라이더 (쇼핑몰 대형 이미지 뷰어)
            - 만나는 모습, 음식 모습, 장소 모습, 여운의 흐름을 큰 사진과 화면 넘김 버튼으로 확인
            ============================================================== */}
        <div className="lg:col-span-7 order-1 lg:order-1 space-y-3.5">
          
          {/* 대형 메인 사진 프레임 */}
          <div className="relative aspect-[16/11] sm:aspect-[4/3] w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl group">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

            {/* 좌상단: 현재 단계 칩 */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-600/95 text-white font-serif-editorial font-bold text-xs shadow-lg backdrop-blur-md">
                {currentSlide.stage}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/60 text-zinc-300 text-[11px] border border-white/10 backdrop-blur-md">
                {currentIdx + 1} / {slides.length}
              </span>
            </div>

            {/* 좌/우 화면 넘김 화살표 버튼 */}
            <button
              type="button"
              onClick={prevSlide}
              aria-label="이전 사진"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xl opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="다음 사진"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xl opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* 하단 설명 오버레이 */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 space-y-1 pointer-events-none">
              <h3 className="text-base sm:text-xl font-bold text-white tracking-tight drop-shadow-md">
                {currentSlide.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-200 leading-snug drop-shadow-md line-clamp-2">
                {currentSlide.desc}
              </p>
            </div>
          </div>

          {/* 하단 4개 썸네일 네비게이션 탭 (클릭 시 해당 큰 사진으로 전환) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {slides.map((s, idx) => {
              const isActive = idx === currentIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`group relative rounded-xl overflow-hidden border text-left transition-all p-1.5 cursor-pointer ${
                    isActive
                      ? 'border-rose-500 bg-rose-950/30 ring-2 ring-rose-500/50'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-zinc-900 mb-1.5">
                    <img
                      src={s.image}
                      alt={s.stage}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isActive ? 'scale-105 opacity-100' : 'opacity-70 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                  <div className="px-1">
                    <p className={`text-[10px] sm:text-xs font-bold truncate ${isActive ? 'text-rose-300' : 'text-zinc-400 group-hover:text-white'}`}>
                      {s.stage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* ==============================================================
            [모바일 2순위 / 데스크톱 우측]: 헤더라인, 설명, 스펙 바, 신청하기 버튼
            ============================================================== */}
        <div className="lg:col-span-5 order-2 lg:order-2 space-y-6 pt-2 lg:pt-3">
          
          {/* 상단 카테고리 배지 & 거점 라벨 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{badge}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[11px] text-zinc-400">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>{activeLocationLabel}</span>
            </span>
          </div>

          {/* 메인 헤드라인 */}
          <div className="space-y-2.5">
            <h1 className="font-serif-editorial text-3xl sm:text-4xl lg:text-[40px] font-bold text-white tracking-tight leading-[1.2]">
              {headlineTitle}<br />
              <span className="text-white">{headlineHighlight}</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal pt-1">
              {description}
            </p>
          </div>

          {/* 핵심 스펙 3열 요약 바 */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {specs.map((sp, idx) => (
              <div
                key={idx}
                className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1"
              >
                <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-medium">
                  {sp.label}
                </span>
                <p className="text-xs sm:text-sm font-bold text-white truncate">
                  {sp.value}
                </p>
                <p className="text-[9px] sm:text-[10px] text-zinc-400 truncate">
                  {sp.subText}
                </p>
              </div>
            ))}
          </div>

          {/* 액션 버튼 영역 (4대 카테고리 전체 "신청하기" 규격 통일) */}
          <div className="pt-2 space-y-3.5">
            <button
              type="button"
              onClick={onApply}
              className="w-full px-8 py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base transition-colors cursor-pointer shadow-xl shadow-rose-950/40 flex items-center justify-center gap-2"
            >
              <span>신청하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 안심 보증 문구 */}
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{trustNote}</span>
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
