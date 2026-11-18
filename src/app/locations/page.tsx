import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import CmsPageHeader from '@/components/CmsPageHeader';

const ACTIVE_CITIES = [
  {
    city: '서울',
    areas: ['성수', '강남', '한남 · 이태원', '을지로 · 종로'],
    schedule: '매주 금 · 토요일 19:30',
    status: '운영중',
  },
  {
    city: '부산',
    areas: ['전포 · 서면', '해운대 · 마린시티', '광안리', '센텀시티'],
    schedule: '매주 금 · 토 · 일요일',
    status: '운영중',
  },
];

const UPCOMING_CITIES = [
  { city: '대구', areas: '동성로 · 수성못', eta: '오픈 준비중' },
  { city: '대전', areas: '둔산 · 봉명동', eta: '오픈 준비중' },
  { city: '인천', areas: '송도 · 구월동', eta: '오픈 준비중' },
  { city: '광주', areas: '동명동 · 상무지구', eta: '오픈 준비중' },
  { city: '제주', areas: '제주시 · 애월', eta: '오픈 준비중' },
  { city: '판교 · 분당', areas: '판교역 · 정자동', eta: '오픈 준비중' },
];

export default function LocationsPage() {
  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8">
      <div className="max-w-[1100px] mx-auto space-y-12">
        <CmsPageHeader
          pageId="PAGE_LOCATIONS"
          defaultBadge="CITIES & NEIGHBORHOODS"
          defaultTitle="운영 도시 및 생활권 안내"
          defaultSub="타임레프트 표준 방식에 따라 도시와 일정만 선택하면, 해당 지역 내 검증된 제휴 식당을 D-1 19:00에 배정해 드립니다."
        />

        <section className="space-y-4">
          <h2 className="font-serif-editorial text-2xl text-white font-normal">현재 운영 도시</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ACTIVE_CITIES.map((item) => (
              <div key={item.city} className="p-6 border border-white/15 bg-[#0c0d12] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#f04f74]" />
                    <h3 className="font-serif-editorial text-2xl text-white">{item.city}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 border border-[#f04f74]/60 bg-[#f04f74]/15 text-xs font-mono text-white">
                    {item.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.areas.map((a) => (
                    <span key={a} className="px-2.5 py-1 border border-white/10 bg-[#07080a] text-xs font-mono text-zinc-300">
                      {a}
                    </span>
                  ))}
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-sm">
                  <span className="font-mono text-zinc-400">{item.schedule}</span>
                  <Link
                    href={`/meetup?region=${encodeURIComponent(item.city)}`}
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 text-white font-mono hover:text-[#f04f74]"
                  >
                    <span>밋업 예약</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif-editorial text-2xl text-white font-normal">확장 예정 도시</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {UPCOMING_CITIES.map((u) => (
              <div key={u.city} className="p-5 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-white font-semibold">{u.city}</h3>
                  <p className="text-xs font-mono text-zinc-400 mt-1">{u.areas}</p>
                </div>
                <span className="px-2 py-0.5 border border-white/15 text-xs font-mono text-zinc-400">
                  {u.eta}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
