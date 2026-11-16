'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import { ArrowRight, CheckCircle2, ShieldCheck, Clock, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

const PROTOCOL_STEPS = [
  {
    step: 'STEP 01',
    title: '성향 퀴즈 & 도시·슬롯 예약',
    desc: '성향·식단·예산 퀴즈를 완료하고, 방 제목이나 식당을 고르지 않고 [도시 × 날짜/요일] 블라인드 슬롯만 예약합니다.',
    tag: 'QUIZ & BLIND SLOT',
  },
  {
    step: 'STEP 02',
    title: 'D-1 19:00 식당 공개 (Reveal)',
    desc: '예약 시점부터 모임 전까지 1:1 DM과 프로필이 100% 차단되며, D-1 19:00에 배정된 제휴 식당·위치·동석자 힌트가 공개됩니다.',
    tag: 'D-1 REVEAL',
  },
  {
    step: 'STEP 03',
    title: '현장 6인 다이닝 & 대화 카드',
    desc: '검증된 공공 제휴 식당에서 디지털 대화 카드로 어색함 없이 교류합니다. 식음료는 현장에서 1/N 실비로 직접 결제합니다.',
    tag: 'ICEBREAKER & 1/N',
  },
  {
    step: 'STEP 04',
    title: '상호 평가 · 차단 & 리포트 해금',
    desc: '모임 후 노쇼·불편 상대 영구 차단 및 동석자 전원 관찰을 완료하면, 내 소셜 메타인지 리포트가 자동 잠금 해제됩니다.',
    tag: 'RECIPROCAL UNLOCK',
  },
];

const TIMELINE = [
  {
    time: 'D-1 19:00',
    title: '배정 식당 및 동석자 힌트 공개 (Reveal)',
    desc: '대시보드와 알림함으로 배정된 제휴 식당 이름·위치·테이블 직군/연령대 힌트가 비공개 공개됩니다.',
  },
  {
    time: '당일 19:30',
    title: '제휴 식당 개별 도착 및 착석',
    desc: '나도솔로 예약 테이블로 안내받아 6인이 모이며, 사전 1:1 연락 없이 현장에서 처음 인사합니다.',
  },
  {
    time: '당일 20:00',
    title: '디지털 대화 카드 & 식사 교류',
    desc: '대시보드 현장 대화 카드(아이스브레이커)를 활용해 가벼운 화제부터 깊은 가치관까지 대화를 나눕니다.',
  },
  {
    time: '종료 후',
    title: '1/N 현장 정산 · 사후 평가 · 리포트 해금',
    desc: '식음료는 매장에서 1/N 결제하고, 모임 후 관찰 평가 및 노쇼/차단 신고 완료 시 소셜 리포트가 열립니다.',
  },
];

const FAQS = [
  {
    q: '온라인 참가비와 현장 식사비는 어떻게 다른가요?',
    a: '온라인 참가비는 식사비나 만남 주선비가 아니며, 매칭·제휴 식당 예약 및 다면 관찰 소셜 리포트 발행비입니다. 음식과 주류 비용은 당일 식당에서 참가자들 간 1/N 실비로 직접 결제합니다.',
  },
  {
    q: '왜 예약할 때 식당이나 동석자를 미리 볼 수 없나요?',
    a: '타임레프트 표준 블라인드 원칙에 따라 사전 선입견과 1:1 연락(DM)을 원천 차단하고, 동일 지역·일정 풀에 모수를 100% 집중해 성사율과 안전을 높이기 위함입니다. 식당과 힌트는 D-1 19:00에 공개됩니다.',
  },
  {
    q: '취소 · 일정 변경(이월) · 인원 미달 시 어떻게 되나요?',
    a: '모임 시작 48시간 전까지는 대시보드에서 무료 취소 또는 다음 회차 이월(참가권 1매 보존)이 가능합니다. 24시간 이내 취소 및 노쇼 시에는 참가권이 보존되지 않으며, 인원 미달 시 다음 회차로 자동 이월됩니다.',
  },
  {
    q: '소셜 리포트와 영구 재매칭 차단은 어떻게 작동하나요?',
    a: '동석자 전원에 대한 단일 명사 관찰 평가를 완료하면 익명 집계된 내 소셜 리포트가 즉시 열립니다. 또한 모임 후 노쇼나 불편한 상대를 차단 신고하면 향후 모든 회차에서 영구적으로 재매칭에서 제외됩니다.',
  },
];

