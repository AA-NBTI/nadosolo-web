'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';

export interface ProcessStep {
  step: string; // '01', '02', '03', '04'
  title: string;
  subtitle: string;
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
  steps: [ProcessStep, ProcessStep, ProcessStep, ProcessStep];
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
  steps,
  onApply,
  trustNote = '에티켓 서약 및 신원 확인이 완료된 검증된 회원만 참석 가능합니다.',
  activeLocationLabel = '부산 (전포·서면·해운대)',
}: CategoryProductHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#090a0f] pt-14 pb-16 sm:pt-16 sm:pb-20 px-4 sm:px-6 border-b border-white/10">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* ==============================================================
            [좌측 컬럼: 4단계 프로세스 2x2 사진 그리드]
            - 한눈에 모임의 4단계 여정(입장 ➡️ 대화 ➡️ 다이닝 ➡️ 평가)을 직관적으로 확인
            ============================================================== */}
        <div className="lg:col-span-6 order-2 lg:order-1">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {steps.map((s) => (
              <div
                key={s.step}
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] shadow-xl hover:border-white/25 transition-all duration-300"
              >
                {/* 사진 프레임 */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  
                  {/* 상단 STEP 넘버 배지 */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-rose-600/95 text-white font-serif-editorial font-bold text-[10px] sm:text-[11px] tracking-wide shadow-md">
                      STEP {s.step}
                    </span>
                  </div>

                  {/* 하단 타이틀 & 서브텍스트 오버레이 */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
                      {s.title}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-zinc-300 line-clamp-1 leading-snug">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 하단 프로세스 연결 캡션 */}
          <div className="mt-3 px-2 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>4단계 안심 진행 프로세스</span>
            </span>
            <span>{activeLocationLabel}</span>
          </div>
        </div>

        {/* ==============================================================
            [우측 컬럼: 헤더라인, 설명, 스펙 바, 신청하기 버튼]
            - 상품 페이지 규격의 우아하고 정돈된 타이포그래피 & 핵심 CTA
            ============================================================== */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
          
          {/* 상단 카테고리 배지 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{badge}</span>
          </div>

          {/* 메인 헤드라인 */}
          <div className="space-y-2">
            <h1 className="font-serif-editorial text-3xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-[1.2]">
              {headlineTitle}<br />
              <span className="text-white">{headlineHighlight}</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal pt-1">
              {description}
            </p>
          </div>

          {/* 핵심 스펙 3열 요약 바 */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
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
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={onApply}
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base transition-colors cursor-pointer shadow-xl shadow-rose-950/30 flex items-center justify-center gap-2"
            >
              <span>신청하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 안심 보증 문구 */}
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{trustNote}</span>
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
