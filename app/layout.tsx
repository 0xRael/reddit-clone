import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import { ModalProvider } from '@/components/ModalProvider'
import { QueryProvider } from '@/components/QueryProvider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://upyarc.vercel.app"
  ),
  title: {
    default: "UpYarc",
    template: "%s | UpYarc",
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }),
  description: "We're Up Yet Another Reddit Clone.",
  openGraph: {
    siteName: "UpYarc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: '/icon.png',
  },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://upyarc.vercel.app";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "UpYarc",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {	
	return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
    <QueryProvider>
		<ModalProvider>
			<div className="h-14 w-full max-w-screen"></div>
			
			<div className="w-full h-full flex relative text-gray-300 bg-brand max-lg:px-4">
			
				<LeftSidebar/>
				
				{children}
			</div>
			
			<Navbar />
		</ModalProvider>
    </QueryProvider>
      </body>
    </html>
	);
}
