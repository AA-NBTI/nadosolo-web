'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import SmartMedia, { MediaType } from '../media/SmartMedia';
import EditableText from '../editor/EditableText';
import MediaUploadModal from '../editor/MediaUploadModal';
import AdaptiveButton from '../ui/AdaptiveButton';
import { useVisualEditor, SectorConfig } from '@/engine/siteConfigEngine';

export interface SlideItem {
  id: string;
  tag: string;
  title: string;
  highlight: string;
  desc: string;
  image: string;
  mediaType?: MediaType;
  link: string;
  ctaText: string;
}

const DEFAULT_SLIDES: SlideItem[] = [
  {
    id: 'slide-dining',
    tag: 'ELEGANT SOCIAL DINING',
    title: '나를 다시 발견하는 시간,',
    highlight: '품격 있는 프라이빗 다이닝',
    desc: '은은한 조도와 정갈한 디너 코스, 와인 한 잔을 사이에 두고 피어나는 기분 좋은 설렘과 다정한 교류.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1920&q=85',
    mediaType: 'image',
    link: '/dining',
    ctaText: '신청하기',
  },
  {
    id: 'slide-salon',
    tag: 'SECRET WINE SALON',
    title: '가벼운 만남 대신,',
    highlight: '삶의 결이 닿는 깊은 대화',
    desc: '예술과 와인, 그리고 일상의 온도를 나누는 시간. 서로의 시선과 경청 속에서 피어나는 따뜻한 신뢰.',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1920&q=85',
    mediaType: 'image',
    link: '/salon',
    ctaText: '신청하기',
  },
  {
    id: 'slide-club',
    tag: 'METABOLIC SOCIAL FEEDBACK',
    title: '누구의 엄마도 아닌,',
    highlight: '오늘 가장 매력적인 한 사람으로',
    desc: '동석자들의 다정한 시선과 다면 관찰을 통해 나의 품격과 미소를 객관적인 소셜 리포트로 선물받는 시간.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1920&q=85',
    mediaType: 'image',
    link: '/club',
    ctaText: '신청하기',
  },
  {
    id: 'slide-meetup',
    tag: 'VERIFIED GOLDEN TRACK',
    title: '에티켓이 검증된 동석자,',
    highlight: '신뢰할 수 있는 소셜 테이블',
    desc: '철저한 신원 확인과 상호주의 매너 서약으로 무례함이 원천 차단된 5060 안심 프라이빗 라운지.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=85',
    mediaType: 'image',
    link: '/meetup',
    ctaText: '신청하기',
  },
];

interface SectorRollingHeroProps {
  config?: SectorConfig;
  onUpdate?: (updates: Partial<SectorConfig>) => void;
  onOpenCheckout?: () => void;
}

export default function SectorRollingHero({
  config,
  onUpdate,
  onOpenCheckout,
}: SectorRollingHeroProps) {
  const { isEditMode } = useVisualEditor();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const slides: SlideItem[] = (config?.slides && config.slides.length > 0)
    ? config.slides
    : DEFAULT_SLIDES;

  // 5초 주기 자동 롤링 (편집 모드 시 자동 일시정지)
  useEffect(() => {
    if (!isAutoPlay || isEditMode) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlay, isEditMode, slides.length]);

  const handlePrev = () => {
    setIsAutoPlay(false);
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setIsAutoPlay(false);
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  const currentSlide = slides[currentIdx] || slides[0];

  const handleUpdateCurrentSlide = (updates: Partial<SlideItem>) => {
    const newSlides = slides.map((s, idx) =>
      idx === currentIdx ? { ...s, ...updates } : s
    );
    if (onUpdate) {
      onUpdate({ slides: newSlides });
    }
  };

  return (
    <section
      className="relative w-full h-[520px] sm:h-[600px] bg-[#090a0f] overflow-hidden border-b border-white/10 select-none"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => !isEditMode && setIsAutoPlay(true)}
    >
      {/* 백그라운드 이미지/비디오 슬라이드 */}
      {slides.map((s, idx) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <SmartMedia
            src={s.image}
            mediaType={s.mediaType}
            alt={s.title}
            editable={isEditMode && idx === currentIdx}
            onEditClick={() => setIsMediaModalOpen(true)}
            className="w-full h-full object-cover object-center scale-105"
          />
          {/* 다크 럭셔리 오버레이 & 앰비언트 글로우 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/80 to-[#090a0f]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(240,79,116,0.15),transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 bg-black/35 pointer-events-none" />
        </div>
      ))}

      {/* 전면 콘텐츠 레이어 */}
      <div className="relative z-20 w-full h-full max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col justify-between py-12 sm:py-16">
        
        {/* 상단: 슬라이드 뱃지 */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-[11px] font-mono tracking-widest text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74] animate-pulse" />
            <EditableText
              as="span"
              value={currentSlide.tag}
              editable={isEditMode}
              onChange={(val) => handleUpdateCurrentSlide({ tag: val })}
              placeholder="태그"
            />
          </div>

          {/* 슬라이드 카운터 */}
          <div className="text-xs font-mono text-zinc-400 bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <span className="text-white font-bold">0{currentIdx + 1}</span> / 0{slides.length}
          </div>
        </div>

        {/* 중앙: 메인 헤드라인 & CTA */}
        <div className="max-w-2xl space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 key={currentIdx}">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif-editorial font-bold text-white tracking-tight leading-[1.15]">
            <EditableText
              as="span"
              value={currentSlide.title}
              editable={isEditMode}
              onChange={(val) => handleUpdateCurrentSlide({ title: val })}
              placeholder="헤드라인 1번째 줄"
            />
            <br />
            <EditableText
              as="span"
              value={currentSlide.highlight}
              editable={isEditMode}
              onChange={(val) => handleUpdateCurrentSlide({ highlight: val })}
              placeholder="강조 문구"
              className="text-rose-400"
            />
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal max-w-xl">
            <EditableText
              as="span"
              value={currentSlide.desc}
              multiline
              editable={isEditMode}
              onChange={(val) => handleUpdateCurrentSlide({ desc: val })}
              placeholder="슬라이드 설명 문구를 입력하세요"
            />
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <AdaptiveButton
              onClick={onOpenCheckout}
              className="w-36 sm:w-40 h-11 inline-flex items-center justify-center backdrop-blur-md"
            >
              <EditableText
                as="span"
                value={currentSlide.ctaText || '신청하기'}
                editable={isEditMode}
                onChange={(val) => handleUpdateCurrentSlide({ ctaText: val })}
                placeholder="버튼 문구"
              />
            </AdaptiveButton>

            <Link
              href={currentSlide.link}
              className="w-36 sm:w-40 h-11 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 hover:border-white/30 text-white font-semibold text-sm sm:text-[15px] tracking-wide transition-all duration-200 inline-flex items-center justify-center gap-1.5 backdrop-blur-md shadow-md"
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
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsAutoPlay(false);
                  setCurrentIdx(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIdx
                    ? 'w-8 bg-[#f04f74]'
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

      {/* 미디어 교체 모달 */}
      <MediaUploadModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        currentUrl={currentSlide.image}
        currentType={currentSlide.mediaType}
        onApply={(url, type) => handleUpdateCurrentSlide({ image: url, mediaType: type })}
        title={`[${currentSlide.tag}] 미디어(사진 / 동영상 / 유튜브) 교체`}
      />
    </section>
  );
}
