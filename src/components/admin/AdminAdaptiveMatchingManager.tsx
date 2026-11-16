'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DEFAULT_MATCHING_AXES,
  DEFAULT_ADAPTIVE_QUESTIONS,
  MatchingAxisSpec,
  AdaptiveQuestionSpec,
  AdaptiveAnswer,
  computeUserAxisProfile,
  matchDynamicTables,
  scoreUserAgainstRoom,
  UserAxisProfile,
} from '@/engine/dynamicMatchingEngine';
import { nadoSoloSupabaseService, DbProfile } from '@/lib/supabase/service';
import { useNadoSoloEngine, ConditionalEventItem } from '@/engine';
import { ChevronDown, ChevronUp, Sliders, Users, Activity, Layers, RefreshCw } from 'lucide-react';

interface AdminAdaptiveMatchingManagerProps {
  isLight?: boolean;
  onNotify?: (msg: string) => void;
}

type ViewPerspective = 'ROOMS' | 'CALIBRATION' | 'AXES' | 'QUESTIONS';

export default function AdminAdaptiveMatchingManager({
  isLight = false,
  onNotify,
}: AdminAdaptiveMatchingManagerProps) {
  const { conditionalEvents, addConditionalEvent } = useNadoSoloEngine();
  const [perspective, setPerspective] = useState<ViewPerspective>('ROOMS');
  const [dbProfiles, setDbProfiles] = useState<DbProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const loadLiveProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const profiles = await nadoSoloSupabaseService.getAllProfiles();
      // 관리자 계정 제외, 실회원만 필터링
      const membersOnly = profiles.filter(
        (p) => p.id !== 'ADMIN_01' && p.handle !== '@admin'
      );
      setDbProfiles(membersOnly);
    } catch (e) {
      console.error('실DB 회원 로드 실패:', e);
      onNotify?.('DB 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadLiveProfiles();
  }, [loadLiveProfiles]);

  // 실DB 회원의 survey_answers -> 표준 UserAxisProfile 변환 (더미 데이터 0건)
  const realParticipants = useMemo<UserAxisProfile[]>(() => {
    return dbProfiles.map((p) => {
      const rawSurvey = p.survey_answers ?? {};
      const answers: AdaptiveAnswer[] = Object.entries(rawSurvey).map(([qId, val]) => ({
        questionId: qId,
        version: 1,
        value: val,
      }));

      return computeUserAxisProfile(
        {
          userId: `${p.nickname || p.handle} (${p.id})`,
          gender: p.gender === 'M' ? 'M' : 'F',
          birthYear: p.birth_year || 1994,
          cityCode: p.residence_city || 'SEOUL',
          dietary: p.dietary || 'NONE',
          purpose: p.preferred_purpose,
        },
        answers,
        questions,
        axes
      );
    });
  }, [dbProfiles, questions, axes]);

  const groupingResult = useMemo(
    () => matchDynamicTables(realParticipants, axes),
    [realParticipants, axes]
  );

  const isRoomPublished = useCallback(
    (roomTitle: string) =>
      conditionalEvents.some((ev) => ev.title.includes(roomTitle)),
    [conditionalEvents]
  );

  const handlePublishRoom = (
    room: (typeof groupingResult.rooms)[number],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (isRoomPublished(room.spec.title)) {
      onNotify?.('이미 개설된 방입니다.');
      return;
    }
    const newEvent: ConditionalEventItem = {
      eventId: `EVT-${room.roomId}-${Date.now().toString().slice(-4)}`,
      title: `[적응매칭] ${room.spec.title}`,
      districtId: 'SEOUL_GANGNAM',
      regionName: '서울',
      districtName: '강남구',
      venueId: 'VEN_SEOUL_GANGNAM_01',
      dateText: '2026-11-20 (금) 19:30',
      eventDate: '2026-11-20',
      eventTime: '19:30',
      mode: '3:3 소셜 다이닝',
      purpose: room.spec.purpose,
      compositionMode: '3:3 성비균형',
      enforceGenderRatio: true,
      priceKrw: 30000,
      maxCapacity: 6,
      minConfirmCount: 4,
      status: 'CONFIRMED',
      requiredBadgeIds: [],
      minTotalScore100: 0,
      activePresetSubIds: [],
      reason: `적합도 ${room.expectedScore100}점 (${room.members.length}명 편성)`,
    };
    addConditionalEvent(newEvent);
    onNotify?.(`[${room.spec.title}] 방 개설 완료`);
  };

  const toggleAxisActive = (axisId: string) => {
    setAxes((prev) =>
      prev.map((a) => (a.axisId === axisId ? { ...a, isActive: !a.isActive } : a))
    );
    onNotify?.(`${axisId} 변경`);
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
    onNotify?.(`${qId} 변경`);
  };

  const activeAxisWeightSum = axes
    .filter((a) => a.isActive)
    .reduce((acc, a) => acc + a.weight, 0);

  const maleCount = realParticipants.filter((p) => p.gender === 'M').length;
  const femaleCount = realParticipants.filter((p) => p.gender === 'F').length;

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
          <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
            실회원 {realParticipants.length}명 (남{maleCount}·여{femaleCount}) · {groupingResult.rooms.length}방
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={loadLiveProfiles}
            className="px-2.5 py-1 text-sm font-mono border border-white/15 bg-white/5 hover:bg-white/10 text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>

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

      {/* 1. 실DB 회원 기반 모임방 부합도 관제 */}
      {perspective === 'ROOMS' && (
        <div className="space-y-3">
          <div className="p-3 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-3 text-sm font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="text-white font-medium">실서버 SSOT 매칭</span>
              <span className="text-zinc-400">
                가중치 합 {activeAxisWeightSum} → 100점 정규화
              </span>
            </div>
            <span className="text-zinc-300">
              배정 {realParticipants.length - groupingResult.unassigned.length}명 · 대기{' '}
              {groupingResult.unassigned.length}명
            </span>
          </div>

          {groupingResult.rooms.length === 0 ? (
            <div className="p-6 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-300">
              {isLoading
                ? '실DB 회원 데이터를 불러오는 중...'
                : `현재 실DB 회원(${realParticipants.length}명: 남 ${maleCount}명, 여 ${femaleCount}명)으로 3:3 성비 6인 테이블을 편성할 수 없습니다.`}
            </div>
          ) : (
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
                    <div className="w-full p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02]">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRoomId(isExpanded ? null : room.roomId)
                        }
                        className="flex-1 text-left space-y-1 cursor-pointer min-w-0"
                      >
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
                      </button>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handlePublishRoom(room, e)}
                          className={`px-2.5 py-1 border text-sm font-mono cursor-pointer ${
                            isRoomPublished(room.spec.title)
                              ? 'border-white/20 bg-white/5 text-zinc-300'
                              : 'border-white/40 bg-white/15 hover:bg-white/25 text-white font-bold'
                          }`}
                        >
                          {isRoomPublished(room.spec.title) ? '개설됨' : '개설'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRoomId(isExpanded ? null : room.roomId)
                          }
                          className="flex items-center gap-2 text-right cursor-pointer"
                        >
                          <div>
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
                        </button>
                      </div>
                    </div>

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
                            실DB 참여자별 방 적합도 (100점 기준)
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
                                    ({member.gender} · {member.budgetTier} · {member.hasPulseUpdate ? '컨디션반영' : '기본'})
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
          )}
        </div>
      )}

      {/* 2. 사전 예측 vs 사후 평가 비교 (실데이터 기반) */}
      {perspective === 'CALIBRATION' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {groupingResult.rooms.length === 0 ? (
            <div className="col-span-full p-6 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-300">
              편성된 방이 없어 사후 평가 대조 대상이 없습니다.
            </div>
          ) : (
            groupingResult.rooms.map((room) => {
              const isExpanded = expandedCalId === room.roomId;
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
                      setExpandedCalId(isExpanded ? null : room.roomId)
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
                      <div className="text-sm font-mono text-zinc-400">
                        사전 예측 {room.expectedScore100}점 ↔ 사후 평가 대기
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="px-2.5 py-0.5 border border-white/20 bg-white/5 text-sm font-mono text-white">
                        대기
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-white/10 bg-[#08090d] space-y-2 text-sm font-mono text-zinc-300">
                      <div>
                        사전 적합도: {room.expectedScore100}점 ({room.members.length}명)
                      </div>
                      <div>
                        완화 조건: {room.relaxedConditions.length > 0 ? room.relaxedConditions.join(', ') : '없음'}
                      </div>
                      <div>
                        상태: 모임 종료 후 동석자 다면 평가가 집계되면 예측 편차(Delta)가 자동 산출됩니다.
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
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
