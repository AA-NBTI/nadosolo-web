'use client';

import React from 'react';
import { MapPin, Wine } from 'lucide-react';

interface VenueItem {
  id: string;
  name: string;
  district: string;
  type: string;
  features: string[];
  image: string;
}

const VENUES: VenueItem[] = [
  {
    id: 'v1',
    name: '아틀리에 전포',
    district: 'BUSAN JEONPO',
    type: '유러피안 와인 비스트로',
    features: ['단독 룸 단독 대관', '테이블 간격 2.5m', '조도 조절 앰비언스'],
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'v2',
    name: '오션 브리즈 스위트',
    district: 'MARINE CITY',
    type: '스위트 다이닝 & 페어링',
    features: ['오션뷰 프라이빗 스위트', '소믈리에 큐레이션', '발렛 파킹'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'v3',
    name: '서면 까사 디 루체',
    district: 'BUSAN SEOMYEON',
    type: '컨템포러리 다이닝',
    features: ['셰프 스페셜 코스', '소음도 45dB 이하', '웰컴 샴페인'],
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'v4',
    name: '영도 벨류 살롱',
    district: 'YEONGDO PORT',
    type: '아카이브 라이브러리 라운지',
    features: ['항구 야경 파노라마', '어쿠스틱 재즈 BGM', '시크릿 라운지'],
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=900&q=85',
  },
];

export default function SectorVenues() {
  return (
    <section className="w-full py-24 sm:py-36 bg-[#07080a] border-b border-white/[0.08] text-[#f5f2eb]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
        
        {/* 섹션 상단 */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/[0.1] pb-8 mb-16 sm:mb-20 gap-6">
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-[0.3em] text-[#f04f74] uppercase font-semibold block">
              The Residences &amp; Salons
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              실사 검증 제휴 파트너 공간
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-md leading-relaxed">
            테이블 간격, 배경음악 볼륨, 메뉴 퀄리티까지 현장 실사로 검증된 제휴 베뉴만을 배정합니다.
          </p>
        </div>

        {/* 베뉴 갤러리 4열 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {VENUES.map((v) => (
            <div key={v.id} className="space-y-4 group">
              <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950 border border-white/[0.08]">
                <img
                  src={v.image}
                  alt={v.name}
                  className="w-full h-full object-cover filter brightness-[0.85] group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-mono tracking-widest text-[#f04f74] bg-black/80 px-2.5 py-1 border border-white/10 uppercase font-semibold">
                    {v.district}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  {v.type}
                </span>
                <h3 className="font-serif-editorial text-lg text-white font-medium">
                  {v.name}
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {v.features.map((f, i) => (
                    <span key={i} className="text-[11px] text-zinc-400 font-light">
                      • {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
