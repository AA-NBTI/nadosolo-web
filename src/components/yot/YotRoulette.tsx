'use client';

import React, { useRef, useEffect } from 'react';
import { YOT_SLOTS, YotSlotItem } from '@/lib/yot/yotTypes';

interface YotRouletteProps {
  isSpinning: boolean;
  targetSlotKey: string | null;
  onSpinEnd: () => void;
  size?: number; // 기본 대형 420px
}

export default function YotRoulette({
  isSpinning,
  targetSlotKey,
  onSpinEnd,
  size = 420,
}: YotRouletteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const numSlots = YOT_SLOTS.length; // 6
  const arcSize = (2 * Math.PI) / numSlots;

  // 룰렛 그리기 함수
  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    // 6개 슬롯 부채꼴 그리기
    YOT_SLOTS.forEach((slot, index) => {
      const angle = index * arcSize;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arcSize);
      ctx.closePath();

      ctx.fillStyle = slot.color;
      ctx.fill();

      // 슬롯 테두리 라인
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 슬롯 텍스트 렌더링
      ctx.save();
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = slot.textColor;
      
      const isJackpot = slot.key === '10000';
      ctx.font = isJackpot 
        ? 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      ctx.fillText(slot.label, radius - 28, 0);
      ctx.restore();
    });

    // 중앙 코어 핀 장식 (대형화)
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#090a0f';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f04f74';
    ctx.stroke();

    // 중앙 텍스트 "엿"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px serif';
    ctx.fillText('엿', 0, 1);

    ctx.restore();

    // 외곽 골드/다크 링
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // 외곽 LED 도트 장식 12개
    const dotCount = 12;
    for (let i = 0; i < dotCount; i++) {
      const dotAngle = (i * 2 * Math.PI) / dotCount + rotation * 0.5;
      const dotX = centerX + Math.cos(dotAngle) * (radius + 12);
      const dotY = centerY + Math.sin(dotAngle) * (radius + 12);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#f04f74' : '#ffffff';
      ctx.fill();
    }
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [size]);

  // 스핀 시작 및 감속 처리
  useEffect(() => {
    if (!isSpinning || !targetSlotKey) return;

    const targetIndex = YOT_SLOTS.findIndex((s) => s.key === targetSlotKey);
    if (targetIndex === -1) return;

    const slotCenter = targetIndex * arcSize + arcSize / 2;
    const targetOffset = -Math.PI / 2 - slotCenter;

    const totalSpins = 9 * Math.PI * 2;
    const startRotation = currentRotationRef.current;
    
    const normalizedStart = startRotation % (2 * Math.PI);
    const finalRotation = startRotation + totalSpins + (targetOffset - normalizedStart);

    const duration = 4500; // 4.5초 대형 회전
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic curve (부드러운 감속)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startRotation + (finalRotation - startRotation) * easeOut;

      currentRotationRef.current = current;
      drawWheel(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        onSpinEnd();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isSpinning, targetSlotKey]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* 상단 대형 타겟 인디케이터 바늘 */}
      <div className="absolute -top-4 z-20 flex flex-col items-center">
        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-[#f04f74] drop-shadow-[0_4px_14px_rgba(240,79,116,0.9)]" />
      </div>

      {/* 대형 룰렛 캔버스 */}
      <div className="relative p-3 rounded-full bg-[#0c0d12] border-2 border-white/20 shadow-[0_15px_50px_rgba(0,0,0,0.9)]">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-full max-w-full"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      </div>
    </div>
  );
}
