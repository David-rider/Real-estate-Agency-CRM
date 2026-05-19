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

export const metadata: Metadata = {
  title: "Real Estate CRM — Agent & Brokerage Management Platform",
  description: "Professional real estate brokerage management platform. Manage clients, listings, transactions, commissions and marketing from one place.",
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
