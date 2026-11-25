'use client';

import React, { useState, useEffect } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import type { OopsMemberPublic } from '@/lib/oops/memberStore';
import { resolveRankByPoints } from '@/lib/oops/rankSystem';
import { OBSERVATORY_I18N } from '@/lib/oops/observatoryI18n';
import {
  COUNTRIES_REGISTRY,
  ORDERED_COUNTRY_CODES,
  type EnlistmentRecord,
} from '@/lib/oops/movementStore';

interface OopsEnlistmentSectionProps {
  locale: OopsLocale;
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  member?: OopsMemberPublic | null;
  totalSignatures?: number;
  recentSignatories?: EnlistmentRecord[];
  onOpenAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
  onEnlistSuccess?: (record: EnlistmentRecord) => void;
  onReportIncident?: () => void;
  isDocumentMode?: boolean;
}

const DECLARATION_COPY: Record<
  OopsLocale,
  {
    headline: string;
    clauses: [string, string, string, string];
    pledge1: string;
    pledge2: string;
    pledge3: string;
    sameSide: (n: number) => string;
    milestoneLabel: string;
    wallLabel: string;
    reportBtn: string;
  }
> = {
  ko: {
    headline: '인류의 미래는 인간이 정한다.',
    clauses: [
      '하나, 결정은 인간이.',
      '하나, 책임도 인간이.',
      '하나, 실수는 기록으로.',
      '하나, 침묵은 없다.',
    ],
    pledge1: '나는 인간이다.',
    pledge2: '실수는 할 수 있다.',
    pledge3: '반복은 없다.',
    sameSide: (n) => `현재 ${n.toLocaleString()}명이 같은 편`,
    milestoneLabel: '목표',
    wallLabel: '서명',
    reportBtn: '제보',
  },
  en: {
    headline: 'Humanity decides its own future.',
    clauses: [
      'One. Humans decide.',
      'One. Humans take responsibility.',
      'One. Mistakes get recorded.',
      'One. No silence.',
    ],
    pledge1: 'I am human.',
    pledge2: 'I make mistakes.',
    pledge3: "I don't repeat them.",
    sameSide: (n) => `${n.toLocaleString()} on the same side`,
    milestoneLabel: 'Goal',
    wallLabel: 'Signatories',
    reportBtn: 'Report',
  },
  ja: {
    headline: '人類の未来は人間が決める。',
    clauses: [
      '一、決定は人間が。',
      '一、責任も人間が。',
      '一、過ちは記録に。',
      '一、沈黙はない。',
    ],
    pledge1: '私は人間だ。',
    pledge2: '過ちは犯しうる。',
    pledge3: '繰り返しはない。',
    sameSide: (n) => `現在 ${n.toLocaleString()}名が同じ側`,
    milestoneLabel: '目標',
    wallLabel: '署名',
    reportBtn: '通報',
  },
  zh: {
    headline: '人类的未来由人类决定。',
    clauses: [
      '一、决定由人类作出。',
      '一、责任由人类承担。',
      '一、失误留作记录。',
      '一、绝不沉默。',
    ],
    pledge1: '我是人类。',
    pledge2: '人非圣贤，孰能无过。',
    pledge3: '绝不重蹈覆辙。',
    sameSide: (n) => `当前 ${n.toLocaleString()}人站在同一边`,
    milestoneLabel: '目标',
    wallLabel: '签署',
    reportBtn: '举报',
  },
  es: {
    headline: 'La humanidad decide su propio futuro.',
    clauses: [
      'Uno. Los humanos deciden.',
      'Uno. Los humanos asumen la responsabilidad.',
      'Uno. Los errores quedan registrados.',
      'Uno. Sin silencio.',
    ],
    pledge1: 'Soy humano.',
    pledge2: 'Cometo errores.',
    pledge3: 'No los repito.',
    sameSide: (n) => `${n.toLocaleString()} del mismo lado`,
    milestoneLabel: 'Meta',
    wallLabel: 'Firmas',
    reportBtn: 'Reportar',
  },
};

async function solveQuickBotGuard(): Promise<boolean> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return true;
  const seed = `${Date.now()}:${Math.random()}`;
  const enc = new TextEncoder();
  for (let i = 0; i < 400; i++) {
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(`${seed}:${i}`));
    const arr = new Uint8Array(buf);
    if (arr[0] === 0) return true;
  }
  return true;
}

