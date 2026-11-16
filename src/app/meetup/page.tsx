'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';

export default function MeetupCatalogPage() {
  const router = useRouter();
  const {
    currentUser,
    conditionalEvents,
    regionDistricts,
    partnerVenues,
    appliedEventIds,
    applyForConditionalEvent,
  } = useNadoSoloEngine();

  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('ALL');
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const PURPOSE_LABELS: Record<string, string> = {
    FRIEND: '친구·교류',
    RESET: '지적 환기',
    TASTE: '취향·활동',
    ROMANCE: '인연·동반자',
  };

  const regions = useMemo(() => {
    const names = Array.from(
      new Set(
        conditionalEvents.map((ev) => {
          if (ev.regionName) return ev.regionName;
          const dist = regionDistricts.find((d) => d.districtId === ev.districtId);
          return dist?.regionName || '부산';
        })
      )
    );
    return ['ALL', ...names];
  }, [conditionalEvents, regionDistricts]);

  const filteredEvents = useMemo(() => {
    return conditionalEvents.filter((ev) => {
      const dist = regionDistricts.find((d) => d.districtId === ev.districtId);
      const reg = ev.regionName || dist?.regionName || '부산';
      const matchRegion = selectedRegion === 'ALL' || reg === selectedRegion;
      const matchPurpose = selectedPurpose === 'ALL' || ev.purpose === selectedPurpose;
      return matchRegion && matchPurpose;
    });
  }, [conditionalEvents, regionDistricts, selectedRegion, selectedPurpose]);

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '확정';
      case 'CLOSING_SOON':
        return '마감임박';
      case 'CANCELLED_MIN':
        return '미달취소';
      case 'COMPLETED':
        return '종료';
      default:
        return '모집중';
    }
  };

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] selection:bg-[#f04f74] selection:text-white">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 sm:py-20 space-y-10">
        {/* 상단 헤더 */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="text-sm font-mono tracking-widest text-zinc-300 uppercase">
                NADOSOLO MEETUP
              </span>
            </div>
            <h1 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-white">
              모임 일정
            </h1>
            <p className="text-sm text-zinc-400 font-light">
              개설된 프라이빗 6인 다이닝 테이블의 공간과 일정을 확인하고 신청하세요.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              prefetch={true}
              className="px-4 py-2 border border-white/20 text-sm font-mono text-zinc-200 hover:text-white hover:border-white/40 transition-colors"
            >
              홈
            </Link>
            <Link
              href={currentUser ? '/dashboard' : '/auth'}
              prefetch={true}
              className="px-4 py-2 border border-white/30 bg-white/10 hover:bg-white/20 text-sm font-mono text-white font-semibold transition-colors"
            >
              {currentUser ? '마이페이지' : '로그인'}
            </Link>
          </div>
        </header>

        {/* 권역 · 목적 필터 */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {regions.map((reg) => {
              const active = selectedRegion === reg;
              return (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-3.5 py-1.5 text-sm font-mono border transition-colors cursor-pointer ${
                    active
                      ? 'border-white/40 bg-white/15 text-white font-semibold'
                      : 'border-white/10 bg-[#0c0d12] text-zinc-400 hover:text-white hover:border-white/25'
                  }`}
                >
                  {reg === 'ALL' ? '전체 지역' : reg}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: '전체 목적' },
              { id: 'FRIEND', label: '친구·교류' },
              { id: 'RESET', label: '지적 환기' },
              { id: 'TASTE', label: '취향·활동' },
              { id: 'ROMANCE', label: '인연·동반자' },
            ].map((p) => {
              const active = selectedPurpose === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPurpose(p.id)}
                  className={`px-3.5 py-1.5 text-sm font-mono border transition-colors cursor-pointer ${
                    active
                      ? 'border-b-2 border-b-[#f04f74] border-white/30 bg-white/10 text-white font-semibold'
                      : 'border-white/10 bg-[#0c0d12] text-zinc-400 hover:text-white hover:border-white/25'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 개설 모임 상품 2열 그리드 (대표 사진 + 상세 링크 포함) */}
        {filteredEvents.length === 0 ? (
          <div className="p-12 border border-white/10 bg-[#0c0d12] text-center text-sm font-mono text-zinc-400 space-y-2">
            <p>현재 개설된 모임이 없습니다.</p>
            <p className="text-zinc-500">관리자(/admin) 모임 개설에서 신규 모임을 등록해 주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((ev) => {
              const dist = regionDistricts.find((d) => d.districtId === ev.districtId);
              const venue = partnerVenues.find((v) => v.venueId === ev.venueId);
              const isApplied = appliedEventIds.includes(ev.eventId);
              const isBlocked =
                isApplied || ev.status === 'CANCELLED_MIN' || ev.status === 'COMPLETED';

              const imgUrl =
                ev.heroImage ||
                'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80';

              return (
                <article
                  key={ev.eventId}
                  className="border border-white/10 bg-[#0c0d12] flex flex-col justify-between overflow-hidden hover:border-white/25 transition-colors group"
                >
                  <div>
                    {/* 대표 사진 영역 (클릭 시 상세 페이지 이동) */}
                    <Link href={`/meetup/${ev.eventId}`} prefetch={true} className="block relative h-56 overflow-hidden bg-black/50">
                      <img
                        src={imgUrl}
                        alt={ev.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 text-sm font-mono bg-black/75 border border-white/20 text-white">
                          {ev.regionName
                            ? `${ev.regionName} · ${ev.districtName || ''}`.trim()
                            : dist
                            ? `${dist.regionName} · ${dist.districtName}`
                            : '부산'}
                        </span>
                        <span className="px-2.5 py-1 text-sm font-mono bg-black/75 border border-white/30 text-white font-semibold">
                          {getStatusLabel(ev.status)}
                        </span>
                      </div>
                    </Link>

                    {/* 본문 영역 */}
                    <div className="p-6 space-y-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ev.purpose && (
                          <span className="px-2 py-0.5 text-sm font-mono border border-white/25 bg-white/10 text-white">
                            {PURPOSE_LABELS[ev.purpose] || ev.purpose}
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-sm font-mono border border-white/10 bg-white/5 text-zinc-300">
                          {ev.mode}
                        </span>
                        {ev.dongName && (
                          <span className="px-2 py-0.5 text-sm font-mono border border-white/10 bg-black/30 text-zinc-300">
                            {ev.dongName}
                          </span>
                        )}
                      </div>
                      <Link href={`/meetup/${ev.eventId}`} prefetch={true} className="block">
                        <h2 className="font-serif-editorial text-xl font-normal text-white group-hover:underline">
                          {ev.title}
                        </h2>
                      </Link>

                      {ev.reason && (
                        <p className="text-sm text-zinc-200 font-light leading-relaxed">
                          {ev.reason}
                        </p>
                      )}

                      <div className="pt-3 border-t border-white/[0.08] space-y-1.5 text-sm font-mono text-zinc-400">
                        <div className="flex justify-between gap-2">
                          <span>장소</span>
                          <span className="text-zinc-200 text-right truncate">
                            {ev.venueNameOverride || venue?.name || '제휴 프라이빗 다이닝'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>일시</span>
                          <span className="text-zinc-200">{ev.dateText}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>정원</span>
                          <span className="text-zinc-200">
                            {ev.maxCapacity ?? 6}명 (최소 {ev.minConfirmCount ?? 4}명 확정)
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>마감</span>
                          <span className="text-zinc-200">{ev.deadlineText || '모임 전일 18:00 마감'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 하단 가격 및 상세/신청 버튼 */}
                  <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-lg font-mono font-bold text-white">
                        ₩{ev.priceKrw.toLocaleString()}
                      </span>
                      <span className="text-sm font-mono text-zinc-400 ml-1.5">
                        (식대 1/N)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/meetup/${ev.eventId}`}
                        prefetch={true}
                        className="px-4 py-2 border border-white/20 text-sm font-mono text-zinc-200 hover:text-white hover:border-white/40 transition-colors"
                      >
                        상세보기
                      </Link>
                      <button
                        type="button"
                        disabled={isBlocked}
                        onClick={() => {
                          if (isBlocked) return;
                          if (!currentUser) {
                            router.push(`/auth?next=${encodeURIComponent(`/meetup/${ev.eventId}`)}`);
                            return;
                          }
                          setCheckoutEvent({
                            eventId: ev.eventId,
                            title: ev.title,
                            dateText: ev.dateText,
                            priceKrw: ev.priceKrw,
                            districtName: ev.regionName || (dist ? dist.regionName : '부산'),
                            mealNote: ev.mealNote,
                            refundPolicy: ev.refundPolicy,
                            deadlineText: ev.deadlineText,
                          });
                          setIsCheckoutOpen(true);
                        }}
                        className={`px-4 py-2 text-sm font-mono transition-colors ${
                          isBlocked
                            ? 'border border-white/10 text-zinc-500 cursor-not-allowed'
                            : 'border border-white/30 bg-white/15 hover:bg-white/25 text-white font-semibold cursor-pointer'
                        }`}
                      >
                        {isApplied
                          ? '완료'
                          : ev.status === 'CANCELLED_MIN'
                          ? '미달취소'
                          : ev.status === 'COMPLETED'
                          ? '종료'
                          : '신청하기'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
