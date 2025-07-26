import { useState, useCallback } from 'react';
import {
  getAppointmentByReviewToken,
  checkExistingReview,
  submitReview,
  AppointmentWithDetails,
  ReviewFormData,
} from '@/services/reviewService';

export function useReview(token: string) {
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('Token de reseña inválido');
        setLoading(false);
        return;
      }
      const data = await getAppointmentByReviewToken(token);
      setAppointment(data);
      if (data && data.id) {
        const hasReview = await checkExistingReview(Number(data.id));
        setExistingReview(hasReview);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Error al cargar la información de la cita');
      } else {
        setError('Error al cargar la información de la cita');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (formData: ReviewFormData) => {
    if (!appointment) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(appointment, formData);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Error al enviar la reseña. Por favor intenta nuevamente.');
      } else {
        setError('Error al enviar la reseña. Por favor intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    appointment,
    loading,
    submitting,
    submitted,
    existingReview,
    error,
    setError,
    loadAppointment,
    handleSubmit,
    setSubmitted,
  };
}
