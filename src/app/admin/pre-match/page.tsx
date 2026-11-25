'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  useNadoSoloEngine,
  ConditionalEventItem,
  computeUserAxisProfile,
  runUnifiedMatchingPipeline,
  AdaptiveAnswer,
  DEFAULT_MATCHING_AXES,
  DEFAULT_ADAPTIVE_QUESTIONS,
  PURPOSE_ENGINE_PROFILES,
  PURPOSE_LABELS,
  PurposeCode,
  MatchingAxisSpec,
} from '@/engine';
import { nadoSoloSupabaseService, DbProfile } from '@/lib/supabase/service';
import { Shield, RefreshCw, ArrowUpRight, Check, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

type ProcessStep = 'STEP1_SURVEY' | 'STEP2_PROFILE' | 'STEP3_RUBRIC' | 'STEP4_RESULT' | 'STEP5_AUDIT';

export default function AdminPreMatchPage() {
  const { currentUser, conditionalEvents, addConditionalEvent } = useNadoSoloEngine();
  const [dbProfiles, setDbProfiles] = useState<DbProfile[]>([]);
  const [paidUserIds, setPaidUserIds] = useState<Set<string>>(new Set());
  const [requirePaidOnly, setRequirePaidOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<ProcessStep>('STEP4_RESULT');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'PRE_MATCH' | 'WAITLIST' | 'PUBLISHED'>('ALL');
  const [coreCount, setCoreCount] = useState<3 | 4>(4);
  const [axes, setAxes] = useState<MatchingAxisSpec[]>(() =>
    DEFAULT_MATCHING_AXES.map((a) => ({ ...a }))
  );
  const [showSimulatorBar, setShowSimulatorBar] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoRunResult, setAutoRunResult] = useState<{
    timestamp: string;
    mode: 'DRY_RUN' | 'EXECUTE';
    allAuditPassed: boolean;
    stats: {
      totalProfiles: number;
      paidCount: number;
      unpaidCount: number;
      roomCount: number;
      assignedVenueCount: number;
      rolloverCount: number;
      newlyCommittedRooms: number;
      newlyCommittedMembers: number;
    };
    rooms: Array<{
      roomId: string;
      title: string;
      assignedVenueName: string;
      expectedScore100: number;
      alreadyPublished: boolean;
    }>;
    commitErrors?: string[];
  } | null>(null);

  // 헌법 제6조 원칙 3: 리스트 우선 조망 -> 클릭 시 상세 노출 (기본 닫힘)
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedRubricCode, setExpandedRubricCode] = useState<PurposeCode | null>(null);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [expandedMemberKey, setExpandedMemberKey] = useState<string | null>(null);
  const [expandedWaitlistId, setExpandedWaitlistId] = useState<string | null>(null);
  const [showWaitlistSection, setShowWaitlistSection] = useState(false);
  const [waitlistPage, setWaitlistPage] = useState(1);
  const [showPublishedSection, setShowPublishedSection] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.handle === '@admin' ||
    currentUser?.userId === 'ADMIN_01';

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profiles, applications] = await Promise.all([
        nadoSoloSupabaseService.getAllProfiles(),
        nadoSoloSupabaseService.getAllEventApplications(),
      ]);
      const paidSet = new Set<string>(
        applications
          .filter((a) => a.status === 'APPLIED' || a.status === 'CONFIRMED')
          .map((a) => a.user_id)
      );
      setPaidUserIds(paidSet);
      setDbProfiles(profiles.filter((p) => p.id !== 'ADMIN_01' && p.handle !== '@admin'));
    } catch (e) {
      console.error('가매칭 실회원 로드 실패:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadProfiles();
    }
  }, [isAdmin, loadProfiles]);

  const participants = useMemo(() => {
    return dbProfiles.map((p) => {
      const rawSurvey = p.survey_answers ?? {};
      const answers: AdaptiveAnswer[] = Object.entries(rawSurvey).map(([qId, val]) => ({
        questionId: qId,
        version: 1,
        value: val,
      }));
      const isPaid =
        paidUserIds.has(p.id) ||
        p.matching_stage === 'APPLIED' ||
        p.matching_stage === 'PRE_MATCHED' ||
        p.matching_stage === 'CONFIRMED';

      return computeUserAxisProfile(
        {
          userId: p.nickname || p.handle,
          gender: p.gender === 'M' ? 'M' : 'F',
          birthYear: p.birth_year || 1994,
          cityCode: p.residence_city || '서울',
          districtName: p.residence_district,
          dietary: p.dietary || 'NONE',
          purpose: p.preferred_purpose,
          isPaid,
          memberStage: p.matching_stage,
        },
        answers
      );
    });
  }, [dbProfiles, paidUserIds]);

  const pipelineResult = useMemo(
    () =>
      runUnifiedMatchingPipeline({
        participants,
        axes,
        coreCount,
        requirePaid: requirePaidOnly,
      }),
    [participants, axes, coreCount, requirePaidOnly]
  );

  const grouping = pipelineResult.grouping;
  const auditCases = pipelineResult.auditCases;
  const auditFailCount = auditCases.filter((c) => c.status === 'FAIL').length;

  const isPublishedToMeetup = useCallback(
    (roomTitle: string) => conditionalEvents.some((ev) => ev.title.includes(roomTitle)),
    [conditionalEvents]
  );

  const adjustWeight = (axisId: string, delta: number) => {
    setAxes((prev) =>
      prev.map((a) =>
        a.axisId === axisId
          ? { ...a, weight: Math.max(5, Math.min(80, a.weight + delta)) }
          : a
      )
    );
  };

  const profileIdByLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of dbProfiles) {
      map.set(p.nickname || p.handle, p.id);
    }
    return map;
  }, [dbProfiles]);

  const handleRunAutoPipeline = async (mode: 'DRY_RUN' | 'EXECUTE') => {
    setIsAutoRunning(true);
    try {
      const res = await fetch('/api/pipeline/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          requirePaid: requirePaidOnly,
          coreCount,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setToastMsg(data.error || '자동 파이프라인 실행 중 오류가 발생했습니다.');
      } else {
        setAutoRunResult(data);
        if (mode === 'EXECUTE') {
          for (const room of grouping.rooms) {
            if (!isPublishedToMeetup(room.spec.title)) {
              addConditionalEvent({
                eventId: `EVT-${room.roomId}-${Date.now().toString().slice(-4)}`,
                title: room.spec.title,
                districtId: room.spec.cityCode === '부산' ? 'BUSAN_HAEUNDAE' : 'SEOUL_GANGNAM',
                regionName: room.spec.cityCode,
                districtName:
                  room.spec.districtName || (room.spec.cityCode === '부산' ? '해운대구' : '강남구'),
                venueId:
                  room.assignedVenueId ||
                  (room.spec.cityCode === '부산' ? 'VEN_BUSAN_HAEUNDAE_01' : 'VEN_SEOUL_GANGNAM_01'),
                venueNameOverride: room.assignedVenueName,
                dateText: room.spec.scheduleSlot,
                eventDate: room.spec.scheduleSlot.slice(0, 10),
                eventTime: room.spec.scheduleSlot.slice(-5),
                mode: '3:3 소셜 다이닝',
                purpose: room.spec.purpose,
                compositionMode: '3:3 성비균형',
                enforceGenderRatio: true,
                priceKrw: 30000,
                maxCapacity: 6,
                minConfirmCount: 4,
                status: 'RECRUITING',
                requiredBadgeIds: [],
                minTotalScore100: 0,
                activePresetSubIds: [],
                reason: `일괄확정 · ${PURPOSE_LABELS[room.spec.purpose]} 기준 ${room.expectedScore100}점`,
              });
            }
          }
          await loadProfiles();
          setToastMsg(
            data.stats.newlyCommittedRooms > 0
              ? `자동 실행 완료: 신규 ${data.stats.newlyCommittedRooms}방 · ${data.stats.newlyCommittedMembers}명 DB 확정`
              : `로컬 밋업 ${grouping.rooms.length}방 반영 완료 (DB meetups 테이블 확인 필요)`
          );
        } else {
          setToastMsg(
            `사전 검증 완료: ${data.stats.roomCount}방 · 식당 ${data.stats.assignedVenueCount}곳 배정 가능`
          );
        }
      }
    } catch {
      setToastMsg('서버 자동 파이프라인 호출에 실패했습니다.');
    } finally {
      setIsAutoRunning(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const handlePublishToMeetup = async (room: (typeof grouping.rooms)[number]) => {
    if (isPublishedToMeetup(room.spec.title)) {
      setToastMsg('이미 /meetup 페이지에 개설된 방입니다.');
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }

    const newEvent: ConditionalEventItem = {
      eventId: `EVT-${room.roomId}-${Date.now().toString().slice(-4)}`,
      title: room.spec.title,
      districtId: room.spec.cityCode === '부산' ? 'BUSAN_HAEUNDAE' : 'SEOUL_GANGNAM',
      regionName: room.spec.cityCode,
      districtName: room.spec.districtName || (room.spec.cityCode === '부산' ? '해운대구' : '강남구'),
      venueId:
        room.assignedVenueId ||
        (room.spec.cityCode === '부산' ? 'VEN_BUSAN_HAEUNDAE_01' : 'VEN_SEOUL_GANGNAM_01'),
      venueNameOverride: room.assignedVenueName,
      dateText: room.spec.scheduleSlot,
      eventDate: room.spec.scheduleSlot.slice(0, 10),
      eventTime: room.spec.scheduleSlot.slice(-5),
      mode: '3:3 소셜 다이닝',
      purpose: room.spec.purpose,
      compositionMode: '3:3 성비균형',
      enforceGenderRatio: true,
      priceKrw: 30000,
      maxCapacity: 6,
      minConfirmCount: 4,
      status: 'RECRUITING',
      requiredBadgeIds: [],
      minTotalScore100: 0,
      activePresetSubIds: [],
      reason: `가매칭 확정 · ${PURPOSE_LABELS[room.spec.purpose]} 기준 ${room.expectedScore100}점`,
    };
    addConditionalEvent(newEvent);

    const memberIds = room.members
      .map((m) => profileIdByLabel.get(m.userId) ?? m.userId)
      .filter(Boolean);
    const dbRes = await nadoSoloSupabaseService.commitMatchedRoomSession(newEvent, memberIds);

    setToastMsg(
      dbRes.ok
        ? `[${room.spec.title}] DB 확정 · ${dbRes.updatedMembers}명 리포트 초기화 완료`
        : `[${room.spec.title}] /meetup 개설 완료 (DB 동기화 대기)`
    );
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (!isAdmin) {
    return (
      <main className="min-h-[75vh] bg-[#07080a] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-white/15 bg-[#0c0d12] p-8 text-center space-y-4">
          <div className="w-10 h-10 mx-auto border border-white/25 bg-white/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-serif-editorial text-2xl font-normal">관리자 전용 가매칭</h1>
          <p className="text-sm text-zinc-400">
            가매칭 방 관제 페이지는 관리자 계정(@admin)으로 로그인한 경우에만 열람할 수 있습니다.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/auth"
              className="w-full py-3 border border-white/25 bg-white/10 text-white text-sm font-mono font-bold"
            >
              관리자 로그인
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-white/15 text-zinc-300 text-sm font-mono"
            >
              홈으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto space-y-4">
        {/* 상단 프로세스 네비게이션 바 (1 -> 2 -> 3 -> 4단계 순서 추적) */}
        <div className="p-3 border border-white/10 bg-[#0c0d12] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <h1 className="font-serif-editorial text-lg text-white font-normal">
                가매칭 검증
              </h1>
              <span className="text-sm font-mono px-2 py-0.5 border border-white/25 bg-white/10 text-white font-bold">
                실회원 {participants.length}명 · {grouping.rooms.length}방 · 대기 {grouping.unassigned.length}명
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRequirePaidOnly((v) => !v)}
                className={`px-2.5 py-1 border text-sm font-mono cursor-pointer ${
                  requirePaidOnly
                    ? 'border-[#f04f74] bg-[#f04f74]/20 text-white font-bold'
                    : 'border-white/25 bg-white/10 text-white'
                }`}
              >
                {requirePaidOnly ? '실매칭(입금자만)' : '시뮬레이션(전체)'}
              </button>

              <button
                type="button"
                onClick={() => setShowSimulatorBar((v) => !v)}
                className={`px-2.5 py-1 border text-sm font-mono flex items-center gap-1 cursor-pointer ${
                  showSimulatorBar
                    ? 'border-white/40 bg-white/15 text-white font-bold'
                    : 'border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>변수</span>
              </button>

              <button
                type="button"
                disabled={isAutoRunning}
                onClick={() => handleRunAutoPipeline('DRY_RUN')}
                className="px-2.5 py-1 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-white cursor-pointer disabled:opacity-50"
              >
                {isAutoRunning ? '실행중' : '사전검증'}
              </button>

              <button
                type="button"
                disabled={isAutoRunning}
                onClick={() => handleRunAutoPipeline('EXECUTE')}
                className="px-2.5 py-1 border border-[#f04f74] bg-[#f04f74] hover:opacity-90 text-sm font-mono text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {isAutoRunning ? '처리중' : '일괄확정'}
              </button>

              <button
                type="button"
                onClick={loadProfiles}
                className="px-2.5 py-1 border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-mono text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>

              <Link
                href="/meetup"
                prefetch={true}
                className="px-2.5 py-1 border border-[#f04f74]/50 bg-[#f04f74]/15 hover:bg-[#f04f74]/25 text-sm font-mono text-white flex items-center gap-1"
              >
                <span>밋업</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 1 -> 2 -> 3 -> 4 -> 5 프로세스 순서 & 예외검증 탭 */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-1.5 pt-2 border-t border-white/[0.06] text-sm font-mono">
            {(
              [
                { key: 'STEP1_SURVEY', label: '1. 설문·매핑', sub: `${DEFAULT_ADAPTIVE_QUESTIONS.length}문항 연결` },
                { key: 'STEP2_PROFILE', label: '2. 회원별 환산', sub: `${participants.length}명 좌표` },
                { key: 'STEP3_RUBRIC', label: '3. 방 100점 기준', sub: '4대 목적 채점표' },
                { key: 'STEP4_RESULT', label: '4. 최종 매칭·대기', sub: `${grouping.rooms.length}방 편성` },
                { key: 'STEP5_AUDIT', label: '5. 예외검증', sub: `결함 ${auditFailCount}건 감지` },
              ] as const
            ).map((step) => {
              const active = activeStep === step.key;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveStep(step.key)}
                  className={`px-3 py-2 border text-left cursor-pointer transition-colors ${
                    active
                      ? 'border-white/40 bg-white/15 text-white font-bold'
                      : 'border-white/10 bg-[#08090d] text-zinc-400 hover:text-white hover:border-white/25'
                  }`}
                >
                  <span className="block">{step.label}</span>
                  <span className="text-sm font-normal text-zinc-400 block">{step.sub}</span>
                </button>
              );
            })}
          </div>

          {autoRunResult && (
            <div className="p-3 border border-white/15 bg-[#08090d] space-y-2 text-sm font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <span className="text-white font-bold">
                    서버 검증 ({autoRunResult.mode === 'EXECUTE' ? '일괄확정' : '사전검증'})
                  </span>
                  <span className="px-2 py-0.5 border border-white/20 text-white">
                    감사 {autoRunResult.allAuditPassed ? '6/6 PASS' : '결함감지'}
                  </span>
                  <span className="text-zinc-300">
                    회원 {autoRunResult.stats.totalProfiles}명 → 방 {autoRunResult.stats.roomCount}개 → 식당 {autoRunResult.stats.assignedVenueCount}곳 → DB확정 {autoRunResult.stats.newlyCommittedRooms}방({autoRunResult.stats.newlyCommittedMembers}명) → 대기 {autoRunResult.stats.rolloverCount}명
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoRunResult(null)}
                  className="px-2 py-0.5 border border-white/20 text-white hover:bg-white/10 cursor-pointer"
                >
                  닫기
                </button>
              </div>
              {autoRunResult.commitErrors && autoRunResult.commitErrors.length > 0 && (
                <div className="p-2 border border-[#f04f74]/50 bg-[#f04f74]/10 text-white">
                  DB 저장 경고: {autoRunResult.commitErrors[0]} (로컬 밋업에는 반영됨 · Supabase에 schema.sql의 meetups 테이블 생성 필요)
                </div>
              )}
              {autoRunResult.rooms.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1 border-t border-white/10">
                  {autoRunResult.rooms.map((r) => (
                    <div
                      key={r.roomId}
                      className="px-2.5 py-1.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-2"
                    >
                      <span className="text-white truncate">{r.title}</span>
                      <span className="text-zinc-300 shrink-0">
                        {r.assignedVenueName} · {r.expectedScore100}점 · {r.alreadyPublished ? '개설완료' : '개설대기'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showSimulatorBar && (
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-sm font-mono">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">코어:</span>
                {([3, 4] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setCoreCount(cnt)}
                    className={`px-2.5 py-1 border cursor-pointer ${
                      coreCount === cnt
                        ? 'border-white/40 bg-white/15 text-white font-bold'
                        : 'border-white/15 bg-black/30 text-zinc-300'
                    }`}
                  >
                    고정 {cnt} / 유동 {6 - cnt}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {axes.map((ax) => (
                  <div
                    key={ax.axisId}
                    className="flex items-center gap-1.5 px-2.5 py-1 border border-white/15 bg-[#08090d]"
                  >
                    <span className="text-zinc-300">{ax.label}</span>
                    <button
                      type="button"
                      onClick={() => adjustWeight(ax.axisId, -5)}
                      className="px-1.5 border border-white/15 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-white font-bold w-6 text-center">{ax.weight}</span>
                    <button
                      type="button"
                      onClick={() => adjustWeight(ax.axisId, 5)}
                      className="px-1.5 border border-white/15 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {toastMsg && (
          <div className="p-3 border border-white/25 bg-white/10 text-sm font-mono text-white">
            {toastMsg}
          </div>
        )}

        {/* ==============================================================
            [STEP 1] 설문·매핑: 질문지 각 문항이 어느 요소로 연결되는지 확인
           ============================================================== */}
        {activeStep === 'STEP1_SURVEY' && (
          <section className="space-y-2.5">
            <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h2 className="font-serif-editorial text-lg text-white font-normal">
                  1단계 · 설문 문항 → 엔진 요소 연결
                </h2>
              </div>
              <span className="text-sm font-mono text-zinc-400">클릭 시 선택지/척도 상세</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {DEFAULT_ADAPTIVE_QUESTIONS.map((q, idx) => {
                const isOpen = expandedQuestionId === q.id;
                const mappedTargets =
                  q.inputType === 'SCALE_1_5' && q.scaleConfig
                    ? Object.keys(q.scaleConfig.axisWeights).join(', ')
                    : Array.from(
                        new Set(
                          (q.options || []).flatMap((o) => [
                            ...Object.keys(o.axisScores || {}),
                            ...Object.keys(o.metaTag || {}),
                          ])
                        )
                      ).join(', ');

                return (
                  <div
                    key={q.id}
                    className={`border border-white/10 bg-[#0c0d12] ${
                      isOpen ? 'col-span-full border-white/25' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedQuestionId(isOpen ? null : q.id)}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer hover:bg-white/[0.02] text-sm font-mono"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 border border-white/25 bg-white/10 text-white font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-zinc-300 shrink-0">
                            {q.layer === 'PULSE' ? '컨디션' : '기본'}·{q.categoryLabel}
                          </span>
                          <span className="text-white truncate">→ {mappedTargets || '메타'}</span>
                        </div>
                        <p className="text-white font-normal truncate">{q.questionText}</p>
                      </div>
                      <span className="text-zinc-400 shrink-0">{isOpen ? '▾' : '▸'}</span>
                    </button>

                    {isOpen && (
                      <div className="p-3.5 border-t border-white/10 bg-[#08090d] text-sm font-mono space-y-1.5">
                        <div className="text-zinc-400">문항 ID: {q.id} ({q.inputType})</div>
                        {q.scaleConfig && (
                          <div className="text-zinc-200">
                            척도: 1({q.scaleConfig.minLabel}) ↔ 5({q.scaleConfig.maxLabel})
                          </div>
                        )}
                        {q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {q.options.map((opt) => (
                              <div key={opt.id} className="p-2 border border-white/10 bg-[#0c0d12] text-zinc-200">
                                <span className="text-white font-bold block">{opt.label}</span>
                                <span className="text-zinc-400">
                                  {opt.axisScores
                                    ? Object.entries(opt.axisScores)
                                        .map(([k, v]) => `${k}:${v}`)
                                        .join(' ')
                                    : ''}
                                  {opt.metaTag
                                    ? Object.entries(opt.metaTag)
                                        .map(([k, v]) => `${k}=${v}`)
                                        .join(' ')
                                    : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==============================================================
            [STEP 2] 회원별 환산: 원문 응답 -> 개인 좌표 (실입력 vs 기본값 구분)
           ============================================================== */}
        {activeStep === 'STEP2_PROFILE' && (
          <section className="space-y-2.5">
            <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h2 className="font-serif-editorial text-lg text-white font-normal">
                  2단계 · 회원별 설문 원문 → 환산 좌표
                </h2>
              </div>
              <span className="text-sm font-mono text-zinc-400">실입력/기본값 구분 · 클릭 시 원문 대조</span>
            </div>

            <div className="border border-white/10 bg-[#0c0d12] divide-y divide-white/[0.06]">
              {participants.map((u, idx) => {
                const isOpen = expandedUserId === `${u.userId}-${idx}`;
                return (
                  <div key={`${u.userId}-${idx}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedUserId(isOpen ? null : `${u.userId}-${idx}`)
                      }
                      className="w-full px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm font-mono hover:bg-white/[0.02] cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-zinc-400">{isOpen ? '▾' : '▸'}</span>
                        <span
                          className={`px-2 py-0.5 border font-bold ${
                            u.isPaid
                              ? 'border-white/25 bg-white/10 text-white'
                              : 'border-[#f04f74]/50 bg-[#f04f74]/10 text-white'
                          }`}
                        >
                          {u.isPaid ? '입금완료' : '미입금'}
                        </span>
                        <span className="text-white font-bold">{u.userId}</span>
                        <span className="text-zinc-300">
                          {u.gender === 'F' ? '여' : '남'}·{u.birthYear}·거주:{u.residenceCity}
                          {u.targetCity !== u.residenceCity && (
                            <span className="text-[#f04f74] font-bold"> → 희망:{u.targetCity}</span>
                          )}
                        </span>
                        <span className="text-white">목적:{u.axisLabels.PURPOSE}</span>
                        <span className="text-zinc-300">
                          예산:{u.budgetTier}
                          <span className={u.isDefaultBudget ? 'text-zinc-500' : 'text-white'}>
                            ({u.isDefaultBudget ? '기본값' : '실입력'})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 border border-white/15 bg-white/5 text-zinc-200">
                          응답 {u.answeredQuestionCount}/{DEFAULT_ADAPTIVE_QUESTIONS.length}
                        </span>
                        <span className="px-2 py-0.5 border border-white/25 bg-white/10 text-white">
                          깊이:{u.axisScores.DEPTH} · 테마:{u.axisScores.THEME} · 에너지:{u.axisScores.ENERGY}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-3.5 border-t border-white/10 bg-[#08090d] space-y-2 text-sm font-mono">
                        <div className="text-zinc-300">
                          직군: {u.industry} · 관계: {u.relationshipStatus} · 컨디션:{u.hasPulseUpdate ? '체크됨' : '미체크(기본50)'}
                        </div>
                        {Object.keys(u.rawSurveyMap).length === 0 ? (
                          <p className="text-zinc-500">저장된 설문 원문이 없어 기본 좌표(50점)가 적용되었습니다.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {Object.entries(u.rawSurveyMap).map(([qId, val]) => (
                              <div key={qId} className="p-2 border border-white/10 bg-[#0c0d12]">
                                <span className="text-zinc-400 block">{qId}</span>
                                <span className="text-white font-bold">{val}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==============================================================
            [STEP 3] 방 100점 기준: 4대 목적별 채점 기준표
           ============================================================== */}
        {activeStep === 'STEP3_RUBRIC' && (
          <section className="space-y-2.5">
            <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h2 className="font-serif-editorial text-lg text-white font-normal">
                  3단계 · 목적별 100점 채점 기준표
                </h2>
              </div>
              <span className="text-sm font-mono text-zinc-400">필수 관문: 지역 일치 · 일정 일치 · 관계안전</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(['RESET', 'FRIEND', 'TASTE', 'ROMANCE'] as PurposeCode[]).map((pCode) => {
                const prof = PURPOSE_ENGINE_PROFILES[pCode];
                const isOpen = expandedRubricCode === pCode;
                return (
                  <div
                    key={pCode}
                    className={`border border-white/10 bg-[#0c0d12] ${
                      isOpen ? 'col-span-full border-white/25' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedRubricCode(isOpen ? null : pCode)}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer hover:bg-white/[0.02] text-sm font-mono"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-zinc-400">{isOpen ? '▾' : '▸'}</span>
                        <span className="px-2 py-0.5 border border-[#f04f74]/40 bg-[#f04f74]/10 text-white font-bold">
                          {prof.label} ({pCode})
                        </span>
                        <span className="text-zinc-300">
                          연령 허용 ±{prof.idealAgeGap}세 (최대 {prof.maxAgeGap}세)
                        </span>
                      </div>
                      <span className="text-white font-bold">100점 만점</span>
                    </button>

                    {isOpen && (
                      <div className="p-3.5 border-t border-white/10 bg-[#08090d] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-sm font-mono">
                        {Object.entries(prof.weights).map(([k, w]) => (
                          <div key={k} className="p-2.5 border border-white/10 bg-[#0c0d12]">
                            <span className="text-zinc-400 block">{k}</span>
                            <span className="text-white font-bold text-base">{w}점</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==============================================================
            [STEP 4] 최종 매칭·대기: 번호표 + 날짜 기준 방 리스트 + 대기자 사유
           ============================================================== */}
        {activeStep === 'STEP4_RESULT' && (
          <div className="space-y-4">
            <div className="flex border border-white/15 divide-x divide-white/15 text-sm font-mono w-fit">
              {(
                [
                  { key: 'ALL', label: '전체' },
                  { key: 'PRE_MATCH', label: `편성방(${grouping.rooms.length})` },
                  { key: 'WAITLIST', label: `대기(${grouping.unassigned.length})` },
                  { key: 'PUBLISHED', label: `개설(${conditionalEvents.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setResultFilter(tab.key)}
                  className={`px-3 py-1.5 cursor-pointer ${
                    resultFilter === tab.key
                      ? 'bg-white/10 text-white font-bold'
                      : 'bg-[#0c0d12] text-zinc-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {(resultFilter === 'ALL' || resultFilter === 'PRE_MATCH') && (
              <section className="space-y-2.5">
                <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                    <h2 className="font-serif-editorial text-lg text-white font-normal">편성 방</h2>
                    <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                      {grouping.rooms.length}방
                    </span>
                  </div>
                  <span className="text-sm font-mono text-zinc-400">클릭 시 100점 기준 채점 상세</span>
                </div>

                {grouping.rooms.length === 0 ? (
                  <div className="p-6 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-400">
                    {isLoading ? '불러오는 중...' : '현재 지역·일정·성비 조건에 부합하는 가매칭 방이 없습니다.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {[...grouping.rooms]
                      .sort((a, b) => a.spec.scheduleSlot.localeCompare(b.spec.scheduleSlot))
                      .map((room, roomIdx) => {
                        const isExpanded = expandedRoomId === room.roomId;
                        const published = isPublishedToMeetup(room.spec.title);
                        const coreList = room.assignments.filter((a) => a.role === 'CORE');
                        const flexList = room.assignments.filter((a) => a.role === 'FLEX');

                        return (
                          <div
                            key={room.roomId}
                            className={`border border-white/10 bg-[#0c0d12] ${
                              isExpanded ? 'col-span-full border-white/25' : ''
                            }`}
                          >
                            <div className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02]">
                              <button
                                type="button"
                                onClick={() => setExpandedRoomId(isExpanded ? null : room.roomId)}
                                className="flex-1 text-left min-w-0 space-y-1.5 cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 border border-white/25 bg-white/10 text-sm font-mono font-bold text-white shrink-0">
                                    {roomIdx + 1}
                                  </span>
                                  <span className="text-sm font-mono text-white font-medium shrink-0">
                                    {room.spec.scheduleSlot}
                                  </span>
                                  <span className="text-sm font-mono text-zinc-400">
                                    {isExpanded ? '▾' : '▸'}
                                  </span>
                                  <span className="text-sm font-mono font-bold text-white">
                                    지역:{room.spec.cityCode}{room.spec.districtName ? ` ${room.spec.districtName}` : ''}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 pl-8 text-sm font-mono">
                                  <span className="px-2 py-0.5 border border-white/15 bg-white/5 text-white">
                                    목적:{room.spec.targetLabels.PURPOSE ?? '변화'}
                                  </span>
                                  <span className="px-2 py-0.5 border border-white/15 bg-white/5 text-white">
                                    깊이:{room.spec.targetLabels.DEPTH ?? '균형'}
                                  </span>
                                  <span className="px-2 py-0.5 border border-white/15 bg-white/5 text-white">
                                    테마:{room.spec.targetLabels.THEME ?? '휴식'}
                                  </span>
                                  <span className="px-2 py-0.5 border border-white/15 bg-white/5 text-zinc-300">
                                    에너지:{room.spec.targetLabels.ENERGY ?? '조화'}
                                  </span>
                                  <span className="px-2 py-0.5 border border-white/25 bg-white/10 text-white">
                                    식당:{room.assignedVenueName ?? '미배정'}
                                    {room.assignedVenueBudgetTier ? ` (${room.assignedVenueBudgetTier})` : ''}
                                  </span>
                                </div>
                              </button>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handlePublishToMeetup(room)}
                                  className={`px-2.5 py-1 border text-sm font-mono cursor-pointer flex items-center gap-1 ${
                                    published
                                      ? 'border-white/20 bg-white/5 text-zinc-300'
                                      : 'border-[#f04f74] bg-[#f04f74] text-white font-bold'
                                  }`}
                                >
                                  {published && <Check className="w-3.5 h-3.5" />}
                                  <span>{published ? '개설됨' : '개설'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedRoomId(isExpanded ? null : room.roomId)}
                                  className="px-2.5 py-1 border border-white/25 bg-white/10 text-sm font-mono font-bold text-white cursor-pointer"
                                >
                                  기준부합 {room.expectedScore100}/100
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-4 border-t border-white/10 bg-[#08090d] space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-mono border-b border-white/10 pb-2">
                                  <span className="text-white">
                                    적용 기준: {PURPOSE_LABELS[room.spec.purpose]} 전용 100점 채점표 (중심 {room.spec.targetBirthYear}년생 · 예산 {room.spec.targetBudgetTier})
                                  </span>
                                  <span className="text-zinc-400">
                                    완화: {room.relaxedConditions.length > 0 ? room.relaxedConditions.join(', ') : '없음'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <span className="text-sm font-mono text-white font-bold block">
                                      코어 고정군 ({coreList.length}명)
                                    </span>
                                    {coreList.map((item) => {
                                      const mKey = `${room.roomId}-${item.member.userId}`;
                                      const isOpen = expandedMemberKey === mKey;
                                      return (
                                        <div key={mKey} className="border border-white/30/30 bg-[#0c0d12]">
                                          <button
                                            type="button"
                                            onClick={() => setExpandedMemberKey(isOpen ? null : mKey)}
                                            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-sm font-mono cursor-pointer"
                                          >
                                            <div className="flex flex-wrap items-center gap-2 min-w-0 text-left">
                                              <span className="text-white font-bold">{item.member.userId}</span>
                                              <span className="text-zinc-300">
                                                {item.member.gender === 'F' ? '여' : '남'}·{item.member.birthYear}·{item.member.cityCode}
                                              </span>
                                              <span className="text-zinc-300">
                                                예산:{item.member.budgetTier}
                                                <span className="text-zinc-500">
                                                  ({item.member.isDefaultBudget ? '기본' : '실입력'})
                                                </span>
                                              </span>
                                            </div>
                                            <span className="flex items-center gap-1 text-white font-bold shrink-0">
                                              {item.score100}/100
                                              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            </span>
                                          </button>
                                          {isOpen && (
                                            <div className="px-3 py-2 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-sm font-mono">
                                              {item.axisBreakdown.map((ax) => (
                                                <div key={ax.axisId} className="p-1.5 border border-white/10 bg-[#08090d]">
                                                  <span className="text-zinc-400 block">{ax.label} ({ax.maxWeight}만점)</span>
                                                  <span className="text-white font-bold">{ax.earned} ({ax.ratioPct}%)</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="space-y-3">
                                    <div className="space-y-1.5">
                                      <span className="text-sm font-mono text-zinc-300 font-bold block">
                                        유동 배정군 ({flexList.length}명)
                                      </span>
                                      {flexList.map((item) => {
                                        const mKey = `${room.roomId}-${item.member.userId}`;
                                        const isOpen = expandedMemberKey === mKey;
                                        return (
                                          <div key={mKey} className="border border-white/10 bg-[#0c0d12]">
                                            <button
                                              type="button"
                                              onClick={() => setExpandedMemberKey(isOpen ? null : mKey)}
                                              className="w-full px-3 py-2 flex items-center justify-between gap-2 text-sm font-mono cursor-pointer"
                                            >
                                              <div className="flex flex-wrap items-center gap-2 min-w-0 text-left">
                                                <span className="text-zinc-100 font-bold">{item.member.userId}</span>
                                                <span className="text-zinc-300">
                                                  {item.member.gender === 'F' ? '여' : '남'}·{item.member.birthYear}·{item.member.cityCode}
                                                </span>
                                                <span className="text-zinc-300">
                                                  예산:{item.member.budgetTier}
                                                  <span className="text-zinc-500">
                                                    ({item.member.isDefaultBudget ? '기본' : '실입력'})
                                                  </span>
                                                </span>
                                              </div>
                                              <span className="flex items-center gap-1 text-white font-bold shrink-0">
                                                {item.score100}/100
                                                {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                              </span>
                                            </button>
                                            {isOpen && (
                                              <div className="px-3 py-2 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-sm font-mono">
                                                {item.axisBreakdown.map((ax) => (
                                                  <div key={ax.axisId} className="p-1.5 border border-white/10 bg-[#08090d]">
                                                    <span className="text-zinc-400 block">{ax.label} ({ax.maxWeight}만점)</span>
                                                    <span className="text-white font-bold">{ax.earned} ({ax.ratioPct}%)</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="space-y-1.5">
                                      <span className="text-sm font-mono text-white font-bold block">
                                        노쇼 스탠바이 ({room.standbyCandidates.length}/2명)
                                      </span>
                                      {room.standbyCandidates.length === 0 ? (
                                        <p className="text-sm font-mono text-zinc-500">동일 지역·일정 대기 후보 없음</p>
                                      ) : (
                                        room.standbyCandidates.map((sb, idx) => (
                                          <div
                                            key={sb.member.userId}
                                            className="px-3 py-2 border border-[#f04f74]/30 bg-[#f04f74]/5 flex items-center justify-between text-sm font-mono"
                                          >
                                            <span className="text-zinc-200 truncate">
                                              대기{idx + 1} · {sb.member.userId} ({sb.member.gender})
                                            </span>
                                            <span className="text-white font-bold">{sb.score100}/100</span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </section>
            )}

            {(resultFilter === 'ALL' || resultFilter === 'WAITLIST') && (() => {
              const isWaitlistOpen = showWaitlistSection || resultFilter === 'WAITLIST';
              const PAGE_SIZE = 10;
              const totalPages = Math.max(1, Math.ceil(grouping.waitlistRoutings.length / PAGE_SIZE));
              const safePage = Math.min(waitlistPage, totalPages);
              const pagedWaitlist = grouping.waitlistRoutings.slice(
                (safePage - 1) * PAGE_SIZE,
                safePage * PAGE_SIZE
              );

              return (
                <section className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setShowWaitlistSection((v) => !v)}
                    className="w-full p-3 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.02] flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                      <h2 className="font-serif-editorial text-lg text-white font-normal">대기 라우팅</h2>
                      <span className="text-sm font-mono px-2 py-0.5 border border-white/15 text-white">
                        {grouping.waitlistRoutings.length}명
                      </span>
                    </div>
                    <span className="px-2.5 py-1 border border-white/20 text-sm font-mono text-white">
                      {isWaitlistOpen ? '접기' : '펼치기'}
                    </span>
                  </button>

                  {isWaitlistOpen && (
                    grouping.waitlistRoutings.length === 0 ? (
                      <div className="p-6 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-400">
                        미배정 대기 인원이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {pagedWaitlist.map((plan) => {
                            const isExpanded = expandedWaitlistId === plan.member.userId;
                            return (
                              <div
                                key={plan.member.userId}
                                className={`border border-white/10 bg-[#0c0d12] ${
                                  isExpanded ? 'col-span-full border-white/25' : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedWaitlistId(isExpanded ? null : plan.member.userId)
                                  }
                                  className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-sm font-mono hover:bg-white/[0.02] cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-zinc-400">{isExpanded ? '▾' : '▸'}</span>
                                    <span className="text-white font-bold truncate">{plan.member.userId}</span>
                                    <span className="text-zinc-400 shrink-0">
                                      {plan.member.gender === 'F' ? '여' : '남'}·{plan.member.targetCity}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 border text-sm shrink-0 ${
                                      plan.member.isPaid
                                        ? 'border-white/25 text-white'
                                        : 'border-white/15 text-zinc-400'
                                    }`}
                                  >
                                    {plan.member.isPaid ? '대기' : '미입금'}
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className="p-3.5 border-t border-white/10 bg-[#08090d] space-y-2.5 text-sm font-mono">
                                    <div className="flex flex-wrap items-center gap-2 text-zinc-300 border-b border-white/10 pb-2">
                                      <span className="text-white font-bold">
                                        {plan.member.isPaid ? '입금완료' : '미입금'}
                                      </span>
                                      <span>· 목적:{plan.member.axisLabels.PURPOSE}</span>
                                      <span>
                                        · 예산:{plan.member.budgetTier}(
                                        {plan.member.isDefaultBudget ? '기본' : '실입력'})
                                      </span>
                                      <span>
                                        · 거주:{plan.member.residenceCity}
                                        {plan.member.targetCity !== plan.member.residenceCity
                                          ? ` → 희망:${plan.member.targetCity}`
                                          : ''}
                                      </span>
                                      <span>
                                        · 응답 {plan.member.answeredQuestionCount}/{DEFAULT_ADAPTIVE_QUESTIONS.length}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <div className="p-2.5 border border-white/10 bg-[#0c0d12]">
                                        <span className="text-zinc-400 block mb-1">1순위 추천 방</span>
                                        <span className="text-white font-bold">
                                          {plan.primaryRoom
                                            ? `${plan.primaryRoom.title} (${plan.primaryRoom.blockedReason || `${plan.primaryRoom.score100}/100`})`
                                            : plan.member.isPaid
                                            ? '인원/조건 충족 방 대기'
                                            : '미입금(결제대기)'}
                                        </span>
                                      </div>
                                      <div className="p-2.5 border border-white/10 bg-[#0c0d12]">
                                        <span className="text-zinc-400 block mb-1">2순위 추천 방</span>
                                        <span className="text-white">
                                          {plan.secondaryRoom
                                            ? `${plan.secondaryRoom.title} (${plan.secondaryRoom.blockedReason || `${plan.secondaryRoom.score100}/100`})`
                                            : '없음'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-1 pt-1 text-sm font-mono">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                              <button
                                key={pg}
                                type="button"
                                onClick={() => setWaitlistPage(pg)}
                                className={`px-2.5 py-1 border cursor-pointer ${
                                  safePage === pg
                                    ? 'border-white/40 bg-white/15 text-white font-bold'
                                    : 'border-white/10 bg-[#0c0d12] text-zinc-400 hover:text-white'
                                }`}
                              >
                                {pg}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </section>
              );
            })()}

            {(resultFilter === 'ALL' || resultFilter === 'PUBLISHED') && (() => {
              const isPublishedOpen = showPublishedSection || resultFilter === 'PUBLISHED';
              return (
                <section className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPublishedSection((v) => !v)}
                    className="w-full p-3 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.02] flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                      <h2 className="font-serif-editorial text-lg text-white font-normal">밋업 방</h2>
                      <span className="text-sm font-mono px-2 py-0.5 border border-white/15 text-white">
                        {conditionalEvents.length}방
                      </span>
                    </div>
                    <span className="px-2.5 py-1 border border-white/20 text-sm font-mono text-white">
                      {isPublishedOpen ? '접기' : '펼치기'}
                    </span>
                  </button>

                  {isPublishedOpen && (
                    conditionalEvents.length === 0 ? (
                      <div className="p-6 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-400">
                        개설된 방이 없습니다.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {[...conditionalEvents]
                          .sort((a, b) => (a.dateText || '').localeCompare(b.dateText || ''))
                          .map((ev, evIdx) => (
                            <div
                              key={ev.eventId}
                              className="p-3.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 border border-white/25 bg-white/10 text-sm font-mono font-bold text-white shrink-0">
                                    {evIdx + 1}
                                  </span>
                                  <span className="text-sm font-mono text-white shrink-0">
                                    {ev.dateText}
                                  </span>
                                  <span className="px-2 py-0.5 border border-white/20 text-sm font-mono text-white shrink-0">
                                    {ev.status === 'CONFIRMED' ? '확정' : '모집중'}
                                  </span>
                                  <span className="text-sm font-mono font-bold text-white truncate">
                                    {ev.title}
                                  </span>
                                </div>
                                <p className="text-sm font-mono text-zinc-400 mt-1 pl-8">
                                  {ev.regionName || '서울'} · 정원 {ev.maxCapacity ?? 6}명 · ₩{ev.priceKrw.toLocaleString()}
                                </p>
                              </div>
                              <Link
                                href="/meetup"
                                className="px-2.5 py-1 border border-white/20 hover:border-white/40 text-sm font-mono text-white shrink-0"
                              >
                                이동
                              </Link>
                            </div>
                          ))}
                      </div>
                    )
                  )}
                </section>
              );
            })()}
          </div>
        )}

        {/* ==============================================================
            [STEP 5] 적대적 예외 검증 5종 (실제 엔진 결함 실시간 감지)
           ============================================================== */}
        {activeStep === 'STEP5_AUDIT' && (
          <section className="space-y-2.5">
            <div className="p-3 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h2 className="font-serif-editorial text-lg text-white font-normal">
                  5단계 · 적대적 예외 시나리오 5종 검증
                </h2>
              </div>
              <span className="text-sm font-mono px-2.5 py-0.5 border border-[#f04f74]/50 bg-[#f04f74]/15 text-white font-bold">
                PASS {auditCases.length - auditFailCount} / FAIL {auditFailCount}
              </span>
            </div>

            <div className="border border-white/10 bg-[#0c0d12] divide-y divide-white/[0.06]">
              {auditCases.map((c) => (
                <div key={c.caseId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-mono">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">{c.caseId}</span>
                      <span className="text-white font-bold">{c.title}</span>
                    </div>
                    <p className="text-zinc-400">{c.scenario}</p>
                    <p className={c.status === 'PASS' ? 'text-white' : 'text-[#f04f74] font-medium'}>
                      결과: {c.detail}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 border font-bold shrink-0 self-start sm:self-center ${
                      c.status === 'PASS'
                        ? 'border-white/25 bg-white/10 text-white'
                        : 'border-[#f04f74] bg-[#f04f74]/20 text-white'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
