'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { tablebaroPartnersEngine } from '@/modules/partners';

function ReservePaySuccessContent() {
  const sp = useSearchParams();
  const bookingId = sp.get('bookingId') || '';
  const paymentKey = sp.get('paymentKey') || '';
  const orderId = sp.get('orderId') || '';
  const amount = Number(sp.get('amount') || '0');

  const [state, setState] = useState<'VERIFYING' | 'CONFIRMED' | 'ERROR'>('VERIFYING');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !paymentKey) {
      setState('ERROR');
      setError('유효하지 않은 결제 응답입니다.');
      return;
    }

    let cancelled = false;
    fetch('/api/reservations/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, paymentKey, orderId, amount }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) {
          setState('ERROR');
          setError(data.error || '결제 승인 검증 실패');
          return;
        }
        if (data.attribution?.partnerCode && !data.alreadyPaid) {
          void tablebaroPartnersEngine.trackPurchase({
            code: data.attribution.partnerCode,
            orderId: data.payment?.orderId || orderId,
            amountKrw: data.payment?.amountKrw || amount,
          });
        }
        setState('CONFIRMED');
      })
      .catch(() => {
        if (!cancelled) {
          setState('ERROR');
          setError('결제 승인 요청 중 오류가 발생했습니다.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId, paymentKey, orderId, amount]);

  return (
    <main className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-8 space-y-5 text-center">
        {state === 'VERIFYING' && (
          <>
            <h1 className="font-serif-editorial text-2xl text-white font-normal">결제 확인 중</h1>
            <p className="text-sm font-mono text-zinc-400">잠시만 기다려 주세요.</p>
          </>
        )}
        {state === 'CONFIRMED' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-[#3b82f6] mx-auto" />
            <h1 className="font-serif-editorial text-2xl text-white font-normal">결제 · 예약 완료</h1>
            <p className="text-sm font-mono text-zinc-300">
              {amount > 0 ? `${amount.toLocaleString('ko-KR')}원 결제가 완료되었습니다.` : '예약이 확정되었습니다.'}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Link
                href="/reserve/my"
                prefetch={true}
                className="px-4 py-2.5 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white"
              >
                예약확인
              </Link>
              <Link
                href="/reserve"
                prefetch={true}
                className="px-4 py-2.5 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-zinc-200"
              >
                매장검색
              </Link>
            </div>
          </>
        )}
        {state === 'ERROR' && (
          <>
            <AlertCircle className="w-10 h-10 text-[#f04f74] mx-auto" />
            <h1 className="font-serif-editorial text-2xl text-white font-normal">결제 오류</h1>
            <p className="text-sm font-mono text-zinc-300">{error}</p>
            <Link
              href="/reserve"
              prefetch={true}
              className="inline-block px-4 py-2.5 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white"
            >
              돌아가기
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function ReservePaySuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#07080a]" />}>
      <ReservePaySuccessContent />
    </Suspense>
  );
}
