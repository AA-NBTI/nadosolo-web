'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import CategoryProductHero, { GallerySlideItem } from '@/components/CategoryProductHero';
import AdaptiveButton from '@/components/ui/AdaptiveButton';
import { useVisualEditor } from '@/engine/siteConfigEngine';
import { Utensils, Wine, MapPin, HeartHandshake, Ticket, MessageSquare } from 'lucide-react';

const DINING_GALLERY_SLIDES: [GallerySlideItem, GallerySlideItem, GallerySlideItem, GallerySlideItem] = [
  {
    stage: '01. 장소 분위기',
    title: '은은한 조도의 감성 와인 비스트로',
    desc: '테이블 간격 2.5m 이상 확보된 프라이빗 단독 룸에서 조용하고 편안하게 서로에게 집중합니다.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
  },
  {
    stage: '02. 코스 미식',
    title: '셰프 스페셜 코스 요리 & 와인 페어링',
    desc: '엄선된 제휴 레스토랑의 정갈한 디너 코스와 소믈리에 웰컴 와인으로 대화의 온도를 높입니다.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',
  },
  {
    stage: '03. 만남과 대화',
    title: '남녀 3:3 자연스러운 대화와 건배',
    desc: '아이스브레이킹 카드로 어색한 침묵을 깨고, 서로의 가치관과 일상의 이야기를 기분 좋게 나눕니다.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=85',
  },
  {
    stage: '04. 매너 & 연결',
    title: '익일 비공개 매너 피드백',
    desc: '모임 종료 후 참가자 상호 동의 시에 한해 대시보드를 통해 안전하게 연락처가 교환됩니다.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85',
  },
];

const DINING_PLACES = [
  {
    name: '부산 비스트로 아틀리에 (제휴 공간)',
    location: '부산 부산진구',
    mood: '은은한 조도 & 내추럴 와인 페어링',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: '부산 오션 라운지 (제휴 공간)',
    location: '부산 해운대구',
    mood: '프라이빗 룸 & 코스 요리',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: '부산 까사 다이닝 (제휴 공간)',
    location: '부산 부산진구',
    mood: '조용한 분위기 & 프라이빗 테이블',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=600&q=80',
  },
];

export default function DiningPage() {
  const router = useRouter();
  const { isEditMode } = useVisualEditor();
  const { currentUser, conditionalEvents, applyForConditionalEvent, appliedEventIds, regionDistricts } = useNadoSoloEngine();
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

  const diningEvents = conditionalEvents.filter(
    (ev) => ev.districtId === 'DIST_JEONPO' || ev.districtId === 'DIST_HAEUNDAE' || ev.districtId === 'DIST_GWANGAN'
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-20">
      
      {/* ==============================================================
          1. 소셜 다이닝 상품 히어로 (좌측: 대형 사진 슬라이더 / 우측: 헤더라인 & 신청)
          ============================================================== */}
      <CategoryProductHero
        badge="소셜 다이닝 • DINING"
        headlineTitle="좋은 사람들과 나누는"
        headlineHighlight="부산 소셜 다이닝"
        description="에티켓 서약 기반의 프라이빗 다이닝 테이블. 와인과 디너, 진솔한 대화가 있는 시간."
        specs={[
          { label: '운영 형태', value: '프라이빗 큐레이션', subText: '에티켓 서약 회원' },
          { label: '모임 일정', value: '매주 금·토 저녁', subText: '부산 엄선 비스트로' },
          { label: '참가 기준', value: '₩30,000', subText: '예약대행·대화카드 포함' },
        ]}
        slides={DINING_GALLERY_SLIDES}
        onApply={() => handleApplyClick()}
        trustNote="에티켓 서약 및 신원 확인이 완료된 검증된 회원만 참석 가능합니다."
        activeLocationLabel="부산"
      />

      {/* ==============================================================
          2. 현재 오픈된 테이블 목록 (신청 카드)
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 space-y-8 w-full border-b border-white/10">
        
        {/* 프로그램 이용 가이드 안내 배너 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#f04f74] uppercase tracking-wider">GUIDE &amp; PROCESS</span>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium">
              신청 후 어떻게 진행되는지 궁금하신가요? 120분 타임라인과 식대 정산 규칙을 확인하세요.
            </p>
          </div>
          <Link
            href="/guide"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all shrink-0"
          >
            이용가이드 보기 →
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
              Live Tables
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              참가 신청 가능한 테이블
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm">
            에티켓 서약이 완료된 회원 대상 선착순 마감됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diningEvents.map((ev) => {
            const isApplied = appliedEventIds.includes(ev.eventId);
            return (
              <div
                key={ev.eventId}
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-white/20 transition-all shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-zinc-300 border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      신청 가능
                    </span>
                    <span className="text-xs text-rose-400 font-bold">₩30,000</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight mb-1">
                      {ev.title.replace(/3045/g, '3040').replace(/6인/g, '').trim()}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>부산</span>
                      <span className="text-zinc-600">•</span>
                      <span>{ev.dateText}</span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>참가 대상</span>
                      <span className="text-zinc-200 font-medium">
                        {ev.targetAgeGroup?.includes('5060') ? '5060 골든' : '3040 직장인'}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>진행 구성</span>
                      <span className="text-zinc-200 font-medium">테이블 대화카드 킷 제공</span>
                    </div>
                  </div>
                </div>

                <div>
                  {isApplied ? (
                    <Link
                      href="/dashboard"
                      className="w-full py-3 rounded-xl bg-white/10 text-white border border-white/15 text-sm font-semibold flex items-center justify-center transition-colors"
                    >
                      모임현황 확인
                    </Link>
                  ) : (
                    <AdaptiveButton
                      onClick={() => handleApplyClick(ev.eventId)}
                      className="w-full py-3.5"
                    >
                      신청하기
                    </AdaptiveButton>
                  )}
                  <p className="text-[11px] text-zinc-500 text-center mt-2">
                    {ev.mealNote}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==============================================================
          4. 제휴 공간 갤러리 섹션
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
              PLACES
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              제휴 파트너 공간
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            대화에 몰입할 수 있는 엄선된 부산 제휴 다이닝 공간입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {DINING_PLACES.map((v, i) => (
            <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden group">
              <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                <img
                  src={v.image}
                  alt={v.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-base font-bold text-white">{v.name}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{v.location}</span>
                  </p>
                </div>
              </div>
              <div className="p-3.5 text-xs text-zinc-400 bg-black/20">
                <span className="text-zinc-300 font-medium">특징:</span> {v.mood}
              </div>
            </div>
          ))}
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
