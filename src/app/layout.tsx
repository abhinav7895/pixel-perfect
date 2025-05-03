import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PixelPerfect | Free Browser-Based Image Editing Tools",
  description: "Transform your images instantly with our free, private, browser-based image editing tools. No uploads, no data collection, works offline.",
  keywords: ["image editor", "photo editing", "compress images", "convert images", "resize images", "crop images", "free image tools", "browser-based", "offline", "private"],
  category: "Technology",
  openGraph: {
    title: "PixelPerfect | Free Browser-Based Image Editing Tools",
    description: "Transform your images instantly with our free, private, browser-based image editing tools. No uploads, no data collection, works offline.",
    url: 'https://pixel-perfect-opal.vercel.app',
    siteName: 'PixelPerfect',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'PixelPerfect - Browser-based image editing tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixelPerfect | Free Browser-Based Image Editing Tools',
    description: 'Transform your images instantly with our free, private, browser-based image editing tools. No uploads, no data collection, works offline.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.className} antialiased bg-neutral-50`}
      >
        {children}
      </body>
    </html>
  );
}
