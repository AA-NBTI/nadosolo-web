'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Flame,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { OOPS_DICT, OOPS_LOCALES, type OopsLocale } from '@/lib/oops/i18n';
import OopsGlobalHeader from '@/components/oops/OopsGlobalHeader';
import {
  DEFAULT_SCORING_CONTEXT,
  DEFAULT_THREAT_MODULES,
  OPTIONAL_PLUGGABLE_MODULE,
  PRE_ORIGIN_BENCHMARKS,
  runThreatScoringEngine,
  YEARLY_ENGINE_CALIBRATIONS,
  type ScoringInputContext,
  type ThreatScoringModule,
} from '@/lib/oops/scoringEngine';

export default function OopsMethodologyPage() {
  const [locale, setLocale] = useState<OopsLocale>('ko');
  const [copied, setCopied] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>('execution_privilege');
  const [expandedYear, setExpandedYear] = useState<number | null>(2024);

  const [modules, setModules] = useState<ThreatScoringModule[]>(() => [
    ...DEFAULT_THREAT_MODULES.map((m) => ({ ...m })),
    { ...OPTIONAL_PLUGGABLE_MODULE },
  ]);
  const [ctx, setCtx] = useState<ScoringInputContext>({ ...DEFAULT_SCORING_CONTEXT });

  useEffect(() => {
    const saved = localStorage.getItem('oops_locale_v1') as OopsLocale | null;
    if (saved && OOPS_DICT[saved]) {
      setLocale(saved);
    }
  }, []);

  const output = runThreatScoringEngine(modules, ctx);

  const toggleModule = (id: string) => {
    setModules((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
      if (next.every((m) => !m.enabled)) return prev;
      return next;
    });
  };

  const resetSimulation = () => {
    setModules([
      ...DEFAULT_THREAT_MODULES.map((m) => ({ ...m })),
      { ...OPTIONAL_PLUGGABLE_MODULE },
    ]);
    setCtx({ ...DEFAULT_SCORING_CONTEXT });
  };

  const handleCopyUrl = () => {
    void navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copy = {
    ko: {
      back: '관측소',
      badge: '산출 근거',
      copyBtn: '인용 URL 복사',
      copiedBtn: '복사됨',
      summaryTitle: '엔진 실시간 산출 결과',
      scoreLabel: '위험·공포 총점',
      tempLabel: '환산 위험 온도',
      yearLabel: '충돌 예상 시점',
      pdoomLabel: '산출 p(doom)',
      tableTitle: '100점 기준 모듈러 채점표',
      tableSub: '각 모듈을 클릭하면 세부 채점 기준을 확인할 수 있으며, 모듈 ON/OFF 시에도 100점 기준선이 자동 정규화됩니다.',
      colModule: '평가 모듈',
      colGroup: '분류',
      colRaw: '원점수',
      colWeight: '정규화 비중',
      colContrib: '기여 점수',
      colState: '핫플러그',
      groupStruct: '기술 구조',
      groupLive: '실시간 반응',
      simTitle: '실시간 시뮬레이터 (사건 · 여론 · 브레이크 연동)',
      btnLegislation: '킬스위치 입법 통과 (-15점)',
      btnBase: '2026 현재 기준선',
      btnOutage: '자율 인프라 사고 (+18점)',
      resetBtn: '초기화',
      formulaTitle: '온도 · 시간 연동 수식',
      formulaDesc: '충돌 잔여 연수 = (100.0 - 위험 총점) ÷ 2.866°C/년 · 2022~2026 동일 5대 모듈 함수 실시간 산출',
      historyTitle: '연도별 엔진 실측 궤적 및 실증 근거 (2022 ~ 2026)',
      historySub: '각 연도를 클릭하면 해당 해의 5대 모듈별 실측 점수 분해와 실명 사건 근거를 검증할 수 있습니다.',
      preOriginLabel: '계측 이전 사전 벤치마크',
      evidenceLabel: '해당 연도 실증 근거 및 외부 통계',
      breakdownLabel: '엔진 5대 모듈 실측 분해',
    },
    en: {
      back: 'Observatory',
      badge: 'METHODOLOGY',
      copyBtn: 'Copy Citation URL',
      copiedBtn: 'Copied',
      summaryTitle: 'LIVE ENGINE OUTPUT',
      scoreLabel: 'TOTAL RISK SCORE',
      tempLabel: 'THREAT TEMP',
      yearLabel: 'PROJECTED TIPPING',
      pdoomLabel: 'P(DOOM)',
      tableTitle: '100-POINT MODULAR SCORING RUBRIC',
      tableSub: 'Click any module to inspect its sub-criteria; weights auto-normalize on Plug-in/Out.',
      colModule: 'MODULE',
      colGroup: 'GROUP',
      colRaw: 'RAW',
      colWeight: 'WEIGHT',
      colContrib: 'POINTS',
      colState: 'PLUG',
      groupStruct: 'STRUCTURAL',
      groupLive: 'LIVE SIGNAL',
      simTitle: 'LIVE WEIGHT & EVENT SIMULATOR',
      btnLegislation: 'Kill-Switch Law (-15)',
      btnBase: '2026 Baseline',
      btnOutage: 'Infra Incident (+18)',
      resetBtn: 'Reset',
      formulaTitle: 'TEMPERATURE & TIME COUPLING FORMULA',
      formulaDesc: 'Remaining Years = (100.0 - Total Score) / 2.866°C/y · All 2022–2026 scores computed by identical 5-module runner',
      historyTitle: 'YEARLY ENGINE CALIBRATION & EVIDENCE (2022 ~ 2026)',
      historySub: 'Click any year to inspect its 5-module breakdown and verified real-world incidents.',
      preOriginLabel: 'PRE-ORIGIN BENCHMARKS',
      evidenceLabel: 'VERIFIED INCIDENTS & DATA',
      breakdownLabel: '5-MODULE SCORE BREAKDOWN',
    },
    ja: {
      back: '観測所',
      badge: '算出根拠',
      copyBtn: '引用URLコピー',
      copiedBtn: '完了',
      summaryTitle: 'エンジンリアルタイム算出結果',
      scoreLabel: '総合リスク点',
      tempLabel: '換算危険温度',
      yearLabel: '衝突予想時点',
      pdoomLabel: '算出 p(doom)',
      tableTitle: '100点基準 モジュラー採点表',
      tableSub: '各モジュールをクリックすると詳細基準が開き、ON/OFF時も100点基準線が自動正規化されます。',
      colModule: '評価モジュール',
      colGroup: '分類',
      colRaw: '素点',
      colWeight: '正規化比重',
      colContrib: '寄与点',
      colState: '切替',
      groupStruct: '技術構造',
      groupLive: '現場反応',
      simTitle: 'リアルタイム連動シミュレーター',
      btnLegislation: 'キルスイッチ法制化 (-15点)',
      btnBase: '2026 基準線',
      btnOutage: '自律インフラ事故 (+18点)',
      resetBtn: '初期化',
      formulaTitle: '温度・時間 連動数式',
      formulaDesc: '残余年数 = (100.0 - 総合点) ÷ 2.866°C/年 · 2022〜2026年を同一5モジュール関数で実測算出',
      historyTitle: '年度別エンジン実測軌跡と実証根拠 (2022 ~ 2026)',
      historySub: '各年度をクリックすると5大モジュール別の内訳と実名事件の根拠を確認できます。',
      preOriginLabel: '計測起点以前のベンチマーク',
      evidenceLabel: '実証事件および外部統計',
      breakdownLabel: '5大モジュール実測内訳',
    },
    zh: {
      back: '观测所',
      badge: '测算依据',
      copyBtn: '复制引用链接',
      copiedBtn: '已复制',
      summaryTitle: '引擎实时测算输出',
      scoreLabel: '综合风险分',
      tempLabel: '换算危险温度',
      yearLabel: '预计临界年份',
      pdoomLabel: '测算 p(doom)',
      tableTitle: '100分制模块化评分表',
      tableSub: '点击任意模块可查看细分评分标准；开关模块时核心自动归一化以保持100分基准线。',
      colModule: '评估模块',
      colGroup: '分组',
      colRaw: '原分',
      colWeight: '归一化权重',
      colContrib: '贡献分',
      colState: '开关',
      groupStruct: '技术结构',
      groupLive: '实时信号',
      simTitle: '实时事件与权重模拟器',
      btnLegislation: '安全阀立法通过 (-15分)',
      btnBase: '2026 基准线',
      btnOutage: '自主基础设施事故 (+18分)',
      resetBtn: '重置',
      formulaTitle: '温度与时间联动公式',
      formulaDesc: '剩余年数 = (100.0 - 综合分) ÷ 2.866°C/年 · 2022–2026 均由同一5模块引擎函数实时算出',
      historyTitle: '年度引擎实测轨迹与实证依据 (2022 ~ 2026)',
      historySub: '点击任意年份即可展开查看当年5大模块得分拆解与实名事件依据。',
      preOriginLabel: '测算起点前历史基准',
      evidenceLabel: '实证事件与外部数据',
      breakdownLabel: '5大模块得分拆解',
    },
    es: {
      back: 'Observatorio',
      badge: 'METODOLOGÍA',
      copyBtn: 'Copiar URL',
      copiedBtn: 'Copiado',
      summaryTitle: 'SALIDA DEL MOTOR EN VIVO',
      scoreLabel: 'PUNTUACIÓN TOTAL',
      tempLabel: 'TEMPERATURA',
      yearLabel: 'AÑO CRÍTICO',
      pdoomLabel: 'P(DOOM)',
      tableTitle: 'MATRIZ MODULAR DE 100 PUNTOS',
      tableSub: 'Haz clic en un módulo para ver sus subcriterios; los pesos se normalizan automáticamente.',
      colModule: 'MÓDULO',
      colGroup: 'GRUPO',
      colRaw: 'BASE',
      colWeight: 'PESO',
      colContrib: 'PUNTOS',
      colState: 'PLUG',
      groupStruct: 'ESTRUCTURAL',
      groupLive: 'SEÑAL EN VIVO',
      simTitle: 'SIMULADOR EN VIVO DE EVENTOS',
      btnLegislation: 'Ley Control (-15)',
      btnBase: 'Base 2026',
      btnOutage: 'Incidente Grave (+18)',
      resetBtn: 'Reiniciar',
      formulaTitle: 'FÓRMULA DE TEMPERATURA Y TIEMPO',
      formulaDesc: 'Años Restantes = (100.0 - Puntaje) / 2.866°C/año · 2022–2026 calculados por el mismo motor de 5 módulos',
      historyTitle: 'CALIBRACIÓN ANUAL Y EVIDENCIA (2022 ~ 2026)',
      historySub: 'Haz clic en cualquier año para ver el desglose de los 5 módulos y sus incidentes reales.',
      preOriginLabel: 'REFERENCIAS PRE-ORIGEN',
      evidenceLabel: 'INCIDENTES Y DATOS VERIFICADOS',
      breakdownLabel: 'DESGLOSE DE 5 MÓDULOS',
    },
  }[locale];

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black font-sans flex flex-col">
      {/* 상단 공통 GNB */}
      <OopsGlobalHeader
        locale={locale}
        onLocaleChange={(next) => {
          setLocale(next);
          try {
            localStorage.setItem('oops_locale_v1', next);
          } catch {}
        }}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 font-mono">
        {/* 1. 실시간 엔진 산출 요약 카드 */}
        <section className="bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0_#d4d4d8] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] animate-pulse" />
              <h1 className="text-sm sm:text-base font-black uppercase">{copy.summaryTitle}</h1>
            </div>
            <button
              type="button"
              onClick={resetSimulation}
              className="px-2.5 py-1 bg-[#f4f4f0] hover:bg-zinc-200 border border-black text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{copy.resetBtn}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-[#ffc900] border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
              <div className="text-[11px] font-bold text-zinc-800">{copy.scoreLabel}</div>
              <div className="text-2xl sm:text-3xl font-black text-black mt-0.5">
                {output.totalScore.toFixed(1)}<span className="text-sm">/100</span>
              </div>
            </div>
            <div className="p-3 bg-[#f4f4f0] border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
              <div className="text-[11px] font-bold text-zinc-600">{copy.tempLabel}</div>
              <div className="text-2xl sm:text-3xl font-black text-[#dc2626] mt-0.5">
                {output.temperatureC.toFixed(1)}°C
              </div>
            </div>
            <div className="p-3 bg-[#f4f4f0] border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
              <div className="text-[11px] font-bold text-zinc-600">{copy.yearLabel}</div>
              <div className="text-2xl sm:text-3xl font-black text-black mt-0.5">
                {output.projectedYear}
              </div>
            </div>
            <div className="p-3 bg-[#ff90e8]/40 border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
              <div className="text-[11px] font-bold text-zinc-800">{copy.pdoomLabel}</div>
              <div className="text-2xl sm:text-3xl font-black text-black mt-0.5">
                {output.pDoomPercent}%
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-800 text-[#ffc900] text-xs border-2 border-black">
            <strong>{copy.formulaTitle}:</strong> <span className="text-white">{copy.formulaDesc}</span>
          </div>
        </section>

        {/* 2. 100점 기준 모듈러 채점표 (클릭 시 세부 루브릭 펼침) */}
        <section className="bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0_#d4d4d8] space-y-4">
          <div className="border-b-2 border-black pb-2.5">
            <h2 className="text-sm sm:text-base font-black uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#ff4d00]" />
              <span>{copy.tableTitle}</span>
            </h2>
            <p className="text-xs font-sans text-zinc-600 mt-1">{copy.tableSub}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f4f4f0] border-b-2 border-black">
                  <th className="p-2.5 font-black">{copy.colModule}</th>
                  <th className="p-2.5 font-black hidden sm:table-cell">{copy.colGroup}</th>
                  <th className="p-2.5 font-black text-right">{copy.colRaw}</th>
                  <th className="p-2.5 font-black text-right">{copy.colWeight}</th>
                  <th className="p-2.5 font-black text-right">{copy.colContrib}</th>
                  <th className="p-2.5 font-black text-center">{copy.colState}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/15">
                {output.moduleResults.map((m) => {
                  const isOpen = expandedModuleId === m.id;
                  return (
                    <React.Fragment key={m.id}>
                      <tr
                        onClick={() => setExpandedModuleId(isOpen ? null : m.id)}
                        className={`cursor-pointer transition-colors ${
                          m.enabled ? 'bg-white hover:bg-[#ffc900]/15' : 'bg-zinc-100 opacity-55'
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="font-black text-black flex items-center gap-1.5">
                            {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                            <span>{m.names[locale] || m.names.en}</span>
                          </div>
                          <div className="text-[11px] font-sans text-zinc-600 mt-0.5 pl-5">{m.criteria[locale] || m.criteria.en}</div>
                        </td>
                        <td className="p-2.5 hidden sm:table-cell">
                          <span className={`px-1.5 py-0.5 text-[10px] font-black border border-black ${
                            m.group === 'STRUCTURAL' ? 'bg-[#ffc900]' : 'bg-[#ff90e8]'
                          }`}>
                            {m.group === 'STRUCTURAL' ? copy.groupStruct : copy.groupLive}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold">{m.rawScore.toFixed(1)}</td>
                        <td className="p-2.5 text-right font-bold">{m.normalizedWeightPct}%</td>
                        <td className="p-2.5 text-right font-black text-[#ff4d00]">
                          {m.enabled ? m.weightedContribution.toFixed(1) : '0.0'}
                        </td>
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleModule(m.id)}
                            className={`px-2 py-1 text-[10px] font-black border-2 border-black cursor-pointer ${
                              m.enabled ? 'bg-zinc-800 text-[#ffc900]' : 'bg-white text-zinc-600'
                            }`}
                          >
                            {m.enabled ? 'ON' : 'OFF'}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#f4f4f0]">
                          <td colSpan={6} className="p-3 pl-8 border-t border-black/10">
                            <div className="space-y-1.5">
                              {m.subCriteria.map((sc, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] font-sans bg-white px-2.5 py-1.5 border border-black">
                                  <span className="font-bold text-zinc-800">{sc.label[locale] || sc.label.en}</span>
                                  <span className="font-mono font-black text-black">
                                    {sc.currentPoints} / {sc.maxPoints}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 실시간 사건/여론 가감 시뮬레이터 */}
          <div className="pt-2 border-t-2 border-black space-y-2">
            <div className="text-xs font-black text-zinc-700">{copy.simTitle}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCtx((prev) => ({ ...prev, incidentDelta: -15, snsFearRatio: 0.42, appBrakeEngagement: 0.75 }))}
                className="py-2 px-3 bg-[#a3e635] hover:bg-[#b8f056] border-2 border-black font-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
              >
                {copy.btnLegislation}
              </button>
              <button
                type="button"
                onClick={() => setCtx({ ...DEFAULT_SCORING_CONTEXT })}
                className="py-2 px-3 bg-[#ffc900] hover:bg-[#ffd633] border-2 border-black font-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
              >
                {copy.btnBase}
              </button>
              <button
                type="button"
                onClick={() => setCtx((prev) => ({ ...prev, incidentDelta: 18, snsFearRatio: 0.88, appBrakeEngagement: 0.15 }))}
                className="py-2 px-3 bg-[#ff4d00] hover:bg-[#ff621f] text-white border-2 border-black font-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
              >
                {copy.btnOutage}
              </button>
            </div>
          </div>
        </section>

        {/* 3. 연도별 엔진 실측 궤적 및 실증 근거 (2022 ~ 2026 전부 엔진 실시간 산출 + 클릭 시 상세 분해) */}
        <section className="bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0_#d4d4d8] space-y-4">
          <div className="border-b-2 border-black pb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#dc2626]" />
              <h2 className="text-sm sm:text-base font-black uppercase">{copy.historyTitle}</h2>
            </div>
            <p className="text-xs font-sans text-zinc-600 mt-1">{copy.historySub}</p>
          </div>

          <div className="space-y-2.5">
            {YEARLY_ENGINE_CALIBRATIONS.map((cal) => {
              const yearOut = runThreatScoringEngine(DEFAULT_THREAT_MODULES, cal.ctx);
              const isOpen = expandedYear === cal.year;
              const temp = yearOut.temperatureC;

              return (
                <div key={cal.year} className="bg-[#f4f4f0] border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
                  <button
                    type="button"
                    onClick={() => setExpandedYear(isOpen ? null : cal.year)}
                    className="w-full p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left cursor-pointer hover:bg-[#ffc900]/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                      <span className="px-2 py-0.5 bg-zinc-800 text-[#ffc900] text-xs font-black border border-black">
                        {cal.year}
                      </span>
                      <span className="font-sans font-black text-xs sm:text-sm text-black">
                        {cal.headline[locale] || cal.headline.en}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 text-xs font-black border-2 border-black shrink-0 self-start sm:self-center ${
                      temp >= 60 ? 'bg-[#ff4d00] text-white' : temp >= 30 ? 'bg-[#ffc900] text-black' : 'bg-white text-black'
                    }`}>
                      {temp.toFixed(1)}°C
                    </span>
                  </button>

                  {isOpen && (
                    <div className="p-3 sm:p-4 bg-white border-t-2 border-black space-y-3">
                      {/* 해당 연도 5대 모듈 실측 점수 분해 */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-black text-zinc-600 uppercase">{copy.breakdownLabel}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px]">
                          {yearOut.moduleResults.map((mr) => (
                            <div key={mr.id} className="p-2 bg-[#f4f4f0] border border-black">
                              <div className="font-sans font-bold text-zinc-700 truncate" title={mr.names[locale] || mr.names.en}>
                                {mr.names[locale] || mr.names.en}
                              </div>
                              <div className="font-black text-black mt-0.5">
                                {mr.rawScore.toFixed(1)} <span className="text-[#ff4d00]">(+{mr.weightedContribution.toFixed(1)})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 실명 사건 및 외부 통계 근거 */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-black text-zinc-600 uppercase">{copy.evidenceLabel}</div>
                        <ul className="space-y-1 text-xs font-sans text-zinc-800 bg-[#ffc900]/15 p-2.5 border border-black">
                          {(cal.evidenceList[locale] || cal.evidenceList.en).map((ev, idx) => (
                            <li key={idx}>• {ev}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 계측 이전 사전 벤치마크 (1997 / 2016) */}
          <div className="pt-3 border-t-2 border-black space-y-2">
            <div className="text-[11px] font-black text-zinc-500 uppercase">{copy.preOriginLabel}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRE_ORIGIN_BENCHMARKS.map((pb) => (
                <div key={pb.year} className="p-2.5 bg-[#f4f4f0] border border-black text-xs">
                  <div className="flex items-center justify-between font-black">
                    <span className="px-1.5 py-0.5 bg-zinc-800 text-white text-[11px]">{pb.year}</span>
                    <span>{pb.temp.toFixed(1)}°C</span>
                  </div>
                  <div className="font-sans font-bold text-black mt-1">{pb.event[locale] || pb.event.en}</div>
                  <div className="font-sans text-[11px] text-zinc-600 mt-0.5">{pb.impact[locale] || pb.impact.en}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
