import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://real-estate-agency-crm.vercel.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/public-listings', '/property', '/login', '/signup'],
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
