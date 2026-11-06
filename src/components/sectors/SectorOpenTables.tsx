'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Calendar, Wine } from 'lucide-react';

interface OpenTableProps {
  onOpenCheckout?: () => void;
}

export default function SectorOpenTables({ onOpenCheckout }: OpenTableProps) {
  const CHAPTERS = [
    {
      num: 'CHAPTER I',
      city: 'BUSAN JEONPO',
      venueType: 'PRIVATE NATURAL WINE BISTRO',
      title: '금요 프라이빗 와인 & 셰프 디너',
      schedule: '매주 금요일 19:30',
      status: '여성 1석 잔여 (마감 임박)',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
      note: '소음과 시선이 완벽히 차단된 단독 룸 대관 • 3:3 정원 큐레이션',
    },
    {
      num: 'CHAPTER II',
      city: 'HAEUNDAE MARINE CITY',
      venueType: 'CONTEMPORARY OCEAN DINING',
      title: '토요 셰프 시그니처 코스 페어링',
      schedule: '매주 토요일 19:30',
      status: '여성 2석 잔여',
      image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=85',
      note: '해운대 오션뷰 프라이빗 스위트 • 제철 식자재 7코스 & 소믈리에 와인',
    },
    {
      num: 'CHAPTER III',
      city: 'BUSAN SEOMYEON',
      venueType: 'ARCHIVE SALON & LOUNGE',
      title: '주말 갈라 프라이빗 소셜 다이닝',
      schedule: '다음 주 금요일 19:30',
      status: '사전 인비테이션 접수중',
      image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=85',
      note: '조도 앰비언스 특화 룸 • 대화 카드 플레이북 기반 지적 교류',
    },
  ];

  return (
    <section className="w-full py-24 sm:py-36 bg-[#07080a] border-b border-white/[0.08] text-[#f5f2eb]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
        
        {/* 상단 챕터 헤더 */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/[0.1] pb-8 mb-16 sm:mb-24 gap-6">
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-[0.3em] text-[#f04f74] uppercase font-semibold block">
              Curated Chapters
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              이번 주 엄선된 프라이빗 테이블
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-md leading-relaxed">
            나도솔로 매칭 엔진이 성향과 취향의 밸런스를 정밀하게 분석하여 남녀 3:3 최적의 동석자를 구성합니다.
          </p>
        </div>

        {/* 챕터 리스트 (CORE: Club의 비대칭 매거진 도록 레이아웃) */}
        <div className="space-y-20 sm:space-y-28">
          {CHAPTERS.map((chap, idx) => {
            const isEven = idx % 2 === 1;
            return (
              <div
                key={chap.num}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${
                  isEven ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* 갤러리 이미지 프레임 (7열) */}
                <div className={`lg:col-span-7 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="relative rounded-none overflow-hidden aspect-[16/10] bg-zinc-950 border border-white/[0.08] group">
                    <img
                      src={chap.image}
                      alt={chap.title}
                      className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="absolute top-6 left-6">
                      <span className="px-3 py-1 text-[10px] font-mono tracking-[0.25em] bg-black/80 text-zinc-300 border border-white/10 uppercase">
                        {chap.city}
                      </span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end text-xs text-zinc-400">
                      <span className="font-mono text-[11px] tracking-widest text-[#f04f74] font-semibold">
                        {chap.num}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-300">
                        {chap.schedule}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 에디토리얼 스펙 및 신청 (5열) */}
                <div className={`lg:col-span-5 space-y-6 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase block">
                      {chap.venueType}
                    </span>
                    <h3 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white leading-snug">
                      {chap.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                    {chap.note}
                  </p>

                  <div className="py-4 border-y border-white/[0.08] space-y-2 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-500">SEAT AVAILABILITY</span>
                      <span className="text-[#f04f74] font-medium">{chap.status}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-500">VERIFICATION TICKET</span>
                      <span className="text-white">₩30,000 (소셜 리포트 발행 포함)</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-500">DINING SETTLEMENT</span>
                      <span className="text-zinc-400">매장 현장 테이블 1/N 실비</span>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={onOpenCheckout}
                      className="px-7 py-3.5 border border-white/20 hover:border-[#f04f74] bg-transparent hover:bg-[#f04f74] text-white hover:text-white text-xs font-mono tracking-[0.2em] uppercase font-semibold transition-all duration-300 cursor-pointer flex items-center gap-2"
                    >
                      <span>RESERVE SEAT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
