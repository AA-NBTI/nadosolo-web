'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  Award,
} from 'lucide-react';

export type AuditStatus = 'PENDING' | 'TESTED' | 'APPROVED';

export interface AuditItem {
  id: string;
  stageNo: string;
  stageName: string;
  title: string;
  targetAccount: string;
  testRoute: string;
  criteria: string;
  inputs: Record<string, string>;
  expectedOutputs: Record<string, string>;
  reproductionSteps: string[];
  status: AuditStatus;
  testedAt?: string;
  approvedAt?: string;
}

const INITIAL_AUDIT_ITEMS: AuditItem[] = [
  // 1단계: 인증
  {
    id: 'CHK-01-01',
    stageNo: '01',
    stageName: '인증',
    title: '비밀번호',
    targetAccount: 'aa, bb, admin',
    testRoute: '/auth',
    criteria: 'aa, bb, admin 3개 계정 모두 단일 비밀번호 aa1111로 정상 인증되며 오류 시 실시간 차단되는지 검증',
    inputs: {
      '계정 아이디': 'aa (또는 bb, admin)',
      '비밀번호': 'aa1111',
      '비인가 비밀번호': '123456 (차단 테스트용)',
    },
    expectedOutputs: {
      '정상 입력': '로그인 완료 ➔ 세션 생성 ➔ 마이페이지(또는 관리자) 0.1초 즉시 라우팅',
      '오류 입력': '비밀번호 불일치 경고 메시지 노출 및 로그인 차단',
    },
    reproductionSteps: [
      '1. 브라우저에서 /auth 접속',
      '2. 아이디에 aa, 비밀번호에 aa1111 입력 후 로그인 클릭',
      '3. /dashboard 화면으로 0.1초 전환 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:30',
  },
  {
    id: 'CHK-01-02',
    stageNo: '01',
    stageName: '인증',
    title: '더미',
    targetAccount: '공통',
    testRoute: '/auth',
    criteria: '로그인 화면 및 시스템 전역에 6인 원클릭 더미 버튼 및 과거 더미 계정이 완전 배제되었는지 검증',
    inputs: {
      '더미 식별자': 'U03, U04, G01~G06 등 과거 더미',
    },
    expectedOutputs: {
      '화면 상태': '체험용 더미 버튼 0개, 순수 자격증명 입력창만 렌더링',
      '인증 결과': '더미 계정 입력 시 미등록 회원 에러 반환',
    },
    reproductionSteps: [
      '1. /auth 화면에서 원클릭 더미 버튼 부재 확인',
      '2. 임의의 더미 ID 입력 시 정상 차단 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:32',
  },
  {
    id: 'CHK-01-03',
    stageNo: '01',
    stageName: '인증',
    title: '권한',
    targetAccount: 'aa, admin',
    testRoute: '/auth',
    criteria: '일반 회원(aa, bb)은 /dashboard로, 슈퍼 관리자(admin)는 /admin으로 자동 분기하는지 검증',
    inputs: {
      '일반 계정': 'aa / aa1111',
      '관리자 계정': 'admin / aa1111',
    },
    expectedOutputs: {
      'aa 로그인': '/dashboard 이동 (마이페이지 및 테이블 현황)',
      'admin 로그인': '/admin 이동 (시스템 총괄 관제 보드)',
    },
    reproductionSteps: [
      '1. aa 로그인 후 브라우저 URL이 /dashboard인지 확인',
      '2. admin 로그인 후 브라우저 URL이 /admin인지 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:35',
  },

  // 2단계: 프로필 (1요소 1기준 단일 명사 원칙 준수)
  {
    id: 'CHK-02-01',
    stageNo: '02',
    stageName: '프로필',
    title: '식단',
    targetAccount: 'aa, bb',
    testRoute: '/dashboard',
    criteria: '알레르기, 비건, 논알콜 등 음식 섭취 제약 조건이 1층 안전 필터에 단일 변수로 정확히 연동되는지 검증',
    inputs: {
      '식단 제약': '비건 / 논알콜 / 제약 없음',
    },
    expectedOutputs: {
      '안전 필터': '식단 비호환 매장 및 메뉴 배제 단일 판정 통과',
    },
    reproductionSteps: [
      '1. /dashboard 접속 후 프로필 내 식단(알레르기/주류) 설정 확인',
      '2. 비건 또는 알레르기 설정 변경 후 1층 필터 정상 반영 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:36',
  },
  {
    id: 'CHK-02-02',
    stageNo: '02',
    stageName: '프로필',
    title: '취향',
    targetAccount: 'aa, bb',
    testRoute: '/dashboard',
    criteria: '미식, 와인, 러닝 등 라이프스타일 관심사 태그가 3층 활동 모듈에 단일 변수로 연동되는지 검증',
    inputs: {
      '취향 태그': '미식·와인, 러닝·피트니스',
    },
    expectedOutputs: {
      '테마 매칭': '공통 관심사 기반 테이블 테마 단일 반영',
    },
    reproductionSteps: [
      '1. /dashboard 프로필 내 관심사 태그 선택',
      '2. 취향 키워드가 3층 매칭 파라미터에 정상 저장되는지 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:37',
  },
  {
    id: 'CHK-02-03',
    stageNo: '02',
    stageName: '프로필',
    title: '목적',
    targetAccount: 'aa, bb',
    testRoute: '/dashboard',
    criteria: '지적 환기(목적②)와 인연·동반자(목적④)가 단일 기준으로 분리되어 적격 챕터로 라우팅되는지 검증',
    inputs: {
      'aa 목적': '인연·동반자 (ROMANCE / 미혼 싱글)',
      'bb 목적': '인연·동반자 (ROMANCE / 미혼 싱글)',
    },
    expectedOutputs: {
      '목적 분류': '적격 챕터 단일 배정 및 하드 제약(기혼자의 싱글룸 진입 차단) 통과',
    },
    reproductionSteps: [
      '1. /admin ➔ 시스템 ➔ 테스트 탭 진입',
      '2. aa 및 bb의 2층 참가 목적 판정 라벨 및 배정 챕터 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:38',
  },

  // 3단계: 엔진
  {
    id: 'CHK-03-01',
    stageNo: '03',
    stageName: '엔진',
    title: '정규화',
    targetAccount: '공통 엔진',
    testRoute: '/admin',
    criteria: '외모·스타일·음성·대화·매너 5대 영역과 25개 순수 단일 명사 앵커가 100점 만점 표준 점수로 정규화 연산되는지 검증',
    inputs: {
      '평가 척도': '1요소당 4점 만점 × 5개 기준 = 20점 만점',
      '합산 공식': '5개 도메인 합산 = 100점 만점 표준화',
    },
    expectedOutputs: {
      '정규화 결과': '도메인별 20점 만점 환산 및 레이더 차트 매핑 완료',
    },
    reproductionSteps: [
      '1. /admin ➔ 시스템 ➔ 엔진 탭 확인',
      '2. 25개 단일 명사 슬롯 및 20점 만점 정규화 로직 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:40',
  },
  {
    id: 'CHK-03-02',
    stageNo: '03',
    stageName: '엔진',
    title: '메타인지',
    targetAccount: 'aa, bb',
    testRoute: '/dashboard',
    criteria: '본인이 스스로 평가한 점수(Self)와 동석자가 관찰한 점수(Mirror) 간의 메타인지 격차가 오차 범위 내에서 올바르게 도출되는지 검증',
    inputs: {
      '자가 평가': 'aa 본인의 대화/경청 자가진단 점수',
      '동석자 관찰': 'bb가 관찰한 aa의 대화/경청 평가 점수',
    },
    expectedOutputs: {
      '소셜 메타인지': '과대/과소평가 영역 분석 및 맞춤형 강점/보완 코칭 문구 자동 생성',
    },
    reproductionSteps: [
      '1. /dashboard ➔ 소셜 메타인지 리포트 섹션 확인',
      '2. 내가 본 나 vs 타인이 본 나 레이더 차트 비교 점검',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:41',
  },

  // 4단계: 매칭
  {
    id: 'CHK-04-01',
    stageNo: '04',
    stageName: '매칭',
    title: '제약',
    targetAccount: '공통 엔진',
    testRoute: '/admin',
    criteria: '1층 안전 ➔ 2층 목적 ➔ 3층 활동 ➔ 4층 결(IPC 8옥탄트) ➔ 5층 공간 ➔ 6층 다면관찰 6단계 필터가 순차 작동하는지 검증',
    inputs: {
      '시뮬레이션 인원': '120명 가상 풀 투입',
    },
    expectedOutputs: {
      '연산 결과': '하드 제약 위반 0건, 남녀 3:3 정원 일치, 주도형(PA) 2인 이하 안전 밸런스 유지',
    },
    reproductionSteps: [
      '1. /admin ➔ 시스템 ➔ 매칭 탭에서 [시뮬레이션] 실행',
      '2. 편성 테이블 수 및 하드 제약 위반 0건 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:42',
  },

  // 5단계: 식탁
  {
    id: 'CHK-05-01',
    stageNo: '05',
    stageName: '식탁',
    title: '회전',
    targetAccount: 'aa, bb',
    testRoute: '/dashboard',
    criteria: '모임 중간 전반/후반 180도 좌석 회전을 통해 모든 참가자 간 시선 분산 및 1:1 대화 기회가 고르게 제공되는지 검증',
    inputs: {
      '테이블 모드': '전반부 기본 좌석 ➔ 후반부 180도 회전',
    },
    expectedOutputs: {
      '좌석 전환': '마주보는 동석자 재배치 및 상호 대화 페어링 갱신',
    },
    reproductionSteps: [
      '1. /dashboard ➔ 좌석 배치도 확인',
      '2. [후반전 좌석 회전] 토글 클릭 후 대각/맞은편 좌석 교체 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:43',
  },

  // 6단계: 상호주의
  {
    id: 'CHK-06-01',
    stageNo: '06',
    stageName: '상호주의',
    title: '해금',
    targetAccount: 'aa, bb',
    testRoute: '/dashboard',
    criteria: '본인이 동석자 전원에 대한 관찰 평가를 100% 완료해야만 내 리포트가 잠금 해제(Unlock)되는 헌법 규칙 검증',
    inputs: {
      '미완료 상태': '동석자 평가 미제출 시 리포트 열람 차단(Lock)',
      '완료 상태': '동석자 전원 평가 제출 완료 시 리포트 열람 해금(Unlock)',
    },
    expectedOutputs: {
      '무임승차 차단': '미완료 회원의 리포트 열람 불가 안내 및 평가 참여 유도',
      '해금 즉시': '5대 도메인 다면 피드백 점수 및 시계열 리포트 노출',
    },
    reproductionSteps: [
      '1. /dashboard ➔ 평가 완료 전 잠금 상태 확인',
      '2. 평가 제출 완료 후 다면 관찰 리포트 즉시 열람 확인',
    ],
    status: 'TESTED',
    testedAt: '2026-11-09 17:44',
  },
];

const STORAGE_KEY = 'nadosolo_audit_report_v3';

function getStoredAuditItems(): AuditItem[] {
  if (typeof window === 'undefined') return INITIAL_AUDIT_ITEMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_AUDIT_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_AUDIT_ITEMS;
  } catch {
    return INITIAL_AUDIT_ITEMS;
  }
}

function saveStoredAuditItems(items: AuditItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save audit items:', e);
  }
}

interface Props {
  subTab: 'PLAN' | 'CHECKLIST' | 'APPROVAL';
  isLight?: boolean;
  onNotify?: (msg: string) => void;
}

export default function AdminAuditReportManager({ subTab, isLight = false, onNotify }: Props) {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  useEffect(() => {
    setItems(getStoredAuditItems());
  }, []);

  const notify = (msg: string) => {
    if (onNotify) onNotify(msg);
  };

  const handleUpdateItemStatus = (itemId: string, nextStatus: AuditStatus) => {
    const now = new Date().toISOString().substring(0, 16).replace('T', ' ');
    const next = items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          status: nextStatus,
          approvedAt: nextStatus === 'APPROVED' ? now : it.approvedAt,
          testedAt: nextStatus === 'TESTED' ? now : it.testedAt,
        };
      }
      return it;
    });
    setItems(next);
    saveStoredAuditItems(next);
    const target = items.find((i) => i.id === itemId);
    notify(`[${target?.title || itemId}] 상태가 '${nextStatus === 'APPROVED' ? '승인' : nextStatus === 'TESTED' ? '완료' : '대기'}'으로 변경되었습니다.`);
  };

  const handleApproveAll = () => {
    const now = new Date().toISOString().substring(0, 16).replace('T', ' ');
    const next = items.map((it) => ({
      ...it,
      status: 'APPROVED' as AuditStatus,
      approvedAt: now,
    }));
    setItems(next);
    saveStoredAuditItems(next);
    notify('전체 점검 항목이 최종 승인(APPROVED) 처리되었습니다.');
  };

  const handleResetToDefault = () => {
    saveStoredAuditItems(INITIAL_AUDIT_ITEMS);
    setItems(INITIAL_AUDIT_ITEMS);
    setSelectedItemId(null);
    notify('점검 보고서가 초기 상태로 복원되었습니다.');
  };

  const cardBg = isLight ? 'bg-white border-zinc-300' : 'bg-[#0c0d12] border-white/10';
  const subCardBg = isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/[0.08]';
  const textTitle = isLight ? 'text-zinc-900' : 'text-white';
  const textMuted = isLight ? 'text-zinc-500' : 'text-zinc-400';

  // 통계 집계
  const totalCount = items.length;
  const approvedCount = items.filter((i) => i.status === 'APPROVED').length;
  const testedCount = items.filter((i) => i.status === 'TESTED').length;
  const pendingCount = items.filter((i) => i.status === 'PENDING').length;
  const approvalRate = Math.round((approvedCount / (totalCount || 1)) * 100);

  const stages = Array.from(new Set(items.map((i) => i.stageName)));
  const filteredItems = stageFilter === 'ALL' ? items : items.filter((i) => i.stageName === stageFilter);

const STAGE_META: Record<string, { stepNo: string; desc: string }> = {
  인증: { stepNo: 'STEP 01', desc: '계정 자격증명(aa, bb, admin) 및 단일 비밀번호(aa1111) 검증' },
  프로필: { stepNo: 'STEP 02', desc: '식단, 취향, 목적 3대 파라미터 1:1 단일 기준 검증' },
  엔진: { stepNo: 'STEP 03', desc: '5대 도메인 25개 단일 명사 100점 만점 표준 점수 정규화 연산' },
  매칭: { stepNo: 'STEP 04', desc: '6인 프라이빗 룸 1~6층 하드 제약 및 남녀 3:3 성비 검증' },
  식탁: { stepNo: 'STEP 05', desc: '현장 180도 좌석 회전 및 전원 1:1 대화 기회 시선 분산' },
  상호주의: { stepNo: 'STEP 06', desc: '동석자 전원 평가 완료 100% 시 리포트 열람 상호주의 해금' },
};

  // ==========================================================================
  // [VIEW 1: 계획] 6단계 프로세스 1줄 컴팩트 리스트 ➔ 클릭 시 상세 (Click-to-Reveal)
  // ==========================================================================
  if (subTab === 'PLAN') {
    return (
      <div className="space-y-3 animate-in fade-in duration-150">
        {/* 상단 컴팩트 인라인 바 */}
        <div className={`p-3 border ${cardBg} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <h2 className="font-serif-editorial text-lg text-white font-normal">
              계획
            </h2>
            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
              6단계 • 승인율 {approvalRate}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 px-2.5 py-1 border border-white/10 hover:border-white/30 text-sm font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>초기화</span>
            </button>
          </div>
        </div>

        {/* 6단계 프로세스 2열 그리드 리스트 (한 화면 조망 & 스크롤 최소화) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {stages.map((stg, idx) => {
            const isExpanded = expandedStage === stg;
            const stgItems = items.filter((i) => i.stageName === stg);
            const stgApproved = stgItems.filter((i) => i.status === 'APPROVED').length;
            const isAllApproved = stgApproved === stgItems.length;
            const meta = STAGE_META[stg] ?? { stepNo: `STEP 0${idx + 1}`, desc: '' };

            return (
              <div
                key={stg}
                className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                  isExpanded ? 'col-span-full bg-white/[0.03] border-white/20' : 'hover:bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {/* 1단계: 컴팩트 1줄 행 */}
                <div
                  onClick={() => setExpandedStage(isExpanded ? null : stg)}
                  className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                      {isExpanded ? '▾' : '▸'}
                    </span>
                    <span className="text-sm font-mono font-bold text-white shrink-0">
                      {meta.stepNo}
                    </span>
                    <span className="text-base font-semibold text-white shrink-0">
                      {stg}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 text-sm font-mono">
                    <span className="text-zinc-300">
                      {stgApproved}/{stgItems.length} 승인
                    </span>

                    <span
                      className={`px-2 py-0.5 text-sm border font-semibold ${
                        isAllApproved
                          ? 'border-white/40 bg-white/10 text-white'
                          : stgApproved > 0
                          ? 'border-white/30 bg-white/10 text-white'
                          : 'border-white/10 text-zinc-500'
                      }`}
                    >
                      {isAllApproved ? '승인' : stgApproved > 0 ? '진행' : '대기'}
                    </span>

                    <div className="flex items-center gap-1 text-zinc-500 pl-1">
                      <span>{isExpanded ? '닫기' : '항목'}</span>
                    </div>
                  </div>
                </div>

                {/* 2단계: 클릭 시 펼쳐지는 세부 설명 및 하위 점검 항목 리스트 (Click-to-Reveal) */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 bg-black/40 border-t border-white/[0.04] space-y-3">
                    <div className="pl-3.5 border-l-2 border-white/20 ml-1">
                      <p className="text-sm text-zinc-300 font-light leading-relaxed">
                        {meta.desc}
                      </p>
                    </div>

                    <div className="pl-3.5 border-l border-white/20 ml-1 space-y-2">
                      <span className="text-sm font-mono text-zinc-400 uppercase block pt-1">
                        점검 ({stgItems.length}건)
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {stgItems.map((it) => (
                          <div
                            key={it.id}
                            className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between text-sm font-mono gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-white font-semibold shrink-0">{it.id}</span>
                              <span className="text-white truncate">• {it.title}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-1.5 py-0.5 text-sm border font-semibold ${
                                  it.status === 'APPROVED'
                                    ? 'border-white/40 bg-white/10 text-white'
                                    : it.status === 'TESTED'
                                    ? 'border-white/30 bg-white/10 text-white'
                                    : 'border-white/10 text-zinc-500'
                                }`}
                              >
                                {it.status === 'APPROVED' ? '승인' : it.status === 'TESTED' ? '완료' : '대기'}
                              </span>

                              {it.status !== 'APPROVED' ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateItemStatus(it.id, 'APPROVED');
                                  }}
                                  className="px-2 py-0.5 border border-white/30 text-white hover:bg-white/15 bg-white/5 text-sm transition-colors cursor-pointer font-semibold"
                                >
                                  승인
                                </button>
                              ) : (
                                <span className="text-zinc-500 text-sm px-0.5">
                                  완료
                                </span>
                              )}
                            </div>
                          </div>
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
    );
  }

  // ==========================================================================
  // [VIEW 3: 승인] 관리자 최종 승인 마스터 보드
  // ==========================================================================
  if (subTab === 'APPROVAL') {
    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        {/* 상단 인라인 바 */}
        <div className={`p-3 border ${cardBg} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <h2 className="font-serif-editorial text-lg text-white font-normal">
              승인
            </h2>
            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
              {approvedCount} / {totalCount} 완료 ({approvalRate}%)
            </span>
          </div>

          <button
            type="button"
            onClick={handleApproveAll}
            className="px-3 py-1 border border-white/20 hover:border-white/40 bg-white/[0.04] text-sm font-mono text-white transition-all cursor-pointer font-medium"
          >
            승인
          </button>
        </div>

        {/* 최종 승인 판정 요약 카드 */}
        <div className={`p-4 border border-white/15 bg-[#0c0d12] space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <h3 className="font-serif-editorial text-lg text-white font-normal">
              가동 승인
            </h3>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-sm font-mono bg-white/10 text-white border border-white/20 font-semibold">
                {approvalRate === 100 ? '승인' : '진행중'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm font-mono">
            <div className="p-2.5 bg-white/[0.02] border border-white/5 space-y-0.5">
              <span className="text-zinc-500 block text-sm">점검</span>
              <span className="text-white">AI 어시스턴트</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5 space-y-0.5">
              <span className="text-zinc-500 block text-sm">승인자</span>
              <span className="text-white">관리자 (@admin)</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5 space-y-0.5">
              <span className="text-zinc-500 block text-sm">대상</span>
              <span className="text-white font-medium">aa, bb</span>
            </div>
          </div>

          {/* 승인 진행 목록 (2열 컴팩트 그리드로 한 화면 조망) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="p-3 border border-white/10 bg-black/40 flex items-center justify-between gap-3 text-sm font-mono"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-white font-semibold shrink-0">{it.id}</span>
                  <span className="text-zinc-400 shrink-0">[{it.stageName}]</span>
                  <span className="text-white font-medium truncate">{it.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {it.status === 'APPROVED' ? (
                    <span className="px-2 py-0.5 text-sm font-mono border border-white/30 bg-white/10 text-white font-semibold">
                      승인
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateItemStatus(it.id, 'APPROVED')}
                      className="px-2.5 py-0.5 text-sm font-mono border border-white/20 hover:border-white bg-white/[0.03] text-zinc-200 hover:text-white transition-colors cursor-pointer font-medium"
                    >
                      승인
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // [VIEW 2: 항목 (기본)] 프로세스별 세부 점검 항목 1줄 리스트 ➔ 클릭 상세 (Click-to-Reveal)
  // ==========================================================================
  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {/* 상단 컴팩트 인라인 컨트롤 바 (단계 필터 + 인원수 + 초기화) */}
      <div className={`p-3 border ${cardBg} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h2 className="font-serif-editorial text-lg text-white font-normal">
            항목
          </h2>
          <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
            {filteredItems.length}건
          </span>
        </div>

        {/* 단계별 필터 버튼 그룹 */}
        <div className="flex items-center gap-2">
          <div className="flex border border-white/10 divide-x divide-white/10 text-sm font-mono">
            {['ALL', ...stages].map((stg) => (
              <button
                key={stg}
                type="button"
                onClick={() => setStageFilter(stg)}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  stageFilter === stg
                    ? 'bg-white/15 text-white font-semibold'
                    : 'bg-black/30 text-zinc-400 hover:text-white'
                }`}
              >
                {stg === 'ALL' ? '전체' : stg}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-1 border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 점검 항목 2열(2단) 컴팩트 그리드 ➔ 한 화면 전체 조망 극대화 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filteredItems.map((item) => {
          const isExpanded = selectedItemId === item.id;
          return (
            <div
              key={item.id}
              className={`border transition-colors ${
                isLight ? 'bg-white border-zinc-200' : 'bg-[#0c0d12] border-white/10'
              } ${
                isExpanded
                  ? isLight
                    ? 'col-span-full bg-zinc-50 border-zinc-400'
                    : 'col-span-full bg-white/[0.03] border-white/20'
                  : isLight
                  ? 'hover:bg-zinc-50 hover:border-zinc-300'
                  : 'hover:bg-white/[0.02] hover:border-white/20'
              }`}
            >
              {/* 1단계: 컴팩트 1줄 행 */}
              <div
                onClick={() => setSelectedItemId(isExpanded ? null : item.id)}
                className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                    {isExpanded ? '▾' : '▸'}
                  </span>
                  <span className="text-sm font-mono font-bold text-white shrink-0">
                    {item.id}
                  </span>
                  <span className="text-sm font-mono px-2 py-0.5 bg-white/10 text-zinc-200 border border-white/10 shrink-0">
                    {item.stageName}
                  </span>
                  <span className="text-sm font-medium text-white truncate">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 text-sm font-mono border font-semibold ${
                      item.status === 'APPROVED'
                        ? 'border-white/40 bg-white/10 text-white'
                        : item.status === 'TESTED'
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-white/10 text-zinc-500'
                    }`}
                  >
                    {item.status === 'APPROVED' ? '승인' : item.status === 'TESTED' ? '완료' : '대기'}
                  </span>

                  <div className="flex items-center gap-1 text-sm font-mono text-zinc-500 group-hover:text-white">
                    <span>{isExpanded ? '닫기' : '상세'}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 2단계: 클릭 시 펼쳐지는 세부 검증 시나리오 및 승인 컨트롤 */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 bg-black/40 border-t border-white/[0.04]">
                  <div className="pl-3.5 border-l border-white/20 ml-1 space-y-4">
                    {/* 검증 기준 */}
                    <div className="space-y-1">
                      <span className="text-sm font-mono text-zinc-500 uppercase">
                        검증 기준
                      </span>
                      <p className="text-sm text-zinc-300 font-light leading-relaxed">
                        {item.criteria}
                      </p>
                    </div>

                    {/* 입력값 vs 기대 결과 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-white/[0.02] border border-white/5 space-y-2">
                        <span className="text-sm font-mono text-zinc-500 uppercase block">
                          입력 파라미터 / 대상
                        </span>
                        <div className="space-y-1">
                          {Object.entries(item.inputs).map(([k, v]) => (
                            <div key={k} className="flex justify-between font-mono text-sm">
                              <span className="text-zinc-400">{k}:</span>
                              <span className="text-white font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/5 space-y-2">
                        <span className="text-sm font-mono text-zinc-500 uppercase block">
                          기대 결과 / 시스템 판정
                        </span>
                        <div className="space-y-1">
                          {Object.entries(item.expectedOutputs).map(([k, v]) => (
                            <div key={k} className="flex justify-between font-mono text-sm">
                              <span className="text-zinc-400">{k}:</span>
                              <span className="text-white font-semibold">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 재현 가이드 */}
                    <div className="p-3 bg-black/50 border border-white/10 space-y-1.5">
                      <span className="text-sm font-mono text-zinc-400 uppercase block">
                        테스트 재현 단계
                      </span>
                      <div className="space-y-1 text-sm font-mono text-zinc-300">
                        {item.reproductionSteps.map((step, idx) => (
                          <p key={idx} className="leading-relaxed">
                            {step}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* 하단 액션 컨트롤 바 */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/[0.06] text-sm font-mono gap-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={item.testRoute}
                          prefetch={true}
                          className="inline-flex items-center gap-1.5 px-3 py-1 border border-white/20 hover:border-white/40 bg-white/[0.03] text-zinc-200 hover:text-white transition-colors"
                        >
                          <span>해당 동선 열기</span>
                          <ExternalLink className="w-3 h-3 text-zinc-300" />
                        </Link>
                        <span className="text-zinc-500 text-sm">
                          {item.testedAt && `점검일시: ${item.testedAt}`}
                          {item.approvedAt && ` • 승인일시: ${item.approvedAt}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status !== 'APPROVED' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateItemStatus(item.id, 'APPROVED')}
                            className="px-3.5 py-1.5 border border-white/30 bg-white/15 hover:bg-white/25 text-white font-bold transition-colors cursor-pointer"
                          >
                            승인
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateItemStatus(item.id, 'TESTED')}
                            className="px-2.5 py-1 border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm"
                          >
                            취소
                          </button>
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
    </div>
  );
}

