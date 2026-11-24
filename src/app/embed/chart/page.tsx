import React from 'react';
import ThreatPulseChart from '@/components/oops/ThreatPulseChart';

interface EmbedChartPageProps {
  searchParams: Promise<{ theme?: string }>;
}

export default async function EmbedChartPage({ searchParams }: EmbedChartPageProps) {
  const params = await searchParams;
  const themeId = params.theme || 'ai_collision';

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-2">
      <div className="w-full max-w-2xl">
        <ThreatPulseChart initialThemeId={themeId} isEmbed={true} />
      </div>
    </div>
  );
}
