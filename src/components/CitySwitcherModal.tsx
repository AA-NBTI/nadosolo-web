'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Check, Bell } from 'lucide-react';

interface CitySwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CitySwitcherModal({ isOpen, onClose }: CitySwitcherModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const CITIES = [
    {
      code: 'busan',
      nameKr: '부산',
      nameEn: 'Busan',
      status: 'ACTIVE',
      districts: '전포 · 서면, 해운대, 광안리',
      activeText: '매주 금요일 19:30 접수중',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      code: 'seoul',
      nameKr: '서울',
      nameEn: 'Seoul',
      status: 'WAITLIST',
      districts: '성수 · 서울숲, 강남 · 신사, 한남동',
      activeText: '사전 오픈 알림 신청 접수중 (428명 대기)',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      code: 'jeju',
      nameKr: '제주',
      nameEn: 'Jeju',
      status: 'COMING_SOON',
      districts: '애월, 서귀포 중문',
      activeText: '오픈 준비중',
      badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    },
    {
      code: 'tokyo',
      nameKr: '도쿄',
      nameEn: 'Tokyo',
      status: 'COMING_SOON',
      districts: '시부야, 롯폰기, 긴자',
      activeText: '글로벌 라인업 준비중',
      badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    },
  ];

  const handleSelectCity = (code: string) => {
    onClose();
    if (code === 'busan') {
      router.push('/busan');
    } else if (code === 'seoul') {
      router.push('/seoul');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#12151e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
        {/* 상단 닫기 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-lg cursor-pointer"
        >
          ✕
        </button>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold tracking-wider text-rose-400 uppercase">
            REGIONAL HUBS &amp; EXPANSION
          </span>
          <h2 className="text-2xl font-bold text-white">모임 지역 / 도시 선택</h2>
          <p className="text-xs text-zinc-400">
            현재 운영중인 거점과 사전 예약 신청을 받는 도시를 선택하세요.
          </p>
        </div>

        <div className="space-y-3">
          {CITIES.map((c) => {
            const isClickable = c.status === 'ACTIVE' || c.status === 'WAITLIST';
            return (
              <div
                key={c.code}
                onClick={() => isClickable && handleSelectCity(c.code)}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isClickable
                    ? 'bg-[#181c28] border-white/10 hover:border-white/30 cursor-pointer group'
                    : 'bg-[#10131c] border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <h4 className="text-base font-bold text-white group-hover:text-rose-200 transition-colors">
                      {c.nameKr} <span className="text-xs text-zinc-400 font-normal">({c.nameEn})</span>
                    </h4>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${c.badgeColor}`}>
                      {c.status === 'ACTIVE' ? '운영중' : c.status === 'WAITLIST' ? '사전예약' : '준비중'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{c.districts}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-zinc-300 font-medium block">
                    {c.activeText}
                  </span>
                  {isClickable && (
                    <span className="text-xs text-rose-400 font-semibold group-hover:underline">
                      도시 허브 보기 →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-zinc-500 text-center">
          💡 서울 및 타 지역 오픈 시 알림을 등록해 두시면 D-7에 최우선 초대장을 발송해 드립니다.
        </p>
      </div>
    </div>
  );
}

