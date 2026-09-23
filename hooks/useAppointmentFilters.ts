import { useState, useCallback, useMemo, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Appointment, Service, Client } from '@/types';
import { parseISO, startOfDay, addDays, isSameDay, isWithinInterval, getHours, endOfDay } from 'date-fns';

type AppointmentWithDetails = Appointment & {
  service?: Service;
  client?: Client;
};

export interface AdvancedFilters {
  search: string;
  status: 'all' | 'confirmed' | 'completed' | 'cancelled_by_pro' | 'cancelled_by_client';
  dateRange: 'next_30_days' | 'today' | 'tomorrow' | 'custom';
  customDateFrom: string;
  customDateTo: string;
  timeOfDay: 'all' | 'morning' | 'afternoon' | 'evening';
  serviceId: string;
  minPrice: string;
  maxPrice: string;
  minDuration: string;
  maxDuration: string;
}

export const defaultAppointmentFilters: AdvancedFilters = {
  search: '',
  status: 'all',
  dateRange: 'today',
  customDateFrom: '',
  customDateTo: '',
  timeOfDay: 'all',
  serviceId: '',
  minPrice: '',
  maxPrice: '',
  minDuration: '',
  maxDuration: '',
};

const DATE_RANGE_VALUES: AdvancedFilters['dateRange'][] = ['next_30_days', 'today', 'tomorrow', 'custom'];

function getFiltersStorageKey(professionalId: string): string {
  return `turnate:citas:filters:${professionalId}`;
}

// Último filtro guardado por el barbero (persistente entre sesiones).
// Si nunca guardó uno, devuelve null: la vista inicial pasa a ser las "10 próximas citas".
export function getSavedAppointmentFilters(professionalId: string): AdvancedFilters | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getFiltersStorageKey(professionalId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !DATE_RANGE_VALUES.includes(parsed.dateRange)) return null;
    return { ...defaultAppointmentFilters, ...parsed };
  } catch (error) {
    console.error('Error leyendo el filtro guardado de citas:', error);
    return null;
  }
}

function saveAppointmentFilters(professionalId: string, filters: AdvancedFilters): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getFiltersStorageKey(professionalId), JSON.stringify(filters));
  } catch (error) {
    console.error('Error guardando el filtro de citas:', error);
  }
}

