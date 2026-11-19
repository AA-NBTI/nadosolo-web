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
  Share2,
  Copy,
  Sparkles,
} from 'lucide-react';
import {
  UCLA_QUESTIONS,
  UCLA_SCALE_OPTIONS,
  COUNSELING_HOTLINES,
  computeUCLAResult,
  UCLAScoringOutput,
} from '@/lib/solotest/lonelinessData';

export default function UCLALonelinessTestPage() {
  const [step, setStep] = useState<'INTRO' | 'TEST' | 'RESULT'>('INTRO');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<UCLAScoringOutput | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalQuestions = UCLA_QUESTIONS.length;
  const currentQ = UCLA_QUESTIONS[currentIdx];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

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
      }, 160);
    } else {
      const computed = computeUCLAResult(nextAnswers);
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('테스트 링크가 복사되었습니다.');
    } catch {
      showToast('링크 복사에 실패했습니다.');
    }
  };

  const handleShareResult = async () => {
    if (!result) return;
    const shareText = `[나도솔로] UCLA 외로움 자가진단 결과\n나의 외로움 지수: ${result.finalScore}점 / 100점\n진단 유형: ${result.typeInfo.name} (${result.typeInfo.grade})\n가장 큰 결핍 영역: ${result.topDeficitDomain.label}\n\n자가진단 테스트: ${window.location.origin}/test/loneliness`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'UCLA 외로움 자가진단 결과',
          text: shareText,
          url: `${window.location.origin}/test/loneliness`,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast('진단 결과 요약이 클립보드에 복사되었습니다.');
      }
    } catch {
      await navigator.clipboard.writeText(shareText);
      showToast('진단 결과 요약이 클립보드에 복사되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans selection:bg-[#f04f74] selection:text-white">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-white text-zinc-950 font-mono text-sm font-medium shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* 1. 인트로 화면 */}
      {step === 'INTRO' && (
        <main className="flex-1 max-w-xl w-full mx-auto px-6 py-14 sm:py-20 flex flex-col justify-center text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span>학술 표준 UCLA Loneliness Scale v3 (20문항)</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-snug">
              요즘 나의 마음은<br />
              <span className="text-zinc-200">어떤 연결을 바라고 있을까요?</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed max-w-md mx-auto">
              외로움은 결함이 아니라, 나의 정서적 영양 상태를 알려주는 신호입니다.<br />
              심리학에서 널리 검증된 표준 척도를 통해 나의 현재 관계 상태를 객관적으로 짚어보세요.
            </p>

            <div className="p-4 bg-[#0c0d12] border border-white/10 text-left space-y-2 text-xs font-mono text-zinc-400 max-w-md mx-auto">
              <div className="flex items-center justify-between text-zinc-300 pb-1 border-b border-white/10 font-sans">
                <span>진단 안내 요약</span>
                <span>약 2분 소요</span>
              </div>
              <p>• 4점 리커트 척도 (전혀 그렇지 않다 ~ 자주 그렇다)</p>
              <p>• 정서적 친밀감 · 사회적 소속감 · 관계적 고립감 3대 세부 영역 진단</p>
              <p>• 100점 환산 지수 및 4대 관계 유형별 일상 처방 제공</p>
            </div>

            <div className="pt-2 flex flex-col gap-3 max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-base tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>자가진단 시작하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-4 text-xs font-mono text-zinc-500 space-y-1">
              <p>가입 없이 브라우저에서 진행 · 응답은 서버에 저장되지 않습니다.</p>
              <p>본 검사는 의학적 진단이 아니며, 자기 성찰을 위한 학술 자가진단 척도입니다.</p>
            </div>
          </div>
        </main>
      )}

      {/* 2. 문항 진행 화면 */}
      {step === 'TEST' && currentQ && (
        <main className="flex-1 max-w-xl w-full mx-auto px-5 py-8 sm:py-12 flex flex-col justify-between">
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
                <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-zinc-300 text-xs">
                  {currentQ.domainLabel}
                </span>
                <span>•</span>
                <span className="text-white font-medium">
                  {currentIdx + 1} / {totalQuestions}
                </span>
              </div>
            </div>

            {/* 상단 프로그레스 바 */}
            <div className="w-full h-1 bg-white/[0.08]">
              <div
                className="h-full bg-white transition-all duration-200"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            <div className="pt-2 space-y-2">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                QUESTION {currentQ.num < 10 ? `0${currentQ.num}` : currentQ.num}
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal leading-snug">
                {currentQ.text}
              </h2>
            </div>

            {/* 4점 리커트 척도 선택 버튼 */}
            <div className="space-y-2.5 pt-2">
              {UCLA_SCALE_OPTIONS.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
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
            떠오르는 느낌 그대로 솔직하게 응답해 주세요.
          </div>
        </main>
      )}

      {/* 3. 결과 리포트 화면 */}
      {step === 'RESULT' && result && (
        <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-10 sm:py-16 space-y-8">
          {/* 위기 소지 감지 시 최상단 상담 안내 */}
          {result.hasCrisisFlag && (
            <section className="p-5 border border-white/20 bg-white/5 space-y-3">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <ShieldAlert className="w-4 h-4 text-[#f04f74]" />
                <span>마음이 버거울 때는 언제든 도움을 요청하세요</span>
              </div>
              <p className="text-sm text-zinc-300 font-light leading-relaxed">
                사회적 연결감이 크게 방전되어 혼자 견디기 힘든 상태일 수 있습니다. 언제든 무료로 이야기 나눌 수 있는 전문 공공 상담 전화가 큰 힘이 됩니다.
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

          {/* 상단: 점수 및 유형 요약 카드 */}
          <section className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="space-y-3 border-b border-white/10 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <span>UCLA 척도 표준 진단 결과</span>
                </span>
                <span className="px-2.5 py-1 text-xs font-mono border border-white/20 bg-white/5 text-zinc-200">
                  {result.typeInfo.grade}
                </span>
              </div>

              <div className="pt-1">
                <div className="text-xs font-mono text-zinc-400 mb-1">나의 외로움 지수</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-mono font-bold text-white">
                    {result.finalScore}
                  </span>
                  <span className="text-sm font-mono text-zinc-400">/ 100점</span>
                  <span className="text-xs font-mono text-zinc-500 ml-2">
                    (원점수: {result.rawScore}점)
                  </span>
                </div>
              </div>

              <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal pt-2">
                {result.typeInfo.name}
              </h2>
              <p className="text-sm sm:text-base text-zinc-200 font-light leading-relaxed">
                {result.typeInfo.message}
              </p>
            </div>

            {/* 핵심 처방 요약 */}
            <div className="p-4 bg-[#08090d] border border-white/10 space-y-1.5">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f04f74]" />
                <span>심리학적 처방 가이드</span>
              </span>
              <p className="text-sm text-zinc-200 font-light leading-relaxed">
                {result.typeInfo.prescription}
              </p>
            </div>

            {/* 오늘 실천할 수 있는 작은 일 3가지 */}
            <div className="space-y-3">
              <span className="text-xs font-mono text-white font-medium flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#f04f74]" />
                <span>오늘 해 볼 수 있는 작은 행동 3가지</span>
              </span>
              <div className="space-y-2">
                {result.typeInfo.dailyActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white/[0.02] border border-white/10 text-sm text-zinc-300 flex items-start gap-2.5"
                  >
                    <span className="text-zinc-500 font-mono shrink-0">{idx + 1}.</span>
                    <span className="font-light leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 중단: 3대 세부 영역 심층 분석 (80% 전문성 확보) */}
          <section className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono text-zinc-400 block">3대 하위 차원 심층 분석</span>
              <h3 className="font-serif-editorial text-xl text-white font-normal">
                관계 만족도 및 결핍 지표
              </h3>
            </div>

            {/* 3대 영역 게이지 바 */}
            <div className="space-y-4 pt-1">
              {Object.values(result.domains).map((dom) => (
                <div key={dom.domain} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-200">{dom.label}</span>
                    <span className="text-zinc-400">
                      {dom.score100}점 <span className="text-zinc-600">/ 100</span> (평균 {dom.avgScore}점)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full bg-zinc-300 transition-all duration-500"
                      style={{ width: `${dom.score100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 가장 결핍도가 높은 영역 맞춤 분석 리포트 */}
            <div className="p-5 bg-[#08090d] border border-white/10 space-y-3 mt-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-mono text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <span>1순위 결핍 영역: {result.topDeficitDomain.label} ({result.topDeficitDomain.score100}점)</span>
                </span>
                <span className="text-xs font-mono text-zinc-500">집중 케어 필요</span>
              </div>

              <div className="space-y-2 text-sm font-light text-zinc-300 leading-relaxed">
                <p>
                  <strong className="text-white font-medium">심리학적 해석: </strong>
                  {result.topDeficitDomain.interpretation}
                </p>
                <p>
                  <strong className="text-white font-medium">일상 속 처방: </strong>
                  {result.topDeficitDomain.prescription}
                </p>
              </div>
            </div>
          </section>

          {/* 하단: 자연스러운 모임 연결 (유형 B/C/D 추천, 유형 A는 영감 중심) */}
          <section className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">
                {result.typeInfo.meetupBadge}
              </span>
            </div>

            <h3 className="font-serif-editorial text-xl sm:text-2xl text-white font-normal">
              {result.typeInfo.meetupHeadline}
            </h3>

            <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed">
              {result.typeInfo.meetupBody}
            </p>

            <div className="pt-2">
              <Link
                href="/meetup"
                className="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>이번 주 6인 식사 모임 둘러보기</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* 일반 공공 상담 안내 (상단 미노출 시 하단에 배치) */}
          {!result.hasCrisisFlag && (
            <section className="p-5 border border-white/10 bg-[#08090d] space-y-3">
              <div className="flex items-center gap-2 text-sm font-mono text-zinc-300">
                <Phone className="w-4 h-4 text-zinc-400" />
                <span>필요 시 도움받을 수 있는 공공 무료 상담 안내</span>
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

          {/* 결과 공유 및 액션 버튼 */}
          <section className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleShareResult}
                className="py-3.5 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-mono text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>진단 결과 공유하기</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/5 text-zinc-300 hover:text-white font-mono text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>테스트 링크 복사</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleRestart}
                className="w-full sm:flex-1 py-3 border border-white/10 bg-[#0c0d12] hover:bg-white/5 text-zinc-300 hover:text-white font-mono text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>테스트 다시 하기</span>
              </button>

              <Link
                href="/test"
                className="w-full sm:flex-1 py-3 border border-white/10 bg-[#0c0d12] hover:bg-white/5 text-zinc-300 hover:text-white font-mono text-sm transition-all text-center"
              >
                다른 테스트 모음 보기
              </Link>
            </div>
          </section>

          {/* 법적 필수 출처 및 면책 조항 (고정 Footer) */}
          <footer className="pt-8 border-t border-white/10 space-y-2 text-xs font-mono text-zinc-500 leading-relaxed">
            <p>
              • <strong>출처 표기:</strong> 본 테스트는 심리학자 Daniel W. Russell(1996)의 UCLA Loneliness Scale(Version 3) 표준 척도를 한국어 정서에 맞게 재구성 및 100점 만점 기준으로 표준화한 자가진단입니다.
            </p>
            <p>
              • <strong>면책 조항:</strong> 본 결과는 의학적·임상적 진단이 아니며, 현재 나의 관계 만족도와 정서적 상태를 돌아보기 위한 참고용 지표입니다.
            </p>
            <p>
              • 응답은 서버에 저장되지 않고 사용자의 기기에서만 안전하게 연산됩니다.
            </p>
          </footer>
        </main>
      )}
    </div>
  );
}
