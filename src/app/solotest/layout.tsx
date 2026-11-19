import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '솔로 테스트',
  description: '인간은 누구나 혼자다. 3문항으로 진단하는 나의 솔로지수 및 맞춤 낯선 식탁 매칭',
  alternates: { canonical: '/solotest' },
};

export default function SoloTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
