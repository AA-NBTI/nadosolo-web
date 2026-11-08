'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ArrowRight, CheckCircle2, Sparkles, MapPin, Calendar, Clock } from 'lucide-react';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import CheckoutModal from '@/components/CheckoutModal';

interface QuizAnswer {
  q1: string;
  q2: string;
  q3: string;
}

export default function StoryLandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'HOOK' | 'TEST' | 'RESULT'>('HOOK');
  const [currentQ, setCurrentQ] = useState<number>(1);
  const [answers, setAnswers] = useState<QuizAnswer>({ q1: '', q2: '', q3: '' });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // 질문지 데이터 (사족 배제, 직관적 핵심)
  const questions = [
    {
      step: 1,
      title: '오늘 저녁, 당신의 대화는 어떤 상태인가요?',
      options: [
        { label: '업무와 가면으로 둘러싸여 진짜 내 이야기는 닫혀 있다', value: 'masked' },
        { label: '가족이나 오랜 지인에게도 털어놓지 못하는 외로움이 있다', value: 'lonely' },
        { label: '새롭고 취향이 통하는 사람들과 지적 자극을 나누고 싶다', value: 'intellectual' },
      ],
    },
    {
      step: 2,
      title: '식탁에서 가장 마주하고 싶은 순간은?',
      options: [
        { label: '조건과 스펙 없이 온전한 나 자신으로 웃는 시간', value: 'pure' },
        { label: '와인 한 잔과 함께 깊이 있는 생각과 삶을 나누는 대화', value: 'depth' },
        { label: '타인의 시선으로 나의 소통 매너를 새롭게 발견하는 경험', value: 'mirror' },
      ],
    },
    {
      step: 3,
      title: '당신에게 가장 필요한 낯선 식탁은?',
      options: [
        { label: '조용하고 프라이빗한 룸에서 나누는 5060 골든 다이닝', value: 'golden' },
        { label: '도심 속 와인 비스트로에서 편안하게 교류하는 3040 살롱', value: 'career' },
        { label: '어떤 테마든 이해관계 없이 따뜻한 식탁이면 충분하다', value: 'any' },
      ],
    },
  ];

  const handleSelectOption = (val: string) => {
    if (currentQ === 1) {
      setAnswers((prev) => ({ ...prev, q1: val }));
      setCurrentQ(2);
    } else if (currentQ === 2) {
      setAnswers((prev) => ({ ...prev, q2: val }));
      setCurrentQ(3);
    } else if (currentQ === 3) {
      setAnswers((prev) => ({ ...prev, q3: val }));
      setStep('RESULT');
    }
  };

  const handleReset = () => {
    setStep('HOOK');
    setCurrentQ(1);
    setAnswers({ q1: '', q2: '', q3: '' });
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f5f2eb] flex flex-col selection:bg-[#f04f74]/30 selection:text-white">
      <GlobalHeader />

      <main className="flex-1 w-full">
        {/* ============================================================
            1. 압도적 헤드카피 (공감 & 훅 - 크고 강렬하게, 사족 일절 배제)
            ============================================================ */}
        <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 sm:px-12 py-16 overflow-hidden">
          {/* 미세한 앰비언트 백그라운드 효과 */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(240,79,116,0.12),transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(12,13,18,0.6),#07080a_90%)] pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* 최상단: 크고 강렬한 1선 카피 (모바일 50px) */}
            <h1 className="font-serif-editorial text-[50px] sm:text-6xl md:text-7xl lg:text-8xl font-light text-white tracking-tight leading-[1.15] drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
              인간은 누구나 혼자다
            </h1>

            {/* 중단: 감성적 브릿지 (모바일 30px, 2줄 구성) */}
            <p className="font-serif-editorial text-[30px] sm:text-4xl lg:text-[44px] font-light text-zinc-300 tracking-wide leading-snug space-y-1">
              <span className="block">순수했던 그 시절의</span>
              <span className="block">나를 만나는 순간</span>
            </p>

            {/* 하단 시그니처: 나도솔로! ('인간은 누구나 혼자다'와 100% 동일한 폰트 및 클래스) */}
            <div className="pt-2 sm:pt-4">
              <h2 className="font-serif-editorial text-[50px] sm:text-6xl md:text-7xl lg:text-8xl font-light text-white tracking-tight leading-[1.15] drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
                나도솔로!
              </h2>
            </div>

            {/* 즉시 시작 프로세스 트리거 버튼 */}
            <div className="pt-8 sm:pt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              {step === 'HOOK' ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep('TEST');
                    const testEl = document.getElementById('process-section');
                    testEl?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-[#f04f74] hover:bg-[#d93f63] text-white text-base sm:text-lg font-mono tracking-wider transition-all duration-300 shadow-[0_4px_24px_rgba(240,79,116,0.3)] hover:shadow-[0_6px_32px_rgba(240,79,116,0.5)] cursor-pointer flex items-center gap-2 group"
                >
                  <span>내 솔로지수 확인하기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-white/20 text-zinc-300 hover:text-white text-sm font-mono tracking-wider transition-colors cursor-pointer"
                >
                  처음으로
                </button>
              )}
            </div>
          </div>

          {/* 스크롤 유도 인디케이터 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase">
              PROCESS
            </span>
            <ChevronDown className="w-4 h-4 text-zinc-400 animate-bounce" />
          </div>
        </section>

        {/* ============================================================
            2. 한 화면 프로세스 작동 영역 (TEST & RESULT)
            ============================================================ */}
        <section id="process-section" className="w-full max-w-[960px] mx-auto px-6 sm:px-12 py-16 sm:py-24">
          {/* [단계 1] 인터랙티브 솔로 테스트 */}
          {step === 'TEST' && (
            <div className="bg-[#0c0d12] border border-white/[0.1] p-8 sm:p-12 shadow-2xl relative animate-in fade-in duration-500">
              {/* 진행률 바 */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#f04f74] font-semibold">
                    STEP {currentQ} / 3
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs font-mono text-zinc-400">솔로 상황 진단</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className={`h-1.5 w-6 transition-all duration-300 ${
                        currentQ >= num ? 'bg-[#f04f74]' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* 질문 제목 */}
              <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal mb-8 leading-snug">
                {questions[currentQ - 1].title}
              </h2>

              {/* 보기 목록 (간결하고 직관적) */}
              <div className="space-y-3.5">
                {questions[currentQ - 1].options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(opt.value)}
                    className="w-full text-left p-5 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#f04f74]/60 transition-all duration-200 group flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-sm sm:text-base text-zinc-200 group-hover:text-white font-light tracking-wide">
                      {opt.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#f04f74] group-hover:translate-x-1 transition-all shrink-0 ml-4" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* [단계 2] 솔로지수 결과 및 맞춤 모임 즉시 배정 */}
          {step === 'RESULT' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* 결과 카드 */}
              <div className="bg-[#0c0d12] border border-[#f04f74]/30 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#f04f74]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#f04f74]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#f04f74]">
                    SOLO INDEX DIAGNOSIS
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
                  <div>
                    <h2 className="font-serif-editorial text-3xl sm:text-4xl text-white font-normal">
                      순수 대화 갈증형 솔로
                    </h2>
                    <p className="text-sm text-zinc-400 mt-2 font-light">
                      사회적 역할과 이해관계를 떠나, 온전히 '나'로서 대화할 수 있는 안전한 식탁이 필요한 상태입니다.
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <span className="text-xs font-mono text-zinc-500 block uppercase">솔로지수</span>
                    <span className="font-serif-editorial text-4xl sm:text-5xl text-[#f04f74] font-normal">
                      84%
                    </span>
                  </div>
                </div>

                {/* 3대 진단 피드백 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                  <div className="p-4 bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase block mb-1">대화 상태</span>
                    <p className="text-sm text-zinc-200">조건 없는 교류 필요</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase block mb-1">추천 분위기</span>
                    <p className="text-sm text-zinc-200">조용한 프라이빗 룸</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase block mb-1">소셜 리포트</span>
                    <p className="text-sm text-zinc-200">식사 후 100% 발행</p>
                  </div>
                </div>
              </div>

              {/* 즉시 맞춤 추천 테이블 (1개 엄선) */}
              <div className="bg-[#0c0d12] border border-white/[0.1] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#f04f74]" />
                    <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
                      당신을 위해 준비된 추천 테이블
                    </span>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-mono bg-[#f04f74]/15 border border-[#f04f74]/40 text-[#f04f74]">
                    잔여 1석
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif-editorial text-2xl text-white font-normal">
                    전포 아틀리에 프라이빗 소셜 다이닝
                  </h3>
                  <p className="text-sm text-zinc-400 font-light">
                    조건과 배경을 묻지 않는 낯선 5명과의 따뜻한 코스 요리와 와인 페어링
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 py-2 border-y border-white/[0.06]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#f04f74]" /> 부산 전포동
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#f04f74]" /> 이번 주 금요일
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#f04f74]" /> 저녁 19:30
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div>
                    <span className="text-xs text-zinc-400 block font-light">
                      온라인 예약 및 리포트 발행비
                    </span>
                    <span className="text-lg font-mono text-white font-semibold">
                      ₩30,000
                    </span>
                    <span className="text-[11px] text-zinc-500 ml-2">
                      (현장 식음료비 1/N 직접 결제)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#f04f74] hover:bg-[#d93f63] text-white text-sm font-mono tracking-wider transition-all duration-200 cursor-pointer text-center"
                  >
                    테이블 신청하기
                  </button>
                </div>
              </div>

              {/* 하단 보조 액션 */}
              <div className="text-center pt-4">
                <Link
                  href="/"
                  className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ← 다른 테이블 둘러보기
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 결제 모달 연동 */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={{
          eventId: 'rec-atelier-01',
          title: '전포 아틀리에 프라이빗 소셜 다이닝',
          dateText: '이번 주 금요일 19:30',
          districtName: '부산 전포동',
          priceKrw: 30000,
          mealNote: '현장 식음료비 1/N 직접 결제',
        }}
        onSuccessPayment={(id) => {
          setIsCheckoutOpen(false);
          router.push('/dashboard');
        }}
      />

      <GlobalFooter />
    </div>
  );
}
