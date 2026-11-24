import { NextResponse, type NextRequest } from 'next/server';
import { extractSubdomainSlug, isOopsHost } from '@/modules/tenancy';

const PASSTHROUGH_PREFIXES = [
  '/api/',
  '/_next/',
  '/reserve',
  '/biz',
  '/admin',
  '/pay/',
  '/s/',
  '/r/',
  '/oops',
  '/sw.js',
  '/manifest.webmanifest',
  '/favicon.ico',
];

const SPANISH_COUNTRIES = new Set([
  'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR',
]);

function detectOopsGeoLocale(req: NextRequest): 'en' | 'ko' | 'ja' | 'zh' | 'es' {
  const country = (req.headers.get('x-vercel-ip-country') || '').toUpperCase();
  if (country === 'KR') return 'ko';
  if (country === 'JP') return 'ja';
  if (country === 'CN' || country === 'TW' || country === 'HK' || country === 'MO') return 'zh';
  if (SPANISH_COUNTRIES.has(country)) return 'es';
  if (country) return 'en';

  const acceptLang = (req.headers.get('accept-language') || '').toLowerCase();
  if (acceptLang.startsWith('ko')) return 'ko';
  if (acceptLang.startsWith('ja')) return 'ja';
  if (acceptLang.startsWith('zh')) return 'zh';
  if (acceptLang.startsWith('es')) return 'es';
  return 'en';
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = (request.headers.get('host') || '').toLowerCase();

  if (pathname.startsWith('/oops')) {
    const res = NextResponse.next();
    res.cookies.set('oops_geo_locale', detectOopsGeoLocale(request), {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });
    return res;
  }

  if (PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // oops.monster 접속 시 -> / -> /oops, /app -> /oops/app, /hq -> /oops/hq 리라이트 + IP 언어 쿠키 전달
  if (isOopsHost(host)) {
    const geoLocale = detectOopsGeoLocale(request);
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone();
      url.pathname = '/oops';
      url.search = search;
      const res = NextResponse.rewrite(url);
      res.cookies.set('oops_geo_locale', geoLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
      return res;
    }
    if (pathname === '/app') {
      const url = request.nextUrl.clone();
      url.pathname = '/oops/app';
      url.search = search;
      const res = NextResponse.rewrite(url);
      res.cookies.set('oops_geo_locale', geoLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
      return res;
    }
    if (pathname === '/hq') {
      const url = request.nextUrl.clone();
      url.pathname = '/oops/hq';
      url.search = search;
      return NextResponse.rewrite(url);
    }
  }

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
