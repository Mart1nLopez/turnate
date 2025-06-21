'use client';

import { useEffect, useState, useCallback } from 'react';
import { TbStar, TbUser, TbCalendar, TbStarFilled, TbMessage } from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { Review } from '@/types';

interface ReviewWithDetails extends Review {
  appointment?: {
    start_time: string;
    service?: {
      name: string;
    };
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export default function ResenasPage() {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          *,
          appointment:appointments(
            start_time,
            service:services(name)
          )
        `,
        )
        .eq('professional_id', professional.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = data || [];
      setReviews(reviewsData);
      calculateStats(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const calculateStats = (reviewsData: ReviewWithDetails[]) => {
    const totalReviews = reviewsData.length;

    if (totalReviews === 0) {
      setStats({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      return;
    }

    const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewsData.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      }
    });

    setStats({
      totalReviews,
      averageRating,
      ratingDistribution,
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <span className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= rating ?
              <TbStarFilled className={`${sizeClasses[size]} text-yellow-400`} />
            : <TbStar className={`${sizeClasses[size]} text-gray-300`} />}
          </span>
        ))}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando reseñas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reseñas y Calificaciones</h1>
        <p className="text-gray-600">Opiniones de tus clientes</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">{stats.totalReviews}</CardTitle>
            <CardDescription>Total de reseñas</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className={`text-3xl font-bold ${getRatingColor(stats.averageRating)}`}>
              {stats.averageRating.toFixed(1)}
            </CardTitle>
            <CardDescription>
              <span className="flex items-center justify-center mt-2">
                {renderStars(Math.round(stats.averageRating), 'lg')}
              </span>
              Calificación promedio
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución</CardTitle>
            <CardDescription>Desglose por estrellas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating];
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm w-3">{rating}</span>
                  <TbStarFilled className="h-3 w-3 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Reseñas</CardTitle>
          <CardDescription>
            {reviews.length === 0 ?
              'Aún no tienes reseñas de clientes'
            : `${reviews.length} ${reviews.length === 1 ? 'reseña' : 'reseñas'} de clientes`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ?
            <div className="text-center py-12">
              <TbMessage className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No tienes reseñas aún</p>
              <p className="text-sm text-gray-400">Tus clientes podrán dejar reseñas después de sus citas</p>
            </div>
          : <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full flex-shrink-0">
                      <TbUser className="h-5 w-5 text-gray-600" />
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{review.client_name}</h4>
                          <div className="flex items-center mt-1">
                            {renderStars(review.rating)}
                            <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center">
                            <TbCalendar className="h-3 w-3 mr-1" />
                            {formatDate(review.created_at)}
                          </div>
                          {review.appointment?.service && (
                            <div className="mt-1">Servicio: {review.appointment.service.name}</div>
                          )}
                        </div>
                      </div>

                      {review.comment && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-700 text-sm leading-relaxed">&quot;{review.comment}&quot;</p>
                        </div>
                      )}

                      {!review.comment && (
                        <p className="text-gray-500 text-sm italic">El cliente no dejó comentarios adicionales</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      {/* Tips Card */}
      {stats.totalReviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💡 Consejos para mejorar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              {stats.averageRating < 4 && (
                <li>• Considera pedir feedback directo a tus clientes para identificar áreas de mejora</li>
              )}
              <li>• Responde siempre de manera profesional y agradece los comentarios</li>
              <li>• Las reseñas positivas ayudan a atraer nuevos clientes</li>
              <li>• Considera implementar mejoras basadas en los comentarios recurrentes</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
