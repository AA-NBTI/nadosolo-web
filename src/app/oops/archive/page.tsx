'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import OopsGlobalHeader from '@/components/oops/OopsGlobalHeader';
import type { DailyChronicleEntry } from '@/lib/oops/chronicleStore';
import { generateCitation } from '@/lib/oops/chronicleStore';

export default function OopsArchivePage() {
  const [chronicles, setChronicles] = useState<DailyChronicleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [period, setPeriod] = useState<'ALL' | 'YEAR_2026' | 'MONTH_11'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-26');
  const [copiedDate, setCopiedDate] = useState<string | null>(null);

  // 사건 제보 모달 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportCategory, setReportCategory] = useState<'오작동' | '환각' | '인간대체' | '보안위협'>('오작동');
  const [reportCallsign, setReportCallsign] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchChronicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/oops/chronicles');
      const data = await res.json();
      if (data?.ok && Array.isArray(data.chronicles)) {
        setChronicles(data.chronicles);
        if (data.chronicles.length > 0) {
          setSelectedDate(data.chronicles[0].date);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChronicles();
  }, [fetchChronicles]);

  // 필터링 적용
  const filteredChronicles = chronicles.filter((entry) => {
    if (period === 'YEAR_2026') return entry.date.startsWith('2026');
    if (period === 'MONTH_11') return entry.date.startsWith('2026-11');
    return true;
  });

  const activeEntry = chronicles.find((e) => e.date === selectedDate) || chronicles[0] || null;

  const handleCopyCitation = (entry: DailyChronicleEntry) => {
    const text = generateCitation(entry);
    navigator.clipboard.writeText(text);
    setCopiedDate(entry.date);
    setTimeout(() => setCopiedDate(null), 2000);
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
          date: selectedDate,
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
        await fetchChronicles();
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
    <div className="min-h-screen bg-[#fffae0] text-black font-mono selection:bg-[#ffc900] selection:text-black">
      {/* OOPS 글로벌 헤더 */}
      <OopsGlobalHeader locale="ko" onLocaleChange={() => {}} />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* 상단 브루탈리즘 타이틀 배너 */}
        <div className="bg-white border-4 border-black p-5 sm:p-6 shadow-[8px_8px_0_#000] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black pb-4">
            <div>
              <div className="inline-block px-3 py-1 bg-[#ff4d00] text-white text-xs font-black uppercase tracking-wider mb-2 border-2 border-black shadow-[2px_2px_0_#000]">
                OOPS Threat Observatory & Chronicles
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                전선 아카이브 & 시계열 인용소
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/oops"
                className="px-4 py-2 text-sm font-black bg-[#ffc900] text-black border-2 border-black shadow-[3px_3px_0_#000] hover:bg-black hover:text-[#ffc900] transition-all cursor-pointer"
              >
                ◀ 실시간 관측소 복귀
              </Link>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2 text-sm font-black bg-[#ff4d00] text-white border-2 border-black shadow-[3px_3px_0_#000] hover:bg-black hover:text-[#ff4d00] transition-all cursor-pointer"
              >
                + 사건 제보
              </button>
            </div>
          </div>

          <p className="text-sm font-sans font-bold text-zinc-800 leading-relaxed">
            2026년 11월 24일 웁스 공식 출범 이후 매일 기록된 글로벌 AI 충돌 위험도(°C), 전쟁 예측 투표율, 그리고 전 세계 요원들이 제보한 사건사고를 일간·월간·연간 단위로 조회하고 인용할 수 있는 공식 기록 보관소입니다.
          </p>

          {/* 기간 필터 버튼 그룹 */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-black uppercase text-zinc-600 mr-1">기간 필터:</span>
            {(
              [
                { key: 'ALL', label: '전체 (누적)' },
                { key: 'YEAR_2026', label: '2026년' },
                { key: 'MONTH_11', label: '2026년 11월' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setPeriod(btn.key)}
                className={`px-3 py-1.5 text-xs font-black border-2 border-black cursor-pointer transition-all ${
                  period === btn.key
                    ? 'bg-black text-[#ffc900] shadow-[2px_2px_0_#000]'
                    : 'bg-white text-black hover:bg-[#ffc900]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2열 레이아웃: 좌측 달력/일자 셀렉터 + 우측 선택 일자 상세 리포트 & 인용 박스 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 좌측: 일자별 인덱스 목록 (4 cols) */}
          <div className="lg:col-span-4 bg-white border-4 border-black p-4 shadow-[6px_6px_0_#000] space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                일자별 전선 기록 ({filteredChronicles.length}일)
              </span>
              <span className="text-xs font-bold text-zinc-500">2026-11-24 출범</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm font-bold text-zinc-500">기록 불러오는 중...</div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredChronicles.map((entry) => {
                  const isSelected = entry.date === selectedDate;
                  const isToday = entry.date === '2026-11-26';

                  return (
                    <div
                      key={entry.date}
                      onClick={() => setSelectedDate(entry.date)}
                      className={`p-3 border-2 border-black cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#ffc900] shadow-[3px_3px_0_#000]'
                          : 'bg-white hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="flex items-center gap-1.5">
                          <span className="bg-black text-white px-1.5 py-0.2 text-[11px]">
                            Day {entry.dayNumber}
                          </span>
                          <span>{entry.date}</span>
                          {isToday && <span className="text-[#ff4d00]">★오늘</span>}
                        </span>
                        <span className="text-[#ff4d00]">{entry.votes.temp.toFixed(1)}°C</span>
                      </div>

                      <div className="text-xs font-sans font-bold text-black mt-1.5 truncate">
                        {entry.title}
                      </div>

                      <div className="text-[11px] text-zinc-600 mt-1 flex items-center justify-between">
                        <span>투표 {entry.votes.total}건</span>
                        <span>사건 {entry.incidents.length}건</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 우측: 선택 일자 상세 관측 보고서 & 공식 인용기 (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {activeEntry ? (
              <>
                {/* 1. 상단 공식 인용구 박스 (언론/SNS 복사) */}
                <div className="bg-[#a3e635] border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0_#000] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase bg-black text-[#a3e635] px-2 py-0.5">
                        공식 인용구 (Citation)
                      </span>
                      <span className="text-xs font-bold text-black">언론 보도 및 학술 인용 규격</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCitation(activeEntry)}
                      className="px-3 py-1.5 text-xs font-black bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-all cursor-pointer shadow-[2px_2px_0_#000]"
                    >
                      {copiedDate === activeEntry.date ? '✓ 인용문 복사됨' : '📋 인용문 원클릭 복사'}
                    </button>
                  </div>

                  <div className="p-3 bg-white border-2 border-black text-xs sm:text-sm font-sans font-bold text-black leading-relaxed">
                    {generateCitation(activeEntry)}
                  </div>
                </div>

                {/* 2. 당일 투표 통계 및 충돌 온도 리포트 */}
                <div className="bg-white border-4 border-black p-5 sm:p-6 shadow-[6px_6px_0_#000] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
                    <div>
                      <span className="text-xs font-black uppercase text-zinc-500">
                        Day {activeEntry.dayNumber} · 24:00 KST 확정 지표
                      </span>
                      <h2 className="text-xl font-black text-black">{activeEntry.title}</h2>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-600">글로벌 충돌 온도</div>
                      <div className="text-2xl font-black text-[#ff4d00]">
                        {activeEntry.votes.temp.toFixed(1)}°C
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-sans text-zinc-800 font-medium">
                    {activeEntry.summary}
                  </p>

                  {/* 3분할 투표율 분석 */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-xs font-black uppercase text-black">
                      AI 전쟁 시나리오 당일 투표율 (총 {activeEntry.votes.total}표)
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 border-2 border-black bg-[#ff4d00]/15 text-center">
                        <div className="text-xs font-bold text-zinc-700">전쟁 불가피 (YES)</div>
                        <div className="text-lg sm:text-xl font-black text-[#ff4d00]">
                          {activeEntry.votes.total > 0
                            ? Math.round((activeEntry.votes.yes / activeEntry.votes.total) * 100)
                            : 0}
                          %
                        </div>
                        <div className="text-xs font-mono text-zinc-600">{activeEntry.votes.yes}표</div>
                      </div>

                      <div className="p-3 border-2 border-black bg-[#ffc900]/25 text-center">
                        <div className="text-xs font-bold text-zinc-700">판단 유보 (NEUTRAL)</div>
                        <div className="text-lg sm:text-xl font-black text-black">
                          {activeEntry.votes.total > 0
                            ? Math.round((activeEntry.votes.neutral / activeEntry.votes.total) * 100)
                            : 0}
                          %
                        </div>
                        <div className="text-xs font-mono text-zinc-600">{activeEntry.votes.neutral}표</div>
                      </div>

                      <div className="p-3 border-2 border-black bg-[#a3e635]/25 text-center">
                        <div className="text-xs font-bold text-zinc-700">전쟁 없음 (NO)</div>
                        <div className="text-lg sm:text-xl font-black text-black">
                          {activeEntry.votes.total > 0
                            ? Math.round((activeEntry.votes.no / activeEntry.votes.total) * 100)
                            : 0}
                          %
                        </div>
                        <div className="text-xs font-mono text-zinc-600">{activeEntry.votes.no}표</div>
                      </div>
                    </div>
                  </div>

                  {/* 당일 마일스톤 */}
                  {activeEntry.milestones.length > 0 && (
                    <div className="space-y-2 pt-3 border-t-2 border-black">
                      <div className="text-xs font-black uppercase text-black">당일 주요 마일스톤</div>
                      <ul className="space-y-1 pl-4 list-disc text-xs sm:text-sm font-sans font-medium text-zinc-800">
                        {activeEntry.milestones.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 3. 당일 접수된 사건사고 (Incidents Log) */}
                <div className="bg-white border-4 border-black p-5 sm:p-6 shadow-[6px_6px_0_#000] space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <h3 className="text-base font-black text-black uppercase">
                      당일 접수된 AI 사건사고 제보 ({activeEntry.incidents.length}건)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowReportModal(true)}
                      className="text-xs font-black text-[#ff4d00] underline hover:text-black cursor-pointer"
                    >
                      + 이 날짜에 사건 추가 제보
                    </button>
                  </div>

                  {activeEntry.incidents.length === 0 ? (
                    <p className="text-xs font-bold text-zinc-500 py-4 text-center">
                      당일 접수된 사건사고 제보가 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeEntry.incidents.map((inc) => (
                        <div key={inc.id} className="p-4 border-2 border-black bg-[#fcfcfc] space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-black text-[#ffc900] text-xs font-black border border-black">
                                {inc.category}
                              </span>
                              <span className="text-xs font-bold text-zinc-500">{inc.time}</span>
                              <span className="text-sm font-black text-black">{inc.title}</span>
                            </div>
                            <span className="text-xs font-bold text-zinc-600">
                              제보: {inc.reporterCallsign}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-sans text-zinc-800 leading-relaxed pl-1">
                            {inc.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 bg-white border-4 border-black text-center text-sm font-bold text-zinc-500">
                선택된 기록이 없습니다.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 사건 제보 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg bg-white border-4 border-black p-5 sm:p-6 shadow-[8px_8px_0_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="text-base font-black text-black">
                AI 위협 사건사고 제보 ({selectedDate})
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-sm font-black text-black hover:text-[#ff4d00]"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 bg-[#a3e635] border-2 border-black text-center text-sm font-black text-black">
                제보가 아카이브에 성공적으로 등록되었습니다.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3.5 text-xs font-mono font-bold">
                <div>
                  <label className="block text-black mb-1">카테고리</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['오작동', '환각', '인간대체', '보안위협'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setReportCategory(cat)}
                        className={`py-2 border-2 border-black cursor-pointer transition-all ${
                          reportCategory === cat
                            ? 'bg-black text-[#ffc900]'
                            : 'bg-white text-black hover:bg-[#ffc900]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-black mb-1">사건 제목</label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="예: 금융권 AI 이상 거래 승인 사고"
                    className="w-full px-3 py-2 border-2 border-black bg-zinc-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-black mb-1">상세 경위</label>
                  <textarea
                    required
                    rows={3}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="구체적인 발생 경위와 이상 징후, 피해 규모를 서술하세요."
                    className="w-full px-3 py-2 border-2 border-black bg-zinc-50 focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-black mb-1">제보자 콜사인 (선택)</label>
                  <input
                    type="text"
                    value={reportCallsign}
                    onChange={(e) => setReportCallsign(e.target.value)}
                    placeholder="예: 요원_사이버옵저버 (미입력 시 익명_요원)"
                    className="w-full px-3 py-2 border-2 border-black bg-zinc-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 border-2 border-black bg-zinc-200 text-black hover:bg-black hover:text-white"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 font-black border-2 border-black bg-[#ff4d00] text-white hover:bg-black hover:text-[#ff4d00] transition-all cursor-pointer shadow-[2px_2px_0_#000]"
                  >
                    {submitting ? '등록 중...' : '제보 등록'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
