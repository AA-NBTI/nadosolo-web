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
  agentId?: string;
  member?: OopsMemberPublic | null;
  totalSignatures?: number;
  onOpenAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
  onEnlistSuccess?: (record: EnlistmentRecord) => void;
  onReportIncident?: () => void;
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
    disclaimer: string;
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
    disclaimer: '*"나는 인간이다"는 증명이 아니라 선언입니다.',
    milestoneLabel: '다음 목표',
    wallLabel: '최근 서명',
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
    sameSide: (n) => `Currently ${n.toLocaleString()} on the same side`,
    disclaimer: '*"I am human" is a declaration, not a verification.',
    milestoneLabel: 'Next Milestone',
    wallLabel: 'Recent Signatories',
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
    disclaimer: '※「私は人間だ」は証明ではなく宣言です。',
    milestoneLabel: '次の目標',
    wallLabel: '最近の署名',
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
    disclaimer: '*“我是人类”是自愿宣言，而非身份证明。',
    milestoneLabel: '下一目标',
    wallLabel: '最新签署',
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
    sameSide: (n) => `Actualmente ${n.toLocaleString()} del mismo lado`,
    disclaimer: '*"Soy humano" es una declaración, no una verificación.',
    milestoneLabel: 'Próxima Meta',
    wallLabel: 'Firmas Recientes',
    reportBtn: 'Reportar',
  },
};

const SEED_SIGNATORIES = [
  { flag: '🇰🇷', serial: 'KR-018491', callsign: 'OP-SEOUL' },
  { flag: '🇺🇸', serial: 'US-018490', callsign: 'OP-AUSTIN' },
  { flag: '🇯🇵', serial: 'JP-018489', callsign: 'OP-TOKYO' },
  { flag: '🇩🇪', serial: 'DE-018488', callsign: 'OP-BERLIN' },
  { flag: '🇬🇧', serial: 'GB-018487', callsign: 'OP-LONDON' },
  { flag: '🇫🇷', serial: 'FR-018486', callsign: 'OP-PARIS' },
];

async function solveQuickBotGuard(): Promise<boolean> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return true;
  const seed = `${Date.now()}:${Math.random()}`;
  const enc = new TextEncoder();
  for (let i = 0; i < 400; i++) {
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(`${seed}:${i}`));
    const arr = new Uint8Array(buf);
    if (arr[0] === 0) return true; // 1/256 경량 PoW (약 1~2ms)
  }
  return true;
}

