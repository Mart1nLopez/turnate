'use client';

import { TbStar, TbStarFilled, TbUser } from 'react-icons/tb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  client_name: string;
  created_at: string;
  appointment?: {
    service?: {
      name: string;
    };
  };
}

interface ResenasProps {
  reviews: Review[];
  averageRating: number;
}

export default function Reviews({ reviews, averageRating }: ResenasProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= Math.round(rating) ?
              <TbStarFilled className="h-4 w-4 text-yellow-400" />
            : <TbStar className="h-4 w-4 text-gray-300" />}
          </div>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section id="reseñas" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Reseñas de clientes</h2>
          <p className="text-lg text-muted-foreground">Conoce la experiencia de otros clientes</p>
        </div>

        {reviews.length === 0 ?
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <div className="mb-6">
                <TbStar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Aún no hay reseñas</h3>
              <p className="text-muted-foreground">Sé el primero en dejar una reseña después de tu cita</p>
            </CardContent>
          </Card>
        : <>
            {/* Rating Summary */}
            <Card className="max-w-md mx-auto mb-12">
              <CardHeader>
                <CardTitle className="text-center">Calificación general</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold text-primary mb-4">{averageRating.toFixed(1)}</div>
                <div className="flex items-center justify-center mb-4 scale-120">{renderStars(averageRating)}</div>
                <p className="text-muted-foreground">
                  Basado en {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
                </p>
              </CardContent>
            </Card>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <Card key={review.id} className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <TbUser className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{review.client_name}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">{renderStars(review.rating)}</div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {review.comment && (
                      <blockquote className="text-muted-foreground italic border-l-4 border-primary/20 pl-4 mb-4">
                        &quot;{review.comment}&quot;
                      </blockquote>
                    )}

                    {review.appointment?.service?.name && (
                      <div className="inline-flex items-center px-2 py-1 bg-primary/10 rounded-full">
                        <span className="text-xs font-medium text-primary">{review.appointment.service.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        }
      </div>
    </section>
  );
};
