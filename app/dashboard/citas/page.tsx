'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  getUpcomingAppointmentsByProfessionalId,
  getTotalAppointmentsCount,
  getAppointmentCountsByStatus,
  cancelAppointmentByProfessionalAndSync,
  completeAppointment,
  AppointmentWithDetails,
} from '@/services/appointmentService';
import AppointmentsByDay from '@/components/dashboard/AppointmentsByDay';
import AdvancedFiltersComponent from '@/components/dashboard/AdvancedFilters';
import AppointmentStats from '@/components/dashboard/AppointmentStats';
import { useAppointmentFilters, getSavedAppointmentFilters } from '@/hooks/useAppointmentFilters';

const UPCOMING_APPOINTMENTS_LIMIT = 10;

export default function CitasPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [isRefreshingAppointments, setIsRefreshingAppointments] = useState(false);
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

  // Usar el hook personalizado para filtros (hidrata y persiste el último filtro por profesional)
  const {
    filters,
    filteredAppointments,
    setFilters,
    clearFilters,
    getActiveFiltersCount,
    getFilterDescription,
    hasStoredFilter,
  } = useAppointmentFilters(appointments, professionalId);

  // Cargar citas dentro de la ventana estándar de 30 días (cuando ya hay un filtro guardado)
  const loadAppointmentsBasedOnDateFilter = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      const appointmentsData = await getAppointmentsByProfessionalId(professional.id);

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Error al cargar las citas');
    }
  }, []);

  // Cargar las próximas 10 citas futuras (vista inicial cuando el barbero nunca configuró un filtro)
  const loadUpcomingAppointments = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      const appointmentsData = await getUpcomingAppointmentsByProfessionalId(
        professional.id,
        UPCOMING_APPOINTMENTS_LIMIT,
      );

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
      setProfessionalId(professional.id);

      // Cargar servicios y conteos (siempre necesarios)
      const [servicesData, totalCount, statusCounts] = await Promise.all([
        getServicesByProfessionalId(professional.id),
        getTotalAppointmentsCount(professional.id),
        getAppointmentCountsByStatus(professional.id),
      ]);

      setServices(servicesData || []);
      setTotalAppointmentsCount(totalCount);
      setAppointmentCounts(statusCounts);

      // La carga inicial depende de si este barbero ya tiene un filtro guardado:
      // si nunca configuró uno, la vista inicial son sus 10 próximas citas.
      const savedFilters = getSavedAppointmentFilters(professional.id);
      if (savedFilters) {
        await loadAppointmentsBasedOnDateFilter();
      } else {
        await loadUpcomingAppointments();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [loadAppointmentsBasedOnDateFilter, loadUpcomingAppointments]);

  // Efecto inicial para cargar datos
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Si el barbero configura su primer filtro durante la sesión (todavía estaba en la vista de
  // "10 próximas citas"), cargar la ventana completa para que el filtro recién elegido se
  // aplique sobre todas las citas correspondientes, no solo sobre esas 10.
  const hadStoredFilterRef = useRef(false);
  useEffect(() => {
    if (!hadStoredFilterRef.current && hasStoredFilter && !loading) {
      setIsRefreshingAppointments(true);
      loadAppointmentsBasedOnDateFilter().finally(() => setIsRefreshingAppointments(false));
    }
    hadStoredFilterRef.current = hasStoredFilter;
  }, [hasStoredFilter, loading, loadAppointmentsBasedOnDateFilter]);

  // Efecto que reacciona cuando cambia el filtro de fechas a "próximos 30 días"
  useEffect(() => {
    // Solo recargar para next_30_days ya que los otros filtros se procesan localmente
    if (hasStoredFilter && filters.dateRange === 'next_30_days' && !loading) {
      setIsRefreshingAppointments(true);
      loadAppointmentsBasedOnDateFilter().finally(() => setIsRefreshingAppointments(false));
    }
  }, [hasStoredFilter, filters.dateRange, loading, loadAppointmentsBasedOnDateFilter]);

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
      // Cancelar la cita
      await cancelAppointmentByProfessionalAndSync(appointmentId);

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
      // Marcar como completada
      await completeAppointment(appointmentId);
      
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
            Administra tus citas. Por defecto se muestran tus próximas 10 citas. Usa los filtros avanzados para buscar
            por fecha, estado u otros criterios.
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
        hasStoredFilter={hasStoredFilter}
      />

      {/* Lista de citas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Citas</span>
            {getActiveFiltersCount() > 0 && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                Limpiar filtros ({getActiveFiltersCount()})
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {isRefreshingAppointments ?
              'Actualizando citas...'
            : filteredAppointments.length === 0 ?
              'No se encontraron citas con los filtros aplicados'
            : `Mostrando ${filteredAppointments.length} ${filteredAppointments.length === 1 ? 'cita' : 'citas'} — ${getFilterDescription()}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRefreshingAppointments ?
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" text="Actualizando citas..." />
            </div>
          : <AppointmentsByDay
              appointments={filteredAppointments}
              onViewDetails={(id) => router.push(`/dashboard/citas/${id}`)}
              onCancelAppointment={cancelAppointment}
              onCompleteAppointment={completeAppointmentHandler}
            />
          }
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
