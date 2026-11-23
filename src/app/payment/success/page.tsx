'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useNadoSoloEngine } from '@/engine';
import { nadosoloBillingEngine } from '@/modules/billing';
import { trackAffiliatePurchase } from '@/lib/affiliateDb';
import { loadAttribution } from '@/modules/tracking';
import { NADOSOLO_ATTRIBUTION_KEY } from '@/components/AttributionCapture';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get('paymentKey') || '';
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '';
  const eventId = searchParams.get('eventId') || '';
  const promo = (searchParams.get('promo') || '').trim().toUpperCase();
  const tierCode = (searchParams.get('tierCode') || '').trim().toUpperCase();
  const title = searchParams.get('title') || '나도솔로 참가권';
  const rawTickets = Number(searchParams.get('tickets') || '1');
  const tickets = rawTickets === 3 ? 3 : rawTickets === 2 ? 2 : 1;
  const bonusTickets = tierCode === 'BARO' ? 0 : Math.max(0, tickets - 1);

  const { currentUser, applyForConditionalEvent, appliedEventIds } = useNadoSoloEngine();
  const [verifyState, setVerifyState] = useState<'VERIFYING' | 'CONFIRMED' | 'ERROR'>('VERIFYING');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // 토스페이먼츠 서버 결제 승인 API 검증 후에만 신청 확정 및 잔여 티켓 적립 수행
  useEffect(() => {
    let cancelled = false;

    async function confirmAndSync() {
      if (!paymentKey || !orderId || !amount) {
        setVerifyState('ERROR');
        setVerifyError('유효하지 않은 결제 경로입니다. (결제 승인 키 누락)');
        return;
      }

      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            eventId,
            userId: currentUser?.userId || '',
            tickets,
            promo,
            tierCode,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          if (!cancelled) {
            setVerifyState('ERROR');
            setVerifyError(data?.error || '결제 승인 검증에 실패했습니다.');
          }
          return;
        }

        if (cancelled) return;

        if (eventId && eventId !== 'MEMBERSHIP_BARO_1Y' && !appliedEventIds.includes(eventId)) {
          applyForConditionalEvent(eventId);
        }

        if (bonusTickets > 0 && currentUser?.userId) {
          const creditKey = `nadosolo_credited_${orderId}`;
          const alreadyCredited =
            typeof window !== 'undefined' && localStorage.getItem(creditKey);
          if (!alreadyCredited) {
            if (typeof window !== 'undefined') localStorage.setItem(creditKey, '1');
            void nadosoloBillingEngine.adjustCredits(currentUser.userId, bonusTickets, {
              reason: 'PURCHASE',
              itemId: eventId,
              note: `${tickets}회권 결제 잔여 참가권 ${bonusTickets}매 적립`,
            });
          }
        }

        if (promo && !data.alreadyConfirmed) {
          void nadosoloBillingEngine.recordPromoUsage({
            orderId,
            eventId,
            promo,
            amount,
            userId: currentUser?.userId,
          });
          void trackAffiliatePurchase({
            code: promo,
            orderId,
            amountKrw: Number(amount) || 30000,
            userId: currentUser?.userId,
            userEmail: currentUser?.email,
            userHandle: currentUser?.handle,
          });
        }

        if (!data.alreadyConfirmed && typeof window !== 'undefined') {
          const attr = loadAttribution(localStorage, NADOSOLO_ATTRIBUTION_KEY);
          void fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service: 'NADOSOLO',
              type: 'CONVERSION',
              path: '/payment/success',
              attribution: attr ?? (promo ? { partnerCode: promo, capturedAt: new Date().toISOString() } : null),
              amountKrw: Number(amount) || 30000,
              orderId,
            }),
          }).catch(() => {});
        }

        setVerifyState('CONFIRMED');
      } catch (err: any) {
        if (!cancelled) {
          setVerifyState('ERROR');
          setVerifyError(err?.message || '결제 확인 요청 중 오류가 발생했습니다.');
        }
      }
    }

    void confirmAndSync();
    return () => {
      cancelled = true;
    };
  }, [
    paymentKey,
    orderId,
    amount,
    eventId,
    promo,
    tickets,
    bonusTickets,
    currentUser?.userId,
    currentUser?.email,
    currentUser?.handle,
    appliedEventIds,
    applyForConditionalEvent,
  ]);

  if (verifyState === 'VERIFYING') {
    return (
      <div className="w-full max-w-md bg-[#12151e] border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-4">
        <p className="text-base font-semibold text-white">결제 승인 검증 중...</p>
        <p className="text-xs text-zinc-400">토스페이먼츠 결제 내역을 서버에서 안전하게 확인하고 있습니다.</p>
      </div>
    );
  }

  if (verifyState === 'ERROR') {
    return (
      <div className="w-full max-w-md bg-[#12151e] border border-[#f04f74]/40 rounded-3xl p-8 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-[#f04f74]/10 border border-[#f04f74]/40 text-[#f04f74] flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">결제 검증 실패</h1>
          <p className="text-sm text-zinc-300">{verifyError || '결제를 확인할 수 없습니다.'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/meetup"
            className="py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold text-center"
          >
            다시 예약
          </Link>
          <Link
            href="/dashboard"
            className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-sm font-semibold text-center"
          >
            대시보드
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-[#12151e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <span className="text-xs font-semibold text-rose-400 tracking-wider uppercase">
          TOSS PAYMENTS
        </span>
        <h1 className="text-2xl font-bold text-white mt-1">결제 및 신청 완료</h1>
        <p className="text-xs text-zinc-400 mt-1">
          토스페이먼츠 안전 결제가 서버에서 정상 승인되었습니다.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 space-y-2 text-left text-xs">
        <div className="flex justify-between text-zinc-400">
          <span>신청 상품</span>
          <span className="font-semibold text-white">{title}</span>
        </div>
        <div className="flex justify-between text-zinc-400">
          <span>주문 번호</span>
          <span className="font-mono text-zinc-300">{orderId}</span>
        </div>
        {promo && (
          <div className="flex justify-between text-zinc-400">
            <span>프로모션 코드</span>
            <span className="font-mono text-white font-semibold">{promo}</span>
          </div>
        )}
        {bonusTickets > 0 && (
          <div className="flex justify-between text-zinc-400">
            <span>지갑 적립 참가권</span>
            <span className="font-mono text-[#f04f74] font-semibold">+{bonusTickets}매 (다음 일정 무료 예약)</span>
          </div>
        )}
        {amount && (
          <div className="flex justify-between text-zinc-400 pt-2 border-t border-white/5">
            <span>결제 금액</span>
            <span className="font-bold text-rose-300 text-sm">
              ₩{Number(amount).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* D-1 정밀 배정 체크리스트 안내 카드 (Timeleft 심층 매칭 프로파일러) */}
      <div className="p-4 border border-white/20 bg-[#161a26] text-left space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            D-1 정밀 매칭 프로파일러
          </span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed font-normal">
          나와 가치관·대화 결이 100% 꼭 맞는 동석자 배정을 위해, 타임레프트 심층 22문항 체크리스트를 작성해 주세요.
        </p>
        <Link
          href="/checklist?mode=DEEP"
          className="block w-full py-2.5 mt-2 text-center border border-[#f04f74] bg-[#f04f74] hover:bg-[#d93a5e] text-white text-xs font-mono font-bold transition-colors"
        >
          정밀 체크리스트 시작하기 (22문항) →
        </Link>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        D-1 화요일 18:00에 배정된 프라이빗 테이블 및 상세 장소가 카카오톡 알림톡으로 비공개 안내됩니다.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/"
          className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors text-center"
        >
          홈
        </Link>
        <Link
          href="/dashboard"
          className="py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-colors text-center"
        >
          대시보드
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-zinc-500">결제 정보 확인 중...</div>}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
