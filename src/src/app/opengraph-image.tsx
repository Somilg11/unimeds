import { ImageResponse } from 'next/og';

export const alt = 'Unimeds — book doctors and clinics online';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Default share image for every public page (pages can override via their own metadata)
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#f6f6f6', padding: 40 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            background: '#1f72e8',
            borderRadius: 48,
            padding: 64,
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 999,
                background: '#ffffff',
                color: '#1f72e8',
                fontSize: 40,
                fontWeight: 700,
              }}
            >
              +
            </div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>Unimeds</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Your health, handled with care</div>
            <div style={{ fontSize: 32, opacity: 0.85 }}>Find doctors, book real open times and keep your records in one place.</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
