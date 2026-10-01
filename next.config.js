/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@aws-sdk/client-s3',
      '@aws-sdk/client-rekognition',
      '@aws-sdk/client-dynamodb',
      'recharts',
      'three',
      'sonner',
    ],
  },
};

module.exports = nextConfig;