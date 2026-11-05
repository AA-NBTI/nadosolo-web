'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import { useSiteConfig, SectorConfig } from '@/engine/siteConfigEngine';
import CheckoutModal, { CheckoutEventData } from '@/components/CheckoutModal';
import CitySwitcherModal from '@/components/CitySwitcherModal';

// 모듈러 섹터 컴포넌트 임포트
import SectorRollingHero from '@/components/sectors/SectorRollingHero';
import SectorHero from '@/components/sectors/SectorHero';
import SectorVideoBanner from '@/components/sectors/SectorVideoBanner';
import SectorCategories from '@/components/sectors/SectorCategories';
import SectorDistricts from '@/components/sectors/SectorDistricts';
import SectorJourney from '@/components/sectors/SectorJourney';
import SectorVenues from '@/components/sectors/SectorVenues';

export default function NadoSoloHomePage() {
  const router = useRouter();
  const { currentUser, applyForConditionalEvent } = useNadoSoloEngine();
  const { config, updateSectorConfig } = useSiteConfig();

  const [checkoutEvent, setCheckoutEvent] = useState<CheckoutEventData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // 모임 신청 클릭 시 결제창 오픈
  const handleOpenCheckout = () => {
    if (!currentUser) {
      router.push('/auth?next=/');
      return;
    }
    setCheckoutEvent({
      eventId: 'EVT_JEONPO_FRI',
      title: '부산 전포 6인 프라이빗 소셜 다이닝 (3045 & 5060)',
      dateText: '이번 주 금요일 19:30',
      priceKrw: 19900,
      districtName: '부산 · 전포/서면',
      mealNote: '디너 식대 및 주류 비용은 식당 현장에서 테이블 1/N 정산',
    });
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (eventId: string) => {
    applyForConditionalEvent(eventId);
    router.push('/dashboard');
  };

  // 관리자가 지정한 순서대로 정렬 및 visible 필터링
  const sortedSectors = [...(config.mainSectors || [])]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  // 섹터 타입별 렌더러
  const renderSector = (sector: SectorConfig) => {
    switch (sector.type) {
      case 'rolling-hero':
        return (
          <SectorRollingHero
            key={sector.id}
            config={sector}
            onUpdate={(updates) => updateSectorConfig(sector.id, updates)}
            onOpenCheckout={handleOpenCheckout}
          />
        );
      case 'hero':
        return (
          <SectorHero
            key={sector.id}
            config={sector}
            onUpdate={(updates) => updateSectorConfig(sector.id, updates)}
            onOpenCheckout={handleOpenCheckout}
          />
        );
      case 'video-banner':
        return (
          <SectorVideoBanner
            key={sector.id}
            config={sector}
            onUpdate={(updates) => updateSectorConfig(sector.id, updates)}
            onOpenCheckout={handleOpenCheckout}
          />
        );
      case 'categories':
        return <SectorCategories key={sector.id} />;
      case 'districts':
        return <SectorDistricts key={sector.id} onOpenCheckout={handleOpenCheckout} />;
      case 'journey':
        return <SectorJourney key={sector.id} />;
      case 'venues':
        return <SectorVenues key={sector.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans">
      <main className="w-full flex-1">
        {/* 관리자가 지정한 순서대로 동적 렌더링 */}
        {sortedSectors.map((sector) => renderSector(sector))}
      </main>

      {/* ==============================================================
          원스톱 결제 모달 (전자상거래법 환불규정 동의 및 토스페이먼츠 연동)
          ============================================================== */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={checkoutEvent}
        onSuccessPayment={handlePaymentSuccess}
      />

      {/* 도시 허브 선택 모달 */}
      <CitySwitcherModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
      />
    </div>
  );
}
