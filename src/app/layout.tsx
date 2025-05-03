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
  keywords: "image editor, photo editing, compress images, convert images, resize images, crop images, free image tools, browser-based, offline, private",
  authors: [{ name: "PixelPerfect" }],
  category: "Technology",
  creator: "PixelPerfect",
  publisher: "PixelPerfect",
  alternates: {
    canonical: 'https://pixelperfect.vercel.app',
  },
  metadataBase: new URL('https://pixelperfect.vercel.app'),
  openGraph: {
    title: "PixelPerfect | Free Browser-Based Image Editing Tools",
    description: "Transform your images instantly with our free, private, browser-based image editing tools. No uploads, no data collection, works offline.",
    url: 'https://pixelperfect.vercel.app',
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
    creator: '@pixelperfect',
    site: '@pixelperfect',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
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
        className={`${geistSans.className} antialiased bg-neutral-50`}
      >
        {children}
      </body>
    </html>
  );
}
