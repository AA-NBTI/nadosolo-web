'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Phone, Search, Users } from 'lucide-react';

interface MyBookingItem {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceAddress: string;
  resourcePhone: string;
  partySize: number;
  status: string;
  startsAtText: string;
  guestName: string;
  requests: string;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: '확인 대기',
  CONFIRMED: '예약 확정',
  COMPLETED: '방문 완료',
  DECLINED: '매장 거절',
  EXPIRED: '자동 만료',
  CANCELLED: '취소됨',
  NO_SHOW: '노쇼',
};

function MyReservationsContent() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get('phone') || '';

  const [phone, setPhone] = useState(initialPhone);
  const [searchedPhone, setSearchedPhone] = useState('');
  const [bookings, setBookings] = useState<MyBookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const searchBookings = useCallback(async (targetPhone: string) => {
    const cleaned = targetPhone.trim();
    if (!cleaned) return;
    setLoading(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/reservations/my?phone=${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      if (!data.ok) {
        setErrorMsg(data.error || '조회에 실패했습니다.');
        setBookings([]);
      } else {
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        setSearchedPhone(cleaned);
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPhone) {
      void searchBookings(initialPhone);
    }
  }, [initialPhone, searchBookings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void searchBookings(phone);
  };

  const handleCancel = async (bookingId: string) => {
    if (!searchedPhone) return;
    setBusyId(bookingId);
    setErrorMsg(null);
    setNotice(null);
    try {
      const res = await fetch('/api/reservations/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          phone: searchedPhone,
          action: 'CANCEL',
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrorMsg(data.error || '취소 처리에 실패했습니다.');
      } else {
        setNotice('예약이 취소되었습니다.');
        await searchBookings(searchedPhone);
      }
    } catch {
      setErrorMsg('취소 요청 중 오류가 발생했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#07080a] text-zinc-100 py-10 px-5 sm:px-8">
      <div className="max-w-[720px] mx-auto space-y-6">
        <header className="p-6 border border-white/15 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              <span className="text-sm font-mono text-zinc-300">TABLEBARO</span>
            </div>
            <h1 className="font-serif-editorial text-2xl text-white font-normal">
              내 예약 확인 · 취소
            </h1>
            <p className="text-sm text-zinc-400">
              예약 시 입력하신 연락처를 입력하면 로그인 없이 예약 내역을 확인하거나 취소할 수 있습니다.
            </p>
          </div>
          <Link href="/reserve" className="px-3.5 py-2 border border-white/20 text-sm font-mono text-zinc-200 hover:text-white shrink-0">
            매장 찾기
          </Link>
        </header>

        <form onSubmit={handleSubmit} className="p-5 border border-white/10 bg-[#0c0d12] flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="예약자 연락처 (예: 010-1234-5678)"
            className="flex-1 px-4 py-2.5 bg-black/50 border border-white/20 text-sm font-mono text-white outline-none focus:border-[#3b82f6]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 border border-[#3b82f6]/60 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-sm font-mono font-semibold text-white inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? '조회중' : '조회'}</span>
          </button>
        </form>

        {notice && (
          <div className="p-3.5 border border-white/25 bg-white/5 text-sm font-mono text-white">
            {notice}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 border border-white/25 bg-white/5 text-sm font-mono text-white">
            {errorMsg}
          </div>
        )}

        {searchedPhone && (
          <section className="space-y-3">
            <div className="flex items-center justify-between text-sm font-mono text-zinc-400 px-1">
              <span>조회 결과 {bookings.length}건</span>
              <span>{searchedPhone}</span>
            </div>

            {bookings.length === 0 ? (
              <div className="p-8 border border-white/10 bg-[#0c0d12] text-center text-sm font-mono text-zinc-400">
                입력하신 연락처로 등록된 예약 내역이 없습니다.
              </div>
            ) : (
              bookings.map((b) => {
                const canCancel = b.status === 'REQUESTED' || b.status === 'CONFIRMED';
                return (
                  <div
                    key={b.id}
                    className="p-5 border border-white/15 bg-[#0c0d12] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="space-y-0.5">
                        <Link
                          href={`/reserve/${b.resourceId}`}
                          className="font-serif-editorial text-xl text-white hover:underline"
                        >
                          {b.resourceName}
                        </Link>
                        <div className="text-sm font-mono text-zinc-400">
                          예약번호: {b.id}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 border text-sm font-mono font-semibold ${
                          b.status === 'CONFIRMED'
                            ? 'border-[#3b82f6]/60 bg-[#3b82f6]/20 text-white'
                            : 'border-white/20 text-zinc-200'
                        }`}
                      >
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm text-zinc-300 font-mono">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#3b82f6] shrink-0" />
                        <span>{b.startsAtText || b.createdAt.slice(0, 16)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#3b82f6] shrink-0" />
                        <span>
                          {b.partySize}명 {b.guestName ? `· ${b.guestName}` : ''}
                        </span>
                      </div>
                      {b.resourceAddress && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#3b82f6] shrink-0" />
                          <span>{b.resourceAddress}</span>
                        </div>
                      )}
                      {b.resourcePhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#3b82f6] shrink-0" />
                          <span>{b.resourcePhone}</span>
                        </div>
                      )}
                    </div>

                    {canCancel && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={busyId === b.id}
                          onClick={() => void handleCancel(b.id)}
                          className="px-4 py-2 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white cursor-pointer disabled:opacity-40"
                        >
                          {busyId === b.id ? '취소중' : '예약 취소'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default function MyReservePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#07080a] text-zinc-300 flex items-center justify-center text-sm font-mono">
          로딩 중...
        </main>
      }
    >
      <MyReservationsContent />
    </Suspense>
  );
}
