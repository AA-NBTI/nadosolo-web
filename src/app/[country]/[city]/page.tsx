'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';

export default function CityHubPage() {
  const params = useParams();
  const router = useRouter();
  const countryParam = (params?.country as string)?.toLowerCase() || 'kr';
  const cityParam = (params?.city as string)?.toLowerCase() || 'busan';

  const { currentUser, dynamicQuote, cityConfig } = useNadoSoloEngine();

  const cityNameKr = cityParam === 'busan' ? '부산' : cityParam === 'seoul' ? '서울' : cityParam.toUpperCase();
  const cityNameEn = cityParam.toUpperCase();

  const formatPrice = (amount: number, currency: string) => {
    if (currency === 'KRW') return `₩${amount.toLocaleString()}`;
    if (currency === 'JPY') return `¥${amount.toLocaleString()}`;
    return `$${amount.toLocaleString()}`;
  };

  const handleApply = () => {
    const target = '/dashboard?step=P05_EVENT_APPLY';
    if (!currentUser) {
      router.push(`/auth?next=${encodeURIComponent(target)}`);
    } else {
      router.push(target);
    }
  };

  const CURATED_VENUES = [
    {
      title: 'Ocean View Terrace',
      area: '해운대 • 광안',
      desc: '탁 트인 오션뷰와 페어링 와인이 함께하는 테라스 테이블',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Artisan Chef Bistro',
      area: '전포 • 서면',
      desc: '감각적인 요리와 편안하고 진솔한 대화가 오가는 비스트로',
      image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Private Dining Salon',
      area: '센텀',
      desc: '지적 교류와 깊이 있는 대화에 집중할 수 있는 프라이빗 룸',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-white selection:bg-[#881337] pb-24 font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#12151e] to-[#090a0f] pt-14 pb-20 px-6">
        <div className="max-w-[1240px] mx-auto space-y-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{cityNameEn} PRIVATE DINING</span>
            </div>
            <h1 className="font-serif-editorial text-4xl sm:text-6xl font-normal text-white tracking-tight leading-[1.12]">
              {cityNameKr}, 결이 맞는 6인의<br />
              프라이빗 테이블
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed font-normal">
              복잡한 검색과 가벼운 만남을 대신합니다.<br />
              참가자들의 성향과 선호 동선을 정밀 분석하여, 매주 금요일 밤 최적의 멤버와 엄선된 공간으로 초대합니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleApply}
              className="px-8 py-4 rounded-xl bg-[#881337] hover:bg-[#6f102d] text-white text-sm font-medium shadow-xl shadow-[#881337]/25 transition-all cursor-pointer"
            >
              이번 주 {cityNameKr} 다이닝 신청 • {formatPrice(dynamicQuote.finalPrice, cityConfig.currency)}
            </button>
            <span className="text-xs text-zinc-500">
              베뉴는 D-1 비공개 초대장으로 안내됩니다.
            </span>
          </div>
        </div>
      </section>

      {/* 2. CURATION SPACES */}
      <section className="max-w-[1240px] mx-auto px-6 py-20 space-y-10">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
            CURATED SPACES
          </span>
          <h2 className="font-serif-editorial text-3xl font-normal text-white">
            엄선된 파트너 베뉴
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
            별도로 장소를 고민하실 필요가 없습니다. 회원의 선호 이동 동선과 테이블 분위기에 맞춰 부산 전역의 엄선된 공간 중 최적의 프라이빗 테이블이 배정됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CURATED_VENUES.map((venue) => (
            <div
              key={venue.title}
              className="bg-[#12151e] rounded-2xl border border-white/10 overflow-hidden space-y-4 shadow-xl"
            >
              <div className="h-52 relative overflow-hidden">
                <img
                  src={venue.image}
                  alt={venue.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-xs text-zinc-200 border border-white/10">
                  {venue.area}
                </span>
              </div>
              <div className="p-6 pt-0 space-y-2">
                <h3 className="font-serif-editorial text-xl font-normal text-white">
                  {venue.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {venue.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. TABLE PROTOCOL */}
      <section className="max-w-[1240px] mx-auto px-6 py-10">
        <div className="bg-[#12151e] p-8 sm:p-12 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
              THE RULES OF CONDUCT
            </span>
            <h3 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white">
              품격과 신뢰를 위한 3가지 약속
            </h3>
            <ul className="text-xs text-zinc-400 space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>100% 실명 및 기본 프로필 검증제</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>상호 존중과 경청의 대화 에티켓</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>식사 후 정직한 비공개 상호 피어리뷰</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="px-8 py-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            부산 다이닝 참가 신청하기 →
          </button>
        </div>
      </section>
    </div>
  );
}
