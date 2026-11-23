'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Users, Sparkles, ArrowRight } from 'lucide-react';
import { createAffiliateApplication } from '@/lib/affiliateDb';

export default function AffiliateProgramPage() {
  const [customCode, setCustomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [passwordPin, setPasswordPin] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nadosolo.com';
  const refUrl = `${origin}/meetup?ref=${encodeURIComponent(customCode.trim() || 'MYCODE')}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(refUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!passwordPin.trim() || passwordPin.trim().length < 4) {
      setSubmitError('파트너 전용 비밀번호는 4자 이상 입력해 주세요.');
      return;
    }
    const res = await createAffiliateApplication({
      partnerName,
      contactEmail,
      channelUrl,
      code: customCode,
      passwordPin,
      status: 'PENDING',
    });
    if (!res.ok) {
      setSubmitError(res.error || '신청 처리 중 오류가 발생했습니다.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[1000px] mx-auto space-y-12">
        <header className="border-b border-white/10 pb-8 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <span className="text-xs font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
                FRIENDS OF NADOSOLO · AFFILIATE
              </span>
              <h1 className="font-serif-editorial text-3xl sm:text-5xl text-white font-normal">
                나도솔로 어필리에이트 · 앰배서더 프로그램
              </h1>
            </div>
            <Link
              href="/partners/dashboard"
              prefetch={true}
              className="px-4 py-2.5 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white font-semibold shrink-0"
            >
              파트너스 로그인
            </Link>
          </div>
          <p className="text-sm sm:text-base text-zinc-300 font-light max-w-2xl leading-relaxed">
            크리에이터, 커뮤니티 운영자, 로컬 인플루언서에게 전용 추천 링크와 프로모션 코드를 제공합니다. 추천 링크를 통해 발생한 첫 예약 건마다 파트너 수익이 정산됩니다.
          </p>
        </header>

        {/* 3대 혜택 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-2">
            <Sparkles className="w-5 h-5 text-[#f04f74]" />
            <h2 className="text-white font-semibold text-base">전용 추천 링크 &amp; 코드</h2>
            <p className="text-zinc-400 leading-relaxed">
              유입 링크(`?ref=코드`)와 결제창 할인 프로모 코드(`NADOSOLO10` 등)를 함께 발급해 전환율을 높입니다.
            </p>
          </div>
          <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-2">
            <Users className="w-5 h-5 text-[#f04f74]" />
            <h2 className="text-white font-semibold text-base">성과 추적 · 투명 정산</h2>
            <p className="text-zinc-400 leading-relaxed">
              추천 코드를 통해 완료된 유료 슬롯 예약 건수를 추적하고, 월 단위로 파트너 커미션을 정산합니다.
            </p>
          </div>
          <div className="p-6 border border-white/10 bg-[#0c0d12] space-y-2">
            <ArrowRight className="w-5 h-5 text-[#f04f74]" />
            <h2 className="text-white font-semibold text-base">+1 동반 초대 연동</h2>
            <p className="text-zinc-400 leading-relaxed">
              일반 회원도 대시보드에서 지인 1명에게 `+1 초대 링크`를 공유해 같은 주간 테이블로 데려올 수 있습니다.
            </p>
          </div>
        </section>

        {/* 즉시 추천 링크 생성기 */}
        <section className="p-6 sm:p-8 border border-white/15 bg-[#0c0d12] space-y-4">
          <h2 className="font-serif-editorial text-2xl text-white font-normal">내 추천 링크 생성</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
              placeholder="추천 코드 (예: CREATOR10)"
              className="px-4 py-3 bg-[#07080a] border border-white/15 text-sm font-mono text-white"
            />
            <input
              type="text"
              readOnly
              value={refUrl}
              className="sm:col-span-2 px-4 py-3 bg-[#07080a] border border-white/10 text-sm font-mono text-zinc-300"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="px-5 py-2.5 bg-[#f04f74] text-white text-sm font-mono font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사됨' : '링크 복사'}</span>
            </button>
            <Link
              href="/meetup"
              prefetch={true}
              className="px-5 py-2.5 border border-white/20 text-sm font-mono text-white"
            >
              예약 화면 보기
            </Link>
          </div>
        </section>

        {/* 앰배서더 신청 폼 */}
        <section className="p-6 sm:p-8 border border-white/10 bg-[#0c0d12] space-y-4">
          <h2 className="font-serif-editorial text-2xl text-white font-normal">어필리에이트 파트너 신청</h2>
          {submitted ? (
            <div className="p-5 border border-white/20 bg-[#07080a] space-y-3 text-sm text-white">
              <p>
                신청이 접수되었습니다. 등록하신 추천 코드({customCode})와 비밀번호로 로그인하여 승인 상태와 실적을 확인하실 수 있습니다.
              </p>
              <Link
                href="/partners/dashboard"
                prefetch={true}
                className="inline-block px-4 py-2 bg-[#f04f74] text-white font-mono font-semibold"
              >
                어필리에이트 관리
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <input
                type="text"
                required
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="이름 또는 활동명"
                className="px-4 py-3 bg-[#07080a] border border-white/15 text-white"
              />
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="연락받을 이메일"
                className="px-4 py-3 bg-[#07080a] border border-white/15 text-white"
              />
              <input
                type="text"
                required
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                placeholder="희망 추천 코드 (영문/숫자, 예: CREATOR10)"
                className="px-4 py-3 bg-[#07080a] border border-white/15 font-mono text-white"
              />
              <input
                type="password"
                required
                value={passwordPin}
                onChange={(e) => setPasswordPin(e.target.value)}
                placeholder="파트너 비밀번호 (실적·정산 로그인용, 4자 이상)"
                className="px-4 py-3 bg-[#07080a] border border-white/15 font-mono text-white"
              />
              <input
                type="text"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="인스타그램 / 유튜브 / 커뮤니티 링크 (선택)"
                className="sm:col-span-2 px-4 py-3 bg-[#07080a] border border-white/15 text-white"
              />
              {submitError && (
                <p className="sm:col-span-2 text-sm font-mono text-[#f04f74]">{submitError}</p>
              )}
              <button
                type="submit"
                className="sm:col-span-2 py-3 border border-white/30 bg-white/15 hover:bg-white/25 text-white font-mono font-semibold cursor-pointer"
              >
                신청
              </button>
            </form>
          )}
        </section>

        <section className="p-6 border border-white/15 bg-[#0c0d12] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif-editorial text-2xl text-white font-normal">어필리에이트 대시보드</h2>
            <p className="text-sm text-zinc-400">
              어필리에이트 전용 로그인을 통해 클릭·결제 실적, 계좌 관리 및 출금 신청을 진행합니다.
            </p>
          </div>
          <Link
            href="/partners/dashboard"
            prefetch={true}
            className="px-5 py-3 border border-white/30 bg-white/15 hover:bg-white/25 text-white text-sm font-mono font-semibold shrink-0 text-center"
          >
            로그인
          </Link>
        </section>
      </div>
    </main>
  );
}
