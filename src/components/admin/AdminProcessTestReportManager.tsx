'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useNadoSoloEngine } from '@/engine';
import {
  ARCHITECTURE_RELEASES,
  getArchitectureHealthSummary,
  ArchitectureChangeRecord,
} from '@/engine/architectureAuditRegistry';
import { Check, ArrowRight, ChevronDown, ChevronUp, Layers, Terminal } from 'lucide-react';

interface ProcessAuditStep {
  stepNo: string;
  processId: string;
  name: string;
  status: 'VERIFIED' | 'READY';
  route: string;
  summary: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  reproductionGuide: string[];
}

export default function AdminProcessTestReportManager() {
  const { startAdminImpersonation } = useNadoSoloEngine();

  // 최고관리자 버전 선택 (기본값: 최신 v2.1.0)
  const [selectedVersion, setSelectedVersion] = useState<string>('v2.1.0');
  const [expandedChangeId, setExpandedChangeId] = useState<string | null>(null);

  // 하단 엔지니어링 세부 점검 명세 펼침 여부 (기본값: 닫힘)
  const [isDeepTechExpanded, setIsDeepTechExpanded] = useState<boolean>(false);
  const [selectedTechStepId, setSelectedTechStepId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const health = useMemo(() => getArchitectureHealthSummary(), []);

  const currentRelease = useMemo(() => {
    return ARCHITECTURE_RELEASES.find((r) => r.version === selectedVersion) || ARCHITECTURE_RELEASES[0];
  }, [selectedVersion]);

  // 엔지니어링 테스트 계정 목록
  const TEST_ACCOUNTS = [
    {
      id: 'aa',
      handle: '@aa',
      name: '김에이',
      password: 'aa1111',
      role: 'MEMBER (여성 / 1994년생)',
      job: '브랜드 마케터',
      email: 'aa@nadosolo.com',
      status: '프로세스 점검 완료',
      defaultRoute: '/dashboard',
    },
    {
      id: 'bb',
      handle: '@bb',
      name: '이비비',
      password: 'aa1111',
      role: 'MEMBER (남성 / 1992년생)',
      job: 'IT 기획자',
      email: 'bb@nadosolo.com',
      status: '프로세스 점검 완료',
      defaultRoute: '/dashboard',
    },
    {
      id: 'admin',
      handle: '@admin',
      name: '관리자',
      password: 'aa1111',
      role: 'ADMIN (시스템 총괄)',
      job: '총괄 운영자',
      email: 'admin@nadosolo.com',
      status: '전체 관제 권한',
      defaultRoute: '/admin',
    },
  ];

  // 엔지니어링 세부 점검 명세
  const PROCESS_AUDIT_STEPS: ProcessAuditStep[] = [
    {
      stepNo: 'STEP 01',
      processId: 'P01_IDENTITY',
      name: '회원가입 및 자격 증명 (Authentication)',
      status: 'VERIFIED',
      route: '/auth',
      summary: '아이디/이메일/비밀번호 3개 필수 가입 및 비로그인 세션 안전 초기화',
      inputs: { '로그인 아이디': 'aa 또는 bb', '비밀번호': 'aa1111' },
      outputs: { '세션 상태': 'LoggedInUser 컨텍스트 생성', '라우팅': '/dashboard 즉시 이동' },
      reproductionGuide: [
        '1. /auth 접속 후 순수 입력창 확인',
        '2. aa / aa1111 입력 후 로그인',
        '3. /dashboard 즉각 이동 확인',
      ],
    },
    {
      stepNo: 'STEP 02',
      processId: 'P02_PREFERENCE',
      name: '기본 프로필 & 연락처 게이트',
      status: 'VERIFIED',
      route: '/dashboard',
      summary: '연락처 미등록 시 모임 신청 차단 및 마일스톤 즉시 해결 배너 연동',
      inputs: { '연락처': '010-XXXX-XXXX', '성별/연도': '성비 및 세대 기준' },
      outputs: { '게이트 상태': 'P02 COMPLETED 전환' },
      reproductionGuide: [
        '1. /dashboard 상단 마일스톤 트래커 확인',
        '2. 연락처 입력 시 모임신청 잠금 해제 확인',
      ],
    },
    {
      stepNo: 'STEP 03',
      processId: 'P04_PROFILE',
      name: '5대 소통 성향 자가진단 (/test)',
      status: 'VERIFIED',
      route: '/test',
      summary: '대화 템포, 정적 대처 등 5개 질문지 응답 후 아키타입 및 4대 앵커 도출',
      inputs: { '질문지 5문항': '소통 템포, 식탁 취향, 만남 목적' },
      outputs: { '아키타입': '여백을 품은 경청자 (#경청, #여백, #환기, #배려)' },
      reproductionGuide: [
        '1. /test 접속 후 1문항 1카드 선택',
        '2. 5문항 완료 후 아키타입 리포트 확인',
        '3. [모임 신청으로 이동] 클릭 시 P04 게이트 통과',
      ],
    },
    {
      stepNo: 'STEP 04',
      processId: 'P05_MATCHING',
      name: '6인 다이닝 테이블 매칭 및 신청',
      status: 'VERIFIED',
      route: '/dashboard',
      summary: '프로필+성향진단 완료 검증 후 3:3 성비 테이블 신청 활성화',
      inputs: { '신청자 풀': 'aa, bb 포함 6인', '선행 게이트': 'P02, P04 통과' },
      outputs: { '배정 결과': '성수 1번 테이블 매칭 확정' },
      reproductionGuide: [
        '1. /dashboard 모임 신청 탭 진입',
        '2. 선행 조건 충족 시 참가 신청 완료 확인',
      ],
    },
    {
      stepNo: 'STEP 05',
      processId: 'P08_OBSERVE',
      name: '동석자 5인 상호 관찰 다면 평가',
      status: 'VERIFIED',
      route: '/dashboard',
      summary: '단일 명사 1:1 관찰 점수 입력 및 100% 완료 시 상호주의 해금 발동',
      inputs: { '평가 대상': '동석자 5인 전원', '지표': '품격, 미소, 경청, 배려, 시선' },
      outputs: { '상호주의 플래그': 'isReciprocalUnlocked = true 트리거' },
      reproductionGuide: [
        '1. /dashboard 동석자 다면 관찰 섹션 진입',
        '2. 5인 전원 평가 전까지 리포트 잠금 확인',
        '3. 5인 완료 즉시 리포트 해금 확인',
      ],
    },
    {
      stepNo: 'STEP 06',
      processId: 'P10_REPORT',
      name: '상호주의 해금 소셜 코칭 리포트',
      status: 'VERIFIED',
      route: '/dashboard',
      summary: '미평가 시 잠금 카드 보호, 100% 완료 시 100점 성적표 및 방사형 차트 열람',
      inputs: { '사전 자가진단': '80점 baseline', '사후 타인관찰': '5인 가중평균 86.8점' },
      outputs: { '코칭 리포트': '방사형 차트 및 매력 앵커 발견' },
      reproductionGuide: [
        '1. /dashboard 코칭리포트 탭 확인',
        '2. 동석자 미평가 회원은 잠금 카드 표출 확인',
        '3. 평가 완료 회원은 종합 성적표 열람 확인',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* ====================================================================
          상단 헤더 & 최고관리자 요약 지표 (단일 단어 & 간결화)
          ==================================================================== */}
      <div className="p-4 bg-[#0c0d12] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
          <h2 className="text-xl font-serif-editorial text-white">
            프로세스
          </h2>
          <span className="px-2.5 py-0.5 text-sm font-mono bg-white/10 text-white border border-white/20 font-medium">
            {health.currentVersion}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/test"
            prefetch={true}
            className="px-4 py-2.5 border border-white/15 bg-white/[0.03] hover:border-white/30 text-sm font-medium text-zinc-200 hover:text-white transition-colors"
          >
            테스트 ↗
          </Link>
          <Link
            href="/dashboard"
            prefetch={true}
            className="px-4 py-2.5 border border-white/30 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
          >
            대시보드 ↗
          </Link>
        </div>
      </div>

      {/* ====================================================================
          [1] 릴리즈 버전 선택기 (자동 누적 히스토리)
          ==================================================================== */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
        {ARCHITECTURE_RELEASES.map((rel) => {
          const isSelected = selectedVersion === rel.version;
          return (
            <button
              key={rel.version}
              type="button"
              onClick={() => {
                setSelectedVersion(rel.version);
                setExpandedChangeId(null);
              }}
              className={`px-4 py-2 text-sm font-mono tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-2.5 ${
                isSelected
                  ? 'border border-white/40 bg-white/15 text-white font-bold'
                  : 'border border-white/10 text-zinc-400 hover:text-white bg-[#0c0d12]'
              }`}
            >
              <span className="font-semibold">{rel.version}</span>
              {rel.isLatest && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              )}
              <span className="text-sm text-zinc-400">({rel.releaseDate})</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          [2] 최고관리자용 초간결 1줄 대조 목록 (가독성 높은 폰트 & 넉넉한 폭)
          ==================================================================== */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-medium text-white">
              [{currentRelease.version}] {currentRelease.releaseTitle}
            </span>
            <span className="text-sm font-mono text-zinc-400">
              {currentRelease.changes.length}건
            </span>
          </div>
        </div>

        {/* 컴팩트 2열 그리드로 한 화면 조망 (스크롤 및 행동 반경 최소화) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {currentRelease.changes.map((item: ArchitectureChangeRecord) => {
            const isExpanded = expandedChangeId === item.id;
            return (
              <div
                key={item.id}
                className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                  isExpanded ? 'col-span-full bg-white/[0.04] border-white/20' : 'hover:bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {/* 1단계: 순수 점검 리스트 행 (결과값 및 설명 내용 일절 배제) */}
                <div
                  onClick={() => setExpandedChangeId(isExpanded ? null : item.id)}
                  className="px-3.5 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm font-mono text-zinc-500 w-3 shrink-0">
                      {isExpanded ? '▾' : '▸'}
                    </span>
                    <span className="text-sm font-mono font-bold text-white shrink-0">
                      {item.id}
                    </span>
                    <span className="px-2 py-0.5 text-sm font-mono bg-white/10 text-white border border-white/20 shrink-0">
                      {item.categoryLabel}
                    </span>
                    <span className="text-sm font-normal text-zinc-200 truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 text-sm font-mono border border-white/20 bg-white/[0.04] text-zinc-100 font-semibold">
                      완료
                    </span>
                    <span className="text-sm font-mono text-zinc-400">
                      {isExpanded ? '닫기' : '상세'}
                    </span>
                  </div>
                </div>

                {/* 2단계: 클릭 시 결과값 및 세부 대조 펼침 (Click-to-Reveal) */}
                {isExpanded && (
                  <div className="px-6 py-4 bg-black/40 border-t border-white/[0.06] space-y-3.5">
                    {/* 결과값 배너 */}
                    <div className="p-3 bg-white/[0.03] border border-white/15 flex items-center justify-between text-sm font-mono">
                      <span className="text-zinc-400 font-semibold">결과:</span>
                      <span className="text-white font-medium">{item.impactLabel}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-white/[0.015] border border-white/10 space-y-1">
                        <span className="text-sm font-mono text-zinc-400 uppercase font-semibold block">
                          [기존 상태]
                        </span>
                        <p className="text-zinc-300 font-light leading-relaxed text-sm">
                          {item.beforeSummary}
                        </p>
                      </div>

                      <div className="p-3 bg-white/[0.03] border border-white/20 space-y-1">
                        <span className="text-sm font-mono text-white uppercase font-bold block">
                          [개편 상태]
                        </span>
                        <p className="text-white font-light leading-relaxed text-sm">
                          {item.afterSummary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-sm font-mono">
                      <span className="text-zinc-400">
                        영향 라우트: {item.affectedRoutes.join(', ')}
                      </span>
                      {item.affectedRoutes[0] && (
                        <Link
                          href={item.affectedRoutes[0]}
                          prefetch={true}
                          className="text-white hover:underline text-sm font-medium"
                        >
                          화면 열람 ➔
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          [3] 개발자/엔지니어링 세부 점검 명세 (기본 닫힘 / 필요 시만 펼침)
          ==================================================================== */}
      <div className="pt-4 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={() => setIsDeepTechExpanded(!isDeepTechExpanded)}
          className="w-full p-4.5 bg-[#0c0d12] border border-white/10 hover:border-white/20 flex items-center justify-between text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-200 font-medium">
              엔지니어링 명세
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-mono text-zinc-400">
            <span>{isDeepTechExpanded ? '닫기' : '열람'}</span>
            {isDeepTechExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isDeepTechExpanded && (
          <div className="mt-4 space-y-6 animate-fadeIn">
            {/* 테스트 계정 (3열 인라인 조망) */}
            <div className="space-y-2">
              <span className="text-sm font-mono text-zinc-400 block font-semibold">
                테스트 계정
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {TEST_ACCOUNTS.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between text-sm font-mono"
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <span className="text-white font-semibold">{acc.handle}</span>
                      <span className="text-zinc-300 font-medium">{acc.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startAdminImpersonation(`USER_${acc.id.toUpperCase()}`)}
                        className="px-2 py-0.5 border border-white/20 hover:border-white bg-white/[0.04] text-white hover:underline cursor-pointer font-medium text-sm"
                      >
                        열람 ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 프로세스 입출력 명세 (2열 컴팩트 그리드) */}
            <div className="space-y-2">
              <span className="text-sm font-mono text-zinc-400 block font-semibold">
                입출력 명세
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {PROCESS_AUDIT_STEPS.map((step) => {
                  const isExpanded = selectedTechStepId === step.stepNo;
                  return (
                    <div
                      key={step.stepNo}
                      className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                        isExpanded ? 'col-span-full bg-white/[0.04] border-white/20' : 'hover:bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div
                        onClick={() => setSelectedTechStepId(isExpanded ? null : step.stepNo)}
                        className="p-3.5 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm font-mono text-white font-bold shrink-0">{step.stepNo}</span>
                          <span className="text-sm font-mono text-zinc-400 shrink-0">[{step.processId}]</span>
                          <span className="text-sm text-zinc-200 font-normal truncate">{step.name}</span>
                        </div>
                        <span className="text-sm font-mono px-2 py-0.5 border border-white/15 text-zinc-300 shrink-0">
                          {isExpanded ? '닫기' : step.status}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="px-6 pb-5 pt-1 bg-black/40 text-sm font-mono space-y-3">
                          <p className="text-zinc-300 font-light leading-relaxed">{step.summary}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3.5 bg-white/[0.02] border border-white/[0.06]">
                              <span className="text-zinc-400 text-sm block mb-1 font-semibold">[입력값]</span>
                              {Object.entries(step.inputs).map(([k, v]) => (
                                <div key={k} className="text-zinc-200 text-sm">{k}: {v}</div>
                              ))}
                            </div>
                            <div className="p-3.5 bg-white/[0.02] border border-white/[0.06]">
                              <span className="text-zinc-400 text-sm block mb-1 font-semibold">[결과]</span>
                              {Object.entries(step.outputs).map(([k, v]) => (
                                <div key={k} className="text-zinc-200 text-sm">{k}: {v}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
