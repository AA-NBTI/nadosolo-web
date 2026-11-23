'use client';

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { buildTrackedUrl, summarizeByChannel, type Attribution } from '@/modules/tracking';

const CHANNELS = [
  { key: 'naver_place', label: '네이버', medium: 'link' },
  { key: 'instagram', label: '인스타그램', medium: 'link' },
  { key: 'blog', label: '블로그', medium: 'link' },
  { key: 'daangn', label: '당근', medium: 'link' },
  { key: 'qr_table', label: '테이블QR', medium: 'qr' },
  { key: 'qr_door', label: '입구QR', medium: 'qr' },
] as const;

interface Props {
  venueId: string;
  bookings: Array<{ meta?: { attribution?: Attribution; source?: string } }>;
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function BizMarketing({ venueId, bookings }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [qr, setQr] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const urlOf = (key: string, medium: string) =>
    buildTrackedUrl(origin, `/reserve/${venueId}`, { source: key, medium, campaign: 'store' });

  const stats = useMemo(
    () =>
      summarizeByChannel(
        bookings
          .filter((b) => b.meta?.source === 'public_link')
          .map((b) => ({ type: 'BOOKING' as const, attribution: b.meta?.attribution ?? null }))
      ),
    [bookings]
  );
  const statOf = (key: string) => stats.find((s) => s.channel === key)?.bookings ?? 0;
  const total = stats.reduce((s, r) => s + r.bookings, 0);
  const direct = stats.find((s) => s.channel === '직접')?.bookings ?? 0;

  const current = CHANNELS.find((c) => c.key === open);
  useEffect(() => {
    if (!current) {
      setQr('');
      return;
    }
    let alive = true;
    QRCode.toDataURL(urlOf(current.key, current.medium), { width: 512, margin: 2 })
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(''));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, venueId]);

  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4 text-sm font-mono">
      <div className="p-3 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
        <h2 className="font-serif-editorial text-lg text-white font-normal">마케팅</h2>
        <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
          예약 {total}
        </span>
        <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
          직접 {direct}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {CHANNELS.map((c) => {
          const isOpen = open === c.key;
          const link = urlOf(c.key, c.medium);
          return (
            <React.Fragment key={c.key}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.key)}
                className={`px-3.5 py-2.5 border text-left flex items-center justify-between text-white cursor-pointer ${
                  isOpen ? 'border-white/40 bg-white/10' : 'border-white/10 bg-[#0c0d12] hover:border-white/30'
                }`}
              >
                <span>{c.label}</span>
                <span className="text-zinc-300">예약 {statOf(c.key)}</span>
              </button>
              {isOpen && (
                <div className="col-span-full p-4 border border-white/20 bg-[#0c0d12] grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                  <div className="space-y-3 min-w-0">
                    <p className="text-zinc-200 break-all">{link}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copy(c.key, link)}
                        className="px-3 py-1.5 border border-white/25 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        {copied === c.key ? '복사 완료' : '복사'}
                      </button>
                      {qr && (
                        <a
                          href={qr}
                          download={`tablebaro-${venueId}-${c.key}.png`}
                          className="px-3 py-1.5 border border-white/25 bg-white/10 hover:bg-white/20 text-white"
                        >
                          QR저장
                        </a>
                      )}
                    </div>
                  </div>
                  {qr && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt={`${c.label} QR`} width={140} height={140} className="bg-white p-1" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {stats.length > 0 && (
        <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            <h3 className="font-serif-editorial text-lg text-white font-normal">채널</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.channel} className="px-3 py-2 border border-white/10 flex justify-between text-white">
                <span>{CHANNELS.find((c) => c.key === s.channel)?.label ?? s.channel}</span>
                <span className="text-zinc-300">
                  예약 {s.bookings}
                  {s.amountKrw > 0 ? ` · ${won(s.amountKrw)}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
