'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface TestItem {
  id: string;
  badge: string;
  title: string;
  timeEstimate: string;
  questionCount: string;
  desc: string;
  features: string[];
  route: string;
  buttonLabel: string;
}

const TEST_LIST: TestItem[] = [
  {
    id: 'solotest-v1',
    badge: '순간과 결',
    title: '1분 솔로테스트',
    timeEstimate: '약 1분',
    questionCount: '8문항',
    desc: '나는 어떤 순간에 혼자라고 느끼며, 식탁에서 어떤 대화 결을 지닌 사람일까요?',
    features: [
      '일상의 6가지 순간과 나만의 대화 스타일 확인',
      '가입 없이 1분 만에 부담 없이 참여',
      '결과에 어울리는 추천 테마 식탁 확인',
    ],
    route: '/solotest',
    buttonLabel: '솔로테스트 시작',
  },
  {
    id: 'loneliness-9',
    badge: '관계와 연결',
    title: '외로움 유형 테스트',
    timeEstimate: '약 1.5분',
    questionCount: '9문항',
    desc: '요즘 내 마음에 필요한 연결은 속마음일까요, 함께할 일상일까요?',
    features: [
      '정서적 연결과 사회적 연결의 필요를 담백하게 성찰',
      '일상에서 혼자 가볍게 시도해 볼 수 있는 작은 행동 안내',
      '모임 강요 없이 다양한 연결 방식과 상담 안내 제공',
    ],
    route: '/test/loneliness',
    buttonLabel: '외로움 유형 테스트 시작',
  },
];

export default function SoloTestHubPage() {
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (openIds.length === TEST_LIST.length) {
      setOpenIds([]);
    } else {
      setOpenIds(TEST_LIST.map((item) => item.id));
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans selection:bg-[#f04f74] selection:text-white">
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 sm:px-8 py-10 sm:py-16 space-y-8">
        {/* 상단 컨트롤 바 */}
        <section className="p-5 sm:p-6 border border-white/10 bg-[#0c0d12] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <h1 className="font-serif-editorial text-2xl sm:text-3xl font-normal text-white">
                솔로테스트 모음
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono border border-white/10 bg-white/5 text-zinc-400">
                {TEST_LIST.length}개 테스트
              </span>
              <button
                type="button"
                onClick={handleToggleAll}
                className="px-2.5 py-1 text-xs font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                {openIds.length === TEST_LIST.length ? '전체 접기' : '전체 펼치기'}
              </button>
            </div>
          </div>

          <p className="text-sm text-zinc-300 font-light leading-relaxed">
            나를 돌아보고 가볍게 공감할 수 있는 테스트입니다. 편안한 마음으로 시작해 보세요.
          </p>
        </section>

        {/* 2열 컴팩트 그리드 (닫힘 ➔ 클릭 시 열림) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {TEST_LIST.map((item) => {
            const isOpen = openIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`border transition-all duration-200 bg-[#0c0d12] ${
                  isOpen
                    ? 'border-white/30 shadow-xl'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* 닫힌 기본 헤더 바 */}
                <button
                  type="button"
                  onClick={() => toggleOpen(item.id)}
                  className="w-full text-left p-5 flex items-start justify-between gap-3 cursor-pointer group select-none"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono border border-white/10 bg-white/5 text-zinc-300">
                        <span>{item.badge}</span>
                      </span>

                      <span className="text-xs font-mono text-zinc-400">
                        {item.timeEstimate} · {item.questionCount}
                      </span>
                    </div>

                    <h2 className="font-serif-editorial text-lg sm:text-xl font-normal text-white group-hover:text-zinc-200 transition-colors">
                      {item.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 group-hover:text-white shrink-0 pt-1">
                    <span>{isOpen ? '접기' : '상세보기'}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                    )}
                  </div>
                </button>

                {/* 클릭 시 열리는 상세 영역 */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/10 animate-in fade-in duration-200">
                    <p className="text-sm text-zinc-200 font-light leading-relaxed pt-2">
                      {item.desc}
                    </p>

                    <div className="p-3.5 bg-[#08090d] border border-white/10 space-y-1.5 text-xs font-light text-zinc-300 leading-relaxed">
                      {item.features.map((ft, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-[#f04f74] font-mono shrink-0">✓</span>
                          <span>{ft}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1">
                      <Link
                        href={item.route}
                        className="w-full py-3 text-sm font-mono font-medium flex items-center justify-center gap-2 bg-[#f04f74] hover:bg-[#d93a5e] text-white transition-all cursor-pointer shadow-lg shadow-[#f04f74]/20"
                      >
                        <span>{item.buttonLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* 하단 담백한 안내 */}
        <section className="p-5 border border-white/10 bg-[#08090d] space-y-1.5 text-xs font-mono text-zinc-400 leading-relaxed">
          <p>• 가입 없이 브라우저에서 진행되며, 응답은 외부에 공개되지 않습니다.</p>
          <p>• 이 테스트는 진단이나 평가가 아니며, 공감과 자기 성찰을 위한 가벼운 테스트입니다.</p>
        </section>
      </main>
    </div>
  );
}
