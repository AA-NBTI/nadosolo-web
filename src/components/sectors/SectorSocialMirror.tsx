'use client';

import React from 'react';
import Link from 'next/link';

export default function SectorSocialMirror() {
  const CRITERIA = [
    { num: '01', noun: '품격', en: 'DIGNITY', desc: '단정하고 정갈한 테이블 매너와 여유로운 태도가 주는 신뢰감' },
    { num: '02', noun: '미소', en: 'SMILE', desc: '테이블 전체의 긴장을 편안하게 풀어주는 화사하고 따뜻한 표정' },
    { num: '03', noun: '경청', en: 'LISTENING', desc: '말을 끊지 않고 상대방의 이야기에 온전히 귀 기울여주는 존중' },
    { num: '04', noun: '배려', en: 'CARE', desc: '소외되는 사람 없이 대화의 흐름과 테이블의 온도를 살피는 섬세함' },
    { num: '05', noun: '시선', en: 'GAZE', desc: '대화 중 눈을 부드럽게 맞추며 호감과 진정성을 전하는 눈빛' },
  ];

  return (
    <section className="w-full py-24 sm:py-36 bg-[#07080a] border-b border-white/[0.08] text-[#f5f2eb]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20">
        
        {/* 상단 헤더 */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/[0.1] pb-8 mb-16 sm:mb-20 gap-6">
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-[0.3em] text-[#f04f74] uppercase font-semibold block">
              The Social Mirror
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              타인의 시선으로 발견하는 나의 품격
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-md leading-relaxed">
            나도솔로 다면 관찰 엔진은 주관적인 비하나 품평을 원천 배제하고,
            오직 5대 순수 단일 명사 관찰을 통해 나의 고유한 매너와 품격을 100점 표준 점수로 정규화하여 전달합니다.
          </p>
        </div>

        {/* 5대 지표 에디토리얼 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 border-b border-white/[0.08] pb-16">
          {CRITERIA.map((c) => (
            <div key={c.num} className="p-6 border border-white/[0.08] bg-white/[0.015] space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs text-[#f04f74] font-semibold block">{c.num}</span>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">{c.en}</span>
                <h3 className="font-serif-editorial text-2xl text-white font-medium pt-1">{c.noun}</h3>
              </div>
              <p className="text-xs text-zinc-400 font-light leading-relaxed pt-4 border-t border-white/[0.06]">
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 하단 안심 보증 바 */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono tracking-wider">
          <span>ABSOLUTE ANONYMITY • ZERO DISRESPECT POLICY</span>
          <span>RECIPROCAL UNLOCK PROTOCOL</span>
        </div>

      </div>
    </section>
  );
}
