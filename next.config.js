/** @type {import('next').NextConfig} */
// Runs on Vercel's Node runtime (no static export) so /api/sleeper is a
// live route: it re-reads Sleeper on request instead of at build time.
const nextConfig = {
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
