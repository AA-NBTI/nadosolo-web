import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import CmsPageHeader from '@/components/CmsPageHeader';

const PRICING_PLANS = [
  {
    tickets: 1,
    name: '1회 체험권',
    tag: 'SINGLE · 1회',
    priceText: '₩30,000',
    perUnitText: '회당 ₩30,000',
    desc: '원하는 도시와 날짜 슬롯 1회에 참여하고 다면 관찰 소셜 리포트를 수령하는 기본권',
    points: [
      '6인 성향 맞춤 블라인드 테이블 배정',
      'D-1 19:00 제휴 식당 비공개 공개',
      '48시간 전 무료 취소 및 이월 보호',
      '단일 명사 다면 관찰 소셜 리포트 발행',
    ],
    highlight: false,
    ctaLabel: '1회권으로 예약',
  },
  {
    tickets: 2,
    name: '2회 체험권',
    tag: 'DOUBLE · 17% 혜택',
    priceText: '₩50,000',
    perUnitText: '회당 ₩25,000',
    desc: '두 번의 다른 식탁을 경험하며 내 소통 스타일의 일관성과 변화를 비교하는 패스',
    points: [
      '이번 모임 1회 예약 + 잔여 1회 지갑 적립',
      '2회 누적 시계열 소셜 프로필 비교',
      '48시간 전 무료 취소 및 이월 보호',
      '원하는 날짜·도시 슬롯 자유 선택',
    ],
    highlight: false,
    ctaLabel: '2회권으로 예약',
  },
  {
    tickets: 3,
    name: '세번은 만나봐야',
    tag: 'BEST · 33% 혜택',
    priceText: '₩60,000',
    perUnitText: '회당 ₩20,000',
    desc: '세 번의 식탁을 거치며 내 소통 역량과 매너의 성장 곡선을 완성하는 가장 인기 있는 세트',
    points: [
      '이번 모임 1회 예약 + 잔여 2회 지갑 자동 적립',
      '3회 누적 시계열 메타인지 리포트 완성',
      '우선 매칭 배정 및 이월 참가권 무제한 보존',
      '1회권 대비 총 ₩30,000 혜택 적용',
    ],
    highlight: true,
    ctaLabel: '세번은 만나봐야 예약',
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[1050px] mx-auto space-y-12">
        <CmsPageHeader
          pageId="PAGE_PRICING"
          defaultBadge="TICKETS & SETS"
          defaultTitle="참가권 및 세트 요금 안내"
          defaultSub="온라인 참가비는 알고리즘 매칭·제휴 식당 예약·다면 관찰 리포트 발행 라이선스이며, 음식과 주류는 당일 매장에서 1/N 실비로 직접 결제합니다."
        />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`p-6 border bg-[#0c0d12] flex flex-col justify-between space-y-6 ${
                plan.highlight ? 'border-[#f04f74]/70 shadow-lg shadow-[#f04f74]/10' : 'border-white/10'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-[#f04f74] font-semibold">{plan.tag}</span>
                  {plan.highlight && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f04f74] text-white text-[11px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      <span>추천</span>
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="font-serif-editorial text-2xl text-white font-normal">{plan.name}</h2>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white font-mono">{plan.priceText}</span>
                    <span className="text-xs text-zinc-400 font-mono">({plan.perUnitText})</span>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 font-light leading-relaxed">{plan.desc}</p>

                <ul className="space-y-2.5 pt-3 border-t border-white/10 text-sm text-zinc-300">
                  {plan.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#f04f74] shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={`/meetup?tickets=${plan.tickets}`}
                prefetch={true}
                className={`w-full py-3.5 text-sm font-mono font-semibold flex items-center justify-center gap-2 transition-colors ${
                  plan.highlight
                    ? 'bg-[#f04f74] hover:bg-[#d93a5e] text-white'
                    : 'border border-white/25 bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span>{plan.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </section>

        <section className="p-6 border border-white/10 bg-[#0c0d12] space-y-2">
          <h3 className="text-sm font-mono font-semibold text-white">다회권 이용 및 환불 기준 안내</h3>
          <ul className="text-sm text-zinc-400 space-y-1 list-disc pl-4 leading-relaxed">
            <li>「세번은 만나봐야(3회권)」 등 다회권 중도 환불 시 기이용 회차는 <strong className="text-zinc-200">1회 정상가(₩30,000) 기준</strong>으로 차감 후 환불됩니다.</li>
            <li>2회 만남 이용(초과) 시 잔여 <strong className="text-zinc-200">마지막 1회 혜택권은 환불 불가</strong> 조건이 적용됩니다. (48시간 전 일정 변경·이월은 가능)</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
