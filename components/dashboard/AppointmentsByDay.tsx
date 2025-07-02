'use client';

import {
  TbCalendar,
  TbClock,
  TbUser,
  TbPhone,
  TbMail,
  TbX,
  TbCheck,
  TbEye,
  TbSquareCheck,
} from 'react-icons/tb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Appointment, Service, Client } from '@/types';
import { format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

type AppointmentWithDetails = Appointment & {
  service?: Service;
  client?: Client;
};

interface AppointmentsByDayProps {
  appointments: AppointmentWithDetails[];
  onViewDetails: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onCompleteAppointment: (appointmentId: string) => void;
}

interface GroupedAppointments {
  [date: string]: AppointmentWithDetails[];
}

export default function AppointmentsByDay({
  appointments,
  onViewDetails,
  onCancelAppointment,
  onCompleteAppointment,
}: AppointmentsByDayProps) {
  // Agrupar citas por día
  const groupedAppointments: GroupedAppointments = appointments.reduce((groups, appointment) => {
    const date = format(parseISO(appointment.start_time), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {} as GroupedAppointments);

  // Ordenar las fechas
  const sortedDates = Object.keys(groupedAppointments).sort();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <TbCheck className="w-3 h-3 mr-1" />
            Confirmada
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <TbSquareCheck className="w-3 h-3 mr-1" />
            Completada
          </span>
        );
      case 'cancelled_by_pro':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <TbX className="w-3 h-3 mr-1" />
            Cancelada
          </span>
        );
      case 'cancelled_by_client':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <TbX className="w-3 h-3 mr-1" />
            Cancelada por cliente
          </span>
        );
      default:
        return null;
    }
  };

  const formatDayHeader = (dateString: string) => {
    const date = parseISO(dateString + 'T00:00:00');
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hoy';
    } else if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return 'Mañana';
    } else {
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    }
  };

  const getDayStats = (dayAppointments: AppointmentWithDetails[]) => {
    const totalIncome = dayAppointments
      .filter((apt) => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

    const confirmedCount = dayAppointments.filter((apt) => apt.status === 'confirmed').length;
    const completedCount = dayAppointments.filter((apt) => apt.status === 'completed').length;

    return { totalIncome, confirmedCount, completedCount };
  };

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TbCalendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No se encontraron citas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const dayAppointments = groupedAppointments[date].sort(
          (a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime(),
        );
        const { totalIncome, confirmedCount, completedCount } = getDayStats(dayAppointments);

        return (
          <Card key={date} className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                <div>
                  <CardTitle className="text-lg capitalize">{formatDayHeader(date)}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {dayAppointments.length} cita{dayAppointments.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center text-green-600">
                    <TbCheck className="w-4 h-4 mr-1" />
                    {confirmedCount} confirmadas
                  </div>
                  <div className="flex items-center text-blue-600">
                    <TbSquareCheck className="w-4 h-4 mr-1" />
                    {completedCount} completadas
                  </div>
                  {totalIncome > 0 && (
                    <div className="flex items-center text-gray-600 font-medium">
                      {formatCurrency(totalIncome)}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {dayAppointments.map((appointment, index) => {
                  const { time } = formatDateTime(appointment.start_time);
                  const appointmentDate = parseISO(appointment.start_time);
                  const now = new Date();
                  const canCancel =
                    (appointment.status === 'confirmed') &&
                    isAfter(appointmentDate, now);
                  const canComplete = appointment.status === 'confirmed' && isBefore(appointmentDate, now);

                  return (
                    <div
                      key={appointment.id}
                      className={`p-6 hover:bg-gray-50 transition-colors ${
                        index !== dayAppointments.length - 1 ? 'border-b border-gray-100' : ''
                      }`}>
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Hora */}
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-500">
                              <TbClock className="h-4 w-4 mr-1" />
                              Hora
                            </div>
                            <p className="font-medium text-lg text-gray-900">{time}</p>
                            <p className="text-xs text-gray-500">
                              {appointment.service?.duration_minutes || 0} minutos
                            </p>
                          </div>

                          {/* Cliente */}
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-500">
                              <TbUser className="h-4 w-4 mr-1" />
                              Cliente
                            </div>
                            <p className="font-medium text-gray-900">{appointment.client?.name || 'Sin nombre'}</p>
                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-gray-500">
                                <TbMail className="h-3 w-3 mr-1" />
                                {appointment.client?.email || 'Sin email'}
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <TbPhone className="h-3 w-3 mr-1" />
                                {appointment.client?.phone || 'Sin teléfono'}
                              </div>
                            </div>
                          </div>

                          {/* Servicio */}
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-500">Servicio</div>
                            <p className="font-medium text-gray-900">
                              {appointment.service?.name || 'Servicio eliminado'}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(appointment.service?.price || 0)}
                            </p>
                          </div>

                          {/* Estado */}
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-500">Estado</div>
                            {getStatusBadge(appointment.status)}
                            {appointment.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">Nota: {appointment.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-2 min-w-[220px]">
                          {canComplete && (
                            <Button
                              onClick={() => onCompleteAppointment(appointment.id)}
                              variant="default"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700">
                              <TbSquareCheck className="w-4 h-4 mr-1" />
                              Completar
                            </Button>
                          )}
                          {canCancel && (
                            <Button onClick={() => onCancelAppointment(appointment.id)} variant="destructive" size="sm">
                              <TbX className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                          <Button onClick={() => onViewDetails(appointment.id)} variant="outline" size="sm">
                            <TbEye className="w-4 h-4 mr-1" />
                            Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
