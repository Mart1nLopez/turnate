import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ToasterProvider } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://turnate.cl'),
  title: {
    default: 'Turnate - Gestión de citas para profesionales',
    template: '%s | Turnate',
  },
  description: 'Plataforma integral para gestión de citas, agenda online y recordatorios automáticos para barberías, clínicas, estéticas y profesionales independientes.',
  keywords: ['gestión de citas', 'agenda online', 'reservas', 'barbería', 'clínica', 'estética', 'software de citas', 'turnos online', 'chile'],
  authors: [{ name: 'Turnate Team' }],
  creator: 'Turnate',
  publisher: 'Turnate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Turnate - Gestión de citas para profesionales',
    description: 'Simplifica tu negocio con nuestra plataforma de gestión de citas. Agenda online, recordatorios automáticos y más.',
    url: 'https://turnate.cl',
    siteName: 'Turnate',
    locale: 'es_CL',
    type: 'website',
    images: [
      {
        url: 'img/og-image.png',
        alt: 'Turnate Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Turnate - Gestión de citas para profesionales',
    description: 'Simplifica tu negocio con nuestra plataforma de gestión de citas. Agenda online, recordatorios automáticos y más.',
    images: ['img/og-image.png'],
    creator: '@turnate',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <ToasterProvider />
        <Analytics />
      </body>
    </html>
  );
}
