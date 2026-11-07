'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import { ArrowRight, CheckCircle2, ShieldCheck, Clock, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

const PROTOCOL_STEPS = [
  {
    step: 'PHASE 01',
    title: '성향 기반 3:3 테이블 큐레이션',
    desc: '참가자의 연령대(5060 골든 트랙), 관심사, 대화 성향 데이터를 다면 분석하여 최상의 대화 밸런스를 갖춘 3:3 프라이빗 테이블을 사전 편성합니다.',
    tag: 'ANALYTICS & CURATION',
  },
  {
    step: 'PHASE 02',
    title: '소음 없는 프라이빗 살롱 다이닝',
    desc: '엄선된 프라이빗 룸에서 셰프의 시그니처 코스 요리와 소믈리에 와인 페어링을 즐기며, 대화 플레이북 카드를 통해 자연스럽고 지적인 교류를 이어갑니다.',
    tag: 'PRIVATE DINING',
  },
  {
    step: 'PHASE 03',
    title: '단일 명사 1:1 상호 관찰 평가',
    desc: '다이닝 종료 후 참가자 전원이 동석자들의 소통 품격을 단일 명사 5대 지표(품격, 미소, 경청, 배려, 시선)로 인지적 왜곡 없이 직관적으로 관찰합니다.',
    tag: 'MUTUAL OBSERVATION',
  },
  {
    step: 'PHASE 04',
    title: '상호주의 해금 소셜 리포트 발행',
    desc: '본인이 동석자 전원 평가를 100% 완료하는 즉시, 타인의 시선으로 집계된 100점 만점 표준화 메타인지 소셜 리포트가 안전하게 언락(Unlock)됩니다.',
    tag: 'RECIPROCAL UNLOCK',
  },
];

const TIMELINE = [
  {
    time: '19:30',
    title: '리셉션 및 웰컴 드링크',
    desc: '프라이빗 룸 개별 입장 후 웰컴 샴페인 또는 탄산수와 함께 테이블 시팅을 안내받습니다.',
  },
  {
    time: '19:45',
    title: '셰프 시그니처 코스 & 와인 페어링',
    desc: '엄선된 제철 식자재 요리가 서빙되며, 자연스러운 아이스브레이킹 대화가 시작됩니다.',
  },
  {
    time: '20:30',
    title: '지적 교류와 대화 플레이북',
    desc: '테이블에 비치된 나도솔로 감성 플레이북 카드를 통해 삶의 궤적과 깊이 있는 가치관을 공유합니다.',
  },
  {
    time: '21:30',
    title: '테이블 1/N 실비 정산 & 상호 관찰',
    desc: '식음료 대금은 테이블에서 직접 1/N 카드 결제하며, 귀가 길에 모바일로 동석자 상호 관찰을 진행합니다.',
  },
];

const FAQS = [
  {
    q: '온라인 참가비 ₩30,000과 현장 식사비는 어떻게 다른가요?',
    a: '온라인 결제 ₩30,000은 식사비나 만남 주선비가 아니며, 나도솔로 다면 관찰 엔진 라이선스 및 상호주의 소셜 리포트 발행비입니다. 현장 음식과 주류 비용은 당일 식당에서 참가자들 간 1/N 실비로 직접 카드 결제하며, 나도솔로는 식음료 대금을 일절 수취하거나 관여하지 않습니다.',
  },
  {
    q: '소셜 리포트는 언제 열람할 수 있나요?',
    a: '나도솔로 헌법인 [상호주의 해금 원칙]에 따라, 이용자 본인이 동석자 전원에 대한 1단어 관찰 평가를 100% 완료하는 즉시 내 소셜 리포트가 잠금 해제되어 대시보드에서 열람하실 수 있습니다.',
  },
  {
    q: '누가 나에게 어떤 평가를 주었는지 상대방이 알 수 있나요?',
    a: '절대 알 수 없습니다. 나도솔로는 [절대 익명성 원칙]을 준수하여 1:1 개별 점수를 비공개 처리하며, 동석자 전체의 관찰 결과가 집계된 표준화 가중 지표로만 제공됩니다. 주관적 비하 텍스트 입력 역시 기술적으로 원천 차단되어 있습니다.',
  },
  {
    q: '혼자 참석해도 어색하지 않은가요?',
    a: '참석자의 95% 이상이 동반자 없이 단독으로 참석하십니다. 소음과 외부 시선이 차단된 단독 룸에서 전문 대화 플레이북 카드가 비치되어 있어 어색함 없이 자연스럽고 깊이 있는 대화가 이어집니다.',
  },
];

export default function GuidePage() {
  const router = useRouter();
  const { currentUser, conditionalEvents, applyForConditionalEvent } = useNadoSoloEngine();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const handleApplyClick = () => {
    if (!currentUser) {
      router.push('/auth?next=/guide');
      return;
    }
    const targetEv = conditionalEvents[0];
    if (targetEv) {
      setCheckoutEvent({
        eventId: targetEv.eventId,
        title: targetEv.title,
        dateText: targetEv.dateText,
        priceKrw: 30000,
        districtName: '부산',
        mealNote: targetEv.mealNote,
      });
      setIsCheckoutOpen(true);
    }
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
              <span className="block whitespace-nowrap">소셜 다이닝에서 완성되는</span>
              <span className="block whitespace-nowrap font-light italic text-[#f5f2eb]/90 mt-1">
                다면 관찰 및 메타인지 피드백 시스템
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed max-w-2xl tracking-wide pt-2">
              신원과 에티켓이 검증된 분들이 프라이빗 룸에서 식사와 지적 대화를 나누고,<br className="hidden sm:inline" />
              동석자 상호 관찰을 통해 나의 소통 품격을 표준화 리포트로 발견하는 4단계 프로세스입니다.
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
                  온라인 사전 결제: ₩30,000
                </div>
                <h3 className="font-serif-editorial text-xl text-white">
                  다면 관찰 엔진 라이선스 및 소셜 리포트 발행비
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                  나도솔로는 식음료 판매업자가 아닙니다. ₩30,000은 3:3 성향 밸런스 큐레이션, 단일 명사 관찰 알고리즘 구동, 그리고 참가자 전원의 상호 관찰 데이터가 집계된 표준화 메타인지 소셜 리포트를 생성·발행하는 기술 라이선스 비용입니다.
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
