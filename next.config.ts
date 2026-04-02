import type { NextConfig } from "next";

// NOTE: 'unsafe-inline' is retained in script-src because Next.js injects
// inline hydration scripts that cannot be controlled at build time without
// a nonce-based CSP (requires custom middleware + streaming changes).
// To remove it in the future: implement generateBuildId + nonce middleware.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.yahoo.com https://*.yimg.com https://s.yimg.com https://finance.yahoo.com https://logo.clearbit.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://api.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ")

const nextConfig: NextConfig = {
  // output: "standalone", — disabled: Next.js 16 Turbopack + standalone has a bug
  // where middleware.js.nft.json is not emitted. Re-enable when deploying to Docker
  // or when upgrading to a Next.js version that fixes this issue.
  serverExternalPackages: ['yahoo-finance2'],
  // Disable browser sourcemaps in production to reduce bundle/deploy artifact size.
  // Server-side code sourcemaps are also suppressed via webpack config below.
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack(config, { dev }) {
    if (!dev) {
      // Use the cheapest sourcemap option for server builds in production.
      // 'hidden-source-map' keeps error stack traces useful in monitoring tools
      // without serving the full .map files to browsers.
      config.devtool = 'hidden-source-map';
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.yahoo.com" },
      { protocol: "https", hostname: "*.yimg.com" },
      { protocol: "https", hostname: "s.yimg.com" },
      { protocol: "https", hostname: "finance.yahoo.com" },
      { protocol: "https", hostname: "logo.clearbit.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
