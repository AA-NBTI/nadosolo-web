'use client';

import React, { useState, useEffect } from 'react';
import {
  SingleCandidateTest,
  SingleAuditReport,
  INITIAL_TEST_CANDIDATES,
  getStoredCandidates,
  saveStoredCandidates,
  generateSingleAuditReport,
} from '@/engine/singleTesterEngine';
import {
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  isLight?: boolean;
  onNotify?: (msg: string) => void;
}

export default function AdminSingleAuditReportManager({ isLight = false, onNotify }: Props) {
  const [candidates, setCandidates] = useState<SingleCandidateTest[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  useEffect(() => {
    setCandidates(getStoredCandidates());
  }, []);

  const notify = (msg: string) => {
    if (onNotify) onNotify(msg);
  };

  const handleResetToDefault = () => {
    saveStoredCandidates(INITIAL_TEST_CANDIDATES);
    setCandidates(INITIAL_TEST_CANDIDATES);
    setSelectedCandidateId(null);
    notify('테스트 회원 목록이 초기화되었습니다 (aa, bb 2명).');
  };

  const cardBg = isLight ? 'bg-white border-zinc-300' : 'bg-[#0c0d12] border-white/10';
  const subCardBg = isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/[0.08]';
  const textTitle = isLight ? 'text-zinc-900' : 'text-white';
  const textMuted = isLight ? 'text-zinc-500' : 'text-zinc-400';

  // 선택된 1인의 정밀 보고서 생성
  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);
  const report: SingleAuditReport | null = selectedCandidate
    ? generateSingleAuditReport(selectedCandidate)
    : null;

  // ==========================================================================
  // [VIEW B] 1인 단위 정밀 진단 & 최종 매칭 프로세스 보고서 화면 (Click-to-Reveal)
  // ==========================================================================
  if (selectedCandidate && report) {
    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        {/* 상단 복귀 바 */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setSelectedCandidateId(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/20 hover:border-white/40 bg-white/[0.03] text-sm font-mono text-zinc-200 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>목록</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-zinc-500 uppercase">
              ID: {report.candidate.id}
            </span>
          </div>
        </div>

        {/* 1인 기본 정보 요약 카드 */}
        <div className={`p-4 border ${cardBg} space-y-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-white border border-white/10">
                테스트 대상
              </span>
              <span className="text-sm font-semibold text-white">
                {report.candidate.name} ({report.candidate.gender === 'M' ? '남성' : '여성'} • {report.candidate.age}세)
              </span>
              <span className="text-sm font-mono text-zinc-400">
                @{report.candidate.id}
              </span>
            </div>

            <span className="text-sm font-mono text-zinc-500">
              {report.candidate.createdAt}
            </span>
          </div>
        </div>

        {/* 모듈별 점수 및 판정 결과 (1층 ~ 6층) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1층 & 2층 결과 카드 */}
          <div className={`p-5 border ${subCardBg} space-y-3`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-sm font-mono text-white uppercase tracking-wider">
                조건 및 목적
              </span>
              <span className="text-sm font-mono text-white">
                {report.stage1.score}점 (적격)
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-zinc-500 block mb-0.5">참가 목적</span>
                <span className="text-white font-medium">{report.stage2.purposeLabel}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-0.5">배정 목표</span>
                <span className="text-zinc-300 font-mono">{report.stage2.targetChapter}</span>
              </div>
              <div className="pl-3.5 border-l border-white/20 ml-1 pt-1 space-y-1">
                {report.stage2.notes.map((note, i) => (
                  <p key={i} className="text-zinc-400 text-sm font-light leading-relaxed">
                    • {note}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* 4층 결: IPC 8옥탄트 진단 결과 */}
          <div className={`p-5 border ${subCardBg} space-y-3`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-sm font-mono text-white uppercase tracking-wider">
                성향 (8옥탄트)
              </span>
              <span className="px-2 py-0.5 text-sm font-mono bg-black/40 text-white border border-white/30">
                {report.stage4.octantCode} {report.stage4.octantName}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-sm text-center">
                <div className="p-1.5 bg-black/40 border border-white/5">
                  <span className="text-zinc-500 block text-sm">온기</span>
                  <span className="text-white font-semibold">{report.candidate.warmthScore}점</span>
                </div>
                <div className="p-1.5 bg-black/40 border border-white/5">
                  <span className="text-zinc-500 block text-sm">지배</span>
                  <span className="text-white font-semibold">{report.candidate.dominanceScore}점</span>
                </div>
                <div className="p-1.5 bg-black/40 border border-white/5">
                  <span className="text-zinc-500 block text-sm">템포</span>
                  <span className="text-white font-semibold">{report.candidate.tempoScore}점</span>
                </div>
                <div className="p-1.5 bg-black/40 border border-white/5">
                  <span className="text-zinc-500 block text-sm">깊이</span>
                  <span className="text-white font-semibold">{report.candidate.depthScore}점</span>
                </div>
              </div>

              <div className="pl-3.5 border-l border-white/20 ml-1 pt-1">
                <p className="text-zinc-300 text-sm font-light leading-relaxed">
                  {report.stage4.styleSummary}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* 6층 다면 관찰 기대 점수 요약 바 */}
        <div className={`p-4 border ${subCardBg} flex flex-wrap items-center justify-between gap-4 text-sm font-mono`}>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-sm bg-white/10 text-zinc-300">다면관찰</span>
            <span className="text-zinc-400">5대 지표:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-zinc-300">
            <span>품격: <strong>{report.stage6.expectedScores.dignity}/20</strong></span>
            <span>미소: <strong>{report.stage6.expectedScores.smile}/20</strong></span>
            <span>경청: <strong>{report.stage6.expectedScores.listening}/20</strong></span>
            <span>배려: <strong>{report.stage6.expectedScores.care}/20</strong></span>
            <span>시선: <strong>{report.stage6.expectedScores.eyeContact}/20</strong></span>
            <span className="text-white font-semibold pl-2 border-l border-white/20">
              종합: {report.stage6.totalScore100}점
            </span>
          </div>
        </div>

        {/* 최종 6인 테이블 매칭 시뮬레이션 결과 리포트 */}
        <div className={`p-5 border border-white/15 bg-[#0c0d12] space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="space-y-0.5">
              <span className="text-sm font-mono text-white uppercase tracking-wider block">
                매칭 시뮬레이션
              </span>
              <h3 className="font-serif-editorial text-lg text-white font-normal">
                6인 프라이빗 룸 궁합 보고서
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-sm font-mono bg-black/40 text-zinc-300 border border-white/10">
                {report.matchingProcess.roomGenderRatio}
              </span>
              <span className="px-3 py-1 text-sm font-mono bg-white/10 text-white border border-white/30 font-semibold">
                평균 궁합 {report.matchingProcess.tableAvgChemistry}점
              </span>
            </div>
          </div>

          {/* 룸 정보 요약 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-mono">
            <div className="p-2.5 bg-white/[0.02] border border-white/5">
              <span className="text-zinc-500 block text-sm">룸 ID</span>
              <span className="text-white">{report.matchingProcess.tableId}</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5">
              <span className="text-zinc-500 block text-sm">일시</span>
              <span className="text-white">{report.matchingProcess.matchedDate}</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5">
              <span className="text-zinc-500 block text-sm">매장</span>
              <span className="text-white truncate">{report.matchingProcess.matchedVenue}</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5">
              <span className="text-zinc-500 block text-sm">포지션</span>
              <span className="text-white">{report.matchingProcess.assignedRole}</span>
            </div>
          </div>

          {/* 함께 배정된 동석자 5인 리스트 */}
          <div className="space-y-2 pt-2">
            <span className="text-sm font-mono text-zinc-400 block">
              동석자 명단 및 궁합:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-sm font-mono">
              {report.matchingProcess.companions.map((comp, idx) => (
                <div key={comp.id} className="p-3 bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">동석 {idx + 1} ({comp.gender})</span>
                    <span className="text-zinc-500">{comp.age}세</span>
                  </div>
                  <div className="text-white font-serif-editorial text-sm">
                    {comp.octantName}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-sm">
                    <span className="text-zinc-500">궁합</span>
                    <span className="text-white font-semibold">{comp.affinityScore}점</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 안전 제약 검증 상태 */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-sm font-mono text-zinc-400 border-t border-white/10">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>하드 제약: 안전</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>주도형 상한: 통과</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>연령 격차: 정상</span>
            </span>
          </div>
        </div>

      </div>
    );
  }

  // ==========================================================================
  // [VIEW A] 마스터 뷰 (등록된 1인 테스트 케이스 목록 ➔ 클릭 시 상세 노출)
  // ==========================================================================
  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      
      {/* 상단 컴팩트 인라인 바 */}
      <div className={`p-3 border ${cardBg} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h2 className="font-serif-editorial text-lg text-white font-normal">
            테스트
          </h2>
          <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
            {candidates.length}건
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="inline-flex items-center gap-1 px-2.5 py-1 border border-white/10 hover:border-white/30 text-sm font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
          title="초기화"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>초기화</span>
        </button>
      </div>

      {/* 1인 테스트 마스터 리스트 (2열 컴팩트 그리드로 한 줄 조망) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {candidates.map((cand) => {
          const rep = generateSingleAuditReport(cand);
          return (
            <div
              key={cand.id}
              onClick={() => setSelectedCandidateId(cand.id)}
              className="p-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.03] hover:border-white/20 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
            >
              {/* 좌측: 인적 정보 + 목적 뱃지 */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm font-mono font-bold text-white shrink-0">
                  {cand.id.toUpperCase()}
                </span>
                <span className="text-sm font-mono text-zinc-300 shrink-0">
                  @{cand.id}
                </span>
                <span className="text-sm font-medium text-white truncate">
                  {cand.name}
                </span>
                <span className="text-sm text-zinc-300 shrink-0">
                  {cand.gender === 'F' ? '여성' : '남성'}
                </span>
                <span className="text-sm font-mono text-zinc-400 shrink-0">
                  {cand.age}세
                </span>
              </div>

              {/* 우측: 성향 지표 + 궁합 점수 + 진입 버튼 */}
              <div className="flex items-center gap-2 shrink-0 text-sm font-mono">
                <span className="text-zinc-300 hidden sm:inline">
                  궁합: <strong className="text-white">{rep.matchingProcess.tableAvgChemistry}점</strong>
                </span>

                <div className="flex items-center gap-1 text-sm font-mono text-zinc-400 group-hover:text-white transition-colors pl-1">
                  <span>열람</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
