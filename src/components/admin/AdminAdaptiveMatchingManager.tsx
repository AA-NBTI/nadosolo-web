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
import {
  ChevronDown,
  ChevronUp,
  Sliders,
  Users,
  Activity,
  Layers,
  RefreshCw,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
  ExternalLink,
  FlaskConical,
  RotateCcw,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

function decodeAnswerText(q: AdaptiveQuestionSpec, rawVal?: string): string {
  if (!rawVal || rawVal.trim() === '') return '미입력';
  if (q.inputType === 'SCALE_1_5' && q.scaleConfig) {
    const num = Number(rawVal);
    if (isNaN(num)) return rawVal;
    if (num <= 2) return `${num}점 (${q.scaleConfig.minLabel})`;
    if (num >= 4) return `${num}점 (${q.scaleConfig.maxLabel})`;
    return `${num}점 (균형)`;
  }
  const tokens = rawVal.split(',').map((t) => t.trim()).filter(Boolean);
  const labels = tokens.map((token) => {
    if (token.startsWith('CUSTOM:')) {
      return `직접입력: ${token.slice(7)}`;
    }
    const opt = q.options?.find((o) => o.id === token);
    return opt ? opt.label : token;
  });
  return labels.length > 0 ? labels.join(' · ') : '미입력';
}

interface AdminAdaptiveMatchingManagerProps {
  isLight?: boolean;
  onNotify?: (msg: string) => void;
  defaultPerspective?: ViewPerspective;
}

type ViewPerspective = 'ROOMS' | 'CHECKLIST' | 'CALIBRATION' | 'AXES' | 'QUESTIONS';

export default function AdminAdaptiveMatchingManager({
  isLight = false,
  onNotify,
  defaultPerspective = 'ROOMS',
}: AdminAdaptiveMatchingManagerProps) {
  const { conditionalEvents, addConditionalEvent } = useNadoSoloEngine();
  const [perspective, setPerspective] = useState<ViewPerspective>(defaultPerspective);
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
  const [questionLayerFilter, setQuestionLayerFilter] = useState<'ALL' | 'BASE' | 'DEEP' | 'PULSE'>('ALL');
  const [checklistFilter, setChecklistFilter] = useState<'ALL' | 'PAID' | 'DEEP_DONE' | 'BASE_ONLY' | 'NONE'>('ALL');
  const [checklistSearch, setChecklistSearch] = useState<string>('');
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [checklistSubLayer, setChecklistSubLayer] = useState<'ALL' | 'BASE' | 'DEEP' | 'PULSE'>('ALL');

  // 체크리스트 시험 테스트 시뮬레이터 상태
  const [isTestSimulatorOpen, setIsTestSimulatorOpen] = useState(false);
  const [simulatorMode, setSimulatorMode] = useState<'BASE' | 'DEEP' | 'PULSE' | 'ALL'>('BASE');
  const [simulatorAnswers, setSimulatorAnswers] = useState<Record<string, string>>({});
  const [simulatorStepIdx, setSimulatorStepIdx] = useState(0);
  const [simulatorNotice, setSimulatorNotice] = useState<string | null>(null);

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

  const simulatorQuestions = useMemo(() => {
    if (simulatorMode === 'BASE') return questions.filter((q) => q.layer === 'BASE');
    if (simulatorMode === 'DEEP') return questions.filter((q) => q.layer === 'DEEP');
    if (simulatorMode === 'PULSE') return questions.filter((q) => q.layer === 'PULSE');
    return questions;
  }, [questions, simulatorMode]);

  const applyPersonaAnswers = (persona: 'IT_TECH' | 'DESIGN' | 'FOUNDER' | 'WELLNESS' | 'RANDOM') => {
    const next: Record<string, string> = {};
    for (const q of questions) {
      if (persona === 'RANDOM') {
        if (q.inputType === 'SCALE_1_5') {
          next[q.id] = String(Math.floor(Math.random() * 5) + 1);
        } else if (q.options && q.options.length > 0) {
          if (q.inputType === 'MULTI') {
            const picked = [...q.options].sort(() => 0.5 - Math.random()).slice(0, q.maxSelectCount ?? 2);
            next[q.id] = picked.map((o) => o.id).join(',');
          } else {
            const picked = q.options[Math.floor(Math.random() * q.options.length)];
            next[q.id] = picked.id;
          }
        }
        continue;
      }

      if (q.id === 'BASE_01_CITY') next[q.id] = persona === 'WELLNESS' ? '부산' : '서울';
      else if (q.id === 'BASE_02_RELATIONSHIP') next[q.id] = persona === 'FOUNDER' ? 'MARRIED' : persona === 'DESIGN' ? 'DIVORCED' : 'SINGLE';
      else if (q.id === 'BASE_03_PURPOSE') next[q.id] = persona === 'FOUNDER' ? 'RESET' : persona === 'WELLNESS' ? 'TASTE' : 'FRIEND';
      else if (q.id === 'BASE_04_INDUSTRY') next[q.id] = persona === 'IT_TECH' ? 'IT_TECH,FINANCE' : persona === 'DESIGN' ? 'DESIGN_ART' : persona === 'FOUNDER' ? 'FOUNDER' : 'PRO_SERVICE';
      else if (q.id === 'BASE_06_BUDGET') next[q.id] = persona === 'FOUNDER' ? '$$$' : persona === 'IT_TECH' ? '$$' : '$';
      else if (q.id === 'BASE_07_LANGUAGE') next[q.id] = persona === 'IT_TECH' ? 'KO,EN' : 'KO';
      else if (q.id === 'BASE_08_ENERGY') next[q.id] = persona === 'FOUNDER' ? '4' : persona === 'DESIGN' ? '2' : '3';
      else if (q.id === 'BASE_09_FEEDBACK_TONE') next[q.id] = persona === 'IT_TECH' ? 'OBJECTIVE' : 'BALANCED';
      else if (q.id === 'DEEP_D01_DIETARY_RESTRICTIONS') next[q.id] = persona === 'WELLNESS' ? 'VEGAN' : 'NONE';
      else if (q.id === 'DEEP_D02_BEVERAGE_PREFERENCE') next[q.id] = persona === 'WELLNESS' ? 'ALCOHOL_FREE' : persona === 'IT_TECH' ? 'WINE_LOVER' : 'LIGHT_DRINK';
      else if (q.inputType === 'SCALE_1_5') {
        next[q.id] = persona === 'FOUNDER' ? '4' : persona === 'DESIGN' ? '3' : '4';
      } else if (q.options && q.options.length > 0) {
        next[q.id] = q.options[0].id;
      }
    }
    setSimulatorAnswers(next);
    setSimulatorNotice(`[${persona === 'IT_TECH' ? 'IT 기획자' : persona === 'DESIGN' ? '디자이너' : persona === 'FOUNDER' ? '창업 리더' : persona === 'WELLNESS' ? '비건/웰니스' : '랜덤'}] 페르소나 응답 자동 입력 완료`);
    setTimeout(() => setSimulatorNotice(null), 3000);
  };

  const simulatorProfile = useMemo(() => {
    const answersList: AdaptiveAnswer[] = Object.entries(simulatorAnswers).map(([qId, val]) => ({
      questionId: qId,
      version: 1,
      value: val,
    }));
    return computeUserAxisProfile(
      {
        userId: 'SIMULATOR_TEST_USER',
        gender: 'M',
        birthYear: 1992,
        cityCode: simulatorAnswers['BASE_01_CITY'] || '서울',
      },
      answersList,
      questions,
      axes
    );
  }, [simulatorAnswers, questions, axes]);

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
              { key: 'CHECKLIST', label: '체크리스트', icon: FileText },
              { key: 'QUESTIONS', label: '질문지', icon: Layers },
              { key: 'AXES', label: '축설정', icon: Sliders },
              { key: 'CALIBRATION', label: '사후비교', icon: Activity },
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

      {/* 2. 전 회원 사전/결제후 체크리스트 전수 관제 */}
      {perspective === 'CHECKLIST' && (() => {
        const baseQuestions = questions.filter((q) => q.layer === 'BASE');
        const deepQuestions = questions.filter((q) => q.layer === 'DEEP');
        const pulseQuestions = questions.filter((q) => q.layer === 'PULSE');

        const enrichedProfiles = dbProfiles.map((p) => {
          const rawSurvey = p.survey_answers ?? {};
          const isPaid = p.verified_badge === 'PAID' || Boolean(p.session_count && p.session_count > 0);
          const baseCount = baseQuestions.filter((q) => rawSurvey[q.id] !== undefined || (q.id === 'BASE_06_BUDGET' && rawSurvey['Q12_BUDGET'] !== undefined)).length;
          const deepCount = deepQuestions.filter((q) => rawSurvey[q.id] !== undefined).length;
          const pulseCount = pulseQuestions.filter((q) => rawSurvey[q.id] !== undefined).length;
          const isDeepDone = deepCount >= 18;
          const isBaseDone = baseCount >= 6;
          return {
            profile: p,
            rawSurvey,
            isPaid,
            baseCount,
            deepCount,
            pulseCount,
            isDeepDone,
            isBaseDone,
          };
        });

        const filtered = enrichedProfiles.filter((item) => {
          if (checklistFilter === 'PAID' && !item.isPaid) return false;
          if (checklistFilter === 'DEEP_DONE' && !item.isDeepDone) return false;
          if (checklistFilter === 'BASE_ONLY' && (item.isDeepDone || !item.isBaseDone)) return false;
          if (checklistFilter === 'NONE' && (item.baseCount > 0 || item.deepCount > 0)) return false;

          if (checklistSearch.trim()) {
            const query = checklistSearch.trim().toLowerCase();
            const p = item.profile;
            const matchName = (p.nickname || '').toLowerCase().includes(query);
            const matchHandle = (p.handle || '').toLowerCase().includes(query);
            const matchEmail = (p.email || '').toLowerCase().includes(query);
            const matchCity = (p.residence_city || '').toLowerCase().includes(query);
            const matchJob = (p.job_title || '').toLowerCase().includes(query);
            return matchName || matchHandle || matchEmail || matchCity || matchJob;
          }
          return true;
        });

        const totalPaidCount = enrichedProfiles.filter((i) => i.isPaid).length;
        const totalDeepCount = enrichedProfiles.filter((i) => i.isDeepDone).length;
        const totalBaseCount = enrichedProfiles.filter((i) => i.isBaseDone).length;

        return (
          <div className="space-y-3">
            {/* 상단 컨트롤 바 */}
            <div className="p-3 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h3 className="font-serif-editorial text-lg font-normal text-white">체크리스트 전수 관제</h3>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
                  전체 {enrichedProfiles.length}명 · 결제 {totalPaidCount}명 · 심층완료 {totalDeepCount}명 · 사전완료 {totalBaseCount}명
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 시험 테스트 시뮬레이터 실행 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsTestSimulatorOpen(true)}
                  className="px-3 py-1.5 border border-[#f04f74]/50 bg-[#f04f74]/10 hover:bg-[#f04f74]/20 text-white text-sm font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FlaskConical className="w-4 h-4 text-[#f04f74]" />
                  <span>시험 테스트</span>
                </button>

                {/* 실제 유저 화면 새 창 링크 */}
                <button
                  type="button"
                  onClick={() => window.open('/test', '_blank')}
                  className="px-2.5 py-1.5 border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white text-sm font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="실제 온보딩 유저 체크리스트 새 창 열기"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>유저화면</span>
                </button>

                {/* 검색창 */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={checklistSearch}
                    onChange={(e) => setChecklistSearch(e.target.value)}
                    placeholder="이름, 핸들, 지역 검색"
                    className="w-full pl-9 pr-3 py-1.5 bg-[#08090d] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#f04f74]"
                  />
                </div>
              </div>
            </div>

            {/* 필터 탭 바 */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0c0d12] border border-white/10">
              {[
                { id: 'ALL', label: `전체 (${enrichedProfiles.length})` },
                { id: 'PAID', label: `결제완료 (${totalPaidCount})` },
                { id: 'DEEP_DONE', label: `심층완료 (${totalDeepCount})` },
                { id: 'BASE_ONLY', label: `사전만완료 (${enrichedProfiles.filter((i) => i.isBaseDone && !i.isDeepDone).length})` },
                { id: 'NONE', label: `미작성 (${enrichedProfiles.filter((i) => i.baseCount === 0 && i.deepCount === 0).length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChecklistFilter(tab.id as any)}
                  className={`px-3 py-1 text-sm font-mono transition-colors cursor-pointer ${
                    checklistFilter === tab.id
                      ? 'border border-white/40 bg-white/15 text-white font-bold'
                      : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 회원 목록 2열 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filtered.length === 0 ? (
                <div className="col-span-full p-6 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-300 text-center">
                  조건에 일치하는 회원이 없습니다.
                </div>
              ) : (
                filtered.map((item) => {
                  const p = item.profile;
                  const isExpanded = expandedProfileId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                        isExpanded ? 'col-span-full border-white/30' : ''
                      }`}
                    >
                      {/* 회원 카드 요약 헤더 */}
                      <div className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                            <span className="text-sm font-bold text-white">
                              {p.nickname || p.handle}
                            </span>
                            <span className="text-sm font-mono text-zinc-400">
                              {p.gender === 'M' ? '남성' : '여성'} · {p.birth_year ? `${p.birth_year}년생` : '연령미상'} · {p.residence_city || '지역미입력'}
                            </span>
                            <span className={`px-2 py-0.5 border text-xs font-mono font-bold ${
                              item.isPaid
                                ? 'border-white/40 bg-white/15 text-white'
                                : 'border-white/10 bg-white/5 text-zinc-400'
                            }`}>
                              {item.isPaid ? '결제완료' : '미결제'}
                            </span>
                          </div>

                          {/* 체크리스트 완성도 배지 바 */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs font-mono">
                            <span className={`px-2 py-0.5 border ${
                              item.isBaseDone
                                ? 'border-white/20 bg-white/10 text-white font-medium'
                                : 'border-white/10 text-zinc-400'
                            }`}>
                              사전 체크: {item.baseCount} / {baseQuestions.length}
                            </span>
                            <span className={`px-2 py-0.5 border ${
                              item.isDeepDone
                                ? 'border-[#f04f74]/50 bg-[#f04f74]/15 text-white font-bold'
                                : item.deepCount > 0
                                ? 'border-white/20 bg-white/5 text-zinc-200'
                                : 'border-white/10 text-zinc-500'
                            }`}>
                              결제후 심층: {item.deepCount} / {deepQuestions.length} {item.isDeepDone ? '(100%)' : ''}
                            </span>
                            {item.pulseCount > 0 && (
                              <span className="px-2 py-0.5 border border-white/20 text-zinc-300">
                                컨디션: {item.pulseCount} / {pulseQuestions.length}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedProfileId(isExpanded ? null : p.id)}
                          className={`px-3 py-1.5 border text-sm font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                            isExpanded
                              ? 'border-white/50 bg-white/20 text-white font-bold'
                              : 'border-white/20 bg-white/5 hover:bg-white/15 text-zinc-200 hover:text-white'
                          }`}
                        >
                          {isExpanded ? '접기' : '열람'}
                        </button>
                      </div>

                      {/* 펼쳐진 상세 뷰 (col-span-full) */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#08090d] space-y-4">
                          {/* 서브 탭: 전체 / 사전 / 결제후 심층 / 컨디션 */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {[
                                { id: 'ALL', label: `전체 문항 (${questions.length})` },
                                { id: 'BASE', label: `사전 체크 (8)` },
                                { id: 'DEEP', label: `결제 후 심층 (24)` },
                                { id: 'PULSE', label: `컨디션 (4)` },
                              ].map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => setChecklistSubLayer(st.id as any)}
                                  className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                                    checklistSubLayer === st.id
                                      ? 'border border-white/40 bg-white/15 text-white font-bold'
                                      : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                            <span className="text-xs font-mono text-zinc-400">
                              이메일: {p.email || '없음'} • 전화: {p.phone || '없음'}
                            </span>
                          </div>

                          {/* 문항별 응답 목록 2열 그리드 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {questions
                              .filter((q) => checklistSubLayer === 'ALL' || q.layer === checklistSubLayer)
                              .map((q, idx) => {
                                const rawVal = item.rawSurvey[q.id] ?? (q.id === 'BASE_06_BUDGET' ? item.rawSurvey['Q12_BUDGET'] : undefined);
                                const isAnswered = rawVal !== undefined && String(rawVal).trim() !== '';
                                const decoded = decodeAnswerText(q, rawVal);
                                const layerLabel =
                                  q.layer === 'DEEP'
                                    ? '심층'
                                    : q.layer === 'PULSE'
                                    ? '컨디션'
                                    : '사전';

                                return (
                                  <div
                                    key={q.id}
                                    className={`p-3 border transition-colors ${
                                      isAnswered
                                        ? 'border-white/15 bg-white/[0.03]'
                                        : 'border-white/5 bg-black/30'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 text-xs font-mono mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 border border-white/10 bg-white/5 text-zinc-300">
                                          {layerLabel} · {q.categoryLabel}
                                        </span>
                                        <span className="text-zinc-500">{q.id}</span>
                                      </div>
                                      <span className={isAnswered ? 'text-white font-bold' : 'text-zinc-500'}>
                                        {isAnswered ? '응답완료' : '미응답'}
                                      </span>
                                    </div>

                                    <p className="text-sm text-zinc-300 font-light line-clamp-1 mb-2">
                                      {q.questionText}
                                    </p>

                                    <div className={`p-2 border text-sm font-mono ${
                                      isAnswered
                                        ? 'border-white/20 bg-white/5 text-white font-medium'
                                        : 'border-white/5 text-zinc-500 italic'
                                    }`}>
                                      {decoded}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* 3. 사전 예측 vs 사후 평가 비교 (실데이터 기반) */}
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

      {/* 4. 2단계 프로그레시브 질문지 관제 (BASE 8 + DEEP 24 + PULSE 4 = 36문항) */}
      {perspective === 'QUESTIONS' && (
        <div className="space-y-3">
          {/* 상단 컨트롤 바 */}
          <div className="p-3 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <h3 className="font-serif-editorial text-lg font-normal text-white">질문지 규격 관제</h3>
              <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
                총 {questions.length}문항 (사전 {questions.filter((q) => q.layer === 'BASE').length} · 결제후 {questions.filter((q) => q.layer === 'DEEP').length} · 컨디션 {questions.filter((q) => q.layer === 'PULSE').length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTestSimulatorOpen(true)}
                className="px-3 py-1.5 border border-[#f04f74]/50 bg-[#f04f74]/10 hover:bg-[#f04f74]/20 text-white text-sm font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FlaskConical className="w-4 h-4 text-[#f04f74]" />
                <span>시험 테스트</span>
              </button>

              <button
                type="button"
                onClick={() => window.open('/test', '_blank')}
                className="px-2.5 py-1.5 border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white text-sm font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                title="실제 온보딩 유저 체크리스트 새 창 열기"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>유저화면</span>
              </button>
            </div>
          </div>

          {/* 필터 바 */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0c0d12] border border-white/10">
            {[
              { id: 'ALL', label: `전체 (${questions.length})` },
              { id: 'BASE', label: `결제 전 필수 (${questions.filter((q) => q.layer === 'BASE').length})` },
              { id: 'DEEP', label: `결제 후 심층 (${questions.filter((q) => q.layer === 'DEEP').length})` },
              { id: 'PULSE', label: `컨디션 (${questions.filter((q) => q.layer === 'PULSE').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQuestionLayerFilter(tab.id as any)}
                className={`px-3 py-1 text-sm font-mono transition-colors cursor-pointer ${
                  questionLayerFilter === tab.id
                    ? 'border border-white/40 bg-white/15 text-white font-bold'
                    : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {questions
              .filter((q) => questionLayerFilter === 'ALL' || q.layer === questionLayerFilter)
              .map((q) => {
                const isExpanded = expandedQuestionId === q.id;
                const layerBadge =
                  q.layer === 'DEEP'
                    ? '결제후 심층'
                    : q.layer === 'PULSE'
                    ? '컨디션'
                    : '결제전 필수';
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
                            {layerBadge} · {q.categoryLabel}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span>식별자: {q.id}</span>
                      <span className="px-2 py-0.5 border border-white/15 bg-white/5 text-white">
                        {q.inputType === 'MULTI' ? '다중선택' : q.inputType === 'SCALE_1_5' ? '5점척도' : '단일선택'}
                      </span>
                      {q.allowCustomInput && (
                        <span className="px-2 py-0.5 border border-[#f04f74]/50 text-[#f04f74]">
                          기타 직접입력 허용
                        </span>
                      )}
                    </div>
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
        </div>
      )}

      {/* 5. 체크리스트 시험 테스트 시뮬레이터 모달 (헌법 제4조·제5조·제6조 준수) */}
      {isTestSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-5xl max-h-[92vh] flex flex-col border border-white/20 bg-[#0c0d12] shadow-2xl overflow-hidden">
            {/* 모달 상단 헤더 */}
            <div className="p-3.5 border-b border-white/10 bg-[#08090d] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h3 className="font-serif-editorial text-lg text-white font-normal">
                  체크리스트 시험 테스트 시뮬레이터
                </h3>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
                  문항 {simulatorQuestions.length}개 · 응답 {Object.keys(simulatorAnswers).filter((k) => simulatorQuestions.some((q) => q.id === k)).length}개
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 실제 유저 화면 새 창 바로가기 버튼군 */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-zinc-500">실제화면:</span>
                  <button
                    type="button"
                    onClick={() => window.open('/test', '_blank')}
                    className="px-2 py-1 border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>사전(8)</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open('/test?mode=DEEP', '_blank')}
                    className="px-2 py-1 border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>결제후(24)</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open('/test?mode=PULSE', '_blank')}
                    className="px-2 py-1 border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>컨디션(4)</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTestSimulatorOpen(false)}
                  className="p-1.5 border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
                  title="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 안내 토스트 (있을 경우) */}
            {simulatorNotice && (
              <div className="px-4 py-2 border-b border-white/15 bg-white/10 text-white text-sm font-mono flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#f04f74]" />
                  <span>{simulatorNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSimulatorNotice(null)}
                  className="text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  닫기
                </button>
              </div>
            )}

            {/* 모드 선택 및 페르소나 자동 응답 바 */}
            <div className="p-3 border-b border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              {/* 모드 탭 */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'ALL', label: `전체 (${questions.length})` },
                  { id: 'BASE', label: `사전 (${questions.filter((q) => q.layer === 'BASE').length})` },
                  { id: 'DEEP', label: `결제후 (${questions.filter((q) => q.layer === 'DEEP').length})` },
                  { id: 'PULSE', label: `컨디션 (${questions.filter((q) => q.layer === 'PULSE').length})` },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSimulatorMode(m.id as any);
                      setSimulatorStepIdx(0);
                    }}
                    className={`px-2.5 py-1 text-sm font-mono cursor-pointer transition-colors ${
                      simulatorMode === m.id
                        ? 'border border-white/40 bg-white/15 text-white font-bold'
                        : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* 가상 페르소나 5종 원클릭 자동 응답 */}
              <div className="flex flex-wrap items-center gap-1 text-sm font-mono">
                <span className="text-zinc-400 hidden md:inline text-xs">페르소나 채우기:</span>
                <button
                  type="button"
                  onClick={() => applyPersonaAnswers('IT_TECH')}
                  className="px-2.5 py-1 border border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                >
                  IT 기획자
                </button>
                <button
                  type="button"
                  onClick={() => applyPersonaAnswers('DESIGN')}
                  className="px-2.5 py-1 border border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                >
                  디자이너
                </button>
                <button
                  type="button"
                  onClick={() => applyPersonaAnswers('FOUNDER')}
                  className="px-2.5 py-1 border border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                >
                  창업 리더
                </button>
                <button
                  type="button"
                  onClick={() => applyPersonaAnswers('WELLNESS')}
                  className="px-2.5 py-1 border border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                >
                  비건/웰니스
                </button>
                <button
                  type="button"
                  onClick={() => applyPersonaAnswers('RANDOM')}
                  className="px-2.5 py-1 border border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                >
                  랜덤
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimulatorAnswers({});
                    setSimulatorStepIdx(0);
                    setSimulatorNotice('전체 응답이 초기화되었습니다.');
                    setTimeout(() => setSimulatorNotice(null), 2000);
                  }}
                  className="px-2 py-1 border border-white/10 text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="전체 응답 비우기"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">초기화</span>
                </button>
              </div>
            </div>

            {/* 모달 본문 (2열 그리드: 좌측 문항 풀기 vs 우측 실시간 4대 축 및 프로필 계산 결과) */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* 좌측: 문항 직접 풀기 & 검증 (7열) */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                {(() => {
                  const totalCount = simulatorQuestions.length;
                  if (totalCount === 0) {
                    return (
                      <div className="p-8 border border-white/10 text-center text-zinc-400 text-sm font-mono">
                        선택된 레이어에 질문이 없습니다.
                      </div>
                    );
                  }
                  const safeIdx = Math.min(Math.max(0, simulatorStepIdx), totalCount - 1);
                  const currentQ = simulatorQuestions[safeIdx];
                  const currentVal = simulatorAnswers[currentQ.id] || '';
                  const tokens = currentVal ? currentVal.split(',').filter(Boolean) : [];
                  const isScale = currentQ.inputType === 'SCALE_1_5';
                  const isMulti = currentQ.inputType === 'MULTI';
                  const maxSelect = currentQ.maxSelectCount ?? 2;

                  return (
                    <div className="space-y-4">
                      {/* 진행도 바 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 border border-white/15 bg-white/5 text-white font-bold">
                              {currentQ.layer === 'DEEP' ? '결제후 심층' : currentQ.layer === 'PULSE' ? '컨디션' : '결제전 필수'}
                            </span>
                            <span>{currentQ.categoryLabel}</span>
                            <span className="text-zinc-500 font-mono">({currentQ.id})</span>
                          </div>
                          <span className="text-white font-bold">
                            문항 {safeIdx + 1} / {totalCount}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-black/50 border border-white/10 overflow-hidden">
                          <div
                            className="h-full bg-white transition-all duration-200"
                            style={{ width: `${((safeIdx + 1) / totalCount) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* 질문 본문 */}
                      <div className="p-4 border border-white/15 bg-[#08090d] space-y-2">
                        <h4 className="text-base text-white font-medium leading-relaxed">
                          {currentQ.questionText}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                          <span>
                            입력방식:{' '}
                            <strong className="text-zinc-200">
                              {isScale ? '5점 척도 (1~5)' : isMulti ? `복수 선택 (최대 ${maxSelect}개)` : '단일 선택'}
                            </strong>
                          </span>
                          {currentQ.allowCustomInput && (
                            <span className="text-[#f04f74] border-l border-white/10 pl-2">
                              기타 직접입력 가능
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 입력 UI: 5점 척도 */}
                      {isScale && (
                        <div className="space-y-3 p-4 border border-white/10 bg-[#08090d]">
                          <div className="flex justify-between text-xs font-mono text-zinc-400">
                            <span>1점: {currentQ.scaleConfig?.minLabel || '전혀 아님'}</span>
                            <span>5점: {currentQ.scaleConfig?.maxLabel || '매우 그러함'}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((num) => {
                              const isSelected = currentVal === String(num);
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() =>
                                    setSimulatorAnswers((prev) => ({
                                      ...prev,
                                      [currentQ.id]: String(num),
                                    }))
                                  }
                                  className={`py-3.5 border text-base font-mono font-bold cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-white bg-white text-black shadow-lg scale-105'
                                      : 'border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 입력 UI: 선택지 (단일 / 복수) */}
                      {!isScale && currentQ.options && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {currentQ.options.map((opt) => {
                              const isSelected = isMulti
                                ? tokens.includes(opt.id)
                                : currentVal === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    if (isMulti) {
                                      if (tokens.includes(opt.id)) {
                                        const next = tokens.filter((t) => t !== opt.id);
                                        setSimulatorAnswers((prev) => ({
                                          ...prev,
                                          [currentQ.id]: next.join(','),
                                        }));
                                      } else {
                                        if (tokens.length >= maxSelect) {
                                          setSimulatorNotice(`최대 ${maxSelect}개까지만 선택할 수 있습니다.`);
                                          setTimeout(() => setSimulatorNotice(null), 2500);
                                          return;
                                        }
                                        const next = [...tokens, opt.id];
                                        setSimulatorAnswers((prev) => ({
                                          ...prev,
                                          [currentQ.id]: next.join(','),
                                        }));
                                      }
                                    } else {
                                      setSimulatorAnswers((prev) => ({
                                        ...prev,
                                        [currentQ.id]: opt.id,
                                      }));
                                    }
                                  }}
                                  className={`p-3 border text-left cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-white bg-white/20 text-white font-bold'
                                      : 'border-white/10 bg-[#08090d] text-zinc-300 hover:border-white/25 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm">{opt.label}</span>
                                    <span className={`w-3 h-3 rounded-full border ${
                                      isSelected ? 'border-white bg-white' : 'border-white/30'
                                    }`} />
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* 직접입력 필드 */}
                          {currentQ.allowCustomInput && (
                            <div className="p-3 border border-white/10 bg-[#08090d] space-y-1.5">
                              <span className="text-xs font-mono text-zinc-400">기타 직접입력:</span>
                              <input
                                type="text"
                                value={
                                  tokens.find((t) => t.startsWith('CUSTOM:'))?.slice(7) ||
                                  (currentVal.startsWith('CUSTOM:') ? currentVal.slice(7) : '')
                                }
                                onChange={(e) => {
                                  const text = e.target.value.trim();
                                  if (isMulti) {
                                    const nonCustom = tokens.filter((t) => !t.startsWith('CUSTOM:'));
                                    if (text) {
                                      if (nonCustom.length >= maxSelect) {
                                        setSimulatorNotice(`최대 ${maxSelect}개까지만 선택할 수 있습니다.`);
                                        setTimeout(() => setSimulatorNotice(null), 2500);
                                        return;
                                      }
                                      setSimulatorAnswers((prev) => ({
                                        ...prev,
                                        [currentQ.id]: [...nonCustom, `CUSTOM:${text}`].join(','),
                                      }));
                                    } else {
                                      setSimulatorAnswers((prev) => ({
                                        ...prev,
                                        [currentQ.id]: nonCustom.join(','),
                                      }));
                                    }
                                  } else {
                                    setSimulatorAnswers((prev) => ({
                                      ...prev,
                                      [currentQ.id]: text ? `CUSTOM:${text}` : '',
                                    }));
                                  }
                                }}
                                placeholder="원하는 답이 없을 경우 직접 입력하세요"
                                className="w-full px-3 py-1.5 bg-black/40 border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* 하단 스텝 이동 네비게이션 */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          disabled={safeIdx === 0}
                          onClick={() => setSimulatorStepIdx(Math.max(0, safeIdx - 1))}
                          className={`px-3 py-1.5 border text-sm font-mono flex items-center gap-1.5 cursor-pointer ${
                            safeIdx === 0
                              ? 'border-white/5 text-zinc-600 cursor-not-allowed'
                              : 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                          }`}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>이전</span>
                        </button>

                        {/* 번호 퀵 점프 칩 */}
                        <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-md py-1">
                          {simulatorQuestions.map((q, idx) => {
                            const isAnswered = Boolean(simulatorAnswers[q.id]);
                            const isCurrent = idx === safeIdx;
                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => setSimulatorStepIdx(idx)}
                                className={`w-6 h-6 shrink-0 border text-xs font-mono cursor-pointer transition-colors ${
                                  isCurrent
                                    ? 'border-white bg-white text-black font-bold'
                                    : isAnswered
                                    ? 'border-white/40 bg-white/15 text-white font-medium'
                                    : 'border-white/10 bg-black/30 text-zinc-500 hover:text-zinc-300'
                                }`}
                                title={`${idx + 1}. ${q.questionText}`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          disabled={safeIdx === totalCount - 1}
                          onClick={() => setSimulatorStepIdx(Math.min(totalCount - 1, safeIdx + 1))}
                          className={`px-3 py-1.5 border text-sm font-mono flex items-center gap-1.5 cursor-pointer ${
                            safeIdx === totalCount - 1
                              ? 'border-white/5 text-zinc-600 cursor-not-allowed'
                              : 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                          }`}
                        >
                          <span>다음</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 우측: 실시간 4대 축 점수 및 프로필 디코딩 결과 패널 (5열) */}
              <div className="lg:col-span-5 space-y-3.5 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-4">
                <div className="p-3 border border-white/10 bg-[#08090d] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <span className="text-sm font-bold text-white">4대 동적 축 점수 실시간 산출</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">100점 환산</span>
                </div>

                {/* 4대 동적 축 점수 게이지 바 */}
                <div className="space-y-2.5">
                  {axes.map((axis) => {
                    const score = simulatorProfile.axisScores[axis.axisId] ?? 50;
                    const minAnchor = axis.anchors[0] || '최소';
                    const maxAnchor = axis.anchors[axis.anchors.length - 1] || '최대';
                    const currentAnchor = simulatorProfile.axisLabels[axis.axisId] || '균형';
                    return (
                      <div
                        key={axis.axisId}
                        className="p-3 border border-white/10 bg-[#08090d] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-medium">{axis.label}</span>
                            <span className="px-1.5 py-0.2 border border-white/15 bg-white/5 text-zinc-300">
                              {currentAnchor}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">가중치 {axis.weight}</span>
                            <span className="text-white font-bold text-sm">{score}점</span>
                          </div>
                        </div>

                        {/* 게이지 바 */}
                        <div className="w-full h-2 bg-black/60 border border-white/15 overflow-hidden">
                          <div
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                          <span>0점: {minAnchor}</span>
                          <span>100점: {maxAnchor}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 프로필 디코딩 판정 요약 */}
                <div className="p-3.5 border border-white/10 bg-[#08090d] space-y-2 text-sm font-mono">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-zinc-400">추정 매칭 목적:</span>
                    <span className="text-white font-bold px-2 py-0.5 border border-white/20 bg-white/10">
                      {simulatorProfile.purpose}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-zinc-400">희망 도시:</span>
                    <span className="text-white font-medium">
                      {simulatorProfile.cityCode || '서울'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-zinc-400">식단 제약:</span>
                    <span className="text-white font-medium">
                      {simulatorAnswers['DEEP_D01_DIETARY_RESTRICTIONS'] || '미설정 (결제후 단계)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-zinc-400">가격대:</span>
                    <span className="text-white font-medium">
                      {simulatorAnswers['BASE_06_BUDGET'] === '$$$' ? '10만원 이하' : simulatorAnswers['BASE_06_BUDGET'] === '$$' ? '7만원 이하' : simulatorAnswers['BASE_06_BUDGET'] === '$' ? '3만원 이하' : '상관없음'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400">직무/언어:</span>
                    <span className="text-white font-medium line-clamp-1">
                      {simulatorAnswers['BASE_04_INDUSTRY'] || '미입력'} / {simulatorAnswers['BASE_07_LANGUAGE'] || 'KO'}
                    </span>
                  </div>
                </div>

                {/* 모의 방 적합도 산출 가이드 */}
                <div className="p-3 border border-white/10 bg-[#08090d] text-xs font-mono text-zinc-400 space-y-1">
                  <div className="text-zinc-300 font-bold">💡 실시간 알고리즘 검증 안내</div>
                  <div>• 페르소나 버튼 클릭 시 36문항에 실질적인 응답이 1초 만에 입력됩니다.</div>
                  <div>• 우측 4대 축 점수가 가중치 공식에 따라 실시간 0~100점으로 정규화됩니다.</div>
                  <div>• 실제 온보딩 유저 환경은 상단 [유저화면] 버튼을 통해 새 창에서 검증 가능합니다.</div>
                </div>
              </div>
            </div>

            {/* 모달 하단 닫기 바 */}
            <div className="p-3 border-t border-white/10 bg-[#08090d] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsTestSimulatorOpen(false)}
                className="px-4 py-1.5 border border-white/20 bg-white/10 hover:bg-white/20 text-white text-sm font-mono font-medium cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
