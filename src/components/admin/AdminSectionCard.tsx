'use client';

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AdminSectionCardProps {
  id?: string;
  title: string;
  categoryTag?: string;
  desc?: string;
  badge?: string | number;
  isOpen: boolean;
  onToggle: () => void;
  isLight: boolean;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export default function AdminSectionCard({
  title,
  categoryTag,
  desc,
  badge,
  isOpen,
  onToggle,
  isLight,
  children,
  headerAction,
}: AdminSectionCardProps) {
  return (
    <div
      className={`border transition-all duration-150 ${
        isLight
          ? 'bg-white border-zinc-200 shadow-sm'
          : 'bg-[#0c0d12] border-white/[0.08]'
      }`}
    >
      {/* 아코디언 헤더 바 (클릭 시 접힘/펼침) */}
      <div
        onClick={onToggle}
        className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors border-b ${
          isLight
            ? isOpen
              ? 'bg-zinc-50 border-zinc-200'
              : 'bg-white border-transparent hover:bg-zinc-50'
            : isOpen
            ? 'bg-white/[0.02] border-white/10'
            : 'bg-transparent border-transparent hover:bg-white/[0.02]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="space-y-0.5 min-w-0">
            {categoryTag && (
              <span className="text-sm font-mono tracking-wider uppercase text-zinc-300 font-semibold block">
                {categoryTag}
              </span>
            )}
            <div className="flex items-center gap-2">
              <h3
                className={`font-serif-editorial text-lg sm:text-xl font-normal truncate ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
                {title}
              </h3>
              {badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-sm font-mono border font-semibold ${
                    isLight
                      ? 'bg-zinc-100 border-zinc-300 text-zinc-700'
                      : 'bg-white/10 border-white/20 text-white'
                  }`}
                >
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          {headerAction && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:block"
            >
              {headerAction}
            </div>
          )}
          <span
            className={`p-1.5 border transition-colors ${
              isLight
                ? 'border-zinc-200 text-zinc-600 bg-white'
                : 'border-white/10 text-zinc-400 bg-white/5'
            }`}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        </div>
      </div>

      {/* 펼쳐진 본문 영역 (설명문은 클릭하여 펼쳤을 때만 상단 노출) */}
      {isOpen && (
        <div className={`p-5 sm:p-6 space-y-4 ${isLight ? 'text-zinc-900' : 'text-[#f5f2eb]'}`}>
          {desc && (
            <div className="pl-3.5 border-l-2 border-white/20 mb-3">
              <p
                className={`text-sm font-light leading-relaxed ${
                  isLight ? 'text-zinc-600' : 'text-zinc-300'
                }`}
              >
                {desc}
              </p>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

