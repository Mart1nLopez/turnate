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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
