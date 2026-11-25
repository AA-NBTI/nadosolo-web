'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, LogOut, Trash2, KeyRound, UserPlus } from 'lucide-react';
import type { OopsLocale } from '@/lib/oops/i18n';
import type { OopsMemberPublic } from '@/lib/oops/memberStore';
import {
  COUNTRIES_REGISTRY,
  ORDERED_COUNTRY_CODES,
  type EnlistmentRecord,
} from '@/lib/oops/movementStore';

interface OopsAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: OopsLocale;
  member: OopsMemberPublic | null;
  provisionalRecord: EnlistmentRecord | null;
  selectedCountry: string;
  initialMode?: 'LOGIN' | 'REGISTER';
  onAuthSuccess: (member: OopsMemberPublic) => void;
  onLogoutSuccess: () => void;
  onWithdrawSuccess: () => void;
}

export default function OopsAuthModal({
  isOpen,
  onClose,
  locale,
  member,
  provisionalRecord,
  selectedCountry,
  initialMode = 'LOGIN',
  onAuthSuccess,
  onLogoutSuccess,
  onWithdrawSuccess,
}: OopsAuthModalProps) {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [callsign, setCallsign] = useState(provisionalRecord?.callsign || '');
  const [countryCode, setCountryCode] = useState(
    member?.countryCode || provisionalRecord?.countryCode || selectedCountry || 'KR'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  if (!isOpen) return null;

  const isKo = locale === 'ko';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/oops/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGIN', identifier, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        return;
      }
      onAuthSuccess(data.member);
      onClose();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/oops/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGISTER',
          email,
          password,
          callsign,
          countryCode,
          preferredSerialNo: provisionalRecord?.enlistmentNo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || '가입에 실패했습니다.');
        return;
      }
      onAuthSuccess(data.member);
      onClose();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/oops/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          callsign: callsign || member?.callsign,
          countryCode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || '수정에 실패했습니다.');
        return;
      }
      onAuthSuccess(data.member);
      setNotice(isKo ? '대원 정보가 저장되었습니다.' : 'Profile updated.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await fetch('/api/oops/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGOUT' }),
      });
      onLogoutSuccess();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/oops/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'WITHDRAW' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || '탈퇴 처리에 실패했습니다.');
        return;
      }
      onWithdrawSuccess();
      setConfirmWithdraw(false);
      onClose();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const activeCountry = member
    ? COUNTRIES_REGISTRY[member.countryCode] || COUNTRIES_REGISTRY.KR
    : COUNTRIES_REGISTRY[countryCode] || COUNTRIES_REGISTRY.KR;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0_#d4d4d8] text-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-pulse" />
            <span className="text-xs sm:text-sm font-black tracking-wider text-[#ffc900]">
              {member
                ? isKo
                  ? 'OOPS 정식 대원 관제실'
                  : 'OOPS VERIFIED MEMBER'
                : isKo
                  ? 'OOPS 대원 본부 인증'
                  : 'OOPS RESISTANCE AUTH'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border-2 border-[#dc2626] text-[#dc2626] text-xs font-bold">
              ⚠️ {error}
            </div>
          )}
          {notice && (
            <div className="p-2.5 bg-emerald-50 border-2 border-emerald-700 text-emerald-800 text-xs font-bold">
              ✅ {notice}
            </div>
          )}

          {/* 로그인 상태: 내 군번 관리 · 정보 수정 · 로그아웃 · 완전 탈퇴 */}
          {member ? (
            <div className="space-y-4">
              <div className="bg-zinc-900 text-white border-2 border-black p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500 text-black flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED PERMANENT
                  </span>
                  <span className="text-xs text-zinc-400">{member.email}</span>
                </div>
                <div className="text-xl font-black text-[#ff4d00]">
                  #{member.serialLabel}
                </div>
                <div className="text-xs text-[#ffc900] font-bold">
                  {activeCountry.flag} {activeCountry.name[locale] || activeCountry.name.en} · {member.callsign}
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    {isKo ? '소속 국가' : 'Country'}
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  >
                    {ORDERED_COUNTRY_CODES.map((code) => {
                      const c = COUNTRIES_REGISTRY[code];
                      if (!c) return null;
                      return (
                        <option key={code} value={code}>
                          {c.flag} {c.name[locale] || c.name.en} ({code})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    {isKo ? '콜사인 (호출명)' : 'Callsign'}
                  </label>
                  <input
                    type="text"
                    value={callsign || member.callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    maxLength={24}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 py-2.5 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
                  >
                    {isKo ? '저장' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={busy}
                    className="px-4 py-2.5 bg-white hover:bg-zinc-100 text-black font-bold text-xs border-2 border-black flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isKo ? '로그아웃' : 'Logout'}</span>
                  </button>
                </div>
              </form>

              {/* 서명 철회 및 완전 탈퇴 영역 */}
              <div className="pt-3 border-t-2 border-zinc-200">
                {!confirmWithdraw ? (
                  <button
                    type="button"
                    onClick={() => setConfirmWithdraw(true)}
                    className="text-[11px] text-zinc-500 hover:text-[#dc2626] underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isKo ? '서명 철회 및 완전 탈퇴' : 'Withdraw Pledge & Delete Account'}</span>
                  </button>
                ) : (
                  <div className="p-3 bg-red-50 border-2 border-[#dc2626] space-y-2">
                    <div className="text-xs font-bold text-[#dc2626]">
                      {isKo
                        ? '탈퇴 시 영구 군번과 서명 기록이 즉시 파기되며 복구할 수 없습니다. 진행하시겠습니까?'
                        : 'Deleting your account permanently erases your serial number and signature.'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleWithdraw}
                        disabled={busy}
                        className="px-3 py-1.5 bg-[#dc2626] text-white text-xs font-black border border-black cursor-pointer"
                      >
                        {isKo ? '탈퇴' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmWithdraw(false)}
                        className="px-3 py-1.5 bg-white text-black text-xs font-bold border border-black cursor-pointer"
                      >
                        {isKo ? '취소' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 비로그인 상태: 로그인 / 가입 2탭 */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('LOGIN');
                    setError(null);
                  }}
                  className={`py-2 text-xs font-black border-2 border-black flex items-center justify-center gap-1 cursor-pointer ${
                    tab === 'LOGIN'
                      ? 'bg-zinc-900 text-[#ffc900] shadow-[2px_2px_0_#d4d4d8]'
                      : 'bg-[#f4f4f0] text-zinc-700'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isKo ? '로그인' : 'Login'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('REGISTER');
                    setError(null);
                  }}
                  className={`py-2 text-xs font-black border-2 border-black flex items-center justify-center gap-1 cursor-pointer ${
                    tab === 'REGISTER'
                      ? 'bg-[#ff4d00] text-white shadow-[2px_2px_0_#d4d4d8]'
                      : 'bg-[#f4f4f0] text-zinc-700'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isKo ? '정식 가입' : 'Register'}</span>
                </button>
              </div>

              {tab === 'LOGIN' ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      {isKo ? '이메일 또는 군번 (예: KR-018492)' : 'Email or Serial (e.g. KR-018492)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="user@example.com / KR-018492"
                      className="w-full bg-white border-2 border-black p-2.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      {isKo ? '비밀번호' : 'Password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-white border-2 border-black p-2.5 text-xs font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 bg-zinc-900 hover:bg-black text-[#ffc900] font-black text-xs border-2 border-black shadow-[3px_3px_0_#d4d4d8] cursor-pointer"
                  >
                    {busy ? '...' : isKo ? '대원 로그인' : 'Login'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  {provisionalRecord && (
                    <div className="p-2.5 bg-[#ffc900]/30 border-2 border-black text-[11px] font-bold text-black">
                      🔒 {isKo
                        ? `현재 임시 군번(#${provisionalRecord.countryCode}-${String(provisionalRecord.enlistmentNo).padStart(6, '0')})이 이 계정에 영구 귀속됩니다.`
                        : `Your provisional serial #${provisionalRecord.enlistmentNo} will be permanently linked.`}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      {isKo ? '이메일 *' : 'Email *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="resistance@example.com"
                      className="w-full bg-white border-2 border-black p-2.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      {isKo ? '비밀번호 (6자 이상) *' : 'Password (min 6 chars) *'}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-white border-2 border-black p-2.5 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        {isKo ? '소속 국가' : 'Country'}
                      </label>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                      >
                        {ORDERED_COUNTRY_CODES.map((code) => {
                          const c = COUNTRIES_REGISTRY[code];
                          if (!c) return null;
                          return (
                            <option key={code} value={code}>
                              {c.flag} {c.name[locale] || c.name.en}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        {isKo ? '콜사인 (선택)' : 'Callsign'}
                      </label>
                      <input
                        type="text"
                        value={callsign}
                        onChange={(e) => setCallsign(e.target.value)}
                        placeholder="OP-HERO"
                        maxLength={24}
                        className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 bg-[#ff4d00] hover:bg-[#ff621f] text-white font-black text-xs border-2 border-black shadow-[3px_3px_0_#d4d4d8] cursor-pointer"
                  >
                    {busy
                      ? '...'
                      : isKo
                        ? '정식 대원 가입 및 영구 군번 발급'
                        : 'Register & Claim Permanent Serial'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
