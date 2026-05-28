import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://real-estate-agency-crm.vercel.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/public-listings', '/login', '/signup'],
        disallow: [
          '/dashboard',
          '/crm',
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
