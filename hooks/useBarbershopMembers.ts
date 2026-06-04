'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getMembersByBarbershopId,
  updateMemberRole,
  deactivateMember as deactivateMemberService,
} from '@/services/barbershopMemberService';
import { BarbershopMember, BarbershopMemberRole } from '@/types';

interface UseBarbershopMembersReturn {
  members: BarbershopMember[];
  loading: boolean;
  refresh: () => Promise<void>;
  updateRole: (memberId: string, role: BarbershopMemberRole) => Promise<void>;
  deactivateMember: (memberId: string) => Promise<void>;
}

// Carga y gestiona los miembros activos de una barbería.
// barbershopId undefined → el hook permanece inactivo (sin queries) hasta que se provea.
export function useBarbershopMembers(
  barbershopId: string | undefined,
): UseBarbershopMembersReturn {
  const [members, setMembers] = useState<BarbershopMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!barbershopId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getMembersByBarbershopId(barbershopId);
      setMembers(data);
    } catch (err) {
      console.error('[useBarbershopMembers] Error cargando miembros:', err);
      toast.error('Error al cargar los miembros de la barbería');
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const updateRole = useCallback(
    async (memberId: string, role: BarbershopMemberRole) => {
      await updateMemberRole(memberId, role);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
      );
      toast.success('Rol actualizado');
    },
    [],
  );

  const deactivateMember = useCallback(async (memberId: string) => {
    await deactivateMemberService(memberId);
    // Remover de la lista local — el índice parcial garantiza que ya no tiene membresía activa
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success('Miembro eliminado de la barbería');
  }, []);

  return { members, loading, refresh: load, updateRole, deactivateMember };
}
