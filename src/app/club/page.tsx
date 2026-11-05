'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ClubPage() {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [alertSubmitted, setAlertSubmitted] = useState<boolean>(false);

  const clubs = [
    {
      id: 'CLUB_WINE',
      badge: 'POPULAR',
      title: '와인 &amp; 위스키 테이스팅 살롱',
      subtitle: '프라이빗 보틀 쉐어링 &amp; 테이스팅 노트',
      desc: '서면·전포의 숨겨진 와인바에서 소믈리에와 함께 내추럴 와인 및 싱글몰트 위스키를 음미하며 취향을 나눕니다.',
      tags: ['#와인', '#위스키', '#미식', '#금요일밤'],
      frequency: '격주 금요일 20:00',
    },
    {
      id: 'CLUB_ART',
      badge: 'CULTURE',
      title: '주말 미술관 &amp; 전시 도슨트 투어',
      subtitle: '부산시립미술관 · F1963 · 갤러리 투어',
      desc: '혼자 가기 아쉬웠던 주말 전시를 감각 있는 사람들과 도슨트 해설을 들으며 관람하고, 인근 카페에서 영감을 나눕니다.',
      tags: ['#전시', '#현대미술', '#도슨트', '#주말오후'],
      frequency: '매월 둘째·넷째 토요일 14:00',
    },
    {
      id: 'CLUB_RUN',
      badge: 'WELLNESS',
      title: '모닝 선셋 러닝 &amp; 커피 클럽',
      subtitle: '광안리 해변로 5K &amp; 스페셜티 브런치',
      desc: '부담 없는 페이스로 아침 바닷바람을 맞으며 가볍게 달리고, 러닝 후 브런치와 스페셜티 커피로 주말을 상쾌하게 시작합니다.',
      tags: ['#러닝', '#웰니스', '#스페셜티커피', '#일요일아침'],
      frequency: '매주 일요일 08:30',
    },
    {
      id: 'CLUB_BOOK',
      badge: 'INSIGHT',
      title: '비즈니스 &amp; 라이프 인사이트 살롱',
      subtitle: '커리어, 창업, 라이프스타일 독서 토론',
      desc: '한 달에 한 권, 삶의 태도와 비즈니스 인사이트를 다룬 책을 읽고 각자의 경험과 고민을 깊이 있게 교류합니다.',
      tags: ['#독서', '#커리어', '#인사이트', '#퇴근후'],
      frequency: '월 1회 수요일 19:30',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#12151e] pt-14 pb-18 px-6">
        <div className="max-w-[1240px] mx-auto space-y-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>STEP 03 • 싱글 취향 &amp; 라이프스타일 커뮤니티</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              혼자여도 충분하고,<br />
              함께여서 더 특별한 취향 클럽
            </h1>

            <p className="text-base text-zinc-300 leading-relaxed font-normal">
              연애나 결혼이 목적이 아니어도 좋습니다. 혼자 사는 삶을 더욱 다채롭고 풍요롭게 채워줄 취향 중심의 소모임.
              나도솔로의 신뢰 인증을 통과한 멤버들과 함께 안전하고 품격 있는 여가를 즐겨보세요.
            </p>
          </div>
        </div>
      </section>

      {/* 2. CLUB LINEUP */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 space-y-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
              CURATED CLUBS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              부산 공식 오픈 예정 클럽 라인업
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              관심 있는 클럽의 사전 알림을 등록하시면 첫 회차 우선 참여권을 제공합니다.
            </p>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            사전 알림 예약 진행중
          </span>
        </div>

        {alertSubmitted && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm font-medium">
            ✓ 클럽 사전 알림 신청이 완료되었습니다! 첫 모임 일정이 확정되는 즉시 우선 초대장을 보내드립니다.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubs.map((c) => (
            <div
              key={c.id}
              className="bg-[#12151e] rounded-3xl p-7 sm:p-8 border border-white/10 space-y-5 hover:border-white/20 transition-all flex flex-col justify-between shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-zinc-300 border border-white/10">
                    {c.badge}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {c.frequency}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-2xl font-bold text-white" dangerouslySetInnerHTML={{ __html: c.title }} />
                  <p className="text-xs text-rose-300 font-medium" dangerouslySetInnerHTML={{ __html: c.subtitle }} />
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed">
                  {c.desc}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {c.tags.map((t) => (
                    <span key={t} className="text-xs text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-white/10 flex items-center justify-between gap-4">
                <span className="text-xs text-zinc-400">정원: 8~12인 프라이빗</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClub(c.id);
                    setAlertSubmitted(true);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition-all cursor-pointer shadow-md"
                >
                  사전 알림 받기
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

