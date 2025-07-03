'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { Appointment, Service, Client } from '@/types';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import AppointmentsByDay from '@/components/dashboard/AppointmentsByDay';
import AdvancedFiltersComponent from '@/components/dashboard/AdvancedFilters';
import AppointmentStats from '@/components/dashboard/AppointmentStats';
import { useAppointmentFilters } from '@/hooks/useAppointmentFilters';

type AppointmentWithDetails = Appointment & {
  service?: Service;
  client?: Client;
};

export default function CitasPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Usar el hook personalizado para filtros
  const { filters, filteredAppointments, setFilters, clearFilters, getActiveFiltersCount } =
    useAppointmentFilters(appointments);

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
      // Obtener los datos completos de la cita antes de cancelarla
      const appointmentToCancel = appointments.find((apt) => apt.id === appointmentId);
      if (!appointmentToCancel || !appointmentToCancel.client || !appointmentToCancel.service) {
        toast.error('No se encontraron los datos necesarios para enviar la notificación');
        return;
      }

      // Obtener datos del profesional
      const { professional } = await getCurrentProfessional();
      if (!professional) {
        toast.error('Error al obtener datos del profesional');
        return;
      }

      // Formatear fecha y hora
      const startDateTime = new Date(appointmentToCancel.start_time);
      const formattedDate = startDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const formattedTime = startDateTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      // Actualizar estado en Supabase
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled_by_pro' })
        .eq('id', appointmentId);

      if (error) throw error;

      // Enviar notificación de cancelación al cliente vía Google Apps Script
      try {
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
        // No fallar todo el proceso si el email falla
        toast.warning('Cita cancelada, pero no se pudo enviar la notificación por email');
      }

      // Actualizar estado local
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: 'cancelled_by_pro' as const } : apt)),
      );

      toast.success('Cita cancelada exitosamente y notificación enviada al cliente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error al cancelar la cita');
    }
  };

  const completeAppointment = async (appointmentId: string) => {
    const confirmed = await confirm({
      title: '¿Marcar cita como completada?',
      description: 'La cita será marcada como completada y se registrará en tus ingresos.',
      confirmText: 'Marcar completada',
      cancelText: 'Cancelar',
      variant: 'default',
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: 'completed' as const } : apt)),
      );

      toast.success('Cita marcada como completada');
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast.error('Error al completar la cita');
    }
  };

  const loadAppointments = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      // Cargar citas
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(
          `
          *,
          service:services(name, price, duration_minutes),
          client:clients(name, email, phone)
        `,
        )
        .eq('professional_id', professional.id)
        .order('start_time', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Cargar servicios para los filtros
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('professional_id', professional.id)
        .order('name');

      if (servicesError) throw servicesError;

      setAppointments(appointmentsData || []);
      setServices(servicesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando citas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Citas</h1>
          <p className="text-gray-600">Administra todas tus citas programadas</p>
        </div>
      </div>

      {/* Estadísticas */}
      <AppointmentStats appointments={filteredAppointments} />

      {/* Filtros */}
      <AdvancedFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        services={services}
        isCollapsed={filtersCollapsed}
        onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
      />

      {/* Lista de citas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Citas
              {filteredAppointments.length !== appointments.length && (
                <span className="text-sm font-normal text-gray-500 ml-2">(filtradas de {appointments.length})</span>
              )}
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
            : `Mostrando ${filteredAppointments.length} ${filteredAppointments.length === 1 ? 'cita' : 'citas'} en total`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentsByDay
            appointments={filteredAppointments}
            onViewDetails={(id) => router.push(`/dashboard/citas/${id}`)}
            onCancelAppointment={cancelAppointment}
            onCompleteAppointment={completeAppointment}
          />
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
