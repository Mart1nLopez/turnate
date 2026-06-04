'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getPendingInvitations,
  sendInvitation as sendInvitationService,
  cancelInvitation as cancelInvitationService,
} from '@/services/barbershopInvitationService';
import { BarbershopInvitation, BarbershopMemberRole } from '@/types';

interface UseBarbershopInvitationsReturn {
  invitations: BarbershopInvitation[];
  loading: boolean;
  sending: boolean;
  refresh: () => Promise<void>;
  sendInvitation: (email: string, role: BarbershopMemberRole) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
}

// Carga y gestiona las invitaciones pendientes de una barbería.
// barbershopId undefined → el hook permanece inactivo hasta que se provea.
export function useBarbershopInvitations(
  barbershopId: string | undefined,
): UseBarbershopInvitationsReturn {
  const [invitations, setInvitations] = useState<BarbershopInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!barbershopId) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getPendingInvitations(barbershopId);
      setInvitations(data);
    } catch (err) {
      console.error('[useBarbershopInvitations] Error cargando invitaciones:', err);
      toast.error('Error al cargar las invitaciones');
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const sendInvitation = useCallback(
    async (email: string, role: BarbershopMemberRole) => {
      if (!barbershopId) throw new Error('No hay barbería activa');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Ingresa un email válido');
        return;
      }

      setSending(true);
      try {
        const invitation = await sendInvitationService(barbershopId, email, role);
        setInvitations((prev) => [invitation, ...prev]);
        toast.success(`Invitación enviada a ${email}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al enviar la invitación';
        toast.error(message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [barbershopId],
  );

  const cancelInvitation = useCallback(async (invitationId: string) => {
    await cancelInvitationService(invitationId);
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    toast.success('Invitación cancelada');
  }, []);

  return { invitations, loading, sending, refresh: load, sendInvitation, cancelInvitation };
}
