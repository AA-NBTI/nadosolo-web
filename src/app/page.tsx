'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SocialMode, useNadoSoloEngine } from '@/engine';

const DOMAIN_CORE: { key: string; label: string; enLabel: string; desc: string }[] = [
  { key: 'APPEARANCE', label: '첫인상', enLabel: '첫인상 분석', desc: '밝은 표정과 자연스러운 시선 처리' },
  { key: 'STYLE', label: '스타일', enLabel: '스타일 감각', desc: '모임 분위기에 어울리는 단정한 착장과 센스' },
  { key: 'VOICE', label: '보이스', enLabel: '보이스 & 음색', desc: '테이블에 편안함을 주는 안정적인 음조' },
  { key: 'CONVERSATION', label: '대화의 결', enLabel: '대화의 결', desc: '상대방의 이야기에 귀 기울이는 경청과 유머' },
  { key: 'MANNER', label: '에티켓', enLabel: '테이블 매너', desc: '상대를 존중하고 배려하는 품격 있는 태도' },
];

export default function NadoSoloHomePage() {
  const router = useRouter();
  const {
    currentUser,
    selectedMode,
    setSelectedMode,
    cmsMirrorQuotes,
  } = useNadoSoloEngine();

  const handleApply = (mode?: SocialMode) => {
    if (mode) setSelectedMode(mode);
    const target = '/dashboard?step=P05_EVENT_APPLY';
    if (!currentUser) {
      router.push(`/auth?next=${encodeURIComponent(target)}`);
    } else {
      router.push(target);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans">
      <main className="w-full max-w-[1320px] mx-auto px-6 py-10 sm:py-16 space-y-20 sm:space-y-28 flex-1">
        
        {/* ===================================================================
            1. HERO SECTION (신뢰 기반 프리미엄 솔로 라이프스타일 플랫폼)
           =================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* 좌측: 타이포그래피 중심 */}
          <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium">부산 서면·전포 거점 • 신뢰 기반 솔로 라이프스타일 OS</span>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold tracking-widest uppercase text-rose-400">
                NADO SOLO SOCIETY
              </p>
              <h1 className="font-serif-editorial text-4xl sm:text-6xl font-normal text-white tracking-tight leading-[1.15]">
                좋은 사람들과,<br />
                좋은 시간을.
              </h1>
              <p className="text-base sm:text-lg text-zinc-300 max-w-xl font-normal leading-relaxed">
                검증된 매너와 삶의 결이 맞는 사람들을 만나는 프리미엄 솔로 플랫폼.<br className="hidden sm:inline" />
                기존 소개팅이나 가벼운 번개 대신, <strong>신뢰할 수 있는 3045 직장인·사업가 및 5060 골든 솔로</strong>를 위한 품격 있는 소셜 다이닝과 라이프스타일 교류를 시작하세요.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleApply(selectedMode)}
                className="w-full sm:w-auto px-8 sm:px-10 py-4.5 rounded-xl bg-[#881337] hover:bg-[#6f102d] text-white text-base sm:text-lg font-medium shadow-xl shadow-[#881337]/30 transition-all cursor-pointer flex items-center justify-center gap-3 mx-auto lg:mx-0"
              >
                <span>이번 주 전포 다이닝 참가 신청</span>
                <span className="text-xs bg-black/30 px-2.5 py-1 rounded-md text-rose-200">
                  ₩25,000 (얼리버드 ₩19,900)
                </span>
              </button>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm text-zinc-400">
                <span className="text-emerald-400">✓</span>
                <span>디너 식대 및 주류 비용은 식당 현장에서 동행자들과 자유롭게 1/N 정산됩니다.</span>
              </div>
            </div>
          </div>

          {/* 우측: 절제된 비주얼 카드 */}
          <div className="lg:col-span-6 bg-[#12151e] p-5 sm:p-7 rounded-3xl border border-white/10 space-y-5 shadow-2xl">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
              <img
                alt="부산 전포 프라이빗 다이닝 테이블"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuADjfVgvn4klh4VubiVJmy_CPl-l2OBim99Lx0OM0H_DtK-QqALTh_v-RLCqyF9bD5vfZRVl_04kBlsLiguM538bZlR1JPSnkgis7a48NWmqPn3DArA-XUpTHPtnfBjldXbp_2CnkX6JHQCRu0epB1S4S0O8zmjCm_EmsN-8XT5B38ZrQKjurB3kMJyUc3KyFs8StfLGhKCDKkSnp5M-I7Dhj3bNn4cjBCb-E2IYU4"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex items-end justify-between p-6 sm:p-7">
                <div>
                  <span className="text-xs font-medium tracking-wider text-zinc-300">
                    매주 금요일 19:30 • 서면·전포 시크릿 테이블
                  </span>
                  <div className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white mt-1">
                    3045 &amp; 5060 프라이빗 소셜
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs sm:text-sm text-white border border-white/15">
                  6인 정원 (3:3)
                </span>
              </div>
            </div>

            {/* 좌석 밸런스 */}
            <div className="bg-[#181c28] p-4.5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm text-zinc-200 font-medium">이번 주 테이블 구성 현황</span>
                <p className="text-xs text-zinc-400">성별 3:3 및 직군·취향 밸런스 큐레이션</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white/85" title="남성 확정" />
                <span className="w-3 h-3 rounded-full bg-white/85" title="여성 확정" />
                <span className="w-3 h-3 rounded-full bg-white/85" title="남성 확정" />
                <span className="w-3 h-3 rounded-full bg-white/85" title="여성 확정" />
                <span className="w-3 h-3 rounded-full bg-[#881337] animate-pulse" title="신청 가능" />
                <span className="w-3 h-3 rounded-full border border-dashed border-zinc-500" title="신청 가능" />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            2. 4대 서비스 라인업 (플랫폼 확장 비전)
           =================================================================== */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
              SERVICE LINEUP
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-white">
              소셜 다이닝에서 솔로 라이프스타일 전체로
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              다이닝은 신뢰를 쌓는 첫 번째 관문입니다. 나도솔로는 검증된 회원 체계를 바탕으로 다양한 라이프스타일 교류로 확장됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Social Dining */}
            <Link
              href="/dining"
              className="bg-[#12151e] p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-b from-[#12151e] to-[#1a1520] space-y-4 relative hover:border-rose-500/60 transition-all block group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  현재 오픈
                </span>
                <span className="text-xs text-zinc-400 font-mono">STEP 01</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-rose-200 transition-colors">Social Dining</h3>
              <p className="text-xs text-zinc-400 font-medium">취향 기반 식사 모임</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                매주 금요일 밤, 결이 맞는 6인이 마주 앉아 와인과 음식을 곁들이며 나누는 깊이 있는 디너.
              </p>
              <div className="pt-2 text-xs text-rose-300 font-medium flex items-center gap-1">
                <span>테이블 보기</span>
                <span>→</span>
              </div>
            </Link>

            {/* 2. Social Dating */}
            <Link
              href="/dating"
              className="bg-[#12151e] p-6 rounded-2xl border border-white/10 space-y-4 hover:border-white/30 transition-all block group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/10 text-zinc-300 border border-white/10">
                  신뢰 매칭
                </span>
                <span className="text-xs text-zinc-400 font-mono">STEP 02</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-zinc-200 transition-colors">Social Dating</h3>
              <p className="text-xs text-zinc-400 font-medium">자연스러운 인연</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                5대 매너 평가 매트릭스로 검증된 이성과의 만남. 가벼운 앱과 부담스러운 결정사 사이의 안전한 대안.
              </p>
              <div className="pt-2 text-xs text-zinc-400 font-medium flex items-center gap-1 group-hover:text-white transition-colors">
                <span>프로파일 보기</span>
                <span>→</span>
              </div>
            </Link>

            {/* 3. Social Club */}
            <Link
              href="/club"
              className="bg-[#12151e] p-6 rounded-2xl border border-white/10 space-y-4 hover:border-white/30 transition-all block group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/5 text-zinc-400 border border-white/10">
                  확장 오픈
                </span>
                <span className="text-xs text-zinc-400 font-mono">STEP 03</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-zinc-200 transition-colors">Social Club</h3>
              <p className="text-xs text-zinc-400 font-medium">취미와 관심사 교류</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                와인 테이스팅, 미술 전시 도슨트 투어, 주말 러닝 등 싱글들의 취향을 공유하는 커뮤니티.
              </p>
              <div className="pt-2 text-xs text-zinc-400 font-medium flex items-center gap-1 group-hover:text-white transition-colors">
                <span>클럽 라인업</span>
                <span>→</span>
              </div>
            </Link>

            {/* 4. Private Event */}
            <Link
              href="/events"
              className="bg-[#12151e] p-6 rounded-2xl border border-white/10 space-y-4 hover:border-white/30 transition-all block group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/5 text-zinc-400 border border-white/10">
                  월 2~4회 한정
                </span>
                <span className="text-xs text-zinc-400 font-mono">STEP 04</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-zinc-200 transition-colors">Private Event</h3>
              <p className="text-xs text-zinc-400 font-medium">세대별 특별 행사</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                3045 프라임 직장인·사업가 교류회 및 5060 골든 솔로를 위한 인생 2막 프라이빗 살롱 파티.
              </p>
              <div className="pt-2 text-xs text-amber-300 font-medium flex items-center gap-1">
                <span>일정 확인</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </section>

        {/* ===================================================================
            3. PRIVATE DOSSIER (신뢰와 매너 평가 매트릭스)
           =================================================================== */}
        <section id="coaching-system" className="space-y-6 scroll-mt-24">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-rose-400 font-medium">
              TRUST EVALUATION SYSTEM
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-white">
              나도솔로가 신뢰를 보증하는 비결: 5대 매너 매트릭스
            </h2>
            <p className="text-base text-zinc-300 max-w-2xl leading-relaxed">
              직업은 신뢰의 수단일 뿐, 사람의 인격을 보장하지 않습니다. 나도솔로는 다이닝에 참석한 동석자들의 5대 영역 상호 평가를 통해 품격 있는 매너를 갖춘 회원만을 엄선하여 유지합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {DOMAIN_CORE.map((item) => (
              <div
                key={item.key}
                className="bg-[#12151e] p-6 rounded-2xl border border-white/10 space-y-3.5 hover:border-white/20 transition-all"
              >
                <span className="text-xs tracking-wider text-zinc-400 block font-medium">
                  {item.enLabel}
                </span>
                <h3 className="text-xl font-medium text-white">{item.label}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 한 줄 인용 */}
          <div className="bg-[#12151e] p-6 sm:p-8 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <span className="text-xs text-zinc-400 uppercase tracking-widest font-medium">
                동석자 실제 관찰평 (프라이빗 리포트 예시)
              </span>
              <p className="text-base sm:text-lg text-zinc-200 italic font-serif-editorial">
                &ldquo;{cmsMirrorQuotes[0]?.quoteText ?? '자연스럽게 대화를 이끌어주셔서 편안했고, 와인 에티켓과 배려가 인상 깊었습니다.'}&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleApply()}
              className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all shrink-0 cursor-pointer"
            >
              내 리포트 확인하기 →
            </button>
          </div>
        </section>

        {/* ===================================================================
            4. 세대별 트랙 안내 (3045 Prime & 5060 Golden)
           =================================================================== */}
        <section id="atmospheres" className="space-y-6 scroll-mt-24">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
              GENERATION TRACKS
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-white">
              나의 세대와 라이프스타일에 맞는 테이블
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 트랙 1 */}
            <div
              onClick={() => setSelectedMode('ROMANCE')}
              className={`bg-[#12151e] rounded-3xl overflow-hidden border transition-all cursor-pointer p-7 sm:p-8 space-y-5 ${
                selectedMode === 'ROMANCE' ? 'border-rose-500/50 ring-1 ring-rose-500/30' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-2.5">
                <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold border border-rose-500/20">
                  3045 PRIME TRACK
                </div>
                <h3 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white">
                  3045 프라임 직장인·사업가 다이닝
                </h3>
                <p className="text-base text-zinc-300 leading-relaxed font-normal">
                  사회적으로 자리 잡고 자기 일을 사랑하는 30~45세 싱글들을 위한 금요일 밤의 와인 &amp; 프라이빗 다이닝. 가벼운 소개팅 대신 결이 맞는 인연을 찾습니다.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">서면·전포 • 매주 금요일 19:30</span>
                <span className="text-rose-300 font-medium">선택하기 →</span>
              </div>
            </div>

            {/* 트랙 2 */}
            <div
              onClick={() => setSelectedMode('THEME')}
              className={`bg-[#12151e] rounded-3xl overflow-hidden border transition-all cursor-pointer p-7 sm:p-8 space-y-5 ${
                selectedMode === 'THEME' ? 'border-amber-500/50 ring-1 ring-amber-500/30' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-2.5">
                <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/20">
                  5060 GOLDEN TRACK
                </div>
                <h3 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white">
                  5060 골든 솔로 라이프스타일 살롱
                </h3>
                <p className="text-base text-zinc-300 leading-relaxed font-normal">
                  인생 후반전, 취향과 여유를 함께 나눌 진솔한 동반자를 찾는 50~60대를 위한 안심 프라이빗 모임. 검증된 신원과 매너로 품격 있는 교류를 제공합니다.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">서면·전포 • 매주 토요일 17:30</span>
                <span className="text-amber-300 font-medium">선택하기 →</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            5. HOW IT WORKS (진행 방식 - Timeleft식 초경량 모델 안내)
           =================================================================== */}
        <section id="how-it-works" className="space-y-6 scroll-mt-24">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
              PROCESS
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-white">
              어떻게 진행되나요?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#12151e] p-7 sm:p-8 rounded-2xl border border-white/10 space-y-3.5">
              <span className="text-sm text-zinc-400 font-mono font-bold">01</span>
              <h3 className="text-lg font-medium text-white">참가권 신청 &amp; 프로필 등록</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                부담 없는 참가비(25,000원)로 희망 일정과 라이프스타일 프로필을 등록합니다.
              </p>
            </div>

            <div className="bg-[#12151e] p-7 sm:p-8 rounded-2xl border border-white/10 space-y-3.5">
              <span className="text-sm text-zinc-400 font-mono font-bold">02</span>
              <h3 className="text-lg font-medium text-white">테이블 매칭 &amp; 장소 안내</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                나이대와 결이 맞는 6인 테이블이 편성되며, 전포동 엄선된 식당 예약명이 D-1 비공개 안내됩니다.
              </p>
            </div>

            <div className="bg-[#12151e] p-7 sm:p-8 rounded-2xl border border-white/10 space-y-3.5">
              <span className="text-sm text-zinc-400 font-mono font-bold">03</span>
              <h3 className="text-lg font-medium text-white">현장 식사 1/N &amp; 상호 피드백</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                원하는 메뉴를 자유롭게 시켜 식사 후 각자 계산하며, 식사 후 매너 평가와 시크릿 호감 투표를 진행합니다.
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="w-full bg-[#090a0f] border-t border-white/10 py-10">
        <div className="w-full max-w-[1320px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <span className="font-serif-editorial text-2xl font-medium text-white lowercase">
            nadosolo
          </span>
          <p>© 2026 NadoSolo Society. Trust-Based Solo Lifestyle Platform.</p>
        </div>
      </footer>
    </div>
  );
}
