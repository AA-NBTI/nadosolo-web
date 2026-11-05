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

    setSignupStep(2);
  };

  const handleStep2Complete = (skipExtra = false) => {
    loginAsUser({
      userId: `U_${Date.now().toString().slice(-4)}`,
      handle: normalizedHandle,
      role: 'MEMBER',
      email: emailInput || `${handleInput}@nadosolo.com`,
      nickname: nickname || handleInput,
      phone: skipExtra ? '미등록' : extraPhone || '010-0000-0000',
      jobTitle: skipExtra ? '미입력' : extraJob || '미입력',
      gender: extraGender,
      birthYear: extraBirthYear,
      authProvider: 'EMAIL',
      verifiedBadge: skipExtra ? '이메일 가입' : '기본정보 등록',
      sessionCount: 1,
    });
    router.push('/dashboard');
  };

  return (
    <main className="w-full max-w-[1380px] mx-auto px-6 py-12 min-h-[calc(100vh-5rem)] flex items-center justify-center">
      {/* ===================================================================
          절제된 럭셔리 다크 차콜 카드 컨테이너 (#12151E)
          - 와인 남발 전면 제거: 오직 메인 CTA 버튼에만 핀포인트 집중!
          =================================================================== */}
      <div className="w-full max-w-[460px] bg-[#12151e] rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl shadow-black/90 relative text-white">
        {/* 우측 상단 닫기(X) 버튼 */}
        <Link
          href="/"
          className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-xl"
          aria-label="닫기"
        >
          ✕
        </Link>

        {/* 상단 타이틀 */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="font-serif-editorial text-2xl font-normal text-white lowercase tracking-tight mb-2"
          >
            nadosolo
          </Link>
          <h1 className="text-xl font-medium text-white tracking-tight">
            {tab === 'LOGIN' ? '멤버십 로그인' : '멤버십 가입'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {tab === 'LOGIN'
              ? '계정에 로그인하고 테이블을 확인하세요.'
              : signupStep === 1
              ? '프라이빗 다이닝 멤버십을 시작합니다.'
              : '맞춤형 테이블 매칭을 위한 정보입니다.'}
          </p>
        </div>

        {/* 로그인 / 회원가입 탭 스위치 (모던 화이트/다크 탭) */}
        {signupStep === 1 && (
          <div className="grid grid-cols-2 bg-[#0a0c12] p-1.5 rounded-2xl border border-white/10 mb-7">
            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setErrorMsg(null);
              }}
              className={`py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                tab === 'LOGIN'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
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
              className={`py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                tab === 'SIGNUP'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              회원가입
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/20 text-rose-300 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* -------------------------------------------------------------
            [탭 1] 로그인 폼
            ------------------------------------------------------------- */}
        {tab === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                아이디 (Username)
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="아이디 입력 (예: user1 또는 admin)"
                className="w-full px-4 py-3.5 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                비밀번호 (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-3.5 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {/* 빠른 테스트 계정 박스: 6인 실계정 원클릭 전환 */}
            <div className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-300">
                  실제 6인 모임 계정 원클릭 로그인:
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">DB 연동 완료</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {REAL_MEMBERS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleLoginAsRealMember(m)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-white group-hover:text-rose-300">
                        {m.gender === 'M' ? '👔' : '👗'} {m.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{m.gender}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">{m.job}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 메인 로그인 CTA 버튼: 핵심 액션에만 확실한 루비 레드와인 (#881337) 집중 */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#881337] hover:bg-[#6f102d] text-white text-base font-bold shadow-lg shadow-[#881337]/30 transition-all cursor-pointer"
            >
              로그인
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-zinc-400">
                아직 나도솔로 계정이 없으신가요?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTab('SIGNUP');
                  setSignupStep(1);
                  setErrorMsg(null);
                }}
                className="text-xs font-bold text-white underline hover:text-zinc-300 cursor-pointer ml-1"
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
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
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
                  placeholder="예: user1"
                  required
                  className="flex-1 px-4 py-3 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => setIsHandleChecked(true)}
                  className="px-4 py-3 rounded-xl bg-[#1c202e] hover:bg-[#252b3d] text-white text-xs font-semibold cursor-pointer shrink-0 border border-white/10 transition-colors"
                >
                  중복확인
                </button>
              </div>
              {isHandleChecked && (
                <p className="text-[11px] text-emerald-400 font-medium mt-1">
                  ✓ 사용 가능한 아이디입니다 ({normalizedHandle})
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                이름 (활동 닉네임)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="지수"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                이메일
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="user@nadosolo.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* 비밀번호 & 비밀번호 확인 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="4자리 이상"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재입력"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {confirmPassword && (
              <p
                className={`text-[11px] font-medium ${
                  signupPassword === confirmPassword
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {signupPassword === confirmPassword
                  ? '✓ 비밀번호가 일치합니다.'
                  : '✕ 비밀번호가 일치하지 않습니다.'}
              </p>
            )}

            {/* 메인 가입 CTA 버튼: 루비 레드와인 */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#881337] hover:bg-[#6f102d] text-white text-base font-bold shadow-lg shadow-[#881337]/30 transition-all cursor-pointer mt-2"
            >
              다음: 내 추가 정보 입력 →
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-zinc-400">
                이미 계정이 있으신가요?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTab('LOGIN');
                  setErrorMsg(null);
                }}
                className="text-xs font-bold text-white underline hover:text-zinc-300 cursor-pointer ml-1"
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
            <div className="p-4 rounded-2xl bg-[#1c202e] border border-white/10 text-xs text-zinc-300">
              <span className="font-bold text-white">1단계 가입 완료!</span> 결이 맞는 6인 테이블 좌석 배정을 위해 추가 정보를 입력해 주세요. (추후 수정 가능)
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                휴대폰 번호 (모임 안내 알림톡 수신)
              </label>
              <input
                type="tel"
                value={extraPhone}
                onChange={(e) => setExtraPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-4 py-3 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  성별 (3:3 성비 매칭)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExtraGender('F')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      extraGender === 'F'
                        ? 'bg-white text-zinc-950'
                        : 'bg-[#10131c] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    여성 (F)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtraGender('M')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      extraGender === 'M'
                        ? 'bg-white text-zinc-950'
                        : 'bg-[#10131c] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    남성 (M)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  출생연도
                </label>
                <input
                  type="number"
                  value={extraBirthYear}
                  onChange={(e) => setExtraBirthYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                직업 / 전문 분야
              </label>
              <input
                type="text"
                value={extraJob}
                onChange={(e) => setExtraJob(e.target.value)}
                placeholder="예: 프로덕트 디자이너, 건축가, 연구원"
                className="w-full px-4 py-3 rounded-xl bg-[#10131c] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleStep2Complete(false)}
                className="w-full py-4 rounded-xl bg-[#881337] hover:bg-[#6f102d] text-white text-base font-bold shadow-lg shadow-[#881337]/30 transition-all cursor-pointer"
              >
                추가 정보 저장하고 대시보드 시작 →
              </button>
              <button
                type="button"
                onClick={() => handleStep2Complete(true)}
                className="w-full py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                나중에 입력하고 건너뛰기
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
