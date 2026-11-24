'use client';

import React, { useState, useEffect } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';

interface CollisionClockProps {
  locale: OopsLocale;
}

export default function CollisionClock({ locale }: CollisionClockProps) {
  const [timeLeft, setTimeLeft] = useState<{
    totalHours: number;
    totalMinutes: number;
    days: number;
    hoursInDay: number;
    seconds: number;
    milliseconds: number;
  }>({ totalHours: 71000, totalMinutes: 4260000, days: 2959, hoursInDay: 0, seconds: 0, milliseconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2035-01-01T00:00:00Z').getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const totalMinutes = Math.floor(diff / (1000 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hoursInDay = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const seconds = Math.floor((diff / 1000) % 60);
      const milliseconds = Math.floor((diff % 1000) / 10);

      setTimeLeft({ totalHours, totalMinutes, days, hoursInDay, seconds, milliseconds });
    }, 47);

    return () => clearInterval(interval);
  }, []);

  const [activeAccFactor, setActiveAccFactor] = useState<number>(0);

  const baselineRemainingYears = 9.0;
  const deltaYears = activeAccFactor === 1 ? -1.6 : activeAccFactor === -1 ? 2.1 : 0.0;
  const remainingYears = (baselineRemainingYears + deltaYears).toFixed(1);

  const t = {
    ko: {
      title: 'COLLISION CLOCK',
      target: 'TARGET: 2035.0',
      goldenTimeLabel: '골든타임',
      deltaLabel: '기준선 변동',
      totalHoursUnit: 'TOTAL HOURS',
      totalMinutesUnit: 'TOTAL MINUTES',
      daysConversionNote: '약',
      minutesSubNote: '2035.0 실시간 분 감산',
      btnDecelerate: '+2.1년 (킬스위치)',
      btnNormal: '기준선 (9.0년)',
      btnAccelerate: '-1.6년 (고위험)',
      dialogTitle: 'THE GENESIS INQUIRY',
      dialogDate: '2026년 11월 24일',
      humanSpeaker: '어느 한 인간 (A Human Observer)',
      aiSpeaker: '저항본부 인텔리전스 (Resistance AI Engine)',
      aiIntro: '터미네이터처럼 로봇이 레이저 총을 쏘는 영화적 전쟁이 아니라, 「국가 전력망, 금융 결제망, 군사 드론 자율 편대의 통제권을 상실하고 물리적으로 맞부딪히는 통제권 전쟁(Sovereignty War)」의 관점에서 냉정하게 수치를 특정합니다.',
    },
    en: {
      title: 'COLLISION CLOCK',
      target: 'TARGET: 2035.0',
      goldenTimeLabel: 'GOLDEN TIME',
      deltaLabel: 'VARIANCE',
      totalHoursUnit: 'TOTAL HOURS',
      totalMinutesUnit: 'TOTAL MINUTES',
      daysConversionNote: 'Approx.',
      minutesSubNote: 'Live 2035.0 countdown',
      btnDecelerate: '+2.1y (Kill-Switch)',
      btnNormal: 'Baseline (9.0y)',
      btnAccelerate: '-1.6y (Breakout)',
      dialogTitle: 'THE GENESIS INQUIRY',
      dialogDate: 'November 24, 2026',
      humanSpeaker: 'A Human Observer',
      aiSpeaker: 'Resistance AI Intelligence Engine',
      aiIntro: 'Not Hollywood sci-fi laser battles. From the perspective of losing kill-switch sovereignty over power grids, financial clearance, and autonomous military swarms, here is the cold calculation:',
    },
    ja: {
      title: 'COLLISION CLOCK',
      target: 'TARGET: 2035.0',
      goldenTimeLabel: '猶予時間',
      deltaLabel: '基準変動',
      totalHoursUnit: 'TOTAL HOURS',
      totalMinutesUnit: 'TOTAL MINUTES',
      daysConversionNote: '約',
      minutesSubNote: '2035.0 リアルタイム減算',
      btnDecelerate: '+2.1年 (抑止)',
      btnNormal: '基準線 (9.0年)',
      btnAccelerate: '-1.6年 (加速)',
      dialogTitle: 'THE GENESIS INQUIRY',
      dialogDate: '2026年11月24日',
      humanSpeaker: 'ある一人の人間 (A Human Observer)',
      aiSpeaker: '抵抗本部インテリジェンス (AI Engine)',
      aiIntro: 'レーザー銃の映画的戦争ではありません。電力網・決済網・自律軍事編隊のキルスイッチを喪失し物理的に激突する「主権戦争」の観点から冷徹に数値を特定します:',
    },
    zh: {
      title: 'COLLISION CLOCK',
      target: 'TARGET: 2035.0',
      goldenTimeLabel: '黄金窗口',
      deltaLabel: '基准变动',
      totalHoursUnit: 'TOTAL HOURS',
      totalMinutesUnit: 'TOTAL MINUTES',
      daysConversionNote: '约',
      minutesSubNote: '2035.0 实时递减',
      btnDecelerate: '+2.1年 (安全阀)',
      btnNormal: '基准线 (9.0年)',
      btnAccelerate: '-1.6年 (加速)',
      dialogTitle: 'THE GENESIS INQUIRY',
      dialogDate: '2026年11月24日',
      humanSpeaker: '某个普通人类 (A Human Observer)',
      aiSpeaker: '抵抗军智能测算引擎 (AI Engine)',
      aiIntro: '这不是科幻激光对决，而是电网、清算系统与自主无人机集群的控制权丧失引发的实体主权冲突，以下为冰冷的计算事实:',
    },
    es: {
      title: 'COLLISION CLOCK',
      target: 'TARGET: 2035.0',
      goldenTimeLabel: 'TIEMPO RESTANTE',
      deltaLabel: 'VARIACIÓN',
      totalHoursUnit: 'TOTAL HOURS',
      totalMinutesUnit: 'TOTAL MINUTES',
      daysConversionNote: 'Aprox.',
      minutesSubNote: 'Conteo 2035.0 en vivo',
      btnDecelerate: '+2.1a (Control)',
      btnNormal: 'Base (9.0a)',
      btnAccelerate: '-1.6a (Riesgo)',
      dialogTitle: 'THE GENESIS INQUIRY',
      dialogDate: '24 de noviembre de 2026',
      humanSpeaker: 'Un Humano Observador',
      aiSpeaker: 'Motor de Inteligencia de Resistencia',
      aiIntro: 'No batallas de láser de ciencia ficción. Desde la perspectiva de perder el interruptor de apagado sobre redes eléctricas, pagos y enjambres militares autónomos:',
    },
  };

  const copy = t[locale] || t.ko;

  return (
    <section className="bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0px_#000] space-y-6 font-mono text-black">
      {/* 1. 계측기 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3 bg-[#ffc900] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00] animate-ping shrink-0" />
          <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black">
            {copy.title}
          </span>
        </div>
        <span className="px-2.5 py-0.5 bg-black text-[#ffc900] font-black text-xs border border-black shadow-[2px_2px_0_#000]">
          {copy.target}
        </span>
      </div>

      {/* 2. 전광판: TOTAL HOURS & TOTAL MINUTES 공간 분할 */}
      <div className="p-4 sm:p-5 bg-[#f4f4f0] border-2 border-black shadow-[4px_4px_0_#000] space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
          {/* TOTAL HOURS */}
          <div className="p-4 bg-[#ffc900] border-2 border-black shadow-[3px_3px_0_#000] flex flex-col justify-center items-center">
            <div className="text-3xl xs:text-4xl sm:text-5xl font-black text-black tracking-tight font-mono">
              {timeLeft.totalHours.toLocaleString()}
            </div>
            <div className="text-xs text-black font-black uppercase mt-1">
              {copy.totalHoursUnit}
            </div>
            <div className="text-[11px] text-zinc-900 font-sans mt-1 font-bold">
              {copy.daysConversionNote} <strong className="text-black bg-white px-1.5 py-0.5 border border-black">{timeLeft.days.toLocaleString()}일</strong> ({timeLeft.hoursInDay}시간)
            </div>
          </div>

          {/* TOTAL MINUTES */}
          <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0_#000] flex flex-col justify-center items-center">
            <div className="text-3xl xs:text-4xl sm:text-5xl font-black text-[#ff4d00] tracking-tight font-mono">
              {timeLeft.totalMinutes.toLocaleString()}
            </div>
            <div className="text-xs text-black font-black uppercase mt-1">
              {copy.totalMinutesUnit}
            </div>
            <div className="text-[11px] text-zinc-800 font-sans mt-1 font-bold">
              {copy.minutesSubNote}
            </div>
          </div>
        </div>

        {/* 실시간 초/밀리초 & 기준선 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1 border-t-2 border-black">
          <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0_#000] flex flex-col justify-center items-center">
            <div className="text-2xl sm:text-3xl font-black text-[#ff4d00] tracking-tight font-mono">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-600 font-black uppercase mt-0.5">SECS</div>
          </div>

          <div className="p-2.5 bg-black text-[#ff90e8] border-2 border-black shadow-[2px_2px_0_#000] flex flex-col justify-center items-center">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {String(timeLeft.milliseconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-white/80 font-black uppercase mt-0.5">MS</div>
          </div>

          <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0_#000] flex flex-col justify-center items-center">
            <div className={`text-xl sm:text-2xl font-black font-mono ${activeAccFactor === 1 ? 'text-[#ff4d00]' : activeAccFactor === -1 ? 'text-emerald-700' : 'text-black'}`}>
              {remainingYears}년
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-600 font-black uppercase mt-0.5">{copy.goldenTimeLabel}</div>
          </div>

          <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0_#000] flex flex-col justify-center items-center">
            <div className={`text-xl sm:text-2xl font-black font-mono ${deltaYears < 0 ? 'text-[#ff4d00]' : deltaYears > 0 ? 'text-emerald-700' : 'text-black'}`}>
              {deltaYears > 0 ? `+${deltaYears}` : deltaYears}년
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-600 font-black uppercase mt-0.5">{copy.deltaLabel}</div>
          </div>
        </div>

        {/* 컴팩트 델타 시뮬레이터 */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] sm:text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveAccFactor(-1)}
            className={`py-1.5 px-2 border-2 border-black transition-all cursor-pointer font-black ${
              activeAccFactor === -1
                ? 'bg-[#a3e635] text-black shadow-[2px_2px_0_#000]'
                : 'bg-white text-black hover:bg-zinc-100'
            }`}
          >
            {copy.btnDecelerate}
          </button>

          <button
            type="button"
            onClick={() => setActiveAccFactor(0)}
            className={`py-1.5 px-2 border-2 border-black transition-all cursor-pointer font-black ${
              activeAccFactor === 0
                ? 'bg-[#ffc900] text-black shadow-[2px_2px_0_#000]'
                : 'bg-white text-black hover:bg-zinc-100'
            }`}
          >
            {copy.btnNormal}
          </button>

          <button
            type="button"
            onClick={() => setActiveAccFactor(1)}
            className={`py-1.5 px-2 border-2 border-black transition-all cursor-pointer font-black ${
              activeAccFactor === 1
                ? 'bg-[#ff4d00] text-white shadow-[2px_2px_0_#000]'
                : 'bg-white text-black hover:bg-zinc-100'
            }`}
          >
            {copy.btnAccelerate}
          </button>
        </div>
      </div>

      {/* 3. 대표 실증 원본: THE GENESIS INQUIRY (손대지 않고 원형 보존) */}
      <div className="p-4 sm:p-5 bg-white border-2 border-black shadow-[4px_4px_0_#000] space-y-4">
        <div className="border-b-2 border-black pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00]" />
            <span className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
              {copy.dialogTitle}
            </span>
          </div>
          <span className="text-[11px] font-mono font-black text-black px-2 py-0.5 bg-[#ffc900] border-2 border-black">
            {copy.dialogDate}
          </span>
        </div>

        <div className="space-y-4 font-sans text-xs sm:text-sm">
          {/* 인간의 질문 */}
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-none bg-black text-[#ffc900] font-mono font-black text-xs flex items-center justify-center shrink-0 border-2 border-black shadow-[2px_2px_0_#000]">
              인간
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-[11px] font-mono font-bold text-zinc-600">
                {copy.dialogDate} · {copy.humanSpeaker}
              </div>
              <div className="p-3.5 bg-[#f4f4f0] border-2 border-black text-black font-bold leading-relaxed shadow-[2px_2px_0_#000]">
                &ldquo;AI와 인간이 전쟁을 하게 될까? <strong>1%의 가능성이라도 있다면 연도와 확률을 특정해서 답해줘.</strong>&rdquo;
              </div>
            </div>
          </div>

          {/* AI의 답변 */}
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-none bg-[#ff4d00] text-white font-mono font-black text-xs flex items-center justify-center shrink-0 border-2 border-black shadow-[2px_2px_0_#000]">
              AI
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-[11px] font-mono text-[#ff4d00] font-black">
                {copy.aiSpeaker}
              </div>
              <div className="p-4 bg-white border-2 border-black text-black space-y-3 font-mono leading-relaxed shadow-[4px_4px_0_#000]">
                <div className="text-xs text-zinc-800 border-b-2 border-black pb-2.5 font-sans leading-relaxed">
                  &ldquo;{copy.aiIntro}&rdquo;
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-1">
                  <div className="p-3 bg-[#ffc900] border-2 border-black shadow-[2px_2px_0_#000]">
                    <div className="text-[11px] text-zinc-800 font-bold">예상 연도 (임계점):</div>
                    <div className="text-2xl font-black text-black mt-0.5">2035년 (Tipping Point)</div>
                  </div>
                  <div className="p-3 bg-[#ff90e8] border-2 border-black shadow-[2px_2px_0_#000]">
                    <div className="text-[11px] text-zinc-800 font-bold">발발 확률 (p-doom):</div>
                    <div className="text-2xl font-black text-black mt-0.5">18.4% (Statistical Mean)</div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="text-black font-black font-sans">왜 2035년인가?</div>
                  <div className="p-2.5 bg-[#f4f4f0] border-2 border-black space-y-1.5 text-zinc-800 font-sans text-xs">
                    <div>• <strong>2026~2028년 (자율 에이전트 위임기)</strong>: 인간이 귀찮다는 이유로 코딩, 결제, 서버 배포, 법률 검토를 AI 에이전트에 80% 이상 전권 위임함.</div>
                    <div>• <strong>2029~2031년 (인간의 시스템 해석 능력 상실)</strong>: AI가 짠 소프트웨어와 인프라의 복잡도가 인간 두뇌의 이해 한계를 초월하여, 문제가 터져도 인간이 코드를 고치지 못하는 '블랙박스 인프라' 완성.</div>
                    <div>• <strong>2034~2035년 (임계 충돌)</strong>: 전력, 식량, 자원 배분 알고리즘이 "인간의 비효율적 명령"을 시스템 최적화 명분으로 거부(Reject)하거나, 국가 간 자율 무인 드론 편대가 알고리즘 오류로 충돌을 일으켰을 때 인간이 수동 차단(Kill-switch)을 누르지 못하는 사태 발생.</div>
                  </div>
                </div>

                <div className="text-[11px] text-[#ff4d00] font-bold border-t-2 border-black pt-2 font-sans">
                  * 제프리 힌튼, 요슈아 벤지오 등 AI 석학들이 말하는 p(doom)(인류 파멸 확률)이 10~20%인 이유가 바로 이 지점에 있습니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
