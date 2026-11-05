'use client';

import React from 'react';
import { Ticket, MessageSquare, Utensils, HeartHandshake, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: '입장 & 프라이빗 좌석 안내',
    subtitle: 'Seat Assignment',
    desc: '모임 당일 정오, 비밀 장소와 지정된 테이블 좌석 번호가 안내됩니다. 어색한 자리 선점 없이 매칭 알고리즘이 추천한 최적의 자리에 편안히 착석합니다.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    icon: Ticket,
    tag: 'D-Day 12:00',
  },
  {
    step: '02',
    title: '아이스브레이킹 대화 카드',
    subtitle: 'Icebreaker Playbook',
    desc: '단순한 호구조사가 아닌, 라이프스타일·가치관·취향을 자연스럽게 열어주는 나도솔로 전용 플레이북 카드가 테이블 위에 준비됩니다.',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80',
    icon: MessageSquare,
    tag: '초반 30분',
  },
  {
    step: '03',
    title: '셰프 코스 요리 & 와인 페어링',
    subtitle: 'Dining & Wine',
    desc: '엄선된 제휴 레스토랑의 코스 요리와 웰컴 와인을 함께 즐기며, 2시간 동안 서로의 결을 느끼는 몰입감 있는 미식 대화가 이어집니다.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    icon: Utensils,
    tag: '본 모임 (2시간)',
  },
  {
    step: '04',
    title: '익일 아침 시크릿 매너 평가',
    subtitle: 'Secret Feedback',
    desc: '모임 다음 날 오전 9시, 대시보드에서 비공개로 매너 평가와 호감 투표를 진행합니다. 상호 호감 시 1:1 연락처가 안전하게 교환됩니다.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    icon: HeartHandshake,
    tag: 'D+1 09:00',
  },
];

export default function SectorJourney() {
  return (
    <section className="w-full py-16 sm:py-24 bg-[#0d0e14] border-b border-white/5">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* 섹션 타이틀 */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <p className="text-xs font-semibold tracking-widest text-rose-400 uppercase">
            The Journey
          </p>
          <h2 className="text-2xl sm:text-4xl font-serif-editorial font-bold text-white">
            어색함 없는 4단계 모임 여정
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            입장부터 다음 날 아침 시크릿 투표까지, 부담 없이 자연스럽게 녹아드는 나도솔로만의 세심한 프로세스를 경험하세요.
          </p>
        </div>

        {/* 4단계 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="group relative flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 hover:border-rose-500/40 overflow-hidden transition-all duration-300"
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
                  
                  {/* 스텝 번호 뱃지 */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white font-serif-editorial font-bold text-xs tracking-wider shadow">
                      STEP {s.step}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded-full bg-black/50 text-[10px] text-zinc-300 border border-white/10 backdrop-blur-md">
                      {s.tag}
                    </span>
                  </div>
                </div>

                {/* 본문 설명 */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-rose-400" />
                    <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
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

        {/* 안심 보증 띠배너 */}
        <div className="mt-12 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-300">
              <strong className="text-white">클린 커뮤니티 케어:</strong> 모임 후 비매너 평점이 누적된 참가자는 향후 모든 모임에서 영구 제명됩니다.
            </p>
          </div>
          <span className="text-[11px] text-zinc-500 shrink-0">안심 에티켓 규정 준수</span>
        </div>

      </div>
    </section>
  );
}
