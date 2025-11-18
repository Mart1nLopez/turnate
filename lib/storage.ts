import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

export interface UploadImageOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

// Función auxiliar para eliminar imágenes de Supabase Storage
export async function deleteImageFromStorage(imageUrl: string) {
  try {
    console.log('Eliminando imagen:', imageUrl);

    if (!imageUrl || !imageUrl.includes('supabase.co')) {
      console.log('URL no válida para eliminar, saltando...');
      return;
    }

    // Extraer el path correcto de la URL
    const regex = /\/public\/professional-images\/(.+)$/;
    const match = imageUrl.match(regex);
    const path = match ? match[1] : null;

    if (path) {
      console.log('Path extraído para eliminación:', path);
      const { error: storageError } = await supabase.storage.from('professional-images').remove([path]);

      if (storageError) {
        console.error(`Error al eliminar imagen: ${storageError.message}`);
      } else {
        console.log('Imagen eliminada exitosamente');
      }
    } else {
      console.error('No se pudo extraer el path de la URL:', imageUrl);
    }
  } catch (error) {
    const err = error as Error;
    console.error(`Error al eliminar imagen: ${err.message}`);
  }
}

// Función auxiliar para procesar y subir imagen
export async function processAndUploadImage(
  imageFile: File,
  options: UploadImageOptions = {},
  subfolder: string = 'carrusel',
): Promise<string> {
  try {
    console.log('Iniciando processAndUploadImage...');
    console.log('Archivo:', imageFile.name, 'Tamaño:', imageFile.size, 'Subcarpeta:', subfolder);

    // Obtener el usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Error de autenticación:', authError);
      throw new Error('Usuario no autenticado');
    }
    console.log('Usuario autenticado:', user.id);

    const compressionOptions = {
      maxSizeMB: options.maxSizeMB || 1,
      maxWidthOrHeight: options.maxWidthOrHeight || 1024,
      useWebWorker: true,
      quality: options.quality || 0.85,
      fileType: 'image/webp', // Forzar conversión a WebP
    };

    console.log('Comprimiendo imagen con opciones:', compressionOptions);
    const compressedFile = await imageCompression(imageFile, compressionOptions);
    console.log('Imagen comprimida. Tamaño original:', imageFile.size, 'Tamaño comprimido:', compressedFile.size);

    // Guardar siempre como .webp
    const fileName = `${uuidv4()}.webp`;
    const filePath = `${user.id}/${subfolder}/${fileName}`;

    console.log('Subiendo archivo a path:', filePath);

    const { error: uploadError } = await supabase.storage.from('professional-images').upload(filePath, compressedFile);

    if (uploadError) {
      console.error('Error al subir imagen:', uploadError);
      throw uploadError;
    }

    console.log('Imagen subida exitosamente');
    const {
      data: { publicUrl },
    } = supabase.storage.from('professional-images').getPublicUrl(filePath);

    console.log('URL pública generada:', publicUrl);
    return publicUrl;
  } catch (error) {
    const err = error as Error;
    console.error('Error en processAndUploadImage:', err.message);
    throw new Error(`Error al procesar y subir la imagen: ${err.message}`);
  }
}

// Función para subir imagen al storage de Supabase
export async function uploadImage(file: File, folderPath: string, options: UploadImageOptions = {}): Promise<string> {
  try {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Validar tamaño máximo (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('La imagen es demasiado grande. Máximo 10MB');
    }

    // Comprimir imagen usando imageCompression directamente
    const compressionOptions = {
      maxSizeMB: options.maxSizeMB || 2.0, // Aumentado para mejor calidad por defecto
      maxWidthOrHeight: options.maxWidthOrHeight || 2048, // Aumentado para mejor resolución por defecto
      useWebWorker: true,
      quality: options.quality || 0.9, // Calidad alta del 90% por defecto
    };

    const compressedFile = await imageCompression(file, compressionOptions);

    // Generar nombre único
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${folderPath}/${fileName}`;

    // Subir archivo
    const { error: uploadError } = await supabase.storage.from('professional-images').upload(filePath, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('professional-images').getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Función para eliminar imagen del storage
export async function deleteImage(imageUrl: string): Promise<void> {
  await deleteImageFromStorage(imageUrl);
}

// Función para subir múltiples imágenes del carrusel
export async function uploadCarouselImages(files: File[]): Promise<string[]> {
  console.log('Subiendo imágenes de carrusel:', files.length, 'archivos');

  // Opciones específicas para imágenes de carrusel - optimizadas para pantalla completa
  // Configuración premium para imágenes que se mostrarán a gran tamaño
  const carouselOptions: UploadImageOptions = {
    maxSizeMB: 3.0,
    maxWidthOrHeight: 2560, // Resolución 2K
    quality: 0.95,
  };

  const uploadPromises = files.map((file) => processAndUploadImage(file, carouselOptions, 'carrusel'));

  try {
    const urls = await Promise.all(uploadPromises);
    console.log('Todas las imágenes de carrusel subidas exitosamente');
    return urls;
  } catch (error) {
    console.error('Error uploading carousel images:', error);
    throw new Error('Error al subir las imágenes del carrusel');
  }
}

// Función para subir múltiples imágenes (genérica)
export async function uploadMultipleImages(files: File[], options: UploadImageOptions = {}): Promise<string[]> {
  console.log('Subiendo múltiples imágenes:', files.length, 'archivos');

  const uploadPromises = files.map((file) => processAndUploadImage(file, options));

  try {
    const urls = await Promise.all(uploadPromises);
    console.log('Todas las imágenes subidas exitosamente');
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error('Error al subir las imágenes');
  }
}

// Función para eliminar múltiples imágenes
export async function deleteMultipleImages(imageUrls: string[]): Promise<void> {
  console.log('Eliminando múltiples imágenes:', imageUrls.length, 'archivos');

  const deletePromises = imageUrls.map((url) => deleteImageFromStorage(url));

  try {
    await Promise.all(deletePromises);
    console.log('Todas las imágenes eliminadas exitosamente');
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    // No lanzamos el error para no interrumpir el flujo principal
  }
}

// Función para subir imagen de servicio
export async function uploadServiceImage(file: File): Promise<string> {
  console.log('🔧 Subiendo imagen de servicio:', file.name);

  // Opciones específicas para imágenes de servicios
  const serviceOptions: UploadImageOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 800,
    quality: 0.9,
  };

  try {
    const url = await processAndUploadImage(file, serviceOptions, 'servicios');
    console.log('Imagen de servicio subida exitosamente');
    return url;
  } catch (error) {
    console.error('Error uploading service image:', error);
    throw new Error('Error al subir la imagen del servicio');
  }
}

// Función para subir imagen de perfil de profesional
export async function uploadProfileImage(file: File): Promise<string> {
  console.log('Subiendo imagen de perfil:', file.name);

  // Opciones específicas para imágenes de perfil
  const profileOptions: UploadImageOptions = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 512,
    quality: 0.85,
  };

  try {
    const url = await processAndUploadImage(file, profileOptions, 'perfil');
    console.log('Imagen de perfil subida exitosamente');
    return url;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Error al subir la imagen del perfil');
  }
}