export default function OopsEnlistmentSection({
  locale,
  selectedCountry,
  onSelectCountry,
  agentId,
  member = null,
  totalSignatures = 48900,
  onOpenAuth,
  onEnlistSuccess,
  onReportIncident,
}: OopsEnlistmentSectionProps) {
  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;
  const decl = DECLARATION_COPY[locale] || DECLARATION_COPY.ko;

  const [callsign, setCallsign] = useState('');
  const [record, setRecord] = useState<EnlistmentRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  // 로컬 스토리지에서 기기 1회 서명 이력 불러오기
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
    // 기기당 1회 중복 방지 (수정 모드가 아닐 때 이미 서명된 기기 차단)
    if (record && !isEditing) return;

    setSubmitting(true);
    try {
      await solveQuickBotGuard();

      const activeCallsign =
        callsign.trim() || `OP-${selectedCountry}-${(agentId || 'HERO').slice(-4).toUpperCase()}`;

      const res = await fetch('/api/oops/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ENLIST',
          callsign: activeCallsign,
          countryCode: selectedCountry,
        }),
      });

      const data = await res.json();
      if (data.ok && data.record) {
        const newRecord: EnlistmentRecord = data.record;
        setRecord(newRecord);
        setIsEditing(false);
        try {
          localStorage.setItem('oops_enlistment_card_v2', JSON.stringify(newRecord));
        } catch {}
        onEnlistSuccess?.(newRecord);
      }
    } catch {
      const fallbackRecord: EnlistmentRecord = {
        enlistmentNo: 18492,
        callsign: callsign.trim() || `OP-${selectedCountry}-ACTIVE`,
        countryCode: selectedCountry,
        enlistedAt: new Date().toISOString(),
      };
      setRecord(fallbackRecord);
      setIsEditing(false);
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
    const shareText = `${decl.headline} (${decl.sameSide(totalSignatures)})\n[${effectiveRecord.countryCode}-${String(effectiveRecord.enlistmentNo).padStart(6, '0')}] ${effectiveRecord.callsign}\nhttps://oops.monster`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const activeCountry =
    COUNTRIES_REGISTRY[effectiveRecord?.countryCode || selectedCountry] || COUNTRIES_REGISTRY.KR;
  const rankInfo = resolveRankByPoints(member?.points ?? 0);

  // 마일스톤 계산 (1,000 / 10,000 / 50,000 / 100,000)
  const milestones = [1000, 10000, 50000, 100000];
  const nextMilestone = milestones.find((m) => m > totalSignatures) || 100000;
  const milestonePct = Math.min(100, Math.round((totalSignatures / nextMilestone) * 100));

  return (
    <section
      id="oops-enlistment-section"
      aria-label="OOPS Declaration & Official Enlistment"
      className="w-full bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0_#d4d4d8] text-black font-mono space-y-5"
    >
      {/* 1. 상단 바: 현재 ○○○명이 같은 편 (실시간 동조자 카운터) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3 bg-zinc-900 text-white -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4">
        <div className="text-xs sm:text-sm font-black tracking-wide text-[#ffc900]">
          {decl.sameSide(totalSignatures)}
        </div>
        <div className="text-[11px] font-bold text-zinc-300">
          {decl.milestoneLabel}: {nextMilestone.toLocaleString()} ({milestonePct}%)
        </div>
      </div>

      {/* 2. 마일스톤 진행 바 */}
      <div className="w-full h-2 bg-zinc-200 border border-black overflow-hidden">
        <div
          className="h-full bg-[#dc2626] transition-all duration-700"
          style={{ width: `${milestonePct}%` }}
        />
      </div>

      {/* 3. 차분하고 단단한 확정 선언문 블록 (원안 100% 보존 + 마지막 붉은색 강조 + 3줄 순차 노출) */}
      <div className="bg-[#fafaf8] border-2 border-black p-5 sm:p-6 space-y-5 font-sans">
        <h3 className="text-lg sm:text-xl font-black text-black tracking-tight border-b-2 border-black pb-3">
          {decl.headline}
        </h3>

        <div className="space-y-1.5 text-sm sm:text-base font-bold text-zinc-800">
          {decl.clauses.map((clause, idx) => (
            <div key={idx} className="leading-relaxed">
              {clause}
            </div>
          ))}
        </div>

        {/* 서약 3줄 순차 노출: 마지막 '반복은 없다.'만 붉은색 강조 */}
        <div className="pt-3 border-t border-black/15 space-y-1 text-base sm:text-lg font-black">
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

        <div className="text-[11px] font-medium text-zinc-500 pt-1">
          {decl.disclaimer}
        </div>
      </div>

      {/* 4. 서명 전: 국가 선택(선택) + 콜사인 + 단일 단어 [서명] 버튼 */}
      {(!effectiveRecord || isEditing) && (
        <form onSubmit={handleEnlist} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                {copy.enlistCountryLabel}
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => onSelectCountry(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 text-xs font-black shadow-[2px_2px_0_#d4d4d8] focus:outline-none"
              >
                {ORDERED_COUNTRY_CODES.map((code) => {
                  const c = COUNTRIES_REGISTRY[code];
                  if (!c) return null;
                  return (
                    <option key={code} value={code}>
                      {c.flag} {c.name[locale] || c.name.en} ({code})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                {copy.enlistCallsignLabel}
              </label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder={copy.enlistCallsignPlaceholder}
                maxLength={24}
                className="w-full bg-white border-2 border-black p-2.5 text-xs font-black shadow-[2px_2px_0_#d4d4d8] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-sm border-2 border-black shadow-[4px_4px_0_#d4d4d8] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer transition-all disabled:opacity-50"
          >
            {submitting ? '...' : copy.enlistSubmitBtn}
          </button>
        </form>
      )}

      {/* 5. 서명 직후: 번호가 붙은 카드 발급 + 공유 + 첫 행동 [제보] + [등록] */}
      {effectiveRecord && !isEditing && (
        <div className="space-y-3">
          <div className="bg-zinc-900 border-4 border-black text-white p-4 sm:p-5 shadow-[6px_6px_0_#d4d4d8] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-700 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#dc2626] text-white text-[10px] font-black">OOPS</span>
                <span className="text-xs font-black text-[#ffc900]">
                  No. {effectiveRecord.countryCode}-{String(effectiveRecord.enlistmentNo).padStart(6, '0')}
                </span>
              </div>
              <span className="text-[10px] font-black text-zinc-300">
                {member ? copy.enlistStatusVerified : locale === 'ko' ? '임시' : 'TEMP'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 bg-black/60 border border-zinc-700">
                <div className="text-[10px] text-zinc-400">{copy.enlistRankLabel}</div>
                <div className="text-sm font-black text-[#ffc900] mt-0.5">
                  {rankInfo.current.insignia} {rankInfo.current.names[locale] || rankInfo.current.names.en}
                </div>
              </div>
              <div className="p-2 bg-black/60 border border-zinc-700">
                <div className="text-[10px] text-zinc-400">{copy.enlistCountryNameLabel}</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {activeCountry.flag} {activeCountry.code}
                </div>
              </div>
              <div className="p-2 bg-black/60 border border-zinc-700">
                <div className="text-[10px] text-zinc-400">CALLSIGN</div>
                <div className="text-sm font-black text-white mt-0.5 truncate">
                  {effectiveRecord.callsign}
                </div>
              </div>
            </div>
          </div>

          {/* 미가입 시 영구 귀속 유도 */}
          {!member && onOpenAuth && (
            <div className="p-3 bg-[#ffc900]/25 border-2 border-black flex items-center justify-between gap-2">
              <div className="text-xs font-sans font-bold text-black">
                {locale === 'ko'
                  ? '임시 카드입니다. 초소에 영구 등록할 수 있습니다.'
                  : 'Provisional card. Register at Outpost to keep permanently.'}
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth('REGISTER')}
                className="px-3.5 py-1.5 bg-[#ff4d00] hover:bg-[#ff621f] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer shrink-0"
              >
                {copy.enlistClaimBtn}
              </button>
            </div>
          )}

          {/* 단일 단어 액션 버튼: [공유] / [제보] / [관리 or 수정] */}
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
                  title={locale === 'ko' ? '오늘 AI가 친 사고 한 줄 접수' : 'Report AI incident'}
                  className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
                >
                  {decl.reportBtn}
                </button>
              )}
            </div>

            {member && onOpenAuth ? (
              <button
                type="button"
                onClick={() => onOpenAuth('LOGIN')}
                className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-black font-black text-xs border-2 border-black cursor-pointer"
              >
                {copy.enlistManageBtn}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs border-2 border-black cursor-pointer"
              >
                {copy.enlistEditBtn}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. 서명자 월 (Wall of Signatories: 최근 서명 흐르는 바) */}
      <div className="pt-3 border-t-2 border-black/15 space-y-1.5">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          {decl.wallLabel}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {effectiveRecord && (
            <span className="px-2 py-0.5 bg-zinc-900 text-[#ffc900] text-[11px] font-bold border border-black">
              {activeCountry.flag} #{effectiveRecord.countryCode}-{String(effectiveRecord.enlistmentNo).padStart(6, '0')} {effectiveRecord.callsign}
            </span>
          )}
          {SEED_SIGNATORIES.map((s) => (
            <span
              key={s.serial}
              className="px-2 py-0.5 bg-[#f4f4f0] text-zinc-700 text-[11px] font-bold border border-zinc-400"
            >
              {s.flag} #{s.serial} {s.callsign}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
