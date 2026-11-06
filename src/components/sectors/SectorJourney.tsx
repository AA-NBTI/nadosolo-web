'use client';

import React from 'react';
import { Ticket, MessageSquare, Utensils, HeartHandshake, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: '입장 & 좌석 안내',
    subtitle: 'Seat Assignment',
    desc: '모임 당일, 사전 매칭 알고리즘이 배정한 최적의 자리에 어색함 없이 편안하게 착석합니다.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    icon: Ticket,
  },
  {
    step: '02',
    title: '대화 카드 플레이북',
    subtitle: 'Icebreaker Playbook',
    desc: '라이프스타일과 취향을 자연스럽게 열어주는 전용 질문 카드로 어색한 침묵을 깹니다.',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
    icon: MessageSquare,
  },
  {
    step: '03',
    title: '코스 요리 & 와인',
    subtitle: 'Dining & Wine',
    desc: '엄선된 공간의 코스 요리와 와인을 즐기며 2시간 동안 서로의 결을 느끼는 대화가 이어집니다.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    icon: Utensils,
  },
  {
    step: '04',
    title: '익일 시크릿 매너 평가',
    subtitle: 'Secret Feedback',
    desc: '모임 다음 날 오전, 비공개로 매너 평가와 호감 투표를 진행하며 상호 호감 시 연락처가 교환됩니다.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    icon: HeartHandshake,
  },
];

export default function SectorJourney() {
  return (
    <section className="w-full py-16 sm:py-24 bg-[#090a0f] border-b border-white/10">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* 섹션 타이틀 */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            The Journey
          </p>
          <h2 className="text-2xl sm:text-4xl font-serif-editorial font-bold text-white">
            4단계 모임 여정
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            입장부터 다음 날 아침 시크릿 투표까지, 부담 없이 자연스럽게 이어지는 안심 프로세스입니다.
          </p>
        </div>

        {/* 4단계 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="group relative flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 overflow-hidden transition-all duration-300"
              >
                {/* 상단 이미지 */}
                <div className="relative h-40 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/40" />
                  
                  {/* 스텝 번호 뱃지 (다크 그레이 배경) */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800/95 text-zinc-200 border border-zinc-700/60 font-serif-editorial font-bold text-xs tracking-wider backdrop-blur-md">
                      STEP {s.step}
                    </span>
                  </div>
                </div>

                {/* 본문 설명 */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4 text-rose-500" />
                    <h3 className="text-base font-bold text-white">
                      {s.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-serif-editorial mb-3">
                    {s.subtitle}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 안심 보증 띠배너 & 상세 이용가이드 링크 */}
        <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#f04f74] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-300">
              <strong className="text-white">120분 룰 기반 소셜 다이닝:</strong> 나도솔로는 사적 주선이 아닌 체계적인 타임라인과 대화 키트 기반의 오프라인 프로그램입니다.
            </p>
          </div>
          <a
            href="/guide"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all shrink-0 inline-flex items-center gap-1.5"
          >
            <span>상세 이용가이드</span>
            <span>→</span>
          </a>
        </div>

      </div>
    </section>
  );
}
