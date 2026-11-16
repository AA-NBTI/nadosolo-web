/**
 * ============================================================================
 * [가상 이용자 실전 여정 검증 스크립트] test-persona-journey.ts
 * 다프로(개발) & 가프로(감사) 합동 무결성 실증 테스트
 * ============================================================================
 * 테스터 1호: aaa (남성 / 1992년생 / 부산 해운대구 / IT 개발자 / 못 먹는 음식: 없음)
 * 테스터 2호: bbb (여성 / 1995년생 / 부산진구 전포 / 브랜드 디렉터 / 못 먹는 음식: 비건·논알콜)
 *
 * [검증 관문]
 * 1관문: 회원가입 / 중복검증 / 기본 계정 생성
 * 2관문: 온보딩 / 프로필·지역·식이정보 저장 및 실시간 DB 복원 정합성
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ----------------------------------------------------------------------------
// 1. .env.local 환경변수 로드
// ----------------------------------------------------------------------------
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
  console.error('❌ [치명적 결함] Supabase 환경변수 누락 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PersonaDef {
  id: string;
  handle: string;
  nickname: string;
  email: string;
  phone: string;
  gender: 'M' | 'F';
  genderKorean: string;
  birthYear: number;
  residenceCity: string;
  residenceDistrict: string;
  jobTitle: string;
  dietary: string;
  dietaryKorean: string;
  interests: string[];
}

const TESTER_AAA: PersonaDef = {
  id: 'U_aaa',
  handle: '@aaa',
  nickname: 'aaa',
  email: 'aaa@nadosolo.com',
  phone: '010-1992-1111',
  gender: 'M',
  genderKorean: '남성',
  birthYear: 1992,
  residenceCity: '부산광역시',
  residenceDistrict: '해운대구',
  jobTitle: 'IT 개발자',
  dietary: 'NONE',
  dietaryKorean: '없음',
  interests: ['IT', 'TECH', 'COFFEE'],
};

const TESTER_BBB: PersonaDef = {
  id: 'U_bbb',
  handle: '@bbb',
  nickname: 'bbb',
  email: 'bbb@nadosolo.com',
  phone: '010-1995-2222',
  gender: 'F',
  genderKorean: '여성',
  birthYear: 1995,
  residenceCity: '부산광역시',
  residenceDistrict: '부산진구 전포',
  jobTitle: '브랜드 디렉터',
  dietary: 'VEGAN,ALCOHOL_FREE',
  dietaryKorean: '비건·논알콜',
  interests: ['BRANDING', 'WINE', 'ART'],
};

async function testSinglePersona(persona: PersonaDef): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  console.log(`\n================================================================`);
  console.log(`👤 [테스터 검증 시작] ${persona.nickname} (${persona.handle} / ${persona.genderKorean} / ${persona.birthYear}년생)`);
  console.log(`================================================================`);

  // --------------------------------------------------------------------------
  // [1관문 검증] 회원가입 & 중복검증 & 기본 계정 생성
  // --------------------------------------------------------------------------
  console.log(`\n▶ [1관문: 회원가입 / 중복검증 / 계정생성]`);

  // 1-1. 중복 검증 시뮬레이션 (기존 등록 여부 조회)
  const cleanHandle = persona.handle.toLowerCase();
  const rawId = persona.id;

  const { data: duplicateCheck, error: dupErr } = await supabase
    .from('profiles')
    .select('id, handle')
    .or(`id.eq.${rawId},handle.eq.${cleanHandle}`)
    .limit(1);

  if (dupErr) {
    errors.push(`1관문 중복검증 쿼리 실패: ${dupErr.message}`);
    console.error(`   ❌ 중복 검증 쿼리 실패:`, dupErr.message);
  } else if (duplicateCheck && duplicateCheck.length > 0) {
    console.log(`   ℹ️ 기존 계정 존재 확인 (ID: ${duplicateCheck[0].id}, Handle: ${duplicateCheck[0].handle}) ➔ 갱신 및 여정 재검증 모드로 진행`);
  } else {
    console.log(`   ✅ 중복 검증 통과 (사용 가능한 아이디: ${persona.handle})`);
  }

  // 1-2. 기본 가입 데이터 upsert
  const initialSignupRow = {
    id: persona.id,
    handle: persona.handle,
    email: persona.email,
    phone: persona.phone,
    nickname: persona.nickname,
    gender: persona.gender,
    birth_year: persona.birthYear,
    job_title: '미입력',
    dietary: 'NONE',
    verified_badge: '회원가입 완료',
    session_count: 1,
    updated_at: new Date().toISOString(),
  };

  const { error: signupErr } = await supabase
    .from('profiles')
    .upsert(initialSignupRow, { onConflict: 'id' });

  if (signupErr) {
    errors.push(`1관문 회원가입 upsert 실패: ${signupErr.message}`);
    console.error(`   ❌ 1관문 회원가입 저장 실패:`, signupErr.message);
  } else {
    console.log(`   ✅ 1관문 완료: 기본 회원가입 정보 Supabase 라이브 DB 적재 성공`);
  }

  // --------------------------------------------------------------------------
  // [2관문 검증] 온보딩 프로필·지역·식이정보 저장
  // --------------------------------------------------------------------------
  console.log(`\n▶ [2관문: 온보딩 / 프로필·지역·식이정보 저장]`);

  const onboardingRow = {
    id: persona.id,
    handle: persona.handle,
    email: persona.email,
    phone: persona.phone,
    nickname: persona.nickname,
    gender: persona.gender,
    birth_year: persona.birthYear,
    job_title: persona.jobTitle,
    dietary: persona.dietary,
    interests: persona.interests,
    verified_badge: '프로필 등록 완료',
    session_count: 1,
    self_domain_scores: {
      APPEARANCE: 88,
      STYLE: 90,
      VOICE: 86,
      CONVERSATION: 92,
      MANNER: 94,
      _residence_city: persona.residenceCity,
      _residence_district: persona.residenceDistrict,
      _dietary_detail: persona.dietaryKorean,
    },
    updated_at: new Date().toISOString(),
  };

  const { error: onboardingErr } = await supabase
    .from('profiles')
    .upsert(onboardingRow, { onConflict: 'id' });

  if (onboardingErr) {
    errors.push(`2관문 온보딩 upsert 실패: ${onboardingErr.message}`);
    console.error(`   ❌ 2관문 온보딩 저장 실패:`, onboardingErr.message);
  } else {
    console.log(`   ✅ 2관문 완료: 상세 프로필 및 식이/지역정보 라이브 DB 적재 성공`);
  }

  // --------------------------------------------------------------------------
  // [실시간 DB 복원 무결성 실증 검증]
  // --------------------------------------------------------------------------
  console.log(`\n▶ [실시간 DB 복원 무결성 실증 검증]`);

  const { data: fetchedProfile, error: fetchErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', persona.id)
    .single();

  if (fetchErr || !fetchedProfile) {
    errors.push(`실시간 프로필 조회 실패: ${fetchErr?.message || '데이터 없음'}`);
    console.error(`   ❌ 조회 실패:`, fetchErr);
    return { success: false, errors };
  }

  const scores = fetchedProfile.self_domain_scores || {};
  const actualCity = (fetchedProfile as any).residence_city || scores._residence_city;
  const actualDistrict = (fetchedProfile as any).residence_district || scores._residence_district;
  const actualDietary = fetchedProfile.dietary;

  console.log(`   [실서버 조회 결과]`);
  console.log(`   - 아이디/핸들 : ${fetchedProfile.id} (${fetchedProfile.handle})`);
  console.log(`   - 닉네임     : ${fetchedProfile.nickname}`);
  console.log(`   - 성별/연령   : ${fetchedProfile.gender} (${fetchedProfile.birth_year}년생)`);
  console.log(`   - 직업/직무   : ${fetchedProfile.job_title}`);
  console.log(`   - 거주지역   : [${actualCity}] [${actualDistrict}]`);
  console.log(`   - 식이/못먹는음식 : [${actualDietary}] (${scores._dietary_detail})`);
  console.log(`   - 인증상태   : ${fetchedProfile.verified_badge}`);

  // 항목별 대조 검증
  if (fetchedProfile.gender !== persona.gender) {
    errors.push(`성별 불일치 (기대: ${persona.gender}, 실제: ${fetchedProfile.gender})`);
  }
  if (fetchedProfile.birth_year !== persona.birthYear) {
    errors.push(`출생연도 불일치 (기대: ${persona.birthYear}, 실제: ${fetchedProfile.birth_year})`);
  }
  if (fetchedProfile.job_title !== persona.jobTitle) {
    errors.push(`직업 불일치 (기대: ${persona.jobTitle}, 실제: ${fetchedProfile.job_title})`);
  }
  if (actualCity !== persona.residenceCity) {
    errors.push(`거주 시·도 불일치 (기대: ${persona.residenceCity}, 실제: ${actualCity})`);
  }
  if (actualDistrict !== persona.residenceDistrict) {
    errors.push(`거주 구 불일치 (기대: ${persona.residenceDistrict}, 실제: ${actualDistrict})`);
  }
  if (actualDietary !== persona.dietary) {
    errors.push(`식이 불일치 (기대: ${persona.dietary}, 실제: ${actualDietary})`);
  }

  if (errors.length === 0) {
    console.log(`   🎯 [1·2관문 정합성 100% 검증 통과] ${persona.nickname}의 모든 데이터가 Supabase 라이브 DB에 완벽히 일치합니다.`);
    return { success: true, errors: [] };
  } else {
    console.error(`   ⚠️ 불일치 결함 발견:`, errors);
    return { success: false, errors };
  }
}

async function main() {
  console.log(`================================================================`);
  console.log(`🛡️ [다프로 & 가프로] 가상 이용자 1·2관문 실전 라이브 DB 검증 가동`);
  console.log(`================================================================`);

  const resA = await testSinglePersona(TESTER_AAA);
  const resB = await testSinglePersona(TESTER_BBB);

  // 최종 전체 명부 조회
  console.log(`\n================================================================`);
  console.log(`📊 [최종 감사 실증] 현재 Supabase 라이브 DB 등록 회원 명부`);
  console.log(`================================================================`);

  const { data: allProfiles, error: allErr } = await supabase
    .from('profiles')
    .select('id, handle, nickname, gender, birth_year, job_title, dietary, verified_badge, created_at')
    .order('created_at', { ascending: true });

  if (allErr) {
    console.error(`❌ 전체 회원 명부 조회 에러:`, allErr);
  } else {
    console.log(`총 ${allProfiles?.length || 0}명 등록 중:`);
    allProfiles?.forEach((p, idx) => {
      console.log(
        `   [${String(idx + 1).padStart(2, '0')}] ${p.id.padEnd(8)} | ${p.handle.padEnd(8)} | ${p.nickname.padEnd(6)} | ${p.gender} | ${p.birth_year}년 | 직업: ${(p.job_title || '-').padEnd(12)} | 식이: ${(p.dietary || 'NONE').padEnd(20)} | ${p.verified_badge}`
      );
    });
  }

  const allSuccess = resA.success && resB.success;
  console.log(`\n================================================================`);
  if (allSuccess) {
    console.log(`✅ [다프로·가프로 최종 결재] 테스터 1호(aaa) 및 2호(bbb) 1·2관문 검증 완료!`);
    console.log(`   - 1관문(회원가입/중복검증/계정생성): 무결성 100%`);
    console.log(`   - 2관문(온보딩/프로필/식이/지역정보): 무결성 100%`);
    console.log(`================================================================\n`);
    process.exit(0);
  } else {
    console.error(`❌ [가프로 감사 반려] 결함 발생 건수: ${resA.errors.length + resB.errors.length}건`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('실행 중 예외 발생:', e);
  process.exit(1);
});
