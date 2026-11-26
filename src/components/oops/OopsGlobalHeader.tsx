'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Radio, Smartphone, X } from 'lucide-react';
import type { OopsLocale } from '@/lib/oops/i18n';
import { FEED_I18N } from '@/lib/oops/feedI18n';
import type { OopsMemberPublic } from '@/lib/oops/memberStore';
import { DEFAULT_OOPS_MODULES, type OopsFeatureModules } from '@/lib/oops/featureModulesStore';

export interface OopsGlobalHeaderProps {
  locale: OopsLocale;
  onLocaleChange?: (next: OopsLocale) => void;
  selectedCountry?: string;
  onCountryChange?: (countryCode: string) => void;
  member?: OopsMemberPublic | null;
  onOpenAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
  modules?: OopsFeatureModules;
}

export const OOPS_LANG_OPTIONS: Array<{
  code: OopsLocale;
  country: string;
  label: string;
}> = [
  { code: 'ko', country: 'KR', label: 'KO' },
  { code: 'en', country: 'US', label: 'EN' },
  { code: 'ja', country: 'JP', label: 'JP' },
  { code: 'zh', country: 'CN', label: 'ZH' },
  { code: 'es', country: 'ES', label: 'ES' },
];

export default function OopsGlobalHeader({
  locale,
  onLocaleChange,
  onCountryChange,
  member = null,
  onOpenAuth,
  modules: propModules,
}: OopsGlobalHeaderProps) {
  const pathname = usePathname();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showEmblemModal, setShowEmblemModal] = useState(false);
  const [fetchedModules, setFetchedModules] = useState<OopsFeatureModules>(DEFAULT_OOPS_MODULES);

  useEffect(() => {
    if (propModules) return;
    void fetch('/api/oops/modules')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d.modules) setFetchedModules(d.modules);
      })
      .catch(() => {});
  }, [propModules]);

  const activeModules = propModules || fetchedModules;

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
    ko: { oath: '선서', archive: '일지', app: '무전', sns: '소통', outpost: '초소' },
    ja: { oath: '宣誓', archive: '日誌', app: '無線', sns: '疎通', outpost: '哨所' },
    zh: { oath: '宣誓', archive: '日志', app: '无线', sns: '沟通', outpost: '哨所' },
    es: { oath: 'Juramento', archive: 'Logs', app: 'APP', sns: 'SNS', outpost: 'Puesto' },
    en: { oath: 'Oath', archive: 'Logs', app: 'APP', sns: 'SNS', outpost: 'Outpost' },
  }[locale] || { oath: 'Oath', archive: 'Logs', app: 'APP', sns: 'SNS', outpost: 'Outpost' };

  const tagline = (FEED_I18N[locale] || FEED_I18N.en).tagline;

  const isOath = pathname?.startsWith('/declaration') || pathname?.startsWith('/oops/declaration');
  const isArchive = pathname?.startsWith('/oops/archive');
  const isApp = pathname?.startsWith('/app') || pathname?.startsWith('/oops/app');
  const isSns = pathname?.startsWith('/sns');

  return (
    <>
      {/* 1. 상단 공통 네비게이션 (시그니처 옐로우 #ffc900, 그림자 제거, 버튼 블랙 사용 금지) */}
      <header className="sticky top-0 z-40 bg-[#ffc900] border-b-4 border-black shadow-none">
        <div className="max-w-3xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2 font-mono">
          {/* 좌측: 엠블럼 + OOPS 로고 */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setShowEmblemModal(true)}
              className="group inline-flex items-center gap-2 select-none cursor-pointer shadow-none"
              title="View Emblem"
            >
              <img
                src="/oops-icon.jpg"
                alt="OOPS.MONSTER"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-black group-hover:scale-105 transition-transform"
              />
            </button>

            <Link
              href="/"
              className="group inline-flex items-center gap-1 select-none cursor-pointer shadow-none"
              title="OOPS Home"
            >
              <span className="inline-block px-2.5 sm:px-3 py-1 bg-[#ff4d00] text-white font-black text-base sm:text-lg font-mono tracking-tight border-2 border-black -rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all uppercase leading-none">
                oops
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-black tracking-tight hidden sm:inline">
                .monster
              </span>
            </Link>
          </div>

          {/* 우측 공통 네비게이션: 선서 / 무전 / 소통 / 초소 (블랙 버튼 금지, 그림자 없음) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* 1. 선서 */}
            <Link
              href="/declaration"
              className={`px-2 sm:px-2.5 py-1.5 font-bold text-xs border-2 border-black shadow-none cursor-pointer transition-colors ${
                isOath
                  ? 'bg-[#ff4d00] text-white'
                  : 'bg-white hover:bg-zinc-100 text-black'
              }`}
            >
              {navLabels.oath}
            </Link>

            {/* 1-1. 일지 (ARCHIVE) */}
            {activeModules.archiveLogs && (
              <Link
                href="/oops/archive"
                className={`px-2 sm:px-2.5 py-1.5 font-bold text-xs border-2 border-black shadow-none cursor-pointer flex items-center gap-1 transition-colors ${
                  isArchive
                    ? 'bg-[#ff4d00] text-white'
                    : 'bg-white hover:bg-zinc-100 text-black'
                }`}
              >
                <span>{navLabels.archive}</span>
              </Link>
            )}

            {/* 2. 무전 (APP) - 모듈 제어 */}
            {activeModules.appRadio && (
              <Link
                href="/app"
                className={`px-2 sm:px-2.5 py-1.5 font-bold text-xs border-2 border-black shadow-none cursor-pointer flex items-center gap-1 transition-colors ${
                  isApp
                    ? 'bg-[#ff4d00] text-white'
                    : 'bg-white hover:bg-zinc-100 text-black'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{navLabels.app}</span>
              </Link>
            )}

            {/* 3. 소통 (SNS) - 모듈 제어 */}
            {activeModules.snsFeed && (
              <Link
                href="/sns"
                className={`px-2 sm:px-2.5 py-1.5 font-bold text-xs border-2 border-black shadow-none cursor-pointer flex items-center gap-1 transition-colors ${
                  isSns
                    ? 'bg-[#ff4d00] text-white'
                    : 'bg-white hover:bg-zinc-100 text-black'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 animate-pulse ${isSns ? 'text-white' : 'text-[#ff4d00]'}`} />
                <span>{navLabels.sns}</span>
              </Link>
            )}

            {/* 4. 초소 - 모듈 제어 */}
            {activeModules.outpostAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth?.('LOGIN')}
                className={`px-2 sm:px-2.5 py-1.5 font-black text-xs border-2 border-black shadow-none cursor-pointer flex items-center gap-1 transition-colors ${
                  member
                    ? 'bg-white text-[#ff4d00] hover:bg-zinc-100'
                    : 'bg-[#ff4d00] text-white hover:bg-[#ff621f]'
                }`}
              >
                <span>{member ? `#${member.serialLabel}` : navLabels.outpost}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. 헤드 카피 영역 + 하얀색 일반형 2글자(KO, EN, JP, ZH, ES) 드롭다운 (그림자 제거) */}
      <div className="oops-headcopy-bar bg-zinc-800 text-white border-b-2 border-black shadow-none">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Radio className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse shrink-0" />
            <span className="font-bold hidden sm:inline truncate">{tagline}</span>
            <span className="font-bold sm:hidden text-[11px] leading-snug line-clamp-2">{tagline}</span>
          </div>

          {/* 2글자 단일 언어 드롭다운 (하얀색 일반형, 그림자 없음) */}
          <div className="oops-lang-dropdown relative shrink-0">
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-zinc-100 text-black border border-zinc-400 rounded-sm text-xs font-bold cursor-pointer shadow-none focus:outline-none"
              title="Language"
            >
              <span>{currentOption.label}</span>
              <ChevronDown className="w-3 h-3 text-zinc-600" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1 w-16 bg-white border border-zinc-400 rounded-sm shadow-none z-50 py-0.5">
                {OOPS_LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-center px-2 py-1 text-xs cursor-pointer shadow-none transition-colors ${
                      locale === opt.code
                        ? 'bg-zinc-200 text-black font-black'
                        : 'bg-white text-black font-medium hover:bg-zinc-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
