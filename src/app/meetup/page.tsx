'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine, normalizeRegionCity } from '@/engine';
import { nadoSoloSupabaseService } from '@/lib/supabase/service';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';

interface BlindSlot {
  slotKey: string;
  regionName: string;
  dateText: string;
  representativeEventId: string;
  priceKrw: number;
  poolCount: number;
  isApplied: boolean;
  isRecommended: boolean;
  status: string;
}

export default function MeetupSlotBookingPage() {
  const router = useRouter();
  const {
    currentUser,
    conditionalEvents,
    regionDistricts,
    appliedEventIds,
    applyForConditionalEvent,
    surveyAnswers,
  } = useNadoSoloEngine();

  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [ticketCredits, setTicketCredits] = useState(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.userId) return;
    nadoSoloSupabaseService
      .getTicketCredits(currentUser.userId)
      .then((c) => setTicketCredits(c))
      .catch(() => {});
  }, [currentUser?.userId]);

  const hasCompletedQuiz = Object.keys(surveyAnswers || {}).length > 0;

  const resolveEventRegion = (ev: (typeof conditionalEvents)[number]) => {
    if (ev.regionName) return normalizeRegionCity(ev.regionName);
    const dist = regionDistricts.find((d) => d.districtId === ev.districtId);
    if (dist?.regionName) return normalizeRegionCity(dist.regionName);
    if (ev.title?.includes('부산') || ev.districtId?.includes('BUSAN')) return '부산';
    if (ev.title?.includes('서울') || ev.districtId?.includes('SEOUL')) return '서울';
    return '서울';
  };

  const myRegion = currentUser?.residenceCity
    ? normalizeRegionCity(currentUser.residenceCity)
    : '';

  // 타임레프트 제0조 원칙: 방 제목·식당을 쪼개 고르지 않고 [도시 × 날짜/요일] 단일 블라인드 슬롯으로 모수 집중
  const blindSlots: BlindSlot[] = useMemo(() => {
    const slotMap = new Map<string, BlindSlot>();

    for (const ev of conditionalEvents) {
      if (ev.status === 'CANCELLED_MIN' || ev.status === 'COMPLETED') continue;
      const regionName = resolveEventRegion(ev);
      const dateText = ev.dateText || '이번 주 금요일 19:30';
      const slotKey = `${regionName}|${dateText}`;
      const existing = slotMap.get(slotKey);
      const appliedHere = appliedEventIds.includes(ev.eventId);

      if (!existing) {
        slotMap.set(slotKey, {
          slotKey,
          regionName,
          dateText,
          representativeEventId: ev.eventId,
          priceKrw: ev.priceKrw ?? 30000,
          poolCount: 1,
          isApplied: appliedHere,
          isRecommended: Boolean(myRegion && regionName === myRegion),
          status: ev.status || 'RECRUITING',
        });
      } else {
        existing.poolCount += 1;
        if (appliedHere) existing.isApplied = true;
      }
    }

    // 기본 서울/부산 주간 슬롯 폴백 (DB 슬롯이 없을 때도 예약 가능하도록 유지)
    if (slotMap.size === 0) {
      const defaults: Array<{ region: string; dateText: string; id: string }> = [
        { region: '서울', dateText: '이번 주 금요일 19:30', id: 'SLOT_SEOUL_FRI' },
        { region: '서울', dateText: '이번 주 토요일 19:30', id: 'SLOT_SEOUL_SAT' },
        { region: '부산', dateText: '이번 주 금요일 19:30', id: 'SLOT_BUSAN_FRI' },
        { region: '부산', dateText: '이번 주 토요일 19:30', id: 'SLOT_BUSAN_SAT' },
      ];
      for (const d of defaults) {
        slotMap.set(`${d.region}|${d.dateText}`, {
          slotKey: `${d.region}|${d.dateText}`,
          regionName: d.region,
          dateText: d.dateText,
          representativeEventId: d.id,
          priceKrw: 30000,
          poolCount: 1,
          isApplied: appliedEventIds.includes(d.id),
          isRecommended: Boolean(myRegion && d.region === myRegion),
          status: 'RECRUITING',
        });
      }
    }

    const list = Array.from(slotMap.values());
    if (!currentUser) return list;
    return list.sort((a, b) => Number(b.isRecommended) - Number(a.isRecommended));
  }, [conditionalEvents, regionDistricts, appliedEventIds, currentUser, myRegion]);

  const regions = useMemo(() => {
    const names = Array.from(new Set(blindSlots.map((s) => s.regionName)));
    return ['ALL', ...names];
  }, [blindSlots]);

  const filteredSlots = useMemo(() => {
    if (selectedRegion === 'ALL') return blindSlots;
    return blindSlots.filter((s) => s.regionName === selectedRegion);
  }, [blindSlots, selectedRegion]);

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] selection:bg-[#f04f74] selection:text-white">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-14 sm:py-20 space-y-10">
        {/* 상단 헤더 */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="text-sm font-mono tracking-widest text-zinc-300 uppercase">
                BLIND SLOT BOOKING
              </span>
            </div>
            <h1 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-white">
              일정 예약
            </h1>
            <p className="text-sm text-zinc-400 font-light">
              도시와 요일만 선택하세요. 성향에 맞는 6인 테이블과 제휴 식당은 모임 전날(D-1) 19:00에 비공개 공개됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/test"
              prefetch={true}
              className="px-4 py-2 border border-white/20 text-sm font-mono text-zinc-200 hover:text-white hover:border-white/40 transition-colors"
            >
              성향 퀴즈
            </Link>
            <Link
              href={currentUser ? '/dashboard' : '/auth'}
              prefetch={true}
              className="px-4 py-2 border border-white/30 bg-white/10 hover:bg-white/20 text-sm font-mono text-white font-semibold transition-colors"
            >
              {currentUser ? '내 모임' : '로그인'}
            </Link>
          </div>
        </header>

        {/* 도시 선택 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {regions.map((reg) => {
              const active = selectedRegion === reg;
              return (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-4 py-2 text-sm font-mono border transition-colors cursor-pointer ${
                    active
                      ? 'border-white/40 bg-white/15 text-white font-semibold'
                      : 'border-white/10 bg-[#0c0d12] text-zinc-400 hover:text-white hover:border-white/25'
                  }`}
                >
                  {reg === 'ALL' ? '전체 도시' : reg}
                </button>
              );
            })}
          </div>
          {currentUser && (
            <div className="flex items-center gap-2 text-sm font-mono">
              {ticketCredits > 0 && (
                <span className="px-3 py-1.5 border border-[#f04f74]/50 bg-[#f04f74]/15 text-white">
                  보유 참가권 {ticketCredits}매
                </span>
              )}
              {!hasCompletedQuiz && (
                <Link
                  href="/test"
                  prefetch={true}
                  className="px-3 py-1.5 border border-white/25 bg-white/10 text-white hover:bg-white/20"
                >
                  성향 퀴즈 먼저 완료하기 →
                </Link>
              )}
            </div>
          )}
        </div>

        {statusNotice && (
          <div className="p-3 border border-white/20 bg-[#0c0d12] text-sm font-mono text-white">
            {statusNotice}
          </div>
        )}

        {/* 타임레프트 블라인드 슬롯 2열 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSlots.map((slot) => (
            <article
              key={slot.slotKey}
              className="border border-white/10 bg-[#0c0d12] p-6 flex flex-col justify-between space-y-5 hover:border-white/25 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-sm font-mono border border-white/25 bg-white/10 text-white font-semibold">
                      {slot.regionName}
                    </span>
                    {slot.isRecommended && (
                      <span className="px-2.5 py-0.5 text-sm font-mono border border-[#f04f74]/60 bg-[#f04f74]/15 text-white">
                        내 지역
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-mono text-zinc-400">
                    {slot.isApplied ? '예약완료' : '예약가능'}
                  </span>
                </div>

                <h2 className="font-serif-editorial text-2xl font-normal text-white">
                  {slot.regionName} · {slot.dateText}
                </h2>

                <div className="pt-2 border-t border-white/[0.08] space-y-1.5 text-sm font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span>장소 · 동석자</span>
                    <span className="text-white">D-1 19:00 비공개 공개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>테이블 정원</span>
                    <span className="text-zinc-200">6인 소셜 다이닝 (사전 DM 차단)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>취소 · 이월</span>
                    <span className="text-zinc-200">48시간 전 무료 취소/이월</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-lg font-mono font-bold text-white">
                    ₩{slot.priceKrw.toLocaleString()}
                  </span>
                  <span className="text-sm font-mono text-zinc-400 ml-1.5">(식대 현장 1/N)</span>
                </div>

                <button
                  type="button"
                  disabled={slot.isApplied}
                  onClick={async () => {
                    if (slot.isApplied) return;
                    if (!currentUser) {
                      router.push(`/auth?next=${encodeURIComponent('/meetup')}`);
                      return;
                    }
                    if (!hasCompletedQuiz) {
                      router.push('/test');
                      return;
                    }
                    if (ticketCredits > 0) {
                      const title = `${slot.regionName} · ${slot.dateText} 프라이빗 다이닝`;
                      const redeemed = await nadoSoloSupabaseService.redeemTicketForEvent(
                        currentUser.userId,
                        slot.representativeEventId,
                        title
                      );
                      if (redeemed.ok) {
                        setTicketCredits(redeemed.remainingCredits);
                        applyForConditionalEvent(slot.representativeEventId);
                        setStatusNotice(`[${title}] 보유 참가권으로 예약 완료되었습니다.`);
                        setTimeout(() => router.push('/dashboard'), 900);
                        return;
                      }
                    }
                    setCheckoutEvent({
                      eventId: slot.representativeEventId,
                      title: `${slot.regionName} · ${slot.dateText} 프라이빗 다이닝`,
                      dateText: slot.dateText,
                      priceKrw: slot.priceKrw,
                      districtName: slot.regionName,
                      mealNote: '식당 및 동석자 정보는 D-1 19:00에 비공개 공개되며 식음료는 현장 1/N 결제입니다.',
                    });
                    setIsCheckoutOpen(true);
                  }}
                  className={`px-5 py-2.5 text-sm font-mono transition-colors ${
                    slot.isApplied
                      ? 'border border-white/10 text-zinc-500 cursor-not-allowed'
                      : 'border border-[#f04f74] bg-[#f04f74] hover:opacity-90 text-white font-semibold cursor-pointer'
                  }`}
                >
                  {slot.isApplied
                    ? '예약됨'
                    : ticketCredits > 0
                    ? '참가권 예약'
                    : !hasCompletedQuiz && currentUser
                    ? '퀴즈 후 예약'
                    : '슬롯 예약'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={checkoutEvent}
        onSuccessPayment={(eventId) => {
          applyForConditionalEvent(eventId);
          setIsCheckoutOpen(false);
          router.push('/dashboard');
        }}
      />
    </main>
  );
}
