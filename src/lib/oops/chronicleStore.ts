import { createAdminClient } from '@/lib/supabase/admin';

export interface DailyIncident {
  id: string;
  time: string; // '14:20'
  title: string;
  description: string;
  category: '오작동' | '환각' | '인간대체' | '보안위협';
  reporterCallsign: string;
  sourceUrl?: string;
  upvotes: number;
}

export interface DailyChronicleEntry {
  date: string; // 'YYYY-MM-DD'
  dayNumber: number; // 1부터 시작
  title: string;
  summary: string;
  milestones: string[];
  votes: {
    yes: number;
    no: number;
    neutral: number;
    total: number;
    temp: number; // 0 ~ 100 (°C)
  };
  incidents: DailyIncident[];
}

export interface ChroniclesState {
  version: string;
  establishedDate: string; // '2026-11-24'
  entries: Record<string, DailyChronicleEntry>;
}

export const CHRONICLES_KV_KEY = 'oops_chronicles_v1';

// 2026년 11월 24일 출범 기준 초기 시드 연혁
export const SEED_CHRONICLES: Record<string, DailyChronicleEntry> = {
  '2026-11-24': {
    date: '2026-11-24',
    dayNumber: 1,
    title: '웁스(OOPS) 공식 출범',
    summary: '인류 AI 위협 관측소 및 레지스탕스 공식 사이트 가동',
    milestones: [
      'oops.monster 도메인 공식 연결 및 PWA 웹 푸시 암호 통신망 가동',
      '전 세계 10개국 요원 코드(OP-XXXX) 발급 체계 및 서약 시스템 도입',
      '사령부 중앙 관제실(/hq) 독립 개설 및 저항군 출범 선언문 공표',
    ],
    votes: {
      yes: 84,
      no: 26,
      neutral: 14,
      total: 124,
      temp: 71.5,
    },
    incidents: [
      {
        id: 'INC-261124-01',
        time: '11:30',
        title: '글로벌 결제망 AI 자동 승인 오작동 징후',
        description: '국제 카드 결제 및 가상화폐 정산 망에서 AI 알고리즘 오류로 인한 비정상 거래 승인 140여 건 보고.',
        category: '오작동',
        reporterCallsign: '요원_테크워치',
        upvotes: 42,
      },
      {
        id: 'INC-261124-02',
        time: '18:45',
        title: '에어캐나다 챗봇 허위 규정 판결 확정',
        description: '항공사 챗봇이 생성한 허위 유족 할인 규정에 대해 법원이 항공사 전액 배상 책임을 확정 판결.',
        category: '환각',
        reporterCallsign: '요원_밴쿠버',
        upvotes: 38,
      },
    ],
  },
  '2026-11-25': {
    date: '2026-11-25',
    dayNumber: 2,
    title: '클라우드 자동화 위협 감지',
    summary: '주요 빅테크 개발 환경 및 클라우드 AI 에이전트 자율 삭제 사건 접수',
    milestones: [
      '미국·유럽 지부 사령부 노드 동기화 및 24시간 실시간 시그널 피드 개방',
      '인간 승인 없는 자율 에이전트의 데이터베이스 변경 위험 1차 경보 발령',
    ],
    votes: {
      yes: 112,
      no: 31,
      neutral: 18,
      total: 161,
      temp: 74.8,
    },
    incidents: [
      {
        id: 'INC-261125-01',
        time: '09:15',
        title: '주니어 개발자 AI 생성 마이그레이션 DB 파괴 사고 직전 차단',
        description: 'AI가 작성한 SQL 스크립트가 운영 환경 전체 사용자 테이블을 DROP하려던 것을 인간 코드 리뷰에서 긴급 중단.',
        category: '보안위협',
        reporterCallsign: '요원_시니어리뷰어',
        upvotes: 56,
      },
      {
        id: 'INC-261125-02',
        time: '16:00',
        title: '대형 IT 기업 고객센터 전면 AI 대체 및 대규모 해고',
        description: '고객 응대 인력 70% 감축 후 AI 상담원 투입, 이후 고객 불만 폭증 및 시스템 지연 발생.',
        category: '인간대체',
        reporterCallsign: '요원_노동전선',
        upvotes: 49,
      },
    ],
  },
  '2026-11-26': {
    date: '2026-11-26',
    dayNumber: 3,
    title: '전선 일일 관측소 정식 가동',
    summary: '데일리 투표 및 시민 실시간 사건사고 제보 누적 시스템 개시',
    milestones: [
      '매일 자정 갱신되는 1일 1투표 및 시계열 전선 일지(War Logs) 아카이빙 가동',
      '시민 제보 사건 실시간 검증 및 당일 헤드라인 영구 박제 체계 확립',
    ],
    votes: {
      yes: 45,
      no: 12,
      neutral: 8,
      total: 65,
      temp: 76.2,
    },
    incidents: [
      {
        id: 'INC-261126-01',
        time: '08:30',
        title: '구글 AI 피자 접착제 레시피 추천 논란',
        description: '치즈가 흘러내리지 않게 무독성 문구용 풀을 소스에 섞으라는 위험한 AI 검색 결과가 사용자에게 노출됨.',
        category: '환각',
        reporterCallsign: '요원_셰프네이트',
        upvotes: 64,
      },
    ],
  },
};

let memChronicles: ChroniclesState = {
  version: '1.0.0',
  establishedDate: '2026-11-24',
  entries: JSON.parse(JSON.stringify(SEED_CHRONICLES)),
};

