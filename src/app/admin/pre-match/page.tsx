'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  useNadoSoloEngine,
  ConditionalEventItem,
  computeUserAxisProfile,
  matchDynamicTables,
  scoreUserAgainstRoom,
  AdaptiveAnswer,
  DEFAULT_MATCHING_AXES,
} from '@/engine';
import { nadoSoloSupabaseService, DbProfile } from '@/lib/supabase/service';
import { Shield, RefreshCw, ArrowUpRight, Check } from 'lucide-react';

export default function AdminPreMatchPage() {
  const { currentUser, conditionalEvents, addConditionalEvent } = useNadoSoloEngine();
  const [dbProfiles, setDbProfiles] = useState<DbProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'PRE_MATCH' | 'PUBLISHED'>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.handle === '@admin' ||
    currentUser?.userId === 'ADMIN_01';

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const profiles = await nadoSoloSupabaseService.getAllProfiles();
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
      return computeUserAxisProfile(
        {
          userId: `${p.nickname || p.handle} (${p.id})`,
          gender: p.gender === 'M' ? 'M' : 'F',
          birthYear: p.birth_year || 1994,
          cityCode: p.residence_city || '서울',
          dietary: p.dietary || 'NONE',
          purpose: p.preferred_purpose,
        },
        answers
      );
    });
  }, [dbProfiles]);

  const grouping = useMemo(
    () => matchDynamicTables(participants, DEFAULT_MATCHING_AXES),
    [participants]
  );

  const isPublishedToMeetup = useCallback(
    (roomTitle: string) => conditionalEvents.some((ev) => ev.title.includes(roomTitle)),
    [conditionalEvents]
  );

  const handlePublishToMeetup = (room: (typeof grouping.rooms)[number]) => {
    if (isPublishedToMeetup(room.spec.title)) {
      setToastMsg('이미 /meetup 페이지에 개설된 방입니다.');
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }

    const newEvent: ConditionalEventItem = {
      eventId: `EVT-${room.roomId}-${Date.now().toString().slice(-4)}`,
      title: room.spec.title,
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
      status: 'RECRUITING',
      requiredBadgeIds: [],
      minTotalScore100: 0,
      activePresetSubIds: [],
      reason: `적응매칭 가매칭 편성 · 적합도 ${room.expectedScore100}점`,
    };
    addConditionalEvent(newEvent);
    setToastMsg(`[${room.spec.title}] 방이 /meetup 페이지에 개설되었습니다.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (!isAdmin) {
    return (
      <main className="min-h-[75vh] bg-[#07080a] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-white/15 bg-[#0c0d12] p-8 text-center space-y-4">
          <div className="w-10 h-10 mx-auto border border-[#3b82f6]/50 bg-[#3b82f6]/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-300" />
          </div>
          <h1 className="font-serif-editorial text-2xl font-normal">관리자 전용 가매칭</h1>
          <p className="text-sm text-zinc-400">
            가매칭 방 관제 페이지는 관리자 계정(@admin)으로 로그인한 경우에만 열람할 수 있습니다.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/auth"
              className="w-full py-3 border border-[#3b82f6]/50 bg-[#3b82f6]/15 text-white text-sm font-mono font-bold"
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
    <div className="min-h-screen bg-[#07080a] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* 상단 헤더 바 */}
        <div className="p-4 border border-white/15 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-blue-300" />
              <span className="px-2 py-0.5 border border-[#3b82f6]/50 bg-[#3b82f6]/15 text-sm font-mono text-white font-bold">
                관리자 전용
              </span>
              <h1 className="font-serif-editorial text-2xl font-normal text-white">
                가매칭 방 관제
              </h1>
            </div>
            <p className="text-sm font-mono text-zinc-400">
              실DB 회원 {participants.length}명 기준 실시간 가매칭 {grouping.rooms.length}방 · 밋업 개설 {conditionalEvents.length}방
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border border-white/15 divide-x divide-white/15 text-sm font-mono">
              {(
                [
                  { key: 'ALL', label: '전체' },
                  { key: 'PRE_MATCH', label: `가매칭 (${grouping.rooms.length})` },
                  { key: 'PUBLISHED', label: `밋업개설 (${conditionalEvents.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterMode(tab.key)}
                  className={`px-3 py-1.5 cursor-pointer ${
                    filterMode === tab.key
                      ? 'bg-[#3b82f6]/25 text-white font-bold'
                      : 'bg-black/30 text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={loadProfiles}
              className="px-3 py-1.5 border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-mono text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>

            <Link
              href="/meetup"
              prefetch={true}
              className="px-3 py-1.5 border border-[#f04f74]/50 bg-[#f04f74]/15 hover:bg-[#f04f74]/25 text-sm font-mono text-white flex items-center gap-1"
            >
              <span>밋업 보기</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {toastMsg && (
          <div className="p-3 border border-[#3b82f6]/50 bg-[#3b82f6]/15 text-sm font-mono text-white">
            {toastMsg}
          </div>
        )}

        {/* 섹션 1: 실시간 가매칭 편성 방 (관리자 전용 뷰) */}
        {(filterMode === 'ALL' || filterMode === 'PRE_MATCH') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h2 className="font-serif-editorial text-xl text-white font-normal">
                  가매칭 편성 방 ({grouping.rooms.length}방 · 대기 {grouping.unassigned.length}명)
                </h2>
              </div>
            </div>

            {grouping.rooms.length === 0 ? (
              <div className="p-8 border border-white/10 bg-[#0c0d12] text-center text-sm font-mono text-zinc-400">
                {isLoading ? '가매칭 데이터를 불러오는 중...' : '현재 3:3 성비로 편성 가능한 가매칭 방이 없습니다.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouping.rooms.map((room) => {
                  const published = isPublishedToMeetup(room.spec.title);
                  return (
                    <div
                      key={room.roomId}
                      className="border border-white/15 bg-[#0c0d12] p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-mono text-blue-300">
                              <span>{room.roomId}</span>
                              <span>·</span>
                              <span>{room.members.length}명 (3:3)</span>
                            </div>
                            <h3 className="font-serif-editorial text-xl text-white mt-1">
                              {room.spec.title}
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2.5 py-1 border border-[#3b82f6]/50 bg-[#3b82f6]/15 text-base font-mono font-bold text-white inline-block">
                              {room.expectedScore100}점
                            </span>
                          </div>
                        </div>

                        {room.relaxedConditions.length > 0 && (
                          <div className="text-sm font-mono text-zinc-300">
                            완화 조건: {room.relaxedConditions.join(', ')}
                          </div>
                        )}

                        {/* 배정된 6인 명단 (2열 컴팩트) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
                          {room.members.map((m) => {
                            const { score100 } = scoreUserAgainstRoom(m, room.spec, room.members);
                            return (
                              <div
                                key={m.userId}
                                className="px-3 py-2 border border-white/10 bg-[#08090d] flex items-center justify-between text-sm font-mono"
                              >
                                <span className="text-zinc-200 truncate">
                                  {m.userId} ({m.gender})
                                </span>
                                <span className="text-white font-bold shrink-0 ml-2">
                                  {score100}점
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <span className="text-sm font-mono text-zinc-400">
                          {published ? '밋업 페이지 노출 중' : '관리자 가매칭 대기'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePublishToMeetup(room)}
                          className={`px-4 py-2 border text-sm font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                            published
                              ? 'border-white/20 bg-white/5 text-zinc-300'
                              : 'border-[#f04f74] bg-[#f04f74] hover:opacity-90 text-white'
                          }`}
                        >
                          {published && <Check className="w-4 h-4" />}
                          <span>{published ? '밋업 개설됨' : '밋업 방 개설'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 섹션 2: 현재 /meetup 페이지에 개설된 방 목록 */}
        {(filterMode === 'ALL' || filterMode === 'PUBLISHED') && (
          <section className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              <h2 className="font-serif-editorial text-xl text-white font-normal">
                밋업 개설 방 ({conditionalEvents.length}방)
              </h2>
            </div>

            {conditionalEvents.length === 0 ? (
              <div className="p-6 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-400">
                현재 밋업 페이지에 개설된 방이 없습니다. 위 가매칭 방에서 [밋업 방 개설]을 누르면 즉시 생성됩니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {conditionalEvents.map((ev) => (
                  <div
                    key={ev.eventId}
                    className="p-4 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 border border-[#3b82f6]/50 bg-[#3b82f6]/15 text-sm font-mono text-white shrink-0">
                          {ev.status === 'CONFIRMED' ? '확정' : '모집중'}
                        </span>
                        <h3 className="font-serif-editorial text-lg text-white truncate">
                          {ev.title}
                        </h3>
                      </div>
                      <p className="text-sm font-mono text-zinc-400">
                        {ev.dateText} · 정원 {ev.maxCapacity ?? 6}명 · ₩{ev.priceKrw.toLocaleString()}
                      </p>
                    </div>
                    <Link
                      href="/meetup"
                      className="px-3 py-1.5 border border-white/20 hover:border-white/40 text-sm font-mono text-white shrink-0"
                    >
                      이동
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
