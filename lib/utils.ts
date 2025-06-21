import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrae la URL src de un iframe de Google Maps
 * Si el input ya es una URL válida, la devuelve tal como está
 * Si es un iframe completo, extrae el atributo src
 */
export function extractMapUrl(input: string): string {
  // Si el input está vacío, devolver string vacío
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Limpiar espacios en blanco
  const cleanInput = input.trim();

  // Si ya es una URL válida (comienza con http), devolverla tal como está
  if (cleanInput.startsWith('http')) {
    return cleanInput;
  }

  // Si contiene un iframe, extraer el src
  if (cleanInput.includes('<iframe') && cleanInput.includes('src=')) {
    // Buscar el atributo src usando regex
    const srcMatch = cleanInput.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }

    // Intentar con comillas simples también
    const srcMatchSingle = cleanInput.match(/src='([^']+)'/);
    if (srcMatchSingle && srcMatchSingle[1]) {
      return srcMatchSingle[1];
    }
  }

  // Si no se pudo extraer nada, devolver el input original
  return cleanInput;
}

/**
 * Formatea un número como moneda chilena (CLP)
 * @param amount - El monto a formatear
 * @returns String formateado como moneda chilena
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea una fecha y hora para mostrar en formato chileno
 * @param dateString - La fecha en formato string (ISO)
 * @returns Objeto con fecha y hora formateadas
 */
export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
