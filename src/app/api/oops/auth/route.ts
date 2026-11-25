import { NextRequest, NextResponse } from 'next/server';
import {
  getOopsMemberById,
  loginOopsMember,
  registerOopsMember,
  signSessionToken,
  updateOopsMember,
  verifySessionToken,
  withdrawOopsMember,
} from '@/lib/oops/memberStore';

const COOKIE_NAME = 'oops_member_session';

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90일 영구 유지
  });
}

function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const memberId = verifySessionToken(token);
  if (!memberId) {
    return NextResponse.json({ ok: true, member: null });
  }

  const member = await getOopsMemberById(memberId);
  if (!member) {
    const res = NextResponse.json({ ok: true, member: null });
    clearSessionCookie(res);
    return res;
  }

  return NextResponse.json({ ok: true, member });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || '').toUpperCase();

    if (action === 'REGISTER') {
      const result = await registerOopsMember({
        email: String(body?.email || ''),
        password: String(body?.password || ''),
        callsign: String(body?.callsign || ''),
        countryCode: String(body?.countryCode || 'KR'),
        preferredSerialNo: Number(body?.preferredSerialNo || 0) || undefined,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      const res = NextResponse.json({ ok: true, member: result.member });
      setSessionCookie(res, signSessionToken(result.member.id));
      return res;
    }

    if (action === 'LOGIN') {
      const result = await loginOopsMember({
        identifier: String(body?.identifier || ''),
        password: String(body?.password || ''),
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
      }

      const res = NextResponse.json({ ok: true, member: result.member });
      setSessionCookie(res, signSessionToken(result.member.id));
      return res;
    }

    if (action === 'LOGOUT') {
      const res = NextResponse.json({ ok: true });
      clearSessionCookie(res);
      return res;
    }

    if (action === 'UPDATE') {
      const token = req.cookies.get(COOKIE_NAME)?.value;
      const memberId = verifySessionToken(token);
      if (!memberId) {
        return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
      }

      const result = await updateOopsMember({
        memberId,
        callsign: body?.callsign,
        countryCode: body?.countryCode,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, member: result.member });
    }

    if (action === 'WITHDRAW') {
      const token = req.cookies.get(COOKIE_NAME)?.value;
      const memberId = verifySessionToken(token);
      if (!memberId) {
        return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
      }

      const result = await withdrawOopsMember(memberId);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      const res = NextResponse.json({ ok: true, withdrawnCountryCode: result.countryCode });
      clearSessionCookie(res);
      return res;
    }

    return NextResponse.json({ ok: false, error: 'Invalid auth action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Auth server error' }, { status: 500 });
  }
}
