import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/lib/context/ToastContext';
import { UserProvider } from '@/lib/context/UserContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NearVibe — Discover nearby. Connect locally. Build community.',
  description:
    'NearVibe is the premier hyperlocal event discovery and community platform for hackathons, workshops, meetups, startup mixers, and conferences across Delhi NCR.',
  keywords: [
    'NearVibe',
    'Hackathons Delhi NCR',
    'Tech meetups Noida',
    'Gurugram startup events',
    'College workshops',
    'Hyperlocal discovery',
  ],
  authors: [{ name: 'Saransh Gupta' }],
  openGraph: {
    title: 'NearVibe — Hyperlocal Event Discovery',
    description: 'Find hackathons, workshops, and meetups happening near you in Delhi NCR.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
        <ToastProvider>
          <UserProvider>
            <React.Suspense fallback={<div className="h-16 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800" />}>
              <Navbar />
            </React.Suspense>
            <main className="flex-1 w-full flex flex-col">{children}</main>
            <Footer />
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
