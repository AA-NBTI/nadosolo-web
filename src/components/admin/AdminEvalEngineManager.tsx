'use client';

import React, { useState } from 'react';
import {
  MajorDomainDef,
  EvaluationCriterionDef,
  SubElementDef,
} from '@/engine';
import {
  ArrowLeft,
  ChevronRight,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  majorDomains: MajorDomainDef[];
  evaluationCriteria: EvaluationCriterionDef[];
  subElements: SubElementDef[];
  onToggleSubElementActive: (id: string) => void;
  onUpdateSubElement: (item: SubElementDef) => void;
  onNotify?: (msg: string) => void;
  isLight?: boolean;
}

export default function AdminEvalEngineManager({
  majorDomains,
  evaluationCriteria,
  subElements,
  onToggleSubElementActive,
  onUpdateSubElement,
  onNotify,
  isLight = false,
}: Props) {
  // 선택된 항목 ID (도메인 코드 또는 'CRITERIA')
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const notify = (msg: string) => {
    if (onNotify) onNotify(msg);
  };

  const cardBg = isLight ? 'bg-white border-zinc-300' : 'bg-[#0c0d12] border-white/10';
  const subCardBg = isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/[0.08]';
  const textTitle = isLight ? 'text-zinc-900' : 'text-white';
  const textMuted = isLight ? 'text-zinc-500' : 'text-zinc-400';
  const borderLine = isLight ? 'border-zinc-200' : 'border-white/10';
  const inputCls = isLight
    ? 'bg-white border-zinc-300 text-zinc-900 focus:border-zinc-800'
    : 'bg-[#08090d] border-white/15 text-white focus:border-white/30';

  // ==========================================================================
  // [VIEW B] 클릭 시 진입하는 상세 설정 화면 (Detail View)
  // ==========================================================================
  if (selectedTarget) {
    // 1. 공통 5대 평가 기준 상세
    if (selectedTarget === 'CRITERIA') {
      return (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => setSelectedTarget(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 hover:border-white/40 bg-white/[0.03] text-sm font-mono text-zinc-200 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-white" />
              <span>목록</span>
            </button>
            <span className="text-sm font-mono text-zinc-500 uppercase">
              CRITERIA STANDARD
            </span>
          </div>

          <div className={`p-5 border ${cardBg} space-y-2`}>
            <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-white border border-white/10">
              5대 표준 평가 기준 (20점 만점 규격)
            </span>
            <h3 className={`font-serif-editorial text-xl font-normal ${textTitle}`}>
              정돈 · 조화 · 센스 · 안정 · 호감
            </h3>
            <p className={`text-sm font-light ${textMuted}`}>
              모든 대분류 요소에 동일하게 4점 만점으로 적용되어 합산 20점 만점 척도를 구성합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {evaluationCriteria.map((crit) => (
              <div key={crit.code} className={`p-4 border ${subCardBg} space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="font-serif-editorial text-base text-white">
                    {crit.stepOrder}. {crit.label}
                  </span>
                  <span className="px-1.5 py-0.5 text-sm font-mono bg-white/10 text-zinc-300">
                    {crit.maxPoints}점
                  </span>
                </div>
                <div className="pl-3.5 border-l border-white/20 ml-1 mt-1">
                  <p className="text-sm text-zinc-400 font-light leading-relaxed">
                    {crit.definition}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 2. 특정 도메인의 5개 세부 슬롯 상세
    const currentDomain = majorDomains.find((d) => d.code === selectedTarget);
    const domainSlots = subElements.filter((s) => s.majorCode === selectedTarget);

    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setSelectedTarget(null)}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 hover:border-white/40 bg-white/[0.03] text-sm font-mono text-zinc-200 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>전체 도메인 목록으로 복귀</span>
          </button>
          <span className="text-sm font-mono text-zinc-500 uppercase">
            DOMAIN: {currentDomain?.code}
          </span>
        </div>

        <div className={`p-5 border ${cardBg} space-y-2`}>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-white border border-white/10">
              도메인 {currentDomain?.code} (100점 만점)
            </span>
            <span className="text-sm font-mono text-zinc-400">
              슬롯 {domainSlots.length}개 • 활성 {domainSlots.filter((s) => s.activeInCurrentProcess).length}개
            </span>
          </div>
          <h3 className={`font-serif-editorial text-xl font-normal ${textTitle}`}>
            {currentDomain?.label} 대분류 평가 요소
          </h3>
          <div className="pl-3.5 border-l border-white/20 ml-1 mt-1">
            <p className={`text-sm font-light ${textMuted}`}>
              각 슬롯은 단일 명사 1요소 원칙을 준수하며, 활성화된 슬롯만 실제 평가 시트와 리포트에 집계됩니다.
            </p>
          </div>
        </div>

        {/* 5개 슬롯 상세 설정 카드 */}
        <div className="space-y-3">
          {domainSlots.map((sub) => (
            <div
              key={sub.id}
              className={`p-4 sm:p-5 border ${subCardBg} space-y-3`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 text-sm font-mono bg-black/40 text-zinc-300 border border-white/10">
                    슬롯 {sub.slotIndex} (20점)
                  </span>
                  <input
                    type="text"
                    value={sub.label}
                    onChange={(e) => onUpdateSubElement({ ...sub, label: e.target.value })}
                    className={`w-36 px-2.5 py-1 text-sm font-mono border ${inputCls}`}
                    title="단일 명사 1단어 준수"
                  />
                  <span className="text-sm font-mono text-zinc-500">
                    배타슬롯: {sub.exclusionGroup}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleSubElementActive(sub.id);
                    notify(`[${sub.label}] 평가 활성화 여부가 변경되었습니다.`);
                  }}
                  className={`px-3 py-1.5 text-sm font-mono tracking-wider transition-all cursor-pointer ${
                    sub.activeInCurrentProcess
                      ? 'border border-white/30 bg-transparent text-white'
                      : 'border border-white/10 bg-transparent text-zinc-500 hover:text-white'
                  }`}
                >
                  {sub.activeInCurrentProcess ? '평가 포함 ON' : '평가 제외 OFF'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-sm font-mono text-zinc-500 mb-1">
                    보완 코칭 문구 (저득점 시 자동 처방)
                  </label>
                  <input
                    type="text"
                    value={sub.coachingHintLow}
                    onChange={(e) => onUpdateSubElement({ ...sub, coachingHintLow: e.target.value })}
                    className={`w-full px-2.5 py-1 text-sm font-mono border ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-zinc-500 mb-1">
                    강점 코칭 문구 (고득점 시 자동 리포트)
                  </label>
                  <input
                    type="text"
                    value={sub.coachingHintHigh}
                    onChange={(e) => onUpdateSubElement({ ...sub, coachingHintHigh: e.target.value })}
                    className={`w-full px-2.5 py-1 text-sm font-mono border ${inputCls}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // [VIEW A] 마스터 뷰 (설명문 없이 순수 컴팩트 목록만 먼저 노출)
  // ==========================================================================
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 초컴팩트 상단 헤더 바 */}
      <div className={`p-4 border ${cardBg} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h2 className={`font-serif-editorial text-lg font-normal ${textTitle}`}>
            엔진
          </h2>
          <span className="text-sm font-mono text-zinc-500">
            {majorDomains.length}영역 • 25슬롯
          </span>
        </div>
      </div>

      {/* ====================================================================
          컴팩트 2열 그리드 목록 (도메인 5개 + 공통 규격 1개, 한 화면 전체 조망)
          ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* 공통 규격 카드 */}
        <div
          onClick={() => setSelectedTarget('CRITERIA')}
          className="p-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.03] hover:border-white/20 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-white border border-white/10 shrink-0">
              공통 규격
            </span>
            <span className="font-serif-editorial text-sm text-white group-hover:text-white transition-colors truncate">
              5대 표준 평가 기준
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 text-sm font-mono border border-white/20 text-zinc-300">
              공통
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* 5대 도메인 카드 목록 */}
        {majorDomains.map((dom) => {
          const slots = subElements.filter((s) => s.majorCode === dom.code);
          const activeCount = slots.filter((s) => s.activeInCurrentProcess).length;
          return (
            <div
              key={dom.code}
              onClick={() => setSelectedTarget(dom.code)}
              className="p-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.03] hover:border-white/20 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-zinc-300 border border-white/10 shrink-0">
                  {dom.code}
                </span>
                <span className="font-serif-editorial text-sm text-white group-hover:text-white transition-colors truncate">
                  {dom.label}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 text-sm font-mono border ${
                    activeCount === slots.length
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/10 text-zinc-400'
                  }`}
                >
                  활성 {activeCount}/{slots.length}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

