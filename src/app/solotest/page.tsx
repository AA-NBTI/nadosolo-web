'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Share2,
  Calendar,
  MapPin,
  Check,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Users,
  Bell,
  Clock,
} from 'lucide-react';
import GlobalHeader from '@/components/GlobalHeader';
import {
  SOLOTEST_QUESTIONS,
  SOLOTEST_COPY,
  SOLOTEST_VERSION,
  computeSoloTestResult,
  SoloTestResultOutput,
} from '@/lib/solotest/data';

interface RoomItem {
  id: string;
  title: string;
  dateText: string;
  area: string;
  regionName: string;
  districtName: string;
  timeSlot: string;
  priceKrw: number;
  maxSeats: number;
  currentParticipants: number;
  remainingSeats: number;
  status: string;
  theme: string;
}

function SoloTestInner() {
  const router = useRouter();

  // 화면 단계: INTRO | TEST | RESULT
  const [step, setStep] = useState<'INTRO' | 'TEST' | 'RESULT'>('INTRO');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [sessionId, setSessionId] = useState<string>('');

  // 결과 데이터
  const [result, setResult] = useState<SoloTestResultOutput | null>(null);

  // 열린 방 필터 및 데이터
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('전체');
  const [selectedTime, setSelectedTime] = useState<string>('전체');
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);

  // 대기 신청 폼 상태
  const [waitlistContact, setWaitlistContact] = useState<string>('');
  const [waitlistArea, setWaitlistArea] = useState<string>('강남');
  const [waitlistTime, setWaitlistTime] = useState<string>('금요일 저녁');
  const [waitlistConsent, setWaitlistConsent] = useState<boolean>(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState<boolean>(false);
  const [waitlistMessage, setWaitlistMessage] = useState<string>('');

  // 공유 알림 토스트
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // 세션 ID 초기화 및 중도 이탈 추적
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let sId = sessionStorage.getItem('solotest_session_id');
    if (!sId) {
      sId = `solo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem('solotest_session_id', sId);
    }
    setSessionId(sId);

    // 이전 세션 응답 복원 (새로고침 안정성)
    const savedAnswers = sessionStorage.getItem('solotest_answers');
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        if (parsed && Object.keys(parsed).length > 0) {
          setAnswers(parsed);
          const computed = computeSoloTestResult(parsed);
          if (Object.keys(parsed).length >= SOLOTEST_QUESTIONS.length) {
            setResult(computed);
            setStep('RESULT');
          }
        }
      } catch {}
    }
  }, []);

  // 분석 이벤트 전송 헬퍼
  const trackEvent = (eventName: string, payload?: Record<string, any>) => {
    try {
      fetch('/api/solotest/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventName,
          answers,
          result,
          ...payload,
        }),
      }).catch(() => {});
    } catch {}
  };

  // 인트로에서 시작 클릭
  const handleStartTest = () => {
    trackEvent('test_start');
    setStep('TEST');
    setCurrentIdx(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 인트로에서 '이번 주 열린 모임 보기' 클릭 시 결과 모임 섹션 렌더
  const handleViewOpenRoomsDirectly = () => {
    trackEvent('room_browse_direct');
    const defaultComputed = computeSoloTestResult({ Q1: 'after_work' });
    setResult(defaultComputed);
    setStep('RESULT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 문항 선택 처리 (Q1~Q7: 단일 선택 자동 넘김, Q8: 다중 선택)
  const currentQuestion = SOLOTEST_QUESTIONS[currentIdx];
  const totalQuestions = SOLOTEST_QUESTIONS.length;

  const handleSelectSingle = (value: string | number) => {
    if (!currentQuestion) return;
    const nextAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(nextAnswers);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('solotest_answers', JSON.stringify(nextAnswers));
    }

    trackEvent(`q${currentIdx + 1}_answer`, {
      questionId: currentQuestion.id,
      value,
    });

    if (currentIdx < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 190);
    } else {
      finalizeTest(nextAnswers);
    }
  };

  // Q8 다중 선택 토글
  const handleToggleMulti = (opt: string) => {
    if (!currentQuestion) return;
    const currentList: string[] = Array.isArray(answers[currentQuestion.id])
      ? answers[currentQuestion.id]
      : [];

    let nextList: string[];
    if (currentList.includes(opt)) {
      nextList = currentList.filter((item) => item !== opt);
    } else {
      if (currentQuestion.max && currentList.length >= currentQuestion.max) {
        return;
      }
      nextList = [...currentList, opt];
    }

    const nextAnswers = { ...answers, [currentQuestion.id]: nextList };
    setAnswers(nextAnswers);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('solotest_answers', JSON.stringify(nextAnswers));
    }
  };

  // 이전 버튼
  const handlePrevStep = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    } else {
      setStep('INTRO');
    }
  };

  // 테스트 완료 및 결과 산출
  const finalizeTest = (finalAnswers: Record<string, any>) => {
    const computed = computeSoloTestResult(finalAnswers);
    setResult(computed);
    setStep('RESULT');

    trackEvent('test_complete', { result: computed });
    trackEvent('result_view', {
      context: computed.context,
      style: computed.style,
      need: computed.need,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 결과 화면에서 열린 방 불러오기 (GET /api/rooms)
  useEffect(() => {
    if (step !== 'RESULT') return;
    setIsLoadingRooms(true);

    const themeParam = result?.theme || '';
    const areaParam = selectedArea !== '전체' ? selectedArea : '';
    const timeParam = selectedTime !== '전체' ? selectedTime : '';

    const params = new URLSearchParams();
    if (themeParam) params.set('theme', themeParam);
    if (areaParam) params.set('area', areaParam);
    if (timeParam) params.set('time', timeParam);

    fetch(`/api/rooms?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.rooms)) {
          setRooms(data.rooms);
        } else {
          setRooms([]);
        }
      })
      .catch(() => setRooms([]))
      .finally(() => setIsLoadingRooms(false));
  }, [step, result?.theme, selectedArea, selectedTime]);

  // 대기 신청 제출
  const handleSubmitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistContact.trim()) {
      alert('연락처를 입력해 주세요.');
      return;
    }
    if (!waitlistConsent) {
      alert('알림 수신 동의가 필요합니다.');
      return;
    }

    try {
      const res = await fetch('/api/solotest/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          contact: waitlistContact.trim(),
          contactType: 'PHONE',
          area: waitlistArea,
          timeSlot: waitlistTime,
          consentAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setWaitlistSubmitted(true);
        setWaitlistMessage(data.message || '대기 신청이 완료되었습니다.');
        trackEvent('waitlist_submit', { area: waitlistArea, timeSlot: waitlistTime });
      } else {
        alert(data.message || '신청 중 오류가 발생했습니다.');
      }
    } catch {
      alert('처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  // 공유하기 핸들러
  const handleShareResult = async () => {
    trackEvent('share_click');
    if (!result) return;
    const contextCopy = SOLOTEST_COPY.context[result.context] || SOLOTEST_COPY.context.after_work;
    const styleCopy = SOLOTEST_COPY.style[result.style] || SOLOTEST_COPY.style.flex;
    const shareText = `나는 ${contextCopy.name} × ${styleCopy.name}. 나도 솔로야.\n${window.location.origin}/solotest`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '나도솔로 솔로테스트',
          text: shareText,
          url: `${window.location.origin}/solotest`,
        });
        return;
      } catch {}
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setCopyToast('결과 문구와 링크가 복사되었습니다!');
      setTimeout(() => setCopyToast(null), 3000);
    }
  };

  // 다시 하기
  const handleRestart = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('solotest_answers');
    }
    setAnswers({});
    setResult(null);
    setCurrentIdx(0);
    setStep('INTRO');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 활성 복사본
  const activeContext = result
    ? SOLOTEST_COPY.context[result.context] || SOLOTEST_COPY.context.after_work
    : SOLOTEST_COPY.context.after_work;
  const activeStyle = result
    ? SOLOTEST_COPY.style[result.style] || SOLOTEST_COPY.style.flex
    : SOLOTEST_COPY.style.flex;
  const activeNeed = result
    ? SOLOTEST_COPY.need[result.need] || SOLOTEST_COPY.need.balanced
    : SOLOTEST_COPY.need.balanced;
  const activeTheme = result
    ? SOLOTEST_COPY.theme[result.theme] || SOLOTEST_COPY.theme.after_work_dinner
    : SOLOTEST_COPY.theme.after_work_dinner;

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans selection:bg-[#f04f74] selection:text-white">
      <GlobalHeader />

      {/* 복사 완료 토스트 피드백 */}
      {copyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white text-zinc-900 text-sm font-medium rounded-none shadow-xl border border-zinc-200 animate-in fade-in slide-in-from-top-2">
          {copyToast}
        </div>
      )}

      {/* ============================================================
          1. 인트로 화면 (Intro)
          ============================================================ */}
      {step === 'INTRO' && (
        <main className="flex-1 max-w-xl w-full mx-auto px-6 py-16 sm:py-24 flex flex-col justify-center text-center">
          <div className="space-y-6">
            {/* 상단 포인트 도트 */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span>1분 솔로테스트</span>
            </div>

            {/* 인트로 제목 */}
            <h1 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-snug">
              혼자라고 느낀 적 있나요?<br />
              <span className="text-zinc-200">나도 솔로야.</span>
            </h1>

            {/* 인트로 설명 */}
            <p className="text-base sm:text-lg text-zinc-300 font-light leading-relaxed max-w-md mx-auto">
              솔로는 상태가 아니라 순간이에요.<br className="hidden sm:inline" />
              1분 솔로테스트로 내가 어떤 순간의 솔로인지 확인해 보세요.
            </p>

            {/* 인트로 액션 버튼 2개 */}
            <div className="pt-4 flex flex-col gap-3 max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleStartTest}
                className="w-full py-4 bg-[#f04f74] hover:bg-[#d93a5e] text-white font-medium text-base tracking-wide transition-all shadow-lg shadow-[#f04f74]/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>1분 솔로테스트 시작</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleViewOpenRoomsDirectly}
                className="w-full py-3.5 border border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium text-sm transition-all cursor-pointer"
              >
                이번 주 열린 모임 보기
              </button>
            </div>

            {/* 작은 글씨 안내 */}
            <p className="pt-2 text-xs font-mono text-zinc-500">
              가입 없이 진행 · 진단이 아니라 공감과 재미를 위한 테스트예요
            </p>
          </div>
        </main>
      )}

      {/* ============================================================
          2. 문항 8개 (한 화면 1문항 · 모바일 우선)
          ============================================================ */}
      {step === 'TEST' && currentQuestion && (
        <main className="flex-1 max-w-xl w-full mx-auto px-5 py-10 sm:py-14 flex flex-col justify-between">
          <div className="space-y-6">
            {/* 상단 컨트롤: 이전 버튼 & 진행률 표시 */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-2.5 py-1 text-sm font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>이전</span>
              </button>

              <div className="flex items-center gap-2 text-sm font-mono text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <span>
                  {currentIdx + 1} / {totalQuestions}
                </span>
              </div>
            </div>

            {/* 프로그레스 게이지 */}
            <div className="w-full h-1 bg-white/[0.08]">
              <div
                className="h-full bg-[#f04f74] transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* 문항 본문 */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                QUESTION 0{currentIdx + 1}
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal leading-snug">
                {currentQuestion.text}
              </h2>
              {currentQuestion.type === 'multi' && (
                <p className="text-xs font-mono text-zinc-400">
                  최대 {currentQuestion.max}개 선택 가능 (선택 후 하단 결과 확인 클릭)
                </p>
              )}
            </div>

            {/* 보기 목록 (Single / Scale3) */}
            {currentQuestion.type !== 'multi' && (
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt: any, optIdx: number) => {
                  const val = typeof opt === 'object' ? opt.v : opt;
                  const label = typeof opt === 'object' ? opt.label : opt;
                  const isSelected = answers[currentQuestion.id] === val;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectSingle(val)}
                      className={`w-full text-left p-4 sm:p-5 border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#f04f74] bg-[#f04f74]/10 text-white'
                          : 'border-white/10 bg-[#0c0d12] hover:bg-white/[0.04] text-zinc-200 hover:border-white/25'
                      }`}
                    >
                      <span className="text-sm sm:text-base font-light leading-relaxed">
                        {label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                          isSelected
                            ? 'border-[#f04f74] bg-[#f04f74] text-white'
                            : 'border-white/20'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Q8 다중 선택 (Multi: 관심사 12종) */}
            {currentQuestion.type === 'multi' && (
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentQuestion.options.map((optText: any, optIdx: number) => {
                    const str = String(optText);
                    const selectedList: string[] = Array.isArray(
                      answers[currentQuestion.id]
                    )
                      ? answers[currentQuestion.id]
                      : [];
                    const isChecked = selectedList.includes(str);

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleToggleMulti(str)}
                        className={`p-3 text-left border text-sm font-light transition-all flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'border-[#f04f74] bg-[#f04f74]/15 text-white font-medium'
                            : 'border-white/10 bg-[#0c0d12] text-zinc-300 hover:border-white/25'
                        }`}
                      >
                        <span>{str}</span>
                        <div
                          className={`w-4 h-4 rounded-none border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'border-[#f04f74] bg-[#f04f74] text-white'
                              : 'border-white/20'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 결과 확인 버튼 */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={
                      !answers[currentQuestion.id] ||
                      answers[currentQuestion.id].length === 0
                    }
                    onClick={() => finalizeTest(answers)}
                    className="w-full py-4 bg-[#f04f74] hover:bg-[#d93a5e] disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium text-base tracking-wide transition-all shadow-lg shadow-[#f04f74]/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>결과 확인하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 하단 공감 메모 */}
          <div className="pt-8 text-center text-xs font-mono text-zinc-500">
            솔로는 상태가 아니라 순간이에요. 있는 그대로 편안하게 골라 주세요.
          </div>
        </main>
      )}

      {/* ============================================================
          3. 결과 화면 (위 → 아래 구성)
          ============================================================ */}
      {step === 'RESULT' && result && (
        <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-10 sm:py-16 space-y-10">
          {/* 1. 유형 카드 */}
          <section className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <span className="text-xs font-mono text-zinc-400">
                  나의 순간과 식탁 결
                </span>
              </div>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-white">
                {activeContext.name} × {activeStyle.name}
              </h2>
              <p className="text-base text-zinc-200 font-light pt-1 leading-relaxed">
                {activeContext.empathy}
              </p>
            </div>

            {/* 공감 순간 & 첫 걸음 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-4 bg-[#08090d] border border-white/10 space-y-1">
                <span className="text-xs font-mono text-zinc-500 block">이런 순간들</span>
                <p className="text-zinc-300 font-light leading-relaxed">
                  {activeContext.moments}
                </p>
              </div>
              <div className="p-4 bg-[#08090d] border border-white/10 space-y-1">
                <span className="text-xs font-mono text-zinc-500 block">첫 걸음</span>
                <p className="text-zinc-300 font-light leading-relaxed">
                  {activeContext.first_step}
                </p>
              </div>
            </div>

            {/* 결 스타일 및 식탁 팁 */}
            <div className="p-5 bg-white/[0.02] border border-white/10 space-y-3">
              <div>
                <span className="text-xs font-mono text-zinc-400 block mb-1">
                  식탁에서의 내 모습
                </span>
                <p className="text-sm sm:text-base text-white font-normal leading-relaxed">
                  {activeStyle.line}
                </p>
              </div>
              <div className="pt-2 border-t border-white/[0.08]">
                <span className="text-xs font-mono text-[#f04f74] block mb-1">
                  식탁 팁
                </span>
                <p className="text-sm text-zinc-300 font-light leading-relaxed">
                  {activeStyle.tip}
                </p>
              </div>
            </div>

            {/* 필요한 연결 */}
            <div className="p-4 bg-[#08090d] border border-white/10 space-y-1">
              <span className="text-xs font-mono text-zinc-400 block">
                {activeNeed.title}
              </span>
              <p className="text-sm text-zinc-300 font-light leading-relaxed">
                {activeNeed.line}
              </p>
            </div>
          </section>

          {/* 2. 맞는 식탁 (추천 테마) */}
          <section className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <span>나에게 맞는 식탁</span>
              </span>
              {result.tags.includes('deep_talk') && (
                <span className="px-2 py-0.5 border border-white/20 bg-white/5 text-[11px] font-mono text-zinc-300">
                  #깊은대화
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif-editorial text-2xl text-white font-normal">
                {activeTheme.name}
              </h3>
              <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed">
                {activeTheme.desc}
              </p>
            </div>
          </section>

          {/* 3. 이번 주 열린 방 (동네 · 시간 필터) */}
          <section className="bg-[#0c0d12] border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif-editorial text-xl sm:text-2xl text-white font-normal">
                이번 주 열린 식탁
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                동네와 시간을 선택해 내 일정에 맞는 식탁을 확인해 보세요.
              </p>
            </div>

            {/* 필터 컨트롤 바 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* 동네 선택 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-zinc-400">
                  동네 필터
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['전체', '강남', '성수', '전포·서면', '해운대'].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setSelectedArea(area)}
                      className={`px-3 py-1.5 text-xs font-mono border transition-all cursor-pointer ${
                        selectedArea === area
                          ? 'border-white bg-white text-zinc-950 font-bold'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* 시간대 선택 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-zinc-400">
                  시간대 필터
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['전체', '금요일', '토요일'].map((tSlot) => (
                    <button
                      key={tSlot}
                      type="button"
                      onClick={() => setSelectedTime(tSlot)}
                      className={`px-3 py-1.5 text-xs font-mono border transition-all cursor-pointer ${
                        selectedTime === tSlot
                          ? 'border-white bg-white text-zinc-950 font-bold'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      {tSlot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 카드 목록 또는 로딩 */}
            {isLoadingRooms ? (
              <div className="py-12 text-center text-sm font-mono text-zinc-500">
                식탁 목록 불러오는 중...
              </div>
            ) : rooms.length > 0 ? (
              <div className="space-y-3 pt-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-5 border border-white/10 bg-[#08090d] hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#f04f74] font-medium">
                          {room.area}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-xs font-mono text-zinc-400">
                          {room.dateText}
                        </span>
                      </div>
                      <h4 className="font-serif-editorial text-lg text-white font-normal">
                        {room.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                        <span>₩{room.priceKrw.toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-white font-medium">
                          잔여 {room.remainingSeats}석 (정원 {room.maxSeats}인)
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/meetup`}
                      onClick={() => trackEvent('room_click', { roomId: room.id })}
                      className="px-5 py-2.5 bg-[#f04f74] hover:bg-[#d93a5e] text-white text-sm font-mono font-medium transition-all text-center shrink-0 cursor-pointer"
                    >
                      신청하기
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              /* 4. 방이 없으면 대기 신청 폼 */
              <div className="p-6 border border-white/10 bg-[#08090d] space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-serif-editorial text-lg">
                    <Bell className="w-4 h-4 text-[#f04f74]" />
                    <span>이 조건의 첫 모임이 열리면 알려 드릴게요</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    희망하시는 동네와 시간대를 남겨주시면 모임 개설 즉시 문자로 안내해 드립니다.
                  </p>
                </div>

                {waitlistSubmitted ? (
                  <div className="p-4 bg-white/5 border border-white/20 text-center space-y-1.5">
                    <CheckCircle2 className="w-5 h-5 text-white mx-auto" />
                    <p className="text-sm font-medium text-white">{waitlistMessage}</p>
                    <span className="text-xs text-zinc-400 font-mono block">
                      신청 정보: {waitlistArea} · {waitlistTime}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitWaitlist} className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-zinc-400 mb-1">
                          연락처 (휴대폰 번호)
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="010-0000-0000"
                          value={waitlistContact}
                          onChange={(e) => setWaitlistContact(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0c0d12] border border-white/15 text-white text-sm font-mono focus:border-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-400 mb-1">
                          희망 동네
                        </label>
                        <select
                          value={waitlistArea}
                          onChange={(e) => setWaitlistArea(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0c0d12] border border-white/15 text-white text-sm font-mono focus:border-white focus:outline-none"
                        >
                          <option value="강남">서울 강남</option>
                          <option value="성수">서울 성수</option>
                          <option value="한남·이태원">서울 한남·이태원</option>
                          <option value="홍대·합정">서울 홍대·합정</option>
                          <option value="전포·서면">부산 전포·서면</option>
                          <option value="해운대·센텀">부산 해운대·센텀</option>
                          <option value="광안리">부산 광안리</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">
                        희망 시간대
                      </label>
                      <select
                        value={waitlistTime}
                        onChange={(e) => setWaitlistTime(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0c0d12] border border-white/15 text-white text-sm font-mono focus:border-white focus:outline-none"
                      >
                        <option value="금요일 저녁 19:30">금요일 저녁 19:30</option>
                        <option value="토요일 저녁 19:00">토요일 저녁 19:00</option>
                        <option value="일요일 저녁 18:30">일요일 저녁 18:30</option>
                        <option value="평일 저녁 언제든">평일 저녁 언제든</option>
                      </select>
                    </div>

                    {/* 수신 동의 체크박스 */}
                    <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={waitlistConsent}
                        onChange={(e) => setWaitlistConsent(e.target.checked)}
                        className="mt-1 accent-[#f04f74]"
                      />
                      <span className="text-xs text-zinc-400 leading-relaxed font-mono">
                        알림 수신 및 개인정보 수집에 동의합니다. {'{TODO: 법률 확인 후 확정}'}
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="w-full py-3 border border-white/25 bg-white/10 hover:bg-white/20 text-white font-mono text-sm transition-colors cursor-pointer"
                    >
                      대기 신청하기
                    </button>
                  </form>
                )}
              </div>
            )}
          </section>

          {/* 5. 공유 버튼 및 다시 하기 */}
          <section className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleShareResult}
              className="w-full sm:flex-1 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#f04f74]" />
              <span>결과 공유하기</span>
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="w-full sm:w-auto px-6 py-4 border border-white/10 bg-[#0c0d12] hover:bg-white/5 text-zinc-400 hover:text-white font-mono text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 하기</span>
            </button>
          </section>

          {/* 6. 하단 안내 (고정 Footer) */}
          <footer className="pt-6 border-t border-white/10 space-y-2 text-xs font-mono text-zinc-500 leading-relaxed">
            {SOLOTEST_COPY.footer.map((text, idx) => (
              <p key={idx} className="flex items-start gap-1.5">
                <span className="text-zinc-600">•</span>
                <span>{text}</span>
              </p>
            ))}
          </footer>
        </main>
      )}
    </div>
  );
}

export default function SoloTestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080a] flex items-center justify-center text-zinc-400 font-mono text-sm">
          솔로테스트 불러오는 중...
        </div>
      }
    >
      <SoloTestInner />
    </Suspense>
  );
}
