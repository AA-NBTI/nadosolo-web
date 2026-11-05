'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MajorDomainCode, useNadoSoloEngine } from '@/engine';

export default function PersonalMirrorReportPage() {
  const {
    currentUser,
    majorDomains,
    evaluationCriteria,
    subElements,
    myPersonalDossier,
    granularBadges,
    cmsPages,
    cmsMirrorQuotes,
  } = useNadoSoloEngine();

  const [selectedDomainCode, setSelectedDomainCode] =
    useState<MajorDomainCode>('STYLE');

  const mirrorPage = cmsPages.find((p) => p.pageId === 'PAGE_MIRROR');
  const activeDomainSummary =
    myPersonalDossier.domainSummaries.find(
      (d) => d.majorCode === selectedDomainCode
    ) ?? myPersonalDossier.domainSummaries[0];

  return (
    <main className="w-full max-w-[1380px] mx-auto px-6 py-12 space-y-12">
      {/* 1. 상단 히어로 화보 카드 */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 shadow-md min-h-[340px] flex flex-col justify-end">
        {mirrorPage?.heroImage && (
          <img
            src={mirrorPage.heroImage}
            alt="Personal Dossier"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/50 to-transparent" />
        <div className="relative z-10 p-8 sm:p-10 text-white space-y-3">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#881337] text-xs font-bold tracking-wider uppercase text-white">
            {mirrorPage?.badgeText ?? '5×5×5 PERSONAL DOSSIER REPORT'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
            {currentUser
              ? `${currentUser.nickname} (${currentUser.handle})님의 100점 코칭 프로파일`
              : mirrorPage?.headline}
          </h1>
          <p className="text-base text-stone-200 max-w-2xl">
            {mirrorPage?.subheadline}
          </p>
        </div>
      </section>

      {/* 2. 핵심 100점 종합 지표 (전체 vs 이성 3인 vs 동성 2인 분리) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-7 rounded-3xl bg-[#10131c] text-white shadow-sm">
          <p className="text-xs font-bold text-zinc-500 uppercase">
            TOTAL DOSSIER SCORE
          </p>
          <p className="text-sm font-semibold text-stone-300 mt-1">
            5대 영역 종합 정규화 점수
          </p>
          <p className="text-5xl font-bold mt-3">
            {myPersonalDossier.totalScore100}
            <span className="text-base font-normal text-zinc-500"> / 100</span>
          </p>
        </div>

        <div className="p-7 rounded-3xl bg-primary-fixed/40 border border-primary/25 shadow-sm">
          <p className="text-xs font-bold text-primary uppercase">
            OPPOSITE-SEX VIEW (이성 시선)
          </p>
          <p className="text-sm font-semibold text-zinc-300 mt-1">
            이성 동석자 3인 관찰 점수
          </p>
          <p className="text-5xl font-bold text-primary mt-3">
            {myPersonalDossier.oppositeSexTotal100}
            <span className="text-base font-normal text-zinc-400"> / 100</span>
          </p>
        </div>

        <div className="p-7 rounded-3xl bg-[#12151e] border border-white/10 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase">
            SAME-SEX VIEW (동성 시선)
          </p>
          <p className="text-sm font-semibold text-zinc-300 mt-1">
            동성 동석자 2인 관찰 점수
          </p>
          <p className="text-5xl font-bold text-white mt-3">
            {myPersonalDossier.sameSexTotal100}
            <span className="text-base font-normal text-zinc-500"> / 100</span>
          </p>
        </div>
      </section>

      {/* 3. [체계 A] 5대 대분류 × 5개 중분류 (각 20점 = 100점) 정밀 해부 */}
      <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
        <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase">
              5 MAJOR DOMAINS × 5 SUB-ELEMENTS
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">
              5대 영역별 100점 성적표 및 25개 요소 상세
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {myPersonalDossier.domainSummaries.map((dom) => (
              <button
                key={dom.majorCode}
                type="button"
                onClick={() => setSelectedDomainCode(dom.majorCode)}
                className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                  selectedDomainCode === dom.majorCode
                    ? 'bg-primary-container text-white'
                    : 'bg-[#1c202e] text-zinc-300 hover:bg-[#252b3d]'
                }`}
              >
                {dom.label} ({dom.score100}점)
              </button>
            ))}
          </div>
        </div>

        {/* 5대 대분류 요약 바 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {myPersonalDossier.domainSummaries.map((dom) => (
            <div
              key={dom.majorCode}
              onClick={() => setSelectedDomainCode(dom.majorCode)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedDomainCode === dom.majorCode
                  ? 'border-primary bg-primary-fixed/25'
                  : 'border-white/10 bg-[#1c202e]'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">
                  {dom.label}
                </span>
                <span className="text-xs font-bold text-primary">
                  이성 {dom.oppositeSexScore100}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">
                {dom.score100}
                <span className="text-xs text-zinc-500"> / 100</span>
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                자가 {dom.selfScore100}점
              </p>
            </div>
          ))}
        </div>

        {/* 선택된 대분류의 5개 중분류 상세 (각 20점 × 5 = 100점) */}
        {activeDomainSummary && (
          <div className="p-6 rounded-2xl bg-[#1c202e] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                [{activeDomainSummary.label}] 산하 5개 중분류 정밀 점수 (각 20점 만점)
              </h3>
              <span className="text-sm font-bold text-primary">
                영역 합산 환산: {activeDomainSummary.score100} / 100점
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {activeDomainSummary.subSummaries.map((sub, idx) => (
                <div
                  key={sub.subElementId}
                  className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 space-y-2 text-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">
                      슬롯 {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      이성 {sub.oppositeSexScore20}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {sub.label}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {sub.score20}
                    <span className="text-xs text-zinc-500"> / 20점</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4. [체계 B] 5대 평가 기준 (정돈 · 조화 · 센스 · 안정 · 호감) 오각형 밸런스 */}
      <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold text-primary uppercase">
            5 EVALUATION CRITERIA (20점 × 5 = 100점)
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">
            5대 평가 기준 밸런스 지표 (정돈 · 조화 · 센스 · 안정 · 호감)
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            전 영역을 관통하는 나의 기본기(정돈)부터 감각(센스), 최종 끌림(호감)까지의 패턴입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {evaluationCriteria.map((crit) => {
            const val20 = myPersonalDossier.criteriaRadar20[crit.code] ?? 15;
            const pct = Math.round((val20 / 20) * 100);
            return (
              <div
                key={crit.code}
                className="p-5 rounded-2xl bg-[#1c202e] border border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">
                    {crit.stepOrder}. {crit.label}
                  </span>
                  <span className="text-xs font-bold text-primary">{pct}%</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {val20}
                  <span className="text-xs text-zinc-500"> / 20점</span>
                </p>
                <div className="w-full h-2 rounded-full bg-[#252b3d] overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-400">{crit.definition}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. 결정적 강점 3선 & 1% 사각지대 코칭 처방 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#12151e] rounded-3xl p-7 border border-white/10 shadow-sm space-y-4">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            TOP STRENGTHS
          </span>
          <h3 className="text-xl font-bold text-white">
            동석자가 반한 결정적 강점 요소
          </h3>
          <div className="space-y-3">
            {myPersonalDossier.topStrengthElements.map((el) => {
              const subDef = subElements.find((s) => s.id === el.subElementId);
              const dom = majorDomains.find((d) => d.code === el.majorCode);
              return (
                <div
                  key={el.subElementId}
                  className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200"
                >
                  <div className="flex items-center justify-between font-bold text-sm text-emerald-950">
                    <span>
                      [{dom?.label} &gt; {el.label}]
                    </span>
                    <span>{el.score20} / 20점</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                    {subDef?.coachingHintHigh}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#12151e] rounded-3xl p-7 border border-white/10 shadow-sm space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            COACHING PRESCRIPTION
          </span>
          <h3 className="text-xl font-bold text-white">
            매력을 2배 높이는 핀포인트 코칭 처방
          </h3>
          <div className="space-y-3">
            {myPersonalDossier.blindSpotElements.map((el) => {
              const subDef = subElements.find((s) => s.id === el.subElementId);
              const dom = majorDomains.find((d) => d.code === el.majorCode);
              return (
                <div
                  key={el.subElementId}
                  className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200"
                >
                  <div className="flex items-center justify-between font-bold text-sm text-amber-950">
                    <span>
                      [{dom?.label} &gt; {el.label}]
                    </span>
                    <span>{el.score20} / 20점 (집중 코칭)</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                    {subDef?.coachingHintLow}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. 동석자 코멘트 & 후속 1:1 코칭/매칭 연결 */}
      <section className="bg-[#12151e] rounded-3xl p-8 border border-white/10 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-white">
          동석자 실전 관찰 코멘트
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cmsMirrorQuotes.map((q) => (
            <div
              key={q.id}
              className="p-6 rounded-2xl bg-[#1c202e] border border-white/10 space-y-3"
            >
              <p className="text-base text-zinc-200 leading-relaxed">
                &ldquo;{q.quoteText}&rdquo;
              </p>
              <p className="text-xs font-bold text-primary">{q.authorLabel}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-bold text-white">
              검증된 프로파일로 1:1 프리미엄 매칭 · 개인화 코칭 이어가기
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              획득한 {myPersonalDossier.earnedBadgeIds.length}개의 인증 뱃지와{' '}
              {myPersonalDossier.totalScore100}점의 실전 프로파일로 조건부 모임에 참여할 수 있습니다.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-2xl bg-[#881337] hover:bg-[#6f102d] text-white text-sm font-bold shadow-md transition-colors"
          >
            대시보드에서 조건부 모임 신청하기 →
          </Link>
        </div>
      </section>
    </main>
  );
}
