'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { Appointment, Professional, Service, Client } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { TbCheck, TbX, TbCalendar, TbClock, TbUser } from 'react-icons/tb';
import Link from 'next/link';

type AppointmentWithDetails = Appointment & {
  professional?: Professional;
  service?: Service;
  client?: Client;
};

export default function CancelAppointmentPage() {
  const params = useParams();
  const token = params.token as string;

  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointment = useCallback(async () => {
    try {
      if (!token) {
        setError('Token de cancelación inválido');
        setLoading(false);
        return;
      }

      // Buscar la cita usando el token
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
        .eq('cancellation_token', token)
        .eq('status', 'confirmed')
        .single();

      if (appointmentError || !appointmentData) {
        console.error('Error loading appointment:', appointmentError);
        setError('No se encontró la cita o ya fue cancelada');
        setLoading(false);
        return;
      }

      // Verificar que la cita no haya pasado
      const appointmentDate = new Date(appointmentData.start_time);
      const now = new Date();

      if (appointmentDate < now) {
        setError('No puedes cancelar una cita que ya pasó');
        setLoading(false);
        return;
      }

      // Verificar tiempo mínimo para cancelar (ejemplo: 24 horas antes)
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const minCancelHours = appointmentData.professional?.cancel_hours || 24;

      if (hoursUntilAppointment < minCancelHours) {
        setError(`No puedes cancelar con menos de ${minCancelHours} horas de anticipación`);
        setLoading(false);
        return;
      }

      setAppointment(appointmentData);
    } catch (error) {
      console.error('Error loading appointment:', error);
      setError('Error al cargar la información de la cita');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const handleCancel = async () => {
    if (!appointment) return;

    console.log('Iniciando proceso de cancelación para cita:', appointment?.id);
    setCancelling(true);
    setError(null);

    try {
      // Actualizar el estado de la cita
      console.log('Actualizando estado de la cita en la base de datos...');
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled_by_client',
          cancellation_token: null, // Invalidar el token
        })
        .eq('id', appointment.id);

      if (updateError) {
        console.error('Error actualizando la cita:', updateError);
        throw updateError;
      }

      // Enviar notificación al profesional
      try {
        const formattedDate = new Date(appointment.start_time).toLocaleDateString('es-CL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        const formattedTime = new Date(appointment.start_time).toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const dataToSend = {
          action: 'client_cancel',
          clientName: appointment.client?.name || '',
          clientEmail: appointment.client?.email || '',
          service: appointment.service?.name || '',
          date: formattedDate,
          time: formattedTime,
          professionalName: appointment.professional?.name || '',
          professionalEmail: appointment.professional?.email || '',
        };

        const formBody = Object.entries(dataToSend)
          .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
          .join('&');

        console.log('Enviando datos al Google Apps Script:', dataToSend);
        const response = await fetch(process.env.NEXT_PUBLIC_GOOGLEAPP_SCRIPT!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody,
        });
        console.log('Respuesta del Google Apps Script:', response.status, response.statusText);
      } catch (emailError) {
        console.error('Error enviando notificación al profesional:', emailError);
        // No fallar el proceso si el email falla
      }

      setCancelled(true);
      console.log('Proceso completado, cita cancelada y notificación enviada.');
    } catch (error) {
      console.error('Error general al cancelar la cita:', error);
      setError('Error al cancelar la cita. Por favor intenta nuevamente.');
    } finally {
      setCancelling(false);
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <TbX className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/">
                <Button>Volver al inicio</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <TbCheck className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Cita Cancelada</h2>
              <p className="text-gray-600 mb-6">
                Tu cita ha sido cancelada exitosamente. El profesional ha sido notificado.
              </p>
              <div className="space-y-3">
                <Link href={`/${appointment?.professional?.slug}`}>
                  <Button className="w-full">Ver perfil del profesional</Button>
                </Link>
                <Link href={`/${appointment?.professional?.slug}/agendar`}>
                  <Button variant="outline" className="w-full">
                    Agendar nueva cita
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cita no encontrada</h1>
          <p className="text-gray-600 mb-6">No se pudo encontrar la cita o el enlace de cancelación es inválido.</p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cancelar Cita</h1>
            <p className="text-gray-600">¿Estás seguro de que deseas cancelar esta cita?</p>
          </div>

          {/* Appointment Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalles de tu cita</CardTitle>
              <CardDescription>Esta información se perderá si cancelas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                    <TbClock className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">Servicio:</span>
                      <p className="font-medium">
                        {appointment.service.name} - {formatCurrency(appointment.service.price)}
                      </p>
                      <p className="text-sm text-gray-500">Duración: {appointment.service.duration_minutes} minutos</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <TbUser className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Cliente:</span>
                    <p className="font-medium">{appointment.client?.name}</p>
                    <p className="text-sm text-gray-500">{appointment.client?.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <TbX className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Información importante</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Esta acción no se puede deshacer</li>
                    <li>El profesional será notificado automáticamente</li>
                    <li>Podrás agendar una nueva cita cuando desees</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href={`/${appointment.professional!.slug}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Mantener cita
              </Button>
            </Link>
            <Button onClick={handleCancel} disabled={cancelling} variant="destructive" className="flex-1">
              {cancelling ? 'Cancelando...' : 'Cancelar cita'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
