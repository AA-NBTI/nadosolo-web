'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import CategoryProductHero, { GallerySlideItem } from '@/components/CategoryProductHero';
import AdaptiveButton from '@/components/ui/AdaptiveButton';
import { useVisualEditor } from '@/engine/siteConfigEngine';
import { MapPin, HeartHandshake, ShieldCheck, CheckCircle2, Ticket, GlassWater } from 'lucide-react';

const MEETUP_GALLERY_SLIDES: [GallerySlideItem, GallerySlideItem, GallerySlideItem, GallerySlideItem] = [
  {
    stage: '01. 파티 라운지',
    title: '도심 야경의 프라이빗 루프탑 라운지',
    desc: '엄선된 공간 전체를 대관하여 프라이빗하고 감각적인 분위기 속에서 모임을 엽니다.',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=85',
  },
  {
    stage: '02. 샴페인 & 푸드',
    title: '웰컴 스파클링 & 파티 핑거푸드',
    desc: '가볍게 즐길 수 있는 웰컴 드링크와 셰프의 케이터링으로 파티의 즐거움을 더합니다.',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=85',
  },
  {
    stage: '03. 세대별 만남',
    title: '3045 & 5060 안심 소셜 네트워킹',
    desc: '정확한 1:1 성비 균형과 에티켓 검증을 거친 싱글들이 모여 편안하게 인사를 나눕니다.',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85',
  },
  {
    stage: '04. 매칭 & 여운',
    title: '익일 09시 비공개 호감 투표',
    desc: '서로에게 호감을 표한 남녀에게만 비공개로 연락처가 전달되어 부담 없이 인연을 이어갑니다.',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=85',
  },
];

const SPECIAL_EVENTS = [
  {
    id: 'EVT_PRIME_NIGHT_01',
    generation: '3045 PRIME',
    title: '3045 프라임 커리어 & 와인 나이트',
    date: '매월 둘째 주 금요일 저녁',
    location: '서면·전포 프라이빗 라운지',
    capacity: '정원 12명 (남6 : 여6)',
    target: '30~45세 일반 직장인 및 전문직',
    desc: '자신의 일과 삶을 사랑하는 3045 싱글들을 위한 교류 파티. 편안한 웰컴 와인과 핑거푸드를 곁들이며 새로운 인맥과 설레는 인연을 만납니다.',
    priceKrw: 35000,
    districtName: '부산 · 전포/서면',
    mealNote: '웰컴 드링크 1잔 포함, 추가 주류 및 안주는 현장 1/N 정산',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'EVT_GOLDEN_SALON_02',
    generation: '5060 GOLDEN',
    title: '5060 골든 솔로 라이프스타일 살롱',
    date: '매월 셋째 주 토요일 저녁',
    location: '해운대 마린시티 비스트로',
    capacity: '정원 10명 (남5 : 여5)',
    target: '50~60대 비혼·돌싱 솔로',
    desc: '인생 후반전의 지혜와 취향을 함께 나눌 수 있는 든든한 동반자를 위한 안심 모임. 클래식한 음악과 품격 있는 다이닝 속에서 진솔한 대화를 나눕니다.',
    priceKrw: 45000,
    districtName: '부산 · 해운대 마린시티',
    mealNote: '웰컴 와인 페어링 포함, 디너 코스 식대는 현장 1/N 정산',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
  },
];

export default function MeetupPage() {
  const router = useRouter();
  const { isEditMode } = useVisualEditor();
  const { currentUser, applyForConditionalEvent } = useNadoSoloEngine();
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [bookedFeedback, setBookedFeedback] = useState<string | null>(null);

  const handleApplyClick = (ev: typeof SPECIAL_EVENTS[0]) => {
    if (isEditMode) return;
    if (!currentUser) {
      router.push(`/auth?next=/meetup`);
      return;
    }
    setCheckoutEvent({
      eventId: ev.id,
      title: ev.title,
      dateText: ev.date,
      priceKrw: ev.priceKrw,
      districtName: ev.districtName,
      mealNote: ev.mealNote,
    });
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (eventId: string) => {
    applyForConditionalEvent(eventId);
    setBookedFeedback('신청이 완료되었습니다. 모임현황에서 안내를 확인하세요.');
    setTimeout(() => setBookedFeedback(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-20">
      
      {/* ==============================================================
          1. 테마 밋업 상품 히어로 (좌측: 대형 사진 슬라이더 / 우측: 헤더라인 & 신청)
          ============================================================== */}
      <CategoryProductHero
        badge="테마 밋업 • SPECIAL MEETUP"
        headlineTitle="엄선된 소수를 위한"
        headlineHighlight="세대별 안심 테마 밋업"
        description="자주 열리지 않기에 더욱 특별합니다. 나도솔로는 월 2~4회의 제한된 인원만을 엄선하여 3045 프라임 및 5060 골든 세대별로 신뢰할 수 있는 품격 있는 파티를 개최합니다."
        specs={[
          { label: '참가 인원', value: '10~12인 소수정예', subText: '남녀 정확한 1:1 성비' },
          { label: '개최 주기', value: '월 2~4회 한정', subText: '사전 신청자 선별 확정' },
          { label: '장소 특권', value: '라운지 & 비스트로', subText: '프라이빗 대관 공간' },
        ]}
        slides={MEETUP_GALLERY_SLIDES}
        onApply={() => handleApplyClick(SPECIAL_EVENTS[0])}
        trustNote="에티켓 서약 및 신원 확인이 완료된 검증된 회원만 참석 가능합니다."
        activeLocationLabel="부산 (전포·서면·해운대)"
      />

      {/* ==============================================================
          2. 테마 밋업 카드 목록
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 space-y-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
              Schedules
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              모집 중인 테마 밋업
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            정원 마감 시 조기 종료됩니다.
          </p>
        </div>

        {bookedFeedback && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-500" />
            <span>{bookedFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SPECIAL_EVENTS.map((ev) => (
            <div
              key={ev.id}
              className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                <img
                  src={ev.image}
                  alt={ev.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-zinc-200 border border-white/10 backdrop-blur-md">
                    {ev.generation}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between space-y-5">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{ev.title}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{ev.location}</span>
                      <span className="text-zinc-600">•</span>
                      <span>{ev.date}</span>
                    </p>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{ev.desc}</p>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>모집 인원</span>
                      <span className="text-zinc-200 font-medium">{ev.capacity}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>참가 대상</span>
                      <span className="text-zinc-200 font-medium">{ev.target}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <AdaptiveButton
                    onClick={() => handleApplyClick(ev)}
                    className="w-full py-3.5"
                  >
                    신청하기
                  </AdaptiveButton>
                  <p className="text-[11px] text-zinc-500 text-center mt-2">
                    {ev.mealNote}
                  </p>
                </div>
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
