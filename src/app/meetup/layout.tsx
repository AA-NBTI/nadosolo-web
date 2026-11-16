import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '모임',
  description: '나도솔로 전국 오프라인 소셜 다이닝 밋업 일정 확인 및 신청',
  alternates: { canonical: '/meetup' },
};

export default function MeetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
