'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Check,
  ShieldAlert,
} from 'lucide-react';
import {
  UCLA_QUESTIONS,
  UCLA_TYPES,
  UCLA_DOMAIN_DETAILS,
  computeUCLAResult,
  UCLATypeCode,
} from '@/lib/solotest/uclaData';
import {
  LONELINESS_QUESTIONS,
  LONELINESS_TYPES,
  computeLonelinessResult,
  LonelinessTypeCode,
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

export default function AdminTestAnalyticsManager({
  isLight = false,
  onNotify,
}: AdminTestAnalyticsManagerProps) {
  // 열려 있는 테스트 카드 ID
  const [openCardIds, setOpenCardIds] = useState<string[]>(['ucla-v3']);

  // UCLA 시뮬레이터 원점수 상태 (20 ~ 80)
  const [uclaSimScore, setUclaSimScore] = useState<number>(45);

  // 9문항 외로움 시뮬레이터 상태 (정서 0~3, 사회 0~3, 빈도 3~9)
  const [simEmotionalScore, setSimEmotionalScore] = useState<number>(2);
  const [simSocialScore, setSimSocialScore] = useState<number>(1);
  const [simDegreeScore, setSimDegreeScore] = useState<number>(6);

  // 1분 솔로테스트 시뮬레이터 상태 (맥락 1, 결 1)
  const [simContextKey, setSimContextKey] = useState<string>('after_work');
  const [simStyleScore, setSimStyleScore] = useState<number>(1);

  const toggleCard = (id: string) => {
    setOpenCardIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (openCardIds.length === 4) {
      setOpenCardIds([]);
    } else {
      setOpenCardIds(['solo-8', 'loneliness-9', 'ucla-v3', 'checklist-36']);
    }
  };

  // UCLA 시뮬레이션 계산
  const uclaSimResult = useMemo(() => {
    // 가상 응답 생성 (평균 uclaSimScore에 맞춤)
    const avgPerQ = uclaSimScore / 20;
    const dummyAnswers: Record<string, number> = {};
    UCLA_QUESTIONS.forEach((q, idx) => {
      // 대략적인 배분
      const baseVal = Math.max(1, Math.min(4, Math.round(avgPerQ + (idx % 2 === 0 ? 0.3 : -0.3))));
      dummyAnswers[q.id] = q.isReverse ? 5 - baseVal : baseVal;
    });
    return computeUCLAResult(dummyAnswers);
  }, [uclaSimScore]);

  // 9문항 외로움 시뮬레이션 계산
  const lonelinessSimResult = useMemo(() => {
    let type: LonelinessTypeCode = 'A';
    const isEHigh = simEmotionalScore >= 2;
    const isSHigh = simSocialScore >= 2;

    if (!isEHigh && !isSHigh) type = 'A';
    else if (isEHigh && !isSHigh) type = 'B';
    else if (!isEHigh && isSHigh) type = 'C';
    else type = 'D';

    return {
      type,
      typeInfo: LONELINESS_TYPES[type],
    };
  }, [simEmotionalScore, simSocialScore]);

  return (
    <div className="space-y-4">
      {/* 1. 상단 컨트롤 바 (GEMINI.md 원칙 6 표준 테두리 박스 컨테이너) */}
      <section className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h1 className="font-serif-editorial text-lg text-white font-normal">
            진단테스트
          </h1>
          <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
            4건
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="px-2.5 py-1 text-sm font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            {openCardIds.length === 4 ? '접기' : '펼치기'}
          </button>
        </div>
      </section>

      {/* 2. 2열 컴팩트 그리드 (GEMINI.md 원칙 5 준수, 클릭 시 col-span-full 확장) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* ========================================================
            CARD 1: UCLA 외로움 척도 자가진단 (20문항)
            ======================================================== */}
        <div
          className={`border transition-all bg-[#0c0d12] ${
            openCardIds.includes('ucla-v3')
              ? 'border-white/30 col-span-full'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          {/* 헤더 바 */}
          <button
            type="button"
            onClick={() => toggleCard('ucla-v3')}
            className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="px-2 py-0.5 text-xs font-mono border border-white/10 bg-white/5 text-zinc-300">
                학술 표준
              </span>
              <h2 className="font-serif-editorial text-base sm:text-lg text-white font-normal truncate">
                UCLA 외로움 척도 자가진단 (20문항)
              </h2>
              <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                Russell(1996) v3
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono text-zinc-400">
                {openCardIds.includes('ucla-v3') ? '상세 접기' : '상세 보기'}
              </span>
              {openCardIds.includes('ucla-v3') ? (
                <ChevronUp className="w-4 h-4 text-zinc-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-white" />
              )}
            </div>
          </button>

          {/* 세부 명세 펼침 */}
          {openCardIds.includes('ucla-v3') && (
            <div className="p-4 sm:p-5 border-t border-white/10 space-y-5 text-sm">
              {/* 기본 명세 요약 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">척도 및 채점</span>
                  <p className="text-white font-medium">4점 리커트 (1~4점)</p>
                  <p className="text-xs font-mono text-zinc-400">정채점 11개 / 역채점 9개</p>
                </div>
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">점수 범위 & 환산</span>
                  <p className="text-white font-medium">원점수 20~80점 ➔ 100점 환산</p>
                  <p className="text-xs font-mono text-zinc-400">POMP 공식: (raw-20)/60*100</p>
                </div>
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">공개 주소</span>
                  <Link
                    href="/test/ucla"
                    target="_blank"
                    className="text-white hover:underline flex items-center gap-1 font-mono text-xs"
                  >
                    <span>/test/ucla</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </Link>
                  <p className="text-xs font-mono text-zinc-400">결과: 4대 유형 × 3대 영역</p>
                </div>
              </div>

              {/* 4대 유형 분기 기준표 */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-zinc-400 block">
                  4대 외로움 유형 판별 및 모임 연결 정책
                </span>
                <div className="border border-white/10 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-white/5 border-b border-white/10 text-zinc-300">
                      <tr>
                        <th className="p-2.5">유형</th>
                        <th className="p-2.5">원점수</th>
                        <th className="p-2.5">100점 환산</th>
                        <th className="p-2.5">진단 등급</th>
                        <th className="p-2.5">핵심 처방 요약</th>
                        <th className="p-2.5">모임 연결 정책</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {Object.values(UCLA_TYPES).map((t) => (
                        <tr key={t.code} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 font-medium text-white">{t.name}</td>
                          <td className="p-2.5">{t.rawRangeText}</td>
                          <td className="p-2.5 text-white">{t.finalRangeText}</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 border border-white/10 bg-white/5 text-zinc-200">
                              {t.grade}
                            </span>
                          </td>
                          <td className="p-2.5 max-w-xs truncate">{t.prescription}</td>
                          <td className="p-2.5">
                            {t.recommendMeetup ? (
                              <span className="text-white font-medium">수요일 사교클럽 노출</span>
                            ) : (
                              <span className="text-zinc-500">모임 권유 미노출</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3대 세부 평가 영역 */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-zinc-400 block">
                  3대 하위 결핍 차원 (리포트 심층 분석)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(UCLA_DOMAIN_DETAILS).map(([key, dom]) => (
                    <div key={key} className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{dom.label}</span>
                        <span className="text-xs font-mono text-zinc-500">
                          {key === 'intimacy' ? '8문항' : '6문항'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-light leading-relaxed">
                        {dom.interpretation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 실시간 시뮬레이터 (Simulator) */}
              <div className="p-4 bg-[#08090d] border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f04f74]" />
                    <span className="text-sm font-medium text-white">
                      UCLA 실시간 점수 시뮬레이터
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    점수 조절 시 사용자 화면 출력 즉시 확인
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300">원점수 조절 (20 ~ 80점)</span>
                    <span className="text-white font-bold text-sm">
                      {uclaSimScore}점 ➔ 100점 환산: {Math.round(((uclaSimScore - 20) / 60) * 100)}점
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={uclaSimScore}
                    onChange={(e) => setUclaSimScore(Number(e.target.value))}
                    className="w-full accent-[#f04f74] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                    <span>20점 (최저)</span>
                    <span>35점 (A구간)</span>
                    <span>50점 (B구간)</span>
                    <span>65점 (C구간)</span>
                    <span>80점 (최고 D)</span>
                  </div>
                </div>

                {/* 시뮬레이션 결과 프리뷰 박스 */}
                <div className="p-3 bg-[#0c0d12] border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="text-zinc-400">도출 유형:</span>
                    <span className="text-white font-bold text-sm">
                      {uclaSimResult.typeInfo.name} ({uclaSimResult.typeInfo.grade})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">모임 연결 카드:</span>
                    <span className="text-zinc-200">
                      {uclaSimResult.typeInfo.recommendMeetup ? '노출 (사교클럽 둘러보기)' : '미노출 (선택적 영감 안내)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">위기 상담 배너:</span>
                    <span className={uclaSimScore >= 66 ? 'text-white font-bold' : 'text-zinc-500'}>
                      {uclaSimScore >= 66 ? '최상단 우선 노출' : '하단 일반 안내'}
                    </span>
                  </div>
                  <div className="pt-1 text-zinc-300 font-sans text-xs">
                    "{uclaSimResult.typeInfo.message}"
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 2: 외로움 유형 테스트 (9문항)
            ======================================================== */}
        <div
          className={`border transition-all bg-[#0c0d12] ${
            openCardIds.includes('loneliness-9')
              ? 'border-white/30 col-span-full'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          {/* 헤더 바 */}
          <button
            type="button"
            onClick={() => toggleCard('loneliness-9')}
            className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="px-2 py-0.5 text-xs font-mono border border-white/10 bg-white/5 text-zinc-300">
                관계와 연결
              </span>
              <h2 className="font-serif-editorial text-base sm:text-lg text-white font-normal truncate">
                외로움 유형 테스트 (9문항)
              </h2>
              <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                Hughes & De Jong Gierveld
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono text-zinc-400">
                {openCardIds.includes('loneliness-9') ? '상세 접기' : '상세 보기'}
              </span>
              {openCardIds.includes('loneliness-9') ? (
                <ChevronUp className="w-4 h-4 text-zinc-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-white" />
              )}
            </div>
          </button>

          {/* 세부 명세 펼침 */}
          {openCardIds.includes('loneliness-9') && (
            <div className="p-4 sm:p-5 border-t border-white/10 space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">척도 구성</span>
                  <p className="text-white font-medium">파트1(정도 3) + 파트2(유형 6)</p>
                  <p className="text-xs font-mono text-zinc-400">Hughes(2004) + De Jong(2006)</p>
                </div>
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">핵심 분류 축</span>
                  <p className="text-white font-medium">정서적 외로움 vs 사회적 외로움</p>
                  <p className="text-xs font-mono text-zinc-400">친밀감 결핍 vs 네트워크 결핍</p>
                </div>
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">공개 주소</span>
                  <Link
                    href="/test/loneliness"
                    target="_blank"
                    className="text-white hover:underline flex items-center gap-1 font-mono text-xs"
                  >
                    <span>/test/loneliness</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </Link>
                  <p className="text-xs font-mono text-zinc-400">약 1.5분 소요 간이 테스트</p>
                </div>
              </div>

              {/* 4대 유형 기준표 */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-zinc-400 block">
                  4대 유형 판별 조건 및 모임 추천 우선순위
                </span>
                <div className="border border-white/10 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-white/5 border-b border-white/10 text-zinc-300">
                      <tr>
                        <th className="p-2.5">유형 코드</th>
                        <th className="p-2.5">유형 명칭</th>
                        <th className="p-2.5">판별 조건</th>
                        <th className="p-2.5">모임 추천 방식</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {Object.values(LONELINESS_TYPES).map((t) => (
                        <tr key={t.code} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 font-bold text-white">유형 {t.code}</td>
                          <td className="p-2.5 font-medium text-white">{t.name}</td>
                          <td className="p-2.5 text-zinc-400">
                            {t.code === 'A' && '정서 낮음 & 사회 낮음'}
                            {t.code === 'B' && '정서 높음 (2점↑) & 사회 낮음'}
                            {t.code === 'C' && '정서 낮음 & 사회 높음 (2점↑)'}
                            {t.code === 'D' && '정서 높음 & 사회 높음'}
                          </td>
                          <td className="p-2.5">
                            {t.meetupDisplayMode === 'TOP_PRIMARY' && '1순위 강력 추천 (6인 식탁)'}
                            {t.meetupDisplayMode === 'STARTING_POINT' && '가벼운 시작점 안내'}
                            {t.meetupDisplayMode === 'SUBTLE_ONE_LINE' && '은은한 1줄 텍스트 안내'}
                            {t.meetupDisplayMode === 'WEAK_BOTTOM' && '상담 우선 + 보조 선택지'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 9문항 시뮬레이터 */}
              <div className="p-4 bg-[#08090d] border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f04f74]" />
                    <span className="text-sm font-medium text-white">
                      9문항 유형 시뮬레이터
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    점수별 유형 및 모임 노출 검증
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span>정서적 외로움 점수 (0~3점)</span>
                      <span className="text-white font-bold">{simEmotionalScore}점</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSimEmotionalScore(val)}
                          className={`flex-1 py-1.5 text-xs font-mono border transition-colors ${
                            simEmotionalScore === val
                              ? 'border-white bg-white/20 text-white font-bold'
                              : 'border-white/10 bg-[#0c0d12] text-zinc-400'
                          }`}
                        >
                          {val}점
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span>사회적 외로움 점수 (0~3점)</span>
                      <span className="text-white font-bold">{simSocialScore}점</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSimSocialScore(val)}
                          className={`flex-1 py-1.5 text-xs font-mono border transition-colors ${
                            simSocialScore === val
                              ? 'border-white bg-white/20 text-white font-bold'
                              : 'border-white/10 bg-[#0c0d12] text-zinc-400'
                          }`}
                        >
                          {val}점
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#0c0d12] border border-white/10 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="text-zinc-400">도출 유형:</span>
                    <span className="text-white font-bold text-sm">
                      {lonelinessSimResult.typeInfo.name} (유형 {lonelinessSimResult.type})
                    </span>
                  </div>
                  <p className="text-zinc-300 font-sans pt-1">
                    {lonelinessSimResult.typeInfo.summary}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 3: 1분 솔로테스트 (8문항)
            ======================================================== */}
        <div
          className={`border transition-all bg-[#0c0d12] ${
            openCardIds.includes('solo-8')
              ? 'border-white/30 col-span-full'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          {/* 헤더 바 */}
          <button
            type="button"
            onClick={() => toggleCard('solo-8')}
            className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="px-2 py-0.5 text-xs font-mono border border-white/10 bg-white/5 text-zinc-300">
                순간과 결
              </span>
              <h2 className="font-serif-editorial text-base sm:text-lg text-white font-normal truncate">
                1분 솔로테스트 (8문항)
              </h2>
              <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                입구 퍼널 v0.1
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono text-zinc-400">
                {openCardIds.includes('solo-8') ? '상세 접기' : '상세 보기'}
              </span>
              {openCardIds.includes('solo-8') ? (
                <ChevronUp className="w-4 h-4 text-zinc-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-white" />
              )}
            </div>
          </button>

          {/* 세부 명세 펼침 */}
          {openCardIds.includes('solo-8') && (
            <div className="p-4 sm:p-5 border-t border-white/10 space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">설계 목적</span>
                  <p className="text-white font-medium">가입 없는 1분 공감 입구</p>
                  <p className="text-xs font-mono text-zinc-400">점수/지수 미표시 · 심리검사 아님</p>
                </div>
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">출력 결과</span>
                  <p className="text-white font-medium">맥락(6) + 결(5) + 테마식탁(3)</p>
                  <p className="text-xs font-mono text-zinc-400">열린 모임 카드 및 대기 신청 연계</p>
                </div>
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">공개 주소</span>
                  <Link
                    href="/solotest"
                    target="_blank"
                    className="text-white hover:underline flex items-center gap-1 font-mono text-xs"
                  >
                    <span>/solotest</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </Link>
                  <p className="text-xs font-mono text-zinc-400">모바일 최적화 1문항 진행</p>
                </div>
              </div>

              {/* 3대 추천 테마 식탁 매핑 */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-zinc-400 block">
                  결과별 3대 추천 테마 식탁 매핑
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {Object.entries(SOLOTEST_COPY.theme).map(([key, theme]: [string, ThemeResultCopy]) => (
                    <div key={key} className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                      <span className="text-white font-bold block">{theme.name}</span>
                      <p className="text-zinc-300 font-sans leading-relaxed">{theme.desc}</p>
                      <span className="text-zinc-500 block pt-1">
                        식탁 키: {key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 맥락(6) 및 결(5) 도감 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1.5">
                  <span className="text-zinc-400 block font-bold">6가지 솔로의 순간 (Q1)</span>
                  <div className="space-y-1">
                    {Object.entries(SOLOTEST_COPY.context).map(([k, c]: [string, ContextResultCopy]) => (
                      <div key={k} className="flex items-center justify-between text-zinc-300">
                        <span className="text-white">{c.name}</span>
                        <span className="text-zinc-500">{k}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1.5">
                  <span className="text-zinc-400 block font-bold">5가지 대화의 결 (Q4~Q7)</span>
                  <div className="space-y-1">
                    {Object.entries(SOLOTEST_COPY.style).map(([k, s]: [string, StyleResultCopy]) => (
                      <div key={k} className="flex items-center justify-between text-zinc-300">
                        <span className="text-white">{s.name}</span>
                        <span className="text-zinc-500">{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 4: 정규 온보딩 체크리스트 (36문항)
            ======================================================== */}
        <div
          className={`border transition-all bg-[#0c0d12] ${
            openCardIds.includes('checklist-36')
              ? 'border-white/30 col-span-full'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          {/* 헤더 바 */}
          <button
            type="button"
            onClick={() => toggleCard('checklist-36')}
            className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="px-2 py-0.5 text-xs font-mono border border-white/10 bg-white/5 text-zinc-300">
                정규 온보딩
              </span>
              <h2 className="font-serif-editorial text-base sm:text-lg text-white font-normal truncate">
                정규 온보딩 체크리스트 (36문항)
              </h2>
              <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                테이블 매칭 엔진 연동
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono text-zinc-400">
                {openCardIds.includes('checklist-36') ? '상세 접기' : '상세 보기'}
              </span>
              {openCardIds.includes('checklist-36') ? (
                <ChevronUp className="w-4 h-4 text-zinc-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-white" />
              )}
            </div>
          </button>

          {/* 세부 명세 펼침 */}
          {openCardIds.includes('checklist-36') && (
            <div className="p-4 sm:p-5 border-t border-white/10 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">역할 및 성격</span>
                  <p className="text-white font-medium">유료 신청자 필수 온보딩</p>
                  <p className="text-xs font-mono text-zinc-400">테이블 자동 배정 100% 반영</p>
                </div>
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">기반 모델</span>
                  <p className="text-white font-medium">Big Five 성격 5요인 + 매너</p>
                  <p className="text-xs font-mono text-zinc-400">6개 축 레이더 차트 프로파일</p>
                </div>
                <div className="p-3 bg-[#08090d] border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-zinc-400 block">공개 주소</span>
                  <Link
                    href="/checklist"
                    target="_blank"
                    className="text-white hover:underline flex items-center gap-1 font-mono text-xs"
                  >
                    <span>/checklist</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </Link>
                  <p className="text-xs font-mono text-zinc-400">완료 시 로컬/계정 자동 영구 보존</p>
                </div>
              </div>

              <div className="p-3 bg-[#08090d] border border-white/10 space-y-1 text-xs font-mono text-zinc-400">
                <p>• 입구용 자가진단(1분 솔로테스트, UCLA 척도, 외로움 9문항) 응답은 정규 테이블 매칭에 일절 혼합되지 않습니다.</p>
                <p>• 정규 매칭은 오직 본 36문항 체크리스트와 현장 관찰 평가(소셜미러) 엔진으로만 구동되어 데이터 왜곡을 차단합니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
