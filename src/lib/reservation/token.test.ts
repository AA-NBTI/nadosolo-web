/**
 * 응답 토큰 서명·검증 테스트. 실행: npm run test:reservation:token
 */
import assert from 'node:assert/strict';
import { signResponseToken, verifyResponseToken } from './token';

const secret = 'test-secret-0123456789abcdef';
const now = 1_800_000_000_000;

const t = signResponseToken('rsv_abc.def', now + 60_000, secret);
assert.deepEqual(verifyResponseToken(t, secret, now), { bookingId: 'rsv_abc.def', expiresAtMs: now + 60_000 });
assert.equal(verifyResponseToken(t, secret, now + 61_000), null, '만료');
assert.equal(verifyResponseToken(t, 'other-secret-0123456789abcdef', now), null, '다른 시크릿');

const [payload, sig] = t.split('.');
const forged = Buffer.from(`rsv_zzz.${now + 60_000}`).toString('base64url');
assert.equal(verifyResponseToken(`${forged}.${sig}`, secret, now), null, '페이로드 변조');
assert.equal(verifyResponseToken(`${payload}.AAAA`, secret, now), null, '서명 변조');
assert.equal(verifyResponseToken('garbage', secret, now), null);
assert.equal(verifyResponseToken('', secret, now), null);

console.log('  ✓ 토큰 서명·만료·변조 방어\n\n1/1 통과');
