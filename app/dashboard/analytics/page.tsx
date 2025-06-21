'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TbCalendar,
  TbUsers,
  TbCurrencyDollar,
  TbTrendingUp,
  TbTrendingDown,
  TbClock,
  TbStar,
  TbPercentage,
} from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { Service } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface AdvancedStats {
  // Estadísticas generales
  totalAppointments: number;
  totalClients: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;

  // Estadísticas del período actual vs anterior
  currentMonthAppointments: number;
  previousMonthAppointments: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;

  // Estadísticas de servicios
  topServices: Array<{
    service: Service;
    count: number;
    revenue: number;
  }>;

  // Estadísticas de tiempo
  averageSessionDuration: number;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;

  // Tendencias
  weeklyTrend: Array<{
    week: string;
    appointments: number;
    revenue: number;
  }>;

  // Métricas de satisfacción
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;

  // Próximas citas
  upcomingAppointments: number;
  todayAppointments: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');

  const loadAnalytics = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      // Calcular fechas para comparación
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Obtener todas las citas
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select(
          `
          *,
          service:services(*),
          client:clients(*)
        `,
        )
        .eq('professional_id', professional.id)
        .order('start_time', { ascending: false });

      // Obtener todas las reseñas
      const { data: allReviews } = await supabase.from('reviews').select('*').eq('professional_id', professional.id);

      if (!allAppointments || !allReviews) return;

      // Filtrar citas confirmadas
      const confirmedAppointments = allAppointments.filter((apt) => apt.status === 'confirmed');

      // Estadísticas básicas
      const totalAppointments = confirmedAppointments.length;
      const uniqueClients = new Set(confirmedAppointments.map((apt) => apt.client_id)).size;
      const totalRevenue = confirmedAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);
      const averageRating =
        allReviews.length > 0 ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length : 0;

      // Estadísticas del mes actual vs anterior
      const currentMonthAppointments = confirmedAppointments.filter(
        (apt) => new Date(apt.start_time) >= currentMonthStart,
      );
      const previousMonthAppointments = confirmedAppointments.filter((apt) => {
        const aptDate = new Date(apt.start_time);
        return aptDate >= previousMonthStart && aptDate <= previousMonthEnd;
      });

      const currentMonthRevenue = currentMonthAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);
      const previousMonthRevenue = previousMonthAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

      // Top servicios
      const serviceStats = new Map<string, { service: Service; count: number; revenue: number }>();
      confirmedAppointments.forEach((apt) => {
        if (apt.service) {
          const key = apt.service.id;
          const existing = serviceStats.get(key);
          if (existing) {
            existing.count++;
            existing.revenue += apt.service.price;
          } else {
            serviceStats.set(key, {
              service: apt.service,
              count: 1,
              revenue: apt.service.price,
            });
          }
        }
      });
      const topServices = Array.from(serviceStats.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Horas pico
      const hourStats = new Map<number, number>();
      confirmedAppointments.forEach((apt) => {
        const hour = new Date(apt.start_time).getHours();
        hourStats.set(hour, (hourStats.get(hour) || 0) + 1);
      });
      const peakHours = Array.from(hourStats.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Tendencia semanal (últimas 8 semanas)
      const weeklyTrend = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekAppointments = confirmedAppointments.filter((apt) => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= weekStart && aptDate <= weekEnd;
        });

        const weekRevenue = weekAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

        weeklyTrend.push({
          week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
          appointments: weekAppointments.length,
          revenue: weekRevenue,
        });
      }

      // Distribución de calificaciones
      const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: allReviews.filter((review) => review.rating === rating).length,
      }));

      // Citas de hoy y próximas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointments = confirmedAppointments.filter((apt) => {
        const aptDate = new Date(apt.start_time);
        return aptDate >= today && aptDate < tomorrow;
      }).length;

      const upcomingAppointments = confirmedAppointments.filter((apt) => new Date(apt.start_time) > now).length;

      // Duración promedio de sesión (en minutos)
      const averageSessionDuration =
        confirmedAppointments.length > 0 ?
          confirmedAppointments.reduce((sum, apt) => sum + (apt.service?.duration_minutes || 0), 0) /
          confirmedAppointments.length
        : 0;

      const analyticsData: AdvancedStats = {
        totalAppointments,
        totalClients: uniqueClients,
        totalRevenue,
        averageRating,
        totalReviews: allReviews.length,
        currentMonthAppointments: currentMonthAppointments.length,
        previousMonthAppointments: previousMonthAppointments.length,
        currentMonthRevenue,
        previousMonthRevenue,
        topServices,
        averageSessionDuration,
        peakHours,
        weeklyTrend,
        ratingDistribution,
        upcomingAppointments,
        todayAppointments,
      };

      setStats(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, dateRange]);

  const formatPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <TbTrendingUp className="w-4 h-4" />;
    if (current < previous) return <TbTrendingDown className="w-4 h-4" />;
    return <TbTrendingUp className="w-4 h-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-gray-600">Métricas detalladas de tu negocio</p>
        </div>

        <div className="flex gap-2">
          {(['month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                dateRange === range ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {range === 'month' ?
                'Mes'
              : range === 'quarter' ?
                'Trimestre'
              : 'Año'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                <div
                  className={`flex items-center text-sm ${getChangeColor(stats.currentMonthAppointments, stats.previousMonthAppointments)}`}>
                  {getChangeIcon(stats.currentMonthAppointments, stats.previousMonthAppointments)}
                  <span className="ml-1">
                    {formatPercentageChange(stats.currentMonthAppointments, stats.previousMonthAppointments)} este mes
                  </span>
                </div>
              </div>
              <TbCalendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Únicos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                <p className="text-sm text-gray-500">Base de clientes</p>
              </div>
              <TbUsers className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <div
                  className={`flex items-center text-sm ${getChangeColor(stats.currentMonthRevenue, stats.previousMonthRevenue)}`}>
                  {getChangeIcon(stats.currentMonthRevenue, stats.previousMonthRevenue)}
                  <span className="ml-1">
                    {formatPercentageChange(stats.currentMonthRevenue, stats.previousMonthRevenue)} este mes
                  </span>
                </div>
              </div>
              <TbCurrencyDollar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                  <span className="text-lg text-gray-500">/5</span>
                </p>
                <p className="text-sm text-gray-500">{stats.totalReviews} reseñas</p>
              </div>
              <TbStar className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
              </div>
              <TbClock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximas Citas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
              <TbCalendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Duración Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(stats.averageSessionDuration)}</p>
                <p className="text-sm text-gray-500">minutos</p>
              </div>
              <TbClock className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Reseñas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalAppointments > 0 ? Math.round((stats.totalReviews / stats.totalAppointments) * 100) : 0}%
                </p>
              </div>
              <TbPercentage className="w-8 h-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Servicios Más Populares</CardTitle>
            <CardDescription>Tus servicios con más demanda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topServices.map((serviceStats, index) => (
                <div key={serviceStats.service.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{serviceStats.service.name}</p>
                      <p className="text-sm text-gray-500">{serviceStats.count} citas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(serviceStats.revenue)}</p>
                    <p className="text-sm text-gray-500">ingresos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horas Pico */}
        <Card>
          <CardHeader>
            <CardTitle>Horas Más Ocupadas</CardTitle>
            <CardDescription>Cuando tienes más citas agendadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.peakHours.map((hourStats, index) => (
                <div key={hourStats.hour} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{hourStats.hour.toString().padStart(2, '0')}:00</p>
                      <p className="text-sm text-gray-500">
                        {hourStats.count} cita{hourStats.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(hourStats.count / Math.max(...stats.peakHours.map((h) => h.count))) * 100}%`,
                      }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendencia Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia Semanal</CardTitle>
          <CardDescription>Citas e ingresos de las últimas 8 semanas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            {stats.weeklyTrend.map((week) => (
              <div key={week.week} className="text-center">
                <div className="space-y-2">
                  <div className="h-20 bg-gray-200 rounded relative overflow-hidden">
                    <div
                      className="bg-blue-500 absolute bottom-0 left-0 right-0 rounded"
                      style={{
                        height: `${(week.appointments / Math.max(...stats.weeklyTrend.map((w) => w.appointments))) * 100}%`,
                      }}></div>
                  </div>
                  <div>
                    <p className="text-xs font-medium">{week.week}</p>
                    <p className="text-xs text-gray-500">{week.appointments} citas</p>
                    <p className="text-xs text-gray-500">{formatCurrency(week.revenue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribución de Calificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Calificaciones</CardTitle>
          <CardDescription>Cómo califican tus clientes tu servicio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.ratingDistribution.reverse().map((ratingData) => (
              <div key={ratingData.rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium">{ratingData.rating}</span>
                  <TbStar className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${stats.totalReviews > 0 ? (ratingData.count / stats.totalReviews) * 100 : 0}%`,
                    }}></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{ratingData.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
