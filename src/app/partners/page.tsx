'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Users, Utensils, CheckCircle2 } from 'lucide-react';
import { createVenueApplication } from '@/lib/affiliateDb';

export default function PartnerVenuesApplyPage() {
  const [venueName, setVenueName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [passwordPin, setPasswordPin] = useState('');
  const [cityCode, setCityCode] = useState<'SEOUL_SEONGSU' | 'SEOUL_GANGNAM' | 'BUSAN_HAEUNDAE' | 'BUSAN_GWANGAN'>('SEOUL_SEONGSU');
  const [budgetTier, setBudgetTier] = useState<'$' | '$$' | '$$$'>('$$');
  const [maxTables, setMaxTables] = useState(2);
  const [supportsVegan, setSupportsVegan] = useState(false);
  const [supportsNonAlcohol, setSupportsNonAlcohol] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!venueName.trim() || !contactEmail.trim()) {
      setSubmitError('매장명과 담당자 이메일을 입력해 주세요.');
      return;
    }
    if (!passwordPin.trim() || passwordPin.trim().length < 4) {
      setSubmitError('파트너 전용 비밀번호는 4자 이상 입력해 주세요.');
      return;
    }
    const dietary: ('NONE' | 'VEGAN' | 'HALAL' | 'NO_PORK' | 'ALCOHOL_FREE')[] = ['NONE'];
    if (supportsVegan) dietary.push('VEGAN');
    if (supportsNonAlcohol) dietary.push('ALCOHOL_FREE');

    const res = await createVenueApplication({
      venueName: venueName.trim(),
      contactEmail: contactEmail.trim(),
      passwordPin: passwordPin.trim(),
      cityCode,
      budgetTier,
      maxTablesPerNight: maxTables,
      supportedDietary: dietary,
    });
    if (!res.ok) {
      setSubmitError(res.error || '입점 신청 중 오류가 발생했습니다.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[1000px] mx-auto space-y-12">
        <header className="border-b border-white/10 pb-8 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <span className="text-xs font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
                PARTNER RESTAURANTS · B2B
              </span>
              <h1 className="font-serif-editorial text-3xl sm:text-5xl text-white font-normal">
                제휴 식당 · 와인바 파트너 입점
              </h1>
            </div>
            <Link
              href="/partners/dashboard"
              prefetch={true}
              className="px-4 py-2.5 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white font-semibold shrink-0"
            >
              파트너스 로그인
            </Link>
          </div>
          <p className="text-sm sm:text-base text-zinc-300 font-light max-w-2xl leading-relaxed">
            마케팅 비용 0원으로 매주 6인 단위 사전 확정 손님을 배정받으세요. 나도솔로는 식음료 수수료를 받지 않으며, 당일 손님이 매장에서 100% 1/N 직접 결제합니다.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-2">
            <Users className="w-5 h-5 text-[#f04f74]" />
            <h2 className="text-white font-semibold text-base">6인 확정 테이블 송객</h2>
            <p className="text-zinc-400 leading-relaxed">
              노쇼 방지 규율과 사전 결제를 통과한 6인 단위 모임을 매주 원하는 요일에 배정합니다.
            </p>
          </div>
          <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-2">
            <Utensils className="w-5 h-5 text-[#f04f74]" />
            <h2 className="text-white font-semibold text-base">식음료 수수료 0원</h2>
            <p className="text-zinc-400 leading-relaxed">
              음식과 주류 매출은 100% 매장 수익입니다. 플랫폼은 식대 정산에 일절 관여하지 않습니다.
            </p>
          </div>
          <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-2">
            <MapPin className="w-5 h-5 text-[#f04f74]" />
            <h2 className="text-white font-semibold text-base">비건 · 논알콜 자동 매칭</h2>
            <p className="text-zinc-400 leading-relaxed">
              매장이 지원하는 식단과 예산 티어에 맞는 테이블만 엔진이 자동으로 연결해 드립니다.
            </p>
          </div>
        </section>

        <section className="p-6 sm:p-8 border border-white/10 bg-[#0c0d12] space-y-5">
          <h2 className="font-serif-editorial text-2xl text-white font-normal">제휴 식당 등록 신청</h2>
          {submitted ? (
            <div className="p-5 border border-white/20 bg-[#07080a] space-y-3 text-sm">
              <div className="flex items-center gap-2 text-white font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#f04f74]" />
                <span>[{venueName}] 제휴 식당 입점 신청이 접수되었습니다. (심사대기)</span>
              </div>
              <p className="text-zinc-400">
                관리자 승인 완료 후 6인 테이블 배정 후보 매장으로 활성화됩니다. 파트너스 포털에서 심사 상태와 배정 현황을 확인하실 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/partners/dashboard" prefetch={true} className="inline-block px-4 py-2 bg-[#f04f74] text-white font-mono font-semibold">
                  파트너스 로그인
                </Link>
                <Link href="/" prefetch={true} className="inline-block px-4 py-2 border border-white/20 text-white font-mono">
                  홈
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <input
                type="text"
                required
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="매장명 (예: 성수 프라이빗 와인바)"
                className="px-4 py-3 bg-[#07080a] border border-white/15 text-white"
              />
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="담당자 이메일 (로그인 ID)"
                className="px-4 py-3 bg-[#07080a] border border-white/15 text-white"
              />
              <input
                type="password"
                required
                value={passwordPin}
                onChange={(e) => setPasswordPin(e.target.value)}
                placeholder="파트너 비밀번호 (4자 이상)"
                className="px-4 py-3 bg-[#07080a] border border-white/15 font-mono text-white"
              />
              <select
                value={cityCode}
                onChange={(e) => setCityCode(e.target.value as any)}
                className="px-4 py-3 bg-[#07080a] border border-white/15 text-white"
              >
                <option value="SEOUL_SEONGSU">서울 · 성수</option>
                <option value="SEOUL_GANGNAM">서울 · 강남</option>
                <option value="BUSAN_HAEUNDAE">부산 · 해운대</option>
                <option value="BUSAN_GWANGAN">부산 · 광안리</option>
              </select>
              <select
                value={budgetTier}
                onChange={(e) => setBudgetTier(e.target.value as any)}
                className="px-4 py-3 bg-[#07080a] border border-white/15 text-white"
              >
                <option value="$">1인 객단가 $ (3만원대)</option>
                <option value="$$">1인 객단가 $$ (5~7만원대)</option>
                <option value="$$$">1인 객단가 $$$ (10만원 이상)</option>
              </select>
              <input
                type="number"
                min={1}
                max={10}
                value={maxTables}
                onChange={(e) => setMaxTables(Math.max(1, Number(e.target.value) || 1))}
                placeholder="1일 수용 테이블 수 (6인 기준)"
                className="px-4 py-3 bg-[#07080a] border border-white/15 text-white"
              />
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supportsVegan}
                  onChange={(e) => setSupportsVegan(e.target.checked)}
                />
                <span>비건(채식) 메뉴 제공 가능</span>
              </label>
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supportsNonAlcohol}
                  onChange={(e) => setSupportsNonAlcohol(e.target.checked)}
                />
                <span>논알콜 음료 주문 가능</span>
              </label>
              {submitError && (
                <p className="sm:col-span-2 text-sm font-mono text-[#f04f74]">{submitError}</p>
              )}
              <button
                type="submit"
                className="sm:col-span-2 py-3 bg-[#f04f74] text-white font-mono font-semibold cursor-pointer"
              >
                입점 신청
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
