'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import SmartMedia, { MediaType } from '../media/SmartMedia';
import EditableText from '../editor/EditableText';
import MediaUploadModal from '../editor/MediaUploadModal';
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
    tag: 'SIGNATURE SOCIAL DINING',
    title: '결이 맞는 사람들과의',
    highlight: '품격 있는 주말 다이닝',
    desc: '매주 금·토 저녁, 엄선된 셰프의 코스 요리와 와인을 곁들여 성향과 에티켓이 검증된 6인이 마주 앉는 시크릿 디너입니다.',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1600&q=85',
    mediaType: 'image',
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
    mediaType: 'image',
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
    mediaType: 'image',
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
          {/* 다크 럭셔리 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/75 to-[#090a0f]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        </div>
      ))}

      {/* 전면 콘텐츠 레이어 */}
      <div className="relative z-20 w-full h-full max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col justify-between py-12 sm:py-16">
        
        {/* 상단: 슬라이드 뱃지 */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-[11px] font-mono tracking-widest text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
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
            <button
              type="button"
              onClick={onOpenCheckout}
              className="px-8 py-3.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 hover:border-white/30 text-rose-400 hover:text-white font-bold text-base sm:text-lg transition-all duration-200 cursor-pointer backdrop-blur-md shadow-lg"
            >
              <EditableText
                as="span"
                value={currentSlide.ctaText || '신청하기'}
                editable={isEditMode}
                onChange={(val) => handleUpdateCurrentSlide({ ctaText: val })}
                placeholder="버튼 문구"
              />
            </button>

            <Link
              href={currentSlide.link}
              className="px-7 py-3.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 hover:border-white/30 text-white font-medium text-base sm:text-lg transition-all duration-200 flex items-center gap-2 backdrop-blur-md shadow-lg"
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
