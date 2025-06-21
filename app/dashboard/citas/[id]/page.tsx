'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TbUser, TbPhone, TbMail, TbCalendar, TbClock, TbX, TbArrowLeft } from 'react-icons/tb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { Appointment, Service, Client } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

type AppointmentWithDetails = Appointment & {
  service?: Service;
  client?: Client;
};

export default function CitaDetalleePage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const appointmentId = params.id as string;
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const loadAppointment = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          service:services(name, price, duration_minutes, description),
          client:clients(name, email, phone)
        `,
        )
        .eq('id', appointmentId)
        .eq('professional_id', professional.id)
        .single();

      if (error) {
        console.error('Error loading appointment:', error);
        router.push('/dashboard/citas');
        return;
      }

      setAppointment(data);
    } catch (error) {
      console.error('Error:', error);
      router.push('/dashboard/citas');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, router]);

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId, loadAppointment]);

  const cancelAppointment = async () => {
    if (!appointment) return;

    const confirmed = await confirm({
      title: '¿Cancelar esta cita?',
      description:
        'La cita será marcada como cancelada por el profesional. Esta acción se puede revertir más tarde si es necesario.',
      confirmText: 'Cancelar cita',
      cancelText: 'Mantener cita',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled_by_pro' })
        .eq('id', appointment.id);

      if (error) throw error;

      setAppointment((prev) => (prev ? { ...prev, status: 'cancelled_by_pro' } : null));
      toast.success('Cita cancelada exitosamente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error al cancelar la cita');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Confirmada
          </span>
        );
      case 'cancelled_by_pro':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando cita..." />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cita no encontrada</p>
        <Button onClick={() => router.push('/dashboard/citas')} className="mt-4">
          Volver a Citas
        </Button>
      </div>
    );
  }

  const { date, time } = formatDateTime(appointment.start_time);
  const { time: endTime } = formatDateTime(appointment.end_time);
  const canCancel = appointment.status === 'confirmed' && new Date(appointment.start_time) > new Date();

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="space-y-4">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/citas')}>
              <TbArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Detalle de Cita</h1>
              <p className="text-sm sm:text-base text-gray-600">Información completa de la cita</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {getStatusBadge(appointment.status)}
            {canCancel && (
              <Button onClick={cancelAppointment} variant="destructive" size="sm" className="w-full sm:w-auto">
                <TbX className="w-4 h-4 mr-2" />
                <span className="sm:inline">Cancelar Cita</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TbUser className="w-5 h-5 mr-2" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <p className="text-base sm:text-lg text-gray-900 mt-1 break-words">
                {appointment.client?.name || 'Sin nombre'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="flex items-start mt-1">
                  <TbMail className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-900 break-all text-sm sm:text-base">
                    {appointment.client?.email || 'Sin email'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <div className="flex items-center mt-1">
                  <TbPhone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-900 text-sm sm:text-base">{appointment.client?.phone || 'Sin teléfono'}</p>
                </div>
              </div>
            </div>

            {appointment.client?.phone && (
              <div className="pt-2">
                <Button
                  onClick={() => {
                    const phone = appointment.client?.phone?.replace(/\D/g, '');
                    window.open(`https://wa.me/56${phone}`, '_blank');
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto">
                  Contactar por WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TbCalendar className="w-5 h-5 mr-2" />
              Información del Servicio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Servicio</label>
              <p className="text-base sm:text-lg text-gray-900 mt-1 break-words">
                {appointment.service?.name || 'Servicio eliminado'}
              </p>
            </div>

            {appointment.service?.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <p className="text-gray-700 mt-1 text-sm sm:text-base break-words">{appointment.service.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Duración</label>
                <div className="flex items-center mt-1">
                  <TbClock className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-900 text-sm sm:text-base">
                    {appointment.service?.duration_minutes || 0} minutos
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Precio</label>
                <div className="flex items-center mt-1">
                  <p className="text-lg sm:text-xl font-bold text-green-600">
                    {formatCurrency(appointment.service?.price || 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TbClock className="w-5 h-5 mr-2" />
              Fecha y Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <TbCalendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
                <label className="text-sm font-medium text-gray-700 block">Fecha</label>
                <p className="text-sm sm:text-lg font-semibold text-gray-900 mt-1 capitalize break-words">{date}</p>
              </div>

              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <TbClock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
                <label className="text-sm font-medium text-gray-700 block">Hora de inicio</label>
                <p className="text-lg sm:text-xl font-bold text-green-700 mt-1">{time}</p>
              </div>

              <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                <TbClock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-orange-600" />
                <label className="text-sm font-medium text-gray-700 block">Hora de fin</label>
                <p className="text-lg sm:text-xl font-bold text-orange-700 mt-1">{endTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 text-sm text-gray-600">
            <div className="break-words">
              <span className="font-medium">ID de la cita:</span>
              <span className="ml-1 break-all">{appointment.id}</span>
            </div>
            <div>
              <span className="font-medium">Creada el:</span>{' '}
              {new Date(appointment.created_at).toLocaleDateString('es-CL')}
            </div>
            <div>
              <span className="font-medium">Estado:</span> {appointment.status}
            </div>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}
