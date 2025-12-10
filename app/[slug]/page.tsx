'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import {
  getProfessionalBySlug,
  getServicesByProfessionalId,
  getReviewsByProfessionalId,
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

export default function ProfessionalPublicPage() {
  const params = useParams();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<ReviewWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const slug = params.slug as string;

  const loadProfessionalData = useCallback(async () => {
    try {
      const professionalData = await getProfessionalBySlug(slug);
      setProfessional(professionalData);
      const [servicesData, reviewsData] = await Promise.all([
        getServicesByProfessionalId(professionalData.id),
        getReviewsByProfessionalId(professionalData.id, 10),
      ]);
      setServices(servicesData);
      setReviews(reviewsData);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profesional no encontrado</h1>
          <p className="text-gray-600 mb-4">El enlace que seguiste no es válido o el profesional no existe.</p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Lógica para determinar si se deben mostrar las secciones en el header
  const hasReviews = reviews.length > 0 && !professional.hide_reviews;

  const socialLinks = professional.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((value) => value);
  const hasLocationInfo = professional.map_embed_url || professional.location;
  const hasBio = professional.bio;
  const hasContactInfo = !!(hasLocationInfo || hasSocialLinks || hasBio);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header
        professional={professional}
        slug={slug}
        hasReviews={hasReviews}
        hasContactInfo={hasContactInfo}
      />
      <Hero professional={professional} />
      <Services services={services} slug={slug} />
      <Contacto professional={professional} />
      <Reviews reviews={reviews} averageRating={averageRating} hideReviews={professional.hide_reviews} />
      <Footer />
    </div>
  );
}
