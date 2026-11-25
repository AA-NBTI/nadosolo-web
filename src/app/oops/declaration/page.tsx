'use client';

import React, { useEffect, useState } from 'react';
import OopsGlobalHeader from '@/components/oops/OopsGlobalHeader';
import OopsEnlistmentSection from '@/components/oops/OopsEnlistmentSection';
import Global3DDataGlobe from '@/components/oops/Global3DDataGlobe';
import OopsAuthModal from '@/components/oops/OopsAuthModal';
import { OOPS_DICT, type OopsLocale } from '@/lib/oops/i18n';
import type { OopsMemberPublic } from '@/lib/oops/memberStore';
import {
  COUNTRIES_REGISTRY,
  calculateGlobalTotals,
  type CountryData,
  type EnlistmentRecord,
} from '@/lib/oops/movementStore';

export default function OopsDeclarationPage() {
  const [locale, setLocale] = useState<OopsLocale>('ko');
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
    const savedCountry = localStorage.getItem('oops_country_v1');
    if (savedCountry && COUNTRIES_REGISTRY[savedCountry]) {
      setSelectedCountry(savedCountry);
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

      {/* 공통 메인 상단 헤더 */}
      <OopsGlobalHeader
        locale={locale}
        onLocaleChange={changeLocale}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        member={member}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
      />

      {/* 선언서 문서 메인 */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
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
            setMovementRegistry((prev) => {
              const cur = prev[rec.countryCode];
              if (!cur) return prev;
              return {
                ...prev,
                [rec.countryCode]: { ...cur, signatures: cur.signatures + 1 },
              };
            });
            setMovementTotals((prev) => ({
              ...prev,
              totalSignatures: prev.totalSignatures + 1,
            }));
          }}
        />

        {/* 선서 가입국 3D 세계 지도 */}
        <Global3DDataGlobe
          locale={locale}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          countriesRegistry={movementRegistry}
          initialMode="SIGNATURES"
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
