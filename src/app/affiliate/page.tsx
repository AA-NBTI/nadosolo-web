'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useNadoSoloEngine } from '@/engine';
import { createClient } from '@/lib/supabase/client';
import {
  fetchAffiliateApplications,
  fetchAffiliateEvents,
  fetchAffiliatePayouts,
  fetchPartnerMetaMap,
} from '@/lib/affiliateDb';

export default function AffiliateProgramPage() {
  const { currentUser } = useNadoSoloEngine();
  const [customCode, setCustomCode] = useState(
    () => (currentUser?.handle ? currentUser.handle.replace(/^@/, '').toUpperCase() : 'NADO10')
  );
  const [copied, setCopied] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lookupKey, setLookupKey] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    partnerName: string;
    code: string;
    status: string;
    commissionRate: number;
    clicks: number;
    purchases: number;
    totalCommission: number;
    paidTotal: number;
  } | null>(null);
  const [lookupNotFound, setLookupNotFound] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = lookupKey.trim().toLowerCase();
    if (!key) return;
    const [apps, events, payouts, metaMap] = await Promise.all([
      fetchAffiliateApplications(),
      fetchAffiliateEvents(),
      fetchAffiliatePayouts(),
      fetchPartnerMetaMap(),
    ]);
    const hit = apps.find(
      (a) => a.code.toLowerCase() === key || a.contactEmail.toLowerCase() === key
    );
    if (!hit) {
      setLookupResult(null);
      setLookupNotFound(true);
      return;
    }
    setLookupNotFound(false);
    const code = hit.code.toUpperCase();
    const clicks = events.filter((ev) => ev.code === code && ev.eventType === 'CLICK').length;
    const purEvents = events.filter(
      (ev) => ev.code === code && ev.eventType === 'PURCHASE' && !ev.blockedSelfReferral
    );
    const totalCommission = purEvents.reduce((s, ev) => s + (ev.commissionKrw || 0), 0);
    const paidTotal = payouts
      .filter((p) => p.code === code)
      .reduce((s, p) => s + (p.amountKrw || 0), 0);
    const commissionRate = metaMap[code]?.commissionRate ?? 10;

    setLookupResult({
      partnerName: hit.partnerName,
      code,
      status: hit.status,
      commissionRate,
      clicks,
      purchases: purEvents.length,
      totalCommission,
      paidTotal,
    });
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nadosolo.com';
  const refUrl = `${origin}/meetup?ref=${encodeURIComponent(customCode.trim() || 'NADO10')}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(refUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim() || !contactEmail.trim()) return;
    const payload = {
      partnerName: partnerName.trim(),
      channelUrl: channelUrl.trim(),
      contactEmail: contactEmail.trim(),
      code: (customCode.trim() || 'NADO10').toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    try {
      const prev = JSON.parse(localStorage.getItem('nadosolo_affiliate_apps_v1') || '[]');
      prev.push(payload);
      localStorage.setItem('nadosolo_affiliate_apps_v1', JSON.stringify(prev));
    } catch {}
    try {
      const supabase = createClient();
      await supabase.from('affiliate_applications').insert({
        partner_name: payload.partnerName,
        channel_url: payload.channelUrl,
        contact_email: payload.contactEmail,
        code: payload.code,
        status: 'PENDING',
      });
    } catch {}
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[1000px] mx-auto space-y-12">
        <header className="border-b border-white/10 pb-8 space-y-3">
          <span className="text-xs font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
            FRIENDS OF NADOSOLO · AFFILIATE
          </span>
          <h1 className="font-serif-editorial text-3xl sm:text-5xl text-white font-normal">
            나도솔로 어필리에이트 · 앰배서더 프로그램
          </h1>
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
            <div className="p-4 border border-white/20 bg-[#07080a] text-sm text-white">
              파트너 신청이 접수되었습니다. 검토 후 입력하신 이메일로 전용 정산 계정을 안내해 드립니다.
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
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="인스타그램 / 유튜브 / 커뮤니티 링크 (선택)"
                className="sm:col-span-2 px-4 py-3 bg-[#07080a] border border-white/15 text-white"
              />
              <button
                type="submit"
                className="sm:col-span-2 py-3 border border-white/30 bg-white/15 hover:bg-white/25 text-white font-mono font-semibold cursor-pointer"
              >
                파트너 신청
              </button>
            </form>
          )}
        </section>

        <section className="p-6 border border-white/15 bg-[#0c0d12] space-y-4">
          <h2 className="font-serif-editorial text-2xl text-white font-normal">파트너 실적 및 정산 조회</h2>
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={lookupKey}
              onChange={(e) => setLookupKey(e.target.value)}
              placeholder="추천 코드 또는 신청 이메일 입력"
              className="flex-1 px-4 py-3 bg-[#07080a] border border-white/15 text-white font-mono text-sm"
            />
            <button
              type="submit"
              className="px-6 py-3 border border-white/30 bg-white/15 hover:bg-white/25 text-white text-sm font-mono font-semibold cursor-pointer"
            >
              조회
            </button>
          </form>

          {lookupNotFound && (
            <p className="text-sm font-mono text-zinc-400">일치하는 파트너 신청 내역을 찾지 못했습니다.</p>
          )}

          {lookupResult && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-mono">
                <span className="text-white">
                  {lookupResult.partnerName} · 코드 <strong>{lookupResult.code}</strong>
                </span>
                <span className="px-2.5 py-0.5 border border-white/25 text-white">
                  {lookupResult.status} · 수수료 {lookupResult.commissionRate}%
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-mono">
                <div className="p-3 border border-white/10 bg-[#07080a]">
                  <span className="text-zinc-400 block">링크 클릭</span>
                  <strong className="text-white text-lg">{lookupResult.clicks}회</strong>
                </div>
                <div className="p-3 border border-white/10 bg-[#07080a]">
                  <span className="text-zinc-400 block">결제 전환</span>
                  <strong className="text-white text-lg">{lookupResult.purchases}건</strong>
                </div>
                <div className="p-3 border border-white/10 bg-[#07080a]">
                  <span className="text-zinc-400 block">누적 수수료</span>
                  <strong className="text-white text-lg">₩{lookupResult.totalCommission.toLocaleString()}</strong>
                </div>
                <div className="p-3 border border-white/10 bg-[#07080a]">
                  <span className="text-zinc-400 block">정산 가능 잔액</span>
                  <strong className="text-white text-lg">
                    ₩{Math.max(0, lookupResult.totalCommission - lookupResult.paidTotal).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
