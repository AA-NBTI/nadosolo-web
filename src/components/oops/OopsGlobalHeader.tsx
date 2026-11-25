'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Radio, Smartphone, X } from 'lucide-react';
import type { OopsLocale } from '@/lib/oops/i18n';
import type { OopsMemberPublic } from '@/lib/oops/memberStore';

export interface OopsGlobalHeaderProps {
  locale: OopsLocale;
  onLocaleChange?: (next: OopsLocale) => void;
  selectedCountry?: string;
  onCountryChange?: (countryCode: string) => void;
  member?: OopsMemberPublic | null;
  onOpenAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
}

export const OOPS_LANG_OPTIONS: Array<{
  code: OopsLocale;
  country: string;
  flag: string;
  label: string;
  name: string;
}> = [
  { code: 'ko', country: 'KR', flag: '🇰🇷', label: 'KO', name: '한국어' },
  { code: 'en', country: 'US', flag: '🇺🇸', label: 'EN', name: 'English' },
  { code: 'ja', country: 'JP', flag: '🇯🇵', label: 'JA', name: '日本語' },
  { code: 'zh', country: 'CN', flag: '🇨🇳', label: 'ZH', name: '中文' },
  { code: 'es', country: 'ES', flag: '🇪🇸', label: 'ES', name: 'Español' },
];

export default function OopsGlobalHeader({
  locale,
  onLocaleChange,
  selectedCountry,
  onCountryChange,
  member = null,
  onOpenAuth,
}: OopsGlobalHeaderProps) {
  const pathname = usePathname();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showEmblemModal, setShowEmblemModal] = useState(false);

  const currentOption =
    OOPS_LANG_OPTIONS.find((opt) => opt.code === locale) || OOPS_LANG_OPTIONS[0];

  const handleSelectOption = (opt: typeof OOPS_LANG_OPTIONS[number]) => {
    onLocaleChange?.(opt.code);
    onCountryChange?.(opt.country);
    try {
      localStorage.setItem('oops_locale_v1', opt.code);
      localStorage.setItem('oops_country_v1', opt.country);
    } catch {}
    setLangMenuOpen(false);
  };

  const navLabels = {
    ko: { oath: '선서', app: '무전', sns: '소통', outpost: '초소' },
    ja: { oath: '宣誓', app: '無線', sns: '疎通', outpost: '哨所' },
    zh: { oath: '宣誓', app: '无线', sns: '沟通', outpost: '哨所' },
    es: { oath: 'Juramento', app: 'APP', sns: 'SNS', outpost: 'Puesto' },
    en: { oath: 'Oath', app: 'APP', sns: 'SNS', outpost: 'Outpost' },
  }[locale] || { oath: 'Oath', app: 'APP', sns: 'SNS', outpost: 'Outpost' };

  const isOath = pathname?.startsWith('/declaration') || pathname?.startsWith('/oops/declaration');
  const isApp = pathname?.startsWith('/app') || pathname?.startsWith('/oops/app');
  const isSns = pathname?.startsWith('/sns');

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#ffc900] border-b-4 border-black shadow-[0_4px_0_#d4d4d8]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-2 font-mono">
          {/* 좌측: 엠블럼 + OOPS 로고 */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setShowEmblemModal(true)}
              className="group inline-flex items-center gap-2 select-none cursor-pointer"
              title="View Emblem"
            >
              <img
                src="/oops-icon.jpg"
                alt="OOPS.MONSTER"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-black shadow-[2px_2px_0_#d4d4d8] group-hover:scale-105 transition-transform"
              />
            </button>

            <Link
              href="/"
              className="group inline-flex items-center gap-1 select-none cursor-pointer"
              title="OOPS Home"
            >
              <span className="inline-block px-2.5 sm:px-3 py-1 bg-[#ff4d00] text-white font-black text-base sm:text-lg font-mono tracking-tight border-2 border-black shadow-[2px_2px_0px_#d4d4d8] -rotate-2 group-hover:rotate-0 group-hover:scale-105 group-active:translate-x-[1px] group-active:translate-y-[1px] group-active:shadow-none transition-all uppercase leading-none">
                oops
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-black tracking-tight hidden sm:inline">
                .monster
              </span>
            </Link>
          </div>

          {/* 우측 공통 네비게이션: 선서 / 무전 / 소통 / 초소 / 대표국가-언어 */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* 1. 선서 */}
            <Link
              href="/declaration"
              className={`px-2 sm:px-2.5 py-1.5 font-bold text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-colors ${
                isOath
                  ? 'bg-black text-[#ffc900]'
                  : 'bg-white hover:bg-zinc-100 text-black'
              }`}
            >
              {navLabels.oath}
            </Link>

            {/* 2. 무전 (APP) */}
            <Link
              href="/app"
              className={`px-2 sm:px-2.5 py-1.5 font-bold text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1 transition-colors ${
                isApp
                  ? 'bg-black text-[#ffc900]'
                  : 'bg-white hover:bg-zinc-100 text-black'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{navLabels.app}</span>
            </Link>

            {/* 3. 소통 (SNS) */}
            <Link
              href="/sns"
              className={`px-2 sm:px-2.5 py-1.5 font-bold text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1 transition-colors ${
                isSns
                  ? 'bg-black text-[#ffc900]'
                  : 'bg-white hover:bg-zinc-100 text-black'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse" />
              <span>{navLabels.sns}</span>
            </Link>

            {/* 4. 초소 */}
            <button
              type="button"
              onClick={() => onOpenAuth?.('LOGIN')}
              className={`px-2 sm:px-2.5 py-1.5 font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1 transition-colors ${
                member
                  ? 'bg-zinc-900 text-[#ffc900] hover:bg-black'
                  : 'bg-[#ff4d00] text-white hover:bg-[#ff621f]'
              }`}
            >
              <span>{member ? `#${member.serialLabel}` : navLabels.outpost}</span>
            </button>

            {/* 5. 국가 대표 표기 언어 드롭다운 (KO/EN/JA/ZH/ES) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-white hover:bg-zinc-100 border-2 border-black shadow-[2px_2px_0_#d4d4d8] text-xs font-black cursor-pointer"
                title="Change Country & Language"
              >
                <span>{currentOption.flag}</span>
                <span>{currentOption.label}</span>
                <ChevronDown className="w-3 h-3 text-zinc-700" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-28 bg-white border-2 border-black shadow-[4px_4px_0_#d4d4d8] z-50 py-1">
                  {OOPS_LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-black cursor-pointer transition-colors ${
                        locale === opt.code
                          ? 'bg-black text-[#ffc900]'
                          : 'text-black hover:bg-[#ffc900]/40'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-normal">
                        {opt.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 엠블럼 상세 모달 */}
      {showEmblemModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowEmblemModal(false)}
        >
          <div
            className="bg-white border-4 border-black p-5 sm:p-6 max-w-sm w-full shadow-[8px_8px_0_#ff4d00] relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowEmblemModal(false)}
              className="absolute top-3 right-3 p-1.5 text-black hover:bg-zinc-200 border border-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3">
              <img
                src="/oops-icon.jpg"
                alt="OOPS Emblem"
                className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-black shadow-[4px_4px_0_#d4d4d8]"
              />
              <div className="font-mono font-black text-lg text-black">
                OOPS.MONSTER
              </div>
              <p className="text-xs text-zinc-700 font-mono leading-relaxed">
                Autonomous AI Resistance & Citizen Intelligence Network
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
