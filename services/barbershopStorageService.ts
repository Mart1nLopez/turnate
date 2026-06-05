import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

const BUCKET = 'barbershop-images';

interface CompressionConfig {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  quality: number;
}

// Comprime y sube una imagen al bucket barbershop-images.
// Path: {barbershopId}/{folder}/{uuid}.webp
// RLS verifica que auth.uid() == barbershops.owner_id para el barbershopId dado.
async function compressAndUpload(
  barbershopId: string,
  folder: 'logo' | 'cover',
  file: File,
  config: CompressionConfig,
): Promise<string> {
  const compressionOptions = {
    maxSizeMB: config.maxSizeMB,
    maxWidthOrHeight: config.maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: config.quality,
    fileType: 'image/webp',
  };
  const compressed = await imageCompression(file, compressionOptions);

  const path = `${barbershopId}/${folder}/${uuidv4()}.webp`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`Error subiendo imagen: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

// Sube el logo de la barbería (256×256, 0.5 MB máx, webp).
export async function uploadBarbershopLogo(barbershopId: string, file: File): Promise<string> {
  return compressAndUpload(barbershopId, 'logo', file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 256,
    quality: 0.85,
  });
}

// Sube la imagen de portada (1920px ancho máx, 2 MB, webp).
export async function uploadBarbershopCover(barbershopId: string, file: File): Promise<string> {
  return compressAndUpload(barbershopId, 'cover', file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    quality: 0.85,
  });
}

// Elimina una imagen del bucket por su URL pública.
// No lanza error si el archivo ya no existe (operación idempotente).
export async function deleteBarbershopImage(url: string): Promise<void> {
  if (!url || !url.includes('supabase.co')) return;

  const match = url.match(/\/public\/barbershop-images\/(.+)$/);
  if (!match) {
    console.error('[barbershopStorageService] No se pudo extraer el path de:', url);
    return;
  }

  const { error } = await supabase.storage.from(BUCKET).remove([match[1]]);
  if (error) {
    console.error(`[barbershopStorageService] Error al eliminar imagen: ${error.message}`);
  }
}
