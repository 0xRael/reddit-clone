import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import { ModalProvider } from '@/components/ModalProvider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UpYarc",
  description: "We're Up Yet Another Reddit Clone.",
  icons: {
    icon: '/icon.png',
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
		<ModalProvider>
			<div className="h-14 w-full max-w-screen"></div>
			
			<div className="w-full h-full flex relative text-gray-300 bg-brand">
			
				<LeftSidebar/>
				
				{children}
			</div>
			
			<Navbar />
		</ModalProvider>
      </body>
    </html>
	);
}
