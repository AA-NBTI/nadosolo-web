'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';

export default function DiningPage() {
  const router = useRouter();
  const { currentUser, conditionalEvents, applyForConditionalEvent, appliedEventIds } = useNadoSoloEngine();

  const handleApplyClick = (eventId?: string) => {
    const target = eventId ? `/dashboard?step=P05_EVENT_APPLY&eventId=${eventId}` : '/dashboard?step=P05_EVENT_APPLY';
    if (!currentUser) {
      router.push(`/auth?next=${encodeURIComponent(target)}`);
    } else {
      router.push(target);
    }
  };

  const diningEvents = conditionalEvents.filter(
    (ev) => ev.districtId === 'DIST_JEONPO' || ev.districtId === 'DIST_HAEUNDAE' || ev.districtId === 'DIST_GWANGAN'
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#12151e] pt-14 pb-18 px-6">
        <div className="max-w-[1240px] mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">홈</Link>
            <span>/</span>
            <span className="text-white font-medium">소셜 다이닝</span>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span>STEP 01 • 현재 접수중인 공식 앵커 프로그램</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              결이 맞는 6인과의<br />
              금요일 밤 시크릿 디너
            </h1>

            <p className="text-base text-zinc-300 leading-relaxed font-normal">
              끝없는 스와이프나 어색한 1:1 소개팅 대신, 성향과 삶의 결이 조화로운 6명이 마주 앉아 와인과 맛있는 음식을 나눕니다. 
              식당 장소는 참가자들의 동선을 고려하여 D-1 비공개로 개별 전달됩니다.
            </p>
          </div>

          {/* 주요 혜택 및 규칙 요약 바 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-[#181c28] p-4 rounded-xl border border-white/10 space-y-1">
              <span className="text-xs text-zinc-400">참가비 정책</span>
              <p className="text-base font-bold text-white">₩25,000 <span className="text-xs text-rose-300 font-normal">(얼리버드 ₩19,900)</span></p>
              <p className="text-[11px] text-zinc-400">디너 식대 및 주류는 현장 1/N 정산</p>
            </div>
            <div className="bg-[#181c28] p-4 rounded-xl border border-white/10 space-y-1">
              <span className="text-xs text-zinc-400">모임 일정 및 인원</span>
              <p className="text-base font-bold text-white">매주 금요일 19:30</p>
              <p className="text-[11px] text-zinc-400">성별 3:3 균형 큐레이션 (정원 6인)</p>
            </div>
            <div className="bg-[#181c28] p-4 rounded-xl border border-white/10 space-y-1">
              <span className="text-xs text-zinc-400">품격 보장</span>
              <p className="text-base font-bold text-white">5대 매너 평가 매트릭스</p>
              <p className="text-[11px] text-zinc-400">모임 후 동석자 상호 평판 피드백</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OPEN TABLES (현재 오픈된 테이블 목록) */}
      <section className="max-w-[1240px] mx-auto px-6 py-12 space-y-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
              SCHEDULED TABLES
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              이번 주 오픈 테이블
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              서면·전포 거점의 3045 프라임 및 5060 골든 솔로를 위한 검증된 테이블입니다.
            </p>
          </div>
          <span className="text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            부산 중심 집중 운영중
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {diningEvents.map((ev) => {
            const isApplied = appliedEventIds.includes(ev.eventId);
            return (
              <div
                key={ev.eventId}
                className="bg-[#12151e] rounded-3xl p-7 border border-white/10 space-y-5 hover:border-white/20 transition-all flex flex-col justify-between shadow-xl"
              >
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#181c28] text-white text-xs font-semibold border border-white/10">
                      부산 • 전포/서면
                    </span>
                    {ev.targetAgeGroup === '3045_PRIME' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 text-xs font-semibold border border-rose-500/25">
                        3045 프라임 트랙
                      </span>
                    )}
                    {ev.targetAgeGroup === '5060_GOLDEN' && (
                      <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700">
                        5060 골든 트랙
                      </span>
                    )}
                    <span className="text-xs text-zinc-400 font-medium">
                      {ev.dateText}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {ev.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    엄선된 비스트로/와인바에서 진행되며, 삶의 결이 맞는 동석자 6인이 편안하게 대화를 나눕니다.
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-xs text-zinc-400">
                    <span className="text-emerald-400">✓</span>
                    <span>식사 및 주류는 식당 현장에서 동행자들과 1/N 정산</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-zinc-400">참가권</span>
                    <p className="text-xl font-bold text-white">₩{ev.priceKrw.toLocaleString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyClick(ev.eventId)}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                      isApplied
                        ? 'bg-white/10 text-zinc-400 border border-white/10 cursor-not-allowed'
                        : 'bg-[#881337] hover:bg-[#6f102d] text-white shadow-lg shadow-[#881337]/30'
                    }`}
                  >
                    {isApplied ? '신청 완료' : '테이블 신청하기'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. PARTICIPATION GUIDE */}
      <section className="max-w-[1240px] mx-auto px-6 py-10 w-full">
        <div className="bg-[#12151e] rounded-3xl p-8 sm:p-10 border border-white/10 space-y-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
              DINING PROTOCOL
            </span>
            <h2 className="text-2xl font-bold text-white">
              소셜 다이닝 진행 가이드
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
            <div className="space-y-2">
              <span className="text-rose-400 font-mono font-bold text-sm">STEP 1</span>
              <h4 className="text-base font-semibold text-white">참가권 신청</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                희망하는 일정과 나이대 트랙을 선택하고 가볍게 참가권을 결제합니다.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-rose-400 font-mono font-bold text-sm">STEP 2</span>
              <h4 className="text-base font-semibold text-white">D-1 장소 안내</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                모임 하루 전, 참가자들의 성향과 동선을 고려한 분위기 좋은 식당 예약명을 문자로 받습니다.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-rose-400 font-mono font-bold text-sm">STEP 3</span>
              <h4 className="text-base font-semibold text-white">디너 &amp; 1/N 정산</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                금요일 저녁 7시 30분, 테이블 동석자들과 맛있는 음식을 시켜 먹고 식대는 각자 부담 없이 계산합니다.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-rose-400 font-mono font-bold text-sm">STEP 4</span>
              <h4 className="text-base font-semibold text-white">매너 평가 리포트</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                모임 종료 후 밤 10시, 서로에게 익명 매너 뱃지를 선물하고 시크릿 호감을 전달합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

