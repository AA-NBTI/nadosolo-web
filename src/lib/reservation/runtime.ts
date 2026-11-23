import {
  createNadoSoloReservationEngine,
  createSupabaseDriver,
  type ReservationDriver,
  type ReservationEngine,
} from '@/modules/reservation';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 범용 예약 모듈 런타임 진입점 (서비스 비종속).
 * - RESERVATION_ENABLED=true 이고 service role 키가 있을 때만 동작한다.
 */
export function getReservationDriver(): ReservationDriver | null {
  if (process.env.RESERVATION_ENABLED !== 'true') return null;
  const admin = createAdminClient();
  if (!admin) return null;
  return createSupabaseDriver(admin);
}

export function getReservationEngine(): ReservationEngine | null {
  const driver = getReservationDriver();
  if (!driver) return null;
  return createNadoSoloReservationEngine({ driver });
}
