'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, CreditCard, Smartphone, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNadoSoloEngine } from '@/engine';
import {
  DEFAULT_PROMO_CODES,
  PromoCode,
  fetchPromoCodes,
  resolvePromoFromList,
} from '@/lib/promoCodes';

export interface CheckoutEventData {
  eventId: string;
  title: string;
  dateText: string;
  priceKrw: number;
  initialTicketCount?: 1 | 2 | 3;
  districtName?: string;
  mealNote?: string;
  refundPolicy?: string;
  deadlineText?: string;
}

const TICKET_PLANS: Record<1 | 2 | 3, { count: 1 | 2 | 3; label: string; price: number; perUnit: number; badge?: string }> = {
  1: { count: 1, label: '1회 체험권', price: 30000, perUnit: 30000 },
  2: { count: 2, label: '2회 체험권', price: 50000, perUnit: 25000, badge: '17% 혜택' },
  3: { count: 3, label: '세번은 만나봐야', price: 60000, perUnit: 20000, badge: 'BEST · 33% 혜택' },
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CheckoutEventData | null;
  onSuccessPayment: (eventId: string) => void;
  initialPromoCode?: string;
}

type PayMethod = 'CARD' | 'TOSS_PAY' | 'KAKAO_PAY' | 'NAVER_PAY';

