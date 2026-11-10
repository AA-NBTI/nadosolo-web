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
      {/* 1. 상단 마일스톤 프로그레스 트래커 */}
      <div className="bg-[#0c0d12] border border-white/[0.08] p-3 sm:p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74] animate-pulse" />
            <span className="text-zinc-300 font-semibold uppercase tracking-wider">
              참여 프로세스 여정
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            {steps.filter((s) => s.status === 'COMPLETED').length} / {steps.length} 단계 완료
          </span>
        </div>

        {/* 단계별 가로 바 */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {milestones.map((m) => {
            const stepResult = steps.find((s) => s.stepId === m.id);
            const isCompleted = stepResult?.status === 'COMPLETED';
            const isBlocked = stepResult?.status === 'BLOCKED';
            const isInProgress = stepResult?.status === 'IN_PROGRESS';

            return (
              <div
                key={m.id}
                className={`px-2 py-2 border text-center transition-all ${
                  isCompleted
                    ? 'border-white/20 bg-white/[0.04] text-zinc-200'
                    : isInProgress
                    ? 'border-[#f04f74] bg-[#f04f74]/10 text-white font-bold'
                    : isBlocked
                    ? 'border-white/[0.06] bg-black/40 text-zinc-500'
                    : 'border-white/[0.06] bg-black/40 text-zinc-400'
                }`}
              >
                <div className="text-[10px] truncate block mb-0.5">
                  {isCompleted ? '✓ 완료' : isInProgress ? '● 진행중' : isBlocked ? '잠김' : '대기'}
                </div>
                <div className="text-xs truncate font-medium">
                  {m.label.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 동적 알림 및 즉시 안내 배너 (미충족 조건이 있거나 진행 중인 단계가 있을 때) */}
      {nextRecommendedAction && currentStalledStep && (
        <div className="p-4 border border-[#f04f74]/60 bg-[#f04f74]/[0.06] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-[#f04f74] text-white text-[10px] font-bold uppercase">
                {currentStalledStep.status === 'BLOCKED' ? '선행 조건 필요' : '다음 진행 단계'}
              </span>
              <strong className="text-white text-sm">
                {currentStalledStep.stepName}
              </strong>
            </div>
            <p className="text-zinc-300 font-light leading-relaxed">
              {currentStalledStep.guideMessage}
            </p>
            {currentStalledStep.missingRequirements.length > 0 && (
              <div className="text-[11px] text-[#f04f74] flex items-center gap-1.5 pt-0.5">
                <span>필요 항목:</span>
                <span className="font-semibold underline">
                  {currentStalledStep.missingRequirements.join(', ')}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleActionClick(nextRecommendedAction.actionRoute)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#f04f74] hover:bg-[#d03d60] text-white text-xs font-semibold tracking-wider transition-colors shrink-0 cursor-pointer text-center"
          >
            {nextRecommendedAction.actionLabel} ➔
          </button>
        </div>
      )}
    </div>
  );
}

