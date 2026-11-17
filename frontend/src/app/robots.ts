import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/zh-CN', '/zh-TW', '/es', '/public-listings', '/property', '/login', '/signup'],
        disallow: [
          '/dashboard',
          '/crm',
          '/client',
          '/listings',
          '/transactions',
          '/appointments',
          '/documents',
          '/finance',
          '/reports',
          '/marketing',
          '/tasks',
          '/pipeline',
          '/settings',
          '/upgrade',
          '/services',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
