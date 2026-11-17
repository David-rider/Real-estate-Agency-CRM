import LanguageHome from './LanguageHome';
import type { Language } from '@/lib/i18n/translations';
import { SITE_URL, homeUrl } from '@/lib/site';

// Structured data for search engines, in the page's language
const jsonLd = (lang: Language) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Real Estate CRM',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Professional CRM platform for real estate agents and brokerages. Manage clients, listings, transactions and commissions.',
  url: homeUrl(lang),
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0',
    offerCount: '3',
    offers: [
      { '@type': 'Offer', name: 'Core', price: '0', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Pro', price: '39', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Elite', price: '79', priceCurrency: 'USD' },
    ],
  },
  featureList: [
    'Client & Lead Management (CRM)',
    'Property Listing Management',
    'Deal Pipeline & Transaction Tracking',
    'Commission Calculation & Splits',
    'Appointment Scheduling & Calendar',
    'Document Management',
    'Team Collaboration & Invite',
    'Reports & Analytics',
    '4-Language Support (EN / 中文简 / 中文繁 / ES)',
  ],
  publisher: {
    '@type': 'Organization',
    name: 'Real Estate CRM',
    url: SITE_URL,
  },
  inLanguage: lang,
});

// The public home page in one language (server part: structured data; the page itself is LanguageHome)
export default function HomePage({ lang }: { lang: Language }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(lang)) }} />
      <LanguageHome lang={lang} />
    </>
  );
}
