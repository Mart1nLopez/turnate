'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  TbUser,
  TbPhone,
  TbMail,
  TbCalendar,
  TbClock,
  TbX,
  TbArrowLeft,
  TbCheck,
  TbNotes,
  TbBrandWhatsapp,
  TbCopy,
} from 'react-icons/tb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { getCurrentProfessional } from '@/lib/supabase';
import {
  getAppointmentById,
  cancelAppointmentByProfessional,
  completeAppointment,
  AppointmentWithDetails,
} from '@/services/appointmentService';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

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
      const data = await getAppointmentById(appointmentId, professional.id);
      if (!data) {
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
      if (!appointment.client || !appointment.service) {
        toast.error('No se encontraron los datos necesarios para enviar la notificación');
        return;
      }
      const { professional } = await getCurrentProfessional();
      if (!professional) {
        toast.error('Error al obtener datos del profesional');
        return;
      }
      await cancelAppointmentByProfessional(appointment.id);
      // Notificación por email (igual que antes)
      try {
        const startDateTime = new Date(appointment.start_time);
        const formattedDate = startDateTime.toISOString().split('T')[0];
        const formattedTime = startDateTime.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const dataToSend = {
          action: 'cancel',
          clientName: appointment.client.name,
          clientEmail: appointment.client.email,
          service: appointment.service.name,
          date: formattedDate,
          time: formattedTime,
          professionalName: professional.name,
        };
        const formBody = Object.entries(dataToSend)
          .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
          .join('&');
        const response = await fetch(process.env.NEXT_PUBLIC_GOOGLEAPP_SCRIPT!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody,
        });
        const result = await response.text();
        console.log('Respuesta del script de cancelación:', result);
      } catch (emailError) {
        console.error('Error enviando notificación de cancelación:', emailError);
        toast.warning('Cita cancelada, pero no se pudo enviar la notificación por email');
      }
      setAppointment((prev) => (prev ? { ...prev, status: 'cancelled_by_pro' } : null));
      toast.success('Cita cancelada exitosamente y notificación enviada al cliente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error al cancelar la cita');
    }
  };

  const completeAppointmentHandler = async () => {
    if (!appointment) return;
    const confirmed = await confirm({
      title: '¿Marcar cita como completada?',
      description:
        'La cita será marcada como completada y se enviará un email al cliente para que pueda dejar una reseña.',
      confirmText: 'Marcar completada',
      cancelText: 'Cancelar',
      variant: 'default',
    });
    if (!confirmed) return;
    try {
      if (!appointment.client || !appointment.service || !appointment.review_token) {
        toast.error('No se encontraron los datos necesarios para enviar el email de reseña');
        return;
      }
      const { professional } = await getCurrentProfessional();
      if (!professional) {
        toast.error('Error al obtener datos del profesional');
        return;
      }
      await completeAppointment(appointment.id);
      try {
        const startDateTime = new Date(appointment.start_time);
        const dateOnly = startDateTime.toISOString().split('T')[0];
        const formattedTime = startDateTime.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const dataToSend = {
          action: 'review_request',
          clientName: appointment.client.name,
          clientEmail: appointment.client.email,
          service: appointment.service.name,
          date: dateOnly,
          time: formattedTime,
          professionalName: professional.name,
          appointmentId: appointment.id,
          reviewToken: appointment.review_token,
          appUrl: window.location.origin,
        };
        const formBody = Object.entries(dataToSend)
          .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
          .join('&');
        const response = await fetch(process.env.NEXT_PUBLIC_GOOGLEAPP_SCRIPT!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody,
        });
        const result = await response.text();
        console.log('Respuesta del script de reseña:', result);
      } catch (emailError) {
        console.error('Error enviando email de reseña:', emailError);
        toast.warning('Cita completada, pero no se pudo enviar el email de reseña');
      }
      setAppointment((prev) => (prev ? { ...prev, status: 'completed' } : null));
      toast.success('Cita marcada como completada y email de reseña enviado al cliente');
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast.error('Error al completar la cita');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Confirmada
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
            <TbCheck className="w-4 h-4 mr-1" />
            Completada
          </span>
        );
      case 'cancelled_by_pro':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
            <TbX className="w-4 h-4 mr-1" />
            Cancelada por profesional
          </span>
        );
      case 'cancelled_by_client':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
            <TbX className="w-4 h-4 mr-1" />
            Cancelada por cliente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
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
  const canComplete = appointment.status === 'confirmed' && new Date(appointment.start_time) <= new Date();
  const isPastAppointment = new Date(appointment.start_time) < new Date();
  const isUpcoming =
    new Date(appointment.start_time) > new Date() &&
    new Date(appointment.start_time).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000; // Próximas 24 horas

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado al portapapeles`);
    });
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-4">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/citas')}
                className="bg-white hover:bg-gray-50 border-gray-300">
                <TbArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    Cita - {appointment.service?.name || 'Servicio eliminado'}
                  </h1>
                  {isUpcoming && appointment.status === 'confirmed' && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200 animate-pulse">
                      Próxima
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-gray-600">
                  {appointment.client?.name || 'Cliente sin nombre'} • {date} {time}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {getStatusBadge(appointment.status)}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {canComplete && (
                  <Button
                    onClick={completeAppointmentHandler}
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    <TbCheck className="w-4 h-4 mr-2" />
                    <span className="sm:inline">Marcar Completada</span>
                  </Button>
                )}
                {canCancel && (
                  <Button onClick={cancelAppointment} variant="destructive" size="sm" className="w-full sm:w-auto">
                    <TbX className="w-4 h-4 mr-2" />
                    <span className="sm:inline">Cancelar Cita</span>
                  </Button>
                )}
              </div>
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
                  <div className="flex items-start justify-between mt-1">
                    <div className="flex items-start flex-1 mr-3">
                      <TbMail className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-900 break-all text-sm sm:text-base">
                        {appointment.client?.email || 'Sin email'}
                      </p>
                    </div>
                    {appointment.client?.email && (
                      <Button
                        onClick={() => copyToClipboard(appointment.client!.email, 'Email')}
                        variant="ghost"
                        size="sm"
                        className="ml-2 p-1 h-6 w-6">
                        <TbCopy className="w-6 h-6" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center flex-1">
                      <TbPhone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                      <p className="text-gray-900 text-sm sm:text-base">
                        {appointment.client?.phone || 'Sin teléfono'}
                      </p>
                    </div>
                    {appointment.client?.phone && (
                      <Button
                        onClick={() => copyToClipboard(appointment.client!.phone, 'Teléfono')}
                        variant="ghost"
                        size="sm"
                        className="ml-2 p-1 h-6 w-6">
                        <TbCopy className="w-6 h-6" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {appointment.client?.phone && (
                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => {
                      const phone = appointment.client?.phone?.replace(/\D/g, '');
                      window.open(`https://wa.me/${phone}`, '_blank');
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                    <TbBrandWhatsapp className="w-4 h-4 mr-2" />
                    Contactar por WhatsApp
                  </Button>
                  <Button
                    onClick={() => window.open(`tel:${appointment.client?.phone}`, '_self')}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto ml-0 sm:ml-2">
                    <TbPhone className="w-4 h-4 mr-2" />
                    Llamar
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
                  <p className="text-gray-700 mt-1 text-sm sm:text-base break-words">
                    {appointment.service.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Duración</label>
                  <div className="flex items-center mt-1">
                    <TbClock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
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
                <div
                  className={`text-center p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
                    isPastAppointment ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}>
                  <TbCalendar
                    className={`w-8 h-8 mx-auto mb-3 ${isPastAppointment ? 'text-gray-400' : 'text-blue-600'}`}
                  />
                  <label className="text-sm font-medium text-gray-700 block">Fecha</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1 capitalize break-words">{date}</p>
                </div>

                <div
                  className={`text-center p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
                    isPastAppointment ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200 hover:bg-green-100'
                  }`}>
                  <TbClock
                    className={`w-8 h-8 mx-auto mb-3 ${isPastAppointment ? 'text-gray-400' : 'text-green-600'}`}
                  />
                  <label className="text-sm font-medium text-gray-700 block">Hora de inicio</label>
                  <p className={`text-xl font-bold mt-1 ${isPastAppointment ? 'text-gray-600' : 'text-green-700'}`}>
                    {time}
                  </p>
                </div>

                <div
                  className={`text-center p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
                    isPastAppointment ? 'bg-gray-50 border-gray-200' : (
                      'bg-orange-50 border-orange-200 hover:bg-orange-100'
                    )
                  }`}>
                  <TbClock
                    className={`w-8 h-8 mx-auto mb-3 ${isPastAppointment ? 'text-gray-400' : 'text-orange-600'}`}
                  />
                  <label className="text-sm font-medium text-gray-700 block">Hora de fin</label>
                  <p className={`text-xl font-bold mt-1 ${isPastAppointment ? 'text-gray-600' : 'text-orange-700'}`}>
                    {endTime}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        {appointment.notes && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <TbNotes className="w-5 h-5 mr-2" />
                Notas de la Cita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        
        <ConfirmDialog />
      </div>
    </div>
  );
}
