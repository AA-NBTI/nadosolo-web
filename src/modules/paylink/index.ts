/**
 * 범용 10초 선결제 링크(PayLink) 도메인 모델 & 상태 머신.
 * 전화·카톡·DM 문의 고객에게 즉시 결제 URL을 발송하고 승인 상태를 관리한다.
 */

export type PayLinkService = 'TABLEBARO' | 'NADOSOLO';
export type PayLinkStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface PayLinkRecord {
  id: string;
  service: PayLinkService;
  resourceId: string;
  resourceName: string;
  customerName: string;
  customerPhone: string;
  amountKrw: number;
  memo?: string;
  orderId: string;
  status: PayLinkStatus;
  paymentKey?: string;
  createdAt: string;
  paidAt?: string;
}

export function createPayLinkRecord(input: {
  service: PayLinkService;
  resourceId: string;
  resourceName: string;
  customerName: string;
  customerPhone: string;
  amountKrw: number;
  memo?: string;
  now?: Date;
}): PayLinkRecord {
  const amount = Math.round(Number(input.amountKrw));
  if (!Number.isFinite(amount) || amount < 1000) {
    throw new Error('결제 금액은 1,000원 이상이어야 합니다.');
  }
  const phone = String(input.customerPhone || '').trim();
  const name = String(input.customerName || '').trim();
  if (!name || phone.replace(/\D/g, '').length < 8) {
    throw new Error('고객 이름과 연락처를 정확히 입력해 주세요.');
  }

  const ts = (input.now ?? new Date()).getTime();
  const rand = Math.random().toString(36).slice(2, 7);
  const id = `pl_${ts.toString(36)}_${rand}`;

  return {
    id,
    service: input.service,
    resourceId: String(input.resourceId).trim(),
    resourceName: String(input.resourceName || input.resourceId).trim(),
    customerName: name,
    customerPhone: phone,
    amountKrw: amount,
    memo: input.memo ? String(input.memo).trim().slice(0, 120) : undefined,
    orderId: `pay_${ts.toString(36)}_${rand}`,
    status: 'PENDING',
    createdAt: (input.now ?? new Date()).toISOString(),
  };
}

export function markPayLinkPaid(
  record: PayLinkRecord,
  paymentKey: string,
  now: Date = new Date()
): PayLinkRecord {
  if (record.status === 'PAID') return record;
  if (record.status !== 'PENDING') {
    throw new Error(`결제할 수 없는 상태입니다: ${record.status}`);
  }
  return {
    ...record,
    status: 'PAID',
    paymentKey: paymentKey || `pk_${Date.now().toString(36)}`,
    paidAt: now.toISOString(),
  };
}