export default function CheckoutModal({
  isOpen,
  onClose,
  event,
  onSuccessPayment,
  initialPromoCode,
}: CheckoutModalProps) {
  const { currentUser, updateCurrentUser, surveyAnswers } = useNadoSoloEngine();
  const [payMethod, setPayMethod] = useState<PayMethod>('CARD');
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoList, setPromoList] = useState<PromoCode[]>(DEFAULT_PROMO_CODES);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountKrw: number } | null>(null);
  const [promoNotice, setPromoNotice] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!isOpen || !event) return;
    const initCount: 1 | 2 | 3 =
      event.initialTicketCount ||
      (event.priceKrw === 60000 ? 3 : event.priceKrw === 50000 ? 2 : 1);
    setTicketCount(initCount);

    const refCandidate =
      (initialPromoCode ||
        (typeof window !== 'undefined' ? localStorage.getItem('nadosolo_referral_code') : '') ||
        '')
        .trim()
        .toUpperCase();

    fetchPromoCodes().then((list) => {
      setPromoList(list);
      if (refCandidate) {
        const initPrice = TICKET_PLANS[initCount].price;
        const resolved = resolvePromoFromList(refCandidate, initPrice, list);
        if (resolved) {
          setPromoCode(refCandidate);
          setAppliedPromo({ code: refCandidate, discountKrw: resolved.discountKrw });
          setPromoNotice(`추천 코드 자동 적용: ${resolved.notice}`);
        }
      }
    });
  }, [isOpen, initialPromoCode, event]);

  // 신청 직전 필수 매칭 조건 로컬 보완 상태
  const [gateCity, setGateCity] = useState(currentUser?.residenceCity || '서울');
  const [gateDistrict, setGateDistrict] = useState(currentUser?.residenceDistrict || '');
  const [gateDong, setGateDong] = useState(currentUser?.residenceDong || '');
  const [gatePhone, setGatePhone] = useState(
    currentUser?.phone && currentUser.phone !== '010-0000-0000' ? currentUser.phone : ''
  );
  const [gatePurpose, setGatePurpose] = useState<'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE'>(
    currentUser?.preferredPurpose || 'RESET'
  );
  const [gateSavedNotice, setGateSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setGateCity(currentUser.residenceCity || '서울');
      setGateDistrict(currentUser.residenceDistrict || '');
      setGateDong(currentUser.residenceDong || '');
      setGatePhone(
        currentUser.phone && currentUser.phone !== '010-0000-0000' ? currentUser.phone : ''
      );
      setGatePurpose(currentUser.preferredPurpose || 'RESET');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !event) return null;

  const hasLivingZone = Boolean(
    currentUser?.residenceCity?.trim() &&
      currentUser?.residenceDistrict?.trim() &&
      currentUser?.residenceDong?.trim()
  );
  const hasPurpose = Boolean(currentUser?.preferredPurpose);
  const hasPhone = Boolean(
    currentUser?.phone &&
      currentUser.phone.trim() !== '' &&
      currentUser.phone !== '010-0000-0000'
  );
  const hasSurvey = Object.keys(surveyAnswers || {}).length >= 4;
  const needsPreCheck = Boolean(currentUser) && (!hasLivingZone || !hasPurpose || !hasPhone || !hasSurvey);

  const isFormValid = agreeRefund && agreePrivacy && !needsPreCheck;

  const selectedPlan = TICKET_PLANS[ticketCount];
  const basePrice = selectedPlan.price;
  const finalAmount = Math.max(1000, basePrice - (appliedPromo?.discountKrw ?? 0));

  const handleSelectTickets = (nextCount: 1 | 2 | 3) => {
    setTicketCount(nextCount);
    const nextBase = TICKET_PLANS[nextCount].price;
    if (appliedPromo) {
      const resolved = resolvePromoFromList(appliedPromo.code, nextBase, promoList);
      if (resolved) {
        setAppliedPromo({ code: appliedPromo.code, discountKrw: resolved.discountKrw });
        setPromoNotice(resolved.notice);
      }
    }
  };

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    const resolved = resolvePromoFromList(code, basePrice, promoList);
    if (resolved) {
      setAppliedPromo({ code, discountKrw: resolved.discountKrw });
      setPromoNotice(resolved.notice);
    } else {
      setAppliedPromo(null);
      setPromoNotice('유효하지 않은 프로모션 코드입니다.');
    }
  };

  const handleSavePreCheck = () => {
    if (!gateCity.trim() || !gateDistrict.trim() || !gateDong.trim() || !gatePhone.trim()) {
      setGateSavedNotice('시/도, 시/군/구, 읍/면/동 및 연락처를 모두 입력해 주세요.');
      return;
    }
    updateCurrentUser({
      residenceCity: gateCity.trim(),
      residenceDistrict: gateDistrict.trim(),
      residenceDong: gateDong.trim(),
      phone: gatePhone.trim(),
      preferredPurpose: gatePurpose,
    });
    setGateSavedNotice('필수 조건이 저장되었습니다.');
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { loadTossPayments } = await import('@tosspayments/payment-sdk');
      const clientKey =
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJqK4Wj7mM05N3LzN97Eq';
      const tossPayments = await loadTossPayments(clientKey);

      const orderId = `order_${event.eventId}_${Date.now()}`;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const trackingPromo = (
        appliedPromo?.code ||
        initialPromoCode ||
        (typeof window !== 'undefined' ? localStorage.getItem('nadosolo_referral_code') : '') ||
        ''
      )
        .trim()
        .toUpperCase();
      const successUrl = `${origin}/payment/success?eventId=${encodeURIComponent(event.eventId)}&title=${encodeURIComponent(`${event.title} (${selectedPlan.label})`)}&tickets=${ticketCount}${trackingPromo ? `&promo=${encodeURIComponent(trackingPromo)}` : ''}`;
      const failUrl = `${origin}/payment/fail`;
      const orderTitle = `${event.title} (${selectedPlan.label})`;

      // 선택된 결제수단에 맞춰 토스페이먼츠 결제창 호출
      if (payMethod === 'CARD') {
        await tossPayments.requestPayment('카드', {
          amount: finalAmount,
          orderId,
          orderName: orderTitle,
          customerName: '나도솔로 참가자',
          successUrl,
          failUrl,
        });
      } else if (payMethod === 'TOSS_PAY') {
        await tossPayments.requestPayment('카드', {
          amount: finalAmount,
          orderId,
          orderName: orderTitle,
          customerName: '나도솔로 참가자',
          flowMode: 'DIRECT',
          easyPay: '토스페이',
          successUrl,
          failUrl,
        });
      } else if (payMethod === 'KAKAO_PAY') {
        await tossPayments.requestPayment('카드', {
          amount: finalAmount,
          orderId,
          orderName: orderTitle,
          customerName: '나도솔로 참가자',
          flowMode: 'DIRECT',
          easyPay: '카카오페이',
          successUrl,
          failUrl,
        });
      } else if (payMethod === 'NAVER_PAY') {
        await tossPayments.requestPayment('카드', {
          amount: finalAmount,
          orderId,
          orderName: orderTitle,
          customerName: '나도솔로 참가자',
          flowMode: 'DIRECT',
          easyPay: '네이버페이',
          successUrl,
          failUrl,
        });
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      // 사용자가 직접 결제창을 닫은 경우 (USER_CANCEL) 등 처리
      if (errorObj?.code === 'USER_CANCEL') {
        setErrorMessage('결제가 취소되었습니다.');
      } else {
        setErrorMessage(errorObj?.message || '결제 진행 중 오류가 발생했습니다.');
      }
      setIsProcessing(false);
    }
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

        {/* 주문서 및 결제 폼 */}
        <form onSubmit={handlePaySubmit} className="space-y-6">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-rose-400 uppercase">
                TOSS PAYMENTS CHECKOUT
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">소셜 다이닝 참가 신청</h2>
              <p className="text-xs text-zinc-400 mt-1">
                좌석 예약 대행, 테이블 대화 카드 킷, 모임 운영비가 포함된 참가권입니다.
              </p>
            </div>

            {/* 1. 상품 및 주문 정보 카드 */}
            <div className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/10 text-zinc-300 font-medium">
                    {event.districtName || '부산'}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">{event.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{event.dateText}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-zinc-400 font-medium">{selectedPlan.label}</span>
                  <p className="text-lg font-bold text-[#f04f74]">₩{finalAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* 참가권 티어 선택 (1회 3만 / 2회 5만 / 3회 6만) */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                {([1, 2, 3] as const).map((cnt) => {
                  const plan = TICKET_PLANS[cnt];
                  const active = ticketCount === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleSelectTickets(cnt)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        active
                          ? 'bg-[#f04f74]/15 border-[#f04f74] text-white'
                          : 'bg-[#10131c] border-white/10 text-zinc-400 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {plan.badge && (
                        <span className="block text-[10px] font-bold text-[#f04f74] mb-0.5">
                          {plan.badge}
                        </span>
                      )}
                      <div className="text-xs font-bold text-white">{plan.label}</div>
                      <div className="text-xs font-mono text-zinc-200 mt-0.5">
                        ₩{plan.price.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        회당 ₩{plan.perUnit.toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 결제 전 업셀 알림 (Order Bump) */}
              {ticketCount === 1 && (
                <button
                  type="button"
                  onClick={() => handleSelectTickets(3)}
                  className="w-full p-3 rounded-xl bg-[#f04f74]/10 border border-[#f04f74]/50 hover:bg-[#f04f74]/20 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#f04f74]">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>권장 ₩30,000 추가시(2회 50% 혜택) 총 3회 「세번은 만나봐야」로 업그레이드됩니다!</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      (→ 총 ₩60,000 · 회당 ₩20,000으로 잔여 2회 지갑 자동 적립)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#f04f74] text-white text-[11px] font-bold shrink-0">
                    적용
                  </span>
                </button>
              )}

              {ticketCount === 2 && (
                <button
                  type="button"
                  onClick={() => handleSelectTickets(3)}
                  className="w-full p-3 rounded-xl bg-[#f04f74]/10 border border-[#f04f74]/50 hover:bg-[#f04f74]/20 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#f04f74]">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>권장 ₩10,000 추가시(1회 67% 혜택) 총 3회 「세번은 만나봐야」로 업그레이드됩니다!</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      (→ 총 ₩60,000 · 회당 ₩20,000으로 잔여 2회 지갑 자동 적립)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#f04f74] text-white text-[11px] font-bold shrink-0">
                    적용
                  </span>
                </button>
              )}

              {ticketCount === 3 && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/15 flex items-center gap-2 text-xs text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 text-[#f04f74] shrink-0" />
                  <span>최대 할인 적용 중 · 이번 모임 1회 신청 후 잔여 2회권은 내 지갑에 자동 적립됩니다.</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>{event.mealNote || '식음료 비용은 매장 현장에서 1/N 개별 정산됩니다.'}</span>
              </div>
            </div>

            {/* 1.5 신청 직전 필수 매칭 조건 게이트 (미충족 시에만 노출) */}
            {needsPreCheck && (
              <div className="p-4 rounded-2xl bg-[#181c28] border border-[#f04f74]/40 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">매칭 필수 조건 확인</span>
                  <span className="text-xs font-mono text-[#f04f74]">신청 전 1회 입력</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  정확한 테이블 배정과 D-1 장소 안내를 위해 아래 조건을 완료해 주세요.
                </p>

                {(!hasLivingZone || !hasPurpose || !hasPhone) && (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={gateCity}
                        onChange={(e) => setGateCity(e.target.value)}
                        className="px-2.5 py-2 bg-[#0d1018] border border-white/15 text-xs text-white"
                      >
                        {['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={gateDistrict}
                        onChange={(e) => setGateDistrict(e.target.value)}
                        placeholder="시/군/구 (예: 강남구)"
                        className="px-2.5 py-2 bg-[#0d1018] border border-white/15 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={gateDong}
                        onChange={(e) => setGateDong(e.target.value)}
                        placeholder="읍/면/동 (예: 역삼동)"
                        className="px-2.5 py-2 bg-[#0d1018] border border-white/15 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={gatePurpose}
                        onChange={(e) => setGatePurpose(e.target.value as 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE')}
                        className="px-2.5 py-2 bg-[#0d1018] border border-white/15 text-xs text-white"
                      >
                        <option value="FRIEND">친구·사회적 교류</option>
                        <option value="RESET">지적 환기·리셋 (기혼·리더 포함)</option>
                        <option value="TASTE">취향·활동 공유</option>
                        <option value="ROMANCE">인연·동반자 (미혼 한정)</option>
                      </select>
                      <input
                        type="tel"
                        value={gatePhone}
                        onChange={(e) => setGatePhone(e.target.value)}
                        placeholder="연락처 (010-0000-0000)"
                        className="px-2.5 py-2 bg-[#0d1018] border border-white/15 text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSavePreCheck}
                      className="w-full py-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      필수 조건 저장
                    </button>
                  </div>
                )}

                {!hasSurvey && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-300">소통 성향 진단(5문항) 미완료</span>
                    <Link
                      href="/test"
                      onClick={onClose}
                      className="px-3 py-1.5 bg-[#f04f74] text-white text-xs font-mono font-bold"
                    >
                      성향 진단 →
                    </Link>
                  </div>
                )}

                {gateSavedNotice && (
                  <p className="text-xs font-mono text-zinc-200">{gateSavedNotice}</p>
                )}
              </div>
            )}

            {/* 프로모션 / 어필리에이트 코드 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                프로모션 · 추천 코드 (선택)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="예: NADOSOLO10"
                  className="flex-1 px-3 py-2 bg-[#10131c] border border-white/10 text-xs font-mono text-white"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-3 py-2 border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-mono text-white cursor-pointer"
                >
                  적용
                </button>
              </div>
              {promoNotice && (
                <p className="text-xs font-mono text-zinc-300">{promoNotice}</p>
              )}
              {appliedPromo && (
                <p className="text-xs font-mono text-white font-semibold">
                  최종 결제 금액: ₩{finalAmount.toLocaleString()}
                </p>
              )}
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
                      ? 'bg-[#10131c] border-[#f04f74] text-[#f04f74]'
                      : 'bg-[#10131c] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#f04f74]" />
                  <span className="text-xs font-semibold">신용/체크카드</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('TOSS_PAY')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    payMethod === 'TOSS_PAY'
                      ? 'bg-[#10131c] border-[#f04f74] text-[#f04f74]'
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
                      ? 'bg-[#10131c] border-[#f04f74] text-[#f04f74]'
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
                      ? 'bg-[#10131c] border-[#f04f74] text-[#f04f74]'
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
                <ShieldCheck className="w-4 h-4 text-[#f04f74]" />
                <span className="text-xs font-bold text-white">취소 및 환불 정책 (전자상거래법 준수)</span>
              </div>
              <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4 leading-relaxed">
                {event.refundPolicy && (
                  <li className="text-white font-medium">{event.refundPolicy}</li>
                )}
                {event.deadlineText && (
                  <li>신청 마감: <strong>{event.deadlineText}</strong></li>
                )}
                <li>모임 3일 전 취소 시: <strong>100% 전액 환불</strong></li>
                <li>모임 2일 전 취소 시: <strong>50% 부분 환불</strong></li>
                <li>모임 1일 전 및 당일 취소/노쇼: <strong>환불 불가</strong> (좌석 예약 확정 및 테이블 세팅 완료)</li>
                <li>다회권(세번은 만나봐야 등) 중도 환불: <strong>기이용 회차는 1회 정상가(₩30,000) 기준 차감</strong></li>
                <li>2회 만남 이용(초과) 시: <strong>마지막 1회 혜택권은 환불 불가</strong> (일정 이월은 가능)</li>
                <li>최소 인원 미달 등으로 주최 측 모임 취소 시: <strong>100% 전액 자동 환불</strong></li>
              </ul>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeRefund}
                    onChange={(e) => setAgreeRefund(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-black/40 text-[#f04f74] focus:ring-0"
                  />
                  <span>[필수] 취소 및 환불 규정을 확인하였으며 이에 동의합니다.</span>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-black/40 text-[#f04f74] focus:ring-0"
                  />
                  <span>[필수] 테이블 좌석 배정 및 알림톡 안내를 위한 개인정보 제3자 제공에 동의합니다.</span>
                </label>
              </div>
            </div>

            {/* 에러 메시지 표시 */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-transparent border border-[#f04f74]/60 text-[#f04f74] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#f04f74]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 4. 최종 결제 버튼 */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={!isFormValid || isProcessing}
                className={`w-full py-4 rounded-xl text-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  isFormValid && !isProcessing
                    ? 'border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] cursor-pointer'
                    : 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5'
                }`}
              >
                {isProcessing ? (
                  <span>토스페이먼츠 결제 승인 중...</span>
                ) : (
                  <span>₩{finalAmount.toLocaleString()} 결제하기 ({selectedPlan.label})</span>
                )}
              </button>

              <p className="text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1">
                <span>🔒 토스페이먼츠(Toss Payments)의 안전한 암호화 에스크로 결제 시스템이 적용됩니다.</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

