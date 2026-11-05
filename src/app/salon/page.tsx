'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import { Wine, MapPin, HeartHandshake, MessageCircle, GlassWater } from 'lucide-react';

const SALON_STEPS = [
  {
    step: '01',
    title: '테마 발제 및 웰컴 드링크',
    desc: '살롱 시작 전, 와인·인문학 관련 가벼운 생각거리가 제시되며 웰컴 스파클링과 함께 여유롭게 착석합니다.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    icon: GlassWater,
  },
  {
    step: '02',
    title: '라운드 테이블 딥 토크',
    desc: '독점하지 않고 경청하는 에티켓을 바탕으로, 서로의 삶의 가치관과 취향에 대해 깊이 있는 이야기를 나눕니다.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80',
    icon: MessageCircle,
  },
  {
    step: '03',
    title: '핑거푸드 & 와인 페어링',
    desc: '소믈리에가 선정한 와인과 감각적인 핑거푸드를 곁들이며 테이블의 온도를 자연스럽게 높여갑니다.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    icon: Wine,
  },
  {
    step: '04',
    title: '익일 상호 호감 투표',
    desc: '다음 날 오전 9시, 대화의 결이 가장 잘 맞았던 상대방에게 비공개로 호감을 표하고 1:1 연락처를 교환합니다.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    icon: HeartHandshake,
  },
];

const SALON_VENUES = [
  {
    name: '전포 북 & 와인 살롱 아틀리에',
    location: '부산 전포 카페거리',
    atmosphere: '서재 감성 프라이빗 라운지',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: '해운대 마린뷰 살롱 드 테',
    location: '부산 해운대 마린시티',
    atmosphere: '오션 파노라마 야경 & 캔들',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: '남포 헤리티지 소셜 클럽',
    location: '부산 중구 남포동',
    atmosphere: '클래식 빈티지 우드 인테리어',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
  },
];

export default function SocialSalonPage() {
  const router = useRouter();
  const { currentUser, applyForConditionalEvent } = useNadoSoloEngine();
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleApplyClick = (trackName = '3045 프라임 살롱') => {
    if (!currentUser) {
      router.push(`/auth?next=/salon`);
      return;
    }
    setCheckoutEvent({
      eventId: 'EVT_SALON_FRI',
      title: `부산 전포 소셜 살롱 (${trackName})`,
      dateText: '매주 금요일 19:30',
      priceKrw: 25000,
      districtName: '부산 · 전포 사교 살롱',
      mealNote: '웰컴 음료 및 핑거푸드 포함, 추가 주류는 현장 1/N 정산',
    });
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (eventId: string) => {
    applyForConditionalEvent(eventId);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-20">
      
      {/* ==============================================================
          1. HERO SECTION (모노크롬 & 와인레드)
          ============================================================== */}
      <section className="relative overflow-hidden bg-[#090a0f] pt-16 pb-20 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>소셜 살롱 • 취향과 가치관 중심의 사교</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              피상적인 잡담 대신,<br />
              삶의 결이 맞는 대화
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal max-w-xl">
              어색하고 목적이 불분명한 번개 모임 대신, 서로를 배려하는 에티켓과 대화의 결을 갖춘 
              솔로들이 엄선된 라운지에서 취향과 철학을 나누는 품격 있는 사교 살롱입니다.
            </p>

            {/* 신청 버튼: 간결화 */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleApplyClick('3045 프라임 살롱')}
                className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm sm:text-base transition-colors cursor-pointer"
              >
                신청하기
              </button>
            </div>

            {/* 핵심 정책 요약 바 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-500">참가비</span>
                <p className="text-sm font-bold text-white">₩25,000</p>
                <p className="text-[10px] text-zinc-500">웰컴 드링크 & 페어링 푸드</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-500">참여 정원</span>
                <p className="text-sm font-bold text-white">4~6인 소규모</p>
                <p className="text-[10px] text-zinc-500">성별 밸런스 큐레이션</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-500">대화 분위기</span>
                <p className="text-sm font-bold text-white">경청 & 매너</p>
                <p className="text-[10px] text-zinc-500">대화 독점 금지 룰 준수</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80"
                alt="소셜 살롱 무드"
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-600 text-white">
                  Social Salon
                </span>
                <p className="text-sm font-bold text-white mt-1">지적인 교류와 감성적인 휴식</p>
                <p className="text-xs text-zinc-300">와인 글라스를 기울이며 나누는 인생의 이야기</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          2. 모임 여정 4단계 비주얼 카드
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 w-full border-b border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Salon Flow</p>
          <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white">
            소셜 살롱 4단계 진행 방식
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            주제 발제부터 1:1 시크릿 피드백까지 편안하게 빠져드는 살롱의 흐름입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {SALON_STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-white/20 transition-all group"
              >
                <div className="relative h-36 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-serif-editorial font-bold text-[11px]">
                      STEP {s.step}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-4 h-4 text-rose-500" />
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed flex-1">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==============================================================
          3. 트랙 안내 (3045 & 5060)
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 space-y-8 w-full border-b border-white/10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Track Selection</span>
          <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white">
            세대별 2대 살롱 트랙
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* 트랙 1 */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-white/20 transition-all">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-zinc-300 border border-white/10 inline-block">
                3045 PRIME
              </span>
              <h3 className="text-xl font-bold text-white">3045 프라임 살롱</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                커리어와 일상의 밸런스, 취미와 인문학을 넘나드는 세련된 사교의 장입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleApplyClick('3045 프라임 살롱')}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              신청하기
            </button>
          </div>

          {/* 트랙 2 */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-white/20 transition-all">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-zinc-300 border border-white/10 inline-block">
                5060 GOLDEN
              </span>
              <h3 className="text-xl font-bold text-white">5060 골든 살롱</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                삶의 연륜과 취향이 깊어진 싱글들을 위한 우아한 문화·예술 살롱입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleApplyClick('5060 골든 살롱')}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              신청하기
            </button>
          </div>
        </div>
      </section>

      {/* ==============================================================
          4. 제휴 베뉴 갤러리
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
              Salon Spaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              소셜 살롱 파트너 공간
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            조용한 라운지, 독립된 와인 룸, 은은한 음악이 흐르는 감성 공간을 배정합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {SALON_VENUES.map((v, i) => (
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
                <span className="text-zinc-300 font-medium">특징:</span> {v.atmosphere}
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
