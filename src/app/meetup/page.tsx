'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNadoSoloEngine, normalizeRegionCity } from '@/engine';
import { nadoSoloSupabaseService } from '@/lib/supabase/service';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import CmsPageHeader from '@/components/CmsPageHeader';
import { trackAffiliateClick } from '@/lib/affiliateDb';

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

function MeetupSlotBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qRegion = searchParams.get('region') || '';
  const qRef = (searchParams.get('ref') || '').trim().toUpperCase();
  const qInvite = searchParams.get('invite') || '';
  const qEvent = searchParams.get('event') || '';
  const rawTickets = Number(searchParams.get('tickets') || '1');
  const qTickets: 1 | 2 | 3 = rawTickets === 3 ? 3 : rawTickets === 2 ? 2 : 1;

  const {
    currentUser,
    conditionalEvents,
    regionDistricts,
    appliedEventIds,
    applyForConditionalEvent,
    surveyAnswers,
  } = useNadoSoloEngine();

  const [selectedRegion, setSelectedRegion] = useState<string>(() =>
    qRegion ? normalizeRegionCity(qRegion) : 'ALL'
  );
  const [selectedZone, setSelectedZone] = useState<string>('전체 권역');
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [ticketCredits, setTicketCredits] = useState(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    if (qRegion) setSelectedRegion(normalizeRegionCity(qRegion));
  }, [qRegion]);

  useEffect(() => {
    if (qRef && typeof window !== 'undefined') {
      localStorage.setItem('nadosolo_referral_code', qRef);
      void trackAffiliateClick(qRef, currentUser?.userId);
    }
  }, [qRef, currentUser?.userId]);

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
        if (ev.status === 'RECRUITING') existing.status = 'RECRUITING';
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
    const base = selectedRegion === 'ALL' ? blindSlots : blindSlots.filter((s) => s.regionName === selectedRegion);
    if (!qEvent) return base;
    return [...base].sort((a, b) => Number(b.representativeEventId === qEvent) - Number(a.representativeEventId === qEvent));
  }, [blindSlots, selectedRegion, qEvent]);

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] selection:bg-[#f04f74] selection:text-white">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-14 sm:py-20 space-y-10">
        {/* 상단 헤더 (PAGE_CMS 실시간 연동) */}
        <CmsPageHeader
          pageId="PAGE_MEETUP"
          defaultBadge="BLIND SLOT BOOKING"
          defaultTitle="일정 예약"
          defaultSub="도시와 요일만 선택하세요. 성향에 맞는 6인 테이블과 제휴 식당은 모임 전날(D-1) 19:00에 비공개 공개됩니다."
          rightSlot={
            <>
              <Link
                href="/checklist"
                prefetch={true}
                className="px-4 py-2 border border-white/20 text-sm font-mono text-zinc-200 hover:text-white hover:border-white/40 transition-colors"
              >
                체크리스트
              </Link>
              <Link
                href={currentUser ? '/dashboard' : '/auth'}
                prefetch={true}
                className="px-4 py-2 border border-white/30 bg-white/10 hover:bg-white/20 text-sm font-mono text-white font-semibold transition-colors"
              >
                {currentUser ? '내 모임' : '로그인'}
              </Link>
            </>
          }
        />

        {/* 도시 선택 */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {regions.map((reg) => {
                const active = selectedRegion === reg;
                return (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => {
                      setSelectedRegion(reg);
                      setSelectedZone('전체 권역');
                    }}
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
                    href="/checklist"
                    prefetch={true}
                    className="px-3 py-1.5 border border-white/25 bg-white/10 text-white hover:bg-white/20"
                  >
                    체크리스트 먼저 완료하기 →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 도시 내 세부 생활권 선택 (타임레프트 권역 표준) */}
          {selectedRegion !== 'ALL' && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono text-zinc-400 mr-1">세부 권역:</span>
              {(selectedRegion === '부산'
                ? ['전체 권역', '전포·서면', '해운대·센텀', '광안리']
                : ['전체 권역', '강남·역삼', '성수·건대', '한남·이태원', '홍대·합정']
              ).map((zone) => {
                const active = selectedZone === zone;
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`px-3 py-1 text-xs font-mono border transition-colors cursor-pointer ${
                      active
                        ? 'border-[#f04f74] bg-[#f04f74]/15 text-white font-semibold'
                        : 'border-white/10 bg-[#0c0d12] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {(qRef || qInvite) && (
          <div className="p-3.5 border border-[#f04f74]/40 bg-[#f04f74]/10 text-sm font-mono text-white">
            {qRef && `제휴 추천 코드 [${qRef}] 적용됨 — 결제 시 자동 할인됩니다. `}
            {qInvite && `동반 +1 초대 링크로 접속했습니다.${qEvent ? ' (초대 회차 우선 정렬)' : ''}`}
          </div>
        )}

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
                    {qEvent && slot.representativeEventId === qEvent && (
                      <span className="px-2.5 py-0.5 text-sm font-mono border border-white/30 bg-white/10 text-white">
                        초대 슬롯
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-mono text-zinc-400">
                    {slot.isApplied ? '예약완료' : slot.status === 'CLOSED' ? '모집마감' : '예약가능'}
                  </span>
                </div>

                <h2 className="font-serif-editorial text-2xl font-normal text-white">
                  {slot.regionName} · {slot.dateText}
                </h2>

                <div className="pt-2 border-t border-white/[0.08] space-y-1.5 text-sm font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span>예약 마감 · 공개</span>
                    <span className="text-white">D-2 자정 마감 · D-1 19:00 공개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>희망 생활권</span>
                    <span className="text-[#f04f74]">
                      {selectedRegion === slot.regionName && selectedZone !== '전체 권역'
                        ? `${slot.regionName} ${selectedZone}`
                        : `${slot.regionName} 전체 권역`}
                    </span>
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
                  disabled={slot.isApplied || slot.status === 'CLOSED'}
                  onClick={async () => {
                    if (slot.isApplied || slot.status === 'CLOSED') return;
                    if (!currentUser) {
                      router.push(`/auth?next=${encodeURIComponent('/meetup')}`);
                      return;
                    }
                    if (!hasCompletedQuiz) {
                      router.push('/checklist');
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
                      initialTicketCount: qTickets,
                      districtName:
                        selectedRegion === slot.regionName && selectedZone !== '전체 권역'
                          ? `${slot.regionName} ${selectedZone}`
                          : slot.regionName,
                      mealNote: '식당 및 동석자 정보는 D-1 19:00에 비공개 공개되며 식음료는 현장 1/N 결제입니다.',
                    });
                    setIsCheckoutOpen(true);
                  }}
                  className={`px-5 py-2.5 text-sm font-mono transition-colors ${
                    slot.isApplied || slot.status === 'CLOSED'
                      ? 'border border-white/10 text-zinc-500 cursor-not-allowed'
                      : 'border border-[#f04f74] bg-[#f04f74] hover:opacity-90 text-white font-semibold cursor-pointer'
                  }`}
                >
                  {slot.isApplied
                    ? '예약됨'
                    : slot.status === 'CLOSED'
                    ? '마감'
                    : ticketCredits > 0
                    ? '참가권 예약'
                    : !hasCompletedQuiz && currentUser
                    ? '체크리스트 후 예약'
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
        initialPromoCode={qRef || undefined}
        onSuccessPayment={(eventId) => {
          applyForConditionalEvent(eventId);
          setIsCheckoutOpen(false);
          router.push('/dashboard');
        }}
      />
    </main>
  );
}

export default function MeetupSlotBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080a]" />}>
      <MeetupSlotBookingContent />
    </Suspense>
  );
}
