import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '브랜드 소개',
  description: '나도솔로 — 인간은 누구나 솔로다. 오프라인 소셜 메타인지 플랫폼 소개',
  alternates: { canonical: '/showcase' },
};

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
