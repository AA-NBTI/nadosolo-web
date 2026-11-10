import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 로드
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
  console.error('❌ Supabase 환경변수 누락');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('🚀 [바프로 CDO & 사프로 CXO] 실전 1인 신규 회원 (@bbb) 가입 및 지역정보 저장 검증 시작');

  // Supabase profiles 테이블에 저장할 행 (물리 컬럼 미존재 시 JSONB 내 안전 적재)
  const newMemberRow = {
    id: 'U_bbb',
    handle: '@bbb',
    nickname: '박비비',
    email: 'bbb@nadosolo.com',
    phone: '010-8888-9999',
    gender: 'F',
    birth_year: 1993,
    job_title: '브랜드 디렉터',
    dietary: 'VEGAN',
    interests: ['WINE', 'INTERIOR', 'ART'],
    verified_badge: '프로필 등록 완료',
    session_count: 1,
    self_domain_scores: {
      APPEARANCE: 90,
      STYLE: 92,
      VOICE: 88,
      CONVERSATION: 89,
      MANNER: 94,
      _residence_city: '부산광역시',
      _residence_district: '해운대구',
    },
  };

  // 1. Supabase profiles 테이블에 저장 (upsert)
  const { data, error } = await supabase
    .from('profiles')
    .upsert(newMemberRow, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('❌ upsertProfile 에러:', error);
    process.exit(1);
  }

  console.log('✅ 1. Supabase DB upsert 성공');

  // 2. 단건 조회 검증
  const { data: fetchUser, error: fetchErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'U_bbb')
    .single();

  if (fetchErr || !fetchUser) {
    console.error('❌ getProfile 조회 에러:', fetchErr);
    process.exit(1);
  }

  const scores = fetchUser.self_domain_scores || {};
  const residence_city = (fetchUser as any).residence_city || scores._residence_city;
  const residence_district = (fetchUser as any).residence_district || scores._residence_district;

  console.log('✅ 2. 단건 프로필 실시간 복원 검증:');
  console.log(`   - 아이디: ${fetchUser.id} (${fetchUser.handle})`);
  console.log(`   - 닉네임: ${fetchUser.nickname} | 성별: ${fetchUser.gender} | 출생: ${fetchUser.birth_year}`);
  console.log(`   - 직업: ${fetchUser.job_title}`);
  console.log(`   - 실제 거주지역 (시·도): [${residence_city}]`);
  console.log(`   - 실제 거주지역 (시·군·구): [${residence_district}]`);
  console.log(`   - 인증뱃지: ${fetchUser.verified_badge}`);

  if (residence_city === '부산광역시' && residence_district === '해운대구') {
    console.log('🎯 [검증 통과] 이용자 거주 지역정보가 Supabase 라이브 DB에 정확히 기록되었습니다!');
  } else {
    console.error('❌ 지역 정보 불일치!');
    process.exit(1);
  }

  // 3. 전체 라이브 회원 목록 조회
  const { data: allMembers, error: allErr } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (allErr) {
    console.error('❌ 전체 목록 조회 에러:', allErr);
    process.exit(1);
  }

  console.log(`\n📊 3. Supabase 실서버(SSOT) 전체 등록 회원 현황 (총 ${allMembers.length}명):`);
  allMembers.forEach((m, idx) => {
    const sc = m.self_domain_scores || {};
    const city = (m as any).residence_city || sc._residence_city || '';
    const dist = (m as any).residence_district || sc._residence_district || '';
    const region = dist ? `${city} ${dist}`.trim() : (city || '지역미등록');
    console.log(`   [${String(idx + 1).padStart(2, '0')}] ${m.id.padEnd(10)} | ${m.handle.padEnd(8)} | ${m.nickname.padEnd(6)} | ${m.gender} | ${m.birth_year}년 | ${region.padEnd(16)} | ${m.job_title || '-'}`);
  });

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
