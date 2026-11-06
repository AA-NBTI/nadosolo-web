'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'PAYMENT_FAILED';
  const message = searchParams.get('message') || '결제가 정상적으로 완료되지 않았거나 취소되었습니다.';

  return (
    <div className="w-full max-w-md bg-[#12151e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-3xl">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div>
        <span className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">
          TOSS PAYMENTS
        </span>
        <h1 className="text-2xl font-bold text-white mt-1">결제 실패</h1>
        <p className="text-xs text-zinc-400 mt-1">{message}</p>
      </div>

      <div className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 space-y-1 text-left text-xs">
        <div className="flex justify-between text-zinc-400">
          <span>오류 코드</span>
          <span className="font-mono text-rose-300">{code}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/"
          className="py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors text-center"
        >
          홈
        </Link>
        <Link
          href="/dashboard"
          className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-colors text-center"
        >
          돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-zinc-500">오류 확인 중...</div>}>
        <PaymentFailContent />
      </Suspense>
    </div>
  );
}

