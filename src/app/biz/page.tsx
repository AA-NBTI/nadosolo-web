'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Copy, LogOut, RefreshCw } from 'lucide-react';

const BIZ_SESSION_KEY = 'nadosolo_biz_session_v1';

interface BizSession {
  id: string;
  kind: string;
  name: string;
  contactEmail: string;
  profile: Record<string, any>;
}

interface UnitItem {
  id: string;
  name: string;
  minPartySize: number;
  maxPartySize: number;
  quantity: number;
  durationMinutes: number;
  active: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: '대기',
  CONFIRMED: '확정',
  COMPLETED: '완료',
  DECLINED: '거절',
  EXPIRED: '만료',
  CANCELLED: '취소',
  NO_SHOW: '노쇼',
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

function BizReservationPortalContent() {
  const searchParams = useSearchParams();
  const initialAuthTab = searchParams.get('tab') === 'signup' ? 'SIGNUP' : 'LOGIN';

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<BizSession | null>(null);
  const [authTab, setAuthTab] = useState<'LOGIN' | 'SIGNUP'>(initialAuthTab);
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // 회원가입(업체 등록) 폼 상태 (/auth 구조 일치)
  const [signupKind, setSignupKind] = useState<'restaurant' | 'lodging' | 'space' | 'etc'>('restaurant');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [signupPinConfirm, setSignupPinConfirm] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupQuantity, setSignupQuantity] = useState(2);
  const [signupCap, setSignupCap] = useState(6);
  const [signupBusy, setSignupBusy] = useState(false);

