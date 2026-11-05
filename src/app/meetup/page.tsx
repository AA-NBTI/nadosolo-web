'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import { Sparkles, Calendar, MapPin, Users, HeartHandshake, ShieldCheck, ArrowRight, CheckCircle2, Ticket, MessageSquare, GlassWater } from 'lucide-react';

const MEETUP_STEPS = [
  {
    step: '01',
    title: '세대별 테마 밋업 선택',
    desc: '3045 프라임 또는 5060 골든 등 본인의 연령대와 관심사에 맞춘 테마 모임을 선택하고 신청합니다.',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    icon: Ticket,
  },
  {
    step: '02',
    title: '신원 확인 & 남녀 1:1 성비 배정',
    desc: '철저한 신원 확인과 매너 검증을 통과한 멤버들로 남녀 1:1 정확한 성비를 맞춰 소수정예로 확정됩니다.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    icon: ShieldCheck,
  },
  {
    step: '03',
    title: '루프탑 라운지 웰컴 파티',
    desc: '웰컴 샴페인과 감각적인 핑거푸드를 즐기며 편안한 음악 속에서 새로운 사람들과 자연스럽게 인사를 나눕니다.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    icon: GlassWater,
  },
  {
    step: '04',
    title: '익일 아침 시크릿 호감 투표',
    desc: '모임 다음 날 오전 9시, 대시보드에서 호감 투표를 진행하며 상호 매칭 시 1:1 프라이빗 연락처가 오픈됩니다.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80',
    icon: HeartHandshake,
  },
];

const SPECIAL_EVENTS = [
  {
    id: 'EVT_PRIME_NIGHT_01',
    generation: '3045 PRIME',
    badgeColor: 'border-rose-500/30 bg-rose-500/20 text-rose-300',
    title: '부산 3045 프라임 커리어 & 와인 나이트',
    date: '매월 둘째 주 금요일 19:30',
    location: '서면·전포 루프탑 프라이빗 라운지',
    capacity: '정원 12명 (남6 : 여6 엄선)',
    target: '30~45세 일반 직장인 및 사업가 누구나',
    desc: '자신의 일과 삶을 사랑하는 3045 싱글들을 위한 교류 파티. 편안한 웰컴 와인과 핑거푸드를 곁들이며 새로운 인맥과 설레는 인연을 만납니다.',
    priceKrw: 35000,
    districtName: '부산 · 전포/서면',
    mealNote: '웰컴 드링크 1잔 포함, 추가 주류 및 안주는 현장 1/N 정산',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'EVT_GOLDEN_SALON_02',
    generation: '5060 GOLDEN',
    badgeColor: 'border-amber-500/30 bg-amber-500/20 text-amber-300',
    title: '5060 골든 솔로 품격 라이프스타일 살롱',
    date: '매월 셋째 주 토요일 17:30',
    location: '해운대 마린시티 오션뷰 비스트로',
    capacity: '정원 10명 (남5 : 여5 엄선)',
    target: '50~60대 비혼·돌싱·사별 솔로 (신원 검증 완료자)',
    desc: '인생 후반전의 지혜와 취향을 함께 나눌 수 있는 든든한 동반자를 위한 안심 모임. 클래식한 음악과 품격 있는 다이닝 속에서 진솔한 대화를 나눕니다.',
    priceKrw: 45000,
    districtName: '부산 · 해운대 마린시티',
    mealNote: '웰컴 와인 페어링 1잔 포함, 디너 코스 식대는 현장 1/N 정산',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
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
    setBookedFeedback('테마 밋업 결제 및 신청이 완료되었습니다! D-3에 참석 안내가 개별 전달됩니다.');
    setTimeout(() => setBookedFeedback(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-20">
      
      {/* ==============================================================
          1. HERO SECTION
          ============================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#151221] via-[#0d0e14] to-[#090a0f] pt-16 pb-20 px-4 sm:px-6 border-b border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[350px] bg-emerald-950/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>STEP 04 • 월 2~4회 한정 스페셜 테마 밋업</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              엄선된 소수를 위한<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-rose-300 to-amber-200">
                세대별 테마 밋업
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal max-w-xl">
              자주 열리지 않기에 더욱 특별합니다. 나도솔로는 무리한 대량 모객 대신, 
              월 2~4회의 제한된 인원만을 엄선하여 참가자의 신뢰와 품격을 철저히 관리합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-400">참가 인원</span>
                <p className="text-sm font-bold text-white">10~12인 소수정예</p>
                <p className="text-[10px] text-zinc-500">남녀 정확한 1:1 성비</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-400">개최 주기</span>
                <p className="text-sm font-bold text-emerald-300">월 2~4회 한정</p>
                <p className="text-[10px] text-zinc-500">사전 신청자 선착순 심사</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-400">장소 특권</span>
                <p className="text-sm font-bold text-white">루프탑 &amp; 오션뷰</p>
                <p className="text-[10px] text-zinc-500">프라이빗 대관 공간</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80"
                alt="테마 밋업 무드"
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-600/90 text-white">
                  Theme Meetup
                </span>
                <p className="text-sm font-bold text-white mt-1">특별한 공간에서 시작되는 새로운 만남</p>
                <p className="text-xs text-zinc-300">와인과 샴페인, 그리고 어쿠스틱 라이브</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          2. 모임 여정 4단계 비주얼 카드
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 w-full border-b border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <p className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">Meetup Flow</p>
          <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white">
            테마 밋업 4단계 진행 방식
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            신원 확인부터 익일 시크릿 매너 투표까지 안심하고 참여할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {MEETUP_STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-emerald-500/30 transition-all group"
              >
                <div className="relative h-36 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-serif-editorial font-bold text-[11px]">
                      STEP {s.step}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-4 h-4 text-emerald-400" />
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
          3. 테마 밋업 카드 목록
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 space-y-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Live Schedules
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              현재 모집 중인 테마 밋업
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            정원 마감 시 조기 종료됩니다.
          </p>
        </div>

        {bookedFeedback && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{bookedFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SPECIAL_EVENTS.map((ev) => (
            <div
              key={ev.id}
              className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                <img
                  src={ev.image}
                  alt={ev.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${ev.badgeColor}`}>
                    {ev.generation}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between space-y-5">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{ev.title}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
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
                    <div className="flex justify-between text-zinc-400">
                      <span>참가비</span>
                      <span className="text-emerald-300 font-bold">₩{ev.priceKrw.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleApplyClick(ev)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-semibold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>테마 밋업 신청하기 (₩{ev.priceKrw.toLocaleString()})</span>
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
