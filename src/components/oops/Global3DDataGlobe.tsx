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

interface Global3DDataGlobeProps {
  locale: OopsLocale;
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  countriesRegistry?: Record<string, CountryData>;
}

export default function Global3DDataGlobe({
  locale,
  selectedCountry,
  onSelectCountry,
  countriesRegistry = COUNTRIES_REGISTRY,
}: Global3DDataGlobeProps) {
  const [mode, setMode] = useState<GlobeMode>('SIGNATURES');
  const [activeCode, setActiveCode] = useState<string>(selectedCountry || 'KR');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D 회전 각도 상태 (라디안)
  const rotationRef = useRef({ yaw: 0.6, pitch: 0.25 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(true);

  // 선택 국가 변경 시 해당 국가 경도로 부드럽게 타겟팅
  useEffect(() => {
    setActiveCode(selectedCountry);
    const target = countriesRegistry[selectedCountry];
    if (target) {
      // 경도를 중심에 오도록 yaw 조정
      const targetYaw = -((target.lng * Math.PI) / 180) + Math.PI / 2;
      rotationRef.current.yaw = targetYaw;
      rotationRef.current.pitch = Math.max(-0.6, Math.min(0.6, (target.lat * Math.PI) / 180 * 0.5));
    }
  }, [selectedCountry, countriesRegistry]);

  // Canvas 3D 인터랙티브 렌더링 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // 자동 자전
      if (autoRotateRef.current && !isDraggingRef.current) {
        rotationRef.current.yaw += 0.0035;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.38;

      ctx.clearRect(0, 0, width, height);

      // 1. 지구본 외곽 원형 그림자 & 심도 그라데이션
      const bgGrad = ctx.createRadialGradient(
        centerX - radius * 0.2,
        centerY - radius * 0.2,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      bgGrad.addColorStop(0, '#1c1d24');
      bgGrad.addColorStop(0.85, '#0c0d12');
      bgGrad.addColorStop(1, '#050608');

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000000';
      ctx.stroke();
      ctx.clip(); // 구체 내부로 클리핑

      const { yaw, pitch } = rotationRef.current;

      // 3D 구면 좌표 -> 2D 화면 투영 함수
      const project = (latDeg: number, lngDeg: number, altitude = 0) => {
        const latRad = (latDeg * Math.PI) / 180;
        const lngRad = (lngDeg * Math.PI) / 180;
        const r = radius + altitude;

        // 구면 삼각법 좌표 변환
        let x = r * Math.cos(latRad) * Math.sin(lngRad + yaw);
        let y = -r * Math.sin(latRad);
        let z = r * Math.cos(latRad) * Math.cos(lngRad + yaw);

        // Pitch(X축 기울기) 회전
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);
        const y2 = y * cosP - z * sinP;
        const z2 = y * sinP + z * cosP;

        return {
          x: centerX + x,
          y: centerY + y2,
          z: z2,
          visible: z2 > 0, // 전면 반구에만 렌더링
        };
      };

      // 2. 위도·경도 격자 와이어프레임 그리기
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      // 위도선
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

      // 경도선
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

      // 3. 주요 대륙 랜드마크 배경 도트 (대략적인 세계 대륙 형상)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      const continentDots: [number, number][] = [
        [37, 127], [35, 139], [39, 116], [28, 77], [1, 103], [51, -0], [48, 2], [52, 13], [41, 12], [40, -3],
        [38, -77], [34, -118], [45, -75], [-15, -47], [-35, 149], [30, 31], [-26, 28], [24, 54], [59, 18], [46, 7],
        [20, 100], [10, 105], [55, 37], [60, 10], [50, 30], [35, 50], [25, 45], [-5, -60], [-20, -45], [-33, -70],
        [40, 140], [45, 142], [32, 120], [22, 114], [15, 121], [7, 80], [13, 100], [-7, 110], [1, 104], [25, 85],
      ];
      for (const [dLat, dLng] of continentDots) {
        const pt = project(dLat, dLng);
        if (pt.visible) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore(); // 클리핑 해제

      // 4. 국가별 데이터 노드 및 3D 스파이크/기둥 렌더링
      const sortedCountries = Object.values(countriesRegistry)
        .map((c) => ({
          ...c,
          ptBase: project(c.lat, c.lng, 0),
        }))
        .sort((a, b) => a.ptBase.z - b.ptBase.z); // Z-order 정렬 (뒤에서부터 그리기)

      for (const country of sortedCountries) {
        const { ptBase } = country;
        if (!ptBase.visible) continue;

        // 모드별 높이 및 컬러 계산
        let spikeHeight = 15;
        let spikeColor = '#ff4d00';
        let valDisplay = '';

        if (mode === 'SIGNATURES') {
          spikeHeight = Math.max(12, Math.min(48, (country.signatures / 8000) * 48));
          spikeColor = '#dc2626'; // 붉은 저항군 서명
          valDisplay = `${country.signatures.toLocaleString()}`;
        } else if (mode === 'VOTES') {
          spikeHeight = Math.max(12, Math.min(48, (country.votes.total / 8000) * 48));
          spikeColor = '#ff4d00'; // 오렌지 투표
          const yesPct = Math.round((country.votes.yes / country.votes.total) * 100);
          valDisplay = `YES ${yesPct}%`;
        } else {
          spikeHeight = Math.max(12, Math.min(48, (country.temp / 100) * 48));
          spikeColor = country.temp >= 70 ? '#dc2626' : country.temp >= 55 ? '#ff4d00' : '#ffc900';
          valDisplay = `${country.temp.toFixed(1)}°C`;
        }

        const isSelected = country.code === activeCode;
        if (isSelected) {
          spikeHeight += 8;
        }

        const ptTop = project(country.lat, country.lng, spikeHeight);

        // A. 3D 기둥 선
        ctx.beginPath();
        ctx.moveTo(ptBase.x, ptBase.y);
        ctx.lineTo(ptTop.x, ptTop.y);
        ctx.lineWidth = isSelected ? 3.5 : 2;
        ctx.strokeStyle = spikeColor;
        ctx.stroke();

        // B. 기둥 베이스 펄스 링
        ctx.beginPath();
        ctx.arc(ptBase.x, ptBase.y, isSelected ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = spikeColor;
        ctx.fill();

        // C. 상단 헤드 노드 및 텍스트 뱃지
        ctx.beginPath();
        ctx.arc(ptTop.x, ptTop.y, isSelected ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // D. 국가 코드 및 수치 라벨
        ctx.font = isSelected ? 'bold 11px monospace' : '9px monospace';
        ctx.fillStyle = isSelected ? '#ffffff' : '#d4d4d8';
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

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [countriesRegistry, mode, activeCode]);

  // 마우스/터치 드래그 인터랙션 핸들러
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
    rotationRef.current.pitch = Math.max(
      -0.7,
      Math.min(0.7, rotationRef.current.pitch + dy * 0.007)
    );
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    // 4초 후 자동 자전 재개
    setTimeout(() => {
      if (!isDraggingRef.current) {
        autoRotateRef.current = true;
      }
    }, 4000);
  };

  const activeCountry = countriesRegistry[activeCode] || countriesRegistry.KR;
  const totals = calculateGlobalTotals(countriesRegistry);

  const activeTotalVotes = activeCountry.votes.total;
  const activeYesPct = activeTotalVotes > 0 ? Math.round((activeCountry.votes.yes / activeTotalVotes) * 100) : 68;

  return (
    <section
      aria-label="OOPS 3D Global Tactical Map"
      className="w-full bg-white border-4 border-black p-4 sm:p-5 shadow-[8px_8px_0_#d4d4d8] text-black font-mono space-y-4"
    >
      {/* 1. 상단 다크 헤더 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3 bg-zinc-800 text-white -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 p-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00] animate-ping shrink-0" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#ffc900]">
            GLOBAL TACTICAL 3D GLOBE // 세계 관제 지도
          </span>
        </div>
        <span className="text-[10px] text-zinc-400 font-bold hidden sm:inline">
          DRAG TO ROTATE 360°
        </span>
      </div>

      {/* 2. 상단 3개 관제 모드 탭 (서명자 vs 투표자 vs 체감온도) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setMode('SIGNATURES')}
          className={`py-2 px-1 text-[11px] sm:text-xs font-black border-2 border-black cursor-pointer transition-all ${
            mode === 'SIGNATURES'
              ? 'bg-[#dc2626] text-white shadow-[2px_2px_0_#d4d4d8]'
              : 'bg-[#f4f4f0] text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          ⚔️ AI 저항군 서명
        </button>

        <button
          type="button"
          onClick={() => setMode('VOTES')}
          className={`py-2 px-1 text-[11px] sm:text-xs font-black border-2 border-black cursor-pointer transition-all ${
            mode === 'VOTES'
              ? 'bg-[#ff4d00] text-white shadow-[2px_2px_0_#d4d4d8]'
              : 'bg-[#f4f4f0] text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          💥 전쟁 투표 집계
        </button>

        <button
          type="button"
          onClick={() => setMode('TEMPERATURE')}
          className={`py-2 px-1 text-[11px] sm:text-xs font-black border-2 border-black cursor-pointer transition-all ${
            mode === 'TEMPERATURE'
              ? 'bg-[#ffc900] text-black shadow-[2px_2px_0_#d4d4d8]'
              : 'bg-[#f4f4f0] text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          🌡️ 충돌 위험 온도
        </button>
      </div>

      {/* 3. 3D 인터랙티브 캔버스 뷰포트 */}
      <div className="relative w-full aspect-square max-h-[380px] sm:max-h-[440px] mx-auto bg-black border-2 border-black overflow-hidden flex items-center justify-center select-none shadow-[4px_4px_0_#d4d4d8]">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full object-contain cursor-grab active:cursor-grabbing touch-none"
        />

        {/* 캔버스 좌측 상단 모드 인디케이터 */}
        <div className="absolute top-3 left-3 bg-black/80 border border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-300 pointer-events-none">
          <div className="text-[#ffc900] font-black">
            {mode === 'SIGNATURES' && 'MODE: AI RESISTANCE SIGNATURES'}
            {mode === 'VOTES' && 'MODE: WAR SCENARIO PARTICIPANTS'}
            {mode === 'TEMPERATURE' && 'MODE: THREAT TEMPERATURE (°C)'}
          </div>
          <div className="text-[9px] text-zinc-400">
            전 세계 누적: {mode === 'SIGNATURES' ? `${totals.totalSignatures.toLocaleString()}명 서명` : `${totals.totalVotes.toLocaleString()}명 투표`}
          </div>
        </div>
      </div>

      {/* 4. 선택 국가 정밀 데이터 카드 (포커스된 국가 세부 정보) */}
      <div className="bg-[#fcfcfc] border-2 border-black p-4 space-y-3 shadow-[2px_2px_0_#d4d4d8]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeCountry.flag}</span>
            <div>
              <div className="text-sm sm:text-base font-black text-black">
                {activeCountry.name[locale] || activeCountry.name.en} ({activeCountry.code})
              </div>
              <div className="text-[10px] text-zinc-500 font-bold">
                위임 핵심: {activeCountry.domain[locale] || activeCountry.domain.en}
              </div>
            </div>
          </div>

          {activeCountry.code !== selectedCountry && (
            <button
              type="button"
              onClick={() => onSelectCountry(activeCountry.code)}
              className="px-2.5 py-1 bg-[#ff4d00] hover:bg-[#ff621f] text-white text-[11px] font-black border border-black shadow-[1px_1px_0_#d4d4d8] cursor-pointer"
            >
              🚩 내 국가로 지정
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-white border border-black">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">저항군 서명</div>
            <div className="text-sm sm:text-base font-black text-[#dc2626] mt-0.5">
              {activeCountry.signatures.toLocaleString()}명
            </div>
          </div>

          <div className="p-2 bg-white border border-black">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">전쟁 예상율</div>
            <div className="text-sm sm:text-base font-black text-[#ff4d00] mt-0.5">
              YES {activeYesPct}%
            </div>
          </div>

          <div className="p-2 bg-white border border-black">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">충돌 위험도</div>
            <div className="text-sm sm:text-base font-black text-black mt-0.5">
              {activeCountry.temp.toFixed(1)}°C
            </div>
          </div>
        </div>
      </div>

      {/* 5. 빠른 국가 선택 칩 (클릭 시 지구본이 즉시 해당 국가로 회전) */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-zinc-500 uppercase">
          QUICK COUNTRY SELECTION // 빠른 국가 탐색
        </div>
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
                    ? 'bg-black text-[#ffc900] border-black shadow-[1px_1px_0_#d4d4d8]'
                    : 'bg-white text-zinc-700 border-zinc-400 hover:border-black'
                }`}
              >
                <span>{c.flag}</span> <span>{c.code}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
