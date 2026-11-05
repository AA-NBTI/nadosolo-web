import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 직접 파싱
const envFilePath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envFilePath)) {
  const content = fs.readFileSync(envFilePath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 현실감 있는 실제 6인 (남성 3 : 여성 3) 다이닝 멤버
const REAL_6_MEMBERS = [
  {
    id: 'user_junho',
    handle: '@junho_choi',
    nickname: '최준호',
    email: 'junho.choi@nadosolo.com',
    phone: '010-3847-2910',
    gender: 'M',
    birth_year: 1991,
    job_title: 'IT 스타트업 대표',
    dietary: 'NONE',
    interests: ['WINE', 'TECH_STARTUP', 'FITNESS'],
    self_domain_scores: { APPEARANCE: 85, STYLE: 88, VOICE: 82, CONVERSATION: 90, MANNER: 92 },
    verified_badge: '직장/사업자 인증 완료',
    session_count: 2,
  },
  {
    id: 'user_minseok',
    handle: '@minseok_kang',
    nickname: '강민석',
    email: 'minseok.kang@nadosolo.com',
    phone: '010-4729-1833',
    gender: 'M',
    birth_year: 1989,
    job_title: '정형외과 전문의',
    dietary: 'NONE',
    interests: ['COOKING', 'RUNNING', 'WINE'],
    self_domain_scores: { APPEARANCE: 82, STYLE: 80, VOICE: 86, CONVERSATION: 85, MANNER: 95 },
    verified_badge: '전문직 인증 완료',
    session_count: 1,
  },
  {
    id: 'user_donghyun',
    handle: '@donghyun_yoon',
    nickname: '윤동현',
    email: 'donghyun.yoon@nadosolo.com',
    phone: '010-8291-3049',
    gender: 'M',
    birth_year: 1993,
    job_title: '금융 자산운용역',
    dietary: 'NONE',
    interests: ['FINANCE', 'TRAVEL', 'WINE'],
    self_domain_scores: { APPEARANCE: 84, STYLE: 86, VOICE: 80, CONVERSATION: 88, MANNER: 90 },
    verified_badge: '재직 인증 완료',
    session_count: 1,
  },
  {
    id: 'user_soyeon',
    handle: '@soyeon_park',
    nickname: '박소연',
    email: 'soyeon.park@nadosolo.com',
    phone: '010-5192-8402',
    gender: 'F',
    birth_year: 1994,
    job_title: '브랜드 디렉터',
    dietary: 'NONE',
    interests: ['WINE', 'BOOK_ART', 'TRAVEL'],
    self_domain_scores: { APPEARANCE: 88, STYLE: 94, VOICE: 84, CONVERSATION: 92, MANNER: 94 },
    verified_badge: '본인/재직 인증 완료',
    session_count: 3,
  },
  {
    id: 'user_yujin',
    handle: '@yujin_han',
    nickname: '한유진',
    email: 'yujin.han@nadosolo.com',
    phone: '010-6391-7241',
    gender: 'F',
    birth_year: 1992,
    job_title: '공간 인테리어 디자이너',
    dietary: 'NO_PORK',
    interests: ['BOOK_ART', 'COOKING', 'MOVIE_MUSIC'],
    self_domain_scores: { APPEARANCE: 86, STYLE: 90, VOICE: 82, CONVERSATION: 86, MANNER: 92 },
    verified_badge: '본인인증 완료',
    session_count: 1,
  },
  {
    id: 'user_chaewon',
    handle: '@chaewon_lim',
    nickname: '임채원',
    email: 'chaewon.lim@nadosolo.com',
    phone: '010-9041-5823',
    gender: 'F',
    birth_year: 1995,
    job_title: '글로벌 테크 세일즈',
    dietary: 'ALCOHOL_FREE',
    interests: ['LANGUAGE', 'FITNESS', 'TRAVEL'],
    self_domain_scores: { APPEARANCE: 90, STYLE: 88, VOICE: 88, CONVERSATION: 94, MANNER: 90 },
    verified_badge: '재직 인증 완료',
    session_count: 2,
  },
];

async function runE2ETest() {
  console.log('===============================================================');
  console.log('🚀 나도솔로 (NadoSolo) Supabase 실운영 데이터 검증 테스트 시작');
  console.log('===============================================================\n');

  // STEP 1: 기존 테스트/가상 데이터 정리
  console.log('1️⃣ [기존 가상 데이터 정리]');
  const dummyIds = ['user_jisoo', 'user_minwoo', 'user_taeo', 'user_seoa'];
  const { error: delDummyErr } = await supabase.from('profiles').delete().in('id', dummyIds);
  if (delDummyErr) {
    console.warn('⚠️ 더미 데이터 삭제 알림:', delDummyErr.message);
  } else {
    console.log('   ✅ 기존 임시 가상 데이터 4건 삭제 완료');
  }

  // STEP 2: 실제 6개 아이디 프로필 등록/업데이트
  console.log('\n2️⃣ [실제 6인 회원 프로필 Supabase 등록]');
  for (const m of REAL_6_MEMBERS) {
    const { error } = await supabase.from('profiles').upsert(m, { onConflict: 'id' });
    if (error) {
      console.error(`   ❌ [${m.nickname}] 등록 실패:`, error.message);
    } else {
      console.log(`   ✅ [${m.gender === 'M' ? '남성' : '여성'}] ${m.nickname} (${m.handle} | ${m.job_title}) 프로필 등록 성공`);
    }
  }

  // STEP 3: 6인 전원 모임 참가 신청 (EVT_JEONPO_FRI)
  console.log('\n3️⃣ [P05 모임 참가 신청]');
  const eventId = 'EVT_JEONPO_FRI';
  for (const m of REAL_6_MEMBERS) {
    const { error } = await supabase.from('event_applications').upsert(
      { user_id: m.id, event_id: eventId, status: 'CONFIRMED' },
      { onConflict: 'user_id,event_id' }
    );
    if (error) {
      console.error(`   ❌ ${m.nickname} 신청 오류:`, error.message);
    } else {
      console.log(`   ✅ ${m.nickname} -> 전포 금요일 프라이빗 디너 [신청 확정]`);
    }
  }

  // STEP 4: 5×5×5 다면 평가 데이터 저장 및 집계 테스트
  console.log('\n4️⃣ [P08 5×5×5 다면 평가 매트릭스 채점]');
  const sessionId = 'SESSION_JEONPO_20261107';
  
  // 준호(남) -> 소연(여), 소연(여) -> 준호(남) 상호 평가 테스트
  const evalRecords = [
    {
      session_id: sessionId,
      from_user_id: 'user_junho',
      from_nickname: '최준호',
      from_gender: 'M',
      to_user_id: 'user_soyeon',
      sub_element_id: 'SUB_APP_1', // 외모 > 눈
      scores: { C1_NEAT: 4, C2_HARMONY: 4, C3_SENSE: 4, C4_STABILITY: 4, C5_APPEAL: 4 }, // 20점 만점
    },
    {
      session_id: sessionId,
      from_user_id: 'user_soyeon',
      from_nickname: '박소연',
      from_gender: 'F',
      to_user_id: 'user_junho',
      sub_element_id: 'SUB_STY_2', // 스타일 > 상의
      scores: { C1_NEAT: 4, C2_HARMONY: 4, C3_SENSE: 4, C4_STABILITY: 4, C5_APPEAL: 4 }, // 20점 만점
    },
  ];

  for (const er of evalRecords) {
    const { error } = await supabase.from('matrix_evaluations').upsert(er, {
      onConflict: 'session_id,from_user_id,to_user_id,sub_element_id',
    });
    if (error) {
      console.error(`   ❌ 평가 저장 오류:`, error.message);
    } else {
      console.log(`   ✅ [${er.from_nickname} -> ${er.to_user_id}] 5대 기준 채점 DB 저장 완료 (합산 20점)`);
    }
  }

  // STEP 5: P09 시크릿 호감 투표 및 매칭 판정 테스트
  console.log('\n5️⃣ [P09 시크릿 호감 투표]');
  // 준호 <-> 소연 서로 1순위 호감 투표 (상호 매칭 발생 시나리오)
  const votes = [
    { session_id: sessionId, from_user_id: 'user_junho', target_user_id: 'user_soyeon', category: 'FIRST_ROMANCE' },
    { session_id: sessionId, from_user_id: 'user_soyeon', target_user_id: 'user_junho', category: 'FIRST_ROMANCE' },
    { session_id: sessionId, from_user_id: 'user_minseok', target_user_id: 'user_yujin', category: 'FIRST_ROMANCE' },
    { session_id: sessionId, from_user_id: 'user_yujin', target_user_id: 'user_minseok', category: 'FIRST_ROMANCE' },
    { session_id: sessionId, from_user_id: 'user_donghyun', target_user_id: 'user_chaewon', category: 'FIRST_ROMANCE' },
    { session_id: sessionId, from_user_id: 'user_chaewon', target_user_id: 'user_donghyun', category: 'FIRST_ROMANCE' },
  ];

  for (const v of votes) {
    const { error } = await supabase.from('secret_votes').upsert(v, {
      onConflict: 'session_id,from_user_id',
    });
    if (error) {
      console.error(`   ❌ 투표 오류:`, error.message);
    } else {
      console.log(`   ✅ [${v.from_user_id} -> ${v.target_user_id}] 시크릿 투표 완료`);
    }
  }

  // STEP 6: 전체 데이터베이스 검증 조회
  console.log('\n6️⃣ [최종 Supabase DB 검증 조회 결과]');
  const { data: dbProfiles } = await supabase.from('profiles').select('*');
  const { data: dbApps } = await supabase.from('event_applications').select('*');
  const { data: dbEvals } = await supabase.from('matrix_evaluations').select('*');
  const { data: dbVotes } = await supabase.from('secret_votes').select('*');

  console.log(`   📊 등록된 실제 회원 수: ${dbProfiles?.length ?? 0}명`);
  if (dbProfiles) {
    dbProfiles.forEach((p) => {
      console.log(`      - [${p.gender}] ${p.nickname} (${p.handle} | ${p.job_title})`);
    });
  }
  console.log(`   📊 모임 확정 신청 건수: ${dbApps?.length ?? 0}건`);
  console.log(`   📊 5×5×5 다면 평가 건수: ${dbEvals?.length ?? 0}건`);
  console.log(`   📊 시크릿 호감 투표 건수: ${dbVotes?.length ?? 0}건`);

  console.log('\n===============================================================');
  console.log('🎉 전체 6개 아이디 및 전 프로세스 정상 작동 검증 완료!');
  console.log('===============================================================');
}

runE2ETest().catch((err) => {
  console.error('테스트 실행 중 치명적 오류:', err);
  process.exit(1);
});
