'use client';

import React, { useState } from 'react';
import { X, Check, Image as ImageIcon, Video, Youtube, Sparkles } from 'lucide-react';
import { MediaType, detectMediaType } from '../media/SmartMedia';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  currentType?: MediaType;
  onApply: (url: string, type: MediaType) => void;
  title?: string;
}

// 감성적인 럭셔리 프리셋 미디어 모음 (원클릭 테스트용)
const LUXURY_PRESETS: { label: string; url: string; type: MediaType }[] = [
  {
    label: '와인잔 & 캔들라이트 비디오 (MP4)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-red-wine-in-a-glass-at-a-dinner-table-42646-large.mp4',
    type: 'video',
  },
  {
    label: '재즈 & 다이닝 라운지 비디오 (MP4)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-friends-toasting-at-a-dinner-table-42648-large.mp4',
    type: 'video',
  },
  {
    label: '유튜브 감성 앰비언트 (YouTube)',
    url: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    type: 'youtube',
  },
  {
    label: '감성 와인 비스트로 (고화질 사진)',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1600&q=85',
    type: 'image',
  },
  {
    label: '프라이빗 라운지 북살롱 (고화질 사진)',
    url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1600&q=85',
    type: 'image',
  },
  {
    label: '오션뷰 루프탑 디너 (고화질 사진)',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
    type: 'image',
  },
];

export default function MediaUploadModal({
  isOpen,
  onClose,
  currentUrl,
  currentType,
  onApply,
  title = '미디어(사진 / 동영상) 교체 등록',
}: MediaUploadModalProps) {
  const [url, setUrl] = useState(currentUrl || '');
  const [selectedType, setSelectedType] = useState<MediaType>(currentType || detectMediaType(currentUrl));

  if (!isOpen) return null;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setSelectedType(detectMediaType(newUrl));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onApply(url.trim(), selectedType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0f1118] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-white">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 미디어 유형 선택 탭 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              미디어 형식 선택
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('image')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedType === 'image'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>이미지 (사진)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('video')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedType === 'video'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>동영상 (MP4)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('youtube')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedType === 'youtube'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>유튜브 (링크)</span>
              </button>
            </div>
          </div>

          {/* URL 직접 입력창 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              미디어 URL 링크 주소
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={
                selectedType === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : selectedType === 'video'
                  ? 'https://.../video.mp4'
                  : 'https://.../image.jpg'
              }
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* 원클릭 추천 럭셔리 프리셋 */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>추천 프리셋</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LUXURY_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUrl(p.url);
                    setSelectedType(p.type);
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-left text-xs transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate text-zinc-300 group-hover:text-white font-medium">
                    {p.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0 ml-1">
                    선택 →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 하단 액션 버튼 */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 hover:border-white/30 text-rose-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>적용</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

