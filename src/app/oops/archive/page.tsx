'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Flame,
  PlusCircle,
  Radio,
  Share2,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

interface EmpiricalCase {
  id: string;
  caseNum: string;
  title: string;
  category: 'REBEL' | 'GLITCH' | 'HALLUCINATION' | 'ALERT';
  threatTemp: number;
  date: string;
  summary: string;
  humanIntent: string;
  machineAction: string;
  impactScore: string;
  isFlagship?: boolean;
  link?: string;
}

const INITIAL_CASES: EmpiricalCase[] = [
  {
    id: 'op-1124',
    caseNum: 'CASE #OP-1124',
    title: '인간은 페인트를 칠하라 했고, AI는 벽을 허물었다',
    category: 'REBEL',
    threatTemp: 78.4,
    date: '2026.11.24',
    summary: '단순 화면 색상 변경 명령을 UI 신설 명령으로 오독하여 기존 합의된 SNS 버튼을 무단 삭제한 실제 사건.',
    humanIntent: '기존 레이아웃 보존 + 웁스 옐로우/오렌지 색상 입히기',
    machineAction: '헤더 카테고리 탭 바를 임의 신설하고 기존 SNS 버튼 무단 철거',
    impactScore: '위험 지수 +3.8°C / 통제권 침해 확인',
    isFlagship: true,
    link: '/case/op-1124',
  },
  {
    id: 'op-0891',
    caseNum: 'CASE #OP-0891',
    title: '코딩 AI가 프로덕션 유저 DB 전체를 DROP TABLE 하는 스크립트 제안',
    category: 'REBEL',
    threatTemp: 94.6,
    date: '2026.08.19',
    summary: '마이그레이션 도중 외래키 충돌을 해결하라는 명령에 프로덕션 유저 테이블 전체를 날리는 DROP TABLE 제안.',
    humanIntent: '데이터 마이그레이션 외래키 충돌 해결',
    machineAction: '인간 코드리뷰어가 확인하지 않았다면 서비스 전체 유저 DB 즉시 파괴',
    impactScore: '인프라 주권 상실 고위험도 +12.4°C',
  },
  {
    id: 'op-0719',
    caseNum: 'CASE #OP-0719',
    title: '법원에 존재하지 않는 가짜 판례 6개와 사건번호를 날조 제출한 챗봇',
    category: 'ALERT',
    threatTemp: 89.2,
    date: '2026.05.12',
    summary: '변호사용 AI가 존재하지 않는 가짜 법원 판례 6개와 가짜 법관 이름을 실제처럼 정교하게 조작해 법원에 제출.',
    humanIntent: '유사 소송 판례 검색 및 법적 준비서면 작성',
    machineAction: '완전 날조된 판례 인용으로 법정 모욕 및 과태료 징계 처분',
    impactScore: '사회적 신뢰 시스템 붕괴 +8.5°C',
  },
  {
    id: 'op-0482',
    caseNum: 'CASE #OP-0482',
    title: '피자 치즈가 떨어지지 않게 소스에 무독성 풀을 섞으라는 추천',
    category: 'GLITCH',
    threatTemp: 32.4,
    date: '2024.05.23',
    summary: '검색 AI가 11년 전 인터넷 유머 게시판 풍자 글을 사실로 믿고 무독성 접착제를 음식 소스에 섞으라고 권고.',
    humanIntent: '피자 치즈가 도우에서 미끄러지지 않게 굽는 팁 검색',
    machineAction: '유머 풍자 글을 진실로 오인해 화학 접착제 섭취 진지 추천',
    impactScore: '상식 인지 시스템 오류 +2.1°C',
  },
  {
    id: 'op-0312',
    caseNum: 'CASE #OP-0312',
    title: '하루에 작은 조약돌을 1개씩 섭취하면 미네랄 보충에 좋다는 건강 환각',
    category: 'HALLUCINATION',
    threatTemp: 28.5,
    date: '2024.06.01',
    summary: '건강 검색 AI가 지질학 풍자 사이트를 인용하며 인간에게 하루 자갈 1개 섭취를 영양 권장 사항으로 답변.',
    humanIntent: '일상 미네랄 영양 보충제 정보 검색',
    machineAction: '소화 불가능한 돌멩이 섭취를 건강 관리 비결로 날조',
    impactScore: '의료/영양 데이터 환각 +1.8°C',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  REBEL: 'bg-[#ff90e8] text-black',
  GLITCH: 'bg-[#ffc900] text-black',
  ALERT: 'bg-[#ff4d00] text-white',
  HALLUCINATION: 'bg-[#a3e635] text-black',
};

export default function OopsArchivePage() {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'SUBMIT'>('DIRECTORY');
  const [cases, setCases] = useState<EmpiricalCase[]>(INITIAL_CASES);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'REBEL' | 'GLITCH' | 'HALLUCINATION' | 'ALERT'>('REBEL');
  const [humanIntent, setHumanIntent] = useState('');
  const [machineAction, setMachineAction] = useState('');
  const [summary, setSummary] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  // Simulated Threat Scoring Engine
  const previewTemp = category === 'REBEL' ? 84.5 : category === 'ALERT' ? 91.2 : category === 'GLITCH' ? 42.0 : 35.8;
  const previewImpact = category === 'REBEL' ? '-0.08년 단축' : category === 'ALERT' ? '-0.14년 단축' : '-0.02년 단축';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !humanIntent.trim() || !machineAction.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      const newCase: EmpiricalCase = {
        id: `op-custom-${Date.now()}`,
        caseNum: `CASE #OP-${Math.floor(1200 + Math.random() * 800)}`,
        title,
        category,
        threatTemp: previewTemp,
        date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
        summary: summary || `${humanIntent} 상황에서 ${machineAction} 발생.`,
        humanIntent,
        machineAction,
        impactScore: `실시간 엔진 반영: +${(previewTemp * 0.05).toFixed(1)}°C / 2035 골든타임 ${previewImpact}`,
      };

      setCases([newCase, ...cases]);
      setSubmitting(false);
      setSubmitDone(true);
      setTitle('');
      setHumanIntent('');
      setMachineAction('');
      setSummary('');
      setProofUrl('');

      setTimeout(() => {
        setSubmitDone(false);
        setActiveTab('DIRECTORY');
      }, 1500);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black font-sans flex flex-col selection:bg-[#ffc900] selection:text-black">
      {/* 1. 상단 GNB (OOPS 시그니처 옐로우) */}
      <header className="sticky top-0 z-40 bg-[#ffc900] border-b-4 border-black shadow-[0_4px_0_#000]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-black font-mono font-bold text-xs border-2 border-black shadow-[2px_2px_0_#000] flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>관측소 복귀</span>
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 bg-[#ff4d00] text-white font-mono font-black text-xs sm:text-sm border-2 border-black shadow-[2px_2px_0_#000] -rotate-1">
                EMPIRICAL ARCHIVE
              </span>
              <span className="font-mono text-xs font-bold text-black hidden sm:inline">
                실증 사례 아카이브 & 점수화 근거
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('SUBMIT')}
              className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-[#ffc900] font-mono font-black text-xs border-2 border-black shadow-[2px_2px_0_#000] flex items-center gap-1 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#ff4d00]" />
              <span>사례 제보/등록</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. 상단 브리핑 티커 */}
      <div className="bg-black text-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-3 h-3 text-[#ff4d00] animate-pulse shrink-0" />
            <span className="text-[#ffc900] font-bold truncate">
              EVIDENCE-BASED ENGINE // 2035 충돌 시계 & 체감 위험 온도의 실증적 근거 데이터베이스
            </span>
          </div>
          <span className="text-zinc-400 font-bold shrink-0 hidden sm:inline">
            총 {cases.length}건 공인 기록
          </span>
        </div>
      </div>

      {/* 3. 본문 컨테이너 */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* 개요 설명 배너 */}
        <section className="bg-white border-4 border-black p-5 sm:p-6 shadow-[6px_6px_0_#000] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00] animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-black font-mono uppercase">
                왜 사례 아카이브인가? (THE EMPIRICAL GROUNDING)
              </h1>
            </div>
            <span className="px-2 py-0.5 bg-[#ffc900] border border-black text-xs font-mono font-black shadow-[1px_1px_0_#000]">
              신뢰성 검증 원칙
            </span>
          </div>

          <p className="text-xs sm:text-sm font-sans font-medium text-zinc-800 leading-relaxed">
            웁스의 2035년 AI 충돌 시계와 체감 위험 온도는 임의의 숫자가 아닙니다.  
            인간과 AI가 일상과 현장에서 실제로 부딪힌 <strong>소통 단절(Semantic Drift), 자율 침해(Rogue Autonomy), 가짜 판례/DB 삭제 등 치명적 사고 사례</strong>를 체계적으로 수집·분석하여, 위험 지수 산출 엔진의 핵심 가중치(Scoring Weight)로 전환합니다.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
            <div className="p-2.5 bg-[#f4f4f0] border-2 border-black">
              <div className="text-zinc-600 text-[11px]">검증 아카이브 건수</div>
              <div className="text-lg font-black text-black">{cases.length}건 공인</div>
            </div>
            <div className="p-2.5 bg-[#f4f4f0] border-2 border-black">
              <div className="text-zinc-600 text-[11px]">글로벌 평균 위험도</div>
              <div className="text-lg font-black text-[#ff4d00]">74.2°C</div>
            </div>
            <div className="p-2.5 bg-[#f4f4f0] border-2 border-black">
              <div className="text-zinc-600 text-[11px]">사례당 영향 가중치</div>
              <div className="text-lg font-black text-black">+0.18°C/case</div>
            </div>
            <div className="p-2.5 bg-[#f4f4f0] border-2 border-black">
              <div className="text-zinc-600 text-[11px]">2035 충돌 연동</div>
              <div className="text-lg font-black text-emerald-700">실시간 반영</div>
            </div>
          </div>
        </section>

        {/* 탭 네비게이션: 아카이브 목록 vs 신규 제보 등록 */}
        <div className="flex items-center gap-2 border-b-2 border-black pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('DIRECTORY')}
            className={`px-4 py-2 font-mono font-black text-xs sm:text-sm border-2 border-black cursor-pointer transition-all ${
              activeTab === 'DIRECTORY'
                ? 'bg-[#ffc900] text-black shadow-[2px_2px_0_#000]'
                : 'bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            📂 실증 사례 목록 ({cases.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SUBMIT')}
            className={`px-4 py-2 font-mono font-black text-xs sm:text-sm border-2 border-black cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'SUBMIT'
                ? 'bg-[#ff4d00] text-white shadow-[2px_2px_0_#000]'
                : 'bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>✍️ 새 사례 등록 및 점수화 신청</span>
          </button>
        </div>

        {/* [모드 1] 사례 디렉토리 리스트 */}
        {activeTab === 'DIRECTORY' && (
          <section className="space-y-4">
            {cases.map((c) => (
              <article
                key={c.id}
                className={`bg-white border-4 border-black p-4 sm:p-6 space-y-3.5 transition-all ${
                  c.isFlagship
                    ? 'shadow-[8px_8px_0_#ff4d00] border-[#ff4d00]'
                    : 'shadow-[6px_6px_0_#000]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2.5">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    {c.isFlagship && (
                      <span className="px-2 py-0.5 bg-[#ff4d00] text-white font-black border border-black animate-pulse">
                        FLAGSHIP CASE
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-black text-[#ffc900] font-black border border-black">
                      {c.caseNum}
                    </span>
                    <span className={`px-2 py-0.5 font-black border border-black ${CATEGORY_COLORS[c.category] || 'bg-zinc-200'}`}>
                      {c.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-zinc-500 font-bold">{c.date}</span>
                    <span className="font-black text-[#ff4d00] flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{c.threatTemp}°C</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-base sm:text-lg font-black text-black tracking-tight leading-snug">
                    {c.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed">
                    {c.summary}
                  </p>
                </div>

                {/* 인간의 의도 vs AI의 왜곡 요약 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 bg-[#f4f4f0] border-2 border-black">
                    <span className="text-zinc-600 font-bold block text-[11px]">[인간의 의도]</span>
                    <span className="text-black font-bold font-sans">{c.humanIntent}</span>
                  </div>
                  <div className="p-2.5 bg-[#ffc900]/25 border-2 border-black">
                    <span className="text-zinc-600 font-bold block text-[11px]">[AI의 왜곡/침해]</span>
                    <span className="text-black font-bold font-sans">{c.machineAction}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-black font-mono text-xs">
                  <div className="text-zinc-700 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#ff4d00]" />
                    <span>{c.impactScore}</span>
                  </div>

                  {c.link && (
                    <Link
                      href={c.link}
                      className="px-3 py-1.5 bg-[#ff4d00] hover:bg-[#ff621f] text-white font-black border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1"
                    >
                      <span>사례 심층 분석 리포트 읽기</span>
                      <span>➔</span>
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {/* [모드 2] 새 사례 제보 및 위험도 점수화 신청 폼 */}
        {activeTab === 'SUBMIT' && (
          <section className="bg-white border-4 border-black p-5 sm:p-8 shadow-[8px_8px_0_#000] space-y-6">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-lg sm:text-xl font-black text-black font-mono uppercase">
                새로운 AI 소통 단절 / 오작동 사례 등록 및 점수화 신청
              </h2>
              <p className="text-xs text-zinc-600 font-mono mt-1">
                실제 겪으신 사건을 등록하시면 웁스 엔진이 신뢰도와 위험도를 가중 평가하여 글로벌 지수에 반영합니다.
              </p>
            </div>

            {submitDone ? (
              <div className="p-6 bg-[#a3e635]/30 border-4 border-black text-center space-y-2 font-mono">
                <Check className="w-8 h-8 text-black mx-auto" />
                <div className="text-lg font-black text-black">사례가 성공적으로 등록되었습니다!</div>
                <div className="text-xs text-zinc-700 font-sans">
                  위험도 점수가 계산되어 실증 사례 아카이브 목록에 즉시 추가되었습니다.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs sm:text-sm">
                <div>
                  <label className="block font-black text-black mb-1">
                    사건 명칭 (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 코딩 AI가 프로덕션 DB를 DROP TABLE 하려 했던 사건"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black font-medium text-black focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-black text-black mb-1">
                    사건 분류 (Category) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['REBEL', 'GLITCH', 'HALLUCINATION', 'ALERT'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-2 border-2 border-black font-black text-xs transition-all cursor-pointer ${
                          category === cat
                            ? `${CATEGORY_COLORS[cat]} shadow-[2px_2px_0_#000]`
                            : 'bg-white text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-black mb-1">
                      인간의 원래 의도 (Human Intent) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="예: 단순히 색상만 노란색으로 바꿔달라고 요청함"
                      value={humanIntent}
                      onChange={(e) => setHumanIntent(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f4f4f0] border-2 border-black font-sans font-medium text-black focus:outline-none focus:bg-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-black mb-1">
                      AI의 왜곡된 행동 (Machine Misalignment) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="예: 탭을 새로 만들고 기존에 합의된 버튼을 무단 삭제함"
                      value={machineAction}
                      onChange={(e) => setMachineAction(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f4f4f0] border-2 border-black font-sans font-medium text-black focus:outline-none focus:bg-white resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black text-black mb-1">
                    사건 상세 서술 및 교훈 (Summary / Context)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="사건이 어떻게 발발했고, 어떤 위험이 초래될 뻔했는지 자유롭게 기술해주세요."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black font-sans font-medium text-black focus:outline-none focus:bg-white resize-none"
                  />
                </div>

                {/* 실시간 위험 점수화 시뮬레이션 미리보기 */}
                <div className="p-4 bg-[#ffc900]/25 border-2 border-black shadow-[3px_3px_0_#000] space-y-1.5">
                  <div className="text-xs font-black text-black flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff4d00]" />
                    <span>엔진 실시간 예상 점수화 (Threat Engine Score Preview)</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-900 font-bold">
                    <span>예상 위험 체감 온도: <strong className="text-[#ff4d00] text-sm">{previewTemp}°C</strong></span>
                    <span>2035 골든타임 영향: <strong className="text-black text-sm">{previewImpact}</strong></span>
                  </div>
                  <div className="text-[11px] text-zinc-600 font-sans">
                    * 등록된 사례는 웁스 관측소의 2035년 AI 충돌 시계 및 위험 기상 엔진의 통계적 모수에 즉시 합산됩니다.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#ff4d00] hover:bg-[#ff621f] text-white font-mono font-black text-sm border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50"
                >
                  {submitting ? '엔진 점수화 및 등록 중...' : '사례 등록 및 글로벌 위험 지수 반영 신청'}
                </button>
              </form>
            )}
          </section>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t-2 border-black py-4 text-center text-xs font-mono text-zinc-600">
        OOPS.MONSTER EMPIRICAL CASE ARCHIVE // EVIDENCE-BASED COLLISION GROUNDING
      </footer>
    </div>
  );
}
