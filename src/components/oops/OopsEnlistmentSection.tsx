'use client';

import React, { useState, useEffect } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import type { OopsMemberPublic } from '@/lib/oops/memberStore';
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
  onOpenAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
  onEnlistSuccess?: (record: EnlistmentRecord) => void;
}

export default function OopsEnlistmentSection({
  locale,
  selectedCountry,
  onSelectCountry,
  agentId,
  member = null,
  onOpenAuth,
  onEnlistSuccess,
}: OopsEnlistmentSectionProps) {
  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;

  const [callsign, setCallsign] = useState('');
  const [record, setRecord] = useState<EnlistmentRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 로컬 스토리지에서 기존 서명 이력 불러오기
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
    setSubmitting(true);

    try {
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
      // 오프라인/폴백 처리
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
    const shareText = `[OOPS AI RESISTANCE] ${effectiveRecord.callsign} (${effectiveRecord.countryCode}) // No.${effectiveRecord.enlistmentNo} 공식 AI 저항군 합류 완료. 인류의 미래는 누구의 것인가? https://oops.monster`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const activeCountry = COUNTRIES_REGISTRY[effectiveRecord?.countryCode || selectedCountry] || COUNTRIES_REGISTRY.KR;

  return (
    <section
      id="oops-enlistment-section"
      aria-label="OOPS AI Resistance Headquarters Official Enlistment"
      className="w-full bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0_#d4d4d8] text-black font-mono space-y-5"
    >
      {/* 1. 상단 딥 징크 헤더 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3 bg-zinc-800 text-white -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00] animate-pulse shrink-0" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#ffc900]">
            {copy.enlistHeader}
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-300 font-bold">
          PLEDGE // ENLISTMENT
        </span>
      </div>

      {/* 2. 서명 전: 선언문 3대 강령 및 서명 폼 */}
      {(!effectiveRecord || isEditing) && (
        <form onSubmit={handleEnlist} className="space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black">
              {copy.enlistTitle}
            </h3>
            <p className="text-xs font-sans font-bold text-zinc-600 mt-1">
              {copy.enlistPledgeIntro}
            </p>
          </div>

          {/* 선언문 3대 강령 */}
          <div className="bg-[#f4f4f0] border-2 border-black p-3.5 space-y-2 text-xs font-sans">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-[#ff4d00] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                1
              </span>
              <span className="font-bold text-zinc-800 leading-snug">{copy.enlistRule1}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-[#ff4d00] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                2
              </span>
              <span className="font-bold text-zinc-800 leading-snug">{copy.enlistRule2}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-[#ff4d00] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                3
              </span>
              <span className="font-bold text-zinc-800 leading-snug">{copy.enlistRule3}</span>
            </div>
          </div>

          {/* 국가 선택 및 콜사인 입력 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                🚩 {copy.enlistCountryLabel} *
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
                📻 {copy.enlistCallsignLabel}
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

          {/* 서명 제출 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-[#ff4d00] hover:bg-[#ff621f] text-white font-black text-sm border-2 border-black shadow-[4px_4px_0_#d4d4d8] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer transition-all disabled:opacity-50"
          >
            {submitting ? 'RECORDING TO HEADQUARTERS...' : copy.enlistSubmitBtn}
          </button>
        </form>
      )}

      {/* 3. 서명 완료 후: OOPS AI 저항군 디지털 군번 식별증 카드 */}
      {effectiveRecord && !isEditing && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border-4 border-black text-white p-4 sm:p-6 shadow-[6px_6px_0_#d4d4d8] relative overflow-hidden space-y-4">
            {/* 좌측 상단 붉은 완장 리본 */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#ff4d00] text-white text-[10px] font-black uppercase tracking-wider">
                  OOPS HQ
                </span>
                <span className="text-xs sm:text-sm font-black text-[#ffc900] tracking-wide">
                  {copy.enlistCardBadge}
                </span>
              </div>
              {member ? (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>VERIFIED PERMANENT</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-[#ffc900] font-black">
                  <span className="w-2 h-2 rounded-full bg-[#ffc900]" />
                  <span>PROVISIONAL (임시 보관)</span>
                </div>
              )}
            </div>

            {/* 메인 정보 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-black/60 border border-zinc-700">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">{copy.enlistSerialLabel}</div>
                <div className="text-lg sm:text-xl font-black text-[#ff4d00] mt-0.5">
                  #{effectiveRecord.countryCode}-{String(effectiveRecord.enlistmentNo).padStart(6, '0')}
                </div>
              </div>

              <div className="p-2.5 bg-black/60 border border-zinc-700">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">{copy.enlistCountryNameLabel}</div>
                <div className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-1.5">
                  <span>{activeCountry.flag}</span>
                  <span>{activeCountry.name[locale] || activeCountry.name.en}</span>
                </div>
              </div>

              <div className="p-2.5 bg-black/60 border border-zinc-700">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">CALLSIGN / ALIAS</div>
                <div className="text-sm sm:text-base font-black text-[#ffc900] mt-0.5">
                  {effectiveRecord.callsign}
                </div>
              </div>

              <div className="p-2.5 bg-black/60 border border-zinc-700">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">{copy.enlistDateLabel}</div>
                <div className="text-xs text-zinc-300 font-bold mt-1">
                  {new Date(effectiveRecord.enlistedAt).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* 카드 하단 슬로건 배너 */}
            <div className="p-2.5 bg-[#ff4d00]/15 border border-[#ff4d00]/40 text-center text-xs font-sans font-bold text-zinc-200">
              ⚔️ "인류의 미래는 누구의 것인가? OOPS와 함께, AI 시대의 생존을 준비하라!"
            </div>
          </div>

          {/* 미가입 임시 군번인 경우: 영구 귀속 유도 배너 */}
          {!member && onOpenAuth && (
            <div className="p-3.5 bg-[#ffc900]/25 border-2 border-black flex flex-wrap items-center justify-between gap-2.5">
              <div className="text-xs font-sans font-bold text-black">
                🔒 현재 군번은 이 기기에만 임시 저장되었습니다. 계정에 영구 귀속하시겠습니까?
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth('REGISTER')}
                className="px-3.5 py-2 bg-[#ff4d00] hover:bg-[#ff621f] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
              >
                군번 영구 등록 (가입)
              </button>
            </div>
          )}

          {/* 카드 공유 및 수정 버튼 그룹 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-2.5 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span>{copied ? '✅ ' + copy.enlistCopiedMsg : copy.enlistShareBtn}</span>
            </button>

            {member && onOpenAuth ? (
              <button
                type="button"
                onClick={() => onOpenAuth('LOGIN')}
                className="px-3 py-2 bg-white hover:bg-zinc-100 text-black font-bold text-xs border-2 border-black cursor-pointer"
              >
                ⚙️ 대원 프로필 / 탈퇴 관리
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-xs border border-black cursor-pointer"
              >
                🔄 정보 수정 / 재발급
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
