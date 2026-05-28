import type { Metadata } from "next";
import { Inter, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Providers } from "@/components/Providers";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import AuthLayoutWrapper from "@/lib/auth/AuthLayoutWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://real-estate-agency-crm.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Real Estate CRM — Agent & Brokerage Management Platform",
    template: "%s | CPRE Real Estate CRM",
  },
  description:
    "Professional CRM for real estate agents and brokerages. Manage clients, property listings, deal pipelines, commissions and AI marketing — all in one platform. Free plan available.",
  keywords: [
    "real estate CRM",
    "brokerage management software",
    "property listing management",
    "commission tracking software",
    "real estate agent tools",
    "NYC real estate software",
    "luxury real estate CRM",
    "deal pipeline management",
  ],
  authors: [{ name: "CPRE", url: SITE_URL }],
  creator: "CPRE",
  publisher: "CPRE",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN", "zh_TW", "es_US"],
    url: SITE_URL,
    siteName: "CPRE Real Estate CRM",
    title: "Real Estate CRM — Close More Deals",
    description:
      "All-in-one CRM for real estate agents: clients, listings, deals, commissions & AI marketing.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CPRE Real Estate CRM Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CPRE Real Estate CRM",
    description:
      "Manage clients, listings & commissions in one platform. Free plan available.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RE CRM",
  },
  formatDetection: { telephone: false },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "RE CRM",
    "msapplication-TileColor": "#B8977E",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="luxury" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoSerifSC.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <I18nProvider>
              <Providers>
                <AuthLayoutWrapper>{children}</AuthLayoutWrapper>
              </Providers>
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
