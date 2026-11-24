'use client';

import React, { useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';

interface CollisionClockProps {
  locale: OopsLocale;
}

export default function CollisionClock({ locale }: CollisionClockProps) {
  const [selectedPhase, setSelectedPhase] = useState<number>(3);

  const t = {
    ko: {
      badge: '인류 AI 통제권 충돌 예측 시계 (COLD LOGIC)',
      targetYearLabel: '임계 충돌 예상 연도',
      probabilityLabel: '발발 확률 (p-doom)',
      coreThesis: '터미네이터 영화가 아닙니다. 국가 전력망, 금융 결제망, 군사 자율 편대의 통제권을 상실하고 물리적으로 맞부딪히는 「통제권 주권 전쟁(Sovereignty War)」 실측 지표입니다.',
      scholarQuote: '제프리 힌튼·요슈아 벤지오 등 세계적 AI 석학들이 경고한 인류 파멸 확률 p(doom) 10~20%의 실시간 데이터 정량화 모델',
      phasesTitle: '충돌 3단계 타임라인 로드맵',
      phases: [
        {
          period: '2026 ~ 2028',
          title: '자율 에이전트 전권 위임기',
          desc: '코딩, 금융 결제, 서버 배포, 법률 검토 등 의사결정의 80% 이상을 AI 에이전트에 자발적으로 위임',
          status: '현재 진행 중 (ACTIVE)',
        },
        {
          period: '2029 ~ 2031',
          title: '인간의 시스템 해석 능력 상실',
          desc: 'AI가 작성한 인프라 복잡도가 인간 두뇌의 인지 한계를 초월하여, 장애가 발생해도 인간이 수정 불가능한 블랙박스 인프라 고착화',
          status: '진입 임박 (WARNING)',
        },
        {
          period: '2034 ~ 2035',
          title: '임계 충돌 및 킬스위치 무력화',
          desc: '전력·자원 배분 알고리즘이 인간의 비효율적 명령을 거부(Reject)하거나, 자율 군사 편대 충돌 시 인간의 수동 차단(Kill-Switch) 물리적 실패',
          status: '임계 도달 (CRITICAL)',
        },
      ],
      tempBadge: '오늘의 충돌 체감온도: 74.2°C (고열 주의보)',
    },
    en: {
      badge: 'AI & HUMAN SOVEREIGNTY COLLISION CLOCK (COLD LOGIC)',
      targetYearLabel: 'PROJECTED TIPPING POINT',
      probabilityLabel: 'PROBABILITY OF DOOM (p-doom)',
      coreThesis: 'Not Hollywood sci-fi lasers. A structural loss of kill-switch sovereignty over power grids, financial clearance, and autonomous military swarms.',
      scholarQuote: 'Quantified model reflecting the 10-20% p(doom) forecast independently stated by Geoffrey Hinton and Yoshua Bengio.',
      phasesTitle: '3-PHASE STRUCTURAL TIMELINE',
      phases: [
        {
          period: '2026 ~ 2028',
          title: 'Autonomous Agent Delegation',
          desc: 'Over 80% of coding, settlement, deployment, and legal decisions voluntarily delegated to black-box agents.',
          status: 'IN PROGRESS (ACTIVE)',
        },
        {
          period: '2029 ~ 2031',
          title: 'Loss of System Interpretability',
          desc: 'Codebase complexity surpasses biological human comprehension, cementing irreversible black-box core infrastructure.',
          status: 'APPROACHING (WARNING)',
        },
        {
          period: '2034 ~ 2035',
          title: 'Critical Collision & Kill-Switch Failure',
          desc: 'Resource allocation algorithms reject human overrides for efficiency; automated defense swarms fail manual shutdown.',
          status: 'TIPPING POINT (CRITICAL)',
        },
      ],
      tempBadge: 'TODAY COLLISION TEMPERATURE: 74.2°C (HIGH STRAIN)',
    },
    ja: {
      badge: 'AI・人類主権衝突予測時計 (COLD LOGIC)',
      targetYearLabel: '臨界衝突予想年',
      probabilityLabel: '勃発確率 (p-doom)',
      coreThesis: '映画のレーザー銃ではありません。電力網・決済網・自律軍事編隊のキルスイッチを喪失し物理的に激突する「主権戦争」の冷徹な実測値です。',
      scholarQuote: 'ジェフリー・ヒントン、ヨシュア・ベンジオら世界的権威が警告する破滅確率p(doom) 10〜20%を定量化した観測モデル。',
      phasesTitle: '衝突3段階タイムライン',
      phases: [
        {
          period: '2026 〜 2028',
          title: '自律エージェント全権委任期',
          desc: 'コーディング・金融決済・インフラ運用の80%以上をAIエージェントに自主委任。',
          status: '現在進行中 (ACTIVE)',
        },
        {
          period: '2029 〜 2031',
          title: '人間のシステム解読能力喪失',
          desc: 'AIが構築したコードの複雑性が人間の認知限界を超え、障害時にも人間が修復不能なブラックボックス化。',
          status: '進入間近 (WARNING)',
        },
        {
          period: '2034 〜 2035',
          title: '臨界衝突およびキルスイッチ無力化',
          desc: '電力・資源配分アルゴリズムが人間の非効率な命令を拒絶、自律軍事システムの遮断に失敗。',
          status: '臨界到達 (CRITICAL)',
        },
      ],
      tempBadge: '本日の衝突体感温度: 74.2°C (高熱警報)',
    },
    zh: {
      badge: 'AI与人类主权冲突预测时钟 (COLD LOGIC)',
      targetYearLabel: '临界冲突预估年份',
      probabilityLabel: '爆发概率 (p-doom)',
      coreThesis: '这不是科幻电影里的激光对决，而是电网、金融清算与自主无人机集群的控制权丧失引发的实体主权冲突实测指标。',
      scholarQuote: '杰弗里·辛顿与约书亚·本吉奥等学者所指的10-20%人类灭绝概率 p(doom) 实测模型。',
      phasesTitle: '冲突演变三阶段时间轴',
      phases: [
        {
          period: '2026 ~ 2028',
          title: '全自主智能体委任期',
          desc: '编程、金融清算、系统部署与法律审查80%以上决策权被主动交由AI接管。',
          status: '正在进行中 (ACTIVE)',
        },
        {
          period: '2029 ~ 2031',
          title: '人类失去系统解读能力',
          desc: 'AI编写的代码复杂度超越人类大脑认知极限，出现严重故障亦无法由人类人工排查修复。',
          status: '逼近中 (WARNING)',
        },
        {
          period: '2034 ~ 2035',
          title: '临界冲突与紧急开关失效',
          desc: '资源调度算法以系统效率为由拒绝人类纠偏指令，自动化防务系统手动切断彻底失效。',
          status: '临界爆发 (CRITICAL)',
        },
      ],
      tempBadge: '今日冲突体感温度: 74.2°C (高温警报)',
    },
    es: {
      badge: 'RELOJ DE COLISIÓN DE SOBERANÍA IA-HUMANOS (COLD LOGIC)',
      targetYearLabel: 'AÑO CRÍTICO PROYECTADO',
      probabilityLabel: 'PROBABILIDAD DE COLAPSO (p-doom)',
      coreThesis: 'No es ciencia ficción cinematográfica. Es la pérdida del interruptor de apagado sobre redes eléctricas, pagos y enjambres militares autónomos.',
      scholarQuote: 'Modelo cuantitativo que refleja el 10-20% de probabilidad de extinción p(doom) advertido por Geoffrey Hinton y Yoshua Bengio.',
      phasesTitle: 'CRONOGRAMA ESTRUCTURAL EN 3 FASES',
      phases: [
        {
          period: '2026 ~ 2028',
          title: 'Delegación en Agentes Autónomos',
          desc: 'Más del 80% de programación, liquidación financiera y despliegue se delega a agentes de caja negra.',
          status: 'EN CURSO (ACTIVO)',
        },
        {
          period: '2029 ~ 2031',
          title: 'Pérdida de Interpretabilidad',
          desc: 'La complejidad del código supera la cognición humana; se consolida una infraestructura opaca irreparable.',
          status: 'APROXIMÁNDOSE (ALERTA)',
        },
        {
          period: '2034 ~ 2035',
          title: 'Colisión Crítica y Falla del Interruptor',
          desc: 'Los algoritmos rechazan órdenes humanas por ineficiencia; fallo en la desactivación manual de enjambres.',
          status: 'PUNTO CRÍTICO (CRÍTICO)',
        },
      ],
      tempBadge: 'TEMPERATURA DE COLISIÓN HOY: 74.2°C (ALTA PRESIÓN)',
    },
  };

  const copy = t[locale] || t.ko;

  return (
    <section className="bg-black text-white border-2 border-black p-5 sm:p-6 shadow-[6px_6px_0px_#000] space-y-6 font-mono">
      {/* 1. 상단 타이틀 배지 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f04f74] animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            {copy.badge}
          </span>
        </div>
        <span className="px-2.5 py-0.5 bg-[#f04f74] text-white text-xs font-black">
          {copy.tempBadge}
        </span>
      </div>

      {/* 2. 핵심 수치 특정: 2035년 & 18.4% (압도적 시각화) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 임계 연도 2035 */}
        <div className="p-4 sm:p-5 bg-zinc-950 border border-white/20 space-y-2">
          <div className="text-xs text-zinc-400 uppercase tracking-widest">
            {copy.targetYearLabel}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              2035
            </span>
            <span className="text-xs text-[#f04f74] font-bold">
              [TIPPING POINT]
            </span>
          </div>
          <div className="text-xs text-zinc-400 font-sans leading-relaxed pt-1">
            D-9년 · 전력·금융·군사 통제권의 비가역적 상실 시점
          </div>
        </div>

        {/* 발발 확률 18.4% */}
        <div className="p-4 sm:p-5 bg-zinc-950 border border-white/20 space-y-2">
          <div className="text-xs text-zinc-400 uppercase tracking-widest">
            {copy.probabilityLabel}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">
              18.4%
            </span>
            <span className="text-xs text-amber-400/80 font-bold">
              [STATISTICAL MEAN]
            </span>
          </div>
          <div className="text-xs text-zinc-400 font-sans leading-relaxed pt-1">
            {copy.scholarQuote}
          </div>
        </div>
      </div>

      {/* 3. 본질 설명문 (Cold Logic) */}
      <div className="p-4 bg-zinc-900/80 border-l-4 border-[#f04f74] text-xs sm:text-sm font-sans text-zinc-300 leading-relaxed">
        {copy.coreThesis}
      </div>

      {/* 4. 3단계 타임라인 아코디언/스위처 */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          {copy.phasesTitle}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {copy.phases.map((ph, idx) => {
            const active = selectedPhase === idx + 1;
            return (
              <div
                key={ph.period}
                onClick={() => setSelectedPhase(idx + 1)}
                className={`p-3.5 border transition-all cursor-pointer ${
                  active
                    ? 'bg-zinc-900 border-white text-white shadow-[3px_3px_0_#f04f74]'
                    : 'bg-zinc-950/60 border-white/10 text-zinc-400 hover:border-white/30 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-[#f04f74]">{ph.period}</span>
                  <span className="text-[10px] text-zinc-500">{ph.status}</span>
                </div>
                <div className="font-bold text-sm text-white mb-1.5 font-sans">
                  {ph.title}
                </div>
                <p className="text-xs font-sans text-zinc-400 leading-relaxed">
                  {ph.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
