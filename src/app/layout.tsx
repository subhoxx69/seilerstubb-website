import { Metadata } from 'next';
import './globals.css';
import './scripts.js'; // Import client-side scripts
import { Inter, Playfair_Display, Crimson_Text } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/layout/providers';
import Navbar from '@/components/navigation/navbar';
import PageLoader from '@/components/layout/page-loader';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { ConditionalFooter } from '@/components/layout/conditional-footer';
import CookieConsent from '@/components/shared/cookie-consent';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair',
  display: 'swap'
});
const crimson = Crimson_Text({ 
  subsets: ['latin'], 
  variable: '--font-crimson',
  weight: ['400', '600', '700'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Seilerstubb Restaurant - Authentische Deutsche & Indische Küche in Wiesbaden',
  description: 'Seilerstubb Restaurant in Wiesbaden: Authentische deutsche und indische Küche, frisch zubereitet. Reservieren Sie online, Top-Bewertungen, Seilerpfad 4.',
  keywords: 'Restaurant Wiesbaden, Deutsche Küche, Indische Küche, Reservierung, Wiesbaden Restaurants, Deutsches Essen, Indisches Essen, Seilersttubb',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  alternates: {
    canonical: 'https://www.seilerstubb.com/',
  },
  openGraph: {
    title: 'Seilerstubb Restaurant - Deutsche & Indische Küche',
    description: 'Authentische deutsche und indische Küche in Wiesbaden. Reservieren Sie jetzt!',
    type: 'website',
    locale: 'de_DE',
    url: 'https://www.seilerstubb.com/',
    siteName: 'Seilerstubb Restaurant',
    images: [
      {
        url: 'https://www.seilerstubb.com/images/Logo/Logo seilerstubb.png',
        width: 1200,
        height: 630,
        alt: 'Seilerstubb Restaurant Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seilerstubb Restaurant',
    description: 'Authentische deutsche und indische Küche in Wiesbaden',
    images: ['https://www.seilerstubb.com/images/Logo/Logo seilerstubb.png'],
  },
  icons: {
    icon: '/images/Logo/Logo seilerstubb.png',
    shortcut: '/images/Logo/Logo seilerstubb.png',
    apple: '/images/Logo/Logo seilerstubb.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD Structured Data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Seilerstubb Restaurant',
    image: 'https://www.seilerstubb.com/images/Logo/Logo seilerstubb.png',
    description: 'Authentische deutsche und indische Küche in Wiesbaden',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Seilerpfad 4',
      addressLocality: 'Wiesbaden',
      addressRegion: 'Hessen',
      postalCode: '65205',
      addressCountry: 'DE'
    },
    telephone: '+49 611 36004940',
    email: 'seilerstubbwiesbaden@gmail.com',
    url: 'https://www.seilerstubb.com/',
    priceRange: '€€',
    cuisine: ['German', 'Indian'],
    servesCuisine: ['Deutsche Küche', 'Indische Küche'],
    sameAs: [
      'https://www.google.com/maps/search/Seilerstubb+Wiesbaden',
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '11:30',
        closes: '23:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '12:00',
        closes: '22:00'
      }
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150'
    }
  };

  return (
    <html lang="de" className="overflow-x-hidden">
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="your-verification-code" />
        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="language" content="German" />
        <meta name="revisit-after" content="7 days" />
        <meta property="og:type" content="website" />
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${playfair.variable} ${crimson.variable} overflow-x-hidden w-full`}>
        <Providers>
          <PageLoader />
          <Navbar hideOnRoutes={['/routes/admin']} />
          <ConditionalLayout excludeRoutes={['/routes/admin']}>
            {children}
          </ConditionalLayout>
          <ConditionalFooter excludeRoutes={['/routes/admin', '/menu', '/reservation', '/gallery', '/contact', '/routes/user']} />
          <CookieConsent />
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
