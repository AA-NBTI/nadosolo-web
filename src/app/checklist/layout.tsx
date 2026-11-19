import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '체크리스트',
  description: '나도솔로 3:3 테이블 매칭을 위한 2단계 프로그레시브 체크리스트',
  alternates: { canonical: '/checklist' },
};

export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
