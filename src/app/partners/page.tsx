import { redirect } from 'next/navigation';

/**
 * 구형 /partners 입점 경로는 독립 예약업체 입점(/biz/apply)으로 단일화합니다.
 */
export default function LegacyPartnersRedirectPage() {
  redirect('/biz/apply');
}
