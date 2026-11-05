'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';

export default function DistrictLandingPage() {
  const router = useRouter();
  const params = useParams();
  const countryParam = (params?.country as string)?.toLowerCase() || 'kr';
  const cityParam = (params?.city as string)?.toLowerCase() || 'busan';
  const districtParam = (params?.district as string)?.toLowerCase() || 'haeundae';

  const {
    regionDistricts,
    conditionalEvents,
    partnerVenues,
    appliedEventIds,
    applyForConditionalEvent,
    currentUser,
  } = useNadoSoloEngine();

  const currentDistrict = useMemo(() => {
    return (
      regionDistricts.find(
        (d) =>
          d.districtSlug?.toLowerCase() === districtParam ||
          d.districtId.toLowerCase() === `dist_${districtParam}`
      ) || regionDistricts[0]
    );
  }, [regionDistricts, districtParam]);

  const districtEvents = useMemo(() => {
    return conditionalEvents.filter((ev) => ev.districtId === currentDistrict.districtId);
  }, [conditionalEvents, currentDistrict]);

  const districtVenues = useMemo(() => {
    return partnerVenues.filter((v) => {
      const matchCity = v.cityCode.toLowerCase();
      return (
        matchCity.includes(districtParam) ||
        matchCity.includes(cityParam) ||
        matchCity.includes(currentDistrict.districtName.slice(0, 2))
      );
    });
  }, [partnerVenues, districtParam, cityParam, currentDistrict]);

  const [feedbackMsg, setFeedbackMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleApplyClick = (eventId: string) => {
    if (!currentUser) {
      router.push(`/auth?next=/${countryParam}/${cityParam}/${districtParam}`);
      return;
    }
    const res = applyForConditionalEvent(eventId);
    setFeedbackMsg({ ok: res.ok, msg: res.message });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const cityNameKr = cityParam === 'busan' ? '부산' : cityParam === 'seoul' ? '서울' : cityParam.toUpperCase();

  return (
    <div className="min-h-screen bg-[#090a0f] text-white selection:bg-[#881337] selection:text-white pb-20 font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#12151e] pt-12 pb-18 px-6">
        <div className="max-w-[1240px] mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">홈</Link>
            <span>/</span>
            <span className="uppercase text-zinc-400">{countryParam}</span>
            <span>/</span>
            <Link href={`/${countryParam}/${cityParam}`} className="hover:text-white transition-colors">
              {cityNameKr}
            </Link>
            <span>/</span>
            <span className="text-white font-medium">{currentDistrict.districtName}</span>
          </div>

          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{cityNameKr} • {currentDistrict.districtName}</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              {currentDistrict.districtName} 프라이빗 테이블
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed font-normal">
              {currentDistrict.description}
            </p>
          </div>
        </div>
      </section>

      {/* FEEDBACK TOAST */}
      {feedbackMsg && (
        <div className="fixed top-20 right-6 z-50">
          <div
            className={`px-5 py-3 rounded-2xl text-xs font-medium shadow-2xl border ${
              feedbackMsg.ok
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
            }`}
          >
            {feedbackMsg.msg}
          </div>
        </div>
      )}

      {/* 2. SESSIONS */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 space-y-8">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
            SESSIONS
          </span>
          <h2 className="font-serif-editorial text-2xl font-normal text-white">
            진행 예정 디너
          </h2>
        </div>

        <div className="space-y-4">
          {districtEvents.map((ev) => {
            const isApplied = appliedEventIds.includes(ev.eventId);

            return (
              <div
                key={ev.eventId}
                className="p-7 rounded-2xl bg-[#12151e] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="font-medium text-white">{ev.dateText}</span>
                    <span>•</span>
                    <span>6인 테이블</span>
                  </div>

                  <h3 className="font-serif-editorial text-xl font-normal text-white">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-zinc-400">
                    성향 및 라이프스타일 밸런싱 • 모임 24시간 전 장소 비공개 전달
                  </p>
                </div>

                <div className="flex items-center gap-5 shrink-0 self-end sm:self-center">
                  <span className="text-xl font-normal text-white font-serif-editorial">
                    ₩{ev.priceKrw.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    disabled={isApplied}
                    onClick={() => handleApplyClick(ev.eventId)}
                    className={`px-6 py-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isApplied
                        ? 'bg-white/10 text-zinc-500 border border-white/10 cursor-not-allowed'
                        : 'bg-[#881337] hover:bg-[#6f102d] text-white shadow-lg shadow-[#881337]/20'
                    }`}
                  >
                    {isApplied ? '신청 완료' : '신청하기'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. PARTNER SPACES */}
      <section className="max-w-[1240px] mx-auto px-6 py-10 border-t border-white/10 space-y-6">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
            PARTNER SPACES
          </span>
          <h2 className="font-serif-editorial text-xl font-normal text-white">
            제휴 공간
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {districtVenues.slice(0, 2).map((venue) => (
            <div
              key={venue.venueId}
              className="p-5 rounded-xl bg-[#12151e] border border-white/10 flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-medium text-white">{venue.name}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{venue.vibeThemes?.join(', ') || 'PRIVATE_LOUNGE'}</p>
              </div>
              <span className="text-xs text-zinc-500">프라이빗 테이블</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
