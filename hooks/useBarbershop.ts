'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getCurrentProfessional } from '@/lib/supabase';
import { getActiveMembershipWithBarbershop } from '@/services/barbershopMemberService';
import { updateBarbershop as updateBarbershopService } from '@/services/barbershopService';
import { Barbershop, BarbershopMember, BarbershopMemberRole, Professional } from '@/types';

interface UseBarbershopReturn {
  professional: Professional | null;
  barbershop: Barbershop | null;
  membership: BarbershopMember | null;
  isOwner: boolean;
  isAdmin: boolean;
  /** true when role is 'owner' OR 'admin' — can edit info, appearance, invite, view analytics */
  canManage: boolean;
  isMember: boolean;
  role: BarbershopMemberRole | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateBarbershop: (
    data: Partial<Omit<Barbershop, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>,
  ) => Promise<void>;
}

// Hook auto-contenido: carga el professional autenticado y luego su barbería activa
// en un solo round-trip via getActiveMembershipWithBarbershop.
// Devuelve null en barbershop/membership si el professional no pertenece a ninguna barbería.
export function useBarbershop(): UseBarbershopReturn {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [barbershop, setBarbershop]     = useState<Barbershop | null>(null);
  const [membership, setMembership]     = useState<BarbershopMember | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { professional: prof, error: profError } = await getCurrentProfessional();
      if (profError || !prof) {
        setProfessional(null);
        setBarbershop(null);
        setMembership(null);
        return;
      }

      // Guardamos el professional para que la página pueda usarlo
      // al crear una barbería sin una segunda query
      setProfessional(prof);

      const result = await getActiveMembershipWithBarbershop(prof.id);
      if (result) {
        setBarbershop(result.barbershop);
        setMembership(result.membership);
      } else {
        setBarbershop(null);
        setMembership(null);
      }
    } catch (err) {
      console.error('[useBarbershop] Error cargando barbería:', err);
      setError('Error al cargar los datos de la barbería');
      toast.error('Error al cargar los datos de la barbería');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateBarbershop = useCallback(
    async (
      data: Partial<Omit<Barbershop, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>,
    ) => {
      if (!barbershop) throw new Error('No hay barbería activa');
      await updateBarbershopService(barbershop.id, data);
      setBarbershop((prev) => (prev ? { ...prev, ...data } : null));
    },
    [barbershop],
  );

  const isOwner   = membership?.role === 'owner';
  const isAdmin   = membership?.role === 'admin';
  const canManage = isOwner || isAdmin;
  const isMember  = membership !== null;
  const role      = membership?.role ?? null;

  return {
    professional,
    barbershop,
    membership,
    isOwner,
    isAdmin,
    canManage,
    isMember,
    role,
    loading,
    error,
    refresh: load,
    updateBarbershop,
  };
}
