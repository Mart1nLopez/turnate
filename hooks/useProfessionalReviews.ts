import { useEffect, useState, useCallback } from 'react';
import { getProfessionalReviews, getProfessionalReviewStats } from '@/services/reviewService';
import { getProfessionalProfile, updateProfessionalProfile } from '@/services/professionalService';
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

export function useProfessionalReviews() {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideReviews, setHideReviews] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewsData, profile] = await Promise.all([getProfessionalReviews(), getProfessionalProfile()]);
      setReviews(reviewsData);
      const statsData = await getProfessionalReviewStats(reviewsData);
      setStats(statsData);
      setHideReviews(profile.hide_reviews || false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Error al cargar reseñas');
      } else {
        setError('Error al cargar reseñas');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleHideReviews = useCallback(async (checked: boolean) => {
    try {
      const profile = await getProfessionalProfile();
      await updateProfessionalProfile(profile.id, { hide_reviews: checked });
      setHideReviews(checked);
    } catch (err) {
      console.error('Error updating hide_reviews:', err);
      throw err; // O manejar el error
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return { reviews, stats, loading, error, reload: loadReviews, hideReviews, toggleHideReviews };
}
