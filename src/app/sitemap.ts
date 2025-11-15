import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://www.seilerstubb.com';

  const pages = [
    {
      url: '/',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '1.0',
    },
    {
      url: '/menu',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.9',
    },
    {
      url: '/reservation',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.9',
    },
    {
      url: '/gallery',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.8',
    },
    {
      url: '/contact',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.8',
    },
    {
      url: '/about',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.8',
    },
    {
      url: '/faq',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'quarterly',
      priority: '0.7',
    },
    {
      url: '/impressum',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.5',
    },
    {
      url: '/privacy',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.5',
    },
    {
      url: '/agb',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.5',
    },
    {
      url: '/cookie-richtlinie',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.5',
    },
    {
      url: '/terms',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.5',
    },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
  `
    )
    .join('')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
