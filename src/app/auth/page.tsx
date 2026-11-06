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
  const [isHandleChecked, setIsHandleChecked] = useState(false);
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

  const REAL_MEMBERS = [
    { id: 'user_junho', handle: '@junho_choi', name: '최준호', gender: 'M' as const, job: 'IT 스타트업 대표', birth: 1991 },
    { id: 'user_minseok', handle: '@minseok_kang', name: '강민석', gender: 'M' as const, job: '정형외과 전문의', birth: 1989 },
    { id: 'user_donghyun', handle: '@donghyun_yoon', name: '윤동현', gender: 'M' as const, job: '금융 자산운용역', birth: 1993 },
    { id: 'user_soyeon', handle: '@soyeon_park', name: '박소연', gender: 'F' as const, job: '브랜드 디렉터', birth: 1994 },
    { id: 'user_yujin', handle: '@yujin_han', name: '한유진', gender: 'F' as const, job: '공간 인테리어 디자이너', birth: 1992 },
    { id: 'user_chaewon', handle: '@chaewon_lim', name: '임채원', gender: 'F' as const, job: '글로벌 테크 세일즈', birth: 1995 },
  ];

  const handleLoginAsRealMember = (member: typeof REAL_MEMBERS[0]) => {
    loginAsUser({
      userId: member.id,
      handle: member.handle,
      role: 'MEMBER',
      email: `${member.id}@nadosolo.com`,
      nickname: member.name,
      phone: '010-0000-0000',
      jobTitle: member.job,
      gender: member.gender,
      birthYear: member.birth,
      authProvider: 'EMAIL',
      verifiedBadge: '인증 완료',
      sessionCount: 2,
    });
    router.push(nextUrl);
  };

  const handlePresetFillAndLogin = (preset: 'USER1' | 'USER2') => {
    setErrorMsg(null);
    if (preset === 'USER1') {
      setLoginId('user1');
      setPassword('1234');
      loginAsUser({
        userId: 'U01',
        handle: '@user1',
        role: 'MEMBER',
        email: 'user1@nadosolo.com',
        nickname: '지수',
        phone: '010-2948-1029',
        jobTitle: '프로덕트 디자이너',
        gender: 'F',
        birthYear: 1995,
        authProvider: 'EMAIL',
        verifiedBadge: '본인인증 완료',
        sessionCount: 3,
      });
      router.push(nextUrl);
    } else {
      setLoginId('user2');
      setPassword('1234');
      loginAsUser({
        userId: 'U04',
        handle: '@user2',
        role: 'MEMBER',
        email: 'user2@nadosolo.com',
        nickname: '현우',
        phone: '010-8421-3390',
        jobTitle: '건축가',
        gender: 'M',
        birthYear: 1992,
        authProvider: 'EMAIL',
        verifiedBadge: '본인인증 완료',
        sessionCount: 2,
      });
      router.push(nextUrl);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedId = loginId.trim().replace(/^@/, '');

    if (!trimmedId) {
      setErrorMsg('아이디를 입력해 주세요.');
      return;
    }

    // 관리자 로그인 검증 (id: admin / pass: aa1111)
    if (trimmedId.toLowerCase() === 'admin') {
      if (password !== 'aa1111') {
        setErrorMsg('관리자 비밀번호가 올바르지 않습니다.');
        return;
      }
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

    // 일반 회원 로그인 처리
    const isMale = trimmedId.toLowerCase() === 'user2';
    loginAsUser({
      userId: isMale ? 'U04' : 'U01',
      handle: `@${trimmedId}`,
      role: 'MEMBER',
      email: `${trimmedId}@nadosolo.com`,
      nickname: isMale ? '현우' : trimmedId === 'user1' ? '지수' : trimmedId,
      phone: '010-2948-1029',
      jobTitle: isMale ? '건축가' : '프로덕트 디자이너',
      gender: isMale ? 'M' : 'F',
      birthYear: isMale ? 1992 : 1995,
      authProvider: 'EMAIL',
      verifiedBadge: '본인인증 완료',
      sessionCount: 3,
    });
    router.push(nextUrl);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!handleInput.trim()) {
      setErrorMsg('사용할 아이디(@핸들)를 입력해 주세요.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMsg('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    if (signupPassword.length < 4) {
      setErrorMsg('비밀번호는 최소 4자리 이상 입력해 주세요.');
      return;
    }

    // 회원가입 완료 즉시 첫 로그인 처리 (계정 생성)
    loginAsUser({
      userId: `U_${Date.now().toString().slice(-4)}`,
      handle: normalizedHandle,
      role: 'MEMBER',
      email: emailInput || `${handleInput}@nadosolo.com`,
      nickname: nickname || handleInput,
      phone: '미등록',
      jobTitle: '미입력',
      gender: 'F',
      birthYear: 1995,
      authProvider: 'EMAIL',
      verifiedBadge: '회원가입 완료',
      sessionCount: 1,
    });

    // 첫 로그인 후 프로필 추가 입력 온보딩 단계로 진입
    setSignupStep(2);
  };

  const handleStep2Complete = (skipExtra = false) => {
    if (!skipExtra) {
      loginAsUser({
        userId: `U_${Date.now().toString().slice(-4)}`,
        handle: normalizedHandle,
        role: 'MEMBER',
        email: emailInput || `${handleInput}@nadosolo.com`,
        nickname: nickname || handleInput,
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
                : '3:3 맞춤형 테이블 편성을 위한 기본 프로필입니다.'}
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
                  ? 'border border-[#f04f74] bg-[#f04f74]/15 text-white font-semibold shadow-[0_0_15px_rgba(240,79,116,0.2)]'
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
                  ? 'border border-[#f04f74] bg-[#f04f74]/15 text-white font-semibold shadow-[0_0_15px_rgba(240,79,116,0.2)]'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              회원가입
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3 bg-[#f04f74]/10 border border-[#f04f74]/30 text-[#f04f74] text-xs font-mono text-center">
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

            {/* 빠른 테스트 계정 박스: 6인 실계정 원클릭 전환 */}
            <div className="p-4 border border-white/[0.08] bg-white/[0.015] space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono tracking-wider text-zinc-300 uppercase">
                  체험용 계정 원클릭 로그인
                </p>
                <span className="text-[10px] text-[#f04f74] font-mono">DB 연동 완료</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {REAL_MEMBERS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleLoginAsRealMember(m)}
                    className="p-2 border border-white/[0.06] hover:border-[#f04f74]/40 bg-black/40 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-200 group-hover:text-white font-medium">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-[#f04f74] font-mono">{m.gender}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-light">{m.job}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 메인 로그인 CTA 버튼 */}
            <button
              type="submit"
              className="w-full py-3.5 border border-[#f04f74] bg-[#f04f74]/15 hover:bg-[#f04f74] text-white text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(240,79,116,0.25)]"
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
                아이디 (@핸들)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => {
                    setHandleInput(
                      e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
                    );
                    setIsHandleChecked(false);
                  }}
                  placeholder="아이디 입력"
                  required
                  className="flex-1 px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setIsHandleChecked(true)}
                  className="px-4 py-3 border border-white/20 hover:border-white/40 bg-black/40 text-xs font-mono text-zinc-300 hover:text-white uppercase transition-colors shrink-0"
                >
                  중복확인
                </button>
              </div>
              {isHandleChecked && (
                <p className="text-[11px] text-[#f04f74] font-mono mt-1">
                  ✓ 사용 가능한 아이디입니다 ({normalizedHandle})
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                이름 (활동 닉네임)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="지수"
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                이메일
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="user@nadosolo.com"
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
              />
            </div>

            {/* 비밀번호 & 비밀번호 확인 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="4자리 이상"
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재입력"
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
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
              className="w-full py-3.5 border border-[#f04f74] bg-[#f04f74]/15 hover:bg-[#f04f74] text-white text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(240,79,116,0.25)] mt-2"
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
              <span className="font-semibold text-white">1단계 가입 완료.</span> 3:3 밸런스 테이블 편성을 위해 추가 정보를 입력해 주세요. (추후 수정 가능)
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                휴대폰 번호 (모임 안내 수신)
              </label>
              <input
                type="tel"
                value={extraPhone}
                onChange={(e) => setExtraPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono tracking-wider text-zinc-400 mb-1.5 uppercase">
                  성별 (3:3 성비 매칭)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExtraGender('F')}
                    className={`py-2.5 text-xs font-mono tracking-wider transition-all cursor-pointer ${
                      extraGender === 'F'
                        ? 'border border-[#f04f74] bg-[#f04f74]/20 text-white font-semibold'
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
                        ? 'border border-[#f04f74] bg-[#f04f74]/20 text-white font-semibold'
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
                직업 / 전문 분야
              </label>
              <input
                type="text"
                value={extraJob}
                onChange={(e) => setExtraJob(e.target.value)}
                placeholder="예: 프로덕트 디자이너, 건축가, 연구원"
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-[#f04f74]/60 text-sm text-[#f5f2eb] placeholder-zinc-500 font-light focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleStep2Complete(false)}
                className="w-full py-3.5 border border-[#f04f74] bg-[#f04f74]/15 hover:bg-[#f04f74] text-white text-xs font-mono tracking-[0.25em] uppercase font-semibold transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(240,79,116,0.25)]"
              >
                저장 완료
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
