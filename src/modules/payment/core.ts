import type {
  PaymentAdapter,
  PaymentConfirmInput,
  PaymentRecord,
  PaymentRefundInput,
  PaymentStatus,
  RefundPolicyRule,
} from './types';

export class PaymentError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['PAID', 'FAILED'],
  PAID: ['REFUNDED', 'PARTIAL_REFUNDED'],
  REFUNDED: [],
  PARTIAL_REFUNDED: [],
  FAILED: ['PENDING'],
};

/** 결제 상태 전이 검증 */
export function transitionPaymentStatus(
  record: PaymentRecord,
  next: PaymentStatus
): PaymentRecord {
  if (!ALLOWED_TRANSITIONS[record.status].includes(next)) {
    throw new PaymentError(
      'INVALID_PAYMENT_TRANSITION',
      `${record.status} 상태에서 ${next}로 전이할 수 없습니다.`
    );
  }
  return { ...record, status: next };
}

/** 업종·매장별 환불 정책에 따른 환불 금액 계산 */
export function computeRefundAmount(params: {
  paidAmountKrw: number;
  startsAt: string;
  cancelledAt?: Date;
  rule?: RefundPolicyRule;
}): { refundAmountKrw: number; fullRefund: boolean } {
  const paid = Math.max(0, Math.round(params.paidAmountKrw));
  if (paid === 0) return { refundAmountKrw: 0, fullRefund: true };

  const rule: RefundPolicyRule = params.rule ?? {
    freeCancelHours: 48,
    lateRefundRatePercent: 0,
  };
  const now = params.cancelledAt ?? new Date();
  const hoursLeft = (new Date(params.startsAt).getTime() - now.getTime()) / 3600_000;

  if (hoursLeft >= rule.freeCancelHours) {
    return { refundAmountKrw: paid, fullRefund: true };
  }
  const rate = Math.max(0, Math.min(100, rule.lateRefundRatePercent));
  const refundAmountKrw = Math.round((paid * rate) / 100);
  return { refundAmountKrw, fullRefund: refundAmountKrw === paid };
}

/** 심사 전·로컬 개발용 테스트 PG 어댑터 */
export function createTestPaymentAdapter(): PaymentAdapter {
  return {
    provider: 'TEST',
    async confirm(input: PaymentConfirmInput) {
      if (!input.orderId || input.amountKrw < 1000 || input.paymentKey.length < 6) {
        return { ok: false, provider: 'TEST', error: '유효하지 않은 테스트 결제 정보입니다.' };
      }
      return { ok: true, provider: 'TEST', paymentKey: input.paymentKey };
    },
    async refund(input: PaymentRefundInput) {
      if (!input.paymentKey || input.amountKrw < 0) {
        return { ok: false, provider: 'TEST', error: '환불 정보가 올바르지 않습니다.' };
      }
      return { ok: true, provider: 'TEST', paymentKey: input.paymentKey };
    },
  };
}

/** 토스페이먼츠 실서버 어댑터 (TOSS_SECRET_KEY 주입 시 활성화) */
export function createTossPaymentAdapter(secretKey: string): PaymentAdapter {
  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
  return {
    provider: 'TOSS',
    async confirm(input: PaymentConfirmInput) {
      const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: input.paymentKey,
          orderId: input.orderId,
          amount: input.amountKrw,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, provider: 'TOSS', error: json?.message || 'PG 승인 실패' };
      }
      return { ok: true, provider: 'TOSS', paymentKey: input.paymentKey };
    },
    async refund(input: PaymentRefundInput) {
      const res = await fetch(
        `https://api.tosspayments.com/v1/payments/${encodeURIComponent(input.paymentKey)}/cancel`,
        {
          method: 'POST',
          headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelReason: input.reason, cancelAmount: input.amountKrw }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, provider: 'TOSS', error: json?.message || 'PG 환불 실패' };
      }
      return { ok: true, provider: 'TOSS', paymentKey: input.paymentKey };
    },
  };
}

/** 환경변수 기반 PG 어댑터 자동 선택 */
export function getDefaultPaymentAdapter(): PaymentAdapter {
  const secret = process.env.TOSS_SECRET_KEY;
  return secret ? createTossPaymentAdapter(secret) : createTestPaymentAdapter();
}
