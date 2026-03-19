import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Providers } from "@/components/Providers";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import AuthLayoutWrapper from "@/lib/auth/AuthLayoutWrapper";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real Estate Brokerage Management Platform Agent CRM",
  description: "Real Estate SaaS Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${playfair.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <I18nProvider>
            <Providers>
              <AuthLayoutWrapper>{children}</AuthLayoutWrapper>
            </Providers>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
