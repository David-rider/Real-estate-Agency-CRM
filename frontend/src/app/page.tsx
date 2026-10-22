import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://real-estate-agency-crm.vercel.app';
// Listings are published per brokerage. Set NEXT_PUBLIC_FEATURED_BROKERAGE_SLUG to
// link the homepage to one brokerage's listings page; otherwise the links are hidden.
const FEATURED_SLUG = process.env.NEXT_PUBLIC_FEATURED_BROKERAGE_SLUG || '';
const LISTINGS_HREF = `/public-listings?b=${FEATURED_SLUG}`;

export const metadata: Metadata = {
  title: 'Real Estate Brokerage CRM — Manage Clients, Listings & Commissions',
  description:
    'The all-in-one CRM platform for real estate agents and brokerages. Manage clients, track listings, close deals faster, and automate commission splits — built for NYC luxury real estate.',
  keywords: [
    'real estate CRM',
    'brokerage management software',
    'real estate agent software',
    'property listing management',
    'commission tracking',
    'real estate pipeline',
    'NYC real estate CRM',
    'luxury real estate software',
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Real Estate Brokerage CRM — Close More Deals',
    description:
      'All-in-one platform for real estate agents: clients, listings, deals, commissions & AI marketing. Used by NYC luxury brokerages.',
    url: SITE_URL,
    siteName: 'CPRE Real Estate CRM',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Real Estate CRM Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Estate Brokerage CRM',
    description: 'Manage clients, listings & commissions in one platform.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CPRE Real Estate CRM',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Professional CRM platform for real estate agents and brokerages. Manage clients, listings, transactions, commissions, and AI-powered marketing.',
  url: SITE_URL,
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0',
    offerCount: '3',
    offers: [
      { '@type': 'Offer', name: 'Core', price: '0', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Pro', price: '49', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Elite', price: '99', priceCurrency: 'USD' },
    ],
  },
  featureList: [
    'Client & Lead Management (CRM)',
    'Property Listing Management',
    'Deal Pipeline & Transaction Tracking',
    'Commission Calculation & Splits',
    'AI-Powered Marketing Content',
    'Appointment Scheduling & Calendar',
    'Document Management',
    'Team Collaboration & Invite',
    'Reports & Analytics',
    '4-Language Support (EN / 中文简 / 中文繁 / ES)',
  ],
  publisher: {
    '@type': 'Organization',
    name: 'CPRE',
    url: SITE_URL,
  },
};

const FEATURES = [
  {
    icon: '👥',
    title: 'CRM & Lead Pipeline',
    desc: 'Track every client from first contact to closing. Full activity timeline, funnel stages, and follow-up reminders.',
  },
  {
    icon: '🏠',
    title: 'Listing Management',
    desc: 'Add properties, upload media, sync listing details, and monitor status — all from one clean dashboard.',
  },
  {
    icon: '📊',
    title: 'Deal Pipeline',
    desc: 'Drag-and-drop Kanban board from Offer Review → In Contract → Clear to Close → Closed.',
  },
  {
    icon: '💰',
    title: 'Commission Tracking',
    desc: 'Automatic gross/net commission calculation, firm split waterfall, and YTD leaderboard.',
  },
  {
    icon: '✨',
    title: 'AI Marketing Copilot',
    desc: 'Generate listing descriptions, social posts, and email campaigns in seconds. Multiple tones and languages.',
  },
  {
    icon: '📅',
    title: 'Appointments & Calendar',
    desc: 'Schedule showings, inspections and meetings. Visual calendar with client and property links.',
  },
];

const PLANS = [
  {
    name: 'Core',
    price: 'Free',
    sub: 'forever',
    highlight: false,
    features: ['5 Active Listings', 'CRM — up to 50 clients', 'Basic Reports', 'AI Listing Descriptions'],
  },
  {
    name: 'Pro',
    price: '$49',
    sub: 'per month',
    highlight: true,
    features: ['Unlimited Listings', 'Unlimited Clients', 'Commission Waterfall', 'Social & Email AI Content', 'Full Analytics'],
  },
  {
    name: 'Elite',
    price: '$99',
    sub: 'per month',
    highlight: false,
    features: ['Everything in Pro', 'Revenue Projections', 'Custom AI Tone', 'Priority Support', 'Team Roles & Permissions'],
  },
];

