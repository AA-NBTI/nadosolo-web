'use client';

import React, { useState, useEffect } from 'react';
import {
  EXECUTIVE_GOVERNANCE_TEAM,
  GovernanceRole,
  GOVERNANCE_INCIDENTS,
  GovernanceIncident,
  GOVERNANCE_HOTSPOTS,
  GovernanceHotspot,
} from '@/engine/architectureAuditRegistry';
import {
  runSyntheticSimulation,
  getSystemAuditLogs,
  AuditLogEntry,
  SimulationRunReport,
} from '@/engine/syntheticSimulationEngine';

interface AdminGovernanceManagerProps {
  cardCls?: string;
  textTitleCls?: string;
  notify?: (msg: string) => void;
  activeMode?: 'SADAN' | 'USER';
  onModeChange?: (mode: 'SADAN' | 'USER') => void;
}

export type MainCategoryKey = 'SADAN' | 'USER';
export type SadanSubTabKey = 'ALL' | 'TEAM' | 'INCIDENT' | 'HOTSPOT';
export type UserSubTabKey = 'ALL' | 'JOURNEY' | 'DEFECT' | 'VOC' | 'AAA' | 'BBB';

export interface PersonaJourneyStage {
  step: number;
  name: string;
  status: '완료' | '진행' | '대기';
  detail: string;
}

export interface PersonaTesterDefect {
  id: string;
  testerId: 'aaa' | 'bbb';
  testerName: string;
  stageName: string;
  severity: '상' | '중' | '하';
  title: string;
  problemDetail: string;
  impact: string;
  actionPro: string;
  status: '보정완료' | '진행';
  fixDetail: string;
}

export interface PersonaTesterVoc {
  id: string;
  testerId: 'aaa' | 'bbb';
  testerName: string;
  topic: string;
  title: string;
  requestDetail: string;
  expectedBenefit: string;
  solution: string;
  status: '반영완료' | '반영검토';
}

export interface PersonaTester {
  id: 'aaa' | 'bbb';
  code: string;
  name: string;
  handle: string;
  genderText: string;
  gender: 'M' | 'F';
  birthYear: number;
  age: number;
  residenceCity: string;
  residenceDistrict: string;
  jobTitle: string;
  nbtiText: string;     // 본질 1: 소통 성향 (NBTI)
  purposeText: string;  // 본질 2: 참여 목적 (지적환기 / 인연)
  trustText: string;    // 본질 3: 신뢰도
  dietaryText: string;  // 부차적: 식단
  dietaryValue: string;
  personaSummary: string;
  stages: PersonaJourneyStage[];
  defects: PersonaTesterDefect[];
  vocs: PersonaTesterVoc[];
}

export const PERSONA_TESTER_DEFECTS: PersonaTesterDefect[] = [
  {
    id: 'DEF-AAA-01',
    testerId: 'aaa',
    testerName: '가상 1호 (aaa)',
    stageName: '1관문 가입',
    severity: '중',
    title: '비밀번호 고정 규칙(aa1111) 사전 안내 부재로 인한 혼선',
    problemDetail:
      '가입 및 로그인 단계에서 시스템 테스트용 고정 비밀번호(aa1111)에 대한 사전 가이드가 없어, 일반 임의 비밀번호를 설정·입력하려다 반복 인증 불일치 및 가입 동선 혼선 체감.',
    impact: '신규 이용자 첫 진입 관문(P01)에서 인증 오류율 증가 및 초기 이탈 위험 유발.',
    actionPro: '가프로(개발) · 라프로(운영)',
    status: '보정완료',
    fixDetail:
      '비밀번호 입력란 하단에 [테스트 계정 기본 비밀번호: aa1111 고정 적용] 직관 안내 가이드 및 원클릭 자동완성 칩 탑재 완료.',
  },
  {
    id: 'DEF-AAA-02',
    testerId: 'aaa',
    testerName: '가상 1호 (aaa)',
    stageName: '2관문 프로필',
    severity: '중',
    title: '거주지 선택 후 모임 장소와의 연계 정보 미흡',
    problemDetail:
      '활동 거주지로 "부산 해운대구"를 선택했으나, 현재 개설 및 대기 중인 실제 다이닝 모임 장소(전포/광안/서면)와의 연계 정보 및 거리/추천 피드백이 실시간으로 확인되지 않아 다음 단계 진행 시 불확실성 체감.',
    impact: '프로필 완료 후 모임 신청 결제 단계(P03)로 넘어가는 전환율(CVR) 저하 우려.',
    actionPro: '바프로(매칭) · 가프로(개발)',
    status: '보정완료',
    fixDetail:
      '거주구 선택 즉시 [해운대 인근 추천 모임 큐 및 전포 살롱 3:3 매칭 대기 현황]을 실시간 인라인 피드백 카드로 자동 연계 노출.',
  },
  {
    id: 'DEF-BBB-01',
    testerId: 'bbb',
    testerName: '가상 2호 (bbb)',
    stageName: '2관문 프로필',
    severity: '상',
    title: "'식단'으로 비건·논알콜 선택 시 실제 배정될 다이닝 식당이 안전한지 사전 확신 부족",
    problemDetail:
      '프로필 설정에서 식단 취향으로 "비건·논알콜"을 신중히 선택했으나, 나중에 자동 배정될 다이닝 식당에서 비건 단품/코스가 엄격히 보장되는지, 무알콜 음료 페어링이 완비되어 있는지 사전 보증 정보가 부족하여 실제 모임 참석 확신 결여.',
    impact: '못 먹는 음식(식단) 제한을 가진 고관여 고객층의 신청 전 이탈 및 소셜 다이닝 신뢰도 저하.',
    actionPro: '바프로(공간) · 사프로(수익)',
    status: '보정완료',
    fixDetail:
      '제휴 다이닝 매장에 [비건 안심 메뉴 보장 / 논알콜 페어링 100% 구비 인증 배지] 공식 규격화 및 사전 식단 확인 프로토콜 구축.',
  },
  {
    id: 'DEF-BBB-02',
    testerId: 'bbb',
    testerName: '가상 2호 (bbb)',
    stageName: '1관문 가입',
    severity: '상',
    title: '닉네임과 실명 간 익명성 보장 안내 미흡',
    problemDetail:
      '실제 오프라인 6인 식탁 모임에 나갔을 때 실명이나 연락처, 소속이 동석자들에게 노출될 수 있다는 심리적 거부감이 있으나, 온보딩 초기에 "닉네임 100% 활동 / 연락처 절대 비공개" 원칙에 대한 확고한 신뢰 고지가 미흡.',
    impact: '여성 및 프라이버시 민감 전문직의 소셜 활동 참여 저어 및 회원가입 중단 요인 작용.',
    actionPro: '나프로(감사) · 라프로(운영)',
    status: '보정완료',
    fixDetail:
      '온보딩 가입 화면 및 대시보드 전면에 [헌법 제3조 절대 익명성 및 비하 방지 보장 헌법 - 실명·연락처 비공개 선언문]을 명시.',
  },
];