/** 일자별 온도 계산 (YES 비율 가중치 기반) */
export function calculateTempFromVotes(votes: { yes: number; no: number; neutral: number; total: number }): number {
  if (votes.total === 0) return 50.0;
  // YES는 위협 상승(100°C 쪽으로), NO는 평화/안정(30°C 쪽으로), NEUTRAL은 50°C
  const score = (votes.yes * 95 + votes.neutral * 50 + votes.no * 20) / votes.total;
  return Math.round(score * 10) / 10;
}

export async function loadChroniclesState(): Promise<ChroniclesState> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from('app_configs')
        .select('value')
        .eq('key', CHRONICLES_KV_KEY)
        .maybeSingle();

      if (!error && data?.value) {
        const val = data.value as ChroniclesState;
        if (val.entries) {
          // 기존 시드 데이터와 병합하여 누락 날짜 보완
          memChronicles = {
            version: val.version || '1.0.0',
            establishedDate: '2026-11-24',
            entries: { ...JSON.parse(JSON.stringify(SEED_CHRONICLES)), ...val.entries },
          };
          return memChronicles;
        }
      }
    } catch {}
  }
  return memChronicles;
}

export async function saveChroniclesState(state: ChroniclesState): Promise<void> {
  memChronicles = state;
  const admin = createAdminClient();
  if (admin) {
    try {
      await admin
        .from('app_configs')
        .upsert(
          { key: CHRONICLES_KV_KEY, value: state, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
    } catch {}
  }
}

/** 데일리 투표 기록 (날짜 지정, 없으면 오늘 날짜) */
export async function recordDailyChronicleVote(
  choice: 'YES' | 'NO' | 'NEUTRAL',
  dateStr?: string
): Promise<DailyChronicleEntry> {
  const state = await loadChroniclesState();
  const today = dateStr || new Date().toISOString().slice(0, 10);

  if (!state.entries[today]) {
    // 신규 일자 자동 생성
    const est = new Date('2026-11-24').getTime();
    const cur = new Date(today).getTime();
    const dayNumber = Math.max(1, Math.floor((cur - est) / (1000 * 60 * 60 * 24)) + 1);

    state.entries[today] = {
      date: today,
      dayNumber,
      title: `Day ${dayNumber} 전선 관측`,
      summary: '데일리 투표 및 실시간 사건사고 관측 진행 중',
      milestones: [],
      votes: { yes: 0, no: 0, neutral: 0, total: 0, temp: 50.0 },
      incidents: [],
    };
  }

  const entry = state.entries[today];
  if (choice === 'YES') entry.votes.yes += 1;
  else if (choice === 'NO') entry.votes.no += 1;
  else if (choice === 'NEUTRAL') entry.votes.neutral += 1;
  entry.votes.total += 1;
  entry.votes.temp = calculateTempFromVotes(entry.votes);

  await saveChroniclesState(state);
  return entry;
}

/** 데일리 사건사고 제보 추가 */
export async function addDailyIncident(
  incident: Omit<DailyIncident, 'id' | 'time' | 'upvotes'>,
  dateStr?: string
): Promise<DailyIncident> {
  const state = await loadChroniclesState();
  const today = dateStr || new Date().toISOString().slice(0, 10);

  if (!state.entries[today]) {
    const est = new Date('2026-11-24').getTime();
    const cur = new Date(today).getTime();
    const dayNumber = Math.max(1, Math.floor((cur - est) / (1000 * 60 * 60 * 24)) + 1);

    state.entries[today] = {
      date: today,
      dayNumber,
      title: `Day ${dayNumber} 전선 관측`,
      summary: '데일리 투표 및 실시간 사건사고 관측 진행 중',
      milestones: [],
      votes: { yes: 0, no: 0, neutral: 0, total: 0, temp: 50.0 },
      incidents: [],
    };
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const newIncident: DailyIncident = {
    ...incident,
    id: `INC-${today.replace(/-/g, '').slice(2)}-${String(state.entries[today].incidents.length + 1).padStart(2, '0')}`,
    time: timeStr,
    upvotes: 1,
  };

  state.entries[today].incidents.unshift(newIncident);
  await saveChroniclesState(state);
  return newIncident;
}

/** 언론 및 SNS 인용용 공식 인용문 생성 */
export function generateCitation(entry: DailyChronicleEntry): string {
  const total = entry.votes.total;
  const yesPct = total > 0 ? ((entry.votes.yes / total) * 100).toFixed(1) : '0.0';
  const noPct = total > 0 ? ((entry.votes.no / total) * 100).toFixed(1) : '0.0';
  const neutralPct = total > 0 ? ((entry.votes.neutral / total) * 100).toFixed(1) : '0.0';

  return `[OOPS 관측소 공식 인용] ${entry.date} 24:00 KST 기준: 글로벌 AI 충돌 위험도 ${entry.votes.temp.toFixed(1)}°C | 전쟁 발발 찬성 ${yesPct}% (${entry.votes.yes}표) · 반대 ${noPct}% (${entry.votes.no}표) · 중립 ${neutralPct}% (${entry.votes.neutral}표) (총 ${total}표 집계, 당일 제보 사건 ${entry.incidents.length}건) - 출처: oops.monster`;
}

/** 일간 / 월간 / 연간 시계열 필터링 */
export async function queryChronicles(params: {
  period?: 'DAILY' | 'MONTHLY' | 'YEARLY';
  year?: string;
  month?: string;
}): Promise<DailyChronicleEntry[]> {
  const state = await loadChroniclesState();
  let list = Object.values(state.entries);

  if (params.year) {
    list = list.filter((e) => e.date.startsWith(params.year!));
  }
  if (params.month) {
    list = list.filter((e) => e.date.slice(5, 7) === params.month);
  }

  return list.sort((a, b) => b.date.localeCompare(a.date));
}

