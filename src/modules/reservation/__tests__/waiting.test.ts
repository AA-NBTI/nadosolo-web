import assert from 'node:assert/strict';
import type { Resource } from '../types';
import {
  enqueueWaiting,
  findWaitingByPhone,
  getTodayWaitingState,
  updateWaitingStatus,
} from '../waiting';

function run() {
  let resource: Resource = {
    id: 'BIZ_TEST',
    kind: 'restaurant',
    name: '고수냉면',
    capacity: 12,
    active: true,
    attributes: {},
  };

  const today = '2026-11-22';

  // 1. 첫 번째, 두 번째 손님 줄서기
  const r1 = enqueueWaiting(resource, { name: '김철수', phone: '010-1111-2222', partySize: 2 }, today);
  resource = r1.resource;
  assert.equal(r1.entry.ticketNo, 1);
  assert.equal(r1.aheadCount, 0);

  const r2 = enqueueWaiting(resource, { name: '이영희', phone: '010-3333-4444', partySize: 4 }, today);
  resource = r2.resource;
  assert.equal(r2.entry.ticketNo, 2);
  assert.equal(r2.aheadCount, 1);

  // 2. 중복 연락처 차단
  assert.throws(
    () => enqueueWaiting(resource, { name: '이영희', phone: '01033334444', partySize: 2 }, today),
    /이미 대기 등록/
  );

  // 3. 내 앞 대기 팀 수 조회
  const found2 = findWaitingByPhone(resource, '010-3333-4444', today);
  assert.equal(found2?.aheadCount, 1);

  // 4. 사장님 입장 호출 및 착석 처리 -> 두 번째 손님 앞 대기 0팀으로 줄어듦
  const called = updateWaitingStatus(resource, r1.entry.id, 'CALLED');
  resource = called.resource;
  assert.equal(called.entry.status, 'CALLED');

  const seated = updateWaitingStatus(resource, r1.entry.id, 'SEATED');
  resource = seated.resource;
  const found2After = findWaitingByPhone(resource, '010-3333-4444', today);
  assert.equal(found2After?.aheadCount, 0);

  // 5. 대기 마감 토글 시 신규 등록 차단
  resource = {
    ...resource,
    attributes: { ...resource.attributes, waitingOpen: false },
  };
  assert.equal(getTodayWaitingState(resource, today).waitingOpen, false);
  assert.throws(
    () => enqueueWaiting(resource, { name: '박민수', phone: '010-5555-6666', partySize: 2 }, today),
    /마감/
  );

  console.log('  ✓ 테이블링 레퍼런스(원격 줄서기·순번·중복차단·호출·착석·마감토글) 전체 통과\n1/1 통과');
}

run();
