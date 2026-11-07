'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import { useVisualEditor } from '@/engine/siteConfigEngine';
import { ArrowRight, MapPin, Calendar, Wine, ShieldCheck, ChevronRight } from 'lucide-react';

const DINING_CHAPTERS = [
  {
    chapter: 'CHAPTER 01',
    district: 'BUSAN JEONPO',
    title: '금요 프라이빗 내추럴 와인 & 셰프 디너',
    schedule: '매주 금요일 19:30',
    venue: '비스트로 아틀리에 (전포 살롱 단독 대관)',
    status: '여성 1석 잔여',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
    desc: '소음과 외부 시선이 차단된 프라이빗 룸에서 제철 재료로 빚어낸 셰프의 시그니처 디너와 엄선된 와인을 즐깁니다.',
    specs: ['3:3 엄선 큐레이션', '단독 프라이빗 룸', '소셜 리포트 발행'],
  },
  {
    chapter: 'CHAPTER 02',
    district: 'HAEUNDAE MARINE CITY',
    title: '토요 해운대 오션 테라스 코스 페어링',
    schedule: '매주 토요일 19:30',
    venue: '오션 스위트 다이닝 (해운대 마린시티)',
    status: '여성 2석 잔여',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=85',
    desc: '해운대 밤바다의 야경이 내려다보이는 독립된 스위트 룸에서 7코스 파인다이닝과 지적인 대화를 나눕니다.',
    specs: ['5060 골든 트랙', '소믈리에 페어링', '상호주의 매너 서약'],
  },
  {
    chapter: 'CHAPTER 03',
    district: 'BUSAN SEOMYEON',
    title: '주말 갈라 프라이빗 아카이브 다이닝',
    schedule: '격주 일요일 18:30',
    venue: '까사 아카이브 살롱 (서면 프라이빗 룸)',
    status: '인비테이션 접수중',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=85',
    desc: '조도와 음향까지 섬세하게 튜닝된 공간에서 준비된 플레이북 카드와 함께 서로의 취향과 삶의 궤적을 발견합니다.',
    specs: ['대화 플레이북 키트', '100% 에티켓 검증', '테이블 1/N 실비 정산'],
  },
];

const CURATED_VENUES = [
  {
    name: '비스트로 아틀리에',
    location: '부산 부산진구 전포살롱가',
    type: 'NATURAL WINE & MODERN BISTRO',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=85',
    feature: '테이블 간격 3m 이상 확보 • 앰비언트 사운드 튜닝',
  },
  {
    name: '오션 스위트 라운지',
    location: '부산 해운대구 마린시티',
    type: 'CONTEMPORARY OCEAN DINING',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=85',
    feature: '오션 파노라마 뷰 • 단독 룸 전담 셰프 서비스',
  },
  {
    name: '까사 아카이브 살롱',
    location: '부산 부산진구 서면 살롱존',
    type: 'PRIVATE ARCHIVE SALON',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=85',
    feature: '독립 조도 제어 • 프라이빗 소셜 전용 대관',
  },
];

