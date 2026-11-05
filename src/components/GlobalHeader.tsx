'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import { useSiteConfig } from '@/engine/siteConfigEngine';
import { User, LogOut, ShieldCheck, MapPin, Sparkles, Megaphone, ArrowRight } from 'lucide-react';
import CitySwitcherModal from '@/components/CitySwitcherModal';

export default function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useNadoSoloEngine();
  const { config } = useSiteConfig();
  const [lang, setLang] = useState<'KO' | 'EN'>('KO');
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // 전역 설정에서 네비게이션 메뉴 가져오기 (순서 정렬 및 visible 필터)
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

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/95 backdrop-blur-md border-b border-white/10">
      
      {/* ==============================================================
          관리자 제어 상단 공지 띠배너 (Announcement Bar)
          ============================================================== */}
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
        
        {/* ==============================================================
            [좌측] 나도솔로 정통 텍스트 로고
            ============================================================== */}
        <Link
          href="/"
          className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-white tracking-tight lowercase shrink-0 hover:opacity-85 transition-opacity"
        >
          nadosolo
        </Link>

        {/* ==============================================================
            관리자 설정 주도형 4대 핵심 카테고리 네비게이션
            ============================================================== */}
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
                {isActive && (
                  <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ==============================================================
            [우측] 거점 뱃지, 언어 스위처, 로그인/로그아웃/관리자
            ============================================================== */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 도시 뱃지 (클릭 시 도시 허브 선택 모달 오픈) */}
          <button
            type="button"
            onClick={() => setIsCityModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            title="모임 지역 및 도시 선택"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-medium tracking-wider">
              {config?.header?.activeCityLabel || '부산 (전포·서면)'}
            </span>
            <span className="text-[10px] text-zinc-500">▼</span>
          </button>

          {/* 언어 전환 버튼 (KO / EN) */}
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
                <User className="w-3.5 h-3.5 text-rose-400" />
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

      {/* 도시 선택 & 사전 오픈 알림 모달 */}
      <CitySwitcherModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
      />
    </header>
  );
}
