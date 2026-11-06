'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import { useSiteConfig } from '@/engine/siteConfigEngine';
import { User, LogOut, ShieldCheck, MapPin, ArrowRight, Check } from 'lucide-react';

export default function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, regionDistricts } = useNadoSoloEngine();
  const { config } = useSiteConfig();
  const [lang, setLang] = useState<'KO' | 'EN'>('KO');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // 전역 설정에서 네비게이션 메뉴 가져오기
  const navItems = [...(config?.header?.navItems || [])]
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);

  const announcement = config?.header?.announcement;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.handle === '@admin' ||
    currentUser?.userId === 'ADMIN_01';

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    if (isCityDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCityDropdownOpen]);

  // 라이브 개설된 활성 권역 목록
  const activeDistricts = regionDistricts.filter((d) => d.active);

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/95 backdrop-blur-md border-b border-white/10">
      
      {/* 상단 공지 띠배너 */}
      {announcement?.visible && (
        <div className="w-full bg-[#11131c] border-b border-white/10 px-4 py-2 text-center text-xs font-medium text-zinc-300 flex items-center justify-center gap-2">
          {announcement.tag && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider">
              {announcement.tag}
            </span>
          )}
          <span>{announcement.text}</span>
          {announcement.link && (
            <Link
              href={announcement.link}
              className="text-zinc-200 hover:text-white underline font-medium inline-flex items-center gap-0.5 ml-1"
            >
              <span>자세히 보기</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* [좌측] 나도솔로 정통 로고 (영어 nadosolo + 한글 '솔로공감 나도솔로' 폭 일치) */}
        <Link
          href="/"
          className="inline-flex flex-col items-center justify-center shrink-0 hover:opacity-90 transition-opacity group select-none py-1"
        >
          <span className="font-serif-editorial text-2xl sm:text-[27px] font-semibold text-white tracking-tight lowercase leading-none">
            nadosolo
          </span>
          <span className="w-full flex justify-between items-center text-[8.5px] sm:text-[9.5px] font-medium text-rose-300/85 group-hover:text-rose-200 transition-colors tracking-normal mt-1 leading-none">
            <span>솔</span>
            <span>로</span>
            <span>공</span>
            <span>감</span>
            <span className="w-1.5" />
            <span>나</span>
            <span>도</span>
            <span>솔</span>
            <span>로</span>
          </span>
        </Link>

        {/* 4대 핵심 카테고리 네비게이션 (빨간 라인 효과 제거, 볼드 & 텍스트 컬러로만 심플하게 활성화 표시) */}
        <nav className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/dining' && pathname.startsWith('/kr/')) ||
              (item.href === '/salon' && pathname === '/dating');
            return (
              <Link
                key={item.id || item.href}
                href={item.href}
                className={`relative text-[16px] sm:text-[17px] tracking-normal transition-colors py-1 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-zinc-300 hover:text-white font-medium'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* [우측] 거점 드롭다운, 언어 스위처, 로그인/로그아웃/관리자 */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* ==============================================================
              [1번 개선] 라이브 개설 모임 위치 드롭다운 리스트 (별도 창 대신 그 자리에서 심플하게 노출)
              ============================================================== */}
          <div className="relative" ref={cityDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              title="진행 중인 모임 지역 리스트"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-medium tracking-wider">
                {config?.header?.activeCityLabel || '부산 (전포·서면)'}
              </span>
              <span className={`text-[9px] text-zinc-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* 드롭다운 리스트 팝오버 */}
            {isCityDropdownOpen && (
              <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 w-64 bg-[#0f1118] border border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 border-b border-white/5 mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    진행 중인 모임 권역
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-600/30 text-rose-300">
                    LIVE
                  </span>
                </div>

                <div className="space-y-1">
                  {activeDistricts.map((d) => (
                    <button
                      key={d.districtId}
                      type="button"
                      onClick={() => {
                        setIsCityDropdownOpen(false);
                        router.push('/dining');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-white/5 text-xs transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-white group-hover:text-rose-400 transition-colors">
                          {d.districtName}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {d.defaultGatherTime || '매주 금/토 19:30'}
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">
                        신청 →
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-1.5 border-t border-white/5 px-2 text-[10px] text-zinc-500 text-center">
                  타 지역은 개설 시 순차 오픈됩니다.
                </div>
              </div>
            )}
          </div>

          {/* 언어 전환 버튼 */}
          <button
            type="button"
            onClick={() => setLang(lang === 'KO' ? 'EN' : 'KO')}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-medium"
            title="언어 설정 (Language)"
          >
            <span>{lang === 'KO' ? 'EN' : 'KO'}</span>
          </button>

          {/* 로그인 / 프로필 / 관리자 버튼 */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-sm"
                title="마이페이지 / 대시보드 이동"
              >
                <User className="w-3.5 h-3.5 text-rose-500" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">
                  {currentUser.nickname || currentUser.handle}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="w-8 h-8 rounded-full bg-[#881337]/30 hover:bg-[#881337]/50 border border-rose-500/60 text-rose-200 flex items-center justify-center transition-all shadow-[0_0_12px_rgba(190,18,60,0.3)] ml-0.5"
                  title="최고 관리자 대시보드"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-300" />
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-rose-200 bg-[#881337]/30 hover:bg-[#881337]/50 border border-rose-500/50 transition-all shadow-sm flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>로그인</span>
            </Link>
          )}
        </div>
      </div>

      {/* 모바일 하단 서브 네비게이션 */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 bg-[#090a0f] px-2 py-2.5 text-sm">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/salon' && pathname === '/dating');
          return (
            <Link
              key={item.id || item.href}
              href={item.href}
              className={`px-2.5 py-1 rounded-lg transition-colors text-[14px] flex items-center gap-1 ${
                isActive ? 'text-white font-bold bg-white/10' : 'text-zinc-400'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/30 text-rose-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
