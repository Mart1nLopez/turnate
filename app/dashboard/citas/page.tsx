'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TbCalendar, TbClock, TbUser, TbPhone, TbMail, TbX, TbCheck, TbFilter, TbSearch, TbEye } from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { Appointment, Service, Client } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

type AppointmentWithDetails = Appointment & {
  service?: Service;
  client?: Client;
};

export default function CitasPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled_by_pro'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'past'>('all');
  const { confirm, ConfirmDialog } = useConfirmDialog();

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
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled_by_pro' })
        .eq('id', appointmentId);

      if (error) throw error;

      // Actualizar la lista de citas
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: 'cancelled_by_pro' } : apt)),
      );

      toast.success('Cita cancelada exitosamente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error al cancelar la cita');
    }
  };

  const loadAppointments = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      const { data, error } = await supabase
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

      if (error) throw error;

      setAppointments(data || []);
      setFilteredAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filterAppointments = useCallback(() => {
    let filtered = appointments;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (appointment) =>
          appointment.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((appointment) => appointment.status === statusFilter);
    }

    // Filtro por fecha
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (dateFilter !== 'all') {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.start_time);

        switch (dateFilter) {
          case 'today':
            return appointmentDate.toDateString() === today.toDateString();
          case 'week':
            return appointmentDate >= today && appointmentDate <= weekFromNow;
          case 'past':
            return appointmentDate < today;
          default:
            return true;
        }
      });
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    filterAppointments();
  }, [filterAppointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <TbCheck className="w-3 h-3 mr-1" />
            Confirmada
          </span>
        );
      case 'cancelled_by_pro':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <TbX className="w-3 h-3 mr-1" />
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
        <LoadingSpinner size="lg" text="Cargando citas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Citas</h1>
        <p className="text-gray-600">Administra todas tus citas programadas</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <TbSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cliente o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'confirmed' | 'cancelled_by_pro')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">Todos</option>
                <option value="confirmed">Confirmadas</option>
                <option value="cancelled_by_pro">Canceladas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'past')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">Todas</option>
                <option value="today">Hoy</option>
                <option value="week">Próxima semana</option>
                <option value="past">Pasadas</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
                variant="outline"
                className="w-full">
                <TbFilter className="w-4 h-4 mr-2" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Citas ({filteredAppointments.length})</CardTitle>
          <CardDescription>
            {filteredAppointments.length === 0 ?
              'No se encontraron citas con los filtros aplicados'
            : `Mostrando ${filteredAppointments.length} ${filteredAppointments.length === 1 ? 'cita' : 'citas'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ?
            <div className="text-center py-8 text-gray-500">
              <TbCalendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron citas</p>
            </div>
          : <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.start_time);
                const canCancel = appointment.status === 'confirmed' && new Date(appointment.start_time) > new Date();

                return (
                  <div key={appointment.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Cliente */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <TbUser className="h-4 w-4 mr-1" />
                            Cliente
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{appointment.client?.name || 'Sin nombre'}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <TbMail className="h-3 w-3 mr-1" />
                              {appointment.client?.email || 'Sin email'}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <TbPhone className="h-3 w-3 mr-1" />
                              {appointment.client?.phone || 'Sin teléfono'}
                            </div>
                          </div>
                        </div>

                        {/* Servicio y Fecha */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <TbCalendar className="h-4 w-4 mr-1" />
                            Servicio y Fecha
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {appointment.service?.name || 'Servicio eliminado'}
                            </p>
                            <p className="text-sm text-gray-600 capitalize">{date}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <TbClock className="h-3 w-3 mr-1" />
                              {time} ({appointment.service?.duration_minutes || 0} min)
                            </div>
                          </div>
                        </div>

                        {/* Estado y Precio */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">Estado y Precio</div>
                          <div>
                            {getStatusBadge(appointment.status)}
                            <p className="text-lg font-bold text-gray-900 mt-2">
                              {formatCurrency(appointment.service?.price || 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => router.push(`/dashboard/citas/${appointment.id}`)}
                          variant="outline"
                          size="sm">
                          <TbEye className="w-4 h-4 mr-1" />
                          Ver detalles
                        </Button>
                        {canCancel && (
                          <Button onClick={() => cancelAppointment(appointment.id)} variant="destructive" size="sm">
                            <TbX className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}
