'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { PayLinkRecord } from '@/modules/paylink';

interface Props {
  resourceId: string;
  resourceName: string;
  defaultAmountKrw?: number;
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function BizPayLinks({ resourceId, resourceName, defaultAmountKrw = 10000 }: Props) {
  const [links, setLinks] = useState<PayLinkRecord[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amountKrw, setAmountKrw] = useState(defaultAmountKrw >= 1000 ? defaultAmountKrw : 10000);
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/paylinks?resourceId=${encodeURIComponent(resourceId)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.links)) {
        setLinks(data.links);
      }
    } catch {}
  }, [resourceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/paylinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          service: 'TABLEBARO',
          resourceId,
          resourceName,
          customerName,
          customerPhone,
          amountKrw,
          memo,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setNotice(data.error || '생성 실패');
      } else {
        const url = `${window.location.origin}${data.payPath}`;
        void navigator.clipboard.writeText(url);
        setNotice(`발송 · 복사 완료: ${url}`);
        setCustomerName('');
        setCustomerPhone('');
        setMemo('');
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 text-sm font-mono">
      <div className="p-3 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
          <h2 className="font-serif-editorial text-lg text-white font-normal">결제링크</h2>
          <span className="px-2 py-0.5 border border-white/10 text-zinc-400">{links.length}</span>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="px-3 py-1 border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
        >
          새로고침
        </button>
      </div>

      {notice && (
        <div className="p-3 border border-white/25 bg-white/5 text-white break-all">{notice}</div>
      )}

      <form onSubmit={handleCreate} className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <input
            required
            placeholder="고객명"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="px-3 py-2 bg-[#07080a] border border-white/20 text-white outline-none focus:border-white/40"
          />
          <input
            required
            type="tel"
            placeholder="연락처 (010-0000-0000)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="px-3 py-2 bg-[#07080a] border border-white/20 text-white outline-none focus:border-white/40"
          />
          <input
            required
            type="number"
            min={1000}
            step={1000}
            placeholder="결제금액"
            value={amountKrw}
            onChange={(e) => setAmountKrw(Number(e.target.value) || 0)}
            className="px-3 py-2 bg-[#07080a] border border-white/20 text-white outline-none focus:border-white/40"
          />
          <input
            placeholder="메모 (예: 오늘 19시 4인)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="px-3 py-2 bg-[#07080a] border border-white/20 text-white outline-none focus:border-white/40"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 border border-white/30 bg-white/15 hover:bg-white/25 text-white font-bold cursor-pointer disabled:opacity-40"
        >
          {busy ? '발송 중' : '발송 · 복사'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {links.length === 0 && (
          <div className="col-span-full p-4 border border-white/10 bg-[#0c0d12] text-zinc-400">
            발송된 결제링크가 없습니다.
          </div>
        )}
        {links.map((l) => (
          <div key={l.id} className="p-3.5 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white font-bold truncate">
                {l.customerName} · {won(l.amountKrw)}
              </div>
              <div className="text-zinc-400 truncate">
                {l.customerPhone}{l.memo ? ` · ${l.memo}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 border border-white/25 text-white">
                {l.status === 'PAID' ? '결제완료' : '대기'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const u = `${window.location.origin}/pay/${l.id}`;
                  void navigator.clipboard.writeText(u);
                  setNotice(`복사 완료: ${u}`);
                }}
                className="px-2.5 py-1 border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
              >
                복사
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
