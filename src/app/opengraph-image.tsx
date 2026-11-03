import { ImageResponse } from 'next/og';

export const alt = 'Md. Abrar Hossain — Business Relationship Manager & Project Leader';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090B',
          color: '#F4F3EF',
          padding: '64px 76px',
          border: '1px solid rgba(244, 243, 239, 0.12)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            borderBottom: '1px solid rgba(244, 243, 239, 0.1)',
            paddingBottom: '24px',
            fontSize: 18,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#8E8E93',
          }}
        >
          <span>MD. ABRAR HOSSAIN</span>
          <span>LONDON E1 ↔ CHATTOGRAM</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#C8B89A',
            }}
          >
            BUSINESS RELATIONSHIP MANAGER &amp; PROJECT LEADER · COMPILEQ (UK)
          </div>
          <div
            style={{
              fontSize: 66,
              fontWeight: 300,
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              color: '#F4F3EF',
              maxWidth: '960px',
            }}
          >
            Bridging commercial strategy &amp; engineering velocity.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            borderTop: '1px solid rgba(244, 243, 239, 0.1)',
            paddingTop: '24px',
            fontSize: 18,
            color: '#A1A1AA',
          }}
        >
          <span>+50% Client Retention · +50% Delivery Efficiency · +25% HR Retention</span>
          <span style={{ color: '#C8B89A' }}>B.Engg. · UFTB</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
