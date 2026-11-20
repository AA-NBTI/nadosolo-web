import { NextResponse } from 'next/server';
import { determineNextSpinResult, SpinHistoryItem } from '@/lib/yot/yotTypes';
import { issueYotCoupon } from '@/lib/yot/yotService';

export async function POST(request: Request) {
  try {
    const { history = [], totalTaffy = 3, userEmail = 'user@example.com', isFinalSpin = false } = await request.json();

    const spinOutcome = determineNextSpinResult(history as SpinHistoryItem[], totalTaffy);

    let couponRecord = null;
    if (isFinalSpin || history.length + 1 >= totalTaffy) {
      const finalAmount = spinOutcome.targetCouponAmount;
      couponRecord = await issueYotCoupon(userEmail, finalAmount, [
        ...history,
        {
          spinIndex: history.length + 1,
          slotKey: spinOutcome.resultSlot.key,
          amount: spinOutcome.resultSlot.amount,
        },
      ]);
    }

    return NextResponse.json({
      slot: spinOutcome.resultSlot,
      bonusTaffyAwarded: spinOutcome.bonusTaffyAwarded,
      bonusMessage: spinOutcome.bonusMessage,
      targetCouponAmount: spinOutcome.targetCouponAmount,
      coupon: couponRecord,
    });
  } catch (err: any) {
    console.error('[YotSpinAPI] Error:', err);
    return NextResponse.json(
      { error: err.message || '룰렛 스핀 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
