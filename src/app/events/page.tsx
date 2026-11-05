'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';

export default function EventsPage() {
  const router = useRouter();
  const { currentUser } = useNadoSoloEngine();
  const [bookedEvent, setBookedEvent] = useState<string | null>(null);

  const specialEvents = [
    {
      id: 'EVT_PRIME_NIGHT_01',
      generation: '3045 PRIME',
      badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      title: '부산 3045 프라임 커리어 &amp; 와인 나이트',
      date: '매월 둘째 주 금요일 19:30',
      location: '서면·전포 루프탑 프라이빗 라운지',
      capacity: '정원 12명 (남6 : 여6 엄선)',
      target: '30~45세 일반 직장인 및 사업가 누구나',
      desc: '자신의 일과 삶을 사랑하는 3045 싱글들을 위한 교류 파티. 편안한 웰컴 와인과 핑거푸드를 곁들이며 새로운 인맥과 설레는 인연을 만납니다.',
      price: '₩35,000 (웰컴 드링크 포함 / 추가 식음료 1/N)',
    },
    {
      id: 'EVT_GOLDEN_SALON_02',
      generation: '5060 GOLDEN',
      badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      title: '5060 골든 솔로 품격 라이프스타일 살롱',
      date: '매월 셋째 주 토요일 17:30',
      location: '해운대 마린시티 오션뷰 비스트로',
      capacity: '정원 10명 (남5 : 여5 엄선)',
      target: '50~60대 비혼·돌싱·사별 솔로 (신원 검증 완료자)',
      desc: '인생 후반전의 지혜와 취향을 함께 나눌 수 있는 든든한 동반자를 위한 안심 모임. 클래식한 음악과 품격 있는 다이닝 속에서 진솔한 대화를 나눕니다.',
      price: '₩45,000 (웰컴 와인 페어링 포함 / 식대 1/N)',
    },
  ];

  const handleBooking = (eventId: string) => {
    if (!currentUser) {
      router.push(`/auth?next=/events`);
      return;
    }
    setBookedEvent(eventId);
    setTimeout(() => setBookedEvent(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#12151e] pt-14 pb-18 px-6">
        <div className="max-w-[1240px] mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">홈</Link>
            <span>/</span>
            <span className="text-white font-medium">프라이빗 이벤트</span>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>STEP 04 • 한 달 2~4회 한정 프리미엄 특별 행사</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              엄선된 소수를 위한<br />
              세대별 시크릿 살롱 파티
            </h1>

            <p className="text-base text-zinc-300 leading-relaxed font-normal">
              자주 열리지 않기에 더욱 특별합니다. 나도솔로는 무리한 대량 모객 대신, 
              <strong>월 2~4회의 제한된 인원만을 엄선하여 참가자의 신뢰와 품격을 철저히 관리</strong>합니다.
              나의 세대와 가치관에 꼭 맞는 특별한 자리에 신청하세요.
            </p>
          </div>
        </div>
      </section>

      {/* 2. SPECIAL EVENTS */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 space-y-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
              EXCLUSIVE EVENTS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              이번 달 예정된 특별 행사
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              정원 마감 시 조기 마감되며, 매너 프로파일 점수와 신청 순서에 따라 참석이 확정됩니다.
            </p>
          </div>
          <span className="text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            사전 신청 접수중
          </span>
        </div>

        {bookedEvent && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm font-medium">
            ✓ 특별 행사 참가 신청이 완료되었습니다! 관리자 매너 프로파일 검토 후 D-3 확정 안내 문자가 발송됩니다.
          </div>
        )}

        <div className="space-y-6">
          {specialEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-[#12151e] rounded-3xl p-8 sm:p-10 border border-white/10 hover:border-white/20 transition-all space-y-6 shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ev.badgeColor}`}>
                  {ev.generation}
                </span>
                <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {ev.date}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-white" dangerouslySetInnerHTML={{ __html: ev.title }} />
                <p className="text-sm text-zinc-400">
                  {ev.location} • <strong className="text-white">{ev.capacity}</strong>
                </p>
              </div>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
                {ev.desc}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <div>
                  <span className="text-xs text-zinc-400 block">참가 티켓</span>
                  <p className="text-xl font-bold text-white">{ev.price}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleBooking(ev.id)}
                  className="px-7 py-3.5 rounded-xl text-sm font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition-all cursor-pointer shadow-lg"
                >
                  특별 행사 신청하기
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. QUALITY PHILOSOPHY */}
      <section className="max-w-[1240px] mx-auto px-6 py-6 w-full">
        <div className="bg-[#181c28] rounded-3xl p-8 border border-white/10 space-y-3 text-center sm:text-left">
          <h4 className="text-lg font-bold text-white">
            왜 한 달에 2~4회만 제한적으로 열릴까요?
          </h4>
          <p className="text-sm text-zinc-300 leading-relaxed">
            나도솔로는 영리 목적의 무분별한 대량 행사로 참가자의 물을 흐리지 않습니다. 
            참가자 한 분 한 분의 프로필과 성향, 매너를 꼼꼼하게 검토하여 가장 조화롭고 설레는 6인~12인을 맞추기 위한 
            <strong>품질 관리(Quality Assurance)</strong> 원칙입니다.
          </p>
        </div>
      </section>
    </div>
  );
}

