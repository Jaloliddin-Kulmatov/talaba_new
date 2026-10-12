import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import LazyWidgets from "@/components/layout/lazy-widgets";
import SkipLink from "@/components/layout/skip-link";
import SplashScreen from "@/components/ui/splash-screen";
import VisitTracker from "@/components/analytics/visit-tracker";
import SyncManager from "@/components/sync/sync-manager";
import InstallPrompt from "@/components/pwa/install-prompt";
import PwaStatus from "@/components/pwa/pwa-status";
import { AuthProvider } from "@/lib/auth";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { SITE_URL } from "@/lib/config";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "TALABA — O'zbek talabalari uchun platforma",
    template: "%s | TALABA",
  },
  description:
    "TALABA — O'zbekiston talabalari uchun №1 platforma. Universitet klublariga qo'shiling, amaliyot va part-time ish toping, qabul/DTM, turargoh va stipendiya bo'yicha yordam oling, AI yordamchidan foydalaning.",
  keywords: [
    "O'zbekiston talabalari", "TALABA", "universitet klublari",
    "talabalar hamjamiyati", "DTM", "qabul", "grant kontrakt",
    "talabalar turargohi", "stipendiya", "harbiy hisob",
    "talabalar uchun ish", "amaliyot O'zbekiston", "IELTS TOEFL",
  ],
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  alternates: { canonical: SITE_URL },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TALABA",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "TALABA — O'zbek talabalari uchun platforma",
    description: "Hamjamiyat, amaliyot, qabul va turargoh bo'yicha yordam, AI yordamchi — barchasi bir joyda.",
    type: "website",
    url: SITE_URL,
    siteName: "TALABA",
    locale: "uz_UZ",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TALABA — O'zbek talabalari uchun platforma" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TALABA — O'zbek talabalari uchun platforma",
    description: "Hamjamiyat, amaliyot va AI yordamchi — o'zbek talabalari uchun bir joyda.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const tree = (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="talaba-theme"
    >
      <AuthProvider>
        <SkipLink />
        <SplashScreen />
        <VisitTracker />
        <SyncManager />
        {children}
        <MobileBottomNav />
        <InstallPrompt />
        <PwaStatus />
        <LazyWidgets />
      </AuthProvider>
    </ThemeProvider>
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TALABA — O'zbek talabalari uchun platforma",
    "alternateName": "TALABA",
    "url": SITE_URL,
    "logo": `${SITE_URL}/icon-512.png`,
    "description": "TALABA — O'zbekistondagi talabalar uchun yetakchi platforma: universitet klublari, amaliyot, DTM/qabul, turargoh va AI yordamchi.",
    "foundingDate": "2026",
    "areaServed": "UZ",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    },
    "sameAs": [
      "https://t.me/talaba_uz"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "url": `${SITE_URL}/support`
    }
  };

  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${display.variable} font-sans antialiased`}>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
        ) : (
          tree
        )}
      </body>
    </html>
  );
}
