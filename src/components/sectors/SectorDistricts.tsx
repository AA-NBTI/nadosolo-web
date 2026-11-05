'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Sparkles, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface DistrictCard {
  id: string;
  city: 'BUSAN' | 'SEOUL';
  name: string;
  tagline: string;
  atmosphere: string;
  status: 'ACTIVE' | 'UPCOMING';
  image: string;
  schedule: string;
  ageGroups: string;
}

const DISTRICT_LIST: DistrictCard[] = [
  {
    id: 'busan-jeonpo',
    city: 'BUSAN',
    name: '전포 · 서면',
    tagline: '감성 내추럴 와인바 & 트렌디 캐주얼 비스트로',
    atmosphere: '힙하고 따뜻한 조명, 감각적인 플레이트와 자연스러운 대화',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    schedule: '매주 금/토 저녁 7시 30분',
    ageGroups: '3045 전문직 직장인',
  },
  {
    id: 'busan-haeundae',
    city: 'BUSAN',
    name: '해운대 · 광안리',
    tagline: '오션뷰 프라이빗 다이닝 & 모던 라운지',
    atmosphere: '바다 야경과 함께하는 하이엔드 코스 요리 및 프리미엄 와인',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
    schedule: '매주 토 저녁 7시',
    ageGroups: '3045 & 5060 골든 솔로',
  },
  {
    id: 'busan-nampo',
    city: 'BUSAN',
    name: '남포 · 영도',
    tagline: '빈티지 아카이브 & 헤리티지 소셜 다이닝',
    atmosphere: '옛 감성과 클래식한 무드가 어우러진 깊이 있는 대화의 밤',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    schedule: '격주 토 저녁 7시',
    ageGroups: '3045 직장인 & 골든 솔로',
  },
  {
    id: 'seoul-seongsu',
    city: 'SEOUL',
    name: '서울 성수 · 서울숲',
    tagline: '아티스틱 내추럴 와인바 & 프라이빗 룸',
    atmosphere: '크리에이티브하고 자유로운 분위기에서 나누는 미식과 라이프스타일',
    status: 'UPCOMING',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
    schedule: '2차 오픈 사전 알림 접수중',
    ageGroups: '사전 대기자 428명',
  },
  {
    id: 'seoul-gangnam',
    city: 'SEOUL',
    name: '서울 강남 · 신사',
    tagline: '프리미엄 컨템포러리 다이닝',
    atmosphere: '도심 속 조용하고 고급스러운 프라이빗 다이닝 공간',
    status: 'UPCOMING',
    image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=800&q=80',
    schedule: '2차 오픈 사전 알림 접수중',
    ageGroups: '사전 대기자 312명',
  },
];

interface SectorDistrictsProps {
  onOpenCheckout?: () => void;
}

export default function SectorDistricts({ onOpenCheckout }: SectorDistrictsProps) {
  const [selectedCity, setSelectedCity] = useState<'ALL' | 'BUSAN' | 'SEOUL'>('BUSAN');

  const filteredDistricts = DISTRICT_LIST.filter((d) => {
    if (selectedCity === 'ALL') return true;
    return d.city === selectedCity;
  });

  return (
    <section className="w-full py-16 sm:py-20 bg-[#090a0f] border-b border-white/5">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* 섹션 상단 헤더 & 도시 필터 탭 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-rose-400 uppercase">
              Curated Districts & Venues
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              도시별 엄선된 권역과 공간
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              대화에 집중할 수 있는 테이블 간격과 음악 볼륨을 사전 검증한 파트너 공간입니다.
            </p>
          </div>

          {/* 도시 필터 스위치 */}
          <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSelectedCity('BUSAN')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCity === 'BUSAN'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              부산 (운영중)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCity('SEOUL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCity === 'SEOUL'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>서울 (오픈예정)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedCity('ALL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCity === 'ALL'
                  ? 'bg-white/20 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              전체 보기
            </button>
          </div>
        </div>

        {/* 권역 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDistricts.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group"
            >
              {/* 이미지 썸네일 */}
              <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                
                {/* 상태 뱃지 */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {item.status === 'ACTIVE' ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      실시간 예약중
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      2차 오픈 사전예약
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>{item.name}</span>
                  </h3>
                </div>
              </div>

              {/* 본문 설명 */}
              <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-rose-300">
                    {item.tagline}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.atmosphere}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2 text-xs text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <Clock className="w-3.5 h-3.5" />
                      일정
                    </span>
                    <span className="font-medium text-zinc-200">{item.schedule}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <Sparkles className="w-3.5 h-3.5" />
                      대상
                    </span>
                    <span className="font-medium text-zinc-200">{item.ageGroups}</span>
                  </div>
                </div>

                {/* 신청 버튼 */}
                {item.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={onOpenCheckout}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-rose-600 hover:text-white border border-white/10 text-xs font-semibold text-zinc-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>이 권역 모임 신청하기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    href="/seoul"
                    className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span>사전 오픈 알림 등록</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
