import { NextResponse, type NextRequest } from 'next/server';
import { extractSubdomainSlug } from '@/modules/tenancy';

const PASSTHROUGH_PREFIXES = [
  '/api/',
  '/_next/',
  '/reserve',
  '/biz',
  '/admin',
  '/pay/',
  '/s/',
  '/r/',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const host = (request.headers.get('host') || '').toLowerCase();

  // tablebaro.com 또는 www.tablebaro.com 메인 접속 시 -> 테이블바로 허브(/reserve)로 리라이트
  if (
    (host === 'tablebaro.com' || host === 'www.tablebaro.com') &&
    (pathname === '/' || pathname === '')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/reserve';
    url.search = search;
    return NextResponse.rewrite(url);
  }

  const slug = extractSubdomainSlug(host);
  if (!slug) {
    return NextResponse.next();
  }

  // gosu.tablebaro.com/ -> 내부적으로 /reserve/gosu 로 리라이트 (주소창 유지)
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = `/reserve/${slug}`;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
