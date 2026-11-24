import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_LANGS = new Set(['en', 'ko', 'ja', 'zh', 'es']);
const translateCache = new Map<string, string>();

async function translateSingle(text: string, targetLang: string): Promise<string> {
  const clean = text.trim().slice(0, 500);
  if (!clean) return '';

  const cacheKey = `${targetLang}:${clean}`;
  const cached = translateCache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(clean)}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    });
    if (!res.ok) return clean;

    const data = await res.json();
    const segments = Array.isArray(data?.[0]) ? data[0] : [];
    const translated = segments
      .map((seg: any) => (Array.isArray(seg) ? String(seg[0] || '') : ''))
      .join('')
      .trim();

    if (!translated) return clean;

    if (translateCache.size > 2000) {
      translateCache.clear();
    }
    translateCache.set(cacheKey, translated);
    return translated;
  } catch {
    return clean;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTarget = String(body?.targetLang || 'ko').toLowerCase();
    const targetLang = ALLOWED_LANGS.has(rawTarget)
      ? rawTarget === 'zh'
        ? 'zh-CN'
        : rawTarget
      : 'ko';

    // 배치 번역 지원 (크롬식 전체 페이지 자동 번역)
    if (Array.isArray(body?.texts)) {
      const inputs = (body.texts as unknown[])
        .slice(0, 60)
        .map((t) => String(t || '').trim().slice(0, 500));
      const translatedTexts = await Promise.all(
        inputs.map((t) => translateSingle(t, targetLang))
      );
      return NextResponse.json({ ok: true, translatedTexts });
    }

    // 단건 번역 지원
    const text = String(body?.text || '').trim().slice(0, 500);
    if (!text) {
      return NextResponse.json({ ok: false, error: 'Missing text' }, { status: 400 });
    }
    const translatedText = await translateSingle(text, targetLang);
    return NextResponse.json({ ok: true, translatedText });
  } catch {
    return NextResponse.json({ ok: false, error: 'Translation error' }, { status: 500 });
  }
}
