import { NextResponse } from 'next/server';
import { getNadoSoloReservationDriver } from '@/lib/reservation/nadosolo';
import {
  enqueueWaiting,
  findWaitingByPhone,
  getTodayWaitingState,
  normalizePhoneDigits,
  updateWaitingStatus,
} from '@/modules/reservation/waiting';

export const dynamic = 'force-dynamic';

/**
 * 테이블링 원격 웨이팅(줄서기) 공개 API
 * - GET: 매장 대기 현황(waitingOpen, waitingCount, estimatedMinutes) 및 내 대기 순번 조회
 * - POST: JOIN (원격 줄서기 등록) | CANCEL (손님 직접 대기 취소)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get('resourceId')?.trim();
  const phone = searchParams.get('phone')?.trim() || '';

  if (!resourceId) {
    return NextResponse.json({ ok: false, error: 'resourceId 필요' }, { status: 400 });
  }

  const driver = getNadoSoloReservationDriver();
  if (!driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }

  try {
    const resource = await driver.getResource(resourceId);
    if (!resource || !resource.active || resource.attributes?.onboardingCompleted === false) {
      return NextResponse.json({ ok: false, error: '매장을 찾을 수 없습니다.' }, { status: 404 });
    }

    const state = getTodayWaitingState(resource);
    const mine = phone ? findWaitingByPhone(resource, phone) : null;

    return NextResponse.json({
      ok: true,
      waitingOpen: state.waitingOpen,
      waitingCount: state.waitingCount,
      estimatedMinutes: state.estimatedMinutes,
      mine,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const driver = getNadoSoloReservationDriver();
  if (!driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const resourceId = String(body.resourceId || '').trim();
  const action = String(body.action || 'JOIN').trim();
  if (!resourceId) {
    return NextResponse.json({ ok: false, error: 'resourceId 필요' }, { status: 400 });
  }

  try {
    const result = await driver.withLock(`waiting:${resourceId}`, async () => {
      const resource = await driver.getResource(resourceId);
      if (!resource || !resource.active || resource.attributes?.onboardingCompleted === false) {
        return { error: '매장을 찾을 수 없습니다.', status: 404 as const };
      }

      if (action === 'CANCEL') {
        const waitingId = String(body.waitingId || '').trim();
        const phone = normalizePhoneDigits(String(body.phone || ''));
        const mine = findWaitingByPhone(resource, phone);
        if (!mine || (waitingId && mine.entry.id !== waitingId)) {
          return { error: '취소할 대기 내역이 일치하지 않습니다.', status: 403 as const };
        }
        const { resource: nextRes, entry } = updateWaitingStatus(resource, mine.entry.id, 'CANCELLED');
        await driver.saveResource(nextRes);
        return { ok: true as const, entry };
      }

      const name = String(body.name || '');
      const phone = String(body.phone || '');
      const partySize = Number(body.partySize) || 2;
      const blocked = Array.isArray(resource.attributes?.blockedPhones)
        ? (resource.attributes.blockedPhones as string[])
        : [];
      const phoneDigits = normalizePhoneDigits(phone);
      if (phoneDigits && blocked.includes(phoneDigits)) {
        return { error: '매장 운영 정책상 온라인 대기가 제한된 연락처입니다.', status: 403 as const };
      }
      const { resource: nextRes, entry, aheadCount } = enqueueWaiting(resource, { name, phone, partySize });
      await driver.saveResource(nextRes);
      return { ok: true as const, entry, aheadCount };
    });

    if ('error' in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
