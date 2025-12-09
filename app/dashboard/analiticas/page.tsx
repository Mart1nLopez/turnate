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
import { getCurrentProfessional } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { getAnalyticsStats, AdvancedStats } from '@/services/analyticsService';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;
      const stats = await getAnalyticsStats(professional.id);
      setStats(stats);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-gray-600">Métricas detalladas de tu negocio</p>
        </div>
        <LoadingSpinner size="lg" text="Cargando analíticas..." />
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-gray-600">Métricas detalladas de tu negocio</p>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {(['month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                dateRange === range ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Citas Totales</p>
              <TbCalendar className="w-5 h-5 text-blue-600 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.totalAppointments}</p>
              <div
                className={`flex items-center text-xs mt-1 ${getChangeColor(stats.currentMonthAppointments, stats.previousMonthAppointments)}`}>
                {getChangeIcon(stats.currentMonthAppointments, stats.previousMonthAppointments)}
                <span className="ml-1 truncate">
                  {formatPercentageChange(stats.currentMonthAppointments, stats.previousMonthAppointments)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Clientes Únicos</p>
              <TbUsers className="w-5 h-5 text-green-600 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.totalClients}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">Base de clientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Ingresos</p>
              <TbCurrencyDollar className="w-5 h-5 text-purple-600 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 truncate">{formatCurrency(stats.totalRevenue)}</p>
              <div
                className={`flex items-center text-xs mt-1 ${getChangeColor(stats.currentMonthRevenue, stats.previousMonthRevenue)}`}>
                {getChangeIcon(stats.currentMonthRevenue, stats.previousMonthRevenue)}
                <span className="ml-1 truncate">
                  {formatPercentageChange(stats.currentMonthRevenue, stats.previousMonthRevenue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Calificación</p>
              <TbStar className="w-5 h-5 text-yellow-500 shrink-0" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                <span className="text-xs text-gray-500">/5</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{stats.totalReviews} reseñas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Citas Hoy</p>
              <TbClock className="w-5 h-5 text-orange-600 shrink-0" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.todayAppointments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Próximas</p>
              <TbCalendar className="w-5 h-5 text-blue-600 shrink-0" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Duración</p>
              <TbClock className="w-5 h-5 text-indigo-600 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{Math.round(stats.averageSessionDuration)}</p>
              <p className="text-xs text-gray-500 mt-1">minutos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Tasa Reseñas</p>
              <TbPercentage className="w-5 h-5 text-pink-600 shrink-0" />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {stats.totalAppointments > 0 ? Math.round((stats.totalReviews / stats.totalAppointments) * 100) : 0}%
            </p>
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
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-cols-8 gap-2 min-w-[600px]">
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
