/**
 * 범용 선결제(PG) 어댑터 · 상태 머신 코어 계약.
 * 특정 PG사나 서비스 도메인에 종속되지 않는다.
 */

export type PaymentProvider = 'TEST' | 'TOSS' | 'PORTONE';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'REFUNDED'
  | 'PARTIAL_REFUNDED'
  | 'FAILED';

export interface PaymentRecord {
  orderId: string;
  paymentKey?: string;
  provider: PaymentProvider;
  amountKrw: number;
  status: PaymentStatus;
  paidAt?: string;
  refundedAt?: string;
  refundAmountKrw?: number;
  refundReason?: string;
}

export interface RefundPolicyRule {
  freeCancelHours: number;
  lateRefundRatePercent: number; // 0 ~ 100
}

export interface PaymentConfirmInput {
  orderId: string;
  paymentKey: string;
  amountKrw: number;
}

export interface PaymentRefundInput {
  paymentKey: string;
  amountKrw: number;
  reason: string;
}

export interface PaymentAdapterResult {
  ok: boolean;
  provider: PaymentProvider;
  paymentKey?: string;
  error?: string;
}

export interface PaymentAdapter {
  readonly provider: PaymentProvider;
  confirm(input: PaymentConfirmInput): Promise<PaymentAdapterResult>;
  refund(input: PaymentRefundInput): Promise<PaymentAdapterResult>;
}
