'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface SlideItem {
  id: string;
  tag: string;
  title: string;
  highlight: string;
  desc: string;
  image: string;
  link: string;
  ctaText: string;
}

const SLIDES: SlideItem[] = [
  {
    id: 'slide-dining',
    tag: 'SIGNATURE SOCIAL DINING',
    title: '결이 맞는 사람들과의',
    highlight: '품격 있는 주말 다이닝',
    desc: '매주 금·토 저녁, 엄선된 셰프의 코스 요리와 와인을 곁들여 성향과 에티켓이 검증된 6인이 마주 앉는 시크릿 디너입니다.',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1600&q=85',
    link: '/dining',
    ctaText: '신청하기',
  },
  {
    id: 'slide-salon',
    tag: 'PRIVATE SOCIAL SALON',
    title: '피상적인 잡담 대신,',
    highlight: '삶의 결이 맞는 깊은 대화',
    desc: '예술, 인문학, 와인 테이스팅을 주제로 감각적인 라운지에서 서로의 생각을 경청하고 취향을 나누는 지적 사교 공간입니다.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=85',
    link: '/salon',
    ctaText: '신청하기',
  },
  {
    id: 'slide-club',
    tag: 'LIFESTYLE MEMBERSHIP CLUB',
    title: '혼자여도 충분하고,',
    highlight: '함께여서 더 특별한 소셜 클럽',
    desc: '와인, 미술관 전시 도슨트, 모닝 러닝 등 같은 관심사를 가진 소수정예 멤버들과 지속적인 유대감을 쌓아가는 멤버십입니다.',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=85',
    link: '/club',
    ctaText: '신청하기',
  },
  {
    id: 'slide-meetup',
    tag: 'SPECIAL THEME MEETUP',
    title: '엄선된 소수를 위한',
    highlight: '3045 & 5060 테마 밋업',
    desc: '루프탑과 오션뷰 프라이빗 라운지에서 월 2~4회 한정으로 개최되는 세대별 안심 소셜 와인 파티입니다.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85',
    link: '/meetup',
    ctaText: '신청하기',
  },
];

interface SectorRollingHeroProps {
  onOpenCheckout?: () => void;
}

export default function SectorRollingHero({ onOpenCheckout }: SectorRollingHeroProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // 5초 주기 자동 롤링
  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const handlePrev = () => {
    setIsAutoPlay(false);
    setCurrentIdx((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNext = () => {
    setIsAutoPlay(false);
    setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
  };

  const slide = SLIDES[currentIdx];

  return (
    <section
      className="relative w-full h-[520px] sm:h-[600px] bg-[#090a0f] overflow-hidden border-b border-white/10 select-none"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* 백그라운드 이미지 슬라이드 (페이드 전환) */}
      {SLIDES.map((s, idx) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover object-center scale-105 animate-in fade-in duration-1000"
          />
          {/* 럭셔리 다크 오버레이 (사진이 고급스럽게 은은히 드러남) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/75 to-[#090a0f]/40" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      {/* 전면 콘텐츠 레이어 */}
      <div className="relative z-20 w-full h-full max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col justify-between py-12 sm:py-16">
        
        {/* 상단: 슬라이드 뱃지 */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-[11px] font-mono tracking-widest text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{slide.tag}</span>
          </div>

          {/* 슬라이드 카운터 */}
          <div className="text-xs font-mono text-zinc-400 bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <span className="text-white font-bold">0{currentIdx + 1}</span> / 0{SLIDES.length}
          </div>
        </div>

        {/* 중앙: 메인 헤드라인 & CTA */}
        <div className="max-w-2xl space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 key={currentIdx}">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif-editorial font-bold text-white tracking-tight leading-[1.15]">
            {slide.title}<br />
            <span className="text-rose-400">
              {slide.highlight}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal max-w-xl">
            {slide.desc}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenCheckout}
              className="px-7 py-3.5 rounded-xl border border-rose-600/60 bg-zinc-900/80 text-rose-500 hover:bg-rose-600 hover:text-white hover:border-rose-600 active:bg-rose-700 font-semibold text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-lg hover:shadow-rose-950/50"
            >
              신청하기
            </button>

            <Link
              href={slide.link}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-sm sm:text-base transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <span>자세히 보기</span>
              <ArrowRight className="w-4 h-4 text-zinc-300" />
            </Link>
          </div>
        </div>

        {/* 하단: 좌우 화살표 컨트롤러 & 프로그레스 바 */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {/* 인디케이터 바 */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsAutoPlay(false);
                  setCurrentIdx(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIdx
                    ? 'w-8 bg-rose-500'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`슬라이드 ${idx + 1}번으로 이동`}
              />
            ))}
          </div>

          {/* 좌우 탐색 버튼 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
              aria-label="이전 슬라이드"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
              aria-label="다음 슬라이드"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
