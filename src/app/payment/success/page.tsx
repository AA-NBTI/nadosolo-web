'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '-';
  const amount = searchParams.get('amount') || '';
  const title = searchParams.get('title') || '나도솔로 참가권';

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
          토스페이먼츠 안전 결제가 정상 승인되었습니다.
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
        {amount && (
          <div className="flex justify-between text-zinc-400 pt-2 border-t border-white/5">
            <span>결제 금액</span>
            <span className="font-bold text-rose-300 text-sm">
              ₩{Number(amount).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        D-1에 배정된 6인 프라이빗 테이블 및 상세 장소가 카카오톡 알림톡으로 비공개 안내됩니다.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/"
          className="py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors text-center"
        >
          홈
        </Link>
        <Link
          href="/dashboard"
          className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-rose-950/40 text-center"
        >
          확인
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

