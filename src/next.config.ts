import type { NextConfig } from 'next';

const NOINDEX = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

// Signed-in portals and one-time links must never appear in search results.
// `:path*` also matches the section root, and "/doctor/:path*" does not match "/doctors".
const PRIVATE = ['/patient', '/doctor', '/clinic', '/admin', '/invite', '/reset-password', '/api', '/login/continue'];

const nextConfig: NextConfig = {
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
  poweredByHeader: false,
  async headers() {
    return PRIVATE.map((p) => ({ source: `${p}/:path*`, headers: NOINDEX }));
  },
};

export default nextConfig;
