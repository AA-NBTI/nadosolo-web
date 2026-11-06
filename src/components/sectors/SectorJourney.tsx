'use client';

import React from 'react';

const PHASES = [
  {
    phase: 'PHASE 01',
    title: 'Private Arrival',
    korTitle: '은밀한 착석',
    desc: '소음이 차단된 단독 룸, 나도솔로 매칭 엔진이 사전 큐레이션한 지정 좌석에 어색함 없이 자연스럽게 착석합니다.',
    image: 'https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&w=800&q=85',
  },
  {
    phase: 'PHASE 02',
    title: 'Dialogue Cards',
    korTitle: '지적 아이스브레이킹',
    desc: '라이프스타일과 예술, 취향을 여는 질문 카드로 어색한 침묵 없이 품격 있는 대화의 결을 맞춥니다.',
    image: 'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&w=800&q=85',
  },
  {
    phase: 'PHASE 03',
    title: 'Gastronomy & Pairing',
    korTitle: '셰프 코스 & 와인',
    desc: '엄선된 계절 코스 요리와 와인을 음미하며 2시간 동안 깊이 있는 가치관과 일상의 온도를 나눕니다.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=85',
  },
  {
    phase: 'PHASE 04',
    title: 'Reciprocal Dossier',
    korTitle: '상호주의 소셜 리포트',
    desc: '익일 오전 09시, 동석자들의 객관적인 단일 명사 관찰 평가를 통해 나의 소셜 품격 리포트가 해금됩니다.',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=800&q=85',
  },
];

export default function SectorJourney() {
  return (
    <section className="w-full py-24 sm:py-36 bg-[#07080a] border-b border-white/[0.08] text-[#f5f2eb]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
        
        {/* 섹션 헤더 */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/[0.1] pb-8 mb-16 sm:mb-20 gap-6">
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-[0.3em] text-[#f04f74] uppercase font-semibold block">
              The Protocol
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              살롱의 4가지 진행 단계
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-md leading-relaxed">
            체면과 자존감을 지켜드리는 비공개 동선과 유연한 진행 플레이북으로, 처음 참석하셔도 편안하게 온전히 몰입할 수 있습니다.
          </p>
        </div>

        {/* 4단 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PHASES.map((p) => (
            <div key={p.phase} className="space-y-5 group">
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950 border border-white/[0.08]">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover filter brightness-[0.85] group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-mono tracking-widest text-[#f04f74] bg-black/80 px-2.5 py-1 border border-white/10 uppercase font-semibold">
                    {p.phase}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  {p.title}
                </span>
                <h3 className="font-serif-editorial text-lg text-white font-medium">
                  {p.korTitle}
                </h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed pt-1">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
