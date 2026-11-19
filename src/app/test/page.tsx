'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Heart,
  CheckCircle2,
  Users,
  Compass,
  Clock,
  HelpCircle,
} from 'lucide-react';
import GlobalHeader from '@/components/GlobalHeader';

interface TestItem {
  id: string;
  badge: string;
  badgePoint?: boolean;
  title: string;
  timeEstimate: string;
  questionCount: string;
  targetAudience: string;
  purpose: string;
  features: string[];
  route: string;
  buttonLabel: string;
}

const TEST_HUB_LIST: TestItem[] = [
  {
    id: 'solotest-v1',
    badge: '재미 & 입구 훅',
    badgePoint: true,
    title: '1분 솔로테스트 (순간과 결)',
    timeEstimate: '약 1분',
    questionCount: '8문항',
    targetAudience: '나도솔로를 처음 방문한 모든 사람',
    purpose: '나는 어떤 순간에 혼자라고 느끼며, 식탁에서 어떤 결의 동석자인가?',
    features: [
      '6가지 순간 맥락(퇴근 후, 사람 속, 새동네 등) × 5가지 결(분위기메이커, 맞장구장인 등)',
      '점수·지수 없는 100% 공감과 재미 중심',
      '결과에 맞는 추천 테마 방 및 이번 주 열린 식탁 바로 매칭',
    ],
    route: '/solotest',
    buttonLabel: '솔로테스트 시작',
  },
  {
    id: 'loneliness-9',
    badge: '심리 공감 & 성찰',
    badgePoint: false,
    title: '외로움 유형 테스트 (정서와 사회)',
    timeEstimate: '약 1.5분',
    questionCount: '9문항',
    targetAudience: '요즘 관계와 마음에 허전함을 느끼는 사람',
    purpose: '내게 지금 아쉬운 건 속마음 나눌 한 사람일까, 어울릴 여러 사람일까?',
    features: [
      'Hughes 3문항(빈도) + De Jong Gierveld 6문항(정서/사회 유형) 조합',
      '4가지 유형(닿아있음, 마음 나눌 한 사람, 어울릴 다수, 먼 시기) 정직한 피드백',
      '모임 강요 없이 일상의 작은 행동 3가지와 공공 전문상담 다각도 안내',
    ],
    route: '/test/loneliness',
    buttonLabel: '외로움 유형 테스트 시작',
  },
  {
    id: 'matching-checklist',
    badge: '모임 예약 필수',
    badgePoint: false,
    title: '2단계 테이블 매칭 체크리스트',
    timeEstimate: '약 2~3분',
    questionCount: '36문항 (사전 8 + 심층 24 + 컨디션 4)',
    targetAudience: '실제 6인 소셜 다이닝 참가를 앞둔 예약자',
    purpose: '타임레프트 공인 Big Five 성향 및 가치관 정밀 분석으로 6인 테이블 자동 배정',
    features: [
      '대화 목적, 깊이, 테마, 에너지 4대 동적 축 정밀 산출',
      '식단 제약(비건, 못 먹는 음식) 및 희망 생활권, 예산 완벽 동기화',
      '완료 후 D-1 화요일 18:00에 나와 가장 결이 맞는 6인 테이블 자동 확정',
    ],
    route: '/checklist',
    buttonLabel: '체크리스트 작성',
  },
  {
    id: 'social-mirror',
    badge: '모임 사후 본질 BM',
    badgePoint: false,
    title: '소셜 다면 관찰 거울 (Social Mirror)',
    timeEstimate: '모임 종료 후 1분',
    questionCount: '단일 명사 1요소 (경청, 질문, 배려, 시선 등)',
    targetAudience: '6인 다이닝 식사를 마친 현장 참가자 전원',
    purpose: '타인의 시선으로 나의 소통 역량과 매너를 다면 관찰받는 메타인지 피드백',
    features: [
      '상호주의 해금 원칙: 내가 동석자 관찰을 마쳐야 내 리포트 잠금 해제',
      '절대 익명성: 1:1 점수 비공개 및 가중 평균 레이더 차트 발행',
      '누적 시계열 아카이빙으로 나의 소통 자산 형성',
    ],
    route: '/dashboard',
    buttonLabel: '내 대시보드 보기',
  },
];

