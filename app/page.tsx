import JsonLd from '@/components/seo/json-ld';
import Header from '@/components/home/Header';
import Hero from '@/components/home/Hero';
import Verticals from '@/components/home/Verticals';
import Benefits from '@/components/home/Benefits';
import Features from '@/components/home/Features';
import Testimonials from '@/components/home/Testimonials';
import FAQ from '@/components/home/FAQ';
import FinalCTA from '@/components/home/FinalCTA';
import Footer from '@/components/home/Footer';

export default function LandingPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Turnate',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'CLP',
          },
          description:
            'Plataforma de gestión de citas para profesionales y empresas. Agenda online, recordatorios automáticos y más.',
          url: 'https://turnate.cl',
          publisher: {
            '@type': 'Organization',
            name: 'Turnate',
            logo: 'https://turnate.cl/logo.png',
          },
        }}
      />
      <main className="min-h-screen bg-background scroll-smooth">
        <Header />
        <Hero />
        <Verticals />
        <Benefits />
        <Features />
        <Testimonials />
        <FAQ />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
