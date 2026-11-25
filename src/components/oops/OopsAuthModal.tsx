'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, LogOut, Trash2, KeyRound, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import type { OopsLocale } from '@/lib/oops/i18n';
import type { OopsMemberPublic } from '@/lib/oops/memberStore';
import { OOPS_MILITARY_RANKS, resolveRankByPoints } from '@/lib/oops/rankSystem';
import {
  COUNTRIES_REGISTRY,
  ORDERED_COUNTRY_CODES,
  type EnlistmentRecord,
} from '@/lib/oops/movementStore';

const AUTH_I18N: Record<
  OopsLocale,
  {
    outpostTitle: string;
    loginTab: string;
    registerTab: string;
    loginBtn: string;
    registerBtn: string;
    saveBtn: string;
    logoutBtn: string;
    withdrawBtn: string;
    confirmBtn: string;
    cancelBtn: string;
    rankTableBtn: string;
    idLabel: string;
    emailLabel: string;
    pwLabel: string;
    countryLabel: string;
    callsignLabel: string;
    nextRankLabel: string;
    maxRankLabel: string;
    withdrawConfirm: string;
    savedMsg: string;
  }
> = {
  ko: {
    outpostTitle: '초소',
    loginTab: '로그인',
    registerTab: '가입',
    loginBtn: '로그인',
    registerBtn: '가입',
    saveBtn: '저장',
    logoutBtn: '로그아웃',
    withdrawBtn: '탈퇴',
    confirmBtn: '확인',
    cancelBtn: '취소',
    rankTableBtn: '계급표',
    idLabel: '이메일 또는 군번 (예: KR-018492)',
    emailLabel: '이메일',
    pwLabel: '비밀번호 (6자 이상)',
    countryLabel: '국가',
    callsignLabel: '콜사인',
    nextRankLabel: '다음 계급',
    maxRankLabel: '최고 계급',
    withdrawConfirm: '탈퇴 시 군번과 기록이 즉시 파기됩니다.',
    savedMsg: '저장됨',
  },
  en: {
    outpostTitle: 'OUTPOST',
    loginTab: 'Login',
    registerTab: 'Register',
    loginBtn: 'Login',
    registerBtn: 'Register',
    saveBtn: 'Save',
    logoutBtn: 'Logout',
    withdrawBtn: 'Withdraw',
    confirmBtn: 'Confirm',
    cancelBtn: 'Cancel',
    rankTableBtn: 'Ranks',
    idLabel: 'Email or Serial (e.g. KR-018492)',
    emailLabel: 'Email',
    pwLabel: 'Password (min 6 chars)',
    countryLabel: 'Country',
    callsignLabel: 'Callsign',
    nextRankLabel: 'Next',
    maxRankLabel: 'Max Rank',
    withdrawConfirm: 'Account and serial will be permanently erased.',
    savedMsg: 'Saved',
  },
  ja: {
    outpostTitle: '哨所',
    loginTab: 'ログイン',
    registerTab: '登録',
    loginBtn: 'ログイン',
    registerBtn: '登録',
    saveBtn: '保存',
    logoutBtn: 'ログアウト',
    withdrawBtn: '脱退',
    confirmBtn: '確認',
    cancelBtn: '取消',
    rankTableBtn: '階級表',
    idLabel: 'メールまたは軍番 (例: KR-018492)',
    emailLabel: 'メール',
    pwLabel: 'パスワード (6文字以上)',
    countryLabel: '国家',
    callsignLabel: 'コールサイン',
    nextRankLabel: '次期階級',
    maxRankLabel: '最高階級',
    withdrawConfirm: '脱退時に軍番と記録が即時破棄されます。',
    savedMsg: '保存済',
  },
  zh: {
    outpostTitle: '哨所',
    loginTab: '登录',
    registerTab: '注册',
    loginBtn: '登录',
    registerBtn: '注册',
    saveBtn: '保存',
    logoutBtn: '登出',
    withdrawBtn: '注销',
    confirmBtn: '确认',
    cancelBtn: '取消',
    rankTableBtn: '军衔表',
    idLabel: '邮箱或编号 (例: KR-018492)',
    emailLabel: '邮箱',
    pwLabel: '密码 (至少6位)',
    countryLabel: '国家',
    callsignLabel: '代号',
    nextRankLabel: '下一军衔',
    maxRankLabel: '最高军衔',
    withdrawConfirm: '注销后编号与记录将立即销毁。',
    savedMsg: '已保存',
  },
  es: {
    outpostTitle: 'PUESTO',
    loginTab: 'Acceso',
    registerTab: 'Registro',
    loginBtn: 'Entrar',
    registerBtn: 'Registrar',
    saveBtn: 'Guardar',
    logoutBtn: 'Salir',
    withdrawBtn: 'Baja',
    confirmBtn: 'Confirmar',
    cancelBtn: 'Cancelar',
    rankTableBtn: 'Rangos',
    idLabel: 'Correo o Serie (ej. KR-018492)',
    emailLabel: 'Correo',
    pwLabel: 'Contraseña (mín. 6)',
    countryLabel: 'País',
    callsignLabel: 'Alias',
    nextRankLabel: 'Siguiente',
    maxRankLabel: 'Rango Máx',
    withdrawConfirm: 'Tu serie y registro serán eliminados.',
    savedMsg: 'Guardado',
  },
};

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
  const [showRankTable, setShowRankTable] = useState(false);

  if (!isOpen) return null;

  const t = AUTH_I18N[locale] || AUTH_I18N.ko;
  const rankInfo = resolveRankByPoints(member?.points ?? 10);

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
        setError(data.error || 'Error');
        return;
      }
      onAuthSuccess(data.member);
      onClose();
    } catch {
      setError('Network error');
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
        setError(data.error || 'Error');
        return;
      }
      onAuthSuccess(data.member);
      onClose();
    } catch {
      setError('Network error');
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
        setError(data.error || 'Error');
        return;
      }
      onAuthSuccess(data.member);
      setNotice(t.savedMsg);
    } catch {
      setError('Network error');
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
        setError(data.error || 'Error');
        return;
      }
      onWithdrawSuccess();
      setConfirmWithdraw(false);
      onClose();
    } catch {
      setError('Network error');
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
        className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0_#d4d4d8] text-black overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 초소 헤더 */}
        <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between border-b-4 border-black shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-pulse" />
            <span className="text-xs sm:text-sm font-black tracking-wider text-[#ffc900]">
              OOPS // {t.outpostTitle}
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

        <div className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-red-50 border-2 border-[#dc2626] text-[#dc2626] text-xs font-bold">
              {error}
            </div>
          )}
          {notice && (
            <div className="p-2.5 bg-emerald-50 border-2 border-emerald-700 text-emerald-800 text-xs font-bold">
              {notice}
            </div>
          )}

          {/* 로그인 상태: 군번, 계급, 진급 게이지, 계급표, 정보 수정, 탈퇴 */}
          {member ? (
            <div className="space-y-4">
              <div className="bg-zinc-900 text-white border-2 border-black p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500 text-black flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {rankInfo.current.insignia}{' '}
                    {rankInfo.current.names[locale] || rankInfo.current.names.en}
                  </span>
                  <span className="text-xs text-zinc-400">{member.email}</span>
                </div>
                <div className="text-xl font-black text-[#ff4d00]">#{member.serialLabel}</div>
                <div className="text-xs text-[#ffc900] font-bold">
                  {activeCountry.flag} {activeCountry.name[locale] || activeCountry.name.en} · {member.callsign}
                </div>

                {/* 계급 진급 진행도 */}
                <div className="pt-2 border-t border-zinc-700 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-300 font-bold">
                    <span>{member.points} XP</span>
                    <span>
                      {rankInfo.next
                        ? `${t.nextRankLabel}: ${rankInfo.next.names[locale] || rankInfo.next.names.en} (${rankInfo.next.minPoints} XP)`
                        : t.maxRankLabel}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 border border-zinc-600 overflow-hidden">
                    <div
                      className="h-full bg-[#ffc900] transition-all duration-500"
                      style={{ width: `${rankInfo.progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      {t.countryLabel}
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
                      {t.callsignLabel}
                    </label>
                    <input
                      type="text"
                      value={callsign || member.callsign}
                      onChange={(e) => setCallsign(e.target.value)}
                      maxLength={24}
                      className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 py-2.5 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
                  >
                    {t.saveBtn}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={busy}
                    className="px-4 py-2.5 bg-white hover:bg-zinc-100 text-black font-bold text-xs border-2 border-black flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.logoutBtn}</span>
                  </button>
                </div>
              </form>

              {/* 계급 체계 기준표 & 탈퇴 영역 */}
              <div className="pt-3 border-t-2 border-zinc-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowRankTable((prev) => !prev)}
                  className="text-xs font-black text-black hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{t.rankTableBtn}</span>
                  {showRankTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {!confirmWithdraw && (
                  <button
                    type="button"
                    onClick={() => setConfirmWithdraw(true)}
                    className="text-xs text-zinc-500 hover:text-[#dc2626] underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.withdrawBtn}</span>
                  </button>
                )}
              </div>

              {/* 계급표 (클릭 시 펼침) */}
              {showRankTable && (
                <div className="bg-[#f4f4f0] border-2 border-black p-3 space-y-1.5 text-xs">
                  {OOPS_MILITARY_RANKS.map((r) => {
                    const isMine = r.code === rankInfo.current.code;
                    return (
                      <div
                        key={r.code}
                        className={`flex items-center justify-between px-2 py-1 border ${
                          isMine ? 'bg-zinc-900 text-[#ffc900] border-black font-black' : 'bg-white border-zinc-300'
                        }`}
                      >
                        <span>
                          {r.insignia} {r.names[locale] || r.names.en}
                        </span>
                        <span className="text-[10px] opacity-80">{r.criteria[locale] || r.criteria.en}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 탈퇴 2차 확인 */}
              {confirmWithdraw && (
                <div className="p-3 bg-red-50 border-2 border-[#dc2626] space-y-2">
                  <div className="text-xs font-bold text-[#dc2626]">{t.withdrawConfirm}</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleWithdraw}
                      disabled={busy}
                      className="px-3 py-1.5 bg-[#dc2626] text-white text-xs font-black border border-black cursor-pointer"
                    >
                      {t.confirmBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmWithdraw(false)}
                      className="px-3 py-1.5 bg-white text-black text-xs font-bold border border-black cursor-pointer"
                    >
                      {t.cancelBtn}
                    </button>
                  </div>
                </div>
              )}
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
                  <span>{t.loginTab}</span>
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
                  <span>{t.registerTab}</span>
                </button>
              </div>

              {tab === 'LOGIN' ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      {t.idLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="KR-018492"
                      className="w-full bg-white border-2 border-black p-2.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      {t.pwLabel}
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
                    {busy ? '...' : t.loginBtn}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  {provisionalRecord && (
                    <div className="p-2.5 bg-[#ffc900]/30 border-2 border-black text-[11px] font-bold text-black">
                      #{provisionalRecord.countryCode}-{String(provisionalRecord.enlistmentNo).padStart(6, '0')}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      {t.emailLabel} *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-white border-2 border-black p-2.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      {t.pwLabel} *
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
                        {t.countryLabel}
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
                        {t.callsignLabel}
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
                    {busy ? '...' : t.registerBtn}
                  </button>
                </form>
              )}

              {/* 비로그인 상태에서도 계급 기준표 확인 가능 */}
              <div className="pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowRankTable((prev) => !prev)}
                  className="text-xs font-black text-zinc-700 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <span>{t.rankTableBtn}</span>
                  {showRankTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showRankTable && (
                  <div className="mt-2 bg-[#f4f4f0] border-2 border-black p-2.5 space-y-1 text-xs">
                    {OOPS_MILITARY_RANKS.map((r) => (
                      <div key={r.code} className="flex items-center justify-between px-2 py-1 bg-white border border-zinc-300">
                        <span className="font-bold">
                          {r.insignia} {r.names[locale] || r.names.en}
                        </span>
                        <span className="text-[10px] text-zinc-500">{r.criteria[locale] || r.criteria.en}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
