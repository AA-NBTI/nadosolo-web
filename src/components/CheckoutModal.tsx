'use client';

import React, { useState } from 'react';
import { ShieldCheck, Check, CreditCard, Smartphone, AlertCircle } from 'lucide-react';

export interface CheckoutEventData {
  eventId: string;
  title: string;
  dateText: string;
  priceKrw: number;
  districtName?: string;
  mealNote?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CheckoutEventData | null;
  onSuccessPayment: (eventId: string) => void;
}

type PayMethod = 'CARD' | 'TOSS_PAY' | 'KAKAO_PAY' | 'NAVER_PAY';

export default function CheckoutModal({
  isOpen,
  onClose,
  event,
  onSuccessPayment,
}: CheckoutModalProps) {
  const [payMethod, setPayMethod] = useState<PayMethod>('CARD');
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen || !event) return null;

  const isFormValid = agreeRefund && agreePrivacy;

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isProcessing) return;

    setIsProcessing(true);

    // 토스페이먼츠 결제 승인 시뮬레이션 (0.8초 후 승인 완료)
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        onSuccessPayment(event.eventId);
        setPaymentSuccess(false);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#12151e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* 상단 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-lg cursor-pointer"
        >
          ✕
        </button>

        {paymentSuccess ? (
          /* 결제 승인 완료 화면 */
          <div className="py-12 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">결제 및 신청 완료!</h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
              토스페이먼츠 안전 결제가 정상 승인되었습니다.<br />
              D-1에 배정된 제휴 식당 정보가 비공개 안내됩니다.
            </p>
          </div>
        ) : (
          /* 주문서 및 결제 폼 */
          <form onSubmit={handlePaySubmit} className="space-y-6">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-rose-400 uppercase">
                TOSS PAYMENTS CHECKOUT
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">참가 신청 및 주문 결제</h2>
              <p className="text-xs text-zinc-400 mt-1">
                결이 맞는 6인 프라이빗 테이블 배정을 위해 참가권을 결제합니다.
              </p>
            </div>

            {/* 1. 상품 및 주문 정보 카드 */}
            <div className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/10 text-zinc-300 font-medium">
                    {event.districtName || '부산 · 전포'}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">{event.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{event.dateText}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 line-through">₩25,000</span>
                  <p className="text-lg font-bold text-rose-300">₩{event.priceKrw.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>{event.mealNote || '식대 및 주류 비용은 식당 현장에서 테이블 1/N 개별 정산됩니다.'}</span>
              </div>
            </div>

            {/* 2. 결제 수단 선택 (토스페이먼츠 연동) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-zinc-300">
                결제 수단 선택 (토스페이먼츠 에스크로)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod('CARD')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    payMethod === 'CARD'
                      ? 'bg-[#881337]/25 border-rose-500 text-white'
                      : 'bg-[#10131c] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-semibold">신용/체크카드</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('TOSS_PAY')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    payMethod === 'TOSS_PAY'
                      ? 'bg-[#881337]/25 border-rose-500 text-white'
                      : 'bg-[#10131c] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold">토스페이</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('KAKAO_PAY')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    payMethod === 'KAKAO_PAY'
                      ? 'bg-[#881337]/25 border-rose-500 text-white'
                      : 'bg-[#10131c] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-yellow-400 text-black text-[10px] font-bold flex items-center justify-center">
                    K
                  </span>
                  <span className="text-xs font-semibold">카카오페이</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('NAVER_PAY')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    payMethod === 'NAVER_PAY'
                      ? 'bg-[#881337]/25 border-rose-500 text-white'
                      : 'bg-[#10131c] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="w-4 h-4 rounded-md bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                    N
                  </span>
                  <span className="text-xs font-semibold">네이버페이</span>
                </button>
              </div>
            </div>

            {/* 3. 취소 및 환불 규정 동의 (토스페이먼츠 심사 핵심 필수 규정) */}
            <div className="p-4 rounded-2xl bg-[#10131c] border border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-white">취소 및 환불 정책 (전자상거래법 준수)</span>
              </div>
              <ul className="text-[11px] text-zinc-400 space-y-1 list-disc pl-4 leading-relaxed">
                <li>모임 3일 전 취소 시: <strong>100% 전액 환불</strong></li>
                <li>모임 2일 전 취소 시: <strong>50% 부분 환불</strong></li>
                <li>모임 1일 전 및 당일 취소/노쇼: <strong>환불 불가</strong> (6인 성비 및 좌석 밸런스 보호)</li>
              </ul>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeRefund}
                    onChange={(e) => setAgreeRefund(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-black/40 text-rose-600 focus:ring-0"
                  />
                  <span>[필수] 취소 및 환불 규정을 확인하였으며 이에 동의합니다.</span>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-black/40 text-rose-600 focus:ring-0"
                  />
                  <span>[필수] 6인 테이블 배정 및 알림톡 안내를 위한 개인정보 제3자 제공에 동의합니다.</span>
                </label>
              </div>
            </div>

            {/* 4. 최종 결제 버튼 */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={!isFormValid || isProcessing}
                className={`w-full py-4 rounded-xl text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isFormValid && !isProcessing
                    ? 'bg-[#881337] hover:bg-[#6f102d] text-white shadow-[#881337]/30 cursor-pointer'
                    : 'bg-white/10 text-zinc-500 cursor-not-allowed border border-white/5'
                }`}
              >
                {isProcessing ? (
                  <span>토스페이먼츠 결제 승인 중...</span>
                ) : (
                  <span>₩{event.priceKrw.toLocaleString()} 결제하기</span>
                )}
              </button>

              <p className="text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1">
                <span>🔒 토스페이먼츠(Toss Payments)의 안전한 암호화 에스크로 결제 시스템이 적용됩니다.</span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

