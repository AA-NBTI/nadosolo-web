'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  ShieldAlert,
  Phone,
  Heart,
  ExternalLink,
} from 'lucide-react';
import {
  LONELINESS_QUESTIONS,
  LONELINESS_TYPES,
  COUNSELING_HOTLINES,
  computeLonelinessResult,
  LonelinessScoringOutput,
} from '@/lib/solotest/lonelinessData';

export default function LonelinessTestPage() {
  const [step, setStep] = useState<'INTRO' | 'TEST' | 'RESULT'>('INTRO');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<LonelinessScoringOutput | null>(null);

  const totalQuestions = LONELINESS_QUESTIONS.length;
  const currentQ = LONELINESS_QUESTIONS[currentIdx];

  const handleStart = () => {
    setStep('TEST');
    setCurrentIdx(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelect = (score: number) => {
    if (!currentQ) return;
    const nextAnswers = { ...answers, [currentQ.id]: score };
    setAnswers(nextAnswers);

    if (currentIdx < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 190);
    } else {
      const computed = computeLonelinessResult(nextAnswers);
      setResult(computed);
      setStep('RESULT');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    } else {
      setStep('INTRO');
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setResult(null);
    setCurrentIdx(0);
    setStep('INTRO');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeTypeInfo = result ? LONELINESS_TYPES[result.type] : LONELINESS_TYPES.A;
  const shouldElevateCounseling =
    result && (result.hasCrisisFlag || result.degreeLevel === '높은 편' || result.type === 'D');

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans selection:bg-[#f04f74] selection:text-white">
      {/* 1. 인트로 */}
      {step === 'INTRO' && (
        <main className="flex-1 max-w-xl w-full mx-auto px-6 py-16 sm:py-24 flex flex-col justify-center text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span>1.5분 외로움 유형 테스트 (총 9문항)</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-snug">
              요즘 내게 필요한<br />
              <span className="text-zinc-200">연결의 모습은 무엇일까요?</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 font-light leading-relaxed max-w-md mx-auto">
              외로움은 부끄러운 감정이 아니라, 누구나 겪는 자연스러운 신호예요.<br />
              내 마음이 바라는 연결의 결을 천천히 짚어봅니다.
            </p>

            <div className="pt-4 flex flex-col gap-3 max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-base tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>테스트 시작하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="pt-2 text-xs font-mono text-zinc-500">
              가입 없이 브라우저에서 진행 · 진단이 아닌 공감과 자기 성찰을 위한 테스트예요
            </p>
          </div>
        </main>
      )}

      {/* 2. 문항 진행 */}
      {step === 'TEST' && currentQ && (
        <main className="flex-1 max-w-xl w-full mx-auto px-5 py-10 sm:py-14 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1 text-sm font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>이전</span>
              </button>

              <div className="flex items-center gap-2 text-sm font-mono text-zinc-400">
                <span className="text-zinc-500">
                  {currentQ.part === 1 ? '파트 1. 최근 감정의 빈도' : '파트 2. 관계와 생각'}
                </span>
                <span>•</span>
                <span>
                  {currentIdx + 1} / {totalQuestions}
                </span>
              </div>
            </div>

            <div className="w-full h-1 bg-white/[0.08]">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            <div className="pt-2 space-y-2">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                QUESTION 0{currentIdx + 1}
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal leading-snug">
                {currentQ.text}
              </h2>
            </div>

            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = answers[currentQ.id] === opt.score;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelect(opt.score)}
                    className={`w-full text-left p-4 sm:p-5 border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-white bg-white/10 text-white'
                        : 'border-white/10 bg-[#0c0d12] hover:bg-white/[0.04] text-zinc-200 hover:border-white/25'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-light leading-relaxed">
                      {opt.label}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected ? 'border-white bg-white text-zinc-950' : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-8 text-center text-xs font-mono text-zinc-500">
            외로움은 결함이 아닙니다. 솔직하게 느껴지는 그대로 선택해 주세요.
          </div>
        </main>
      )}

      {/* 3. 결과 화면 */}
      {step === 'RESULT' && result && (
        <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-10 sm:py-16 space-y-10">
          {/* 위기 소지 또는 유형 D/높은 편일 때: 최상단 상담 안내 배너 */}
          {shouldElevateCounseling && (
            <section className="p-5 border border-white/20 bg-white/5 space-y-3">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <ShieldAlert className="w-4 h-4 text-[#f04f74]" />
                <span>마음이 많이 버겁다면 혼자 견디지 마세요</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                마음의 고립감이 깊게 지속될 때는 새로운 모임에 억지로 나가는 것보다, 언제든 무료로 이야기 나눌 수 있는 전문 상담 전화가 가장 든든한 버팀목이 됩니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs font-mono">
                {COUNSELING_HOTLINES.map((item) => (
                  <a
                    key={item.tel}
                    href={`tel:${item.tel}`}
                    className="p-3 bg-[#0c0d12] border border-white/10 hover:border-white/25 block space-y-0.5"
                  >
                    <span className="text-zinc-400 block">{item.name}</span>
                    <span className="text-white font-bold text-sm block">{item.tel}</span>
                    <span className="text-zinc-500 block">{item.desc}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 1. 유형 카드 */}
          <section className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <span>외로움의 결 분석</span>
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  전반적 빈도: {result.degreeLevel}
                </span>
              </div>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
                {activeTypeInfo.name}
              </h2>
              <p className="text-base text-zinc-200 font-light pt-1 leading-relaxed">
                {activeTypeInfo.summary}
              </p>
              <p className="text-xs font-mono text-zinc-400">
                {activeTypeInfo.conditionDescription}
              </p>
            </div>

            {/* 이런 때 흔히 나타나요 */}
            <div className="p-4 bg-[#08090d] border border-white/10 space-y-1">
              <span className="text-xs font-mono text-zinc-500 block">이런 때 흔히 나타나요</span>
              <p className="text-sm text-zinc-300 font-light leading-relaxed">
                {activeTypeInfo.moments}
              </p>
            </div>

            {/* 오늘 해 볼 수 있는 작은 일 3가지 (무료, 일상 중심) */}
            <div className="space-y-3">
              <span className="text-xs font-mono text-white font-medium flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#f04f74]" />
                <span>오늘 해 볼 수 있는 작은 일 3가지</span>
              </span>
              <div className="space-y-2">
                {activeTypeInfo.dailyActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5"
                  >
                    <span className="text-zinc-500 font-mono shrink-0">{idx + 1}.</span>
                    <span className="font-light leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 도움이 될 수 있는 다양한 연결 방식들 */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono text-zinc-400 block">
                도움이 될 수 있는 연결 방식들
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                {activeTypeInfo.connections.map((conn, idx) => (
                  <div key={idx} className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                    <span className="text-white font-semibold block">{conn.title}</span>
                    <p className="text-zinc-400 font-light leading-relaxed">{conn.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 2. 나도솔로 모임이 맞는 경우와 맞지 않을 수 있는 경우 (정직한 한 칸) */}
          <section className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">
                솔직한 안내: 나도솔로 모임이 맞는 경우와 아닌 경우
              </span>
            </div>
            <p className="text-sm sm:text-base text-zinc-200 font-light leading-relaxed">
              {activeTypeInfo.meetupFitNote}
            </p>

            {/* 유형별 모임 연결 CTA */}
            {activeTypeInfo.meetupDisplayMode === 'TOP_PRIMARY' && (
              <div className="pt-2">
                <Link
                  href="/meetup"
                  className="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <span>이번 주 6인 식사 모임 둘러보기</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {activeTypeInfo.meetupDisplayMode === 'STARTING_POINT' && (
              <div className="pt-2">
                <Link
                  href="/meetup"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white underline underline-offset-4"
                >
                  <span>가벼운 시작점으로 모임 일정 확인하기 →</span>
                </Link>
              </div>
            )}

            {activeTypeInfo.meetupDisplayMode === 'SUBTLE_ONE_LINE' && (
              <p className="text-xs font-mono text-zinc-500 pt-1">
                ※ 새로운 사람들과의 식사가 궁금할 때: <Link href="/meetup" className="underline hover:text-white">모임 일정 보기</Link>
              </p>
            )}

            {activeTypeInfo.meetupDisplayMode === 'WEAK_BOTTOM' && (
              <p className="text-xs font-mono text-zinc-500 pt-1">
                ※ 마음의 여유가 생겼을 때: <Link href="/meetup" className="underline hover:text-white">모임 일정 둘러보기</Link>
              </p>
            )}
          </section>

          {/* 일반 상담 안내 (상단에 노출되지 않았을 경우 하단에 배치) */}
          {!shouldElevateCounseling && (
            <section className="p-5 border border-white/10 bg-[#08090d] space-y-3">
              <div className="flex items-center gap-2 text-sm font-mono text-zinc-300">
                <Phone className="w-4 h-4 text-zinc-400" />
                <span>필요하면 이야기 나눌 수 있는 공공 상담 안내</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                {COUNSELING_HOTLINES.map((item) => (
                  <div key={item.tel} className="p-2.5 border border-white/5 bg-[#0c0d12]">
                    <span className="text-zinc-500 block">{item.name}</span>
                    <span className="text-zinc-200 font-bold block">{item.tel}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 다시 하기 및 허브로 이동 */}
          <section className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="w-full sm:flex-1 py-3.5 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-mono text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>테스트 다시 하기</span>
            </button>
            <Link
              href="/test"
              className="w-full sm:flex-1 py-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/5 text-zinc-300 hover:text-white font-mono text-sm transition-all text-center"
            >
              다른 테스트 모음 보기
            </Link>
          </section>

          {/* 하단 고정 안내 */}
          <footer className="pt-6 border-t border-white/10 space-y-2 text-xs font-mono text-zinc-500 leading-relaxed">
            <p>• 이 테스트는 공감과 자기 성찰을 위한 것이며, 의료적 진단이나 심리 검사가 아닙니다.</p>
            <p>• 응답은 서버에 저장되지 않고 브라우저 내에서만 안전하게 계산됩니다.</p>
            <p>• 일상에 큰 어려움이 있다면 전문 심리 상담 기관의 도움을 받아보시기를 권합니다.</p>
          </footer>
        </main>
      )}
    </div>
  );
}
