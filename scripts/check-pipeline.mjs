const baseUrl = process.env.NADOSOLO_BASE_URL || 'http://localhost:3000';

const ROUTES_TO_CHECK = [
  '/',
  '/busan',
  '/test',
  '/meetup',
  '/locations',
  '/pricing',
  '/about',
  '/dashboard',
  '/admin',
  '/affiliate',
  '/partners',
  '/terms',
  '/privacy',
  '/safety',
  '/guide',
];

async function checkRoutes() {
  const failures = [];
  for (const route of ROUTES_TO_CHECK) {
    const res = await fetch(`${baseUrl}${route}`);
    if (!res.ok) {
      failures.push(`${route} (HTTP ${res.status})`);
    }
  }
  return { total: ROUTES_TO_CHECK.length, failures };
}

async function main() {
  const [pipeRes, cronRes, routeSummary] = await Promise.all([
    fetch(`${baseUrl}/api/pipeline/auto-match`),
    fetch(`${baseUrl}/api/cron/daily-match`),
    checkRoutes(),
  ]);

  if (!pipeRes.ok) {
    console.error(`[FAIL] /api/pipeline/auto-match HTTP ${pipeRes.status}`);
    process.exit(1);
  }

  const data = await pipeRes.json();
  const cronData = cronRes.ok ? await cronRes.json() : { ok: false };
  const s = data.stats || {};
  const t = data.tableHealth || {};

  console.log('=== 나도솔로 전주기 통합 점검 (페이지 · API · DB · 엔진) ===');
  console.log(
    `페이지: ${routeSummary.total - routeSummary.failures.length}/${routeSummary.total} OK` +
      (routeSummary.failures.length > 0 ? ` [FAIL: ${routeSummary.failures.join(', ')}]` : '')
  );
  console.log(
    `API/Cron: auto-match(${data.ok ? 'OK' : 'FAIL'}) · daily-match(${cronData.ok ? 'OK' : 'FAIL'})`
  );
  console.log(
    `DB 테이블: profiles(${t.profiles ? 'OK' : 'MISSING'}) · meetups(${t.meetups ? 'OK' : 'MISSING'}) · notifications(${t.notifications ? 'OK' : 'MISSING'}) · user_blocks(${t.user_blocks ? 'OK' : 'MISSING'}) · app_configs(${t.app_configs ? 'OK' : 'MISSING'}) · affiliate_applications(${t.affiliate_applications ? 'OK' : 'MISSING'})`
  );
  console.log(`회원: 총 ${s.totalProfiles ?? 0}명 (입금 ${s.paidCount ?? 0} / 미입금 ${s.unpaidCount ?? 0})`);
  console.log(
    `매칭: 방 ${s.roomCount ?? 0}개 · 식당배정 ${s.assignedVenueCount ?? 0}곳 · 대기 ${s.rolloverCount ?? 0}명 · 차단쌍 ${s.blockedPairCount ?? 0}건 · 밋업개설 ${s.existingMeetupCount ?? 0}방`
  );
  console.log(`감사: ${data.allAuditPassed ? `${(data.auditCases || []).length}/${(data.auditCases || []).length} PASS` : 'FAIL 포함'}`);
  for (const c of data.auditCases || []) {
    console.log(`  - ${c.caseId} [${c.status}]: ${c.title}`);
  }

  const dbOk = Boolean(
    t.profiles && t.meetups && t.notifications && t.user_blocks && t.app_configs && t.affiliate_applications
  );
  if (!data.ok || !cronData.ok || !data.allAuditPassed || !dbOk || routeSummary.failures.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[ERROR] 서버 미기동 또는 연결 실패:', err.message);
  process.exit(1);
});
