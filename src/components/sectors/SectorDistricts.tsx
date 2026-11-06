'use client';

import React from 'react';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import AdaptiveButton from '../ui/AdaptiveButton';

interface DistrictCard {
  id: string;
  name: string;
  tagline: string;
  atmosphere: string;
  image: string;
  schedule: string;
  target: string;
}

const DISTRICT_LIST: DistrictCard[] = [
  {
    id: 'busan-jeonpo',
    name: '부산 서면',
    tagline: '내추럴 와인바 & 캐주얼 비스트로',
    atmosphere: '따뜻한 조명과 감각적인 플레이트, 자연스러운 대화의 자리',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    schedule: '매주 금/토 저녁',
    target: '3040 직장인',
  },
  {
    id: 'busan-haeundae',
    name: '부산 해운대',
    tagline: '오션뷰 다이닝 & 라운지',
    atmosphere: '바다 야경과 함께하는 디너 및 와인 페어링',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    schedule: '매주 토 저녁',
    target: '3040 & 5060',
  },
  {
    id: 'busan-nampo',
    name: '부산 남포',
    tagline: '헤리티지 소셜 다이닝',
    atmosphere: '클래식한 무드가 어우러진 깊이 있는 대화의 밤',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
    schedule: '격주 토 저녁',
    target: '3040 & 5060',
  },
];

interface SectorDistrictsProps {
  onOpenCheckout?: () => void;
}

export default function SectorDistricts({ onOpenCheckout }: SectorDistrictsProps) {
  return (
    <section className="w-full py-16 sm:py-20 bg-[#090a0f] border-b border-white/10">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* 섹션 상단 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Curated Districts
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              부산 모임 권역
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            대화에 집중할 수 있는 테이블 간격과 음악 볼륨을 사전 검증한 공간입니다.
          </p>
        </div>

        {/* 권역 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DISTRICT_LIST.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group"
            >
              {/* 이미지 */}
              <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>{item.name}</span>
                  </h3>
                </div>
              </div>

              {/* 본문 설명 */}
              <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-zinc-300">
                    {item.tagline}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.atmosphere}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">일정</span>
                    <span className="font-medium text-zinc-200">{item.schedule}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">대상</span>
                    <span className="font-medium text-zinc-200">{item.target}</span>
                  </div>
                </div>

                {/* 신청 버튼: AdaptiveButton 적용 (샤프하고 컴팩트한 높이) */}
                <AdaptiveButton
                  onClick={onOpenCheckout}
                  className="w-full h-10 py-2 text-xs sm:text-sm font-semibold"
                >
                  신청하기
                </AdaptiveButton>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
