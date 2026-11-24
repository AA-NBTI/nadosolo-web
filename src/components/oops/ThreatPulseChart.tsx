'use client';

import React, { useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import { OBSERVATORY_I18N } from '@/lib/oops/observatoryI18n';

interface ThreatPulseChartProps {
  initialThemeId?: string;
  isEmbed?: boolean;
  locale?: OopsLocale;
}

interface RegionSnapshot {
  code: string;
  name: Record<OopsLocale, string>;
  temp: number;
  delta24h: number;
  delegationRate: number;
  caseCount: number;
  yearsToTipping: number;
  domain: Record<OopsLocale, string>;
}

const REGION_CODES = ['GLOBAL', 'KR', 'US', 'EU', 'JP', 'AF', 'SA'] as const;
type RegionCode = (typeof REGION_CODES)[number];

const YEAR_DATA: Record<number, Record<RegionCode, RegionSnapshot>> = {
  2024: {
    GLOBAL: {
      code: 'GLOBAL',
      name: { ko: '전 지구 평균', en: 'Global Average', ja: '全地球平均', zh: '全球均值', es: 'Promedio Global' },
      temp: 32.4, delta24h: 0.4, delegationRate: 34, caseCount: 410, yearsToTipping: 11.0,
      domain: { ko: '초기 생성형 AI 텍스트/검색', en: 'Early GenAI Text & Search', ja: '初期生成AI検索', zh: '早期生成式AI', es: 'IA Generativa Temprana' },
    },
    KR: {
      code: 'KR',
      name: { ko: '대한민국', en: 'South Korea', ja: '韓国', zh: '韩国', es: 'Corea del Sur' },
      temp: 36.2, delta24h: 0.6, delegationRate: 41, caseCount: 84, yearsToTipping: 10.6,
      domain: { ko: '문서 요약 · 코드 어시스트', en: 'Doc Summary · Code Assist', ja: '文書要約・コード補助', zh: '文档摘要与编码辅助', es: 'Resumen y Código' },
    },
    US: {
      code: 'US',
      name: { ko: '미국', en: 'United States', ja: '米国', zh: '美国', es: 'EE.UU.' },
      temp: 48.5, delta24h: 1.1, delegationRate: 52, caseCount: 192, yearsToTipping: 9.8,
      domain: { ko: '실리콘밸리 SaaS · 검색엔진', en: 'Silicon Valley SaaS · Search', ja: 'シリコンバレーSaaS', zh: '硅谷SaaS与搜索', es: 'SaaS y Búsqueda' },
    },
    EU: {
      code: 'EU',
      name: { ko: '유럽연합', en: 'European Union', ja: '欧州連合', zh: '欧盟', es: 'Unión Europea' },
      temp: 42.0, delta24h: 0.5, delegationRate: 38, caseCount: 68, yearsToTipping: 10.4,
      domain: { ko: '법률 · 행정 규제 검토', en: 'Legal · Regulatory Review', ja: '法務・規制審査', zh: '法律与合规审查', es: 'Revisión Legal' },
    },
    JP: {
      code: 'JP',
      name: { ko: '일본', en: 'Japan', ja: '日本', zh: '日本', es: 'Japón' },
      temp: 28.4, delta24h: 0.2, delegationRate: 25, caseCount: 31, yearsToTipping: 11.5,
      domain: { ko: '제조 · 레거시 오피스', en: 'Manufacturing · Office', ja: '製造・オフィス', zh: '制造与传统办公', es: 'Manufactura' },
    },
    AF: {
      code: 'AF',
      name: { ko: '아프리카', en: 'Africa', ja: 'アフリカ', zh: '非洲', es: 'África' },
      temp: 8.5, delta24h: 0.1, delegationRate: 9, caseCount: 12, yearsToTipping: 14.2,
      domain: { ko: '인프라 미보급 (무풍지대)', en: 'Low Infra Exposure', ja: 'インフラ未普及', zh: '基础设施未普及', es: 'Baja Exposición' },
    },
    SA: {
      code: 'SA',
      name: { ko: '남미', en: 'South America', ja: '南米', zh: '南美', es: 'Sudamérica' },
      temp: 14.2, delta24h: 0.2, delegationRate: 15, caseCount: 23, yearsToTipping: 13.0,
      domain: { ko: '고객지원 챗봇 자동화', en: 'Support Chatbot Automation', ja: 'サポートBot自動化', zh: '客服机器人自动化', es: 'Chatbots de Soporte' },
    },
  },
  2026: {
    GLOBAL: {
      code: 'GLOBAL',
      name: { ko: '전 지구 평균', en: 'Global Average', ja: '全地球平均', zh: '全球均值', es: 'Promedio Global' },
      temp: 74.2, delta24h: 1.4, delegationRate: 78, caseCount: 1420, yearsToTipping: 9.0,
      domain: { ko: '자율 코딩 · 금융결제 · 배포 위임', en: 'Auto-Coding · Finance · Deploy', ja: '自律開発・決済・配備委任', zh: '自主编程·金融·部署委任', es: 'Código · Finanzas · Despliegue' },
    },
    KR: {
      code: 'KR',
      name: { ko: '대한민국', en: 'South Korea', ja: '韓国', zh: '韩国', es: 'Corea del Sur' },
      temp: 74.2, delta24h: 1.2, delegationRate: 82, caseCount: 312, yearsToTipping: 8.8,
      domain: { ko: '금융 결제망 · 코딩 자동화', en: 'Payment Grid · Auto-Coding', ja: '決済網・開発自動化', zh: '金融支付网·编码自动化', es: 'Pagos · Código Automático' },
    },
    US: {
      code: 'US',
      name: { ko: '미국', en: 'United States', ja: '米国', zh: '美国', es: 'EE.UU.' },
      temp: 78.4, delta24h: 1.8, delegationRate: 86, caseCount: 584, yearsToTipping: 8.2,
      domain: { ko: '클라우드 인프라 · 자율 에이전트', en: 'Cloud Infra · Autonomous Agents', ja: 'クラウド・自律エージェント', zh: '云基础设施·自主智能体', es: 'Infraestructura Cloud' },
    },
    EU: {
      code: 'EU',
      name: { ko: '유럽연합', en: 'European Union', ja: '欧州連合', zh: '欧盟', es: 'Unión Europea' },
      temp: 71.0, delta24h: 0.9, delegationRate: 74, caseCount: 245, yearsToTipping: 9.3,
      domain: { ko: '행정 결재 · 에너지 배분망', en: 'Admin · Energy Grid', ja: '行政決済・エネルギー網', zh: '行政审批·能源网', es: 'Red Energética' },
    },
    JP: {
      code: 'JP',
      name: { ko: '일본', en: 'Japan', ja: '日本', zh: '日本', es: 'Japón' },
      temp: 59.5, delta24h: 0.7, delegationRate: 61, caseCount: 148, yearsToTipping: 10.1,
      domain: { ko: '물류 로보틱스 · 뱅킹', en: 'Logistics Robotics · Banking', ja: '物流ロボティクス・銀行', zh: '物流机器人·银行业', es: 'Robótica Logística' },
    },
    AF: {
      code: 'AF',
      name: { ko: '아프리카', en: 'Africa', ja: 'アフリカ', zh: '非洲', es: 'África' },
      temp: 28.6, delta24h: 0.5, delegationRate: 29, caseCount: 47, yearsToTipping: 11.8,
      domain: { ko: '모바일 소액결제 · 농업 데이터', en: 'Mobile Micro-pay · Agri-data', ja: 'モバイル決済・農業データ', zh: '移动支付·农业数据', es: 'Pagos Móviles' },
    },
    SA: {
      code: 'SA',
      name: { ko: '남미', en: 'South America', ja: '南米', zh: '南美', es: 'Sudamérica' },
      temp: 39.8, delta24h: 0.6, delegationRate: 44, caseCount: 84, yearsToTipping: 10.9,
      domain: { ko: '리테일 자동화 · 물류', en: 'Retail Automation · Logistics', ja: '小売自動化・物流', zh: '零售自动化·物流', es: 'Retail y Logística' },
    },
  },
  2030: {
    GLOBAL: {
      code: 'GLOBAL',
      name: { ko: '전 지구 평균', en: 'Global Average', ja: '全地球平均', zh: '全球均值', es: 'Promedio Global' },
      temp: 88.5, delta24h: 2.3, delegationRate: 91, caseCount: 4820, yearsToTipping: 5.0,
      domain: { ko: '해석 불가 블랙박스 인프라', en: 'Black-Box Infrastructure', ja: '解読不能ブラックボックス網', zh: '不可解释黑箱基础设施', es: 'Infraestructura Caja Negra' },
    },
    KR: {
      code: 'KR',
      name: { ko: '대한민국', en: 'South Korea', ja: '韓国', zh: '韩国', es: 'Corea del Sur' },
      temp: 88.6, delta24h: 2.1, delegationRate: 93, caseCount: 980, yearsToTipping: 4.8,
      domain: { ko: '국가 전력 · 스마트시티 자율 제어', en: 'Power Grid · Smart City', ja: '国家電力・都市自律制御', zh: '国家电网·智慧城市', es: 'Red Eléctrica' },
    },
    US: {
      code: 'US',
      name: { ko: '미국', en: 'United States', ja: '米国', zh: '美国', es: 'EE.UU.' },
      temp: 92.1, delta24h: 2.8, delegationRate: 95, caseCount: 1940, yearsToTipping: 4.1,
      domain: { ko: '국방 드론 편대 · 연방 결제망', en: 'Defense Swarms · Fed Clearance', ja: '国防編隊・連邦決済網', zh: '国防集群·联邦清算网', es: 'Enjambres de Defensa' },
    },
    EU: {
      code: 'EU',
      name: { ko: '유럽연합', en: 'European Union', ja: '欧州連合', zh: '欧盟', es: 'Unión Europea' },
      temp: 86.4, delta24h: 1.9, delegationRate: 89, caseCount: 840, yearsToTipping: 5.2,
      domain: { ko: '초국경 전력 · 식량 배분망', en: 'Cross-border Grid · Supply', ja: '広域電力・食料配分網', zh: '跨境电网·供应链', es: 'Red Transfronteriza' },
    },
    JP: {
      code: 'JP',
      name: { ko: '일본', en: 'Japan', ja: '日本', zh: '日本', es: 'Japón' },
      temp: 79.2, delta24h: 1.5, delegationRate: 83, caseCount: 510, yearsToTipping: 5.9,
      domain: { ko: '원전 · 철도 자동화 제어', en: 'Nuclear · Rail Auto-Control', ja: '原発・鉄道自動制御', zh: '核电·铁路自动控制', es: 'Control Ferroviario' },
    },
    AF: {
      code: 'AF',
      name: { ko: '아프리카', en: 'Africa', ja: 'アフリカ', zh: '非洲', es: 'África' },
      temp: 54.0, delta24h: 1.6, delegationRate: 58, caseCount: 240, yearsToTipping: 7.4,
      domain: { ko: '대규모 데이터센터 허브 집중', en: 'Mega Datacenter Hubs', ja: '巨大データセンター集中', zh: '超级算力中心集群', es: 'Centros de Datos' },
    },
    SA: {
      code: 'SA',
      name: { ko: '남미', en: 'South America', ja: '南米', zh: '南美', es: 'Sudamérica' },
      temp: 62.5, delta24h: 1.4, delegationRate: 67, caseCount: 310, yearsToTipping: 6.8,
      domain: { ko: '자원 채굴 · 수송망 자동화', en: 'Resource Mining · Transport', ja: '資源採掘・輸送網自動化', zh: '矿产开采·运输自动化', es: 'Minería y Transporte' },
    },
  },
  2035: {
    GLOBAL: {
      code: 'GLOBAL',
      name: { ko: '전 지구 평균', en: 'Global Average', ja: '全地球平均', zh: '全球均值', es: 'Promedio Global' },
      temp: 98.4, delta24h: 4.1, delegationRate: 98, caseCount: 12500, yearsToTipping: 0.0,
      domain: { ko: '임계 충돌선 (Kill-Switch 상실)', en: 'Tipping Point (Kill-Switch Lost)', ja: '臨界衝突線 (キルスイッチ喪失)', zh: '临界冲突线 (失控)', es: 'Punto Crítico 2035' },
    },
    KR: {
      code: 'KR',
      name: { ko: '대한민국', en: 'South Korea', ja: '韓国', zh: '韩国', es: 'Corea del Sur' },
      temp: 98.5, delta24h: 4.0, delegationRate: 99, caseCount: 2840, yearsToTipping: 0.0,
      domain: { ko: '전력 · 금융 · 국방 전권 위임', en: 'Full Grid · Finance · Defense', ja: '電力・金融・国防全権委任', zh: '电力·金融·国防全权委任', es: 'Control Total' },
    },
    US: {
      code: 'US',
      name: { ko: '미국', en: 'United States', ja: '米国', zh: '美国', es: 'EE.UU.' },
      temp: 99.8, delta24h: 4.5, delegationRate: 99, caseCount: 4920, yearsToTipping: 0.0,
      domain: { ko: '전역 자율 시스템 최적화 거부', en: 'System Rejects Human Command', ja: '人間命令の最適化拒否', zh: '系统拒绝人类低效指令', es: 'Rechazo de Comandos' },
    },
    EU: {
      code: 'EU',
      name: { ko: '유럽연합', en: 'European Union', ja: '欧州連合', zh: '欧盟', es: 'Unión Europea' },
      temp: 97.0, delta24h: 3.8, delegationRate: 97, caseCount: 2150, yearsToTipping: 0.0,
      domain: { ko: '초국경 인프라 수동 차단 불능', en: 'Manual Shutdown Impossible', ja: '手動遮断不能', zh: '无法手动紧急切断', es: 'Apagado Imposible' },
    },
    JP: {
      code: 'JP',
      name: { ko: '일본', en: 'Japan', ja: '日本', zh: '日本', es: 'Japón' },
      temp: 94.2, delta24h: 3.5, delegationRate: 96, caseCount: 1320, yearsToTipping: 0.0,
      domain: { ko: '자율 로보틱스 · 도시망 경직', en: 'Autonomous Grid Lock-in', ja: '自律網ロックイン', zh: '自主系统锁定', es: 'Bloqueo Autónomo' },
    },
    AF: {
      code: 'AF',
      name: { ko: '아프리카', en: 'Africa', ja: 'アフリカ', zh: '非洲', es: 'África' },
      temp: 82.0, delta24h: 3.2, delegationRate: 84, caseCount: 610, yearsToTipping: 0.4,
      domain: { ko: '글로벌 클라우드 연쇄 마비', en: 'Global Cloud Cascade', ja: 'グローバルクラウド連鎖麻痺', zh: '全球云网络连锁瘫痪', es: 'Cascada Cloud' },
    },
    SA: {
      code: 'SA',
      name: { ko: '남미', en: 'South America', ja: '南米', zh: '南美', es: 'Sudamérica' },
      temp: 87.5, delta24h: 3.4, delegationRate: 88, caseCount: 660, yearsToTipping: 0.2,
      domain: { ko: '식량 · 자원 배분 알고리즘 통제', en: 'Resource Allocation Lock', ja: '資源配分アルゴリズム統制', zh: '资源分配算法控制', es: 'Control de Recursos' },
    },
  },
};

function ThermometerGraphic({ temp }: { temp: number }) {
  const clamped = Math.max(6, Math.min(100, temp));
  const fillColor =
    temp >= 80
      ? '#dc2626'
      : temp >= 60
      ? '#ff4d00'
      : temp >= 30
      ? '#ffc900'
      : '#3b82f6';

  return (
    <div className="flex flex-col items-center justify-between select-none shrink-0 w-12 sm:w-14 py-1" aria-hidden="true">
      <span className="text-[9px] font-mono font-black text-zinc-500 leading-none mb-1">100°</span>
      <div className="relative flex flex-col items-center">
        <div className="w-5 h-24 sm:h-28 bg-white border-2 border-black rounded-t-full overflow-hidden relative flex items-end shadow-[2px_2px_0_#d4d4d8]">
          <div className="absolute inset-x-0 top-1/4 border-t border-black/25 z-10 pointer-events-none" />
          <div className="absolute inset-x-0 top-2/4 border-t border-black/25 z-10 pointer-events-none" />
          <div className="absolute inset-x-0 top-3/4 border-t border-black/25 z-10 pointer-events-none" />
          <div
            className="w-full transition-all duration-700 ease-out"
            style={{
              height: `${clamped}%`,
              backgroundColor: fillColor,
            }}
          />
        </div>
        <div
          className="w-9 h-9 -mt-2 rounded-full border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex items-center justify-center relative z-20 transition-colors duration-500"
          style={{ backgroundColor: fillColor }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/50 -translate-x-1 -translate-y-1" />
        </div>
      </div>
      <span className="text-[9px] font-mono font-black text-zinc-500 leading-none mt-1">0°</span>
    </div>
  );
}

export default function ThreatPulseChart({
  isEmbed = false,
  locale = 'ko',
}: ThreatPulseChartProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedRegions, setSelectedRegions] = useState<RegionCode[]>(['GLOBAL']);

  const yearDataset = YEAR_DATA[selectedYear] || YEAR_DATA[2026];

  const handleToggleRegion = (code: RegionCode) => {
    if (code === 'GLOBAL') {
      setSelectedRegions(['GLOBAL']);
      return;
    }

    setSelectedRegions((prev) => {
      const withoutGlobal = prev.filter((c) => c !== 'GLOBAL');
      if (withoutGlobal.includes(code)) {
        const next = withoutGlobal.filter((c) => c !== code);
        return next.length === 0 ? ['GLOBAL'] : next;
      }
      return [...withoutGlobal, code];
    });
  };

  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;

  return (
    <section className={`w-full bg-white border-4 border-black shadow-[8px_8px_0_#d4d4d8] text-black font-mono ${isEmbed ? 'p-4' : 'p-4 sm:p-6'} space-y-5`}>
      {/* 1. 계측기 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3 bg-[#ffc900] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#ff4d00] rounded-full animate-pulse shrink-0" />
          <span className="text-sm sm:text-base font-black tracking-wider text-black uppercase">
            {copy.barometerTitle}
          </span>
        </div>

        {/* 연도 선택 필터 (2024 / 2026 / 2030 / 2035) */}
        <div className="flex items-center gap-1">
          {[2024, 2026, 2030, 2035].map((y) => {
            const active = selectedYear === y;
            return (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y)}
                className={`px-2.5 py-1 text-xs font-mono font-black border-2 border-black cursor-pointer transition-all ${
                  active
                    ? 'bg-[#ff4d00] text-white shadow-[2px_2px_0_#d4d4d8]'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 국가/지역 단일·복수 선택 필터 콘솔 */}
      <div className="space-y-2 border-b-2 border-black pb-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600">
          <span>{copy.regionFilterLabel} ({selectedRegions.map((c) => c === 'GLOBAL' ? copy.globalChip : c).join(', ')})</span>
          <span>{copy.multiHint}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REGION_CODES.map((code) => {
            const active = selectedRegions.includes(code);
            const snap = yearDataset[code];
            const chipLabel = code === 'GLOBAL' ? copy.globalChip : code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleToggleRegion(code)}
                className={`px-2.5 py-1.5 text-xs font-mono font-black border-2 border-black cursor-pointer transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-zinc-800 text-[#ffc900] shadow-[2px_2px_0_#ff4d00]'
                    : 'bg-[#f4f4f0] text-black hover:bg-[#ffc900]/40'
                }`}
              >
                <span>{chipLabel}</span>
                <span className={`text-[11px] px-1 border border-black ${
                  active ? 'bg-[#ff4d00] text-white' : 'bg-white text-zinc-800'
                }`}>
                  {snap.temp.toFixed(1)}°
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 선택된 대상 집중 관제 뷰 (단일 또는 복수 대조) */}
      <div className={`grid gap-4 ${selectedRegions.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {selectedRegions.map((code) => {
          const snap = yearDataset[code];
          const regionName = snap.name[locale] || snap.name.en;
          const statusKey = snap.temp >= 80 ? 'CRITICAL' : snap.temp >= 60 ? 'HIGH' : snap.temp >= 30 ? 'MED' : 'LOW';
          const statusLabel = copy.statusLabels[statusKey];

          return (
            <div key={code} className="p-4 bg-[#f4f4f0] border-2 border-black shadow-[4px_4px_0_#d4d4d8] space-y-3.5">
              {/* 카드 상단: 국가명 & 온도 */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                <div>
                  <div className="text-[11px] text-zinc-600 font-bold">
                    {selectedYear} // {snap.code === 'GLOBAL' ? copy.globalChip : snap.code}
                  </div>
                  <div className="text-base sm:text-lg font-black text-black">{regionName}</div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-[#ff4d00]">+{snap.delta24h.toFixed(1)}°</span>
                    <span className={`text-2xl sm:text-3xl font-black px-2 py-0.5 border-2 border-black ${
                      snap.temp >= 80 ? 'bg-[#ff4d00] text-white' :
                      snap.temp >= 60 ? 'bg-[#ffc900] text-black' :
                      snap.temp >= 30 ? 'bg-[#a3e635] text-black' : 'bg-white text-black'
                    }`}>
                      {snap.temp.toFixed(1)}°C
                    </span>
                  </div>
                </div>
              </div>

              {/* 본체: 좌측 상징물 온도계 + 우측 게이지 및 산출 근거 */}
              <div className="flex items-center gap-4">
                <ThermometerGraphic temp={snap.temp} />

                <div className="flex-1 space-y-3 min-w-0">
                  {/* 게이지 */}
                  <div className="w-full h-3.5 bg-white border-2 border-black overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${
                        snap.temp >= 80 ? 'bg-[#dc2626]' :
                        snap.temp >= 60 ? 'bg-[#ff4d00]' :
                        snap.temp >= 30 ? 'bg-[#ffc900]' : 'bg-blue-400'
                      }`}
                      style={{ width: `${Math.min(100, snap.temp)}%` }}
                    />
                  </div>

                  {/* 산출 근거 지표 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">{copy.delegation}</div>
                      <div className="text-sm font-black text-black mt-0.5">{snap.delegationRate}%</div>
                    </div>
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">{copy.cases}</div>
                      <div className="text-sm font-black text-[#ff4d00] mt-0.5">{snap.caseCount.toLocaleString()}{copy.unitCases}</div>
                    </div>
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">{copy.tipping}</div>
                      <div className="text-sm font-black text-black mt-0.5">
                        {snap.yearsToTipping.toFixed(1)}{copy.yearUnit} <span className="text-[10px] text-zinc-500">[{statusLabel}]</span>
                      </div>
                    </div>
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">{copy.domain}</div>
                      <div className="text-xs font-bold text-black mt-0.5 truncate" title={snap.domain[locale] || snap.domain.en}>
                        {snap.domain[locale] || snap.domain.en}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
