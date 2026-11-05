'use client';

import React from 'react';
import {
  useSiteConfig,
  resolveButtonClasses,
  ButtonStyleConfig,
} from '@/engine/siteConfigEngine';

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
  const { config } = useSiteConfig();

  const activeStyle: ButtonStyleConfig = {
    ...(config.buttonStyle || {
      theme: 'glass-rose',
      roundness: 'xl',
      fontSize: 'lg',
    }),
    ...(overrideStyle || {}),
  };

  const buttonClasses = resolveButtonClasses(activeStyle, className);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer ${buttonClasses}`}
    >
      {children}
    </button>
  );
}
