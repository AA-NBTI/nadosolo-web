import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[860px] mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6 space-y-2">
          <span className="text-xs font-mono tracking-widest text-[#f04f74] uppercase">TERMS OF SERVICE</span>
          <h1 className="font-serif-editorial text-3xl text-white font-normal">이용약관 및 취소·환불 규정</h1>
          <p className="text-sm text-zinc-400">템바보드 주식회사 · 나도솔로(NadoSolo)</p>
        </header>

        <section className="space-y-6 text-sm text-zinc-300 leading-relaxed">
          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">제1조 (서비스 본질 및 결제 범위)</h2>
            <p>
              나도솔로의 온라인 참가비는 오프라인 소셜 다이닝 매칭, 제휴 식당 예약, 다면 관찰 엔진 라이선스 및 메타인지 소셜 리포트 발행 비용입니다. 식당에서 주문하는 음식·주류 비용은 당일 현장에서 참가자 간 1/N 실비로 직접 결제하며, 회사는 식음료 대금을 수취하지 않습니다.
            </p>
          </div>

          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">제2조 (취소 · 이월 · 인원 미달 규정)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>모임 시작 48시간 이전 취소/이월: 100% 무료 취소 또는 다음 회차 참가권 1매 자동 보존</li>
              <li>모임 시작 24~48시간 이전: 일정 이월 시 참가권 1매 보존, 단순 취소 시 규정 수수료 적용 가능</li>
              <li>모임 시작 24시간 이내 취소 및 노쇼(무단 불참): 당일 예약 확정 좌석 보호를 위해 참가권 미보존 및 누적 시 이용 제한</li>
              <li>인원 미달 또는 제휴 식당 조건 미충족 시: 전액 자동 환불 또는 다음 회차 우선 참가권 보존</li>
            </ul>
          </div>

          <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-2">
            <h2 className="text-white font-semibold">제3조 (블라인드 매칭 및 D-1 공개)</h2>
            <p>
              회원은 도시와 일정 슬롯을 선택해 예약하며, 배정된 제휴 식당과 동석자 힌트(직군·연령대)는 모임 전날(D-1) 19:00에 비공개 공개됩니다. 모임 전 동석자 간 1:1 연락은 원천 차단됩니다.
            </p>
          </div>
        </section>

        <div className="pt-4 flex gap-3">
          <Link href="/" prefetch={true} className="px-4 py-2 border border-white/20 text-sm font-mono text-white">
            홈
          </Link>
          <Link href="/meetup" prefetch={true} className="px-4 py-2 bg-[#f04f74] text-sm font-mono text-white font-semibold">
            일정 예약
          </Link>
        </div>
      </div>
    </main>
  );
}
