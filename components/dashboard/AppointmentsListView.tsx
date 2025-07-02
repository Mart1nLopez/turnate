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
  TbLoader,
  TbCurrencyDollar,
} from 'react-icons/tb';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Appointment, Service, Client } from '@/types';
import { parseISO, isAfter, isBefore } from 'date-fns';

type AppointmentWithDetails = Appointment & {
  service?: Service;
  client?: Client;
};

interface AppointmentsListViewProps {
  appointments: AppointmentWithDetails[];
  onViewDetails: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onCompleteAppointment: (appointmentId: string) => void;
}

export default function AppointmentsListView({
  appointments,
  onViewDetails,
  onCancelAppointment,
  onCompleteAppointment,
}: AppointmentsListViewProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <TbLoader className="w-3 h-3 mr-1" />
            Pendiente
          </span>
        );
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

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TbCalendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No se encontraron citas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => {
        const { date, time } = formatDateTime(appointment.start_time);
        const canCancel =
          (appointment.status === 'confirmed' || appointment.status === 'pending') &&
          isAfter(parseISO(appointment.start_time), new Date());
        const canComplete =
          appointment.status === 'confirmed' && isBefore(parseISO(appointment.start_time), new Date());

        return (
          <div key={appointment.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Fecha y Hora */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <TbCalendar className="h-4 w-4 mr-1" />
                    Fecha y Hora
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{date}</p>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <TbClock className="h-3 w-3 mr-1" />
                      {time}
                    </div>
                  </div>
                </div>

                {/* Cliente */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <TbUser className="h-4 w-4 mr-1" />
                    Cliente
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.client?.name || 'Sin nombre'}</p>
                    <div className="space-y-1 mt-1">
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
                </div>

                {/* Servicio */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">Servicio</div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.service?.name || 'Servicio eliminado'}</p>
                    <p className="text-xs text-gray-500 mt-1">{appointment.service?.duration_minutes || 0} minutos</p>
                  </div>
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">Estado</div>
                  <div>
                    {getStatusBadge(appointment.status)}
                    {appointment.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">Nota: {appointment.notes}</p>
                    )}
                  </div>
                </div>

                {/* Precio */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <TbCurrencyDollar className="h-4 w-4 mr-1" />
                    Precio
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(appointment.service?.price || 0)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 min-w-max">
                <Button
                  onClick={() => onViewDetails(appointment.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none">
                  <TbEye className="w-4 h-4 mr-1" />
                  Detalles
                </Button>
                {canComplete && (
                  <Button
                    onClick={() => onCompleteAppointment(appointment.id)}
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
                    <TbSquareCheck className="w-4 h-4 mr-1" />
                    Completar
                  </Button>
                )}
                {canCancel && (
                  <Button
                    onClick={() => onCancelAppointment(appointment.id)}
                    variant="destructive"
                    size="sm"
                    className="flex-1 sm:flex-none">
                    <TbX className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
