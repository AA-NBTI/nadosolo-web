'use client';

import React, { useState } from 'react';
import type { DailyChronicleEntry, DailyIncident } from '@/lib/oops/chronicleStore';

interface OopsChroniclesTimelineProps {
  chronicles: DailyChronicleEntry[];
  todayDateStr?: string;
  onRefresh?: () => void;
}

export default function OopsChroniclesTimeline({
  chronicles,
  todayDateStr = '2026-11-26',
  onRefresh,
}: OopsChroniclesTimelineProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(todayDateStr);
  const [showReportModal, setShowReportModal] = useState(false);

  // 제보 폼 상태
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportCategory, setReportCategory] = useState<'오작동' | '환각' | '인간대체' | '보안위협'>('오작동');
  const [reportCallsign, setReportCallsign] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const toggleExpand = (date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDesc.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/oops/chronicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPORT_INCIDENT',
          date: todayDateStr,
          title: reportTitle.trim(),
          description: reportDesc.trim(),
          category: reportCategory,
          reporterCallsign: reportCallsign.trim() || '익명_요원',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setReportSuccess(true);
        setReportTitle('');
        setReportDesc('');
        onRefresh?.();
        setTimeout(() => {
          setReportSuccess(false);
          setShowReportModal(false);
        }, 1200);
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-[#0c0d12] border border-white/10 text-white font-mono p-4 sm:p-6 space-y-5">
      {/* 표준 테두리 헤더 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border border-white/10 bg-[#13151b]">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            전선 연혁 및 일일 관측소
          </h2>
          <span className="text-sm px-2 py-0.5 border border-white/10 text-zinc-400 bg-white/5">
            2026-11-24 출범 · 누적 {chronicles.length}일
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-3 py-1.5 text-sm font-bold border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            + 사건 제보
          </button>
        </div>
      </div>

      {/* 2열 컴팩트 그리드 목록 (List-First, Click-to-Reveal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {chronicles.map((entry) => {
          const isExpanded = expandedDate === entry.date;
          const isToday = entry.date === todayDateStr;

          return (
            <React.Fragment key={entry.date}>
              <div
                onClick={() => toggleExpand(entry.date)}
                className={`p-4 border transition-all cursor-pointer select-none space-y-3 ${
                  isExpanded
                    ? 'border-white/40 bg-[#161922]'
                    : 'border-white/10 bg-[#111218] hover:border-white/25 hover:bg-[#14161f]'
                } ${isToday ? 'relative ring-1 ring-[#f04f74]/40' : ''}`}
              >
                {/* 상단 메타 라벨 */}
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Day {entry.dayNumber}</span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-zinc-300">{entry.date}</span>
                    {isToday && (
                      <span className="px-1.5 py-0.2 border border-[#f04f74]/40 text-[#f04f74] text-sm font-bold bg-[#f04f74]/10">
                        오늘
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-200">
                      충돌 온도 {entry.votes.temp}°C
                    </span>
                    <span className="text-zinc-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* 타이틀 및 요약문 */}
                <div>
                  <h3 className="text-base font-bold text-white">{entry.title}</h3>
                  <p className="text-sm text-zinc-300 mt-1 line-clamp-1">{entry.summary}</p>
                </div>

                {/* 하단 투표 및 제보 건수 요약 배지 */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-sm text-zinc-400">
                  <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-zinc-200">
                    투표 {entry.votes.total}건 (찬성 {entry.votes.yes} · 반대 {entry.votes.no})
                  </span>
                  <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-zinc-300">
                    사건 제보 {entry.incidents.length}건
                  </span>
                </div>
              </div>

              {/* 클릭 시 2열 전체폭 확장 상세 뷰 (col-span-full) */}
              {isExpanded && (
                <div className="col-span-full p-5 border border-white/30 bg-[#13151c] space-y-5">
                  {/* 상단 일지 헤더 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                      <span className="text-base font-bold text-white">
                        {entry.date} 전선 기록 (Day {entry.dayNumber})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedDate(null)}
                      className="px-2.5 py-1 text-sm border border-white/20 bg-white/5 hover:bg-white/15 text-zinc-200"
                    >
                      접기
                    </button>
                  </div>

                  {/* 마일스톤 및 주요 결정사항 */}
                  {entry.milestones.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-bold text-zinc-400">당일 주요 마일스톤</span>
                      <ul className="space-y-1.5 pl-4 list-disc text-sm text-zinc-200">
                        {entry.milestones.map((ms, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {ms}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 당일 사건사고 제보 목록 */}
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-400">
                        접수된 전선 사건사고 ({entry.incidents.length}건)
                      </span>
                      {isToday && (
                        <button
                          type="button"
                          onClick={() => setShowReportModal(true)}
                          className="text-sm text-zinc-300 underline font-bold hover:text-white"
                        >
                          + 사건 제보하기
                        </button>
                      )}
                    </div>

                    {entry.incidents.length === 0 ? (
                      <p className="text-sm text-zinc-500 py-3">당일 접수된 사건사고 제보가 없습니다.</p>
                    ) : (
                      <div className="space-y-2">
                        {entry.incidents.map((inc) => (
                          <div
                            key={inc.id}
                            className="p-3 border border-white/10 bg-[#0d0e14] space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 border border-white/20 bg-white/10 text-white font-bold">
                                  {inc.category}
                                </span>
                                <span className="text-zinc-400 font-bold">{inc.time}</span>
                                <span className="text-white font-bold">{inc.title}</span>
                              </div>
                              <span className="text-sm text-zinc-400">제보: {inc.reporterCallsign}</span>
                            </div>
                            <p className="text-sm text-zinc-300 pl-1 leading-relaxed">
                              {inc.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 사건 제보 모달 다이얼로그 */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg bg-[#0f1118] border border-white/30 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
                <h3 className="text-base font-bold text-white">AI 위협 사건사고 제보</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-sm text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 border border-white/20 bg-white/5 text-center text-sm font-bold text-white">
                사건 제보가 전선 일지에 정상 등록되었습니다.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-1">카테고리</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['오작동', '환각', '인간대체', '보안위협'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setReportCategory(cat)}
                        className={`py-1.5 text-sm font-bold border transition-all ${
                          reportCategory === cat
                            ? 'border-white bg-white text-black'
                            : 'border-white/20 bg-white/5 text-zinc-300 hover:border-white/40'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-1">사건 제목</label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="예: 글로벌 금융 결제망 AI 승인 오류"
                    className="w-full px-3 py-2 text-sm bg-black border border-white/20 text-white placeholder-zinc-600 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-1">상세 내용</label>
                  <textarea
                    required
                    rows={3}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="발생 경위 및 피해, AI 시스템의 이상 징후를 간략히 서술"
                    className="w-full px-3 py-2 text-sm bg-black border border-white/20 text-white placeholder-zinc-600 focus:outline-none focus:border-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-1">
                    제보자 콜사인 (선택)
                  </label>
                  <input
                    type="text"
                    value={reportCallsign}
                    onChange={(e) => setReportCallsign(e.target.value)}
                    placeholder="예: 요원_사이버감시 (미입력 시 익명_요원)"
                    className="w-full px-3 py-2 text-sm bg-black border border-white/20 text-white placeholder-zinc-600 focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-sm border border-white/20 bg-white/5 text-zinc-300 hover:bg-white/10"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-bold border border-white bg-white text-black hover:bg-zinc-200 transition-all cursor-pointer"
                  >
                    {submitting ? '등록 중...' : '제보'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
