'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';

export default function DatingPage() {
  const router = useRouter();
  const { currentUser } = useNadoSoloEngine();

  const handleApplyClick = () => {
    const target = '/dashboard?step=P02_CRITERIA';
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
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">홈</Link>
            <span>/</span>
            <span className="text-white font-medium">소셜 데이팅</span>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>STEP 02 • 신뢰 기반 자연스러운 인연</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              가벼운 스와이프 대신,<br />
              매너가 검증된 인연을 만납니다
            </h1>

            <p className="text-base text-zinc-300 leading-relaxed font-normal">
              데이팅 앱의 가벼움과 불신, 결혼정보회사의 부담스러운 수백만 원 가입비와 노골적인 조건 평가에 지치셨나요?
              나도솔로 소셜 데이팅은 <strong>5대 매너 평가 매트릭스로 검증된 3045 &amp; 5060 싱글</strong>들이 
              자연스러운 분위기 속에서 서로의 결을 알아가는 품격 있는 만남을 제공합니다.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleApplyClick}
                className="px-8 py-4 rounded-xl bg-[#881337] hover:bg-[#6f102d] text-white text-base font-semibold shadow-xl shadow-[#881337]/30 transition-all cursor-pointer"
              >
                소셜 데이팅 프로파일 등록하기 →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE CORE PILLARS (기존 데이팅과의 차별점) */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 space-y-10 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
            WHY SOCIAL DATING
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-white">
            왜 나도솔로의 만남은 안전하고 특별할까요?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#12151e] p-8 rounded-3xl border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300 font-bold">
              01
            </div>
            <h3 className="text-xl font-bold text-white">직업보다 매너와 인격</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              연봉이나 자동차 같은 과시형 스펙으로 줄 세우지 않습니다. 대화의 결, 테이블 에티켓, 배려심을 갖춘 정상적인 사회인만이 지속적으로 활동할 수 있습니다.
            </p>
          </div>

          <div className="bg-[#12151e] p-8 rounded-3xl border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300 font-bold">
              02
            </div>
            <h3 className="text-xl font-bold text-white">상호 피드백 평판 시스템</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              만남 후 상대방에게 익명 매너 뱃지를 부여합니다. 비매너 행위자나 목적이 불순한 회원은 시스템 매트릭스에 의해 즉각 영구 제명됩니다.
            </p>
          </div>

          <div className="bg-[#12151e] p-8 rounded-3xl border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300 font-bold">
              03
            </div>
            <h3 className="text-xl font-bold text-white">시크릿 호감 투표 (Mutual Match)</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              모임이 끝난 후 밤 10시, 부담 없이 호감 상대를 비밀 투표합니다. 오직 서로를 선택한 쌍방 매칭 시에만 비공개 연락처가 교환됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* 3. GENERATION TRACKS IN DATING */}
      <section className="max-w-[1240px] mx-auto px-6 py-6 w-full">
        <div className="bg-[#12151e] rounded-3xl p-8 sm:p-12 border border-white/10 space-y-8">
          <div className="border-b border-white/10 pb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              나도솔로 데이팅의 2대 세대 트랙
            </h3>
            <p className="text-sm text-zinc-400 mt-2">
              서로 다른 라이프스타일과 가치관을 존중하며 완벽히 분리된 트랙으로 운영됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 p-6 rounded-2xl bg-[#181c28] border border-rose-500/20">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300">
                3045 PRIME TRACK
              </span>
              <h4 className="text-xl font-bold text-white">30~45세 커리어 싱글</h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                사회생활과 커리어가 안정된 직장인·사업가를 위한 매칭. 가벼운 연애가 아닌, 미래를 함께 그릴 수 있는 성숙하고 따뜻한 인연을 추구합니다.
              </p>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-[#181c28] border border-white/10">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
                5060 GOLDEN TRACK
              </span>
              <h4 className="text-xl font-bold text-white">50~60대 골든 솔로</h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                비혼, 돌싱, 사별 후 인생 후반전을 함께 걸어갈 진솔한 동반자를 찾는 액티브 시니어. 검증된 신원과 품격 있는 살롱에서 안심하고 교류합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

