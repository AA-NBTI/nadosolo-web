'use client';

import React, { useState, useEffect } from 'react';
import {
  PipelineModule,
  SimReport,
  getStoredPipelineModules,
  saveStoredPipelineModules,
  runPipelineSimulation,
} from '@/engine/pipelineEngine';
import {
  Play,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface Props {
  isLight?: boolean;
  onNotify?: (msg: string) => void;
}

export default function AdminPipelineEngineManager({ isLight = false, onNotify }: Props) {
  const [modules, setModules] = useState<PipelineModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [simReport, setSimReport] = useState<SimReport | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    setModules(getStoredPipelineModules());
  }, []);

  const notify = (msg: string) => {
    if (onNotify) onNotify(msg);
  };

  const handleUpdateModule = (updated: PipelineModule) => {
    const next = modules.map((m) => (m.id === updated.id ? updated : m));
    setModules(next);
    saveStoredPipelineModules(next);
  };

  const handleToggleRuleField = (
    moduleId: string,
    ruleId: string,
    field: 'active' | 'exposeToUser' | 'hardConstraint'
  ) => {
    const targetMod = modules.find((m) => m.id === moduleId);
    if (!targetMod) return;

    const nextRules = targetMod.rules.map((r) => {
      if (r.id === ruleId) {
        return { ...r, [field]: !r[field] };
      }
      return r;
    });

    handleUpdateModule({ ...targetMod, rules: nextRules });
    notify(`[${ruleId}] 설정이 변경되었습니다.`);
  };

  const handleToggleModuleGlobal = (moduleId: string, field: 'isActive' | 'exposeToUser') => {
    const targetMod = modules.find((m) => m.id === moduleId);
    if (!targetMod) return;

    handleUpdateModule({ ...targetMod, [field]: !targetMod[field] });
    notify(`[${targetMod.name}] 설정이 변경되었습니다.`);
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const rep = runPipelineSimulation(modules, 120);
      setSimReport(rep);
      setIsSimulating(false);
      notify(`시뮬레이션 완료: ${rep.tablesFormed}개 테이블 편성 (위반 ${rep.hardViolationCount}건)`);
    }, 150);
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  // ==========================================================================
  // [상세 뷰] 리스트 항목 클릭 시 진입하여 내용/설명이 보이는 구조
  // ==========================================================================
  if (selectedModule) {
    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        {/* 상단 복귀 바 */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setSelectedModuleId(null)}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 hover:border-white/40 bg-white/[0.03] hover:bg-white/[0.08] text-sm font-mono text-zinc-200 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>목록</span>
          </button>
          <span className="text-sm font-mono text-zinc-500 uppercase">
            {selectedModule.id}
          </span>
        </div>

        {/* 모듈 설명 & 마스터 스위치 */}
        <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-white border border-white/10">
                  {selectedModule.stageName}
                </span>
                <span className="text-sm font-mono text-zinc-400">
                  근거: {selectedModule.academicBasis}
                </span>
              </div>
              <h3 className="font-serif-editorial text-xl text-white font-normal">
                {selectedModule.name}
              </h3>
              <div className="pl-3.5 border-l border-white/20 ml-1 mt-1">
                <p className="text-sm text-zinc-400 font-light leading-relaxed">
                  {selectedModule.description}
                </p>
              </div>
            </div>

            {/* 마스터 스위치 */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleModuleGlobal(selectedModule.id, 'exposeToUser')}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-sm font-mono transition-all cursor-pointer ${
                  selectedModule.exposeToUser
                    ? 'border-white/30 bg-transparent text-white'
                    : 'border-white/10 bg-transparent text-zinc-500'
                }`}
              >
                {selectedModule.exposeToUser ? (
                  <>
                    <Eye className="w-3 h-3 text-white" />
                    <span>사용자 노출 ON</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 text-zinc-500" />
                    <span>사용자 노출 OFF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleToggleModuleGlobal(selectedModule.id, 'isActive')}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-sm font-mono transition-all cursor-pointer ${
                  selectedModule.isActive
                    ? 'border-white/40 bg-white/10 text-white'
                    : 'border-white/10 bg-transparent text-zinc-500'
                }`}
              >
                <Cpu className="w-3 h-3" />
                <span>{selectedModule.isActive ? '엔진 ON' : '엔진 OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 세부 조건 및 규칙 리스트 */}
        <div className="space-y-2">
          {selectedModule.rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 border border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif-editorial text-sm text-white">{rule.label}</span>
                  {rule.parameter && (
                    <span className="px-1.5 py-0.5 text-sm font-mono bg-black/40 text-zinc-300 border border-white/10">
                      {rule.parameter}
                    </span>
                  )}
                  {rule.hardConstraint ? (
                    <span className="px-1.5 py-0.5 text-sm font-mono bg-black/50 text-white border border-white/30">
                      하드 제약
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-sm font-mono bg-white/[0.04] text-zinc-500 border border-white/10">
                      소프트
                    </span>
                  )}
                </div>
                {/* 하위 설명: 한 글자 뒤로 인덴트 및 좌측 라인 가이드 적용 */}
                <div className="pl-3.5 border-l border-white/20 ml-1 mt-1.5">
                  <p className="text-sm text-zinc-400 font-light leading-relaxed">{rule.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleRuleField(selectedModule.id, rule.id, 'exposeToUser')}
                  className={`px-2.5 py-1 border text-sm font-mono transition-all cursor-pointer ${
                    rule.exposeToUser
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/10 bg-transparent text-zinc-500'
                  }`}
                >
                  {rule.exposeToUser ? '노출 ON' : '노출 OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleRuleField(selectedModule.id, rule.id, 'hardConstraint')}
                  className={`px-2.5 py-1 border text-sm font-mono transition-all cursor-pointer ${
                    rule.hardConstraint
                      ? 'border-white/30 bg-white/10 text-zinc-200'
                      : 'border-white/10 bg-transparent text-zinc-500'
                  }`}
                >
                  {rule.hardConstraint ? '하드 제약' : '일반'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleRuleField(selectedModule.id, rule.id, 'active')}
                  className={`px-2.5 py-1 border text-sm font-mono transition-all cursor-pointer ${
                    rule.active
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/10 bg-transparent text-zinc-500'
                  }`}
                >
                  {rule.active ? '적용' : '해제'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // [마스터 뷰] 설명문 일절 없이, 순수 컴팩트 리스트만 먼저 노출되는 화면
  // ==========================================================================
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 초컴팩트 상단 헤더 바 (장황한 설명문 일절 제거) */}
      <div className="p-4 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h2 className="font-serif-editorial text-lg text-white font-normal">
            매칭
          </h2>
          <span className="text-sm font-mono text-zinc-500">
            {modules.length}건
          </span>
        </div>

        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-white/30 bg-transparent hover:bg-white/[0.04] text-white text-sm font-mono transition-all cursor-pointer disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>연산중</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-white" />
              <span>시뮬레이션</span>
            </>
          )}
        </button>
      </div>

      {/* 시뮬레이션 결과 (실행 시에만 컴팩트 인라인 노출) */}
      {simReport && (
        <div className="p-3 border border-white/15 bg-white/[0.02] flex items-center justify-between text-sm font-mono">
          <div className="flex items-center gap-4">
            <span className="text-white">편성: <strong>{simReport.tablesFormed}룸 ({simReport.assignedUsers}명)</strong></span>
            <span className="text-zinc-400">궁합: <strong className="text-white">{simReport.avgChemistry}점</strong></span>
            <span className="text-zinc-400">제약 위반: <strong className="text-white">{simReport.hardViolationCount}건</strong></span>
            <span className="text-zinc-500">({simReport.executionTimeMs}ms)</span>
          </div>
          <button
            type="button"
            onClick={() => setSimReport(null)}
            className="text-zinc-500 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ====================================================================
          순수 컴팩트 모듈 2열 그리드 (한 화면 조망 & 스크롤 최소화)
          ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {modules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => setSelectedModuleId(mod.id)}
            className="p-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.03] hover:border-white/20 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
          >
            {/* 좌측: 층 태그 + 모듈명 + 규칙 건수 (장황한 설명문 배제) */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-white border border-white/10 shrink-0">
                {mod.stageName.split(':')[0]}
              </span>
              <span className="font-serif-editorial text-sm text-white group-hover:text-white transition-colors truncate">
                {mod.name}
              </span>
              <span className="text-sm font-mono text-zinc-400 hidden sm:inline shrink-0">
                ({mod.rules.length}건)
              </span>
            </div>

            {/* 우측: 뱃지 및 진입 화살표 */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-2 py-0.5 text-sm font-mono border ${
                  mod.exposeToUser
                    ? 'border-white/30 bg-white/10 text-white'
                    : 'border-white/10 text-zinc-500'
                }`}
              >
                {mod.exposeToUser ? '노출' : '비노출'}
              </span>

              <span
                className={`px-2 py-0.5 text-sm font-mono border ${
                  mod.isActive
                    ? 'border-white/20 text-zinc-300'
                    : 'border-white/10 text-zinc-600'
                }`}
              >
                {mod.isActive ? 'ON' : 'OFF'}
              </span>

              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
