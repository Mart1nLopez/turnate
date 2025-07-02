'use client';

import { TbPlus, TbCalendarPlus, TbClockHour4, TbTrendingUp, TbUsers } from 'react-icons/tb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Appointment, Service, Client } from '@/types';
import { parseISO, format, isAfter, isSameDay, isSameMonth, isSameYear, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

type AppointmentWithDetails = Appointment & {
  service?: Service;
  client?: Client;
};

interface QuickActionsProps {
  appointments: AppointmentWithDetails[];
  onCreateAppointment?: () => void;
  onViewAvailability?: () => void;
  onViewServices?: () => void;
}

export default function QuickActions({
  appointments,
  onCreateAppointment,
  onViewAvailability,
  onViewServices,
}: QuickActionsProps) {
  const today = startOfDay(new Date());

  // Estadísticas rápidas
  const todayAppointments = appointments.filter((apt) => isSameDay(parseISO(apt.start_time), today));

  const nextAppointment = appointments
    .filter(
      (apt) =>
        isAfter(parseISO(apt.start_time), new Date()) && (apt.status === 'confirmed' || apt.status === 'pending'),
    )
    .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())[0];

  const pendingCount = appointments.filter((apt) => apt.status === 'pending').length;

  const thisMonthRevenue = appointments
    .filter((apt) => {
      const aptDate = parseISO(apt.start_time);
      return isSameMonth(aptDate, today) && isSameYear(aptDate, today) && apt.status === 'completed';
    })
    .reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

  const quickStats = [
    {
      title: 'Hoy',
      value: `${todayAppointments.length} cita${todayAppointments.length !== 1 ? 's' : ''}`,
      icon: TbCalendarPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pendientes',
      value: `${pendingCount} por confirmar`,
      icon: TbClockHour4,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Este mes',
      value: formatCurrency(thisMonthRevenue),
      icon: TbTrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  const actions = [
    {
      title: 'Nueva Cita',
      description: 'Agendar una nueva cita',
      icon: TbPlus,
      onClick: onCreateAppointment,
      variant: 'default' as const,
    },
    {
      title: 'Disponibilidad',
      description: 'Configurar horarios',
      icon: TbCalendarPlus,
      onClick: onViewAvailability,
      variant: 'outline' as const,
    },
    {
      title: 'Servicios',
      description: 'Gestionar servicios',
      icon: TbUsers,
      onClick: onViewServices,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor} mr-3`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Próxima cita */}
      {nextAppointment && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Próxima cita</p>
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium text-gray-900">{nextAppointment.client?.name || 'Sin nombre'}</p>
                    <p className="text-sm text-gray-500">{nextAppointment.service?.name || 'Servicio eliminado'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {format(parseISO(nextAppointment.start_time), 'EEE, MMM d', { locale: es })}
                    </p>
                    <p className="text-sm text-gray-500">{format(parseISO(nextAppointment.start_time), 'HH:mm')}</p>
                  </div>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  nextAppointment.status === 'confirmed' ?
                    'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
                }`}>
                {nextAppointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones rápidas */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-gray-600 mb-3">Acciones rápidas</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  onClick={action.onClick}
                  variant={action.variant}
                  className="h-auto p-4 justify-start"
                  disabled={!action.onClick}>
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-xs opacity-70">{action.description}</p>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
