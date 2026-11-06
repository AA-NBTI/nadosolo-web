'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import { MapPin, Calendar, Users, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CityMeta {
  code: string;
  nameKr: string;
  nameEn: string;
  status: 'ACTIVE' | 'WAITLIST';
  districts: { name: string; desc: string; image: string }[];
  tagline: string;
  waitlistCount?: number;
}

const CITIES_DATA: Record<string, CityMeta> = {
  busan: {
    code: 'busan',
    nameKr: '부산',
    nameEn: 'BUSAN',
    status: 'ACTIVE',
    tagline: '감각적인 비스트로와 오션뷰에서 열리는 소셜 다이닝',
    districts: [
      {
        name: '전포 · 서면',
        desc: '감각적인 내추럴 와인바와 셰프 비스트로',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: '해운대 마린시티',
        desc: '오션뷰 테라스와 품격 있는 프라이빗 다이닝',
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: '광안리',
        desc: '광안대교 야경과 편안한 캐주얼 펍 & 다이닝',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  seoul: {
    code: 'seoul',
    nameKr: '서울',
    nameEn: 'SEOUL',
    status: 'WAITLIST',
    tagline: '성수동 감성 와인바와 강남·한남동 프라이빗 다이닝 사전 오픈 준비중',
    districts: [
      {
        name: '성수 · 서울숲',
        desc: '크리에이티브 & IT 직군을 위한 감각적인 와인바',
        image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: '강남 · 신사',
        desc: '스타트업·전문직을 위한 세련된 프라이빗 라운지',
        image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: '한남 · 이태원',
        desc: '글로벌 감성과 조용한 대화가 어우러진 비스트로',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
};

export default function CityLandingPage() {
  const params = useParams();
  const router = useRouter();
  const cityKey = ((params?.city as string) || 'busan').toLowerCase();
  const city = CITIES_DATA[cityKey] || CITIES_DATA['busan'];

  const { currentUser, conditionalEvents, applyForConditionalEvent } = useNadoSoloEngine();
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // 서울 등 대기 도시용 사전 알림 신청 상태
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistDone, setWaitlistDone] = useState(false);

  const handleApplyClick = (evId = 'EVT_JEONPO_FRI') => {
    if (!currentUser) {
      router.push(`/auth?next=/${city.code}`);
      return;
    }
    const targetEv = conditionalEvents.find((e) => e.eventId === evId) || conditionalEvents[0];
    if (targetEv) {
      setCheckoutEvent({
        eventId: targetEv.eventId,
        title: targetEv.title.includes('부산') ? targetEv.title : `부산 ${targetEv.title}`,
        dateText: targetEv.dateText,
        priceKrw: targetEv.priceKrw || 30000,
        districtName: city.nameKr,
        mealNote: targetEv.mealNote,
      });
      setIsCheckoutOpen(true);
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistPhone.trim()) return;
    setWaitlistDone(true);
  };

  const handlePaymentSuccess = (eventId: string) => {
    applyForConditionalEvent(eventId);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#12151e] via-[#0e1017] to-[#090a0f] pt-14 pb-20 px-6">
        <div className="max-w-[1240px] mx-auto space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
            <span className={`w-2 h-2 rounded-full ${city.status === 'ACTIVE' ? 'bg-rose-500' : 'bg-zinc-500'}`} />
            <span className="font-semibold">
              {city.nameKr} ({city.nameEn}) • {city.status === 'ACTIVE' ? '현재 매주 금/토 접수중' : '사전 오픈 준비중'}
            </span>
          </div>

          <div className="space-y-4 max-w-3xl">
            <h1 className="font-serif-editorial text-4xl sm:text-6xl font-normal text-white tracking-tight leading-[1.15]">
              {city.nameKr}, 결이 맞는 사람들의<br />
              프라이빗 소셜 다이닝
            </h1>
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
              {city.tagline}. 끝없는 스와이프 대신, 서로를 배려하는 에티켓을 갖춘 3040 직장인 &amp; 5060 솔로들의 품격 있는 만남을 제안합니다.
            </p>
          </div>

          {city.status === 'ACTIVE' ? (
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleApplyClick('EVT_JEONPO_FRI')}
                className="px-8 py-3.5 rounded-xl border border-white/15 bg-white/10 hover:bg-[#f04f74] hover:border-[#f04f74] text-white hover:text-white text-base font-bold shadow-xl hover:shadow-[0_0_24px_rgba(240,79,116,0.45)] transition-all duration-300 cursor-pointer"
              >
                신청하기
              </button>
              <span className="text-xs text-zinc-400">
                🔒 장소는 D-1 목요일 19:00에 비공개 초대장으로 안내됩니다.
              </span>
            </div>
          ) : (
            <div className="pt-2 max-w-md">
              {waitlistDone ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-rose-500/40 text-rose-200 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-rose-400" />
                  <span>{city.nameKr} 오픈 알림 등록이 완료되었습니다.</span>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={waitlistPhone}
                      onChange={(e) => setWaitlistPhone(e.target.value)}
                      placeholder="휴대폰 번호 입력 (예: 010-1234-5678)"
                      required
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-md"
                    >
                      오픈 알림받기
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {city.nameKr} 오픈 시 초대 알림이 전달됩니다.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. CURATED DISTRICTS */}
      <section className="max-w-[1240px] mx-auto px-6 py-16 space-y-8 w-full">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
            CURATED DISTRICTS
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {city.nameKr} 엄선 상권 &amp; 파트너 베뉴
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            교통과 이동 동선, 대화의 몰입도를 극대화하는 프라이빗 룸과 라운지만을 엄선합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {city.districts.map((d) => (
            <div
              key={d.name}
              className="bg-[#12151e] rounded-3xl border border-white/10 overflow-hidden shadow-xl group hover:border-white/25 transition-all"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12151e] via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-white border border-white/10">
                  {d.name}
                </span>
              </div>
              <div className="p-6 space-y-2">
                <h4 className="text-lg font-bold text-white">{d.name}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 5대 매너 평가 시스템 안내 배너 */}
      <section className="max-w-[1240px] mx-auto px-6 w-full">
        <div className="bg-[#181c28] rounded-3xl p-8 sm:p-10 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-mono text-rose-400 font-bold uppercase">TRUST ASSURANCE</span>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              왜 나도솔로는 믿고 참석할 수 있을까요?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              직업이나 조건보다 중요한 것은 '사람의 태도와 매너'입니다. 나도솔로는 모임 후 동석자 5인의 다면 평가를 통해 검증된 품격 있는 싱글들만 참여하는 신뢰 네트워크를 유지합니다.
            </p>
          </div>
          <Link
            href="/#coaching-system"
            className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all shrink-0"
          >
            5대 매너 평가 매트릭스 보기 →
          </Link>
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

