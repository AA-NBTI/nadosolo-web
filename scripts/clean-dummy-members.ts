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
  console.log('🧹 [긴급 척결] Supabase 라이브 DB 내 aa, bb 더미 계정 완전 삭제 작업 시작');

  // 1. aa, bb 관련 모든 계정 물리적 삭제 (DELETE)
  const targetsToDelete = ['USER_AA', 'USER_BB', 'U_aa', 'U_bb'];
  const handlesToDelete = ['@aa', '@bb', 'aa', 'bb'];

  const { data: delId, error: errId } = await supabase
    .from('profiles')
    .delete()
    .in('id', targetsToDelete)
    .select();

  const { data: delHandle, error: errHandle } = await supabase
    .from('profiles')
    .delete()
    .in('handle', handlesToDelete)
    .select();

  console.log('✅ 삭제된 ID 목록:', delId);
  console.log('✅ 삭제된 Handle 목록:', delHandle);

  // 2. 현재 Supabase 라이브 DB에 남은 실제 전체 회원 목록 조회
  const { data: allMembers, error: errAll } = await supabase
    .from('profiles')
    .select('id, handle, nickname, gender, birth_year, job_title, created_at')
    .order('created_at', { ascending: false });

  if (errAll) {
    console.error('❌ 조회 에러:', errAll);
    process.exit(1);
  }

  console.log(`\n📊 [실서버 무결성 최종 증적] 현재 DB에 잔존하는 전체 회원 명부 (총 ${allMembers?.length || 0}명):`);
  allMembers?.forEach((m, idx) => {
    console.log(`   [${String(idx + 1).padStart(2, '0')}] ID: ${m.id.padEnd(12)} | Handle: ${m.handle.padEnd(10)} | Nickname: ${m.nickname.padEnd(8)} | ${m.gender} | ${m.birth_year}년 | ${m.job_title || '-'}`);
  });

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

