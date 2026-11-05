'use client';

import React, { useState } from 'react';
import { Paintbrush } from 'lucide-react';
import {
  useVisualEditor,
  useSiteConfig,
  resolveButtonClasses,
  ButtonStyleConfig,
} from '@/engine/siteConfigEngine';
import ButtonStyleModal from '../editor/ButtonStyleModal';

export interface AdaptiveButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  overrideStyle?: Partial<ButtonStyleConfig>;
  disabled?: boolean;
}

export default function AdaptiveButton({
  onClick,
  children,
  className = '',
  type = 'button',
  overrideStyle,
  disabled = false,
}: AdaptiveButtonProps) {
  const { isEditMode } = useVisualEditor();
  const { config } = useSiteConfig();
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

  const activeStyle: ButtonStyleConfig = {
    ...(config.buttonStyle || {
      theme: 'glass-rose',
      roundness: 'xl',
      fontSize: 'lg',
    }),
    ...(overrideStyle || {}),
  };

  const buttonClasses = resolveButtonClasses(activeStyle, className);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isEditMode) {
      // [편집 모드 핵심]: 결제창 및 링크 이동 완전 차단
      e.preventDefault();
      e.stopPropagation();
      setIsStyleModalOpen(true);
      return;
    }

    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <>
      <button
        type={isEditMode ? 'button' : type}
        onClick={handleClick}
        disabled={disabled}
        className={`relative group/btn cursor-pointer ${buttonClasses} ${
          isEditMode ? 'ring-2 ring-rose-500/60 ring-offset-2 ring-offset-[#090a0f]' : ''
        }`}
        title={isEditMode ? '클릭하여 버튼 색상 및 스타일 변경 (결제창 오픈 차단됨)' : undefined}
      >
        {children}

        {/* 편집 모드 시 우상단 붓 아이콘 배지 */}
        {isEditMode && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setIsStyleModalOpen(true);
            }}
            className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border border-white/20 transition-transform hover:scale-110 cursor-pointer z-20"
            title="버튼 색상 및 디자인 팔레트 열기"
          >
            <Paintbrush className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* 버튼 스타일 커스터마이저 모달 */}
      <ButtonStyleModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
      />
    </>
  );
}

