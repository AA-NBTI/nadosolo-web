'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import SmartMedia, { MediaType } from './media/SmartMedia';
import EditableText from './editor/EditableText';
import MediaUploadModal from './editor/MediaUploadModal';
import AdaptiveButton from './ui/AdaptiveButton';
import { useVisualEditor } from '@/engine/siteConfigEngine';

export interface GallerySlideItem {
  stage: string; // 예: "01. 장소", "02. 음식", "03. 만남", "04. 여운"
  title: string;
  desc: string;
  image: string;
  mediaType?: MediaType;
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
  onUpdateProps?: (updates: {
    badge?: string;
    headlineTitle?: string;
    headlineHighlight?: string;
    description?: string;
    activeLocationLabel?: string;
    trustNote?: string;
    slides?: GallerySlideItem[];
  }) => void;
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
  activeLocationLabel = '부산',
  onUpdateProps,
}: CategoryProductHeroProps) {
  const { isEditMode } = useVisualEditor();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // 로컬 슬라이드 상태 (편집 모드 시 실시간 반영)
  const [localSlides, setLocalSlides] = useState<GallerySlideItem[]>(slides);

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev === 0 ? localSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev === localSlides.length - 1 ? 0 : prev + 1));
  };

  const currentSlide = localSlides[currentIdx] || localSlides[0];

  const handleUpdateCurrentSlide = (updates: Partial<GallerySlideItem>) => {
    const updated = localSlides.map((s, idx) =>
      idx === currentIdx ? { ...s, ...updates } : s
    );
    setLocalSlides(updated);
    if (onUpdateProps) {
      onUpdateProps({ slides: updated });
    }
  };

  return (
    <section className="relative w-full bg-[#090a0f] pt-2 sm:pt-4 pb-12 sm:pb-16 px-4 sm:px-6 border-b border-white/10">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* ==============================================================
            [모바일 1순위 / 데스크톱 좌측]: 대형 미디어 슬라이더 (사진/동영상 뷰어)
            ============================================================== */}
        <div className="lg:col-span-7 order-1 lg:order-1 space-y-3.5">
          
          {/* 대형 메인 사진/동영상 프레임 */}
          <div className="relative aspect-[16/11] sm:aspect-[4/3] w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl group">
            <SmartMedia
              src={currentSlide.image}
              mediaType={currentSlide.mediaType}
              alt={currentSlide.title}
              editable={isEditMode}
              onEditClick={() => setIsMediaModalOpen(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

            {/* 좌상단: 현재 단계 칩 (다크 그레이 배경) */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-zinc-800/95 text-zinc-200 border border-zinc-700/60 font-serif-editorial font-bold text-xs shadow-lg backdrop-blur-md">
                <EditableText
                  as="span"
                  value={currentSlide.stage}
                  editable={isEditMode}
                  onChange={(val) => handleUpdateCurrentSlide({ stage: val })}
                  placeholder="단계 라벨"
                />
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/60 text-zinc-300 text-[11px] border border-white/10 backdrop-blur-md">
                {currentIdx + 1} / {localSlides.length}
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
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 space-y-1 z-10">
              <h3 className="text-base sm:text-xl font-bold text-white tracking-tight drop-shadow-md">
                <EditableText
                  as="span"
                  value={currentSlide.title}
                  editable={isEditMode}
                  onChange={(val) => handleUpdateCurrentSlide({ title: val })}
                  placeholder="슬라이드 제목"
                />
              </h3>
              <p className="text-xs sm:text-sm text-zinc-200 leading-snug drop-shadow-md line-clamp-2">
                <EditableText
                  as="span"
                  value={currentSlide.desc}
                  editable={isEditMode}
                  onChange={(val) => handleUpdateCurrentSlide({ desc: val })}
                  placeholder="슬라이드 설명"
                />
              </p>
            </div>
          </div>

          {/* 하단 4개 썸네일 네비게이션 탭 */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {localSlides.map((s, idx) => {
              const isActive = idx === currentIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`group relative rounded-xl overflow-hidden border text-left transition-all p-1.5 cursor-pointer ${
                    isActive
                      ? 'border-[#f04f74] bg-[#f04f74]/15 ring-2 ring-[#f04f74]/50'
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
                    <p className={`text-[10px] sm:text-xs font-bold truncate ${isActive ? 'text-[#f04f74]' : 'text-zinc-400 group-hover:text-white'}`}>
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <EditableText
                as="span"
                value={badge}
                editable={isEditMode}
                onChange={(val) => onUpdateProps && onUpdateProps({ badge: val })}
                placeholder="카테고리 뱃지"
              />
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[11px] text-zinc-400">
              <MapPin className="w-3 h-3 text-[#f04f74]" />
              <EditableText
                as="span"
                value={activeLocationLabel}
                editable={isEditMode}
                onChange={(val) => onUpdateProps && onUpdateProps({ activeLocationLabel: val })}
                placeholder="거점 라벨"
              />
            </span>
          </div>

          {/* 메인 헤드라인 */}
          <div className="space-y-2.5">
            <h1 className="font-serif-editorial text-3xl sm:text-4xl lg:text-[40px] font-bold text-white tracking-tight leading-[1.2]">
              <EditableText
                as="span"
                value={headlineTitle}
                editable={isEditMode}
                onChange={(val) => onUpdateProps && onUpdateProps({ headlineTitle: val })}
                placeholder="헤드라인 첫 번째 줄"
              />
              <br />
              <EditableText
                as="span"
                value={headlineHighlight}
                editable={isEditMode}
                onChange={(val) => onUpdateProps && onUpdateProps({ headlineHighlight: val })}
                placeholder="헤드라인 강조 문구"
                className="text-white"
              />
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal pt-1">
              <EditableText
                as="span"
                value={description}
                multiline
                editable={isEditMode}
                onChange={(val) => onUpdateProps && onUpdateProps({ description: val })}
                placeholder="카테고리 상세 설명"
              />
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

          {/* 액션 버튼 영역 (AdaptiveButton 적용: 샤프하고 정제된 높이) */}
          <div className="pt-2 space-y-3.5">
            <AdaptiveButton
              onClick={onApply}
              className="w-full h-12 py-2.5 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
            >
              <span>신청하기</span>
              <ArrowRight className="w-4 h-4" />
            </AdaptiveButton>

            {/* 안심 보증 문구 */}
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#f04f74] shrink-0" />
              <EditableText
                as="span"
                value={trustNote}
                editable={isEditMode}
                onChange={(val) => onUpdateProps && onUpdateProps({ trustNote: val })}
                placeholder="신뢰 보증 문구"
              />
            </p>
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
        title={`[${currentSlide.stage}] 미디어(사진 / 동영상 / 유튜브) 교체`}
      />
    </section>
  );
}
