import { NextResponse } from 'next/server';
import { loadOopsPlatformConfig } from '@/lib/oops/featureModulesStore';

export async function GET() {
  const config = await loadOopsPlatformConfig();
  return NextResponse.json(
    {
      ok: true,
      modules: config.modules,
      briefings: config.briefings,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
