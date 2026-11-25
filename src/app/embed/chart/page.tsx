import React from 'react';
import ThreatPulseChart from '@/components/oops/ThreatPulseChart';
import { detectOopsLocale } from '@/lib/oops/i18n';

interface EmbedChartPageProps {
  searchParams: Promise<{ theme?: string; locale?: string }>;
}

export default async function EmbedChartPage({ searchParams }: EmbedChartPageProps) {
  const params = await searchParams;
  const themeId = params.theme || 'ai_collision';
  const locale = params.locale ? detectOopsLocale(params.locale) : 'ko';

  return (
    <div className="oops-theme min-h-screen bg-[#f4f4f0] text-black flex items-center justify-center p-3 selection:bg-[#d4d4d8] selection:text-black">
      <div className="w-full max-w-2xl">
        <ThreatPulseChart initialThemeId={themeId} isEmbed={true} locale={locale} />
      </div>
    </div>
  );
}
