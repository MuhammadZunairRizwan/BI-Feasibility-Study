/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'pdf-parse', 'mammoth', 'firebase-admin'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  // Railway deployment optimization
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle undici on client side
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  transpilePackages: ['firebase', '@firebase/auth', '@firebase/app', '@firebase/firestore'],
};

module.exports = nextConfig;
