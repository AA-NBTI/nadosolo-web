'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSiteConfig } from '@/engine/siteConfigEngine';
import { useNadoSoloEngine } from '@/engine';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
} from 'lucide-react';

const BANNER_SLIDES = [
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
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: '사전 체크리스트',
    desc: '대화 에너지, 깊이, 관심사, 예산, 식단 제한을 1분 만에 선택합니다.',
  },
  {
    step: '02',
    title: '도시 · 요일 예약',
    desc: '방 제목이나 식당을 고르지 않고 [도시 × 날짜] 블라인드 슬롯만 예약합니다.',
  },
  {
    step: '03',
    title: 'D-1 19:00 장소 공개',
    desc: '사전 1:1 DM 없이 모임 전날 저녁 제휴 식당과 동석자 힌트가 열립니다.',
  },
  {
    step: '04',
    title: '식사 & 소셜 리포트',
    desc: '식음료는 현장 1/N 결제 후, 상호 관찰을 마치면 내 리포트가 열립니다.',
  },
];

const FAQS = [
  {
    q: '혼자 신청해도 어색하지 않나요?',
    a: '모든 참가자가 혼자 신청하며, 매칭 엔진이 대화 깊이·테마·에너지를 맞춰 6인 테이블을 구성합니다. 현장 디지털 대화 카드도 함께 제공됩니다.',
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
    a: '체크리스트와 프로필에서 비건·논알콜을 선택할 수 있으며, 비건 회원은 비건 메뉴가 지원되는 제휴 식당 방으로만 안전 배정됩니다.',
  },
  {
    q: '일정 취소·이월이나 노쇼·불편한 상대 차단은 어떻게 처리되나요?',
    a: '대시보드 [내 모임]에서 직접 이월·취소가 가능하며(48시간 전 무료·참가권 1매 보존), 모임 후 노쇼나 불편한 상대를 차단 신고하면 향후 영구적으로 재매칭에서 제외됩니다.',
  },
];

