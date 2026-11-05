'use client';

import React, { useState, useEffect } from 'react';
import { useSiteConfig, SiteConfig, SectorConfig, NavItemConfig, DEFAULT_SITE_CONFIG } from '@/engine/siteConfigEngine';
import { ArrowUp, ArrowDown, Eye, EyeOff, Save, RotateCcw, CheckCircle2, Sparkles, Layout, Compass, FileText, Megaphone } from 'lucide-react';

interface AdminLayoutManagerProps {
  onNotify: (msg: string) => void;
}

export default function AdminLayoutManager({ onNotify }: AdminLayoutManagerProps) {
  const { config, updateConfig, resetConfig } = useSiteConfig();

  // 편집용 로컬 상태 (저장 전까지 변경사항 보유)
  const [draftConfig, setDraftConfig] = useState<SiteConfig>(config);
  const [subTab, setSubTab] = useState<'SECTORS' | 'HEADER' | 'FOOTER'>('SECTORS');

  useEffect(() => {
    setDraftConfig(config);
  }, [config]);

  // ==========================================================================
  // 본문 섹터 위치 이동 & 노출 토글 핸들러
  // ==========================================================================
  const handleMoveSector = (index: number, direction: 'UP' | 'DOWN') => {
    const list = [...draftConfig.mainSectors];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // 자리 교환
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // order 번호 재부여
    const reordered = list.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setDraftConfig({
      ...draftConfig,
      mainSectors: reordered,
    });
  };

  const handleToggleSectorVisibility = (id: string) => {
    setDraftConfig({
      ...draftConfig,
      mainSectors: draftConfig.mainSectors.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    });
  };

  // ==========================================================================
  // 헤더 네비게이션 메뉴 위치 이동 & 노출 토글 핸들러
  // ==========================================================================
  const handleMoveNavItem = (index: number, direction: 'UP' | 'DOWN') => {
    const list = [...draftConfig.header.navItems];
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
        ...draftConfig.header,
        navItems: reordered,
      },
    });
  };

  const handleToggleNavVisibility = (id: string) => {
    setDraftConfig({
      ...draftConfig,
      header: {
        ...draftConfig.header,
        navItems: draftConfig.header.navItems.map((n) =>
          n.id === id ? { ...n, visible: !n.visible } : n
        ),
      },
    });
  };

  const handleUpdateNavLabel = (id: string, label: string) => {
    setDraftConfig({
      ...draftConfig,
      header: {
        ...draftConfig.header,
        navItems: draftConfig.header.navItems.map((n) =>
          n.id === id ? { ...n, label } : n
        ),
      },
    });
  };

  const handleUpdateNavBadge = (id: string, badge: string) => {
    setDraftConfig({
      ...draftConfig,
      header: {
        ...draftConfig.header,
        navItems: draftConfig.header.navItems.map((n) =>
          n.id === id ? { ...n, badge } : n
        ),
      },
    });
  };

  // ==========================================================================
  // 전체 설정 저장 & 기본값 리셋
  // ==========================================================================
  const handleSaveAll = () => {
    updateConfig(draftConfig);
    onNotify('사이트 화면 레이아웃 및 헤더/푸터 설정이 성공적으로 저장되었습니다!');
  };

  const handleResetToDefault = () => {
    if (window.confirm('사이트 레이아웃 및 헤더/푸터 설정을 초기 기본값으로 복원하시겠습니까?')) {
      resetConfig();
      setDraftConfig(DEFAULT_SITE_CONFIG);
      onNotify('초기 기본값으로 복원되었습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 서브탭 & 저장 액션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#141824] border border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('SECTORS')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'SECTORS'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>메인 섹터 위치 & 노출</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('HEADER')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'HEADER'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>헤더 메뉴 & 띠배너</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('FOOTER')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'FOOTER'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>푸터 사업자정보 & SNS</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="초기 기본값으로 복원"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값 복원</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>설정 저장하기</span>
          </button>
        </div>
      </div>

      {/* ======================================================================
          SUB-TAB 1: 메인 화면 섹터 순서 이동(▲/▼) 및 노출 On/Off
          ====================================================================== */}
      {subTab === 'SECTORS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400 flex items-center justify-between">
            <div>
              <strong className="text-white">메인 화면 섹터 블록 재배치:</strong> 각 모듈의 순서를 [▲ 위로] [▼ 아래로] 버튼으로 자유롭게 변경할 수 있으며, 눈 아이콘으로 숨기거나 노출할 수 있습니다.
            </div>
            <span className="text-rose-400 font-semibold">{draftConfig.mainSectors.length}개 섹터 등록됨</span>
          </div>

          <div className="space-y-3">
            {draftConfig.mainSectors.map((sector, index) => (
              <div
                key={sector.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  sector.visible
                    ? 'bg-[#151926] border-white/10 shadow-md'
                    : 'bg-[#10121a]/60 border-white/5 opacity-60'
                }`}
              >
                {/* 좌측 정보 */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-sm text-rose-300">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{sector.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-zinc-400 border border-white/10">
                        {sector.type}
                      </span>
                    </div>
                    {sector.subtitle && (
                      <p className="text-xs text-zinc-400 mt-0.5">{sector.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* 우측 조작 버튼 (순서 이동 ▲/▼ + 노출 On/Off) */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* 위로 이동 */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveSector(index, 'UP')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="위로 한 칸 이동"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* 아래로 이동 */}
                  <button
                    type="button"
                    disabled={index === draftConfig.mainSectors.length - 1}
                    onClick={() => handleMoveSector(index, 'DOWN')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="아래로 한 칸 이동"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* 노출/숨김 토글 */}
                  <button
                    type="button"
                    onClick={() => handleToggleSectorVisibility(sector.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      sector.visible
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {sector.visible ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>노출중</span>
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
            ))}
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 2: 헤더 네비게이션 메뉴 및 상단 공지 띠배너
          ====================================================================== */}
      {subTab === 'HEADER' && (
        <div className="space-y-6">
          {/* 상단 공지 띠배너 관리 */}
          <div className="p-5 rounded-2xl bg-[#151926] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-bold text-white">상단 공지 띠배너 (Announcement Bar)</h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraftConfig({
                    ...draftConfig,
                    header: {
                      ...draftConfig.header,
                      announcement: {
                        ...draftConfig.header.announcement,
                        visible: !draftConfig.header.announcement.visible,
                      },
                    },
                  })
                }
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  draftConfig.header.announcement.visible
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-white/5 text-zinc-400 border-white/10'
                }`}
              >
                {draftConfig.header.announcement.visible ? '띠배너 켜짐' : '띠배너 꺼짐'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1 font-medium">태그 (예: HOT)</label>
                <input
                  type="text"
                  value={draftConfig.header.announcement.tag || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      header: {
                        ...draftConfig.header,
                        announcement: { ...draftConfig.header.announcement, tag: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-medium"
                />
              </div>
              <div className="sm:col-span-7">
                <label className="block text-zinc-400 mb-1 font-medium">공지 문구</label>
                <input
                  type="text"
                  value={draftConfig.header.announcement.text}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      header: {
                        ...draftConfig.header,
                        announcement: { ...draftConfig.header.announcement, text: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-medium"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-zinc-400 mb-1 font-medium">이동 링크</label>
                <input
                  type="text"
                  value={draftConfig.header.announcement.link || ''}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      header: {
                        ...draftConfig.header,
                        announcement: { ...draftConfig.header.announcement, link: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* 거점 기본 라벨 */}
          <div className="p-5 rounded-2xl bg-[#151926] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white">헤더 우측 기본 거점(도시) 뱃지 텍스트</h4>
            <input
              type="text"
              value={draftConfig.header.activeCityLabel || ''}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  header: { ...draftConfig.header, activeCityLabel: e.target.value },
                })
              }
              className="w-full sm:w-80 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium"
              placeholder="예: 부산 (전포·서면)"
            />
          </div>

          {/* 네비게이션 메뉴 목록 순서 및 라벨 편집 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">상단 네비게이션 메뉴 항목 (순서 및 라벨)</h4>
            {draftConfig.header.navItems.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#151926] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-mono text-xs text-rose-300 font-bold w-6">#{index + 1}</span>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateNavLabel(item.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-semibold w-36"
                  />
                  <input
                    type="text"
                    value={item.badge || ''}
                    onChange={(e) => handleUpdateNavBadge(item.id, e.target.value)}
                    placeholder="뱃지(선택)"
                    className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-rose-300 text-[11px] w-24"
                  />
                  <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                    {item.href}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveNavItem(index, 'UP')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === draftConfig.header.navItems.length - 1}
                    onClick={() => handleMoveNavItem(index, 'DOWN')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleNavVisibility(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      item.visible
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
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
          SUB-TAB 3: 푸터 사업자 정보 및 SNS 채널 링크
          ====================================================================== */}
      {subTab === 'FOOTER' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#151926] border border-white/10 space-y-4">
            <h4 className="text-sm font-bold text-white">공식 법정 사업자 등록 정보</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">상호명</label>
                <input
                  type="text"
                  value={draftConfig.footer.companyName}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, companyName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">대표자명</label>
                <input
                  type="text"
                  value={draftConfig.footer.ceo}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, ceo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">사업자등록번호</label>
                <input
                  type="text"
                  value={draftConfig.footer.bizNum}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, bizNum: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">통신판매업신고번호</label>
                <input
                  type="text"
                  value={draftConfig.footer.mailOrderNum}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, mailOrderNum: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1 font-medium">사업장 소재지 주소</label>
                <input
                  type="text"
                  value={draftConfig.footer.address}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, address: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">대표전화</label>
                <input
                  type="text"
                  value={draftConfig.footer.tel}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, tel: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">전자우편 (이메일)</label>
                <input
                  type="text"
                  value={draftConfig.footer.email}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">고객센터 운영시간</label>
                <input
                  type="text"
                  value={draftConfig.footer.csHours}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, csHours: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">저작권 카피라이트</label>
                <input
                  type="text"
                  value={draftConfig.footer.copyright}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, copyright: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* SNS 채널 링크 관리 */}
          <div className="p-5 rounded-2xl bg-[#151926] border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white">SNS 및 공식 채널 링크</h4>
            {draftConfig.footer.socialLinks.map((social, idx) => (
              <div key={social.id} className="flex items-center gap-3 text-xs">
                <span className="w-24 text-zinc-300 font-semibold">{social.label}</span>
                <input
                  type="text"
                  value={social.url}
                  onChange={(e) => {
                    const newSocials = [...draftConfig.footer.socialLinks];
                    newSocials[idx] = { ...social, url: e.target.value };
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, socialLinks: newSocials },
                    });
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSocials = [...draftConfig.footer.socialLinks];
                    newSocials[idx] = { ...social, visible: !social.visible };
                    setDraftConfig({
                      ...draftConfig,
                      footer: { ...draftConfig.footer, socialLinks: newSocials },
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    social.visible
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
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

