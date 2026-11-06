'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Film, Sparkles } from 'lucide-react';
import SmartMedia, { MediaType } from '../media/SmartMedia';
import EditableText from '../editor/EditableText';
import MediaUploadModal from '../editor/MediaUploadModal';
import AdaptiveButton from '../ui/AdaptiveButton';
import { useVisualEditor, SectorConfig } from '@/engine/siteConfigEngine';

interface SectorVideoBannerProps {
  config?: SectorConfig;
  onUpdate?: (updates: Partial<SectorConfig>) => void;
  onOpenCheckout?: () => void;
}

export default function SectorVideoBanner({
  config,
  onUpdate,
  onOpenCheckout,
}: SectorVideoBannerProps) {
  const { isEditMode } = useVisualEditor();
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const headlineTitle = config?.headlineTitle || '오직 신뢰할 수 있는 사람들과의';
  const headlineHighlight = config?.headlineHighlight || '가장 특별한 밤의 사교';
  const description =
    config?.description ||
    '엄선된 와인과 셰프의 디너, 편안한 대화가 흐르는 나도솔로 프라이빗 다이닝 클럽입니다. 사전 에티켓 검증을 거친 솔로들이 마주 앉습니다.';
  const mediaUrl =
    config?.mediaUrl ||
    'https://assets.mixkit.co/videos/preview/mixkit-pouring-red-wine-in-a-glass-at-a-dinner-table-42646-large.mp4';
  const mediaType: MediaType = config?.mediaType || 'video';
  const ctaText = config?.ctaText || '신청하기';

  const handleMediaApply = (url: string, type: MediaType) => {
    if (onUpdate) {
      onUpdate({ mediaUrl: url, mediaType: type });
    }
  };

  return (
    <section className="relative w-full h-[520px] sm:h-[600px] bg-[#090a0f] overflow-hidden border-b border-white/10 select-none">
      {/* 백그라운드 스마트 미디어 (동영상/유튜브/사진 지원) */}
      <div className="absolute inset-0 z-0">
        <SmartMedia
          src={mediaUrl}
          mediaType={mediaType}
          alt="다이닝 무드 비디오"
          editable={isEditMode}
          onEditClick={() => setIsMediaModalOpen(true)}
          overlayGradient={false}
          className="w-full h-full object-cover scale-105"
        />
        {/* 다크 럭셔리 오버레이 (텍스트 가독성 확보) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/75 to-[#090a0f]/40 pointer-events-none" />
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />
      </div>

      {/* 전면 콘텐츠 레이어 */}
      <div className="relative z-10 w-full h-full max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col justify-center py-16">
        <div className="max-w-2xl space-y-5">
          
          {/* 상단 뱃지 */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-[11px] font-mono tracking-widest text-zinc-300">
            <Film className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>CINEMATIC DINING EXPERIENCE</span>
          </div>

          {/* 메인 헤드라인 (인라인 편집 가능) */}
          <h2 className="text-3xl sm:text-5xl font-serif-editorial font-bold text-white tracking-tight leading-[1.2]">
            <EditableText
              as="span"
              value={headlineTitle}
              editable={isEditMode}
              onChange={(val) => onUpdate && onUpdate({ headlineTitle: val })}
              placeholder="헤드라인 첫 번째 줄"
            />
            <br />
            <EditableText
              as="span"
              value={headlineHighlight}
              editable={isEditMode}
              onChange={(val) => onUpdate && onUpdate({ headlineHighlight: val })}
              placeholder="강조 문구"
              className="text-rose-400"
            />
          </h2>

          {/* 설명 문구 */}
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
            <EditableText
              as="span"
              value={description}
              multiline
              editable={isEditMode}
              onChange={(val) => onUpdate && onUpdate({ description: val })}
              placeholder="설명 문구를 입력하세요"
            />
          </p>

          {/* 액션 버튼: 완벽한 동일 크기/높이/패딩 샤프한 구조 */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <AdaptiveButton
              onClick={onOpenCheckout}
              className="w-36 sm:w-40 h-11 inline-flex items-center justify-center backdrop-blur-md"
            >
              <EditableText
                as="span"
                value={ctaText}
                editable={isEditMode}
                onChange={(val) => onUpdate && onUpdate({ ctaText: val })}
                placeholder="버튼 문구"
              />
            </AdaptiveButton>

            <Link
              href="/dining"
              className="w-36 sm:w-40 h-11 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 hover:border-white/30 text-white font-semibold text-sm sm:text-[15px] tracking-wide transition-all duration-200 inline-flex items-center justify-center gap-1.5 backdrop-blur-md shadow-md"
            >
              <span>자세히 보기</span>
              <ArrowRight className="w-4 h-4 text-zinc-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* 미디어 교체 모달 */}
      <MediaUploadModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        currentUrl={mediaUrl}
        currentType={mediaType}
        onApply={handleMediaApply}
        title="동영상 배너 미디어(MP4 / 유튜브 / 사진) 교체"
      />
    </section>
  );
}

