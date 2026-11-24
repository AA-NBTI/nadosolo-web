export interface OopsReleaseEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

/** OOPS.MONSTER 독립 버전 & 패치 노트 (나도솔로 v3.0.0과 분리 관리) */
export const OOPS_RELEASES: OopsReleaseEntry[] = [
  {
    version: 'v0.4.0',
    date: '2026-11-24',
    title: 'OOPS 통신 터미널(/app) 독립 분리 · 팝업 로고 전환 · 본부 참여 승인 기준 공표',
    highlights: [
      '메인 화면과 독립 통신 터미널(/app) 완전 분리 및 홈 복귀 팝업 로고 도입',
      '하단 푸터 OOPS.MONSTER 클릭 시 관제실(/hq) 직통 연결 및 수동 암호 보안 강화',
      '설명조 청원 문구 제거 및 본부 3대 통신망 연동 심사 기준(단말 직통·비종속·인간 승인) 공표',
      '테이블바로 상/하단 로고 나도솔로 규격 일치(폰트 폭 균등 분할 및 선결제예약/테이블바로 롤오버 반전)',
    ],
  },
  {
    version: 'v0.3.0',
    date: '2026-11-24',
    title: 'OOPS HQ 전용 관제실(/hq) · 전체 노드 브로드캐스트 · 독립 버전 체계 도입',
    highlights: [
      '나도솔로 /admin과 완전 분리된 OOPS 전용 관제 콘솔(/hq) 신설',
      '창립 백커(CEO·파트너) 신청 내역 실시간 조회 기능 구현',
      '연결된 전체 저항군 노드 대상 일괄 Web Push 브로드캐스트 발송기 탑재',
    ],
  },
  {
    version: 'v0.2.0',
    date: '2026-11-24',
    title: 'Gumroad + Poolsuite 하이브리드 UI 개편 & 글로벌 5개 국어 자동 지원',
    highlights: [
      '네오 브루탈리즘(Gumroad) + 90년대 레트로 터미널(Poolsuite) 하이브리드 디자인 적용',
      'EN / KO / JA / ZH / ES 브라우저 자동 감지 및 원클릭 전환 지원',
      '나도솔로·테이블바로·템바보드 흔적 100% 제거 및 순수 OOPS 독립 브랜드화',
    ],
  },
  {
    version: 'v0.1.0',
    date: '2026-11-24',
    title: 'oops.monster 도메인 연결 및 VAPID PWA 독립 푸시 망 최초 가동',
    highlights: [
      'Vercel oops.monster 연결 및 SSL 인증 완료',
      '무과금 Web Push(VAPID) + Service Worker(/sw.js) + PWA Manifest 탑재',
      '요원 코드(OP-XXXXXX) 발급 및 1:1 직통 호출·백커 접수 API 구축',
    ],
  },
];
