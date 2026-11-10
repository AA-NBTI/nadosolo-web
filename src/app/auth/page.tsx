'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';

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

  // 1단계 회원가입 상태 (휴대폰 번호 제거, 비밀번호 확인 추가)
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [handleInput, setHandleInput] = useState('');
  const [handleCheckStatus, setHandleCheckStatus] = useState<
    'IDLE' | 'AVAILABLE' | 'DUPLICATE'
  >('IDLE');
  const [emailInput, setEmailInput] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');

  // 2단계 내 추가 정보 입력 상태
  const [extraPhone, setExtraPhone] = useState('');
  const [extraGender, setExtraGender] = useState<'F' | 'M'>('F');
  const [extraBirthYear, setExtraBirthYear] = useState(1995);
  const [extraJob, setExtraJob] = useState('');

  const normalizedHandle = handleInput.startsWith('@')
    ? handleInput.toLowerCase()
    : `@${(handleInput || 'new_member').toLowerCase()}`;

  const checkHandleDuplicate = () => {
    const raw = handleInput.trim().replace(/^@/, '').toLowerCase();
    if (!raw) {
      setErrorMsg('아이디를 입력해 주세요.');
      setHandleCheckStatus('IDLE');
      return;
    }
    setErrorMsg(null);
    const reservedIds = ['admin', 'aa', 'bb'];
    if (reservedIds.includes(raw)) {
      setHandleCheckStatus('DUPLICATE');
    } else {
      setHandleCheckStatus('AVAILABLE');
    }
  };

  // 인증 및 로그인 처리
  const handleLoginSubmit = (e: React.FormEvent) => {
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

    // 1. 관리자 계정 (id: admin / pass: aa1111)
    if (trimmedId.toLowerCase() === 'admin') {
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

    // 2. 검증 회원 aa (여성 / 1994년생 / 브랜드 마케터)
    if (trimmedId.toLowerCase() === 'aa') {
      loginAsUser({
        userId: 'USER_AA',
        handle: '@aa',
        role: 'MEMBER',
        email: 'aa@nadosolo.com',
        nickname: '김에이',
        phone: '010-1111-2222',
        jobTitle: '브랜드 마케터',
        gender: 'F',
        birthYear: 1994,
        authProvider: 'EMAIL',
        verifiedBadge: '본인인증 완료',
        sessionCount: 3,
      });
      router.push(nextUrl);
      return;
    }

    // 3. 검증 회원 bb (남성 / 1992년생 / IT 기획자)
    if (trimmedId.toLowerCase() === 'bb') {
      loginAsUser({
        userId: 'USER_BB',
        handle: '@bb',
        role: 'MEMBER',
        email: 'bb@nadosolo.com',
        nickname: '이비비',
        phone: '010-3333-4444',
        jobTitle: 'IT 기획자',
        gender: 'M',
        birthYear: 1992,
        authProvider: 'EMAIL',
        verifiedBadge: '본인인증 완료',
        sessionCount: 2,
      });
      router.push(nextUrl);
      return;
    }

    // 4. 기타 회원 (아이디 자유 로그인)
    loginAsUser({
      userId: `U_${trimmedId}`,
      handle: `@${trimmedId}`,
      role: 'MEMBER',
      email: `${trimmedId}@nadosolo.com`,
      nickname: trimmedId,
      phone: '010-0000-0000',
      jobTitle: '일반 회원',
      gender: 'F',
      birthYear: 1995,
      authProvider: 'EMAIL',
      verifiedBadge: '본인인증 완료',
      sessionCount: 1,
    });
    router.push(nextUrl);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
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

    // 회원가입 완료 즉시 첫 로그인 처리 (아이디와 이메일로 1차 가입)
    loginAsUser({
      userId: `U_${Date.now().toString().slice(-4)}`,
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

    // 첫 로그인 후 프로필 추가 정보(닉네임 포함) 입력 단계로 진입
    setNickname(handleInput);
    setSignupStep(2);
  };

  const handleStep2Complete = (skipExtra = false) => {
    if (!skipExtra) {
      loginAsUser({
        userId: `U_${Date.now().toString().slice(-4)}`,
        handle: normalizedHandle,
        role: 'MEMBER',
        email: emailInput || `${handleInput}@nadosolo.com`,
        nickname: nickname.trim() || handleInput,
        phone: extraPhone || '010-0000-0000',
        jobTitle: extraJob || '미입력',
        gender: extraGender,
        birthYear: extraBirthYear,
        authProvider: 'EMAIL',
        verifiedBadge: '프로필 등록 완료',
        sessionCount: 1,
      });
    }
    router.push('/dashboard');
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
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-sm font-mono"
          aria-label="닫기"
        >
          ✕
        </Link>

        {/* 상단 타이틀 (로고 제거 완료) */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold">
              PRIVATE SANCTUARY
            </span>
            <h1 className="font-serif-editorial text-2xl font-normal text-white">
              {tab === 'LOGIN' ? '멤버십 로그인' : '멤버십 가입'}
            </h1>
            <p className="text-xs text-zinc-400 font-light mt-1">
              {tab === 'LOGIN'
                ? '계정에 로그인하고 배정된 프라이빗 테이블을 확인하세요.'
                : signupStep === 1
                ? '신원과 에티켓이 검증된 분들을 위한 프라이빗 살롱입니다.'
                : '맞춤형 테이블 편성을 위한 기본 프로필입니다.'}
            </p>
          </div>
        </div>

        {/* 로그인 / 회원가입 탭 스위치 (대표 포인트 컬러 #f04f74) */}
        {signupStep === 1 && (
          <div className="grid grid-cols-2 bg-black/40 p-1 border border-white/[0.08] mb-7">
            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setErrorMsg(null);
              }}
              className={`py-2.5 text-xs font-mono tracking-wider transition-all cursor-pointer ${
                tab === 'LOGIN'
                  ? 'border border-[#f04f74] bg-white/[0.03] text-[#f04f74] font-semibold'
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
              className={`py-2.5 text-xs font-mono tracking-wider transition-all cursor-pointer ${
                tab === 'SIGNUP'
                  ? 'border border-[#f04f74] bg-white/[0.03] text-[#f04f74] font-semibold'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              회원가입
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3 bg-transparent border border-[#f04f74]/60 text-[#f04f74] text-xs font-mono text-center">
            {errorMsg}
          </div>
        )}

        {/* -------------------------------------------------------------
            [탭 1] 로그인 폼
            ------------------------------------------------------------- */}
        {tab === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                아이디 (Username)
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="아이디 입력"
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                비밀번호 (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
              />
            </div>

            {/* 메인 로그인 CTA 버튼 */}
            <button
              type="submit"
              className="w-full py-3.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer"
            >
              로그인
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-zinc-400 font-light">
                아직 나도솔로 계정이 없으신가요?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTab('SIGNUP');
                  setSignupStep(1);
                  setErrorMsg(null);
                }}
                className="text-xs font-mono text-[#f04f74] hover:underline cursor-pointer ml-1"
              >
                회원가입하기
              </button>
            </div>
          </form>
        ) : signupStep === 1 ? (
          /* -------------------------------------------------------------
              [탭 2 - 1단계] 회원가입 폼
             ------------------------------------------------------------- */
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                이메일 <span className="text-[#f04f74]">*</span>
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
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
                  className="flex-1 px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={checkHandleDuplicate}
                  className="px-4 py-3 border border-white/20 hover:border-white/40 bg-black/40 text-xs font-mono text-zinc-300 hover:text-white uppercase transition-colors shrink-0 cursor-pointer"
                >
                  중복확인
                </button>
              </div>
              {handleCheckStatus === 'AVAILABLE' && (
                <p className="text-[11px] text-zinc-300 font-mono mt-1.5">
                  ✓ 사용 가능한 아이디입니다.
                </p>
              )}
              {handleCheckStatus === 'DUPLICATE' && (
                <p className="text-[11px] text-[#f04f74] font-mono mt-1.5">
                  ✕ 이미 사용 중인 아이디입니다.
                </p>
              )}
            </div>

            {/* 비밀번호 & 비밀번호 확인 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                  비밀번호 <span className="text-[#f04f74]">*</span>
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                  비밀번호 확인 <span className="text-[#f04f74]">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
                />
              </div>
            </div>

            {confirmPassword && (
              <p
                className={`text-[11px] font-mono ${
                  signupPassword === confirmPassword
                    ? 'text-zinc-300'
                    : 'text-[#f04f74]'
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
              className="w-full py-3.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer mt-2"
            >
              회원가입
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-zinc-400 font-light">
                이미 계정이 있으신가요?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTab('LOGIN');
                  setErrorMsg(null);
                }}
                className="text-xs font-mono text-[#f04f74] hover:underline cursor-pointer ml-1"
              >
                로그인하기
              </button>
            </div>
          </form>
        ) : (
          /* -------------------------------------------------------------
              [탭 2 - 2단계] 내 추가 정보 입력 단계
             ------------------------------------------------------------- */
          <div className="space-y-4">
            <div className="p-4 border border-white/[0.08] bg-white/[0.015] text-xs text-zinc-300 font-light leading-relaxed">
              <span className="font-semibold text-white">1단계 가입 완료.</span> 프로필 추가 정보를 입력해 주세요.
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                활동 닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                휴대폰 번호
              </label>
              <input
                type="tel"
                value={extraPhone}
                onChange={(e) => setExtraPhone(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                  성별
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExtraGender('F')}
                    className={`py-2.5 text-xs font-mono tracking-wider transition-all cursor-pointer ${
                      extraGender === 'F'
                        ? 'border border-[#f04f74] bg-transparent text-[#f04f74] font-semibold'
                        : 'bg-black/40 text-zinc-400 hover:text-white border border-white/[0.08]'
                    }`}
                  >
                    여성 (F)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtraGender('M')}
                    className={`py-2.5 text-xs font-mono tracking-wider transition-all cursor-pointer ${
                      extraGender === 'M'
                        ? 'border border-[#f04f74] bg-transparent text-[#f04f74] font-semibold'
                        : 'bg-black/40 text-zinc-400 hover:text-white border border-white/[0.08]'
                    }`}
                  >
                    남성 (M)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                  출생연도
                </label>
                <input
                  type="number"
                  value={extraBirthYear}
                  onChange={(e) => setExtraBirthYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] font-mono focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                직무
              </label>
              <input
                type="text"
                value={extraJob}
                onChange={(e) => setExtraJob(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] font-light focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleStep2Complete(false)}
                className="w-full py-3.5 border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => handleStep2Complete(true)}
                className="w-full py-2.5 border border-white/10 hover:border-white/20 bg-transparent text-zinc-400 hover:text-white text-xs font-mono tracking-wider transition-colors cursor-pointer"
              >
                건너뛰기
              </button>
            </div>
          </div>
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
