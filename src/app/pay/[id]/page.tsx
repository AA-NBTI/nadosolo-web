'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { PayLinkRecord } from '@/modules/paylink';

function PayLinkContent() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const id = decodeURIComponent(params.id || '');
  const tossPaymentKey = sp.get('paymentKey') || '';

  const [link, setLink] = useState<PayLinkRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/paylinks?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!data.ok || !data.link) {
        setError(data.error || '유효하지 않은 결제 링크입니다.');
      } else {
        setLink(data.link);
      }
    } catch {
      setError('결제 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmPay = useCallback(
    async (paymentKey?: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch('/api/paylinks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'PAY', id, paymentKey }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error || '결제 승인 실패');
        } else {
          setLink(data.link);
        }
      } catch {
        setError('결제 처리 중 오류가 발생했습니다.');
      } finally {
        setBusy(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (tossPaymentKey && link && link.status === 'PENDING' && !busy) {
      void confirmPay(tossPaymentKey);
    }
  }, [tossPaymentKey, link, busy, confirmPay]);

  const handleTossPay = async () => {
    if (!link) return;
    setBusy(true);
    setError(null);
    try {
      const { loadTossPayments } = await import('@tosspayments/payment-sdk');
      const clientKey =
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJqK4Wj7mM05N3LzN97Eq';
      const tossPayments = await loadTossPayments(clientKey);
      const url = `${window.location.origin}/pay/${encodeURIComponent(link.id)}`;
      await tossPayments.requestPayment('카드', {
        amount: link.amountKrw,
        orderId: link.orderId,
        orderName: `${link.resourceName}${link.memo ? ` · ${link.memo}` : ''}`,
        customerName: link.customerName,
        successUrl: url,
        failUrl: url,
      });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(e?.code === 'USER_CANCEL' ? '결제가 취소되었습니다.' : e?.message || '결제창 호출 실패');
      setBusy(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-[#07080a] text-zinc-400 flex items-center justify-center font-mono text-sm">불러오는 중...</main>;
  }

  if (!link) {
    return (
      <main className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center px-5">
        <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[#f04f74] mx-auto" />
          <p className="text-sm font-mono text-zinc-300">{error || '결제 링크 없음'}</p>
        </div>
      </main>
    );
  }

  if (link.status === 'PAID') {
    return (
      <main className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center px-5">
        <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-8 text-center space-y-4">
          <CheckCircle2 className="w-10 h-10 text-[#3b82f6] mx-auto" />
          <h1 className="font-serif-editorial text-2xl text-white font-normal">결제 완료</h1>
          <div className="text-sm font-mono text-zinc-300 space-y-1 border-y border-white/10 py-3">
            <div>{link.resourceName}</div>
            <div>{link.customerName} · {link.amountKrw.toLocaleString('ko-KR')}원</div>
            {link.memo && <div className="text-zinc-400">{link.memo}</div>}
          </div>
          <Link
            href={`/reserve/${encodeURIComponent(link.resourceId)}`}
            className="inline-block px-4 py-2 border border-white/25 bg-white/10 text-sm font-mono text-white"
          >
            매장 보기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-8 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif-editorial text-2xl text-white font-normal">결제</h1>
          <span className="text-sm font-mono text-zinc-400">{link.resourceName}</span>
        </div>
        <div className="text-sm font-mono text-zinc-300 space-y-1.5 border-y border-white/10 py-4">
          <div>고객: {link.customerName}</div>
          <div>연락처: {link.customerPhone}</div>
          {link.memo && <div>내용: {link.memo}</div>}
          <div className="flex items-center justify-between text-white font-bold pt-2 border-t border-white/10">
            <span>결제금액</span>
            <span>{link.amountKrw.toLocaleString('ko-KR')}원</span>
          </div>
        </div>
        {error && (
          <div className="p-3 border border-white/25 bg-white/5 text-sm font-mono text-white">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmPay()}
            className="py-3 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white cursor-pointer disabled:opacity-40"
          >
            테스트승인
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleTossPay()}
            className="py-3 border border-[#3b82f6]/60 bg-[#3b82f6]/25 hover:bg-[#3b82f6]/35 text-sm font-mono font-bold text-white cursor-pointer disabled:opacity-40"
          >
            {busy ? '연결 중' : '결제'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function PayLinkPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#07080a]" />}>
      <PayLinkContent />
    </Suspense>
  );
}
