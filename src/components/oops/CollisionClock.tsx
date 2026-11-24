'use client';

import React, { useState, useEffect } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';

interface CollisionClockProps {
  locale: OopsLocale;
}

interface YearRegionTemp {
  year: number;
  globalTemp: number;
  regions: {
    name: Record<OopsLocale, string>;
    code: string;
    temp: number;
    deltaNote: string;
    status: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
  }[];
  headline: Record<OopsLocale, string>;
}

// 2024년부터 2035년까지의 연도별 실측 및 예측 위험 온도 데이터
const HISTORICAL_REGIONAL_DATA: Record<number, YearRegionTemp> = {
  2024: {
    year: 2024,
    globalTemp: 32.4,
    headline: {
      ko: '2024년: 생성형 AI 도입 초기 — 실리콘밸리 중심 불안감 형성, 글로벌 남반부는 무풍지대',
      en: '2024: Early GenAI Adoption — Silicon Valley strain rises, Global South remains calm',
      ja: '2024年: 生成AI導入初期 — シリコンバレー中心の不安、グローバルサウスは平静',
      zh: '2024年: 生成式AI早期普及 — 硅谷核心区焦虑上升，全球南方基本处于平静期',
      es: '2024: Adopción Temprana de IA — Tensión en Silicon Valley, Sur Global en calma',
    },
    regions: [
      { name: { ko: '미국 (실리콘밸리)', en: 'USA (Silicon Valley)', ja: '米国 (シリコンバレー)', zh: '美国 (硅谷)', es: 'EE.UU. (Silicon Valley)' }, code: 'US', temp: 48.5, deltaNote: '+12.4°', status: 'MED' },
      { name: { ko: '대한민국 (서울)', en: 'South Korea (Seoul)', ja: '韓国 (ソウル)', zh: '韩国 (首尔)', es: 'Corea del Sur (Seúl)' }, code: 'KR', temp: 36.2, deltaNote: '+5.1°', status: 'LOW' },
      { name: { ko: '유럽연합 (브뤼셀)', en: 'EU (Brussels)', ja: '欧州連合 (ブリュッセル)', zh: '欧盟 (布鲁塞尔)', es: 'Unión Europea (Bruselas)' }, code: 'EU', temp: 42.0, deltaNote: '+8.3°', status: 'MED' },
      { name: { ko: '일본 (도쿄)', en: 'Japan (Tokyo)', ja: '日本 (東京)', zh: '日本 (东京)', es: 'Japón (Tokio)' }, code: 'JP', temp: 28.4, deltaNote: '+2.1°', status: 'LOW' },
      { name: { ko: '아프리카 (케냐/나이지리아)', en: 'Africa (Sub-Saharan)', ja: 'アフリカ (サハラ以南)', zh: '非洲 (撒哈拉以南)', es: 'África Subsahariana' }, code: 'AF', temp: 8.5, deltaNote: '+0.5°', status: 'LOW' },
      { name: { ko: '남미 (브라질)', en: 'South America (Brazil)', ja: '南米 (ブラジル)', zh: '南美 (巴西)', es: 'Sudamérica (Brasil)' }, code: 'SA', temp: 14.2, deltaNote: '+1.2°', status: 'LOW' },
    ],
  },
  2026: {
    year: 2026,
    globalTemp: 74.2,
    headline: {
      ko: '2026년 오늘: 자율 코딩·금융 에이전트 전면 배치 — 한국·미국 70°C 이상 고열, 아프리카도 28°C 돌파',
      en: '2026 Today: Autonomous Agent Deployment — US & Korea surpass 70°C, Africa crosses 28°C',
      ja: '2026年現在: 自律エージェント全面配備 — 韓国・米国が70°C突破、アフリカも28°C超',
      zh: '2026年今日: 自主智能体全面铺开 — 美韩均破70°C，非洲亦升至28°C以上',
      es: '2026 Hoy: Despliegue de Agentes Autónomos — EE.UU. y Corea superan 70°C, África supera 28°C',
    },
    regions: [
      { name: { ko: '미국 (실리콘밸리/워싱턴)', en: 'USA (Silicon Valley/DC)', ja: '米国 (シリコンバレー/DC)', zh: '美国 (硅谷/华盛顿)', es: 'EE.UU. (Silicon Valley/DC)' }, code: 'US', temp: 78.4, deltaNote: '+29.9°', status: 'HIGH' },
      { name: { ko: '대한민국 (서울/판교)', en: 'South Korea (Seoul/Pangyo)', ja: '韓国 (ソウル/板橋)', zh: '韩国 (首尔/板桥)', es: 'Corea del Sur (Seúl/Pangyo)' }, code: 'KR', temp: 74.2, deltaNote: '+38.0°', status: 'HIGH' },
      { name: { ko: '유럽연합 (브뤼셀/베를린)', en: 'EU (Brussels/Berlin)', ja: '欧州連合 (ブリュッセル/ベルリン)', zh: '欧盟 (布鲁塞尔/柏林)', es: 'Unión Europea (Bruselas/Berlín)' }, code: 'EU', temp: 71.0, deltaNote: '+29.0°', status: 'HIGH' },
      { name: { ko: '일본 (도쿄)', en: 'Japan (Tokyo)', ja: '日本 (東京)', zh: '日本 (东京)', es: 'Japón (Tokio)' }, code: 'JP', temp: 59.5, deltaNote: '+31.1°', status: 'MED' },
      { name: { ko: '아프리카 (케냐/나이지리아)', en: 'Africa (Sub-Saharan)', ja: 'アフリカ (サハラ以南)', zh: '非洲 (撒哈拉以南)', es: 'África Subsahariana' }, code: 'AF', temp: 28.6, deltaNote: '+20.1°', status: 'LOW' },
      { name: { ko: '남미 (브라질/아르헨)', en: 'South America (BR/AR)', ja: '南米 (ブラジル/アルゼンチン)', zh: '南美 (巴西/阿根廷)', es: 'Sudamérica (Brasil/Argentina)' }, code: 'SA', temp: 39.8, deltaNote: '+25.6°', status: 'LOW' },
    ],
  },
  2030: {
    year: 2030,
    globalTemp: 88.5,
    headline: {
      ko: '2030년 예측: 시스템 해석 불가 블랙박스 단계 — 미국·한국 90°C 육박, 아프리카도 데이터 센터 증설로 54°C 급등',
      en: '2030 Projection: Cognitive Black-Box Stage — US/KR near 90°C, Africa surges to 54°C via mega datacenter hubs',
      ja: '2030年予測: システム解読不能のブラックボックス段階 — 米韓は90°C迫る、アフリカも54°Cへ急騰',
      zh: '2030年测算: 认知黑箱阶段 — 美韩逼近90°C，非洲因超级算力中心激增而升至54°C',
      es: '2030 Proyección: Etapa de Caja Negra — EE.UU. y Corea cerca de 90°C, África salta a 54°C',
    },
    regions: [
      { name: { ko: '미국 (실리콘밸리)', en: 'USA (Silicon Valley)', ja: '米国 (シリコンバレー)', zh: '美国 (硅谷)', es: 'EE.UU. (Silicon Valley)' }, code: 'US', temp: 92.1, deltaNote: '+13.7°', status: 'CRITICAL' },
      { name: { ko: '대한민국 (서울)', en: 'South Korea (Seoul)', ja: '韓国 (ソウル)', zh: '韩国 (首尔)', es: 'Corea del Sur (Seúl)' }, code: 'KR', temp: 88.6, deltaNote: '+14.4°', status: 'CRITICAL' },
      { name: { ko: '유럽연합 (EU)', en: 'European Union (EU)', ja: '欧州連合 (EU)', zh: '欧盟 (EU)', es: 'Unión Europea (UE)' }, code: 'EU', temp: 86.4, deltaNote: '+15.4°', status: 'CRITICAL' },
      { name: { ko: '일본 (도쿄)', en: 'Japan (Tokyo)', ja: '日本 (東京)', zh: '日本 (东京)', es: 'Japón (Tokio)' }, code: 'JP', temp: 79.2, deltaNote: '+19.7°', status: 'HIGH' },
      { name: { ko: '아프리카 (나이로비/라고스)', en: 'Africa (Nairobi/Lagos)', ja: 'アフリカ (ナイロビ/ラゴス)', zh: '非洲 (内罗毕/拉各斯)', es: 'África (Nairobi/Lagos)' }, code: 'AF', temp: 54.0, deltaNote: '+25.4°', status: 'MED' },
      { name: { ko: '남미 (상파울루)', en: 'South America (São Paulo)', ja: '南米 (サンパウロ)', zh: '南美 (圣保罗)', es: 'Sudamérica (São Paulo)' }, code: 'SA', temp: 62.5, deltaNote: '+22.7°', status: 'MED' },
    ],
  },
  2035: {
    year: 2035,
    globalTemp: 98.4,
    headline: {
      ko: '2035년 기준선: 임계 충돌선 — 전 지구 비등점 100°C 도달, 아프리카 포함 전 대륙 80°C 이상 비상',
      en: '2035 Baseline: Critical Tipping Point — Global boiling point at 100°C, all continents above 80°C',
      ja: '2035年基準線: 臨界衝突線 — 全地球が沸点100°C到達、全大陸が80°C超えの非常事態',
      zh: '2035年基准线: 临界对冲线 — 全球沸点冲上100°C，所有大洲无一幸免越过80°C',
      es: 'Línea Base 2035: Colisión Crítica — Ebullición global en 100°C, todos los continentes superan 80°C',
    },
    regions: [
      { name: { ko: '미국 (전역)', en: 'USA (Nationwide)', ja: '米国 (全土)', zh: '美国 (全境)', es: 'EE.UU. (Nacional)' }, code: 'US', temp: 99.8, deltaNote: '+7.7°', status: 'CRITICAL' },
      { name: { ko: '대한민국 (전역)', en: 'South Korea (Nationwide)', ja: '韓国 (全土)', zh: '韩国 (全境)', es: 'Corea del Sur (Nacional)' }, code: 'KR', temp: 98.5, deltaNote: '+9.9°', status: 'CRITICAL' },
      { name: { ko: '유럽연합 (전역)', en: 'European Union (All)', ja: '欧州連合 (全域)', zh: '欧盟 (全境)', es: 'Unión Europea (Total)' }, code: 'EU', temp: 97.0, deltaNote: '+10.6°', status: 'CRITICAL' },
      { name: { ko: '일본 (전역)', en: 'Japan (Nationwide)', ja: '日本 (全土)', zh: '日本 (全境)', es: 'Japón (Nacional)' }, code: 'JP', temp: 94.2, deltaNote: '+15.0°', status: 'CRITICAL' },
      { name: { ko: '아프리카 (전역)', en: 'Africa (Pan-African)', ja: 'アフリカ (全域)', zh: '非洲 (全境)', es: 'África (Panafricana)' }, code: 'AF', temp: 82.0, deltaNote: '+28.0°', status: 'HIGH' },
      { name: { ko: '남미 (전역)', en: 'South America (All)', ja: '南米 (全域)', zh: '南美 (全境)', es: 'Sudamérica (Total)' }, code: 'SA', temp: 87.5, deltaNote: '+25.0°', status: 'HIGH' },
    ],
  },
};

