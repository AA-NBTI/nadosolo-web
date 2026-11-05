'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users2, CheckCircle2, UserCheck, Sparkles, HeartHandshake } from 'lucide-react';

const CLUB_EXPERIENCE_STEPS = [
  {
    step: '01',
    title: '성향 프로필 신청',
    desc: '관심 있는 취향 클럽을 선택하고 나도솔로 성향 프로필을 기반으로 멤버십 신청서를 제출합니다.',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
    icon: UserCheck,
  },
  {
    step: '02',
    title: '멤버 밸런스 큐레이션',
    desc: '단순 선착순이 아닌, 직업군·연령대·소통 매너가 조화를 이루는 소수 정예 그룹으로 편성됩니다.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    icon: Users2,
  },
  {
    step: '03',
    title: '정기 오프라인 세션',
    desc: '제휴된 감성 공간에서 호스트와 함께 격주로 정기 모임을 진행하며 깊이 있는 취향을 함께 경험합니다.',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    icon: Sparkles,
  },
  {
    step: '04',
    title: '프라이빗 네트워크',
    desc: '세션 종료 후에도 검증된 멤버들과 함께 안전하고 신뢰할 수 있는 소셜 인맥을 유지합니다.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    icon: HeartHandshake,
  },
];

const CLUBS = [
  {
    id: 'CLUB_WINE',
    badge: '다이닝 & 와인',
    title: '와인 & 위스키 테이스팅 클럽',
    subtitle: '프라이빗 보틀 쉐어링 & 테이스팅',
    desc: '서면·전포의 숨겨진 와인바에서 소믈리에와 함께 내추럴 와인 및 싱글몰트 위스키를 음미하며 취향을 나눕니다.',
    tags: ['#와인페어링', '#위스키', '#미식토크'],
    frequency: '격주 금요일 저녁',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'CLUB_ART',
    badge: '문화 & 전시',
    title: '주말 미술관 & 전시 도슨트 투어',
    subtitle: '부산시립미술관 · F1963 투어',
    desc: '혼자 가기 아쉬웠던 주말 전시를 감각 있는 사람들과 도슨트 해설을 들으며 관람하고 인근 카페에서 영감을 나눕니다.',
    tags: ['#전시투어', '#현대미술', '#도슨트'],
    frequency: '매월 토요일 오후',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'CLUB_RUN',
    badge: '웰니스',
    title: '모닝 선셋 러닝 & 커피 클럽',
    subtitle: '광안리 해변로 5K & 브런치',
    desc: '부담 없는 페이스로 아침 바닷바람을 맞으며 가볍게 달리고, 러닝 후 브런치와 스페셜티 커피로 주말을 상쾌하게 시작합니다.',
    tags: ['#러닝클럽', '#웰니스', '#광안리'],
    frequency: '매주 일요일 오전',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'CLUB_BOOK',
    badge: '인사이트',
    title: '비즈니스 & 라이프 인사이트 살롱',
    subtitle: '커리어, 창업, 라이프스타일 독서',
    desc: '한 달에 한 권, 삶의 태도와 비즈니스 인사이트를 다룬 책을 읽고 각자의 경험과 고민을 깊이 있게 교류합니다.',
    tags: ['#인사이트독서', '#커리어', '#스타트업'],
    frequency: '월 1회 평일 저녁',
    image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
  },
];

export default function ClubPage() {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [alertSubmitted, setAlertSubmitted] = useState<boolean>(false);

  const handleApplyAlert = (clubId: string) => {
    setSelectedClub(clubId);
    setAlertSubmitted(true);
    setTimeout(() => {
      setAlertSubmitted(false);
      setSelectedClub(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans pb-20">
      
      {/* ==============================================================
          1. HERO SECTION (모노크롬 & 와인레드)
          ============================================================== */}
      <section className="relative overflow-hidden bg-[#090a0f] pt-16 pb-20 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>소셜 클럽 • 취향 &amp; 라이프스타일 멤버십</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              혼자여도 충분하고,<br />
              함께여서 더 특별한 소셜 클럽
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal max-w-xl">
              연애나 결혼이 목적이 아니어도 좋습니다. 일상을 풍요롭게 채워줄 취향 중심의 소모임.
              나도솔로의 신뢰 인증을 거친 멤버들과 함께 안전하고 품격 있는 여가를 즐겨보세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-500">멤버십 형태</span>
                <p className="text-sm font-bold text-white">소수정예 6~8인</p>
                <p className="text-[10px] text-zinc-500">격주/월 1회 정기 세션</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-500">참여 혜택</span>
                <p className="text-sm font-bold text-white">우선 예약권</p>
                <p className="text-[10px] text-zinc-500">제휴 베뉴 혜택</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-500">신뢰 검증</span>
                <p className="text-sm font-bold text-white">에티켓 룰</p>
                <p className="text-[10px] text-zinc-500">신원 및 비매너 원아웃제</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=80"
                alt="소셜 클럽 무드"
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-600 text-white">
                  Social Club
                </span>
                <p className="text-sm font-bold text-white mt-1">취향이 통하는 지속 가능한 친구</p>
                <p className="text-xs text-zinc-300">와인, 전시, 러닝, 독서로 채우는 일상의 낭만</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          2. 클럽 프로세스 4단계
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 w-full border-b border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Membership Flow</p>
          <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white">
            소셜 클럽 멤버십 4단계 여정
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            신뢰할 수 있는 소수정예 멤버들과 함께 지속적인 유대감을 쌓아갑니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CLUB_EXPERIENCE_STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-white/20 transition-all group"
              >
                <div className="relative h-36 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-serif-editorial font-bold text-[11px]">
                      STEP {s.step}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-4 h-4 text-rose-500" />
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed flex-1">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==============================================================
          3. 클럽 라인업 카드 그리드
          ============================================================== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 space-y-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
              Curated Clubs
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              클럽 라인업
            </h2>
          </div>
        </div>

        {alertSubmitted && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-500" />
            <span>신청이 접수되었습니다. 개설 시 안내 문자를 발송해 드립니다.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CLUBS.map((club) => (
            <div
              key={club.id}
              className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                <img
                  src={club.image}
                  alt={club.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-zinc-200 border border-white/10 backdrop-blur-md">
                    {club.badge}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">{club.title}</h3>
                  <p className="text-xs text-zinc-300 font-medium">{club.subtitle}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{club.desc}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {club.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">일정: <strong className="text-white">{club.frequency}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleApplyAlert(club.id)}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    신청하기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