export default function GuidePage() {
  const router = useRouter();
  const { currentUser, conditionalEvents, applyForConditionalEvent } = useNadoSoloEngine();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const handleApplyClick = () => {
    router.push('/test');
  };

  const handlePaymentSuccess = (eventId: string) => {
    applyForConditionalEvent(eventId);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f5f2eb] flex flex-col font-sans selection:bg-[#f04f74] selection:text-white">
      
      {/* ==============================================================
          1. 가이드 히어로 (메인 톤 완벽 이식: 세리프 헤드라인 & 모노 뱃지)
          ============================================================== */}
      <section className="relative w-full border-b border-white/[0.08] overflow-hidden pt-12 sm:pt-16 pb-20 sm:pb-28">
        
        {/* 은은한 앰비언트 글로우 */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#f04f74]/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74] animate-ping" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] text-zinc-300 uppercase">
              An Intimate Protocol • Program Guide
            </span>
          </div>

          <div className="max-w-4xl space-y-4">
            <h1 className="font-serif-editorial text-4xl sm:text-6xl lg:text-[70px] font-normal text-white tracking-tight leading-[1.12]">
              <span className="block whitespace-nowrap">퀴즈부터 D-1 공개까지</span>
              <span className="block whitespace-nowrap font-light italic text-[#f5f2eb]/90 mt-1">
                타임레프트 표준 이용 안내
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed max-w-2xl tracking-wide pt-2">
              성향 퀴즈로 시작해 도시와 요일 슬롯만 예약하면, D-1 19:00에 제휴 식당이 비공개 공개되고<br className="hidden sm:inline" />
              현장 대화 카드와 상호 관찰을 거쳐 나만의 소셜 메타인지 리포트까지 이어지는 4단계 여정입니다.
            </p>
          </div>

          {/* 4대 프로세스 인덱스 카드 (메인 인덱스 그리드 톤) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-6">
            {PROTOCOL_STEPS.map((ps, idx) => (
              <div
                key={idx}
                className="p-6 border border-white/[0.08] hover:border-white/[0.2] bg-white/[0.015] hover:bg-white/[0.03] transition-all space-y-3"
              >
                <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-[#f04f74]">
                  <span>{ps.step}</span>
                  <span className="text-zinc-500 font-light">{ps.tag}</span>
                </div>
                <h3 className="font-serif-editorial text-lg text-white font-normal">
                  {ps.title}
                </h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  {ps.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==============================================================
          2. 120분 프라이빗 다이닝 타임라인 (Timeline Protocol)
          ============================================================== */}
      <section className="w-full py-20 sm:py-28 border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/[0.1] pb-6 mb-12 sm:mb-16 gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-[#f04f74] uppercase block font-semibold mb-1">
                TIME PROTOCOL
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-4xl text-white font-normal">
                120분 프라이빗 살롱 타임라인
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-sm">
              정돈된 템포와 편안한 조도 속에서 대화에 온전히 몰입할 수 있도록 조율됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            {TIMELINE.map((t, i) => (
              <div
                key={i}
                className="p-6 border border-white/[0.08] bg-white/[0.015] space-y-3 relative group hover:border-white/20 transition-all"
              >
                <div className="text-2xl font-serif-editorial font-bold text-[#f04f74]">
                  {t.time}
                </div>
                <h4 className="font-serif-editorial text-base text-white font-normal">
                  {t.title}
                </h4>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==============================================================
          3. 비용 및 정산 원칙 (Core Identity & Fee Transparency)
          ============================================================== */}
      <section className="w-full py-20 sm:py-28 border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          
          <div className="border border-white/[0.1] bg-white/[0.02] p-8 sm:p-12 space-y-8">
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-[0.3em] text-[#f04f74] uppercase block font-semibold">
                FEE TRANSPARENCY & BM IDENTITY
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-4xl text-white font-normal">
                비용 구조 및 투명한 1/N 정산 원칙
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] pt-4">
              
              <div className="space-y-4 md:pr-8">
                <div className="inline-block px-3 py-1 bg-transparent border border-[#f04f74]/60 text-[#f04f74] text-xs font-mono font-semibold">
                  온라인 사전 결제: 참가비 (리포트 라이선스)
                </div>
                <h3 className="font-serif-editorial text-xl text-white">
                  다면 관찰 엔진 라이선스 및 소셜 리포트 발행비
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                  나도솔로는 식음료 판매업자가 아닙니다. 참가비는 3:3 성향 밸런스 큐레이션, 단일 명사 관찰 알고리즘 구동, 그리고 참가자 전원의 상호 관찰 데이터가 집계된 표준화 메타인지 소셜 리포트를 생성·발행하는 기술 라이선스 비용입니다.
                </p>
              </div>

              <div className="space-y-4 md:pl-8 pt-6 md:pt-0">
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-zinc-300 text-xs font-mono font-semibold">
                  현장 결제: 식음료 실비 1/N
                </div>
                <h3 className="font-serif-editorial text-xl text-white">
                  식당 현장 직접 카드 정산
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                  당일 엄선된 레스토랑에서 발생한 식사 및 주류 대금은 모임 종료 시 참가자들이 테이블에서 직접 각자의 카드로 1/N 실비 결제합니다. 나도솔로는 식음료 대금을 단 1원도 중개하거나 수취하지 않습니다.
                </p>
              </div>

            </div>

            <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-400 font-light flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#f04f74]" />
                <span>상호주의 해금 원칙: 평가 100% 완료 시 내 리포트가 즉시 열람 해제됩니다.</span>
              </div>
              <button
                type="button"
                onClick={handleApplyClick}
                className="px-8 py-3.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer"
              >
                신청하기
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ==============================================================
          4. 단일 명사 5대 관찰 지표 (5 Anchor Metrics)
          ============================================================== */}
      <section className="w-full py-20 sm:py-28 border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/[0.1] pb-6 mb-12 gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-[#f04f74] uppercase block font-semibold mb-1">
                EVALUATION CONSTITUTION
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-4xl text-white font-normal">
                단일 명사 1요소 관찰 원칙
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-sm">
              복합적 수식어나 주관적 비하를 배제하고 직관적인 5대 단일 명사로만 나의 소통을 관찰받습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {[
              { anchor: '품격', question: '대화의 태도와 매너에 기품이 느껴지는가?' },
              { anchor: '미소', question: '온화하고 편안한 미소로 분위기를 밝히는가?' },
              { anchor: '경청', question: '상대방의 말을 끊지 않고 끝까지 듣는가?' },
              { anchor: '배려', question: '테이블 전원의 소외됨 없는 대화를 돕는가?' },
              { anchor: '시선', question: '대화 시 따뜻하고 안정된 시선을 유지하는가?' },
            ].map((metric, i) => (
              <div
                key={i}
                className="p-5 border border-white/[0.08] bg-white/[0.015] space-y-2 hover:border-[#f04f74]/40 transition-colors"
              >
                <div className="text-xl font-serif-editorial font-bold text-white">
                  {metric.anchor}
                </div>
                <div className="text-[10px] font-mono text-[#f04f74]">
                  SINGLE NOUN 0{i + 1}
                </div>
                <p className="text-xs text-zinc-400 font-light leading-relaxed pt-1">
                  {metric.question}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==============================================================
          5. 자주 묻는 질문 (FAQ Accordion)
          ============================================================== */}
      <section className="w-full py-20 sm:py-28">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          
          <div className="border-b border-white/[0.1] pb-6 mb-12">
            <span className="text-[10px] font-mono tracking-[0.3em] text-[#f04f74] uppercase block font-semibold mb-1">
              QUESTIONS &amp; ANSWERS
            </span>
            <h2 className="font-serif-editorial text-2xl sm:text-4xl text-white font-normal">
              자주 묻는 질문
            </h2>
          </div>

          <div className="space-y-4 max-w-4xl">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="border border-white/[0.08] bg-white/[0.015] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-serif-editorial text-base sm:text-lg text-white font-normal">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#f04f74] shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-zinc-300 font-light leading-relaxed border-t border-white/[0.05]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 결제 모달 */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={checkoutEvent}
        onSuccessPayment={handlePaymentSuccess}
      />
    </div>
  );
}
