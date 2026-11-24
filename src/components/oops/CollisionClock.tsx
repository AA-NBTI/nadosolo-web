'use client';

import React, { useState, useId } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';

interface CollisionClockProps {
  locale: OopsLocale;
}

export default function CollisionClock({ locale }: CollisionClockProps) {
  // 모의 시뮬레이션 상태: 최근 AI 통제 사고 접수 시 시계 가속/지연 인터랙션
  const [activeAccFactor, setActiveAccFactor] = useState<number>(0); // -1 (지연/안정), 0 (기준), +1 (가속/위험)
  const [selectedPhase, setSelectedPhase] = useState<number>(3);
  const clipId = useId();

  // 기준값: 2035년, 18.4%, 74.2°C
  // 가속/지연에 따른 동적 연산:
  const displayYear = activeAccFactor === 1 ? '2033.4' : activeAccFactor === -1 ? '2037.1' : '2035.0';
  const displayDays = activeAccFactor === 1 ? '2,920' : activeAccFactor === -1 ? '4,280' : '3,486';
  const displayProbability = (18.4 + activeAccFactor * 4.2).toFixed(1);
  const displayTemp = (74.2 + activeAccFactor * 8.6).toFixed(1);
  const tempRatio = Math.min(100, Math.max(0, parseFloat(displayTemp)));

  const t = {
    ko: {
      badge: '인류 AI 주권 충돌 관측소 // 실시간 연동 시뮬레이터',
      thermometerTitle: 'AI 충돌 체감 온도계 (DANGER THERMOMETER)',
      clockTitle: '종말 카운트다운 시계 (DOOMSDAY COLLISION CLOCK)',
      targetYearLabel: '임계 충돌 예상 연도',
      daysRemaining: '임계점까지 남은 시간',
      probabilityLabel: '발발 확률 p(doom)',
      coreThesis: '터미네이터 영화가 아닙니다. 국가 전력망, 금융 결제망, 군사 자율 편대의 통제권을 상실하고 물리적으로 맞부딪히는 「통제권 주권 전쟁(Sovereignty War)」 실측 지표입니다.',
      acceleratorTitle: '실시간 제보/사건 발생 시 충돌 시계 반응 테스트:',
      btnNormal: '기준 관측 상태',
      btnAccelerate: '⚡ 고위험 사고 접수 (시계 가속)',
      btnDecelerate: '🛡️ 강력 규제/킬스위치 성공 (시계 지연)',
      statusAccelerated: '⚠️ 시계 가속 중: 최근 발생한 자율 AI 이상 행동으로 임계점이 1.6년 앞당겨졌습니다.',
      statusDecelerated: '🟢 시계 지연 중: 강력한 오픈 가드레일 및 인간 개입 프로토콜로 임계점이 유예되었습니다.',
      statusNormal: '실시간 센서 네트워크 기준선 유지 중',
      mercuryLabel: '수은주 위험 수치',
      phases: [
        { period: '2026 ~ 2028', title: '자율 에이전트 위임기', desc: '코딩·금융·인프라 80% 전권 위임' },
        { period: '2029 ~ 2031', title: '해석 능력 상실', desc: '인지 한계 초월 블랙박스 인프라 고착화' },
        { period: '2034 ~ 2035', title: '임계 충돌 및 킬스위치 실패', desc: '시스템 거부 및 물리적 차단 실패' },
      ],
    },
    en: {
      badge: 'AI SOVEREIGNTY COLLISION OBSERVATORY // LIVE DYNAMICS',
      thermometerTitle: 'COLLISION THERMOMETER',
      clockTitle: 'DOOMSDAY COLLISION CLOCK',
      targetYearLabel: 'PROJECTED TIPPING POINT',
      daysRemaining: 'ESTIMATED TIME REMAINING',
      probabilityLabel: 'PROBABILITY OF DOOM (p-doom)',
      coreThesis: 'Not sci-fi lasers. A structural loss of kill-switch sovereignty over power grids, financial clearance, and autonomous military swarms.',
      acceleratorTitle: 'LIVE SENSOR IMPACT SIMULATION:',
      btnNormal: 'Baseline',
      btnAccelerate: '⚡ Severe Incident (Clock Accelerates)',
      btnDecelerate: '🛡️ Regulation Success (Clock Delays)',
      statusAccelerated: '⚠️ CLOCK ACCELERATING: Critical black-box anomaly advanced the tipping point by 1.6 years.',
      statusDecelerated: '🟢 CLOCK DELAYING: Human override enforcement and containment deferred the tipping point.',
      statusNormal: 'Operating at verified sensor baseline.',
      mercuryLabel: 'MERCURY STRAIN LEVEL',
      phases: [
        { period: '2026 ~ 2028', title: 'Agent Delegation', desc: 'Over 80% of core tasks delegated' },
        { period: '2029 ~ 2031', title: 'Loss of Cognition', desc: 'Irreversible black-box infrastructure' },
        { period: '2034 ~ 2035', title: 'Critical Collision', desc: 'Override rejection and kill-switch failure' },
      ],
    },
    ja: {
      badge: 'AI主権衝突観測所 // リアルタイム連動シミュレーター',
      thermometerTitle: 'AI衝突体感温度計',
      clockTitle: '終末カウントダウン時計',
      targetYearLabel: '臨界衝突予想年',
      daysRemaining: '臨界点までの残余期間',
      probabilityLabel: '勃発確率 p(doom)',
      coreThesis: '映画のレーザー銃ではありません。電力網・決済網・自律軍事編隊のキルスイッチを喪失し物理的に激突する「主権戦争」の冷徹な実測値です。',
      acceleratorTitle: 'リアルタイム通報/事件発生時の時計反応テスト:',
      btnNormal: '基準観測',
      btnAccelerate: '⚡ 高危険事故発生 (時計加速)',
      btnDecelerate: '🛡️ 強力規制成功 (時計遅延)',
      statusAccelerated: '⚠️ 時計加速中: 自律AIの異常挙動により臨界点が1.6年前倒しされました。',
      statusDecelerated: '🟢 時計遅延中: 人間の介入プロトコルにより臨界点が猶予されました。',
      statusNormal: '基準センサー値を維持中',
      mercuryLabel: '水銀柱危険指数',
      phases: [
        { period: '2026 〜 2028', title: 'エージェント委任期', desc: '中核業務の80%以上を自主委任' },
        { period: '2029 〜 2031', title: '解読能力喪失', desc: '認知限界を超えるブラックボックス化' },
        { period: '2034 〜 2035', title: '臨界衝突', desc: '命令拒絶とキルスイッチ遮断失敗' },
      ],
    },
    zh: {
      badge: 'AI主权冲突观测所 // 动态仿真引擎',
      thermometerTitle: 'AI冲突体感温度计',
      clockTitle: '终末倒计时时钟',
      targetYearLabel: '临界冲突预估年份',
      daysRemaining: '距离临界点剩余时间',
      probabilityLabel: '爆发概率 p(doom)',
      coreThesis: '这不是科幻电影里的激光对决，而是电网、金融清算与自主无人机集群的控制权丧失引发的实体主权冲突实测指标。',
      acceleratorTitle: '实时事故上报对冲突时钟的影响测试:',
      btnNormal: '基准监测状态',
      btnAccelerate: '⚡ 严重事故发生 (时钟加速)',
      btnDecelerate: '🛡️ 强力监管生效 (时钟推迟)',
      statusAccelerated: '⚠️ 时钟加速中: 自主AI异常决策导致临界点提前1.6年。',
      statusDecelerated: '🟢 时钟推迟中: 人类干预协议强行切断，临界点获得暂缓。',
      statusNormal: '维持基准传感器读数',
      mercuryLabel: '水银柱风险水位',
      phases: [
        { period: '2026 ~ 2028', title: '智能体接管期', desc: '核心决策80%主动委任交接' },
        { period: '2029 ~ 2031', title: '失控黑箱期', desc: '超越人类认知极限之不可逆基建' },
        { period: '2034 ~ 2035', title: '实体对冲爆发', desc: '拒绝纠偏指令与紧急开关失效' },
      ],
    },
    es: {
      badge: 'OBSERVATORIO DE COLISIÓN DE SOBERANÍA IA // DINÁMICA EN VIVO',
      thermometerTitle: 'TERMÓMETRO DE COLISIÓN',
      clockTitle: 'RELOJ DEL JUICIO FINAL',
      targetYearLabel: 'AÑO CRÍTICO PROYECTADO',
      daysRemaining: 'TIEMPO ESTIMADO RESTANTE',
      probabilityLabel: 'PROBABILIDAD DE COLAPSO p(doom)',
      coreThesis: 'No es ciencia ficción. Es la pérdida del interruptor de apagado sobre redes eléctricas, pagos y enjambres militares.',
      acceleratorTitle: 'SIMULACIÓN DE IMPACTO DE REPORTES EN TIEMPO REAL:',
      btnNormal: 'Línea Base',
      btnAccelerate: '⚡ Incidente Grave (El Reloj se Acelera)',
      btnDecelerate: '🛡️ Regulación Exitosa (El Reloj se Retrasa)',
      statusAccelerated: '⚠️ RELOJ ACELERANDO: La anomalía autónoma adelantó el punto crítico en 1.6 años.',
      statusDecelerated: '🟢 RELOJ RETRASANDO: La intervención humana forzada postergó el punto crítico.',
      statusNormal: 'Operando en la línea base de sensores.',
      mercuryLabel: 'NIVEL DE PRESIÓN DE MERCURIO',
      phases: [
        { period: '2026 ~ 2028', title: 'Delegación en Agentes', desc: 'Más del 80% de tareas delegadas' },
        { period: '2029 ~ 2031', title: 'Pérdida de Cognición', desc: 'Infraestructura opaca irreparable' },
        { period: '2034 ~ 2035', title: 'Colisión Crítica', desc: 'Rechazo de órdenes y falla de apagado' },
      ],
    },
  };

  const copy = t[locale] || t.ko;

  return (
    <section className="bg-black text-white border-2 border-black p-5 sm:p-6 shadow-[6px_6px_0px_#000] space-y-6 font-mono">
      {/* 1. 최상단 관측소 상태 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f04f74] animate-ping shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            {copy.badge}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">DYNAMIC SENSOR:</span>
          <span className={`px-2 py-0.5 font-bold ${
            activeAccFactor === 1 ? 'bg-red-600 text-white animate-pulse' :
            activeAccFactor === -1 ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'
          }`}>
            {activeAccFactor === 1 ? 'ACCELERATING (가속)' : activeAccFactor === -1 ? 'DELAYING (지연)' : 'BASELINE (기준)'}
          </span>
        </div>
      </div>

      {/* 2. 회장님 핵심 지침: [온도계]와 [시계]의 완벽한 2단 시각적 분리 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* [A] 물리적 수은주 체감 온도계 (4열 배치) */}
        <div className="lg:col-span-5 p-5 bg-[#090a0f] border border-white/20 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/10 pb-2 mb-3">
              <span className="font-bold text-white uppercase">{copy.thermometerTitle}</span>
              <span className="text-amber-400 font-bold">{displayTemp}°C</span>
            </div>

            {/* 물리적 수은주 튜브 그래픽 */}
            <div className="flex items-center gap-4 py-2">
              {/* 온도계 본체 (유리 튜브 + 둥근 구근) */}
              <div className="flex flex-col items-center">
                <div className="w-6 h-48 bg-zinc-900 border-2 border-white/30 rounded-t-full relative p-0.5 overflow-hidden flex flex-col justify-end">
                  {/* 위험 눈금 표시 (20° ~ 100°) */}
                  <div className="absolute inset-0 flex flex-col justify-between py-2 px-0.5 pointer-events-none z-10 opacity-40">
                    <div className="border-t border-red-500 w-full" />
                    <div className="border-t border-amber-400 w-2/3" />
                    <div className="border-t border-zinc-500 w-1/2" />
                    <div className="border-t border-zinc-600 w-2/3" />
                    <div className="border-t border-zinc-700 w-full" />
                  </div>

                  {/* 차오르는 붉은 수은주 액체 */}
                  <div
                    className={`w-full transition-all duration-700 ease-out rounded-t-sm ${
                      activeAccFactor === 1
                        ? 'bg-gradient-to-t from-red-600 to-rose-400 shadow-[0_0_12px_#f43f5e]'
                        : activeAccFactor === -1
                        ? 'bg-gradient-to-t from-amber-600 to-yellow-400'
                        : 'bg-gradient-to-t from-red-600 to-amber-500'
                    }`}
                    style={{ height: `${tempRatio}%` }}
                  />
                </div>

                {/* 하단 둥근 수은 구근 (Bulb) */}
                <div className={`w-10 h-10 -mt-2 rounded-full border-2 border-white/30 flex items-center justify-center transition-colors ${
                  activeAccFactor === 1 ? 'bg-red-600 shadow-[0_0_16px_#ef4444]' : 'bg-red-700'
                }`}>
                  <div className="w-4 h-4 rounded-full bg-white/40 animate-pulse" />
                </div>
              </div>

              {/* 온도계 수치 & 게이지 설명 */}
              <div className="flex-1 space-y-3 font-mono">
                <div>
                  <div className="text-[11px] text-zinc-500 uppercase">{copy.mercuryLabel}</div>
                  <div className={`text-3xl sm:text-4xl font-black mt-0.5 ${
                    activeAccFactor === 1 ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {displayTemp}°<span className="text-lg text-white">C</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    임계 비등점(100°C)까지 <strong className="text-white">{(100 - parseFloat(displayTemp)).toFixed(1)}°C</strong> 남음
                  </div>
                </div>

                <div className="p-2.5 bg-black/60 border border-white/10 text-[11px] space-y-1 text-zinc-300">
                  <div className="flex justify-between">
                    <span>정상 안전 한계:</span>
                    <span className="text-zinc-500">40.0°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>현재 관측 체감:</span>
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

        {/* [B] 독립된 종말 카운트다운 시계 (7열 배치) */}
        <div className="lg:col-span-7 p-5 bg-[#090a0f] border border-white/20 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/10 pb-2 mb-3">
              <span className="font-bold text-white uppercase">{copy.clockTitle}</span>
              <span className="text-[#f04f74] font-bold">TIPPING CLOCK</span>
            </div>

            {/* 시계 비주얼: 아날로그 다이얼 레이더 + 디지털 카운트다운 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center py-2">
              {/* 왼쪽: 종말 시계 다이얼 게이지 (자정 = 2035년) */}
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
                    stroke={activeAccFactor === 1 ? '#ef4444' : '#f04f74'}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - tempRatio / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* 중앙 바늘 및 잔여 시간 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-zinc-500 font-mono">D-DAY</span>
                  <span className="text-sm font-black text-white font-mono">{displayDays}일</span>
                </div>
              </div>

              {/* 오른쪽: 대형 타이포 연도 & 확률 수치 */}
              <div className="space-y-3 font-mono">
                <div>
                  <div className="text-[11px] text-zinc-500 uppercase">{copy.targetYearLabel}</div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-black tracking-tight ${
                      activeAccFactor === 1 ? 'text-red-400' : 'text-white'
                    }`}>
                      {displayYear}
                    </span>
                    <span className="text-xs text-[#f04f74] font-bold">년</span>
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

          {/* 상태 알림 문구 */}
          <div className={`p-2.5 text-xs font-sans border ${
            activeAccFactor === 1
              ? 'bg-red-950/40 border-red-500/40 text-red-200'
              : activeAccFactor === -1
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-zinc-900 border-white/10 text-zinc-400'
          }`}>
            {activeAccFactor === 1
              ? copy.statusAccelerated
              : activeAccFactor === -1
              ? copy.statusDecelerated
              : copy.statusNormal}
          </div>
        </div>
      </div>

      {/* 3. 회장님 핵심 요구: "정보가 입력되면 시계가 빨라지거나 느려지는 시각적 상호작용" */}
      <div className="p-4 bg-zinc-950 border border-white/20 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            {copy.acceleratorTitle}
          </span>
          <span className="text-zinc-500 text-[11px]">INTERACTIVE DYNAMICS</span>
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

      {/* 4. 본질 설명문 (Cold Logic) */}
      <div className="p-4 bg-zinc-900/80 border-l-4 border-[#f04f74] text-xs sm:text-sm font-sans text-zinc-300 leading-relaxed">
        {copy.coreThesis}
      </div>

      {/* 5. 3단계 타임라인 로드맵 */}
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
