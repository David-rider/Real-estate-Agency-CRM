"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number | null;
  status: string;
  imageUrl?: string;
}

const SAMPLE_PROPERTIES: Property[] = [
  { id: '1', address: '142 Park Avenue', city: 'New York', state: 'NY', zip: '10017', price: 4250000, beds: 3, baths: 2.5, sqft: 2100, status: 'ACTIVE' },
  { id: '2', address: '88 Hudson Street', city: 'New York', state: 'NY', zip: '10013', price: 2875000, beds: 2, baths: 2, sqft: 1450, status: 'ACTIVE' },
  { id: '3', address: '301 West 57th St', city: 'New York', state: 'NY', zip: '10019', price: 6800000, beds: 4, baths: 3.5, sqft: 3200, status: 'IN_CONTRACT' },
  { id: '4', address: '520 Fifth Avenue', city: 'New York', state: 'NY', zip: '10036', price: 1995000, beds: 1, baths: 1, sqft: 870, status: 'ACTIVE' },
  { id: '5', address: '15 Central Park West', city: 'New York', state: 'NY', zip: '10023', price: 9500000, beds: 5, baths: 4, sqft: 4800, status: 'ACTIVE' },
  { id: '6', address: '200 Rector Place', city: 'New York', state: 'NY', zip: '10280', price: 1650000, beds: 2, baths: 1.5, sqft: 1100, status: 'IN_CONTRACT' },
];

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=70&auto=format',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=70&auto=format',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=70&auto=format',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=70&auto=format',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=70&auto=format',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=70&auto=format',
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'For Sale',
  IN_CONTRACT: 'In Contract',
  SOLD: 'Sold',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/15 text-green-400 border-green-500/20',
  IN_CONTRACT: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  SOLD: 'bg-foreground/10 text-foreground/40 border-border',
};

const MIN_PRICES = [
  { label: 'No Min', value: '' },
  { label: '$500K', value: '500000' },
  { label: '$1M', value: '1000000' },
  { label: '$2M', value: '2000000' },
  { label: '$5M', value: '5000000' },
];

const MAX_PRICES = [
  { label: 'No Max', value: '' },
  { label: '$1M', value: '1000000' },
  { label: '$2M', value: '2000000' },
  { label: '$5M', value: '5000000' },
  { label: '$10M', value: '10000000' },
];

const BEDS_OPTIONS = ['Any', '1+', '2+', '3+', '4+'];
const BATHS_OPTIONS = ['Any', '1+', '2+', '3+'];

