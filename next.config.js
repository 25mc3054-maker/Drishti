/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Static export for GitHub Pages
  output: 'export',
  // Ensure exported files use trailing slash for directory indexes
  trailingSlash: true,
}

module.exports = nextConfig