  const [activeTab, setActiveTab] = useState<'OPERATE' | 'SETTINGS'>('OPERATE');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [tableBoard, setTableBoard] = useState<Record<string, { occupied?: boolean; seatedAt?: string }>>({});
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10)
  );
  const [isClosedDay, setIsClosedDay] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinSize, setWalkinSize] = useState(2);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // 설정 상태 (프로필 · 복수 유닛 · 주간 스케줄)
  const [editAddress, setEditAddress] = useState('');
  const [editDetail, setEditDetail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGuide, setEditGuide] = useState('');
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [openDays, setOpenDays] = useState<number[]>([3, 5, 6]);
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('22:00');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [intervalMin, setIntervalMin] = useState(60);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BIZ_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BizSession;
        if (parsed?.id) setSession(parsed);
      }
    } catch {}
    setReady(true);
  }, []);

  const loadData = useCallback(
    async (sess: BizSession) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/partners/reservations?venueId=${encodeURIComponent(sess.id)}&date=${encodeURIComponent(selectedDate)}`
        );
        const data = await res.json();
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        setWindows(Array.isArray(data.windows) ? data.windows : []);
        setTableBoard(data.tableBoard || {});
        setIsClosedDay(Boolean(data.isClosedDay));

        const p = data.profile || {};
        setEditAddress(p.address || '');
        setEditDetail(p.addressDetail || '');
        setEditPhone(p.phone || '');
        setEditGuide(p.guideNote || '');
        if (Array.isArray(data.units)) setUnits(data.units);

        if (data.schedule?.weekly && Array.isArray(data.schedule.weekly) && data.schedule.weekly.length > 0) {
          const activeRules = data.schedule.weekly.filter((w: any) => w.active);
          setOpenDays(activeRules.map((w: any) => w.dayOfWeek));
          const first = activeRules[0] || data.schedule.weekly[0];
          if (first) {
            setStartTime(first.startTime || '17:30');
            setEndTime(first.endTime || '22:00');
            setBreakStart(first.breakStart || '');
            setBreakEnd(first.breakEnd || '');
            setIntervalMin(first.slotIntervalMinutes || 60);
          }
        }
      } catch {
        setNotice('조회 실패');
      } finally {
        setLoading(false);
      }
    },
    [selectedDate]
  );

  useEffect(() => {
    if (session) void loadData(session);
  }, [session, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/biz/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, pin }),
      });
      const data = await res.json();
      if (!data.ok || !data.resource) {
        setLoginError(data.error || '로그인 실패');
        return;
      }
      localStorage.setItem(BIZ_SESSION_KEY, JSON.stringify(data.resource));
      setSession(data.resource);
      setPin('');
    } catch {
      setLoginError('로그인 오류');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (signupPin.length < 4) {
      setLoginError('비밀번호는 4자 이상 입력해 주세요.');
      return;
    }
    if (signupPin !== signupPinConfirm) {
      setLoginError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setSignupBusy(true);
    try {
      const res = await fetch('/api/biz/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: signupKind,
          name: signupName,
          contactEmail: signupEmail,
          pin: signupPin,
          address: signupAddress,
          phone: signupPhone,
          quantity: signupQuantity,
          partyCap: signupCap,
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.resource) {
        setLoginError(data.error || '가입 중 오류가 발생했습니다.');
        return;
      }
      localStorage.setItem(BIZ_SESSION_KEY, JSON.stringify(data.resource));
      setSession(data.resource);
      setSignupPin('');
      setSignupPinConfirm('');
    } catch {
      setLoginError('가입 처리 중 오류가 발생했습니다.');
    } finally {
      setSignupBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(BIZ_SESSION_KEY);
    setSession(null);
    setBookings([]);
    setWindows([]);
    setNotice(null);
  };

  const sendAction = async (payload: Record<string, any>, msg: string, key: string) => {
    if (!session) return;
    setBusyKey(key);
    setNotice(null);
    try {
      const res = await fetch('/api/partners/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId: session.id, ...payload }),
      });
      const data = await res.json();
      if (!data.ok) {
        setNotice(data.error || '처리 실패');
      } else {
        setNotice(msg);
        await loadData(session);
      }
    } catch {
      setNotice('요청 오류');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const weekly = openDays.map((d) => ({
      dayOfWeek: d,
      startTime,
      endTime,
      ...(breakStart && breakEnd ? { breakStart, breakEnd } : {}),
      slotIntervalMinutes: Math.max(15, intervalMin),
      active: true,
    }));
    await sendAction(
      {
        action: 'UPDATE_SETTINGS',
        profile: {
          ...session?.profile,
          address: editAddress.trim(),
          addressDetail: editDetail.trim(),
          phone: editPhone.trim(),
          guideNote: editGuide.trim(),
        },
        units,
        schedule: {
          timezoneOffsetMinutes: 540,
          weekly,
          overrides: [],
        },
      },
      '저장 완료',
      'SETTINGS'
    );
  };

  const addUnit = () => {
    setUnits((prev) => [
      ...prev,
      {
        id: `unit_${Date.now().toString(36)}`,
        name: '신규 테이블/룸',
        minPartySize: 2,
        maxPartySize: 4,
        quantity: 2,
        durationMinutes: 120,
        active: true,
      },
    ]);
  };

  const updateUnit = (idx: number, patch: Partial<UnitItem>) => {
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, ...patch } : u)));
  };

  const removeUnit = (idx: number) => {
    setUnits((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center">
        <p className="text-sm font-mono text-zinc-400">로딩 중...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="w-full min-h-screen bg-[#07080a] text-[#f5f2eb] px-4 py-12 flex items-center justify-center selection:bg-[#f04f74] selection:text-white">
        <div className="w-full max-w-[460px] bg-[#0c0d12] p-8 sm:p-10 border border-white/[0.08] shadow-2xl relative">
          <Link
            href="/"
            className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-sm font-mono"
            aria-label="닫기"
          >
            ✕
          </Link>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="space-y-1.5">
              <span className="text-sm font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold">
                BIZ RESERVATION
              </span>
              <h1 className="font-serif-editorial text-2xl font-normal text-white">
                {authTab === 'LOGIN' ? '파트너 업체 로그인' : '파트너 업체 가입'}
              </h1>
              <p className="text-sm text-zinc-300 font-light mt-1">
                {authTab === 'LOGIN'
                  ? '업체 계정에 로그인하고 실시간 좌석과 예약을 관리하세요.'
                  : '업체 계정을 생성하고 무료 예약 포털을 바로 시작하세요.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 bg-black/40 p-1 border border-white/10 mb-7">
            <button
              type="button"
              onClick={() => {
                setAuthTab('LOGIN');
                setLoginError(null);
              }}
              className={`py-2.5 text-sm font-mono tracking-wider transition-all cursor-pointer ${
                authTab === 'LOGIN'
                  ? 'border border-white/30 bg-white/[0.08] text-white font-semibold'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('SIGNUP');
                setLoginError(null);
              }}
              className={`py-2.5 text-sm font-mono tracking-wider transition-all cursor-pointer ${
                authTab === 'SIGNUP'
                  ? 'border border-white/30 bg-white/[0.08] text-white font-semibold'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              회원가입
            </button>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 bg-transparent border border-white/20 text-white text-sm font-mono text-center">
              {loginError}
            </div>
          )}

          {authTab === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                  이메일 또는 업체 코드
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="owner@store.com 또는 BIZ_..."
                  className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                  비밀번호
                </label>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 border border-white/30 bg-white/15 hover:bg-white/25 text-sm font-mono font-semibold text-white tracking-wider transition-colors cursor-pointer"
              >
                로그인
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-sm font-mono text-zinc-300 mb-1">업종</label>
                  <select
                    value={signupKind}
                    onChange={(e) => setSignupKind(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] focus:outline-none"
                  >
                    <option value="restaurant">식당 · 다이닝</option>
                    <option value="lodging">숙박 · 스테이</option>
                    <option value="space">공간 · 살롱</option>
                    <option value="etc">기타 체험</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-mono text-zinc-300 mb-1">업체명</label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="광안브릿지뷰"
                    className="w-full px-3 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-mono text-zinc-300 mb-1">이메일 (로그인 ID)</label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="owner@store.com"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-sm font-mono text-zinc-300 mb-1">비밀번호</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={signupPin}
                    onChange={(e) => setSignupPin(e.target.value)}
                    placeholder="4자 이상"
                    className="w-full px-3 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-zinc-300 mb-1">비밀번호 확인</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={signupPinConfirm}
                    onChange={(e) => setSignupPinConfirm(e.target.value)}
                    placeholder="다시 입력"
                    className="w-full px-3 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-mono text-zinc-300 mb-1">도로명 주소</label>
                <input
                  type="text"
                  required
                  value={signupAddress}
                  onChange={(e) => setSignupAddress(e.target.value)}
                  placeholder="부산 수영구 광안해변로 219"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-sm font-mono text-zinc-300 mb-1">매장 연락처</label>
                  <input
                    type="tel"
                    required
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="051-755-1234"
                    className="w-full px-3 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-zinc-300 mb-1">테이블수</label>
                  <input
                    type="number"
                    min={1}
                    value={signupQuantity}
                    onChange={(e) => setSignupQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2.5 bg-black/40 border border-white/15 text-sm font-mono text-[#f5f2eb] focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={signupBusy}
                className="w-full py-3.5 border border-white/30 bg-white/15 hover:bg-white/25 text-sm font-mono font-semibold text-white tracking-wider transition-colors cursor-pointer disabled:opacity-40"
              >
                {signupBusy ? '가입 중...' : '가입'}
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07080a] text-zinc-100 py-10 px-5 sm:px-8">
      <div className="max-w-[1000px] mx-auto space-y-6">
        <header className="p-4 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <div>
              <h1 className="font-serif-editorial text-2xl text-white font-normal">{session.name}</h1>
              <p className="text-sm font-mono text-zinc-400">
                코드: {session.id} · {editAddress || session.profile?.address || ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('OPERATE')}
              className={`px-3 py-1.5 border text-sm font-mono text-white cursor-pointer ${
                activeTab === 'OPERATE' ? 'border-white/40 bg-white/15 font-bold' : 'border-white/15 bg-white/5'
              }`}
            >
              운영
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SETTINGS')}
              className={`px-3 py-1.5 border text-sm font-mono text-white cursor-pointer ${
                activeTab === 'SETTINGS' ? 'border-white/40 bg-white/15 font-bold' : 'border-white/15 bg-white/5'
              }`}
            >
              설정
            </button>
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/book/${session.id}`;
                void navigator.clipboard.writeText(url);
                setNotice('링크 복사 완료');
              }}
              className="px-3 py-1.5 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>링크복사</span>
            </button>
            <button
              type="button"
              onClick={() => void loadData(session)}
              disabled={loading}
              className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>
          </div>
        </header>

        {notice && (
          <div className="p-3 border border-white/20 bg-white/5 text-sm font-mono text-white">
            {notice}
          </div>
        )}

        {activeTab === 'SETTINGS' ? (
          <form onSubmit={handleSaveSettings} className="space-y-4 text-sm font-mono">
            {/* 매장 기본 정보 */}
            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h2 className="font-serif-editorial text-lg text-white font-normal">매장정보</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">도로명 주소</label>
                  <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">상세 위치</label>
                  <input value={editDetail} onChange={(e) => setEditDetail(e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">매장 전화</label>
                  <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">이용 안내</label>
                  <input value={editGuide} onChange={(e) => setEditGuide(e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white" />
                </div>
              </div>
            </section>

            {/* 복수 좌석/상품 유닛 */}
            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg text-white font-normal">좌석 · 룸 유닛</h2>
                </div>
                <button
                  type="button"
                  onClick={addUnit}
                  className="px-2.5 py-1 border border-white/25 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  + 추가
                </button>
              </div>
              <div className="space-y-2">
                {units.map((u, idx) => (
                  <div key={u.id} className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-2.5 border border-white/10 bg-black/30 items-end">
                    <div className="col-span-2 sm:col-span-2">
                      <label className="block text-zinc-400 mb-1">유닛명</label>
                      <input value={u.name} onChange={(e) => updateUnit(idx, { name: e.target.value })} className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 text-white" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">최소인원</label>
                      <input type="number" min={1} value={u.minPartySize} onChange={(e) => updateUnit(idx, { minPartySize: Number(e.target.value) })} className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 text-white" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">최대인원</label>
                      <input type="number" min={1} value={u.maxPartySize} onChange={(e) => updateUnit(idx, { maxPartySize: Number(e.target.value) })} className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 text-white" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">수량</label>
                      <input type="number" min={1} value={u.quantity} onChange={(e) => updateUnit(idx, { quantity: Number(e.target.value) })} className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <label className="block text-zinc-400 mb-1">분</label>
                        <input type="number" min={30} step={30} value={u.durationMinutes} onChange={(e) => updateUnit(idx, { durationMinutes: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-black/50 border border-white/20 text-white" />
                      </div>
                      {units.length > 1 && (
                        <button type="button" onClick={() => removeUnit(idx)} className="px-2 py-1.5 border border-white/20 text-zinc-300 hover:text-white cursor-pointer">
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 주간 영업시간 & 브레이크타임 */}
            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <h2 className="font-serif-editorial text-lg text-white font-normal">영업시간</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DAY_LABELS.map((lbl, idx) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() =>
                      setOpenDays((prev) => (prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]))
                    }
                    className={`px-3 py-1 border cursor-pointer ${
                      openDays.includes(idx) ? 'border-white/40 bg-white/15 text-white font-bold' : 'border-white/10 text-zinc-500'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">오픈</label>
                  <input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="17:30" className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">마감</label>
                  <input value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="22:00" className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">브레이크 시작</label>
                  <input value={breakStart} onChange={(e) => setBreakStart(e.target.value)} placeholder="15:00" className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">브레이크 종료</label>
                  <input value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} placeholder="17:00" className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">예약간격(분)</label>
                  <input type="number" min={15} step={15} value={intervalMin} onChange={(e) => setIntervalMin(Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 text-white" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={busyKey === 'SETTINGS'}
                  className="px-6 py-2 border border-white/30 bg-white/15 hover:bg-white/25 text-white font-bold cursor-pointer"
                >
                  저장
                </button>
              </div>
            </section>
          </form>
        ) : (
          <>
            {/* 1초 홀 테이블 보드 (원클릭 착석/비움) */}
            {units.length > 0 && (() => {
              const allTables = units.flatMap((u) =>
                Array.from({ length: Math.max(1, u.quantity) }, (_, i) => ({
                  key: `${u.id}#${i + 1}`,
                  label: `${u.name} ${i + 1}`,
                  cap: u.maxPartySize,
                }))
              );
              const occupiedCount = allTables.filter((t) => tableBoard[t.key]?.occupied).length;
              return (
                <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                      <h2 className="font-serif-editorial text-xl text-white font-normal">테이블보드</h2>
                    </div>
                    <span className="px-2.5 py-0.5 border border-white/20 text-sm font-mono text-white">
                      사용 {occupiedCount} / {allTables.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {allTables.map((t) => {
                      const st = tableBoard[t.key];
                      const occupied = Boolean(st?.occupied);
                      const seatedTime = st?.seatedAt
                        ? new Date(st.seatedAt).toLocaleTimeString('ko-KR', {
                            timeZone: 'Asia/Seoul',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : '';
                      return (
                        <button
                          key={t.key}
                          type="button"
                          disabled={busyKey === `TBL_${t.key}`}
                          onClick={() =>
                            void sendAction(
                              { action: 'TOGGLE_TABLE', tableKey: t.key },
                              `${t.label} ${occupied ? '비움' : '착석'}`,
                              `TBL_${t.key}`
                            )
                          }
                          className={`p-3 border text-left transition-all cursor-pointer space-y-1.5 ${
                            occupied
                              ? 'border-white/40 bg-white/15 text-white'
                              : 'border-white/10 bg-black/30 hover:border-white/25 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-sm font-mono">
                            <span className="font-bold truncate">{t.label}</span>
                            {occupied && <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74] shrink-0" />}
                          </div>
                          <div className="flex items-center justify-between text-sm font-mono">
                            <span>{occupied ? '식사중' : '빈자리'}</span>
                            <span className="text-zinc-400">{occupied ? seatedTime : `${t.cap}인`}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })()}

            {/* 좌석 현황판 & 현장/휴무 관리 */}
            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-xl text-white font-normal">좌석현황</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-2.5 py-1 bg-black/50 border border-white/20 text-white"
                  />
                  <button
                    type="button"
                    disabled={busyKey === 'SLOT_CTRL'}
                    onClick={() =>
                      void sendAction(
                        { action: 'TOGGLE_DAY_CLOSED', date: selectedDate },
                        isClosedDay ? '영업 오픈' : '휴무 마감',
                        'SLOT_CTRL'
                      )
                    }
                    className="px-3 py-1 border border-white/25 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    {isClosedDay ? '휴무해제' : '휴무마감'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
                <input
                  type="text"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="성함"
                  className="flex-1 min-w-[160px] px-3 py-1.5 bg-black/40 border border-white/20 text-white"
                />
                <select
                  value={walkinSize}
                  onChange={(e) => setWalkinSize(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-black/40 border border-white/20 text-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}명</option>
                  ))}
                </select>
              </div>

              {isClosedDay ? (
                <div className="p-4 border border-white/10 bg-black/30 text-sm font-mono text-zinc-300">
                  {selectedDate} 휴무
                </div>
              ) : windows.length === 0 ? (
                <div className="p-4 border border-white/10 bg-black/30 text-sm font-mono text-zinc-400">
                  잔여 슬롯 없음
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {windows.map((w) => {
                    const timeStr = new Date(w.startsAt).toLocaleTimeString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    });
                    return (
                      <div key={`${w.unitId}-${w.startsAt}`} className="p-3 border border-white/10 bg-black/30 space-y-2 text-sm font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{timeStr} · {w.unitName}</span>
                          <span className="px-2 py-0.5 border border-white/20 text-white">잔여 {w.remainingQuantity}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            disabled={busyKey === 'SLOT_CTRL'}
                            onClick={() =>
                              void sendAction(
                                {
                                  action: 'WALKIN_BOOK',
                                  unitId: w.unitId,
                                  startsAt: w.startsAt,
                                  partySize: walkinSize,
                                  guestName: walkinName.trim() || '워크인',
                                },
                                `${timeStr} 등록`,
                                'SLOT_CTRL'
                              )
                            }
                            className="px-2 py-1.5 border border-white/25 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          >
                            현장등록
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === 'SLOT_CTRL'}
                            onClick={() =>
                              void sendAction(
                                { action: 'BLOCK_WINDOW', unitId: w.unitId, startsAt: w.startsAt, partySize: 2 },
                                `${timeStr} 마감`,
                                'SLOT_CTRL'
                              )
                            }
                            className="px-2 py-1.5 border border-white/15 bg-transparent hover:bg-white/10 text-zinc-200 cursor-pointer"
                          >
                            마감
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 예약 요청 및 확정 목록 (전문 CRM 배지 포함) */}
            <section className="space-y-3">
              <h2 className="font-serif-editorial text-xl text-white font-normal">
                예약목록 ({bookings.length}건)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {bookings.length === 0 ? (
                  <div className="p-4 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-400">
                    예약 없음
                  </div>
                ) : (
                  bookings.map((b) => {
                    const when = b.meta?.startsAtText || b.createdAt;
                    const busy = busyKey === b.id;
                    const stats = b.customerStats || { visits: 0, noShows: 0 };
                    return (
                      <div key={b.id} className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-white font-medium truncate">
                            {when} · {b.partySize}명
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono">
                            {stats.visits > 0 && (
                              <span className="px-2 py-0.5 border border-white/25 bg-white/10 text-white">
                                방문 {stats.visits}
                              </span>
                            )}
                            {stats.noShows > 0 && (
                              <span className="px-2 py-0.5 border border-white/25 text-white">
                                노쇼 {stats.noShows}
                              </span>
                            )}
                            {stats.visits === 0 && stats.noShows === 0 && (
                              <span className="px-2 py-0.5 border border-white/15 text-zinc-300">
                                신규
                              </span>
                            )}
                            <span className="px-2 py-0.5 border border-white/20 text-white">
                              {STATUS_LABEL[b.status] || b.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm font-mono text-zinc-400 truncate">
                          {b.id}
                          {b.meta?.attendee?.name ? ` · ${b.meta.attendee.name} (${b.meta.attendee.phone || ''})` : ''}
                        </div>
                        {b.meta?.attendee?.requests && (
                          <div className="text-sm text-zinc-300">요청: {b.meta.attendee.requests}</div>
                        )}
                        {b.status === 'REQUESTED' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void sendAction({ action: 'ACCEPT', bookingId: b.id }, '수락', b.id)}
                              className="px-3 py-2 border border-white/30 bg-white/10 hover:bg-white/20 text-sm font-mono font-bold text-white cursor-pointer"
                            >
                              수락
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void sendAction({ action: 'DECLINE', bookingId: b.id }, '거절', b.id)}
                              className="px-3 py-2 border border-white/20 bg-transparent hover:bg-white/10 text-sm font-mono text-white cursor-pointer"
                            >
                              거절
                            </button>
                          </div>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void sendAction({ action: 'COMPLETE', bookingId: b.id }, '완료', b.id)}
                              className="px-3 py-2 border border-white/30 bg-white/10 hover:bg-white/20 text-sm font-mono font-bold text-white cursor-pointer"
                            >
                              완료
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void sendAction({ action: 'NO_SHOW', bookingId: b.id }, '노쇼', b.id)}
                              className="px-3 py-2 border border-white/20 bg-transparent hover:bg-white/10 text-sm font-mono text-white cursor-pointer"
                            >
                              노쇼
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function BizReservationPortalPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#07080a]" />}>
      <BizReservationPortalContent />
    </Suspense>
  );
}
