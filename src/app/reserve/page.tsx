'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Search, ArrowRight } from 'lucide-react';

interface PublicVenueCard {
  id: string;
  kind: string;
  name: string;
  address: string;
  addressDetail: string;
  phone: string;
  guideNote: string;
  coverImageUrl?: string;
  signatureMenu?: string;
  priceRange?: string;
  tags?: string[];
  capacity: number;
}

const KIND_TABS = [
  { id: 'ALL', label: '전체' },
  { id: 'restaurant', label: '다이닝' },
  { id: 'lodging', label: '숙박' },
  { id: 'space', label: '공간' },
  { id: 'etc', label: '기타' },
] as const;

const KIND_LABEL: Record<string, string> = {
  restaurant: '다이닝',
  lodging: '숙박',
  space: '공간',
  etc: '기타',
};

export default function ReserveDirectoryPage() {
  const [venues, setVenues] = useState<PublicVenueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<string>('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/reservations/public')
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.ok && Array.isArray(data.resources)) {
          setVenues(data.resources);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return venues.filter((v) => {
      if (kindFilter !== 'ALL' && v.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        v.guideNote.toLowerCase().includes(q) ||
        (v.signatureMenu || '').toLowerCase().includes(q) ||
        (v.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [venues, kindFilter, query]);

  return (
    <main className="min-h-screen bg-[#07080a] text-zinc-100 py-10 px-5 sm:px-8">
      <div className="max-w-[960px] mx-auto space-y-6">
        <header className="p-6 border border-white/15 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              <span className="text-sm font-mono text-zinc-300">TABLEBARO</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
              예약 매장 찾기
            </h1>
            <p className="text-sm text-zinc-400">
              앱 설치나 회원가입 없이 원하는 매장을 선택해 3초 만에 예약하세요.
            </p>
          </div>
          <Link
            href="/reserve/my"
            className="px-4 py-2.5 border border-[#3b82f6]/60 bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 text-sm font-mono text-white shrink-0"
          >
            내 예약 확인 · 취소
          </Link>
        </header>

        {/* 검색 및 업종 필터 */}
        <section className="p-4 border border-white/10 bg-[#0c0d12] flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex flex-wrap gap-1.5">
            {KIND_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setKindFilter(t.id)}
                className={`px-3.5 py-2 border text-sm font-mono cursor-pointer transition-colors ${
                  kindFilter === t.id
                    ? 'border-[#3b82f6]/60 bg-[#3b82f6]/20 text-white font-semibold'
                    : 'border-white/15 bg-black/40 text-zinc-300 hover:border-white/30'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="매장명 또는 지역/도로명 검색"
              className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/20 text-sm text-white outline-none focus:border-[#3b82f6]"
            />
          </div>
        </section>

        {/* 매장 리스트 */}
        {loading ? (
          <div className="p-10 border border-white/10 bg-[#0c0d12] text-center text-sm font-mono text-zinc-400">
            매장 목록 불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 border border-white/10 bg-[#0c0d12] text-center space-y-3">
            <p className="text-sm font-mono text-zinc-400">조건에 맞는 예약 가능 매장이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((v) => (
              <Link
                key={v.id}
                href={`/reserve/${v.id}`}
                className="p-5 border border-white/15 bg-[#0c0d12] hover:border-[#3b82f6]/60 transition-colors flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-2">
                  {v.coverImageUrl && (
                    <div className="w-full h-40 overflow-hidden border border-white/10 bg-black/40 mb-2">
                      <img src={v.coverImageUrl} alt={v.name} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 border border-[#3b82f6]/50 bg-[#3b82f6]/15 text-sm font-mono text-white">
                      {KIND_LABEL[v.kind] || '예약'}
                    </span>
                    <span className="text-sm font-mono text-zinc-400">
                      {v.priceRange ? `${v.priceRange} · ` : ''}수용 {v.capacity}석
                    </span>
                  </div>
                  <h2 className="font-serif-editorial text-xl text-white font-normal group-hover:text-zinc-100">
                    {v.name}
                  </h2>
                  {v.signatureMenu && (
                    <p className="text-sm text-zinc-200 font-medium truncate">{v.signatureMenu}</p>
                  )}
                  <div className="space-y-1 text-sm text-zinc-300">
                    {v.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" />
                        <span className="truncate">{v.address} {v.addressDetail}</span>
                      </div>
                    )}
                    {v.phone && (
                      <div className="flex items-center gap-1.5 font-mono text-zinc-400">
                        <Phone className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" />
                        <span>{v.phone}</span>
                      </div>
                    )}
                  </div>
                  {v.tags && v.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {v.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 border border-white/15 bg-black/40 text-sm font-mono text-zinc-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  {v.guideNote && (
                    <p className="text-sm text-zinc-400 line-clamp-1 pt-1">{v.guideNote}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-sm font-mono text-white">
                  <span>실시간 예약하기</span>
                  <ArrowRight className="w-4 h-4 text-[#3b82f6] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