export const PERSONA_TESTER_VOCS: PersonaTesterVoc[] = [
  {
    id: 'VOC-AAA-01',
    testerId: 'aaa',
    testerName: '가상 1호 (aaa)',
    topic: '입력가이드',
    title: '비밀번호 입력 필드 가이드 직관화',
    requestDetail:
      '회원가입 및 로그인 시 고정 비밀번호 규칙(aa1111)이 시각적으로 즉시 인지되도록 입력창 하단 가이드를 선명하고 직관적으로 표기해 달라.',
    expectedBenefit: '온보딩 첫 관문 인증 시행착오 0건 달성 및 개발자·일반인 모두에게 무결점 진입 경험 제공.',
    solution: '입력창 하단에 선명한 고대비 안내 문구 배치 및 1클릭 자동 완성 보조 기능 적용 완료.',
    status: '반영완료',
  },
  {
    id: 'VOC-AAA-02',
    testerId: 'aaa',
    testerName: '가상 1호 (aaa)',
    topic: '지역매칭',
    title: '거주구(해운대) 기반 추천 모임 큐 자동 매칭 피드백 필요',
    requestDetail:
      '해운대구 거주자를 위해 해운대/센텀 거점 희망 참가자 현황(예: 3:3 성비 충원 2명 대기)이나 전포 카페거리 큐로 자동 합류 가능한 추천 매칭 피드백을 실시간 브리핑해 달라.',
    expectedBenefit: '지리적 이동 부담 해소 및 테이블 결제 퍼널 완주율 35% 향상.',
    solution: '온보딩 및 모임신청 화면에 거주구 기반 인근 다이닝 큐 자동 탐색 및 추천 안내 카드 연동.',
    status: '반영완료',
  },
  {
    id: 'VOC-BBB-01',
    testerId: 'bbb',
    testerName: '가상 2호 (bbb)',
    topic: '식단안심',
    title: '비건/논알콜 지원 매장 보장 배지 시각화',
    requestDetail:
      '비건 및 논알콜 선택 회원이 안심하고 모임에 참가할 수 있도록, 식당 배정 시 비건/논알콜 검증 완료 배지를 시각적으로 확실하게 표기해 달라.',
    expectedBenefit: '다양한 식습관·라이프스타일을 가진 2030·3040 회원의 심리적 안정감 확보 및 참가 전환율 증대.',
    solution: '파트너 매장 정보 및 테이블 안내 카드에 [비건 인증], [논알콜 보장] 공식 배지 시각화 적용.',
    status: '반영완료',
  },
  {
    id: 'VOC-BBB-02',
    testerId: 'bbb',
    testerName: '가상 2호 (bbb)',
    topic: '프라이버시',
    title: '오프라인 현장 프라이버시 안전 헌법 안내 강조 필요',
    requestDetail:
      '오프라인 만남 당일에도 오직 닉네임으로만 호칭하며, 사적인 신상 털기나 명함 교환 강요가 금지된다는 안전 헌법을 예약 확정서와 현장 대화카드에 강력하게 고지해 달라.',
    expectedBenefit: '여성 이용자의 오프라인 프라이버시 안전성 100% 보장 및 고품격 프라이빗 살롱 브랜드 가치 제고.',
    solution: '모임 확정 알림 및 현장 플레이북 카드 덱에 [현장 3대 프라이버시 안전 수칙: 닉네임 전용, 신상 질문 제한, 100% 익명 상호평가] 탑재 완료.',
    status: '반영완료',
  },
];

