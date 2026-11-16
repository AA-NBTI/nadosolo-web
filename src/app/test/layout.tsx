import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '성향 진단',
  description: '나도솔로 3:3 테이블 매칭을 위한 소통 성향 자가진단',
  alternates: { canonical: '/test' },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
