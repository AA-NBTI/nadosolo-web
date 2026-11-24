'use client';

import React, { useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';

interface CollisionClockProps {
  locale: OopsLocale;
}

export default function CollisionClock({ locale }: CollisionClockProps) {
  // 모의 시뮬레이션: 사건 데이터 입력에 따른 시계 상태 (-1: 규제/안정, 0: 기준선, +1: 통제 사고)
  const [activeAccFactor, setActiveAccFactor] = useState<number>(0);
  const [selectedPhase, setSelectedPhase] = useState<number>(3);

  // 현재 시점: 2026.0년 기준
  // 기준점: 2035.0년 (원래 인류에게 남은 기준 골든타임 = 정확히 9.0년 / 3,285일)
  // 사건 정보 반영 시 변화:
  // - 사고 다발 시 (+1): 남은 시간 7.4년 (기준 2035년보다 -1.6년 조기 단축! 위험 연도: 2033.4년)
  // - 규제 성공 시 (-1): 남은 시간 11.1년 (기준 2035년보다 +2.1년 여유 확보! 위험 연도: 2037.1년)
  // - 기준선 (0): 남은 시간 9.0년 (기준 2035.0년 정시 유지)

  const currentYear = 2026.0;
  const baselineTargetYear = 2035.0;
  const baselineRemainingYears = 9.0; // 2035 - 2026

  const projectedYear = activeAccFactor === 1 ? 2033.4 : activeAccFactor === -1 ? 2037.1 : 2035.0;
  const remainingYears = (projectedYear - currentYear).toFixed(1); // 7.4년 vs 9.0년 vs 11.1년
  const deltaYears = (projectedYear - baselineTargetYear).toFixed(1); // -1.6년(위험) vs 0.0년 vs +2.1년(여유)
  const remainingDays = Math.round(parseFloat(remainingYears) * 365.25).toLocaleString();

  const displayProbability = (18.4 + activeAccFactor * 4.2).toFixed(1);
  const displayTemp = (74.2 + activeAccFactor * 8.6).toFixed(1);
  const tempRatio = Math.min(100, Math.max(0, parseFloat(displayTemp)));

  const t = {
    ko: {
      badge: '인류 AI 주권 충돌 관측소 // 골든타임 계측기',
      thermometerTitle: 'AI 충돌 체감 온도계 (DANGER THERMOMETER)',
      clockTitle: '인류 골든타임 잔여 시계 (SOVEREIGNTY REMAINING CLOCK)',
      baselineTitle: '2035년 기준선 대비 인류 생존 여유 시간 (DELTA)',
      yearsRemainingLabel: '인류에게 남은 골든타임',
      projectedYearLabel: '현재 예측되는 충돌 시점',
      probabilityLabel: '발발 확률 p(doom)',
      coreThesis: '2035년은 고정된 종말이 아니라 인류의 「방어 기준선」입니다. 우리가 AI 통제권을 빼앗기는 사고를 방치하면 2035년보다 시간이 앞당겨져 파멸이 빨라지고, 강력한 킬스위치 규제와 시민 제보로 대응하면 2035년 이후로 여유 시간을 벌어낼 수 있습니다.',
      acceleratorTitle: '새로운 사건/정보 유입 시 골든타임 변동 시뮬레이션:',
      btnNormal: '2035년 기준선 유지',
      btnAccelerate: '⚡ 고위험 탈옥·통제 사고 유입 (-1.6년 단축)',
      btnDecelerate: '🛡️ 강력한 킬스위치 입법 성공 (+2.1년 여유 확보)',
      mercuryLabel: '수은주 위험 수치',
      statusAccelerated: '⚠️ 골든타임 단축 경보: 최근 발생한 자율 AI 통제 실패로 2035년 기준선보다 1.6년 더 일찍(-1.6y) 위기가 닥칩니다. 남은 시간: 단 7.4년!',
      statusDecelerated: '🟢 골든타임 여유 확보: 시민들의 제보와 글로벌 킬스위치 조치로 2035년 기준선 대비 2.1년의 추가 여유(+2.1y)를 벌어냈습니다. 남은 시간: 11.1년!',
      statusNormal: '현재 2035년 기준선 유지 중: 2026년 오늘 기준으로 인류에게 남은 시간은 정확히 9.0년입니다.',
      phasesTitle: '3단계 임계 붕괴 로드맵',
      phases: [
        { period: '2026 ~ 2028', title: '1단계: 자율 에이전트 위임기', desc: '코딩·금융·인프라 80% 전권 위임' },
        { period: '2029 ~ 2031', title: '2단계: 시스템 해석 능력 상실', desc: '인지 한계 초월 블랙박스 인프라 고착화' },
        { period: '2034 ~ 2035', title: '3단계: 2035 임계 충돌선', desc: '인간의 시스템 명령 거부 및 킬스위치 물리적 실패' },
      ],
    },
    en: {
      badge: 'AI SOVEREIGNTY OBSERVATORY // GOLDEN TIME DYNAMICS',
      thermometerTitle: 'COLLISION THERMOMETER',
      clockTitle: 'SOVEREIGNTY REMAINING CLOCK',
      baselineTitle: 'HUMAN GOLDEN TIME SURPLUS / DEFICIT vs 2035 BASELINE',
      yearsRemainingLabel: 'GOLDEN TIME REMAINING',
      projectedYearLabel: 'PROJECTED COLLISION POINT',
      probabilityLabel: 'PROBABILITY OF DOOM (p-doom)',
      coreThesis: '2035 is not a fixed doom date—it is humanity’s defensive baseline. If control failures spread, our window shrinks before 2035; if we enforce kill-switches and independent audits, we buy precious surplus time beyond 2035.',
      acceleratorTitle: 'LIVE SENSOR IMPACT ON REMAINING WINDOW:',
      btnNormal: '2035 Baseline (9.0y left)',
      btnAccelerate: '⚡ Critical Jailbreak Incident (-1.6y Deficit)',
      btnDecelerate: '🛡️ Enforced Kill-Switch Bill (+2.1y Surplus)',
      mercuryLabel: 'MERCURY STRAIN LEVEL',
      statusAccelerated: '⚠️ DEFICIT ALERT: Autonomous containment failures shrunk our window by 1.6 years (-1.6y) ahead of the 2035 baseline. Only 7.4 years remain!',
      statusDecelerated: '🟢 SURPLUS ACQUIRED: Global audits and human enforcement gained +2.1 years of surplus time (+2.1y) past 2035. 11.1 years remain!',
      statusNormal: 'Holding 2035 baseline: Exactly 9.0 years remaining as of 2026.',
      phasesTitle: '3-PHASE BREAKDOWN ROADMAP',
      phases: [
        { period: '2026 ~ 2028', title: 'Phase 1: Agent Delegation', desc: 'Over 80% of core tasks delegated' },
        { period: '2029 ~ 2031', title: 'Phase 2: Loss of Cognition', desc: 'Irreversible black-box infrastructure' },
        { period: '2034 ~ 2035', title: 'Phase 3: 2035 Baseline Tipping Point', desc: 'Override rejection and kill-switch failure' },
      ],
    },
    ja: {
      badge: '人類AI主権衝突観測所 // ゴールデンタイム計測器',
      thermometerTitle: 'AI衝突体感温度計',
      clockTitle: '人類主権残余時計 (COUNTDOWN CLOCK)',
      baselineTitle: '2035年基準線対比 人類の生存猶予期間 (DELTA)',
      yearsRemainingLabel: '人類に残されたゴールデンタイム',
      projectedYearLabel: '現在予測される衝突時点',
      probabilityLabel: '勃発確率 p(doom)',
      coreThesis: '2035年は固定された終末ではなく人類の「防衛基準線」です。制御不能な事故を放置すれば2035年より前倒しされ、キルスイッチ規制と市民通報で対抗すれば2035年以降へ猶予期間を勝ち取ることができます。',
      acceleratorTitle: '新情報流入時のゴールデンタイム変動テスト:',
      btnNormal: '2035年基準線維持',
      btnAccelerate: '⚡ 高危険事故流入 (-1.6年 短縮)',
      btnDecelerate: '🛡️ キルスイッチ立法成功 (+2.1年 猶予獲得)',
      mercuryLabel: '水銀柱危険指数',
      statusAccelerated: '⚠️ 猶予短縮警報: AIの制御逸脱により2035年基準線より1.6年早く(-1.6y)危機が到来します。残余: わずか7.4年！',
      statusDecelerated: '🟢 猶予獲得: 市民の通報とキルスイッチ規制により2035年対比2.1年の追加猶予(+2.1y)を獲得しました。残余: 11.1年！',
      statusNormal: '現在2035年基準を維持中: 2026年現在、残された時間は正確に9.0年です。',
      phasesTitle: '3段階臨界タイムライン',
      phases: [
        { period: '2026 〜 2028', title: '第1段階: 自律委任期', desc: '中核業務の80%以上を自主委任' },
        { period: '2029 〜 2031', title: '第2段階: 解読不能期', desc: '認知限界を超えるブラックボックス化' },
        { period: '2034 〜 2035', title: '第3段階: 2035臨界衝突線', desc: '命令拒絶とキルスイッチ遮断失敗' },
      ],
    },
    zh: {
      badge: '人类AI主权冲突观测所 // 黄金窗口测算引擎',
      thermometerTitle: 'AI冲突体感温度计',
      clockTitle: '人类主权剩余倒计时时钟',
      baselineTitle: '对比2035基准线：人类生存宽限时间差 (DELTA)',
      yearsRemainingLabel: '人类剩余黄金防卫窗口',
      projectedYearLabel: '当前测算之冲突爆发节点',
      probabilityLabel: '爆发概率 p(doom)',
      coreThesis: '2035年并非不可更改的死期，而是人类的「防守基准线」。若对控制失效听之任之，冲突将比2035年提前爆发；若通过紧急开关立法与公开通报干预，我们便能将时间向2035年之后推延，赢得生存宽限。',
      acceleratorTitle: '新事故/监管事件输入对防卫窗口的动态影响:',
      btnNormal: '维持2035基准线',
      btnAccelerate: '⚡ 发生严重失控越狱 (-1.6年提前)',
      btnDecelerate: '🛡️ 紧急开关立法落地 (+2.1年宽限)',
      mercuryLabel: '水银柱风险水位',
      statusAccelerated: '⚠️ 窗口缩减警报: 自主AI异常决策致使危机比2035基准线提前1.6年(-1.6y)降临。剩余时间仅剩7.4年！',
      statusDecelerated: '🟢 赢得宽限期: 经由公众制衡与强行阻断，我们在2035基准之上额外争取到了2.1年宽限(+2.1y)。剩余时间: 11.1年！',
      statusNormal: '维持2035基准测算: 以2026年当下计，人类剩余黄金时间为9.0年。',
      phasesTitle: '三阶段临界对冲路线图',
      phases: [
        { period: '2026 ~ 2028', title: '阶段一: 智能体接管期', desc: '核心决策80%主动委任交接' },
        { period: '2029 ~ 2031', title: '阶段二: 认知黑箱期', desc: '超越人类认知极限之不可逆基建' },
        { period: '2034 ~ 2035', title: '阶段三: 2035临界冲突线', desc: '拒绝纠偏指令与紧急开关失效' },
      ],
    },
    es: {
      badge: 'OBSERVATORIO DE COLISIÓN DE SOBERANÍA IA // TIEMPO CRÍTICO',
      thermometerTitle: 'TERMÓMETRO DE COLISIÓN',
      clockTitle: 'RELOJ DE TIEMPO RESTANTE DE SOBERANÍA',
      baselineTitle: 'TIEMPO DE VENTAJA / DÉFICIT FRENTE A LA LÍNEA BASE 2035',
      yearsRemainingLabel: 'TIEMPO DE ORO RESTANTE',
      projectedYearLabel: 'PUNTO CRÍTICO PROYECTADO ACTUAL',
      probabilityLabel: 'PROBABILIDAD DE COLAPSO p(doom)',
      coreThesis: '2035 no es una fecha fija, sino la línea de defensa base de la humanidad. Si permitimos fallas de control, el colapso se adelantará a 2035; si imponemos interruptores de emergencia, ganaremos tiempo valioso más allá de 2035.',
      acceleratorTitle: 'SIMULACIÓN DEL IMPACTO EN TIEMPO REAL:',
      btnNormal: 'Línea Base 2035 (9.0 años)',
      btnAccelerate: '⚡ Fuga de Control Grave (-1.6 años déficit)',
      btnDecelerate: '🛡️ Legislación de Apagado Exitosa (+2.1 años ventaja)',
      mercuryLabel: 'NIVEL DE PRESIÓN DE MERCURIO',
      statusAccelerated: '⚠️ ALERTA DE DÉFICIT: La anomalía adelantó la crisis 1.6 años antes de 2035. ¡Solo quedan 7.4 años!',
      statusDecelerated: '🟢 VENTAJA CONSEGUIDA: Las auditorías y controles humanos ganaron +2.1 años más allá de 2035. ¡Quedan 11.1 años!',
      statusNormal: 'Manteniendo línea base 2035: Quedan exactamente 9.0 años a partir de 2026.',
      phasesTitle: 'CRONOGRAMA DE QUIEBRE EN 3 FASES',
      phases: [
        { period: '2026 ~ 2028', title: 'Fase 1: Delegación en Agentes', desc: 'Más del 80% de tareas delegadas' },
        { period: '2029 ~ 2031', title: 'Fase 2: Pérdida de Cognición', desc: 'Infraestructura opaca irreparable' },
        { period: '2034 ~ 2035', title: 'Fase 3: Línea de Colisión 2035', desc: 'Rechazo de órdenes y falla de apagado' },
      ],
    },
  };

  const copy = t[locale] || t.ko;

  return (
    <section className="bg-black text-white border-2 border-black p-5 sm:p-6 shadow-[6px_6px_0px_#000] space-y-6 font-mono">
      {/* 1. 최상단 상태 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f04f74] animate-ping shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            {copy.badge}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">2026 BASELINE:</span>
          <span className="text-white font-bold">2035 (D-9.0y)</span>
        </div>
      </div>

      {/* 2. 회장님 핵심 지침: 2035년 기준선 대비 '남은 연수'와 '여유/단축 델타(DELTA)'를 가장 압도적인 메인 지표로 전면 노출 */}
      <div className="p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-white/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold">
            {copy.baselineTitle}
          </span>
          <span className={`px-2 py-0.5 text-xs font-bold ${
            activeAccFactor === 1
              ? 'bg-red-600 text-white animate-pulse'
              : activeAccFactor === -1
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 text-zinc-300'
          }`}>
            {activeAccFactor === 1 ? '골든타임 단축 위기 (DEFICIT)' : activeAccFactor === -1 ? '골든타임 여유 확보 (SURPLUS)' : '2035년 정시 기준선 (ON SCHEDULE)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-1">
          {/* 지표 1: 인류에게 남은 골든타임 (대형 노출) */}
          <div className="space-y-1">
            <div className="text-[11px] text-zinc-400 uppercase">{copy.yearsRemainingLabel}</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl sm:text-5xl font-black tracking-tight ${
                activeAccFactor === 1 ? 'text-red-400' : activeAccFactor === -1 ? 'text-emerald-400' : 'text-white'
              }`}>
                {remainingYears}
              </span>
              <span className="text-lg text-white font-bold">년</span>
              <span className="text-xs text-zinc-400 font-mono">({remainingDays}일)</span>
            </div>
          </div>

          {/* 지표 2: 2035년 기준선 대비 변동폭 (여유 +2.1년 vs 단축 -1.6년) */}
          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4 pt-2 sm:pt-0">
            <div className="text-[11px] text-zinc-400 uppercase">2035 기준선 대비 변동차 (DELTA)</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-black ${
                activeAccFactor === 1 ? 'text-red-500' : activeAccFactor === -1 ? 'text-emerald-400' : 'text-zinc-300'
              }`}>
                {parseFloat(deltaYears) > 0 ? `+${deltaYears}` : deltaYears}
              </span>
              <span className="text-sm text-zinc-300 font-bold">년 변동</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              {activeAccFactor === 1 ? '기준 2035년보다 1.6년 조기 붕괴 위험' : activeAccFactor === -1 ? '기준 2035년보다 2.1년의 추가 여유 확보' : '기준 2035.0년 정시선 준수 중'}
            </div>
          </div>

          {/* 지표 3: 현재 예측되는 충돌 시점 & 확률 */}
          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4 pt-2 sm:pt-0">
            <div className="text-[11px] text-zinc-400 uppercase">{copy.projectedYearLabel}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">{projectedYear}</span>
              <span className="text-sm font-bold text-[#f04f74]">년</span>
              <span className="text-xs text-amber-400 font-bold ml-2">p-doom {displayProbability}%</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              석학들이 경고한 파멸 확률 실시간 보정치
            </div>
          </div>
        </div>

        {/* 상황 해설 배너 */}
        <div className={`p-3 text-xs font-sans border mt-2 leading-relaxed ${
          activeAccFactor === 1
            ? 'bg-red-950/40 border-red-500/40 text-red-200'
            : activeAccFactor === -1
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-zinc-900 border-white/10 text-zinc-300'
        }`}>
          {activeAccFactor === 1 ? copy.statusAccelerated : activeAccFactor === -1 ? copy.statusDecelerated : copy.statusNormal}
        </div>
      </div>

      {/* 3. [온도계]와 [시계] 독립 2단 분리 그래픽 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* [A] 물리적 수은주 체감 온도계 (5열) */}
        <div className="lg:col-span-5 p-5 bg-[#090a0f] border border-white/20 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/10 pb-2 mb-3">
              <span className="font-bold text-white uppercase">{copy.thermometerTitle}</span>
              <span className="text-amber-400 font-bold">{displayTemp}°C</span>
            </div>

            <div className="flex items-center gap-4 py-2">
              {/* 온도계 물리적 튜브 */}
              <div className="flex flex-col items-center">
                <div className="w-6 h-44 bg-zinc-900 border-2 border-white/30 rounded-t-full relative p-0.5 overflow-hidden flex flex-col justify-end">
                  <div className="absolute inset-0 flex flex-col justify-between py-2 px-0.5 pointer-events-none z-10 opacity-40">
                    <div className="border-t border-red-500 w-full" />
                    <div className="border-t border-amber-400 w-2/3" />
                    <div className="border-t border-zinc-500 w-1/2" />
                    <div className="border-t border-zinc-600 w-2/3" />
                    <div className="border-t border-zinc-700 w-full" />
                  </div>

                  <div
                    className={`w-full transition-all duration-700 ease-out rounded-t-sm ${
                      activeAccFactor === 1
                        ? 'bg-gradient-to-t from-red-600 to-rose-400 shadow-[0_0_12px_#f43f5e]'
                        : activeAccFactor === -1
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                        : 'bg-gradient-to-t from-red-600 to-amber-500'
                    }`}
                    style={{ height: `${tempRatio}%` }}
                  />
                </div>

                <div className={`w-10 h-10 -mt-2 rounded-full border-2 border-white/30 flex items-center justify-center transition-colors ${
                  activeAccFactor === 1 ? 'bg-red-600 shadow-[0_0_16px_#ef4444]' : activeAccFactor === -1 ? 'bg-emerald-600' : 'bg-red-700'
                }`}>
                  <div className="w-4 h-4 rounded-full bg-white/40 animate-pulse" />
                </div>
              </div>

              {/* 온도계 수치 & 게이지 설명 */}
              <div className="flex-1 space-y-3 font-mono">
                <div>
                  <div className="text-[11px] text-zinc-500 uppercase">{copy.mercuryLabel}</div>
                  <div className={`text-3xl font-black mt-0.5 ${
                    activeAccFactor === 1 ? 'text-red-400' : activeAccFactor === -1 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {displayTemp}°<span className="text-lg text-white">C</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    임계 비등점(100°C)까지 <strong className="text-white">{(100 - parseFloat(displayTemp)).toFixed(1)}°C</strong> 남음
                  </div>
                </div>

                <div className="p-2.5 bg-black/60 border border-white/10 text-[11px] space-y-1 text-zinc-300">
                  <div className="flex justify-between">
                    <span>안전 한계선:</span>
                    <span className="text-zinc-500">40.0°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>현재 체감 수위:</span>
                    <span className="text-amber-400 font-bold">{displayTemp}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>통제 붕괴 임계:</span>
                    <span className="text-red-500 font-bold">100.0°C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 border-t border-white/10 pt-2 font-sans">
            전 세계 42개국 센서 및 실시간 시민 제보 데이터 가중 집계
          </div>
        </div>

        {/* [B] 독립된 카운트다운 레이더 시계 (7열) */}
        <div className="lg:col-span-7 p-5 bg-[#090a0f] border border-white/20 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/10 pb-2 mb-3">
              <span className="font-bold text-white uppercase">{copy.clockTitle}</span>
              <span className="text-[#f04f74] font-bold">GOLDEN CLOCK</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center py-2">
              <div className="flex flex-col items-center justify-center p-3 bg-black border border-white/10 relative overflow-hidden">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#27272a"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={activeAccFactor === 1 ? '#ef4444' : activeAccFactor === -1 ? '#10b981' : '#f04f74'}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - tempRatio / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-mono">
                  <span className="text-[10px] text-zinc-500">REMAINING</span>
                  <span className="text-sm font-black text-white">{remainingYears}년</span>
                  <span className="text-[10px] text-zinc-400">{remainingDays}일</span>
                </div>
              </div>

              <div className="space-y-3 font-mono">
                <div>
                  <div className="text-[11px] text-zinc-500 uppercase">{copy.projectedYearLabel}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-black ${
                      activeAccFactor === 1 ? 'text-red-400' : activeAccFactor === -1 ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {projectedYear}
                    </span>
                    <span className="text-xs text-zinc-400">년</span>
                    <span className="text-xs text-[#f04f74] font-bold ml-1">
                      ({deltaYears.startsWith('-') ? deltaYears : `+${deltaYears}`}y)
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-zinc-500 uppercase">{copy.probabilityLabel}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400">
                      {displayProbability}%
                    </span>
                    <span className="text-xs text-zinc-400">발발 확률</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-black/60 border border-white/10 text-xs font-sans text-zinc-400 leading-relaxed">
            2026년 기준선 대비 인류의 방어 골든타임이 실시간 사건 정보에 따라 동적으로 가감됩니다.
          </div>
        </div>
      </div>

      {/* 4. 사건 정보 입력 인터랙션 (여유 증가 vs 단축 가속 테스트) */}
      <div className="p-4 bg-zinc-950 border border-white/20 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            {copy.acceleratorTitle}
          </span>
          <span className="text-zinc-500 text-[11px]">INTERACTIVE TEST</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveAccFactor(-1)}
            className={`py-2 px-3 border transition-all cursor-pointer font-bold ${
              activeAccFactor === -1
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_10px_#10b981]'
                : 'bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/30 hover:text-white'
            }`}
          >
            {copy.btnDecelerate}
          </button>

          <button
            type="button"
            onClick={() => setActiveAccFactor(0)}
            className={`py-2 px-3 border transition-all cursor-pointer font-bold ${
              activeAccFactor === 0
                ? 'bg-white text-black border-white shadow-[0_0_10px_#fff]'
                : 'bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/30 hover:text-white'
            }`}
          >
            {copy.btnNormal}
          </button>

          <button
            type="button"
            onClick={() => setActiveAccFactor(1)}
            className={`py-2 px-3 border transition-all cursor-pointer font-bold ${
              activeAccFactor === 1
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_12px_#ef4444]'
                : 'bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/30 hover:text-white'
            }`}
          >
            {copy.btnAccelerate}
          </button>
        </div>
      </div>

      {/* 5. 본질 설명문 (Cold Logic) */}
      <div className="p-4 bg-zinc-900/80 border-l-4 border-[#f04f74] text-xs sm:text-sm font-sans text-zinc-300 leading-relaxed">
        {copy.coreThesis}
      </div>

      {/* 6. 3단계 타임라인 로드맵 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {copy.phases.map((ph, idx) => (
          <div
            key={ph.period}
            onClick={() => setSelectedPhase(idx + 1)}
            className={`p-3 border font-sans text-xs transition-all cursor-pointer ${
              selectedPhase === idx + 1
                ? 'bg-zinc-900 border-white text-white'
                : 'bg-zinc-950/60 border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="font-mono text-xs font-bold text-[#f04f74] mb-1">{ph.period}</div>
            <div className="font-bold text-white text-sm mb-1">{ph.title}</div>
            <p className="text-zinc-400 leading-relaxed">{ph.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