export const PERSONA_TESTERS: PersonaTester[] = [
  {
    id: 'aaa',
    code: 'P-01',
    name: '가상 1호 (aaa)',
    handle: '@aaa',
    genderText: '남성',
    gender: 'M',
    birthYear: 1992,
    age: 34,
    residenceCity: '부산',
    residenceDistrict: '해운대구',
    jobTitle: 'IT 개발자',
    nbtiText: '경청형 (NBTI 88점)',
    purposeText: '지적환기',
    trustText: '신뢰 98점',
    dietaryText: '일반 (제한없음)',
    dietaryValue: 'NONE',
    personaSummary: '남성 / IT 개발자 페르소나 (경청형 NBTI · 지적환기 목적 · 신뢰 98점)',
    stages: [
      { step: 1, name: '가입', status: '완료', detail: '아이디 @aaa 중복 검증 통과 및 기본 계정 생성 완료' },
      { step: 2, name: '프로필', status: '완료', detail: '남성 · 1992년생 · 부산 해운대구 · IT 개발자 · 식단: 일반' },
      { step: 3, name: '성향진단', status: '진행', detail: '5대 영역 자가진단 및 소통 성향(NBTI) 설문 작성 진행' },
      { step: 4, name: '모임신청', status: '대기', detail: '소셜 다이닝 테이블 참가권 결제 및 참가 신청 대기' },
      { step: 5, name: '상호평가', status: '대기', detail: '동석자 5인 대상 단일 명사 관찰 평가 대기' },
      { step: 6, name: '리포트', status: '대기', detail: '상호주의 해금 후 5×5×5 다면 메타인지 리포트 열람' },
    ],
    defects: PERSONA_TESTER_DEFECTS.filter((d) => d.testerId === 'aaa'),
    vocs: PERSONA_TESTER_VOCS.filter((v) => v.testerId === 'aaa'),
  },
  {
    id: 'bbb',
    code: 'P-02',
    name: '가상 2호 (bbb)',
    handle: '@bbb',
    genderText: '여성',
    gender: 'F',
    birthYear: 1995,
    age: 31,
    residenceCity: '부산',
    residenceDistrict: '부산진구 전포',
    jobTitle: '브랜드 디렉터',
    nbtiText: '공감형 (NBTI 94점)',
    purposeText: '새로운인연',
    trustText: '신뢰 99점',
    dietaryText: '비건·논알콜',
    dietaryValue: 'VEGAN,ALCOHOL_FREE',
    personaSummary: '여성 / 브랜드 디렉터 페르소나 (공감형 NBTI · 새로운인연 목적 · 신뢰 99점)',
    stages: [
      { step: 1, name: '가입', status: '완료', detail: '아이디 @bbb 중복 검증 통과 및 기본 계정 생성 완료' },
      { step: 2, name: '프로필', status: '완료', detail: '여성 · 1995년생 · 부산진구 전포 · 브랜드 디렉터 · 식단: 비건·논알콜' },
      { step: 3, name: '성향진단', status: '진행', detail: '5대 영역 자가진단 및 소통 성향(NBTI) 설문 작성 진행' },
      { step: 4, name: '모임신청', status: '대기', detail: '소셜 다이닝 테이블 참가권 결제 및 참가 신청 대기' },
      { step: 5, name: '상호평가', status: '대기', detail: '동석자 5인 대상 단일 명사 관찰 평가 대기' },
      { step: 6, name: '리포트', status: '대기', detail: '상호주의 해금 후 5×5×5 다면 메타인지 리포트 열람' },
    ],
    defects: PERSONA_TESTER_DEFECTS.filter((d) => d.testerId === 'bbb'),
    vocs: PERSONA_TESTER_VOCS.filter((v) => v.testerId === 'bbb'),
  },
];

