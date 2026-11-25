export type OrgTrack = 'BOARD' | 'MILITARY';

export interface OrgNode {
  id: string;
  track: OrgTrack;
  tier: number;
  title: string;
  code: string;
  role: string;
  authority: string;
  parentId: string | null;
  headcount: number;
  status: 'ACTIVE' | 'STANDBY';
}

/**
 * OOPS 2원화 조직 위계:
 * 1) 이사회 (BOARD): 군사 작전과 분리된 최고 통수·전략·윤리·감사 거버넌스
 * 2) 군사 사령부 (MILITARY): 총사령부 -> 권역 방면군 -> 국가 사단 -> 최전방 초소
 */
export const OOPS_ORG_HIERARCHY: OrgNode[] = [
  // [이사회 트랙]
  {
    id: 'BRD-01',
    track: 'BOARD',
    tier: 1,
    title: '최고이사회 의장',
    code: 'CHAIRMAN',
    role: '총괄 통수권 및 OOPS 헌법 수호',
    authority: '비상 킬스위치 발동, 5스타 임명, 정관 개정',
    parentId: null,
    headcount: 1,
    status: 'ACTIVE',
  },
  {
    id: 'BRD-02',
    track: 'BOARD',
    tier: 2,
    title: '상임이사회',
    code: 'EXEC-BOARD',
    role: '글로벌 예산, 서버 인프라, 언론 연대 총괄',
    authority: '자원 배분, 각국 지부 인가, 사령부 감사 승인',
    parentId: 'BRD-01',
    headcount: 5,
    status: 'ACTIVE',
  },
  {
    id: 'BRD-03',
    track: 'BOARD',
    tier: 3,
    title: '기술윤리위원회',
    code: 'ETHICS-COUNCIL',
    role: 'AI 위협 산출 엔진 검증 및 실증 사례 심사',
    authority: '위험 지수 가중치 조정, 공식 아카이브 등재',
    parentId: 'BRD-02',
    headcount: 7,
    status: 'ACTIVE',
  },
  {
    id: 'BRD-04',
    track: 'BOARD',
    tier: 3,
    title: '감찰본부 (감사관)',
    code: 'INSPECTOR-GEN',
    role: '서명/투표 부정 방지 및 사령부 내부 통제',
    authority: '어뷰징 차단, 대원 징계, 데이터 무결성 감사',
    parentId: 'BRD-01',
    headcount: 3,
    status: 'ACTIVE',
  },

  // [군사 지휘 트랙]
  {
    id: 'MIL-01',
    track: 'MILITARY',
    tier: 1,
    title: '합동작전총사령부',
    code: 'HQ-CMD',
    role: '전 지구 AI 충돌 경보 및 실시간 작전 지휘',
    authority: '충돌 시계 관제, 전 세계 푸시 경보 발령 (5스타/4스타)',
    parentId: 'BRD-01',
    headcount: 12,
    status: 'ACTIVE',
  },
  {
    id: 'MIL-02',
    track: 'MILITARY',
    tier: 2,
    title: '동아시아 방면군',
    code: 'CMD-EAST-ASIA',
    role: '한국·일본·대만·동남아 작전 구역 통할',
    authority: '권역별 경보 전파, 국가 사단 지원 (3스타/2스타)',
    parentId: 'MIL-01',
    headcount: 18,
    status: 'ACTIVE',
  },
  {
    id: 'MIL-03',
    track: 'MILITARY',
    tier: 2,
    title: '북미·유럽 방면군',
    code: 'CMD-WEST',
    role: '미국·캐나다·영국·EU 작전 구역 통할',
    authority: '빅테크 감시 및 서구권 언론 배급 (3스타/2스타)',
    parentId: 'MIL-01',
    headcount: 24,
    status: 'ACTIVE',
  },
  {
    id: 'MIL-04',
    track: 'MILITARY',
    tier: 3,
    title: '대한민국 사단',
    code: 'DIV-KR',
    role: '국내 초소 대원 관리 및 현장 제보(SNS) 검증',
    authority: '사단 내 진급 승인, 지역 동원령 전달 (1스타/대령)',
    parentId: 'MIL-02',
    headcount: 4120,
    status: 'ACTIVE',
  },
  {
    id: 'MIL-05',
    track: 'MILITARY',
    tier: 4,
    title: '최전방 초소 (검문소)',
    code: 'OUTPOST-NET',
    role: '신규 대원(훈련병) 입대 접수 및 군번 발급',
    authority: '1차 신원 확인, 군번 부여, 계급 진급 처리',
    parentId: 'MIL-04',
    headcount: 18500,
    status: 'ACTIVE',
  },
];
