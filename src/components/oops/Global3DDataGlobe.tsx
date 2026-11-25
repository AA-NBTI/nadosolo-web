'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import {
  COUNTRIES_REGISTRY,
  ORDERED_COUNTRY_CODES,
  calculateGlobalTotals,
  type CountryData,
} from '@/lib/oops/movementStore';

type GlobeMode = 'SIGNATURES' | 'VOTES' | 'TEMPERATURE';

const GLOBE_I18N: Record<
  OopsLocale,
  {
    title: string;
    tabSig: string;
    tabVote: string;
    tabTemp: string;
    sigLabel: string;
    voteLabel: string;
    tempLabel: string;
    selectBtn: string;
  }
> = {
  ko: {
    title: '글로벌 관제',
    tabSig: '서명',
    tabVote: '투표',
    tabTemp: '온도',
    sigLabel: '서명',
    voteLabel: '투표',
    tempLabel: '위험도',
    selectBtn: '선택',
  },
  en: {
    title: 'Global Map',
    tabSig: 'Signatures',
    tabVote: 'Votes',
    tabTemp: 'Temp',
    sigLabel: 'Signatures',
    voteLabel: 'Votes',
    tempLabel: 'Risk',
    selectBtn: 'Select',
  },
  ja: {
    title: '世界管制',
    tabSig: '署名',
    tabVote: '投票',
    tabTemp: '温度',
    sigLabel: '署名',
    voteLabel: '投票',
    tempLabel: '危険度',
    selectBtn: '選択',
  },
  zh: {
    title: '全球监控',
    tabSig: '签署',
    tabVote: '投票',
    tabTemp: '温度',
    sigLabel: '签署',
    voteLabel: '投票',
    tempLabel: '风险',
    selectBtn: '选择',
  },
  es: {
    title: 'Mapa Global',
    tabSig: 'Firmas',
    tabVote: 'Votos',
    tabTemp: 'Temp',
    sigLabel: 'Firmas',
    voteLabel: 'Votos',
    tempLabel: 'Riesgo',
    selectBtn: 'Elegir',
  },
};

// 실제 세계 대륙 위경도 폴리곤 좌표 [lat, lng] (구면 3D 지도 렌더링용)
const WORLD_CONTINENTS: [number, number][][] = [
  // 북아메리카
  [
    [70, -162], [71, -135], [68, -110], [63, -95], [58, -94], [52, -80], [60, -78], [62, -65],
    [52, -55], [45, -66], [41, -70], [35, -75], [25, -80], [29, -85], [29, -95], [20, -96],
    [21, -87], [15, -83], [8, -78], [8, -83], [14, -92], [20, -105], [32, -117], [38, -123],
    [48, -125], [58, -137], [60, -150], [55, -162], [65, -168],
  ],
  // 남아메리카
  [
    [11, -74], [10, -62], [5, -52], [0, -49], [-5, -35], [-13, -38], [-23, -42], [-34, -53],
    [-42, -64], [-55, -67], [-53, -73], [-42, -74], [-30, -72], [-18, -70], [-12, -77], [-5, -81],
    [2, -79], [8, -77],
  ],
  // 그린란드
  [
    [82, -32], [78, -18], [70, -22], [60, -44], [68, -53], [77, -70], [82, -50],
  ],
  // 유럽 + 아시아 + 아라비아 (유라시아)
  [
    [36, -9], [43, -9], [43, -2], [48, -5], [51, 2], [54, 8], [58, 5], [64, 10], [70, 20], [71, 28],
    [68, 42], [70, 60], [74, 85], [76, 105], [72, 130], [70, 160], [66, 178], [60, 165], [52, 156],
    [55, 138], [46, 135], [41, 129], [38, 128], [35, 129], [35, 126], [38, 124], [40, 121], [35, 120],
    [31, 122], [22, 114], [20, 106], [12, 109], [8, 105], [13, 100], [2, 103], [8, 98], [16, 96],
    [22, 91], [16, 80], [8, 77], [20, 72], [25, 67], [25, 58], [22, 59], [13, 44], [22, 39], [30, 33],
    [32, 35], [36, 36], [37, 27], [41, 29], [40, 23], [37, 22], [40, 19], [45, 13], [40, 18], [38, 15],
    [44, 9], [41, 2], [36, -5],
  ],
  // 아프리카
  [
    [36, -6], [37, 10], [32, 15], [31, 32], [22, 37], [12, 44], [11, 51], [2, 45], [-5, 39],
    [-15, 40], [-26, 33], [-34, 25], [-34, 18], [-22, 14], [-10, 13], [0, 9], [5, 2], [4, -8],
    [10, -15], [16, -16], [26, -14],
  ],
  // 호주
  [
    [-12, 131], [-12, 136], [-15, 136], [-11, 142], [-18, 146], [-26, 153], [-37, 150], [-38, 141],
    [-33, 134], [-35, 117], [-22, 114], [-16, 123],
  ],
  // 영국
  [
    [58, -5], [57, -2], [53, 0], [51, 1], [50, -5], [54, -4],
  ],
  // 일본
  [
    [45, 142], [42, 145], [38, 141], [35, 140], [34, 135], [31, 130], [34, 131], [37, 137], [41, 140],
  ],
  // 마다가스카르
  [
    [-12, 49], [-16, 50], [-25, 47], [-24, 44], [-16, 45],
  ],
  // 인도네시아/보르네오/뉴기니 주요 윤곽
  [
    [5, 95], [-6, 105], [-8, 115], [-6, 107], [2, 98],
  ],
  [
    [6, 116], [2, 118], [-3, 116], [-3, 110], [2, 109],
  ],
];

