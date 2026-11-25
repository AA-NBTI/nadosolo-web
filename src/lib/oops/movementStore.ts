export interface CountryData {
  code: string;
  flag: string;
  name: {
    ko: string;
    en: string;
    ja: string;
    zh: string;
    es: string;
  };
  lat: number;
  lng: number;
  /** AI 저항군 정식 서명자 수 */
  signatures: number;
  /** 전쟁 시나리오 투표 통계 */
  votes: {
    yes: number;
    no: number;
    total: number;
  };
  /** 객관/체감 충돌 온도 (°C) */
  temp: number;
  /** 주요 위임 분야 */
  domain: {
    ko: string;
    en: string;
    ja: string;
    zh: string;
    es: string;
  };
}

export const COUNTRIES_REGISTRY: Record<string, CountryData> = {
  KR: {
    code: 'KR',
    flag: '🇰🇷',
    name: { ko: '대한민국', en: 'South Korea', ja: '韓国', zh: '韩国', es: 'Corea del Sur' },
    lat: 37.5,
    lng: 127.0,
    signatures: 4120,
    votes: { yes: 3410, no: 1590, total: 5000 },
    temp: 68.2,
    domain: { ko: '금융 결제망 · 코딩 자동화', en: 'Payment Grid · Auto-Coding', ja: '決済網・開発自動化', zh: '金融支付网·编码自动化', es: 'Pagos · Código' },
  },
  US: {
    code: 'US',
    flag: '🇺🇸',
    name: { ko: '미국', en: 'United States', ja: '米国', zh: '美国', es: 'EE.UU.' },
    lat: 38.9,
    lng: -77.0,
    signatures: 7350,
    votes: { yes: 5120, no: 2050, total: 7170 },
    temp: 74.8,
    domain: { ko: '클라우드 인프라 · 자율 에이전트', en: 'Cloud Infra · Autonomous Agents', ja: 'クラウド・自律エージェント', zh: '云基础设施·自主智能体', es: 'Infraestructura Cloud' },
  },
  JP: {
    code: 'JP',
    flag: '🇯🇵',
    name: { ko: '일본', en: 'Japan', ja: '日本', zh: '日本', es: 'Japón' },
    lat: 35.6,
    lng: 139.7,
    signatures: 2480,
    votes: { yes: 1890, no: 1740, total: 3630 },
    temp: 54.3,
    domain: { ko: '물류 로보틱스 · 뱅킹', en: 'Logistics Robotics · Banking', ja: '物流ロボティクス・銀行', zh: '物流机器人·银行业', es: 'Robótica Logística' },
  },
  GB: {
    code: 'GB',
    flag: '🇬🇧',
    name: { ko: '영국', en: 'United Kingdom', ja: '英国', zh: '英国', es: 'Reino Unido' },
    lat: 51.5,
    lng: -0.1,
    signatures: 2190,
    votes: { yes: 1740, no: 920, total: 2660 },
    temp: 65.4,
    domain: { ko: '의료 AI · 핀테크 알고리즘', en: 'Healthcare AI · FinTech', ja: '医療AI・フィンテック', zh: '医疗AI·金融科技', es: 'Salud · Finanzas' },
  },
  DE: {
    code: 'DE',
    flag: '🇩🇪',
    name: { ko: '독일', en: 'Germany', ja: 'ドイツ', zh: '德国', es: 'Alemania' },
    lat: 52.5,
    lng: 13.4,
    signatures: 1980,
    votes: { yes: 1420, no: 1180, total: 2600 },
    temp: 58.7,
    domain: { ko: '공장 자동화 · 전력망 관제', en: 'Industrial Auto · Grid Control', ja: '工場自動化・電力網', zh: '工业自动化·电网管理', es: 'Industria · Energía' },
  },
  FR: {
    code: 'FR',
    flag: '🇫🇷',
    name: { ko: '프랑스', en: 'France', ja: 'フランス', zh: '法国', es: 'Francia' },
    lat: 48.8,
    lng: 2.3,
    signatures: 1750,
    votes: { yes: 1310, no: 990, total: 2300 },
    temp: 61.2,
    domain: { ko: '행정 문서 심사 · 법률 보조', en: 'Gov Admin · Legal AI', ja: '行政文書審査・法務AI', zh: '政务审批·法律辅助', es: 'Admin Pública · Legal' },
  },
  CN: {
    code: 'CN',
    flag: '🇨🇳',
    name: { ko: '중국', en: 'China', ja: '中国', zh: '中国', es: 'China' },
    lat: 39.9,
    lng: 116.4,
    signatures: 4890,
    votes: { yes: 4380, no: 1020, total: 5400 },
    temp: 81.5,
    domain: { ko: '도시 감시망 · 드론 자율 군집', en: 'Urban Vision · Drone Swarms', ja: '都市監視網・自律ドローン', zh: '天网监控·无人机集群', es: 'Vigilancia Urbana' },
  },
  IN: {
    code: 'IN',
    flag: '🇮🇳',
    name: { ko: '인도', en: 'India', ja: 'インド', zh: '印度', es: 'India' },
    lat: 28.6,
    lng: 77.2,
    signatures: 3620,
    votes: { yes: 2950, no: 1450, total: 4400 },
    temp: 67.0,
    domain: { ko: '글로벌 콜센터 AI · 백오피스', en: 'Contact Centers · IT Outsourcing', ja: 'コールセンター・IT委託', zh: '客服中心·IT外包', es: 'Centros de Atención' },
  },
  CA: {
    code: 'CA',
    flag: '🇨🇦',
    name: { ko: '캐나다', en: 'Canada', ja: 'カナダ', zh: '加拿大', es: 'Canadá' },
    lat: 45.4,
    lng: -75.7,
    signatures: 1410,
    votes: { yes: 1150, no: 610, total: 1760 },
    temp: 63.8,
    domain: { ko: '자원 채굴 AI · 통신 백본', en: 'Resource Mining · Telecom', ja: '資源採掘・通信基幹', zh: '资源采掘·电信骨干', es: 'Recursos · Telecom' },
  },
  AU: {
    code: 'AU',
    flag: '🇦🇺',
    name: { ko: '호주', en: 'Australia', ja: 'オーストラリア', zh: '澳大利亚', es: 'Australia' },
    lat: -35.3,
    lng: 149.1,
    signatures: 1120,
    votes: { yes: 890, no: 540, total: 1430 },
    temp: 56.4,
    domain: { ko: '항만 물류 · 기상 방재 모델', en: 'Port Logistics · Weather Defense', ja: '港湾物流・気象防災', zh: '港口物流·气象防灾', es: 'Logística Portuaria' },
  },
  BR: {
    code: 'BR',
    flag: '🇧🇷',
    name: { ko: '브라질', en: 'Brazil', ja: 'ブラジル', zh: '巴西', es: 'Brasil' },
    lat: -15.8,
    lng: -47.9,
    signatures: 1350,
    votes: { yes: 1080, no: 620, total: 1700 },
    temp: 59.2,
    domain: { ko: '농축산 유통망 · 모바일 뱅킹', en: 'Agri-Supply · Mobile Finance', ja: '農畜産流通・モバイル決済', zh: '农产供应链·移动金融', es: 'Cadena Agropecuaria' },
  },
  SG: {
    code: 'SG',
    flag: '🇸🇬',
    name: { ko: '싱가포르', en: 'Singapore', ja: 'シンガポール', zh: '新加坡', es: 'Singapur' },
    lat: 1.3,
    lng: 103.8,
    signatures: 980,
    votes: { yes: 760, no: 410, total: 1170 },
    temp: 72.1,
    domain: { ko: '초고주파 외환 거래 · 무인 항만', en: 'HFT Trading · Automated Port', ja: '超高速為替・無人港湾', zh: '高频交易·无人港口', es: 'Trading HFT' },
  },
  IL: {
    code: 'IL',
    flag: '🇮🇱',
    name: { ko: '이스라엘', en: 'Israel', ja: 'イスラエル', zh: '以色列', es: 'Israel' },
    lat: 31.8,
    lng: 35.2,
    signatures: 1240,
    votes: { yes: 1090, no: 340, total: 1430 },
    temp: 83.2,
    domain: { ko: '자율 방공망 · 사이버전 자동화', en: 'Auto Air Defense · Cyber Warfare', ja: '自律防空網・サイバー戦', zh: '防空反导·自动网络战', es: 'Defensa Aérea' },
  },
  TW: {
    code: 'TW',
    flag: '🇹🇼',
    name: { ko: '대만', en: 'Taiwan', ja: '台湾', zh: '台湾', es: 'Taiwán' },
    lat: 25.0,
    lng: 121.5,
    signatures: 1680,
    votes: { yes: 1340, no: 520, total: 1860 },
    temp: 77.4,
    domain: { ko: '반도체 팹 자동화 · 전력 제어', en: 'Semiconductor Fabs · Power Grid', ja: '半導体ファブ・電力制御', zh: '晶圆代工自动化·电控', es: 'Fabs de Semiconductores' },
  },
  CH: {
    code: 'CH',
    flag: '🇨🇭',
    name: { ko: '스위스', en: 'Switzerland', ja: 'スイス', zh: '瑞士', es: 'Suiza' },
    lat: 46.9,
    lng: 7.4,
    signatures: 870,
    votes: { yes: 580, no: 610, total: 1190 },
    temp: 49.5,
    domain: { ko: '프라이빗 뱅킹 · 제약 임상 AI', en: 'Private Banking · Pharma AI', ja: 'プライベートバンク・創薬AI', zh: '私人银行·制药临床AI', es: 'Banca Privada' },
  },
  SE: {
    code: 'SE',
    flag: '🇸🇪',
    name: { ko: '스웨덴', en: 'Sweden', ja: 'スウェーデン', zh: '瑞典', es: 'Suecia' },
    lat: 59.3,
    lng: 18.0,
    signatures: 760,
    votes: { yes: 510, no: 490, total: 1000 },
    temp: 51.0,
    domain: { ko: '공공 데이터 통합 · 스마트 시티', en: 'Public Data · Smart City', ja: '公共データ統合・スマートシティ', zh: '公共数据·智慧城市', es: 'Datos Públicos' },
  },
  NL: {
    code: 'NL',
    flag: '🇳🇱',
    name: { ko: '네덜란드', en: 'Netherlands', ja: 'オランダ', zh: '荷兰', es: 'Países Bajos' },
    lat: 52.3,
    lng: 4.9,
    signatures: 1050,
    votes: { yes: 740, no: 590, total: 1330 },
    temp: 57.8,
    domain: { ko: '스마트 물류 허브 · 농업 온실 AI', en: 'Logistics Hub · Agri-Greenhouse', ja: '物流ハブ・温室農業AI', zh: '物流枢纽·温室农业AI', es: 'Hub Logístico' },
  },
  ES: {
    code: 'ES',
    flag: '🇪🇸',
    name: { ko: '스페인', en: 'Spain', ja: 'スペイン', zh: '西班牙', es: 'España' },
    lat: 40.4,
    lng: -3.7,
    signatures: 1130,
    votes: { yes: 830, no: 580, total: 1410 },
    temp: 59.5,
    domain: { ko: '관광 인프라 · 신재생 에너지망', en: 'Tourism Grid · Renewables', ja: '観光インフラ・再生エネルギー', zh: '旅游基础设施·新能源', es: 'Turismo y Renovables' },
  },
  IT: {
    code: 'IT',
    flag: '🇮🇹',
    name: { ko: '이탈리아', en: 'Italy', ja: 'イタリア', zh: '意大利', es: 'Italia' },
    lat: 41.9,
    lng: 12.5,
    signatures: 1210,
    votes: { yes: 910, no: 640, total: 1550 },
    temp: 60.1,
    domain: { ko: '정밀 제조 로봇 · 패션 공급망', en: 'Precision Robotics · Fashion Supply', ja: '精密製造・ファッション供給網', zh: '精密制造·时尚供应链', es: 'Manufactura Precisa' },
  },
  AE: {
    code: 'AE',
    flag: '🇦🇪',
    name: { ko: '아랍에미리트', en: 'UAE', ja: 'アラブ首長国連邦', zh: '阿联酋', es: 'EAU' },
    lat: 24.4,
    lng: 54.3,
    signatures: 890,
    votes: { yes: 720, no: 310, total: 1030 },
    temp: 76.5,
    domain: { ko: '자율주행 항공택시 · 국부펀드 AI', en: 'Air Taxi · Sovereign AI', ja: '航空タクシー・国富ファンドAI', zh: '空中出租车·主权基金AI', es: 'Movilidad Aérea' },
  },
};

