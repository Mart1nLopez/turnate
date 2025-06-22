'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TbStar, TbStarFilled, TbUser, TbCalendar, TbCheck } from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { Appointment, Professional, Service, Client } from '@/types';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface ReviewFormData {
  clientName: string;
  rating: number;
  comment: string;
}

type AppointmentWithDetails = Appointment & {
  professional?: Professional;
  service?: Service;
  client?: Client;
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    clientName: '',
    rating: 0,
    comment: '',
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  const loadAppointment = useCallback(async () => {
    try {
      if (!appointmentId) {
        router.push('/');
        return;
      }

      // Obtener la cita con todos los detalles
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(
          `
          *,
          professional:professionals(*),
          service:services(*),
          client:clients(*)
        `,
        )
        .eq('id', appointmentId)
        .eq('status', 'confirmed')
        .single();

      if (appointmentError || !appointmentData) {
        console.error('Error loading appointment:', appointmentError);
        router.push('/');
        return;
      }

      // Verificar que la cita ya haya pasado
      const appointmentDate = new Date(appointmentData.end_time);
      const now = new Date();

      if (appointmentDate > now) {
        // La cita aún no ha ocurrido
        router.push('/');
        return;
      }

      setAppointment(appointmentData);
      setFormData((prev) => ({
        ...prev,
        clientName: appointmentData.client?.name || '',
      }));

      // Verificar si ya existe una reseña para esta cita
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single();

      if (reviewData) {
        setExistingReview(true);
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, router]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.clientName.trim()) {
      errors.push('El nombre es requerido');
    }

    if (formData.rating === 0) {
      errors.push('Debes seleccionar una calificación');
    }

    if (formData.comment.trim().length > 500) {
      errors.push('El comentario no puede exceder 500 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment) return;

    // Validar formulario
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase.from('reviews').insert({
        appointment_id: appointmentId,
        professional_id: appointment.professional!.id,
        client_name: formData.clientName.trim(),
        rating: formData.rating,
        comment: formData.comment.trim() || null,
      });

      if (submitError) throw submitError;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting review:', error);

      let errorMessage = 'Error al enviar la reseña. Por favor intenta nuevamente.';

      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          errorMessage = 'Ya has dejado una reseña para esta cita.';
        }
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Cargando información..." />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cita no encontrada</h1>
          <p className="text-gray-600 mb-6">
            No se pudo encontrar la cita o no estás autorizado para dejar una reseña.
          </p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <TbCheck className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reseña ya enviada</h2>
              <p className="text-gray-600 mb-6">Ya has dejado una reseña para esta cita. ¡Gracias por tu feedback!</p>
              <Link href={`/${appointment.professional!.slug}`}>
                <Button>Ver perfil del profesional</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <TbCheck className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reseña enviada!</h2>
              <p className="text-gray-600 mb-6">
                Gracias por tomarte el tiempo de dejar tu opinión. Tu reseña ayuda a otros clientes y al profesional a
                mejorar.
              </p>
              <div className="space-y-3">
                <Link href={`/${appointment.professional!.slug}`}>
                  <Button className="w-full">Ver perfil del profesional</Button>
                </Link>
                <Link href={`/${appointment.professional!.slug}/agendar`}>
                  <Button variant="outline" className="w-full">
                    Agendar otra cita
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Deja tu reseña</h1>
            <p className="text-gray-600">Comparte tu experiencia con {appointment.professional!.name}</p>
          </div>

          {/* Appointment Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalles de tu cita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <TbUser className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Profesional:</span>
                    <p className="font-medium">{appointment.professional!.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <TbCalendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Fecha y hora:</span>
                    <p className="font-medium">{formatDate(appointment.start_time)}</p>
                  </div>
                </div>

                {appointment.service && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-600 rounded"></div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Servicio:</span>
                      <p className="font-medium">
                        {appointment.service.name} - {formatCurrency(appointment.service.price)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Review Form */}
          <Card>
            <CardHeader>
              <CardTitle>Tu opinión</CardTitle>
              <CardDescription>Tu reseña será visible públicamente y ayudará a otros clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tu nombre *</label>
                  <Input
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    placeholder="Ingresa tu nombre"
                    required
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Calificación *</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 transition-transform hover:scale-110">
                        {star <= (hoveredRating || formData.rating) ?
                          <TbStarFilled className="w-8 h-8 text-yellow-400" />
                        : <TbStar className="w-8 h-8 text-gray-300" />}
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {formData.rating > 0 && (
                        <>
                          {formData.rating} de 5 estrella{formData.rating !== 1 ? 's' : ''}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comentario (opcional)</label>
                  <Textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    placeholder="Comparte los detalles de tu experiencia..."
                    rows={4}
                    className="resize-none"
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      Describe qué te gustó más, cómo fue la atención, el ambiente, etc.
                    </p>
                    <p className="text-xs text-gray-400">{formData.comment.length}/500</p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting || formData.rating === 0 || !formData.clientName.trim()}
                  className="w-full">
                  {submitting ? 'Enviando reseña...' : 'Enviar reseña'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
