import { supabase } from './supabase';

export class StorageService {
  private static readonly BUCKET_NAME = 'profile-images';

  // Subir una imagen al bucket de Supabase Storage
  static async uploadImage(file: File, path: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Validar el archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y WebP.',
        };
      }

      // Validar el tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'El archivo es demasiado grande. Máximo 5MB permitido.',
        };
      }

      // Crear un nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      // Subir el archivo
      const { data, error } = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
      }

      // Obtener la URL pública
      const { data: publicUrl } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(data.path);

      return {
        success: true,
        url: publicUrl.publicUrl,
      };
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // Subir múltiples imágenes
  static async uploadMultipleImages(
    files: File[],
    path: string,
  ): Promise<{ success: boolean; urls?: string[]; errors?: string[] }> {
    try {
      const results = await Promise.allSettled(files.map((file) => this.uploadImage(file, path)));

      const urls: string[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          urls.push(result.value.url!);
        } else {
          const error = result.status === 'fulfilled' ? result.value.error : 'Error desconocido';
          errors.push(`Archivo ${index + 1}: ${error}`);
        }
      });

      return {
        success: urls.length > 0,
        urls: urls.length > 0 ? urls : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error in uploadMultipleImages:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      };
    }
  }

  // Eliminar una imagen
  static async deleteImage(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extraer el path del archivo de la URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex((part) => part === this.BUCKET_NAME);

      if (bucketIndex === -1) {
        return { success: false, error: 'URL inválida' };
      }

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // Eliminar múltiples imágenes
  static async deleteMultipleImages(urls: string[]): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const results = await Promise.allSettled(urls.map((url) => this.deleteImage(url)));

      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value.success) {
          errors.push(`Imagen ${index + 1}: ${result.value.error}`);
        } else if (result.status === 'rejected') {
          errors.push(`Imagen ${index + 1}: Error desconocido`);
        }
      });

      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error in deleteMultipleImages:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      };
    }
  }

  // Obtener la URL pública de un archivo
  static getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(path);

    return data.publicUrl;
  }

  // Validar si una imagen existe
  static async imageExists(path: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(path.substring(0, path.lastIndexOf('/')));

      if (error) return false;

      const fileName = path.substring(path.lastIndexOf('/') + 1);
      return data.some((file) => file.name === fileName);
    } catch (error) {
      console.error('Error checking if image exists:', error);
      return false;
    }
  }
}

// Tipos para el manejo de archivos
export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface MultipleImageUploadResult {
  success: boolean;
  urls?: string[];
  errors?: string[];
}

// Helper para validar archivos de imagen
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y WebP.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'El archivo es demasiado grande. Máximo 5MB permitido.',
    };
  }

  return { valid: true };
};

// Helper para crear preview de imagen
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('No se pudo leer el archivo'));
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsDataURL(file);
  });
};
