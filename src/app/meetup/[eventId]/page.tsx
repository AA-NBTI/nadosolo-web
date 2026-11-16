'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';

export default function MeetupDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId: rawEventId } = use(params);
  const eventId = decodeURIComponent(rawEventId);
  const router = useRouter();

  const {
    currentUser,
    conditionalEvents,
    regionDistricts,
    partnerVenues,
    appliedEventIds,
    applyForConditionalEvent,
  } = useNadoSoloEngine();

  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const event = conditionalEvents.find((e) => e.eventId === eventId);

  if (!event) {
    return (
      <main className="min-h-screen bg-[#07080a] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-base font-mono text-zinc-300">해당 모임 상품을 찾을 수 없습니다.</p>
        <Link
          href="/meetup"
          prefetch={true}
          className="px-5 py-2.5 border border-white/30 bg-white/10 text-sm font-mono text-white"
        >
          목록으로
        </Link>
      </main>
    );
  }

  const dist = regionDistricts.find((d) => d.districtId === event.districtId);
  const venue = partnerVenues.find((v) => v.venueId === event.venueId);
  const isApplied = appliedEventIds.includes(event.eventId);
  const isBlocked =
    isApplied || event.status === 'CANCELLED_MIN' || event.status === 'COMPLETED';

  const statusLabel =
    event.status === 'CONFIRMED'
      ? '확정'
      : event.status === 'CLOSING_SOON'
      ? '마감임박'
      : event.status === 'CANCELLED_MIN'
      ? '미달취소'
      : event.status === 'COMPLETED'
      ? '종료'
      : '모집중';

  const imgUrl =
    event.heroImage ||
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80';

  const handleApplyClick = () => {
    if (isBlocked) return;
    if (!currentUser) {
      router.push(`/auth?next=${encodeURIComponent(`/meetup/${event.eventId}`)}`);
      return;
    }
    setCheckoutEvent({
      eventId: event.eventId,
      title: event.title,
      dateText: event.dateText,
      priceKrw: event.priceKrw,
      districtName: event.regionName || (dist ? dist.regionName : '부산'),
      mealNote: event.mealNote,
      refundPolicy: event.refundPolicy,
      deadlineText: event.deadlineText,
    });
    setIsCheckoutOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] selection:bg-[#f04f74] selection:text-white">
      <div className="max-w-[1000px] mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/meetup"
            prefetch={true}
            className="text-sm font-mono text-zinc-300 hover:text-white transition-colors"
          >
            ← 밋업 목록
          </Link>
          <span className="px-3 py-1 text-sm font-mono border border-white/25 bg-white/10 text-white font-semibold">
            {statusLabel}
          </span>
        </div>

        {/* 1. 대표 사진 + 핵심 타이틀 */}
        <div className="border border-white/10 bg-[#0c0d12] overflow-hidden">
          <div className="relative h-72 sm:h-96 bg-black/50">
            <img
              src={imgUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 space-y-2">
              <span className="inline-block px-2.5 py-0.5 text-sm font-mono bg-black/75 border border-white/20 text-white">
                {event.regionName
                  ? `${event.regionName} · ${event.districtName || ''}`.trim()
                  : dist
                  ? `${dist.regionName} · ${dist.districtName}`
                  : '부산'}
              </span>
              <h1 className="font-serif-editorial text-2xl sm:text-4xl font-normal text-white leading-tight">
                {event.title}
              </h1>
              {event.reason && (
                <p className="text-base text-zinc-200 font-light">{event.reason}</p>
              )}
            </div>
          </div>

          {/* 2. 핵심 스펙 4칸 요약 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border-t border-white/10 text-sm font-mono">
            <div className="p-4 space-y-1">
              <span className="text-zinc-400 block">일시</span>
              <span className="text-white font-semibold">{event.dateText}</span>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-zinc-400 block">정원</span>
              <span className="text-white font-semibold">
                {event.maxCapacity ?? 6}명 (최소 {event.minConfirmCount ?? 4}명)
              </span>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-zinc-400 block">신청 마감</span>
              <span className="text-white font-semibold">
                {event.deadlineText || '모임 전일 18:00'}
              </span>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-zinc-400 block">참가비 (라이선스)</span>
              <span className="text-white font-bold">₩{event.priceKrw.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 3. 모임 상세 소개 + 장소 및 식대 안내 (2단 그리드) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="p-6 border border-white/10 bg-[#0c0d12] space-y-3">
            <h2 className="font-serif-editorial text-xl text-white border-b border-white/10 pb-2">
              모임 안내
            </h2>
            <p className="text-sm text-zinc-200 font-light leading-relaxed whitespace-pre-line">
              {event.description ||
                '엄선된 프라이빗 공간에서 결이 맞는 6인이 함께 식사하며 대화를 나눕니다. 모임 후에는 다면 관찰 리포트를 통해 타인의 시선에서 발견한 나의 소통 강점과 매력을 확인하실 수 있습니다.'}
            </p>
            <div className="pt-3 border-t border-white/[0.08] space-y-1.5 text-sm font-mono text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-400">포함 내역</span>
                <span>좌석 예약, 대화카드 키트, 다면 관찰 리포트</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">불포함 내역</span>
                <span>음식·주류 (현장 1/N 실비 정산)</span>
              </div>
            </div>
          </section>

          <section className="p-6 border border-white/10 bg-[#0c0d12] space-y-3">
            <h2 className="font-serif-editorial text-xl text-white border-b border-white/10 pb-2">
              장소 및 비용
            </h2>
            <div className="space-y-2.5 text-sm font-mono">
              <div>
                <span className="text-zinc-400 block">식당 / 공간</span>
                <span className="text-white font-semibold">
                  {event.venueNameOverride || venue?.name || '제휴 프라이빗 다이닝'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">위치 안내</span>
                <span className="text-zinc-200">
                  {event.isVenueSecretUntilConfirm
                    ? '확정자 대상 모임 D-1 상세 주소 비공개 안내'
                    : event.venueAddress || '확정자 대상 모임 D-1 상세 주소 비공개 안내'}
                </span>
                {!event.isVenueSecretUntilConfirm && event.venueMapUrl && (
                  <a
                    href={event.venueMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-1.5 text-sm font-mono text-white underline hover:text-zinc-200"
                  >
                    지도 보기 ↗
                  </a>
                )}
              </div>
              <div>
                <span className="text-zinc-400 block">현장 예상 식대</span>
                <span className="text-zinc-200">
                  {event.expectedMealCost || '인당 4~5만 원대 (현장 1/N 실비 카드 결제)'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* 4. 취소 및 환불 규정 + 최종 신청 CTA */}
        <section className="p-6 border border-white/10 bg-[#0c0d12] space-y-5">
          <div className="space-y-2">
            <h2 className="font-serif-editorial text-xl text-white">취소 · 환불 규정</h2>
            <p className="text-sm font-mono text-zinc-300 leading-relaxed">
              {event.refundPolicy ||
                '모임 3일 전 100% 환불 / 2일 전 50% 환불 / 1일 전·당일 환불 불가 (최소 인원 미달 시 100% 전액 자동 환불)'}
            </p>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-sm font-mono text-zinc-400 block">다면 관찰 라이선스 참가비</span>
              <span className="text-2xl font-mono font-bold text-white">
                ₩{event.priceKrw.toLocaleString()}
              </span>
              <span className="text-sm font-mono text-zinc-400 ml-2">(식대 현장 1/N 별도)</span>
            </div>

            <button
              type="button"
              disabled={isBlocked}
              onClick={handleApplyClick}
              className={`w-full sm:w-auto px-8 py-3.5 text-base font-mono transition-colors ${
                isBlocked
                  ? 'border border-white/10 text-zinc-500 cursor-not-allowed'
                  : 'border border-white/40 bg-white/15 hover:bg-white/25 text-white font-bold cursor-pointer'
              }`}
            >
              {isApplied
                ? '신청 완료'
                : event.status === 'CANCELLED_MIN'
                ? '미달 취소'
                : event.status === 'COMPLETED'
                ? '모임 종료'
                : '신청하기'}
            </button>
          </div>
        </section>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={checkoutEvent}
        onSuccessPayment={(evId) => {
          applyForConditionalEvent(evId);
          setIsCheckoutOpen(false);
        }}
      />
    </main>
  );
}
