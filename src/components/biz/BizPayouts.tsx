'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { VenuePayoutRecord, VenuePayoutSummary } from '@/lib/reservation/payouts';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function BizPayouts({ resourceId }: { resourceId: string }) {
  const [summary, setSummary] = useState<VenuePayoutSummary | null>(null);
  const [payouts, setPayouts] = useState<VenuePayoutRecord[]>([]);
  const [bankInfo, setBankInfo] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/biz/payouts?resourceId=${encodeURIComponent(resourceId)}`);
      const data = await res.json();
      if (data.ok && data.summary) {
        setSummary(data.summary);
        setBankInfo(data.summary.bankInfo || '');
        setPayouts(Array.isArray(data.payouts) ? data.payouts : []);
      }
    } catch {}
  }, [resourceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitAction = async (action: 'SAVE_BANK' | 'REQUEST') => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/biz/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resourceId, bankInfo }),
      });
      const data = await res.json();
      if (!data.ok) {
        setNotice(data.error || '처리 실패');
      } else {
        setNotice(action === 'REQUEST' ? '정산 요청이 접수되었습니다.' : '계좌가 저장되었습니다.');
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
          <h2 className="font-serif-editorial text-lg text-white font-normal">정산</h2>
          {summary?.requestedAt && (
            <span className="px-2 py-0.5 border border-white/25 text-white">요청됨</span>
          )}
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
        <div className="p-3 border border-white/25 bg-white/5 text-white">{notice}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          ['결제매출', won(summary?.netSalesKrw ?? 0)],
          [`수수료(${summary?.feeRate ?? 5}%)`, won(summary?.feeKrw ?? 0)],
          ['지급완료', won(summary?.paidOutKrw ?? 0)],
          ['정산잔액', won(summary?.balanceKrw ?? 0)],
        ].map(([k, v]) => (
          <div key={k} className="p-3 border border-white/10 bg-[#0c0d12]">
            <div className="text-zinc-400">{k}</div>
            <div className="text-white text-base font-bold mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
        <div className="text-zinc-300">정산 계좌</div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={bankInfo}
            onChange={(e) => setBankInfo(e.target.value)}
            placeholder="은행 · 계좌번호 · 예금주"
            className="flex-1 min-w-[220px] px-3 py-2 bg-[#07080a] border border-white/20 text-white outline-none focus:border-white/40"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitAction('SAVE_BANK')}
            className="px-3 py-2 border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer disabled:opacity-40"
          >
            저장
          </button>
          <button
            type="button"
            disabled={busy || (summary?.balanceKrw ?? 0) <= 0}
            onClick={() => void submitAction('REQUEST')}
            className="px-3 py-2 border border-white/30 bg-white/15 hover:bg-white/25 text-white font-bold cursor-pointer disabled:opacity-40"
          >
            출금요청
          </button>
        </div>
      </div>

      {payouts.length > 0 && (
        <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-2">
          <div className="text-zinc-300 border-b border-white/10 pb-2">지급 내역</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {payouts.map((p) => (
              <div key={p.id} className="p-3 border border-white/10 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white font-bold">{won(p.amountKrw)}</div>
                  <div className="text-zinc-400 truncate">{p.bankInfo}</div>
                </div>
                <span className="text-zinc-400 shrink-0">
                  {new Date(p.paidAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
