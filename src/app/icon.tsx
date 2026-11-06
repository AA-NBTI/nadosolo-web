import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
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
          border: '1px solid rgba(255, 255, 255, 0.15)',
          fontFamily: 'serif',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '-1px',
        }}
      >
        <span style={{ color: '#ffffff', letterSpacing: '-0.5px' }}>n</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
