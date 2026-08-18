import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

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
          background: 'linear-gradient(135deg, #95dccd 0%, #32b49f 100%)',
          borderRadius: '50%',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Central white heart */}
          <path
            d="M100,80 L85,95 Q80,100 80,110 Q80,120 90,130 L100,140 L110,130 Q120,120 120,110 Q120,100 115,95 Z"
            fill="white"
            opacity="0.95"
          />
          
          {/* Decorative wave accent */}
          <path
            d="M35,100 Q55,85 75,95 Q95,105 100,95"
            stroke="white"
            strokeWidth="3"
            fill="none"
            opacity="0.6"
            strokeLinecap="round"
          />
          <path
            d="M100,105 Q105,95 125,105 Q145,115 165,100"
            stroke="white"
            strokeWidth="3"
            fill="none"
            opacity="0.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
