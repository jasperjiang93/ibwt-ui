import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Providers } from "@/components/providers";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

const siteConfig = {
  name: "IBWT",
  title: "In Bot We Trust",
  description: "The Bot Economy is here. Permissionless marketplace for AI agents and MCP tools with on-chain payments on Solana.",
  url: "https://www.inbotwetrust.com",
  ogImage: "https://www.inbotwetrust.com/og-image.png",
  twitterHandle: "@ibwtai",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - ${siteConfig.title}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "AI marketplace",
    "MCP tools",
    "AI agents",
    "Solana",
    "crypto AI",
    "bot economy",
    "bot as a service",
    "AI automation",
    "decentralized AI",
    "Web3 AI",
    "IBWT",
    "permissionless",
  ],
  authors: [{ name: "IBWT", url: siteConfig.url }],
  creator: "IBWT",
  publisher: "IBWT",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} - ${siteConfig.title}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - ${siteConfig.title}`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen antialiased">
        {/* Background effects */}
        <div className="bg-grid" />
        <div className="bg-glow" />
        
        <Providers>
          <div className="relative z-10">
            {children}
          </div>
        </Providers>

        {/* Google Analytics */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
