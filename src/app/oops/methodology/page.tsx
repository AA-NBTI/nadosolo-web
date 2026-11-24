'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  Flame,
  Globe,
  RotateCcw,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { OOPS_DICT, OOPS_LOCALES, type OopsLocale } from '@/lib/oops/i18n';
import {
  DEFAULT_SCORING_CONTEXT,
  DEFAULT_THREAT_MODULES,
  HISTORICAL_AI_MILESTONES,
  OPTIONAL_PLUGGABLE_MODULE,
  runThreatScoringEngine,
  type ScoringInputContext,
  type ThreatScoringModule,
} from '@/lib/oops/scoringEngine';

export default function OopsMethodologyPage() {
  const [locale, setLocale] = useState<OopsLocale>('ko');
  const [copied, setCopied] = useState(false);

  // 핫플러그 가능한 모듈 상태 (기본 5개 + 선택적 확장 1개)
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
      // 최소 1개 모듈은 활성 유지
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
      tableSub: '모듈을 켜고 끄거나(Plug-in/Out) 가중치 변수를 조정해도 100점 기준선이 자동 정규화됩니다.',
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
      formulaDesc: '충돌 잔여 연수 = (100.0 - 위험 총점) ÷ 2.866°C/년 · 2022년(5.0°C) 기점 4대 실측 기준 동일 적용',
      historyTitle: 'AI 발전 역사 및 실증 분기점 (1997 ~ 2026)',
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
      tableSub: 'Plug modules in or out freely; weights automatically normalize to preserve the 100-point baseline.',
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
      formulaDesc: 'Remaining Years = (100.0 - Total Score) / 2.866°C per year · Origin baseline anchored at 2022 (5.0°C)',
      historyTitle: 'HISTORICAL AI MILESTONES (1997 ~ 2026)',
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
      tableSub: 'モジュールを挿抜(Plug-in/Out)しても100点基準線が自動正規化されます。',
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
      formulaDesc: '残余年数 = (100.0 - 総合点) ÷ 2.866°C/年 · 2022年(5.0°C)を計測起点として統一適用',
      historyTitle: 'AI発展歴史と実証分岐点 (1997 ~ 2026)',
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
      tableSub: '自由插拔(Plug-in/Out)评估模块，核心自动归一化权重以保持100分基准线稳固。',
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
      formulaDesc: '剩余年数 = (100.0 - 综合分) ÷ 2.866°C/年 · 以2022年(5.0°C)作为统一历史起点',
      historyTitle: 'AI发展历史与实证里程碑 (1997 ~ 2026)',
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
      tableSub: 'Activa o desactiva módulos libremente; los pesos se normalizan automáticamente sobre 100.',
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
      formulaDesc: 'Años Restantes = (100.0 - Puntaje) / 2.866°C/año · Origen anclado en 2022 (5.0°C)',
      historyTitle: 'HITOS HISTÓRICOS DE LA IA (1997 ~ 2026)',
    },
  }[locale];

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black font-sans flex flex-col selection:bg-[#ffc900]">
      {/* 상단 GNB */}
      <header className="sticky top-0 z-40 bg-[#ffc900] border-b-4 border-black shadow-[0_4px_0_#d4d4d8]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-black font-mono font-bold text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{copy.back}</span>
            </Link>
            <span className="px-2.5 py-1 bg-[#ff4d00] text-white font-mono font-black text-xs sm:text-sm border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
              {copy.badge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={locale}
              onChange={(e) => {
                const next = e.target.value as OopsLocale;
                setLocale(next);
                localStorage.setItem('oops_locale_v1', next);
              }}
              className="px-2 py-1.5 bg-white border-2 border-black shadow-[2px_2px_0_#d4d4d8] text-xs font-mono font-black cursor-pointer"
              aria-label="Language"
            >
              {OOPS_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[#ffc900] font-mono font-bold text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? copy.copiedBtn : copy.copyBtn}</span>
            </button>
          </div>
        </div>
      </header>

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

        {/* 2. 100점 기준 모듈러 채점표 */}
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
                {output.moduleResults.map((m) => (
                  <tr key={m.id} className={m.enabled ? 'bg-white' : 'bg-zinc-100 opacity-55'}>
                    <td className="p-2.5">
                      <div className="font-black text-black">{m.names[locale] || m.names.en}</div>
                      <div className="text-[11px] font-sans text-zinc-600 mt-0.5">{m.criteria[locale] || m.criteria.en}</div>
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
                    <td className="p-2.5 text-center">
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
                ))}
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

        {/* 3. AI 발전 역사 및 실증 분기점 연대기 */}
        <section className="bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0_#d4d4d8] space-y-4">
          <div className="border-b-2 border-black pb-2.5 flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#dc2626]" />
            <h2 className="text-sm sm:text-base font-black uppercase">{copy.historyTitle}</h2>
          </div>

          <div className="space-y-2.5">
            {HISTORICAL_AI_MILESTONES.map((hm) => (
              <div key={hm.year} className="p-3 bg-[#f4f4f0] border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-zinc-800 text-[#ffc900] text-xs font-black border border-black">
                      {hm.year}
                    </span>
                    <span className="font-sans font-black text-xs sm:text-sm text-black">
                      {hm.event[locale] || hm.event.en}
                    </span>
                  </div>
                  <div className="text-xs font-sans text-zinc-700 pl-1">
                    {hm.impact[locale] || hm.impact.en}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-black border-2 border-black shrink-0 self-start sm:self-center ${
                  hm.temp >= 60 ? 'bg-[#ff4d00] text-white' : hm.temp >= 30 ? 'bg-[#ffc900] text-black' : 'bg-white text-black'
                }`}>
                  {hm.temp.toFixed(1)}°C
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