export default function AdminGovernanceManager({
  cardCls = 'border-white/10 bg-[#0c0d12]',
  textTitleCls = 'text-white',
  notify = () => {},
  activeMode = 'SADAN',
  onModeChange = () => {},
}: AdminGovernanceManagerProps) {
  // [독립 중분류] 사단 vs 이용자
  const [mainCategory, setMainCategory] = useState<MainCategoryKey>(activeMode);

  // 사단 모드 서브 탭
  const [sadanSubTab, setSadanSubTab] = useState<SadanSubTabKey>('ALL');
  // 이용자 모드 서브 탭
  const [userSubTab, setUserSubTab] = useState<UserSubTabKey>('ALL');

  // 사단 선택 상태
  const [selectedProCode, setSelectedProCode] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedHotspotKey, setSelectedHotspotKey] = useState<string | null>(null);

  // 이용자 선택 상태
  const [selectedTesterId, setSelectedTesterId] = useState<string | null>(null);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [selectedVocId, setSelectedVocId] = useState<string | null>(null);

  // 사단 블록 개별 열림/닫힘 (초기 진입 시 100% 닫힘 기본값)
  const [isTeamOpen, setIsTeamOpen] = useState<boolean>(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState<boolean>(false);
  const [isHotspotOpen, setIsHotspotOpen] = useState<boolean>(false);

  // 가상 이용자 블록 개별 열림/닫힘 (초기 진입 시 100% 닫힘 기본값)
  const [isJourneyOpen, setIsJourneyOpen] = useState<boolean>(false);
  const [isDefectOpen, setIsDefectOpen] = useState<boolean>(false);
  const [isVocOpen, setIsVocOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);

  // 실시간 시뮬레이션 실행 상태 & 감사 로그
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [latestReport, setLatestReport] = useState<SimulationRunReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    setAuditLogs(getSystemAuditLogs());
  }, []);

  const handleRunSimulation = async (testerId: 'aaa' | 'bbb') => {
    setIsSimulating(true);
    notify(`가상 ${testerId}호 6대 관문 여정 시뮬레이션 가동 시작...`);
    try {
      const report = await runSyntheticSimulation(testerId);
      setLatestReport(report);
      setAuditLogs(getSystemAuditLogs());
      notify(`가상 ${testerId}호 시뮬레이션 완료 (${report.durationMs}ms, 성공률 ${report.successRate}%)`);
    } catch (err) {
      notify(`시뮬레이션 실행 오류: ${String(err)}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // 상위 activeMode 프로퍼티 변경 동기화
  useEffect(() => {
    if (activeMode && activeMode !== mainCategory) {
      setMainCategory(activeMode);
    }
  }, [activeMode, mainCategory]);

  const handleMainCategoryChange = (category: MainCategoryKey) => {
    setMainCategory(category);
    onModeChange(category);
  };

  // 통계 계산
  const totalIncidents = GOVERNANCE_INCIDENTS.length;
  const totalFaults = EXECUTIVE_GOVERNANCE_TEAM.reduce(
    (acc, pro) => acc + (pro.incidentCount || 0),
    0
  );
  const totalDefects = PERSONA_TESTER_DEFECTS.length;
  const totalVocs = PERSONA_TESTER_VOCS.length;

  // 필터링된 이용자 데이터
  const filteredTesters = PERSONA_TESTERS.filter((tester) => {
    if (userSubTab === 'AAA') return tester.id === 'aaa';
    if (userSubTab === 'BBB') return tester.id === 'bbb';
    return true;
  });

  const filteredDefects = PERSONA_TESTER_DEFECTS.filter((defect) => {
    if (userSubTab === 'AAA') return defect.testerId === 'aaa';
    if (userSubTab === 'BBB') return defect.testerId === 'bbb';
    return true;
  });

  const filteredVocs = PERSONA_TESTER_VOCS.filter((voc) => {
    if (userSubTab === 'AAA') return voc.testerId === 'aaa';
    if (userSubTab === 'BBB') return voc.testerId === 'bbb';
    return true;
  });

  return (
    <section className="space-y-4 animate-in fade-in duration-150">
      {/* ------------------------------------------------------------------
          [최상단 컨트롤 바] 헌법 제6조 원칙 6 표준 일체형 테두리 박스
          ------------------------------------------------------------------ */}
      <div className={`p-3 border ${cardCls} flex flex-wrap items-center justify-between gap-3`}>
        {/* 좌측: 타이틀 및 통계 배지 */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h2 className={`font-serif-editorial text-lg font-normal ${textTitleCls}`}>
            {mainCategory === 'SADAN' ? '사단' : '가상'}
          </h2>
          <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
            {mainCategory === 'SADAN'
              ? `회장실 직속 8대 사단 • 누적 과실 ${totalIncidents}건(${totalFaults}인) • 취약구간 ${GOVERNANCE_HOTSPOTS.length}개`
              : `가상 ${PERSONA_TESTERS.length}인 • 체감 결함 ${totalDefects}건 • 개선 의견 ${totalVocs}건 • 보정 100%`}
          </span>
        </div>

        {/* 우측: 독립 중분류(사단 vs 가상) 탭 전환기 및 서브필터 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 중분류 대분기 스위처 (사단 vs 가상) */}
          <div className="flex border border-white/20 divide-x divide-white/10 text-sm font-mono">
            <button
              type="button"
              onClick={() => handleMainCategoryChange('SADAN')}
              className={`px-3 py-1 transition-all cursor-pointer ${
                mainCategory === 'SADAN'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-black/40 text-zinc-400 hover:text-white'
              }`}
            >
              사단
            </button>
            <button
              type="button"
              onClick={() => handleMainCategoryChange('USER')}
              className={`px-3 py-1 transition-all cursor-pointer ${
                mainCategory === 'USER'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-black/40 text-zinc-400 hover:text-white'
              }`}
            >
              가상
            </button>
          </div>

          {/* 사단 서브 필터 버튼 그룹 */}
          {mainCategory === 'SADAN' && (
            <div className="flex items-center gap-1 text-sm font-mono">
              {(
                [
                  { key: 'ALL', label: '전체' },
                  { key: 'TEAM', label: '조직도' },
                  { key: 'INCIDENT', label: '과실' },
                  { key: 'HOTSPOT', label: '취약' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSadanSubTab(tab.key)}
                  className={`px-2.5 py-1 border transition-all cursor-pointer ${
                    sadanSubTab === tab.key
                      ? 'border-white/40 bg-white/10 text-white font-medium'
                      : 'border-white/10 bg-transparent text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* 이용자 서브 필터 버튼 그룹 */}
          {mainCategory === 'USER' && (
            <div className="flex items-center gap-1 text-sm font-mono">
              {(
                [
                  { key: 'ALL', label: '전체' },
                  { key: 'JOURNEY', label: '여정' },
                  { key: 'DEFECT', label: '결함' },
                  { key: 'VOC', label: '의견' },
                  { key: 'AAA', label: 'aaa' },
                  { key: 'BBB', label: 'bbb' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setUserSubTab(tab.key)}
                  className={`px-2.5 py-1 border transition-all cursor-pointer ${
                    userSubTab === tab.key
                      ? 'border-white/40 bg-white/10 text-white font-medium'
                      : 'border-white/10 bg-transparent text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================
          [MODE 1: 사단 전용 뷰] AI 8대 사단 거버넌스 관제 화면
          ================================================================== */}
      {mainCategory === 'SADAN' && (
        <div className="space-y-4">
          {/* [블록 1-1] AI 8대 사단 조직도 및 R&R */}
          {(sadanSubTab === 'ALL' || sadanSubTab === 'TEAM') && (
            <div className="space-y-2">
              <div
                onClick={() => setIsTeamOpen((prev) => !prev)}
                className="p-2.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-500 w-3.5">
                    {isTeamOpen ? '▾' : '▸'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h3 className="text-sm font-mono text-white font-medium">
                    사단조직도
                  </h3>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    {EXECUTIVE_GOVERNANCE_TEAM.length}인
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTeamOpen((prev) => !prev);
                  }}
                  className="px-2.5 py-0.5 text-sm font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {isTeamOpen ? '접기' : '펼치기'}
                </button>
              </div>

              {isTeamOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-in fade-in duration-100">
                  {EXECUTIVE_GOVERNANCE_TEAM.map((pro: GovernanceRole) => {
                    const isExpanded = selectedProCode === pro.code;

                    return (
                      <div
                        key={pro.code}
                        className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                          isExpanded
                            ? 'col-span-full bg-white/[0.03] border-white/20'
                            : 'hover:bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <div
                          onClick={() => setSelectedProCode(isExpanded ? null : pro.code)}
                          className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                              {isExpanded ? '▾' : '▸'}
                            </span>
                            <span className="text-sm font-mono font-bold text-white shrink-0">
                              {pro.name}
                            </span>
                            <span className="text-sm font-mono text-zinc-400 truncate">
                              {pro.englishTitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {pro.incidentCount > 0 ? (
                              <span className="text-sm font-mono px-2 py-0.5 border border-white/30 bg-white/10 text-white font-bold">
                                과실 {pro.incidentCount}건
                              </span>
                            ) : (
                              <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-500">
                                과실 0건
                              </span>
                            )}
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
                              {pro.koreanRole}
                            </span>
                            <span className="text-sm font-mono text-zinc-500">
                              {pro.rank === 0 ? '총괄' : `${pro.rank}순위`}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-white/10 p-4 space-y-3 bg-black/40 animate-in fade-in duration-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                                <span className="text-zinc-500 block">공식 직함</span>
                                <p className="text-white font-medium leading-relaxed">
                                  {pro.fullRoleTitle}
                                </p>
                              </div>
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                                <span className="text-zinc-500 block">회장실 핫라인</span>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-white font-medium">
                                    {pro.hotlineSummon}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(pro.hotlineSummon.split('/')[0].trim());
                                      notify(`'${pro.name}' 호출어가 복사되었습니다.`);
                                    }}
                                    className="px-2 py-0.5 border border-white/20 hover:border-white/40 text-sm font-mono text-zinc-300 hover:text-white"
                                  >
                                    복사
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">핵심 헌법 책임(R&R)</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {pro.responsibility}
                              </p>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">최근 수행 성과</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {pro.recentMilestone}
                              </p>
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

          {/* [블록 1-2] 과실·결함 누적 보정 대장 */}
          {(sadanSubTab === 'ALL' || sadanSubTab === 'INCIDENT') && (
            <div className="space-y-2">
              <div
                onClick={() => setIsIncidentOpen((prev) => !prev)}
                className="p-2.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-500 w-3.5">
                    {isIncidentOpen ? '▾' : '▸'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h3 className="text-sm font-mono text-white font-medium">
                    과실대장
                  </h3>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    {GOVERNANCE_INCIDENTS.length}건 등록
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsIncidentOpen((prev) => !prev);
                  }}
                  className="px-2.5 py-0.5 text-sm font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {isIncidentOpen ? '접기' : '펼치기'}
                </button>
              </div>

              {isIncidentOpen && (
                <div className="space-y-2 animate-in fade-in duration-100">
                  {GOVERNANCE_INCIDENTS.map((inc: GovernanceIncident) => {
                    const isExpanded = selectedIncidentId === inc.id;

                    return (
                      <div
                        key={inc.id}
                        className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                          isExpanded
                            ? 'bg-white/[0.03] border-white/20'
                            : 'hover:bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <div
                          onClick={() => setSelectedIncidentId(isExpanded ? null : inc.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                              {isExpanded ? '▾' : '▸'}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400 shrink-0">
                              {inc.id}
                            </span>
                            <span className="text-sm font-mono text-zinc-400 shrink-0">
                              {inc.date}
                            </span>
                            <span className="text-sm font-mono font-bold text-white truncate">
                              {inc.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1">
                              {inc.culpritNames.map((name) => (
                                <span
                                  key={name}
                                  className="text-sm font-mono px-2 py-0.5 border border-white/20 bg-white/5 text-zinc-200"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/30 bg-white/10 text-white font-bold">
                              {inc.status}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-white/10 p-4 space-y-3 bg-black/40 animate-in fade-in duration-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                                <span className="text-zinc-500 block">과실 유형</span>
                                <p className="text-white font-medium">
                                  {inc.faultType}
                                </p>
                              </div>
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                                <span className="text-zinc-500 block">반복 취약 구간(Root Cause)</span>
                                <p className="text-white font-medium">
                                  {inc.rootCause}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">결함 내용</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {inc.defectDetail}
                              </p>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">재발 방지 보정책</span>
                              <div className="space-y-1 text-zinc-200 leading-relaxed">
                                {inc.remedyAction.split('\n').map((line, idx) => (
                                  <p key={idx}>{line}</p>
                                ))}
                              </div>
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

          {/* [블록 1-3] 반복 취약 구간(Hotspot) 보정 대장 */}
          {(sadanSubTab === 'ALL' || sadanSubTab === 'HOTSPOT') && (
            <div className="space-y-2">
              <div
                onClick={() => setIsHotspotOpen((prev) => !prev)}
                className="p-2.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-500 w-3.5">
                    {isHotspotOpen ? '▾' : '▸'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h3 className="text-sm font-mono text-white font-medium">
                    취약구간
                  </h3>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    {GOVERNANCE_HOTSPOTS.length}개 트래킹
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHotspotOpen((prev) => !prev);
                  }}
                  className="px-2.5 py-0.5 text-sm font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {isHotspotOpen ? '접기' : '펼치기'}
                </button>
              </div>

              {isHotspotOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-in fade-in duration-100">
                  {GOVERNANCE_HOTSPOTS.map((hotspot: GovernanceHotspot) => {
                    const isExpanded = selectedHotspotKey === hotspot.key;

                    return (
                      <div
                        key={hotspot.key}
                        className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                          isExpanded
                            ? 'col-span-full bg-white/[0.03] border-white/20'
                            : 'hover:bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <div
                          onClick={() => setSelectedHotspotKey(isExpanded ? null : hotspot.key)}
                          className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                              {isExpanded ? '▾' : '▸'}
                            </span>
                            <span className="text-sm font-mono font-bold text-white shrink-0">
                              {hotspot.category}
                            </span>
                            <span className="text-sm font-mono text-zinc-400 truncate">
                              {hotspot.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
                              위험 {hotspot.riskLevel}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                              발생 {hotspot.incidentCount} / 보정 {hotspot.correctionCount}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/30 bg-white/10 text-white font-bold">
                              {hotspot.status}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-white/10 p-4 space-y-3 bg-black/40 animate-in fade-in duration-100">
                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">취약점 상세 설명</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {hotspot.description}
                              </p>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">방어 헌법 규정 및 보정책</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {hotspot.defenseRule}
                              </p>
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
        </div>
      )}

      {/* ==================================================================
          [MODE 2: 가상 전용 뷰] 가상(aaa, bbb) 결함 및 의견 보드
          ================================================================== */}
      {mainCategory === 'USER' && (
        <div className="space-y-4">
          {/* [가상 유저 실시간 E2E 시뮬레이션 제어 바] */}
          <div className="p-3 border border-white/10 bg-[#0c0d12] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <h3 className="text-sm font-mono text-white font-medium">
                가상테스트
              </h3>
              <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                6대 관문 자율 순회 엔진
              </span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                disabled={isSimulating}
                onClick={() => handleRunSimulation('aaa')}
                className="flex-1 md:flex-initial px-3 py-1 text-sm font-mono border border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSimulating ? '테스트 실행 중...' : '가상 aaa 여정 가동'}
              </button>
              <button
                type="button"
                disabled={isSimulating}
                onClick={() => handleRunSimulation('bbb')}
                className="flex-1 md:flex-initial px-3 py-1 text-sm font-mono border border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSimulating ? '테스트 실행 중...' : '가상 bbb 여정 가동'}
              </button>
            </div>
          </div>

          {/* 최근 시뮬레이션 실행 결과 실시간 리포트 (최신 결과 존재 시) */}
          {latestReport && (
            <div className="p-4 border border-white/20 bg-white/[0.02] space-y-3 animate-in fade-in duration-100 font-mono text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    최신 결과: {latestReport.testerName}
                  </span>
                  <span className="text-zinc-500">[{latestReport.runId}]</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">{latestReport.durationMs}ms</span>
                  <span className="px-2 py-0.5 border border-white/30 bg-white/10 text-white font-bold">
                    성공률 {latestReport.successRate}%
                  </span>
                </div>
              </div>

              {/* 6단계 관문 순회 결과 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {latestReport.steps.map((s) => (
                  <div
                    key={s.stepIndex}
                    className="p-2 border border-white/10 bg-black/40 space-y-1 text-center"
                  >
                    <span className="text-zinc-500 block text-xs">{s.stepIndex}관문</span>
                    <span className="text-white font-medium block truncate text-xs">
                      {s.stepName.split(':')[1]?.trim() || s.stepName}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.5 text-xs font-bold ${
                        s.status === 'SUCCESS'
                          ? 'text-white border border-white/20'
                          : 'text-zinc-300 border border-white/40 bg-white/10'
                      }`}
                    >
                      {s.status === 'SUCCESS' ? '통과' : '주의'}
                    </span>
                  </div>
                ))}
              </div>

              {/* 감지된 결함 목록 */}
              {latestReport.defectsDetected.length > 0 && (
                <div className="p-2.5 border border-white/10 bg-white/[0.03] space-y-1">
                  <span className="text-zinc-400 font-bold block">감지된 결함/개선점:</span>
                  {latestReport.defectsDetected.map((d, i) => (
                    <div key={i} className="text-zinc-200">
                      • [{d.stage}] {d.description} ➔ <span className="text-white underline">{d.recommendation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* [블록 2-0] 시스템 실행 감사 원장 (Audit Log) - 자동 기록 */}
          <div className="space-y-2">
            <div
              onClick={() => setIsAuditLogOpen((prev) => !prev)}
              className="p-2.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-zinc-500 w-3.5">
                  {isAuditLogOpen ? '▾' : '▸'}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h3 className="text-sm font-mono text-white font-medium">
                  감사원장
                </h3>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                  자동 원장 기록 누적 {auditLogs.length}건
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAuditLogOpen((prev) => !prev);
                }}
                className="px-2.5 py-0.5 text-sm font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                {isAuditLogOpen ? '접기' : '펼치기'}
              </button>
            </div>

            {isAuditLogOpen && (
              <div className="border border-white/10 bg-[#0c0d12] p-3 space-y-2 font-mono text-sm animate-in fade-in duration-100">
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 border border-white/5 bg-white/[0.02] flex items-center justify-between text-xs hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-zinc-500 shrink-0">{log.timestamp}</span>
                        <span className="px-1.5 py-0.5 border border-white/20 text-white font-bold shrink-0">
                          {log.actor}
                        </span>
                        <span className="text-zinc-400 font-medium shrink-0">[{log.action}]</span>
                        <span className="text-zinc-200 truncate">{log.summary}</span>
                      </div>
                      <span className="px-1.5 py-0.5 border border-white/20 text-white font-bold shrink-0">
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* [블록 2-1] 가상 6대 관문 여정 현황 */}
          {(userSubTab === 'ALL' || userSubTab === 'JOURNEY' || userSubTab === 'AAA' || userSubTab === 'BBB') && (
            <div className="space-y-2">
              <div
                onClick={() => setIsJourneyOpen((prev) => !prev)}
                className="p-2.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-500 w-3.5">
                    {isJourneyOpen ? '▾' : '▸'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h3 className="text-sm font-mono text-white font-medium">
                    가상여정
                  </h3>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    가상 {filteredTesters.length}인 온보딩 동선 추적
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsJourneyOpen((prev) => !prev);
                  }}
                  className="px-2.5 py-0.5 text-sm font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {isJourneyOpen ? '접기' : '펼치기'}
                </button>
              </div>

              {isJourneyOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-in fade-in duration-100">
                  {filteredTesters.map((tester: PersonaTester) => {
                    const isExpanded = selectedTesterId === tester.id;
                    const completedCount = tester.stages.filter((s) => s.status === '완료').length;
                    const inProgressStage = tester.stages.find((s) => s.status === '진행');

                    return (
                      <div
                        key={tester.id}
                        className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                          isExpanded
                            ? 'col-span-full bg-white/[0.03] border-white/20'
                            : 'hover:bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        {/* 1단계: 컴팩트 1줄 요약 행 (본질 요소 전진 배치: 소통성향, 목적, 신뢰도) */}
                        <div
                          onClick={() => setSelectedTesterId(isExpanded ? null : tester.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                              {isExpanded ? '▾' : '▸'}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/30 bg-white/10 text-white font-bold shrink-0">
                              가상
                            </span>
                            <span className="text-sm font-mono font-bold text-white shrink-0">
                              {tester.handle}
                            </span>
                            <span className="text-sm font-mono text-zinc-300 truncate">
                              {tester.genderText} · {tester.birthYear}년생 · {tester.residenceDistrict} · {tester.jobTitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* 본질 1: 소통 성향 (NBTI) */}
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/20 bg-white/5 text-white font-medium">
                              {tester.nbtiText}
                            </span>
                            {/* 본질 2: 참여 목적 */}
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-200">
                              {tester.purposeText}
                            </span>
                            {/* 본질 3: 신뢰도 */}
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
                              {tester.trustText}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/30 bg-white/10 text-white font-bold">
                              {completedCount}/6 관문
                            </span>
                            {inProgressStage && (
                              <span className="text-sm font-mono px-2 py-0.5 border border-white/20 bg-white/5 text-zinc-200">
                                {inProgressStage.name} 진행
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2단계: 클릭 시 2열 전체폭 상세 확장 (Click-to-Reveal) */}
                        {isExpanded && (
                          <div className="border-t border-white/10 p-4 space-y-4 bg-black/40 animate-in fade-in duration-100">
                            {/* 페르소나 브리핑 배너 */}
                            <div className="p-3 border border-white/10 bg-white/[0.02] flex items-center justify-between text-sm font-mono">
                              <span className="text-zinc-400">{tester.personaSummary}</span>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 border border-white/20 bg-white/5 text-zinc-300">
                                  체감 결함 {tester.defects.length}건
                                </span>
                                <span className="px-2 py-0.5 border border-white/20 bg-white/5 text-zinc-300">
                                  제출 VOC {tester.vocs.length}건
                                </span>
                              </div>
                            </div>

                            {/* 3대 본질 요소 및 식단 메타데이터 그리드 (전진 배치) */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-sm font-mono">
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1">
                                <span className="text-zinc-500 block">소통 성향 (NBTI)</span>
                                <p className="text-white font-medium">{tester.nbtiText}</p>
                              </div>

                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1">
                                <span className="text-zinc-500 block">참여 목적</span>
                                <p className="text-white font-medium">{tester.purposeText}</p>
                              </div>

                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1">
                                <span className="text-zinc-500 block">신뢰도</span>
                                <p className="text-white font-medium">{tester.trustText}</p>
                              </div>

                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1">
                                <span className="text-zinc-500 block">식단</span>
                                <p className="text-white font-medium">{tester.dietaryText}</p>
                              </div>
                            </div>

                            {/* 인적 및 활동 기본 메타데이터 그리드 */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-sm font-mono">
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1">
                                <span className="text-zinc-500 block">식별자 / 핸들</span>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-white font-medium">{tester.handle}</p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(tester.handle);
                                      notify(`'${tester.handle}' 복사 완료`);
                                    }}
                                    className="px-2 py-0.5 border border-white/20 hover:border-white/40 text-sm font-mono text-zinc-300 hover:text-white"
                                  >
                                    복사
                                  </button>
                                </div>
                              </div>

                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1">
                                <span className="text-zinc-500 block">성별 / 연령</span>
                                <p className="text-white font-medium">
                                  {tester.genderText} · {tester.birthYear}년생 ({tester.age}세)
                                </p>
                              </div>

                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1">
                                <span className="text-zinc-500 block">거주지역 / 직업</span>
                                <p className="text-white font-medium truncate">
                                  {tester.residenceCity} {tester.residenceDistrict} · {tester.jobTitle}
                                </p>
                              </div>
                            </div>

                            {/* 6대 관문 진행 상태 트래커 */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-mono text-zinc-400">
                                  6대 관문 온보딩 여정 (1. 가입 ➔ 2. 프로필 ➔ 3. 성향진단 ➔ 4. 모임신청 ➔ 5. 상호평가 ➔ 6. 리포트)
                                </span>
                                <span className="text-sm font-mono text-zinc-500">
                                  진행률 {Math.round((completedCount / 6) * 100)}%
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {tester.stages.map((stage) => {
                                  const isDone = stage.status === '완료';
                                  const isInProgress = stage.status === '진행';

                                  return (
                                    <div
                                      key={stage.step}
                                      className={`p-3 border text-sm font-mono space-y-1.5 transition-colors ${
                                        isDone
                                          ? 'border-white/20 bg-white/[0.03]'
                                          : isInProgress
                                          ? 'border-white/30 bg-white/[0.05]'
                                          : 'border-white/10 bg-white/[0.01]'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 flex items-center justify-center border border-white/20 text-sm font-bold text-white">
                                            {stage.step}
                                          </span>
                                          <span className="text-white font-medium">
                                            {stage.name}
                                          </span>
                                        </div>
                                        <span
                                          className={`px-2 py-0.5 border text-sm font-mono ${
                                            isDone
                                              ? 'border-white/30 bg-white/10 text-white font-bold'
                                              : isInProgress
                                              ? 'border-white/20 bg-white/5 text-zinc-200 font-medium'
                                              : 'border-white/10 text-zinc-500'
                                          }`}
                                        >
                                          {stage.status}
                                        </span>
                                      </div>

                                      <p className="text-zinc-400 text-sm leading-relaxed">
                                        {stage.detail}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
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

          {/* [블록 2-2] 실제 발생 결함 / 체감 문제점 보드 (Defect Ledger) */}
          {(userSubTab === 'ALL' || userSubTab === 'DEFECT' || userSubTab === 'AAA' || userSubTab === 'BBB') && (
            <div className="space-y-2">
              <div
                onClick={() => setIsDefectOpen((prev) => !prev)}
                className="p-2.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-500 w-3.5">
                    {isDefectOpen ? '▾' : '▸'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h3 className="text-sm font-mono text-white font-medium">
                    결함대장
                  </h3>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    가상 체감 결함 {filteredDefects.length}건 접수 및 보정 완료
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDefectOpen((prev) => !prev);
                  }}
                  className="px-2.5 py-0.5 text-sm font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {isDefectOpen ? '접기' : '펼치기'}
                </button>
              </div>

              {isDefectOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-in fade-in duration-100">
                  {filteredDefects.map((defect: PersonaTesterDefect) => {
                    const isExpanded = selectedDefectId === defect.id;

                    return (
                      <div
                        key={defect.id}
                        className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                          isExpanded
                            ? 'col-span-full bg-white/[0.03] border-white/20'
                            : 'hover:bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        {/* 1단계: 컴팩트 1줄 요약 행 */}
                        <div
                          onClick={() => setSelectedDefectId(isExpanded ? null : defect.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                              {isExpanded ? '▾' : '▸'}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400 shrink-0">
                              {defect.testerId.toUpperCase()}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400 shrink-0">
                              {defect.stageName}
                            </span>
                            <span className="text-sm font-mono font-bold text-white truncate">
                              {defect.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-300">
                              심각도 {defect.severity}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/30 bg-white/10 text-white font-bold">
                              {defect.status}
                            </span>
                          </div>
                        </div>

                        {/* 2단계: 클릭 시 2열 전체폭 상세 확장 (Click-to-Reveal) */}
                        {isExpanded && (
                          <div className="border-t border-white/10 p-4 space-y-3 bg-black/40 animate-in fade-in duration-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                                <span className="text-zinc-500 block">제보자 / 단계</span>
                                <p className="text-white font-medium">
                                  {defect.testerName} ({defect.stageName})
                                </p>
                              </div>
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                                <span className="text-zinc-500 block">담당 대응 프로 사단</span>
                                <p className="text-white font-medium">
                                  {defect.actionPro}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">실제 체감 결함 / 문제점 내용</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {defect.problemDetail}
                              </p>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">시스템 영향 범위 (퍼널 위험도)</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {defect.impact}
                              </p>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">보정 조치 완료 내역</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {defect.fixDetail}
                              </p>
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

          {/* [블록 2-3] 이용자 관점의 구체적 개선 요구 의견(VOC) 보드 */}
          {(userSubTab === 'ALL' || userSubTab === 'VOC' || userSubTab === 'AAA' || userSubTab === 'BBB') && (
            <div className="space-y-2">
              <div
                onClick={() => setIsVocOpen((prev) => !prev)}
                className="p-2.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-500 w-3.5">
                    {isVocOpen ? '▾' : '▸'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h3 className="text-sm font-mono text-white font-medium">
                    의견보드
                  </h3>
                  <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                    가상 VOC {filteredVocs.length}건 수렴 및 반영 완료
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVocOpen((prev) => !prev);
                  }}
                  className="px-2.5 py-0.5 text-sm font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {isVocOpen ? '접기' : '펼치기'}
                </button>
              </div>

              {isVocOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-in fade-in duration-100">
                  {filteredVocs.map((voc: PersonaTesterVoc) => {
                    const isExpanded = selectedVocId === voc.id;

                    return (
                      <div
                        key={voc.id}
                        className={`border border-white/10 bg-[#0c0d12] transition-colors ${
                          isExpanded
                            ? 'col-span-full bg-white/[0.03] border-white/20'
                            : 'hover:bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        {/* 1단계: 컴팩트 1줄 요약 행 */}
                        <div
                          onClick={() => setSelectedVocId(isExpanded ? null : voc.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-mono text-zinc-500 w-3.5 shrink-0">
                              {isExpanded ? '▾' : '▸'}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400 shrink-0">
                              {voc.testerId.toUpperCase()}
                            </span>
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400 shrink-0">
                              {voc.topic}
                            </span>
                            <span className="text-sm font-mono font-bold text-white truncate">
                              {voc.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-mono px-2 py-0.5 border border-white/30 bg-white/10 text-white font-bold">
                              {voc.status}
                            </span>
                          </div>
                        </div>

                        {/* 2단계: 클릭 시 2열 전체폭 상세 확장 (Click-to-Reveal) */}
                        {isExpanded && (
                          <div className="border-t border-white/10 p-4 space-y-3 bg-black/40 animate-in fade-in duration-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                                <span className="text-zinc-500 block">제안 회원 / 분류</span>
                                <p className="text-white font-medium">
                                  {voc.testerName} · {voc.topic}
                                </p>
                              </div>
                              <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5">
                                <span className="text-zinc-500 block">조치 상태</span>
                                <p className="text-white font-medium">
                                  {voc.status}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">구체적 개선 요구 의견 (VOC 원문)</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {voc.requestDetail}
                              </p>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">기대 효과 및 개선 가치</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {voc.expectedBenefit}
                              </p>
                            </div>

                            <div className="p-3 border border-white/10 bg-white/[0.02] space-y-1.5 text-sm font-mono">
                              <span className="text-zinc-500 block">시스템 적용 솔루션 명세</span>
                              <p className="text-zinc-200 leading-relaxed">
                                {voc.solution}
                              </p>
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
        </div>
      )}
    </section>
  );
}
