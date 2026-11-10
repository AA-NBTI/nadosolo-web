'use client';

import React from 'react';
import { useNadoSoloEngine } from '@/engine';

interface ProcessJourneyTrackerProps {
  onNavigateTab?: (tabKey: string) => void;
}

export default function ProcessJourneyTracker({ onNavigateTab }: ProcessJourneyTrackerProps) {
  const { userJourney, currentUser } = useNadoSoloEngine();
  const { steps, currentStalledStep, nextRecommendedAction } = userJourney;

  if (!currentUser) return null;

  // 주요 5대 고객 마일스톤
  const milestones = [
    { id: 'P01_IDENTITY', label: '1. 계정 인증' },
    { id: 'P02_PROFILE', label: '2. 프로필·연락처' },
    { id: 'P04_SELF_ASSESS', label: '3. 성향 자가진단' },
    { id: 'P05_EVENT_APPLY', label: '4. 모임 신청' },
    { id: 'P08_OBSERVE', label: '5. 다면 평가' },
    { id: 'P10_REPORT', label: '6. 소셜 리포트' },
  ];

  const handleActionClick = (actionRoute: string) => {
    if (onNavigateTab) {
      if (actionRoute.includes('PROFILE') || actionRoute.includes('연락처')) {
        onNavigateTab('P02_PROFILE');
      } else if (actionRoute.includes('EVALUATION') || actionRoute.includes('평가')) {
        onNavigateTab('P00_MEETUP_STATUS');
      } else {
        onNavigateTab('P02_PROFILE');
      }
    }
  };

  return (
    <div className="space-y-3 mb-6 font-mono">
      {/* 1. 상단 마일스톤 프로그레스 트래커 (표준 테두리 박스 컨테이너) */}
      <div className="bg-[#0c0d12] border border-white/10 p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <span className="text-white font-semibold">
              여정
            </span>
          </div>
          <span className="px-2 py-0.5 text-sm font-mono border border-white/10 bg-white/5 text-zinc-300">
            {steps.filter((s) => s.status === 'COMPLETED').length} / {steps.length} 단계
          </span>
        </div>

        {/* 단계별 가로 바 (14px 이상 표준 & 동적 진행 글자 포인트 컬러) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {milestones.map((m) => {
            const stepResult = steps.find((s) => s.stepId === m.id);
            const isCompleted = stepResult?.status === 'COMPLETED';
            const isBlocked = stepResult?.status === 'BLOCKED';
            const isInProgress = stepResult?.status === 'IN_PROGRESS';

            return (
              <div
                key={m.id}
                className={`p-2.5 border text-center transition-all ${
                  isCompleted
                    ? 'border-white/15 bg-white/[0.02] text-zinc-300'
                    : isInProgress
                    ? 'border-white/25 bg-white/[0.04]'
                    : isBlocked
                    ? 'border-white/[0.06] bg-black/40 text-zinc-500'
                    : 'border-white/[0.06] bg-black/40 text-zinc-400'
                }`}
              >
                <div className="text-sm truncate block mb-1">
                  {isCompleted ? (
                    <span className="text-zinc-300 font-medium">✓ 완료</span>
                  ) : isInProgress ? (
                    <span className="text-[#f04f74] font-bold animate-pulse">● 진행</span>
                  ) : isBlocked ? (
                    <span className="text-zinc-500">잠김</span>
                  ) : (
                    <span className="text-zinc-400">대기</span>
                  )}
                </div>
                <div
                  className={`text-sm truncate ${
                    isInProgress ? 'text-[#f04f74] font-bold' : 'text-zinc-200 font-normal'
                  }`}
                >
                  {m.label.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 동적 알림 및 즉시 안내 배너 (보조설명 배제 & 핵심 글자 포인트 컬러) */}
      {nextRecommendedAction && currentStalledStep && (
        <div className="p-3.5 border border-white/10 bg-[#0c0d12] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-zinc-300 text-sm font-mono">
              {currentStalledStep.status === 'BLOCKED' ? '선행 필요' : '다음 진행'}
            </span>
            <strong className="text-[#f04f74] text-sm font-bold truncate">
              {currentStalledStep.stepName}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => handleActionClick(nextRecommendedAction.actionRoute)}
            className="w-full sm:w-auto px-4 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-mono transition-colors shrink-0 cursor-pointer text-center"
          >
            {nextRecommendedAction.actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

