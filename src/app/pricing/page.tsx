import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[1050px] mx-auto space-y-12">
        <header className="border-b border-white/10 pb-8 space-y-3">
          <span className="text-xs font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
            TICKETS &amp; PASSES
          </span>
          <h1 className="font-serif-editorial text-3xl sm:text-5xl text-white font-normal">
            참가권 및 이용 구조 안내
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 font-light max-w-2xl">
            온라인 참가비는 알고리즘 매칭·제휴 식당 예약·다면 관찰 리포트 발행 라이선스이며, 음식과 주류는 당일 매장에서 1/N 실비로 직접 결제합니다.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: '1회 참가권',
              tag: 'SINGLE TICKET',
              desc: '원하는 도시와 날짜 슬롯 1회에 참여하고 소셜 리포트를 수령하는 기본권',
              points: ['6인 성향 맞춤 테이블 배정', 'D-1 19:00 제휴 식당 공개', '48시간 전 무료 취소/이월', '다면 관찰 소셜 리포트 발행'],
              highlight: false,
            },
            {
              name: '다회 패스권',
              tag: 'MULTI PASS (준비중)',
              desc: '여러 주에 걸쳐 다양한 사람들과 만나며 시계열 소통 프로필을 쌓는 패스',
              points: ['원하는 회차 자유 선택 예약', '시계열 메타인지 변화 누적', '우선 매칭 & 이월 보호', '동반 +1 초대 연계'],
              highlight: true,
            },
            {
              name: '제휴 · 앰배서더 코드',
              tag: 'PROMO / AFFILIATE',
              desc: '크리에이터·파트너 프로모션 코드 적용 및 보유 이월 참가권 우선 차감',
              points: ['결제창 프로모 코드 즉시 할인', '이월·미달 시 참가권 1매 보존', '어필리에이트 추천 링크 연동', '현장 식음료 1/N 실비 분리'],
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`p-6 border bg-[#0c0d12] flex flex-col justify-between space-y-6 ${
                plan.highlight ? 'border-[#f04f74]/60' : 'border-white/10'
              }`}
            >
              <div className="space-y-4">
                <span className="text-xs font-mono text-[#f04f74]">{plan.tag}</span>
                <h2 className="font-serif-editorial text-2xl text-white font-normal">{plan.name}</h2>
                <p className="text-sm text-zinc-400 font-light leading-relaxed">{plan.desc}</p>
                <ul className="space-y-2 pt-2 border-t border-white/10 text-sm text-zinc-300">
                  {plan.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#f04f74] shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/meetup"
                prefetch={true}
                className="w-full py-3 border border-white/25 bg-white/10 hover:bg-white/20 text-white text-sm font-mono font-semibold flex items-center justify-center gap-2"
              >
                <span>밋업 예약</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