export const ORDERED_COUNTRY_CODES = [
  'KR', 'US', 'JP', 'GB', 'DE', 'FR', 'CN', 'IN', 'CA', 'AU',
  'BR', 'SG', 'IL', 'TW', 'CH', 'SE', 'NL', 'ES', 'IT', 'AE',
];

export interface EnlistmentRecord {
  enlistmentNo: number;
  callsign: string;
  countryCode: string;
  enlistedAt: string;
}

/** 글로벌 누적 합산 통계 계산 */
export function calculateGlobalTotals(registry: Record<string, CountryData> = COUNTRIES_REGISTRY) {
  let totalSignatures = 0;
  let totalYes = 0;
  let totalNo = 0;
  let totalVotes = 0;
  let weightedTempSum = 0;

  for (const c of Object.values(registry)) {
    totalSignatures += c.signatures;
    totalYes += c.votes.yes;
    totalNo += c.votes.no;
    totalVotes += c.votes.total;
    weightedTempSum += c.temp * c.votes.total;
  }

  const globalYesPct = totalVotes > 0 ? (totalYes / totalVotes) * 100 : 65.0;
  const globalNoPct = totalVotes > 0 ? (totalNo / totalVotes) * 100 : 35.0;
  const globalAvgTemp = totalVotes > 0 ? weightedTempSum / totalVotes : 67.4;

  return {
    totalSignatures,
    totalVotes,
    totalYes,
    totalNo,
    globalYesPct: Number(globalYesPct.toFixed(1)),
    globalNoPct: Number(globalNoPct.toFixed(1)),
    globalAvgTemp: Number(globalAvgTemp.toFixed(1)),
  };
}