export default function LandingPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-background text-foreground">
        {/* ── Nav ── */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-surface border border-border flex items-center justify-center font-serif text-lg text-primary">C</div>
              <span className="font-bold text-primary tracking-tight">CPRE</span>
              <span className="text-foreground/30 text-sm hidden sm:block">Real Estate CRM</span>
            </div>
            <nav className="flex items-center gap-6">
              {FEATURED_SLUG && (
                <Link href={LISTINGS_HREF} className="text-sm text-foreground/60 hover:text-primary transition-colors hidden sm:block">
                  Browse Listings
                </Link>
              )}
              <Link href="/login" className="text-sm text-foreground/60 hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition"
              >
                Get Started Free
              </Link>
            </nav>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Built for NYC Luxury Real Estate
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            The CRM Built for<br />
            <span className="text-primary">Real Estate Agents</span>
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto mb-10">
            Manage clients, listings, deals, and commissions — all in one place.
            Trusted by brokerages in New York. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3.5 bg-primary text-background font-semibold rounded-xl hover:opacity-90 transition text-base"
            >
              Start Free → No credit card
            </Link>
            {FEATURED_SLUG && (
              <Link
                href={LISTINGS_HREF}
                className="px-8 py-3.5 bg-surface border border-border text-foreground font-semibold rounded-xl hover:bg-background transition text-base"
              >
                Browse Listings
              </Link>
            )}
          </div>
          <p className="text-xs text-foreground/30 mt-4">Free plan available · No credit card required</p>
        </section>

        {/* ── Features ── */}
        <section className="bg-surface border-y border-border py-20" id="features">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-3">
              Everything a Modern Brokerage Needs
            </h2>
            <p className="text-center text-foreground/50 mb-14 max-w-xl mx-auto">
              From first lead to commission payout — manage your entire business without switching tabs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-background border border-border rounded-xl p-6 hover:border-primary/40 transition-colors">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-foreground/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="max-w-6xl mx-auto px-6 py-20" id="pricing">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-3">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-foreground/50 mb-14">Start free. Upgrade when you grow.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-7 border flex flex-col ${
                  plan.highlight
                    ? 'bg-primary border-primary text-background shadow-xl scale-105'
                    : 'bg-surface border-border text-foreground'
                }`}
              >
                <div className="text-sm font-semibold uppercase tracking-widest mb-1 opacity-70">{plan.name}</div>
                <div className="text-3xl font-bold mb-0.5">{plan.price}</div>
                <div className={`text-xs mb-6 ${plan.highlight ? 'opacity-70' : 'text-foreground/40'}`}>{plan.sub}</div>
                <ul className="space-y-2 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className={plan.highlight ? 'text-background/70' : 'text-primary'}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center transition ${
                    plan.highlight
                      ? 'bg-background text-primary hover:opacity-90'
                      : 'bg-primary text-background hover:opacity-90'
                  }`}
                >
                  {plan.price === 'Free' ? 'Start Free' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ (GEO / AI Search 关键) ── */}
        <section className="bg-surface border-t border-border py-20" id="faq">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center text-foreground mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'What is CPRE Real Estate CRM?',
                  a: 'CPRE is a cloud-based CRM (Customer Relationship Management) platform designed specifically for real estate agents and brokerages. It helps manage clients, property listings, deal pipelines, commissions, and marketing in one platform.',
                },
                {
                  q: 'Is there a free plan available?',
                  a: 'Yes. The Core plan is completely free and includes up to 5 active listings, 50 clients, basic reports, and AI listing descriptions. No credit card required.',
                },
                {
                  q: 'How does the commission tracking work?',
                  a: 'CPRE automatically calculates gross commission, firm split, and net agent payout for each transaction. You can view YTD totals, monthly charts, and request payouts — all within the Finance module.',
                },
                {
                  q: 'Can I invite my whole team?',
                  a: 'Yes. Firm Admins can invite agents, managers, attorneys, and other team members via email. Each member gets role-based access permissions.',
                },
                {
                  q: 'Does CPRE support multiple languages?',
                  a: 'Yes. The platform supports English, Simplified Chinese (简体中文), Traditional Chinese (繁體中文), and Spanish — making it ideal for diverse brokerage teams.',
                },
                {
                  q: 'What is the AI Marketing Copilot?',
                  a: 'The AI Copilot generates professional listing descriptions, social media posts, and email campaigns based on your property details and target audience. Available on Pro and Elite plans.',
                },
              ].map(({ q, a }) => (
                <details key={q} className="border border-border rounded-xl p-5 group">
                  <summary className="font-semibold text-foreground cursor-pointer list-none flex justify-between items-center">
                    {q}
                    <span className="text-primary text-lg group-open:rotate-45 transition-transform inline-block">+</span>
                  </summary>
                  <p className="text-foreground/60 text-sm mt-3 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to close more deals?</h2>
          <p className="text-foreground/50 mb-8">Join brokerages already using CPRE. Free to start, no credit card needed.</p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-primary text-background font-semibold text-base rounded-xl hover:opacity-90 transition"
          >
            Create Your Free Account →
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border bg-surface py-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-foreground/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">CPRE</span>
              <span>Real Estate CRM · New York</span>
            </div>
            <div className="flex gap-6">
              {FEATURED_SLUG && <Link href={LISTINGS_HREF} className="hover:text-foreground transition-colors">Browse Listings</Link>}
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
            <span>© {new Date().getFullYear()} CPRE. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </>
  );
}
