'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { Professional, Service, Review } from '@/types';
import Link from 'next/link';
import { Header, Carrusel, Servicios, ContactoYRedes, Resenas, Footer } from '@/components/professionalPage';

interface ReviewWithClient extends Review {
  appointment?: {
    service?: {
      name: string;
    };
  };
}

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
      // Cargar profesional
      const { data: professionalData, error: professionalError } = await supabase
        .from('professionals')
        .select('*')
        .eq('slug', slug)
        .single();

      if (professionalError || !professionalData) {
        console.error('Professional not found');
        return;
      }

      setProfessional(professionalData);

      console.log('Professional data loaded:', professionalData);

      // Cargar servicios
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('professional_id', professionalData.id)
        .order('created_at', { ascending: true });

      setServices(servicesData || []);

      // Cargar reseñas
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(
          `
          *,
          appointment:appointments(
            service:services(name)
          )
        `,
        )
        .eq('professional_id', professionalData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const reviews = reviewsData || [];
      setReviews(reviews);

      // Calcular promedio de calificaciones
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / reviews.length);
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header professional={professional} slug={slug} />
      <Carrusel professional={professional} />
      <Servicios services={services} slug={slug} />
      <ContactoYRedes professional={professional} />
      <Resenas reviews={reviews} averageRating={averageRating} />
      <Footer />
    </div>
  );
}
