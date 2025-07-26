import { useCallback, useEffect, useState } from 'react';
import { getCurrentProfessional } from '@/lib/supabase';
import {
  getUnavailableDatesByProfessionalId,
  createUnavailableDates,
  updateUnavailableDates,
  updateUnavailableDate,
  deleteUnavailableDates,
} from '@/services/unavailableDateService';
import { UnavailableDate } from '@/types';

export function useUnavailableDates() {
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const loadUnavailableDates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) throw new Error('No professional found');
      setProfessionalId(professional.id);
      const data = await getUnavailableDatesByProfessionalId(professional.id);
      setUnavailableDates(data);
    } catch {
      setError('Error cargando días libres');
      setUnavailableDates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnavailableDates();
  }, [loadUnavailableDates]);

  const createDates = async (dates: { date: string; reason: string }[]) => {
    if (!professionalId) throw new Error('No professional found');
    const toInsert = dates.map((d) => ({ ...d, professional_id: professionalId }));
    const data = await createUnavailableDates(toInsert);
    setUnavailableDates((prev) => [...prev, ...data].sort((a, b) => a.date.localeCompare(b.date)));
    return data;
  };

  const updateDates = async (ids: string[], update: Partial<UnavailableDate>) => {
    await updateUnavailableDates(ids, update);
    setUnavailableDates((prev) => prev.map((date) => (ids.includes(date.id) ? { ...date, ...update } : date)));
  };

  const updateDate = async (id: string, update: Partial<UnavailableDate>) => {
    await updateUnavailableDate(id, update);
    setUnavailableDates((prev) => prev.map((date) => (date.id === id ? { ...date, ...update } : date)));
  };

  const deleteDates = async (ids: string[]) => {
    await deleteUnavailableDates(ids);
    setUnavailableDates((prev) => prev.filter((date) => !ids.includes(date.id)));
  };

  return {
    unavailableDates,
    loading,
    error,
    createDates,
    updateDates,
    updateDate,
    deleteDates,
    reload: loadUnavailableDates,
  };
}
