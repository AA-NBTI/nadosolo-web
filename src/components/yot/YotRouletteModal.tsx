'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import YotRoulette from './YotRoulette';
import { YotSlotItem, SpinHistoryItem } from '@/lib/yot/yotTypes';
import { Clock, ArrowRight, RotateCw, Sparkles, X, UserPlus, Home, LayoutDashboard } from 'lucide-react';

interface YotRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  taffyCount: number;
  userEmail: string;
  isLoggedIn?: boolean;
}

export default function YotRouletteModal({
  isOpen,
  onClose,
  taffyCount,
  userEmail,
  isLoggedIn = false,
}: YotRouletteModalProps) {
  const router = useRouter();
  const [spinsLeft, setSpinsLeft] = useState<number>(taffyCount);
  const [spinHistory, setSpinHistory] = useState<SpinHistoryItem[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [targetSlot, setTargetSlot] = useState<YotSlotItem | null>(null);
  const [lastWonSlot, setLastWonSlot] = useState<YotSlotItem | null>(null);
  const [bonusNotice, setBonusNotice] = useState<string | null>(null);

  const [finalCoupon, setFinalCoupon] = useState<{
    code: string;
    amount: number;
    expiresAt: string;
  } | null>(null);

  if (!isOpen) return null;

  // 룰렛 스핀 시작
  const handleSpinStart = async () => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    setBonusNotice(null);
    setLastWonSlot(null);

    try {
      const isFinal = spinsLeft === 1;
      const res = await fetch('/api/yot/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: spinHistory,
          totalTaffy: taffyCount,
          userEmail: userEmail,
          isFinalSpin: isFinal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTargetSlot(data.slot);
        (window as any).__pendingModalSpinData = data;
      } else {
        alert('오류가 발생했습니다.');
        setIsSpinning(false);
      }
    } catch (e) {
      alert('통신 오류가 발생했습니다.');
      setIsSpinning(false);
    }
  };

  // 룰렛 회전 애니메이션 종료
  const handleSpinEnd = () => {
    setIsSpinning(false);
    const data = (window as any).__pendingModalSpinData;
    if (!data) return;

    const wonSlot = data.slot as YotSlotItem;
    setLastWonSlot(wonSlot);

    const nextHistory: SpinHistoryItem[] = [
      ...spinHistory,
      {
        spinIndex: spinHistory.length + 1,
        slotKey: wonSlot.key,
        amount: wonSlot.amount,
      },
    ];
    setSpinHistory(nextHistory);

    let currentLeft = spinsLeft - 1;
    if (data.bonusTaffyAwarded) {
      currentLeft += 1;
      setBonusNotice(data.bonusMessage || '엿장수 인심! 보너스 엿 1개 추가!');
    }
    setSpinsLeft(currentLeft);

    if (data.coupon) {
      setFinalCoupon({
        code: data.coupon.coupon_code,
        amount: data.coupon.discount_amount,
        expiresAt: data.coupon.expires_at,
      });

      try {
        localStorage.setItem(
          'yot_coupon',
          JSON.stringify({
            code: data.coupon.coupon_code,
            amount: data.coupon.discount_amount,
            expiresAt: data.coupon.expires_at,
          })
        );
      } catch (err) {}
    }
  };

  // 확실한 출구 이동 핸들러 (모달 닫고 즉시 라우트 이동)
  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in select-none overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0c0d12] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-center space-y-6 my-auto">
        
        {/* 상단 닫기 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 간결 헤더 (사족 설명 배제) */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <span className="text-white font-medium">룰렛</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif-editorial text-white font-normal">
            솔로엿장수 룰렛
          </h2>
        </div>

        {/* 대형 룰렛 본체 */}
        <div className="flex justify-center py-1">
          <YotRoulette
            isSpinning={isSpinning}
            targetSlotKey={targetSlot?.key || null}
            onSpinEnd={handleSpinEnd}
            size={360}
          />
        </div>

        {/* 룰렛 스핀 컨트롤 */}
        {!finalCoupon && (
          <div className="space-y-4">
            <div className="text-sm font-mono text-zinc-400">
              남은 엿: <span className="text-white font-bold">{spinsLeft}개</span>
            </div>

            {spinsLeft > 0 ? (
              <button
                type="button"
                onClick={handleSpinStart}
                disabled={isSpinning}
                className="px-8 py-3.5 rounded-xl bg-[#f04f74] text-white font-semibold text-base hover:bg-[#d63f63] transition-all shadow-[0_4px_20px_rgba(240,79,116,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {isSpinning ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>회전 중</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>룰렛 돌리기</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-sm font-mono text-zinc-400">
                스핀 완료
              </div>
            )}

            {/* 직전 당첨 결과 */}
            {lastWonSlot && (
              <div className="p-3 rounded-xl border border-white/10 bg-black/60 text-center max-w-xs mx-auto">
                <span className="text-sm font-bold text-white">
                  {lastWonSlot.key === 'BOOM' ? (
                    <span className="text-zinc-400">꽝</span>
                  ) : (
                    <span className="text-[#f04f74]">{lastWonSlot.label} 당첨</span>
                  )}
                </span>
              </div>
            )}

            {/* 엿장수 보너스 알림 */}
            {bonusNotice && (
              <div className="p-3 rounded-xl border border-[#f04f74]/40 bg-[#f04f74]/15 text-center max-w-sm mx-auto">
                <div className="text-xs text-[#f04f74] font-bold">보너스 엿 1개 추가</div>
              </div>
            )}
          </div>
        )}

        {/* 최종 바우처 발급 완료 & 간결한 3대 시스템 출구 버튼 (헌법 제4조) */}
        {finalCoupon && (
          <div className="mt-4 border-t border-white/10 pt-6 text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs font-mono text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-[#f04f74]" />
              <span>3일 유효</span>
            </div>

            <h3 className="text-2xl font-serif-editorial text-white">
              바우처 발급 완료
            </h3>

            <div className="p-3.5 rounded-xl bg-black border border-white/15 max-w-xs mx-auto font-mono text-sm flex items-center justify-between">
              <span className="text-zinc-400">코드:</span>
              <span className="text-white font-bold tracking-wider">{finalCoupon.code}</span>
            </div>

            {/* 3대 출구: 사족 없는 순수 시스템 버튼 (예약하기 / 회원가입 / 홈으로) */}
            <div className="flex flex-col gap-2.5 max-w-sm mx-auto pt-2">
              {/* 1. 메인: 예약하기 */}
              <button
                type="button"
                onClick={() => handleNavigate('/meetup')}
                className="w-full py-3.5 rounded-xl bg-[#f04f74] text-white font-semibold text-sm hover:bg-[#d63f63] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(240,79,116,0.4)] cursor-pointer"
              >
                <span>예약하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 2. 로그인 회원: 내 대시보드 / 비회원: 회원가입 */}
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => handleNavigate('/dashboard')}
                  className="w-full py-3 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-zinc-300" />
                  <span>내 대시보드</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleNavigate(
                      `/auth?coupon=${finalCoupon.code}&email=${encodeURIComponent(userEmail)}`
                    )
                  }
                  className="w-full py-3 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-zinc-300" />
                  <span>회원가입</span>
                </button>
              )}

              {/* 3. 홈으로 */}
              <button
                type="button"
                onClick={() => handleNavigate('/')}
                className="w-full py-2 text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>홈으로</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
