import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import { isOopsHost, isTablebaroHost } from '@/modules/tenancy';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default async function Icon() {
  const h = await headers();
  const host = h.get('host');
  const isOops = isOopsHost(host);
  const isTablebaro = isTablebaroHost(host);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: '#07080a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          border: isOops
            ? '1px solid rgba(239, 68, 68, 0.55)'
            : isTablebaro
              ? '1px solid rgba(59, 130, 246, 0.45)'
              : '1px solid rgba(255, 255, 255, 0.15)',
          fontFamily: 'serif',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '-1px',
        }}
      >
        <span
          style={{
            color: isOops ? '#ef4444' : isTablebaro ? '#3b82f6' : '#ffffff',
            letterSpacing: '-0.5px',
          }}
        >
          {isOops ? '!' : isTablebaro ? 't' : 'n'}
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
