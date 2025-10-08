'use client';

import { useState, useEffect } from 'react';
import {
  TbCalendar,
  TbCurrencyDollar,
  TbTrendingUp,
  TbCheck,
  TbSquareCheck,
  TbX,
  TbUserX,
  TbCalendarEvent,
} from 'react-icons/tb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Appointment, Service, Client } from '@/types';
import { format, parseISO, startOfDay } from 'date-fns';
import { getNext7DaysAppointments } from '@/services/appointmentService';
import { getCurrentProfessional } from '@/lib/supabase';

type AppointmentWithDetails = Appointment & {
  service?: Service;
  client?: Client;
};

interface AppointmentStatsProps {
  appointments: AppointmentWithDetails[];
  totalAppointmentsCount?: number;
  appointmentCounts?: {
    confirmed: number;
    completed: number;
    cancelledByPro: number;
    cancelledByClient: number;
  };
  filterDescription?: string;
}

export default function AppointmentStats({
  appointments,
  totalAppointmentsCount,
  appointmentCounts,
  filterDescription,
}: AppointmentStatsProps) {
  const [next7DaysAppointments, setNext7DaysAppointments] = useState<AppointmentWithDetails[]>([]);

  // Cargar citas de los próximos 7 días independientemente de los filtros
  useEffect(() => {
    const loadNext7DaysAppointments = async () => {
      try {
        const { professional } = await getCurrentProfessional();
        if (professional) {
          const appointments7Days = await getNext7DaysAppointments(professional.id);
          setNext7DaysAppointments(appointments7Days);
        }
      } catch (error) {
        console.error('Error loading next 7 days appointments:', error);
        setNext7DaysAppointments([]);
      }
    };

    loadNext7DaysAppointments();
  }, []); // Solo se ejecuta una vez al montar el componente

  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');

  // Estadísticas de las citas filtradas/mostradas
  const displayedAppointmentsTotal = appointments.length;
  const confirmedCount =
    appointmentCounts?.confirmed || appointments.filter((apt) => apt.status === 'confirmed').length;
  const completedCount =
    appointmentCounts?.completed || appointments.filter((apt) => apt.status === 'completed').length;
  const cancelledByProCount =
    appointmentCounts?.cancelledByPro || appointments.filter((apt) => apt.status === 'cancelled_by_pro').length;
  const cancelledByClientCount =
    appointmentCounts?.cancelledByClient || appointments.filter((apt) => apt.status === 'cancelled_by_client').length;

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

  const stats = [
    {
      title: 'Citas del Período',
      value: displayedAppointmentsTotal.toString(),
      icon: TbCalendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: filterDescription || 'Período seleccionado',
    },
    {
      title: 'Ingresos del Período',
      value: formatCurrency(totalRevenue),
      icon: TbCurrencyDollar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: `De ${appointments.filter((apt) => apt.status === 'completed').length} citas completadas`,
    },
    {
      title: 'Ingresos Potenciales',
      value: formatCurrency(potentialRevenue),
      icon: TbTrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: `De ${appointments.filter((apt) => apt.status === 'confirmed').length} citas confirmadas`,
    },
    {
      title: 'Próximas Citas (7 días)',
      value: next7DaysAppointments.length.toString(),
      icon: TbCalendarEvent,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      description: 'Prepara tu semana',
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
      {/* Estadísticas de hoy */}
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
      {/* Resumen rápido de totales históricos */}
      {appointmentCounts && totalAppointmentsCount !== undefined && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
        <div className="text-center mb-2">
          <p className="text-sm font-medium text-gray-700">Estadísticas Totales (Históricas)</p>
          <span className="font-bold text-sm">{totalAppointmentsCount.toLocaleString()}</span> citas
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-green-700">{appointmentCounts.confirmed?.toLocaleString() ?? '0'}</p>
            <p className="text-xs text-gray-600">Confirmadas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-700">{appointmentCounts.completed?.toLocaleString() ?? '0'}</p>
            <p className="text-xs text-gray-600">Completadas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-700">{appointmentCounts.cancelledByPro?.toLocaleString() ?? '0'}</p>
            <p className="text-xs text-gray-600">Canceladas por ti</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-700">
          {appointmentCounts.cancelledByClient?.toLocaleString() ?? '0'}
            </p>
            <p className="text-xs text-gray-600">Canceladas por cliente</p>
          </div>
        </div>
          </CardContent>
        </Card>
      )}

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

      {/* Desglose por estado del período actual */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Estado - Período Actual</CardTitle>
          <p className="text-sm text-gray-600">
            Estadísticas basadas en las citas del período mostrado (desde hoy hasta fin de mes)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusStats.map((stat) => {
              const Icon = stat.icon;
              const displayedCount = appointments.filter((apt) => {
                switch (stat.label) {
                  case 'Confirmadas':
                    return apt.status === 'confirmed';
                  case 'Completadas':
                    return apt.status === 'completed';
                  case 'Canceladas (por ti)':
                    return apt.status === 'cancelled_by_pro';
                  case 'Canceladas (por el cliente)':
                    return apt.status === 'cancelled_by_client';
                  default:
                    return false;
                }
              }).length;
              const percentage =
                displayedAppointmentsTotal > 0 ? Math.round((displayedCount / displayedAppointmentsTotal) * 100) : 0;

              return (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className={`w-5 h-5 ${stat.color} mr-2`} />
                    <span className="text-2xl font-bold text-gray-900">{displayedCount}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-xs text-gray-500">{percentage}% del período</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
