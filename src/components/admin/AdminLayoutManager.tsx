'use client';

import React, { useState, useEffect } from 'react';
import {
  useSiteConfig,
  SiteConfig,
  SectorConfig,
  SectorCategoryItem,
  DEFAULT_CATEGORY_ITEMS,
  ButtonStyleConfig,
  ButtonThemePreset,
  ButtonRoundness,
  ButtonSize,
  resolveButtonClasses,
  DEFAULT_SITE_CONFIG,
  DEFAULT_BUTTON_STYLE,
} from '@/engine/siteConfigEngine';
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Sparkles,
  Layout,
  Compass,
  FileText,
  Megaphone,
  Paintbrush,
  Video,
  Image as ImageIcon,
} from 'lucide-react';

interface AdminLayoutManagerProps {
  onNotify: (msg: string) => void;
}

const THEME_PRESETS: {
  key: ButtonThemePreset;
  label: string;
  badgeBg: string;
}[] = [
  {
    key: 'glass-rose',
    label: '다크 글래스 + 핑크 롤오버 (권장)',
    badgeBg: 'bg-zinc-800 text-[#f04f74] border border-white/15',
  },
  {
    key: 'solid-wine',
    label: '솔리드 핑크로즈 포인트',
    badgeBg: 'bg-[#f04f74] text-white border border-[#f04f74]',
  },
  {
    key: 'pure-white',
    label: '퓨어 화이트 & 블랙 텍스트',
    badgeBg: 'bg-white text-zinc-950 border border-zinc-200',
  },
  {
    key: 'dark-outline',
    label: '차콜 다크 아웃라인',
    badgeBg: 'bg-zinc-900 text-white border border-white/20',
  },
  {
    key: 'gold-amber',
    label: '럭셔리 앰버 골드',
    badgeBg: 'bg-amber-950 text-amber-300 border border-amber-500/40',
  },
];

const ROUNDNESS_OPTIONS: { key: ButtonRoundness; label: string }[] = [
  { key: 'md', label: '단정한 사각' },
  { key: 'xl', label: '부드러운 곡률' },
  { key: 'full', label: '완전 캡슐' },
];

const SIZE_OPTIONS: { key: ButtonSize; label: string }[] = [
  { key: 'sm', label: '작게' },
  { key: 'base', label: '보통' },
  { key: 'lg', label: '크게' },
  { key: 'xl', label: '특대' },
];