export function useAppointmentFilters(appointments: AppointmentWithDetails[], professionalId?: string | null) {
  const [filters, setFiltersState] = useState<AdvancedFilters>(defaultAppointmentFilters);
  const [hasStoredFilter, setHasStoredFilter] = useState(false);

  // Al conocer al profesional, hidratar con su último filtro guardado (si existe)
  useEffect(() => {
    if (!professionalId) return;
    const saved = getSavedAppointmentFilters(professionalId);
    if (saved) {
      setFiltersState(saved);
      setHasStoredFilter(true);
    }
  }, [professionalId]);

  // Cualquier cambio explícito de filtro (desde Filtros Avanzados o clearFilters)
  // se persiste como el último filtro usado por este barbero
  const setFilters = useCallback<Dispatch<SetStateAction<AdvancedFilters>>>(
    (value) => {
      setFiltersState((prev) => {
        const next =
          typeof value === 'function' ? (value as (prev: AdvancedFilters) => AdvancedFilters)(prev) : value;
        if (professionalId) {
          saveAppointmentFilters(professionalId, next);
        }
        setHasStoredFilter(true);
        return next;
      });
    },
    [professionalId],
  );

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Filtro por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (appointment) =>
          appointment.client?.name?.toLowerCase().includes(searchLower) ||
          appointment.client?.email?.toLowerCase().includes(searchLower) ||
          appointment.client?.phone?.includes(filters.search) ||
          appointment.service?.name?.toLowerCase().includes(searchLower),
      );
    }

    // Filtro por estado
    if (filters.status !== 'all') {
      filtered = filtered.filter((appointment) => appointment.status === filters.status);
    }

    // Filtro por servicio
    if (filters.serviceId) {
      filtered = filtered.filter((appointment) => appointment.service_id === filters.serviceId);
    }

    // Filtro por precio
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter((appointment) => {
        const price = appointment.service?.price || 0;
        const min = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const max = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Filtro por duración
    if (filters.minDuration || filters.maxDuration) {
      filtered = filtered.filter((appointment) => {
        const duration = appointment.service?.duration_minutes || 0;
        const min = filters.minDuration ? parseInt(filters.minDuration) : 0;
        const max = filters.maxDuration ? parseInt(filters.maxDuration) : Infinity;
        return duration >= min && duration <= max;
      });
    }

    // Filtro por fecha
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);

    // Sin filtro guardado, `appointments` ya es la vista especial de "10 próximas citas"
    // (futuras, ordenadas ascendentemente): no se le vuelve a aplicar un rango de fecha.
    if (hasStoredFilter && filters.dateRange !== 'next_30_days') {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = parseISO(appointment.start_time);

        switch (filters.dateRange) {
          case 'today':
            return isSameDay(appointmentDate, today);
          case 'tomorrow':
            return isSameDay(appointmentDate, tomorrow);
          case 'custom':
            if (filters.customDateFrom && filters.customDateTo) {
              const fromDate = startOfDay(parseISO(filters.customDateFrom));
              const toDate = endOfDay(parseISO(filters.customDateTo));
              return isWithinInterval(appointmentDate, { start: fromDate, end: toDate });
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Filtro por horario del día
    if (filters.timeOfDay !== 'all') {
      filtered = filtered.filter((appointment) => {
        const hour = getHours(parseISO(appointment.start_time));
        switch (filters.timeOfDay) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 18;
          case 'evening':
            return hour >= 18 && hour <= 23;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [appointments, filters, hasStoredFilter]);

  const clearFilters = useCallback(() => {
    setFilters(defaultAppointmentFilters);
  }, [setFilters]);

  const updateFilter = useCallback(
    (key: keyof AdvancedFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setFilters],
  );

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.dateRange !== 'today') count++;
    if (filters.timeOfDay !== 'all') count++;
    if (filters.serviceId) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minDuration || filters.maxDuration) count++;
    return count;
  }, [filters]);

  const getFilterDescription = useCallback(() => {
    if (!hasStoredFilter) {
      return 'Próximas 10 citas';
    }

    const parts: string[] = [];

    // Descripción del rango de fecha
    switch (filters.dateRange) {
      case 'today':
        parts.push('Hoy');
        break;
      case 'tomorrow':
        parts.push('Mañana');
        break;
      case 'next_30_days':
        parts.push('Próximos 30 días');
        break;
      case 'custom':
        if (filters.customDateFrom && filters.customDateTo) {
          parts.push(`${filters.customDateFrom} - ${filters.customDateTo}`);
        } else if (filters.customDateFrom) {
          parts.push(`Desde ${filters.customDateFrom}`);
        } else if (filters.customDateTo) {
          parts.push(`Hasta ${filters.customDateTo}`);
        }
        break;
    }

    // Estado
    if (filters.status !== 'all') {
      const statusLabels = {
        confirmed: 'confirmadas',
        completed: 'completadas',
        cancelled_by_pro: 'canceladas por ti',
        cancelled_by_client: 'canceladas por cliente',
      };
      parts.push(`solo ${statusLabels[filters.status as keyof typeof statusLabels]}`);
    }

    // Momento del día
    if (filters.timeOfDay !== 'all') {
      const timeLabels = {
        morning: 'mañana',
        afternoon: 'tarde',
        evening: 'noche',
      };
      parts.push(`en la ${timeLabels[filters.timeOfDay as keyof typeof timeLabels]}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Período seleccionado';
  }, [filters, hasStoredFilter]);

  return {
    filters,
    filteredAppointments,
    setFilters,
    clearFilters,
    updateFilter,
    getActiveFiltersCount,
    getFilterDescription,
    hasStoredFilter,
  };
}
