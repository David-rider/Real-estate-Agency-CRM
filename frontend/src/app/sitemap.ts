import { MetadataRoute } from 'next';
import { LANGUAGES, SITE_URL, homeUrl, localizedUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  // The home page once per language, each listing the others (hreflang)
  const languages = Object.fromEntries(LANGUAGES.map((l) => [l, homeUrl(l)]));
  const now = new Date();

  return [
    // Privacy policy and terms, once per language with their alternates
    ...(['/privacy', '/terms'] as const).flatMap((page) => LANGUAGES.map((l) => ({
      url: localizedUrl(l, page),
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      alternates: { languages: Object.fromEntries(LANGUAGES.map((x) => [x, localizedUrl(x, page)])) },
    }))),
    ...LANGUAGES.map((l) => ({
      url: homeUrl(l),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
      alternates: { languages },
    })),
    {
      url: `${baseUrl}/public-listings`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