export default function DiningPage() {
  const router = useRouter();
  const { isEditMode } = useVisualEditor();
  const { currentUser, conditionalEvents, applyForConditionalEvent } = useNadoSoloEngine();
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleApplyClick = (eventId?: string) => {
    if (isEditMode) return;
    if (!currentUser) {
      router.push(`/auth?next=/dining`);
      return;
    }
    const targetEv = conditionalEvents.find((e) => e.eventId === eventId) || conditionalEvents[0];
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
          1. 럭셔리 소셜 다이닝 히어로 (메인 페이지 톤 완벽 이식)
          ============================================================== */}
      <section className="relative w-full border-b border-white/[0.08] overflow-hidden pt-12 sm:pt-16 pb-20 sm:pb-28">
        
        {/* 은은한 앰비언트 그라디언트 배경 */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#f04f74]/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-white/[0.02] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          
          {/* 상단 메타 바 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74] animate-ping" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] text-zinc-300 uppercase">
              Curated Social Dining • Busan Salon
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            
            <div className="lg:col-span-8 space-y-5">
              <h1 className="font-serif-editorial text-4xl sm:text-6xl lg:text-[70px] font-normal text-white tracking-tight leading-[1.12]">
                <span className="block whitespace-nowrap">테이블을 마주하는 순간,</span>
                <span className="block whitespace-nowrap font-light italic text-[#f5f2eb]/90 mt-1">
                  우리는 서로의 거울이 됩니다
                </span>
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed max-w-2xl tracking-wide pt-2">
                신원과 에티켓이 검증된 6인의 참가자가 엄선된 프라이빗 룸에 모여 코스 디너와 와인을 함께합니다.<br className="hidden sm:inline" />
                식사와 주류 비용은 당일 현장에서 1/N 실비로 정산하며, 온라인 참가비 ₩30,000은 다면 관찰 엔진 라이선스 및 맞춤형 소셜 리포트 발행비입니다.
              </p>
            </div>

            {/* 우측 3대 스펙 인덱스 */}
            <div className="lg:col-span-4 p-6 sm:p-7 border border-white/[0.1] bg-white/[0.02] backdrop-blur-sm space-y-4">
              <div className="text-[10px] font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold">
                SALON SPECIFICATIONS
              </div>

              <div className="space-y-3 divide-y divide-white/[0.06] text-xs">
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-zinc-400 font-light">테이블 편성</span>
                  <span className="text-zinc-100 font-mono">3:3 성향 맞춤 밸런스</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-zinc-400 font-light">운영 거점</span>
                  <span className="text-zinc-100 font-mono">부산 (전포 • 마린시티)</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-zinc-400 font-light">리포트 라이선스</span>
                  <span className="text-zinc-100 font-mono text-[#f04f74] font-semibold">₩30,000 (온라인 결제)</span>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-zinc-400 font-light">식음료 결제</span>
                  <span className="text-zinc-100 font-mono">현장 테이블 1/N 실비</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/guide"
                  className="w-full py-3 border border-white/20 hover:border-white/40 bg-black/40 text-xs font-mono tracking-[0.2em] text-zinc-300 hover:text-white uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <span>프로세스 가이드 확인</span>
                  <ArrowRight className="w-3 h-3 text-[#f04f74]" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==============================================================
          2. 현재 오픈된 다이닝 챕터 리스트 (Live Chapters)
          ============================================================== */}
      <section className="w-full py-20 sm:py-28 border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/[0.1] pb-6 mb-12 sm:mb-16 gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-[#f04f74] uppercase block font-semibold mb-1">
                OPEN CHAPTERS
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-4xl text-white font-normal">
                참가 신청 가능한 프라이빗 다이닝
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-sm">
              상호주의 에티켓 서약이 완료된 회원 대상 선착순 마감됩니다.
            </p>
          </div>

          <div className="space-y-12">
            {DINING_CHAPTERS.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 border border-white/[0.08] hover:border-white/[0.2] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-500 group"
              >
                {/* 좌측: 실사 컷 프레임 */}
                <div className="lg:col-span-5 relative aspect-[16/10] overflow-hidden bg-zinc-950 border border-white/[0.08]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover filter brightness-[0.8] contrast-[1.1] group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/75 border border-white/15 text-[10px] font-mono tracking-widest text-[#f04f74] uppercase backdrop-blur-md">
                    {item.status}
                  </div>
                </div>

                {/* 우측: 챕터 상세 및 예약 CTA */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs font-mono tracking-wider text-zinc-400">
                      <span className="text-[#f04f74] font-semibold">{item.chapter}</span>
                      <span>•</span>
                      <span>{item.district}</span>
                      <span>•</span>
                      <span className="text-zinc-200">{item.schedule}</span>
                    </div>

                    <h3 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white group-hover:text-[#f5f2eb] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                      {item.desc}
                    </p>

                    <p className="text-xs text-zinc-400 font-mono pt-1">
                      장소: <span className="text-zinc-200">{item.venue}</span>
                    </p>
                  </div>

                  {/* 3대 특징 태그 */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
                    {item.specs.map((sp, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 border border-white/10 bg-black/40 text-[11px] font-mono text-zinc-300 tracking-wider"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-mono text-zinc-400">REPORT LICENSE</div>
                      <div className="text-lg font-serif-editorial font-bold text-white">
                        ₩30,000 <span className="text-xs font-normal text-zinc-400">/ 식사비 현장 1/N</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyClick()}
                      className="px-8 py-3.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer flex items-center gap-3"
                    >
                      <span>신청하기</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==============================================================
          3. 제휴 파트너 공간 아카이브 (Curated Venues)
          ============================================================== */}
      <section className="w-full py-20 sm:py-28">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/[0.1] pb-6 mb-12 gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-[#f04f74] uppercase block font-semibold mb-1">
                CURATED ARCHITECTURE
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-4xl text-white font-normal">
                엄선된 부산 제휴 다이닝 공간
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 font-light">
              시선과 소음이 완전히 통제된 단독 프라이빗 룸만 엄선합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {CURATED_VENUES.map((v, i) => (
              <div
                key={i}
                className="border border-white/[0.08] hover:border-white/[0.2] bg-white/[0.015] overflow-hidden transition-all duration-500 group"
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-zinc-950">
                  <img
                    src={v.image}
                    alt={v.name}
                    className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.1] group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[9px] font-mono tracking-widest text-[#f04f74] uppercase block mb-1">
                      {v.type}
                    </span>
                    <h3 className="font-serif-editorial text-lg text-white font-normal">
                      {v.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-2 border-t border-white/[0.06] text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-[#f04f74]" />
                    <span>{v.location}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-light leading-relaxed">
                    {v.feature}
                  </p>
                </div>
              </div>
            ))}
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
