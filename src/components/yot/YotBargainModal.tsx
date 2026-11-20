'use client';

import React from 'react';
import YotVisual from './YotVisual';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface YotBargainModalProps {
  isOpen: boolean;
  onClose: () => void;
  taffyCount: number; // 1, 2, 3
  venueName: string;
  praiseComment: string;
  onBargainMore: () => void; // 꿀팁 더 얹고 엿 3개로 흥정하기
  onEnterRoulette: () => void; // 대형 룰렛장 입장하기
}

export default function YotBargainModal({
  isOpen,
  onClose,
  taffyCount,
  venueName,
  praiseComment,
  onBargainMore,
  onEnterRoulette,
}: YotBargainModalProps) {
  if (!isOpen) return null;

  const isMaxTaffy = taffyCount >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0c0d12] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden text-center space-y-6">
        
        {/* 상단 뱃지 */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <span>엿장수 감정소</span>
          </div>
        </div>

        {/* 엿장수 캐릭터 & 감정 코멘트 */}
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1f2029] to-[#2d2f3d] border border-[#f04f74] mx-auto flex items-center justify-center text-2xl shadow-lg">
            🤠
          </div>

          <h3 className="text-xl sm:text-2xl font-serif-editorial text-white font-normal">
            "{venueName}"
          </h3>

          {/* 실제 엿 그래픽 노출 */}
          <div className="py-2">
            <YotVisual count={taffyCount} />
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-sm text-zinc-200 leading-relaxed font-sans">
            {isMaxTaffy ? (
              <span className="text-white font-medium">
                "추천 이유와 꿀팁 확인 완료. 엿 3개 지급!"
              </span>
            ) : taffyCount === 2 ? (
              <span>
                "엿 2개 지급 완료. 바로 룰렛을 돌리거나 꿀팁을 더 적어 흥정 가능."
              </span>
            ) : (
              <span>
                "엿 1개 지급 완료. 바로 룰렛을 돌리거나 꿀팁을 더 적어 흥정 가능."
              </span>
            )}
          </div>
        </div>

        {/* 액션 버튼 (헌법 제4조: 사족 없는 간결한 단어) */}
        <div className="space-y-2.5 pt-2">
          {/* [메인 버튼] 룰렛 돌리기 */}
          <button
            type="button"
            onClick={onEnterRoulette}
            className="w-full py-3.5 rounded-xl bg-[#f04f74] text-white font-semibold text-sm hover:bg-[#d63f63] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(240,79,116,0.4)] cursor-pointer"
          >
            <span>룰렛 돌리기 ({taffyCount}회)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* [보조적 요소] 흥정하기 */}
          {!isMaxTaffy && (
            <button
              type="button"
              onClick={onBargainMore}
              className="w-full py-2 text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>흥정하기 (엿 3개 도전)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