export default function CollisionClock({ locale }: CollisionClockProps) {
  // 1. 매일/매초 살아 숨쉬는 실시간 초시계 카운트다운 타이머 (2035년 1월 1일 자정 목표)
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  }>({ days: 3285, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2035-01-01T00:00:00Z').getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const milliseconds = Math.floor((diff % 1000) / 10);

      setTimeLeft({ days, hours, minutes, seconds, milliseconds });
    }, 47); // 47ms 간격으로 밀리초까지 역동적으로 째깍거림

    return () => clearInterval(interval);
  }, []);

  // 2. 연도별 대륙/지역 타임머신 슬라이더 상태 (2024, 2026, 2030, 2035)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const currentData = HISTORICAL_REGIONAL_DATA[selectedYear] || HISTORICAL_REGIONAL_DATA[2026];

  // 3. 모의 시뮬레이션 상태 (-1: 규제/안정, 0: 기준선, +1: 사고 가속)
  const [activeAccFactor, setActiveAccFactor] = useState<number>(0);

  // 연산 변동치
  const baselineRemainingYears = 9.0;
  const deltaYears = activeAccFactor === 1 ? -1.6 : activeAccFactor === -1 ? +2.1 : 0.0;
  const remainingYears = (baselineRemainingYears + deltaYears).toFixed(1);
  const displayProbability = (18.4 + activeAccFactor * 4.2).toFixed(1);
  const displayTemp = (currentData.globalTemp + activeAccFactor * 6.5).toFixed(1);
  const tempRatio = Math.min(100, Math.max(0, parseFloat(displayTemp)));

  const t = {
    ko: {
      badge: '인류 AI 주권 충돌 관측소 // 실시간 초시계 & 연도별 대륙 비교',
      tickerTitle: '2035년 기준선 실시간 카운트다운 (TICKING LIVE)',
      goldenTimeLabel: '인류에게 남은 골든타임',
      deltaLabel: '2035 기준선 대비 여유/단축',
      yearSliderTitle: '연도별 글로벌 AI 체감온도 타임머신 (2024 ➔ 2035):',
      regionalComparisonTitle: '대륙별·국가별 AI 충돌 체감온도 격차',
      simTitle: '새로운 사건 유입 시 골든타임 실시간 반응:',
      btnDecelerate: '🛡️ 킬스위치 입법 성공 (+2.1년 여유)',
      btnNormal: '기준선 복귀 (9.0년)',
      btnAccelerate: '⚡ 고위험 탈옥 사고 (-1.6년 단축)',
      coreThesis: 'AI 충돌은 고정된 정적 수치가 아닙니다. 2024년엔 미국 48도·아프리카 8도로 격차가 컸으나, 2026년 오늘 전 세계가 70도를 넘어서며 매초 단위로 시간이 소진되고 있습니다.',
    },
    en: {
      badge: 'AI SOVEREIGNTY OBSERVATORY // LIVE MILLISECOND TICKER & REGIONAL TIMELINE',
      tickerTitle: '2035 BASELINE LIVE COUNTDOWN (TICKING LIVE)',
      goldenTimeLabel: 'HUMAN GOLDEN TIME REMAINING',
      deltaLabel: 'SURPLUS / DEFICIT vs 2035 BASELINE',
      yearSliderTitle: 'GLOBAL REGIONAL TEMPERATURE TIMEMACHINE (2024 ➔ 2035):',
      regionalComparisonTitle: 'REGIONAL TEMPERATURE DIVERGENCE BY CONTINENT',
      simTitle: 'INCIDENT IMPACT ON GOLDEN TIME:',
      btnDecelerate: '🛡️ Kill-Switch Enacted (+2.1y Surplus)',
      btnNormal: 'Hold Baseline (9.0y left)',
      btnAccelerate: '⚡ Severe Breakout (-1.6y Deficit)',
      coreThesis: 'AI collision is not static. In 2024, the US was at 48°C while Africa was at 8°C. By 2026 today, the global average surged past 70°C with every second ticking away.',
    },
    ja: {
      badge: '人類AI主権衝突観測所 // リアルタイム秒針計＆年度別地域比較',
      tickerTitle: '2035年基準線 リアルタイム秒針カウントダウン',
      goldenTimeLabel: '人類に残されたゴールデンタイム',
      deltaLabel: '2035基準線対比 猶予/短縮',
      yearSliderTitle: '年度別グローバル体感温度タイムマシン (2024 ➔ 2035):',
      regionalComparisonTitle: '大陸別・国家別AI衝突体感温度格差',
      simTitle: '新規事件流入時のゴールデンタイム反応:',
      btnDecelerate: '🛡️ キルスイッチ成功 (+2.1年猶予)',
      btnNormal: '基準線復帰 (9.0年)',
      btnAccelerate: '⚡ 高危険事故流入 (-1.6年短縮)',
      coreThesis: 'AI衝突は静止した数値ではありません。2024年の米国48度・アフリカ8度から、2026年現在の全地球的急騰まで、1秒刻みで人類の時間が消費されています。',
    },
    zh: {
      badge: '人类AI主权冲突观测所 // 毫秒倒计时与年度区域演化对比',
      tickerTitle: '2035基准线实时毫秒倒计时 (TICKING LIVE)',
      goldenTimeLabel: '人类剩余黄金窗口',
      deltaLabel: '对比2035基准线宽限/缩减差',
      yearSliderTitle: '全球区域风险体感温度时间演化机 (2024 ➔ 2035):',
      regionalComparisonTitle: '各大陆与主要国家AI冲突体感温差',
      simTitle: '新事故输入对黄金防卫窗口的实时影响:',
      btnDecelerate: '🛡️ 紧急开关立法落地 (+2.1年宽限)',
      btnNormal: '恢复基准线 (9.0年)',
      btnAccelerate: '⚡ 发生严重失控越狱 (-1.6年提前)',
      coreThesis: 'AI冲突绝非静止数字。2024年美国48°C而非洲仅8°C；至2026年今日全球平均冲破70°C，人类的生存窗口正以毫秒为单位加速消耗。',
    },
    es: {
      badge: 'OBSERVATORIO DE SOBERANÍA IA // CRONÓMETRO EN VIVO Y EVOLUCIÓN REGIONAL',
      tickerTitle: 'CUENTA REGRESIVA EN VIVO LÍNEA BASE 2035 (TICKING LIVE)',
      goldenTimeLabel: 'TIEMPO DE ORO RESTANTE',
      deltaLabel: 'VENTAJA / DÉFICIT FRENTE A 2035',
      yearSliderTitle: 'MÁQUINA DEL TIEMPO DE TEMPERATURA REGIONAL (2024 ➔ 2035):',
      regionalComparisonTitle: 'DIVERGENCIA DE TEMPERATURA POR CONTINENTES',
      simTitle: 'IMPACTO EN TIEMPO REAL:',
      btnDecelerate: '🛡️ Legislación Exitosa (+2.1 años)',
      btnNormal: 'Línea Base (9.0 años)',
      btnAccelerate: '⚡ Incidente Grave (-1.6 años)',
      coreThesis: 'La colisión de IA no es estática. En 2024, EE.UU. marcaba 48°C mientras África solo 8°C. Hoy en 2026, el promedio global supera los 70°C consumiéndose segundo a segundo.',
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
          <span className="text-zinc-500">LIVE CLOCK:</span>
          <span className="text-[#f04f74] font-bold animate-pulse">2035.0 TIPPING LINE</span>
        </div>
      </div>

      {/* 2. 회장님 핵심 요구 1: 매일/매초 째깍거리며 살아 숨쉬는 "초시계 카운트다운 타이머" */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-zinc-950 to-zinc-900 border-2 border-white/20 space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/10 pb-2">
          <span className="font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            {copy.tickerTitle}
          </span>
          <span className="text-[#f04f74] font-bold text-[11px]">ACTIVE STREAM</span>
        </div>

        {/* 대형 전광판 초단위 카운터: 일 / 시 / 분 / 초 / 밀리초 */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 text-center py-2">
          <div className="p-2 sm:p-3 bg-black border border-white/10">
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {timeLeft.days.toLocaleString()}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase mt-1">DAYS (일)</div>
          </div>
          <div className="p-2 sm:p-3 bg-black border border-white/10">
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase mt-1">HOURS (시)</div>
          </div>
          <div className="p-2 sm:p-3 bg-black border border-white/10">
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase mt-1">MINS (분)</div>
          </div>
          <div className="p-2 sm:p-3 bg-black border border-white/10">
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-400 tracking-tight">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-amber-400/80 uppercase mt-1">SECS (초)</div>
          </div>
          <div className="p-2 sm:p-3 bg-black border border-red-500/40">
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-red-500 tracking-tight font-mono">
              {String(timeLeft.milliseconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-red-400 uppercase mt-1">MS (밀리초)</div>
          </div>
        </div>

        {/* 2035 기준선 대비 남은 연수 및 변동 델타 요약 바 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-white/10">
          <div className="flex items-center justify-between p-2 bg-black/60 border border-white/5">
            <span className="text-zinc-400">{copy.goldenTimeLabel}:</span>
            <span className={`text-base font-black ${activeAccFactor === 1 ? 'text-red-400' : activeAccFactor === -1 ? 'text-emerald-400' : 'text-white'}`}>
              {remainingYears}년
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-black/60 border border-white/5">
            <span className="text-zinc-400">{copy.deltaLabel}:</span>
            <span className={`text-base font-black ${deltaYears < 0 ? 'text-red-500' : deltaYears > 0 ? 'text-emerald-400' : 'text-zinc-300'}`}>
              {deltaYears > 0 ? `+${deltaYears}` : deltaYears}년 변동
            </span>
          </div>
        </div>
      </div>

      {/* 3. 회장님 핵심 요구 2: "연도별(2024~2035) & 대륙별(미국 48도 vs 아프리카 8도) 체감 온도 격차 시각화" */}
      <div className="p-5 bg-zinc-950 border border-white/20 space-y-4">
        {/* 상단 연도 슬라이더 버튼 그룹 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
            {copy.yearSliderTitle}
          </div>

          <div className="flex items-center gap-1.5">
            {[2024, 2026, 2030, 2035].map((y) => {
              const active = selectedYear === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1 text-xs font-mono font-bold transition-all border cursor-pointer ${
                    active
                      ? 'bg-white text-black border-white shadow-[2px_2px_0_#f04f74]'
                      : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white hover:border-white/30'
                  }`}
                >
                  {y}년{y === 2026 ? ' (현재)' : y === 2035 ? ' (기준선)' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 연도의 글로벌 헤드라인 */}
        <div className="p-3 bg-zinc-900 border-l-4 border-amber-400 text-xs font-sans text-zinc-200">
          {currentData.headline[locale] || currentData.headline.ko}
        </div>

        {/* 대륙별 체감온도 수평 바 비교 그리드 (미국 48.5° vs 아프리카 8.5° 시각적 대조) */}
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 pb-1.5">
            <span>{copy.regionalComparisonTitle} ({selectedYear}년 관측치)</span>
            <span>체감온도 / 변동</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {currentData.regions.map((rg) => {
              const regName = rg.name[locale] || rg.name.ko;
              return (
                <div key={rg.code} className="p-3 bg-zinc-900/60 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-bold">{regName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 font-normal">{rg.deltaNote}</span>
                      <span className={`font-black text-sm ${
                        rg.temp >= 80 ? 'text-red-400' :
                        rg.temp >= 60 ? 'text-amber-400' :
                        rg.temp >= 30 ? 'text-yellow-200' : 'text-emerald-400'
                      }`}>
                        {rg.temp}°C
                      </span>
                    </div>
                  </div>

                  {/* 온도 바 게이지 */}
                  <div className="w-full h-2.5 bg-zinc-950 border border-white/10 overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-700 ease-out ${
                        rg.temp >= 80
                          ? 'bg-gradient-to-r from-amber-600 to-red-500'
                          : rg.temp >= 60
                          ? 'bg-gradient-to-r from-yellow-600 to-amber-500'
                          : rg.temp >= 30
                          ? 'bg-gradient-to-r from-emerald-600 to-yellow-500'
                          : 'bg-gradient-to-r from-blue-600 to-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, rg.temp)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. 실시간 사건 정보 유입 시 골든타임 가속/지연 인터랙션 버튼 */}
      <div className="p-4 bg-zinc-950 border border-white/20 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {copy.simTitle}
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

      {/* 5. 본질 해설 (Cold Logic) */}
      <div className="p-4 bg-zinc-900/80 border-l-4 border-[#f04f74] text-xs sm:text-sm font-sans text-zinc-300 leading-relaxed">
        {copy.coreThesis}
      </div>
    </section>
  );
}
