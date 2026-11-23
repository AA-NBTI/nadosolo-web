import assert from 'node:assert/strict';
import { normalizeSlug, extractSubdomainSlug, buildTenantUrl } from '../index';
import { createPayLinkRecord, markPayLinkPaid } from '../../paylink/index';

const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);

test('슬러그 정규화 및 예약어 차단', () => {
  assert.equal(normalizeSlug('  Gosu-Dining! '), 'gosu-dining');
  assert.equal(normalizeSlug('admin'), null);
  assert.equal(normalizeSlug('biz'), null);
  assert.equal(normalizeSlug('a'), null);
});

test('서브도메인 슬러그 추출 (gosu.tablebaro.com, gosu.localhost)', () => {
  assert.equal(extractSubdomainSlug('gosu.tablebaro.com'), 'gosu');
  assert.equal(extractSubdomainSlug('gosu.localhost:3000'), 'gosu');
  assert.equal(extractSubdomainSlug('tablebaro.com'), null);
  assert.equal(extractSubdomainSlug('www.tablebaro.com'), null);
  assert.equal(extractSubdomainSlug('nadosolo.vercel.app'), null);
});

test('테넌트 URL 생성 (서브도메인 vs 경로)', () => {
  assert.equal(
    buildTenantUrl({ origin: 'https://tablebaro.com', resourceId: 'BIZ_1', slug: 'gosu', subdomainRoot: 'tablebaro.com' }),
    'https://gosu.tablebaro.com'
  );
  assert.equal(
    buildTenantUrl({ origin: 'https://tablebaro.com', resourceId: 'BIZ_1', slug: 'gosu' }),
    'https://tablebaro.com/reserve/gosu'
  );
});

test('PayLink 생성 및 결제 완료 전이', () => {
  const link = createPayLinkRecord({
    service: 'TABLEBARO',
    resourceId: 'BIZ_1',
    resourceName: '고수냉면',
    customerName: '홍길동',
    customerPhone: '010-1234-5678',
    amountKrw: 20000,
    memo: '오늘 19시 4인',
  });
  assert.equal(link.status, 'PENDING');
  const paid = markPayLinkPaid(link, 'pk_test_123');
  assert.equal(paid.status, 'PAID');
  assert.equal(paid.paymentKey, 'pk_test_123');
  assert.throws(() => createPayLinkRecord({
    service: 'TABLEBARO',
    resourceId: 'BIZ_1',
    resourceName: '고수냉면',
    customerName: '홍길동',
    customerPhone: '010-1234-5678',
    amountKrw: 500,
  }));
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n    ${(e as Error).message}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} 통과`);
process.exit(failed ? 1 : 0);
