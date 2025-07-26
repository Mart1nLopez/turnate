'use client';

import { useEffect, useState, useCallback } from 'react';
import { TbCalendar, TbUsers, TbCurrencyDollar, TbTrendingUp, TbClock, TbUser } from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { getCurrentProfessional } from '@/lib/supabase';
import { getDashboardStats, getTodayAppointments } from '@/services/dashboardService';
import { Appointment, Service } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  todayAppointments: number;
  weeklyAppointments: number;
  monthlyRevenue: number;
  totalClients: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weeklyAppointments: 0,
    monthlyRevenue: 0,
    totalClients: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<
    (Appointment & { service?: Service; client?: { name: string } })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;
      const [statsData, todayApts] = await Promise.all([
        getDashboardStats(professional.id),
        getTodayAppointments(professional.id),
      ]);
      setStats(statsData);
      setTodayAppointments(todayApts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando estadísticas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de tu negocio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <TbCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayAppointments === 1 ? 'cita programada' : 'citas programadas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Semana</CardTitle>
            <TbTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyAppointments}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
            <TbCurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <TbUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Clientes únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Citas de Hoy</CardTitle>
          <CardDescription>
            {todayAppointments.length === 0 ?
              'No tienes citas programadas para hoy'
            : `Tienes ${todayAppointments.length} ${todayAppointments.length === 1 ? 'cita programada' : 'citas programadas'} para hoy`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ?
            <div className="text-center py-8 text-gray-500">
              <TbCalendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay citas programadas para hoy</p>
            </div>
          : <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <TbUser className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{appointment.client?.name || 'Cliente'}</p>
                      <p className="text-sm text-gray-500">{appointment.service?.name || 'Servicio'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500">
                      <TbClock className="h-4 w-4 mr-1" />
                      {formatTime(appointment.start_time)}
                    </div>
                    <p className="text-xs text-gray-400">{appointment.service?.duration_minutes} min</p>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
