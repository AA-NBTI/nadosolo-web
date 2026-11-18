'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import { nadoSoloSupabaseService } from '@/lib/supabase/service';
import { isReservedAdminIdentifier } from '@/modules/identity';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'SIGNUP' : 'LOGIN';
  const nextUrl = searchParams.get('next') || '/dashboard';

  const { loginAsUser } = useNadoSoloEngine();

  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP'>(initialTab);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1기능 1모듈 단일 회원가입 상태
  const [handleInput, setHandleInput] = useState('');
  const [handleCheckStatus, setHandleCheckStatus] = useState<
    'IDLE' | 'AVAILABLE' | 'DUPLICATE'
  >('IDLE');
  const [emailInput, setEmailInput] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const normalizedHandle = handleInput.startsWith('@')
    ? handleInput.toLowerCase()
    : `@${(handleInput || 'new_member').toLowerCase()}`;

  const checkHandleDuplicate = async () => {
    const raw = handleInput.trim().replace(/^@/, '').toLowerCase();
    if (!raw) {
      setErrorMsg('아이디를 입력해 주세요.');
      setHandleCheckStatus('IDLE');
      return;
    }
    setErrorMsg(null);

    // 시스템 관리자 예약어 차단
    if (isReservedAdminIdentifier(raw)) {
      setErrorMsg('관리자 예약 아이디는 사용할 수 없습니다.');
      setHandleCheckStatus('DUPLICATE');
      return;
    }

    // Supabase 실서버 DB에서 실제 등록 여부 실시간 조회 (SSOT)
    try {
      const existing = await nadoSoloSupabaseService.getProfileByIdOrHandle(raw);

      if (existing) {
        setHandleCheckStatus('DUPLICATE');
        setErrorMsg('이미 사용 중인 아이디입니다.');
      } else {
        setHandleCheckStatus('AVAILABLE');
      }
    } catch {
      setHandleCheckStatus('AVAILABLE');
    }
  };

  // 인증 및 로그인 처리
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedId = loginId.trim().replace(/^@/, '');

    if (!trimmedId) {
      setErrorMsg('아이디를 입력해 주세요.');
      return;
    }

    // 전 계정 비밀번호 규격: aa1111
    if (password !== 'aa1111') {
      setErrorMsg('비밀번호가 올바르지 않습니다.');
      return;
    }

    // 관리자 계정은 일반 회원 DB 조회 없이 전용 관리자 세션으로 분리 로그인
    if (trimmedId.toLowerCase() === 'admin' || trimmedId === '관리자') {
      loginAsUser({
        userId: 'ADMIN_01',
        handle: '@admin',
        role: 'ADMIN',
        email: 'admin@nadosolo.com',
        nickname: '관리자',
        phone: '010-0000-0000',
        jobTitle: '시스템 총괄',
        gender: 'M',
        birthYear: 1990,
        authProvider: 'EMAIL',
        verifiedBadge: 'ADMIN',
        sessionCount: 99,
      });
      router.push('/admin');
      return;
    }

    // Supabase DB에 저장된 실제 프로필 존재 여부 조회 (순수 SSOT)
    try {
      const dbProfile = await nadoSoloSupabaseService.getProfileByIdOrHandle(trimmedId);

      if (dbProfile) {
        const isAdmin = dbProfile.handle === '@admin' || dbProfile.id === 'ADMIN_01';
        loginAsUser({
          userId: dbProfile.id,
          handle: dbProfile.handle,
          role: isAdmin ? 'ADMIN' : 'MEMBER',
          email: dbProfile.email ?? `${trimmedId}@nadosolo.com`,
          nickname: dbProfile.nickname,
          phone: dbProfile.phone ?? '010-0000-0000',
          jobTitle: dbProfile.job_title ?? (isAdmin ? '시스템 총괄' : '일반 회원'),
          gender: dbProfile.gender,
          birthYear: dbProfile.birth_year,
          residenceCity: dbProfile.residence_city,
          residenceDistrict: dbProfile.residence_district,
          authProvider: 'EMAIL',
          verifiedBadge: dbProfile.verified_badge ?? (isAdmin ? 'ADMIN' : '본인인증 완료'),
          sessionCount: (dbProfile.session_count ?? 1) + 1,
        });
        router.push(isAdmin ? '/admin' : nextUrl);
        return;
      }
    } catch (err) {
      console.warn('[handleLoginSubmit] DB lookup error:', err);
    }

    setErrorMsg('등록되지 않은 회원입니다. 회원가입을 먼저 진행해 주세요.');
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!emailInput.trim()) {
      setErrorMsg('이메일을 입력해 주세요.');
      return;
    }
    if (!handleInput.trim()) {
      setErrorMsg('아이디를 입력해 주세요.');
      return;
    }
    if (isReservedAdminIdentifier(handleInput)) {
      setErrorMsg('관리자 예약 아이디는 회원가입할 수 없습니다.');
      return;
    }
    if (handleCheckStatus !== 'AVAILABLE') {
      setErrorMsg('아이디 중복확인을 진행해 주세요.');
      return;
    }
    if (!signupPassword) {
      setErrorMsg('비밀번호를 입력해 주세요.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 1기능 1모듈 원칙: 회원가입 모듈은 '계정 생성 및 로그인'만 수행 후 즉시 대시보드(프로필/테이블 모듈)로 이동
    const memberUserId = `U_${handleInput.trim().replace(/^@/, '')}`;
    loginAsUser({
      userId: memberUserId,
      handle: normalizedHandle,
      role: 'MEMBER',
      email: emailInput,
      nickname: handleInput,
      phone: '미등록',
      jobTitle: '미입력',
      gender: 'F',
      birthYear: 1995,
      authProvider: 'EMAIL',
      verifiedBadge: '회원가입 완료',
      sessionCount: 1,
    });

    router.push(nextUrl);
  };

  return (
    <main className="w-full min-h-screen bg-[#07080a] text-[#f5f2eb] px-4 py-12 flex items-center justify-center selection:bg-[#f04f74] selection:text-white">
      {/* ===================================================================
          절제된 럭셔리 다크 카드 컨테이너 (CORE: Club 벨벳 로프 스타일)
          =================================================================== */}
      <div className="w-full max-w-[460px] bg-[#0c0d12] p-8 sm:p-10 border border-white/[0.08] shadow-2xl relative">
        {/* 우측 상단 닫기(X) 버튼 */}
        <Link
          href="/"
          className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-sm font-mono"
          aria-label="닫기"
        >
          ✕
        </Link>

        {/* 상단 타이틀 */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="space-y-1.5">
            <span className="text-sm font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold">
              PRIVATE SANCTUARY
            </span>
            <h1 className="font-serif-editorial text-2xl font-normal text-white">
              {tab === 'LOGIN' ? '멤버십 로그인' : '멤버십 가입'}
            </h1>
            <p className="text-sm text-zinc-300 font-light mt-1">
              {tab === 'LOGIN'
                ? '계정에 로그인하고 배정된 프라이빗 테이블을 확인하세요.'
                : '계정을 생성하고 프라이빗 살롱에 입장하세요.'}
            </p>
          </div>
        </div>

        {/* 로그인 / 회원가입 탭 스위치 */}
        <div className="grid grid-cols-2 bg-black/40 p-1 border border-white/10 mb-7">
            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setErrorMsg(null);
              }}
              className={`py-2.5 text-sm font-mono tracking-wider transition-all cursor-pointer ${
                tab === 'LOGIN'
                  ? 'border border-white/30 bg-white/[0.08] text-white font-semibold'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('SIGNUP');
                setErrorMsg(null);
              }}
              className={`py-2.5 text-sm font-mono tracking-wider transition-all cursor-pointer ${
                tab === 'SIGNUP'
                  ? 'border border-white/30 bg-white/[0.08] text-white font-semibold'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              회원가입
            </button>
          </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-transparent border border-white/20 text-white text-sm font-mono text-center">
            {errorMsg}
          </div>
        )}

        {/* -------------------------------------------------------------
            [탭 1] 로그인 폼
            ------------------------------------------------------------- */}
        {tab === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                아이디 (Username)
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="아이디 입력"
                className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                비밀번호 (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
              />
            </div>

            {/* 메인 로그인 CTA 버튼 */}
            <button
              type="submit"
              className="w-full py-3.5 border border-white/30 bg-white/10 hover:bg-white/20 text-white text-sm font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer"
            >
              로그인
            </button>

            <div className="text-center pt-2">
              <span className="text-sm text-zinc-400 font-light">
                아직 나도솔로 계정이 없으신가요?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTab('SIGNUP');
                  setErrorMsg(null);
                }}
                className="text-sm font-mono text-white underline hover:text-zinc-200 cursor-pointer ml-1"
              >
                회원가입하기
              </button>
            </div>
          </form>
        ) : (
          /* -------------------------------------------------------------
              [탭 2] 1기능 1모듈 단일 회원가입 폼
             ------------------------------------------------------------- */
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                이메일 <span className="text-[#f04f74]">*</span>
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                아이디 <span className="text-[#f04f74]">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => {
                    setHandleInput(
                      e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
                    );
                    setHandleCheckStatus('IDLE');
                  }}
                  required
                  className="flex-1 px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={checkHandleDuplicate}
                  className="px-4 py-3 border border-white/20 hover:border-white/40 bg-black/40 text-sm font-mono text-zinc-200 hover:text-white uppercase transition-colors shrink-0 cursor-pointer"
                >
                  중복확인
                </button>
              </div>
              {handleCheckStatus === 'AVAILABLE' && (
                <p className="text-sm text-zinc-200 font-mono mt-1.5">
                  ✓ 사용 가능한 아이디입니다.
                </p>
              )}
              {handleCheckStatus === 'DUPLICATE' && (
                <p className="text-sm text-white font-mono mt-1.5">
                  ✕ 이미 사용 중인 아이디입니다.
                </p>
              )}
            </div>

            {/* 비밀번호 & 비밀번호 확인 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                  비밀번호 <span className="text-[#f04f74]">*</span>
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-mono tracking-wider text-zinc-300 mb-1.5 uppercase">
                  비밀번호 확인 <span className="text-[#f04f74]">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-white/40 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
                />
              </div>
            </div>

            {confirmPassword && (
              <p
                className={`text-sm font-mono ${
                  signupPassword === confirmPassword
                    ? 'text-zinc-200'
                    : 'text-white'
                }`}
              >
                {signupPassword === confirmPassword
                  ? '✓ 비밀번호가 일치합니다.'
                  : '✕ 비밀번호가 일치하지 않습니다.'}
              </p>
            )}

            {/* 메인 가입 CTA 버튼 */}
            <button
              type="submit"
              className="w-full py-3.5 border border-white/30 bg-white/10 hover:bg-white/20 text-white text-sm font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer mt-2"
            >
              회원가입
            </button>

            <div className="text-center pt-2">
              <span className="text-sm text-zinc-400 font-light">
                이미 계정이 있으신가요?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTab('LOGIN');
                  setErrorMsg(null);
                }}
                className="text-sm font-mono text-white underline hover:text-zinc-200 cursor-pointer ml-1"
              >
                로그인하기
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-zinc-400">
          로딩 중...
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
