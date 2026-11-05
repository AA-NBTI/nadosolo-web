'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';

export default function SocialSalonPage() {
  const router = useRouter();
  const { currentUser } = useNadoSoloEngine();

  const handleApplyClick = () => {
    const target = '/dashboard?step=P05_EVENT_APPLY';
    if (!currentUser) {
      router.push(`/auth?next=${encodeURIComponent(target)}`);
    } else {
      router.push(target);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#12151e] pt-14 pb-18 px-6">
        <div className="max-w-[1240px] mx-auto space-y-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>STEP 02 • 취향과 가치관 중심의 프라이빗 사교 살롱</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              피상적인 잡담 대신,<br />
              삶의 결이 맞는 대화를 나눕니다
            </h1>

            <p className="text-base text-zinc-300 leading-relaxed font-normal">
              어색하고 목적이 불분명한 번개 모임 대신, 
              나도솔로 소셜 살롱은 <strong>서로를 배려하는 에티켓과 대화의 결을 갖춘 3045 &amp; 5060 솔로</strong>들이 
              엄선된 비스트로와 라운지에서 취향과 철학을 나누는 품격 있는 사교의 장을 제공합니다.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleApplyClick}
                className="px-8 py-4 rounded-xl bg-[#881337] hover:bg-[#6f102d] text-white text-base font-semibold transition-colors cursor-pointer"
              >
                소셜 살롱 일정 확인 및 신청 →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE CORE PILLARS (소셜 살롱의 3대 가치) */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 space-y-10 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
            WHY SOCIAL SALON
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-white">
            왜 나도솔로의 소셜 살롱은 특별할까요?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#12151e] p-8 rounded-3xl border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300 font-bold">
              01
            </div>
            <h3 className="text-xl font-bold text-white">품격 있는 대화 에티켓</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              독점하지 않고 경청하는 성숙한 화술, 식사 예절과 상대를 존중하는 태도를 중요하게 여깁니다. 서로에게 긍정적인 에너지를 주는 분들이 함께합니다.
            </p>
          </div>

          <div className="bg-[#12151e] p-8 rounded-3xl border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300 font-bold">
              02
            </div>
            <h3 className="text-xl font-bold text-white">라운드별 질문 카드</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              처음 만나는 자리에서도 어색함 없이 자연스럽게 대화가 풀리도록, 아이스브레이킹부터 라이프스타일 가치관까지 단계별 질문 카드를 제공합니다.
            </p>
          </div>

          <div className="bg-[#12151e] p-8 rounded-3xl border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300 font-bold">
              03
            </div>
            <h3 className="text-xl font-bold text-white">서로를 배려하는 매너 피드백</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              모임 종료 후 익명으로 따뜻한 매너 피드백을 주고받아, 내가 타인에게 어떤 인상과 대화의 결을 주었는지 객관적으로 돌아볼 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 3. GENERATION TRACKS */}
      <section className="max-w-[1240px] mx-auto px-6 py-6 w-full">
        <div className="bg-[#12151e] rounded-3xl p-8 sm:p-12 border border-white/10 space-y-8">
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              세대별 라이프스타일에 맞춘 살롱 트랙
            </h3>
            <p className="text-sm text-zinc-400 mt-2">
              공감대와 가치관이 맞는 동시대 사람들과 가장 편안하게 교류할 수 있도록 세대별 맞춤 트랙으로 운영됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 p-6 rounded-2xl bg-[#181c28] border border-rose-500/20">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300">
                3045 PRIME TRACK
              </span>
              <h4 className="text-xl font-bold text-white">30~45세 커리어 &amp; 라이프스타일</h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                사회생활과 커리어가 안정된 직장인·전문직·사업가를 위한 사교 살롱. 미식, 와인, 여행, 재테크 등 폭넓은 취향을 나누며 단단한 인연을 만듭니다.
              </p>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-[#181c28] border border-white/10">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
                5060 GOLDEN TRACK
              </span>
              <h4 className="text-xl font-bold text-white">50~60대 골든 솔로 살롱</h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                인생 후반전, 삶의 깊이와 여유를 공유할 진솔한 벗과 동반자를 만나는 안심 프라이빗 모임. 클래식한 음악과 품격 있는 분위기 속에서 교류합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

