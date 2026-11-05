'use client';

import React from 'react';
import { Video, Image as ImageIcon, Youtube, Edit3 } from 'lucide-react';

export type MediaType = 'image' | 'video' | 'youtube';

export interface SmartMediaProps {
  mediaType?: MediaType;
  src: string;
  alt?: string;
  className?: string;
  editable?: boolean;
  onEditClick?: () => void;
  overlayGradient?: boolean;
}

// 유튜브 URL에서 비디오 ID 추출 헬퍼
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// 미디어 타입 자동 감지 헬퍼
export function detectMediaType(url: string): MediaType {
  if (!url) return 'image';
  const clean = url.trim().toLowerCase();
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
    return 'youtube';
  }
  if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg') || clean.includes('/video/')) {
    return 'video';
  }
  return 'image';
}

export default function SmartMedia({
  mediaType,
  src,
  alt = 'Media content',
  className = 'w-full h-full object-cover',
  editable = false,
  onEditClick,
  overlayGradient = false,
}: SmartMediaProps) {
  const resolvedType = mediaType || detectMediaType(src);
  const ytId = resolvedType === 'youtube' ? extractYouTubeId(src) : null;

  return (
    <div className="relative w-full h-full overflow-hidden group select-none">
      {/* 1. 유튜브 배경 영상 */}
      {resolvedType === 'youtube' && ytId ? (
        <div className="w-full h-full overflow-hidden pointer-events-none relative scale-125">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`}
            title={alt}
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full border-0 absolute inset-0 pointer-events-none"
          />
        </div>
      ) : resolvedType === 'video' ? (
        /* 2. 직접 등록한 MP4/WebM 배경 비디오 */
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className={className}
        />
      ) : (
        /* 3. 일반 고화질 이미지 */
        <img
          src={src || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1600&q=85'}
          alt={alt}
          className={className}
        />
      )}

      {/* 은은한 그라데이션 오버레이 */}
      {overlayGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-black/40 to-black/30 pointer-events-none" />
      )}

      {/* [관리자 편집 모드 전용]: 미디어 교체 버튼 */}
      {editable && onEditClick && (
        <div className="absolute top-3 right-3 z-30 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-rose-300 hover:text-white border border-rose-500/50 backdrop-blur-md text-xs font-semibold shadow-2xl transition-all cursor-pointer group-hover:scale-105"
            title="이미지 또는 동영상(MP4/YouTube)으로 교체"
          >
            {resolvedType === 'youtube' ? (
              <Youtube className="w-3.5 h-3.5 text-red-500" />
            ) : resolvedType === 'video' ? (
              <Video className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>미디어 교체</span>
            <Edit3 className="w-3 h-3 text-zinc-400 ml-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}

