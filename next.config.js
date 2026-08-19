/** @type {import('next').NextConfig} */

/**
 * Security headers.
 *
 * The app previously sent none, and advertised its framework via
 * X-Powered-By. These are the defaults worth having for an app that holds
 * private photos and letters behind a login.
 *
 * The CSP allows 'unsafe-inline' for styles because Tailwind's runtime and
 * next/font both inject style attributes, and for scripts because the theme
 * bootstrap in app/layout.tsx is an inline <script> (it has to run before
 * first paint). Tightening those would need a nonce plumbed through the
 * document, which is a bigger change than this pass.
 */
const isDev = process.env.NODE_ENV !== 'production';

const securityHeaders = [
  {
    // Uploaded media is same-origin only; no third-party embeds are used.
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is required in development only: Next's webpack HMR and
      // React Refresh evaluate module code as strings. Omitting it silently
      // breaks the dev bundle - the page loads but none of its JavaScript runs.
      // Production builds do not need it, so it is not granted there.
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // HMR uses a websocket in development.
      isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'object-src none',
    ].join('; '),
  },
  // Belt-and-braces alongside frame-ancestors, for older browsers.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

// HSTS only means anything over TLS, and setting it while developing on plain
// http://localhost is pointless, so it is production-only.
if (!isDev) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  });
}

const nextConfig = {
  reactStrictMode: true,

  // Ships a self-contained server plus only the traced dependencies, so a
  // release is ~50-100MB and needs no `npm install` on the server. The target
  // box has 2GB of RAM shared with two other apps; installing or building
  // there would risk evicting them.
  output: 'standalone',

  // Runs instrumentation.ts at server start, which validates that the
  // session/encryption secrets are actually present.
  experimental: { instrumentationHook: true },

  // Do not advertise the framework and version.
  poweredByHeader: false,

  images: {
    // User uploads are served by /api/media (same-origin) and rendered with
    // `unoptimized`, so no remote hosts need allowing. 'localhost' and
    // images.unsplash.com were left over from the seeded dashboard artwork and
    // are no longer referenced.
    remotePatterns: [],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
