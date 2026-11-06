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
    stage: '01. 은은한 앰비언스',
    title: '조도와 음향까지 배려한 프라이빗 룸',
    desc: '테이블 간격 2.5m 이상 확보된 프라이빗 룸에서 오직 마주 앉은 사람의 눈빛과 목소리에 집중합니다.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
  },
  {
    stage: '02. 셰프 디너 & 페어링',
    title: '정갈한 계절 코스 요리 & 와인 페어링',
    desc: '엄선된 제휴 레스토랑의 디너 코스와 소믈리에 와인으로, 식사의 모든 순간이 대접받는 품격으로 채워집니다.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',
  },
  {
    stage: '03. 설렘과 대화',
    title: '삶의 결이 닿는 자연스러운 소통',
    desc: '세련된 대화 카드로 어색한 침묵을 기분 좋게 열고, 서로의 가치관과 일상의 온도를 깊이 있게 나눕니다.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=85',
  },
  {
    stage: '04. 품격 리포트 & 연결',
    title: '다면 소셜 리포트와 안전한 연락망',
    desc: '동석자들의 다정한 다면 관찰로 나의 소셜 매너를 리포트로 확인하고, 상호 호감 시 안전하게 매칭됩니다.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=85',
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
        badge="프라이빗 소셜 다이닝 • DINING"
        headlineTitle="나를 다시 발견하는 시간,"
        headlineHighlight="품격 있는 소셜 다이닝"
        description="은은한 조도와 정갈한 셰프 디너, 와인 페어링. 서로의 눈빛과 매너를 다정하게 발견하는 5060 안심 사교 다이닝입니다."
        specs={[
          { label: '운영 형태', value: '프라이빗 큐레이션', subText: '5060 안심 에티켓 서약' },
          { label: '모임 일정', value: '매주 금·토 저녁', subText: '엄선된 프라이빗 비스트로' },
          { label: '참가 기준', value: '₩30,000', subText: '소셜 다면 리포트 발행 포함' },
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
                      {ev.title.replace(/3045|3040/g, '5060').replace(/6인/g, '').trim()}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#f04f74]" />
                      <span>부산</span>
                      <span className="text-zinc-600">•</span>
                      <span>{ev.dateText}</span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>참가 대상</span>
                      <span className="text-zinc-200 font-medium">
                        5060 골든 신중년
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
                      className="w-full h-11 py-2 text-sm font-semibold"
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
