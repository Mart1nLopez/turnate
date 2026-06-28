'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import {
  getProfessionalBySlug,
  getServicesByProfessionalId,
  getReviewsByProfessionalId,
  getActiveBarbershopByProfessionalId,
  ReviewWithClient,
} from '@/services/professionalPublicService';
import { Professional, Service } from '@/types';
import Link from 'next/link';
import Contacto from '@/components/professionalPage/Contact';
import Header from '@/components/professionalPage/Header';
import Hero from '@/components/professionalPage/Hero';
import Services from '@/components/professionalPage/Services';
import Reviews from '@/components/professionalPage/Reviews';
import Footer from '@/components/professionalPage/Footer';
import { getThemeById, getThemeCssVars } from '@/lib/barbershopThemes';

export default function ProfessionalPublicPage() {
  const params = useParams();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<ReviewWithClient[]>([]);
  const [barbershop, setBarbershop] = useState<{ name: string; slug: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const slug = params.slug as string;

  const loadProfessionalData = useCallback(async () => {
    try {
      const professionalData = await getProfessionalBySlug(slug);
      setProfessional(professionalData);
      const [servicesData, reviewsData, barbershopData] = await Promise.all([
        getServicesByProfessionalId(professionalData.id),
        getReviewsByProfessionalId(professionalData.id, 10),
        getActiveBarbershopByProfessionalId(professionalData.id),
      ]);
      setServices(servicesData);
      setReviews(reviewsData);
      setBarbershop(barbershopData);
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / reviewsData.length);
      }
    } catch (error) {
      console.error('Error loading professional data:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      loadProfessionalData();
    }
  }, [slug, loadProfessionalData]);

  // Derive theme CSS vars from the professional's chosen theme.
  // getThemeById falls back to 'luxury-gold' when professional is null (loading)
  // or when theme is unset — so the loading skeleton and the page share the same palette.
  const theme    = getThemeById(professional?.theme);
  const themeVars = getThemeCssVars(theme) as unknown as React.CSSProperties;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.backgroundColor }}>
        <LoadingSpinner size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.backgroundColor }}>
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#F7F7F7' }}>
            Profesional no encontrado
          </h1>
          <p className="mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
            El enlace que seguiste no es válido o el profesional no existe.
          </p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasReviews     = reviews.length > 0 && !professional.hide_reviews;
  const socialLinks    = professional.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((value) => value);
  const hasLocationInfo = professional.map_embed_url || professional.location;
  const hasBio          = professional.bio;
  const hasContactInfo  = !!(hasLocationInfo || hasSocialLinks || hasBio);

  return (
    <div
      className="min-h-screen"
      style={{ background: theme.backgroundColor, ...themeVars }}
    >
      <Header
        professional={professional}
        slug={slug}
        hasReviews={hasReviews}
        hasContactInfo={hasContactInfo}
        barbershop={barbershop}
      />
      <Hero
        professional={professional}
        slug={slug}
        averageRating={averageRating}
        reviewCount={reviews.length}
        servicesCount={services.length}
      />
      <Services services={services} slug={slug} />
      <Contacto professional={professional} />
      <Reviews reviews={reviews} averageRating={averageRating} hideReviews={professional.hide_reviews} />
      <Footer />
    </div>
  );
}
