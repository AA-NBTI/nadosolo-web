'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, MapPin } from 'lucide-react';

interface YotCouponData {
  code: string;
  amount: number;
  expiresAt: string;
}

interface YotVenueData {
  venue: {
    place_name: string;
    address_name: string;
    region_dong?: string;
  };
  purpose_tags: string[];
  one_line_review?: string;
  reported_at: string;
}

export default function DashboardYotWidget() {
  const [coupon, setCoupon] = useState<YotCouponData | null>(null);
  const [reportedVenue, setReportedVenue] = useState<YotVenueData | null>(null);
  const [remainingHours, setRemainingHours] = useState<number | null>(null);

  useEffect(() => {
    try {
      const rawCoupon = localStorage.getItem('yot_coupon');
      if (rawCoupon) {
        const parsed = JSON.parse(rawCoupon);
        if (parsed && parsed.code) {
          setCoupon(parsed);
          if (parsed.expiresAt) {
            const diffMs = new Date(parsed.expiresAt).getTime() - Date.now();
            setRemainingHours(diffMs > 0 ? Math.max(1, Math.floor(diffMs / (1000 * 60 * 60))) : 0);
          }
        }
      }

      const rawVenue = localStorage.getItem('yot_reported_venue');
      if (rawVenue) {
        const parsedV = JSON.parse(rawVenue);
        if (parsedV && parsedV.venue) {
          setReportedVenue(parsedV);
        }
      }
    } catch (e) {}
  }, []);

  // 미보유 시 컴팩트 배너
  if (!coupon && !reportedVenue) {
    return (
      <div className="border border-white/10 bg-[#0c0d12] p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <span className="text-sm font-medium text-white">엿장수</span>
          <span className="text-xs text-zinc-500">|</span>
          <span className="text-sm text-zinc-300">맛집 정보 거래</span>
        </div>
        <Link
          href="/yot"
          className="px-3 py-1 rounded bg-[#f04f74] text-white text-sm font-semibold hover:bg-[#d63f63] transition-all flex items-center gap-1"
        >
          <span>이동</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      {/* 1. 바우처 카드 */}
      <div className="border border-white/10 bg-[#0c0d12] p-3.5 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="text-sm font-semibold text-white">바우처</span>
            </div>
            {remainingHours !== null && remainingHours > 0 ? (
              <span className="text-xs font-mono text-[#f04f74] border border-[#f04f74]/30 bg-[#f04f74]/10 px-2 py-0.5 rounded flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{remainingHours}시간</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-zinc-400 border border-white/10 px-2 py-0.5 rounded">
                만료
              </span>
            )}
          </div>

          {coupon ? (
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-base font-mono font-bold text-white tracking-wider">
                {coupon.code}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                자동 적용
              </span>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 pt-1">
              미보유
            </div>
          )}
        </div>

        <div>
          {coupon && remainingHours !== 0 ? (
            <Link
              href="/meetup"
              className="w-full py-2 rounded bg-[#f04f74] text-white text-sm font-semibold hover:bg-[#d63f63] transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <span>예약하기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/yot"
              className="w-full py-2 rounded bg-white/10 text-zinc-300 text-sm font-medium hover:text-white hover:bg-white/15 transition-all flex items-center justify-center gap-1 border border-white/10"
            >
              <span>참여하기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* 2. 위시리스트 카드 */}
      <div className="border border-white/10 bg-[#0c0d12] p-3.5 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="text-sm font-semibold text-white">위시리스트</span>
            </div>
            <span className="text-xs font-mono text-zinc-400 border border-white/10 px-2 py-0.5 rounded">
              매칭 대기
            </span>
          </div>

          {reportedVenue ? (
            <div className="pt-1 flex items-baseline justify-between">
              <div className="text-sm font-medium text-white flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#f04f74] shrink-0" />
                <span className="truncate">{reportedVenue.venue.place_name}</span>
              </div>
              <span className="text-xs text-zinc-400 shrink-0 ml-2">
                {reportedVenue.venue.region_dong || '등록완료'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 pt-1">
              미등록
            </div>
          )}
        </div>

        <div>
          <Link
            href="/yot"
            className="w-full py-2 rounded bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-1 border border-white/10"
          >
            <span>등록하기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
