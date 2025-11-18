import { useState, useCallback } from 'react';
import { createAvailability, updateAvailability, deleteAvailability } from '@/services/availabilityService';
import { getAvailabilityByProfessionalId } from '@/services/appointmentService';
import { Availability } from '@/types';

export function useAvailability(professionalId: string) {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAvailabilityByProfessionalId(professionalId);
      setAvailability(data);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  const addAvailability = async (data: Omit<Availability, 'id' | 'created_at'>) => {
    try {
      const created = await createAvailability(data);
      setAvailability((prev) => [...prev, created].sort((a, b) => a.day_of_week - b.day_of_week));
    } catch (err) {
      throw err;
    }
  };

  const editAvailability = async (id: string, data: Partial<Availability>) => {
    try {
      const updated = await updateAvailability(id, data);
      setAvailability((prev) => prev.map((av) => (av.id === id ? updated : av)));
    } catch (err) {
      throw err;
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const av = availability.find((a) => a.id === id);
      if (!av) return;
      await updateAvailability(id, { is_available: !av.is_available });
      setAvailability((prev) => prev.map((a) => (a.id === id ? { ...a, is_available: !a.is_available } : a)));
    } catch (err) {
      throw err;
    }
  };

  const removeAvailability = async (id: string) => {
    try {
      await deleteAvailability(id);
      setAvailability((prev) => prev.filter((av) => av.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    availability,
    loading,
    loadAvailability,
    addAvailability,
    editAvailability,
    removeAvailability,
    toggleAvailability,
    setAvailability,
  };
}
