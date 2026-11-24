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
  const { pathname, search, searchParams } = request.nextUrl;
  const host = (request.headers.get('host') || '').toLowerCase();
  const brandQuery = searchParams.get('brand') || searchParams.get('mode');

  // oops.monster 전용 도메인 처리 (또는 로컬 개발 환경에서 ?brand=oops 또는 oops.localhost)
  if (isOopsHost(host) || brandQuery === 'oops') {
    const geoLocale = detectOopsGeoLocale(request);

    // 1) /oops -> 클린 URL https://oops.monster/ 로 308 영구 리다이렉트
    if (pathname === '/oops' || pathname === '/oops/') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = search;
      const res = NextResponse.redirect(url, 308);
      res.cookies.set('oops_geo_locale', geoLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
      return res;
    }

    // 2) /oops/app -> https://oops.monster/app 으로 308 리다이렉트
    if (pathname === '/oops/app' || pathname === '/oops/app/') {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      url.search = search;
      const res = NextResponse.redirect(url, 308);
      res.cookies.set('oops_geo_locale', geoLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
      return res;
    }

    // 3) /oops/hq -> https://oops.monster/hq 로 308 리다이렉트
    if (pathname === '/oops/hq' || pathname === '/oops/hq/') {
      const url = request.nextUrl.clone();
      url.pathname = '/hq';
      url.search = search;
      return NextResponse.redirect(url, 308);
    }

    // 4) 루트(/) 접속 시 -> 내부적으로 /oops 페이지로 리라이트 (주소창은 https://oops.monster/ 유지)
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone();
      url.pathname = '/oops';
      url.search = search;
      const res = NextResponse.rewrite(url);
      res.cookies.set('oops_geo_locale', geoLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
      return res;
    }

    // 5) /app 접속 시 -> 내부적으로 /oops/app 페이지로 리라이트
    if (pathname === '/app') {
      const url = request.nextUrl.clone();
      url.pathname = '/oops/app';
      url.search = search;
      const res = NextResponse.rewrite(url);
      res.cookies.set('oops_geo_locale', geoLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
      return res;
    }

    // 5-1) /sns 접속 시 -> 내부적으로 /sns 페이지(SNS 전용 뷰)로 라우팅
    if (pathname === '/sns') {
      const res = NextResponse.next();
      res.cookies.set('oops_geo_locale', geoLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
      return res;
    }

    // 6) /case 접속 시 -> 내부적으로 /oops/case 페이지로 리라이트
    if (pathname.startsWith('/case')) {
      const url = request.nextUrl.clone();
      url.pathname = `/oops${pathname}`;
      url.search = search;
      const res = NextResponse.rewrite(url);
      res.cookies.set('oops_geo_locale', geoLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
      return res;
    }

    // 7) /hq 접속 시 -> 내부적으로 /oops/hq 페이지로 리라이트
    if (pathname === '/hq') {
      const url = request.nextUrl.clone();
      url.pathname = '/oops/hq';
      url.search = search;
      return NextResponse.rewrite(url);
    }
  }

  // 타 도메인(nadosolo 등)에서 /oops 직접 접근 시 IP 기반 언어 쿠키 설정
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
