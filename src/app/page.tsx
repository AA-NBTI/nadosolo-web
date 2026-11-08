'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import CitySwitcherModal from '@/components/CitySwitcherModal';
import {
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Wine,
  Sparkles,
  Users,
  CreditCard,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface DiningTableItem {
  id: string;
  title: string;
  district: string;
  districtKey: 'all' | 'jeonpo' | 'haeundae' | 'seomyeon' | 'gwangan';
  districtLabel: string;
  venueName: string;
  theme: string;
  themeKey: 'all' | 'golden' | 'career' | 'wine';
  dayKey: 'all' | 'fri' | 'sat' | 'sun';
  schedule: string;
  status: string;
  isUrgent?: boolean;
  image: string;
  description: string;
  tags: string[];
}

const DINING_TABLES: DiningTableItem[] = [
  {
    id: 'EVT_BUSAN_JEONPO_FRI',
    title: '금요 프라이빗 내추럴 와인 & 셰프 디너',
    district: 'BUSAN JEONPO',
    districtKey: 'jeonpo',
    districtLabel: '부산 전포',
    venueName: '비스트로 아틀리에 (전포 살롱 단독 대관)',
    theme: '5060 골든 & 와인 페어링',
    themeKey: 'golden',
    dayKey: 'fri',
    schedule: '매주 금요일 19:30',
    status: '여성 1석 잔여',
    isUrgent: true,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
    description: '소음과 외부 시선이 차단된 프라이빗 룸에서 제철 재료로 빚어낸 셰프의 시그니처 코스와 엄선된 와인을 즐깁니다.',
    tags: ['3:3 엄선 큐레이션', '단독 룸 대관', '소셜 리포트 발행'],
  },
  {
    id: 'EVT_BUSAN_HAEUNDAE_SAT',
    title: '토요 해운대 오션 테라스 코스 페어링',
    district: 'HAEUNDAE MARINE CITY',
    districtKey: 'haeundae',
    districtLabel: '해운대 마린시티',
    venueName: '오션 스위트 다이닝 (마린시티)',
    theme: '5060 골든 트랙 파인다이닝',
    themeKey: 'golden',
    dayKey: 'sat',
    schedule: '매주 토요일 19:30',
    status: '여성 2석 잔여',
    isUrgent: false,
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=85',
    description: '해운대 밤바다의 야경이 내려다보이는 독립된 스위트 룸에서 7코스 파인다이닝과 지적인 대화를 나눕니다.',
    tags: ['5060 골든 트랙', '소믈리에 페어링', '상호주의 매너 서약'],
  },
  {
    id: 'EVT_BUSAN_SEOMYEON_SUN',
    title: '주말 갈라 프라이빗 아카이브 다이닝',
    district: 'BUSAN SEOMYEON',
    districtKey: 'seomyeon',
    districtLabel: '부산 서면',
    venueName: '까사 아카이브 살롱 (서면 프라이빗 룸)',
    theme: '3040 커리어 & 라이프스타일',
    themeKey: 'career',
    dayKey: 'sun',
    schedule: '격주 일요일 18:30',
    status: '사전 인비테이션 접수중',
    isUrgent: false,
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=85',
    description: '조도와 음향까지 섬세하게 튜닝된 공간에서 준비된 플레이북 카드와 함께 서로의 취향과 삶의 궤적을 발견합니다.',
    tags: ['대화 플레이북 키트', '100% 에티켓 검증', '테이블 1/N 실비 정산'],
  },
  {
    id: 'EVT_BUSAN_GWANGAN_SAT',
    title: '광안리 비치사이드 선셋 샴페인 다이닝',
    district: 'GWANGAN BEACH',
    districtKey: 'gwangan',
    districtLabel: '부산 광안리',
    venueName: '루프탑 테라스 룸 (광안리 오션라인)',
    theme: '샴페인 & 씨푸드 페어링',
    themeKey: 'wine',
    dayKey: 'sat',
    schedule: '매주 토요일 18:00',
    status: '남성 1석 잔여',
    isUrgent: true,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
    description: '광안대교의 일몰을 배경으로 샴페인과 제철 해산물 요리를 즐기며 여유로운 주말 저녁을 마주합니다.',
    tags: ['오션뷰 단독 테라스', '샴페인 페어링', '매너 검증 회원'],
  },
];

export default function PurchaseMainPage() {
  const router = useRouter();
  const { currentUser, applyForConditionalEvent } = useNadoSoloEngine();

  // 인터랙티브 구매 필터 상태
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  // 모달 제어 상태
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // 테이블 신청 클릭 시 결제창 오픈
  const handleOpenCheckout = (table: DiningTableItem) => {
    if (!currentUser) {
      router.push('/auth?next=/');
      return;
    }
    setCheckoutEvent({
      eventId: table.id,
      title: table.title,
      dateText: table.schedule,
      priceKrw: 30000,
      districtName: table.districtLabel,
      mealNote: '식음료 비용은 매장 현장에서 1/N 개별 실비 정산',
    });
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (eventId: string) => {
    applyForConditionalEvent(eventId);
    router.push('/dashboard');
  };

  // 필터링 적용된 테이블 목록
  const filteredTables = useMemo(() => {
    return DINING_TABLES.filter((t) => {
      if (selectedDistrict !== 'all' && t.districtKey !== selectedDistrict) return false;
      if (selectedTheme !== 'all' && t.themeKey !== selectedTheme) return false;
      if (selectedDay !== 'all' && t.dayKey !== selectedDay) return false;
      return true;
    });
  }, [selectedDistrict, selectedTheme, selectedDay]);

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f5f2eb] flex flex-col font-sans selection:bg-[#f04f74] selection:text-white">
      {/* ==============================================================
          1. 밸류 프로포지션 & 구매 헤로 (Purchase Hero)
          ============================================================== */}
      <section className="relative w-full border-b border-white/[0.08] overflow-hidden pt-12 sm:pt-16 pb-16 sm:pb-24">
        {/* 앰비언트 글로우 */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[420px] h-[420px] bg-[#f04f74]/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-white/[0.02] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          {/* 상단 메타 바 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74] animate-ping" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] text-zinc-300 uppercase">
              Curated Private Dining • Booking Hub
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            {/* 좌측: 타이틀 및 서비스 가치 (오픈테이블과 동일한 자연스러운 직사각형 텍스트 조판) */}
            <div className="lg:col-span-8 space-y-5">
              <h1 className="font-serif-editorial text-4xl sm:text-6xl lg:text-[68px] font-normal text-white tracking-tight leading-[1.14]">
                <span className="block">삶의 결이 통하는 6인의 저녁,</span>
                <span className="block font-light italic text-[#f5f2eb]/90 mt-1 sm:mt-1.5">
                  이번 주말 당신의 식탁을 예약하세요
                </span>
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed pt-2">
                신원과 에티켓이 검증된 6인의 참가자가 엄선된 프라이빗 룸에 모여 코스 디너와 와인을 함께합니다. 식사와 주류 비용은 당일 현장에서 1/N 실비로 정산하며, 온라인 참가비 ₩30,000은 다면 관찰 엔진 라이선스 및 소셜 리포트 발행비입니다.
              </p>

              {/* 빠른 쇼케이스 안내 링크 */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400">
                <span className="text-zinc-500">더 알아보기:</span>
                <Link
                  href="/showcase"
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#f04f74] transition-colors underline underline-offset-4"
                >
                  <span>브랜드 쇼케이스</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <span className="text-zinc-600">•</span>
                <Link
                  href="/guide"
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#f04f74] transition-colors underline underline-offset-4"
                >
                  <span>프로세스 가이드</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 우측: 3대 핵심 구매 조건 요약 카드 (소셜 다이닝과 규격 100% 일치) */}
            <div className="lg:col-span-4 p-6 sm:p-7 border border-white/[0.1] bg-white/[0.02] backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold">
                  TICKET SPECIFICATIONS
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono bg-[#f04f74]/20 text-[#f04f74] border border-[#f04f74]/30 rounded">
                  정원 6인 (3:3)
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-light flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#f04f74]" />
                    <span>온라인 결제</span>
                  </span>
                  <span className="text-white font-mono font-semibold text-sm">
                    ₩30,000 <span className="text-[11px] text-zinc-400 font-normal">(리포트 라이선스)</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-light flex items-center gap-1.5">
                    <Wine className="w-3.5 h-3.5 text-zinc-400" />
                    <span>식음료 결제</span>
                  </span>
                  <span className="text-zinc-200 font-mono">현장 테이블 1/N 실비</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-light flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>테이블 구성</span>
                  </span>
                  <span className="text-zinc-200 font-mono">남녀 3:3 성향 맞춤</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-light flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span>신뢰 서약</span>
                  </span>
                  <span className="text-zinc-200 font-mono">100% 실명 & 매너 인증</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="#tables"
                  className="w-full py-3.5 border border-[#f04f74] bg-[#f04f74]/10 hover:bg-[#f04f74] text-white text-xs font-mono tracking-[0.2em] uppercase font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <span>오픈 테이블 바로 보기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          2. 인터랙티브 구매 필터 바 (Interactive Booking Filter)
          ============================================================== */}
      <section id="tables" className="w-full border-b border-white/[0.08] bg-[#0c0d12]/90 sticky top-18 z-40 backdrop-blur-md py-4">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* 필터 그룹 */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-zinc-500 font-mono text-[11px] uppercase mr-1">
                <Filter className="w-3 h-3 text-[#f04f74]" />
                <span>FILTER</span>
              </span>

              {/* 지역 필터 */}
              <div className="inline-flex rounded-md border border-white/10 p-0.5 bg-black/40">
                {[
                  { key: 'all', label: '지역 전체' },
                  { key: 'jeonpo', label: '전포' },
                  { key: 'haeundae', label: '해운대' },
                  { key: 'seomyeon', label: '서면' },
                  { key: 'gwangan', label: '광안리' },
                ].map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDistrict(d.key)}
                    className={`px-2.5 py-1 text-xs font-mono transition-all rounded ${
                      selectedDistrict === d.key
                        ? 'bg-white text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* 테마 필터 */}
              <div className="inline-flex rounded-md border border-white/10 p-0.5 bg-black/40">
                {[
                  { key: 'all', label: '테마 전체' },
                  { key: 'golden', label: '5060 골든' },
                  { key: 'career', label: '3040 커리어' },
                  { key: 'wine', label: '와인 페어링' },
                ].map((th) => (
                  <button
                    key={th.key}
                    onClick={() => setSelectedTheme(th.key)}
                    className={`px-2.5 py-1 text-xs font-mono transition-all rounded ${
                      selectedTheme === th.key
                        ? 'bg-[#f04f74] text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>

              {/* 요일 필터 */}
              <div className="hidden sm:inline-flex rounded-md border border-white/10 p-0.5 bg-black/40">
                {[
                  { key: 'all', label: '요일 전체' },
                  { key: 'fri', label: '금요일' },
                  { key: 'sat', label: '토요일' },
                  { key: 'sun', label: '일요일' },
                ].map((dy) => (
                  <button
                    key={dy.key}
                    onClick={() => setSelectedDay(dy.key)}
                    className={`px-2.5 py-1 text-xs font-mono transition-all rounded ${
                      selectedDay === dy.key
                        ? 'bg-zinc-700 text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {dy.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 현재 결과 수 및 도시 선택기 */}
            <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono text-zinc-400">
              <span>
                예약 가능 <strong className="text-white">{filteredTables.length}</strong>개 테이블
              </span>
              <button
                type="button"
                onClick={() => setIsCityModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 border border-white/15 hover:border-white/40 text-zinc-300 hover:text-white transition-colors"
              >
                <MapPin className="w-3 h-3 text-[#f04f74]" />
                <span>부산 허브 변경</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ==============================================================
          3. 구매 가능한 라이브 테이블 목록 (Live Booking Cards)
          ============================================================== */}
      <section className="w-full py-16 sm:py-24 border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          
          <div className="space-y-12 sm:space-y-16">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-8 border border-white/[0.08] hover:border-white/[0.22] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-500 group"
              >
                {/* 좌측: 실사 사진 & 잔여석 상태 */}
                <div className="lg:col-span-5 relative aspect-[16/10] overflow-hidden bg-zinc-950 border border-white/[0.08]">
                  <img
                    src={table.image}
                    alt={table.title}
                    className="w-full h-full object-cover filter brightness-[0.82] contrast-[1.08] group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* 잔여석 상태 배지 */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 border border-white/15 text-[10px] font-mono tracking-widest text-[#f04f74] uppercase backdrop-blur-md font-semibold">
                    {table.status}
                  </div>

                  {/* 지역 태그 */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-0.5 bg-black/70 border border-white/10 text-[9px] font-mono tracking-wider text-zinc-300 uppercase">
                    {table.district}
                  </div>
                </div>

                {/* 우측: 디테일 스펙 & 즉시 구매 CTA */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs font-mono tracking-wider text-zinc-400">
                      <span className="text-[#f04f74] font-semibold">{table.theme}</span>
                      <span>•</span>
                      <span className="text-zinc-200">{table.schedule}</span>
                    </div>

                    <h3 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white group-hover:text-[#f5f2eb] transition-colors leading-snug">
                      {table.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                      {table.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#f04f74]" />
                      <span>{table.venueName}</span>
                    </div>
                  </div>

                  {/* 태그 리스트 */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
                    {table.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-[10px] font-mono bg-white/[0.03] border border-white/10 text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 가격 및 즉시 신청 바 */}
                  <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        PRICE & SETTLEMENT
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-mono font-bold text-white">₩30,000</span>
                        <span className="text-xs text-zinc-400 font-light">
                          (리포트 라이선스) • 식음료 1/N 현장 결제
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(table)}
                      className="px-8 py-3.5 bg-transparent hover:bg-white/[0.04] text-[#f04f74] border border-[#f04f74] text-xs font-mono tracking-[0.2em] uppercase font-semibold transition-all duration-300 flex items-center justify-center gap-2 group/btn cursor-pointer shadow-lg"
                    >
                      <span>신청하기</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredTables.length === 0 && (
              <div className="py-20 text-center border border-white/[0.08] bg-white/[0.01] space-y-3">
                <p className="text-zinc-400 font-light text-sm">선택하신 조건에 해당하는 오픈 테이블이 없습니다.</p>
                <button
                  onClick={() => {
                    setSelectedDistrict('all');
                    setSelectedTheme('all');
                    setSelectedDay('all');
                  }}
                  className="px-4 py-2 border border-white/20 text-xs font-mono text-white hover:border-[#f04f74] transition-colors"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ==============================================================
          4. 구매 후 프로세스 안내 (4-Step Dining Protocol)
          ============================================================== */}
      <section className="w-full py-20 sm:py-28 border-b border-white/[0.08] bg-[#090a0f]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[11px] font-mono tracking-[0.3em] text-[#f04f74] uppercase font-semibold block">
              HOW IT WORKS
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-4xl text-white font-normal">
              신청부터 소셜 리포트 수령까지
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
              사전 매너 서약부터 셰프 코스 디너, 상호 관찰 리포트까지 체계적인 4단계로 운영됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: '온라인 참가 신청',
                desc: '₩30,000 리포트 라이선스 결제 및 상호주의 에티켓 서약을 완료합니다.',
                tag: 'INSTANT BOOKING',
              },
              {
                step: '02',
                title: '3:3 맞춤 테이블 큐레이션',
                desc: '나도솔로 매칭 엔진이 연령과 성향 밸런스를 고려하여 6인의 프라이빗 룸을 사전 배정합니다.',
                tag: 'BALANCE CURATION',
              },
              {
                step: '03',
                title: '프라이빗 다이닝 & 교류',
                desc: '조용하고 독립된 룸에서 코스 요리와 와인을 즐기며 대화합니다. 식음료는 현장 1/N 실비 결제합니다.',
                tag: 'PRIVATE DINING',
              },
              {
                step: '04',
                title: '상호 관찰 & 리포트 언락',
                desc: '동석자 전원 관찰을 100% 완료하는 즉시, 타인의 시선으로 집계된 나의 소셜 메타인지 리포트가 안전하게 열립니다.',
                tag: 'RECIPROCAL UNLOCK',
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-6 border border-white/[0.08] bg-white/[0.015] hover:border-white/[0.2] transition-colors space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl text-[#f04f74] font-semibold">{p.step}</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{p.tag}</span>
                </div>
                <h3 className="font-serif-editorial text-lg text-white font-normal">{p.title}</h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==============================================================
          5. 신뢰 및 소비자 안심 보증 (Trust & Safety Guarantees)
          ============================================================== */}
      <section className="w-full py-16 border-b border-white/[0.08] bg-[#07080a]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
            
            <div className="pt-6 md:pt-0 md:px-6 first:pl-0 space-y-2">
              <div className="flex items-center gap-2 text-white text-sm font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#f04f74]" />
                <span>100% 실명 검증 및 프라이버시</span>
              </div>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                모든 참가자는 본인 인증과 에티켓 검증을 거치며, 개인 연락처는 동의 없이 외부에 절대 노출되지 않습니다.
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:px-6 space-y-2">
              <div className="flex items-center gap-2 text-white text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#f04f74]" />
                <span>상호주의 해금 & 비하 원천 차단</span>
              </div>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                단일 명사 1:1 관찰 척도만 제공하며, 악의적 서술형 비하를 원천 차단하여 안전하고 성숙한 피드백을 보장합니다.
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:px-6 space-y-2">
              <div className="flex items-center gap-2 text-white text-sm font-semibold">
                <CreditCard className="w-4 h-4 text-[#f04f74]" />
                <span>전자상거래법 환불 규정 준수</span>
              </div>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                모임 시작 3일 전까지 취소 시 100% 전액 환불되며, 모임 미성원 시 전액 자동 환불됩니다.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ==============================================================
          6. 브랜드 쇼케이스 & 소셜 미러 티저 배너 (Showcase Callout)
          ============================================================== */}
      <section className="w-full py-20 bg-gradient-to-b from-[#090a0f] to-[#07080a] border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          <div className="p-8 sm:p-12 border border-white/[0.12] bg-white/[0.02] backdrop-blur-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
                BRAND SHOWCASE & SOCIAL MIRROR
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal leading-snug">
                나도솔로의 브랜드 철학과 소셜 미러 엔진이 더 궁금하신가요?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                단일 명사 5대 관찰 앵커(품격·미소·경청·배려·시선)와 제휴 프라이빗 룸 갤러리, 참여 여정의 전체 비주얼을 쇼케이스에서 둘러보실 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <Link
                href="/showcase"
                className="px-6 py-3 border border-white/30 hover:border-white bg-white text-black hover:bg-zinc-100 text-xs font-mono tracking-[0.2em] uppercase font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <span>쇼케이스 둘러보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/guide"
                className="px-6 py-3 border border-white/20 hover:border-white/40 bg-black/40 text-xs font-mono tracking-[0.2em] text-zinc-300 hover:text-white uppercase transition-all duration-300"
              >
                <span>프로세스 가이드</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          원스톱 결제 모달 (전자상거래법 환불규정 동의 및 토스페이먼츠 연동)
          ============================================================== */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={checkoutEvent}
        onSuccessPayment={handlePaymentSuccess}
      />

      {/* 도시 허브 선택 모달 */}
      <CitySwitcherModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
      />
    </div>
  );
}
