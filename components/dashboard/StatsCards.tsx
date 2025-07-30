'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { DashboardStats, MonthlyRevenue } from '@/services/dashboardService';
import { motion } from 'framer-motion';
import {
  TbCalendar,
  TbUsers,
  TbCurrencyDollar,
  TbTrendingUp,
  TbCalendarWeek,
  TbChecks,
  TbX,
  TbPercentage,
} from 'react-icons/tb';

interface StatsCardsProps {
  stats: DashboardStats;
  monthlyRevenue: MonthlyRevenue[];
}

export default function StatsCards({ stats, monthlyRevenue }: StatsCardsProps) {
  // Forzar el tipado extendido para stats
  const s = stats as typeof stats & {
    monthlyAppointments?: number;
    monthlyCompletedAppointments?: number;
    monthlyCancelledAppointments?: number;
    monthlyConversionRate?: number;
  };
  const monthlyAppointments = s.monthlyAppointments ?? 0;
  const monthlyCompleted = s.monthlyCompletedAppointments ?? 0;
  const monthlyCancelled = s.monthlyCancelledAppointments ?? 0;
  const monthlyConversionRate = typeof s.monthlyConversionRate === 'number' ? s.monthlyConversionRate : 0;

  // Tomar el valor del mes actual del array monthlyRevenue (último elemento)
  const currentMonthRevenue = monthlyRevenue?.[monthlyRevenue.length - 1]?.revenue ?? 0;

  // Para claridad en las descripciones
  const today = new Date();
  const monthName = today.toLocaleDateString('es-ES', { month: 'long' });

  const cards = [
    {
      title: 'Citas Hoy',
      value: stats.todayAppointments.toString(),
      description: `${today.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`,
      icon: TbCalendar,
      color: '#2563eb', // Azul fuerte
      gradient: 'from-blue-500 to-blue-700',
    },
    {
      title: 'Período Actual',
      value: stats.currentPeriodAppointments.toString(),
      description: `próximos 30 días`,
      icon: TbCalendarWeek,
      color: '#a21caf', // Morado intenso
      gradient: 'from-fuchsia-500 to-purple-700',
    },
    {
      title: 'Ingresos Mes',
      value: formatCurrency(currentMonthRevenue),
      description: `todo ${monthName}`,
      icon: TbCurrencyDollar,
      color: '#22c55e', // Verde vibrante
      gradient: 'from-green-400 to-green-700',
    },
    {
      title: 'Total Clientes',
      value: stats.totalClients.toString(),
      description: 'únicos registrados',
      icon: TbUsers,
      color: '#f59e42', // Naranja brillante
      gradient: 'from-orange-400 to-orange-600',
    },
    {
      title: 'Agendadas Mes',
      value: monthlyAppointments.toString(),
      description: `todo ${monthName}`,
      icon: TbTrendingUp,
      color: '#6366f1', // Indigo vibrante
      gradient: 'from-indigo-400 to-indigo-700',
    },
    {
      title: 'Completadas Mes',
      value: monthlyCompleted.toString(),
      description: `todo ${monthName}`,
      icon: TbChecks,
      color: '#059669', // Verde esmeralda fuerte
      gradient: 'from-emerald-400 to-emerald-700',
    },
    {
      title: 'Canceladas Mes',
      value: monthlyCancelled.toString(),
      description: `todo ${monthName}`,
      icon: TbX,
      color: '#ef4444', // Rojo intenso
      gradient: 'from-red-500 to-red-700',
    },
    {
      title: 'Conversión Mes',
      value: `${monthlyConversionRate.toFixed(1)}%`,
      description: `efectividad en ${monthName}`,
      icon: TbPercentage,
      color: '#06b6d4', // Cyan vibrante
      gradient: 'from-cyan-400 to-cyan-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="h-full">
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-lg font-semibold text-gray-900 mb-1">{card.value}</p>
                    <p className="text-xs text-gray-500 capitalize">{card.description}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <Icon className={`h-6 w-6`} style={{ color: card.color }} />
                  </div>
                </div>
                {/* Decorative gradient line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
