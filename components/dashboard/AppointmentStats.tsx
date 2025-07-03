'use client';

import {
  TbCalendar,
  TbClock,
  TbCurrencyDollar,
  TbTrendingUp,
  TbCheck,
  TbSquareCheck,
  TbX,
  TbUserX,
} from 'react-icons/tb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Appointment, Service, Client } from '@/types';
import { format, parseISO, startOfDay } from 'date-fns';

type AppointmentWithDetails = Appointment & {
  service?: Service;
  client?: Client;
};

interface AppointmentStatsProps {
  appointments: AppointmentWithDetails[];
}

export default function AppointmentStats({ appointments }: AppointmentStatsProps) {
  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');

  // Estadísticas generales
  const totalAppointments = appointments.length;
  const confirmedCount = appointments.filter((apt) => apt.status === 'confirmed').length;
  const completedCount = appointments.filter((apt) => apt.status === 'completed').length;
  const cancelledByProCount = appointments.filter((apt) => apt.status === 'cancelled_by_pro').length;
  const cancelledByClientCount = appointments.filter((apt) => apt.status === 'cancelled_by_client').length;

  // Ingresos
  const totalRevenue = appointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

  const potentialRevenue = appointments
    .filter((apt) => apt.status === 'confirmed')
    .reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

  // Estadísticas de hoy
  const todayAppointments = appointments.filter((apt) => format(parseISO(apt.start_time), 'yyyy-MM-dd') === todayStr);
  const todayRevenue = todayAppointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

  // Próximas citas (siguientes 24 horas)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = parseISO(apt.start_time);
    return aptDate >= today && aptDate <= tomorrow && apt.status === 'confirmed';
  });

  const stats = [
    {
      title: 'Total Citas',
      value: totalAppointments.toString(),
      icon: TbCalendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'En el período filtrado',
    },
    {
      title: 'Ingresos Confirmados',
      value: formatCurrency(totalRevenue),
      icon: TbCurrencyDollar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: `${completedCount} citas completadas`,
    },
    {
      title: 'Ingresos Potenciales',
      value: formatCurrency(potentialRevenue),
      icon: TbTrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: `${confirmedCount} citas confirmadas`,
    },
    {
      title: 'Próximas 24h',
      value: upcomingAppointments.length.toString(),
      icon: TbClock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Citas confirmadas (pendientes)',
    },
  ];

  const statusStats = [
    {
      label: 'Confirmadas',
      count: confirmedCount,
      icon: TbCheck,
      color: 'text-green-600',
    },
    {
      label: 'Completadas',
      count: completedCount,
      icon: TbSquareCheck,
      color: 'text-blue-600',
    },
    {
      label: 'Canceladas (por ti)',
      count: cancelledByProCount,
      icon: TbX,
      color: 'text-red-600',
    },
    {
      label: 'Canceladas (por el cliente)',
      count: cancelledByClientCount,
      icon: TbUserX,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor} mr-4`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desglose por estado */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusStats.map((stat) => {
              const Icon = stat.icon;
              const percentage = totalAppointments > 0 ? Math.round((stat.count / totalAppointments) * 100) : 0;

              return (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className={`w-5 h-5 ${stat.color} mr-2`} />
                    <span className="text-2xl font-bold text-gray-900">{stat.count}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-xs text-gray-500">{percentage}% del total</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de hoy */}
      {todayAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{todayAppointments.length}</p>
                <p className="text-sm text-gray-600">Citas hoy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(todayRevenue)}</p>
                <p className="text-sm text-gray-600">Ingresos hoy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {todayAppointments.filter((apt) => apt.status === 'confirmed').length}
                </p>
                <p className="text-sm text-gray-600">Confirmadas hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
