import assert from 'node:assert/strict';
import {
  parseAttribution,
  mergeAttribution,
  buildTrackedUrl,
  summarizeByChannel,
  isAttributionFresh,
} from '../index';
import { TABLEBARO_PARTNERS_PRESET } from '../../partners/presets/tablebaro.preset';
import { NADOSOLO_PARTNERS_PRESET } from '../../partners/presets/nadosolo.preset';

const t0 = new Date('2026-12-01T00:00:00Z');
const tests: Array<[string, () => void]> = [];
const test = (n: string, f: () => void) => tests.push([n, f]);

test('파라미터 없으면 null, 있으면 추출·정규화', () => {
  assert.equal(parseAttribution('', t0), null);
  const a = parseAttribution('?ref=blog1&utm_source=naver_place&utm_medium=qr', t0, 'BIZ_X')!;
  assert.equal(a.partnerCode, 'BLOG1');
  assert.equal(a.source, 'naver_place');
  assert.equal(a.resourceId, 'BIZ_X');
});

test('30일 유효기간 및 마지막 클릭 우선', () => {
  const a = parseAttribution('?ref=A', t0)!;
  assert.equal(isAttributionFresh(a, new Date('2026-12-30T00:00:00Z')), true);
  assert.equal(isAttributionFresh(a, new Date('2027-01-05T00:00:00Z')), false);
  const b = parseAttribution('?ref=B', new Date('2026-12-02T00:00:00Z'))!;
  assert.equal(mergeAttribution(a, b)!.partnerCode, 'B');
  assert.equal(mergeAttribution(a, null, new Date('2027-01-05T00:00:00Z')), null);
});

test('추적 URL 생성', () => {
  const u = buildTrackedUrl('https://tablebaro.com', '/reserve/BIZ_X', { ref: 'abc', source: 'instagram' });
  assert.equal(u, 'https://tablebaro.com/reserve/BIZ_X?ref=ABC&utm_source=instagram');
});

test('채널별 집계', () => {
  const ia = parseAttribution('?utm_source=instagram', t0);
  const na = parseAttribution('?utm_source=naver', t0);
  const rows = summarizeByChannel([
    { type: 'VISIT', attribution: ia },
    { type: 'VISIT', attribution: ia },
    { type: 'BOOKING', attribution: ia, amountKrw: 10000 },
    { type: 'VISIT', attribution: na },
    { type: 'BOOKING', attribution: na, amountKrw: 20000 },
    { type: 'BOOKING', attribution: na, amountKrw: 5000 },
  ]);
  assert.equal(rows[0].channel, 'naver');
  assert.equal(rows[0].amountKrw, 25000);
  assert.equal(rows[1].visits, 2);
});

test('테이블바로·나도솔로 파트너스 저장 키 완전 분리', () => {
  const tb = Object.values(TABLEBARO_PARTNERS_PRESET.storageKeys);
  const nd = new Set(Object.values(NADOSOLO_PARTNERS_PRESET.storageKeys));
  assert.equal(tb.some((k) => nd.has(k)), false);
  assert.notEqual(TABLEBARO_PARTNERS_PRESET.namespace, NADOSOLO_PARTNERS_PRESET.namespace);
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
