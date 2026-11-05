'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import CategoryProductHero from '@/components/CategoryProductHero';
import { Utensils, Wine, MapPin, HeartHandshake, Ticket, MessageSquare } from 'lucide-react';

const DINING_EXPERIENCE_STEPS = [
  {
    step: '01',
    title: '비밀 좌석 배정',
    subtitle: 'Seat Assignment',
    desc: '성향과 관심사를 고려해 최적의 대화 흐름이 이루어지도록 남녀 3:3 지그재그 좌석이 사전 배정됩니다.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    icon: Ticket,
  },
  {
    step: '02',
    title: '아이스브레이킹 대화 카드',
    subtitle: 'Icebreaker Playbook',
    desc: '어색한 침묵 없이 자연스럽게 서로의 취향과 라이프스타일을 나눌 수 있는 전용 질문 카드가 제공됩니다.',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
    icon: MessageSquare,
  },
  {
    step: '03',
    title: '셰프 코스 요리 & 와인',
    subtitle: 'Dining & Wine',
    desc: '엄선된 제휴 레스토랑의 코스 요리와 웰컴 와인을 즐기며 2시간 동안 품격 있는 미식 대화가 진행됩니다.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    icon: Utensils,
  },
  {
    step: '04',
    title: '익일 시크릿 매너 투표',
    subtitle: 'Secret Feedback',
    desc: '모임 다음 날 오전 9시, 대시보드에서 매너 평가와 호감 투표가 진행되며 상호 호감 시 1:1 연락처가 교환됩니다.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    icon: HeartHandshake,
  },
];

const DINING_VENUES = [
  {
    name: '전포 아틀리에 비스트로',
    location: '부산 부산진구 전포동',
    mood: '은은한 조도 & 내추럴 와인',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: '해운대 오션 앤 와인 라운지',
    location: '부산 해운대구 마린시티',
    mood: '오션뷰 프라이빗 룸 & 코스',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: '서면 까사 디 루체',
    location: '부산 부산진구 서면',
    mood: '컨템포러리 다이닝 & 소음 통제',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=600&q=80',
  },
];

export default function DiningPage() {
  const router = useRouter();
  const { currentUser, conditionalEvents, applyForConditionalEvent, appliedEventIds, regionDistricts } = useNadoSoloEngine();
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleApplyClick = (eventId?: string) => {
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
        priceKrw: targetEv.priceKrw,
        districtName: '부산 · 전포/서면',
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
          1. 소셜 다이닝 상품 히어로 (좌측: 4단계 프로세스 사진 그리드 / 우측: 헤더라인 & 신청)
          ============================================================== */}
      <CategoryProductHero
        badge="소셜 다이닝 • SIGNATURE DINING"
        headlineTitle="결이 맞는 사람들과의"
        headlineHighlight="프라이빗 시크릿 디너"
        description="어색한 소개팅 대신, 에티켓과 성향이 검증된 6인이 마주 앉아 셰프의 요리와 와인을 곁들이며 삶의 결을 나누는 정통 소셜 다이닝입니다."
        specs={[
          { label: '운영 형태', value: '프라이빗 큐레이션', subText: '신원·에티켓 서약 회원' },
          { label: '모임 일정 및 인원', value: '매주 금·토 저녁', subText: '성별 3:3 균형 큐레이션' },
          { label: '품격 보장', value: '매너 평가제', subText: '익일 비공개 호감 투표' },
        ]}
        steps={[
          DINING_EXPERIENCE_STEPS[0],
          DINING_EXPERIENCE_STEPS[1],
          DINING_EXPERIENCE_STEPS[2],
          DINING_EXPERIENCE_STEPS[3],
        ]}
        onApply={() => handleApplyClick()}
        trustNote="에티켓 서약 및 신원 확인이 완료된 검증된 회원만 참석 가능합니다."
        activeLocationLabel="부산 (전포·서면·해운대)"
      />

      {/* ==============================================================
          2. 현재 오픈된 테이블 목록 (신청 카드)
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 space-y-8 w-full border-b border-white/10">
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
            성별 및 연령대 밸런스가 충족되는 즉시 자리가 마감됩니다.
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
                    <span className="text-xs text-zinc-400">정원 6인 (3:3)</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight mb-1">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{regionDistricts.find((d) => d.districtId === ev.districtId)?.districtName || '부산 · 전포/서면'}</span>
                      <span className="text-zinc-600">•</span>
                      <span>{ev.dateText}</span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>참가 대상</span>
                      <span className="text-zinc-200 font-medium">{ev.targetAgeGroup} 직장인/골든</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>좌석 배정</span>
                      <span className="text-zinc-200 font-medium">성향 매칭 3:3</span>
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
                    <button
                      type="button"
                      onClick={() => handleApplyClick(ev.eventId)}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      신청하기
                    </button>
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
          4. 제휴 베뉴 갤러리 섹션
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
              Partner Venues
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              제휴 파트너 공간
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            소음도 50dB 이하, 대화가 끊이지 않는 최적의 조도와 테이블 간격을 보장합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {DINING_VENUES.map((v, i) => (
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
