'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import YotBargainModal from '@/components/yot/YotBargainModal';
import YotRouletteModal from '@/components/yot/YotRouletteModal';
import YotRankingList from '@/components/yot/YotRankingList';
import {
  YOT_PURPOSE_CHIPS,
  YotVenueItem,
} from '@/lib/yot/yotTypes';
import { Search, ArrowRight, RotateCw, Mail, Clock, UserPlus, Home, LayoutDashboard, ShieldCheck } from 'lucide-react';

export default function YotPage() {
  const router = useRouter();
  const { currentUser } = useNadoSoloEngine();
  const isLoggedIn = Boolean(currentUser);

  // 1단계: 검색 및 입력 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YotVenueItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<YotVenueItem | null>(null);

  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [oneLineReview, setOneLineReview] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2단계: 거래 결과 및 엿 상태
  const [taffyCount, setTaffyCount] = useState<number>(0);
  const [praiseComment, setPraiseComment] = useState<string>('');
  
  // 모달 제어 상태
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);
  const [isRouletteModalOpen, setIsRouletteModalOpen] = useState(false);

  // 최종 쿠폰 상태 (페이지 레벨 보존)
  const [pageCoupon, setPageCoupon] = useState<{
    code: string;
    amount: number;
    expiresAt: string;
  } | null>(null);

  const reviewInputRef = useRef<HTMLInputElement | null>(null);

  // 로그인 회원 이메일 자동 채움
  useEffect(() => {
    if (currentUser?.email && !userEmail) {
      setUserEmail(currentUser.email);
    }
  }, [currentUser]);

  // 로컬 스토리지에 기존 발급된 쿠폰이 있으면 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem('yot_coupon');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.code) {
          setPageCoupon(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // 카카오/로컬 장소 검색
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/yot/places?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.places || []);
        }
      } catch (err) {
        console.warn('검색 에러:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 방문 목적 칩 토글
  const toggleChip = (chipId: string) => {
    setSelectedChips((prev) =>
      prev.includes(chipId) ? prev.filter((id) => id !== chipId) : [...prev, chipId]
    );
  };

  // 엿장수와 거래하기 제출
  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue) {
      alert('가고 싶은 맛집을 먼저 검색하여 선택하십시오.');
      return;
    }
    if (!userEmail.trim() || !userEmail.includes('@')) {
      alert('올바른 이메일 주소를 입력하십시오.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/yot/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue: selectedVenue,
          purpose_tags: selectedChips,
          one_line_review: oneLineReview,
          user_email: userEmail,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTaffyCount(data.taffyCount || 1);
        setPraiseComment(data.praiseComment || '엿장수와 거래가 성사되었소!');

        // 대시보드 연동을 위해 제보 내역 로컬 저장
        try {
          localStorage.setItem(
            'yot_reported_venue',
            JSON.stringify({
              venue: selectedVenue,
              purpose_tags: selectedChips,
              one_line_review: oneLineReview,
              user_email: userEmail,
              reported_at: new Date().toISOString(),
            })
          );
        } catch (e) {}

        setIsBargainModalOpen(true);
      } else {
        const err = await res.json();
        alert(err.error || '오류가 발생했습니다.');
      }
    } catch (err) {
      alert('네트워크 연결을 확인하십시오.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 흥정하기 (모달 닫고 인풋 포커스)
  const handleBargainMore = () => {
    setIsBargainModalOpen(false);
    setTimeout(() => {
      reviewInputRef.current?.focus();
      reviewInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  // 룰렛장 입장 (흥정 모달 닫고 대형 룰렛 모달 오픈)
  const handleEnterRoulette = () => {
    setIsBargainModalOpen(false);
    setIsRouletteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans">
      <main className="flex-1 w-full max-w-[1000px] mx-auto px-6 py-10 sm:py-16">
        
        {/* 상단 시네마틱 2열 분할 헤더 */}
        <div className="rounded-3xl border border-white/15 bg-[#0c0d12] shadow-2xl p-6 sm:p-10 mb-10 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* 좌측: 타이틀 및 안내 */}
            <div className="md:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-black/60 backdrop-blur-md text-xs font-mono text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <span className="font-mono text-zinc-400">YOT-EXCHANGE</span>
                <span className="text-zinc-600">|</span>
                <span className="text-white font-medium">솔로엿장수 정보 거래소</span>
              </div>

              <h1 className="font-serif-editorial text-2xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight">
                혼자 가기 아까운 맛집,<br />
                솔로엿장수한테 파시오!
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                가고 싶었던 숨은 맛집을 제보하고 즉석 룰렛 기회를 획득하십시오.<br className="hidden sm:inline" />
                당신이 판 맛집은 <span className="text-white font-semibold">나도솔로 6인 식탁의 공식 후보지</span>로 등록됩니다.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-300">
                  # 엿가위거래
                </span>
                <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-300">
                  # 100%룰렛당첨
                </span>
                <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-300">
                  # 나도솔로공식후보
                </span>
              </div>
            </div>

            {/* 우측: 16:9 선명한 에디토리얼 시네마틱 비주얼 카드 */}
            <div className="md:col-span-5 relative group">
              <div className="relative aspect-[16/10] sm:aspect-[4/3] md:aspect-[16/11] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                <img
                  src="/images/themes/yot-hero.jpg?v=2"
                  alt="전통 엿장수와 황동 엿가위"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono">
                  <span className="px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/15 text-white font-medium">
                    YOT-ROULETTE
                  </span>
                  <span className="text-zinc-400 drop-shadow">
                    INFORMATION EXCHANGE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1단계: 맛집 제보 및 엿 거래 섹션 */}
        <div className="border border-white/10 bg-[#0c0d12] rounded-2xl p-6 sm:p-10 mb-8 shadow-xl">
          <form onSubmit={handleTradeSubmit} className="space-y-7">
            
            {/* ① 맛집 등록 */}
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-white flex items-center gap-2">
                <span className="font-mono text-[#f04f74]">01.</span>
                맛집 등록 (식당명 검색)
              </label>

              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="식당 이름 2글자 이상 입력 (예: 바오하우스)"
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#f04f74] transition-colors"
                  />
                  {isSearching && (
                    <div className="absolute right-4 text-xs text-zinc-500 font-mono">검색중...</div>
                  )}
                </div>

                {/* 검색 결과 드롭다운 */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-30 max-h-60 overflow-y-auto bg-[#12131a] border border-white/10 rounded-xl shadow-2xl divide-y divide-white/5">
                    {searchResults.map((item) => (
                      <button
                        key={item.provider_place_id}
                        type="button"
                        onClick={() => {
                          setSelectedVenue(item);
                          setSearchQuery(item.place_name);
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-3.5 hover:bg-white/5 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-[#f04f74] transition-colors">
                            {item.place_name}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {item.address_name} {item.category_name ? `· ${item.category_name}` : ''}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#f04f74] border border-[#f04f74]/30 bg-[#f04f74]/10 px-2 py-0.5 rounded">
                          선택
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 선택된 식당 표시 배지 */}
              {selectedVenue && (
                <div className="p-3 rounded-xl border border-[#f04f74]/30 bg-[#f04f74]/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 font-mono">선택:</span>
                    <span className="ml-2 text-sm font-semibold text-white">{selectedVenue.place_name}</span>
                    <span className="ml-2 text-xs text-zinc-400">({selectedVenue.region_dong || selectedVenue.address_name})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVenue(null);
                      setSearchQuery('');
                    }}
                    className="text-xs text-[#f04f74] hover:underline"
                  >
                    변경
                  </button>
                </div>
              )}
            </div>

            {/* ② 이유 선택 (방문 목적 칩 복수 선택) */}
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-white flex items-center gap-2">
                <span className="font-mono text-[#f04f74]">02.</span>
                이유 선택 (해당 항목 모두 선택)
              </label>

              <div className="flex flex-wrap gap-2">
                {YOT_PURPOSE_CHIPS.map((chip) => {
                  const active = selectedChips.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleChip(chip.id)}
                      className={`px-3 py-2 rounded-xl text-sm transition-all border ${
                        active
                          ? 'border-[#f04f74] bg-[#f04f74] text-white font-semibold shadow-[0_2px_10px_rgba(240,79,116,0.4)]'
                          : 'border-white/10 bg-black/40 text-zinc-300 hover:border-white/30'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ③ 꿀팁 입력 (선택형 주관식) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white flex items-center gap-2">
                <span className="font-mono text-[#f04f74]">03.</span>
                꿀팁 입력
              </label>
              <input
                ref={reviewInputRef}
                type="text"
                value={oneLineReview}
                onChange={(e) => setOneLineReview(e.target.value)}
                placeholder="예: 가지튀김과 마파두부는 무조건 여럿이 시켜야 제맛"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#f04f74] transition-colors"
              />
            </div>

            {/* ④ 이메일 입력 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white flex items-center gap-2">
                <span className="font-mono text-[#f04f74]">04.</span>
                이메일 입력
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#f04f74] transition-colors font-mono"
                />
              </div>
            </div>

            {/* "엿장수와 거래하기" 버튼 (폭 max-w-md mx-auto) */}
            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full max-w-md py-3.5 rounded-xl bg-[#f04f74] text-white font-semibold text-base hover:bg-[#d63f63] transition-all flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(240,79,116,0.4)] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RotateCw className="w-5 h-5 animate-spin" /> 확인 중...
                  </span>
                ) : (
                  <>
                    <span>✂️ 솔로엿장수와 거래하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 솔로미식단 랭킹 전체보기 연결 티저 */}
        <div className="mb-8 text-center">
          <Link
            href="/misik"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full bg-white/5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <span>회원들이 뽑은 솔로미식단(솔미단) 랭킹 보러가기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 이미 발급된 바우처가 있을 경우 메인 화면에서도 즉시 출구 제공 */}
        {pageCoupon && (
          <div className="border border-white/15 bg-[#0c0d12] rounded-2xl p-6 sm:p-8 mb-8 text-center space-y-4 shadow-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs font-mono text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-[#f04f74]" />
              <span>3일 유효</span>
            </div>

            <h3 className="text-xl font-serif-editorial text-white">
              보유 바우처: <span className="font-mono text-[#f04f74] font-bold">{pageCoupon.code}</span>
            </h3>

            {/* 사족 없는 간결한 3대 시스템 출구 버튼 (로그인 여부에 맞춤 전환) */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => router.push('/meetup')}
                className="px-6 py-3 rounded-xl bg-[#f04f74] text-white font-semibold text-sm hover:bg-[#d63f63] transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>예약하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-zinc-300" />
                  <span>내 대시보드</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push(`/auth?coupon=${pageCoupon.code}`)}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-zinc-300" />
                  <span>회원가입</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-3 text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>홈으로</span>
              </button>
            </div>
          </div>
        )}

        {/* 엿장수 감정 & 흥정 모달 */}
        <YotBargainModal
          isOpen={isBargainModalOpen}
          onClose={() => setIsBargainModalOpen(false)}
          taffyCount={taffyCount}
          venueName={selectedVenue?.place_name || ''}
          praiseComment={praiseComment}
          onBargainMore={handleBargainMore}
          onEnterRoulette={handleEnterRoulette}
        />

        {/* 대형 룰렛 새창(풀스크린 모달) */}
        <YotRouletteModal
          isOpen={isRouletteModalOpen}
          onClose={() => {
            setIsRouletteModalOpen(false);
            try {
              const saved = localStorage.getItem('yot_coupon');
              if (saved) setPageCoupon(JSON.parse(saved));
            } catch (e) {}
          }}
          taffyCount={taffyCount}
          userEmail={userEmail}
          isLoggedIn={isLoggedIn}
        />

        {/* 하단 규격 */}
        <div className="text-center text-xs text-zinc-400 font-mono">
          YOT TRADING PROTOCOL · CONFIDENTIAL TASTE ARCHIVE
        </div>
      </main>
    </div>
  );
}
