/** @type {import('next').NextConfig} */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data: https://*.myshopify.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const COMMON_SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: CONTENT_SECURITY_POLICY,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const CAMERA_DENIED_POLICY = {
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

const CAMERA_SELF_POLICY = {
  key: 'Permissions-Policy',
  value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
};

const nextConfig = {
  poweredByHeader: false,
  transpilePackages: ['three'],
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: COMMON_SECURITY_HEADERS,
      },
      // Disjoint Permissions-Policy rules so every route emits EXACTLY ONE header
      {
        source: '/',
        headers: [CAMERA_DENIED_POLICY],
      },
      {
        source: '/((?!pretty-piggie|makeover-studio).+)',
        headers: [CAMERA_DENIED_POLICY],
      },
      {
        source: '/pretty-piggie',
        headers: [CAMERA_SELF_POLICY],
      },
      {
        source: '/pretty-piggie/:path*',
        headers: [CAMERA_SELF_POLICY],
      },
      {
        source: '/makeover-studio',
        headers: [CAMERA_SELF_POLICY],
      },
      {
        source: '/makeover-studio/:path*',
        headers: [CAMERA_SELF_POLICY],
      },
      // Explicit WASM & Task bundle MIME + immutable cache headers
      {
        source: '/pretty-piggie/wasm/:file*.wasm',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/pretty-piggie/wasm/:file*.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/pretty-piggie/models/:file*.task',
        headers: [
          { key: 'Content-Type', value: 'application/octet-stream' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
