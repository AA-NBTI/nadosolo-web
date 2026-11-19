'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  RotateCcw,
  Sparkles,
  Check,
  ShieldAlert,
  Heart,
  Phone,
  ArrowRight,
  Share2,
  Copy,
  Eye,
  Sliders,
  Layers,
} from 'lucide-react';
import {
  UCLA_QUESTIONS,
  UCLA_TYPES,
  UCLA_DOMAIN_DETAILS,
  UCLATypeCode,
  UCLALonelinessDomain,
  UCLAScoringOutput,
  computeUCLAResult,
  UCLA_COUNSELING_HOTLINES,
} from '@/lib/solotest/uclaData';
import {
  LONELINESS_QUESTIONS,
  LONELINESS_TYPES,
  LonelinessTypeCode,
  LonelinessScoringOutput,
  computeLonelinessResult,
  COUNSELING_HOTLINES,
} from '@/lib/solotest/lonelinessData';
import {
  SOLOTEST_QUESTIONS,
  SOLOTEST_COPY,
  ContextResultCopy,
  StyleResultCopy,
  ThemeResultCopy,
} from '@/lib/solotest/data';

interface AdminTestAnalyticsManagerProps {
  isLight?: boolean;
  onNotify?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

type SelectedTestKey = 'UCLA_20' | 'LONELINESS_9' | 'SOLO_8';

export default function AdminTestAnalyticsManager({
  isLight = false,
  onNotify,
}: AdminTestAnalyticsManagerProps) {
  // 선택된 테스트
  const [activeTest, setActiveTest] = useState<SelectedTestKey>('UCLA_20');

  // 1. UCLA 테스트 프리뷰 상태
  const [uclaType, setUclaType] = useState<UCLATypeCode>('B');
  const [uclaTopDomain, setUclaTopDomain] = useState<UCLALonelinessDomain>('intimacy');

  // 2. 9문항 외로움 테스트 프리뷰 상태
  const [lonelinessType, setLonelinessType] = useState<LonelinessTypeCode>('C');

  // 3. 1분 솔로테스트 프리뷰 상태
  const [soloContext, setSoloContext] = useState<string>('after_work');
  const [soloStyle, setSoloStyle] = useState<string>('mood');
  const [soloNeed, setSoloNeed] = useState<string>('wide');

  // UCLA 결과 객체 생성
  const currentUCLAResult: UCLAScoringOutput = useMemo(() => {
    // 유형별 대표 점수 (A: 26점 / B: 42점 / C: 58점 / D: 74점)
    const targetRaw =
      uclaType === 'A' ? 26 : uclaType === 'B' ? 42 : uclaType === 'C' ? 58 : 74;

    const dummyAnswers: Record<string, number> = {};
    const avgScore = targetRaw / 20;

    UCLA_QUESTIONS.forEach((q) => {
      let val = Math.round(avgScore);
      // 선택된 결핍 도메인의 문항은 약간 높게 부여
      if (q.domain === uclaTopDomain) {
        val = Math.min(4, val + 1);
      }
      val = Math.max(1, Math.min(4, val));
      dummyAnswers[q.id] = q.isReverse ? 5 - val : val;
    });

    return computeUCLAResult(dummyAnswers);
  }, [uclaType, uclaTopDomain]);

  // 9문항 결과 객체 생성
  const currentLonelinessResult: LonelinessScoringOutput = useMemo(() => {
    const dummyAnswers: Record<string, number> = {};
    // 파트 1 정도
    dummyAnswers.L1 = lonelinessType === 'D' ? 3 : lonelinessType === 'A' ? 1 : 2;
    dummyAnswers.L2 = dummyAnswers.L1;
    dummyAnswers.L3 = dummyAnswers.L1;

    // 파트 2 정서/사회
    if (lonelinessType === 'A') {
      dummyAnswers.L4 = 0; dummyAnswers.L5 = 0; dummyAnswers.L6 = 0;
      dummyAnswers.L7 = 0; dummyAnswers.L8 = 0; dummyAnswers.L9 = 0;
    } else if (lonelinessType === 'B') {
      dummyAnswers.L4 = 1; dummyAnswers.L5 = 1; dummyAnswers.L6 = 0;
      dummyAnswers.L7 = 0; dummyAnswers.L8 = 0; dummyAnswers.L9 = 0;
    } else if (lonelinessType === 'C') {
      dummyAnswers.L4 = 0; dummyAnswers.L5 = 0; dummyAnswers.L6 = 0;
      dummyAnswers.L7 = 1; dummyAnswers.L8 = 1; dummyAnswers.L9 = 1;
    } else {
      dummyAnswers.L4 = 1; dummyAnswers.L5 = 1; dummyAnswers.L6 = 1;
      dummyAnswers.L7 = 1; dummyAnswers.L8 = 1; dummyAnswers.L9 = 1;
    }

    return computeLonelinessResult(dummyAnswers);
  }, [lonelinessType]);

  const activeLonelinessInfo = LONELINESS_TYPES[lonelinessType];
  const activeSoloContextCopy = SOLOTEST_COPY.context[soloContext] || SOLOTEST_COPY.context.after_work;
  const activeSoloStyleCopy = SOLOTEST_COPY.style[soloStyle] || SOLOTEST_COPY.style.mood;
  const activeSoloNeedCopy = SOLOTEST_COPY.need[soloNeed] || SOLOTEST_COPY.need.wide;

  return (
    <div className="space-y-5">
      {/* 1. 상단 컨트롤 바 */}
      <section className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h1 className="font-serif-editorial text-lg text-white font-normal">
            진단테스트 결과 화면 뷰어
          </h1>
          <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
            사용자 실물 화면 열람
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <Link
            href="/test"
            target="_blank"
            className="px-2.5 py-1 border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>허브 열기</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        </div>
      </section>

      {/* 2. 테스트 선택 상단 탭 (3대 테스트 1클릭 전환) */}
      <div className="flex border border-white/10 bg-[#0c0d12] p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTest('UCLA_20')}
          className={`flex-1 py-2.5 px-3 text-sm font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTest === 'UCLA_20'
              ? 'bg-white/15 text-white font-bold border border-white/20 shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <span>1. UCLA 외로움 척도 (20문항)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTest('LONELINESS_9')}
          className={`flex-1 py-2.5 px-3 text-sm font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTest === 'LONELINESS_9'
              ? 'bg-white/15 text-white font-bold border border-white/20 shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <span>2. 외로움 유형 테스트 (9문항)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTest('SOLO_8')}
          className={`flex-1 py-2.5 px-3 text-sm font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTest === 'SOLO_8'
              ? 'bg-white/15 text-white font-bold border border-white/20 shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <span>3. 1분 솔로테스트 (8문항)</span>
        </button>
      </div>

      {/* 3. 각 테스트별 결과 유형 전환 컨트롤 바 */}
      <div className="p-4 bg-[#0c0d12] border border-white/10 space-y-3">
        {activeTest === 'UCLA_20' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <span className="text-sm font-medium text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#f04f74]" />
                <span>열람할 외로움 유형 선택:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { code: 'A', name: '유형 A. 건강한 독립형', scoreRange: '0~25점' },
                  { code: 'B', name: '유형 B. 새로운 자극 탐색형', scoreRange: '26~50점' },
                  { code: 'C', name: '유형 C. 군중 속의 고독형', scoreRange: '51~75점' },
                  { code: 'D', name: '유형 D. 관계 에너지 방전형', scoreRange: '76~100점' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setUclaType(item.code as UCLATypeCode)}
                    className={`px-3 py-1.5 text-xs font-mono border transition-all cursor-pointer ${
                      uclaType === item.code
                        ? 'border-white bg-white/20 text-white font-bold shadow'
                        : 'border-white/10 bg-[#08090d] text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-zinc-500 ml-1">({item.scoreRange})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-zinc-400">
              <span>1순위 결핍 영역 전환:</span>
              <div className="flex gap-1.5">
                {[
                  { key: 'intimacy', label: '정서적 친밀감 결핍' },
                  { key: 'belonging', label: '사회적 소속감 결핍' },
                  { key: 'isolation', label: '관계적 고립감 결핍' },
                ].map((dom) => (
                  <button
                    key={dom.key}
                    type="button"
                    onClick={() => setUclaTopDomain(dom.key as UCLALonelinessDomain)}
                    className={`px-2.5 py-1 border transition-all cursor-pointer ${
                      uclaTopDomain === dom.key
                        ? 'border-white bg-white/15 text-white font-semibold'
                        : 'border-white/10 bg-[#08090d] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {dom.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTest === 'LONELINESS_9' && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#f04f74]" />
              <span>열람할 4대 연결 유형 선택:</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { code: 'A', name: '유형 A (충분한 연결)' },
                { code: 'B', name: '유형 B (마음 나눌 사람 그리움)' },
                { code: 'C', name: '유형 C (어울릴 사람 그리움)' },
                { code: 'D', name: '유형 D (전반적 연결 멈춤)' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLonelinessType(item.code as LonelinessTypeCode)}
                  className={`p-2.5 text-xs font-mono border text-left transition-all cursor-pointer ${
                    lonelinessType === item.code
                      ? 'border-white bg-white/20 text-white font-bold shadow'
                      : 'border-white/10 bg-[#08090d] text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="block font-bold">{item.code}</span>
                  <span className="text-zinc-300 truncate block">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTest === 'SOLO_8' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-zinc-400 block">1. 솔로의 순간 (맥락 6종):</span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-xs font-mono">
                {Object.entries(SOLOTEST_COPY.context).map(([k, c]: [string, ContextResultCopy]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSoloContext(k)}
                    className={`p-2 border text-center transition-colors cursor-pointer ${
                      soloContext === k
                        ? 'border-white bg-white/20 text-white font-bold'
                        : 'border-white/10 bg-[#08090d] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono text-zinc-400 block">2. 대화의 결 (5종):</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-mono">
                {Object.entries(SOLOTEST_COPY.style).map(([k, s]: [string, StyleResultCopy]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSoloStyle(k)}
                    className={`p-2 border text-center transition-colors cursor-pointer ${
                      soloStyle === k
                        ? 'border-white bg-white/20 text-white font-bold'
                        : 'border-white/10 bg-[#08090d] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. 사용자가 실제로 보게 되는 실물 결과 화면 (Real Preview Frame) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <strong className="text-white font-medium">사용자 실제 결과 화면 렌더링 프레임</strong>
          </span>
          <span>모바일/데스크톱 100% 동일 출력</span>
        </div>

        {/* ========================================================
            4-1. UCLA 20문항 실제 결과 화면
            ======================================================== */}
        {activeTest === 'UCLA_20' && (
          <div className="border border-white/20 bg-[#07080a] p-5 sm:p-8 space-y-8 max-w-2xl mx-auto shadow-2xl">
            {/* 고위험/방전형 시 상단 배너 */}
            {currentUCLAResult.hasCrisisFlag && (
              <div className="p-4 border border-white/20 bg-white/5 space-y-2">
                <div className="flex items-center gap-2 text-white font-medium text-sm">
                  <ShieldAlert className="w-4 h-4 text-[#f04f74]" />
                  <span>마음이 버거울 때는 언제든 도움을 요청하세요</span>
                </div>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">
                  사회적 연결감이 크게 방전되어 혼자 견디기 힘든 상태일 수 있습니다. 언제든 무료로 이야기 나눌 수 있는 전문 공공 상담 전화가 큰 힘이 됩니다.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono">
                  {UCLA_COUNSELING_HOTLINES.map((h) => (
                    <div key={h.tel} className="p-2 bg-[#0c0d12] border border-white/10 text-center">
                      <span className="text-zinc-400 block text-[11px]">{h.name}</span>
                      <span className="text-white font-bold block">{h.tel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 상단 점수 카드 */}
            <div className="bg-[#0c0d12] border border-white/15 p-6 space-y-5">
              <div className="space-y-3 border-b border-white/10 pb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <span>UCLA 척도 표준 진단 결과</span>
                  </span>
                  <span className="px-2.5 py-1 text-xs font-mono border border-white/20 bg-white/5 text-zinc-200">
                    {currentUCLAResult.typeInfo.grade}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-xs font-mono text-zinc-400 mb-1">나의 외로움 지수</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-mono font-bold text-white">
                      {currentUCLAResult.finalScore}
                    </span>
                    <span className="text-sm font-mono text-zinc-400">/ 100점</span>
                    <span className="text-xs font-mono text-zinc-500 ml-2">
                      (원점수: {currentUCLAResult.rawScore}점)
                    </span>
                  </div>
                </div>

                <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal pt-1">
                  {currentUCLAResult.typeInfo.name}
                </h2>
                <p className="text-sm sm:text-base text-zinc-200 font-light leading-relaxed">
                  {currentUCLAResult.typeInfo.message}
                </p>
              </div>

              {/* 핵심 처방 가이드 */}
              <div className="p-4 bg-[#08090d] border border-white/10 space-y-1">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#f04f74]" />
                  <span>심리학적 처방 가이드</span>
                </span>
                <p className="text-sm text-zinc-200 font-light leading-relaxed">
                  {currentUCLAResult.typeInfo.prescription}
                </p>
              </div>

              {/* 오늘 실천할 수 있는 작은 일 3가지 */}
              <div className="space-y-2.5">
                <span className="text-xs font-mono text-white font-medium flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#f04f74]" />
                  <span>오늘 해 볼 수 있는 작은 행동 3가지</span>
                </span>
                <div className="space-y-2">
                  {currentUCLAResult.typeInfo.dailyActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/[0.02] border border-white/10 text-sm text-zinc-300 flex items-start gap-2.5"
                    >
                      <span className="text-zinc-500 font-mono shrink-0">{idx + 1}.</span>
                      <span className="font-light leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 중단: 3대 하위 차원 심층 분석 & 1순위 결핍 영역 */}
            <div className="bg-[#0c0d12] border border-white/15 p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-mono text-zinc-400 block">3대 하위 차원 심층 분석</span>
                <h3 className="font-serif-editorial text-xl text-white font-normal">
                  관계 만족도 및 결핍 지표
                </h3>
              </div>

              <div className="space-y-3.5 pt-1">
                {Object.values(currentUCLAResult.domains).map((dom) => (
                  <div key={dom.domain} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-200">{dom.label}</span>
                      <span className="text-zinc-400">
                        {dom.score100}점 <span className="text-zinc-600">/ 100</span> (평균 {dom.avgScore}점)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-zinc-300 transition-all duration-300"
                        style={{ width: `${dom.score100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 1순위 결핍 영역 맞춤 리포트 */}
              <div className="p-4 bg-[#08090d] border border-white/10 space-y-2.5 mt-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-mono text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <span>
                      1순위 결핍 영역: {currentUCLAResult.topDeficitDomain.label} ({currentUCLAResult.topDeficitDomain.score100}점)
                    </span>
                  </span>
                  <span className="text-xs font-mono text-zinc-500">집중 케어 필요</span>
                </div>

                <div className="space-y-1.5 text-xs sm:text-sm font-light text-zinc-300 leading-relaxed">
                  <p>
                    <strong className="text-white font-medium">심리학적 해석: </strong>
                    {currentUCLAResult.topDeficitDomain.interpretation}
                  </p>
                  <p>
                    <strong className="text-white font-medium">일상 속 처방: </strong>
                    {currentUCLAResult.topDeficitDomain.prescription}
                  </p>
                </div>
              </div>
            </div>

            {/* 하단 모임 연결 카드 */}
            <div className="bg-[#0c0d12] border border-white/15 p-6 space-y-3.5">
              <span className="text-xs font-mono text-zinc-400 block">
                {currentUCLAResult.typeInfo.meetupBadge}
              </span>
              <h3 className="font-serif-editorial text-xl sm:text-2xl text-white font-normal">
                {currentUCLAResult.typeInfo.meetupHeadline}
              </h3>
              <p className="text-sm text-zinc-300 font-light leading-relaxed">
                {currentUCLAResult.typeInfo.meetupBody}
              </p>
              <div className="pt-1">
                <div className="w-full py-3.5 bg-white/10 border border-white/20 text-white font-mono text-sm font-semibold flex items-center justify-center gap-2">
                  <span>이번 주 6인 식사 모임 둘러보기</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 법적 푸터 */}
            <div className="pt-4 border-t border-white/10 text-xs font-mono text-zinc-500 space-y-1">
              <p>• 출처 표기: Russell(1996) UCLA Loneliness Scale v3 표준 척도 기반</p>
              <p>• 면책 조항: 의학적 진단이 아니며, 자기 성찰을 위한 참고용 지표입니다.</p>
            </div>
          </div>
        )}

        {/* ========================================================
            4-2. 외로움 9문항 실제 결과 화면
            ======================================================== */}
        {activeTest === 'LONELINESS_9' && (
          <div className="border border-white/20 bg-[#07080a] p-5 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="bg-[#0c0d12] border border-white/15 p-6 space-y-5">
              <div className="space-y-2 border-b border-white/10 pb-4">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <span>외로움의 결 분석 리포트</span>
                </span>
                <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
                  {activeLonelinessInfo.name}
                </h2>
                <p className="text-base text-zinc-200 font-light pt-1 leading-relaxed">
                  {activeLonelinessInfo.summary}
                </p>
                <p className="text-xs font-mono text-zinc-400">
                  {activeLonelinessInfo.conditionDescription}
                </p>
              </div>

              <div className="p-4 bg-[#08090d] border border-white/10 space-y-1">
                <span className="text-xs font-mono text-zinc-500 block">이런 때 흔히 나타나요</span>
                <p className="text-sm text-zinc-300 font-light leading-relaxed">
                  {activeLonelinessInfo.moments}
                </p>
              </div>

              <div className="space-y-2.5">
                <span className="text-xs font-mono text-white font-medium flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#f04f74]" />
                  <span>오늘 해 볼 수 있는 작은 일 3가지</span>
                </span>
                <div className="space-y-2">
                  {activeLonelinessInfo.dailyActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5"
                    >
                      <span className="text-zinc-500 font-mono shrink-0">{idx + 1}.</span>
                      <span className="font-light leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 정직한 모임 안내 칸 */}
            <div className="bg-[#0c0d12] border border-white/15 p-6 space-y-3">
              <span className="text-xs font-mono text-zinc-400 block">
                솔직한 안내: 나도솔로 모임이 맞는 경우와 아닌 경우
              </span>
              <p className="text-sm text-zinc-200 font-light leading-relaxed">
                {activeLonelinessInfo.meetupFitNote}
              </p>
              <div className="pt-1 text-xs font-mono text-zinc-400">
                표시 모드: <span className="text-white font-bold">{activeLonelinessInfo.meetupDisplayMode}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            4-3. 1분 솔로테스트 실제 결과 화면
            ======================================================== */}
        {activeTest === 'SOLO_8' && (
          <div className="border border-white/20 bg-[#07080a] p-5 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-2xl">
            {/* 유형 카드 */}
            <div className="bg-[#0c0d12] border border-white/15 p-6 space-y-5">
              <div className="space-y-2 border-b border-white/10 pb-4">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <span>1분 솔로테스트 결과</span>
                </span>
                <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
                  {activeSoloContextCopy.name} × {activeSoloStyleCopy.name}
                </h2>
                <p className="text-base text-zinc-200 font-light pt-1 leading-relaxed">
                  "{activeSoloContextCopy.empathy}"
                </p>
              </div>

              <div className="p-4 bg-[#08090d] border border-white/10 space-y-1">
                <span className="text-xs font-mono text-zinc-500 block">식탁에서의 대화 스타일</span>
                <p className="text-sm text-zinc-300 font-light leading-relaxed">
                  {activeSoloStyleCopy.line}
                </p>
                <p className="text-xs text-zinc-400 pt-1">
                  💡 Tip: {activeSoloStyleCopy.tip}
                </p>
              </div>

              <div className="p-4 bg-[#08090d] border border-white/10 space-y-1">
                <span className="text-xs font-mono text-zinc-500 block">가벼운 첫걸음</span>
                <p className="text-sm text-zinc-300 font-light leading-relaxed">
                  {activeSoloContextCopy.first_step}
                </p>
              </div>
            </div>

            {/* 추천 테마 식탁 */}
            <div className="bg-[#0c0d12] border border-white/15 p-6 space-y-3">
              <span className="text-xs font-mono text-zinc-400 block">
                나와 어울리는 이번 주 추천 테마 식탁
              </span>
              <h3 className="font-serif-editorial text-xl text-white font-normal">
                {SOLOTEST_COPY.theme.after_work_dinner.name}
              </h3>
              <p className="text-sm text-zinc-300 font-light leading-relaxed">
                {SOLOTEST_COPY.theme.after_work_dinner.desc}
              </p>
              <div className="pt-2">
                <div className="w-full py-3 bg-white/10 border border-white/20 text-white font-mono text-sm text-center">
                  열린 식탁 둘러보기 및 대기 신청
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
