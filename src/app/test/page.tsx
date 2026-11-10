'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import { DEFAULT_SURVEY_QUESTIONS } from '@/engine/presets';
import { ProfilingEngine } from '@/engine/profilingEngine';
import { TraitVector } from '@/engine/types';
import { ArrowLeft, Check, Compass, Sparkles, UserCheck } from 'lucide-react';

interface ArchetypeResult {
  title: string;
  subTitle: string;
  description: string;
  anchors: string[];
}

function resolveArchetype(vector: TraitVector): ArchetypeResult {
  if (vector.talkLead >= 0.55 && vector.extroversion >= 0.55) {
    return {
      title: '테이블의 따뜻한 환기자',
      subTitle: 'WARM CATALYST',
      description: '부드러운 질문과 밝은 에너지로 6인의 식탁에 온기를 불어넣고 어색함을 녹이는 소통 스타일입니다.',
      anchors: ['환기', '질문', '미소', '배려'],
    };
  }
  if (vector.talkLead <= 0.45) {
    return {
      title: '여백을 품은 경청자',
      subTitle: 'MINDFUL LISTENER',
      description: '상대방의 호흡과 말의 맥락을 깊이 헤아리며, 침묵도 식사의 편안한 여백으로 만드는 품격 있는 스타일입니다.',
      anchors: ['경청', '여백', '시선', '품격'],
    };
  }
  if (vector.lifestyleActive >= 0.55) {
    return {
      title: '지적 탐구와 발견자',
      subTitle: 'INTELLECTUAL INQUIRER',
      description: '일상의 답답한 틀을 벗어나 새로운 영감과 다채로운 시각을 교류하며 테이블에 활력을 더하는 스타일입니다.',
      anchors: ['표현', '영감', '속도', '경청'],
    };
  }
  return {
    title: '균형 잡힌 사유의 관찰자',
    subTitle: 'BALANCED OBSERVER',
    description: '이야기를 주고받는 템포가 균형 잡혀 있으며, 타인의 시선과 나의 모습을 객관적으로 조망하는 메타인지 스타일입니다.',
    anchors: ['균형', '배려', '품격', '질문'],
  };
}

