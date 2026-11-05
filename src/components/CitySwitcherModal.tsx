'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, X, Check } from 'lucide-react';
import { useNadoSoloEngine } from '@/engine';

interface CitySwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CitySwitcherModal({ isOpen, onClose }: CitySwitcherModalProps) {
  const router = useRouter();
  const { regionDistricts } = useNadoSoloEngine();

  if (!isOpen) return null;

  // 현재 실제 개설되어 모임이 진행 중인 라이브 권역 추출
  const activeDistricts = regionDistricts.filter((d) => d.active);

  const handleSelectCity = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0f1118] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl text-white space-y-5"
      >
        {/* 상단 헤더 & 닫기 버튼 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>진행 중인 모임 지역</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              현재 실제 개설되어 참여 가능한 라이브 거점입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 현재 실제 진행 중인 거점 목록 */}
        <div className="space-y-2.5">
          {/* 부산 메인 허브 */}
          <div
            onClick={() => handleSelectCity('/busan')}
            className="p-4 rounded-xl bg-white/[0.03] border border-rose-500/40 hover:border-rose-500 hover:bg-rose-950/20 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white group-hover:text-rose-200 transition-colors">
                  부산 (Busan)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-600/30 text-rose-300 border border-rose-500/40">
                  모임 진행중
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                전포 · 서면, 해운대, 광안리, 남포
              </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Check className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="pt-2 text-center text-xs text-zinc-500">
          타 지역은 모임 정식 개설 시 순차적으로 공개됩니다.
        </div>
      </div>
    </div>
  );
}
