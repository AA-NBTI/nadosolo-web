'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useNadoSoloEngine,
  DEFAULT_ADAPTIVE_QUESTIONS,
  DEFAULT_MATCHING_AXES,
  computeUserAxisProfile,
  AdaptiveAnswer,
} from '@/engine';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

function ChecklistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, surveyAnswers, saveSurveyAnswers } = useNadoSoloEngine();

  const activeQuestions = useMemo(
    () => DEFAULT_ADAPTIVE_QUESTIONS.filter((q) => q.isActive),
    []
  );
  const baseQuestions = useMemo(
    () => activeQuestions.filter((q) => q.layer === 'BASE'),
    [activeQuestions]
  );
  const deepQuestions = useMemo(
    () => activeQuestions.filter((q) => q.layer === 'DEEP'),
    [activeQuestions]
  );
  const pulseQuestions = useMemo(
    () => activeQuestions.filter((q) => q.layer === 'PULSE'),
    [activeQuestions]
  );

  // 쿼리 스트링 ?mode=DEEP | PULSE | BASE 결정
  const modeParam = searchParams.get('mode')?.toUpperCase();
  const checklistMode: 'BASE' | 'DEEP' | 'PULSE' =
    modeParam === 'DEEP'
      ? 'DEEP'
      : modeParam === 'PULSE'
      ? 'PULSE'
      : 'BASE';

  const [currentIdx, setCurrentIdx] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(() => ({
    ...surveyAnswers,
  }));
  const [isCompleted, setIsCompleted] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // 모드별 문항 목록
  const questions = useMemo(() => {
    if (checklistMode === 'DEEP') return deepQuestions;
    if (checklistMode === 'PULSE') return pulseQuestions;
    return baseQuestions;
  }, [checklistMode, deepQuestions, pulseQuestions, baseQuestions]);

  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const currentAnswer = currentQ ? localAnswers[currentQ.id] : undefined;

  const selectedTokens = useMemo(() => {
    if (!currentAnswer) return [];
    return String(currentAnswer)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }, [currentAnswer]);

  const customToken = selectedTokens.find((t) => t.startsWith('CUSTOM:'));
  const customInputValue = customToken ? customToken.slice(7) : '';

  const goNextStep = (nextAnswers: Record<string, string>) => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      saveSurveyAnswers(nextAnswers);
      setIsCompleted(true);
    }
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

  const handleToggleMulti = (optId: string) => {
    if (!currentQ) return;
    const withoutCustom = selectedTokens.filter((t) => !t.startsWith('CUSTOM:'));
    const maxCount = currentQ.maxSelectCount ?? 2;
    let nextIds: string[];

    if (optId === 'NONE') {
      nextIds = withoutCustom.includes('NONE') ? [] : ['NONE'];
    } else {
      const cleaned = withoutCustom.filter((id) => id !== 'NONE');
      if (cleaned.includes(optId)) {
        nextIds = cleaned.filter((id) => id !== optId);
      } else {
        if (cleaned.length >= maxCount) {
          setLimitWarning(`최대 ${maxCount}개까지만 선택할 수 있습니다.`);
          setTimeout(() => setLimitWarning(null), 2500);
          return;
        }
        nextIds = [...cleaned, optId];
      }
    }

    const nextTokens = customToken && optId !== 'NONE' ? [...nextIds, customToken] : nextIds;
    const nextVal = nextTokens.join(',');
    const nextAnswers = { ...localAnswers };
    if (nextVal) nextAnswers[currentQ.id] = nextVal;
    else delete nextAnswers[currentQ.id];
    setLocalAnswers(nextAnswers);
  };

  const handleCustomInputChange = (rawText: string) => {
    if (!currentQ) return;
    const trimmed = rawText.replace(/,/g, ' ');
    const baseTokens = selectedTokens.filter((t) => !t.startsWith('CUSTOM:') && t !== 'NONE');
    const nextTokens = trimmed.trim()
      ? [...baseTokens, `CUSTOM:${trimmed}`]
      : baseTokens;
    const nextVal = nextTokens.join(',');
    const nextAnswers = { ...localAnswers };
    if (nextVal) nextAnswers[currentQ.id] = nextVal;
    else delete nextAnswers[currentQ.id];
    setLocalAnswers(nextAnswers);
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
    if (checklistMode === 'DEEP' || checklistMode === 'PULSE') {
      router.push('/dashboard');
    } else {
      if (currentUser) {
        router.push('/meetup');
      } else {
        router.push('/auth?next=/meetup');
      }
    }
  };

  // 모드별 명칭
  const modeBadgeText =
    checklistMode === 'DEEP'
      ? 'D-1 정밀 배정 체크리스트'
      : checklistMode === 'PULSE'
      ? '오늘의 컨디션 체크'
      : '결제 전 사전 체크리스트';

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col justify-between selection:bg-[#f04f74] selection:text-white">
      {/* 1. 본문 컨테이너 */}
      <main className="flex-1 max-w-xl w-full mx-auto px-5 py-10 flex flex-col justify-center">
        {!isCompleted && currentQ ? (
          <div className="space-y-6">
            {/* 프로그레스 바 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-mono text-zinc-300">
                <span className="flex items-center gap-2 font-medium text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  {modeBadgeText} · {currentQ.categoryLabel}
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block px-2.5 py-0.5 text-sm font-mono bg-white/5 text-zinc-200 border border-white/15">
                    {currentQ.categoryLabel}
                  </span>
                  {currentQ.inputType === 'MULTI' && (
                    <span className="text-xs font-mono text-[#f04f74] border border-[#f04f74]/30 px-2 py-0.5 bg-[#f04f74]/10">
                      최대 {currentQ.maxSelectCount ?? 2}개 선택
                    </span>
                  )}
                  {checklistMode === 'DEEP' && (
                    <span className="text-xs font-mono text-zinc-400">
                      심층 분석
                    </span>
                  )}
                </div>
                {limitWarning && (
                  <div className="p-2.5 border border-[#f04f74] bg-[#f04f74]/20 text-white text-xs font-mono animate-pulse">
                    ⚠️ {limitWarning}
                  </div>
                )}
                <h2 className="font-serif-editorial text-xl sm:text-2xl font-normal text-white leading-snug">
                  {currentQ.questionText}
                </h2>
              </div>

              {/* 입력 유형별 분기: SINGLE | MULTI vs SCALE_1_5 */}
              {(currentQ.inputType === 'SINGLE' || currentQ.inputType === 'MULTI') && currentQ.options ? (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected =
                      currentQ.inputType === 'MULTI'
                        ? selectedTokens.includes(opt.id)
                        : currentAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          currentQ.inputType === 'MULTI'
                            ? handleToggleMulti(opt.id)
                            : handleSelectValue(opt.id)
                        }
                        className={`w-full text-left p-4 border transition-all cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-white/15 border-[#f04f74]/70 text-white'
                            : 'bg-[#08090d] border-white/10 hover:border-white/30 text-zinc-200 hover:text-white'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 border text-sm font-mono flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#f04f74] bg-[#f04f74] text-white font-bold'
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

                  {currentQ.allowCustomInput && (
                    <div className="p-4 border border-white/15 bg-[#08090d] space-y-2">
                      <label className="block text-xs font-mono text-zinc-400">
                        원하는 항목이 없을 경우 직접 입력 (선택)
                      </label>
                      <input
                        type="text"
                        value={customInputValue}
                        onChange={(e) => handleCustomInputChange(e.target.value)}
                        placeholder={currentQ.customPlaceholder || '직접 입력해 주세요'}
                        className="w-full px-3 py-2.5 bg-[#0c0d12] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#f04f74]"
                      />
                    </div>
                  )}
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
              {currentAnswer !== undefined && (
                <button
                  type="button"
                  onClick={() => goNextStep(localAnswers)}
                  className="px-4 py-2 border border-[#f04f74] bg-[#f04f74] hover:bg-[#d93a5e] text-sm font-mono font-bold text-white cursor-pointer transition-colors"
                >
                  {currentIdx < totalQuestions - 1
                    ? currentQ.inputType === 'MULTI'
                      ? '선택 완료 →'
                      : '다음'
                    : '진단 완료'}
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
                <span>체크 완료</span>
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white">
                {checklistMode === 'DEEP'
                  ? 'D-1 정밀 배정 프로필 반영 완료'
                  : checklistMode === 'PULSE'
                  ? '오늘의 컨디션 업데이트 완료'
                  : '사전 체크리스트 완료'}
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
                {checklistMode === 'DEEP'
                  ? '타임레프트 검증 Big Five 성향 및 가치관 22문항 분석이 정밀 저장되었습니다. D-1 화요일 18:00에 나와 가장 결이 맞는 6인 테이블과 식당이 배정 및 공개됩니다.'
                  : checklistMode === 'PULSE'
                  ? '오늘 밤 식탁에서 나눌 대화 에너지와 음료 취향이 모임 테이블에 실시간 반영되었습니다.'
                  : '입력하신 기본 정보(도시, 예산, 식단, 기질)가 안전하게 저장되었습니다. 원하는 일정 슬롯을 예약해 주세요. 결제 완료 후 D-1 정밀 배정을 위한 심층 체크리스트가 이어집니다.'}
              </div>

              <button
                type="button"
                onClick={handleFinishAndProceed}
                className="w-full py-4 border border-[#f04f74] bg-[#f04f74] hover:bg-[#d93a5e] text-white font-mono font-bold text-sm tracking-wide shadow-lg shadow-[#f04f74]/25 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <span>
                  {checklistMode === 'DEEP' || checklistMode === 'PULSE'
                    ? '대시보드로 이동'
                    : currentUser
                    ? '일정 예약하기'
                    : '저장 후 일정 예약하기'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. 푸터 */}
      <footer className="px-6 py-4 border-t border-white/[0.06] text-center text-sm font-mono text-zinc-400">
        NADOSOLO ADAPTIVE MATCHING • 2단계 프로그레시브 체크리스트 (사전 BASE 8 · 심층 DEEP 24 · 컨디션 PULSE 4)
      </footer>
    </div>
  );
}

export default function SoloTestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080a] flex items-center justify-center text-zinc-400 font-mono text-sm">
          체크리스트 불러오는 중...
        </div>
      }
    >
      <ChecklistContent />
    </Suspense>
  );
}
