'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import LoadingSpinner from '@/components/ui/loading-spinner';
import StatsCards from '@/components/dashboard/StatsCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import ServiceStatsChart from '@/components/dashboard/ServiceStatsChart';
import { motion } from 'framer-motion';
import { TbRefresh, TbTrendingUp } from 'react-icons/tb';
import QuickMetrics from '@/components/dashboard/QuickMetrics';

export default function DashboardPage() {
  const { data, loading, error, refresh } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <TbTrendingUp className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar el dashboard</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <TbRefresh className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // Calcular métricas rápidas solo cuando data está disponible
  const lastMonth = data.monthlyRevenue?.[data.monthlyRevenue.length - 1] || { revenue: 0, appointments: 0 };
  const prevMonth = data.monthlyRevenue?.[data.monthlyRevenue.length - 2] || { revenue: 0, appointments: 0 };
  const currentRevenue = lastMonth.revenue || 0;
  const previousRevenue = prevMonth.revenue || 0;
  const currentAppointments = lastMonth.appointments || 0;
  const previousAppointments = prevMonth.appointments || 0;

  // Default stats object to prevent null errors
  const defaultStats = {
    todayAppointments: 0,
    currentPeriodAppointments: 0,
    totalClients: 0,
    monthlyAppointments: 0,
    monthlyCompletedAppointments: 0,
    monthlyCancelledAppointments: 0,
    monthlyConversionRate: 0,
    monthlyRevenue: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    conversionRate: 0,
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen completo de tu negocio</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <TbRefresh className="h-4 w-4 mr-2" />
          Actualizar
        </button>
      </motion.div>

      {/* Quick Metrics */}
      <QuickMetrics
        currentRevenue={currentRevenue}
        previousRevenue={previousRevenue}
        currentAppointments={currentAppointments}
        previousAppointments={previousAppointments}
      />

      {/* Stats Cards */}
      <StatsCards stats={data.stats || defaultStats} monthlyRevenue={data.monthlyRevenue} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <RevenueChart data={data.monthlyRevenue} />
        <ServiceStatsChart data={data.serviceStats} />
      </div>
    </div>
  );
}
