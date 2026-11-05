'use client';

import React from 'react';
import Link from 'next/link';
import { Utensils, Wine, Users2, Compass, ArrowUpRight } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'dining',
    title: '소셜 다이닝',
    subtitle: 'Social Dining',
    badge: '대표 프로그램',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: '매주 금·토 저녁, 엄선된 셰프의 코스 요리와 와인을 곁들여 4~6인이 깊이 있게 교류하는 메인 미식 모임입니다.',
    target: '3045 전문직 직장인 & 5060 골든 솔로',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    href: '/dining',
    icon: Utensils,
  },
  {
    id: 'salon',
    title: '소셜 살롱',
    subtitle: 'Social Salon',
    badge: '문화·대화 중심',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: '예술, 인문학, 와인 페어링, 라이프스타일 주제를 기반으로 조용한 라운지에서 생각을 나누는 지적 소통 공간입니다.',
    target: '취향과 가치관을 중시하는 커뮤니티',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    href: '/salon',
    icon: Wine,
  },
  {
    id: 'club',
    title: '소셜 클럽',
    subtitle: 'Social Club',
    badge: '정기 프라이빗 멤버십',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    desc: '단발성 모임을 넘어, 지속적인 유대감과 비즈니스·취미 네트워킹을 함께 나누는 신뢰 기반 멤버십 클럽입니다.',
    target: '지속적인 인적 네트워크와 모임을 원하는 멤버',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80',
    href: '/club',
    icon: Users2,
  },
  {
    id: 'meetup',
    title: '테마 밋업',
    subtitle: 'Theme Meetup',
    badge: 'NEW 오픈',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    desc: '위스키 테이스팅, 주말 브런치, 러닝 & 커피 등 특정 라이프스타일 테마에 맞춰 자유롭게 신청하는 캐주얼 모임입니다.',
    target: '가벼운 주말 액티비티와 관심사 교류',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    href: '/meetup',
    icon: Compass,
  },
];

export default function SectorCategories() {
  return (
    <section className="w-full py-16 sm:py-20 bg-[#090a0f] border-b border-white/5">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* 섹션 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-rose-400 uppercase">
              Program Lineup
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              원하는 방식으로 만나는 4가지 소셜 프로그램
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            정숙한 디너부터 지적인 살롱과 캐주얼한 밋업까지, 당신의 취향과 속도에 맞는 자리를 선택해 보세요.
          </p>
        </div>

        {/* 4대 카테고리 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className="group relative flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 hover:border-rose-500/40 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-950/20"
              >
                {/* 상단 이미지 영역 */}
                <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e14] via-[#0d0e14]/40 to-transparent" />
                  
                  {/* 상단 뱃지 */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:bg-rose-600 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                {/* 하단 본문 영역 */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-rose-400" />
                    <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                      {cat.title}
                    </h3>
                    <span className="text-xs text-zinc-500 font-serif-editorial">
                      {cat.subtitle}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-4 flex-1">
                    {cat.desc}
                  </p>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="truncate">{cat.target}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
