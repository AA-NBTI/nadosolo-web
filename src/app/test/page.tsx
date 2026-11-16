'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useNadoSoloEngine,
  DEFAULT_ADAPTIVE_QUESTIONS,
  DEFAULT_MATCHING_AXES,
  computeUserAxisProfile,
  AdaptiveAnswer,
} from '@/engine';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

export default function SoloTestPage() {
  const router = useRouter();
  const { currentUser, surveyAnswers, saveSurveyAnswers } = useNadoSoloEngine();

  const activeQuestions = useMemo(
    () => DEFAULT_ADAPTIVE_QUESTIONS.filter((q) => q.isActive),
    []
  );
  const pulseQuestions = useMemo(
    () => activeQuestions.filter((q) => q.layer === 'PULSE'),
    [activeQuestions]
  );

  // 기존 BASE 응답이 이미 충분하면 기본으로 '오늘의 컨디션(PULSE)' 모드 제안 가능
  const hasExistingBase = useMemo(() => {
    const baseCount = activeQuestions.filter(
      (q) => q.layer === 'BASE' && surveyAnswers[q.id] !== undefined
    ).length;
    return baseCount >= 8;
  }, [activeQuestions, surveyAnswers]);

  const [quizMode, setQuizMode] = useState<'FULL' | 'PULSE'>(() =>
    hasExistingBase ? 'PULSE' : 'FULL'
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(() => ({
    ...surveyAnswers,
  }));
  const [isCompleted, setIsCompleted] = useState(false);

  const questions = quizMode === 'PULSE' ? pulseQuestions : activeQuestions;
  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const currentAnswer = currentQ ? localAnswers[currentQ.id] : undefined;

  const handleModeSwitch = (mode: 'FULL' | 'PULSE') => {
    setQuizMode(mode);
    setCurrentIdx(0);
    setIsCompleted(false);
  };

  const handleSelectValue = (val: string) => {
    if (!currentQ) return;
    const nextAnswers = { ...localAnswers, [currentQ.id]: val };
    setLocalAnswers(nextAnswers);

    if (currentIdx < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
      }, 180);
    } else {
      saveSurveyAnswers(nextAnswers);
      setIsCompleted(true);
    }
  };

  const computedProfile = useMemo(() => {
    const adaptiveList: AdaptiveAnswer[] = activeQuestions
      .filter((q) => localAnswers[q.id] !== undefined)
      .map((q) => ({
        questionId: q.id,
        version: q.version,
        value: localAnswers[q.id],
      }));

    return computeUserAxisProfile(
      {
        userId: currentUser?.userId ?? 'GUEST',
        gender: currentUser?.gender ?? 'F',
        birthYear: currentUser?.birthYear ?? 1994,
        cityCode: currentUser?.residenceCity ?? 'SEOUL',
        purpose: currentUser?.preferredPurpose,
      },
      adaptiveList,
      activeQuestions,
      DEFAULT_MATCHING_AXES
    );
  }, [activeQuestions, localAnswers, currentUser]);

  const handleFinishAndProceed = () => {
    saveSurveyAnswers(localAnswers);
    if (currentUser) {
      router.push('/dashboard?step=P05_EVENT_APPLY');
    } else {
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col justify-between selection:bg-[#f04f74] selection:text-white">
      {/* 1. 상단 네비게이션 */}
      <header className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
        <Link
          href={currentUser ? '/dashboard' : '/'}
          className="flex items-center gap-2 text-sm font-mono text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentUser ? '대시보드' : '홈'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch('FULL')}
            className={`px-3 py-1 text-sm font-mono border transition-colors cursor-pointer ${
              quizMode === 'FULL'
                ? 'border-white/40 bg-white/15 text-white font-semibold'
                : 'border-white/10 bg-[#0c0d12] text-zinc-400 hover:text-white'
            }`}
          >
            전체 ({activeQuestions.length})
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('PULSE')}
            className={`px-3 py-1 text-sm font-mono border transition-colors cursor-pointer ${
              quizMode === 'PULSE'
                ? 'border-white/40 bg-white/15 text-white font-semibold'
                : 'border-white/10 bg-[#0c0d12] text-zinc-400 hover:text-white'
            }`}
          >
            컨디션 ({pulseQuestions.length})
          </button>
        </div>
      </header>

      {/* 2. 본문 컨테이너 */}
      <main className="flex-1 max-w-xl w-full mx-auto px-5 py-8 flex flex-col justify-center">
        {!isCompleted && currentQ ? (
          <div className="space-y-6">
            {/* 프로그레스 바 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-mono text-zinc-300">
                <span className="flex items-center gap-2 font-medium text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  {currentQ.layer === 'PULSE' ? '컨디션' : '기본'} · {currentQ.categoryLabel}
                </span>
                <span>
                  {String(currentIdx + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
                </span>
              </div>
              <div className="w-full h-1 bg-white/[0.08]">
                <div
                  className="h-full bg-[#f04f74] transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* 질문 카드 */}
            <div className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 text-sm font-mono bg-white/5 text-zinc-200 border border-white/15">
                  {currentQ.categoryLabel}
                </span>
                <h2 className="font-serif-editorial text-xl sm:text-2xl font-normal text-white leading-snug">
                  {currentQ.questionText}
                </h2>
              </div>

              {/* 입력 유형별 분기: SINGLE vs SCALE_1_5 */}
              {currentQ.inputType === 'SINGLE' && currentQ.options ? (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = currentAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectValue(opt.id)}
                        className={`w-full text-left p-4 border transition-all cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-white/15 border-white/40 text-white'
                            : 'bg-[#08090d] border-white/10 hover:border-white/30 text-zinc-200 hover:text-white'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 border text-sm font-mono flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-white/50 bg-white/20 text-white font-bold'
                              : 'border-white/20 text-zinc-400'
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4" /> : idx + 1}
                        </span>
                        <span className="text-sm sm:text-base leading-relaxed font-normal">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : currentQ.inputType === 'SCALE_1_5' && currentQ.scaleConfig ? (
                <div className="space-y-4 pt-3">
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const valStr = String(num);
                      const isSelected = currentAnswer === valStr;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleSelectValue(valStr)}
                          className={`py-4 border text-base font-mono font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-white/50 bg-white/20 text-white'
                              : 'border-white/15 bg-[#08090d] text-zinc-300 hover:border-white/35 hover:text-white'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-400 font-mono">
                    <span>1 · {currentQ.scaleConfig.minLabel}</span>
                    <span>5 · {currentQ.scaleConfig.maxLabel}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* 하단 이동 버튼 */}
            <div className="flex items-center justify-between">
              {currentIdx > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 border border-white/15 text-sm font-mono text-zinc-300 hover:text-white cursor-pointer"
                >
                  이전
                </button>
              ) : (
                <div />
              )}
              {currentAnswer !== undefined && currentIdx < totalQuestions - 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((p) => p + 1)}
                  className="px-3 py-1.5 border border-white/25 bg-white/10 text-sm font-mono text-white cursor-pointer"
                >
                  다음
                </button>
              )}
            </div>
          </div>
        ) : (
          /* 진단 완료 결과 화면 (4대 동적 축 리포트) */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-mono text-white bg-white/10 border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <Sparkles className="w-4 h-4" />
                <span>진단 완료</span>
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white">
                나의 소셜 테이블 좌표
              </h2>
            </div>

            <div className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-6">
              {/* 4대 동적 축 2열 컴팩트 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_MATCHING_AXES.filter((a) => a.isActive).map((axis) => {
                  const score = computedProfile.axisScores[axis.axisId] ?? 50;
                  const label = computedProfile.axisLabels[axis.axisId] ?? '균형';
                  return (
                    <div
                      key={axis.axisId}
                      className="p-4 border border-white/10 bg-[#08090d] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-zinc-400">{axis.label}</span>
                        <span className="text-sm font-mono font-bold text-white">{label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10">
                        <div
                          className="h-full bg-white"
                          style={{ width: `${Math.max(10, score)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/10 text-sm text-zinc-300 font-light leading-relaxed">
                입력한 성향과 오늘의 컨디션 좌표는 동석자에게 비공개로 보호되며, 가장 결이 맞는 6인 테이블 매칭 및 사후 메타인지 리포트 비교 기준선으로만 사용됩니다.
              </div>

              <button
                type="button"
                onClick={handleFinishAndProceed}
                className="w-full py-3.5 border border-white/30 bg-white/15 hover:bg-white/25 text-white font-mono font-semibold text-sm transition-all cursor-pointer text-center"
              >
                {currentUser ? '신청' : '저장'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. 푸터 */}
      <footer className="px-6 py-4 border-t border-white/[0.06] text-center text-sm font-mono text-zinc-400">
        NADOSOLO ADAPTIVE MATCHING • 12+4 동적 축 표준
      </footer>
    </div>
  );
}
