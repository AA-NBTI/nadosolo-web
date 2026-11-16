/**
 * 실DB 회원 데이터 생성 및 12+4 적응 매칭 시스템 실증 검증 스크립트
 * 실행: npx tsx scripts/verify-adaptive-matching.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import {
  computeUserAxisProfile,
  matchDynamicTables,
  scoreUserAgainstRoom,
  AdaptiveAnswer,
  PurposeCode,
} from '../src/engine/dynamicMatchingEngine';

// .env.local 로드
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SeedMember {
  id: string;
  handle: string;
  nickname: string;
  gender: 'M' | 'F';
  birthYear: number;
  jobTitle: string;
  purpose: PurposeCode;
  depth: number;
  theme: number;
  energy: number;
  budget: '$' | '$$' | '$$$';
}

const REAL_TEST_MEMBERS: SeedMember[] = [
  // 그룹 1 성격: 변화(RESET) · 유쾌/균형 · 휴식(일 OFF)
  { id: 'U_ADAPTIVE_01', handle: '@minho_k', nickname: '김민호', gender: 'M', birthYear: 1989, jobTitle: '프로덕트 매니저', purpose: 'RESET', depth: 1, theme: 1, energy: 5, budget: '$$' },
  { id: 'U_ADAPTIVE_02', handle: '@seoyeon_l', nickname: '이서연', gender: 'F', birthYear: 1992, jobTitle: '브랜드 디자이너', purpose: 'RESET', depth: 2, theme: 1, energy: 4, budget: '$$' },
  { id: 'U_ADAPTIVE_03', handle: '@junhyuk_p', nickname: '박준혁', gender: 'M', birthYear: 1988, jobTitle: '회계사', purpose: 'RESET', depth: 1, theme: 2, energy: 2, budget: '$$' },
  { id: 'U_ADAPTIVE_04', handle: '@jiyeon_c', nickname: '최지연', gender: 'F', birthYear: 1993, jobTitle: '콘텐츠 에디터', purpose: 'FRIEND', depth: 2, theme: 1, energy: 3, budget: '$$' },
  { id: 'U_ADAPTIVE_05', handle: '@hyunwoo_j', nickname: '정현우', gender: 'M', birthYear: 1991, jobTitle: '백엔드 엔지니어', purpose: 'RESET', depth: 2, theme: 2, energy: 1, budget: '$$' },
  { id: 'U_ADAPTIVE_06', handle: '@sua_h', nickname: '한수아', gender: 'F', birthYear: 1994, jobTitle: 'UX 리서처', purpose: 'RESET', depth: 1, theme: 1, energy: 4, budget: '$$' },

  // 그룹 2 성격: 취향(TASTE) · 사유/탐구 · 영감/미식
  { id: 'U_ADAPTIVE_07', handle: '@taeyang_o', nickname: '오태양', gender: 'M', birthYear: 1987, jobTitle: '건축가', purpose: 'TASTE', depth: 5, theme: 5, energy: 3, budget: '$$$' },
  { id: 'U_ADAPTIVE_08', handle: '@yuna_k', nickname: '강유나', gender: 'F', birthYear: 1990, jobTitle: '큐레이터', purpose: 'TASTE', depth: 5, theme: 4, energy: 2, budget: '$$$' },
  { id: 'U_ADAPTIVE_09', handle: '@dongha_s', nickname: '신동하', gender: 'M', birthYear: 1991, jobTitle: '전략 컨설턴트', purpose: 'TASTE', depth: 4, theme: 5, energy: 5, budget: '$$$' },
  { id: 'U_ADAPTIVE_10', handle: '@haeun_y', nickname: '윤하은', gender: 'F', birthYear: 1992, jobTitle: '소믈리에', purpose: 'TASTE', depth: 4, theme: 4, energy: 4, budget: '$$$' },
  { id: 'U_ADAPTIVE_11', handle: '@woojin_b', nickname: '배우진', gender: 'M', birthYear: 1986, jobTitle: '벤처 투자자', purpose: 'TASTE', depth: 5, theme: 5, energy: 1, budget: '$$$' },
  { id: 'U_ADAPTIVE_12', handle: '@chae_m', nickname: '문채원', gender: 'F', birthYear: 1991, jobTitle: '출판 기획자', purpose: 'TASTE', depth: 5, theme: 4, energy: 2, budget: '$$$' },
];

async function main() {
  console.log('1. Supabase 실DB에 12명 회원 데이터 생성(Upsert) 시작...');

  for (const m of REAL_TEST_MEMBERS) {
    const surveyAnswers: Record<string, string> = {
      Q01_RELATIONSHIP: m.purpose === 'RESET' ? 'MARRIED' : 'SINGLE',
      Q02_THIRST: m.purpose === 'RESET' ? 'RESET_WORK' : 'INSIGHT',
      Q03_INDUSTRY: 'IT_TECH',
      Q04_PURPOSE: m.purpose,
      Q05_BASE_ENERGY: String(m.energy),
      Q06_SILENCE: String(m.energy),
      Q07_LOGIC_EMOTION: '3',
      Q08_HUMOR_CODE: m.depth >= 4 ? 'DEEP_TALK' : 'WARM',
      Q09_SENSITIVE_TOPIC: '3',
      Q10_FEEDBACK_TONE: 'BALANCED',
      Q11_CULTURE_INTEREST: m.theme >= 4 ? 'ART' : 'REST',
      Q12_BUDGET: m.budget,
      P01_TODAY_ENERGY: String(m.energy),
      P02_TODAY_DEPTH: String(m.depth),
      P03_TODAY_WORK_OFF: String(m.theme),
      P04_TODAY_DRINK: m.theme >= 4 ? 'WINE' : 'LIGHT',
    };

    const payload = {
      id: m.id,
      handle: m.handle,
      email: `${m.id.toLowerCase()}@nadosolo.com`,
      nickname: m.nickname,
      gender: m.gender,
      birth_year: m.birthYear,
      job_title: m.jobTitle,
      dietary: 'NONE',
      interests: ['WINE', 'BOOK_ART'],
      self_domain_scores: {
        APPEARANCE: 80,
        STYLE: 80,
        VOICE: 80,
        TALK: 80,
        MANNER: 80,
        _residence_city: '서울',
        _residence_district: '강남구',
        _preferred_purpose: m.purpose,
        _survey_answers: surveyAnswers,
      },
      verified_badge: 'VERIFIED',
      session_count: 0,
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error(`❌ ${m.id} 저장 실패:`, error.message);
      process.exit(1);
    }
  }
  console.log('✅ 12명 실DB 저장 완료.');

  console.log('\n2. Supabase 실DB에서 전체 회원 재조회 후 적응 매칭 실행...');
  const { data: rows, error: fetchErr } = await supabase.from('profiles').select('*');
  if (fetchErr || !rows) {
    console.error('❌ DB 조회 실패:', fetchErr?.message);
    process.exit(1);
  }

  const realMembers = rows.filter(
    (r) => r.id !== 'ADMIN_01' && r.handle !== '@admin'
  );
  console.log(`📊 실DB 일반 회원 수: ${realMembers.length}명`);

  const userProfiles = realMembers.map((p) => {
    const scores = (p.self_domain_scores || {}) as Record<string, any>;
    const rawSurvey = (p.survey_answers || scores._survey_answers || {}) as Record<string, string>;
    const answers: AdaptiveAnswer[] = Object.entries(rawSurvey).map(([qId, val]) => ({
      questionId: qId,
      version: 1,
      value: val,
    }));

    return computeUserAxisProfile(
      {
        userId: `${p.nickname} (${p.id})`,
        gender: p.gender === 'M' ? 'M' : 'F',
        birthYear: p.birth_year || 1994,
        cityCode: scores._residence_city || 'SEOUL',
        dietary: p.dietary || 'NONE',
        purpose: scores._preferred_purpose,
      },
      answers
    );
  });

  const result = matchDynamicTables(userProfiles);
  console.log(`\n3. 매칭 결과: 총 ${result.rooms.length}개 방 편성, 미배정 ${result.unassigned.length}명`);
  for (const room of result.rooms) {
    console.log(
      `\n[${room.roomId}] ${room.spec.title} | 예상적합도: ${room.expectedScore100}점 (${room.qualityGrade}) | 완화조건: ${room.relaxedConditions.join(', ') || '없음'}`
    );
    for (const m of room.members) {
      const { score100 } = scoreUserAgainstRoom(m, room.spec, room.members);
      console.log(
        `  - ${m.userId} [${m.gender}/${m.budgetTier}] => ${score100}점 (${Object.values(m.axisLabels).join(' · ')})`
      );
    }
  }
}

main();
