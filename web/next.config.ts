import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Product screenshots contain small UI text — serve them at higher quality.
    qualities: [75, 90],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
