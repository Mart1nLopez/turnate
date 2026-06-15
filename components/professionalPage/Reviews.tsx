'use client';

import { TbStarFilled, TbStar } from 'react-icons/tb';

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

interface ReviewsProps {
  reviews: Review[];
  averageRating: number;
  hideReviews?: boolean;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) =>
        star <= Math.round(rating) ? (
          <TbStarFilled key={star} className="w-3.5 h-3.5" style={{ color: 'var(--pp-accent)' }} />
        ) : (
          <TbStar key={star} className="w-3.5 h-3.5" style={{ color: 'var(--pp-border)' }} />
        ),
      )}
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Reviews({ reviews, averageRating, hideReviews = false }: ReviewsProps) {
  if (hideReviews) return null;

  return (
    <section
      id="reseñas"
      className="py-20 sm:py-28 px-6"
      style={{ background: 'var(--pp-bg)' }}
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-12 sm:mb-14">
          <p
            className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: 'var(--pp-accent)' }}
          >
            Reseñas
          </p>

          {/* Title + rating inline */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
            <div>
              <h2
                className="text-3xl sm:text-4xl font-bold mb-4"
                style={{ color: 'var(--pp-text)' }}
              >
                Lo que dicen los clientes
              </h2>
              <div
                className="w-10 h-px"
                style={{ background: 'var(--pp-accent)', opacity: 0.45 }}
                aria-hidden="true"
              />
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-3 pb-1">
                <span
                  className="text-4xl font-bold leading-none"
                  style={{ color: 'var(--pp-accent)' }}
                >
                  {averageRating.toFixed(1)}
                </span>
                <div>
                  <Stars rating={averageRating} />
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--pp-muted)' }}
                  >
                    {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Empty state — minimal, no giant card */}
        {reviews.length === 0 && (
          <div className="py-12 text-center">
            <div
              className="w-10 h-px mx-auto mb-8"
              style={{ background: 'var(--pp-accent)', opacity: 0.25 }}
              aria-hidden="true"
            />
            <p
              className="text-sm font-medium mb-2"
              style={{ color: 'var(--pp-muted)' }}
            >
              Sin reseñas aún
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--pp-muted)', opacity: 0.6 }}
            >
              Las reseñas de clientes aparecerán aquí después de cada cita.
            </p>
          </div>
        )}

        {/* Reviews grid */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl p-6 flex flex-col gap-4 border"
                style={{ background: 'var(--pp-surface)', borderColor: 'var(--pp-border)' }}
              >
                {/* Top row: initials + name + stars */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold select-none"
                      style={{ background: 'var(--pp-accent-sub)', color: 'var(--pp-accent)' }}
                    >
                      {review.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--pp-text)' }}
                      >
                        {review.client_name}
                      </p>
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: 'var(--pp-muted)', opacity: 0.7 }}
                      >
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    <Stars rating={review.rating} />
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p
                    className="text-sm leading-relaxed flex-1"
                    style={{ color: 'var(--pp-muted)' }}
                  >
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                {/* Service badge */}
                {review.appointment?.service?.name && (
                  <span
                    className="inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--pp-accent-sub)',
                      color:      'var(--pp-accent)',
                    }}
                  >
                    {review.appointment.service.name}
                  </span>
                )}
              </article>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
