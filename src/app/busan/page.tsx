'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine, normalizeRegionCity } from '@/engine';
import { useSiteConfig } from '@/engine/siteConfigEngine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import CitySwitcherModal from '@/components/CitySwitcherModal';
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Wine,
  Users,
  CreditCard,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface DiningTableItem {
  id: string;
  title: string;
  district: string;
  districtKey: string;
  districtLabel: string;
  venueName: string;
  theme: string;
  themeKey: 'all' | 'golden' | 'career' | 'wine';
  dayKey: 'all' | 'fri' | 'sat' | 'sun';
  schedule: string;
  status: string;
  isUrgent?: boolean;
  isLiveDb?: boolean;
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
    venueName: 'D-1 19:00 비공개 공개 (제휴 프라이빗 다이닝)',
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
    venueName: 'D-1 19:00 비공개 공개 (제휴 프라이빗 다이닝)',
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
    venueName: 'D-1 19:00 비공개 공개 (제휴 프라이빗 다이닝)',
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
    venueName: 'D-1 19:00 비공개 공개 (제휴 프라이빗 다이닝)',
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
  const {
    currentUser,
    applyForConditionalEvent,
    conditionalEvents,
    partnerVenues,
    surveyAnswers,
  } = useNadoSoloEngine();
  const { config } = useSiteConfig();
  const heroSector = config?.mainSectors?.find((s) => s.id === 'sector-hero');

  // 인터랙티브 구매 필터 상태
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % 3);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // 모달 제어 상태
  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  const PURPOSE_NAME_MAP: Record<string, string> = {
    RESET: '지적 환기 · 변화',
    FRIEND: '취향 · 동네 교류',
    TASTE: '와인 · 미식 취향',
    ROMANCE: '3:3 인연 · 동반자',
  };

  // 타임레프트 제0조 원칙: [도시 × 일정] 단위 블라인드 슬롯 통합 + D-1 식당 비공개 유지
  const allTables: DiningTableItem[] = useMemo(() => {
    if (conditionalEvents.length === 0) return DINING_TABLES;
    const slotMap = new Map<string, DiningTableItem>();

    for (const ev of conditionalEvents) {
      if (ev.status === 'CANCELLED_MIN' || ev.status === 'COMPLETED') continue;
      const city = normalizeRegionCity(ev.regionName || (ev.title.includes('부산') ? '부산' : '서울'));
      const dateText = ev.dateText || '이번 주 금요일 19:30';
      const slotKey = `${city}|${dateText}`;
      if (slotMap.has(slotKey)) continue;

      const themeKey: DiningTableItem['themeKey'] =
        ev.purpose === 'TASTE' ? 'wine' : ev.purpose === 'RESET' || ev.purpose === 'FRIEND' ? 'career' : 'golden';

      slotMap.set(slotKey, {
        id: ev.eventId,
        title: `${city} · ${dateText} 프라이빗 소셜 다이닝`,
        district: city,
        districtKey: city === '부산' ? 'busan' : 'seoul',
        districtLabel: city,
        venueName: 'D-1 19:00 비공개 공개 (제휴 프라이빗 다이닝)',
        theme: '블라인드 슬롯 예약',
        themeKey,
        dayKey: dateText.includes('토') ? 'sat' : dateText.includes('일') ? 'sun' : 'fri',
        schedule: dateText,
        status: ev.status === 'CONFIRMED' ? '확정' : '예약가능',
        isUrgent: ev.status === 'CLOSING_SOON',
        isLiveDb: true,
        image:
          ev.heroImage ||
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
        description:
          '도시와 일정만 선택해 예약하세요. 성향에 맞는 6인 테이블과 제휴 식당은 모임 전날(D-1) 19:00에 비공개 공개됩니다.',
        tags: ['D-1 식당 공개', '사전 1:1 DM 차단', '식음료 현장 1/N'],
      });
    }

    const slots = Array.from(slotMap.values());
    return slots.length > 0 ? slots : DINING_TABLES;
  }, [conditionalEvents, partnerVenues]);

  // 타임레프트 제0조 원칙: 개별 방·식당 선택 대신 부산 블라인드 슬롯 예약(/meetup?region=부산)으로 연결
  const handleOpenCheckout = (_table: DiningTableItem) => {
    router.push('/meetup?region=부산');
  };

  const handlePaymentSuccess = (eventId: string) => {
    applyForConditionalEvent(eventId);
    router.push('/dashboard');
  };

  // 필터링 적용된 테이블 목록
  const filteredTables = useMemo(() => {
    return allTables.filter((t) => {
      if (selectedDistrict !== 'all' && t.districtKey !== selectedDistrict) return false;
      if (selectedTheme !== 'all' && t.themeKey !== selectedTheme) return false;
      if (selectedDay !== 'all' && t.dayKey !== selectedDay) return false;
      return true;
    });
  }, [allTables, selectedDistrict, selectedTheme, selectedDay]);

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f5f2eb] flex flex-col font-sans selection:bg-[#f04f74] selection:text-white">
      {/* ==============================================================
          0. 최상단 움직이는 배너 (파티 첫 화면 → 같은 방향을 바라보다)
          ============================================================== */}
      <section className="w-full border-b border-white/[0.08] bg-[#07080a] pt-6 pb-4">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden border border-white/15 bg-[#0c0d12]">
            {[
              {
                src: '/images/hero-backview-sunset.jpg',
                alt: '석양과 야경을 함께 바라보는 소셜 다이닝 테이블',
                caption: '직진은 NO! — 부담 없는 옆모습, 같은 시간과 공간을 공유하는 저녁',
              },
              {
                src: '/images/hero-party-first.jpg',
                alt: '6인 소셜 다이닝 파티 — 이유있는 만남',
                caption: '이유있는 만남 — 6인의 유쾌한 다이닝과 건강한 대화',
              },
              {
                src: '/images/hero-backview-horizon.jpg',
                alt: '같은 방향을 바라보는 프라이빗 루프탑 다이닝 시선',
                caption: '같은 방향을 바라보다 — 마주 앉은 시선 너머, 같은 풍경을 함께',
              },
            ].map((slide, idx) => {
              const active = bannerIdx === idx;
              return (
                <div
                  key={slide.src}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    active ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className={`w-full h-full object-cover object-center transition-transform duration-[6500ms] ease-out ${
                      active ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                    <p className="font-serif-editorial text-base sm:text-xl text-white font-normal drop-shadow">
                      {slide.caption}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* 에디토리얼 숫자 캡슐 컨트롤 (점선 제거) + 하단 슬림 프로그레스 바 */}
            <div className="absolute bottom-4 right-5 z-20 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-lg">
              <button
                type="button"
                aria-label="이전 배너"
                onClick={() => setBannerIdx((prev) => (prev + 2) % 3)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="text-xs font-mono text-white tracking-wider tabular-nums px-1.5">
                0{bannerIdx + 1} <span className="text-white/40">/</span> 03
              </span>

              <button
                type="button"
                aria-label="다음 배너"
                onClick={() => setBannerIdx((prev) => (prev + 1) % 3)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white/15">
              <div
                className="h-full bg-[#f04f74] transition-all duration-500"
                style={{ width: `${((bannerIdx + 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          1. 밸류 프로포지션 & 구매 헤로 (Purchase Hero)
          ============================================================== */}
      <section className="relative w-full border-b border-white/[0.08] overflow-hidden pt-12 sm:pt-16 pb-14 sm:pb-20">
        {/* 앰비언트 글로우 */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[420px] h-[420px] bg-[#f04f74]/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-white/[0.02] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
          {/* 상단 메타 바 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74] animate-ping" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-zinc-300">
              나도솔로 · 소셜 다이닝 &amp; 다면 관찰 플랫폼
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            {/* 좌측: 타이틀 및 서비스 가치 (오픈테이블과 동일한 자연스러운 직사각형 텍스트 조판) */}
            <div className="lg:col-span-8 space-y-5">
              <h1 className="font-serif-editorial text-4xl sm:text-6xl lg:text-[68px] font-normal text-white tracking-tight leading-[1.14]">
                <span className="block">{heroSector?.headlineTitle || '나도솔로 — 이유있는 만남,'}</span>
                <span className="block font-light italic text-[#f5f2eb]/90 mt-1 sm:mt-1.5 whitespace-pre-line">
                  {heroSector?.headlineHighlight || '직진은 NO!\n같은 방향을 바라보다'}
                </span>
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed pt-2">
                나도솔로는 신원과 에티켓이 검증된 6인의 참가자가 엄선된 프라이빗 룸에 모여 코스 디너와 와인을 함께하며 타인의 시선으로 나의 소통과 매너를 발견하는 소셜 메타인지 플랫폼입니다. 식사와 주류 비용은 당일 현장에서 1/N 실비로 정산하며, 온라인 참가비는 다면 관찰 엔진 라이선스 및 리포트 발행비입니다.
              </p>

              {/* 핵심 행동 CTA (Timeleft형 즉시 진입 동선) */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  href="/checklist"
                  prefetch={true}
                  className="px-6 py-3 bg-[#f04f74] hover:opacity-90 text-white text-sm font-mono font-semibold tracking-wider transition-all inline-flex items-center gap-2"
                >
                  <span>성향 테스트 시작</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/meetup"
                  prefetch={true}
                  className="px-6 py-3 border border-white/25 bg-white/5 hover:bg-white/10 text-white text-sm font-mono tracking-wider transition-all"
                >
                  오픈 밋업 보기
                </Link>
              </div>

              {/* 빠른 쇼케이스 안내 링크 */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400">
                <span className="text-zinc-500">더 알아보기:</span>
                <Link
                  href="/showcase"
                  prefetch={true}
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#f04f74] transition-colors underline underline-offset-4"
                >
                  <span>브랜드 쇼케이스</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <span className="text-zinc-600">•</span>
                <Link
                  href="/guide"
                  prefetch={true}
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
                    모임별 상이 <span className="text-[11px] text-zinc-400 font-normal">(리포트 라이선스)</span>
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
                {(conditionalEvents.length > 0
                  ? [
                      { key: 'all', label: '지역 전체' },
                      { key: 'seoul', label: '서울' },
                      { key: 'busan', label: '부산' },
                    ]
                  : [
                      { key: 'all', label: '지역 전체' },
                      { key: 'jeonpo', label: '전포' },
                      { key: 'haeundae', label: '해운대' },
                      { key: 'seomyeon', label: '서면' },
                      { key: 'gwangan', label: '광안리' },
                    ]
                ).map((d) => (
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
                      {table.isLiveDb ? (
                        <Link href={`/meetup/${table.id}`} prefetch={true} className="hover:underline">
                          {table.title}
                        </Link>
                      ) : (
                        table.title
                      )}
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
                      <span>슬롯 예약</span>
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
                desc: '참가비(리포트 라이선스) 결제 및 상호주의 에티켓 서약을 완료합니다.',
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
          5.5. 4대 목적 트랙 & 실존적 솔로 안내
          ============================================================== */}
      <section className="w-full py-16 sm:py-20 border-b border-white/[0.08] bg-[#090a0f]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
              PURPOSE TRACKS
            </span>
            <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
              인간은 누구나 솔로다 — 나에게 맞는 목적 트랙
            </h2>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              미혼·기혼·직장인·리더 누구나 건강한 외부 소통으로 생각을 환기할 수 있습니다. 단, 인연 트랙은 미혼·비연애 회원만 엄격히 분리 매칭됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                code: '변화',
                sub: 'RESET',
                desc: '타 업종·타 세대와의 지적인 대화로 일상의 관점을 환기하는 테이블',
              },
              {
                code: '교류',
                sub: 'FRIEND',
                desc: '비슷한 연령대와 생활권에서 편하게 대화를 나누는 동네 친구 테이블',
              },
              {
                code: '취향',
                sub: 'TASTE',
                desc: '와인·미식·전시 등 공통 관심사와 예산 결이 맞는 취향 중심 테이블',
              },
              {
                code: '인연',
                sub: 'ROMANCE',
                desc: '연령 격차와 3:3 성비 균형을 엄격히 적용한 미혼 전용 인연 테이블',
              },
            ].map((tr) => (
              <div
                key={tr.code}
                className="p-5 border border-white/[0.08] bg-[#0c0d12] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif-editorial text-xl text-white">{tr.code}</span>
                  <span className="text-xs font-mono text-[#f04f74]">{tr.sub}</span>
                </div>
                <p className="text-sm text-zinc-400 font-light leading-relaxed">{tr.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================================
          5.6. 참여자 후기 & 안전 설계 (Social Proof & Safety by Design)
          ============================================================== */}
      <section className="w-full py-16 sm:py-20 border-b border-white/[0.08] bg-[#07080a]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
                TRUST &amp; REVIEWS
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
                사전 연락 차단, 검증된 제휴 식당, 영구 재매칭 방지
              </h2>
            </div>
            <span className="text-sm font-mono text-zinc-400">
              공공 제휴 매장 100% · 모임 전 1:1 DM 원천 차단
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                quote: '“처음엔 낯선 사람들과 2시간 식사가 어색할까 걱정했는데, 대화 카드와 6인 균형 매칭 덕분에 시간 가는 줄 몰랐습니다.”',
                author: '30대 UX 디자이너 · 변화 트랙',
              },
              {
                quote: '“단톡방이나 사전 프로필 노출 없이 D-1에 식당만 딱 알려주는 방식이 오히려 가장 안전하고 깔끔했습니다.”',
                author: '40대 스타트업 대표 · 취향 트랙',
              },
              {
                quote: '“모임이 끝나고 받은 단일 명사 피드백에서 제가 말할 때 경청 태도가 좋다는 객관적 시선을 처음 확인했습니다.”',
                author: '30대 전문직 · 교류 트랙',
              },
            ].map((rv, idx) => (
              <div
                key={idx}
                className="p-6 border border-white/[0.08] bg-white/[0.015] flex flex-col justify-between space-y-4"
              >
                <p className="text-sm text-zinc-200 font-light leading-relaxed">{rv.quote}</p>
                <span className="text-xs font-mono text-zinc-400">{rv.author}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================================
          5.7. 자주 묻는 질문 (FAQ 아코디언)
          ============================================================== */}
      <section className="w-full py-16 sm:py-20 border-b border-white/[0.08] bg-[#090a0f]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
              FAQ
            </span>
            <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
              자주 묻는 질문
            </h2>
          </div>

          <div className="border border-white/[0.08] bg-[#0c0d12] divide-y divide-white/[0.06]">
            {[
              {
                q: '혼자 신청해도 어색하지 않나요?',
                a: '모든 참가자가 혼자 신청하며, 나도솔로 매칭 엔진이 대화 깊이·테마·에너지를 맞춰 6인 테이블을 구성합니다. 현장 대화 카드도 함께 제공됩니다.',
              },
              {
                q: '참가비 외에 식사비는 어떻게 결제하나요?',
                a: '온라인 참가비는 매칭·예약 및 다면 관찰 리포트 발행 라이선스 비용이며, 음식과 주류는 당일 식당 현장에서 테이블 1/N 실비로 결제합니다.',
              },
              {
                q: '기혼자나 연애 중인 사람도 참여할 수 있나요?',
                a: '네. 변화(RESET)·교류(FRIEND)·취향(TASTE) 트랙에 참여 가능하며, 인연(ROMANCE) 트랙은 시스템이 자동으로 차단·격리합니다.',
              },
              {
                q: '비건 또는 논알콜 식단 제한이 있어도 괜찮나요?',
                a: '대시보드 프로필에서 비건·논알콜을 선택할 수 있으며, 비건 회원은 비건 메뉴가 지원되는 제휴 식당 방으로만 안전 배정(불가 시 다음 회차 우선 배정)됩니다.',
              },
              {
                q: '일정 취소·이월이나 노쇼·불편한 상대 차단은 어떻게 처리되나요?',
                a: '대시보드 [내 모임]에서 직접 이월·취소가 가능하며(48시간 전 무료), 모임 후 불편했거나 결석(노쇼)한 상대는 차단 신고 시 향후 영구적으로 재매칭에서 제외됩니다.',
              },
            ].map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] cursor-pointer"
                  >
                    <span className="text-sm sm:text-base text-white font-normal">{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-zinc-400 font-light leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==============================================================
          5.8. 모임 포맷 · 도시 네트워크 · 어필리에이트 / 제휴식당
          ============================================================== */}
      <section className="w-full py-16 sm:py-20 border-b border-white/[0.08] bg-[#07080a]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 space-y-12">
          {/* 모임 포맷 4종 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
                EXPERIENCE FORMATS
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
                다양한 타임레프트식 소셜 다이닝 포맷
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {[
                { name: '주간 6인 디너', desc: '금·토 저녁 제휴 레스토랑에서 만나는 가장 대표적인 6인 소셜 다이닝' },
                { name: '싱글즈 디너', desc: '미혼 남녀 3:3 성비와 연령 격차를 엄격히 맞춘 설레는 저녁' },
                { name: '여성 전용 테이블', desc: '여성 참가자들만으로 구성되어 편안한 공감과 네트워킹을 나누는 테이블' },
                { name: '가벼운 드링크 · 살롱', desc: '식사보다 가벼운 와인·논알콜 페어링 중심의 캐주얼 이브닝' },
              ].map((fmt) => (
                <div key={fmt.name} className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
                  <h3 className="text-white font-semibold">{fmt.name}</h3>
                  <p className="text-zinc-400 font-light leading-relaxed">{fmt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 활성 도시 + 파트너/어필리에이트 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-3">
              <span className="text-xs font-mono text-[#f04f74] uppercase">ACTIVE CITIES</span>
              <h3 className="font-serif-editorial text-xl text-white font-normal">
                운영 도시 및 오픈 예정 지역
              </h3>
              <p className="text-sm text-zinc-400 font-light">
                현재 <strong className="text-white">서울</strong>(성수·강남·한남), <strong className="text-white">부산</strong>(전포·해운대·광안리·센텀)에서 매주 운영 중이며, 대구 · 대전 · 인천 · 제주 순차 오픈 예정입니다.
              </p>
              <Link href="/meetup" prefetch={true} className="inline-block text-sm font-mono text-white underline underline-offset-4">
                도시별 일정 보기 →
              </Link>
            </div>

            <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-3">
              <span className="text-xs font-mono text-[#f04f74] uppercase">PARTNERS &amp; AFFILIATES</span>
              <h3 className="font-serif-editorial text-xl text-white font-normal">
                앰배서더 · 제휴 식당 파트너십
              </h3>
              <p className="text-sm text-zinc-400 font-light">
                나도솔로를 소개하고 수익을 나누는 어필리에이트 프로그램과, 6인 확정 손님을 배정받는 제휴 식당 파트너십을 운영합니다.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/affiliate" prefetch={true} className="px-4 py-2 border border-white/25 text-sm font-mono text-white hover:bg-white/10">
                  어필리에이트 →
                </Link>
                <Link href="/partners" prefetch={true} className="px-4 py-2 border border-[#f04f74]/60 bg-[#f04f74]/10 text-sm font-mono text-white hover:bg-[#f04f74]/20">
                  제휴식당 입점 →
                </Link>
              </div>
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
                prefetch={true}
                className="px-6 py-3 border border-white/30 hover:border-white bg-white text-black hover:bg-zinc-100 text-xs font-mono tracking-[0.2em] uppercase font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <span>쇼케이스 둘러보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/guide"
                prefetch={true}
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