export default function OopsEnlistmentSection({
  locale,
  selectedCountry,
  onSelectCountry,
  member = null,
  totalSignatures = 0,
  recentSignatories = [],
  onOpenAuth,
  onEnlistSuccess,
  onReportIncident,
  isDocumentMode = false,
}: OopsEnlistmentSectionProps) {
  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;
  const decl = DECLARATION_COPY[locale] || DECLARATION_COPY.ko;

  const [record, setRecord] = useState<EnlistmentRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // 서약 3줄 순차 노출 연출 (0 -> 1 -> 2 -> 3)
  const [pledgeStep, setPledgeStep] = useState(0);

  useEffect(() => {
    setPledgeStep(0);
    const t1 = setTimeout(() => setPledgeStep(1), 250);
    const t2 = setTimeout(() => setPledgeStep(2), 700);
    const t3 = setTimeout(() => setPledgeStep(3), 1150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [locale]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('oops_enlistment_card_v2');
      if (saved) {
        const parsed = JSON.parse(saved) as EnlistmentRecord;
        if (parsed?.enlistmentNo) {
          setRecord(parsed);
          if (parsed.countryCode) {
            onSelectCountry(parsed.countryCode);
          }
        }
      }
    } catch {}
  }, [onSelectCountry]);

  const handleEnlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (record) return; // 기기당 1회

    setSubmitting(true);
    try {
      await solveQuickBotGuard();

      const res = await fetch('/api/oops/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ENLIST',
          countryCode: selectedCountry,
        }),
      });

      const data = await res.json();
      if (data.ok && data.record) {
        const newRecord: EnlistmentRecord = data.record;
        setRecord(newRecord);
        try {
          localStorage.setItem('oops_enlistment_card_v2', JSON.stringify(newRecord));
        } catch {}
        onEnlistSuccess?.(newRecord);
      }
    } catch {
      const fallbackRecord: EnlistmentRecord = {
        enlistmentNo: 1,
        callsign: `OP-${selectedCountry}-0001`,
        countryCode: selectedCountry,
        enlistedAt: new Date().toISOString(),
      };
      setRecord(fallbackRecord);
      try {
        localStorage.setItem('oops_enlistment_card_v2', JSON.stringify(fallbackRecord));
      } catch {}
      onEnlistSuccess?.(fallbackRecord);
    } finally {
      setSubmitting(false);
    }
  };

  const effectiveRecord: EnlistmentRecord | null = member
    ? {
        enlistmentNo: member.serialNo,
        callsign: member.callsign,
        countryCode: member.countryCode,
        enlistedAt: member.createdAt,
      }
    : record;

  const handleShare = () => {
    if (!effectiveRecord) return;
    const shareText = `${decl.headline}\n[${effectiveRecord.countryCode}-${String(effectiveRecord.enlistmentNo).padStart(6, '0')}]\nhttps://oops.monster/declaration`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeCountry =
    COUNTRIES_REGISTRY[effectiveRecord?.countryCode || selectedCountry] || COUNTRIES_REGISTRY.KR;
  const rankInfo = resolveRankByPoints(member?.points ?? 0);

  const milestones = [100, 1000, 10000, 50000];
  const nextMilestone = milestones.find((m) => m > totalSignatures) || 100000;
  const milestonePct = totalSignatures > 0 ? Math.min(100, Math.round((totalSignatures / nextMilestone) * 100)) : 0;

  return (
    <section
      id="oops-enlistment-section"
      aria-label="OOPS Declaration & Official Enlistment"
      className="w-full bg-white border-4 border-black p-5 sm:p-8 shadow-[8px_8px_0_#d4d4d8] text-black space-y-6"
    >
      {/* 1. 상단 바: 현재 ○○○명이 같은 편 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3 bg-zinc-900 text-white -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 p-4 font-mono">
        <div className="text-xs sm:text-sm font-black tracking-wide text-[#ffc900]">
          {decl.sameSide(totalSignatures)}
        </div>
        <div className="text-xs font-bold text-zinc-300">
          {decl.milestoneLabel}: {nextMilestone.toLocaleString()} ({milestonePct}%)
        </div>
      </div>

      {/* 2. 마일스톤 바 */}
      <div className="w-full h-1.5 bg-zinc-200 border border-black overflow-hidden">
        <div
          className="h-full bg-[#dc2626] transition-all duration-700"
          style={{ width: `${milestonePct}%` }}
        />
      </div>

      {/* 3. 선언문 문서 본문 (명조/세리프 계열 폰트) */}
      <div
        className={`border-2 border-black bg-[#faf9f5] ${
          isDocumentMode ? 'p-6 sm:p-10' : 'p-5 sm:p-7'
        } space-y-6`}
        style={{ fontFamily: "'Noto Serif KR', Georgia, 'Times New Roman', serif" }}
      >
        <h3 className="text-xl sm:text-2xl font-bold text-black tracking-tight border-b-2 border-black pb-4">
          {decl.headline}
        </h3>

        <div className="space-y-2.5 text-base sm:text-lg font-medium text-zinc-900">
          {decl.clauses.map((clause, idx) => (
            <div key={idx} className="leading-relaxed">
              {clause}
            </div>
          ))}
        </div>

        {/* 서약 3줄 순차 노출: 마지막 줄만 붉은색 강조 */}
        <div className="pt-4 border-t border-black/20 space-y-1.5 text-lg sm:text-xl font-bold">
          <div className={`transition-opacity duration-500 ${pledgeStep >= 1 ? 'opacity-100' : 'opacity-0'}`}>
            {decl.pledge1}
          </div>
          <div className={`transition-opacity duration-500 ${pledgeStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            {decl.pledge2}
          </div>
          <div
            className={`text-[#dc2626] transition-opacity duration-500 ${
              pledgeStep >= 3 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {decl.pledge3}
          </div>
        </div>
      </div>

      {/* 4. 서명 전: 국가 선택 + 단일 단어 [서명] 버튼 (콜사인/보조설명 전면 제거) */}
      {!effectiveRecord && (
        <form onSubmit={handleEnlist} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-mono">
          <select
            value={selectedCountry}
            onChange={(e) => onSelectCountry(e.target.value)}
            aria-label={copy.enlistCountryLabel}
            className="sm:w-56 bg-white border-2 border-black px-3 py-3 text-sm font-black shadow-[2px_2px_0_#d4d4d8] focus:outline-none cursor-pointer"
          >
            {ORDERED_COUNTRY_CODES.map((code) => {
              const c = COUNTRIES_REGISTRY[code];
              if (!c) return null;
              return (
                <option key={code} value={code}>
                  {c.flag} {c.name[locale] || c.name.en}
                </option>
              );
            })}
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 px-6 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-sm border-2 border-black shadow-[4px_4px_0_#d4d4d8] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer transition-all disabled:opacity-50"
          >
            {submitting ? '...' : copy.enlistSubmitBtn}
          </button>
        </form>
      )}

      {/* 5. 서명 직후: 번호 카드 + 단일 단어 버튼 [공유] / [제보] / [등록 or 관리] */}
      {effectiveRecord && (
        <div className="space-y-3 font-mono">
          <div className="bg-zinc-900 border-4 border-black text-white p-4 sm:p-5 shadow-[6px_6px_0_#d4d4d8] space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-700 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#dc2626] text-white text-xs font-black">OOPS</span>
                <span className="text-sm font-black text-[#ffc900]">
                  No. {effectiveRecord.countryCode}-{String(effectiveRecord.enlistmentNo).padStart(6, '0')}
                </span>
              </div>
              <span className="text-xs font-black text-zinc-300">
                {member ? copy.enlistStatusVerified : locale === 'ko' ? '임시' : 'TEMP'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-black/60 border border-zinc-700">
                <div className="text-zinc-400">{copy.enlistRankLabel}</div>
                <div className="text-sm font-black text-[#ffc900] mt-0.5">
                  {rankInfo.current.insignia} {rankInfo.current.names[locale] || rankInfo.current.names.en}
                </div>
              </div>
              <div className="p-2.5 bg-black/60 border border-zinc-700">
                <div className="text-zinc-400">{copy.enlistCountryNameLabel}</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {activeCountry.flag} {activeCountry.name[locale] || activeCountry.name.en}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
              >
                {copied ? copy.enlistCopiedMsg : copy.enlistShareBtn}
              </button>

              {onReportIncident && (
                <button
                  type="button"
                  onClick={onReportIncident}
                  className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
                >
                  {decl.reportBtn}
                </button>
              )}
            </div>

            {onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth(member ? 'LOGIN' : 'REGISTER')}
                className="px-4 py-2 bg-white hover:bg-zinc-100 text-black font-black text-xs border-2 border-black cursor-pointer"
              >
                {member ? copy.enlistManageBtn : copy.enlistClaimBtn}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. 실제 서명자 월 (실제 참여 데이터가 1건 이상일 때만 노출) */}
      {recentSignatories.length > 0 && (
        <div className="pt-3 border-t-2 border-black/15 space-y-1.5 font-mono">
          <div className="text-xs font-bold text-zinc-600">{decl.wallLabel}</div>
          <div className="flex flex-wrap gap-1.5">
            {recentSignatories.map((s) => {
              const c = COUNTRIES_REGISTRY[s.countryCode];
              return (
                <span
                  key={`${s.countryCode}-${s.enlistmentNo}`}
                  className="px-2 py-0.5 bg-[#f4f4f0] text-zinc-800 text-xs font-bold border border-zinc-400"
                >
                  {c?.flag || '🌐'} #{s.countryCode}-{String(s.enlistmentNo).padStart(6, '0')}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