export default function SoloTestPage() {
  const router = useRouter();
  const { currentUser, surveyAnswers, saveSurveyAnswers } = useNadoSoloEngine();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(() => {
    return { ...surveyAnswers };
  });
  const [isCompleted, setIsCompleted] = useState(false);

  const questions = DEFAULT_SURVEY_QUESTIONS;
  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;

  const currentAnswer = localAnswers[currentQ?.id];

  const handleSelectOption = (optionId: string) => {
    const nextAnswers = { ...localAnswers, [currentQ.id]: optionId };
    setLocalAnswers(nextAnswers);

    if (currentIdx < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
      }, 180);
    } else {
      // 마지막 문항 응답 완료
      saveSurveyAnswers(nextAnswers);
      setIsCompleted(true);
    }
  };

  const computedVector = useMemo(() => {
    const list = Object.entries(localAnswers).map(([qId, optId]) => ({
      questionId: qId,
      selectedOptionId: optId,
    }));
    return ProfilingEngine.computeSelfVector(questions, list);
  }, [localAnswers, questions]);

  const archetype = useMemo(() => resolveArchetype(computedVector), [computedVector]);

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
      {/* 1. 상단 미니멀 네비게이션 */}
      <header className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
        <Link
          href={currentUser ? '/dashboard' : '/'}
          className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentUser ? '대시보드' : '홈으로'}</span>
        </Link>
        <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
          SOLO COMM ARCHETYPE TEST
        </span>
        <div className="w-12" />
      </header>

      {/* 2. 본문 컨테이너 */}
      <main className="flex-1 max-w-xl w-full mx-auto px-5 py-8 flex flex-col justify-center">
        {!isCompleted ? (
          <div className="space-y-8 animate-fadeIn">
            {/* 프로그레스 바 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="text-[#f04f74] font-medium">QUESTION 0{currentIdx + 1}</span>
                <span>0{currentIdx + 1} / 0{totalQuestions}</span>
              </div>
              <div className="w-full h-1 bg-white/[0.08]">
                <div
                  className="h-full bg-[#f04f74] transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* 질문 카드 */}
            <div className="bg-[#0c0d12] border border-white/[0.08] p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <span className="px-2 py-0.5 text-[10px] font-mono bg-white/10 text-zinc-300 border border-white/10">
                  {currentQ?.category === 'personality' && '소통 템포'}
                  {currentQ?.category === 'dining' && '식탁 취향'}
                  {currentQ?.category === 'lifestyle' && '만남의 목적'}
                  {currentQ?.category === 'romance' && '피드백 온도'}
                </span>
                <h2 className="font-serif-editorial text-xl sm:text-2xl font-normal text-white leading-snug">
                  {currentQ?.questionText}
                </h2>
              </div>

              {/* 선택지 목록 */}
              <div className="space-y-3 pt-2">
                {currentQ?.options.map((opt, idx) => {
                  const isSelected = currentAnswer === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-4 sm:p-5 border transition-all cursor-pointer flex items-start gap-4 group ${
                        isSelected
                          ? 'bg-[#f04f74]/10 border-[#f04f74] text-white'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/30 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full border text-xs font-mono flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? 'border-[#f04f74] bg-[#f04f74] text-white font-medium'
                            : 'border-white/20 text-zinc-500 group-hover:border-white/40'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : idx === 0 ? 'A' : 'B'}
                      </span>
                      <span className="text-sm sm:text-base leading-relaxed font-light">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 하단 이전 버튼 */}
            {currentIdx > 0 && (
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                  className="text-xs font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer py-1"
                >
                  이전 질문
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 진단 완료 결과 화면 */
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono text-[#f04f74] bg-[#f04f74]/10 border border-[#f04f74]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>자가진단 완료</span>
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white">
                나의 소통 성향 리포트
              </h2>
            </div>

            <div className="bg-[#0c0d12] border border-white/[0.08] p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-1.5 border-b border-white/[0.08] pb-6">
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                  {archetype.subTitle}
                </span>
                <h3 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white">
                  {archetype.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-md mx-auto pt-2">
                  {archetype.description}
                </p>
              </div>

              {/* 핵심 관찰 앵커 (단일 명사 헌법 준수) */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono text-zinc-500 block text-center">
                  식탁에서 발휘되는 나의 핵심 앵커
                </span>
                <div className="flex justify-center gap-2 flex-wrap">
                  {archetype.anchors.map((anchor) => (
                    <span
                      key={anchor}
                      className="px-3 py-1.5 bg-white/[0.03] text-zinc-200 border border-white/10 text-xs font-mono"
                    >
                      #{anchor}
                    </span>
                  ))}
                </div>
              </div>

              {/* 서비스 헌법 철학 안내 */}
              <div className="p-4 bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 font-light leading-relaxed space-y-1">
                <p className="font-medium text-zinc-300">소셜 메타인지 기준선 (Baseline)</p>
                <p>
                  본 자가진단은 모임 후 동석자 5인이 타인의 시선으로 나를 관찰한 ‘다면 코칭 리포트’와 1:1로 비교·분석되는 기준선입니다.
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishAndProceed}
                  className="w-full py-4 bg-[#f04f74] hover:bg-[#d84063] text-white font-medium text-sm transition-all cursor-pointer text-center"
                >
                  {currentUser ? '모임 신청으로 이동' : '가입하고 내 성향 저장'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. 푸터 */}
      <footer className="px-6 py-4 border-t border-white/[0.06] text-center text-[10px] font-mono text-zinc-600">
        NADOSOLO METALOGUE SOCIAL ARCHITECTURE • 헌법 제2조 다면 평가 엔진 표준
      </footer>
    </div>
  );
}