function formatPrice(price: number) {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`;
  return `$${price.toLocaleString()}`;
}

function PropertyCard({ property, index }: { property: Property; index: number }) {
  const imgSrc = property.imageUrl || UNSPLASH_IMAGES[index % UNSPLASH_IMAGES.length];
  const statusColor = STATUS_COLORS[property.status] || STATUS_COLORS.SOLD;
  const statusLabel = STATUS_LABELS[property.status] || property.status;

  return (
    <div className="group bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col">
      <div className="relative h-48 overflow-hidden bg-background">
        <Image
          src={imgSrc}
          alt={property.address}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-90 grayscale group-hover:grayscale-0"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="text-xl font-bold text-foreground drop-shadow-lg">{formatPrice(property.price)}</span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-semibold text-foreground text-sm truncate">{property.address}</h3>
          <p className="text-foreground/50 text-xs mt-0.5">{property.city}, {property.state} {property.zip}</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-foreground/60 font-medium mb-4">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {property.beds} {property.beds === 1 ? 'bed' : 'beds'}
          </span>
          <span className="w-px h-3 bg-border" />
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {property.baths} {property.baths === 1 ? 'bath' : 'baths'}
          </span>
          {property.sqft && (
            <>
              <span className="w-px h-3 bg-border" />
              <span>{property.sqft.toLocaleString()} sqft</span>
            </>
          )}
        </div>

        <div className="mt-auto">
          <button
            onClick={() => window.alert(`Request a showing for ${property.address} — feature coming soon!`)}
            disabled={property.status === 'IN_CONTRACT' || property.status === 'SOLD'}
            className="w-full py-2 bg-primary text-background text-xs uppercase tracking-widest font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {property.status === 'IN_CONTRACT' ? 'In Contract' : property.status === 'SOLD' ? 'Sold' : 'Request Showing →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicListingsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'IN_CONTRACT'>('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBeds, setMinBeds] = useState('Any');
  const [minBaths, setMinBaths] = useState('Any');
  const [showContactModal, setShowContactModal] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/properties/public`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.data;
        if (Array.isArray(list) && list.length > 0) {
          setProperties(list);
        } else {
          setProperties(SAMPLE_PROPERTIES);
        }
      })
      .catch(() => setProperties(SAMPLE_PROPERTIES))
      .finally(() => setLoading(false));
  }, [API]);

  const filtered = properties.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      if (!p.address.toLowerCase().includes(kw) && !p.city.toLowerCase().includes(kw) && !p.zip.includes(kw)) return false;
    }
    if (minPrice && p.price < parseFloat(minPrice)) return false;
    if (maxPrice && p.price > parseFloat(maxPrice)) return false;
    if (minBeds !== 'Any') {
      const min = parseInt(minBeds);
      if (p.beds < min) return false;
    }
    if (minBaths !== 'Any') {
      const min = parseInt(minBaths);
      if (p.baths < min) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-surface border border-border flex items-center justify-center font-serif text-lg text-primary">C</div>
            <span className="text-primary font-bold text-base tracking-tight hidden sm:block">CPRE</span>
            <span className="text-foreground/40 text-sm hidden sm:block">Listings</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs text-foreground/50 hover:text-primary uppercase tracking-widest transition-colors hidden sm:block">Agent Login</Link>
            <button
              onClick={() => setShowContactModal(true)}
              className="px-4 py-1.5 bg-primary text-background text-xs uppercase tracking-widest font-semibold rounded-lg hover:opacity-90 transition"
            >
              Contact Us
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Search */}
      <section className="relative border-b border-border bg-surface overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=60&auto=format')] bg-cover bg-center opacity-10 grayscale" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Find Your <span className="text-primary italic">Next Home</span>
          </h1>
          <div className="w-16 h-px bg-primary mb-6" />
          <p className="text-foreground/50 text-sm mb-8 max-w-xl">
            Browse our curated selection of New York&apos;s finest properties. Luxury living awaits.
          </p>

          {/* Search bar */}
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
              <svg className="w-4 h-4 text-foreground/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Search by address, city, or ZIP..."
                className="bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/30 w-full"
              />
              {keyword && (
                <button onClick={() => setKeyword('')} className="text-foreground/30 hover:text-foreground transition-colors text-xs">✕</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="border-b border-border bg-background sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          {/* Status filters */}
          <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
            {(['ALL', 'ACTIVE', 'IN_CONTRACT'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  statusFilter === s
                    ? 'bg-primary text-background shadow-sm'
                    : 'text-foreground/50 hover:text-foreground'
                }`}
              >
                {s === 'ALL' ? 'All' : s === 'ACTIVE' ? 'For Sale' : 'In Contract'}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          {/* Price filters */}
          <div className="flex items-center gap-2">
            <select
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="bg-surface border border-border text-foreground text-xs rounded-lg px-3 py-1.5 outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {MIN_PRICES.map(o => <option key={o.value} value={o.value} className="bg-surface">{o.label}</option>)}
            </select>
            <span className="text-foreground/30 text-xs">–</span>
            <select
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="bg-surface border border-border text-foreground text-xs rounded-lg px-3 py-1.5 outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {MAX_PRICES.map(o => <option key={o.value} value={o.value} className="bg-surface">{o.label}</option>)}
            </select>
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          {/* Beds / Baths */}
          <div className="flex items-center gap-2">
            <select
              value={minBeds}
              onChange={e => setMinBeds(e.target.value)}
              className="bg-surface border border-border text-foreground text-xs rounded-lg px-3 py-1.5 outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {BEDS_OPTIONS.map(o => <option key={o} value={o} className="bg-surface">{o === 'Any' ? 'Any Beds' : `${o} Beds`}</option>)}
            </select>
            <select
              value={minBaths}
              onChange={e => setMinBaths(e.target.value)}
              className="bg-surface border border-border text-foreground text-xs rounded-lg px-3 py-1.5 outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {BATHS_OPTIONS.map(o => <option key={o} value={o} className="bg-surface">{o === 'Any' ? 'Any Baths' : `${o} Baths`}</option>)}
            </select>
          </div>

          <div className="ml-auto text-xs text-foreground/40 font-medium">
            {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'property' : 'properties'}`}
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-foreground/5" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-foreground/5 rounded w-3/4" />
                  <div className="h-3 bg-foreground/5 rounded w-1/2" />
                  <div className="h-8 bg-foreground/5 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-surface border border-border flex items-center justify-center text-foreground/20 text-2xl mx-auto mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-foreground/60 font-semibold mb-2">No properties found</h3>
            <p className="text-foreground/30 text-sm mb-6">Try adjusting your search filters.</p>
            <button
              onClick={() => { setKeyword(''); setStatusFilter('ALL'); setMinPrice(''); setMaxPrice(''); setMinBeds('Any'); setMinBaths('Any'); }}
              className="px-4 py-2 bg-surface border border-border text-foreground/60 hover:text-foreground text-xs uppercase tracking-widest rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* Sticky Contact Footer */}
      <footer className="sticky bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">A</div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-foreground text-xs font-semibold truncate">Speak with an Agent</p>
              <p className="text-foreground/40 text-xs truncate">Available Mon–Fri, 9am–6pm EST</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:+12125550100"
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-foreground hover:border-primary hover:text-primary text-xs uppercase tracking-widest font-semibold rounded-lg transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="hidden sm:inline">Call Us</span>
            </a>
            <button
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-background text-xs uppercase tracking-widest font-semibold rounded-lg hover:opacity-90 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Contact an Agent →
            </button>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Contact an Agent</h2>
                <p className="text-foreground/50 text-sm mt-1">We&apos;ll get back to you within 24 hours.</p>
              </div>
              <button onClick={() => setShowContactModal(false)} className="text-foreground/30 hover:text-foreground transition-colors text-lg ml-4">✕</button>
            </div>
            <form
              onSubmit={e => { e.preventDefault(); setShowContactModal(false); window.alert('Thank you! An agent will be in touch shortly.'); }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-foreground/50">Name</label>
                <input type="text" required placeholder="Your full name" className="w-full px-0 py-2.5 bg-transparent border-b border-border focus:border-primary outline-none transition-colors text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-foreground/50">Email</label>
                <input type="email" required placeholder="your@email.com" className="w-full px-0 py-2.5 bg-transparent border-b border-border focus:border-primary outline-none transition-colors text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-foreground/50">Phone (Optional)</label>
                <input type="tel" placeholder="+1 (212) 555-0100" className="w-full px-0 py-2.5 bg-transparent border-b border-border focus:border-primary outline-none transition-colors text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-foreground/50">Message</label>
                <textarea rows={3} placeholder="I'm interested in..." className="w-full px-0 py-2.5 bg-transparent border-b border-border focus:border-primary outline-none transition-colors text-foreground text-sm resize-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-primary text-background text-sm uppercase tracking-widest font-semibold rounded-lg hover:opacity-90 transition mt-2">
                Send Message →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
