'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users2, Wine, Palette, Flame, BookOpen, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, HeartHandshake, UserCheck } from 'lucide-react';

const CLUB_EXPERIENCE_STEPS = [
  {
    step: '01',
    title: '관심사 및 성향 프로필 신청',
    desc: '관심 있는 취향 클럽을 선택하고 나도솔로 성향 프로필을 기반으로 멤버십 신청서를 제출합니다.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    icon: UserCheck,
  },
  {
    step: '02',
    title: '클럽 멤버 밸런스 큐레이션',
    desc: '단순 선착순이 아닌, 직업군·연령대·소통 매너가 조화를 이루는 소수 정예(6~8인) 그룹으로 편성됩니다.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80',
    icon: Users2,
  },
  {
    step: '03',
    title: '월 2회 정기 오프라인 세션',
    desc: '제휴된 감성 공간에서 호스트와 함께 격주로 정기 모임을 진행하며 깊이 있는 취향을 함께 경험합니다.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    icon: Sparkles,
  },
  {
    step: '04',
    title: '지속 가능한 프라이빗 네트워크',
    desc: '세션 종료 후에도 검증된 멤버들과 함께 안전하고 신뢰할 수 있는 소셜 라이프스타일 인맥을 형성합니다.',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    icon: HeartHandshake,
  },
];

const CLUBS = [
  {
    id: 'CLUB_WINE',
    badge: 'POPULAR',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    title: '와인 & 위스키 테이스팅 클럽',
    subtitle: '프라이빗 보틀 쉐어링 & 테이스팅 노트',
    desc: '서면·전포의 숨겨진 와인바에서 소믈리에와 함께 내추럴 와인 및 싱글몰트 위스키를 음미하며 취향을 나눕니다.',
    tags: ['#와인페어링', '#위스키', '#미식토크', '#금요일밤'],
    frequency: '격주 금요일 20:00',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'CLUB_ART',
    badge: 'CULTURE',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    title: '주말 미술관 & 전시 도슨트 투어',
    subtitle: '부산시립미술관 · F1963 · 갤러리 투어',
    desc: '혼자 가기 아쉬웠던 주말 전시를 감각 있는 사람들과 도슨트 해설을 들으며 관람하고 인근 카페에서 영감을 나눕니다.',
    tags: ['#전시투어', '#현대미술', '#도슨트', '#주말오후'],
    frequency: '매월 둘째·넷째 토요일 14:00',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'CLUB_RUN',
    badge: 'WELLNESS',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: '모닝 선셋 러닝 & 커피 클럽',
    subtitle: '광안리 해변로 5K & 스페셜티 브런치',
    desc: '부담 없는 페이스로 아침 바닷바람을 맞으며 가볍게 달리고, 러닝 후 브런치와 스페셜티 커피로 주말을 상쾌하게 시작합니다.',
    tags: ['#러닝클럽', '#웰니스', '#광안리', '#일요일아침'],
    frequency: '매주 일요일 08:30',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'CLUB_BOOK',
    badge: 'INSIGHT',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: '비즈니스 & 라이프 인사이트 살롱',
    subtitle: '커리어, 창업, 라이프스타일 독서 토론',
    desc: '한 달에 한 권, 삶의 태도와 비즈니스 인사이트를 다룬 책을 읽고 각자의 경험과 고민을 깊이 있게 교류합니다.',
    tags: ['#인사이트독서', '#커리어', '#스타트업', '#평일저녁'],
    frequency: '월 1회 수요일 19:30',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
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
          1. HERO SECTION
          ============================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#111422] via-[#0d0e14] to-[#090a0f] pt-16 pb-20 px-4 sm:px-6 border-b border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[350px] bg-indigo-950/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>STEP 03 • 싱글 취향 & 라이프스타일 멤버십 커뮤니티</span>
            </div>

            <h1 className="font-serif-editorial text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              혼자여도 충분하고,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-rose-300 to-amber-200">
                함께여서 더 특별한 소셜 클럽
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal max-w-xl">
              연애나 결혼이 목적이 아니어도 좋습니다. 일상을 풍요롭게 채워줄 취향 중심의 소모임.
              나도솔로의 신뢰 인증을 거친 멤버들과 함께 안전하고 품격 있는 여가를 즐겨보세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-400">멤버십 형태</span>
                <p className="text-sm font-bold text-white">소수정예 6~8인</p>
                <p className="text-[10px] text-zinc-500">격주/월 1회 정기 세션</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-400">참여 혜택</span>
                <p className="text-sm font-bold text-indigo-300">우선 예약 & 웰컴 패키지</p>
                <p className="text-[10px] text-zinc-500">제휴 베뉴 할인 혜택</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-[11px] text-zinc-400">신뢰 검증</span>
                <p className="text-sm font-bold text-white">클린 에티켓 룰</p>
                <p className="text-[10px] text-zinc-500">신원 및 비매너 원아웃제</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80"
                alt="소셜 클럽 무드"
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-600/90 text-white">
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
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 w-full border-b border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <p className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">Membership Flow</p>
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
                className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-indigo-500/30 transition-all group"
              >
                <div className="relative h-36 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-serif-editorial font-bold text-[11px]">
                      STEP {s.step}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-4 h-4 text-indigo-400" />
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
            <span className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
              Curated Clubs
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              부산 공식 오픈 클럽 라인업
            </h2>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            사전 알림 예약 접수중
          </span>
        </div>

        {alertSubmitted && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>클럽 사전 알림 신청이 완료되었습니다! 첫 회차 개설 시 우선 초대 문자를 발송해 드립니다.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CLUBS.map((club) => (
            <div
              key={club.id}
              className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all flex flex-col justify-between"
            >
              <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                <img
                  src={club.image}
                  alt={club.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${club.badgeColor}`}>
                    {club.badge}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">{club.title}</h3>
                  <p className="text-xs text-indigo-300 font-medium">{club.subtitle}</p>
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
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-indigo-600 hover:text-white text-xs font-semibold text-zinc-200 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>사전 알림 신청</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
