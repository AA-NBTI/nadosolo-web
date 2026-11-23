import assert from 'node:assert/strict';
import {
  PaymentError,
  computeRefundAmount,
  createTestPaymentAdapter,
  transitionPaymentStatus,
  type PaymentRecord,
} from '../index';

const tests: Array<[string, () => Promise<void> | void]> = [];
const test = (n: string, f: () => Promise<void> | void) => tests.push([n, f]);

test('결제 상태 전이: 정상 흐름 및 위반 차단', () => {
  const p: PaymentRecord = {
    orderId: 'tb_1',
    provider: 'TEST',
    amountKrw: 10000,
    status: 'PENDING',
  };
  const paid = transitionPaymentStatus(p, 'PAID');
  assert.equal(paid.status, 'PAID');
  const refunded = transitionPaymentStatus(paid, 'REFUNDED');
  assert.equal(refunded.status, 'REFUNDED');

  assert.throws(
    () => transitionPaymentStatus(refunded, 'PAID'),
    (e: unknown) => e instanceof PaymentError && e.code === 'INVALID_PAYMENT_TRANSITION'
  );
  assert.throws(
    () => transitionPaymentStatus(p, 'REFUNDED'),
    (e: unknown) => e instanceof PaymentError && e.code === 'INVALID_PAYMENT_TRANSITION'
  );
});

test('환불 금액 계산: 48시간 전 100%, 이내 정책 비율 적용', () => {
  const startsAt = '2026-12-10T10:00:00Z';
  const early = computeRefundAmount({
    paidAmountKrw: 30000,
    startsAt,
    cancelledAt: new Date('2026-12-07T00:00:00Z'),
  });
  assert.equal(early.refundAmountKrw, 30000);
  assert.equal(early.fullRefund, true);

  const lateZero = computeRefundAmount({
    paidAmountKrw: 30000,
    startsAt,
    cancelledAt: new Date('2026-12-09T20:00:00Z'),
    rule: { freeCancelHours: 48, lateRefundRatePercent: 0 },
  });
  assert.equal(lateZero.refundAmountKrw, 0);
  assert.equal(lateZero.fullRefund, false);

  const lateHalf = computeRefundAmount({
    paidAmountKrw: 30000,
    startsAt,
    cancelledAt: new Date('2026-12-09T20:00:00Z'),
    rule: { freeCancelHours: 48, lateRefundRatePercent: 50 },
  });
  assert.equal(lateHalf.refundAmountKrw, 15000);
});

test('테스트 PG 어댑터 승인 및 환불', async () => {
  const adapter = createTestPaymentAdapter();
  const bad = await adapter.confirm({ orderId: 'tb_1', paymentKey: 'short', amountKrw: 500 });
  assert.equal(bad.ok, false);

  const ok = await adapter.confirm({ orderId: 'tb_1', paymentKey: 'test_pk_123456', amountKrw: 10000 });
  assert.equal(ok.ok, true);

  const ref = await adapter.refund({ paymentKey: 'test_pk_123456', amountKrw: 10000, reason: '고객 취소' });
  assert.equal(ref.ok, true);
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${name}\n    ${(e as Error).message}`);
    }
  }
  console.log(`\n${tests.length - failed}/${tests.length} 통과`);
  process.exit(failed ? 1 : 0);
})();
