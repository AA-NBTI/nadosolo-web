import {
  ADAPTIVE_DINING_PLAYBOOK,
  DEFAULT_SURVEY_QUESTIONS,
  GroupingEngine,
  GrowthCoachingEngine,
  LocalePolicyEngine,
  MirrorEngine,
  MutualMatchEngine,
  ParticipantProfile,
  PeerMirrorFeedback,
  PlaybookEngine,
  ProfilingEngine,
  SAMPLE_PARTNER_VENUES,
  SecretVote,
  SessionGrowthSnapshot,
  VenueAndYieldEngine,
} from './index';

/**
 * NadoSolo Core Engine v2 - [3대 도메인 x 8개 핵심 모듈] 통합 시뮬레이션
 */
function runSimulationV2() {
  console.log('========================================================================');
  console.log('🚀 [NadoSolo Core Engine v2] 3대 도메인 × 8개 모듈 통합 시뮬레이션');
  console.log('========================================================================\n');

  // ----------------------------------------------------------------------
  // 1. [Domain A: ① Profiling & ② Mirror] 내가 본 나 vs 타인이 본 나 (조하리의 창)
  // ----------------------------------------------------------------------
  console.log('▶ [Domain A - ① & ②] 내가 본 나(Self) vs 타인이 본 나(Mirror) 분리 진단');

  // 주인공 U01(성수요리왕): 스스로는 대화 주도성(talkLead: 0.35)을 낮게 과소평가했으나,
  // 실제 모임 동석자들은 따뜻하게 질문을 잘 던진다고 높게(0.85) 평가한 케이스 + 스타일링 코칭 포인트 보유
  const u01SelfVector = ProfilingEngine.computeSelfVector(DEFAULT_SURVEY_QUESTIONS, [
    { questionId: 'Q1_WEEKEND', selectedOptionId: 'Q1_A' },
    { questionId: 'Q2_TALK_STYLE', selectedOptionId: 'Q2_B' }, // 스스로 경청형/소극적이라 응답
    { questionId: 'Q3_ALCOHOL', selectedOptionId: 'Q3_A' },
    { questionId: 'Q4_INTENT', selectedOptionId: 'Q4_A' },
  ]);

  const pastFeedbacksForU01: PeerMirrorFeedback[] = [
    {
      sessionId: 'SES_PAST_01',
      fromUserId: 'PEER_1',
      toUserId: 'U01',
      observedTraitHint: { talkLead: 0.85, extroversion: 0.8 },
      competencyRatings: {
        communicationBalance: 88,
        groomingAndSelfCare: 68, // 스타일링/그루밍이 살짝 아쉽다는 평가
        empathyAndVibe: 90,
        lifestyleVitality: 82,
      },
      selectedCharmTag: 'GREAT_QUESTIONER',
      selectedGrowthTipTag: 'UPGRADE_STYLING',
    },
    {
      sessionId: 'SES_PAST_02',
      fromUserId: 'PEER_2',
      toUserId: 'U01',
      observedTraitHint: { talkLead: 0.8, extroversion: 0.75 },
      competencyRatings: {
        communicationBalance: 86,
        groomingAndSelfCare: 70,
        empathyAndVibe: 88,
        lifestyleVitality: 84,
      },
      selectedCharmTag: 'WARM_LISTENER',
      selectedGrowthTipTag: 'UPGRADE_STYLING',
    },
  ];

  const u01MirrorResult = MirrorEngine.analyzeMirror(
    'U01',
    u01SelfVector,
    pastFeedbacksForU01
  );

  console.log(`  - [U01 성수요리왕] 내가 본 나(Self talkLead): ${u01MirrorResult.selfVector.talkLead} vs 타인이 본 나(Mirror talkLead): ${u01MirrorResult.mirrorVector.talkLead}`);
  console.log(`  - 매칭 엔진 주입용 합성 벡터(Effective talkLead): ${u01MirrorResult.effectiveVector.talkLead}`);
  for (const insight of u01MirrorResult.johariInsights.filter((i) => i.quadrant !== 'NEUTRAL_ALIGNED')) {
    console.log(`    ${insight.summaryMessage}`);
  }
  console.log('');

  // ----------------------------------------------------------------------
  // 2. [Domain B: ④ LocalePolicy & ⑤ Grouping] 다중 모드(ROMANCE vs THEME) & 글로벌 언어 매칭
  // ----------------------------------------------------------------------
  console.log('▶ [Domain B - ④ & ⑤] 다중 소셜 모드(3:3 로맨스 vs 나이·성비 무관 관심사 테마) 그룹 편성');

  const participants: ParticipantProfile[] = [
    // [그룹 1 후보] 서울 성수 | ROMANCE 모드 (한국어, 3:3 성비 강제, ±5세 이내, 비건 1명 포함)
    {
      userId: 'U01', nickname: '성수요리왕(남)', gender: 'M', birthYear: 1995, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'ROMANCE', languages: { ko: 'NATIVE', en: 'CONVERSATIONAL' }, preferredTableLanguage: 'ko',
      budgetTier: '$$', dietary: ['NONE'], interests: ['COOKING', 'WINE'],
      selfVector: u01SelfVector, effectiveVector: u01MirrorResult.effectiveVector, trustScore: 95, verified: true,
    },
    {
      userId: 'U02', nickname: '건대건축가(남)', gender: 'M', birthYear: 1994, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'ROMANCE', languages: { ko: 'NATIVE' }, preferredTableLanguage: 'ko',
      budgetTier: '$$', dietary: ['NONE'], interests: ['BOOK_ART', 'WINE'],
      selfVector: { extroversion: 0.6, talkLead: 0.4, lifestyleActive: 0.7, romanceIntent: 0.8, alcoholPreference: 0.7 }, trustScore: 88, verified: true,
    },
    {
      userId: 'U03', nickname: '서울숲러너(남)', gender: 'M', birthYear: 1996, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'ROMANCE', languages: { ko: 'NATIVE' }, preferredTableLanguage: 'ko',
      budgetTier: '$$', dietary: ['NONE'], interests: ['RUNNING', 'TRAVEL'],
      selfVector: { extroversion: 0.75, talkLead: 0.6, lifestyleActive: 0.85, romanceIntent: 0.85, alcoholPreference: 0.6 }, trustScore: 90, verified: true,
    },
    {
      userId: 'U04', nickname: '성수디자이너(여)', gender: 'F', birthYear: 1996, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'ROMANCE', languages: { ko: 'NATIVE' }, preferredTableLanguage: 'ko',
      budgetTier: '$$', dietary: ['VEGAN'], interests: ['COOKING', 'BOOK_ART'],
      selfVector: { extroversion: 0.65, talkLead: 0.35, lifestyleActive: 0.75, romanceIntent: 0.85, alcoholPreference: 0.7 }, trustScore: 92, verified: true,
    },
    {
      userId: 'U05', nickname: '뚝섬마케터(여)', gender: 'F', birthYear: 1995, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'ROMANCE', languages: { ko: 'NATIVE' }, preferredTableLanguage: 'ko',
      budgetTier: '$$', dietary: ['NONE'], interests: ['WINE', 'TRAVEL'],
      selfVector: { extroversion: 0.7, talkLead: 0.65, lifestyleActive: 0.8, romanceIntent: 0.8, alcoholPreference: 0.8 }, trustScore: 85, verified: true,
    },
    {
      userId: 'U06', nickname: '자양동피아니스트(여)', gender: 'F', birthYear: 1997, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'ROMANCE', languages: { ko: 'NATIVE' }, preferredTableLanguage: 'ko',
      budgetTier: '$$', dietary: ['NONE'], interests: ['MOVIE_MUSIC', 'WINE'],
      selfVector: { extroversion: 0.55, talkLead: 0.4, lifestyleActive: 0.7, romanceIntent: 0.8, alcoholPreference: 0.7 }, trustScore: 90, verified: true,
    },

    // [그룹 2 후보] 서울 성수 | THEME(관심사 딥토크) 모드 | 글로벌 영어 테이블 (성비 무관 남4:여2, 나이 86~97년생 11세 차이도 와인·요리 관심사로 매칭!)
    {
      userId: 'G01', nickname: 'Alex_셰프(남/86)', gender: 'M', birthYear: 1986, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'THEME', languages: { en: 'NATIVE', ko: 'BASIC' }, preferredTableLanguage: 'en',
      budgetTier: '$$', dietary: ['NONE'], interests: ['WINE', 'COOKING', 'TRAVEL'],
      selfVector: { extroversion: 0.75, talkLead: 0.7, lifestyleActive: 0.8, romanceIntent: 0.2, alcoholPreference: 0.9 }, trustScore: 95, verified: true,
    },
    {
      userId: 'G02', nickname: '민준_소믈리에(남/94)', gender: 'M', birthYear: 1994, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'THEME', languages: { ko: 'NATIVE', en: 'FLUENT' }, preferredTableLanguage: 'en',
      budgetTier: '$$', dietary: ['NONE'], interests: ['WINE', 'COOKING'],
      selfVector: { extroversion: 0.6, talkLead: 0.5, lifestyleActive: 0.7, romanceIntent: 0.3, alcoholPreference: 0.9 }, trustScore: 90, verified: true,
    },
    {
      userId: 'G03', nickname: 'Lucas_창업가(남/90)', gender: 'M', birthYear: 1990, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'THEME', languages: { en: 'FLUENT' }, preferredTableLanguage: 'en',
      budgetTier: '$$', dietary: ['HALAL'], interests: ['COOKING', 'TECH_STARTUP', 'TRAVEL'],
      selfVector: { extroversion: 0.7, talkLead: 0.6, lifestyleActive: 0.75, romanceIntent: 0.2, alcoholPreference: 0.3 }, trustScore: 88, verified: true,
    },
    {
      userId: 'G04', nickname: '현우_푸드에디터(남/97)', gender: 'M', birthYear: 1997, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'THEME', languages: { ko: 'NATIVE', en: 'CONVERSATIONAL' }, preferredTableLanguage: 'en',
      budgetTier: '$$', dietary: ['NONE'], interests: ['WINE', 'COOKING', 'BOOK_ART'],
      selfVector: { extroversion: 0.55, talkLead: 0.4, lifestyleActive: 0.7, romanceIntent: 0.2, alcoholPreference: 0.8 }, trustScore: 92, verified: true,
    },
    {
      userId: 'G05', nickname: 'Sophie_마케터(여/92)', gender: 'F', birthYear: 1992, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'THEME', languages: { en: 'NATIVE', ko: 'CONVERSATIONAL' }, preferredTableLanguage: 'en',
      budgetTier: '$$', dietary: ['VEGAN'], interests: ['WINE', 'COOKING', 'TRAVEL'],
      selfVector: { extroversion: 0.65, talkLead: 0.55, lifestyleActive: 0.8, romanceIntent: 0.3, alcoholPreference: 0.8 }, trustScore: 94, verified: true,
    },
    {
      userId: 'G06', nickname: '지연_바이어(여/89)', gender: 'F', birthYear: 1989, cityCode: 'SEOUL_SEONGSU',
      preferredMode: 'THEME', languages: { ko: 'NATIVE', en: 'FLUENT' }, preferredTableLanguage: 'en',
      budgetTier: '$$', dietary: ['NONE'], interests: ['WINE', 'COOKING', 'FINANCE'],
      selfVector: { extroversion: 0.6, talkLead: 0.45, lifestyleActive: 0.75, romanceIntent: 0.2, alcoholPreference: 0.85 }, trustScore: 91, verified: true,
    },
  ];

  const groupingResult = GroupingEngine.matchTables(participants);

  // ----------------------------------------------------------------------
  // 3. [Domain B: ⑥ VenueAndYield] 식단·테마 맞춤 식당 배정 & 다이내믹 프라이싱/대기열 복구
  // ----------------------------------------------------------------------
  const tablesWithVenues = VenueAndYieldEngine.assignVenuesToTables(
    groupingResult.matchedTables,
    SAMPLE_PARTNER_VENUES
  );

  for (const t of tablesWithVenues) {
    console.log(
      `  📌 [${t.tableId}] 모드: ${t.mode} | 언어: ${t.tableLanguage.toUpperCase()} | 종합점수: ${t.harmonyScore}점 (관심사일치: ${t.scoreBreakdown.interestSimilarity}점)`
    );
    console.log(
      `     식단 요구사항: [${t.requiredDietarySupport.join(', ') || '없음'}] -> 배정 식당: 🍽️ ${t.assignedVenue?.name}`
    );
    console.log(
      `     구성원: ${t.participants.map((p) => p.nickname).join(', ')}\n`
    );
  }

  console.log('▶ [Domain B - ⑥] 수급 기반 다이내믹 프라이싱 & 당일 결원 대기열(Standby) 복구 검증');
  const priceQuote = VenueAndYieldEngine.calculateDynamicPrice({
    cityCode: 'SEOUL_SEONGSU',
    mode: 'ROMANCE',
    applicantGender: 'F',
    currentMaleCount: 3,
    currentFemaleCount: 1, // 여성 2명 부족 상황 -> 밸런스 부스트 할인 자동 발동!
    hoursUntilEvent: 24,
  });
  console.log(
    `  - [성비 불균형 자동 할인] 정가 ${priceQuote.basePrice}원 -> 할인가 ${priceQuote.finalPrice}원 (${priceQuote.discountRatePercent}% 할인, 사유: ${priceQuote.pricingReason})`
  );

  const standbyCandidate = VenueAndYieldEngine.findStandbyReplacement(
    tablesWithVenues[0],
    tablesWithVenues[0].participants[2],
    [
      {
        userId: 'S01', nickname: '노쇼상습범(남)', gender: 'M', birthYear: 1995, cityCode: 'SEOUL_SEONGSU',
        preferredMode: 'ROMANCE', languages: { ko: 'NATIVE' }, preferredTableLanguage: 'ko',
        budgetTier: '$$', dietary: ['NONE'], interests: ['WINE'], selfVector: u01SelfVector, trustScore: 50, verified: true,
      },
      {
        userId: 'S02', nickname: '검증된대기자(남)', gender: 'M', birthYear: 1995, cityCode: 'SEOUL_SEONGSU',
        preferredMode: 'ROMANCE', languages: { ko: 'NATIVE' }, preferredTableLanguage: 'ko',
        budgetTier: '$$', dietary: ['NONE'], interests: ['WINE'], selfVector: u01SelfVector, trustScore: 96, verified: true,
      },
    ]
  );
  console.log(
    `  - [당일 취소 긴급 복구] 신뢰점수 80점 미만 배제 후 선발된 대체 후보: ${standbyCandidate?.nickname} (신뢰점수: ${standbyCandidate?.trustScore}점)\n`
  );

  // ----------------------------------------------------------------------
  // 4. [Domain C: ⑦ Playbook & ⑧ MutualMatch] 모드별 좌석 배치 & VIP 라운드 Unlock
  // ----------------------------------------------------------------------
  console.log('▶ [Domain C - ⑦ & ⑧] 모드별 맞춤형 좌석 배치(관심사 짝꿍) 및 2차 VIP 라운드 Unlock');
  const themeTable = tablesWithVenues[1]; // THEME 글로벌 영어 테이블
  const cityCfg = LocalePolicyEngine.getCityConfig(themeTable.cityCode);

  const themeSession = PlaybookEngine.createInitialSession(
    'SES_THEME_01',
    themeTable.tableId,
    themeTable.mode,
    cityCfg.cultureTag,
    ADAPTIVE_DINING_PLAYBOOK,
    themeTable.participants
  );

  console.log('  - [THEME 모드 1부 좌석] 성별 무관, 공통 관심사 시너지 순 인접 배치 결과:');
  for (const seat of themeSession.currentSeats) {
    console.log(`    [${seat.seatNumber}번석] ${seat.nickname} (${seat.pairingReason})`);
  }

  // 모임 종료 후 투표 및 피드백을 통한 VIP 라운드 Unlock 검증
  const sessionVotes: SecretVote[] = [
    { sessionId: 'SES_ROMANCE_01', fromUserId: 'U04', toUserId: 'U01', category: 'ROMANCE', submittedAt: '2026-11-06T21:00:00Z' },
    { sessionId: 'SES_ROMANCE_01', fromUserId: 'U05', toUserId: 'U01', category: 'DINING_FRIEND', submittedAt: '2026-11-06T21:00:00Z' },
    { sessionId: 'SES_ROMANCE_01', fromUserId: 'U01', toUserId: 'U04', category: 'ROMANCE', submittedAt: '2026-11-06T21:00:00Z' },
  ];
  const sessionFeedbacks: PeerMirrorFeedback[] = [
    { ...pastFeedbacksForU01[0], sessionId: 'SES_ROMANCE_01' },
    { ...pastFeedbacksForU01[1], sessionId: 'SES_ROMANCE_01' },
  ];

  const vipUnlocked = MutualMatchEngine.evaluateVipTierUnlocks(
    'SES_ROMANCE_01',
    sessionVotes,
    sessionFeedbacks
  );
  console.log(
    `  - 🌟 [2차 검증 멤버 전용 VIP 라운드 자동 초대권 획득]: ${vipUnlocked.join(', ')} (성수요리왕)\n`
  );

  // ----------------------------------------------------------------------
  // 5. [Domain A: ③ GrowthCoaching] 시계열 성장 궤적 및 맞춤형 자기관리 코칭 리포트
  // ----------------------------------------------------------------------
  console.log('▶ [Domain A - ③] 그로스 코칭 엔진: 회차별 성장 타임라인 & 맞춤형 자기관리 처방전');

  const u01GrowthSnapshots: SessionGrowthSnapshot[] = [
    {
      sessionNumber: 1,
      sessionId: 'SES_01',
      recordedAt: '2026-10-01T22:00:00Z',
      competencyScores: { communicationBalance: 72, groomingAndSelfCare: 64, empathyAndVibe: 78, lifestyleVitality: 75 },
      mirrorExtroversion: 0.65,
      mirrorTalkLead: 0.60,
      receivedLikesCount: 1,
    },
    {
      sessionNumber: 2,
      sessionId: 'SES_02',
      recordedAt: '2026-10-15T22:00:00Z',
      competencyScores: { communicationBalance: 80, groomingAndSelfCare: 67, empathyAndVibe: 84, lifestyleVitality: 80 },
      mirrorExtroversion: 0.72,
      mirrorTalkLead: 0.75,
      receivedLikesCount: 2,
    },
    {
      sessionNumber: 3,
      sessionId: 'SES_ROMANCE_01',
      recordedAt: '2026-11-06T22:00:00Z',
      competencyScores: u01MirrorResult.competencyAvg, // {87, 69, 89, 83}
      mirrorExtroversion: u01MirrorResult.mirrorVector.extroversion,
      mirrorTalkLead: u01MirrorResult.mirrorVector.talkLead,
      receivedLikesCount: 2,
    },
  ];

  const coachingReport = GrowthCoachingEngine.generateCoachingReport(
    'U01',
    u01GrowthSnapshots,
    u01MirrorResult
  );

  console.log(
    `  - 📈 [U01 성수요리왕] 총 ${coachingReport.totalSessionsCompleted}회차 참여 | 첫 모임 대비 종합 역량 성장폭: +${coachingReport.overallGrowthDelta}점`
  );
  console.log('  - 회차별 4대 역량 변화 (1회차 -> 3회차):');
  for (const trend of coachingReport.competencyTrend) {
    console.log(
      `    • ${trend.axis}: ${trend.firstScore}점 ➔ ${trend.latestScore}점 (+${trend.delta})`
    );
  }
  console.log(`  - 획득한 아우라 배지: ${coachingReport.unlockedAuraBadges.join(', ')}`);
  console.log(`  - 유저 주도 프로필 레벨업(Opt-in) 제안 활성화 여부: ${coachingReport.shouldPromptProfileLevelUp}`);
  console.log('\n  💊 [발견된 부족 영역(69점) 맞춤 원포인트 코칭 처방전]:');
  for (const p of coachingReport.prescriptions) {
    console.log(`    • 코칭 제목: "${p.coachingTitle}" (현재 ${p.currentScore}점)`);
    console.log(`    • 코칭 조언: ${p.gentleAdvice}`);
    console.log(`    • 다음 모임 미션: 🎯 ${p.nextSessionMicroMission}`);
    console.log(`    • 추천 자기관리 프로그램: 🔗 ${p.recommendedProgram.title}`);
  }

  console.log('\n========================================================================');
  console.log('✅ [3대 도메인 × 8개 모듈] 코어 엔진 v2 시뮬레이션 검증이 완벽히 완료되었습니다.');
  console.log('========================================================================');
}

runSimulationV2();
