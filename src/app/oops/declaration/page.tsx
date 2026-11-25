'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, ChevronDown } from 'lucide-react';
import OopsEnlistmentSection from '@/components/oops/OopsEnlistmentSection';
import OopsAuthModal from '@/components/oops/OopsAuthModal';
import { OOPS_DICT, OOPS_LOCALES, type OopsLocale } from '@/lib/oops/i18n';
import type { OopsMemberPublic } from '@/lib/oops/memberStore';
import {
  COUNTRIES_REGISTRY,
  calculateGlobalTotals,
  type CountryData,
  type EnlistmentRecord,
} from '@/lib/oops/movementStore';

export default function OopsDeclarationPage() {
  const [locale, setLocale] = useState<OopsLocale>('ko');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('KR');
  const [movementRegistry, setMovementRegistry] = useState<Record<string, CountryData>>(COUNTRIES_REGISTRY);
  const [movementTotals, setMovementTotals] = useState(calculateGlobalTotals(COUNTRIES_REGISTRY));
  const [recentSignatories, setRecentSignatories] = useState<EnlistmentRecord[]>([]);
  const [member, setMember] = useState<OopsMemberPublic | null>(null);
  const [provisionalRecord, setProvisionalRecord] = useState<EnlistmentRecord | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  useEffect(() => {
    const savedLoc = localStorage.getItem('oops_locale_v1') as OopsLocale | null;
    if (savedLoc && OOPS_DICT[savedLoc]) {
      setLocale(savedLoc);
    }

    try {
      const savedEnlist = localStorage.getItem('oops_enlistment_card_v2');
      if (savedEnlist) {
        const parsed = JSON.parse(savedEnlist) as EnlistmentRecord;
        if (parsed?.enlistmentNo) setProvisionalRecord(parsed);
      }
    } catch {}

    void fetch('/api/oops/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data.member) {
          setMember(data.member);
          if (data.member.countryCode) setSelectedCountry(data.member.countryCode);
        }
      })
      .catch(() => {});

    void fetch('/api/oops/movement')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data.countries) {
          setMovementRegistry(data.countries);
          if (data.totals) setMovementTotals(data.totals);
          if (Array.isArray(data.recentSignatories)) setRecentSignatories(data.recentSignatories);
        }
      })
      .catch(() => {});
  }, []);

  const changeLocale = (next: OopsLocale) => {
    setLocale(next);
    localStorage.setItem('oops_locale_v1', next);
  };

  return (
    <div className="oops-theme min-h-screen bg-[#f4f4f0] text-black flex flex-col selection:bg-zinc-300 selection:text-black">
      {/* 선언서 어울리는 Noto Serif KR 웹폰트 로드 */}
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700;900&display=swap"
        rel="stylesheet"
      />

      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-40 bg-[#ffc900] border-b-4 border-black shadow-[0_4px_0_#d4d4d8]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>OOPS</span>
            </Link>
            <span className="text-sm font-black tracking-tight text-black">
              {locale === 'ko' ? '선서' : locale === 'ja' || locale === 'zh' ? '宣誓' : locale === 'es' ? 'Juramento' : 'Oath'}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-zinc-100 border-2 border-black shadow-[2px_2px_0_#d4d4d8] text-xs font-black cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-700" />
              <span>{OOPS_LOCALES.find((l) => l.code === locale)?.label || 'KO'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-24 bg-white border-2 border-black shadow-[4px_4px_0_#d4d4d8] z-50 py-1">
                {OOPS_LOCALES.map((loc) => (
                  <button
                    key={loc.code}
                    type="button"
                    onClick={() => {
                      changeLocale(loc.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      locale === loc.code ? 'bg-zinc-800 text-white' : 'text-black hover:bg-[#ffc900]/40'
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 선언서 문서 메인 */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <OopsEnlistmentSection
          locale={locale}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          member={member}
          totalSignatures={movementTotals.totalSignatures}
          recentSignatories={recentSignatories}
          isDocumentMode={true}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
          onEnlistSuccess={(rec) => {
            setProvisionalRecord(rec);
            setRecentSignatories((prev) => [rec, ...prev].slice(0, 20));
            setMovementTotals((prev) => ({
              ...prev,
              totalSignatures: prev.totalSignatures + 1,
            }));
          }}
          onReportIncident={() => {
            window.location.href = '/?view=SNS';
          }}
        />
      </main>

      <OopsAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        locale={locale}
        member={member}
        provisionalRecord={provisionalRecord}
        selectedCountry={selectedCountry}
        initialMode={authModalMode}
        onAuthSuccess={(loggedIn) => {
          setMember(loggedIn);
          setSelectedCountry(loggedIn.countryCode);
        }}
        onLogoutSuccess={() => setMember(null)}
        onWithdrawSuccess={() => {
          setMember(null);
          setProvisionalRecord(null);
          try {
            localStorage.removeItem('oops_enlistment_card_v2');
          } catch {}
        }}
      />
    </div>
  );
}
