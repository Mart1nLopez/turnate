import { format, addMinutes, isBefore, isAfter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Availability, Appointment, UnavailableDate } from '@/types';

export interface TimeSlot {
  time: string; // HH:MM format
  datetime: Date;
  available: boolean;
}

export const generateTimeSlots = (
  date: Date,
  availability: Availability,
  existingAppointments: Appointment[],
  serviceDuration: number,
  unavailableDates: UnavailableDate[] = [],
): TimeSlot[] => {
  const slots: TimeSlot[] = [];

  const dayOfWeek = date.getDay(); // 0 = domingo, 1 = lunes, etc.

  // Verificar si hay disponibilidad para este día
  if (availability.day_of_week !== dayOfWeek) {
    return slots;
  }

  // Verificar si este día está marcado como no disponible
  const dateString = format(date, 'yyyy-MM-dd');
  const isUnavailable = unavailableDates.some((ud) => ud.date === dateString);
  if (isUnavailable) {
    return slots;
  }

  // Determinar qué bloques de tiempo usar
  let timeBlocks: { start_time: string; end_time: string }[] = [];

  if (availability.time_blocks && availability.time_blocks.length > 0) {
    // Usar los nuevos bloques de tiempo
    timeBlocks = availability.time_blocks;
  } else if (availability.start_time && availability.end_time) {
    // Fallback para datos antiguos
    timeBlocks = [{ start_time: availability.start_time, end_time: availability.end_time }];
  } else {
    return slots;
  }

  // Generar slots para cada bloque de tiempo
  timeBlocks.forEach((block) => {
    const [startHour, startMinute] = block.start_time.split(':').map(Number);
    const [endHour, endMinute] = block.end_time.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Generar slots basados en la duración del servicio + tiempo de descanso
    while (isBefore(currentTime, endTime)) {
      const slotEndTime = addMinutes(currentTime, serviceDuration);

      // Verificar si el slot completo cabe antes del fin del bloque
      if (isAfter(slotEndTime, endTime)) {
        break;
      }

      // Verificar si hay conflicto con citas existentes
      const hasConflict = existingAppointments.some((appointment) => {
        const appointmentStart = parseISO(appointment.start_time);
        const appointmentEnd = parseISO(appointment.end_time);

        return (
          (isBefore(currentTime, appointmentEnd) && isAfter(slotEndTime, appointmentStart)) ||
          currentTime.getTime() === appointmentStart.getTime()
        );
      });

      // Verificar anticipación mínima
      const now = new Date();
      const minimumAdvanceTime = addMinutes(now, availability.advance_hours * 60);
      const isInAdvance = isAfter(currentTime, minimumAdvanceTime);

      slots.push({
        time: format(currentTime, 'HH:mm'),
        datetime: new Date(currentTime),
        available: !hasConflict && isInAdvance,
      });

      // Avanzar por el tiempo del servicio + pausa
      currentTime = addMinutes(currentTime, serviceDuration + availability.break_minutes);
    }
  });

  // Ordenar slots por tiempo
  return slots.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
};

export const formatDate = (date: Date) => {
  return format(date, 'dd/MM/yyyy', { locale: es });
};

export const formatTime = (date: Date) => {
  return format(date, 'HH:mm');
};

export const getDayName = (dayOfWeek: number): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayOfWeek];
};