export default function TestHubPage() {
  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans selection:bg-[#f04f74] selection:text-white">
      <GlobalHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-10">
        {/* 상단 컨트롤 바 헤더 (표준 테두리 박스 컨테이너 규격 준수) */}
        <section className="p-6 border border-white/10 bg-[#0c0d12] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <h1 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white">
                나도솔로 테스트 & 진단 허브
              </h1>
            </div>
            <span className="px-2.5 py-1 text-xs font-mono border border-white/10 bg-white/5 text-zinc-400">
              총 4종 테스트 라인업
            </span>
          </div>

          <p className="text-sm text-zinc-300 font-light leading-relaxed max-w-2xl">
            가벼운 공감 퀴즈부터 학술 척도 기반의 외로움 성찰, 실제 3:3 테이블 매칭 엔진, 그리고 모임 후 다면 관찰 피드백까지 — 나에게 맞는 테스트를 자유롭게 선택해 보세요.
          </p>
        </section>

        {/* 2열 컴팩트 그리드 (관리자 및 유저 2-Column Compact Grid 철칙 준수) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEST_HUB_LIST.map((item) => (
            <div
              key={item.id}
              className="p-6 border border-white/10 bg-[#0c0d12] hover:border-white/20 transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* 상단 배지 & 소요 시간 */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono border ${
                      item.badgePoint
                        ? 'border-[#f04f74]/40 bg-[#f04f74]/15 text-white'
                        : 'border-white/10 bg-white/5 text-zinc-300'
                    }`}
                  >
                    {item.badgePoint && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    )}
                    <span>{item.badge}</span>
                  </span>

                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.timeEstimate}</span>
                    <span>•</span>
                    <span>{item.questionCount}</span>
                  </div>
                </div>

                {/* 타이틀 및 목적 */}
                <div className="space-y-1.5">
                  <h2 className="font-serif-editorial text-xl sm:text-2xl font-normal text-white">
                    {item.title}
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    대상: {item.targetAudience}
                  </p>
                  <p className="text-sm text-zinc-200 font-light leading-relaxed pt-1">
                    {item.purpose}
                  </p>
                </div>

                {/* 핵심 특징 리스트 */}
                <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs font-light text-zinc-300 leading-relaxed">
                  {item.features.map((ft, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#f04f74] font-mono shrink-0">✓</span>
                      <span>{ft}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 CTA 버튼 */}
              <div className="pt-2">
                <Link
                  href={item.route}
                  className={`w-full py-3.5 text-sm font-mono font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    item.badgePoint
                      ? 'bg-[#f04f74] hover:bg-[#d93a5e] text-white shadow-lg shadow-[#f04f74]/20'
                      : 'border border-white/20 bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  <span>{item.buttonLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* 하단 운영 원칙 안내 */}
        <section className="p-6 border border-white/10 bg-[#08090d] space-y-2 text-xs font-mono text-zinc-400 leading-relaxed">
          <span className="text-white font-semibold block">나도솔로 테스트 운영 원칙</span>
          <p>• 입구 테스트(솔로테스트, 외로움 유형)는 점수/지수를 사용자에게 노출하지 않으며, 단정이 아닌 공감과 재미를 목적으로 합니다.</p>
          <p>• 가입 없이 브라우저에서 진행되며, 다른 사용자에게 응답이 공개되지 않습니다.</p>
          <p>• 실제 테이블 매칭 배정은 오직 예약 후 진행되는 정규 체크리스트(36문항) 데이터만 사용됩니다.</p>
        </section>
      </main>
    </div>
  );
}
