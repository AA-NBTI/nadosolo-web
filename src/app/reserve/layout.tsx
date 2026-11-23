import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: '테이블바로 | 선결제 예약 솔루션',
  description: '실시간 좌석 확인, 선결제 예약, 원격 웨이팅까지 한 번에 연결하는 범용 예약 커머스 솔루션 테이블바로입니다.',
  openGraph: {
    title: '테이블바로 | 선결제 예약 솔루션',
    description: '실시간 좌석 확인, 선결제 예약, 원격 웨이팅까지 한 번에 연결하는 범용 예약 커머스 솔루션',
    type: 'website',
  },
};

export default function ReserveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
