import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090B',
          borderRadius: '12px',
          border: '1px solid rgba(244, 243, 239, 0.24)',
          color: '#F4F3EF',
          fontSize: 28,
          fontStyle: 'italic',
          fontFamily: 'Georgia, serif',
        }}
      >
        A.
      </div>
    ),
    { ...size }
  );
}
