import { getReservationEngine } from '@/lib/reservation/runtime';
import { getLinkSecret, verifyResponseToken } from '@/lib/reservation/token';
import RespondButtons from './RespondButtons';

export const dynamic = 'force-dynamic';

function Notice({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-8 text-center text-base text-white">
        {text}
      </div>
    </div>
  );
}

export default async function ReservationRespondPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const secret = getLinkSecret();
  const engine = getReservationEngine();
  if (!secret || !engine) return <Notice text="비활성" />;

  const verified = verifyResponseToken(decodeURIComponent(token), secret);
  if (!verified) return <Notice text="만료된 링크" />;

  const booking = await engine.getBooking(verified.bookingId);
  if (!booking) return <Notice text="예약 없음" />
  const startsAt = booking.meta?.startsAtText as string | undefined;
  const venueName = (booking.meta?.venueName as string | undefined) ?? booking.resourceId;
  const when = startsAt ?? '';

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            <h1 className="font-serif-editorial text-lg text-white font-normal">예약 요청</h1>
          </div>
          <span className="text-sm font-mono tracking-wider text-zinc-400">TABLEBARO</span>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <dt className="text-zinc-400">식당</dt>
            <dd className="text-white font-medium">{venueName}</dd>
          </div>
          {when && (
            <div className="flex justify-between border-b border-white/10 pb-2">
              <dt className="text-zinc-400">일시</dt>
              <dd className="text-white font-medium">{when}</dd>
            </div>
          )}
          <div className="flex justify-between border-b border-white/10 pb-2">
            <dt className="text-zinc-400">인원</dt>
            <dd className="text-white font-medium">{booking.partySize}명</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">상태</dt>
            <dd className="text-white font-medium">{booking.status}</dd>
          </div>
        </dl>
        {booking.status === 'REQUESTED' ? (
          <RespondButtons token={decodeURIComponent(token)} />
        ) : (
          <div className="text-center text-sm text-zinc-200">처리 완료</div>
        )}
      </div>
    </div>
  );
}
