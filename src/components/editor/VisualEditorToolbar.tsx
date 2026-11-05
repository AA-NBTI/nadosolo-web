'use client';

import React, { useState } from 'react';
import { useNadoSoloEngine } from '@/engine';
import { useSiteConfig, useVisualEditor, SectorConfig } from '@/engine/siteConfigEngine';
import {
  Edit3,
  Check,
  RotateCcw,
  Layers,
  Eye,
  Film,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
} from 'lucide-react';

export default function VisualEditorToolbar() {
  const { currentUser } = useNadoSoloEngine();
  const { config, updateConfig, resetConfig } = useSiteConfig();
  const { isEditMode, toggleEditMode } = useVisualEditor();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isSectorDrawerOpen, setIsSectorDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.handle === '@admin' ||
    currentUser?.userId === 'ADMIN_01';

  // 관리자가 아니면 툴바 미노출
  if (!isAdmin) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    updateConfig(config);
    showToast('✓ 수정된 디자인 및 콘텐츠가 사이트에 즉시 저장되었습니다!');
  };

  const handleReset = () => {
    if (confirm('모든 텍스트, 이미지, 섹터 설정을 시스템 기본값으로 초기화하시겠습니까?')) {
      resetConfig();
      showToast('초기 기본값으로 복원되었습니다.');
    }
  };

  const toggleSectorVisibility = (sectorId: string) => {
    const updatedSectors = (config.mainSectors || []).map((s) =>
      s.id === sectorId ? { ...s, visible: !s.visible } : s
    );
    updateConfig({ ...config, mainSectors: updatedSectors });
    showToast('섹터 노출 상태가 변경되었습니다.');
  };

  const moveSector = (idx: number, direction: 'UP' | 'DOWN') => {
    const sectors = [...(config.mainSectors || [])];
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sectors.length) return;

    const temp = sectors[idx];
    sectors[idx] = sectors[targetIdx];
    sectors[targetIdx] = temp;

    // 순서 재부여
    const reordered = sectors.map((s, i) => ({ ...s, order: i + 1 }));
    updateConfig({ ...config, mainSectors: reordered });
  };

  return (
    <>
      {/* 화면 하단 고정 플로팅 에디터 툴바 */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[960px] animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-[#0f1118]/95 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] text-white">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* 좌측: 모드 인디케이터 & 토글 */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleEditMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md ${
                  isEditMode
                    ? 'bg-rose-600 text-white shadow-rose-950/60 ring-2 ring-rose-400/50'
                    : 'bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/15'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditMode ? '실시간 편집 모드 ON' : '편집 모드 켜기'}</span>
              </button>

              <span className="hidden sm:inline-block text-xs text-zinc-400">
                {isEditMode
                  ? '💡 화면의 글자를 클릭해 직접 수정하고, 미디어를 교체하세요.'
                  : '방문자 시점 미리보기 모드입니다.'}
              </span>
            </div>

            {/* 우측 액션 버튼 모음 */}
            <div className="flex items-center gap-2">
              
              {/* 섹터 블록 관리 서랍 토글 */}
              <button
                type="button"
                onClick={() => setIsSectorDrawerOpen(!isSectorDrawerOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="페이지 내 섹터 블록 추가 및 순서 조정"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">블록 관리</span>
              </button>

              {/* 저장 버튼 */}
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 hover:border-white/30 text-rose-400 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4 text-rose-400" />
                <span>저장</span>
              </button>

              {/* 초기화 버튼 */}
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                title="기본값 복원"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* 최소화 버튼 */}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                title={isMinimized ? '펼치기' : '접기'}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

          </div>

          {/* 알림 토스트 */}
          {toastMessage && (
            <div className="mt-3 py-2 px-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-zinc-400 hover:text-white ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* 블록 관리 팝오버 서랍 */}
          {isSectorDrawerOpen && !isMinimized && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  <span>메인화면 모듈 블록 노출 &amp; 순서</span>
                </span>
                <span className="text-[11px] text-zinc-400">
                  동영상 배너 등 원하는 블록을 켜거나 끌 수 있습니다.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(config.mainSectors || []).map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      sec.visible
                        ? 'bg-white/[0.04] border-white/15 text-white'
                        : 'bg-black/40 border-white/5 text-zinc-500 opacity-60'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold truncate">
                        {sec.type === 'video-banner' ? '🎬 ' : ''}
                        {sec.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {sec.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* 위/아래 순서 이동 */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSector(idx, 'UP')}
                        className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[10px] flex items-center justify-center cursor-pointer"
                        title="위로 이동"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === (config.mainSectors || []).length - 1}
                        onClick={() => moveSector(idx, 'DOWN')}
                        className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[10px] flex items-center justify-center cursor-pointer"
                        title="아래로 이동"
                      >
                        ▼
                      </button>

                      {/* 노출/숨김 토글 */}
                      <button
                        type="button"
                        onClick={() => toggleSectorVisibility(sec.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                          sec.visible
                            ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600/50'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {sec.visible ? '노출' : '숨김'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