export default function AdminLayoutManager({ onNotify }: AdminLayoutManagerProps) {
  const { config, updateConfig, updateButtonStyle, resetConfig } = useSiteConfig();

  const [draftConfig, setDraftConfig] = useState<SiteConfig>(config);
  const [subTab, setSubTab] = useState<'SECTORS' | 'BUTTON_STYLE' | 'HEADER' | 'FOOTER'>('SECTORS');

  useEffect(() => {
    setDraftConfig(config);
  }, [config]);

  // 섹터 순서 변경
  const handleMoveSector = (index: number, direction: 'UP' | 'DOWN') => {
    const list = [...(draftConfig?.mainSectors || [])];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reordered = list.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setDraftConfig({
      ...draftConfig,
      mainSectors: reordered,
    });
  };

  // 섹터 노출 토글
  const handleToggleSectorVisibility = (id: string) => {
    setDraftConfig({
      ...draftConfig,
      mainSectors: (draftConfig?.mainSectors || []).map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    });
  };

  // 섹터 미디어 URL 변경
  const handleUpdateSectorMedia = (id: string, url: string) => {
    setDraftConfig({
      ...draftConfig,
      mainSectors: (draftConfig?.mainSectors || []).map((s) =>
        s.id === id ? { ...s, mediaUrl: url } : s
      ),
    });
  };

  // 네비게이션 순서 및 노출
  const handleMoveNavItem = (index: number, direction: 'UP' | 'DOWN') => {
    const list = [...(draftConfig?.header?.navItems || [])];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reordered = list.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setDraftConfig({
      ...draftConfig,
      header: {
        ...(draftConfig?.header || DEFAULT_SITE_CONFIG.header),
        navItems: reordered,
      },
    });
  };

  const handleToggleNavVisibility = (id: string) => {
    setDraftConfig({
      ...draftConfig,
      header: {
        ...(draftConfig?.header || DEFAULT_SITE_CONFIG.header),
        navItems: (draftConfig?.header?.navItems || []).map((n) =>
          n.id === id ? { ...n, visible: !n.visible } : n
        ),
      },
    });
  };

  const handleUpdateNavLabel = (id: string, label: string) => {
    setDraftConfig({
      ...draftConfig,
      header: {
        ...(draftConfig?.header || DEFAULT_SITE_CONFIG.header),
        navItems: (draftConfig?.header?.navItems || []).map((n) =>
          n.id === id ? { ...n, label } : n
        ),
      },
    });
  };

  const handleUpdateNavBadge = (id: string, badge: string) => {
    setDraftConfig({
      ...draftConfig,
      header: {
        ...(draftConfig?.header || DEFAULT_SITE_CONFIG.header),
        navItems: (draftConfig?.header?.navItems || []).map((n) =>
          n.id === id ? { ...n, badge } : n
        ),
      },
    });
  };

  // 소셜 프로그램 라인업 개별 항목 토글 제어
  const handleToggleCategoryItemVisibility = (sectorId: string, itemId: string) => {
    const sectors = (draftConfig?.mainSectors || []).map((sec) => {
      if (sec.id !== sectorId) return sec;
      const items = (sec.categoryItems || DEFAULT_CATEGORY_ITEMS).map((it) =>
        it.id === itemId ? { ...it, visible: !it.visible } : it
      );
      return { ...sec, categoryItems: items };
    });
    setDraftConfig({
      ...draftConfig,
      mainSectors: sectors,
    });
  };

  // 버튼 스타일 변경
  const handleUpdateButtonStyle = (partial: Partial<ButtonStyleConfig>) => {
    const current = draftConfig.buttonStyle || DEFAULT_BUTTON_STYLE;
    const updated: ButtonStyleConfig = {
      theme: partial.theme ?? current.theme,
      roundness: partial.roundness ?? current.roundness,
      fontSize: partial.fontSize ?? current.fontSize,
    };
    setDraftConfig({
      ...draftConfig,
      buttonStyle: updated,
    });
  };

  // 저장 & 복원
  const handleSaveAll = () => {
    updateConfig(draftConfig);
    onNotify('설정이 저장되었습니다.');
  };

  const handleResetToDefault = () => {
    if (window.confirm('기본 설정으로 복원하시겠습니까?')) {
      resetConfig();
      setDraftConfig(DEFAULT_SITE_CONFIG);
      onNotify('기본값으로 복원되었습니다.');
    }
  };

  const currentButtonStyle = draftConfig.buttonStyle || DEFAULT_BUTTON_STYLE;
  const buttonPreviewClasses = resolveButtonClasses(currentButtonStyle, 'px-8 py-3.5');

  return (
    <div className="space-y-6">
      {/* 상단 탭 & 저장 액션 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-none bg-[#0c0d12] border border-white/10">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab('SECTORS')}
            className={`px-3.5 py-2 rounded-none text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'SECTORS'
                ? 'border border-[#f04f74] bg-transparent text-[#f04f74]'
                : 'border border-transparent bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>섹터 배치</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('BUTTON_STYLE')}
            className={`px-3.5 py-2 rounded-none text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'BUTTON_STYLE'
                ? 'border border-[#f04f74] bg-transparent text-[#f04f74]'
                : 'border border-transparent bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span>버튼 스타일</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('HEADER')}
            className={`px-3.5 py-2 rounded-none text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'HEADER'
                ? 'border border-[#f04f74] bg-transparent text-[#f04f74]'
                : 'border border-transparent bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>헤더 메뉴</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('FOOTER')}
            className={`px-3.5 py-2 rounded-none text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'FOOTER'
                ? 'border border-[#f04f74] bg-transparent text-[#f04f74]'
                : 'border border-transparent bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>푸터 정보</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2 sm:px-3 sm:py-2 rounded-none bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="초기화"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">초기화</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-none border border-[#f04f74] bg-transparent hover:bg-white/[0.04] text-[#f04f74] text-xs sm:text-sm font-mono tracking-wider uppercase font-semibold transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>저장</span>
          </button>
        </div>
      </div>

      {/* ======================================================================
          SUB-TAB 1: 메인 섹터 위치 & 노출 & 미디어
          ====================================================================== */}
      {subTab === 'SECTORS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>메인 화면에 배치되는 모듈 블록 (총 {(draftConfig?.mainSectors || []).length}개)</span>
          </div>

          <div className="space-y-3">
            {(draftConfig?.mainSectors || []).map((sector, index) => (
              <div
                key={sector.id}
                className={`p-4 rounded-none border transition-all space-y-3 ${
                  sector.visible
                    ? 'bg-[#0c0d12] border-white/10 shadow-md'
                    : 'bg-[#10121a]/60 border-white/5 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-none bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-[#f04f74] shrink-0">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{sector.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-zinc-400 border border-white/10">
                          {sector.type}
                        </span>
                      </div>
                      {sector.subtitle && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">{sector.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* 컨트롤 (위로/아래로/노출) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveSector(index, 'UP')}
                      className="p-1.5 rounded-none bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                      title="위로"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === (draftConfig?.mainSectors || []).length - 1}
                      onClick={() => handleMoveSector(index, 'DOWN')}
                      className="p-1.5 rounded-none bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                      title="아래로"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSectorVisibility(sector.id)}
                      className={`px-3 py-1.5 rounded-none border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                        sector.visible
                          ? 'bg-transparent text-[#f04f74] border-[#f04f74]'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {sector.visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>노출</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>숨김</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 비디오/미디어 섹터인 경우 미디어 URL 직접 수정 창 제공 */}
                {(sector.type === 'video-banner' || sector.type === 'rolling-hero' || sector.type === 'hero') && (
                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <span className="text-[11px] font-semibold text-zinc-400 shrink-0 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-[#f04f74]" />
                      <span>미디어 URL (MP4 / 사진):</span>
                    </span>
                    <input
                      type="text"
                      value={sector.mediaUrl || ''}
                      placeholder="https://... (동영상 MP4 파일 또는 이미지 링크)"
                      onChange={(e) => handleUpdateSectorMedia(sector.id, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-none bg-black/40 border border-white/10 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#f04f74]"
                    />
                  </div>
                )}

                {/* 카테고리 프로그램 섹터인 경우 하위 프로그램 개별 [운영/중지] 실시간 제어 창 제공 */}
                {sector.type === 'categories' && (
                  <div className="pt-3 border-t border-white/5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f04f74]" />
                        <span>개별 프로그램 운영/중지 제어 (동적 CMS)</span>
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        중지된 프로그램은 메인 화면에서 즉시 숨김 처리됩니다.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(sector.categoryItems || DEFAULT_CATEGORY_ITEMS).map((cat) => (
                        <div
                          key={cat.id}
                          className={`p-3 rounded-none border flex items-center justify-between gap-2.5 transition-all ${
                            cat.visible
                              ? 'bg-[#0c0d12] border-white/15'
                              : 'bg-black/40/60 border-white/5 opacity-50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">
                                {cat.title}
                              </span>
                              {cat.badge && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/10 text-zinc-300">
                                  {cat.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {cat.desc}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleCategoryItemVisibility(sector.id, cat.id)}
                            className={`px-3 py-1.5 rounded-none text-xs font-bold cursor-pointer shrink-0 transition-all ${
                              cat.visible
                                ? 'border border-[#f04f74] bg-transparent text-[#f04f74]'
                                : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {cat.visible ? '운영중' : '중지됨'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 2: 버튼 디자인 스타일 (프리셋 & 모서리 & 크기)
          ====================================================================== */}
      {subTab === 'BUTTON_STYLE' && (
        <div className="space-y-6">
          {/* 실시간 미리보기 */}
          <div className="p-6 rounded-none bg-[#0c0d12] border border-white/10 text-center space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
              버튼 스타일 실시간 미리보기
            </span>
            <div className="flex items-center justify-center py-2">
              <button type="button" className={buttonPreviewClasses}>
                <span>신청하기</span>
              </button>
            </div>
          </div>

          {/* 1. 테마 프리셋 */}
          <div className="p-5 rounded-none bg-[#0c0d12] border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#f04f74]" />
              <span>컬러 &amp; 테마 프리셋</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_PRESETS.map((t) => {
                const isSelected = currentButtonStyle.theme === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleUpdateButtonStyle({ theme: t.key })}
                    className={`p-3.5 rounded-none border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/[0.08] border-[#f04f74] shadow-md ring-1 ring-rose-500/50'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {t.label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-none text-xs font-bold shrink-0 ml-2 ${t.badgeBg}`}>
                      샘플
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 모서리 곡률 & 폰트 크기 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-none bg-[#0c0d12] border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white">모서리 곡률</h4>
              <div className="grid grid-cols-3 gap-2">
                {ROUNDNESS_OPTIONS.map((r) => {
                  const isSelected = currentButtonStyle.roundness === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => handleUpdateButtonStyle({ roundness: r.key })}
                      className={`p-2.5 rounded-none border text-xs font-bold text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-transparent border-[#f04f74] text-[#f04f74]'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 rounded-none bg-[#0c0d12] border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white">폰트 크기</h4>
              <div className="grid grid-cols-4 gap-2">
                {SIZE_OPTIONS.map((s) => {
                  const isSelected = currentButtonStyle.fontSize === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handleUpdateButtonStyle({ fontSize: s.key })}
                      className={`p-2.5 rounded-none border text-xs font-bold text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-transparent border-[#f04f74] text-[#f04f74]'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 3: 헤더 네비게이션 & 띠배너
          ====================================================================== */}
      {subTab === 'HEADER' && (
        <div className="space-y-5">
          {/* 상단 띠배너 */}
          <div className="p-5 rounded-none bg-[#0c0d12] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#f04f74]" />
                <h4 className="text-sm font-bold text-white">상단 공지 띠배너</h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraftConfig({
                    ...draftConfig,
                    header: {
                      ...(draftConfig?.header || DEFAULT_SITE_CONFIG.header),
                      announcement: {
                        ...(draftConfig?.header?.announcement || DEFAULT_SITE_CONFIG.header.announcement),
                        visible: !draftConfig?.header?.announcement?.visible,
                      },
                    },
                  })
                }
                className={`px-3 py-1 rounded-none text-xs font-semibold border transition-all cursor-pointer ${
                  draftConfig?.header?.announcement?.visible
                    ? 'bg-transparent text-[#f04f74] border-[#f04f74]'
                    : 'bg-white/5 text-zinc-400 border-white/10'
                }`}
              >
                {draftConfig?.header?.announcement?.visible ? '노출' : '숨김'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="태그 (예: HOT)"
                  value={draftConfig?.header?.announcement?.tag || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      header: {
                        ...(draftConfig?.header || DEFAULT_SITE_CONFIG.header),
                        announcement: {
                          ...(draftConfig?.header?.announcement || DEFAULT_SITE_CONFIG.header.announcement),
                          tag: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white font-medium"
                />
              </div>
              <div className="sm:col-span-7">
                <input
                  type="text"
                  placeholder="공지 문구"
                  value={draftConfig?.header?.announcement?.text || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      header: {
                        ...(draftConfig?.header || DEFAULT_SITE_CONFIG.header),
                        announcement: {
                          ...(draftConfig?.header?.announcement || DEFAULT_SITE_CONFIG.header.announcement),
                          text: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white font-medium"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="이동 링크"
                  value={draftConfig?.header?.announcement?.link || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      header: {
                        ...(draftConfig?.header || DEFAULT_SITE_CONFIG.header),
                        announcement: {
                          ...(draftConfig?.header?.announcement || DEFAULT_SITE_CONFIG.header.announcement),
                          link: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* 거점 기본 라벨 */}
          <div className="p-5 rounded-none bg-[#0c0d12] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">헤더 우측 거점 뱃지 텍스트</h4>
            <input
              type="text"
              value={draftConfig?.header?.activeCityLabel || ''}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  header: {
                    ...(draftConfig?.header || DEFAULT_SITE_CONFIG.header),
                    activeCityLabel: e.target.value,
                  },
                })
              }
              className="w-full sm:w-80 px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white text-xs font-medium"
              placeholder="예: 부산 (전포·서면)"
            />
          </div>

          {/* 메뉴 순서 & 라벨 */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-bold text-white px-1">헤더 메뉴 목록</h4>
            {(draftConfig?.header?.navItems || []).map((item, index) => (
              <div
                key={item.id}
                className="p-3.5 rounded-none bg-[#0c0d12] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 flex-1">
                  <span className="font-mono text-xs text-[#f04f74] font-bold w-6">#{index + 1}</span>
                  <input
                    type="text"
                    value={item.label || ''}
                    onChange={(e) => handleUpdateNavLabel(item.id, e.target.value)}
                    className="px-3 py-1.5 rounded-none bg-black/40 border border-white/10 text-white text-xs font-semibold w-36"
                  />
                  <input
                    type="text"
                    value={item.badge || ''}
                    onChange={(e) => handleUpdateNavBadge(item.id, e.target.value)}
                    placeholder="뱃지"
                    className="px-2.5 py-1.5 rounded-none bg-black/40 border border-white/10 text-[#f04f74] text-[11px] w-24"
                  />
                  <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                    {item.href}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveNavItem(index, 'UP')}
                    className="p-1.5 rounded-none bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === (draftConfig?.header?.navItems || []).length - 1}
                    onClick={() => handleMoveNavItem(index, 'DOWN')}
                    className="p-1.5 rounded-none bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleNavVisibility(item.id)}
                    className={`px-2.5 py-1 rounded-none text-xs font-semibold border cursor-pointer ${
                      item.visible
                        ? 'bg-transparent text-[#f04f74] border-[#f04f74]'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {item.visible ? '노출' : '숨김'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 4: 푸터 사업자 정보 & SNS
          ====================================================================== */}
      {subTab === 'FOOTER' && (
        <div className="space-y-5">
          <div className="p-5 rounded-none bg-[#0c0d12] border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white">사업자 정보</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">상호명</label>
                <input
                  type="text"
                  value={draftConfig?.footer?.companyName || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        companyName: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">대표자명</label>
                <input
                  type="text"
                  value={draftConfig?.footer?.ceo || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        ceo: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">사업자등록번호</label>
                <input
                  type="text"
                  value={draftConfig?.footer?.bizNum || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        bizNum: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">통신판매업신고번호</label>
                <input
                  type="text"
                  value={draftConfig?.footer?.mailOrderNum || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        mailOrderNum: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1">사업장 주소</label>
                <input
                  type="text"
                  value={draftConfig?.footer?.address || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        address: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">대표전화</label>
                <input
                  type="text"
                  value={draftConfig?.footer?.tel || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        tel: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">이메일</label>
                <input
                  type="text"
                  value={draftConfig?.footer?.email || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        email: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">고객센터 운영시간</label>
                <input
                  type="text"
                  value={draftConfig?.footer?.csHours || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        csHours: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">저작권 표기</label>
                <input
                  type="text"
                  value={draftConfig?.footer?.copyright || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        copyright: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-none bg-black/40 border border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* SNS 채널 */}
          <div className="p-5 rounded-none bg-[#0c0d12] border border-white/10 space-y-2.5">
            <h4 className="text-sm font-bold text-white">SNS 및 공식 채널 링크</h4>
            {(draftConfig?.footer?.socialLinks || []).map((social, idx) => (
              <div key={social.id} className="flex items-center gap-2.5 text-xs">
                <span className="w-20 text-zinc-300 font-semibold">{social.label}</span>
                <input
                  type="text"
                  value={social.url || ''}
                  onChange={(e) => {
                    const newSocials = [...(draftConfig?.footer?.socialLinks || [])];
                    newSocials[idx] = { ...social, url: e.target.value };
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        socialLinks: newSocials,
                      },
                    });
                  }}
                  className="flex-1 px-3 py-1.5 rounded-none bg-black/40 border border-white/10 text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSocials = [...(draftConfig?.footer?.socialLinks || [])];
                    newSocials[idx] = { ...social, visible: !social.visible };
                    setDraftConfig({
                      ...draftConfig,
                      footer: {
                        ...(draftConfig?.footer || DEFAULT_SITE_CONFIG.footer),
                        socialLinks: newSocials,
                      },
                    });
                  }}
                  className={`px-3 py-1.5 rounded-none border text-xs font-semibold cursor-pointer ${
                    social.visible
                      ? 'bg-transparent text-[#f04f74] border-[#f04f74]'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {social.visible ? '노출' : '숨김'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
