'use client';

import React from 'react';
import { MapPin, Wine, Building2 } from 'lucide-react';

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
    district: '부산 전포동',
    type: '내추럴 와인 비스트로',
    features: ['단독 룸 대관', '테이블 간격 2.5m', '조도 조절 앰비언스'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'v2',
    name: '오션 브리즈 라운지',
    district: '부산 해운대 마린시티',
    type: '다이닝 & 와인 페어링',
    features: ['오션뷰 프라이빗 테이블', '소믈리에 큐레이션', '발렛 파킹'],
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'v3',
    name: '서면 까사 디 루체',
    district: '부산 서면',
    type: '컨템포러리 다이닝',
    features: ['셰프 스페셜 코스', '소음도 50dB 이하', '웰컴 스파클링'],
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'v4',
    name: '영도 벨류 살롱',
    district: '부산 영도구',
    type: '아카이브 라운지',
    features: ['항구 야경 파노라마', '어쿠스틱 재즈 BGM', '시크릿 라운지'],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=700&q=80',
  },
];

export default function SectorVenues() {
  return (
    <section className="w-full py-16 sm:py-20 bg-[#090a0f] border-b border-white/10">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* 섹션 상단 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Verified Partners
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              엄선된 파트너 공간
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            테이블 간격, 배경음악 볼륨, 메뉴 퀄리티까지 현장 실사로 검증된 제휴 베뉴만을 배정합니다.
          </p>
        </div>

        {/* 베뉴 갤러리 4열 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VENUES.map((v) => (
            <div
              key={v.id}
              className="group flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300"
            >
              {/* 이미지 */}
              <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                <img
                  src={v.image}
                  alt={v.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/20" />
                
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-black/60 text-zinc-200 border border-white/10 backdrop-blur-md flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#f04f74]" />
                    {v.district}
                  </span>
                </div>
              </div>

              {/* 정보 */}
              <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#f04f74] transition-colors">
                    {v.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                    <Wine className="w-3 h-3 text-rose-400" />
                    {v.type}
                  </p>
                </div>

                {/* 태그 리스트 */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                  {v.features.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400"
                    >
                      {f}
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
