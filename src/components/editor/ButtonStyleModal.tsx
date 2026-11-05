'use client';

import React, { useState } from 'react';
import { X, Check, Paintbrush, Sparkles } from 'lucide-react';
import {
  ButtonStyleConfig,
  ButtonThemePreset,
  ButtonRoundness,
  ButtonSize,
  resolveButtonClasses,
  useSiteConfig,
} from '@/engine/siteConfigEngine';

interface ButtonStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (newStyle: ButtonStyleConfig) => void;
}

const THEME_PRESETS: {
  key: ButtonThemePreset;
  label: string;
  desc: string;
  badgeBg: string;
}[] = [
  {
    key: 'glass-rose',
    label: '은은한 글래스 + 로즈 텍스트 (기본)',
    desc: '은은한 다크 글래스 바탕에 선명한 로즈 텍스트 (화면과 완벽한 조화)',
    badgeBg: 'bg-zinc-800 text-rose-400 border border-white/15',
  },
  {
    key: 'solid-wine',
    label: '솔리드 루비 레드와인',
    desc: '강렬하고 확실한 루비 레드 배경에 화이트 텍스트 (시선 집중)',
    badgeBg: 'bg-rose-600 text-white border border-rose-500',
  },
  {
    key: 'pure-white',
    label: '퓨어 화이트 & 블랙 텍스트',
    desc: '대비감이 뛰어나고 깔끔한 모던 화이트 스타일',
    badgeBg: 'bg-white text-zinc-950 border border-zinc-200',
  },
  {
    key: 'dark-outline',
    label: '차콜 다크 아웃라인',
    desc: '차분한 다크 배경에 절제된 화이트 테두리',
    badgeBg: 'bg-zinc-900 text-white border border-white/20',
  },
  {
    key: 'gold-amber',
    label: '럭셔리 앰버 골드',
    desc: 'VIP 및 프리미엄 무드를 강조하는 앰버 골드 톤',
    badgeBg: 'bg-amber-950 text-amber-300 border border-amber-500/40',
  },
];

const ROUNDNESS_OPTIONS: { key: ButtonRoundness; label: string }[] = [
  { key: 'md', label: '단정한 사각형 (rounded-lg)' },
  { key: 'xl', label: '부드러운 모서리 (rounded-xl)' },
  { key: 'full', label: '완전 캡슐형 (rounded-full)' },
];

const SIZE_OPTIONS: { key: ButtonSize; label: string }[] = [
  { key: 'sm', label: '콤팩트 (작게)' },
  { key: 'base', label: '보통 (Standard)' },
  { key: 'lg', label: '크게 (권장)' },
  { key: 'xl', label: '특대 (Hero형)' },
];

export default function ButtonStyleModal({
  isOpen,
  onClose,
  onApply,
}: ButtonStyleModalProps) {
  const { config, updateButtonStyle } = useSiteConfig();
  const currentStyle = config.buttonStyle || {
    theme: 'glass-rose',
    roundness: 'xl',
    fontSize: 'lg',
  };

  const [draftStyle, setDraftStyle] = useState<ButtonStyleConfig>(currentStyle);

  if (!isOpen) return null;

  const handleSave = () => {
    updateButtonStyle(draftStyle);
    if (onApply) {
      onApply(draftStyle);
    }
    onClose();
  };

  const previewClasses = resolveButtonClasses(draftStyle, 'px-8 py-3.5');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0f1118] border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Paintbrush className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                버튼 디자인 &amp; 색상 커스터마이저
              </h3>
              <p className="text-[11px] text-zinc-400">
                신청하기 등 사이트 전체 액션 버튼의 색상과 모양을 실시간 변경합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. 실시간 미리보기 박스 */}
        <div className="p-6 rounded-2xl bg-black/60 border border-white/10 text-center space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
            LIVE BUTTON PREVIEW (실시간 미리보기)
          </span>
          <div className="flex items-center justify-center pt-1 pb-1">
            <button type="button" className={previewClasses}>
              <span>신청하기</span>
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            * 마우스를 올리거나 클릭했을 때의 전환 효과를 직접 테스트해보세요.
          </p>
        </div>

        {/* 2. 컬러 테마 프리셋 선택 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>버튼 컬러 &amp; 테마 선택</span>
          </label>
          <div className="space-y-1.5">
            {THEME_PRESETS.map((t) => {
              const isSelected = draftStyle.theme === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setDraftStyle({ ...draftStyle, theme: t.key })}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.08] border-rose-500 shadow-md ring-1 ring-rose-500/50'
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-zinc-400">{t.desc}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ml-2 ${t.badgeBg}`}>
                    샘플
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 모서리 둥글기 (Roundness) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300">모서리 곡률 (모양)</label>
          <div className="grid grid-cols-3 gap-2">
            {ROUNDNESS_OPTIONS.map((r) => {
              const isSelected = draftStyle.roundness === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setDraftStyle({ ...draftStyle, roundness: r.key })}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. 폰트 크기 (Size) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300">폰트 크기</label>
          <div className="grid grid-cols-4 gap-2">
            {SIZE_OPTIONS.map((s) => {
              const isSelected = draftStyle.fontSize === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setDraftStyle({ ...draftStyle, fontSize: s.key })}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 저장 버튼 */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
          >
            <Check className="w-4 h-4" />
            <span>버튼 스타일 전체 적용</span>
          </button>
        </div>

      </div>
    </div>
  );
}

