'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Copy, LogOut, RefreshCw } from 'lucide-react';
import AddressAutocompleteInput, { type SelectedAddressInfo } from '@/components/biz/AddressAutocompleteInput';
import BizMarketing from '@/components/biz/BizMarketing';
import BizPayouts from '@/components/biz/BizPayouts';

const BIZ_SESSION_KEY = 'tablebaro_biz_session_v1';

interface BizSession {
  id: string;
  kind: string;
  name: string;
  contactEmail: string;
  managerName?: string;
  onboardingCompleted?: boolean;
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
const VENUE_TAG_OPTIONS = ['주차가능', '콜키지프리', '프라이빗룸', '단체석', '와인페어링', '반려동물', '유아의자'] as const;

interface WeeklyRuleState {
  dayOfWeek: number;
  active: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  slotIntervalMinutes: number;
}

const DEFAULT_WEEKLY_RULES: WeeklyRuleState[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  dayOfWeek: d,
  active: true,
  startTime: '11:00',
  endTime: '22:00',
  breakStart: '',
  breakEnd: '',
  slotIntervalMinutes: 60,
}));

function BizReservationPortalContent() {
  const searchParams = useSearchParams();
  const initialAuthTab = searchParams.get('tab') === 'signup' ? 'SIGNUP' : 'LOGIN';

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<BizSession | null>(null);
  const [authTab, setAuthTab] = useState<'LOGIN' | 'SIGNUP'>(initialAuthTab);
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  // 회원가입(일반 계정 정보) 폼 상태 (/auth 구조 일치)
  const [signupEmail, setSignupEmail] = useState('');
  const [signupManagerName, setSignupManagerName] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [signupPinConfirm, setSignupPinConfirm] = useState('');
  const [signupBusy, setSignupBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // 첫 로그인 후 업체 필수 정보 등록(온보딩) 상태
  const [obKind, setObKind] = useState<'restaurant' | 'lodging' | 'space' | 'etc'>('restaurant');
  const [obName, setObName] = useState('');
  const [obAddress, setObAddress] = useState('');
  const [obAddressMeta, setObAddressMeta] = useState<Partial<SelectedAddressInfo>>({});
  const [obAddressDetail, setObAddressDetail] = useState('');
  const [obPhone, setObPhone] = useState('');
  const [obQuantity, setObQuantity] = useState(2);
  const [obPartyCap, setObPartyCap] = useState(6);
  const [obGuideNote, setObGuideNote] = useState('');
  const [obOpenDays, setObOpenDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [obStartTime, setObStartTime] = useState('11:00');
  const [obEndTime, setObEndTime] = useState('22:00');
  const [obError, setObError] = useState<string | null>(null);
  const [obBusy, setObBusy] = useState(false);

  const [activeTab, setActiveTab] = useState<'OPERATE' | 'SETTINGS' | 'MARKETING' | 'PAYOUTS'>('OPERATE');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [tableBoard, setTableBoard] = useState<Record<string, { occupied?: boolean; seatedAt?: string }>>({});
  const [waitingOpen, setWaitingOpen] = useState(true);
  const [waitingQueue, setWaitingQueue] = useState<any[]>([]);
  const [customerNotes, setCustomerNotes] = useState<Record<string, string>>({});
  const [blockedPhones, setBlockedPhones] = useState<string[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10)
  );
  const [isClosedDay, setIsClosedDay] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinSize, setWalkinSize] = useState(2);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // 설정 상태 (상호 · 업종 · 프로필 · 복수 유닛 · 주간 스케줄)
  const [editName, setEditName] = useState('');
  const [editKind, setEditKind] = useState('restaurant');
  const [editAddress, setEditAddress] = useState('');
  const [editAddressMeta, setEditAddressMeta] = useState<Partial<SelectedAddressInfo>>({});
  const [editDetail, setEditDetail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGuide, setEditGuide] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editSignatureMenu, setEditSignatureMenu] = useState('');
  const [editPriceRange, setEditPriceRange] = useState('');
  const [editPrepayAmountKrw, setEditPrepayAmountKrw] = useState(0);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [weeklyRules, setWeeklyRules] = useState<WeeklyRuleState[]>(DEFAULT_WEEKLY_RULES);

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
          `/api/biz/reservations?venueId=${encodeURIComponent(sess.id)}&date=${encodeURIComponent(selectedDate)}`
        );
        const data = await res.json();
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        setWindows(Array.isArray(data.windows) ? data.windows : []);
        setTableBoard(data.tableBoard || {});
        setCustomerNotes(data.customerNotes || {});
        setBlockedPhones(Array.isArray(data.blockedPhones) ? data.blockedPhones : []);
        setWaitingOpen(data.waitingOpen !== false);
        setWaitingQueue(Array.isArray(data.waitingQueue) ? data.waitingQueue : []);
        setIsClosedDay(Boolean(data.isClosedDay));

        const p = data.profile || {};
        setEditName(sess.name || '');
        setEditKind(sess.kind || 'restaurant');
        setEditAddress(p.address || '');
        setEditDetail(p.addressDetail || '');
        setEditPhone(p.phone || '');
        setEditGuide(p.guideNote || '');
        setEditCoverUrl(p.coverImageUrl || '');
        setEditSignatureMenu(p.signatureMenu || '');
        setEditPriceRange(p.priceRange || '');
        setEditPrepayAmountKrw(Number(p.prepayAmountKrw ?? p.depositKrw ?? 0));
        setEditTags(Array.isArray(p.tags) ? p.tags : []);
        if (Array.isArray(data.units)) setUnits(data.units);

        if (data.schedule?.weekly && Array.isArray(data.schedule.weekly)) {
          const mapByDay = new Map<number, any>(
            data.schedule.weekly.map((w: any) => [Number(w.dayOfWeek), w])
          );
          setWeeklyRules(
            [0, 1, 2, 3, 4, 5, 6].map((d) => {
              const found = mapByDay.get(d);
              return found
                ? {
                    dayOfWeek: d,
                    active: Boolean(found.active),
                    startTime: found.startTime || '11:00',
                    endTime: found.endTime || '22:00',
                    breakStart: found.breakStart || '',
                    breakEnd: found.breakEnd || '',
                    slotIntervalMinutes: Number(found.slotIntervalMinutes) || 60,
                  }
                : {
                    dayOfWeek: d,
                    active: false,
                    startTime: '11:00',
                    endTime: '22:00',
                    breakStart: '',
                    breakEnd: '',
                    slotIntervalMinutes: 60,
                  };
            })
          );
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
    if (session && session.onboardingCompleted !== false) {
      void loadData(session);
    }
  }, [session, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setAuthNotice(null);
    setLoginBusy(true);
    try {
      const res = await fetch('/api/biz/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!data.ok || !data.resource) {
        setLoginError(data.error || '로그인에 실패했습니다. 아이디(이메일)와 비밀번호를 확인해 주세요.');
        return;
      }
      localStorage.setItem(BIZ_SESSION_KEY, JSON.stringify(data.resource));
      setSession(data.resource);
      setPin('');
      setAuthNotice(`${data.resource.name} 계정으로 로그인되었습니다.`);
    } catch {
      setLoginError('로그인 처리 중 네트워크 오류가 발생했습니다.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setAuthNotice(null);
    if (!signupEmail.trim()) {
      setLoginError('이메일을 입력해 주세요.');
      return;
    }
    if (!signupManagerName.trim()) {
      setLoginError('담당자명을 입력해 주세요.');
      return;
    }
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
          contactEmail: signupEmail,
          managerName: signupManagerName,
          pin: signupPin,
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.resource) {
        setLoginError(data.error || '가입 중 오류가 발생했습니다.');
        return;
      }
      setIdentifier(signupEmail);
      setSignupEmail('');
      setSignupManagerName('');
      setSignupPin('');
      setSignupPinConfirm('');
      setAuthTab('LOGIN');
      setAuthNotice('회원가입이 완료되었습니다. 첫 로그인 후 업체 정보를 등록해 주세요.');
    } catch {
      setLoginError('가입 처리 중 오류가 발생했습니다.');
    } finally {
      setSignupBusy(false);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setObError(null);
    if (!obName.trim() || !obAddress.trim() || !obPhone.trim()) {
      setObError('업체명, 도로명 주소, 매장 연락처를 모두 입력해 주세요.');
      return;
    }
    setObBusy(true);
    try {
      const res = await fetch('/api/biz/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: session.id,
          action: 'COMPLETE_ONBOARDING',
          kind: obKind,
          name: obName.trim(),
          quantity: obQuantity,
          partyCap: obPartyCap,
          profile: {
            address: obAddress.trim(),
            addressDetail: obAddressDetail.trim(),
            jibunAddress: obAddressMeta.jibunAddress || '',
            phone: obPhone.trim(),
            guideNote: obGuideNote.trim(),
          },
          schedule: {
            timezoneOffsetMinutes: 540,
            weekly: obOpenDays.map((d) => ({
              dayOfWeek: d,
              startTime: obStartTime,
              endTime: obEndTime,
              slotIntervalMinutes: 60,
              active: true,
            })),
          },
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.resource) {
        setObError(data.error || '업체 정보 등록 실패');
        return;
      }
      localStorage.setItem(BIZ_SESSION_KEY, JSON.stringify(data.resource));
      setSession(data.resource);
    } catch {
      setObError('업체 정보 등록 중 오류가 발생했습니다.');
    } finally {
      setObBusy(false);
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
      const res = await fetch('/api/biz/reservations', {
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
    const weekly = weeklyRules
      .filter((r) => r.active)
      .map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        ...(r.breakStart && r.breakEnd ? { breakStart: r.breakStart, breakEnd: r.breakEnd } : {}),
        slotIntervalMinutes: Math.max(15, r.slotIntervalMinutes || 60),
        active: true,
      }));
    await sendAction(
      {
        action: 'UPDATE_SETTINGS',
        name: editName.trim() || session?.name,
        kind: editKind,
        profile: {
          ...session?.profile,
          address: editAddress.trim(),
          addressDetail: editDetail.trim(),
          ...(editAddressMeta.jibunAddress ? { jibunAddress: editAddressMeta.jibunAddress } : {}),
          phone: editPhone.trim(),
          guideNote: editGuide.trim(),
          coverImageUrl: editCoverUrl.trim(),
          signatureMenu: editSignatureMenu.trim(),
          priceRange: editPriceRange.trim(),
          prepayAmountKrw: Math.max(0, Math.round(Number(editPrepayAmountKrw) || 0)),
          tags: editTags,
        },
        units,
        schedule: {
          timezoneOffsetMinutes: 540,
          weekly,
        },
      },
      '저장 완료',
      'SETTINGS'
    );
    if (session && editName.trim()) {
      const updatedSession = { ...session, name: editName.trim(), kind: editKind };
      setSession(updatedSession);
      localStorage.setItem(BIZ_SESSION_KEY, JSON.stringify(updatedSession));
    }
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
      <main className="w-full min-h-screen bg-[#07080a] text-[#f5f2eb] px-4 py-12 flex items-center justify-center selection:bg-[#3b82f6] selection:text-white">
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
              <span className="text-sm font-mono tracking-[0.25em] text-zinc-300 uppercase font-semibold">
                TABLEBARO
              </span>
              <h1 className="font-serif-editorial text-2xl font-normal text-white">
                {authTab === 'LOGIN' ? '테이블바로 로그인' : '테이블바로 입점 가입'}
              </h1>
              <p className="text-sm text-zinc-300 font-light mt-1">
                {authTab === 'LOGIN'
                  ? '매장 계정에 로그인하고 실시간 좌석과 예약을 관리하세요.'
                  : '계정을 생성하고 테이블바로 매장 관리를 바로 시작하세요.'}
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

          {authNotice && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm font-mono text-center">
              {authNotice}
            </div>
          )}

          {loginError && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm font-mono text-center">
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
                disabled={loginBusy}
                className="w-full py-3.5 border border-white/30 bg-white/15 hover:bg-white/25 text-sm font-mono font-semibold text-white tracking-wider transition-colors cursor-pointer disabled:opacity-40"
              >
                {loginBusy ? '로그인 확인 중...' : '로그인'}
              </button>

              {/* 테스트 등록 매장 빠른 로그인 지원 */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-xs font-mono text-zinc-400 block">등록된 매장 바로 입력 테스트:</span>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('aa@aa.com');
                    setPin('aa1111');
                  }}
                  className="w-full p-2.5 text-xs font-mono text-left border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>고수냉명 (aa@aa.com)</span>
                  <span className="text-zinc-400">PIN 자동입력</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                  이메일 <span className="text-[#3b82f6]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="owner@store.com"
                  className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                  담당자명 <span className="text-[#3b82f6]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signupManagerName}
                  onChange={(e) => setSignupManagerName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                    비밀번호 <span className="text-[#3b82f6]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={signupPin}
                    onChange={(e) => setSignupPin(e.target.value)}
                    placeholder="4자 이상"
                    className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                    비밀번호 확인 <span className="text-[#3b82f6]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={signupPinConfirm}
                    onChange={(e) => setSignupPinConfirm(e.target.value)}
                    placeholder="다시 입력"
                    className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
                  />
                </div>
              </div>
              {signupPinConfirm && (
                <p className={`text-sm font-mono ${signupPin === signupPinConfirm ? 'text-zinc-200' : 'text-white'}`}>
                  {signupPin === signupPinConfirm ? '✓ 비밀번호가 일치합니다.' : '✕ 비밀번호가 일치하지 않습니다.'}
                </p>
              )}
              <button
                type="submit"
                disabled={signupBusy}
                className="w-full py-3.5 border border-white/30 bg-white/15 hover:bg-white/25 text-sm font-mono font-semibold text-white tracking-wider transition-colors cursor-pointer disabled:opacity-40"
              >
                {signupBusy ? '가입 중...' : '회원가입'}
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  if (session.onboardingCompleted === false) {
    return (
      <main className="w-full min-h-screen bg-[#07080a] text-[#f5f2eb] px-4 py-12 flex items-center justify-center selection:bg-[#3b82f6] selection:text-white">
        <div className="w-full max-w-[560px] bg-[#0c0d12] p-8 sm:p-10 border border-white/[0.08] shadow-2xl space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                <span className="text-sm font-mono tracking-[0.2em] text-zinc-300 uppercase">
                  TABLEBARO SETUP
                </span>
              </div>
              <h1 className="font-serif-editorial text-2xl font-normal text-white">
                매장 필수 정보 등록
              </h1>
              <p className="text-sm text-zinc-300 font-light">
                {session.managerName ? `${session.managerName}님, ` : ''}매장 관리를 위해 기본 정보를 1회 등록해 주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 border border-white/20 text-sm font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              로그아웃
            </button>
          </div>

          {obError && (
            <div className="p-3.5 border border-white/20 text-white text-sm font-mono text-center">
              {obError}
            </div>
          )}

          <form onSubmit={handleCompleteOnboarding} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-mono text-zinc-300 mb-1.5">
                  업종 <span className="text-[#3b82f6]">*</span>
                </label>
                <select
                  value={obKind}
                  onChange={(e) => setObKind(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] focus:outline-none focus:border-white/40"
                >
                  <option value="restaurant">식당 · 다이닝</option>
                  <option value="lodging">숙박 · 스테이</option>
                  <option value="space">공간 · 살롱</option>
                  <option value="etc">기타 체험</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-mono text-zinc-300 mb-1.5">
                  업체명 <span className="text-[#3b82f6]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={obName}
                  onChange={(e) => setObName(e.target.value)}
                  placeholder="광안브릿지뷰"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono text-zinc-300 mb-1.5">
                도로명 주소 <span className="text-[#3b82f6]">*</span>
              </label>
              <AddressAutocompleteInput
                required
                value={obAddress}
                onChange={setObAddress}
                onSelectAddress={(item) => setObAddressMeta(item)}
                placeholder="지번·도로명·건물명 입력 시 자동 추천 (예: 광안동 192-2)"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-zinc-300 mb-1.5">상세 주소</label>
              <input
                type="text"
                value={obAddressDetail}
                onChange={(e) => setObAddressDetail(e.target.value)}
                placeholder="2층 또는 201호 (선택)"
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-mono text-zinc-300 mb-1.5">
                  매장 연락처 <span className="text-[#3b82f6]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={obPhone}
                  onChange={(e) => setObPhone(e.target.value)}
                  placeholder="051-755-1234"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-zinc-300 mb-1.5">테이블/유닛 수</label>
                <input
                  type="number"
                  min={1}
                  value={obQuantity}
                  onChange={(e) => setObQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm font-mono text-[#f5f2eb] focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-zinc-300 mb-1.5">유닛당 최대 인원</label>
                <input
                  type="number"
                  min={1}
                  value={obPartyCap}
                  onChange={(e) => setObPartyCap(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm font-mono text-[#f5f2eb] focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono text-zinc-300 mb-1.5">매장 안내 문구</label>
              <input
                type="text"
                value={obGuideNote}
                onChange={(e) => setObGuideNote(e.target.value)}
                placeholder="예: 건물 뒷편 주차 가능 (선택)"
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-sm font-mono text-zinc-300">영업 요일 및 시간</label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_LABELS.map((lbl, idx) => {
                  const on = obOpenDays.includes(idx);
                  return (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() =>
                        setObOpenDays((prev) =>
                          prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
                        )
                      }
                      className={`px-3 py-1.5 border text-sm font-mono cursor-pointer ${
                        on ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-white font-bold' : 'border-white/15 bg-black/40 text-zinc-400'
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-sm font-mono text-zinc-400 mb-1">오픈 시간</label>
                  <input
                    type="time"
                    value={obStartTime}
                    onChange={(e) => setObStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-zinc-400 mb-1">마감 시간</label>
                  <input
                    type="time"
                    value={obEndTime}
                    onChange={(e) => setObEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 text-sm font-mono text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={obBusy}
              className="w-full py-3.5 border border-white/30 bg-white/15 hover:bg-white/25 text-sm font-mono font-semibold text-white tracking-wider transition-colors cursor-pointer disabled:opacity-40"
            >
              {obBusy ? '등록 중...' : '등록'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07080a] text-zinc-100 py-10 px-5 sm:px-8">
      <div className="max-w-[1000px] mx-auto space-y-6">
        <header className="p-4 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-editorial text-2xl text-white font-normal">{session.name}</h1>
                <span className="px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono font-bold">
                  접속 중
                </span>
              </div>
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
              onClick={() => setActiveTab('MARKETING')}
              className={`px-3 py-1.5 border text-sm font-mono text-white cursor-pointer ${
                activeTab === 'MARKETING' ? 'border-white/40 bg-white/15 font-bold' : 'border-white/15 bg-white/5'
              }`}
            >
              마케팅
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PAYOUTS')}
              className={`px-3 py-1.5 border text-sm font-mono text-white cursor-pointer ${
                activeTab === 'PAYOUTS' ? 'border-white/40 bg-white/15 font-bold' : 'border-white/15 bg-white/5'
              }`}
            >
              정산
            </button>
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/reserve/${session.id}`;
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

        {activeTab === 'MARKETING' ? (
          <BizMarketing venueId={session.id} bookings={bookings} />
        ) : activeTab === 'PAYOUTS' ? (
          <BizPayouts resourceId={session.id} />
        ) : activeTab === 'SETTINGS' ? (
          <form onSubmit={handleSaveSettings} className="space-y-4 text-sm font-mono">
            {/* 매장 기본 정보 */}
            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                <h2 className="font-serif-editorial text-lg text-white font-normal">매장정보</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">업체명</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">업종</label>
                  <select value={editKind} onChange={(e) => setEditKind(e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white">
                    <option value="restaurant">식당 · 다이닝</option>
                    <option value="lodging">숙박 · 스테이</option>
                    <option value="space">공간 · 살롱</option>
                    <option value="etc">기타 체험</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">도로명 주소</label>
                  <AddressAutocompleteInput
                    value={editAddress}
                    onChange={setEditAddress}
                    onSelectAddress={(item) => setEditAddressMeta(item)}
                    placeholder="지번·도로명·건물명 입력"
                    className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white focus:outline-none focus:border-white/40"
                  />
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
                <div>
                  <label className="block text-zinc-400 mb-1">대표 메뉴</label>
                  <input value={editSignatureMenu} onChange={(e) => setEditSignatureMenu(e.target.value)} placeholder="예: 한우 오마카세, 평양냉면" className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">가격대</label>
                  <input value={editPriceRange} onChange={(e) => setEditPriceRange(e.target.value)} placeholder="예: 1인 2~4만원대" className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">결제 금액 (원)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editPrepayAmountKrw}
                    onChange={(e) => setEditPrepayAmountKrw(Number(e.target.value) || 0)}
                    placeholder="예: 10000"
                    className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 mb-1">대표 사진 URL</label>
                  <input value={editCoverUrl} onChange={(e) => setEditCoverUrl(e.target.value)} placeholder="https://... (선택 입력)" className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-zinc-400">편의 · 분위기 태그</label>
                  <div className="flex flex-wrap gap-1.5">
                    {VENUE_TAG_OPTIONS.map((tag) => {
                      const on = editTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setEditTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                          }
                          className={`px-3 py-1 border text-sm font-mono cursor-pointer ${
                            on ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-white font-bold' : 'border-white/15 bg-black/40 text-zinc-400'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* 복수 좌석/상품 유닛 */}
            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
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

            {/* 요일별 차등 영업시간 & 브레이크타임 */}
            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                  <h2 className="font-serif-editorial text-lg text-white font-normal">요일별 영업시간</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const base = weeklyRules.find((r) => r.active) || weeklyRules[0];
                    setWeeklyRules((prev) =>
                      prev.map((r) => ({
                        ...r,
                        startTime: base.startTime,
                        endTime: base.endTime,
                        breakStart: base.breakStart,
                        breakEnd: base.breakEnd,
                        slotIntervalMinutes: base.slotIntervalMinutes,
                      }))
                    );
                  }}
                  className="px-2.5 py-1 border border-white/20 bg-white/5 hover:bg-white/15 text-sm text-zinc-200 cursor-pointer"
                >
                  첫 요일 시간 전체복사
                </button>
              </div>
              <div className="space-y-2">
                {weeklyRules.map((rule) => (
                  <div
                    key={rule.dayOfWeek}
                    className={`grid grid-cols-2 sm:grid-cols-6 gap-2 p-2.5 border items-center ${
                      rule.active ? 'border-white/15 bg-black/40' : 'border-white/5 bg-black/20 opacity-60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setWeeklyRules((prev) =>
                          prev.map((r) => (r.dayOfWeek === rule.dayOfWeek ? { ...r, active: !r.active } : r))
                        )
                      }
                      className={`px-3 py-1.5 border text-sm font-mono cursor-pointer ${
                        rule.active ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-white font-bold' : 'border-white/15 text-zinc-400'
                      }`}
                    >
                      {DAY_LABELS[rule.dayOfWeek]} · {rule.active ? '영업' : '휴무'}
                    </button>
                    <div>
                      <label className="block text-zinc-400 mb-0.5">오픈</label>
                      <input
                        type="time"
                        disabled={!rule.active}
                        value={rule.startTime}
                        onChange={(e) =>
                          setWeeklyRules((prev) =>
                            prev.map((r) => (r.dayOfWeek === rule.dayOfWeek ? { ...r, startTime: e.target.value } : r))
                          )
                        }
                        className="w-full px-2 py-1 bg-black/50 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-0.5">마감</label>
                      <input
                        type="time"
                        disabled={!rule.active}
                        value={rule.endTime}
                        onChange={(e) =>
                          setWeeklyRules((prev) =>
                            prev.map((r) => (r.dayOfWeek === rule.dayOfWeek ? { ...r, endTime: e.target.value } : r))
                          )
                        }
                        className="w-full px-2 py-1 bg-black/50 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-0.5">브레이크 시작</label>
                      <input
                        type="time"
                        disabled={!rule.active}
                        value={rule.breakStart}
                        onChange={(e) =>
                          setWeeklyRules((prev) =>
                            prev.map((r) => (r.dayOfWeek === rule.dayOfWeek ? { ...r, breakStart: e.target.value } : r))
                          )
                        }
                        className="w-full px-2 py-1 bg-black/50 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-0.5">브레이크 종료</label>
                      <input
                        type="time"
                        disabled={!rule.active}
                        value={rule.breakEnd}
                        onChange={(e) =>
                          setWeeklyRules((prev) =>
                            prev.map((r) => (r.dayOfWeek === rule.dayOfWeek ? { ...r, breakEnd: e.target.value } : r))
                          )
                        }
                        className="w-full px-2 py-1 bg-black/50 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-0.5">간격(분)</label>
                      <input
                        type="number"
                        min={15}
                        step={15}
                        disabled={!rule.active}
                        value={rule.slotIntervalMinutes}
                        onChange={(e) =>
                          setWeeklyRules((prev) =>
                            prev.map((r) =>
                              r.dayOfWeek === rule.dayOfWeek
                                ? { ...r, slotIntervalMinutes: Math.max(15, Number(e.target.value)) }
                                : r
                            )
                          )
                        }
                        className="w-full px-2 py-1 bg-black/50 border border-white/20 text-white"
                      />
                    </div>
                  </div>
                ))}
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
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
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
                            {occupied && <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shrink-0" />}
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

            {/* 원격 웨이팅(줄서기) 대기열 관제 */}
            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                  <h2 className="font-serif-editorial text-xl text-white font-normal">웨이팅</h2>
                  <span className="px-2.5 py-0.5 border border-white/20 text-sm font-mono text-white">
                    {waitingQueue.length}팀
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busyKey === 'TOGGLE_WAIT'}
                  onClick={() =>
                    void sendAction(
                      { action: 'TOGGLE_WAITING_OPEN' },
                      waitingOpen ? '웨이팅 마감' : '웨이팅 오픈',
                      'TOGGLE_WAIT'
                    )
                  }
                  className={`px-3 py-1 border text-sm font-mono cursor-pointer ${
                    waitingOpen
                      ? 'border-[#3b82f6]/60 bg-[#3b82f6]/20 text-white'
                      : 'border-white/20 bg-white/10 text-zinc-300'
                  }`}
                >
                  {waitingOpen ? '대기 받는중' : '대기 마감'}
                </button>
              </div>
              {waitingQueue.length === 0 ? (
                <p className="text-sm font-mono text-zinc-400">현재 대기 중인 손님이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {waitingQueue.map((w: any) => (
                    <div key={w.id} className="p-3 border border-white/15 bg-black/40 space-y-2 text-sm font-mono">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 border border-[#3b82f6]/60 bg-[#3b82f6]/20 text-white font-bold">
                            #{w.ticketNo}
                          </span>
                          <span className="text-white font-bold">{w.name}</span>
                          <span className="text-zinc-300">{w.partySize}명</span>
                        </div>
                        <span className="text-zinc-300">
                          {w.status === 'CALLED' ? '호출됨' : '대기중'}
                        </span>
                      </div>
                      <div className="text-zinc-400">{w.phone}</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {w.status === 'WAITING' && (
                          <button
                            type="button"
                            disabled={busyKey === `WC_${w.id}`}
                            onClick={() =>
                              void sendAction({ action: 'WAIT_CALL', waitingId: w.id }, `#${w.ticketNo} 입장 호출`, `WC_${w.id}`)
                            }
                            className="px-3 py-1 border border-[#3b82f6]/60 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-white cursor-pointer"
                          >
                            입장호출
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyKey === `WS_${w.id}`}
                          onClick={() =>
                            void sendAction({ action: 'WAIT_SEAT', waitingId: w.id }, `#${w.ticketNo} 착석 완료`, `WS_${w.id}`)
                          }
                          className="px-3 py-1 border border-white/25 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                        >
                          착석
                        </button>
                        <button
                          type="button"
                          disabled={busyKey === `WN_${w.id}`}
                          onClick={() =>
                            void sendAction({ action: 'WAIT_NO_SHOW', waitingId: w.id }, `#${w.ticketNo} 노쇼`, `WN_${w.id}`)
                          }
                          className="px-3 py-1 border border-white/15 bg-black/40 hover:bg-white/10 text-zinc-300 cursor-pointer"
                        >
                          노쇼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 좌석 현황판 & 현장/휴무 관리 */}
            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
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
                    const guestPhone = String(b.meta?.attendee?.phone || '');
                    const phoneDigits = guestPhone.replace(/\D/g, '');
                    const isBlocked = Boolean(phoneDigits && blockedPhones.includes(phoneDigits));
                    const savedNote = phoneDigits ? customerNotes[phoneDigits] || '' : '';
                    const draftNote = phoneDigits ? (noteDrafts[phoneDigits] ?? savedNote) : '';
                    return (
                      <div key={b.id} className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-white font-medium truncate">
                            {when} · {b.partySize}명
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono">
                            {isBlocked && (
                              <span className="px-2 py-0.5 border border-white/40 bg-white/15 text-white font-bold">
                                차단됨
                              </span>
                            )}
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
                          {b.meta?.attendee?.name ? ` · ${b.meta.attendee.name} (${guestPhone})` : ''}
                        </div>
                        {b.meta?.attendee?.requests && (
                          <div className="text-sm text-zinc-300">요청: {b.meta.attendee.requests}</div>
                        )}
                        {phoneDigits.length >= 8 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-sm font-mono">
                            <input
                              type="text"
                              value={draftNote}
                              onChange={(e) =>
                                setNoteDrafts((prev) => ({ ...prev, [phoneDigits]: e.target.value }))
                              }
                              placeholder="고객 메모 (선호 좌석, 알레르기 등)"
                              className="flex-1 min-w-[140px] px-2.5 py-1 bg-black/40 border border-white/15 text-white text-sm"
                            />
                            <button
                              type="button"
                              disabled={busyKey === `NOTE_${phoneDigits}`}
                              onClick={() =>
                                void sendAction(
                                  { action: 'SAVE_CUSTOMER_NOTE', phone: phoneDigits, note: draftNote },
                                  '고객 메모 저장',
                                  `NOTE_${phoneDigits}`
                                )
                              }
                              className="px-2.5 py-1 border border-white/20 bg-white/5 hover:bg-white/15 text-white cursor-pointer"
                            >
                              메모저장
                            </button>
                            <button
                              type="button"
                              disabled={busyKey === `BLK_${phoneDigits}`}
                              onClick={() =>
                                void sendAction(
                                  { action: 'TOGGLE_BLOCK_CUSTOMER', phone: phoneDigits },
                                  isBlocked ? '차단 해제' : '예약 차단',
                                  `BLK_${phoneDigits}`
                                )
                              }
                              className="px-2.5 py-1 border border-white/20 bg-black/40 hover:bg-white/15 text-zinc-200 cursor-pointer"
                            >
                              {isBlocked ? '차단해제' : '차단'}
                            </button>
                          </div>
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
