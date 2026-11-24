import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_LANGS = new Set(['en', 'ko', 'ja', 'zh', 'es']);
const translateCache = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body?.text || '').trim().slice(0, 500);
    const rawTarget = String(body?.targetLang || 'ko').toLowerCase();
    const targetLang = ALLOWED_LANGS.has(rawTarget) ? (rawTarget === 'zh' ? 'zh-CN' : rawTarget) : 'ko';

    if (!text) {
      return NextResponse.json({ ok: false, error: 'Missing text' }, { status: 400 });
    }

    const cacheKey = `${targetLang}:${text}`;
    const cached = translateCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, translatedText: cached });
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'Translation unavailable' }, { status: 502 });
    }

    const data = await res.json();
    const segments = Array.isArray(data?.[0]) ? data[0] : [];
    const translated = segments
      .map((seg: any) => (Array.isArray(seg) ? String(seg[0] || '') : ''))
      .join('')
      .trim();

    if (!translated) {
      return NextResponse.json({ ok: false, error: 'Empty translation' }, { status: 502 });
    }

    // 메모리 캐시 상한 관리
    if (translateCache.size > 1000) {
      translateCache.clear();
    }
    translateCache.set(cacheKey, translated);

    return NextResponse.json({ ok: true, translatedText: translated });
  } catch {
    return NextResponse.json({ ok: false, error: 'Translation error' }, { status: 500 });
  }
}
