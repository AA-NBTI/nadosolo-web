'use client';

import React, { useState } from 'react';

export interface SelectedAddressInfo {
  roadAddress: string;
  jibunAddress: string;
  buildingName?: string;
}

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  onSelectAddress?: (item: SelectedAddressInfo) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          roadAddress: string;
          jibunAddress: string;
          autoRoadAddress: string;
          autoJibunAddress: string;
          buildingName: string;
          userSelectedType: string;
        }) => void;
      }) => { open: () => void };
    };
  }
}

function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.daum?.Postcode) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-daum-postcode="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('주소 스크립트 로드 실패')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.dataset.daumPostcode = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('주소 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

export default function AddressAutocompleteInput({
  value,
  onChange,
  onSelectAddress,
  placeholder = '주소 검색 버튼을 누르거나 직접 입력하세요',
  required = false,
  className = '',
}: AddressAutocompleteInputProps) {
  const [opening, setOpening] = useState(false);

  const openPostcode = async () => {
    setOpening(true);
    try {
      await loadDaumPostcodeScript();
      if (!window.daum?.Postcode) return;
      new window.daum.Postcode({
        oncomplete: (data) => {
          const road = data.roadAddress || data.autoRoadAddress || '';
          const jibun = data.jibunAddress || data.autoJibunAddress || '';
          const picked = road || jibun;
          onChange(picked);
          onSelectAddress?.({
            roadAddress: picked,
            jibunAddress: jibun,
            buildingName: data.buildingName || '',
          });
        },
      }).open();
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          className ||
          'flex-1 px-3.5 py-2.5 bg-black/40 border border-white/15 text-sm text-[#f5f2eb] placeholder-zinc-500 focus:outline-none focus:border-white/40'
        }
      />
      <button
        type="button"
        onClick={openPostcode}
        disabled={opening}
        className="px-3.5 py-2.5 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white shrink-0 cursor-pointer disabled:opacity-40"
      >
        {opening ? '열기중' : '주소찾기'}
      </button>
    </div>
  );
}
