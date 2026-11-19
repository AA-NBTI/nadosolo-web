import React from 'react';
import Link from 'next/link';
import CmsPageHeader from '@/components/CmsPageHeader';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[900px] mx-auto space-y-10">
        <CmsPageHeader
          pageId="PAGE_ABOUT"
          defaultBadge="ABOUT NADOSOLO"
          defaultTitle="“그렇다, 인간은 누구나 솔로다”"
          defaultSub="나도솔로는 타임레프트가 검증한 글로벌 블라인드 소셜 다이닝 구조 위에, 타인의 시선으로 나의 소통과 매너를 객관적으로 발견하는 다면 관찰 메타인지 플랫폼을 결합했습니다."
        />

        <section className="space-y-5 text-sm text-zinc-300 leading-relaxed">
          <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="font-serif-editorial text-xl text-white font-normal">1. 실존적 솔로의 재정의</h2>
            <p>
              ‘솔로’는 연인이 없는 미혼자만을 뜻하지 않습니다. 직장인, 리더, 기혼자 누구나 일상과 조직 밖에서 건강한 외부 소통과 사고의 환기가 필요합니다. 나도솔로는 4대 목적 트랙(변화·교류·취향·인연)을 통해 각자의 자리에 맞는 품격 있는 식탁을 제공합니다.
            </p>
          </div>
          <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="font-serif-editorial text-xl text-white font-normal">2. 직진은 NO! 같은 방향을 바라보다</h2>
            <p>
              사전 프로필 탐색이나 무분별한 1:1 메시지 대신, 도시와 일정만 예약하면 D-1 19:00에 제휴 식당이 공개됩니다. 평가 부담 없이 같은 시간과 공간을 공유한 뒤, 단일 명사 관찰로 서로의 장점을 발견합니다.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/checklist" prefetch={true} className="px-5 py-2.5 bg-[#f04f74] text-sm font-mono text-white font-semibold">
            체크리스트 시작
          </Link>
          <Link href="/meetup" prefetch={true} className="px-5 py-2.5 border border-white/25 text-sm font-mono text-white">
            밋업 일정 보기
          </Link>
        </div>
      </div>
    </main>
  );
}
