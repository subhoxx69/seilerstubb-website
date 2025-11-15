import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        // SEO Headers
        {
          key: 'X-Robots-Tag',
          value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        },
        // Security Headers
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
    // Sitemap header
    {
      source: '/sitemap.xml',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/xml; charset=utf-8',
        },
      ],
    },
    // Robots.txt header
    {
      source: '/robots.txt',
      headers: [
        {
          key: 'Content-Type',
          value: 'text/plain',
        },
      ],
    },
  ],
  // Redirects for SEO
  redirects: async () => [
    {
      source: '/index.html',
      destination: '/',
      permanent: true,
    },
  ],
};

export default nextConfig;
