/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 1. Static export for GitHub Pages
  output: 'export',
  // 2. Add the repository name as the base path
  basePath: '/Drishti',
  // 3. Ensure links work correctly with sub-paths
  trailingSlash: true,
  images: {
    // 4. GitHub Pages doesn't support Next.js built-in image optimization
    unoptimized: true, 
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
}

module.exports = nextConfig