interface Global3DDataGlobeProps {
  locale: OopsLocale;
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  countriesRegistry?: Record<string, CountryData>;
  initialMode?: GlobeMode;
}

export default function Global3DDataGlobe({
  locale,
  selectedCountry,
  onSelectCountry,
  countriesRegistry = COUNTRIES_REGISTRY,
  initialMode = 'SIGNATURES',
}: Global3DDataGlobeProps) {
  const [mode, setMode] = useState<GlobeMode>(initialMode);
  const [activeCode, setActiveCode] = useState<string>(selectedCountry || 'KR');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rotationRef = useRef({ yaw: 0.6, pitch: 0.25 });
  const zoomRef = useRef(1.0);
  const [zoomLabel, setZoomLabel] = useState('1.0x');
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(true);

  const applyZoom = (next: number) => {
    const clamped = Math.max(0.7, Math.min(2.4, Number(next.toFixed(2))));
    zoomRef.current = clamped;
    setZoomLabel(`${clamped.toFixed(1)}x`);
  };

  const t = GLOBE_I18N[locale] || GLOBE_I18N.ko;

  useEffect(() => {
    setActiveCode(selectedCountry);
    const target = countriesRegistry[selectedCountry];
    if (target) {
      const targetYaw = -((target.lng * Math.PI) / 180) + Math.PI / 2;
      rotationRef.current.yaw = targetYaw;
      rotationRef.current.pitch = Math.max(-0.6, Math.min(0.6, ((target.lat * Math.PI) / 180) * 0.5));
    }
  }, [selectedCountry, countriesRegistry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      if (autoRotateRef.current && !isDraggingRef.current) {
        rotationRef.current.yaw += 0.003;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.39 * zoomRef.current;

      ctx.clearRect(0, 0, width, height);

      // 바다(지구본 바탕) 그라데이션
      const bgGrad = ctx.createRadialGradient(
        centerX - radius * 0.25,
        centerY - radius * 0.25,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      bgGrad.addColorStop(0, '#182232');
      bgGrad.addColorStop(0.75, '#0b1019');
      bgGrad.addColorStop(1, '#04060a');

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#334155';
      ctx.stroke();
      ctx.clip();

      const { yaw, pitch } = rotationRef.current;

      const project = (latDeg: number, lngDeg: number, altitude = 0) => {
        const latRad = (latDeg * Math.PI) / 180;
        const lngRad = (lngDeg * Math.PI) / 180;
        const r = radius + altitude;

        const x = r * Math.cos(latRad) * Math.sin(lngRad + yaw);
        const y = -r * Math.sin(latRad);
        const z = r * Math.cos(latRad) * Math.cos(lngRad + yaw);

        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);
        const y2 = y * cosP - z * sinP;
        const z2 = y * sinP + z * cosP;

        return {
          x: centerX + x,
          y: centerY + y2,
          z: z2,
          visible: z2 > 0,
        };
      };

      // 위도·경도 격자
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 0.8;

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lng = 0; lng <= 360; lng += 10) {
          const pt = project(lat, lng);
          if (pt.visible) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      for (let lng = 0; lng < 360; lng += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -80; lat <= 80; lat += 10) {
          const pt = project(lat, lng);
          if (pt.visible) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // 실제 세계 대륙 폴리곤(해안선 + 채우기) 렌더링
      for (const poly of WORLD_CONTINENTS) {
        // 구면 뒷면으로 넘어가는 점은 구 테두리(limb)로 투영해 폴리곤이 찢어지지 않게 보정
        const projectedPts = poly.map(([lat, lng]) => {
          const pt = project(lat, lng);
          if (pt.z >= 0) return pt;
          // 뒷면 점은 중심에서 바깥쪽 테두리 방향으로 투영
          const dx = pt.x - centerX;
          const dy = pt.y - centerY;
          const len = Math.hypot(dx, dy) || 1;
          return {
            x: centerX + (dx / len) * radius,
            y: centerY + (dy / len) * radius,
            z: pt.z,
            visible: false,
          };
        });

        const hasFront = projectedPts.some((p) => p.visible);
        if (!hasFront) continue;

        ctx.beginPath();
        projectedPts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();

        ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.stroke();
      }

      ctx.restore();

      // 국가 데이터 노드 및 3D 스파이크
      const sortedCountries = Object.values(countriesRegistry)
        .map((c) => ({
          ...c,
          ptBase: project(c.lat, c.lng, 0),
        }))
        .sort((a, b) => a.ptBase.z - b.ptBase.z);

      for (const country of sortedCountries) {
        const { ptBase } = country;
        if (!ptBase.visible) continue;

        let spikeHeight = 10;
        let spikeColor = '#ff4d00';
        let valDisplay = '';

        if (mode === 'SIGNATURES') {
          spikeHeight = country.signatures > 0 ? Math.max(14, Math.min(48, (country.signatures / 100) * 48)) : 10;
          spikeColor = '#dc2626';
          valDisplay = `${country.signatures.toLocaleString()}`;
        } else if (mode === 'VOTES') {
          spikeHeight = country.votes.total > 0 ? Math.max(14, Math.min(48, (country.votes.total / 100) * 48)) : 10;
          spikeColor = '#ff4d00';
          const yesPct = country.votes.total > 0 ? Math.round((country.votes.yes / country.votes.total) * 100) : 0;
          valDisplay = `${yesPct}%`;
        } else {
          spikeHeight = Math.max(12, Math.min(48, (country.temp / 100) * 48));
          spikeColor = country.temp >= 70 ? '#dc2626' : country.temp >= 55 ? '#ff4d00' : '#ffc900';
          valDisplay = `${country.temp.toFixed(1)}°`;
        }

        const isSelected = country.code === activeCode;
        if (isSelected) spikeHeight += 8;

        const ptTop = project(country.lat, country.lng, spikeHeight);

        ctx.beginPath();
        ctx.moveTo(ptBase.x, ptBase.y);
        ctx.lineTo(ptTop.x, ptTop.y);
        ctx.lineWidth = isSelected ? 3.5 : 2;
        ctx.strokeStyle = spikeColor;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ptBase.x, ptBase.y, isSelected ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = spikeColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ptTop.x, ptTop.y, isSelected ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = isSelected ? 'bold 11px monospace' : '9px monospace';
        ctx.fillStyle = isSelected ? '#ffffff' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(`${country.flag} ${country.code}`, ptTop.x, ptTop.y - 6);

        if (isSelected) {
          ctx.fillStyle = '#ffc900';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(valDisplay, ptTop.x, ptTop.y + 14);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [countriesRegistry, mode, activeCode]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    autoRotateRef.current = false;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.yaw += dx * 0.007;
    rotationRef.current.pitch = Math.max(-0.7, Math.min(0.7, rotationRef.current.pitch + dy * 0.007));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      if (!isDraggingRef.current) {
        autoRotateRef.current = true;
      }
    }, 4000);
  };

  const activeCountry = countriesRegistry[activeCode] || countriesRegistry.KR;
  const totals = calculateGlobalTotals(countriesRegistry);
  const activeTotalVotes = activeCountry.votes.total;
  const activeYesPct = activeTotalVotes > 0 ? Math.round((activeCountry.votes.yes / activeTotalVotes) * 100) : 0;

  return (
    <section
      aria-label="Global Tactical Map"
      className="w-full bg-white border-4 border-black p-4 sm:p-5 shadow-[8px_8px_0_#d4d4d8] text-black font-mono space-y-4"
    >
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 bg-zinc-800 text-white -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 p-4">
        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#ffc900]">
          {t.title}
        </span>
        <span className="text-xs font-bold text-zinc-300">
          {mode === 'SIGNATURES'
            ? `${t.sigLabel} ${totals.totalSignatures.toLocaleString()}`
            : mode === 'VOTES'
              ? `${t.voteLabel} ${totals.totalVotes.toLocaleString()}`
              : `${totals.globalAvgTemp.toFixed(1)}°C`}
        </span>
      </div>

      {/* 3대 관제 모드 탭 */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setMode('SIGNATURES')}
          className={`py-2 text-xs font-black border-2 border-black cursor-pointer transition-all ${
            mode === 'SIGNATURES'
              ? 'bg-[#dc2626] text-white shadow-[2px_2px_0_#d4d4d8]'
              : 'bg-[#f4f4f0] text-zinc-800 hover:bg-zinc-200'
          }`}
        >
          {t.tabSig}
        </button>

        <button
          type="button"
          onClick={() => setMode('VOTES')}
          className={`py-2 text-xs font-black border-2 border-black cursor-pointer transition-all ${
            mode === 'VOTES'
              ? 'bg-[#ff4d00] text-white shadow-[2px_2px_0_#d4d4d8]'
              : 'bg-[#f4f4f0] text-zinc-800 hover:bg-zinc-200'
          }`}
        >
          {t.tabVote}
        </button>

        <button
          type="button"
          onClick={() => setMode('TEMPERATURE')}
          className={`py-2 text-xs font-black border-2 border-black cursor-pointer transition-all ${
            mode === 'TEMPERATURE'
              ? 'bg-[#ffc900] text-black shadow-[2px_2px_0_#d4d4d8]'
              : 'bg-[#f4f4f0] text-zinc-800 hover:bg-zinc-200'
          }`}
        >
          {t.tabTemp}
        </button>
      </div>

      {/* 3D 지구본 뷰포트 (드래그 회전 + 휠·버튼 확대/축소) */}
      <div className="relative w-full aspect-square max-h-[360px] sm:max-h-[420px] mx-auto bg-[#04060a] border-2 border-black overflow-hidden flex items-center justify-center select-none shadow-[4px_4px_0_#d4d4d8]">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={(e) => {
            e.preventDefault();
            applyZoom(zoomRef.current + (e.deltaY < 0 ? 0.15 : -0.15));
          }}
          className="w-full h-full object-contain cursor-grab active:cursor-grabbing touch-none"
        />

        {/* 우측 하단 확대/축소 컨트롤 */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/80 border border-white/25 p-1">
          <button
            type="button"
            onClick={() => applyZoom(zoomRef.current + 0.25)}
            className="w-7 h-7 bg-zinc-900 hover:bg-zinc-700 text-white font-black text-sm border border-zinc-600 cursor-pointer"
            aria-label="확대"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoom(zoomRef.current - 0.25)}
            className="w-7 h-7 bg-zinc-900 hover:bg-zinc-700 text-white font-black text-sm border border-zinc-600 cursor-pointer"
            aria-label="축소"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => applyZoom(1.0)}
            className="px-2 h-7 bg-zinc-900 hover:bg-zinc-700 text-[#ffc900] font-bold text-xs border border-zinc-600 cursor-pointer"
            aria-label="초기화"
          >
            {zoomLabel}
          </button>
        </div>
      </div>

      {/* 선택 국가 정밀 데이터 카드 */}
      <div className="bg-[#fcfcfc] border-2 border-black p-4 space-y-3 shadow-[2px_2px_0_#d4d4d8]">
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeCountry.flag}</span>
            <span className="text-sm sm:text-base font-black text-black">
              {activeCountry.name[locale] || activeCountry.name.en}
            </span>
          </div>

          {activeCountry.code !== selectedCountry && (
            <button
              type="button"
              onClick={() => onSelectCountry(activeCountry.code)}
              className="px-3 py-1 bg-[#ff4d00] hover:bg-[#ff621f] text-white text-xs font-black border border-black cursor-pointer"
            >
              {t.selectBtn}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-white border border-black">
            <div className="text-zinc-500 font-bold">{t.sigLabel}</div>
            <div className="text-sm font-black text-[#dc2626] mt-0.5">
              {activeCountry.signatures.toLocaleString()}
            </div>
          </div>

          <div className="p-2 bg-white border border-black">
            <div className="text-zinc-500 font-bold">{t.voteLabel}</div>
            <div className="text-sm font-black text-[#ff4d00] mt-0.5">
              {activeYesPct}%
            </div>
          </div>

          <div className="p-2 bg-white border border-black">
            <div className="text-zinc-500 font-bold">{t.tempLabel}</div>
            <div className="text-sm font-black text-black mt-0.5">
              {activeCountry.temp.toFixed(1)}°C
            </div>
          </div>
        </div>
      </div>

      {/* 국가 칩 */}
      <div className="flex flex-wrap gap-1.5">
        {ORDERED_COUNTRY_CODES.map((code) => {
          const c = countriesRegistry[code];
          if (!c) return null;
          const isCur = c.code === activeCode;
          return (
            <button
              key={code}
              type="button"
              onClick={() => {
                setActiveCode(code);
                onSelectCountry(code);
              }}
              className={`px-2 py-1 text-xs font-mono font-black border cursor-pointer transition-all ${
                isCur
                  ? 'bg-black text-[#ffc900] border-black'
                  : 'bg-white text-zinc-700 border-zinc-400 hover:border-black'
              }`}
            >
              {c.flag} {c.code}
            </button>
          );
        })}
      </div>
    </section>
  );
}
