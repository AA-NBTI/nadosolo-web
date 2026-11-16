import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '다이닝',
  description: '나도솔로 프라이빗 소셜 다이닝 테이블 및 진행 안내',
  alternates: { canonical: '/dining' },
};

export default function DiningLayout({ children }: { children: React.ReactNode }) {
  return children;
}
