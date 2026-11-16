'use client';

import React, { useState, useMemo } from 'react';
import {
  DEFAULT_MATCHING_AXES,
  DEFAULT_ADAPTIVE_QUESTIONS,
  MatchingAxisSpec,
  AdaptiveQuestionSpec,
  computeUserAxisProfile,
  matchDynamicTables,
  scoreUserAgainstRoom,
  PurposeCode,
} from '@/engine/dynamicMatchingEngine';
import { ChevronDown, ChevronUp, Sliders, Users, Activity, Layers } from 'lucide-react';

interface AdminAdaptiveMatchingManagerProps {
  isLight?: boolean;
  onNotify?: (msg: string) => void;
}

type ViewPerspective = 'ROOMS' | 'CALIBRATION' | 'AXES' | 'QUESTIONS';

interface PostEvaluationAudit {
  roomId: string;
  roomTitle: string;
  predictedScore100: number;
  actualSatisfaction100: number;
  rematchRate: number;
  metaGapAvg: number;
  status: 'CALIBRATED' | 'OVERESTIMATED' | 'UNDERESTIMATED';
  insight: string;
  recommendedAction: string;
}

export default function AdminAdaptiveMatchingManager({
  isLight = false,
  onNotify,
}: AdminAdaptiveMatchingManagerProps) {
  const [perspective, setPerspective] = useState<ViewPerspective>('ROOMS');
  const [poolSize, setPoolSize] = useState<6 | 12 | 18>(12);
  const [axes, setAxes] = useState<MatchingAxisSpec[]>(() =>
    DEFAULT_MATCHING_AXES.map((a) => ({ ...a }))
  );
  const [questions, setQuestions] = useState<AdaptiveQuestionSpec[]>(() =>
    DEFAULT_ADAPTIVE_QUESTIONS.map((q) => ({ ...q }))
  );

  // 클릭 시 상세 펼침 상태 (헌법 제6조 원칙 3: 리스트 우선 조망 -> 클릭 시 상세 노출)
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [expandedAxisId, setExpandedAxisId] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [expandedCalId, setExpandedCalId] = useState<string | null>(null);

  // 시뮬레이션용 가상 지원자 풀 생성 (6명 / 12명 / 18명)
  const simulatedParticipants = useMemo(() => {
    const seeds: Array<{
      g: 'M' | 'F';
      p: PurposeCode;
      depth: number;
      theme: number;
      energy: number;
      budget: '$' | '$$' | '$$$';
    }> = [
      { g: 'M', p: 'RESET', depth: 1, theme: 1, energy: 5, budget: '$$' },
      { g: 'F', p: 'RESET', depth: 1, theme: 2, energy: 4, budget: '$$' },
      { g: 'M', p: 'FRIEND', depth: 3, theme: 3, energy: 3, budget: '$$' },
      { g: 'F', p: 'FRIEND', depth: 3, theme: 3, energy: 2, budget: '$$' },
      { g: 'M', p: 'TASTE', depth: 5, theme: 5, energy: 2, budget: '$$$' },
      { g: 'F', p: 'TASTE', depth: 5, theme: 4, energy: 1, budget: '$$$' },
      { g: 'M', p: 'RESET', depth: 2, theme: 1, energy: 4, budget: '$$' },
      { g: 'F', p: 'RESET', depth: 1, theme: 1, energy: 3, budget: '$$' },
      { g: 'M', p: 'TASTE', depth: 4, theme: 5, energy: 2, budget: '$$$' },
      { g: 'F', p: 'TASTE', depth: 5, theme: 5, energy: 2, budget: '$$$' },
      { g: 'M', p: 'FRIEND', depth: 2, theme: 2, energy: 5, budget: '$' },
      { g: 'F', p: 'FRIEND', depth: 3, theme: 2, energy: 1, budget: '$' },
      { g: 'M', p: 'ROMANCE', depth: 4, theme: 3, energy: 4, budget: '$$' },
      { g: 'F', p: 'ROMANCE', depth: 4, theme: 3, energy: 3, budget: '$$' },
      { g: 'M', p: 'ROMANCE', depth: 3, theme: 4, energy: 2, budget: '$$' },
      { g: 'F', p: 'ROMANCE', depth: 5, theme: 4, energy: 4, budget: '$$' },
      { g: 'M', p: 'ROMANCE', depth: 4, theme: 2, energy: 5, budget: '$$' },
      { g: 'F', p: 'ROMANCE', depth: 3, theme: 3, energy: 1, budget: '$$' },
    ];

    return seeds.slice(0, poolSize).map((s, idx) =>
      computeUserAxisProfile(
        {
          userId: `SIM-${String(idx + 1).padStart(2, '0')}`,
          gender: s.g,
          birthYear: 1988 + (idx % 9),
          purpose: s.p,
          budgetTier: s.budget,
        },
        [
          { questionId: 'P01_TODAY_ENERGY', version: 1, value: s.energy },
          { questionId: 'P02_TODAY_DEPTH', version: 1, value: s.depth },
          { questionId: 'P03_TODAY_WORK_OFF', version: 1, value: s.theme },
        ],
        questions,
        axes
      )
    );
  }, [poolSize, questions, axes]);

  const groupingResult = useMemo(
    () => matchDynamicTables(simulatedParticipants, axes),
    [simulatedParticipants, axes]
  );

  // 사전 예측 vs 사후 실제 평가 비교 데이터 (엔진 고도화 캘리브레이션)
  const calibrationAudits = useMemo<PostEvaluationAudit[]>(() => {
    return groupingResult.rooms.map((room, idx) => {
      // 시뮬레이션 편차 패턴: 1번 방(적중), 2번 방(과대예측), 3번 방(과소예측)
      const delta = idx % 3 === 0 ? 3 : idx % 3 === 1 ? -14 : 11;
      const actual = Math.max(40, Math.min(99, room.expectedScore100 + delta));
      const status: PostEvaluationAudit['status'] =
        Math.abs(delta) <= 5
          ? 'CALIBRATED'
          : delta < 0
          ? 'OVERESTIMATED'
          : 'UNDERESTIMATED';

      return {
        roomId: room.roomId,
        roomTitle: room.spec.title,
        predictedScore100: room.expectedScore100,
        actualSatisfaction100: actual,
        rematchRate: actual >= 80 ? 83 : actual >= 70 ? 67 : 50,
        metaGapAvg: Math.abs(delta) + 4,
        status,
        insight:
          status === 'CALIBRATED'
            ? '예측 적합도와 사후 동석자 체감 점수가 오차 5점 이내로 일치'
            : status === 'OVERESTIMATED'
            ? '사전 적합도는 높았으나 일 얘기 비중 및 대화 깊이 체감 차이 발생'
            : '목적 병합(변화+교류) 테이블이나 에너지 2:2:2 밸런스로 높은 시너지 기록',
        recommendedAction:
          status === 'CALIBRATED'
            ? '현재 축 가중치 유지'
            : status === 'OVERESTIMATED'
            ? '깊이(DEPTH) 또는 테마(THEME) 가중치 +5 상향 테스트 권고'
            : '변화↔교류 호환 계수(0.55→0.65) 상향 검토',
      };
    });
  }, [groupingResult.rooms]);

  const toggleAxisActive = (axisId: string) => {
    setAxes((prev) =>
      prev.map((a) => (a.axisId === axisId ? { ...a, isActive: !a.isActive } : a))
    );
    onNotify?.(`${axisId} 상태 변경`);
  };

  const adjustAxisWeight = (axisId: string, delta: number) => {
    setAxes((prev) =>
      prev.map((a) =>
        a.axisId === axisId
          ? { ...a, weight: Math.max(5, Math.min(80, a.weight + delta)) }
          : a
      )
    );
  };

  const toggleQuestionActive = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, isActive: !q.isActive } : q))
    );
    onNotify?.(`${qId} 상태 변경`);
  };

  const activeAxisWeightSum = axes
    .filter((a) => a.isActive)
    .reduce((acc, a) => acc + a.weight, 0);

  return (
    <div className="space-y-4">
      {/* 상단 표준 테두리 박스 컨테이너 (헌법 제6조 원칙 6 준수) */}
      <div
        className={`p-3 border flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#0c0d12] border-white/10'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h2
            className={`font-serif-editorial text-lg font-normal ${
              isLight ? 'text-zinc-900' : 'text-white'
            }`}
          >
            적응매칭
          </h2>
          <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
            {groupingResult.rooms.length}방 · {axes.filter((a) => a.isActive).length}축 ·{' '}
            {questions.filter((q) => q.isActive).length}문항
          </span>
        </div>

        {/* 4대 관제 각도 전환 + 모수 시뮬레이터 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'ROOMS', label: '부합도', icon: Users },
              { key: 'CALIBRATION', label: '사후비교', icon: Activity },
              { key: 'AXES', label: '축설정', icon: Sliders },
              { key: 'QUESTIONS', label: '질문지', icon: Layers },
            ] as const
          ).map((tab) => {
            const active = perspective === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPerspective(tab.key)}
                className={`px-2.5 py-1 text-sm font-mono border flex items-center gap-1.5 cursor-pointer transition-colors ${
                  active
                    ? 'border-white/40 bg-white/15 text-white font-semibold'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. 모임방 부합도 관제 (모수별 분화 & 참여자별 점수) */}
      {perspective === 'ROOMS' && (
        <div className="space-y-3">
          <div className="p-3 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="text-sm font-mono text-white font-medium">모수 시뮬레이션</span>
              <span className="text-sm font-mono text-zinc-400">
                가중치 합 {activeAxisWeightSum} → 100점 정규화
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {([6, 12, 18] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setPoolSize(cnt);
                    setExpandedRoomId(null);
                  }}
                  className={`px-3 py-1 text-sm font-mono border cursor-pointer ${
                    poolSize === cnt
                      ? 'border-white/40 bg-white/15 text-white font-bold'
                      : 'border-white/10 bg-white/5 text-zinc-300 hover:text-white'
                  }`}
                >
                  {cnt}명
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {groupingResult.rooms.map((room) => {
              const isExpanded = expandedRoomId === room.roomId;
              return (
                <div
                  key={room.roomId}
                  className={`border border-white/10 bg-[#0c0d12] ${
                    isExpanded ? 'col-span-full border-white/25' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRoomId(isExpanded ? null : room.roomId)
                    }
                    className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                        <span className="text-sm font-mono font-bold text-white">
                          {room.spec.title}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-zinc-400">
                        <span>{room.roomId}</span>
                        <span>·</span>
                        <span>{room.members.length}명</span>
                        {room.relaxedConditions.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-zinc-200">
                              완화: {room.relaxedConditions.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-base font-mono font-bold text-white">
                          {room.expectedScore100}점
                        </span>
                        <span className="block text-sm font-mono text-zinc-400">
                          {room.qualityGrade === 'OPTIMAL'
                            ? '최적'
                            : room.qualityGrade === 'BALANCED'
                            ? '균형'
                            : '성사'}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-white/10 bg-[#08090d] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-mono">
                        <span className="text-white font-medium">
                          방 목표 좌표 ·{' '}
                          {Object.entries(room.spec.targetLabels)
                            .map(([k, v]) => `${k}:${v}`)
                            .join(' / ')}
                        </span>
                        <span className="text-zinc-400">
                          참여자별 방 적합도 (100점 기준)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {room.members.map((member) => {
                          const { score100 } = scoreUserAgainstRoom(
                            member,
                            room.spec,
                            room.members,
                            axes
                          );
                          return (
                            <div
                              key={member.userId}
                              className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-2"
                            >
                              <div className="text-sm font-mono">
                                <span className="text-white font-bold">
                                  {member.userId}
                                </span>
                                <span className="text-zinc-400 ml-2">
                                  ({member.gender} · {member.budgetTier})
                                </span>
                                <div className="text-sm text-zinc-400 mt-0.5">
                                  {Object.values(member.axisLabels).join(' · ')}
                                </div>
                              </div>
                              <span className="px-2.5 py-1 border border-white/20 bg-white/5 text-sm font-mono font-bold text-white">
                                {score100}점
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 사전 예측 vs 사후 평가 비교 (엔진 성능 고도화 캘리브레이션) */}
      {perspective === 'CALIBRATION' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {calibrationAudits.map((item) => {
            const isExpanded = expandedCalId === item.roomId;
            const delta = item.actualSatisfaction100 - item.predictedScore100;
            return (
              <div
                key={item.roomId}
                className={`border border-white/10 bg-[#0c0d12] ${
                  isExpanded ? 'col-span-full border-white/25' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCalId(isExpanded ? null : item.roomId)
                  }
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                      <span className="text-sm font-mono font-bold text-white">
                        {item.roomTitle}
                      </span>
                    </div>
                    <div className="text-sm font-mono text-zinc-400">
                      예측 {item.predictedScore100}점 ↔ 사후 {item.actualSatisfaction100}점 (편차{' '}
                      {delta >= 0 ? `+${delta}` : delta})
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2.5 py-0.5 border border-white/20 bg-white/5 text-sm font-mono text-white">
                      {item.status === 'CALIBRATED'
                        ? '적중'
                        : item.status === 'OVERESTIMATED'
                        ? '과대'
                        : '과소'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-white/10 bg-[#08090d] space-y-3 text-sm font-mono">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-3 border border-white/10 bg-[#0c0d12]">
                        <span className="text-zinc-400 block">재만남 희망률</span>
                        <span className="text-white font-bold text-base">
                          {item.rematchRate}%
                        </span>
                      </div>
                      <div className="p-3 border border-white/10 bg-[#0c0d12]">
                        <span className="text-zinc-400 block">메타인지 평균 격차</span>
                        <span className="text-white font-bold text-base">
                          {item.metaGapAvg}점
                        </span>
                      </div>
                      <div className="p-3 border border-white/10 bg-[#0c0d12]">
                        <span className="text-zinc-400 block">튜닝 권고</span>
                        <span className="text-white font-medium">
                          {item.recommendedAction}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 border border-white/10 bg-[#0c0d12] text-zinc-300">
                      진단: {item.insight}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. 동적 축(Axis) 설정 관제 */}
      {perspective === 'AXES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {axes.map((axis) => {
            const isExpanded = expandedAxisId === axis.axisId;
            return (
              <div
                key={axis.axisId}
                className={`border border-white/10 bg-[#0c0d12] ${
                  isExpanded ? 'col-span-full border-white/25' : ''
                }`}
              >
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedAxisId(isExpanded ? null : axis.axisId)
                    }
                    className="flex-1 text-left flex items-center gap-2.5 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <span className="text-sm font-mono font-bold text-white">
                      {axis.label}
                    </span>
                    <span className="text-sm font-mono text-zinc-400">
                      가중치 {axis.weight} · {axis.strategy}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAxisActive(axis.axisId)}
                    className={`px-2.5 py-1 border text-sm font-mono cursor-pointer ${
                      axis.isActive
                        ? 'border-white/40 bg-white/15 text-white font-bold'
                        : 'border-white/10 bg-white/5 text-zinc-400'
                    }`}
                  >
                    {axis.isActive ? 'ON' : 'OFF'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-white/10 bg-[#08090d] flex flex-wrap items-center justify-between gap-3 text-sm font-mono">
                    <div className="text-zinc-300">
                      앵커: {axis.anchors.join(' · ')} ({axis.tier})
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjustAxisWeight(axis.axisId, -5)}
                        className="px-3 py-1 border border-white/20 text-white cursor-pointer hover:bg-white/10"
                      >
                        -5
                      </button>
                      <span className="text-white font-bold">{axis.weight}</span>
                      <button
                        type="button"
                        onClick={() => adjustAxisWeight(axis.axisId, 5)}
                        className="px-3 py-1 border border-white/20 text-white cursor-pointer hover:bg-white/10"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. 12+4 질문지 관제 */}
      {perspective === 'QUESTIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {questions.map((q) => {
            const isExpanded = expandedQuestionId === q.id;
            return (
              <div
                key={q.id}
                className={`border border-white/10 bg-[#0c0d12] ${
                  isExpanded ? 'col-span-full border-white/25' : ''
                }`}
              >
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedQuestionId(isExpanded ? null : q.id)
                    }
                    className="flex-1 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                      <span className="text-sm font-mono font-bold text-white">
                        {q.layer === 'PULSE' ? '컨디션' : '기본'} · {q.categoryLabel}
                      </span>
                      <span className="text-sm font-mono text-zinc-400">
                        v{q.version}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-200 mt-1 line-clamp-1">
                      {q.questionText}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleQuestionActive(q.id)}
                    className={`px-2.5 py-1 border text-sm font-mono cursor-pointer shrink-0 ${
                      q.isActive
                        ? 'border-white/40 bg-white/15 text-white font-bold'
                        : 'border-white/10 bg-white/5 text-zinc-400'
                    }`}
                  >
                    {q.isActive ? 'ON' : 'OFF'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-white/10 bg-[#08090d] space-y-2 text-sm font-mono text-zinc-300">
                    <div>식별자: {q.id} ({q.inputType})</div>
                    {q.options && (
                      <div>
                        선택지: {q.options.map((o) => o.label).join(' / ')}
                      </div>
                    )}
                    {q.scaleConfig && (
                      <div>
                        척도: 1({q.scaleConfig.minLabel}) ↔ 5({q.scaleConfig.maxLabel})
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
