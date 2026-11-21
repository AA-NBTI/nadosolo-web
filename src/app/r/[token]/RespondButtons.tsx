'use client';

import { useState } from 'react';

export default function RespondButtons({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function send(action: 'ACCEPT' | 'DECLINE') {
    setState('busy');
    try {
      const res = await fetch('/api/reservations/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });
      const data = await res.json();
      if (data.ok) {
        setState('done');
        setMessage(action === 'ACCEPT' ? '수락 완료' : '거절 완료');
      } else {
        setState('error');
        setMessage(data.error ?? '실패');
      }
    } catch {
      setState('error');
      setMessage('실패');
    }
  }

  if (state === 'done') return <div className="text-center text-base text-white font-medium">{message}</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={state === 'busy'}
          onClick={() => send('ACCEPT')}
          className="px-3 py-3 text-sm font-mono font-bold border border-white/30 bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 cursor-pointer"
        >
          수락
        </button>
        <button
          type="button"
          disabled={state === 'busy'}
          onClick={() => send('DECLINE')}
          className="px-3 py-3 text-sm font-mono border border-white/20 bg-transparent hover:bg-white/10 text-white disabled:opacity-50 cursor-pointer"
        >
          거절
        </button>
      </div>
      {state === 'error' && <div className="text-center text-sm text-white">{message}</div>}
    </div>
  );
}
