'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Users, 
  Sparkles, 
  CalendarCheck, 
  CreditCard, 
  Lock, 
  HelpCircle,
  MessageSquare,
  Wine,
  UserCheck
} from 'lucide-react';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import { useNadoSoloEngine } from '@/engine';
import { useRouter } from 'next/navigation';

export default function GuidePage() {
  const router = useRouter();
  const { currentUser, conditionalEvents, applyForConditionalEvent } = useNadoSoloEngine();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);

  const handleApplyClick = () => {
    if (!currentUser) {
      router.push('/auth?next=/guide');
      return;
    }
    const targetEv = conditionalEvents[0];
    if (targetEv) {
      setCheckoutEvent({
        eventId: targetEv.eventId,
        title: targetEv.title,
        dateText: targetEv.dateText,
        priceKrw: 30000,
        districtName: '부산',
        mealNote: targetEv.mealNote,
      });
      setIsCheckoutOpen(true);
    }
  };

  const handlePaymentSuccess = (eventId: string) => {
    applyForConditionalEvent(eventId);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-24">
      
      {/* ==============================================================
          1. 헤더 히어로: 시스템 파이프라인 선언
          ============================================================== */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 max-w-[1240px] mx-auto w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
          <span className="font-semibold tracking-wide">SYSTEM ARCHITECTURE &amp; PROCESS</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-serif-editorial">
          오프라인 소셜 다이닝 기반<br />
          <span className="text-[#f04f74]">다면 소셜 관찰 및 메타인지 피드백 시스템</span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
          데이터 기반 큐레이션 테이블에서 식사와 대화를 나누고, 
          동석자 상호 관찰을 통해 나의 소통 역량과 매너를 정규화 리포트로 발견하는 4단계 프로세스입니다.
        </p>

        {/* 시스템 4대 프로세스 파이프라인 */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 text-left">
          <div className="p-5 rounded-2xl bg-[#12151e] border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#f04f74]/15 text-[#f04f74] flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h4 className="text-base font-bold text-white">테이블 큐레이션</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              연령대, 성향, 관심사 데이터를 분석하여 최적의 대화 밸런스 테이블을 편성합니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151e] border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#f04f74]/15 text-[#f04f74] flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h4 className="text-base font-bold text-white">플레이북 다이닝</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              대화카드 키트와 유연한 진행 플레이북을 통해 대화 독점 없는 오프라인 교류를 진행합니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151e] border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#f04f74]/15 text-[#f04f74] flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h4 className="text-base font-bold text-white">단일 명사 다면 관찰</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              익일 09시 동석자 상호 간 5대 순수 단일 명사 1:1 관찰 평가를 진행합니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151e] border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#f04f74]/15 text-[#f04f74] flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h4 className="text-base font-bold text-white">상호주의 리포트</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              전원 평가 완료 시 100점 정규화 리포트 및 전주기 품질 감사 점수가 즉시 잠금 해제됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* ==============================================================
          2. 이용자 체험 순서 (Step-by-Step Experience Flow)
          ============================================================== */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-16 w-full space-y-12">
        <div className="border-b border-white/10 pb-6 text-center sm:text-left">
          <span className="text-xs uppercase tracking-widest text-[#f04f74] font-semibold">PROCESS TIMELINE</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            이용자 체험 프로세스 &amp; 시스템 제공 내역
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            참가 신청부터 모임 종료 및 사후 케어까지, 이용자가 경험하는 여정과 시스템 지원 내용입니다.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* STEP 1 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#12151e] border border-white/10 flex flex-col md:flex-row gap-6 items-start">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#f04f74] font-extrabold text-xl">
              1
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-white">
                  참가 신청 및 큐레이션 데이터 등록
                </h3>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
                  온라인 시스템 (D-Day 이전)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                이용자는 원하는 일정(금/토)과 트랙(3040 / 5060)을 선택하고, 간단한 라이프스타일 취향, 관심사, 식이성향(못 먹는 음식/와인 취향)을 입력합니다.
              </p>
              
              <div className="p-4 rounded-xl bg-[#090a0f] border border-white/5 space-y-2 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200 block">💡 시스템 제공 서비스:</span>
                <p>• 나도솔로 그룹핑 엔진이 참여자 간 성향 밸런스를 분석하여 최적의 테이블을 사전 편성합니다.</p>
                <p>• 엄선된 파트너 식당(프라이빗 룸 또는 단독 라운지)의 좌석 예약을 시스템이 자동으로 완료합니다.</p>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#12151e] border border-white/10 flex flex-col md:flex-row gap-6 items-start">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#f04f74] font-extrabold text-xl">
              2
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-white">
                  D-1 프라이빗 공간 및 좌석 비공개 안내
                </h3>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
                  알림톡 &amp; 마이페이지 (D-1 목요일 19:00)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                모임 전날 저녁, 확정된 식당의 정확한 위치와 이동 동선, 지정 테이블 및 본인의 착석 좌석 번호가 카카오톡 알림톡과 대시보드로 비공개 전달됩니다.
              </p>
              
              <div className="p-4 rounded-xl bg-[#090a0f] border border-white/5 space-y-2 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200 block">💡 시스템 제공 서비스:</span>
                <p>• 장소 외부 유출 및 불필요한 노출을 막아 참가자들의 프라이버시를 안전하게 보호합니다.</p>
                <p>• 당일 결원(노쇼) 발생 시 대기자를 즉시 매칭하는 노쇼 백업 알고리즘이 가동됩니다.</p>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#12151e] border border-white/10 flex flex-col md:flex-row gap-6 items-start">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#f04f74] font-extrabold text-xl">
              3
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-white">
                  D-Day 가변 타임라인 소셜 다이닝 진행 (오프라인 현장)
                </h3>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
                  오프라인 현장 (금/토 저녁)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                식당에 도착하면 사전 배정된 프라이빗 좌석에 착석합니다. 모바일 대시보드로 제공되는 **단계별 진행 플레이북**과 **대화 키트**에 따라 유연한 호흡으로 대화를 이어갑니다.
              </p>
              
              {/* 유연한 진행 4단계 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#090a0f] border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <Clock className="w-3.5 h-3.5 text-[#f04f74]" />
                    <span>초반부: 웰컴 &amp; 아이스브레이킹</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">대화카드를 뽑아 가벼운 취향과 일상 질문으로 첫 어색함을 자연스럽게 해소합니다.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090a0f] border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <Wine className="w-3.5 h-3.5 text-[#f04f74]" />
                    <span>중반부: 셰프 디너 &amp; 딥토크</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">요리와 와인을 즐기며 커리어, 가치관, 라이프스타일 대화를 나눕니다.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090a0f] border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <Users className="w-3.5 h-3.5 text-[#f04f74]" />
                    <span>전환기: 하프타임 좌석 로테이션</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">특정인 대화 독점을 방지하고 모든 참가자와 골고루 대화하도록 좌석을 전환합니다.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090a0f] border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <CreditCard className="w-3.5 h-3.5 text-[#f04f74]" />
                    <span>후반부: 마무리 &amp; 식대 1/N 정산</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">식사 및 음료비는 식당 카운터에서 참가자들이 투명하게 1/N 실비 정산합니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#12151e] border border-white/10 flex flex-col md:flex-row gap-6 items-start">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#f04f74] font-extrabold text-xl">
              4
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-white">
                  익일 09시 다면 관찰 평가 &amp; 상호주의 리포트 해금
                </h3>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
                  온라인 시스템 (모임 다음 날 오전 09:00)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                모임 익일, 동석자들에 대한 단일 명사 관찰 평가를 진행합니다. **상호주의 해금 원칙**에 따라 본인이 동석자 전원 평가를 100% 완료해야만 동석자들이 나를 관찰한 내 소셜 리포트가 잠금 해제되며, 쌍방이 모두 동의한 경우에만 시스템을 통해 연락처가 안전하게 전달됩니다.
              </p>
              
              <div className="p-4 rounded-xl bg-[#090a0f] border border-white/5 space-y-2 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200 block">💡 시스템 제공 서비스:</span>
                <p>• 단일 명사 1요소 1기준 관찰 엔진을 기반으로 개인 소셜 분석 리포트가 정규화되어 발행됩니다.</p>
                <p>• 사람 평가뿐만 아니라 식당 공간, 식사 미식, 진행 프로세스 전주기 점검 감사 리포트가 함께 집계됩니다.</p>
                <p>• 무단 노쇼, 비매너 행위자는 시스템에서 영구 제명(원아웃제) 처리되어 다음 모임 참여가 제한됩니다.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==============================================================
          3. 참가권 ₩30,000 결제 내역과 식대 정산의 명확한 분리 (PG 심사 핵심)
          ============================================================== */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="bg-[#12151e] rounded-3xl p-8 sm:p-10 border border-white/10 space-y-8">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs uppercase tracking-widest text-[#f04f74] font-semibold">PRICING &amp; SETTLEMENT</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              참가권 ₩30,000의 서비스 대가와 식대 분리 원칙
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              나도솔로는 온라인 분석 리포트 라이선스와 오프라인 실비 식대를 철저히 분리하여 투명하게 운영합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 좌측: 나도솔로 온라인 결제 (₩30,000) */}
            <div className="p-6 rounded-2xl bg-[#181c28] border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-zinc-300">나도솔로 온라인 결제</span>
                <span className="text-xl font-bold text-[#f04f74]">₩30,000</span>
              </div>
              <h4 className="text-base font-bold text-white">소셜 분석 엔진 라이선스 &amp; 리포트 발행비</h4>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f04f74] shrink-0 mt-0.5" />
                  <span><strong>타깃별 다면 소셜 관찰 엔진 라이선스</strong>: 결이 맞는 테이블 큐레이션 편성</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f04f74] shrink-0 mt-0.5" />
                  <span><strong>개인 소셜 분석 리포트 발행</strong>: 100점 정규화 메타인지 분석 리포트 제공</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f04f74] shrink-0 mt-0.5" />
                  <span><strong>전주기 품질 감사 엔진 (공간 · 식사 · 진행)</strong>: 엄선된 식당 단독 룸 좌석 확보 및 점검 감리</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f04f74] shrink-0 mt-0.5" />
                  <span><strong>상호주의 안전망 &amp; 비매너 원아웃 케어</strong>: 결원 시 백업 매칭 및 비매너 영구 퇴출 관리</span>
                </li>
              </ul>
            </div>

            {/* 우측: 식당 현장 결제 (식대 1/N) */}
            <div className="p-6 rounded-2xl bg-[#181c28] border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-zinc-300">식당 현장 결제</span>
                <span className="text-xl font-bold text-white">매장 현장 1/N</span>
              </div>
              <h4 className="text-base font-bold text-white">식음료 및 주류 실비 정산</h4>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong>실제 주문 메뉴만 결제</strong>: 당일 매장에서 주문한 식사 및 와인/음료 비용</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong>식당 카운터 직접 결제</strong>: 모임 종료 시 동석자들과 테이블 1/N로 나누어 식당에 직접 카드 결제</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span><strong>투명한 정산</strong>: 나도솔로는 식음료 대금을 일절 수취하거나 관여하지 않습니다.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ==============================================================
          4. 자주 묻는 질문 (FAQ)
          ============================================================== */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-12 w-full space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#f04f74]" />
            <span>자주 묻는 질문</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#12151e] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">Q. 일반 데이팅 서비스와 시스템 구조가 어떻게 다른가요?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              단순 프로필 사진 열람이나 일회성 매칭이 아닌, 엄선된 식당 환경에서의 실제 테이블 대화 관찰 데이터를 기반으로 나의 소통 역량과 강점을 리포트로 산출하는 메타인지 피드백 시스템입니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151e] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">Q. 식당 환경이나 음식 품질은 어떻게 관리되나요?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              공간 품질(공간, 소음, 조명, 위생, 친절), 식사 미식(맛, 온도, 구성, 음료, 비용), 진행 프로세스(안내, 좌석, 카드, 이동, 정산)의 전주기 품질 감사 엔진을 통해 엄격한 기준을 충족한 식당만 파트너로 유지됩니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151e] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">Q. 혼자 참석해도 어색하지 않나요?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              참가자 100%가 혼자 신청하여 참석합니다. 모바일 대시보드로 제공되는 단계별 대화카드 키트가 있어 침묵 없이 누구나 편안하게 대화에 몰입할 수 있습니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151e] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">Q. 모임 최소 인원이 미달되면 어떻게 되나요?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              성향 및 인원 밸런스가 충족되지 않아 모임이 성사되지 않을 경우, 결제하신 참가권 ₩30,000은 **취소 수수료 없이 100% 자동 전액 환불**됩니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151e] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">Q. 모임 취소 및 환불 기준은 어떻게 되나요?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              모임 3일 전(수요일 23:59)까지는 100% 전액 환불되며, 모임 2일 전 50%, 전일 및 당일은 식당 예약 확정 및 테이블 세팅으로 인해 환불이 불가합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ==============================================================
          5. 신청 CTA 배너
          ============================================================== */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-6 w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#181c28] via-[#12151e] to-[#181c28] border border-white/15 text-center space-y-6 shadow-2xl">
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif-editorial">
              부산 소셜 다이닝 프로그램 참가 신청
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              매주 금요일·토요일 19:30, 검증된 사람들과 함께하는 특별한 저녁 시간을 경험하세요.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleApplyClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#f04f74] hover:bg-[#d93f63] text-white text-base font-bold shadow-xl transition-all cursor-pointer"
            >
              신청하기 (₩30,000)
            </button>
            <Link
              href="/dining"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white text-sm font-semibold transition-all"
            >
              다이닝 프로그램 안내
            </Link>
          </div>
        </div>
      </section>

      {/* 결제 모달 연동 */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={checkoutEvent}
        onSuccessPayment={handlePaymentSuccess}
      />

    </div>
  );
}

