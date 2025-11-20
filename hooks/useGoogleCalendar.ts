'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getProfessionalProfile,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
} from '@/services/professionalService';

export function useGoogleCalendar() {
  const [isSynced, setIsSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const professional = await getProfessionalProfile();
      setProfessionalId(professional.id);
      setIsSynced(Boolean(professional.google_refresh_token));
    } catch (error) {
      console.error('Error loading Google Calendar status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    setSubmitting(true);
    toast.info('Redirigiendo a Google para conectar tu calendario...');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('is_connecting_google', 'true');
    }

    try {
      await connectGoogleCalendar();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Error al conectar con Google: ' + message);
      setSubmitting(false);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('is_connecting_google');
      }
    }
  };

  const handleDisconnect = async (
    confirm: (options: {
      title: string;
      description: string;
      variant?: 'default' | 'destructive' | 'warning' | 'info';
    }) => Promise<boolean>,
  ) => {
    if (!professionalId) {
      toast.error('No se pudo identificar al profesional. Intenta recargar.');
      return;
    }

    const confirmed = await confirm({
      title: 'Desconectar Google Calendar',
      description: '¿Estás seguro de que quieres desconectar tu Google Calendar? Tus citas ya no se sincronizarán.',
      variant: 'destructive',
    });

    if (!confirmed) return;

    setSubmitting(true);
    try {
      await disconnectGoogleCalendar(professionalId);
      setIsSynced(false);
      toast.success('Google Calendar desconectado exitosamente.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Error al desconectar: ' + message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isSynced,
    loading,
    submitting,
    handleConnect,
    handleDisconnect,
  };
}
