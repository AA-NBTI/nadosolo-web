import React from 'react';
import Link from 'next/link';
import CmsPageHeader from '@/components/CmsPageHeader';

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[860px] mx-auto space-y-8">
        <CmsPageHeader
          pageId="PAGE_SAFETY"
          defaultBadge="SAFETY & COMMUNITY"
          defaultTitle="안전 및 커뮤니티 가이드라인"
          defaultSub="낯선 사람과의 오프라인 식사가 가장 안전하도록 설계된 5대 안전 장치"
        />

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">1. 공공 제휴 식당 100% 원칙</h2>
            <p>모든 모임은 사전에 검증된 공공 제휴 레스토랑 및 비스트로에서만 진행되며, 사적 공간이나 개인 장소에서의 모임을 금지합니다.</p>
          </div>
          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">2. 모임 전 1:1 DM 원천 차단</h2>
            <p>D-1 19:00 식당 공개 전까지 동석자의 사진·연락처·개별 채팅을 일절 열지 않아 사전 추근덕거림이나 선입견을 막습니다.</p>
          </div>
          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">3. 기혼자 ↔ 인연 트랙 자동 격리</h2>
            <p>기혼·연애 중 회원은 변화·교류·취향 트랙만 참여할 수 있으며, 인연(ROMANCE) 트랙 진입은 엔진 단에서 자동 차단됩니다.</p>
          </div>
          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">4. 노쇼 제재 &amp; 영구 재매칭 차단</h2>
            <p>모임 후 대시보드에서 결석자(노쇼) 신고 및 불편 상대 차단을 등록하면, 이후 모든 회차에서 영구적으로 같은 테이블에 배정되지 않습니다.</p>
          </div>
        </section>

        <div className="pt-4 flex gap-3">
          <Link href="/meetup" prefetch={true} className="px-5 py-2.5 bg-[#f04f74] text-sm font-mono text-white font-semibold">
            일정 예약
          </Link>
          <Link href="/guide" prefetch={true} className="px-5 py-2.5 border border-white/20 text-sm font-mono text-white">
            이용 안내
          </Link>
        </div>
      </div>
    </main>
  );
}
