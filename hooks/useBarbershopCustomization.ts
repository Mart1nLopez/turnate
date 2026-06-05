'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  uploadBarbershopLogo,
  uploadBarbershopCover,
} from '@/services/barbershopStorageService';
import { updateBarbershop } from '@/services/barbershopService';

interface UseBarbershopCustomizationReturn {
  uploading: boolean;
  saving: boolean;
  uploadLogo: (file: File) => Promise<void>;
  uploadCover: (file: File) => Promise<void>;
}

// Hook de infraestructura para Sprint 2A.
// Gestiona subida de logo/portada al bucket barbershop-images y
// persistencia de la URL resultante en la tabla barbershops.
// Separado de useBarbershop para evitar re-renders del contexto principal.
//
// Uso:
//   const { uploading, saving, uploadLogo, uploadCover } =
//     useBarbershopCustomization(barbershop?.id);
export function useBarbershopCustomization(
  barbershopId: string | undefined,
): UseBarbershopCustomizationReturn {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadLogo = useCallback(
    async (file: File): Promise<void> => {
      if (!barbershopId) return;
      setUploading(true);
      try {
        const url = await uploadBarbershopLogo(barbershopId, file);
        setUploading(false);
        setSaving(true);
        await updateBarbershop(barbershopId, { logo_url: url });
        toast.success('Logo actualizado');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al subir el logo');
        throw err;
      } finally {
        setUploading(false);
        setSaving(false);
      }
    },
    [barbershopId],
  );

  const uploadCover = useCallback(
    async (file: File): Promise<void> => {
      if (!barbershopId) return;
      setUploading(true);
      try {
        const url = await uploadBarbershopCover(barbershopId, file);
        setUploading(false);
        setSaving(true);
        await updateBarbershop(barbershopId, { cover_image_url: url });
        toast.success('Imagen de portada actualizada');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al subir la portada');
        throw err;
      } finally {
        setUploading(false);
        setSaving(false);
      }
    },
    [barbershopId],
  );

  return { uploading, saving, uploadLogo, uploadCover };
}
