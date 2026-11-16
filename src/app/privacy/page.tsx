import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[860px] mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6 space-y-2">
          <span className="text-xs font-mono tracking-widest text-[#f04f74] uppercase">PRIVACY POLICY</span>
          <h1 className="font-serif-editorial text-3xl text-white font-normal">개인정보처리방침</h1>
          <p className="text-sm text-zinc-400">템바보드 주식회사 · 나도솔로(NadoSolo)</p>
        </header>

        <section className="space-y-6 text-sm text-zinc-300 leading-relaxed">
          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">1. 수집 및 이용 항목</h2>
            <p>
              회사는 매칭과 본인 확인을 위해 닉네임, 성별, 출생연도, 연락처, 거주/희망 지역, 식단 제한, 성향 퀴즈 응답을 수집합니다. 실명·연락처·정확한 거주 주소는 동석자에게 절대 노출되지 않습니다.
            </p>
          </div>

          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">2. 상호주의 다면 관찰 데이터 보호</h2>
            <p>
              모임 후 입력되는 단일 명사 관찰 평가는 1:1 평가자가 누구인지 절대 공개되지 않으며, 전체 동석자 평균 집계 지표로만 본인 리포트에 반영됩니다.
            </p>
          </div>

          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">3. 영구 재매칭 차단 및 파기</h2>
            <p>
              불편 신고 또는 노쇼로 등록된 차단 기록(user_blocks)은 두 회원이 향후 동일 테이블에 배정되지 않도록 안전 필터링 목적으로만 사용되며, 회원 탈퇴 시 관련 법령에 따른 보관 기간을 제외하고 지체 없이 파기합니다.
            </p>
          </div>
        </section>

        <div className="pt-4 flex gap-3">
          <Link href="/" prefetch={true} className="px-4 py-2 border border-white/20 text-sm font-mono text-white">
            홈
          </Link>
          <Link href="/safety" prefetch={true} className="px-4 py-2 border border-white/20 text-sm font-mono text-white">
            안전 가이드
          </Link>
        </div>
      </div>
    </main>
  );
}
