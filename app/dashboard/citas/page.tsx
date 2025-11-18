'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { getCurrentProfessional } from '@/lib/supabase';
import { Service } from '@/types';
import {
  getServicesByProfessionalId,
  getAppointmentsByProfessionalId,
  getTotalAppointmentsCount,
  getAppointmentCountsByStatus,
  cancelAppointmentByProfessional,
  completeAppointment,
  AppointmentWithDetails,
} from '@/services/appointmentService';
import AppointmentsByDay from '@/components/dashboard/AppointmentsByDay';
import AdvancedFiltersComponent from '@/components/dashboard/AdvancedFilters';
import AppointmentStats from '@/components/dashboard/AppointmentStats';
import { useAppointmentFilters } from '@/hooks/useAppointmentFilters';

export default function CitasPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [totalAppointmentsCount, setTotalAppointmentsCount] = useState<number | undefined>(undefined);
  const [appointmentCounts, setAppointmentCounts] = useState<
    | {
        confirmed: number;
        completed: number;
        cancelledByPro: number;
        cancelledByClient: number;
      }
    | undefined
  >(undefined);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Usar el hook personalizado para filtros
  const { filters, filteredAppointments, setFilters, clearFilters, getActiveFiltersCount, getFilterDescription } =
    useAppointmentFilters(appointments);

  // Cargar citas de los próximos 30 días
  const loadAppointmentsBasedOnDateFilter = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      // Cargar citas desde hoy hasta 30 días (comportamiento por defecto)
      const appointmentsData = await getAppointmentsByProfessionalId(professional.id);

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Error al cargar las citas');
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      // Cargar servicios y conteos (siempre necesarios)
      const [servicesData, totalCount, statusCounts] = await Promise.all([
        getServicesByProfessionalId(professional.id),
        getTotalAppointmentsCount(professional.id),
        getAppointmentCountsByStatus(professional.id),
      ]);

      setServices(servicesData || []);
      setTotalAppointmentsCount(totalCount);
      setAppointmentCounts(statusCounts);

      // Cargar citas iniciales (próximos 30 días)
      await loadAppointmentsBasedOnDateFilter();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [loadAppointmentsBasedOnDateFilter]);

  // Efecto inicial para cargar datos
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Efecto que reacciona cuando cambia el filtro de fechas
  useEffect(() => {
    // Solo recargar para next_30_days ya que los otros filtros se procesan localmente
    if (filters.dateRange === 'next_30_days') {
      loadAppointmentsBasedOnDateFilter();
    }
  }, [filters.dateRange, loadAppointmentsBasedOnDateFilter]);

  const cancelAppointment = async (appointmentId: string) => {
    const confirmed = await confirm({
      title: '¿Cancelar esta cita?',
      description: 'La cita será marcada como cancelada por el profesional. Esta acción no es reversible.',
      confirmText: 'Cancelar cita',
      cancelText: 'Mantener cita',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      const appointmentToCancel = appointments.find((apt) => apt.id === appointmentId);
      if (!appointmentToCancel || !appointmentToCancel.client || !appointmentToCancel.service) {
        toast.error('No se encontraron los datos necesarios para enviar la notificación');
        return;
      }
      const { professional } = await getCurrentProfessional();
      if (!professional) {
        toast.error('Error al obtener datos del profesional');
        return;
      }
      await cancelAppointmentByProfessional(appointmentId);

      try {
        const { error: syncError } = await supabase.functions.invoke('sync-google-calendar', {
          body: { // <-- Envolver el payload en 'body'
            appointmentId: appointmentId,
            action: 'delete',
          }
        });

        if (syncError) throw syncError;
        console.log('Cita borrada de Google Calendar');
      } catch (syncError) {
        console.warn('Cita cancelada, pero falló la sincro con Google:', syncError);
      }
      
      try {
        const startDateTime = new Date(appointmentToCancel.start_time);
        const formattedDate = startDateTime.toISOString().split('T')[0];
        const formattedTime = startDateTime.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const dataToSend = {
          action: 'cancel',
          clientName: appointmentToCancel.client.name,
          clientEmail: appointmentToCancel.client.email,
          service: appointmentToCancel.service.name,
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
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: 'cancelled_by_pro' as const } : apt)),
      );
      toast.success('Cita cancelada exitosamente y notificación enviada al cliente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error al cancelar la cita');
    }
  };

  const completeAppointmentHandler = async (appointmentId: string) => {
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
      const appointmentToComplete = appointments.find((apt) => apt.id === appointmentId);
      if (
        !appointmentToComplete ||
        !appointmentToComplete.client ||
        !appointmentToComplete.service ||
        !appointmentToComplete.review_token
      ) {
        toast.error('No se encontraron los datos necesarios para enviar el email de reseña');
        return;
      }
      const { professional } = await getCurrentProfessional();
      if (!professional) {
        toast.error('Error al obtener datos del profesional');
        return;
      }
      await completeAppointment(appointmentId);
      try {
        const startDateTime = new Date(appointmentToComplete.start_time);
        const dateOnly = startDateTime.toISOString().split('T')[0];
        const formattedTime = startDateTime.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const dataToSend = {
          action: 'review_request',
          clientName: appointmentToComplete.client.name,
          clientEmail: appointmentToComplete.client.email,
          service: appointmentToComplete.service.name,
          date: dateOnly,
          time: formattedTime,
          professionalName: professional.name,
          appointmentId: appointmentId,
          reviewToken: appointmentToComplete.review_token,
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
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: 'completed' as const } : apt)),
      );
      toast.success('Cita marcada como completada y email de reseña enviado al cliente');
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast.error('Error al completar la cita');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando datos de citas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Citas</h1>
          <p className="text-gray-600">
            Administra tus citas. Por defecto se muestran las citas de los próximos 30 días. Usa los filtros para buscar
            fechas específicas.
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <AppointmentStats
        appointments={filteredAppointments}
        totalAppointmentsCount={totalAppointmentsCount}
        appointmentCounts={appointmentCounts}
        filterDescription={getFilterDescription()}
      />

      {/* Filtros */}
      <AdvancedFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        services={services}
        isCollapsed={filtersCollapsed}
        onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
        getActiveFiltersCount={getActiveFiltersCount}
      />

      {/* Lista de citas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Citas
            </span>
            {getActiveFiltersCount() > 0 && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                Limpiar filtros ({getActiveFiltersCount()})
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {filteredAppointments.length === 0 ?
              'No se encontraron citas con los filtros aplicados'
            : `Mostrando ${filteredAppointments.length} ${filteredAppointments.length === 1 ? 'cita' : 'citas'} del período seleccionado`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentsByDay
            appointments={filteredAppointments}
            onViewDetails={(id) => router.push(`/dashboard/citas/${id}`)}
            onCancelAppointment={cancelAppointment}
            onCompleteAppointment={completeAppointmentHandler}
          />
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
