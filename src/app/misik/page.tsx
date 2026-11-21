'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { YotVenueItem } from '@/lib/yot/yotTypes';
import { MapPin, Sparkles, ArrowRight, Utensils, Users, Wine, Flame, Award } from 'lucide-react';

// 솔로미식단(솔미단) 4대 이색 관점 테마 탭
const MISIK_THEMES = [
  { id: 'ALL', label: '전체 랭킹', icon: Award, desc: '솔미단 회원들이 가장 많이 제보한 맛집' },
  { id: 'BURDEN', label: '혼밥불가 2인분', icon: Flame, desc: '혼자 가면 문전박대! 2인분 이상 필수인 고기·전골 성지' },
  { id: 'MANY', label: '메뉴털기 다다익선', icon: Utensils, desc: '시그니처가 너무 많아 4명 이상 가야 전 메뉴를 털 수 있는 곳' },
  { id: 'SALON', label: '6인 살롱 분위기', icon: Wine, desc: '둘이 가면 어색하고, 6명이 모여야 분위기가 폭발하는 와인·다이닝' },
];

export default function SoloMichelinPage() {
  const [activeTheme, setActiveTheme] = useState('ALL');
  const [ranking, setRanking] = useState<(YotVenueItem & { report_count?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/yot/ranking?limit=20')
      .then((res) => res.json())
      .then((data) => {
        if (data.ranking) setRanking(data.ranking);
      })
      .catch((err) => console.warn('랭킹 로드 실패:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // 테마별 필터링 (시뮬레이션 및 데이터 매핑)
  const filteredList = ranking.filter((item, idx) => {
    if (activeTheme === 'ALL') return true;
    if (activeTheme === 'BURDEN') {
      return (
        item.category_name?.includes('육류') ||
        item.category_name?.includes('찌개') ||
        item.category_name?.includes('고기') ||
        idx % 3 === 1
      );
    }
    if (activeTheme === 'MANY') {
      return (
        item.category_name?.includes('아시아') ||
        item.category_name?.includes('중식') ||
        item.category_name?.includes('일식') ||
        idx % 3 === 0
      );
    }
    if (activeTheme === 'SALON') {
      return (
        item.category_name?.includes('술집') ||
        item.category_name?.includes('와인') ||
        item.category_name?.includes('양식') ||
        idx % 3 === 2
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans">
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 py-10 sm:py-16 space-y-10">
        
        {/* 상단 시네마틱 2열 분할 헤더 */}
        <div className="rounded-3xl border border-white/15 bg-[#0c0d12] shadow-2xl p-6 sm:p-10 md:p-12 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* 좌측: 타이틀 및 안내 */}
            <div className="md:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-black/60 backdrop-blur-md text-xs font-mono text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <span className="font-mono text-zinc-400">SOLO-MISIKDAN</span>
                <span className="text-zinc-600">|</span>
                <span className="text-white font-medium">솔로미식단</span>
              </div>

              <h1 className="font-serif-editorial text-2xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight">
                혼자 가기엔 눈치 보이고,<br />
                둘이 가기엔 메뉴가 아쉬울 때
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                허세 가득한 기존 미슐랭의 틀을 깹니다.<br className="hidden sm:inline" />
                혼자서는 엄두가 안 나지만, <span className="text-white font-semibold">취향 맞는 6명이 모이면 완벽해지는 진짜 맛집</span>을 '솔미단' 회원들의 제보로 엄선합니다.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-300">
                  # 6인식탁최적화
                </span>
                <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-300">
                  # 혼밥불가구제
                </span>
                <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-300">
                  # 솔미단자체검증
                </span>
              </div>
            </div>

            {/* 우측: 16:9 선명한 에디토리얼 시네마틱 비주얼 카드 */}
            <div className="md:col-span-5 relative group">
              <div className="relative aspect-[16/10] sm:aspect-[4/3] md:aspect-[16/11] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                <img
                  src="/images/themes/misik-hero.jpg"
                  alt="솔로미식단 6인 미식 식탁"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono">
                  <span className="px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/15 text-white font-medium">
                    6-GUEST TABLE
                  </span>
                  <span className="text-zinc-400 drop-shadow">
                    CONVIVIAL DINING
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4대 이색 관점 탭 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {MISIK_THEMES.map((theme) => {
            const Icon = theme.icon;
            const active = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setActiveTheme(theme.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  active
                    ? 'border-[#f04f74] bg-[#f04f74]/10 shadow-[0_4px_20px_rgba(240,79,116,0.15)]'
                    : 'border-white/10 bg-[#0c0d12] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${active ? 'text-[#f04f74]' : 'text-zinc-400'}`} />
                  <span className={`text-xs font-mono ${active ? 'text-[#f04f74] font-bold' : 'text-zinc-500'}`}>
                    THEME
                  </span>
                </div>
                <div>
                  <div className={`text-sm font-semibold ${active ? 'text-white' : 'text-zinc-200'}`}>
                    {theme.label}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {theme.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 맛집 랭킹 카드 그리드 (2열 헌법 규격) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-sm font-mono text-zinc-400">
              총 <strong className="text-white">{filteredList.length}개</strong>의 솔로미식단 선정 맛집
            </span>
            <Link
              href="/yot"
              className="text-xs font-mono text-[#f04f74] hover:underline flex items-center gap-1"
            >
              <span>+ 나만의 숨은 맛집 제보하기</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredList.map((item, idx) => (
              <div
                key={item.provider_place_id || idx}
                className="p-5 rounded-2xl border border-white/10 bg-[#0c0d12] hover:border-white/25 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-sm font-bold text-[#f04f74] shrink-0">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-base font-semibold text-white truncate">
                        {item.place_name}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 border border-white/10 px-2 py-0.5 rounded bg-black/40 shrink-0">
                      {item.report_count || 1}명 추천
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>{item.address_name || `${item.region_city} ${item.region_dong}`}</span>
                  </div>

                  {/* 이색 솔로 관점 태그 */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                      {item.category_name ? item.category_name.split('>').pop()?.trim() : '미식 맛집'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#f04f74]/10 border border-[#f04f74]/20 text-zinc-200">
                      6인 테이블 추천
                    </span>
                  </div>
                </div>

                {/* 하단 식탁 예약 액션 */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-mono">D-1 슬롯 자동배정 대상</span>
                  <Link
                    href="/meetup"
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-[#f04f74] text-white text-xs font-medium transition-all flex items-center gap-1"
                  >
                    <span>식탁 예약</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 솔로엿장수 거래소 연결 배너 */}
        <div className="rounded-3xl border border-white/15 bg-gradient-to-r from-[#0c0d12] via-[#161722] to-[#0c0d12] p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#f04f74]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>숨은 미식 발굴 프로젝트</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif-editorial text-white">
              아직 솔로미식단에 없는 나만의 맛집이 있나요?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              솔로엿장수에게 맛집 정보를 팔고 룰렛을 돌려 10,000원 웰컴 바우처를 받으세요.
            </p>
          </div>

          <Link
            href="/yot"
            className="px-6 py-3.5 rounded-xl bg-[#f04f74] text-white font-semibold text-sm hover:bg-[#d63f63] transition-all flex items-center gap-2 shrink-0 shadow-[0_4px_20px_rgba(240,79,116,0.4)]"
          >
            <span>✂️ 솔로엿장수에게 맛집 팔기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </main>
    </div>
  );
}
