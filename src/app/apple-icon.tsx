import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e0d0c',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path d="M12 18 H52 A20 18 0 0 1 12 18 Z" fill="#e0914f" />
          <path
            d="M32 36 V52 M20 52 H44"
            stroke="#e0914f"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    size,
  )
}
