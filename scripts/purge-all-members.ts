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
  console.log('🚨 [회장실 특별 지시] Supabase 라이브 DB 일반 회원 전원 완전 영구 삭제(Purge) 개시');

  // 1. 최고관리자(ADMIN_01)를 제외한 모든 일반 회원 레코드 완전 영구 삭제 (DELETE)
  // (또는 전체 회원을 완전 초기화)
  const { data: deleted, error: delErr } = await supabase
    .from('profiles')
    .delete()
    .neq('id', 'ADMIN_01')
    .select();

  if (delErr) {
    console.error('❌ 삭제 오류:', delErr);
    process.exit(1);
  }

  console.log(`✅ 삭제 완료된 일반 회원 수: ${deleted?.length || 0}명`);
  deleted?.forEach((d) => console.log(`   - 삭제됨: ID [${d.id}] Handle [${d.handle}] Nickname [${d.nickname}]`));

  // 2. 삭제 후 현재 Supabase profiles 테이블에 남은 전체 실서버 레코드 전수 조회
  const { data: remaining, error: remErr } = await supabase
    .from('profiles')
    .select('id, handle, nickname, gender, birth_year, job_title, created_at')
    .order('created_at', { ascending: false });

  if (remErr) {
    console.error('❌ 조회 오류:', remErr);
    process.exit(1);
  }

  console.log(`\n📊 [삭제 후 실서버 DB 최종 잔존 명부] (총 ${remaining?.length || 0}명):`);
  if (!remaining || remaining.length === 0) {
    console.log('   (등록된 회원이 0명입니다. 완전 백지화 완료)');
  } else {
    remaining.forEach((m, idx) => {
      console.log(`   [${String(idx + 1).padStart(2, '0')}] ID: ${m.id.padEnd(12)} | Handle: ${m.handle.padEnd(10)} | Nickname: ${m.nickname.padEnd(8)} | ${m.job_title || '-'}`);
    });
  }

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

