'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import CategoryProductHero from '@/components/CategoryProductHero';
import { MapPin, HeartHandshake, ShieldCheck, CheckCircle2, Ticket, GlassWater } from 'lucide-react';

const MEETUP_STEPS = [
  {
    step: '01',
    title: '테마 밋업 선택',
    subtitle: 'Theme Selection',
    desc: '3045 프라임 또는 5060 골든 등 본인의 연령대와 관심사에 맞춘 테마 모임을 선택하고 신청합니다.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    icon: Ticket,
  },
  {
    step: '02',
    title: '성비 밸런스 배정',
    subtitle: 'Gender Balance',
    desc: '신원 확인과 에티켓 서약을 거친 멤버들로 남녀 1:1 정확한 성비를 맞춰 소수정예로 확정됩니다.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    icon: ShieldCheck,
  },
  {
    step: '03',
    title: '프라이빗 라운지 모임',
    subtitle: 'Lounge Party',
    desc: '웰컴 드링크와 감각적인 핑거푸드를 즐기며 편안한 음악 속에서 새로운 사람들과 자연스럽게 인사를 나눕니다.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    icon: GlassWater,
  },
  {
    step: '04',
    title: '익일 시크릿 호감 투표',
    subtitle: 'Secret Match',
    desc: '모임 다음 날 오전 9시, 대시보드에서 호감 투표를 진행하며 상호 매칭 시 1:1 연락처가 오픈됩니다.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    icon: HeartHandshake,
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
  const { currentUser, applyForConditionalEvent } = useNadoSoloEngine();
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [bookedFeedback, setBookedFeedback] = useState<string | null>(null);

  const handleApplyClick = (ev: typeof SPECIAL_EVENTS[0]) => {
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
          1. 테마 밋업 상품 히어로 (좌측: 4단계 프로세스 사진 그리드 / 우측: 헤더라인 & 신청)
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
        steps={[
          MEETUP_STEPS[0],
          MEETUP_STEPS[1],
          MEETUP_STEPS[2],
          MEETUP_STEPS[3],
        ]}
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
                  <button
                    type="button"
                    onClick={() => handleApplyClick(ev)}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    신청하기
                  </button>
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