export default function NadoSoloEditorialHomePage() {
  const { config } = useSiteConfig();
  const { surveyAnswers } = useNadoSoloEngine();
  const hasCompletedQuiz = Object.keys(surveyAnswers || {}).length > 0;
  const heroSector = config?.mainSectors?.find((s) => s.id === 'sector-hero');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans selection:bg-[#f04f74] selection:text-white">
      {/* 1. 딥 다크 에디토리얼 Hero */}
      <section className="w-full py-14 sm:py-24 bg-[#07080a] border-b border-white/10">
        <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c0d12] border border-white/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
                <span className="text-xs font-semibold tracking-wide text-zinc-200">
                  매주 금·토 저녁, 낯선 6인의 품격 있는 식탁
                </span>
              </div>

              <h1 className="font-serif-editorial text-4xl sm:text-5xl lg:text-[58px] font-normal text-white tracking-tight leading-[1.15]">
                <span className="block">{heroSector?.headlineTitle || '나도솔로 — 이유있는 만남,'}</span>
                <span className="block font-light italic text-[#f04f74] mt-2 whitespace-pre-line">
                  {heroSector?.headlineHighlight || '직진은 NO!\n같은 방향을 바라보다'}
                </span>
              </h1>

              <p className="text-base text-zinc-400 leading-relaxed max-w-xl">
                프로필 탐색도, 어색한 사전 채팅도 없습니다. 도시와 요일만 선택하면 성향에 맞는 6인의 테이블과 제휴 식당을 모임 전날 공개해 드립니다.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href={hasCompletedQuiz ? '/meetup' : '/test'}
                  prefetch={true}
                  className="px-7 py-4 rounded-full bg-[#f04f74] hover:bg-[#d93a5e] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-[#f04f74]/20 transition-all cursor-pointer"
                >
                  <span>{hasCompletedQuiz ? '일정 예약하기' : '내 자리 예약하기'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/meetup"
                  prefetch={true}
                  className="px-7 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-semibold border border-white/15 transition-all"
                >
                  밋업 일정 보기
                </Link>
              </div>
            </div>

            {/* 우측: 딥 다크 에디토리얼 다이닝 일러스트/비주얼 카드 */}
            <div className="lg:col-span-6">
              <div className="relative rounded-[2rem] overflow-hidden bg-[#0c0d12] p-3 border border-white/10 shadow-2xl">
                <img
                  src="/images/tl-illus-dinner.jpg"
                  alt="6인 소셜 다이닝 일러스트"
                  className="w-full aspect-[4/3] object-cover rounded-[1.5rem]"
                />
                <div className="mt-3.5 px-3 pb-1 flex items-center justify-between text-xs font-medium text-zinc-400">
                  <span className="text-zinc-300">6인 성향 맞춤 테이블 · 사전 1:1 DM 차단</span>
                  <span className="text-[#f04f74] font-semibold">D-1 19:00 식당 공개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4단계 다크 카드 How It Works */}
      <section className="w-full py-16 sm:py-24 bg-[#0c0d12] border-b border-white/10">
        <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#f04f74] text-xs font-bold tracking-wider uppercase">
              HOW IT WORKS
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-5xl text-white font-normal">
              네 단계로 완성되는 완벽한 저녁
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="p-7 rounded-3xl bg-[#07080a] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3.5">
                  <span className="inline-flex w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center font-serif-editorial text-lg text-white font-semibold">
                    {item.step}
                  </span>
                  <h3 className="font-serif-editorial text-xl text-white font-normal">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
                <Link
                  href={item.step === '01' ? '/test' : '/meetup'}
                  prefetch={true}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-[#f04f74] transition-colors"
                >
                  <span>바로 가기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 실제 저녁 분위기 3슬라이드 움직이는 배너 */}
      <section className="w-full py-16 sm:py-24 bg-[#07080a] text-white border-b border-white/10">
        <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-widest text-[#f04f74] uppercase block">
                REAL ATMOSPHERE
              </span>
              <h2 className="font-serif-editorial text-3xl sm:text-4xl text-white font-normal">
                직진은 NO! 같은 방향을 바라보는 밤
              </h2>
            </div>
            <Link
              href="/meetup"
              prefetch={true}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold inline-flex items-center gap-2 self-start transition-all"
            >
              <span>이번 주 밋업 예약</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-[2rem] overflow-hidden border border-white/15 shadow-2xl bg-black">
            {BANNER_SLIDES.map((slide, idx) => {
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
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-5 left-6 right-32">
                    <p className="font-serif-editorial text-base sm:text-xl text-white font-normal drop-shadow truncate">
                      {slide.caption}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="absolute bottom-4 right-5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
              <button
                type="button"
                aria-label="이전 배너"
                onClick={() => setBannerIdx((prev) => (prev + 2) % BANNER_SLIDES.length)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-white tabular-nums px-1">
                0{bannerIdx + 1} <span className="text-white/40">/</span> 03
              </span>
              <button
                type="button"
                aria-label="다음 배너"
                onClick={() => setBannerIdx((prev) => (prev + 1) % BANNER_SLIDES.length)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 운영 도시 / 포맷 & 3대 안전 보증 & 5성급 후기 */}
      <section className="w-full py-16 sm:py-24 bg-[#0c0d12] border-b border-white/10">
        <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 rounded-[2rem] overflow-hidden bg-[#07080a] p-3 border border-white/10 shadow-xl">
              <img
                src="/images/tl-illus-city.jpg"
                alt="도시 저녁 연결 일러스트"
                className="w-full aspect-[16/10] object-cover rounded-[1.5rem]"
              />
            </div>

            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-[#f04f74]">
                <MapPin className="w-3.5 h-3.5" />
                <span>CITIES &amp; FORMATS</span>
              </div>
              <h2 className="font-serif-editorial text-3xl sm:text-4xl text-white font-normal">
                서울 · 부산에서 시작해 전국으로 이어지는 식탁
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                주간 6인 디너부터 싱글즈, 여성 전용 테이블, 가벼운 드링크 살롱까지. 미혼·기혼·직장인 누구나 각자의 목적 트랙(변화·교류·취향·인연)으로 안전하게 만납니다.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/locations"
                  prefetch={true}
                  className="px-6 py-3 rounded-full bg-white text-[#07080a] hover:bg-zinc-200 text-xs font-bold transition-colors"
                >
                  운영 도시 보기
                </Link>
                <Link
                  href="/busan"
                  prefetch={true}
                  className="px-6 py-3 rounded-full bg-white/5 border border-white/15 text-zinc-300 hover:text-white text-xs font-bold hover:border-white/30 transition-all"
                >
                  부산 다이닝 페이지
                </Link>
              </div>
            </div>
          </div>

          {/* 3대 안전 보증 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-[#07080a] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="w-5 h-5 text-[#f04f74]" />
                <span>공공 제휴 식당 100% · 사전 DM 차단</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                D-1 19:00 공개 전까지 연락처와 프로필을 가리고, 검증된 공공 매장에서만 만납니다.
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-[#07080a] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <CheckCircle2 className="w-5 h-5 text-[#f04f74]" />
                <span>노쇼 제재 &amp; 영구 재매칭 차단</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                모임 후 불편한 상대나 결석자를 신고하면 향후 모든 회차에서 영구 분리됩니다.
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-[#07080a] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <CreditCard className="w-5 h-5 text-[#f04f74]" />
                <span>48시간 전 무료 취소 · 참가권 보존</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                48시간 전 취소·이월 및 미달 시 참가권 1매가 보존되어 다음 일정에 바로 사용됩니다.
              </p>
            </div>
          </div>

          {/* 5성급 후기 */}
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
                className="p-7 rounded-3xl bg-[#07080a] border border-white/10 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-1 text-[#f04f74]">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-[#f04f74]" />
                  ))}
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed">{rv.quote}</p>
                <span className="text-xs font-medium text-zinc-500">{rv.author}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 자주 묻는 질문 (FAQ) — 어필리에이트 영역 완전 제거 후 깔끔한 마무리 */}
      <section className="w-full py-16 sm:py-24 bg-[#07080a]">
        <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14 space-y-8">
          <div className="space-y-3">
            <span className="inline-block px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#f04f74] text-xs font-bold tracking-wider uppercase">
              FREQUENTLY ASKED
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-4xl text-white font-normal">
              자주 묻는 질문
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] divide-y divide-white/10 overflow-hidden">
            {FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base text-white font-semibold">{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">{item.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
