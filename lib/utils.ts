/**
 * Genera un slug a partir de un nombre o string
 * - Minúsculas
 * - Remueve acentos
 * - Solo letras, números, espacios y guiones
 * - Reemplaza espacios por guiones
 * - Remueve guiones duplicados y extremos
 * @param name string base
 * @param options { randomSuffix?: boolean } Si true, agrega un sufijo aleatorio
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones bajos con guiones
    .replace(/-+/g, '-') // Remover guiones duplicados
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}

/**
 * Genera un slug a partir de un nombre y le agrega un sufijo aleatorio
 */
export function generateSlugWithRandomSuffix(name: string): string {
  const base = generateSlugFromName(name);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${randomSuffix}`;
}
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrae la URL src de un iframe de Google Maps.
 * - Si ya es una URL embed válida, la devuelve tal como está.
 * - Si es un iframe HTML, extrae el src y decodifica entidades HTML (&amp; → &).
 */
export function extractMapUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const cleanInput = input.trim();

  console.log('[MapEmbed] URL original:', cleanInput.substring(0, 400));

  let result: string;

  if (cleanInput.includes('<iframe') && cleanInput.includes('src=')) {
    // Iframe HTML: extraer src y decodificar entidades HTML
    const srcMatch = cleanInput.match(/src="([^"]+)"/);
    if (srcMatch?.[1]) {
      result = srcMatch[1].replace(/&amp;/g, '&');
    } else {
      const srcMatchSingle = cleanInput.match(/src='([^']+)'/);
      result = srcMatchSingle?.[1]?.replace(/&amp;/g, '&') ?? cleanInput;
    }
  } else if (cleanInput.startsWith('http')) {
    // URL directa: devolver tal como está
    result = cleanInput;
  } else {
    result = cleanInput;
  }

  console.log('[MapEmbed] URL transformada:', result.substring(0, 400));

  return result;
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
